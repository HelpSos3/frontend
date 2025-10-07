// src/components/AnonymousModal.js
import React, { useEffect, useRef, useState } from "react";
import { commitAnonymous } from "../api/purchases";
import "../css/anonymous.css";

export default function AnonymousModal({ show, onClose, onCommitted }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const canvasRef = useRef(null);

    const [opening, setOpening] = useState(false);     
    const [captured, setCaptured] = useState(false);   
    const [committing, setCommitting] = useState(false); 
    const [err, setErr] = useState("");
    const [snapshotUrl, setSnapshotUrl] = useState("");
    const [photoB64, setPhotoB64] = useState("");       

    useEffect(() => {
        if (!show) {
            stopStream();
            resetState();
            return;
        }
        openCamera();
        return () => stopStream();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    function resetState() {
        setOpening(false);
        setCaptured(false);
        setCommitting(false);
        setErr("");
        setSnapshotUrl("");
        setPhotoB64("");
    }

    async function openCamera() {
        setErr("");
        setOpening(true);
        try {
            // ใช้ได้บน https หรือ localhost เท่านั้น
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" }, 
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        } catch (e) {
            setErr(e?.message || "ไม่สามารถเปิดกล้องได้");
        } finally {
            setOpening(false);
        }
    }

    function stopStream() {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }

    // กดบันทึกรูป --> ถ่ายภาพ 
    async function handleCapture() {
        if (!videoRef.current) return;
        setErr("");
        try {
            const video = videoRef.current;
            const w = video.videoWidth || 640;
            const h = video.videoHeight || 480;

            const canvas = canvasRef.current;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, w, h);

            const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
            const base64 = dataUrl.split(",")[1];

            setSnapshotUrl(dataUrl);
            setPhotoB64(base64);
            setCaptured(true);
            stopStream(); // ปิดกล้องแช่ภาพไว้
        } catch (e) {
            setErr("ถ่ายภาพไม่สำเร็จ");
        }
    }

    // ถ่ายใหม่ ลบภาพเดิม + เปิดกล้องใหม่ (ยังไม่สร้างบิลใดถูกสร้าง)
    async function handleRetake() {
        setCaptured(false);
        setSnapshotUrl("");
        setPhotoB64("");
        setErr("");
        await openCamera();
    }

    // กดยืนยัน --> แล้วค่อย commit ไป backend เพื่อสร้างบิลจริง
    async function handleConfirm() {
        if (!captured || !photoB64) return;
        setCommitting(true);
        setErr("");
        try {
            const res = await commitAnonymous({
                photo_base64: photoB64,
                on_open: "return",       
                confirm_delete: false,  
            });
            const purchase = res?.data ?? res; 
            onCommitted?.(purchase);           
        } catch (e) {
            setErr(e?.response?.data?.detail || e.message || "บันทึกไม่สำเร็จ");
        } finally {
            setCommitting(false);
        }
    }

    if (!show) return null;

    return (
        <div className="modal d-block modal-add modal-anon" tabIndex="-1" style={{ background: "rgba(0,0,0,.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    
                    <div className="modal-header">
                        <div className="close-wrap">
                            <button type="button" aria-label="Close" onClick={onClose} className="btn-close-circle">✕</button>
                        </div>
                        <h5 className="modal-title">รายละเอียด ไม่ระบุตัวตน</h5>
                    </div>

                    <div className="modal-body text-center">
                        {err && <div className="alert alert-danger py-2">{err}</div>}

                        <div className="upload-wrap">
                            <div className="upload-box">
                                {!captured ? (
                                    <video
                                        ref={videoRef}
                                        className="upload-img"
                                        muted
                                        playsInline
                                        autoPlay
                                        style={{ background: "#dcdcdc", objectFit: "cover" }}
                                    />
                                ) : (
                                    <img src={snapshotUrl} alt="snapshot" className="upload-img" />
                                )}
                                {opening && <span className="upload-label">กำลังเปิดกล้อง...</span>}
                            </div>
                            <p className="text-danger small mt-2">*หมายเหตุ: ถ่ายรูปลูกค้าคู่กับสินค้าที่นำมาขาย</p>
                            <div className="anon-actions">
                                {!captured ? (
                                    <button
                                        type="button"
                                        className="btn-save-photo"
                                        onClick={handleCapture}
                                        disabled={opening || !streamRef.current}
                                    >
                                        บันทึกรูป
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn-retake"
                                        onClick={handleRetake}
                                        disabled={opening || committing}
                                    >
                                        ถ่ายใหม่
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="submit-wrap">
                            <button
                                type="button"
                                className="btn-confirm"
                                disabled={!captured || committing}
                                onClick={handleConfirm}
                            >
                                {committing ? "กำลังบันทึก..." : "ยืนยัน"}
                            </button>
                        </div>

                        <canvas ref={canvasRef} style={{ display: "none" }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
