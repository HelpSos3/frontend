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

  // eslint-disable-next-line no-unused-vars
  const [devices, setDevices] = useState([]);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function resetState() {
    setOpening(false);
    setCaptured(false);
    setCommitting(false);
    setErr("");
    setSnapshotUrl("");
    setPhotoB64("");
  }

  async function ensurePermissionOnce() {
    // ขอสิทธิ์ครั้งเดียว เพื่อให้ enumerateDevices โชว์ label ในบางเบราว์เซอร์
    try {
      const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      tmp.getTracks().forEach((t) => t.stop());
    } catch (_) {
      // ถ้าไม่อนุญาต จะไป error ตอนเปิดจริงอีกที
    }
  }

  async function listCameras() {
    const list = await navigator.mediaDevices.enumerateDevices();
    const cams = list.filter((d) => d.kind === "videoinput");
    setDevices(cams);
    return cams;
  }

  function pickUsbLikeCameraId(cams) {
    // ฮิวริสติกสำหรับหา USB webcam
    const usbRegex = /(usb|webcam|logitech|creative|aver|avermedia|elgato|sony|canon|microsoft|thronmax|razer|anker)/i;
    const score = (d) => {
      let s = 0;
      const label = (d.label || "").toLowerCase();
      const gid = (d.groupId || "").toLowerCase();
      if (usbRegex.test(label)) s += 3;
      if (usbRegex.test(gid)) s += 2;
      // กล้องที่ไม่ใช่คำว่า "integrated"/"internal" มักเป็นภายนอก
      if (!/(integrated|internal|built[-\s]?in)/i.test(label)) s += 1;
      // ให้คะแนนถ้ามีคำว่า "HD", "1080", "720" ฯลฯ
      if (/(hd|1080|720|4k)/i.test(label)) s += 1;
      return s;
    };

    let best = null;
    let bestScore = -1;
    cams.forEach((d) => {
      const sc = score(d);
      if (sc > bestScore) {
        bestScore = sc;
        best = d;
      }
    });

    // ถ้าไม่มีตัวไหนเข้าข่าย usb-like เลย ให้คืนตัวแรก (fallback)
    return best ? best.deviceId : (cams[0]?.deviceId || "");
  }

  async function openCameraWithAutoPick() {
    setErr("");
    setOpening(true);
    try {
      // 1) ขอสิทธิ์ (ครั้งแรกเท่านั้น) -> 2) enumerate -> 3) เลือก USB-like -> 4) เปิด
      await ensurePermissionOnce();
      const cams = await listCameras();

      if (!cams.length) {
        throw new Error("ไม่พบบุญกล้อง (videoinput) ในระบบ");
      }

      const targetId = pickUsbLikeCameraId(cams);

      const constraints = targetId
        ? {
            video: {
              deviceId: { exact: targetId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            },
            audio: false,
          }
        : { video: true, audio: false };

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (eExact) {
        // เผื่อกรณี deviceId ใช้ไม่ได้ ให้ลอง fallback เป็น video:true
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e) {
      setErr(e?.message || "ไม่สามารถเปิดกล้องได้ (ต้องเข้าผ่าน HTTPS หรือ http://localhost)");
    } finally {
      setOpening(false);
    }
  }

  useEffect(() => {
    if (!show) {
      stopStream();
      resetState();
      return;
    }
    (async () => {
      await openCameraWithAutoPick();
    })();
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

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

      // ปิดกล้องหลังถ่ายเสร็จ
      stopStream();
    } catch (_) {
      setErr("ถ่ายภาพไม่สำเร็จ");
    }
  }

  async function handleRetake() {
    setCaptured(false);
    setSnapshotUrl("");
    setPhotoB64("");
    setErr("");
    await openCameraWithAutoPick();
  }

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
