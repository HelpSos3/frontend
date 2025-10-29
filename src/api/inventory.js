// src/api/inventory.js
import api from "./client";

/**
 * ✅ 1) ดึงรายการสินค้าในคลัง
 *    GET /inventory/items
 */
export async function listInventoryItems(params = {}) {
  const {
    page = 1,
    per_page = 20,
    q = "",
    category_id = null,
    sort = "-balance",
    only_active = true,
  } = params;

  const res = await api.get("/inventory/items", {
    params: { page, per_page, q, category_id, sort, only_active },
  });
  return res.data; // => { items: [...], page, per_page, total }
}

/**
 * ✅ 2) ดาวน์โหลดรายงาน Excel
 *    GET /inventory/export
 */
export async function exportInventoryExcel(params = {}) {
  const {
    q = "",
    category_id = null,
    sort = "-last_sale_date",
    only_active = true,
  } = params;

  const res = await api.get("/inventory/export", {
    params: { q, category_id, sort, only_active },
    responseType: "blob", // เพื่อรับไฟล์เป็น binary
  });

  // สร้างลิงก์ดาวน์โหลดไฟล์ Excel
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "รายงานคลังสินค้า.xlsx");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * ✅ 3) ขายสินค้า (หลายรายการ)
 *    POST /inventory/sell
 *    @param lines: [{ prod_id, weight_sold, note }]
 */
export async function sellInventory(lines = []) {
  if (!Array.isArray(lines) || lines.length === 0)
    throw new Error("ไม่มีรายการสินค้าที่จะขาย");

  const res = await api.post("/inventory/sell", lines);
  return res.data; // => { ok: true, created: [...] }
}

// ------------------- Utils (optional ช่วยแปลงวันที่) -------------------
function buildHistoryParams({ date_from, date_to, page = 1, per_page = 20 } = {}) {
  const params = { page, per_page };
  if (date_from) {
    params.date_from = date_from instanceof Date ? date_from.toISOString() : date_from;
  }
  if (date_to) {
    params.date_to = date_to instanceof Date ? date_to.toISOString() : date_to;
  }
  return params;
}

/**
 * ✅ 4) ดูประวัติ "รับซื้อ" ของสินค้า (แบบ simple)
 *    GET /inventory/purchased_history_simple/{prod_id}
 *    @param prod_id: number
 *    @param options: { date_from?: Date|string, date_to?: Date|string, page?: number, per_page?: number }
 *    @return { items, page, per_page, total }
 */
export async function getPurchasedHistorySimple(prod_id, options = {}) {
  if (!prod_id) throw new Error("ต้องระบุ prod_id");
  const res = await api.get(`/inventory/purchased_history_simple/${prod_id}`, {
    params: buildHistoryParams(options),
  });
  return res.data;
}

/**
 * ✅ 5) ดูประวัติ "ขาย" ของสินค้า (แบบ simple)
 *    GET /inventory/sold_history_simple/{prod_id}
 *    @param prod_id: number
 *    @param options: { date_from?: Date|string, date_to?: Date|string, page?: number, per_page?: number }
 *    @return { items, page, per_page, total }
 */
export async function getSoldHistorySimple(prod_id, options = {}) {
  if (!prod_id) throw new Error("ต้องระบุ prod_id");
  const res = await api.get(`/inventory/sold_history_simple/${prod_id}`, {
    params: buildHistoryParams(options),
  });
  return res.data;
}