// --- Mock data ---
const DB = {
  users: [{ username: "admin", password: "admin", name: "System Admin" }],
  employees: [
    { id: "E001", name: "Ann Lee", dept: "HR", title: "HR Manager", status: "Active" },
    { id: "E002", name: "Ravi Kumar", dept: "Finance", title: "Accountant", status: "Active" },
    { id: "E003", name: "Mia Chen", dept: "Engineering", title: "DevOps Engineer", status: "Active" },
    { id: "E004", name: "Luis Diaz", dept: "Sales", title: "AE", status: "On Leave" },
  ],
  leaves: [],
  payroll: [
    { period: "2025-11-15", lines: [
      "PAY STUB: 2025-11-15",
      "Employee: Ann Lee  (E001)",
      "Gross: $6,500.00",
      "Tax:   $1,350.00",
      "Net:   $5,150.00"
    ]},
    { period: "2025-11-30", lines: [
      "PAY STUB: 2025-11-30",
      "Employee: Ann Lee  (E001)",
      "Gross: $6,500.00",
      "Tax:   $1,350.00",
      "Net:   $5,150.00"
    ]}
  ]
};

// --- State ---
let currentUser = null;
const views = ["view-login","view-menu","view-directory","view-leave","view-payroll","view-settings","view-about"];

// --- Helpers ---
const $ = sel => document.querySelector(sel);
const $all = sel => Array.from(document.querySelectorAll(sel));
function show(viewId) {
  $all(".view").forEach(v => v.classList.remove("active"));
  $("#" + viewId).classList.add("active");
  // Focus first focusable
  const first = $("#" + viewId).querySelector("input, select, textarea, button, [role='menu']");
  if (first) first.focus();
}
function updateClock() {
  const d = new Date();
  $("#clock").textContent =
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
setInterval(updateClock, 1000);
updateClock();

// --- Login ---
$("#login-form").addEventListener("submit", e => {
  e.preventDefault();
  const u = $("#username").value.trim();
  const p = $("#password").value;
  const user = DB.users.find(x => x.username === u && x.password === p);
  if (!user) return toast("Invalid credentials", true);
  currentUser = user;
  toast(`Welcome ${user.name}`);
  show("view-menu");
});
$("#clear-login").addEventListener("click", () => {
  $("#username").value = ""; $("#password").value = ""; $("#username").focus();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && $("#view-login").classList.contains("active")) {
    $("#username").value = ""; $("#password").value = "";
  }
});

// --- Menu navigation ---
const menuList = $("#menu-list");
menuList.addEventListener("click", e => {
  const li = e.target.closest("li");
  if (!li) return;
  navigateMenuItem(li.dataset.target);
});
menuList.addEventListener("keydown", e => {
  const items = Array.from(menuList.querySelectorAll("li"));
  let idx = items.findIndex(i => i.classList.contains("active"));
  if (idx < 0) { items[0].classList.add("active"); return; }
  if (["ArrowDown","ArrowUp"].includes(e.key)) {
    e.preventDefault();
    items[idx].classList.remove("active");
    idx = e.key === "ArrowDown" ? Math.min(idx+1, items.length-1) : Math.max(idx-1, 0);
    items[idx].classList.add("active");
    items[idx].scrollIntoView({ block: "nearest" });
  }
  if (e.key === "Enter") {
    navigateMenuItem(items[idx].dataset.target);
  }
});
function navigateMenuItem(target) {
  if (target === "logout") { currentUser = null; show("view-login"); return; }
  show(target);
}

// --- Alt hotkeys ---
document.addEventListener("keydown", e => {
  if (!e.altKey) return;
  const map = { e:"view-directory", l:"view-leave", p:"view-payroll", s:"view-settings", a:"view-about", q:"logout" };
  const key = e.key.toLowerCase();
  if (map[key]) { e.preventDefault(); navigateMenuItem(map[key]); }
});

// --- Directory ---
function renderDirectory(rows) {
  const tbody = $("#dir-rows");
  tbody.innerHTML = rows.map(r => `
    <tr tabindex="0" data-id="${r.id}">
      <td>${r.id}</td><td>${r.name}</td><td>${r.dept}</td><td>${r.title}</td><td>${r.status}</td>
    </tr>
  `).join("");
}
renderDirectory(DB.employees);

$("#dir-search").addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  const rows = DB.employees.filter(r =>
    [r.id, r.name, r.dept, r.title, r.status].some(v => String(v).toLowerCase().includes(q))
  );
  renderDirectory(rows);
});

$("#dir-rows").addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  const tr = e.target.closest("tr");
  const id = tr?.dataset.id;
  const emp = DB.employees.find(x => x.id === id);
  if (!emp) return;
  openModal(`Open record ${emp.name} (${emp.id})?`, () => toast(`Opened ${emp.name}`));
});

// --- Leave requests ---
$("#leave-form").addEventListener("submit", e => {
  e.preventDefault();
  const item = {
    user: currentUser?.username || "admin",
    type: $("#leave-type").value,
    start: $("#leave-start").value,
    end: $("#leave-end").value,
    notes: $("#leave-notes").value.trim(),
    id: "L" + String(DB.leaves.length + 1).padStart(3,"0"),
    status: "Submitted"
  };
  DB.leaves.unshift(item);
  renderLeaves();
  toast("Leave submitted");
  e.target.reset();
});
function renderLeaves() {
  $("#leave-list").innerHTML = DB.leaves.map(l => `
    <li>
      <strong>${l.id}</strong> ${l.type} ${l.start} → ${l.end} — ${l.status}
      ${l.notes ? `<div class="help">${l.notes}</div>` : ""}
    </li>
  `).join("");
}
renderLeaves();

// --- Payroll ---
function renderPayPeriods() {
  const sel = $("#pay-period");
  sel.innerHTML = DB.payroll.map(p => `<option>${p.period}</option>`).join("");
  if (DB.payroll.length) sel.value = DB.payroll[0].period;
  renderStub();
}
function renderStub() {
  const period = $("#pay-period").value;
  const p = DB.payroll.find(x => x.period === period);
  $("#pay-stub").textContent = (p?.lines || ["No stub"]).join("\n");
}
$("#pay-period").addEventListener("change", renderStub);
$("#pay-print").addEventListener("click", () => window.print());
renderPayPeriods();

// --- Settings ---
$("#save-settings").addEventListener("click", () => {
  const theme = $("#theme").value;
  document.body.classList.remove("theme-amber","theme-gray");
  if (theme === "amber") document.body.classList.add("theme-amber");
  if (theme === "gray") document.body.classList.add("theme-gray");
  $("#crt-overlay").style.opacity = $("#scanlines").checked ? "0.5" : "0";
  toast("Settings saved");
});

// --- Back buttons ---
$all("[data-back]").forEach(b => b.addEventListener("click", () => show("view-menu")));

// --- Modal and toast ---
function openModal(message, onOk) {
  $("#modal-message").textContent = message;
  $("#modal").hidden = false;
  $("#modal-ok").onclick = () => { $("#modal").hidden = true; onOk?.(); };
  $("#modal-cancel").onclick = () => { $("#modal").hidden = true; };
}
function toast(msg, danger=false) {
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.position = "fixed";
  t.style.right = "8px"; t.style.bottom = "8px";
  t.style.border = "2px solid " + (danger ? "var(--danger)" : "var(--border)");
  t.style.padding = "6px 10px";
  t.style.background = "#001a0f";
  t.style.color = "var(--fg)";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
