import api from "./client";

/* ==== เครื่องชั่ง ==== */
export const fetchWeightFromScale = async (purchaseId) => {
  const { data } = await api.get(
    `/purchases/${purchaseId}/scale`,
    { timeout: 5000 }
  );
  return data;
};

/* ==== สแกนบัตรประชาชน ==== */
// พรีวิวข้อมูลบัตร (ยังไม่บันทึก)
export const previewIdCard = ({ reader_index = 0, with_photo = 1 } = {}) =>
  api
    .post(
      "/purchases/quick-open/idcard/preview",
      null,
      { params: { reader_index, with_photo }, timeout: 30000 }
    )
    .then((r) => r.data);

// เปิดบิลด้วยบัตร (บันทึกจริง)
export const quickOpenIdCard = ({
  national_id,
  full_name = null,
  address = null,
  photo_base64,
  on_open = "return",
  confirm_delete = false,
} = {}) =>
  api
    .post(
      "/purchases/quick-open/idcard/commit",
      { national_id, full_name, address, photo_base64, on_open, confirm_delete },
      { timeout: 30000 }
    )
    .then((r) => r.data);

/* ==== เปิดบิล ==== */
export const getOpenPurchase = () =>
  api.get("/purchases/open", { timeout: 10000 }).then((r) => r.data);

// ลบบิล Open ล่าสุด
export const deleteOpenPurchase = () =>
  api
    .delete("/purchases/open", { params: { confirm: true }, timeout: 10000 })
    .then((r) => r.data);

/* ==== กล้องสด (Anonymous) ==== */
export const anonymousLiveCameraUrl =
  api.defaults.baseURL.replace(/\/+$/, "") +
  "/purchases/quick-open/anonymous/live";

// commit anonymous
export const commitAnonymous = ({
  photo_base64,
  on_open = "return",
  confirm_delete = false,
}) =>
  api
    .post(
      "/purchases/quick-open/anonymous/commit",
      { photo_base64, on_open, confirm_delete },
      { timeout: 25000 }
    )
    .then((r) => r.data);

// capture snapshot จาก backend
export async function captureFromBackend() {
  const res = await api.post(
    "/purchases/quick-open/anonymous/preview",
    null,
    { timeout: 25000 }
  );

  const b64 = res.data.photo_base64;

  // base64 → blob
  const byteChars = atob(b64);
  const byteNums = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNums[i] = byteChars.charCodeAt(i);
  }

  const blob = new Blob(
    [new Uint8Array(byteNums)],
    { type: "image/jpeg" }
  );
  const blobUrl = URL.createObjectURL(blob);

  return { base64: b64, blobUrl };
}

/* ==== Hardware ==== */

export const cameraStatus = (device_index = 0, probe_frame = true) =>
  api
    .get("/hardware/camera/status", {
      params: { device_index, probe_frame },
      timeout: 8000,
    })
    .then((r) => r.data);

/* ==== รายชื่อลูกค้า ==== */

export const listCustomers = ({ q = "", page = 1, page_size = 20 } = {}) =>
  api
    .get("/purchases/customers", {
      params: { q, page, page_size },
      timeout: 15000,
    })
    .then((r) => r.data);

// เปิดบิลจากลูกค้าที่มีอยู่
export const quickOpenExisting = ({
  customer_id,
  on_open = "return",
  confirm_delete = false,
}) =>
  api
    .post(
      "/purchases/quick-open/existing",
      null,
      {
        params: { customer_id, on_open, confirm_delete },
        timeout: 20000,
      }
    )
    .then((r) => r.data);

/* ==== ชำระเงินบิล ==== */

export async function payPurchase(
  purchaseId,
  { payment_method, print_receipt = false }
) {
  const { data } = await api.post(
    `/purchases/${purchaseId}/pay`,
    { payment_method, print_receipt },
    { timeout: 15000 }
  );
  return data;
}

/* ==== พิมพ์ใบเสร็จ ==== */

export async function printReceipt(purchaseId) {
  const { data } = await api.post(
    `/purchases/${purchaseId}/print-receipt`,
    null,
    { timeout: 10000 }
  );
  return data;
}

/* ==== สถานะการชำระ ==== */

export const getPaymentInfo = (purchaseId) =>
  api
    .get(`/purchases/${purchaseId}/payment`, { timeout: 10000 })
    .then((r) => r.data);
