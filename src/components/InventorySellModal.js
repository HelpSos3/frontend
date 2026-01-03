import React, { useEffect, useState, useMemo } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { sellInventory } from "../api/inventory";
import "../css/InventorySellModal.css";

export default function InventorySellModal({ show, onClose, selectedItems, onSold }) {
  const [lines, setLines] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState("");

  //โหลดข้อมูลสินค้าที่เลือก
  useEffect(() => {
    if (show) {
      setLines(
        (selectedItems || []).map((it) => ({
          prod_id: it.prod_id,
          prod_name: it.prod_name,
          balance: Number(it.balance_weight || 0),
          qty: "",
        }))
      );
      setError("");
      setNote("");
    }
  }, [show, selectedItems]);

  //ล็อก scroll ของหน้า เวลา modal เปิดอยู่
  useEffect(() => {
    if (show) {
      document.body.classList.add("modal-open");
      return () => document.body.classList.remove("modal-open");
    }
  }, [show]);

  //ตรวจสอบค่าที่กรอก
  const validate = (row) => {
    const n = Number(row.qty);
    if (isNaN(n) || n <= 0) return false;
    if (n > row.balance) return false;
    return true;
  };

  //คำนวณยอดรวม
  const totalQty = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const n = Number(l.qty);
        return sum + (isNaN(n) ? 0 : n);
      }, 0),
    [lines]
  );
  //เปลี่ยนค่าที่ผู้ใช้กรอก
  const handleChange = (index, field, value) => {
    setLines((prev) => {
      const next = [...prev];
      next[index][field] = value;
      return next;
    });
  };
  //ลบรายการสินค้า 1 ตัว
  const handleRemove = (index) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };
  //ส่งข้อมูลขายสินค้าไป api
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (submitting) return;
    //เตรียมข้อมูลที่จะส่ง 
    const validLines = lines
      .filter(validate)
      .map((l) => ({
        prod_id: l.prod_id,
        weight_sold: Number(l.qty),
        note: note || "",
      }));

    if (!validLines.length) {
      setError("กรุณาตรวจสอบข้อมูลให้ถูกต้อง");
      return;
    }

    setSubmitting(true);
    setError("");
    //ส่งข้อมูลจริงๆ
    try {
      const res = await sellInventory(validLines);
      if (res) {
        onSold && onSold(res.created || []);
        onClose && onClose();
      } else {
        throw new Error("ไม่มีข้อมูลตอบกลับจากเซิร์ฟเวอร์");
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "ขายสินค้าไม่สำเร็จ";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block", background: "rgba(0,0,0,0.45)" }}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="modal-dialog modal-dialog-centered sell-dialog">
          <div className="modal-content modal-sell">
            <div className="modal-header">
              <h5 className="modal-title">ขายสินค้า</h5>
              <div className="close-wrap">
                <button type="button" className="btn-close-circle" onClick={onClose}>✕</button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-danger py-2">{error}</div>}

                <h6 className="section-title">รายการสินค้าที่นำไปขาย</h6>

                <div className="sell-container">
                  {lines.map((l, i) => (
                    <div key={l.prod_id} className="sell-item-card">
                      <div className="cell">
                        <div className="cell-label">รหัสสินค้า</div>
                        <div className="cell-value code">#{String(l.prod_id).padStart(3, "0")}</div>
                      </div>

                      <div className="cell">
                        <div className="cell-label">ชื่อสินค้า</div>
                        <div className="cell-value name">{l.prod_name}</div>
                      </div>

                      <div className="cell">
                        <div className="cell-label">จำนวนในคลัง</div>
                        <div className="cell-value balance">{l.balance.toLocaleString()} kg</div>
                      </div>

                      <div className="cell">
                        <div className="cell-label">จำนวนขาย</div>
                        <div className="cell-value">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={l.qty}
                            onChange={(e) => handleChange(i, "qty", e.target.value)}
                            placeholder=""
                          />
                        </div>
                      </div>

                      <div className="cell action-cell">
                        <div className="cell-label">Action</div>
                        <div className="cell-value">
                          <button
                            type="button"
                            className="btn-delete"
                            onClick={() => handleRemove(i)}
                            title="ลบรายการ"
                            aria-label="ลบรายการ"
                          >
                            <FaTrashAlt size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!lines.length && (
                    <div className="text-center text-muted py-4">ไม่มีรายการ</div>
                  )}
                </div>

                {/* สรุปรายการ */}
                <div className="summary">
                  <h6 className="section-title">สรุปรายการขายสินค้า</h6>
                  {lines
                    .filter((l) => Number(l.qty) > 0)
                    .map((l) => (
                      <div key={l.prod_id} className="line">
                        <span>{l.prod_name}</span>
                        <span>{Number(l.qty).toLocaleString()} kg</span>
                      </div>
                    ))}
                  <div className="line fw-bold">
                    <span>จำนวนสินค้าที่นำไปขายทั้งหมด</span>
                    <span>{lines.filter((l) => Number(l.qty) > 0).length} รายการ</span>
                  </div>
                  <div className="line fw-bold">
                    <span>รวมทั้งหมด</span>
                    <span>{totalQty.toLocaleString()} kg</span>
                  </div>
                </div>

                {/* หมายเหตุ */}
                <h6 className="section-title mt-3">หมายเหตุ</h6>
                <textarea
                  rows={3}
                  className="note-box"
                  placeholder="ระบุรายละเอียดเพิ่มเติม..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* ปุ่มขายสินค้า/ยกเลิก */}
              <div className="modal-footer">
                <button
                  type="submit"
                  className="btn-sell"
                  disabled={submitting || !lines.length}
                >
                  {submitting ? "กำลังบันทึก..." : "ขายสินค้า"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={onClose}
                  disabled={submitting}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" />
    </>
  );
}
