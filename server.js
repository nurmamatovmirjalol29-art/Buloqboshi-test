import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import multer from "multer";
import dotenv from "dotenv";
import { pool, initDb } from "./db.js";
import { hasCloudinary, uploadBuffer, deleteByPublicId } from "./cloudinary.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "buloqboshi2025";

const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// Multer sozlash (rasm yuklash uchun)
// Cloudinary sozlangan bo'lsa — xotirada saqlab, keyin bulutga yuboramiz.
// Aks holda — eskisidek diskka saqlaymiz (masalan mahalliy test uchun).
const storage = hasCloudinary
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOADS_DIR),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + ext;
        cb(null, uniqueName);
      }
    });

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Faqat rasm fayllari (jpg, png, webp, gif) qabul qilinadi"));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(UPLOADS_DIR));

// Rate limit
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Juda ko'p so'rov. Bir daqiqadan keyin urinib ko'ring." }
});

function authMiddleware(req, res, next) {
  const pass = req.headers["x-admin-password"] || req.query.password;
  if (pass !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Ruxsat yo'q" });
  }
  next();
}

// Har bir async route handlerdagi xatoni ushlash uchun kichik yordamchi
function asyncRoute(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

// ============ STORIES API ============

// Barcha tasdiqlangan hikoyalar (ommaviy)
app.get("/api/stories", asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM stories WHERE approved = true ORDER BY sana DESC"
  );
  res.json(rows);
}));

// Yangi hikoya qo'shish
app.post("/api/stories", limiter, upload.single("rasm"), asyncRoute(async (req, res) => {
  const { ism, email, matn } = req.body || {};

  if (!ism || ism.trim().length < 2) {
    if (req.file && req.file.path) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Ism kamida 2 harf bo'lishi kerak" });
  }
  if (!matn || matn.trim().length < 10) {
    if (req.file && req.file.path) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Xotira kamida 10 belgi bo'lishi kerak" });
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    if (req.file && req.file.path) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Email formati noto'g'ri" });
  }

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  let rasm = "";
  let rasmPublicId = "";

  if (req.file) {
    if (hasCloudinary) {
      const result = await uploadBuffer(req.file.buffer, "buloqboshi/hikoyalar");
      rasm = result.secure_url;
      rasmPublicId = result.public_id;
    } else {
      rasm = "/uploads/" + req.file.filename;
    }
  }

  await pool.query(
    `INSERT INTO stories (id, ism, email, matn, sana, approved, rasm, rasm_public_id)
     VALUES ($1, $2, $3, $4, now(), false, $5, $6)`,
    [
      id,
      ism.trim().slice(0, 60),
      email ? email.trim().slice(0, 80) : "",
      matn.trim().slice(0, 2000),
      rasm,
      rasmPublicId
    ]
  );

  res.json({ ok: true, message: "Hikoyangiz qabul qilindi. Moderatsiyadan keyin chiqadi." });
}));

// ============ STORIES ADMIN API ============

app.get("/api/admin/stories", authMiddleware, asyncRoute(async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM stories ORDER BY sana DESC");
  res.json(rows);
}));

app.post("/api/admin/stories/:id/approve", authMiddleware, asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    "UPDATE stories SET approved = true WHERE id = $1 RETURNING id",
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Topilmadi" });
  res.json({ ok: true });
}));

app.delete("/api/admin/stories/:id", authMiddleware, asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    "DELETE FROM stories WHERE id = $1 RETURNING rasm, rasm_public_id",
    [req.params.id]
  );
  const rasm = rows[0]?.rasm;
  const rasmPublicId = rows[0]?.rasm_public_id;
  if (rasmPublicId) {
    await deleteByPublicId(rasmPublicId);
  } else if (rasm && rasm.startsWith("/uploads/")) {
    const filePath = path.join(UPLOADS_DIR, path.basename(rasm));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  res.json({ ok: true });
}));

// ============ USERS (hikoya yuboruvchilar) API ============

// Email bo'yicha guruhlangan foydalanuvchilar ro'yxati (admin)
app.get("/api/admin/users", authMiddleware, asyncRoute(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      COALESCE(NULLIF(TRIM(email), ''), '') AS email,
      ARRAY_AGG(DISTINCT ism) AS ismlar,
      COUNT(*)::int AS jami,
      SUM(CASE WHEN approved THEN 1 ELSE 0 END)::int AS tasdiqlangan,
      MAX(sana) AS "oxirgiSana"
    FROM stories
    GROUP BY COALESCE(NULLIF(TRIM(email), ''), '')
    ORDER BY "oxirgiSana" DESC
  `);
  res.json(rows);
}));

// ============ PLACES API ============

// Barcha joylar (ommaviy)
app.get("/api/places", asyncRoute(async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM places ORDER BY nom ASC");
  res.json(rows);
}));

// Yangi joy qo'shish (admin)
app.post("/api/admin/places", authMiddleware, upload.single("rasm"), asyncRoute(async (req, res) => {
  const { nom, turi, tavsif, manzil, lat, lng } = req.body || {};

  if (!nom || nom.trim().length < 2) {
    if (req.file && req.file.path) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Nom kamida 2 harf bo'lishi kerak" });
  }
  if (!turi) {
    if (req.file && req.file.path) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Tur tanlanishi kerak" });
  }

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  let rasm = "";
  let rasmPublicId = "";

  if (req.file) {
    if (hasCloudinary) {
      const result = await uploadBuffer(req.file.buffer, "buloqboshi/joylar");
      rasm = result.secure_url;
      rasmPublicId = result.public_id;
    } else {
      rasm = "/uploads/" + req.file.filename;
    }
  }

  const yangi = {
    id,
    nom: nom.trim().slice(0, 80),
    turi: turi.trim(),
    tavsif: (tavsif || "").trim().slice(0, 500),
    manzil: (manzil || "").trim().slice(0, 120),
    lat: parseFloat(lat) || 39.6485,
    lng: parseFloat(lng) || 65.9761,
    rasm
  };

  await pool.query(
    `INSERT INTO places (id, nom, turi, tavsif, manzil, lat, lng, rasm, rasm_public_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [yangi.id, yangi.nom, yangi.turi, yangi.tavsif, yangi.manzil, yangi.lat, yangi.lng, yangi.rasm, rasmPublicId]
  );

  res.json({ ok: true, place: yangi });
}));

// Joy o'chirish (admin)
app.delete("/api/admin/places/:id", authMiddleware, asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    "DELETE FROM places WHERE id = $1 RETURNING rasm, rasm_public_id",
    [req.params.id]
  );
  const rasm = rows[0]?.rasm;
  const rasmPublicId = rows[0]?.rasm_public_id;
  if (rasmPublicId) {
    await deleteByPublicId(rasmPublicId);
  } else if (rasm && rasm.startsWith("/uploads/")) {
    const filePath = path.join(UPLOADS_DIR, path.basename(rasm));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  res.json({ ok: true });
}));

// Barcha joylar (admin)
app.get("/api/admin/places", authMiddleware, asyncRoute(async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM places ORDER BY nom ASC");
  res.json(rows);
}));

// ============ LOGIN ============

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Parol noto'g'ri" });
});

// ============ SPA FALLBACK ============

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============ XATO USHLASH ============

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: "Fayl hajmi juda katta (5 MB dan oshmasin)" });
  }
  if (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Server xatosi" });
  }
  next();
});

// ============ ISHGA TUSHIRISH ============

async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`✅ Server ishga tushdi: http://localhost:${PORT}`);
      console.log(`🔐 Admin: http://localhost:${PORT}/admin.html`);
    });
  } catch (err) {
    console.error("❌ Ma'lumotlar bazasiga ulanib bo'lmadi:", err.message);
    console.error("DATABASE_URL muhit o'zgaruvchisi to'g'ri o'rnatilganini tekshiring.");
    process.exit(1);
  }
}

start();
