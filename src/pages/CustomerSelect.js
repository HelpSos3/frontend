import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listCustomers, quickOpenExisting } from "../api/purchases";
import "../css/CustomerSelect.css";

export default function CustomerSelect() {
  const navigate = useNavigate();

  const API_BASE = useMemo(
    () => (process.env.REACT_APP_API_BASE || "http://localhost:8080").replace(/\/+$/, ""),
    []
  );

  const resolveImg = (p) => {
    if (!p) return "";
    if (/^https?:\/\//i.test(p)) return p;
    return `${API_BASE}/${p.replace(/^\/+/, "")}`;
  };

  // ===== state =====
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const allItemsRef = useRef(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const PAGE_SIZE = 20;

  const fetchPaged = React.useCallback(
    async (pageArg = page) => {
      try {
        setLoading(true);
        setErr("");
        const data = await listCustomers({
          page: pageArg,
          page_size: PAGE_SIZE,
        });

        setItems(data.items || []);
        setTotalPages(Math.max(1, data.total_pages || 1));
      } catch (e) {
        setErr(e?.response?.data?.detail || e?.message || "โหลดรายชื่อลูกค้าไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    },
    [page]
  );


  useEffect(() => {
    if (!q) {
      fetchPaged(page);
    }
  }, [page, q, fetchPaged]);


  // โหลดลูกค้าทั้งหมดเพื่อค้นหา
  async function ensureAllLoaded() {
    if (allItemsRef.current) return;
    setSearchLoading(true);
    try {
      const first = await listCustomers({ page: 1, page_size: 200 });
      const total = Math.max(1, first.total_pages || 1);
      let acc = first.items || [];

      for (let p = 2; p <= total; p++) {
        const resp = await listCustomers({ page: p, page_size: 200 });
        acc = acc.concat(resp.items || []);
      }

      allItemsRef.current = acc;
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "โหลดข้อมูลสำหรับค้นหาไม่สำเร็จ");
    } finally {
      setSearchLoading(false);
    }
  }

  const norm = (s) => (s || "").toString().toLowerCase().trim();

  // ค้นหาชื่อ (client-side)
  const filtered = useMemo(() => {
    if (!q || !allItemsRef.current) return [];
    const nq = norm(q);
    return allItemsRef.current.filter((c) => norm(c.full_name).includes(nq));
  }, [q]);

  const searchTotalPages = useMemo(() => {
    if (!q) return 1;
    return Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  }, [q, filtered]);

  const searchPageItems = useMemo(() => {
    if (!q) return [];
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [q, page, filtered]);

  // เวลาเริ่มค้นหา → reset page + load all
  useEffect(() => {
    let t;
    if (q) {
      t = setTimeout(async () => {
        await ensureAllLoaded();
        setPage(1);
      }, 250);
    }
    return () => t && clearTimeout(t);
  }, [q]);

  const onSearchKey = (e) => {
    if (e.key === "Escape") setQ("");
    if (e.key === "Enter") setPage(1);
  };

  async function selectCustomer(c) {
    try {
      const res = await quickOpenExisting({
        customer_id: c.customer_id,
        on_open: "return",
        confirm_delete: false,
      });

      navigate(`/purchase/${res.purchase_id}`);
    } catch (e) {
      alert(e?.message || "เปิดบิลไม่สำเร็จ");
    }
  }

  const showing = q ? searchPageItems : items;
  const isLoading = q ? searchLoading : loading;
  const totalPagesSafe = q ? searchTotalPages : totalPages;

  // ==== Pagination Logic  ====
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPagesSafe;

  const pageNumbers = (() => {
    const maxButtons = 3;
    const start = Math.max(
      1,
      Math.min(page - 2, Math.max(1, totalPagesSafe - (maxButtons - 1)))
    );
    const end = Math.min(totalPagesSafe, start + (maxButtons - 1));
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  return (
    <div className="container py-3">
      <h2 className="page-title mb-3">รายชื่อลูกค้า</h2>

      <div className="cs-card">

        {/* ช่องค้นหา */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="tools-left" style={{ width: "50%" }}>
            <div className="input-group tools-search">
              <input
                type="text"
                className="form-control"
                placeholder="ค้นหาลูกค้า"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onSearchKey}
              />
              {q ? (
                <button className="input-group-text btn btn-light" type="button" onClick={() => setQ("")}>
                  ×
                </button>
              ) : (
                <span className="input-group-text">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                    fill="currentColor" viewBox="0 0 16 16">
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242 1.156a5 5 0 1 1 0-10.001 5 5 0 0 1 0 10z" />
                  </svg>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ตาราง */}
        {err && <div className="alert alert-danger py-2 mb-2">{err}</div>}

        <div className="table-responsive">
          <table className="table cs-table align-middle mb-0">
            <thead>
              <tr>
                <th className="col-avatar">รูป</th>
                <th className="text-center">ชื่อ</th>
                <th>ที่อยู่</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={3} className="text-center text-muted py-4">กำลังโหลด...</td></tr>
              ) : showing.length === 0 ? (
                <tr><td colSpan={3} className="text-center text-muted py-4">ไม่พบข้อมูล</td></tr>
              ) : (
                showing.map((c, idx) => (
                  <tr
                    key={c.customer_id}
                    className={`cs-row ${idx % 2 ? "even" : "odd"}`}
                    onClick={() => selectCustomer(c)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="col-avatar">
                      <div className="avatar-40">
                        {c.photo_path ? (
                          <img src={resolveImg(c.photo_path)} alt="" />
                        ) : (
                          <div className="avatar-empty" />
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      {c.full_name || <span className="text-muted">ไม่ระบุ</span>}
                    </td>
                    <td className="addr">
                      {c.address || <span className="text-muted">-</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ==== Pagination  ==== */}
        <div className="cs-footer justify-content-center">
          <div className="cs-pager">

            {!isFirstPage && totalPagesSafe > 1 && (
              <button className="pager-text" onClick={() => setPage(page - 1)}>
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

            {!isLastPage && totalPagesSafe > 1 && (
              <button className="pager-text" onClick={() => setPage(page + 1)}>
                ถัดไป
              </button>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
