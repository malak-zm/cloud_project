# Faculty of Science portal

A responsive full-stack starter for the Faculty of Science, University of Boumerdes. It includes student/teacher accounts, an administrator view, announcements, and the four departments shown in the supplied reference.

## Run locally

Requires Python 3.10 or later. No third-party packages are needed.

```powershell
python server.py
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000).

The local demo administrator is `admin@univ-boumerdes.dz` with password `ChangeThisAdminPassword!`. Change the password before using the app beyond a local demo:

```powershell
$env:ADMIN_PASSWORD = "choose-a-private-password"
python server.py
```

`ADMIN_EMAIL`, `HOST`, and `PORT` can also be configured with environment variables. The server refuses to listen beyond localhost while the demo administrator password is in use.

## Current prototype boundaries

- Students and teachers can create accounts; account roles cannot be selected as administrator.
- Administrators can create, edit, and delete announcements and departments. Authorization is checked on every management API request.
- Users, sessions, announcements, and department changes are held in memory. They reset when the server restarts, by design, until the database integration is ready.
- This is a local development starter, not a production identity system. Before deployment, connect persistent user storage, use HTTPS, set a private administrator password, and review the authentication/session policy.
