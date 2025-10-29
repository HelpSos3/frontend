import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Routes, Route, useParams } from "react-router-dom";
import IdentitySelect from "../components/IdentitySelect";
import { listProducts } from "../api/products";
import {
  previewItemPhoto,
  commitItemWithPhoto,
  listPurchaseItems,
  getPurchaseItemsSummary,
} from "../api/purchaseItems";

import "../css/purchase.css";
import "../css/products.css";

export default function PurchasePage() {
  return (
    <Routes>
      <Route index element={<IdentitySelect />} />
      <Route path=":purchaseId" element={<PurchaseMain />} />
    </Routes>
  );
}

/* ===== หน้ารับซื้อสินค้า ===== */
function PurchaseMain() {
  const { purchaseId } = useParams();

  useEffect(() => {
    document.body.classList.add("purchase-lock");
    return () => document.body.classList.remove("purchase-lock");
  }, []);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total_weight: 0, total_amount: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [weight, setWeight] = useState("");
  const [roundMode, setRoundMode] = useState("half_up");

  // กล้องผ่าน hardware service (ไม่ใช้ getUserMedia)
  const [capturing, setCapturing] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState("");
  const [photoB64, setPhotoB64] = useState("");
  const [modalErr, setModalErr] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    try {
      const [its, sm] = await Promise.all([
        listPurchaseItems(purchaseId),
        getPurchaseItemsSummary(purchaseId),
      ]);
      setItems(its || []);
      setSummary(sm || { total_weight: 0, total_amount: 0 });
    } catch (_) {}
  }, [purchaseId]); 

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const rows = await listProducts();
        if (mounted) setProducts(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (mounted) setErr(e?.message || "โหลดสินค้าไม่สำเร็จ");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [purchaseId]);

  const total = useMemo(() => {
    if (typeof summary?.total_amount !== "undefined") {
      const n = Number(summary.total_amount || 0);
      return isNaN(n) ? 0 : n;
    }
    return items.reduce(
      (sum, it) => sum + Number(it.price || it.subtotal || 0),
      0
    );
  }, [summary, items]);

  const onProductClick = (p) => {
    setSelectedProduct(p);
    setWeight("");
    setRoundMode("half_up");
    setCaptured(false);
    setSnapshotUrl("");
    setPhotoB64("");
    setModalErr("");
    setModalOpen(true);

    // เปิด modal แล้วถ่ายจากฮาร์ดแวร์ทันที 
    setTimeout(() => {
      doPreviewFromHardware();
    }, 0);
  };

  async function doPreviewFromHardware() {
    setModalErr("");
    setCapturing(true);
    try {
      const { photo_base64 } = await previewItemPhoto(purchaseId, {
        device_index: 0,
        warmup: 3,
      });
      setPhotoB64(photo_base64 || "");
      setSnapshotUrl(
        photo_base64 ? `data:image/jpeg;base64,${photo_base64}` : ""
      );
      setCaptured(!!photo_base64);
    } catch (e) {
      setModalErr(e?.message || "ถ่ายภาพจากฮาร์ดแวร์ไม่สำเร็จ");
      setCaptured(false);
      setPhotoB64("");
      setSnapshotUrl("");
    } finally {
      setCapturing(false);
    }
  }

  async function handleRetake() {
    await doPreviewFromHardware();
  }

  async function handleConfirmAdd() {
    if (!selectedProduct?.prod_id || !Number(weight)) return;
    if (!photoB64) {
      setModalErr("กรุณาถ่ายรูปสินค้า");
      return;
    }
    setSubmitLoading(true);
    setModalErr("");
    try {
      await commitItemWithPhoto(
        purchaseId,
        {
          prod_id: selectedProduct.prod_id,
          weight: Number(weight),
          photo_base64: photoB64,
        },
        { round_mode: roundMode } 
      );
      setModalOpen(false);
      await refreshCart();
    } catch (e) {
      setModalErr(e?.message || "บันทึกรายการไม่สำเร็จ");
    } finally {
      setSubmitLoading(false);
    }
  }

  /* ===== UI หลัก ===== */
  return (
    <div className="purchase-page">
      <div className="purchase-main">
        {/* รายการสินค้า */}
        <section className="catalog">
          <div className="catalog-title">รับซื้อสินค้า</div>
          {loading && <div className="cart-empty">กำลังโหลดสินค้า...</div>}
          {err && !loading && <div className="cart-empty">{err}</div>}

          {!loading && !err && (
            <div className="products-grid d-flex flex-wrap">
              {products.map((p) => (
                <div key={p.prod_id ?? p.id} className="col">
                  <div className="card" onClick={() => onProductClick(p)}>
                    {p.prod_img ? (
                      <img
                        src={`/uploads/${String(p.prod_img).replace(
                          /^\/?uploads\/?/,
                          ""
                        )}`}
                        alt={p.prod_name}
                        className="thumb"
                      />
                    ) : (
                      <div
                        className="thumb d-flex align-items-center justify-content-center"
                        style={{ background: "#f5f7f9" }}
                      >
                        <span style={{ color: "#9aa7b2", fontSize: 13 }}>
                          ไม่มีรูปสินค้า
                        </span>
                      </div>
                    )}
                    <div className="card-body">
                      <h6 className="card-title mb-1">{p.prod_name}</h6>
                      <div className="price-small">
                        {Number(p.prod_price).toLocaleString()} บาท
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* รายการที่รับซื้อ */}
        <aside className="cart-panel">
          <div className="cart-header">สินค้าที่รับซื้อ</div>
          <div className="cart-list">
            {items.length === 0 ? (
              <div className="cart-empty">ยังไม่มีรายการ</div>
            ) : (
              items.map((it) => (
                <div key={it.purchase_item_id} className="cart-item mb-2">
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="fw-semibold">{it.prod_name}</div>
                      <div className="text-muted small">
                        {Number(it.weight).toLocaleString()} {it.unit || ""} ·{" "}
                        {Number(it.price).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}{" "}
                        บาท
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="checkout-bar">
            <div className="checkout-row">
              <div>ยอดรวม</div>
              <div>
                {Number(total).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}{" "}
                บาท
              </div>
            </div>
            <div className="checkout-buttons">
              <button className="btn-pay btn-cash" disabled>
                เงินสด
              </button>
              <button className="btn-pay btn-transfer" disabled>
                เงินโอน
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ===== Modal เพิ่มรายการ ===== */}
      {modalOpen && selectedProduct && (
        <>
          <div
            className="modal fade show modal-add"
            style={{ display: "block", background: "rgba(0,0,0,.45)" }}
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">รายละเอียด</h5>
                  <div className="close-wrap">
                    <button
                      className="btn-close-circle"
                      onClick={() => setModalOpen(false)}
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

                  {/* === กล้องพรีวิว (ผ่าน hardware) === */}
                  <div className="upload-wrap">
                    <div className="upload-box">
                      <div
                        className="upload-img"
                        style={{
                          background: "#dcdcdc",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {capturing && (
                          <span className="upload-label">
                            กำลังถ่ายจากฮาร์ดแวร์…
                          </span>
                        )}
                        {!capturing && captured && snapshotUrl && (
                          <img
                            src={snapshotUrl}
                            alt="snapshot"
                            className="upload-img"
                          />
                        )}
                        {!capturing && !captured && (
                          <span className="text-muted">ยังไม่มีรูป</span>
                        )}
                      </div>
                    </div>

                    <div className="anon-actions mt-2">
                      {!captured ? (
                        <button
                          type="button"
                          className="btn-save-photo"
                          onClick={doPreviewFromHardware}
                          disabled={capturing}
                        >
                          ถ่ายจากฮาร์ดแวร์
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

                  {/* ===== ฟอร์มกรอกน้ำหนัก ===== */}
                  <div className="row g-3 mt-3">
                    <div className="col-12">
                      <div className="field-label">ราคาต่อหน่วย</div>
                      <input
                        className="form-control input-ctl"
                        value={`${Number(
                          selectedProduct.prod_price
                        ).toLocaleString()} บาท`}
                        readOnly
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <div className="field-label">น้ำหนัก (กรอกเองได้)</div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control input-ctl"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="เช่น 1.25"
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <div className="field-label">โหมดปัดราคา</div>
                      <select
                        className="form-select input-ctl"
                        value={roundMode}
                        onChange={(e) => setRoundMode(e.target.value)}
                      >
                        <option value="half_up">ปัด .5 ขึ้น (แนะนำ)</option>
                        <option value="up">ปัดขึ้น</option>
                        <option value="down">ปัดลง</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer footer-actions">
                  <button
                    className="btn-cancel-outline"
                    onClick={() => setModalOpen(false)}
                  >
                    ยกเลิก
                  </button>
                  <button
                    className="btn-confirm"
                    onClick={handleConfirmAdd}
                    disabled={!Number(weight) || submitLoading || !photoB64}
                  >
                    {submitLoading ? "กำลังยืนยัน..." : "ยืนยัน"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
}
