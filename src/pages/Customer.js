import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCustomers } from "../api/customers";
import "../css/customer.css";

/* แยกวัน-เวลา + แปลงเป็น พ.ศ. */
const splitDateTime = (input) => {
  if (!input || typeof input !== "string") {
    return { date: "-", time: "-" };
  }

  const [datePart, timePart] = input.split(" ");
  if (!datePart) {
    return { date: "-", time: "-" };
  }

  const [dd, mm, yyyy] = datePart.split("/");
  if (!dd || !mm || !yyyy) {
    return { date: "-", time: "-" };
  }

  const yearBE = parseInt(yyyy, 10) + 543;

  return {
    date: `${dd}/${mm}/${yearBE}`,
    time: timePart ? timePart.slice(0, 5) : "-",
  };
};

/* ตัดคำนำหน้าชื่อ */
const normalizeNameQuery = (q) => {
  if (!q) return q;
  return q.replace(/^(นาย|นางสาว|นาง|น\.ส\.)\s*/i, "").trim();
};

export default function CustomerPage() {
  const navigate = useNavigate();

  const [customers, setCustomer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [totalPages, setTotalPages] = useState(1);

  const API_BASE = useMemo(
    () =>
      (process.env.REACT_APP_API_BASE || "http://localhost:8080").replace(
        /\/+$/,
        ""
      ),
    []
  );

  const resolveImg = (p) => {
    if (!p) return "";
    if (/^https?:\/\//i.test(p)) return p;
    return `${API_BASE}/${p.replace(/^\/+/, "")}`;
  };

  const loadCustomers = useCallback(
    async (keyword = "") => {
      try {
        setLoading(true);
        setErr("");

        const data = await fetchCustomers({
          q: keyword,
          page,
          per_page: perPage,
        });

        setCustomer(data.items || []);
        setTotalPages(data.total_pages || 1);
      } catch (e) {
        setErr("โหลดรายชื่อลูกค้าไม่สำเร็จ");
        setCustomer([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [page, perPage]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      loadCustomers(normalizeNameQuery(q));
    }, 250);
    return () => clearTimeout(t);
  }, [q, page, loadCustomers]);

  /* pagination */
  const totalPagesSafe = Math.max(1, totalPages);
  const maxButtons = 3;

  let start = Math.max(1, page - 1);
  let end = start + maxButtons - 1;

  if (end > totalPagesSafe) {
    end = totalPagesSafe;
    start = Math.max(1, end - maxButtons + 1);
  }

  const pageNumbers = [];
  for (let i = start; i <= end; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="inv-page">
      {/* ===== Header ===== */}
      <div className="inv-head">
        <h2 className="inv-title">รายชื่อลูกค้า</h2>
      </div>

      {/* ===== Card ===== */}
      <div className="cs-card inv-card">
        {/* ===== Tools (Search) ===== */}
        <div className="inv-tools">
          <div className="input-group tools-search" style={{ maxWidth: 380 }}>
            <input
              type="text"
              className="form-control"
              placeholder="ค้นหาลูกค้า"
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

        {/* ===== Table ===== */}
        <div className="inv-table-wrap">
          <div className="table-responsive">
            <table className="table cs-table align-middle mb-0">
              <thead>
                <tr>
                  <th className="col-avatar">รูป</th>
                  <th className="text-center col-name">ชื่อ</th>
                  <th className="col-address">ที่อยู่</th>
                  <th className="col-date">วันที่มาล่าสุด</th>
                  <th className="col-time">เวลา</th>
                  <th className="col-action text-center">รายละเอียด</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      กำลังโหลด...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      ไม่พบข้อมูลลูกค้า
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.customer_id}>
                      <td className="col-avatar">
                        <div className="avatar-40">
                          {c.photo ? (
                            <img src={resolveImg(c.photo)} alt="" />
                          ) : (
                            <div className="avatar-empty" />
                          )}
                        </div>
                      </td>

                      <td className="text-center">{c.full_name}</td>
                      <td className="addr">{c.address || "-"}</td>

                      {(() => {
                        const { date, time } = splitDateTime(
                          c.last_purchase_date
                        );
                        return (
                          <>
                            <td>{date}</td>
                            <td>{time}</td>
                          </>
                        );
                      })()}

                      <td className="text-center">
                        <button
                          className="cs-more"
                          onClick={() =>
                            navigate(`/customers/${c.customer_id}`)
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

        {/* ===== Pagination ===== */}
        <div className="cs-footer justify-content-center">
          <div className="cs-pager">
            {page > 1 && (
              <button
                className="pager-text"
                onClick={() => setPage(page - 1)}
              >
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
              <button
                className="pager-text"
                onClick={() => setPage(page + 1)}
              >
                ถัดไป
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
