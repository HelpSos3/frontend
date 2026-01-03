import React, { useEffect, useState } from "react";
import { getCustomerInfoByProduct } from "../api/purchaseOrder";
import "../css/PurchaseOrderCustomerModal.css";

export default function PurchaseOrderCustomerModal({ show, onClose, prodId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState(null);

  // ล็อก scroll ตอน modal เปิด
  useEffect(() => {
    if (show) {
      document.body.classList.add("modal-open");
      return () => document.body.classList.remove("modal-open");
    }
  }, [show]);

  // โหลดข้อมูลลูกค้า
  useEffect(() => {
    if (!show || !prodId) return;

    (async () => {
      try {
        setLoading(true);
        setError("");
        setCustomer(null);

        const res = await getCustomerInfoByProduct(prodId);
        const data = res?.data || {};

        if (Object.keys(data).length === 0) {
          setCustomer(null);
        } else {
          setCustomer(data);
        }
      } catch (err) {
        const msg =
          err?.response?.data?.detail ||
          err?.message ||
          "ดึงข้อมูลลูกค้าไม่สำเร็จ";
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [show, prodId]);

  if (!show) return null;

  return (
    <>
      <div
        className="modal fade show pcm-overlay"
        style={{ display: "block", background: "rgba(0,0,0,0.45)" }}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="modal-dialog modal-dialog-centered pcm-dialog">
          <div className="modal-content pcm-modal">
            {/* ===== Header ===== */}
            <div className="modal-header pcm-header">
              <h5 className="modal-title pcm-title">
                ลูกค้าที่นำสินค้ามาขาย
              </h5>

              <div className="close-wrap">
                <button
                  type="button"
                  className="btn-close-circle"
                  onClick={onClose}
                  aria-label="ปิด"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* ===== Body ===== */}
            <div className="modal-body pcm-body">
              {error && (
                <div className="alert alert-danger py-2">{error}</div>
              )}

              {loading ? (
                <div className="text-center py-4">กำลังโหลด...</div>
              ) : !customer ? (
                <div className="text-center text-muted py-4">
                  ไม่พบข้อมูลลูกค้า
                </div>
              ) : (
                <div className="pcm-box">
                  <div className="pcm-item">
                    <div className="pcm-label">ชื่อ-นามสกุล</div>
                    <div className="pcm-value">
                      {customer.full_name || "-"}
                    </div>
                  </div>

                  <div className="pcm-item">
                    <div className="pcm-label">เลขบัตรประชาชน</div>
                    <div className="pcm-value">
                      {customer.national_id || "-"}
                    </div>
                  </div>

                  <div className="pcm-item">
                    <div className="pcm-label">ที่อยู่</div>
                    <div className="pcm-value">
                      {customer.address || "-"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" />
    </>
  );
}
