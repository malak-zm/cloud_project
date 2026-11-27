let announcements = [];
let departments = [];
let activeCategory = "all";
let activeDepartmentId = null;
let editingAnnouncementId = null;
let editingDepartmentId = null;
let currentAdmin = null;
let language = "fr";

const translations = {
  fr: {
    signin: "Connexion admin",
    manage: "Gérer le site",
    signout: "Se déconnecter",
    signinTitle: "Connexion administrateur",
    signinDescription: "Identifiez-vous pour modifier les annonces et les départements.",
    username: "Nom d'utilisateur",
    password: "Mot de passe",
    login: "Se connecter",
    navHome: "Accueil",
    navAnnouncements: "Annonces",
    navDepartments: "Départements",
    announcementEyebrow: "ACTUALITÉS FACULTAIRES",
    announcementTitle: "Dernières actualités",
    departmentEyebrow: "EXPLORER L'UNIVERSITÉ",
    departmentTitle: "Nos départements",
    allDepartments: "Tous les départements",
    all: "Toutes",
    general: "Générales",
    department: "Par département",
    generalAnnouncement: "Annonce générale",
    departmentAnnouncement: "Annonce départementale",
    noAnnouncements: "Aucune annonce dans cette catégorie pour le moment.",
    noDepartments: "Les départements seront bientôt disponibles.",
    footer: "Faculté des Sciences",
    showAll: "Voir toutes",
    heroKicker: "FACULTÉ DES SCIENCES · UNIVERSITÉ DE BOUMERDÈS",
    heroWelcome: "Bienvenue à la Faculté<br><em>des Sciences</em>",
    heroDescription: "Consultez les annonces et retrouvez les informations de nos départements.",
    heroAnnouncementsButton: "Voir les annonces",
    heroDepartmentsButton: "Nos départements",
    heroFacts: [["6", "Départements"], ["Actualités", "Annonces de la faculté"], ["Étudiants", "Informations utiles"]],
    statDepartments: "Départements",
    statAnnouncements: "Annonces publiées",
    statCategories: "Catégories d'information",
    motto: "— annonces et informations de la faculté.",
    manageEyebrow: "ADMINISTRATION",
    announcementManageEyebrow: "NOUVELLE INFORMATION",
    departmentManageEyebrow: "STRUCTURE FACULTÉ",
    announcementLabel: "Annonce",
    departmentLabel: "Département",
    titleLabel: "Titre",
    contentLabel: "Contenu",
    dateLabel: "Date",
    categoryLabel: "Catégorie",
    departmentFieldLabel: "Département",
    departmentNameLabel: "Nom du département",
    generalOption: "Générale",
    departmentOption: "Département",
    publish: "Publier",
    add: "Ajouter",
    cancel: "Annuler",
    edit: "Modifier",
    delete: "Supprimer",
    save: "Enregistrer",
    saveSuccess: "Modifications enregistrées.",
    deleteAnnouncementConfirm: "Supprimer cette annonce ?",
    deleteDepartmentConfirm: "Supprimer ce département ?",
    announcementsNone: "Aucune annonce.",
    departmentsNone: "Aucun département.",
    announcementUpdated: "Annonce enregistrée.",
    announcementDeleted: "Annonce supprimée.",
    departmentUpdated: "Département enregistré.",
    departmentDeleted: "Département supprimé.",
    brandTitle: "FACULTÉ DES SCIENCES",
    brandSubtitle: "UNIVERSITÉ DE BOUMERDÈS",
    detailHome: "Accueil",
    detailAnnouncements: "Annonces",
    detailDepartments: "Départements",
    readMore: "Lire l'annonce",
    allAnnouncements: "Toutes les annonces",
    relatedAnnouncements: "Annonces de ce département",
    noRelatedAnnouncements: "Aucune annonce publiée pour ce département pour le moment.",
    notFound: "Cette page n'est pas disponible.",
    detailLoading: "Chargement…",
    backToDepartments: "Retour aux départements",
    backToAnnouncements: "Retour aux annonces",
  },
  en: {
    signin: "Admin sign in",
    manage: "Manage site",
    signout: "Sign out",
    signinTitle: "Administrator sign in",
    signinDescription: "Sign in to edit announcements and departments.",
    username: "Username",
    password: "Password",
    login: "Sign in",
    navHome: "Home",
    navAnnouncements: "Announcements",
    navDepartments: "Departments",
    announcementEyebrow: "FACULTY NEWS",
    announcementTitle: "Latest news",
    departmentEyebrow: "EXPLORE OUR UNIVERSITY",
    departmentTitle: "Departments",
    allDepartments: "All departments",
    all: "All",
    general: "General",
    department: "By department",
    generalAnnouncement: "General announcement",
    departmentAnnouncement: "Department announcement",
    noAnnouncements: "No announcements are available in this category.",
    noDepartments: "Department information will be available soon.",
    footer: "Faculty of Science",
    showAll: "View all",
    heroKicker: "FACULTY OF SCIENCE · UNIVERSITY OF BOUMERDES",
    heroWelcome: "Welcome to the Faculty<br><em>of Science</em>",
    heroDescription: "Find faculty announcements and information about our departments.",
    heroAnnouncementsButton: "View announcements",
    heroDepartmentsButton: "Our departments",
    heroFacts: [["6", "Departments"], ["News", "Faculty announcements"], ["Students", "Useful information"]],
    statDepartments: "Departments",
    statAnnouncements: "Published announcements",
    statCategories: "Information categories",
    motto: "— faculty news and information.",
    manageEyebrow: "ADMINISTRATION",
    announcementManageEyebrow: "NEW INFORMATION",
    departmentManageEyebrow: "FACULTY STRUCTURE",
    announcementLabel: "Announcement",
    departmentLabel: "Department",
    titleLabel: "Title",
    contentLabel: "Content",
    dateLabel: "Date",
    categoryLabel: "Category",
    departmentFieldLabel: "Department",
    departmentNameLabel: "Department name",
    generalOption: "General",
    departmentOption: "Department",
    publish: "Publish",
    add: "Add",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    saveSuccess: "Changes saved.",
    deleteAnnouncementConfirm: "Delete this announcement?",
    deleteDepartmentConfirm: "Delete this department?",
    announcementsNone: "No announcements.",
    departmentsNone: "No departments.",
    announcementUpdated: "Announcement saved.",
    announcementDeleted: "Announcement deleted.",
    departmentUpdated: "Department saved.",
    departmentDeleted: "Department deleted.",
    brandTitle: "FACULTY OF SCIENCE",
    brandSubtitle: "UNIVERSITY OF BOUMERDES",
    detailHome: "Home",
    detailAnnouncements: "Announcements",
    detailDepartments: "Departments",
    readMore: "Read announcement",
    allAnnouncements: "All announcements",
    relatedAnnouncements: "Department announcements",
    noRelatedAnnouncements: "There are no announcements for this department yet.",
    notFound: "This page is not available.",
    detailLoading: "Loading…",
    backToDepartments: "Back to departments",
    backToAnnouncements: "Back to announcements",
    studentShortcut: "Students",
  },
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Une erreur est survenue.");
  return data;
}

function prettyDate(value) {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
}

function showMessage(text, success = false) {
  const element = document.querySelector("#manage-message");
  element.textContent = text;
  element.classList.toggle("success", success);
  element.hidden = false;
}

function clearMessage() {
  const element = document.querySelector("#manage-message");
  element.textContent = "";
  element.hidden = true;
  element.classList.remove("success");
}

async function loadContent() {
  const [announcementData, departmentData] = await Promise.all([
    request("/api/announcements"),
    request("/api/departments"),
  ]);
  announcements = announcementData.announcements;
  departments = departmentData.departments;
  renderAnnouncements();
  renderDepartments();
  renderAdminLists();
  renderDepartmentOptions();
  renderStats();
  renderRoutePage();
}

function renderStats() {
  document.querySelector("#stat-departments").textContent = departments.length;
  document.querySelector("#stat-announcements").textContent = announcements.length;
  document.querySelector(".hero-facts > div:first-child strong").textContent = departments.length;
}

function renderAnnouncements() {
  const target = document.querySelector("#announcements-list");
  let visible = [...announcements];
  if (activeCategory === "general") visible = visible.filter((item) => item.category === "general");
  if (activeCategory === "department") visible = visible.filter((item) => item.category === "department");
  if (activeDepartmentId) visible = visible.filter((item) => item.department_id === activeDepartmentId);

  if (!visible.length) {
    target.innerHTML = `<div class="empty-state">${escapeHtml(translations[language].noAnnouncements)}</div>`;
    return;
  }
  target.innerHTML = renderAnnouncementCards(visible);
}

function renderAnnouncementCards(items) {
  return items.map((item) => {
    const department = departments.find((entry) => entry.id === item.department_id);
    const label = item.category === "general"
      ? translations[language].generalAnnouncement
      : (department ? department.name : (language === "fr" ? "Département" : "Department"));
    return `
      <a class="announcement-card" href="/announcements/${item.id}">
        <div class="announcement-card-top"><span>${escapeHtml(label)}</span><time datetime="${escapeHtml(item.date)}">${escapeHtml(prettyDate(item.date))}</time></div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.body)}</p>
        <span class="announcement-read-more">${escapeHtml(translations[language].readMore)} <span aria-hidden="true">→</span></span>
      </a>`;
  }).join("");
}

function renderDepartments() {
  const target = document.querySelector("#departments-list");
  target.innerHTML = renderDepartmentCards();
}

function renderDepartmentCards() {
  if (!departments.length) {
    return `<div class="empty-state">${escapeHtml(translations[language].noDepartments)}</div>`;
  }
  return departments.map((item) => `
    <a class="department-card ${activeDepartmentId === item.id ? "selected" : ""}" href="/departments/${item.id}">
      <span class="department-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.description)}</small></span>
      <span class="department-arrow" aria-hidden="true">→</span>
    </a>
  `).join("");
}

function renderRoutePage() {
  const home = document.querySelector("#home-content");
  const detail = document.querySelector("#detail-view");
  const announcementRoute = window.location.pathname.match(/^\/announcements(?:\/(\d+))?\/?$/);
  const departmentRoute = window.location.pathname.match(/^\/departments(?:\/(\d+))?\/?$/);
  const navLinks = document.querySelectorAll(".main-nav a");
  navLinks.forEach((link, index) => {
    link.classList.toggle(
      "active",
      index === 0 ? window.location.pathname === "/" :
        index === 1 ? Boolean(announcementRoute) : Boolean(departmentRoute),
    );
  });

  if (!announcementRoute && !departmentRoute) {
    home.hidden = false;
    detail.hidden = true;
    document.title = "Faculté des Sciences | Université de Boumerdès";
    return;
  }

  home.hidden = true;
  detail.hidden = false;
  const text = translations[language];
  const breadcrumb = (section) => `
    <nav class="detail-breadcrumb" aria-label="Breadcrumb">
      <a href="/">${escapeHtml(text.detailHome)}</a><span aria-hidden="true">/</span>
      <a href="${section === "announcements" ? "/announcements" : "/departments"}">${escapeHtml(section === "announcements" ? text.detailAnnouncements : text.detailDepartments)}</a>
    </nav>`;

  if (announcementRoute && !announcementRoute[1]) {
    detail.innerHTML = `
      <section class="detail-page">
        ${breadcrumb("announcements")}
        <p class="eyebrow">${escapeHtml(text.announcementEyebrow)}</p>
        <h1>${escapeHtml(text.allAnnouncements)}</h1>
        <div class="announcement-grid detail-announcements">${renderAnnouncementCards(announcements)}</div>
      </section>`;
    document.title = `${text.allAnnouncements} | Faculté des Sciences`;
    return;
  }

  if (departmentRoute && !departmentRoute[1]) {
    detail.innerHTML = `
      <section class="detail-page">
        ${breadcrumb("departments")}
        <p class="eyebrow">${escapeHtml(text.departmentEyebrow)}</p>
        <h1>${escapeHtml(text.allDepartments)}</h1>
        <div class="department-grid detail-departments">${renderDepartmentCards()}</div>
      </section>`;
    document.title = `${text.allDepartments} | Faculté des Sciences`;
    return;
  }

  if (announcementRoute) {
    const item = announcements.find((entry) => entry.id === Number(announcementRoute[1]));
    if (!item) {
      detail.innerHTML = `<section class="detail-page">${breadcrumb("announcements")}<p class="empty-state">${escapeHtml(text.notFound)}</p></section>`;
      document.title = `${text.notFound} | Faculté des Sciences`;
      return;
    }
    const department = departments.find((entry) => entry.id === item.department_id);
    const category = item.category === "general"
      ? text.generalAnnouncement
      : (department ? department.name : text.departmentLabel);
    detail.innerHTML = `
      <article class="detail-page announcement-detail">
        ${breadcrumb("announcements")}
        <div class="detail-meta"><span>${escapeHtml(category)}</span><time datetime="${escapeHtml(item.date)}">${escapeHtml(prettyDate(item.date))}</time></div>
        <h1>${escapeHtml(item.title)}</h1>
        <p class="detail-content">${escapeHtml(item.body)}</p>
        ${department ? `<a class="detail-related-link" href="/departments/${department.id}">${escapeHtml(text.detailDepartments)} · ${escapeHtml(department.name)} <span aria-hidden="true">→</span></a>` : ""}
        <a class="detail-back" href="/announcements">${escapeHtml(text.backToAnnouncements)}</a>
      </article>`;
    document.title = `${item.title} | Faculté des Sciences`;
    return;
  }

  const department = departments.find((entry) => entry.id === Number(departmentRoute[1]));
  if (!department) {
    detail.innerHTML = `<section class="detail-page">${breadcrumb("departments")}<p class="empty-state">${escapeHtml(text.notFound)}</p></section>`;
    document.title = `${text.notFound} | Faculté des Sciences`;
    return;
  }
  const departmentAnnouncements = announcements.filter((item) => item.department_id === department.id);
  detail.innerHTML = `
    <section class="detail-page department-detail">
      ${breadcrumb("departments")}
      <p class="eyebrow">${escapeHtml(text.departmentLabel)}</p>
      <h1>${escapeHtml(department.name)}</h1>
      <p class="detail-description">${escapeHtml(department.description)}</p>
      <h2>${escapeHtml(text.relatedAnnouncements)}</h2>
      <div class="announcement-grid detail-announcements">
        ${departmentAnnouncements.length
          ? renderAnnouncementCards(departmentAnnouncements)
          : `<p class="empty-state">${escapeHtml(text.noRelatedAnnouncements)}</p>`}
      </div>
      <a class="detail-back" href="/departments">${escapeHtml(text.backToDepartments)}</a>
    </section>`;
  document.title = `${department.name} | Faculté des Sciences`;
}

function renderDepartmentOptions() {
  const select = document.querySelector("#announcement-department");
  select.innerHTML = departments.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("");
}

function renderAdminLists() {
  document.querySelector("#admin-announcements").innerHTML = announcements.map((item) => {
    const department = departments.find((entry) => entry.id === item.department_id);
    return `<div class="manage-item"><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.category === "general" ? translations[language].generalOption : (department?.name || translations[language].departmentLabel))}</small></div><div class="manage-actions"><button type="button" data-edit-announcement="${item.id}">${escapeHtml(translations[language].edit)}</button><button class="danger" type="button" data-delete-announcement="${item.id}">${escapeHtml(translations[language].delete)}</button></div></div>`;
  }).join("") || `<div class="empty-state">${escapeHtml(translations[language].announcementsNone)}</div>`;
  document.querySelector("#admin-departments").innerHTML = departments.map((item) => `
    <div class="manage-item"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.description)}</small></div><div class="manage-actions"><button type="button" data-edit-department="${item.id}">${escapeHtml(translations[language].edit)}</button><button class="danger" type="button" data-delete-department="${item.id}">${escapeHtml(translations[language].delete)}</button></div></div>
  `).join("") || `<div class="empty-state">${escapeHtml(translations[language].departmentsNone)}</div>`;
}

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeCategory = button.dataset.category;
    if (activeCategory !== "department") activeDepartmentId = null;
    renderAnnouncements();
  });
});

function openManagePanel() {
  document.querySelector("#manage-panel").hidden = false;
  document.querySelector("#panel-backdrop").hidden = false;
  document.body.classList.add("panel-open");
}
function closeManagePanel() {
  document.querySelector("#manage-panel").hidden = true;
  document.querySelector("#panel-backdrop").hidden = true;
  document.body.classList.remove("panel-open");
  clearMessage();
}

document.querySelector("#close-manage").addEventListener("click", closeManagePanel);
document.querySelector("#panel-backdrop").addEventListener("click", closeManagePanel);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeManagePanel();
});

function resetAnnouncementForm() {
  editingAnnouncementId = null;
  document.querySelector("#announcement-form").reset();
  document.querySelector("#announcement-date").value = new Date().toISOString().slice(0, 10);
  document.querySelector("#announcement-form-title").textContent = translations[language].announcementLabel;
  document.querySelector("#department-select-field").hidden = true;
  document.querySelector("#cancel-announcement-edit").hidden = true;
  document.querySelector("#announcement-form .primary-button").textContent = translations[language].publish;
}

function resetDepartmentForm() {
  editingDepartmentId = null;
  document.querySelector("#department-form").reset();
  document.querySelector("#department-form-title").textContent = translations[language].departmentLabel;
  document.querySelector("#cancel-department-edit").hidden = true;
  document.querySelector("#department-form .primary-button").textContent = translations[language].add;
}

document.querySelector("#announcement-category").addEventListener("change", (event) => {
  document.querySelector("#department-select-field").hidden = event.target.value !== "department";
});
document.querySelector("#cancel-announcement-edit").addEventListener("click", resetAnnouncementForm);
document.querySelector("#cancel-department-edit").addEventListener("click", resetDepartmentForm);

document.querySelector("#announcement-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();
  const body = {
    title: document.querySelector("#announcement-title").value.trim(),
    body: document.querySelector("#announcement-body").value.trim(),
    date: document.querySelector("#announcement-date").value,
    category: document.querySelector("#announcement-category").value,
    department_id: document.querySelector("#announcement-department").value,
  };
  try {
    await request(editingAnnouncementId ? `/api/announcements/${editingAnnouncementId}` : "/api/announcements", {
      method: editingAnnouncementId ? "PUT" : "POST",
      body: JSON.stringify(body),
    });
    resetAnnouncementForm();
    await loadContent();
    showMessage(translations[language].announcementUpdated, true);
  } catch (error) {
    showMessage(error.message);
  }
});

document.querySelector("#department-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();
  const body = {
    name: document.querySelector("#department-name").value.trim(),
    description: document.querySelector("#department-description").value.trim(),
  };
  try {
    await request(editingDepartmentId ? `/api/departments/${editingDepartmentId}` : "/api/departments", {
      method: editingDepartmentId ? "PUT" : "POST",
      body: JSON.stringify(body),
    });
    resetDepartmentForm();
    await loadContent();
    showMessage(translations[language].departmentUpdated, true);
  } catch (error) {
    showMessage(error.message);
  }
});

document.querySelector("#admin-announcements").addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-announcement]");
  const deleteButton = event.target.closest("[data-delete-announcement]");
  if (editButton) {
    const item = announcements.find((entry) => entry.id === Number(editButton.dataset.editAnnouncement));
    if (!item) return;
    editingAnnouncementId = item.id;
    document.querySelector("#announcement-title").value = item.title;
    document.querySelector("#announcement-body").value = item.body;
    document.querySelector("#announcement-date").value = item.date;
    document.querySelector("#announcement-category").value = item.category;
    document.querySelector("#department-select-field").hidden = item.category !== "department";
    if (item.department_id) document.querySelector("#announcement-department").value = String(item.department_id);
    document.querySelector("#announcement-form-title").textContent = `${translations[language].edit} ${translations[language].announcementLabel.toLowerCase()}`;
    document.querySelector("#cancel-announcement-edit").hidden = false;
    document.querySelector("#announcement-form .primary-button").textContent = translations[language].save;
  }
  if (deleteButton && window.confirm(translations[language].deleteAnnouncementConfirm)) {
    try {
      await request(`/api/announcements/${deleteButton.dataset.deleteAnnouncement}`, { method: "DELETE" });
      await loadContent();
      showMessage(translations[language].announcementDeleted, true);
    } catch (error) {
      showMessage(error.message);
    }
  }
});

document.querySelector("#admin-departments").addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-department]");
  const deleteButton = event.target.closest("[data-delete-department]");
  if (editButton) {
    const item = departments.find((entry) => entry.id === Number(editButton.dataset.editDepartment));
    if (!item) return;
    editingDepartmentId = item.id;
    document.querySelector("#department-name").value = item.name;
    document.querySelector("#department-description").value = item.description;
    document.querySelector("#department-form-title").textContent = `${translations[language].edit} ${translations[language].departmentLabel.toLowerCase()}`;
    document.querySelector("#cancel-department-edit").hidden = false;
    document.querySelector("#department-form .primary-button").textContent = translations[language].save;
  }
  if (deleteButton && window.confirm(translations[language].deleteDepartmentConfirm)) {
    try {
      await request(`/api/departments/${deleteButton.dataset.deleteDepartment}`, { method: "DELETE" });
      await loadContent();
      showMessage(translations[language].departmentDeleted, true);
    } catch (error) {
      showMessage(error.message);
    }
  }
});

document.querySelector("#footer-year").textContent = new Date().getFullYear();
document.querySelector("#announcement-date").value = new Date().toISOString().slice(0, 10);

function applyLanguage(nextLanguage) {
  language = nextLanguage;
  const text = translations[language];
  document.documentElement.lang = language;
  document.querySelectorAll(".language-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.language === language);
  });
  document.querySelector("#signin-toggle").textContent = currentAdmin ? text.manage : text.signin;
  document.querySelector("#logout-admin").textContent = text.signout;
  document.querySelector("#signin-title").textContent = text.signinTitle;
  document.querySelector("#signin-description").textContent = text.signinDescription;
  document.querySelector("#signin-form label:nth-of-type(1) span").textContent = text.username;
  document.querySelector("#signin-form label:nth-of-type(2) span").textContent = text.password;
  document.querySelector(".signin-submit").textContent = text.login;
  const navLinks = document.querySelectorAll(".main-nav a");
  navLinks[0].textContent = text.navHome;
  navLinks[1].textContent = text.navAnnouncements;
  navLinks[2].textContent = text.navDepartments;
  document.querySelector("#annonces .eyebrow").textContent = text.announcementEyebrow;
  document.querySelector("#annonces h2").textContent = text.announcementTitle;
  document.querySelector("#departements .eyebrow").textContent = text.departmentEyebrow;
  document.querySelector("#departements h2").textContent = text.departmentTitle;
  document.querySelector('[data-category="all"]').textContent = text.all;
  document.querySelector('[data-category="general"]').textContent = text.general;
  document.querySelector('[data-category="department"]').textContent = text.department;
  document.querySelector("#show-all-announcements").innerHTML = `${escapeHtml(text.showAll)} <span aria-hidden="true">→</span>`;
  document.querySelector("#manage-title").textContent = text.manage;
  document.querySelector(".manage-header .eyebrow").textContent = text.manageEyebrow;
  document.querySelectorAll(".manage-card")[0].querySelector(".eyebrow").textContent = text.announcementManageEyebrow;
  document.querySelectorAll(".manage-card")[1].querySelector(".eyebrow").textContent = text.departmentManageEyebrow;

  const announcementFields = document.querySelectorAll("#announcement-form .field > span");
  [text.titleLabel, text.contentLabel, text.dateLabel, text.categoryLabel, text.departmentFieldLabel]
    .forEach((label, index) => { if (announcementFields[index]) announcementFields[index].textContent = label; });
  const departmentFields = document.querySelectorAll("#department-form .field > span");
  departmentFields[0].textContent = text.departmentNameLabel;
  departmentFields[1].textContent = text.contentLabel;

  const categoryOptions = document.querySelectorAll("#announcement-category option");
  categoryOptions[0].textContent = text.generalOption;
  categoryOptions[1].textContent = text.departmentOption;
  document.querySelector("#cancel-announcement-edit").textContent = text.cancel;
  document.querySelector("#cancel-department-edit").textContent = text.cancel;
  document.querySelector("#announcement-form .primary-button").textContent =
    editingAnnouncementId ? text.save : text.publish;
  document.querySelector("#department-form .primary-button").textContent =
    editingDepartmentId ? text.save : text.add;
  document.querySelector("#announcement-form-title").textContent = editingAnnouncementId
    ? `${text.edit} ${text.announcementLabel.toLowerCase()}`
    : text.announcementLabel;
  document.querySelector("#department-form-title").textContent = editingDepartmentId
    ? `${text.edit} ${text.departmentLabel.toLowerCase()}`
    : text.departmentLabel;

  document.querySelector("#hero-title").innerHTML = text.heroWelcome;
  document.querySelector("[data-hero-kicker]").textContent = text.heroKicker;
  document.querySelector("[data-hero-description]").textContent = text.heroDescription;
  document.querySelector("[data-hero-action]").childNodes[0].textContent =
    `${text.heroAnnouncementsButton} `;
  document.querySelector("[data-hero-secondary]").textContent = text.heroDepartmentsButton;
  document.querySelectorAll(".hero-facts > div").forEach((item, index) => {
    item.querySelector("strong").textContent = text.heroFacts[index][0];
    item.querySelector("small").textContent = text.heroFacts[index][1];
  });
  document.querySelectorAll(".brand strong").forEach((item) => { item.textContent = text.brandTitle; });
  document.querySelectorAll(".brand small").forEach((item) => { item.textContent = text.brandSubtitle; });
  document.querySelectorAll("[data-stat]").forEach((item) => {
    const key = item.dataset.stat;
    const values = {
      departments: text.statDepartments,
      announcements: text.statAnnouncements,
      categories: text.statCategories,
      motto: text.motto,
    };
    item.textContent = values[key];
  });
  document.querySelector(".site-footer > p").innerHTML =
    `© ${new Date().getFullYear()} ${escapeHtml(text.footer)}`;
  renderAnnouncements();
  renderAdminLists();
  renderRoutePage();
  localStorage.setItem("faculty-language", language);
}

document.querySelectorAll(".language-button").forEach((button) => {
  button.addEventListener("click", () => applyLanguage(button.dataset.language));
});

function openSignin() {
  document.querySelector("#signin-modal").hidden = false;
  document.querySelector("#signin-username").focus();
}

function closeSignin() {
  document.querySelector("#signin-modal").hidden = true;
  document.querySelector("#signin-message").hidden = true;
  document.querySelector("#signin-form").reset();
}

document.querySelector("#signin-toggle").addEventListener("click", () => {
  if (currentAdmin) openManagePanel();
  else openSignin();
});
document.querySelector("#close-signin").addEventListener("click", closeSignin);
document.querySelector("#signin-modal").addEventListener("click", (event) => {
  if (event.target.id === "signin-modal") closeSignin();
});

document.querySelector("#signin-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.querySelector("#signin-message");
  message.hidden = true;
  try {
    const data = await request("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: document.querySelector("#signin-username").value.trim(),
        password: document.querySelector("#signin-password").value,
      }),
    });
    currentAdmin = data.admin;
    closeSignin();
    applyLanguage(language);
    openManagePanel();
  } catch (error) {
    message.textContent = error.message;
    message.classList.remove("success");
    message.hidden = false;
  }
});

document.querySelector("#logout-admin").addEventListener("click", async () => {
  try {
    await request("/api/logout", { method: "POST", body: "{}" });
  } finally {
    currentAdmin = null;
    closeManagePanel();
    applyLanguage(language);
  }
});

async function restoreAdminSession() {
  try {
    const data = await request("/api/me");
    currentAdmin = data.admin;
  } catch (_) {
    currentAdmin = null;
  }
  applyLanguage(language);
}

const savedLanguage = localStorage.getItem("faculty-language");
if (savedLanguage === "en" || savedLanguage === "fr") language = savedLanguage;
if (/^\/(?:announcements(?:\/\d+)?|departments(?:\/\d+)?)\/?$/.test(window.location.pathname)) {
  document.querySelector("#home-content").hidden = true;
  document.querySelector("#detail-view").hidden = false;
  document.querySelector("#detail-view").innerHTML =
    `<section class="detail-page"><p class="empty-state">${escapeHtml(translations[language].detailLoading)}</p></section>`;
}
loadContent().catch((error) => {
  if (!document.querySelector("#detail-view").hidden) {
    document.querySelector("#detail-view").innerHTML =
      `<section class="detail-page"><p class="empty-state">${escapeHtml(error.message)}</p></section>`;
    return;
  }
  showMessage(error.message);
});
restoreAdminSession();
