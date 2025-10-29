// src/pages/InventoryDetail.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
    getPurchasedHistorySimple,
    getSoldHistorySimple,
} from "../api/inventory";
import "../css/inventory.css";

const formatDateTimeThai = (input) => {
    if (!input) return "-";
    const d = new Date(input);
    if (isNaN(d.getTime())) return "-";
    const day = `${d.getDate()}`.padStart(2, "0");
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const year = `${d.getFullYear() + 543}`.slice(-2);
    const hh = `${d.getHours()}`.padStart(2, "0");
    const mm = `${d.getMinutes()}`.padStart(2, "0");
    return `${day}/${month}/${year} ${hh}:${mm}`;
};

export default function InventoryDetail() {
    const { prodId } = useParams();
    const pid = Number(prodId);
    const loc = useLocation();

    const prodNameFromState = loc?.state?.prodName || "";

    const [activeTab, setActiveTab] = useState("purchased");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [showPicker, setShowPicker] = useState(false);

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const perPage = 20;
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const title = useMemo(() => {
        if (prodNameFromState) return `รายละเอียด ${prodNameFromState}`;
        return "รายละเอียดสินค้า";
    }, [prodNameFromState]);

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

            let data =
                activeTab === "purchased"
                    ? await getPurchasedHistorySimple(pid, params)
                    : await getSoldHistorySimple(pid, params);

            setRows(data?.items || []);
            setTotal(Number(data?.total || 0));
        } catch (e) {
            setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
            setRows([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [pid, page, perPage, activeTab, dateFrom, dateTo]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleChangeTab = (tab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);
        setPage(1);
    };

    const clearRange = () => {
        setDateFrom("");
        setDateTo("");
        setPage(1);
        setShowPicker(false);
    };

    // ✅ คำนวณ pagination ใหม่ให้ robust
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
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3 position-relative">
                <h2 className="page-title mb-1">{title}</h2>

                {/* ปุ่มเลือกวันที่ */}
                <div className="position-relative">
                    <button className="btn btn-pill" onClick={() => setShowPicker((v) => !v)}>
                        เลือกวันที่
                    </button>

                    {showPicker && (
                        <div
                            className="cs-popover date-popover p-3"
                            style={{
                                position: "absolute",
                                right: 0,
                                top: "110%",
                                zIndex: 9999,
                                background: "#fff",
                                borderRadius: 12,
                                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                idth: 360,
                                maxWidth: "90vw",
                            }}
                        >
                            <div className="mb-2 fw-semibold">ช่วงวันที่</div>
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <div className="flex-grow-1">
                                    <label className="form-label small text-muted">ตั้งแต่</label>
                                    <input
                                        type="date"
                                        lang="th-TH"
                                        className="form-control"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>
                                <div className="flex-grow-1">
                                    <label className="form-label small text-muted">ถึง</label>
                                    <input
                                        type="date"
                                        lang="th-TH"
                                        className="form-control"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="d-flex justify-content-end gap-2">
                                <button className="btn btn-light" onClick={clearRange}>
                                    ล้างช่วง
                                </button>
                                <button
                                    className="btn btn-pill"
                                    onClick={() => {
                                        setPage(1);
                                        setShowPicker(false);
                                        fetchData();
                                    }}
                                >
                                    ตกลง
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="cs-card">
                {/* Tabs */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex gap-2">
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
                </div>

                {err && <div className="alert alert-danger py-2 mb-2">{err}</div>}

                {/* ตาราง */}
                <div className="table-responsive">
                    <table className="table cs-table inv-table align-middle mb-0">
                        <thead>
                            <tr>
                                <th className="text-start" style={{ width: 280 }}>ชื่อสินค้า</th>
                                <th className="text-center">
                                    วันที่/เวลา {activeTab === "purchased" ? "รับซื้อ" : "ขายสินค้า"}
                                </th>
                                <th className="text-center">จำนวน (kg)</th>
                                {activeTab === "purchased" && <th className="text-center">ราคา</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={activeTab === "purchased" ? 4 : 3} className="text-center text-muted py-4">
                                        กำลังโหลด...
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={activeTab === "purchased" ? 4 : 3} className="text-center text-muted py-4">
                                        ไม่พบข้อมูล
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r, idx) => (
                                    <tr key={`${r.prod_id}-${idx}`} className={`cs-row ${idx % 2 ? "even" : "odd"}`}>
                                        <td className="text-start">
                                            <div className="fw-semibold">{r.prod_name || "-"}</div>
                                        </td>
                                        <td className="text-center">{formatDateTimeThai(r.date)}</td>
                                        <td className="text-center">
                                            {r?.weight != null ? `${Number(r.weight).toLocaleString()} kg` : "-"}
                                        </td>
                                        {activeTab === "purchased" && (
                                            <td className="text-center">
                                                {r?.price != null ? Number(r.price).toLocaleString() : "-"}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ✅ Pagination ไม่หายอีกต่อไป */}
                {/* ✅ Pagination */}
                <div className="cs-footer justify-content-center">
                    <div className="cs-pager">
                        {/* แสดงเฉพาะเมื่อไม่ใช่หน้าแรก */}
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

                        {/* ✅ ถัดไปให้เห็นตลอด ไม่ต้องรอหลายหน้า */}
                        <button
                            className="pager-text"
                            disabled={isLastPage}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                            ถัดไป
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}
