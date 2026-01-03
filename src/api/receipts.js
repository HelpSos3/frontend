import api from "./client";

// 1) ดึงรายการใบเสร็จ
export const listReceipts = async ({ date_from, date_to, page = 1, per_page = 20 } = {}) => {
  const res = await api.get("/receipts", {
    params: {
      date_from: date_from || undefined,
      date_to: date_to || undefined,
      page,
      per_page,
    },
  });
  return res.data;
};

// 2) ดึงรูปบิลตาม purchase_id
export const getReceiptImages = async (purchase_id) => {
  const res = await api.get(`/receipts/${purchase_id}/images`);
  return res.data;
};