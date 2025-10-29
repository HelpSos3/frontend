import api from "./client";


function toFormData({ prod_name, prod_price, category_id, imageFile }) {
  const form = new FormData();

  // prod_name
  const name = String(prod_name ?? "").trim();
  if (!name) throw new Error("prod_name is required");
  form.append("prod_name", name);

  // prod_price -> ส่งเป็นสตริงจุดทศนิยม (รองรับผู้ใช้พิมพ์คอมมา)
  const priceStr = String(prod_price ?? "").replace(",", ".").trim();
  if (!priceStr || isNaN(Number(priceStr))) {
    throw new Error("prod_price must be a number string");
  }
  form.append("prod_price", priceStr);

  // category_id -> ต้องมีค่าจริง 
  if (category_id === undefined || category_id === null || category_id === "") {
    throw new Error("category_id is required");
  }
  form.append("category_id", String(category_id));

  // imageFile 
  if (typeof File !== "undefined" && imageFile instanceof File) {
    form.append("imageFile", imageFile);
  } else if (typeof Blob !== "undefined" && imageFile instanceof Blob) {
    // รองรับกรณีเป็น Blob 
    form.append("imageFile", imageFile, "upload.bin");
  }

  return form;
}

function normIncludeInactive(opts = {}) {
  if (typeof opts.include_inactive !== "undefined") return !!opts.include_inactive;
  if (typeof opts.includeInactive !== "undefined") return !!opts.includeInactive;
  return false;
}

// ===== READ =====
export async function getProducts(opts = {}) {
  const include_inactive = normIncludeInactive(opts);
  const res = await api.get("/products/", { params: { include_inactive } });
  return res.data;
}

export const listProducts = (opts = {}) => getProducts(opts);

// (อ้างอิงจากเส้นทางฝั่งบิล ถ้ามี)
export async function getProductDetail(prod_id) {
  const res = await api.get(`/purchases/products/${prod_id}`);
  return res.data;
}

export async function getProductsByCategory(categoryId, opts = {}) {
  const include_inactive = normIncludeInactive(opts);
  const res = await api.get(`/products/by-category/${categoryId}`, {
    params: { include_inactive },
  });
  return res.data;
}

export async function searchProducts(q, opts = {}) {
  const include_inactive = normIncludeInactive(opts);
  const { limit = 50, offset = 0 } = opts;
  const res = await api.get("/products/search", {
    params: { q, limit, offset, include_inactive },
  });
  return res.data;
}

// รวมฟิลเตอร์ (ค้นหาชื่อ + กรองหมวด)
export async function getProductsFiltered({
  q = "",
  categoryId = "",
  limit = 50,
  offset = 0,
  includeInactive,
  include_inactive,
} = {}) {
  const includeFlag = normIncludeInactive({ includeInactive, include_inactive });
  const hasQ = String(q || "").trim() !== "";
  const hasCat = String(categoryId || "").trim() !== "";

  if (hasQ && hasCat) {
    const list = await searchProducts(q, { limit, offset, include_inactive: includeFlag });
    return list.filter((x) => String(x.category_id) === String(categoryId));
  }
  if (hasQ) return await searchProducts(q, { limit, offset, include_inactive: includeFlag });
  if (hasCat) return await getProductsByCategory(categoryId, { include_inactive: includeFlag });
  return await getProducts({ include_inactive: includeFlag });
}

// ===== CREATE / UPDATE =====
export async function createProductForm({ prod_name, prod_price, category_id, imageFile }) {
  const res = await api.post("/products/", toFormData({ prod_name, prod_price, category_id, imageFile }));
  return res.data;
}

export async function createProduct(payload) {
  const res = await api.post("/products/", toFormData(payload));
  return res.data;
}

export async function updateProductForm({ prod_id, prod_name, prod_price, category_id, imageFile }) {
  const res = await api.put(`/products/${prod_id}`, toFormData({ prod_name, prod_price, category_id, imageFile }));
  return res.data;
}

// ===== STATUS / DELETE =====
export async function toggleProductActive(id, is_active) {
  // FastAPI รับ query param เป็น true/false ได้
  const res = await api.put(`/products/${id}/active`, null, { params: { is_active } });
  return res.data;
}

export async function enableProduct(id) {
  return await toggleProductActive(id, true);
}

export async function disableProduct(id) {
  return await toggleProductActive(id, false);
}

// ลบจริง = ปิดการใช้งาน (ตามที่คุณออกแบบ)
export async function deleteProduct(id) {
  return await disableProduct(id);
}
