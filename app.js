/* =========================
   GLOBAL STATE
========================= */

let currentUser = null;

let db = {
  accounts: [],
  departments: [],
  employees: [],
  requests: []
};

const STORAGE_KEY = "ipt_demo_v1";

/* =========================
   DOM ELEMENTS (FIXED)
========================= */

const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");

const regFirst = document.getElementById("reg-first");
const regLast = document.getElementById("reg-last");
const regEmail = document.getElementById("reg-email");
const regPassword = document.getElementById("reg-password");

const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");

const profilePage = document.getElementById("profile-page");
const accountsPage = document.getElementById("accounts-page");
const departmentsPage = document.getElementById("departments-page");
const employeesPage = document.getElementById("employees-page");
const requestsPage = document.getElementById("requests-page");

/* =========================
   STORAGE FUNCTIONS
========================= */

function loadFromStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    try {
      db = JSON.parse(stored);
      return;
    } catch (e) {
      console.log("Storage corrupted, resetting...");
    }
  }

  // Default Data
  db = {
    accounts: [
      {
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        password: "Password123!",
        role: "admin",
        verified: true
      }
    ],
    departments: [
      { id: 1, name: "Engineering", description: "Engineering Department" },
      { id: 2, name: "HR", description: "Human Resources" }
    ],
    employees: [],
    requests: []
  };

  saveToStorage();
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

/* =========================
   ROUTING SYSTEM
========================= */

function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRouting() {
  let hash = window.location.hash || "#/";

  document.querySelectorAll(".page").forEach(p =>
    p.classList.remove("active")
  );

  const routeMap = {
    "#/": "home-page",
    "#/login": "login-page",
    "#/register": "register-page",
    "#/verify-email": "verify-email-page",
    "#/profile": "profile-page",
    "#/accounts": "accounts-page",
    "#/departments": "departments-page",
    "#/employees": "employees-page",
    "#/requests": "requests-page"
  };

  if (!routeMap[hash]) return navigateTo("#/");

  // Block pages if not logged in
  if (
    !currentUser &&
    ["#/profile", "#/accounts", "#/departments", "#/employees", "#/requests"].includes(hash)
  ) {
    return navigateTo("#/login");
  }

  // Block admin pages if not admin
  if (
    ["#/accounts", "#/departments", "#/employees"].includes(hash) &&
    currentUser?.role !== "admin"
  ) {
    return navigateTo("#/");
  }

  document.getElementById(routeMap[hash]).classList.add("active");

  // Render pages
  if (hash === "#/profile") renderProfile();
  if (hash === "#/accounts") renderAccounts();
  if (hash === "#/departments") renderDepartments();
  if (hash === "#/employees") renderEmployees();
  if (hash === "#/requests") renderRequests();
}

window.addEventListener("hashchange", handleRouting);

/* =========================
   AUTH SYSTEM
========================= */

function setAuthState(isAuth, user = null) {
  currentUser = isAuth ? user : null;

  document.body.classList.toggle("authenticated", isAuth);
  document.body.classList.toggle("not-authenticated", !isAuth);
  document.body.classList.toggle("is-admin", user?.role === "admin");
}

function logout() {
  localStorage.removeItem("auth_token");
  setAuthState(false);
  navigateTo("#/");
}

/* =========================
   REGISTER
========================= */

registerForm.addEventListener("submit", e => {
  e.preventDefault();

  if (regPassword.value.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  if (db.accounts.find(a => a.email === regEmail.value)) {
    alert("Email already exists.");
    return;
  }

  db.accounts.push({
    firstName: regFirst.value,
    lastName: regLast.value,
    email: regEmail.value,
    password: regPassword.value,
    role: "user",
    verified: false
  });

  saveToStorage();

  localStorage.setItem("unverified_email", regEmail.value);

  alert("Registered! Please verify email.");
  navigateTo("#/verify-email");
});

/* =========================
   EMAIL VERIFICATION
========================= */

function simulateVerification() {
  const email = localStorage.getItem("unverified_email");

  const acc = db.accounts.find(a => a.email === email);

  if (acc) {
    acc.verified = true;
    saveToStorage();
    alert("Email Verified! You can now login.");
  }

  navigateTo("#/login");
}

/* =========================
   LOGIN
========================= */

loginForm.addEventListener("submit", e => {
  e.preventDefault();

  const user = db.accounts.find(
    a =>
      a.email === loginEmail.value &&
      a.password === loginPassword.value &&
      a.verified
  );

  if (!user) {
    alert("Invalid credentials or email not verified.");
    return;
  }

  localStorage.setItem("auth_token", user.email);

  setAuthState(true, user);

  alert("Login successful!");
  navigateTo("#/profile");
});

/* =========================
   PROFILE PAGE
========================= */

function renderProfile() {
  if (!currentUser) return;

  profilePage.innerHTML = `
    <h2>Profile</h2>
    <p><strong>Name:</strong> ${currentUser.firstName} ${currentUser.lastName}</p>
    <p><strong>Email:</strong> ${currentUser.email}</p>
    <p><strong>Role:</strong> ${currentUser.role}</p>
  `;
}

/* =========================
   ACCOUNTS PAGE (ADMIN)
========================= */

function renderAccounts() {
  accountsPage.innerHTML = `
    <h2>Accounts</h2>
    <table>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
        <th>Verified</th>
        <th>Action</th>
      </tr>

      ${db.accounts
        .map(
          a => `
        <tr>
          <td>${a.firstName} ${a.lastName}</td>
          <td>${a.email}</td>
          <td>${a.role}</td>
          <td>${a.verified ? "✔" : "—"}</td>
          <td>
            <button onclick="deleteAccount('${a.email}')">Delete</button>
          </td>
        </tr>
      `
        )
        .join("")}
    </table>
  `;
}

function deleteAccount(email) {
  if (email === currentUser.email) {
    alert("You cannot delete yourself.");
    return;
  }

  db.accounts = db.accounts.filter(a => a.email !== email);
  saveToStorage();
  renderAccounts();
}

/* =========================
   DEPARTMENTS PAGE
========================= */

function renderDepartments() {
  departmentsPage.innerHTML = `
    <h2>Departments</h2>
    <ul>
      ${db.departments
        .map(d => `<li><strong>${d.name}</strong> - ${d.description}</li>`)
        .join("")}
    </ul>
  `;
}

/* =========================
   EMPLOYEES PAGE
========================= */

function renderEmployees() {
  employeesPage.innerHTML = `
    <h2>Employees</h2>
    <p>No employees yet.</p>
  `;
}

/* =========================
   REQUESTS PAGE
========================= */

function renderRequests() {
  if (!currentUser) return;

  const my = db.requests.filter(r => r.employeeEmail === currentUser.email);

  requestsPage.innerHTML = `
    <h2>My Requests</h2>

    <button onclick="addRequest()">+ New Request</button>

    <table>
      <tr>
        <th>Type</th>
        <th>Status</th>
        <th>Date</th>
      </tr>

      ${my
        .map(
          r => `
        <tr>
          <td>${r.type}</td>
          <td>${r.status}</td>
          <td>${r.date}</td>
        </tr>
      `
        )
        .join("")}
    </table>
  `;
}

function addRequest() {
  const type = prompt("Enter Request Type (Equipment/Leave/Resources)");

  if (!type) return;

  db.requests.push({
    type,
    status: "Pending",
    date: new Date().toLocaleDateString(),
    employeeEmail: currentUser.email
  });

  saveToStorage();
  renderRequests();
}

/* =========================
   INIT SYSTEM
========================= */

function init() {
  loadFromStorage();

  const token = localStorage.getItem("auth_token");

  if (token) {
    const user = db.accounts.find(a => a.email === token);
    if (user) setAuthState(true, user);
  }

  if (!window.location.hash) navigateTo("#/");
  handleRouting();
}

/* Run after page fully loads */
document.addEventListener("DOMContentLoaded", () => {
  init();
});
