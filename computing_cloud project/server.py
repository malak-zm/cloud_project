import hashlib
import hmac
import http.cookies
import json
import os
import re
import secrets
import threading
import uuid
from datetime import date, datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parent
STATIC_ROOT = ROOT / "static"
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8000"))
DEFAULT_ADMIN_PASSWORD = "ChangeThisAdminPassword!"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@univ-boumerdes.dz").strip().lower()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", DEFAULT_ADMIN_PASSWORD)
PBKDF2_ITERATIONS = 310_000
SESSION_COOKIE = "faculty_session"

users = {}
sessions = {}
announcements = [
    {
        "id": uuid.uuid4().hex,
        "title": "Welcome to the Faculty of Science portal",
        "body": "This starter notice is sample content. Faculty administrators can replace it with current news and important updates.",
        "date": date.today().isoformat(),
    }
]
departments = [
    {
        "id": "computer-science",
        "name": "Computer Science",
        "description": "Software, networks, databases and artificial intelligence.",
    },
    {
        "id": "mathematics",
        "name": "Mathematics",
        "description": "Algebra, analysis, probability and applied mathematics.",
    },
    {
        "id": "physics",
        "name": "Physics",
        "description": "Mechanics, optics, materials and renewable energy.",
    },
    {
        "id": "chemistry",
        "name": "Chemistry",
        "description": "Organic and analytical chemistry, with environmental focus.",
    },
]
data_lock = threading.RLock()


def hash_password(password, salt=None):
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS
    )
    return salt, digest


admin_salt, admin_digest = hash_password(ADMIN_PASSWORD)
users[ADMIN_EMAIL] = {
    "id": uuid.uuid4().hex,
    "name": "Faculty Administrator",
    "email": ADMIN_EMAIL,
    "role": "admin",
    "salt": admin_salt,
    "password_hash": admin_digest,
}


class RequestError(Exception):
    def __init__(self, status, message):
        self.status = status
        self.message = message


class FacultyHandler(BaseHTTPRequestHandler):
    server_version = "FacultyPortal/1.0"

    def log_message(self, format_string, *args):
        print("%s - %s" % (self.address_string(), format_string % args))

    def send_json(self, status, value, headers=None):
        body = json.dumps(value, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        if headers:
            for key, value in headers.items():
                self.send_header(key, value)
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

    def current_user(self):
        cookie = http.cookies.SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
        except http.cookies.CookieError:
            return None
        morsel = cookie.get(SESSION_COOKIE)
        token = morsel.value if morsel else ""
        email = sessions.get(token)
        user = users.get(email) if email else None
        if user is None:
            return None
        return {key: user[key] for key in ("id", "name", "email", "role")}

    def require_user(self, role=None):
        user = self.current_user()
        if user is None:
            raise RequestError(401, "Please sign in to continue.")
        if role and user["role"] != role:
            raise RequestError(403, "Administrator access is required.")
        return user

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

            if path == "/api/me" and method == "GET":
                user = self.current_user()
                if user is None:
                    raise RequestError(401, "You are not signed in.")
                self.send_json(200, {"user": user})
                return

            if path == "/api/register" and method == "POST":
                body = self.read_json()
                name = str(body.get("name", "")).strip()
                email = str(body.get("email", "")).strip().lower()
                password = body.get("password", "")
                role = body.get("role", "")
                if not 2 <= len(name) <= 80:
                    raise RequestError(400, "Name must be between 2 and 80 characters.")
                if len(email) > 254 or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
                    raise RequestError(400, "Enter a valid email address.")
                if not isinstance(password, str) or len(password) < 8 or len(password) > 128:
                    raise RequestError(400, "Password must be between 8 and 128 characters.")
                if role not in ("student", "teacher"):
                    raise RequestError(400, "Choose student or teacher as your account type.")
                with data_lock:
                    if email in users:
                        raise RequestError(409, "An account with this email already exists.")
                    salt, digest = hash_password(password)
                    user = {
                        "id": uuid.uuid4().hex,
                        "name": name,
                        "email": email,
                        "role": role,
                        "salt": salt,
                        "password_hash": digest,
                    }
                    users[email] = user
                    token = secrets.token_urlsafe(32)
                    sessions[token] = email
                self.send_json(
                    201,
                    {"user": {key: user[key] for key in ("id", "name", "email", "role")}},
                    {"Set-Cookie": self.session_cookie(token)},
                )
                return

            if path == "/api/login" and method == "POST":
                body = self.read_json()
                email = str(body.get("email", "")).strip().lower()
                password = body.get("password", "")
                if not isinstance(password, str):
                    raise RequestError(400, "Enter your email and password.")
                with data_lock:
                    user = users.get(email)
                    salt = user["salt"] if user else bytes(16)
                    candidate = hash_password(password, salt)[1]
                    valid = user is not None and hmac.compare_digest(
                        candidate, user["password_hash"]
                    )
                    if not valid:
                        raise RequestError(401, "Email or password is incorrect.")
                    token = secrets.token_urlsafe(32)
                    sessions[token] = email
                public_user = {key: user[key] for key in ("id", "name", "email", "role")}
                self.send_json(200, {"user": public_user}, {"Set-Cookie": self.session_cookie(token)})
                return

            if path == "/api/logout" and method == "POST":
                cookie = http.cookies.SimpleCookie()
                cookie.load(self.headers.get("Cookie", ""))
                morsel = cookie.get(SESSION_COOKIE)
                if morsel:
                    sessions.pop(morsel.value, None)
                self.send_json(200, {"ok": True}, {"Set-Cookie": self.session_cookie("", max_age=0)})
                return

            if path == "/api/announcements" and method == "GET":
                self.require_user()
                with data_lock:
                    result = sorted(announcements, key=lambda item: item["date"], reverse=True)
                self.send_json(200, {"announcements": result})
                return

            announcement_match = re.fullmatch(r"/api/announcements/([a-f0-9]+)", path)
            if path == "/api/announcements" and method == "POST":
                self.require_user("admin")
                item = self.validate_announcement(self.read_json())
                item["id"] = uuid.uuid4().hex
                with data_lock:
                    announcements.append(item)
                self.send_json(201, {"announcement": item})
                return
            if announcement_match and method in ("PUT", "DELETE"):
                self.require_user("admin")
                item_id = announcement_match.group(1)
                with data_lock:
                    index = next(
                        (i for i, item in enumerate(announcements) if item["id"] == item_id),
                        None,
                    )
                    if index is None:
                        raise RequestError(404, "Announcement not found.")
                    if method == "DELETE":
                        announcements.pop(index)
                        self.send_json(200, {"ok": True})
                        return
                    updated = self.validate_announcement(self.read_json())
                    updated["id"] = item_id
                    announcements[index] = updated
                self.send_json(200, {"announcement": updated})
                return

            if path == "/api/departments" and method == "GET":
                self.require_user()
                with data_lock:
                    result = list(departments)
                self.send_json(200, {"departments": result})
                return

            if path == "/api/departments" and method == "POST":
                self.require_user("admin")
                item = self.validate_department(self.read_json())
                item["id"] = uuid.uuid4().hex
                with data_lock:
                    departments.append(item)
                self.send_json(201, {"department": item})
                return

            department_match = re.fullmatch(r"/api/departments/([a-f0-9-]+)", path)
            if department_match and method in ("PUT", "DELETE"):
                self.require_user("admin")
                item_id = department_match.group(1)
                with data_lock:
                    index = next(
                        (i for i, item in enumerate(departments) if item["id"] == item_id),
                        None,
                    )
                    if index is None:
                        raise RequestError(404, "Department not found.")
                    if method == "DELETE":
                        departments.pop(index)
                        self.send_json(200, {"ok": True})
                        return
                    updated = self.validate_department(self.read_json())
                    updated["id"] = item_id
                    departments[index] = updated
                self.send_json(200, {"department": updated})
                return

            raise RequestError(404, "API route not found.")
        except RequestError as error:
            self.send_json(error.status, {"error": error.message})
        except (BrokenPipeError, ConnectionResetError):
            return

    def validate_announcement(self, body):
        title = str(body.get("title", "")).strip()
        text = str(body.get("body", "")).strip()
        item_date = str(body.get("date", "")).strip()
        if not 3 <= len(title) <= 120:
            raise RequestError(400, "Announcement title must be between 3 and 120 characters.")
        if not 5 <= len(text) <= 5000:
            raise RequestError(400, "Announcement text must be between 5 and 5,000 characters.")
        try:
            datetime.strptime(item_date, "%Y-%m-%d")
        except ValueError:
            raise RequestError(400, "Choose a valid announcement date.")
        return {"title": title, "body": text, "date": item_date}

    def validate_department(self, body):
        name = str(body.get("name", "")).strip()
        description = str(body.get("description", "")).strip()
        if not 2 <= len(name) <= 80:
            raise RequestError(400, "Department name must be between 2 and 80 characters.")
        if not 5 <= len(description) <= 500:
            raise RequestError(400, "Department description must be between 5 and 500 characters.")
        return {"name": name, "description": description}

    def session_cookie(self, token, max_age=60 * 60 * 8):
        return "%s=%s; Path=/; HttpOnly; SameSite=Strict; Max-Age=%s" % (
            SESSION_COOKIE,
            token,
            max_age,
        )

    def serve_static(self, requested_path):
        if requested_path == "/":
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
        self.send_header(
            "Content-Type",
            content_types.get(file_path.suffix.lower(), "application/octet-stream"),
        )
        self.send_header("Content-Length", str(len(content)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(content)


if __name__ == "__main__":
    if HOST not in ("127.0.0.1", "localhost", "::1") and ADMIN_PASSWORD == DEFAULT_ADMIN_PASSWORD:
        raise SystemExit(
            "Set a private ADMIN_PASSWORD before binding the server beyond this computer."
        )
    print("Faculty of Science portal: http://%s:%s" % (HOST, PORT))
    print("Admin account: %s (set ADMIN_PASSWORD to replace the local demo password)" % ADMIN_EMAIL)
    ThreadingHTTPServer((HOST, PORT), FacultyHandler).serve_forever()
