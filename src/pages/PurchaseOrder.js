import React, { useState, useEffect, useMemo, useCallback } from "react";
import { listPurchaseItems } from "../api/purchaseOrder";
import { getCategories } from "../api/categories";
import DateRangePicker from "../components/DateRangePicker";
import PurchaseOrderCustomerModal from "../components/PurchaseOrderCustomerModal";
import "../css/purchase-order.css";

export default function PurchaseOrder() {
  // ===== state =====
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);

  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [page, setPage] = useState(1);
  const perPage = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedProdId, setSelectedProdId] = useState(null);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const [previewImg, setPreviewImg] = useState(null);

  const toThaiDateBE = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return "-";

    const [dd, mm, yyyy] = dateStr.split("/");
    if (!dd || !mm || !yyyy) return dateStr;

    const yearBE = parseInt(yyyy, 10);
    return `${dd}/${mm}/${yearBE}`;
  };
  // โหลดหมวดหมู่
  useEffect(() => {
    (async () => {
      try {
        const cats = await getCategories();
        const list = Array.isArray(cats) ? cats : cats?.items ?? [];
        list.sort((a, b) =>
          (a.category_name || "").localeCompare(
            b.category_name || "",
            "th"
          )
        );
        setCategories(list);
      } catch { }
    })();
  }, []);

  // ===== load purchase list =====
  const fetchData = useCallback(async () => {
    setLoading(true);

    const res = await listPurchaseItems({
      q: q || undefined,
      category_id: categoryId || undefined,
      page,
      per_page: perPage,
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
    });

    setItems(res.data.items || []);
    setTotalPages(res.data.total_pages || 1);

    if (typeof res.data.current_page === "number") {
      setPage(res.data.current_page);
    }
    setLoading(false);
  }, [q, categoryId, page, perPage, dateFrom, dateTo]);

  const filteredIems = useMemo(() => {
    if (!q.trim()) return items;

    return items.filter((x) =>
      x.prod_name?.toLowerCase().startsWith(q.toLowerCase())
    );
  }, [q, items]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(t);
  }, [fetchData]);

  return (
    <div className="po-page">
      {/* ===== Header ===== */}
      <div className="po-head po-head-row">
        <h2 className="po-title">รายการรับซื้อ</h2>

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
            }}
            onApply={() => {
              setPage(1);
              setShowPicker(false);
            }}
          />
        </div>
      </div>

      {/* ===== Card ใหญ่ ===== */}
      <div className="cs-card  po-card">

        {/* หมวดหมู่ + ค้นหา */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="tools-left" style={{ width: "50%" }}>
            {/* หมวดหมู่ */}
            <select
              className="form-select tools-select inv-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">หมวดหมู่</option>
              {categories.map((c) => (
                <option key={c.category_id} value={String(c.category_id)}>
                  {c.category_name}
                </option>
              ))}
            </select>

            {/* ค้นหา */}
            <div className="input-group tools-search">
              <input
                type="text"
                className="form-control"
                placeholder="ค้นหาสินค้า"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setQ("")}
              />
              <span className="input-group-text">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242 1.156a5 5 0 1 1 0-10.001 5 5 0 0 1 0 10z" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* ===== Table ===== */}
        <div className="table-responsive">
          <table className="table cs-table inv-table align-middle mb-0">
            <thead>
              <tr>
                <th>ชื่อสินค้า</th>
                <th>วันที่รับซื้อ</th>
                <th>เวลา</th>
                <th>จำนวน (kg)</th>
                <th>จำนวนเงิน</th>
                <th>ประเภทเงิน</th>
                <th>หมวดหมู่</th>
                <th>รายละเอียด</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="po-empty">
                    กำลังโหลด...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="po-empty">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                filteredIems.map((it, idx) => (
                  <tr
                    key={it.purchase_item_id}
                    className={`cs-row ${idx % 2 ? "even" : "odd"}`}
                  >
                    <td className="text-center">
                      <div className="inv-namecell">
                        <img
                          className="inv-thumb inv-thumb-click"
                          src={it.image || ""}
                          alt={it.prod_name || ""}
                          onClick={() => it.image && setPreviewImg(it.image)}
                          onError={(e) => {
                            e.currentTarget.src = "";
                            e.currentTarget.classList.add("inv-thumb-empty");
                          }}
                        />
                        <div className="inv-namewrap">
                          <div
                            className="inv-name"
                            title={it.prod_name}   
                          >
                            {it.prod_name || "-"}</div>
                        </div>
                      </div>
                    </td>

                    <td>{toThaiDateBE(it.purchase_date)}</td>
                    <td>{it.purchase_time}</td>
                    <td>{it.weight} kg</td>
                    <td>{it.price}</td>
                    <td>{it.payment_method || "-"}</td>
                    <td>{it.category_name}</td>
                    <td className="text-center">
                      <button
                        className="po-more"
                        onClick={() => {
                          setSelectedProdId(it.prod_id);
                          setShowCustomerModal(true);
                        }}
                      >
                        เพิ่มเติม
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <PurchaseOrderCustomerModal
            show={showCustomerModal}
            prodId={selectedProdId}
            onClose={() => {
              setShowCustomerModal(false);
              setSelectedProdId(null);
            }}
          />
        </div>

        {/* Pagination */}
        <div className="cs-footer justify-content-center">
          <div className="cs-pager">
            {page > 1 && (
              <button className="pager-text" onClick={() => setPage((p) => p - 1)}>
                ก่อนหน้า
              </button>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, page - 2), Math.min(totalPages, page + 1))
              .map((p) => (
                <button
                  key={p}
                  className={`page-pill ${p === page ? "active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}

            {page < totalPages && (
              <button className="pager-text" onClick={() => setPage((p) => p + 1)}>
                ถัดไป
              </button>
            )}
            {/*แสดงModal รูปตอนคลิก*/}
            {previewImg && (
              <div
                className="img-preview-backdrop"
                onClick={() => setPreviewImg(null)}
              >
                <div
                  className="img-preview-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img src={previewImg} alt="preview" />
                  <button
                    className="img-preview-close"
                    onClick={() => setPreviewImg(null)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
