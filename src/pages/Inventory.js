import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  listInventoryItems,
  exportPurchasedExcel,
  exportSoldExcel,
} from "../api/inventory";
import { getCategories } from "../api/categories";
import InventorySellModal from "../components/InventorySellModal";
import "../css/inventory.css";

const formatDateThai = (input) => {
  if (!input) return "-";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear());
  return `${day}/${month}/${year}`;
};

const prodCode = (id) => `#${String(id).padStart(3, "0")}`;

export default function InventoryPage() {
  const navigate = useNavigate();

  const API_BASE = useMemo(
    () =>
      (process.env.REACT_APP_API_BASE || "http://localhost:8080").replace(
        /\/+$/,
        ""
      ),
    []
  );

  const resolveImg = useCallback(
    (p) => {
      if (!p) return "";
      const s = String(p).trim();

      if (/^https?:\/\//i.test(s)) return s;
      if (s.startsWith("/uploads/") || s.startsWith("/static/uploads/"))
        return `${API_BASE}${s}`;
      if (s.startsWith("uploads/") || s.startsWith("static/uploads/"))
        return `${API_BASE}/${s}`;

      return `${API_BASE}/uploads/${s.replace(/^\/+/, "")}`;
    },
    [API_BASE]
  );

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [totalPages, setTotalPages] = useState(1);

  const [selected, setSelected] = useState(new Set());
  const [showSellModal, setShowSellModal] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportBtnRef = useRef(null);

  const reqIdRef = useRef(0);

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

  useEffect(() => {
    function onClickOutside(e) {
      if (!exportBtnRef.current) return;
      if (!exportBtnRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const fetchInventory = useCallback(async () => {
    const myId = ++reqIdRef.current;
    try {
      setErr("");

      const data = await listInventoryItems({
        page,
        per_page: perPage,
        q,
        category_id: categoryId ? Number(categoryId) : null,
        sort: "-balance",
        only_active: true,
      });

      if (myId !== reqIdRef.current) return;

      const sortedItems = (data.items || []).sort((a, b) => {
        if (a.prod_id == null) return 1;
        if (b.prod_id == null) return -1;
        return a.prod_id - b.prod_id;
      });

      setItems(sortedItems);
      setTotalPages(data.total_pages ?? data.totalPages ?? 1);
    } catch (e) {
      setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      setItems([]);
      setTotalPages(1);
    } finally {
      if (myId === reqIdRef.current) setLoading(false);
    }
  }, [page, perPage, q, categoryId]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 250);
    return () => clearTimeout(t);
  }, [q, categoryId]);

  useEffect(() => {
    setLoading(true);
    fetchInventory();
  }, [page, fetchInventory]);

  const handleExport = async (type) => {
    try {
      setExporting(true);

      const prodIds =
        selected.size > 0 ? [...selected].join(",") : undefined;

      const payload = {
        prod_ids: prodIds,
        q,
        category_id: categoryId ? Number(categoryId) : undefined,
        only_active: true,
      };

      if (type === "purchased") {
        await exportPurchasedExcel(payload);
      } else if (type === "sold") {
        await exportSoldExcel(payload);
      }
    } catch {
      alert("ส่งออกไฟล์ไม่สำเร็จ");
    } finally {
      setExporting(false);
      setExportMenuOpen(false);
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    const all = items.length > 0 && items.every((i) => selected.has(i.prod_id));
    const next = new Set(selected);
    if (all) items.forEach((i) => next.delete(i.prod_id));
    else items.forEach((i) => next.add(i.prod_id));
    setSelected(next);
  };

  const filteredIems = useMemo(() => {
    if (!q.trim()) return items;
    return items.filter((x) =>
      x.prod_name?.toLowerCase().startsWith(q.toLowerCase())
    );
  }, [q, items]);

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

  return (
    <div className="inv-page">
      <div className="inv-head">
        <h2 className="inv-title">รายการสินค้าในคลัง</h2>

        <div className="d-flex align-items-center">
          <div className="position-relative me-2" ref={exportBtnRef}>
            <button
              className="btn btn-pill"
              disabled={exporting}
              onClick={() => setExportMenuOpen((v) => !v)}
            >
              {exporting ? "กำลังส่งออก..." : "Export"} ▾
            </button>

            {exportMenuOpen && (
              <div className="export-menu">
                <div
                  className="export-item"
                  onClick={() => handleExport("purchased")}
                >
                  รายการรับซื้อ
                </div>
                <div
                  className="export-item"
                  onClick={() => handleExport("sold")}
                >
                  รายการขาย
                </div>
              </div>
            )}
          </div>

          <button
            className="btn btn-pill"
            disabled={selected.size === 0}
            onClick={() => setShowSellModal(true)}
          >
            ขายสินค้า
          </button>
        </div>
      </div>

      <div className="cs-card inv-card">
        <div className="inv-tools">
          <select
            className="form-select inv-select"
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242 1.156a5 5 0 1 1 0-10.001 5 5 0 0 1 0 10z" />
              </svg>
            </span>
          </div>

        </div>

        {err && <div className="alert alert-danger py-2 mb-2">{err}</div>}

        <div className="inv-table-wrap">
          <div className="table-responsive">
            <table className="table cs-table inv-table align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={
                        items.length > 0 &&
                        items.every((i) => selected.has(i.prod_id))
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>รหัสสินค้า</th>
                  <th>ชื่อสินค้า</th>
                  <th>วันที่ขายล่าสุด</th>
                  <th>จำนวนที่ขายไป</th>
                  <th>คงเหลือ (kg)</th>
                  <th>หมวดหมู่</th>
                  <th>รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      กำลังโหลด...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  filteredIems.map((it, idx) => (
                    <tr key={it.prod_id}>
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          disabled={
                            it.balance_weight == null ||
                            Number(it.balance_weight) <= 0
                          }
                          checked={selected.has(it.prod_id)}
                          onChange={() => toggleSelect(it.prod_id)}
                        />
                      </td>
                      <td>{prodCode(it.prod_id)}</td>
                      <td>
                        <div className="inv-namecell">
                          <img
                            className="inv-thumb"
                            src={resolveImg(it.prod_img)}
                            alt={it.prod_name || ""}
                            onError={(e) => {
                              e.currentTarget.src = "";
                              e.currentTarget.classList.add("inv-thumb-empty");
                            }}
                          />
                          <div className="inv-namewrap">
                            <div className="inv-name">
                              {it.prod_name || "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{formatDateThai(it.last_sale_date)}</td>
                      <td>
                        {it.last_sold_qty != null
                          ? `${Number(it.last_sold_qty).toLocaleString()} kg`
                          : "-"}
                      </td>
                      <td>
                        {it.balance_weight != null
                          ? `${Number(it.balance_weight).toLocaleString()} kg`
                          : "-"}
                      </td>
                      <td>{it.category?.name || "-"}</td>
                      <td>
                        <button
                          className="inv-more"
                          onClick={() =>
                            navigate(`/inventory/${it.prod_id}`, {
                              state: {
                                prodName: it.prod_name,
                                categoryName: it.category?.name,
                              },
                            })
                          }
                        >
                          เพิ่มเติม
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="cs-footer justify-content-center">
          <div className="cs-pager">
            {page > 1 && (
              <button
                className="pager-text"
                onClick={() => setPage((p) => p - 1)}
              >
                ก่อนหน้า
              </button>
            )}

            {pageNumbers.map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`page-pill ${n === page ? "active" : ""}`}
              >
                {n}
              </button>
            ))}

            {page < totalPagesSafe && (
              <button
                className="pager-text"
                onClick={() => setPage((p) => p + 1)}
              >
                ถัดไป
              </button>
            )}
          </div>
        </div>
      </div>

      {showSellModal && (
        <InventorySellModal
          show={showSellModal}
          onClose={() => setShowSellModal(false)}
          selectedItems={items.filter((i) => selected.has(i.prod_id))}
          onSold={() => {
            setShowSellModal(false);
            setSelected(new Set());
            setLoading(true);
            fetchInventory();
          }}
        />
      )}
    </div>
  );
}
