import api from "./client";

/* --- ID Card --- */

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

/* --- เปิลบิล --- */

export const getOpenPurchase = () =>
  api.get("/purchases/open", { timeout: 10000 }).then((r) => r.data);

// ลบบิล OPEN ล่าสุด 
export const deleteOpenPurchase = () =>
  api
    .delete("/purchases/open", { params: { confirm: true }, timeout: 10000 })
    .then((r) => r.data);

/* ---กล้อง ---*/
export const captureAnonymousPreview = (device_index = 0, warmup = 8) =>
  api.post(
    "/purchases/quick-open/anonymous/preview",
    null,
    { params: { device_index, warmup }, timeout: 25000 }
  );

export const commitAnonymous = ({
  photo_base64,
  on_open = "return",
  confirm_delete = false,
}) =>
  api.post(
    "/purchases/quick-open/anonymous/commit",
    { photo_base64, on_open, confirm_delete },
    { timeout: 25000 }
  );

/* --- Hardware ---*/

export const cameraStatus = (device_index = 0, probe_frame = true) =>
  api
    .get("/hardware/camera/status", {
      params: { device_index, probe_frame },
      timeout: 8000,
    })
    .then((r) => r.data);

/* --- รายชื่อลูกค้า ---*/

// ดึงรายชื่อลูกค้า 
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
