import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AnonymousModal from "./AnonymousModal";
import {previewIdCard, quickOpenIdCard, getOpenPurchase, deleteOpenPurchase,} from "../api/purchases";
import "../css/IdentitySelect.css";

import faceIcon from "../image/identityscan.png";
import personIcon from "../image/Anonymous.png";
import groupIcon from "../image/CustomerSelect.png";

export default function IdentitySelect() {
  const navigate = useNavigate();

  // --- ตรวจบิลค้าง ---
  const [openBill, setOpenBill] = useState(null);
  const [checkingOpen, setCheckingOpen] = useState(true);
  const [deletingOpen, setDeletingOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setCheckingOpen(true);
        const data = await getOpenPurchase();
        if (data) setOpenBill(data);
      } catch (_) {
      } finally {
        setCheckingOpen(false);
      }
    })();
  }, []);

  const handleGoToOpen = () => {
    if (openBill?.purchase_id) navigate(`/purchase/${openBill.purchase_id}`);
  };

  const handleDeleteOpen = async () => {
    try {
      setDeletingOpen(true);
      await deleteOpenPurchase();
      setOpenBill(null);
    } catch (e) {
      alert(e?.message || "ลบบิลไม่สำเร็จ");
    } finally {
      setDeletingOpen(false);
    }
  };

  // --- โมดอลระบุตัวตน ---
  const [showModal, setShowModal] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState("");
  const [notice, setNotice] = useState("");
  const [cardData, setCardData] = useState({
    national_id: "",
    full_name: "",
    address: "",
    photo_url: "",
  });

  const openModal = () => {
    setCardData({ national_id: "", full_name: "", address: "", photo_url: "" });
    setNotice("");
    setScanError("");
    setScanLoading(false);
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const hasScannedData =
    !!(cardData.full_name || cardData.national_id || cardData.photo_url || cardData.address);

  const canConfirm = !!(cardData.full_name || cardData.national_id);

  // ดึงข้อมูลบัตรจากเครื่องอ่าน
  const handleScan = async () => {
    if (scanLoading) return;
    try {
      setScanError("");
      setScanLoading(true);

      const res = await previewIdCard({ reader_index: 0, with_photo: 1 });
      const photo_url = res.photo_base64 ? `data:image/jpeg;base64,${res.photo_base64}` : "";

      setCardData({
        national_id: res.national_id || "",
        full_name: res.full_name || "",
        address: res.address || "",
        photo_url,
      });
      setNotice("แสดงข้อมูลจากบัตร (ยังไม่บันทึก)");
    } catch (e) {
      setScanError(e?.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setScanLoading(false);
    }
  };

  // ยืนยันเปิดบิลด้วยข้อมูลบัตรที่อ่านได้
  const handleConfirm = async () => {
    if (!canConfirm) return;
    try {
      setScanError("");
      setNotice("");

      const res = await quickOpenIdCard({
        national_id: cardData.national_id,
        full_name: cardData.full_name || null,
        address: cardData.address || null,
        photo_base64: cardData.photo_url
          ? cardData.photo_url.split(",")[1]
          : undefined, 
        on_open: "return",
        confirm_delete: false,
      });

      setShowModal(false);
      navigate(`/purchase/${res.purchase_id}`);
    } catch (e) {
      setScanError(e?.message || "บันทึกไม่สำเร็จ");
    }
  };

  // ---โมดอลไม่ระบุตัวตน ---
  const [showAnonymous, setShowAnonymous] = useState(false);

  return (
    <div className="container-fluid p-0">
      {/* Modal แจ้งเตือนบิลค้าง */}
      {openBill && (
        <>
          <div
            className="modal fade show open-bill-modal"
            style={{ display: "block" }}
          >
            <div className="modal-dialog modal-md modal-dialog-centered">
              <div className="modal-content rounded-4">
                <div className="modal-header border-0">
                  <h5 className="modal-title fw-bold">พบใบเปิดค้างอยู่</h5>
                </div>
                <div className="modal-body">
                  <div className="open-bill-summary mb-3">
                    <div><span className="label">เลขที่บิล:</span> {openBill.purchase_id}</div>
                    <div><span className="label">ชื่อลูกค้า:</span> {openBill.customer_name || "ไม่ระบุ"}</div>
                    {openBill.customer_national_id && (
                      <div><span className="label">เลขบัตร:</span> {openBill.customer_national_id}</div>
                    )}
                    {openBill.updated_at && (
                      <div className="updated">
                        อัปเดตล่าสุด: {new Date(openBill.updated_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <p className="mb-0">คุณต้องการทำอย่างไร?</p>
                </div>
                <div className="modal-footer border-0 justify-content-between open-bill-actions">
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary" onClick={handleGoToOpen}>
                      ไปยังบิล
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={handleDeleteOpen}
                      disabled={deletingOpen}
                    >
                      {deletingOpen ? "กำลังลบ..." : "ลบบิลนี้"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}


      <div className="row g-0">
        <div className="col bg-app-green min-vh-100 d-flex flex-column">
          <div className="container py-5">
            <h1 className="identity-header">กรุณาเลือกวิธียืนยันตัวตน</h1>

            <div className="row justify-content-center gy-4 gx-4 mt-4">
              {/* ระบุตัวตน */}
              <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                <button
                  className="card w-100 border-0 shadow-lg rounded-4 p-4 card-click"
                  onClick={openModal}
                  disabled={!!openBill}
                >
                  <div className="card-body text-center">
                    <img src={faceIcon} alt="ระบุตัวตน" className="img-fluid" style={{ maxHeight: 96 }} />
                    <h5 className="fw-bold mt-3 mb-0">ระบุตัวตน</h5>
                  </div>
                </button>
              </div>

              {/* ไม่ระบุตัวตน */}
              <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                <button
                  className="card w-100 border-0 shadow-lg rounded-4 p-4 card-click"
                  onClick={() => setShowAnonymous(true)}
                  disabled={!!openBill}
                >
                  <div className="card-body text-center">
                    <img src={personIcon} alt="ไม่ระบุตัวตน" className="img-fluid" style={{ maxHeight: 96 }} />
                    <h5 className="fw-bold mt-3 mb-0">ไม่ระบุตัวตน</h5>
                  </div>
                </button>
              </div>

              {/* ลูกค้า */}
              <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                <button
                  className="card w-100 border-0 shadow-lg rounded-4 p-4 card-click"
                  onClick={() => navigate("/purchase/customers")}
                  disabled={!!openBill}
                >
                  <div className="card-body text-center">
                    <img src={groupIcon} alt="ลูกค้า" className="img-fluid" style={{ maxHeight: 96 }} />
                    <h5 className="fw-bold mt-3 mb-0">ลูกค้า</h5>
                  </div>
                </button>
              </div>
            </div>

            {checkingOpen && (
              <p className="text-center text-muted mt-3 small">(กำลังตรวจสอบบิลค้าง...)</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal พรีวิวบัตร */}
      {showModal && (
        <>
          <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,0.4)" }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content rounded-4 identity-modal">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold mx-auto">ข้อมูลลูกค้า</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={closeModal} />
                </div>

                <div className="modal-body pt-3">
                  {scanError && <div className="alert alert-danger py-2">{scanError}</div>}
                  {notice && !scanError && <div className="alert alert-info py-2">{notice}</div>}

                  <div className="row g-3 align-items-start">
                    <div className="col-12 col-md-8">
                      <p><strong>เลขประจำตัวบัตรประชาชน:</strong> {cardData.national_id}</p>
                      <p><strong>ชื่อและนามสกุล:</strong> {cardData.full_name}</p>
                      <p><strong>ที่อยู่:</strong> {cardData.address}</p>
                    </div>

                    <div className="col-12 col-md-4 d-flex justify-content-md-end justify-content-start">
                      <div className="border rounded-3 bg-light d-flex align-items-center justify-content-center" style={{ width: 140, height: 140 }}>
                        {cardData.photo_url ? (
                          <img src={cardData.photo_url} alt="รูปถ่ายลูกค้า" className="img-fluid rounded-2" />
                        ) : (
                          <span className="text-muted">ไม่มีรูป</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 justify-content-center gap-3 pb-4">
                  {!hasScannedData && (
                    <button
                      type="button"
                      className="btn btn-scan"
                      onClick={handleScan}
                      disabled={scanLoading}
                    >
                      {scanLoading ? "กำลังดึงข้อมูล..." : "ดึงข้อมูล"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-confirm"
                    disabled={!canConfirm}
                    onClick={handleConfirm}
                  >
                    ยืนยัน
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={closeModal}></div>
        </>
      )}

      {/* Modal ไม่ระบุตัวตน */}
      <AnonymousModal
        show={showAnonymous}
        onClose={() => setShowAnonymous(false)}
        onCommitted={(purchase) => {
          setShowAnonymous(false);
          if (purchase?.purchase_id) navigate(`/purchase/${purchase.purchase_id}`);
        }}
      />
    </div>
  );
}
