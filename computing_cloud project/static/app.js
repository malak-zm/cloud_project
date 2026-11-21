const authScreen = document.querySelector("#auth-screen");
const portal = document.querySelector("#portal");
const authForm = document.querySelector("#auth-form");
const authMessage = document.querySelector("#auth-message");
const adminMessage = document.querySelector("#admin-message");
const signinTab = document.querySelector("#signin-tab");
const signupTab = document.querySelector("#signup-tab");
const nameField = document.querySelector("#name-field");
const roleField = document.querySelector("#role-field");
const passwordInput = document.querySelector("#password-input");
const authSubmit = document.querySelector("#auth-submit");
const adminPanel = document.querySelector("#admin-panel");
const panelBackdrop = document.querySelector("#panel-backdrop");

let signupMode = false;
let currentUser = null;
let announcements = [];
let departments = [];
let editingAnnouncementId = null;
let editingDepartmentId = null;

document.querySelector("#current-year").textContent = new Date().getFullYear();
document.querySelector("#footer-year").textContent = new Date().getFullYear();
document.querySelector("#announcement-date").value = new Date().toISOString().slice(0, 10);

function showMessage(element, text, success = false) {
  element.textContent = text;
  element.classList.toggle("success", success);
  element.hidden = false;
}

function clearMessage(element) {
  element.textContent = "";
  element.hidden = true;
  element.classList.remove("success");
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

function setSignupMode(enabled) {
  signupMode = enabled;
  clearMessage(authMessage);
  nameField.hidden = !enabled;
  roleField.hidden = !enabled;
  document.querySelector("#auth-title").textContent = enabled ? "Join your faculty" : "Welcome back";
  document.querySelector("#auth-description").textContent = enabled
    ? "Create an account to stay close to faculty life."
    : "Sign in to see the latest from your faculty.";
  document.querySelector("#name-input").required = enabled;
  passwordInput.autocomplete = enabled ? "new-password" : "current-password";
  signinTab.classList.toggle("active", !enabled);
  signupTab.classList.toggle("active", enabled);
  signinTab.setAttribute("aria-selected", String(!enabled));
  signupTab.setAttribute("aria-selected", String(enabled));
  authSubmit.innerHTML = enabled
    ? 'Create account <span aria-hidden="true">→</span>'
    : 'Sign in <span aria-hidden="true">→</span>';
}

signinTab.addEventListener("click", () => setSignupMode(false));
signupTab.addEventListener("click", () => setSignupMode(true));

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage(authMessage);
  authSubmit.disabled = true;
  const body = {
    email: document.querySelector("#email-input").value.trim(),
    password: passwordInput.value,
  };
  if (signupMode) {
    body.name = document.querySelector("#name-input").value.trim();
    body.role = document.querySelector("#role-input").value;
  }
  try {
    const data = await request(signupMode ? "/api/register" : "/api/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
    await enterPortal(data.user);
  } catch (error) {
    showMessage(authMessage, error.message);
  } finally {
    authSubmit.disabled = false;
  }
});

async function enterPortal(user) {
  currentUser = user;
  const [announcementData, departmentData] = await Promise.all([
    request("/api/announcements"),
    request("/api/departments"),
  ]);
  announcements = announcementData.announcements;
  departments = departmentData.departments;
  authScreen.hidden = true;
  portal.hidden = false;
  document.querySelector("#user-greeting").textContent = `Hello, ${user.name.split(" ")[0]}`;
  document.querySelector("#admin-toggle").hidden = user.role !== "admin";
  renderAnnouncements();
  renderDepartments();
  if (user.role === "admin") renderAdminLists();
  window.scrollTo(0, 0);
}

document.querySelector("#logout-button").addEventListener("click", async () => {
  try {
    await request("/api/logout", { method: "POST", body: "{}" });
    currentUser = null;
    portal.hidden = true;
    adminPanel.hidden = true;
    panelBackdrop.hidden = true;
    authScreen.hidden = false;
    authForm.reset();
    setSignupMode(false);
  } catch (error) {
    showMessage(document.querySelector("#portal-message"), error.message);
  }
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function prettyDate(value) {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
}

function renderAnnouncements() {
  const target = document.querySelector("#announcements-list");
  if (!announcements.length) {
    target.innerHTML = '<div class="empty-state">There are no announcements yet. Check back soon for faculty updates.</div>';
    return;
  }
  target.innerHTML = announcements.map((item) => `
    <article class="announcement-card">
      <span class="announcement-meta">${escapeHtml(prettyDate(item.date))} <span aria-hidden="true">·</span> FACULTY UPDATE</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.body)}</p>
    </article>
  `).join("");
}

function renderDepartments() {
  const target = document.querySelector("#departments-list");
  if (!departments.length) {
    target.innerHTML = '<div class="empty-state">Department information will be added soon.</div>';
    return;
  }
  target.innerHTML = departments.map((item) => `
    <article class="department-card">
      <div class="department-shape" aria-hidden="true"></div>
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.description)}</p>
    </article>
  `).join("");
}

function renderAdminLists() {
  document.querySelector("#admin-announcements").innerHTML = announcements.map((item) => `
    <div class="manage-item">
      <div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(prettyDate(item.date))}</small></div>
      <div class="manage-actions">
        <button type="button" class="text-button" data-edit-announcement="${escapeHtml(item.id)}">Edit</button>
        <button type="button" class="text-button danger" data-delete-announcement="${escapeHtml(item.id)}">Delete</button>
      </div>
    </div>
  `).join("") || '<div class="empty-state">No announcements published.</div>';
  document.querySelector("#admin-departments").innerHTML = departments.map((item) => `
    <div class="manage-item">
      <div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.description)}</small></div>
      <div class="manage-actions">
        <button type="button" class="text-button" data-edit-department="${escapeHtml(item.id)}">Edit</button>
        <button type="button" class="text-button danger" data-delete-department="${escapeHtml(item.id)}">Delete</button>
      </div>
    </div>
  `).join("") || '<div class="empty-state">No departments yet.</div>';
}

async function refreshContent() {
  const [announcementData, departmentData] = await Promise.all([
    request("/api/announcements"),
    request("/api/departments"),
  ]);
  announcements = announcementData.announcements;
  departments = departmentData.departments;
  renderAnnouncements();
  renderDepartments();
  renderAdminLists();
}

function openAdminPanel() {
  adminPanel.hidden = false;
  panelBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeAdminPanel() {
  adminPanel.hidden = true;
  panelBackdrop.hidden = true;
  document.body.style.overflow = "";
  clearMessage(adminMessage);
}

document.querySelector("#admin-toggle").addEventListener("click", openAdminPanel);
document.querySelector("#close-admin").addEventListener("click", closeAdminPanel);
panelBackdrop.addEventListener("click", closeAdminPanel);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !adminPanel.hidden) closeAdminPanel();
});

function resetAnnouncementForm() {
  editingAnnouncementId = null;
  document.querySelector("#announcement-form").reset();
  document.querySelector("#announcement-date").value = new Date().toISOString().slice(0, 10);
  document.querySelector("#announcement-form-title").textContent = "New announcement";
  document.querySelector("#announcement-form button[type=submit]").textContent = "Publish announcement";
  document.querySelector("#cancel-announcement-edit").hidden = true;
}

function resetDepartmentForm() {
  editingDepartmentId = null;
  document.querySelector("#department-form").reset();
  document.querySelector("#department-form-title").textContent = "Add a department";
  document.querySelector("#department-form button[type=submit]").textContent = "Add department";
  document.querySelector("#cancel-department-edit").hidden = true;
}

document.querySelector("#cancel-announcement-edit").addEventListener("click", resetAnnouncementForm);
document.querySelector("#cancel-department-edit").addEventListener("click", resetDepartmentForm);

document.querySelector("#announcement-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage(adminMessage);
  const body = {
    title: document.querySelector("#announcement-title").value.trim(),
    body: document.querySelector("#announcement-body").value.trim(),
    date: document.querySelector("#announcement-date").value,
  };
  try {
    await request(editingAnnouncementId
      ? `/api/announcements/${editingAnnouncementId}`
      : "/api/announcements", {
      method: editingAnnouncementId ? "PUT" : "POST",
      body: JSON.stringify(body),
    });
    resetAnnouncementForm();
    await refreshContent();
    showMessage(adminMessage, "Announcement saved.", true);
  } catch (error) {
    showMessage(adminMessage, error.message);
  }
});

document.querySelector("#department-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage(adminMessage);
  const body = {
    name: document.querySelector("#department-name").value.trim(),
    description: document.querySelector("#department-description").value.trim(),
  };
  try {
    await request(editingDepartmentId
      ? `/api/departments/${editingDepartmentId}`
      : "/api/departments", {
      method: editingDepartmentId ? "PUT" : "POST",
      body: JSON.stringify(body),
    });
    resetDepartmentForm();
    await refreshContent();
    showMessage(adminMessage, "Department saved.", true);
  } catch (error) {
    showMessage(adminMessage, error.message);
  }
});

document.querySelector("#admin-announcements").addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-announcement]");
  const deleteButton = event.target.closest("[data-delete-announcement]");
  if (editButton) {
    const item = announcements.find((entry) => entry.id === editButton.dataset.editAnnouncement);
    if (!item) return;
    editingAnnouncementId = item.id;
    document.querySelector("#announcement-title").value = item.title;
    document.querySelector("#announcement-body").value = item.body;
    document.querySelector("#announcement-date").value = item.date;
    document.querySelector("#announcement-form-title").textContent = "Edit announcement";
    document.querySelector("#announcement-form button[type=submit]").textContent = "Save changes";
    document.querySelector("#cancel-announcement-edit").hidden = false;
    return;
  }
  if (deleteButton && window.confirm("Delete this announcement? This cannot be undone.")) {
    try {
      await request(`/api/announcements/${deleteButton.dataset.deleteAnnouncement}`, { method: "DELETE" });
      await refreshContent();
      showMessage(adminMessage, "Announcement deleted.", true);
    } catch (error) {
      showMessage(adminMessage, error.message);
    }
  }
});

document.querySelector("#admin-departments").addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-department]");
  const deleteButton = event.target.closest("[data-delete-department]");
  if (editButton) {
    const item = departments.find((entry) => entry.id === editButton.dataset.editDepartment);
    if (!item) return;
    editingDepartmentId = item.id;
    document.querySelector("#department-name").value = item.name;
    document.querySelector("#department-description").value = item.description;
    document.querySelector("#department-form-title").textContent = "Edit department";
    document.querySelector("#department-form button[type=submit]").textContent = "Save changes";
    document.querySelector("#cancel-department-edit").hidden = false;
    return;
  }
  if (deleteButton && window.confirm("Delete this department? This cannot be undone.")) {
    try {
      await request(`/api/departments/${deleteButton.dataset.deleteDepartment}`, { method: "DELETE" });
      await refreshContent();
      showMessage(adminMessage, "Department deleted.", true);
    } catch (error) {
      showMessage(adminMessage, error.message);
    }
  }
});

async function start() {
  try {
    const data = await request("/api/me");
    await enterPortal(data.user);
  } catch (error) {
    if (error.message !== "You are not signed in.") {
      showMessage(authMessage, error.message);
    }
  }
}

start();
