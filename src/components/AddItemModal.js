import React from "react";

export default function AddItemModal({
    modalOpen,
    selectedProduct,
    modalErr,
    capturing,
    captured,

    /* ===== กล้อง / รูป ===== */
    liveCameraUrl,    // 🔴 URL กล้องสด MJPEG
    photoB64,         // base64 จาก preview
    snapshotUrl,      // (ยังเก็บไว้เผื่อ compatibility)

    weight,
    setWeight,
    fetchWeightFromScale,
    roundStep,
    setRoundStep,
    submitLoading,
    doPreviewFromHardware,
    handleRetake,
    handleConfirmAdd,
    onClose,
}) {
    if (!modalOpen || !selectedProduct) return null;

    return (
        <>
            <div
                className="modal fade show modal-add"
                style={{ display: "block", background: "rgba(0,0,0,.45)" }}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">รายละเอียด</h5>
                            <div className="close-wrap">
                                <button
                                    className="btn-close-circle"
                                    onClick={onClose}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="modal-body">
                            {modalErr && (
                                <div className="alert alert-danger py-2 mb-2">
                                    {modalErr}
                                </div>
                            )}

                            {/* === กล้องพรีวิว === */}
                            <div className="upload-wrap">
                                <div className="upload-box" style={{ position: "relative" }}>
                                    <div
                                        className="upload-img"
                                        style={{
                                            background: "#dcdcdc",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {/* ===== กำลังถ่าย ===== */}
                                        {capturing && (
                                            <span className="upload-label">
                                                กำลังถ่ายภาพ…
                                            </span>
                                        )}

                                        {/* ===== กล้องสด (เปิดตลอด) ===== */}
                                        {!capturing && liveCameraUrl && (
                                            <img
                                                src={`${liveCameraUrl}?t=${Date.now()}`}
                                                alt="live camera"
                                                className="upload-img"
                                            />
                                        )}


                                        {/* ===== รูปที่ถ่ายแล้ว (overlay) ===== */}
                                        {!capturing && photoB64 && (
                                            <img
                                                src={`data:image/jpeg;base64,${photoB64}`}
                                                alt="snapshot"
                                                className="upload-img"
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    objectFit: "cover",
                                                }}
                                            />
                                        )}

                                        {!capturing && !liveCameraUrl && (
                                            <span className="text-muted">
                                                ยังไม่มีรูป
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <p className="text-danger small mt-2">
                                    * ถ่ายรูปลูกค้าคู่กับสินค้าที่นำมาขาย
                                </p>

                                <div className="anon-actions">
                                    {!photoB64 ? (
                                        <button
                                            type="button"
                                            className="btn-save-photo"
                                            onClick={doPreviewFromHardware}
                                            disabled={capturing}
                                        >
                                            บันทึกรูป
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn-retake"
                                            onClick={handleRetake}
                                            disabled={capturing}
                                        >
                                            ถ่ายใหม่
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-12">
                                    <div className="field-label">ราคาต่อหน่วย</div>
                                    <input
                                        className="form-control input-ctl"
                                        value={`${Number(
                                            selectedProduct?.prod_price || 0
                                        ).toLocaleString()} บาท${selectedProduct?.unit
                                                ? ` / ${selectedProduct.unit}`
                                                : ""
                                            }`}
                                        readOnly
                                    />
                                </div>

                                <div className="col-12 col-sm-6">
                                    <div className="field-label">
                                        น้ำหนัก (กรอกเองได้)
                                    </div>

                                    <div className="form-group">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="form-control weight-input"
                                            value={weight}
                                            onChange={(e) =>
                                                setWeight(e.target.value)
                                            }
                                            placeholder="เช่น 1.25"
                                        />
                                        <button
                                            className="btn btn-primary btn-fetch"
                                            onClick={fetchWeightFromScale}
                                        >
                                            ดึง
                                        </button>
                                    </div>
                                </div>

                                <div className="col-12 col-sm-6">
                                    <div className="field-label">โหมดปัดราคา</div>

                                    <div className="d-flex gap-3 align-items-center">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                id="round-normal"
                                                name="roundStep"
                                                value="normal"
                                                checked={roundStep === "normal"}
                                                onChange={(e) =>
                                                    setRoundStep(e.target.value)
                                                }
                                            />
                                            <label
                                                className="form-check-label"
                                                htmlFor="round-normal"
                                            >
                                                คำนวณปกติ
                                            </label>
                                        </div>

                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                id="round-1"
                                                name="roundStep"
                                                value="1"
                                                checked={roundStep === "1"}
                                                onChange={(e) =>
                                                    setRoundStep(e.target.value)
                                                }
                                            />
                                            <label
                                                className="form-check-label"
                                                htmlFor="round-1"
                                            >
                                                ปัดเศษ
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer footer-actions">
                            <button
                                className="btn-cancel-outline"
                                onClick={onClose}
                            >
                                ยกเลิก
                            </button>
                            <button
                                className="btn-confirm"
                                onClick={handleConfirmAdd}
                                disabled={
                                    !selectedProduct?.prod_id ||
                                    !Number(weight) ||
                                    submitLoading ||
                                    !photoB64
                                }
                            >
                                {submitLoading ? "กำลังยืนยัน..." : "ยืนยัน"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal-backdrop fade show" />
        </>
    );
}
