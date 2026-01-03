import React, { useEffect, useState, useCallback, useMemo } from "react";
import { listReceipts, getReceiptImages } from "../api/receipts";
import DateRangePicker from "../components/DateRangePicker";
import ReceiptImagesModal from "../components/ReceiptImagesModal";
import "../css/receipts.css";

/* ===== แปลงวันที่เป็น พ.ศ. แบบหน้ารายการรับซื้อ ===== */
const formatDateThaiBE = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

export default function Receipts() {
  // ===== state =====
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  // modal
  const [openModal, setOpenModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // ===== load data =====
  const fetchData = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const res = await listReceipts({
          page: p,
          ...(dateFrom ? { date_from: dateFrom } : {}),
          ...(dateTo ? { date_to: dateTo } : {}),
        });

        setItems(res.items || []);
        setTotalPages(res.total_pages || 1);
        setPage(res.current_page || p);
      } finally {
        setLoading(false);
      }
    },
    [page, dateFrom, dateTo]
  );

  // โหลดข้อมูลเมื่อเปลี่ยนหน้า
  useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  // ===== pagination (แบบ Inventory) =====
  const totalPagesSafe = Math.max(1, totalPages);

  const pageNumbers = useMemo(() => {
    const maxButtons = 3;
    let start = Math.max(1, page - 1);
    let end = Math.min(totalPagesSafe, start + (maxButtons - 1));

    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - (maxButtons - 1));
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPagesSafe]);

  // ===== open receipt popup =====
  const openImages = async (receipt) => {
    setSelectedReceipt(receipt);
    setOpenModal(true);
    setModalLoading(true);
    setImages([]);

    try {
      const res = await getReceiptImages(receipt.purchase_id);
      setImages(res.images || []);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="rc-page">
      {/* ===== Header ===== */}
      <div className="rc-head">
        <h2 className="rc-title">รายการบิลใบเสร็จ</h2>

        {/* ปุ่มเลือกวันที่ */}
        <div className="position-relative">
          <button
            className="btn btn-pill"
            onClick={() => setShowPicker((v) => !v)}
          >
            เลือกวันที่
          </button>

          <DateRangePicker
            open={showPicker}
            onClose={() => setShowPicker(false)}
            dateFrom={dateFrom}
            dateTo={dateTo}
            setDateFrom={setDateFrom}
            setDateTo={setDateTo}
            onClear={() => {
              setDateFrom("");
              setDateTo("");
              setPage(1);
              setShowPicker(false);
              fetchData(1);
            }}
            onApply={() => {
              setPage(1);
              setShowPicker(false);
              fetchData(1);
            }}
          />
        </div>
      </div>

      {/* ===== Card ===== */}
      <div className="cs-card rc-card">
        {/* ===== Table ===== */}
        <div className="table-responsive">
          <table className="table cs-table rc-table align-middle mb-0">
            <thead>
              <tr>
                <th>เลขบิล</th>
                <th>วันที่</th>
                <th>เวลา</th>
                <th>จำนวนเงิน</th>
                <th>ประเภทเงิน</th>
                <th>รายละเอียด</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="rc-empty">กำลังโหลด...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="rc-empty">ไม่พบข้อมูลบิลใบเสร็จ</td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.purchase_id}>
                    <td>#{r.purchase_id}</td>
                    <td>{formatDateThaiBE(r.date)}</td>
                    <td>{r.time}</td>
                    <td>{r.amount ?? "-"}</td>
                    <td>{r.payment_type ?? "-"}</td>
                    <td>
                      <button
                        className="rc-view"
                        onClick={() => openImages(r)}
                      >
                        ดูบิล
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ===== Pagination ===== */}
        <div className="cs-footer justify-content-center">
          <div className="cs-pager">
            {page > 1 && (
              <button className="pager-text" onClick={() => setPage((p) => p - 1)}>
                ก่อนหน้า
              </button>
            )}

            {pageNumbers.map((n) => (
              <button
                key={n}
                className={`page-pill ${n === page ? "active" : ""}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}

            {page < totalPagesSafe && (
              <button className="pager-text" onClick={() => setPage((p) => p + 1)}>
                ถัดไป
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== Receipt Popup ===== */}
      <ReceiptImagesModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        loading={modalLoading}
        images={images}
        receipt={selectedReceipt}
      />
    </div>
  );
}
