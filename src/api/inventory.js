import api from "./client";

/* ดึงรายการสินค้าในคลัง */
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
  return res.data; 
}

/* ดาวน์โหลดไฟล์ Excel */
export async function exportInventoryExcel(params = {}) {
  const {
    q = "",
    category_id = null,
    sort = "-last_sale_date",
    only_active = true,
  } = params;

  const res = await api.get("/inventory/export", {
    params: { q, category_id, sort, only_active },
    responseType: "blob",  //ข้อมูลที่กลับมาเป็นไฟล์ binary 
  });

  // สร้างลิงก์ดาวน์โหลดไฟล์ Excel
  const url = window.URL.createObjectURL(new Blob([res.data])); //แปลง binary เป็น url ให้เบราเซอร์โหลดได้
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "รายงานคลังสินค้า.xlsx");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/* ขายสินค้า */
export async function sellInventory(lines = []) {
  if (!Array.isArray(lines) || lines.length === 0)
    throw new Error("ไม่มีรายการสินค้าที่จะขาย");

  const res = await api.post("/inventory/sell", lines);
  return res.data; 
}

// optional ช่วยแปลงวันที่
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

/* ดูประวัติ รับซื้อ ของสินค้า */
export async function getPurchasedHistorySimple(prod_id, options = {}) {
  if (!prod_id) throw new Error("ต้องระบุ รหัสสินค้า");
  const res = await api.get(`/inventory/purchased_history_simple/${prod_id}`, {
    params: buildHistoryParams(options),
  });
  return res.data;
}

/* ดูประวัติ ขาย ของสินค้า */
export async function getSoldHistorySimple(prod_id, options = {}) {
  if (!prod_id) throw new Error("ต้องระบุ รหัสสินค้า");
  const res = await api.get(`/inventory/sold_history_simple/${prod_id}`, {
    params: buildHistoryParams(options),
  });
  return res.data;
}

/* ตัวกรองข้อมูล */
function buildExportParams({
  q = "",
  category_id = null,
  only_active = true,
  date_from,
  date_to,
  prod_ids, 
} = {}) {
  const params = { q, category_id, only_active };

  if (date_from) {
    params.date_from = date_from instanceof Date ? date_from.toISOString() : date_from;
  }
  if (date_to) {
    params.date_to = date_to instanceof Date ? date_to.toISOString() : date_to;
  }
  if (prod_ids && Array.isArray(prod_ids)) {
    params.prod_ids = prod_ids.join(","); // ฝั่งหลังบ้านรับ CSV
  } else if (typeof prod_ids === "string") {
    params.prod_ids = prod_ids;
  }

  return params;
}

/* Export: รายการรับซื้อทั้งหมด */
export async function exportPurchasedExcel(params = {}) {
  const res = await api.get("/inventory/export_purchased", {
    params: buildExportParams(params),
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "รายงานรับซื้อ.xlsx");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/* Export: รายการขายออกทั้งหมด */
export async function exportSoldExcel(params = {}) {
  const res = await api.get("/inventory/export_sold", {
    params: buildExportParams(params),
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "รายงานขายออก.xlsx");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
