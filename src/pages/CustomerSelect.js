import React, { useEffect, useMemo, useState } from "react";
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

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function fetchData(params = {}) {
    try {
      setLoading(true);
      setErr("");
      const data = await listCustomers({
        q,
        page,
        page_size: 20, // 20 แถวต่อหน้า
        ...params,
      });
      setItems(data.items || []);
      setTotalPages(data.total_pages || 0);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "โหลดรายชื่อลูกค้าไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [page]); // eslint-disable-line

  const onSearch = () => { setPage(1); fetchData({ page: 1 }); };
  const onSearchKey = (e) => {
    if (e.key === "Enter") onSearch();
    if (e.key === "Escape") setQ("");
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

  
  const totalPagesSafe = Math.max(1, totalPages);

  // ปุ่มเลขหน้า
  const pageNumbers = (() => {
    const maxButtons = 3;
    const start = Math.max(1, Math.min(page - 2, Math.max(1, totalPagesSafe - (maxButtons - 1))));
    const end = Math.min(totalPagesSafe, start + (maxButtons - 1));
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  // ถ้า totalPages ลดลงแล้ว page เกิน ให้ดึงกลับเข้าช่วง
  useEffect(() => {
    if (page > totalPagesSafe) setPage(totalPagesSafe);
  }, [totalPagesSafe]); // eslint-disable-line

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
              <span className="input-group-text">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                     fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242 1.156a5 5 0 1 1 0-10.001 5 5 0 0 1 0 10z" />
                </svg>
              </span>
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
              {loading ? (
                <tr><td colSpan={3} className="text-center text-muted py-4">กำลังโหลด...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={3} className="text-center text-muted py-4">ไม่พบข้อมูล</td></tr>
              ) : (
                items.map((c, idx) => (
                  <tr
                    key={c.customer_id}
                    className={`cs-row ${idx % 2 ? "even" : "odd"}`}
                    onClick={() => selectCustomer(c)}
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
            <button
              className="pager-text"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ก่อนหน้า
            </button>

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
              disabled={page >= totalPagesSafe}
              onClick={() => setPage((p) => Math.min(totalPagesSafe, p + 1))}
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
