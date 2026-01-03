import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCustomerDetail } from "../api/customers";
import "../css/CustomerDetail.css";

const formatTimeThai = (input) => {
    if (!input) return "-";

    // เวลาแบบ HH:MM → ส่งคืนเลย
    if (/^\d{2}:\d{2}$/.test(input)) {
        return input;
    }

    // เวลาแบบ datetime
    const d = new Date(input);
    if (isNaN(d.getTime())) return "-";

    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
};


const formatDateThai = (input) => {
    if (!input) return "-";

    // กรณี backend ส่งมาเป็น "DD/MM/YYYY"
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
        const [d, m, y] = input.split("/");
        return `${d}/${m}/${String(Number(y))}`;
    }

    // กรณีเป็น datetime ที่ JS อ่านได้
    const d = new Date(input);
    if (isNaN(d.getTime())) return "-";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear());
    return `${day}/${month}/${year}`;
};


function CustomerDetail() {
    const { customerId } = useParams();
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [page, setPage] = useState(1);
    const perPage = 20;
    const [totalPages, setTotalPages] = useState(1);

    const loadDetail = useCallback(async () => {
        try {
            setLoading(true);
            setErr("");

            const data = await fetchCustomerDetail(customerId, page, perPage);

            setItems(data.items || []);
            setTotalPages(data.total_pages || 1);
        } catch (e) {
            console.error(e);
            setErr("โหลดข้อมูลลูกค้าไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    }, [customerId, page, perPage]);  

    useEffect(() => {
        loadDetail();
    }, [loadDetail]);

    const info = items.length > 0 ? items[0] : null;

    return (
        <div className="cd-page">
            {/* ปุ่มย้อนกลับ */}
            <div className="cd-back">
                <button onClick={() => navigate("/customers")} className="cd-back-btn">
                    ‹ ย้อนกลับ
                </button>
            </div>

            {/* กล่องขาวใหญ่ */}
            <div className="cd-card">
                {err && <p style={{ color: "red" }}>{err}</p>}
                {loading && <p>กำลังโหลด...</p>}

                {/* ข้อมูลลูกค้า */}
                {info && (
                    <>
                        <div className="cd-name-title">{info.full_name}</div>

                        <div className="cd-section-title">ข้อมูลทั่วไป</div>

                        <div className="cd-info-box">
                            <div className="cd-info-row">
                                <div className="cd-info-label">เลขประจำตัวบัตรประชาชน</div>
                                <div className="cd-info-value">{info.national_id || "-"}</div>
                            </div>

                            <div className="cd-info-row">
                                <div className="cd-info-label">ชื่อลูกค้า</div>
                                <div className="cd-info-value">{info.full_name}</div>
                            </div>

                            <div className="cd-info-row">
                                <div className="cd-info-label">ที่อยู่</div>
                                <div className="cd-info-value">{info.address || "-"}</div>
                            </div>
                        </div>
                    </>
                )}

                {/* ตารางประวัติการขาย */}
                <div className="cd-section-title">รายการสินค้าที่นำมาขาย</div>

                <div className="cd-table-wrapper">
                    <table className="cd-table">
                        <thead>
                            <tr>
                                <th>ชื่อสินค้า</th>
                                <th>วันที่รับซื้อ</th>
                                <th>เวลา</th>
                                <th>จำนวน (kg)</th>
                                <th>จำนวนเงิน</th>
                                <th>ประเภทเงิน</th>
                                <th>หมวดหมู่</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && items.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center" }}>
                                        ไม่มีประวัติการขาย
                                    </td>
                                </tr>
                            )}

                            {items.map((it, idx) => (
                                <tr key={idx}>
                                    <td>{it.prod_name}</td>
                                    <td>{formatDateThai(it.purchase_date)}</td>
                                    <td>{formatTimeThai(it.purchase_time)}</td>
                                    <td>{it.weight} kg</td>
                                    <td>{it.price}</td>
                                    <td>{it.payment_method}</td>
                                    <td>{it.category_name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="cs-footer justify-content-center">
                    <div className="cs-pager">

                        {/* แสดง "ก่อนหน้า" เฉพาะเมื่อ page > 1 */}
                        {page > 1 && (
                            <button
                                className="pager-text"
                                onClick={() => setPage((p) => p - 1)}
                            >
                                ก่อนหน้า
                            </button>
                        )}

                        {/* ปุ่มเลขหน้า */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                            <button
                                key={num}
                                className={`page-pill ${num === page ? "active" : ""}`}
                                onClick={() => setPage(num)}
                            >
                                {num}
                            </button>
                        ))}

                        {/* แสดง "ถัดไป" เฉพาะเมื่อ page < totalPages */}
                        {page < totalPages && (
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

export default CustomerDetail;
