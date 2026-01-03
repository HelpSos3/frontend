import React from "react";

export default function DeleteItemModal({
  open,
  deleting,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="modal-payment" role="dialog" aria-modal="true">
      <div className="dialog">
        <div className="header">
          ยืนยันการลบรายการ
          <div className="close-wrap">
            <button
              type="button"
              className="btn-close-circle"
              aria-label="Close"
              onClick={onCancel}
              title="ปิด"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="body">
          <div className="price-large" style={{ fontSize: 20 }}>
            ต้องการลบรายการนี้ใช่หรือไม่ ?
          </div>
        </div>

        <div className="footer">
          {/* ปุ่มลบ */}
          <button
            type="button"
            className="btn-noreceipt"
            onClick={onConfirm}
            disabled={deleting}
            title={deleting ? "กำลังลบ..." : undefined}
          >
            ลบรายการ
          </button>

          {/* ปุ่มยกเลิก */}
          <button
            type="button"
            className="btn-receipt"
            onClick={onCancel}
            disabled={deleting}
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
