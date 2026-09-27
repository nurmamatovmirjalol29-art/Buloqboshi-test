import { v2 as cloudinary } from "cloudinary";

// Cloudinary sozlamalari muhit o'zgaruvchilaridan olinadi.
// Agar ular o'rnatilmagan bo'lsa, tizim rasmlarni oddiy diskka saqlaydi
// (masalan, mahalliy kompyuterda test qilayotganda Cloudinary shart emas).
export const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log("✅ Cloudinary ulandi — rasmlar bulutda doimiy saqlanadi");
} else {
  console.log("ℹ️ Cloudinary sozlanmagan — rasmlar diskka saqlanadi (qayta deploy qilinganda yo'qolishi mumkin)");
}

// Xotiradagi (memory) fayl buferini Cloudinary'ga yuklaydi
export function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// Cloudinary'dagi rasmni public_id orqali o'chiradi
export async function deleteByPublicId(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn("Cloudinary rasmni o'chirishda xato:", err.message);
  }
}
