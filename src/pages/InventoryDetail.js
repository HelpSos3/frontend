import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { getPurchasedHistorySimple, getSoldHistorySimple } from "../api/inventory";
import DateRangePicker from "../components/DateRangePicker";
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

const formatTimeThai = (input) => {
  if (!input) return "-";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "-";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

export default function InventoryDetail() {
  const { prodId } = useParams();
  const navigate = useNavigate();
  const pid = Number(prodId);
  const loc = useLocation();
  const tabFromUrl = new URLSearchParams(loc.search).get("tab");
  const prodNameFromState = loc?.state?.prodName || "";

  const [activeTab, setActiveTab] = useState(
    tabFromUrl === "sold" ? "sold" : "purchased"
  );

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [productName, setProductName] = useState(
    prodNameFromState || "สินค้า"
  );

  const title = useMemo(() => {
    return `รายละเอียด ${productName}`;
  }, [productName]);

  // โหลดข้อมูล ซื้อหรือขาย
  const fetchData = useCallback(async () => {
    if (!pid) return;
    setLoading(true);
    setErr("");

    try {
      const params = {
        page,
        per_page: perPage,
        ...(dateFrom ? { date_from: dateFrom } : {}),
        ...(dateTo ? { date_to: dateTo } : {}),
      };

      const data =
        activeTab === "purchased"
          ? await getPurchasedHistorySimple(pid, params)
          : await getSoldHistorySimple(pid, params);

      setRows(data?.items || []);
      setTotal(Number(data?.total || 0));

      if (
        !prodNameFromState &&
        data?.items?.length > 0 &&
        data.items[0]?.prod_name
      ) {
        setProductName((prev) =>
          prev === "สินค้า" ? data.items[0].prod_name : prev
        );
      }
    } catch (e) {
      setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [pid, page, perPage, activeTab, dateFrom, dateTo, prodNameFromState]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  //เปลี่ยน tab การซื้อขาย
  const handleChangeTab = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPage(1);
    navigate(`?tab=${tab}`, { replace: true });
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(Math.max(total, 1) / perPage));
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  const pageNumbers = (() => {
    const maxButtons = 3;
    const start = Math.max(
      1,
      Math.min(page - 1, Math.max(1, totalPages - (maxButtons - 1)))
    );
    const end = Math.min(totalPages, start + (maxButtons - 1));
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  return (
    <div className="page-wrap">
      {/* ปุ่มย้อนกลับ */}
      <div className="cd-back">
        <button onClick={() => navigate("/inventory")} className="cd-back-btn">
          ‹ ย้อนกลับ
        </button>
      </div>

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3 position-relative">
        <h2 className="page-title mb-1">{title}</h2>

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

      <div className="cs-card">
        {/* Tabs */}
        <div className="d-flex gap-2 mb-3">
          <button
            className={`btn btn-tab ${activeTab === "purchased" ? "active" : ""}`}
            onClick={() => handleChangeTab("purchased")}
          >
            สินค้าที่รับซื้อ
          </button>
          <button
            className={`btn btn-tab ${activeTab === "sold" ? "active" : ""}`}
            onClick={() => handleChangeTab("sold")}
          >
            สินค้าที่ขาย
          </button>
        </div>

        {err && <div className="alert alert-danger py-2 mb-2">{err}</div>}

        {/* ตาราง */}
        <div className="table-responsive">
          <table className="table cs-table inv-table align-middle mb-0">
            <thead>
              <tr>
                <th className="text-start">ชื่อสินค้า</th>
                <th className="text-center">วันที่</th>
                <th className="text-center">เวลา</th>
                <th className="text-center">จำนวน (kg)</th>
                {activeTab === "purchased" && (
                  <th className="text-center">ราคา</th>
                )}
                {activeTab === "sold" && (
                  <th className="text-center">หมายเหตุ</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    กำลังโหลด...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={idx} className={`cs-row ${idx % 2 ? "even" : "odd"}`}>
                    <td className="text-start fw-semibold">
                      {r.prod_name || "-"}
                    </td>
                    <td className="text-center">
                      {formatDateThai(r.date)}
                    </td>
                    <td className="text-center">
                      {formatTimeThai(r.date)}
                    </td>
                    <td className="text-center">
                      {r.weight != null
                        ? `${Number(r.weight).toLocaleString()} kg`
                        : "-"}
                    </td>
                    {activeTab === "purchased" && (
                      <td className="text-center">
                        {r.price != null
                          ? Number(r.price).toLocaleString()
                          : "-"}
                      </td>
                    )}
                    {activeTab === "sold" && (
                      <td className="inv-note">{r.note || "-"}</td>
                    )}
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
                onClick={() => setPage((p) => p - 1)}
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

            {!isLastPage && (
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
    </div>
  );
}
