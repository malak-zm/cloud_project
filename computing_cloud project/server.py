import json
import os
import re
import secrets
import hmac
import http.cookies
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
STATIC_ROOT = ROOT / "static"
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8000"))
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@127.0.0.1:5432/umbb_university",
)
SESSION_COOKIE = "faculty_admin_session"

try:
    import psycopg
except ImportError:
    psycopg = None


class RequestError(Exception):
    def __init__(self, status, message):
        self.status = status
        self.message = message


class MemoryStore:
    def __init__(self):
        self.announcements = [
            {"id": 1, "title": "Rentrée universitaire", "body": "La rentrée universitaire aura lieu le 21 septembre 2026.", "date": "2026-09-21", "department_id": None, "category": "general"},
            {"id": 2, "title": "Examen de programmation", "body": "Les examens de programmation commenceront le 6 janvier.", "date": "2026-01-06", "department_id": 1, "category": "department"},
            {"id": 3, "title": "Conférence en mathématiques", "body": "Une conférence scientifique sera organisée le 5 décembre.", "date": "2026-12-05", "department_id": 2, "category": "department"},
        ]
        self.departments = [
            {"id": 1, "name": "Informatique", "description": "Programmation, développement logiciel, bases de données et systèmes informatiques."},
            {"id": 2, "name": "Mathématiques", "description": "Mathématiques fondamentales, mathématiques appliquées et statistiques."},
            {"id": 3, "name": "Génie électrique", "description": "Électronique, systèmes électriques et automatisation."},
            {"id": 4, "name": "Génie mécanique", "description": "Mécanique, conception et fabrication industrielle."},
            {"id": 5, "name": "Génie civil", "description": "Construction, structures et travaux publics."},
            {"id": 6, "name": "Sciences économiques", "description": "Économie, gestion et commerce."},
        ]
        self.next_announcement_id = 4
        self.next_department_id = 7


memory_store = MemoryStore()
data_lock = threading.RLock()
database_available = False
admin_sessions = {}
memory_admin = {"id": 1, "username": "admin", "password": "admin"}


def database():
    if psycopg is None:
        raise RequestError(503, "The PostgreSQL Python driver is not installed.")
    try:
        connection = psycopg.connect(DATABASE_URL)
        connection.autocommit = True
        return connection
    except psycopg.Error as error:
        raise RequestError(503, "Database unavailable: %s" % error)


class FacultyHandler(BaseHTTPRequestHandler):
    server_version = "FacultyPortal/2.0"

    def log_message(self, format_string, *args):
        print("%s - %s" % (self.address_string(), format_string % args))

    def send_json(self, status, value, headers=None):
        body = json.dumps(value, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        if headers:
            for key, header_value in headers.items():
                self.send_header(key, header_value)
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise RequestError(400, "Invalid request body.")
        if length < 0 or length > 1_000_000:
            raise RequestError(413, "Request body is too large.")
        try:
            value = json.loads(self.rfile.read(length) or b"{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise RequestError(400, "Request body must be valid JSON.")
        if not isinstance(value, dict):
            raise RequestError(400, "Request body must be a JSON object.")
        return value

    def current_admin(self):
        cookie = http.cookies.SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
        except http.cookies.CookieError:
            return None
        morsel = cookie.get(SESSION_COOKIE)
        if not morsel:
            return None
        admin_id = admin_sessions.get(morsel.value)
        if admin_id is None:
            return None
        if database_available:
            with database() as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT id_admin, username FROM administrators WHERE id_admin=%s",
                        (admin_id,),
                    )
                    row = cursor.fetchone()
            if row:
                return {"id": row[0], "username": row[1]}
        elif admin_id == memory_admin["id"]:
            return {"id": memory_admin["id"], "username": memory_admin["username"]}
        return None

    def require_admin(self):
        admin = self.current_admin()
        if admin is None:
            raise RequestError(401, "Admin sign-in required.")
        return admin

    def session_cookie(self, token, max_age=28800):
        return "%s=%s; Path=/; HttpOnly; SameSite=Strict; Max-Age=%s" % (
            SESSION_COOKIE,
            token,
            max_age,
        )

    def check_origin(self):
        origin = self.headers.get("Origin")
        if origin and urlparse(origin).netloc != self.headers.get("Host"):
            raise RequestError(403, "Cross-origin requests are not allowed.")

    def do_GET(self):
        path = urlparse(self.path).path
        if path.startswith("/api/"):
            self.handle_api("GET", path)
        else:
            self.serve_static(path)

    def do_POST(self):
        self.handle_api("POST", urlparse(self.path).path)

    def do_PUT(self):
        self.handle_api("PUT", urlparse(self.path).path)

    def do_DELETE(self):
        self.handle_api("DELETE", urlparse(self.path).path)

    def handle_api(self, method, path):
        try:
            if not path.startswith("/api/"):
                raise RequestError(404, "API route not found.")
            if method in ("POST", "PUT", "DELETE"):
                self.check_origin()

            if path == "/api/status" and method == "GET":
                self.send_json(200, {"database": "postgresql" if database_available else "memory"})
                return

            if path == "/api/me" and method == "GET":
                admin = self.current_admin()
                if admin is None:
                    raise RequestError(401, "Not signed in.")
                self.send_json(200, {"admin": admin})
                return

            if path == "/api/login" and method == "POST":
                body = self.read_json()
                username = str(body.get("username", "")).strip()
                password = str(body.get("password", "")).strip()
                admin_id = None
                if database_available:
                    with database() as connection:
                        with connection.cursor() as cursor:
                            cursor.execute(
                                "SELECT id_admin, username, user_password FROM administrators "
                                "WHERE username=%s",
                                (username,),
                            )
                            row = cursor.fetchone()
                    if row and hmac.compare_digest(str(row[2]), password):
                        admin_id = row[0]
                elif hmac.compare_digest(username, memory_admin["username"]) and hmac.compare_digest(
                    password, memory_admin["password"]
                ):
                    admin_id = memory_admin["id"]
                if admin_id is None:
                    raise RequestError(401, "Username or password is incorrect.")
                token = secrets.token_urlsafe(32)
                admin_sessions[token] = admin_id
                self.send_json(
                    200,
                    {"admin": {"id": admin_id, "username": username}},
                    {"Set-Cookie": self.session_cookie(token)},
                )
                return

            if path == "/api/logout" and method == "POST":
                cookie = http.cookies.SimpleCookie()
                cookie.load(self.headers.get("Cookie", ""))
                morsel = cookie.get(SESSION_COOKIE)
                if morsel:
                    admin_sessions.pop(morsel.value, None)
                self.send_json(
                    200,
                    {"ok": True},
                    {"Set-Cookie": self.session_cookie("", max_age=0)},
                )
                return

            if path == "/api/departments" and method == "GET":
                self.send_json(200, {"departments": self.get_departments()})
                return
            if path == "/api/departments" and method == "POST":
                self.require_admin()
                item = self.validate_department(self.read_json())
                self.send_json(201, {"department": self.create_department(item)})
                return

            department_match = re.fullmatch(r"/api/departments/(\d+)", path)
            if department_match and method in ("PUT", "DELETE"):
                self.require_admin()
                item_id = int(department_match.group(1))
                if method == "DELETE":
                    self.delete_department(item_id)
                    self.send_json(200, {"ok": True})
                    return
                item = self.validate_department(self.read_json())
                self.send_json(200, {"department": self.update_department(item_id, item)})
                return

            if path == "/api/announcements" and method == "GET":
                department_id = None
                query = urlparse(self.path).query
                if "department_id=" in query:
                    raw = dict(part.split("=", 1) for part in query.split("&") if "=" in part).get("department_id")
                    department_id = int(raw) if raw and raw.isdigit() else None
                category = dict(part.split("=", 1) for part in urlparse(self.path).query.split("&") if "=" in part).get("category")
                self.send_json(200, {"announcements": self.get_announcements(category, department_id)})
                return
            if path == "/api/announcements" and method == "POST":
                self.require_admin()
                item = self.validate_announcement(self.read_json())
                self.send_json(201, {"announcement": self.create_announcement(item)})
                return

            announcement_match = re.fullmatch(r"/api/announcements/(\d+)", path)
            if announcement_match and method in ("PUT", "DELETE"):
                self.require_admin()
                item_id = int(announcement_match.group(1))
                if method == "DELETE":
                    self.delete_announcement(item_id)
                    self.send_json(200, {"ok": True})
                    return
                item = self.validate_announcement(self.read_json())
                self.send_json(200, {"announcement": self.update_announcement(item_id, item)})
                return

            raise RequestError(404, "API route not found.")
        except RequestError as error:
            self.send_json(error.status, {"error": error.message})
        except (BrokenPipeError, ConnectionResetError):
            return
        except psycopg.Error as error:
            self.send_json(500, {"error": "Database operation failed: %s" % error})

    def get_departments(self):
        if database_available:
            with database() as connection:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT id_department, name, description FROM departments ORDER BY name")
                    return [{"id": row[0], "name": row[1], "description": row[2] or ""} for row in cursor.fetchall()]
        with data_lock:
            return [dict(item) for item in memory_store.departments]

    def create_department(self, item):
        if database_available:
            with database() as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "INSERT INTO departments (name, description) VALUES (%s, %s) RETURNING id_department",
                        (item["name"], item["description"]),
                    )
                    item["id"] = cursor.fetchone()[0]
            return item
        with data_lock:
            item["id"] = memory_store.next_department_id
            memory_store.next_department_id += 1
            memory_store.departments.append(dict(item))
            return dict(item)

    def update_department(self, item_id, item):
        if database_available:
            with database() as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "UPDATE departments SET name=%s, description=%s WHERE id_department=%s",
                        (item["name"], item["description"], item_id),
                    )
                    if cursor.rowcount == 0:
                        raise RequestError(404, "Department not found.")
            item["id"] = item_id
            return item
        with data_lock:
            for index, department in enumerate(memory_store.departments):
                if department["id"] == item_id:
                    item["id"] = item_id
                    memory_store.departments[index] = dict(item)
                    return dict(item)
        raise RequestError(404, "Department not found.")

    def delete_department(self, item_id):
        if database_available:
            with database() as connection:
                with connection.cursor() as cursor:
                    cursor.execute("DELETE FROM departments WHERE id_department=%s", (item_id,))
                    if cursor.rowcount == 0:
                        raise RequestError(404, "Department not found.")
            return
        with data_lock:
            before = len(memory_store.departments)
            memory_store.departments[:] = [item for item in memory_store.departments if item["id"] != item_id]
            if len(memory_store.departments) == before:
                raise RequestError(404, "Department not found.")

    def get_announcements(self, category=None, department_id=None):
        if database_available:
            with database() as connection:
                with connection.cursor() as cursor:
                    conditions = []
                    parameters = []
                    if category == "general":
                        conditions.append("id_department IS NULL")
                    elif category == "department" and department_id:
                        conditions.append("id_department=%s")
                        parameters.append(department_id)
                    elif category == "department":
                        conditions.append("id_department IS NOT NULL")
                    if department_id:
                        conditions.append("id_department=%s")
                        parameters.append(department_id)
                    where = (" WHERE " + " AND ".join(conditions)) if conditions else ""
                    cursor.execute(
                        "SELECT id_announcement, title, content, publication_date, id_department "
                        "FROM announcements" + where + " ORDER BY publication_date DESC",
                        parameters,
                    )
                    result = []
                    for row in cursor.fetchall():
                        date = row[3].strftime("%Y-%m-%d") if hasattr(row[3], "strftime") else str(row[3])[:10]
                        result.append({
                            "id": row[0],
                            "title": row[1],
                            "body": row[2],
                            "date": date,
                            "department_id": row[4],
                            "category": "general" if row[4] is None else "department",
                        })
                    return result
        with data_lock:
            result = [dict(item) for item in memory_store.announcements]
        if category == "general":
            result = [item for item in result if item["department_id"] is None]
        elif category == "department":
            result = [item for item in result if item["department_id"] is not None]
        if department_id:
            result = [item for item in result if item["department_id"] == department_id]
        return sorted(result, key=lambda item: item["date"], reverse=True)

    def create_announcement(self, item):
        if database_available:
            with database() as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "INSERT INTO announcements (title, content, publication_date, id_department, id_admin) "
                        "VALUES (%s, %s, %s, %s, (SELECT id_admin FROM administrators ORDER BY id_admin LIMIT 1)) "
                        "RETURNING id_announcement",
                        (item["title"], item["body"], item["date"], item["department_id"]),
                    )
                    item["id"] = cursor.fetchone()[0]
            item["category"] = "general" if item["department_id"] is None else "department"
            return item
        with data_lock:
            item["id"] = memory_store.next_announcement_id
            memory_store.next_announcement_id += 1
            item["category"] = "general" if item["department_id"] is None else "department"
            memory_store.announcements.append(dict(item))
            return dict(item)

    def update_announcement(self, item_id, item):
        if database_available:
            with database() as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "UPDATE announcements SET title=%s, content=%s, publication_date=%s, id_department=%s "
                        "WHERE id_announcement=%s",
                        (item["title"], item["body"], item["date"], item["department_id"], item_id),
                    )
                    if cursor.rowcount == 0:
                        raise RequestError(404, "Announcement not found.")
            item["id"] = item_id
            item["category"] = "general" if item["department_id"] is None else "department"
            return item
        with data_lock:
            for index, announcement in enumerate(memory_store.announcements):
                if announcement["id"] == item_id:
                    item["id"] = item_id
                    item["category"] = "general" if item["department_id"] is None else "department"
                    memory_store.announcements[index] = dict(item)
                    return dict(item)
        raise RequestError(404, "Announcement not found.")

    def delete_announcement(self, item_id):
        if database_available:
            with database() as connection:
                with connection.cursor() as cursor:
                    cursor.execute("DELETE FROM announcements WHERE id_announcement=%s", (item_id,))
                    if cursor.rowcount == 0:
                        raise RequestError(404, "Announcement not found.")
            return
        with data_lock:
            before = len(memory_store.announcements)
            memory_store.announcements[:] = [item for item in memory_store.announcements if item["id"] != item_id]
            if len(memory_store.announcements) == before:
                raise RequestError(404, "Announcement not found.")

    def validate_announcement(self, body):
        title = str(body.get("title", "")).strip()
        text = str(body.get("body", "")).strip()
        item_date = str(body.get("date", "")).strip()
        category = str(body.get("category", "general")).strip()
        department_id = body.get("department_id")
        if not 3 <= len(title) <= 120:
            raise RequestError(400, "Announcement title must be between 3 and 120 characters.")
        if not 5 <= len(text) <= 5000:
            raise RequestError(400, "Announcement text must be between 5 and 5,000 characters.")
        if category not in ("general", "department"):
            raise RequestError(400, "Choose general or department category.")
        if category == "general":
            department_id = None
        else:
            try:
                department_id = int(department_id)
            except (TypeError, ValueError):
                raise RequestError(400, "Choose a department.")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", item_date):
            raise RequestError(400, "Choose a valid announcement date.")
        return {"title": title, "body": text, "date": item_date, "department_id": department_id}

    def validate_department(self, body):
        name = str(body.get("name", "")).strip()
        description = str(body.get("description", "")).strip()
        if not 2 <= len(name) <= 80:
            raise RequestError(400, "Department name must be between 2 and 80 characters.")
        if not 5 <= len(description) <= 500:
            raise RequestError(400, "Department description must be between 5 and 500 characters.")
        return {"name": name, "description": description}

    def serve_static(self, requested_path):
        if requested_path == "/" or re.fullmatch(
            r"/(?:announcements(?:/\d+)?|departments(?:/\d+)?)/?",
            requested_path,
        ):
            requested_path = "/index.html"
        relative = unquote(requested_path).lstrip("/")
        file_path = (STATIC_ROOT / relative).resolve()
        if not file_path.is_relative_to(STATIC_ROOT.resolve()) or not file_path.is_file():
            self.send_error(404, "File not found.")
            return
        content_types = {
            ".css": "text/css; charset=utf-8",
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".png": "image/png",
            ".svg": "image/svg+xml",
        }
        content = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_types.get(file_path.suffix.lower(), "application/octet-stream"))
        self.send_header("Content-Length", str(len(content)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(content)


def check_database():
    global database_available
    if psycopg is None:
        print("PostgreSQL driver missing. Using memory storage.")
        return
    try:
        connection = psycopg.connect(DATABASE_URL)
        connection.close()
        database_available = True
        print("PostgreSQL connected.")
    except psycopg.Error as error:
        print("PostgreSQL unavailable. Using memory storage: %s" % error)


if __name__ == "__main__":
    check_database()
    print("Faculty of Science portal: http://%s:%s" % (HOST, PORT))
    ThreadingHTTPServer((HOST, PORT), FacultyHandler).serve_forever()
