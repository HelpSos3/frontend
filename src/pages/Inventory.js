// src/pages/Inventory.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { listInventoryItems, exportInventoryExcel } from "../api/inventory";
import { getCategories } from "../api/categories";
import InventorySellModal from "../components/InventorySellModal";
import "../css/inventory.css";

const formatDateThai = (input) => {
  if (!input) return "-";
  const d = new Date(input);
  const day = `${d.getDate()}`.padStart(2, "0");
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const year = `${d.getFullYear() + 543}`.slice(-2);
  return `${day}/${month}/${year}`;
};

const prodCode = (id) => `#${String(id).padStart(3, "0")}`;

export default function InventoryPage() {
  const navigate = useNavigate();

  // ====== state ======
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [totalPages, setTotalPages] = useState(1);

  const [selected, setSelected] = useState(new Set());
  const [showSellModal, setShowSellModal] = useState(false);

  const reqIdRef = useRef(0);

  // โหลดหมวดหมู่
  useEffect(() => {
    (async () => {
      try {
        const cats = await getCategories();
        const list = Array.isArray(cats) ? cats : cats?.items ?? [];
        list.sort((a, b) =>
          (a.category_name || "").localeCompare(b.category_name || "", "th")
        );
        setCategories(list);
      } catch {
        /* noop */
      }
    })();
  }, []);

  // ดึงข้อมูลคลัง
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

      // ✅ เรียงตามรหัสสินค้า (prod_id) จากน้อยไปมาก
      const sortedItems = (data.items || []).sort((a, b) => {
        if (a.prod_id == null) return 1;
        if (b.prod_id == null) return -1;
        return a.prod_id - b.prod_id;
      });

      setItems(sortedItems);

      const totalCandidates = [
        data?.total_pages,
        data?.totalPages,
        data?.pages,
        data?.page_count,
        data?.pagination?.total_pages,
      ].filter((v) => v != null);

      let tp;
      if (totalCandidates.length > 0) tp = Number(totalCandidates[0]);
      else {
        const totalCount =
          Number(
            data?.total ??
              data?.total_items ??
              data?.count ??
              data?.pagination?.total ??
              0
          ) || 0;
        tp = totalCount > 0 ? Math.ceil(totalCount / perPage) : 1;
      }

      setTotalPages(Math.max(1, tp || 1));
    } catch (e) {
      setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      setItems([]);
      setTotalPages(1);
    } finally {
      if (myId === reqIdRef.current) setLoading(false);
    }
  }, [page, perPage, q, categoryId]);

  // debounce เมื่อค้นหา/เปลี่ยนหมวดหมู่
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 250);
    return () => clearTimeout(t);
  }, [q, categoryId]);

  // เมื่อ page เปลี่ยน ให้โหลดใหม่
  useEffect(() => {
    setSelected(new Set());
    setLoading(true);
    fetchInventory();
  }, [page, fetchInventory]);

  // โหลดครั้งแรก
  useEffect(() => {
    setLoading(true);
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Export Excel
  const handleExport = async () => {
    try {
      await exportInventoryExcel({
        q,
        category_id: categoryId ? Number(categoryId) : null,
        sort: "-balance",
        only_active: true,
      });
    } catch {
      alert("ส่งออกไฟล์ไม่สำเร็จ");
    }
  };

  // Checkbox
  const toggleSelect = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const toggleSelectAll = () => {
    const allSelected = items.every((i) => selected.has(i.prod_id));
    const next = new Set(selected);
    if (allSelected) items.forEach((i) => next.delete(i.prod_id));
    else items.forEach((i) => next.add(i.prod_id));
    setSelected(next);
  };

  // === Pagination ===
  const totalPagesSafe = Math.max(1, totalPages);
  const pageNumbers = (() => {
    const maxButtons = 3;
    const start = Math.max(
      1,
      Math.min(page - 2, Math.max(1, totalPagesSafe - (maxButtons - 1)))
    );
    const end = Math.min(totalPagesSafe, start + (maxButtons - 1));
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  const isFirstPage = page <= 1;

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="page-title mb-0">รายการสินค้าในคลัง</h2>
        <div>
          <button className="btn btn-pill me-2" onClick={handleExport}>
            Export
          </button>
          <button
            className="btn btn-pill"
            disabled={selected.size === 0}
            onClick={() => setShowSellModal(true)}
          >
            ขายสินค้า
          </button>
        </div>
      </div>

      <div className="cs-card">
        {/* Filters */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="tools-left" style={{ width: "50%" }}>
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

            <div className="input-group tools-search inv-search">
              <input
                type="text"
                className="form-control"
                placeholder="ค้นหาสินค้า"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setQ("")}
              />
              <span className="input-group-text suffix">
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
        </div>

        {/* ตาราง */}
        {err && <div className="alert alert-danger py-2 mb-2">{err}</div>}

        <div className="table-responsive">
          <table className="table cs-table inv-table align-middle mb-0">
            <thead>
              <tr>
                <th className="text-center" style={{ width: 80 }}>
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
                <th className="text-center">รหัสสินค้า</th>
                <th className="text-center">ชื่อสินค้า</th>
                <th className="text-center">วันที่ขายล่าสุด</th>
                <th className="text-center">จำนวนที่ขายไป</th>
                <th className="text-center">คงเหลือ (kg)</th>
                <th className="text-center">หมวดหมู่</th>
                <th className="text-center">รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    กำลังโหลด...
                  </td>
                </tr>
              ) : (items?.length || 0) === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => (
                  <tr key={it.prod_id} className={`cs-row ${idx % 2 ? "even" : "odd"}`}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selected.has(it.prod_id)}
                        onChange={() => toggleSelect(it.prod_id)}
                      />
                    </td>
                    <td className="text-center">{prodCode(it.prod_id)}</td>
                    <td className="text-center">{it.prod_name || "-"}</td>
                    <td className="text-center">{formatDateThai(it.last_sale_date)}</td>
                    <td className="text-center">
                      {it.last_sold_qty != null
                        ? `${Number(it.last_sold_qty).toLocaleString()} kg`
                        : "-"}
                    </td>
                    <td className="text-center">
                      {it.balance_weight != null
                        ? `${Number(it.balance_weight).toLocaleString()} kg`
                        : "-"}
                    </td>
                    <td className="text-center">{it.category?.name || "-"}</td>
                    <td className="text-center">
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

        {/* Pagination */}
        <div className="cs-footer justify-content-center">
          <div className="cs-pager">
            {!isFirstPage && (
              <button
                className="pager-text"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
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

            <button
              className="pager-text"
              onClick={() => setPage((p) => Math.min(totalPagesSafe, p + 1))}
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>

      {/* Modal ขายสินค้า */}
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
