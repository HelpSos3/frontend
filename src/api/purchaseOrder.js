// src/api/purchaseOrder.js
import api from "./client";

// api ดึงรายการรับซื้อ
export function listPurchaseItems(params = {}) {
  return api.get("/purchase/list", {
    params,
  });
}

// api ดึงข้อมูลลูกค้าจากสินค้า
export function getCustomerInfoByProduct(prodId) {
  if (!prodId) {
    throw new Error("ต้องระบุรหัสสินค้า");
  }
  return api.get(`/purchase/customer_info_by_product/${prodId}`);
}