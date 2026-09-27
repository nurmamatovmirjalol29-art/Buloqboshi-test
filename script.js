/* ============================================================
   BULOQBOSHI MAHALLA SAYTI — asosiy skript
   ============================================================ */

/* ---------- 1. MA'LUMOTLAR ---------- */

const JOYLAR = [
  {
    nom: "Buloqboshi MFY",
    turi: "hokimiyat",
    tavsif: "Mahalla fuqarolar yig'ini — mahallamizning markazi va boshqaruv idorasi.",
    manzil: "Buloqboshi MFY, Nurobod tumani",
    lat: 39.648472, lng: 65.976070,
    rasm: "https://i.imgur.com/41Y3Y0M.jpeg"
  },
  {
    nom: "Bog'cha",
    turi: "ilm",
    tavsif: "Yangi qurilgan zamonaviy bog'cha. Kichkintoylar uchun mo'ljallangan.",
    manzil: "Mahalla idorasi yonida",
    lat: 39.648230, lng: 65.976119,
    rasm: "https://i.imgur.com/vXuCKnD.jpeg"
  },
  {
    nom: "Oilaviy poliklinika",
    turi: "tibbiyot",
    tavsif: "Yangi qurilgan zamonaviy poliklinika. Mahalla aholisiga tibbiy xizmat ko'rsatadi.",
    manzil: "Mahalla idorasi yonida",
    lat: 39.648987, lng: 65.976482,
    rasm: "https://i.imgur.com/pY2cTOp.jpeg"
  },
  {
    nom: "Tez tibbiy yordam",
    turi: "tibbiyot",
    tavsif: "Shoshilinch tibbiy yordam punkti. Poliklinika hududida joylashgan.",
    manzil: "Poliklinika yonida",
    lat: 39.649050, lng: 65.976550,
    rasm: "https://i.imgur.com/AerrKbW.jpeg"
  },
  {
    nom: "53-maktab",
    turi: "ilm",
    tavsif: "Mahallamizning asosiy ilm maskani. Bir necha avlod shu yerda ta'lim olgan.",
    manzil: "Buloqboshi MFY",
    lat: 39.649962, lng: 65.974575,
    rasm: "https://i.imgur.com/ecqkRL0.jpeg"
  },
  {
    nom: "Futbol maydoni",
    turi: "dam",
    tavsif: "Bolalar va yoshlar uchun sport maydoni. Kechqurunlar futbol o'ynaladi.",
    manzil: "53-maktab yonida",
    lat: 39.650564, lng: 65.973327,
    rasm: "https://i.imgur.com/xZK5kPa.jpeg"
  },
  {
    nom: "Do'kon",
    turi: "savdo",
    tavsif: "Mahalladagi asosiy savdo nuqtasi. Kundalik ehtiyojlar uchun.",
    manzil: "Mahalla markazi",
    lat: 39.648448, lng: 65.977917,
    rasm: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80"
  },
  {
    nom: "Ziyod bobo to'ylar maskani",
    turi: "dam",
    tavsif: "To'y va tantanalar o'tkaziladigan maskan. Mahalla quvonchlari shu yerda.",
    manzil: "Buloqboshi MFY",
    lat: 39.646347, lng: 65.974989,
    rasm: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&q=80"
  },
  {
    nom: "Qishloq masjidi",
    turi: "ibodat",
    tavsif: "Mahallamizning qadimiy masjidi. Juma namozlari shu yerda o'qiladi.",
    manzil: "Buloqboshi MFY, shimoliy qismi",
    lat: 39.655557, lng: 65.978160,
    rasm: "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&q=80"
  },
  {
    nom: "Buloq (chashma)",
    turi: "tabiat",
    tavsif: "Mahalla nomi shu buloqdan kelib chiqqan. Sovuq va shirin suvi bilan mashhur.",
    manzil: "Qishloq chekkasi",
    lat: 39.657133, lng: 65.982137,
    rasm: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80"
  }
];

const TUR_NOMLARI = {
  ilm: "Ilm maskani",
  ibodat: "Ibodat",
  tibbiyot: "Tibbiyot",
  dam: "Dam olish",
  savdo: "Savdo",
  tabiat: "Tabiat",
  hokimiyat: "Hokimiyat"
};

/* ---------- 2. SANALARNI FORMATLASH ---------- */

function sanaFormat(iso){
  const oylar = ["yanvar","fevral","mart","aprel","may","iyun",
                 "iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${d.getDate()} ${oylar[d.getMonth()]}, ${d.getFullYear()}`;
}

/* ---------- 3. NAVIGATSIYA ---------- */

const nav = document.getElementById("nav");
const burger = document.getElementById("burger");
const navLinks = document.getElementById("navLinks");

if(nav && burger && navLinks){
  window.addEventListener("scroll", () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 20);
  });

  burger.addEventListener("click", () => {
    burger.classList.toggle("is-open");
    navLinks.classList.toggle("is-open");
  });

  navLinks.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      burger.classList.remove("is-open");
      navLinks.classList.remove("is-open");
    });
  });
}

/* ---------- 4. XARITA (Leaflet) ---------- */

function initMap(){
  const mapEl = document.getElementById("map");
  if(!mapEl) return;

  // Eski xaritani o'chirish (agar mavjud bo'lsa)
  if(window._leafletMap){
    window._leafletMap.remove();
  }

  const markaz = [39.6485, 65.9761];

  const map = L.map("map", {
    scrollWheelZoom: false,
    zoomControl: true
  }).setView(markaz, 14);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution: '© OpenStreetMap © CARTO',
    maxZoom: 19
  }).addTo(map);

  const icon = L.divIcon({
    className: "custom-pin",
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:#0e5c4a;border:3px solid #fff;
      box-shadow:0 4px 12px rgba(0,0,0,.35);
    "></div>`,
    iconSize: [18,18],
    iconAnchor: [9,9]
  });

  JOYLAR.forEach(j => {
    L.marker([j.lat, j.lng], { icon })
      .addTo(map)
      .bindPopup(`
        <h4>${j.nom}</h4>
        <p>${j.tavsif}</p>
      `);
  });

  L.circle(markaz, {
    radius: 800,
    color: "#0e5c4a",
    fillColor: "#0e5c4a",
    fillOpacity: 0.06,
    weight: 1.5,
    dashArray: "6 8"
  }).addTo(map);

  // Global saqlash
  window._leafletMap = map;
}

/* ---------- 5. JOYLAR KARTALARI + FILTR ---------- */

const cardsEl = document.getElementById("cards");
const filtersEl = document.getElementById("filters");

function cardHTML(j){
  const rasmBlok = j.rasm
    ? `<a href="${j.rasm}" class="glightbox" data-gallery="joylar" data-title="${j.nom}" data-description="${j.tavsif}">
         <div class="card__img" style="background-image:url('${j.rasm}')">
           <span class="card__tag">${TUR_NOMLARI[j.turi] || j.turi}</span>
         </div>
       </a>`
    : `<div class="card__img">
         <span class="card__tag">${TUR_NOMLARI[j.turi] || j.turi}</span>
       </div>`;

  return `
    <article class="card" data-tur="${j.turi}">
      ${rasmBlok}
      <div class="card__body">
        <h3 class="card__title">${j.nom}</h3>
        <p class="card__desc">${j.tavsif}</p>
        <div class="card__addr">${j.manzil}</div>
      </div>
    </article>
  `;
}

function renderCards(filter = "all"){
  if(!cardsEl) return;
  const list = filter === "all"
    ? JOYLAR
    : JOYLAR.filter(j => j.turi === filter);

  cardsEl.innerHTML = list.map(cardHTML).join("");

  if(list.length === 0){
    cardsEl.innerHTML = `<p style="color:var(--ink-soft);grid-column:1/-1;text-align:center;padding:40px 0">
      Bu turkumda hozircha joy yo'q.
    </p>`;
  }

  // Lightbox'ni yangilash
  refreshLightbox();
}

if(filtersEl){
  filtersEl.addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if(!chip) return;
    filtersEl.querySelectorAll(".chip").forEach(c => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    renderCards(chip.dataset.filter);
  });
}

/* ---------- 6. LAVHALAR ---------- */

const galleryEl = document.getElementById("gallery");

function postHTML(p){
  const rasmBlok = p.rasm
    ? `<a href="${p.rasm}" class="glightbox" data-gallery="lavhalar" data-title="${p.sarlavha}" data-description="${p.matn}">
         <div class="post__img" style="background-image:url('${p.rasm}')"></div>
       </a>`
    : `<div class="post__img"></div>`;

  return `
    <article class="post">
      ${rasmBlok}
      <div class="post__body">
        <h3 class="post__title">${p.sarlavha}</h3>
        <p class="post__text">${p.matn}</p>
        <div class="post__meta">
          <span>${p.muallif}</span>
          <span>${sanaFormat(p.sana)}</span>
        </div>
      </div>
    </article>
  `;
}

/* ---------- Lightbox ---------- */

let lightboxInstance = null;

function refreshLightbox(){
  if (typeof GLightbox === "undefined") return;
  if (lightboxInstance && lightboxInstance.destroy) {
    lightboxInstance.destroy();
  }
  lightboxInstance = GLightbox({
    selector: ".glightbox",
    touchNavigation: true,
    loop: true,
    zoomable: true,
    draggable: true
  });
}

/* ---------- 7. HIKOYA FORMASI ---------- */

const form = document.getElementById("form");
const formOk = document.getElementById("formOk");
const formErr = document.getElementById("formErr");
const submitBtn = document.getElementById("submitBtn");

function showError(name, msg){
  const field = document.querySelector(`[name="${name}"]`)?.closest(".field");
  const err = document.querySelector(`.error[data-for="${name}"]`);
  if(field) field.classList.add("has-error");
  if(err) err.textContent = msg || "";
}

function clearErrors(){
  document.querySelectorAll(".field").forEach(f => f.classList.remove("has-error"));
  document.querySelectorAll(".error").forEach(e => e.textContent = "");
}

if(form){
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    formOk.hidden = true;
    formErr.hidden = true;

    const ism = form.ism.value.trim();
    const email = form.email.value.trim();
    const matn = form.matn.value.trim();
    const rasmInput = form.rasm;
    let ok = true;

    if(ism.length < 2){ showError("ism","Ism kamida 2 harf bo'lishi kerak"); ok = false; }
    if(email && !/^\S+@\S+\.\S+$/.test(email)){ showError("email","Email formati noto'g'ri"); ok = false; }
    if(matn.length < 10){ showError("matn","Xotira kamida 10 belgi bo'lishi kerak"); ok = false; }

    if(rasmInput && rasmInput.files[0]){
      const f = rasmInput.files[0];
      if(f.size > 5 * 1024 * 1024){
        showError("rasm","Rasm hajmi 5 MB dan oshmasin");
        ok = false;
      }
    }

    if(!ok) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Yuborilmoqda...";

    try {
      const fd = new FormData();
      fd.append("ism", ism);
      fd.append("email", email);
      fd.append("matn", matn);
      if(rasmInput && rasmInput.files[0]){
        fd.append("rasm", rasmInput.files[0]);
      }

      const res = await fetch("/api/stories", {
        method: "POST",
        body: fd
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Xatolik yuz berdi");

      form.reset();
      const preview = document.getElementById("rasmPreview");
      if(preview){ preview.hidden = true; preview.innerHTML = ""; }

      formOk.textContent = "✓ " + (data.message || "Hikoyangiz qabul qilindi!");
      formOk.hidden = false;
      setTimeout(() => { formOk.hidden = true; }, 6000);

      await loadStoriesFromServer();

    } catch (err) {
      formErr.textContent = "✗ " + err.message;
      formErr.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Hikoyani yuborish";
    }
  });
}

// Rasm preview
const rasmInput = document.getElementById("rasm");
const rasmPreview = document.getElementById("rasmPreview");
if(rasmInput && rasmPreview){
  rasmInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    rasmPreview.innerHTML = "";
    if(!file){ rasmPreview.hidden = true; return; }
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    rasmPreview.appendChild(img);
    rasmPreview.hidden = false;
  });
}

/* ---------- Serverdan hikoyalarni yuklash ---------- */

async function loadStoriesFromServer(){
  if(!galleryEl) return;
  try {
    const res = await fetch("/api/stories");
    const serverStories = await res.json();

    if(serverStories.length === 0){
      galleryEl.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--ink-soft)">
          <p style="font-size:3rem;margin-bottom:16px">📖</p>
          <p style="font-size:1.1rem">Hozircha hikoyalar yo'q.</p>
          <p style="margin-top:8px">Birinchi bo'lib xotirangizni qoldiring!</p>
        </div>
      `;
      const statEl = document.getElementById("statXotira");
      if(statEl) statEl.textContent = "0";
      return;
    }

    const serverPosts = serverStories.map(s => ({
      sarlavha: s.ism,
      matn: s.matn,
      muallif: s.ism,
      sana: s.sana.slice(0, 10),
      rasm: s.rasm || ""
    }));

    galleryEl.innerHTML = serverPosts.map(postHTML).join("");

    const statEl = document.getElementById("statXotira");
    if(statEl) statEl.textContent = serverStories.length;

    refreshLightbox();

  } catch (e) {
    console.warn("Serverdan hikoyalarni olishda xatolik:", e.message);
  }
}

/* ---------- Serverdan joylarni yuklash ---------- */

async function loadPlacesFromServer(){
  try {
    const res = await fetch("/api/places");
    const serverPlaces = await res.json();

    if(serverPlaces.length === 0){
      return; // Serverda joylar yo'q — faqat JOYLAR massividagi ishlatiladi
    }

    // Serverdagi joylarni JOYLAR massiviga qo'shish
    serverPlaces.forEach(p => {
      JOYLAR.push({
        nom: p.nom,
        turi: p.turi,
        tavsif: p.tavsif,
        manzil: p.manzil,
        lat: p.lat,
        lng: p.lng,
        rasm: p.rasm
      });
    });

    // Kartalarni qayta render qilish
    if(cardsEl) renderCards();

    // Statistika yangilash
    const statJoyEl = document.getElementById("statJoy");
    if(statJoyEl) statJoyEl.textContent = JOYLAR.length;

    // Xaritani qayta yuklash
    initMap();

  } catch (e) {
    console.warn("Serverdan joylarni olishda xatolik:", e.message);
  }
}

/* ---------- 8. REVEAL ANIMATSIYA ---------- */

function initReveal(){
  const els = document.querySelectorAll(
    ".section__head, .map, .card, .post, .hikoya__text, .form"
  );
  els.forEach(el => el.classList.add("reveal"));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if(en.isIntersecting){
        en.target.classList.add("is-visible");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
}

/* ---------- 9. STATISTIKA ---------- */

function animateStat(el, target, duration = 1200){
  if(!el) return;
  const start = performance.now();
  const from = 0;
  function tick(t){
    const p = Math.min((t - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (target - from) * eased);
    if(p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function initStats(){
  animateStat(document.getElementById("statJoy"), JOYLAR.length);
  animateStat(document.getElementById("statYil"), 150, 1600);
  animateStat(document.getElementById("statXotira"), 0);
}

/* ---------- 10. FOOTER YIL ---------- */

const yilEl = document.getElementById("yil");
if(yilEl) yilEl.textContent = new Date().getFullYear();

/* ---------- 11. PWA ---------- */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(e => console.warn("SW:", e));
  });
}

/* ---------- 12. OFFLINE INDIKATOR ---------- */

function updateOnlineStatus() {
  const existing = document.querySelector(".offline-banner");
  if (!navigator.onLine && !existing) {
    const b = document.createElement("div");
    b.className = "offline-banner";
    b.textContent = "📴 Oflayn rejim";
    document.body.appendChild(b);
  } else if (navigator.onLine && existing) {
    existing.remove();
  }
}
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

/* ---------- 14. TOMCHI EFFEKTI (RIPPLE) ---------- */

function initRipple() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn, .chip");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.8;
    const ripple = document.createElement("span");
    ripple.className = "btn__ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
    ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });
}

/* ---------- 15. ISHGA TUSHIRISH ---------- */

document.addEventListener("DOMContentLoaded", () => {
  initMap();
  renderCards();
  initReveal();
  initStats();
  loadStoriesFromServer();
  loadPlacesFromServer();
  updateOnlineStatus();
  initRipple();
});
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

  const hoverables = "a, button, .chip, .card, input, textarea, label";
  document.addEventListener("mouseover", e => {
    if (e.target.closest(hoverables)) ring.classList.add("is-hover");
  });
  document.addEventListener("mouseout", e => {
    if (e.target.closest(hoverables)) ring.classList.remove("is-hover");
  });
})();
