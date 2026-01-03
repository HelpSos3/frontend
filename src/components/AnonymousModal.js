import React, { useEffect, useState } from "react";
import {
  anonymousLiveCameraUrl,
  commitAnonymous,
  captureFromBackend,
} from "../api/purchases";
import "../css/anonymous.css";

export default function AnonymousModal({ show, onClose, onCommitted }) {
  const [opening, setOpening] = useState(false);   // loading / capture
  const [captured, setCaptured] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [err, setErr] = useState("");
  const [snapshotUrl, setSnapshotUrl] = useState("");
  const [photoB64, setPhotoB64] = useState("");
  const [streamKey, setStreamKey] = useState(0);  // บังคับ reload MJPEG

  // reset state เมื่อปิด modal
  function resetState() {
    setOpening(false);
    setCaptured(false);
    setCommitting(false);
    setErr("");
    setSnapshotUrl("");
    setPhotoB64("");
    setStreamKey((k) => k + 1); // stop stream
  }

  useEffect(() => {
    if (!show) resetState();
  }, [show]);

  // ถ่ายรูป
  async function handleCapture() {
    setOpening(true);
    setErr("");
    try {
      const { base64, blobUrl } = await captureFromBackend();
      setPhotoB64(base64);
      setSnapshotUrl(blobUrl);
      setCaptured(true);
    } catch (e) {
      setErr(e?.message || "ถ่ายภาพไม่สำเร็จ");
    } finally {
      setOpening(false);
    }
  }

  // ถ่ายใหม่
  function handleRetake() {
    setOpening(false);        // ไม่ใช่ loading
    setCaptured(false);       // กลับสู่โหมด live
    setSnapshotUrl("");       // ล้างรูป
    setPhotoB64("");          // ล้าง base64
    setErr("");

    //บังคับ reload MJPEG (ถ้ามี streamKey)
    setStreamKey((k) => k + 1);
  }

  // ยืนยัน
  async function handleConfirm() {
    if (!captured || !photoB64) return;

    setCommitting(true);
    setErr("");
    try {
      const purchase = await commitAnonymous({
        photo_base64: photoB64,
        on_open: "return",
        confirm_delete: false,
      });
      onCommitted?.(purchase);
    } catch (e) {
      setErr(e?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setCommitting(false);
    }
  }

  if (!show) return null;

  return (
    <div
      className="modal d-block modal-add modal-anon"
      tabIndex="-1"
      style={{ background: "rgba(0,0,0,.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <div className="close-wrap">
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="btn-close-circle"
              >
                ✕
              </button>
            </div>
            <h5 className="modal-title">รายละเอียด ไม่ระบุตัวตน</h5>
          </div>

          <div className="modal-body text-center">
            {err && <div className="alert alert-danger py-2">{err}</div>}

            <div className="upload-wrap">
              <div className="upload-box">
                <img
                  key={captured ? "snapshot" : `live-${streamKey}`}
                  src={captured ? snapshotUrl : anonymousLiveCameraUrl}
                  className="upload-img"
                  alt="camera"
                />
                {opening && (
                  <span className="upload-label">กำลังประมวลผล...</span>
                )}
              </div>

              <p className="text-danger small mt-2">
                *หมายเหตุ: ถ่ายรูปลูกค้าคู่กับสินค้าที่นำมาขาย
              </p>

              <div className="anon-actions">
                {!captured ? (
                  <button
                    type="button"
                    className="btn-save-photo"
                    onClick={handleCapture}
                    disabled={opening}
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
          </div>
        </div>
      </div>
    </div>
  );
}
