import React from "react";

export default function PayModal({
  open,
  payMethod,
  total,
  paying,
  onClose,
  onPay,
}) {
  if (!open) return null;

  return (
    <div className="modal-payment" role="dialog" aria-modal="true">
      <div className="dialog" key={`dlg-${payMethod}`}>
        <div className="header">
          ชำระเงิน ‘{payMethod}’
          <div className="close-wrap">
            <button
              type="button"
              className="btn-close-circle"
              aria-label="Close"
              onClick={onClose}
              title="ปิด"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="body">
          <div className="price-large">
            ฿{" "}
            {Number(total).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        <div className="footer">
          <button
            type="button"
            className="btn-receipt"
            onClick={() => onPay(true)}
            disabled={paying}
            title={paying ? "กำลังชำระเงิน..." : undefined}
          >
            พิมพ์ใบเสร็จ
          </button>

          <button
            type="button"
            className="btn-noreceipt"
            onClick={() => onPay(false)}
            disabled={paying}
            title={paying ? "กำลังชำระเงิน..." : undefined}
          >
            ไม่พิมพ์ใบเสร็จ
          </button>
        </div>
      </div>
    </div>
  );
}
