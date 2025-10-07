// frontend/src/api/products.js
import api from "./client";

// ==== Utilities ====
function toFormData({ prod_name, prod_price, category_id, imageFile }) {
  const form = new FormData();
  form.append("prod_name", String(prod_name).trim());
  form.append("prod_price", String(prod_price));
  form.append("category_id", String(Number(category_id)));
  if (imageFile) form.append("imageFile", imageFile);
  return form;
}

// ==== READ ====
export async function getProducts({ includeInactive = false } = {}) {
  const res = await api.get("/products/", { params: { include_inactive: includeInactive } });
  return res.data;
}

export async function getProductsByCategory(categoryId, { includeInactive = false } = {}) {
  const res = await api.get(`/products/by-category/${categoryId}`, {
    params: { include_inactive: includeInactive },
  });
  return res.data;
}

export async function searchProducts(
  q,
  { limit = 50, offset = 0, includeInactive = false } = {}
) {
  const res = await api.get("/products/search", {
    params: { q, limit, offset, include_inactive: includeInactive },
  });
  return res.data;
}

// ตัวช่วยรวม (ค้นหาชื่อ + กรองหมวด) — ดึง inactive ได้ด้วย
export async function getProductsFiltered({ q = "", categoryId = "", limit = 50, offset = 0, includeInactive = false } = {}) {
  const hasQ = String(q || "").trim() !== "";
  const hasCat = String(categoryId || "").trim() !== "";
  if (hasQ && hasCat) {
    const list = await searchProducts(q, { limit, offset, includeInactive });
    return list.filter((x) => String(x.category_id) === String(categoryId));
  }
  if (hasQ) return await searchProducts(q, { limit, offset, includeInactive });
  if (hasCat) return await getProductsByCategory(categoryId, { includeInactive });
  return await getProducts({ includeInactive });
}

// ==== CREATE / UPDATE ====
// แนะนำให้ใช้แบบ FormData ทั้งกรณีมี/ไม่มีรูป เพื่อให้ตรงกับ backend
export async function createProductForm({ prod_name, prod_price, category_id, imageFile }) {
  const res = await api.post("/products/", toFormData({ prod_name, prod_price, category_id, imageFile }));
  return res.data;
}

// ถ้าอยากคงชื่อเดิม createProduct (เดิมส่ง JSON) ให้เปลี่ยนมาใช้ FormData เช่นกัน
export async function createProduct(payload) {
  const res = await api.post("/products/", toFormData(payload));
  return res.data;
}

export async function updateProductForm({ prod_id, prod_name, prod_price, category_id, imageFile }) {
  const res = await api.put(`/products/${prod_id}`, toFormData({ prod_name, prod_price, category_id, imageFile }));
  return res.data;
}

// ==== SOFT DELETE / STATUS ====
// เปลี่ยนจากลบจริง เป็นปิดใช้งาน (soft disable)
export async function disableProduct(id) {
  const res = await api.patch(`/products/${id}/disable`);
  return res.data;
}

// ถ้าหน้าบ้านยังมีปุ่ม "ลบ" เดิมอยู่ ให้ map มาที่ disable เพื่อไม่พัง
export async function deleteProduct(id) {
  return await disableProduct(id);
}

export async function enableProduct(id) {
  const res = await api.patch(`/products/${id}/enable`);
  return res.data;
}
