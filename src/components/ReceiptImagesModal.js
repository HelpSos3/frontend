import React from "react";
import "../css/receipt-modal.css";

export default function ReceiptImagesModal({
  open,
  onClose,
  loading,
  images,
  receipt,
}) {
  if (!open) return null;

  return (
    <div className="receipt-backdrop" onClick={onClose}>
      <div
        className="receipt-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="receipt-close" onClick={onClose}>
          ✕
        </button>

        {loading ? (
          <div className="receipt-loading">กำลังโหลดรูปบิล...</div>
        ) : images.length === 0 ? (
          <div className="receipt-loading">ไม่มีรูปบิล</div>
        ) : (
          <div className="receipt-images">
            {images.map((img) => (
              <img
                key={img.photo_id}
                src={img.image}
                alt="receipt"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
