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
    if (/^https?:\/\//.test(p)) return p;
    return `${API_BASE}${p.startsWith("/") ? "" : "/"}${p}`;
  };

  // ====== state ======
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);            
  const [totalPages, setTotalPages] = useState(0);   
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const allItemsRef = useRef(null);                  
  const [searchLoading, setSearchLoading] = useState(false);

  const PAGE_SIZE = 20;

  async function fetchPaged(pageArg = page) {
    try {
      setLoading(true);
      setErr("");
      const data = await listCustomers({
        page: pageArg,
        page_size: PAGE_SIZE,
      });
      setItems(data.items || []);
      setTotalPages(data.total_pages || 1);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "โหลดรายชื่อลูกค้าไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!q) {
      fetchPaged(page);
    }
    // eslint-disable-next-line
  }, [page, q]);

  async function ensureAllLoaded() {
    if (allItemsRef.current) return; 
    setSearchLoading(true);
    try {
      const first = await listCustomers({ page: 1, page_size: 100 });
      const total = Math.max(1, first.total_pages || 1);
      let acc = first.items || [];

      for (let p = 2; p <= total; p++) {
        const resp = await listCustomers({ page: p, page_size: 100 });
        acc = acc.concat(resp.items || []);
      }
      allItemsRef.current = acc;
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "โหลดข้อมูลสำหรับค้นหาไม่สำเร็จ");
    } finally {
      setSearchLoading(false);
    }
  }

  // กรองชื่อ
  const norm = (s) =>
    (s || "")
      .toString()
      .toLowerCase()
      .trim();

  const filtered = useMemo(() => {
    if (!q || !allItemsRef.current) return [];
    const nq = norm(q);
    return allItemsRef.current.filter((c) => norm(c.full_name).includes(nq));
  }, [q]);

  const searchTotalPages = useMemo(() => {
    if (!q) return 1;
    return Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  }, [q, filtered.length]);

  const searchPageItems = useMemo(() => {
    if (!q) return [];
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [q, page, filtered]);

  useEffect(() => {
    let t;
    if (q) {
      t = setTimeout(async () => {
        await ensureAllLoaded();
        setPage(1);
      }, 250); 
    }
    return () => t && clearTimeout(t);
    // eslint-disable-next-line
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
  const totalPagesSafe = q ? searchTotalPages : Math.max(1, totalPages);

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
                <button
                  className="input-group-text btn btn-light"
                  type="button"
                  onClick={() => setQ("")}
                  title="ล้างคำค้น"
                >
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

        {/* ตารางรายชื่อลูกค้า */}
        {err && <div className="alert alert-danger py-2 mb-2">{err}</div>}

        <div className="table-responsive">
          <table className="table cs-table align-middle mb-0">
            <thead>
              <tr>
                <th style={{ width: 60 }}>รูป</th>
                <th className="text-center">ชื่อ</th>
                <th>ที่อยู่</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={3} className="text-center text-muted py-4">กำลังโหลด...</td></tr>
              ) : (showing?.length || 0) === 0 ? (
                <tr><td colSpan={3} className="text-center text-muted py-4">ไม่พบข้อมูล</td></tr>
              ) : (
                showing.map((c, idx) => (
                  <tr
                    key={c.customer_id}
                    className={`cs-row ${idx % 2 ? "even" : "odd"}`}
                    onClick={() => selectCustomer(c)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div className="avatar-40">
                        {c.photo_path ? <img src={resolveImg(c.photo_path)} alt="" /> : null}
                      </div>
                    </td>
                    <td className="text-center">{c.full_name || <span className="text-muted">ไม่ระบุ</span>}</td>
                    <td className="addr">{c.address || <span className="text-muted">-</span>}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* หน้าถัดไป */}
        <div className="cs-footer justify-content-center">
          <div className="cs-pager">
            {/* หน้าแรก */}
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

            {/* ปุ่มถัดไป */}
            <button
              className="pager-text"
              onClick={() => setPage((p) => p + 1)}
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
