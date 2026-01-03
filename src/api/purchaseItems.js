import api from "./client";

/* ================================
   อ่านน้ำหนักจากเครื่องชั่ง
   GET /purchases/scale/read
================================ */
export async function fetchWeightFromScale() {
  try {
    const response = await api.get(`/purchases/scale/read`, {
      params: {
        timeout_ms: 500,
        lines: 5,
      },
    });

    const { weight, unit, stable } = response.data;
    return { weight, unit, stable };
  } catch (error) {
    console.error("อ่านน้ำหนักไม่สำเร็จ:", error);
    throw new Error("ไม่สามารถดึงน้ำหนักจากเครื่องชั่ง");
  }
}

/* ================================
   URL กล้องสด (MJPEG)
   ใช้กับ <img src="">
================================ */
export function liveItemCameraUrl(purchaseId) {
  const base = (api.defaults.baseURL || "").replace(/\/+$/, "");
  return `${base}/purchases/${purchaseId}/items/live`;
}

/* ================================
   พรีวิวรูป (ถ่าย 1 ภาพ)
   POST /items/preview
================================ */
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

  // { photo_base64 }
  return data;
}

/* ================================
   บันทึกรายการ + รูป
   POST /items/commit
================================ */
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

/* ================================
   ดึงรายการในบิล
================================ */
export async function listPurchaseItems(purchaseId) {
  const res = await api.get(`/purchases/${purchaseId}/items`, {
    timeout: 10000,
  });
  return res.data;
}

/* ================================
   สรุปบิล
================================ */
export async function getPurchaseItemsSummary(purchaseId) {
  const res = await api.get(
    `/purchases/${purchaseId}/items/summary`,
    { timeout: 8000 }
  );
  return res.data;
}
