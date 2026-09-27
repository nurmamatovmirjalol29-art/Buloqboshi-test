/* ============================================================
   ADMIN PANEL — Buloqboshi MFY
   Google Maps versiyasi
   ============================================================ */

const $ = (sel) => document.querySelector(sel);

let adminPassword = localStorage.getItem("admin_pass") || "";
let allStories = [];
let allPlaces = [];
let currentTab = "pending";
let currentPlaceTab = "list";
let currentMainTab = "stories";

let placeMap = null;
let placeMarker = null;

/* ---------- API ---------- */

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": adminPassword,
      ...(opts.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Xatolik");
  return data;
}

/* ---------- LOGIN ---------- */

async function login(pass) {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: pass })
  });
  if (!res.ok) throw new Error("Parol noto'g'ri");
  return true;
}

$("#loginBtn").addEventListener("click", async () => {
  const pass = $("#password").value.trim();
  const errEl = $("#loginErr");
  errEl.textContent = "";

  if (!pass) { errEl.textContent = "Parolni kiriting"; return; }

  try {
    await login(pass);
    adminPassword = pass;
    localStorage.setItem("admin_pass", pass);
    showPanel();
  } catch (e) {
    errEl.textContent = e.message;
  }
});

$("#password").addEventListener("keypress", (e) => {
  if (e.key === "Enter") $("#loginBtn").click();
});

$("#logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("admin_pass");
  adminPassword = "";
  $("#loginScreen").hidden = false;
  $("#panelScreen").hidden = true;
  $("#password").value = "";
});

/* ---------- PANEL ---------- */

async function showPanel() {
  $("#loginScreen").hidden = true;
  $("#panelScreen").hidden = false;
  await loadStories();
  await loadPlaces();
}

/* ============================================================
   ASOSIY TAB'LAR
   ============================================================ */

document.querySelectorAll("[data-main]").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("[data-main]").forEach(t => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    currentMainTab = tab.dataset.main;

    const storiesSection = $("#storiesSection");
    const placesSection = $("#placesSection");
    const usersSection = $("#usersSection");

    storiesSection.hidden = currentMainTab !== "stories";
    placesSection.hidden = currentMainTab !== "places";
    usersSection.hidden = currentMainTab !== "users";

    if (currentMainTab === "users") loadUsers();
  });
});

/* ============================================================
   HIKOYALAR
   ============================================================ */

async function loadStories() {
  try {
    allStories = await api("/api/admin/stories");
    updateStats();
    renderStories();
  } catch (e) {
    if (e.message.includes("Ruxsat")) {
      localStorage.removeItem("admin_pass");
      location.reload();
    } else {
      console.warn(e.message);
    }
  }
}

function updateStats() {
  $("#stTotal").textContent = allStories.length;
  $("#stPending").textContent = allStories.filter(s => !s.approved).length;
  $("#stApproved").textContent = allStories.filter(s => s.approved).length;
}

function sanaFormat(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const oylar = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
  return `${d.getDate()} ${oylar[d.getMonth()]}, ${d.getFullYear()} · ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function renderStories() {
  const list = $("#list");
  let items = allStories;
  if (currentTab === "pending") items = allStories.filter(s => !s.approved);
  if (currentTab === "approved") items = allStories.filter(s => s.approved);

  if (items.length === 0) {
    list.innerHTML = `<div class="empty">
      <p style="font-size:3rem">📭</p>
      <p>Bu bo'limda hozircha hikoya yo'q.</p>
    </div>`;
    return;
  }

  list.innerHTML = items.map(s => `
    <div class="story ${s.approved ? "is-approved" : "is-pending"}">
      <div class="story__head">
        <div>
          <div class="story__name">${escapeHtml(s.ism)}</div>
          <div class="story__meta">
            <span>${sanaFormat(s.sana)}</span>
            ${s.email ? `<span>✉ ${escapeHtml(s.email)}</span>` : ""}
          </div>
        </div>
        <span class="badge ${s.approved ? "badge--approved" : "badge--pending"}">
          ${s.approved ? "Tasdiqlangan" : "Kutilmoqda"}
        </span>
      </div>
      <p class="story__text">${escapeHtml(s.matn)}</p>
      ${s.rasm ? `<div style="margin:12px 0;max-width:300px;border-radius:12px;overflow:hidden;border:1px solid #e2d9cb">
        <img src="${s.rasm}" alt="Rasm" style="width:100%;display:block">
      </div>` : ""}
      <div class="story__actions">
        ${!s.approved ? `<button class="btn btn--ok" data-approve="${s.id}"><svg class="icon" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Tasdiqlash</button>` : ""}
        <button class="btn btn--danger" data-delete="${s.id}"><svg class="icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg> O'chirish</button>
      </div>
    </div>
  `).join("");
}

document.querySelectorAll("[data-tab]").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach(t => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    currentTab = tab.dataset.tab;
    renderStories();
  });
});

$("#list").addEventListener("click", async (e) => {
  const approveId = e.target.dataset.approve;
  const deleteId = e.target.dataset.delete;

  if (approveId) {
    try {
      await api(`/api/admin/stories/${approveId}/approve`, { method: "POST" });
      await loadStories();
    } catch (err) { alert(err.message); }
  }

  if (deleteId) {
    if (!confirm("Rostdan ham o'chirmoqchimisiz?")) return;
    try {
      await api(`/api/admin/stories/${deleteId}`, { method: "DELETE" });
      await loadStories();
    } catch (err) { alert(err.message); }
  }
});

/* ============================================================
   JOYLAR
   ============================================================ */

async function loadPlaces() {
  try {
    allPlaces = await api("/api/admin/places");
    renderPlaces();
  } catch (e) {
    console.warn("Joylar yuklanmadi:", e.message);
  }
}

function renderPlaces() {
  const listEl = $("#placesList");
  const formEl = $("#placeForm");
  if (!listEl || !formEl) return;

  if (currentPlaceTab === "add") {
    listEl.hidden = true;
    formEl.hidden = false;
    return;
  }

  listEl.hidden = false;
  formEl.hidden = true;

  if (allPlaces.length === 0) {
    listEl.innerHTML = `<div class="empty">
      <p style="font-size:3rem">🏘️</p>
      <p>Hozircha joylar yo'q.</p>
      <p style="margin-top:8px">"Yangi joy qo'shish" tugmasini bosing.</p>
    </div>`;
    return;
  }

  listEl.innerHTML = allPlaces.map(p => `
    <div class="place-card">
      <div class="place-card__img" ${p.rasm ? `style="background-image:url('${p.rasm}')"` : ""}></div>
      <div class="place-card__info">
        <div class="place-card__name">${escapeHtml(p.nom)}</div>
        <div class="place-card__meta">${escapeHtml(p.turi)} · ${escapeHtml(p.manzil || "—")}</div>
        <div class="place-card__meta">📍 ${p.lat}, ${p.lng}</div>
      </div>
      <button class="btn btn--danger" data-deleteplace="${p.id}"><svg class="icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg> O'chirish</button>
    </div>
  `).join("");
}

document.querySelectorAll("[data-placetab]").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("[data-placetab]").forEach(t => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    currentPlaceTab = tab.dataset.placetab;
    renderPlaces();

    if (currentPlaceTab === "add") {
      setTimeout(() => {
        initPlaceMap();
        if (placeMap && placeMarker) {
          google.maps.event.trigger(placeMap, "resize");
          placeMap.setCenter(placeMarker.getPosition());
        }
      }, 200);
    }
  });
});

/* ---------- TUR TANLASH ---------- */

/* ---------- TUR TANLASH ---------- */

const turiSelect = document.getElementById("turiSelect");
const customTypeField = document.getElementById("customTypeField");
const turiCustomInput = document.getElementById("turiCustomInput");

if (turiSelect && customTypeField && turiCustomInput) {
  // Boshlang'ich: yopiq
  customTypeField.style.display = "none";

  turiSelect.addEventListener("change", () => {
    if (turiSelect.value === "__other__") {
      // Ochish
      customTypeField.style.display = "block";
      turiCustomInput.focus();
    } else {
      // Yopish
      customTypeField.style.display = "none";
      turiCustomInput.value = "";
    }
  });
}

/* ============================================================
   GOOGLE MAPS — JOY TANLASH
   ============================================================ */

function initPlaceMap() {
  const mapEl = document.getElementById("placeMap");
  if (!mapEl || placeMap) return;

  if (typeof google === "undefined" || !google.maps) {
    console.error("Google Maps yuklanmagan");
    mapEl.innerHTML = `<div style="padding:20px;text-align:center;color:var(--ink-soft)">
      Xarita yuklanmadi. Internet aloqasini tekshiring.
    </div>`;
    return;
  }

  const startPos = { lat: 39.6485, lng: 65.9761 };

  placeMap = new google.maps.Map(mapEl, {
    center: startPos,
    zoom: 14,
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true
  });

  placeMarker = new google.maps.Marker({
    position: startPos,
    map: placeMap,
    draggable: true,
    animation: google.maps.Animation.DROP,
    title: "Joyni bu yerga qo'ying"
  });

  function updateCoords(lat, lng) {
    const latInput = document.getElementById("latInput");
    const lngInput = document.getElementById("lngInput");
    const latDisplay = document.getElementById("latDisplay");
    const lngDisplay = document.getElementById("lngDisplay");

    if (latInput) latInput.value = lat.toFixed(6);
    if (lngInput) lngInput.value = lng.toFixed(6);
    if (latDisplay) latDisplay.textContent = lat.toFixed(6);
    if (lngDisplay) lngDisplay.textContent = lng.toFixed(6);
  }

  // Xaritani bosganda marker ko'chirish
  placeMap.addListener("click", (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    placeMarker.setPosition({ lat, lng });
    updateCoords(lat, lng);
  });

  // Markerni sudrab tashlaganda
  placeMarker.addListener("dragend", (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    updateCoords(lat, lng);
  });
}

/* ---------- Joy qo'shish ---------- */

const placeForm = $("#placeForm");
if (placeForm) {
  placeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const turiValue = turiSelect.value;
    let finalTuri = turiValue;

    if (turiValue === "__other__") {
      const customVal = turiCustomInput.value.trim();
      if (!customVal) {
        alert("Iltimos, yangi tur nomini kiriting");
        turiCustomInput.focus();
        return;
      }
      finalTuri = customVal;
    }

    const fd = new FormData(placeForm);
    fd.set("turi", finalTuri);

    const submitBtn = placeForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Yuborilmoqda...";

    try {
      const res = await fetch("/api/admin/places", {
        method: "POST",
        headers: { "x-admin-password": adminPassword },
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xatolik");

      placeForm.reset();

      if (customTypeField) customTypeField.hidden = true;
      if (turiCustomInput) turiCustomInput.required = false;

      // Koordinatalarni qayta o'rnatish
      document.getElementById("latInput").value = "39.6485";
      document.getElementById("lngInput").value = "65.9761";
      document.getElementById("latDisplay").textContent = "39.6485";
      document.getElementById("lngDisplay").textContent = "65.9761";

      if (placeMarker) placeMarker.setPosition({ lat: 39.6485, lng: 65.9761 });
      if (placeMap) placeMap.setCenter({ lat: 39.6485, lng: 65.9761 });

      alert("✓ Joy muvaffaqiyatli qo'shildi!");
      await loadPlaces();

      document.querySelectorAll("[data-placetab]").forEach(t => t.classList.remove("is-active"));
      document.querySelector('[data-placetab="list"]').classList.add("is-active");
      currentPlaceTab = "list";
      renderPlaces();

    } catch (err) {
      alert("✗ " + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Joyni qo'shish";
    }
  });
}

/* ---------- Joy o'chirish ---------- */

$("#placesList").addEventListener("click", async (e) => {
  const deleteId = e.target.dataset.deleteplace;
  if (!deleteId) return;
  if (!confirm("Rostdan ham o'chirmoqchimisiz?")) return;

  try {
    await api(`/api/admin/places/${deleteId}`, { method: "DELETE" });
    await loadPlaces();
  } catch (err) {
    alert(err.message);
  }
});

/* ============================================================
   FOYDALANUVCHILAR
   ============================================================ */

let allUsers = [];

async function loadUsers() {
  try {
    allUsers = await api("/api/admin/users");
    renderUsers();
  } catch (e) {
    console.warn("Foydalanuvchilar yuklanmadi:", e.message);
  }
}

function renderUsers() {
  const listEl = $("#usersList");
  const totalEl = $("#uTotal");
  if (!listEl) return;

  if (totalEl) totalEl.textContent = allUsers.length;

  if (allUsers.length === 0) {
    listEl.innerHTML = `<div class="empty">
      <p style="font-size:3rem">👤</p>
      <p>Hozircha hech kim hikoya yubormagan.</p>
    </div>`;
    return;
  }

  listEl.innerHTML = allUsers.map(u => `
    <div class="user-card">
      <div>
        <div class="user-card__email">${escapeHtml(u.email || "(email kiritilmagan)")}</div>
        <div class="user-card__meta">
          ${escapeHtml(u.ismlar.join(", "))} · oxirgi marta: ${sanaFormat(u.oxirgiSana)}
        </div>
      </div>
      <div class="user-card__stats">
        <span>📖 ${u.jami} ta hikoya</span>
        <span>✓ ${u.tasdiqlangan} ta tasdiqlangan</span>
      </div>
    </div>
  `).join("");
}

/* ============================================================
   TOMCHI EFFEKTI (RIPPLE)
   ============================================================ */

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn, .tab");
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.8;
  const ripple = document.createElement("span");
  ripple.className = "btn__ripple";
  ripple.style.width = ripple.style.height = size + "px";
  ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
  ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
  btn.style.position = btn.style.position || "relative";
  btn.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
});

/* ============================================================
   AUTO LOGIN
   ============================================================ */

(async () => {
  if (adminPassword) {
    try {
      await login(adminPassword);
      showPanel();
    } catch {
      localStorage.removeItem("admin_pass");
    }
  }
})();
/* ---------- CREATIV KURSOR ---------- */

(function initCustomCursor(){
  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  if (!dot || !ring) return;
  if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;

  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;

  window.addEventListener("mousemove", e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + "px";
    dot.style.top = mouseY + "px";
  });

  function loop(){
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.left = ringX + "px";
    ring.style.top = ringY + "px";
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  const hoverables = "a, button, input, textarea, label, .story, .place-card";
  document.addEventListener("mouseover", e => {
    if (e.target.closest(hoverables)) ring.classList.add("is-hover");
  });
  document.addEventListener("mouseout", e => {
    if (e.target.closest(hoverables)) ring.classList.remove("is-hover");
  });
})();
