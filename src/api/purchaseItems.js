import api from "./client";

/* พรีวิวรูปสินค้าจากฮาร์ดแวร์ */
export async function previewItemPhoto(
  purchaseId,
  { device_index = 0, warmup = 3, backend } = {}
) {
  const params = { device_index, warmup };
  if (backend) params.backend = backend;
  const { data } = await api.post(
    `/purchases/${purchaseId}/items/preview`,
    null,
    { params, timeout: 20000 }
  );
  return data; 
}

/* คอมมิตบันทึกรายการ + รูปที่พรีวิวไว้ (คืน ItemOut) */
export async function commitItemWithPhoto(
  purchaseId,
  { prod_id, weight, photo_base64 },
  { round_mode = "half_up", round_step } = {}
) {
  const params = { round_mode };
  if (round_step != null) params.round_step = round_step;

  const { data } = await api.post(
    `/purchases/${purchaseId}/items/commit`,
    { prod_id, weight, photo_base64 },
    { params, timeout: 20000 }
  );
  return data;
}



/* ดึงรายการของบิล */
export async function listPurchaseItems(purchaseId) {
  try {
    const res = await api.get(`/purchases/${purchaseId}/items`, { timeout: 10000 });
    return res.data;
  } catch (e) {
    const msg = e?.response?.data?.detail || e?.message || "ไม่สามารถดึงรายการสินค้าได้";
    throw new Error(msg);
  }
}

/* ดึงสรุปบิล (น้ำหนักรวม / ยอดรวม) */
export async function getPurchaseItemsSummary(purchaseId) {
  try {
    const res = await api.get(`/purchases/${purchaseId}/items/summary`, { timeout: 8000 });
    return res.data;
  } catch (e) {
    const msg = e?.response?.data?.detail || e?.message || "ไม่สามารถดึงสรุปบิลได้";
    throw new Error(msg);
  }
}
