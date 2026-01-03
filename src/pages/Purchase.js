import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Routes, Route, useParams } from "react-router-dom";
import IdentitySelect from "../components/IdentitySelect";
import { listProducts } from "../api/products";
import {
  previewItemPhoto,
  commitItemWithPhoto,
  listPurchaseItems,
  getPurchaseItemsSummary,
  liveItemCameraUrl,
  fetchWeightFromScale as apiFetchWeightFromScale, // 🔧 alias กัน recursive
} from "../api/purchaseItems";
import { FaEdit, FaTrashAlt, FaCheck, FaTimes } from "react-icons/fa";

import { payPurchase } from "../api/purchases";
import AddItemModal from "../components/AddItemModal";
import DeleteItemModal from "../components/DeleteItemModal";
import PayModal from "../components/PayModal";
import api from "../api/client";
import "../css/purchase.css";
import "../css/products.css";

const formatPrice = (v) =>
  Number(v || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PurchasePage() {
  return (
    <Routes>
      <Route index element={<IdentitySelect />} />
      <Route path=":purchaseId" element={<PurchaseMain />} />
    </Routes>
  );
}

function PurchaseMain() {
  const { purchaseId } = useParams();

  useEffect(() => {
    document.body.classList.add("purchase-lock");
    return () => document.body.classList.remove("purchase-lock");
  }, []);

  // สินค้า (ฝั่งซ้าย)
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // รายการฝั่งขวา
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total_weight: 0, total_amount: 0 });

  // โมดัลเพิ่มรายการ
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [weight, setWeight] = useState("");

  // ปัดราคา:
  const [roundStep, setRoundStep] = useState("normal");

  // ยืนยันการลบรายการสินค้าที่รับซื้อ
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // กล้องผ่าน hardware service
  const [capturing, setCapturing] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState("");
  const [photoB64, setPhotoB64] = useState("");
  const [modalErr, setModalErr] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // 🔴 URL กล้องสด (MJPEG) — ต้องอยู่ใน component เท่านั้น
  const liveCameraUrl = useMemo(
    () => (modalOpen && purchaseId ? liveItemCameraUrl(purchaseId) : ""),
    [modalOpen, purchaseId]
  );

  // ====== popup ชำระเงิน ======
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState(null); // เงินสด, เงินโอน
  const [showConfirmPay, setShowConfirmPay] = useState(false);
  const [confirmText, setConfirmText] = useState("ยืนยันการซื้อสินค้า");
  const [paying, setPaying] = useState(false);
  const AUTO_CLOSE_MS = 3000;
  let confirmTimerRef = React.useRef(null);

  // === inline edit state (สำหรับแก้ไขราคาทันที) ===
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [savingId, setSavingId] = useState(null);

  // โหลดสินค้า
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

  // ===== ดึงน้ำหนักจากเครื่องชั่ง =====
  const fetchWeightFromScale = async () => {
    try {
      const { weight } = await apiFetchWeightFromScale();
      setWeight(weight ?? "");
    } catch (error) {
      console.error("ไม่สามารถดึงน้ำหนักจากเครื่องชั่งได้:", error);
    }
  };

  // โหลดตะกร้า/สรุป
  const refreshCart = useCallback(async () => {
    try {
      const [its, sm] = await Promise.all([
        listPurchaseItems(purchaseId),
        getPurchaseItemsSummary(purchaseId),
      ]);
      setItems(its || []);
      setSummary(sm || { total_weight: 0, total_amount: 0 });
    } catch { }
  }, [purchaseId]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // รวมเงิน
  const total = useMemo(() => {
    if (typeof summary?.total_amount !== "undefined") {
      const n = Number(summary.total_amount || 0);
      return isNaN(n) ? 0 : n;
    }
    return items.reduce((sum, it) => sum + Number(it.price || 0), 0);
  }, [summary, items]);

  // ดึงราคาต่อหน่วย
  const productMap = useMemo(() => {
    const m = new Map();
    for (const p of products) m.set(p.prod_id, p);
    return m;
  }, [products]);

  const getUnitPrice = (it) => {
    const p = productMap.get(it.prod_id);
    if (p && p.prod_price != null) return Number(p.prod_price);
    const w = Number(it.weight || 0);
    const price = Number(it.price || 0);
    return w > 0 ? price / w : 0;
  };

  // เปิดโมดัลเพิ่มรายการ
  const onProductClick = (p) => {
    setSelectedProduct(p);
    setWeight("");
    setRoundStep("normal");
    setCaptured(false);
    setSnapshotUrl("");
    setPhotoB64("");
    setModalErr("");
    setModalOpen(true);
  };

  // พรีวิวจาก hardware → ได้ base64
  async function doPreviewFromHardware() {
    setModalErr("");
    setCapturing(true);
    try {
      const { photo_base64 } = await previewItemPhoto(purchaseId, {
        device_index: 0,
        warmup: 3,
      });
      setPhotoB64(photo_base64 || "");
      setSnapshotUrl(photo_base64 ? `data:image/jpeg;base64,${photo_base64}` : "");
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
    // กลับไปเป็นกล้องสด
    setPhotoB64("");
    setSnapshotUrl("");
    setCaptured(false);
    setModalErr("");
  }

  // ยืนยันเพิ่มรายการ
  const handleConfirmAdd = async () => {
    if (!selectedProduct?.prod_id || !Number(weight)) return;
    if (!photoB64) {
      setModalErr("กรุณาถ่ายรูปสินค้า");
      return;
    }

    setSubmitLoading(true);
    setModalErr("");
    try {
      const commitOpts =
        roundStep === "normal"
          ? { round_mode: "none" }
          : { round_mode: "half_up", round_step: 1 };

      await commitItemWithPhoto(
        purchaseId,
        {
          prod_id: selectedProduct.prod_id,
          weight: Number(weight),
          photo_base64: photoB64,
        },
        commitOpts
      );

      setModalOpen(false);
      await refreshCart();
    } catch (e) {
      setModalErr(e?.message || "บันทึกรายการไม่สำเร็จ");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ลบรายการสินค้า
  const askDeleteItem = (itemId) => {
    setDeletingId(itemId);
    setShowDeleteModal(true);
  };

  // ยืนยันลบ
  const confirmDeleteItem = async () => {
    if (!deletingId) return;
    try {
      setDeleting(true);
      await api.delete(`/purchases/${purchaseId}/items/${deletingId}`);
      setShowDeleteModal(false);
      setDeletingId(null);
      await refreshCart();
    } catch (e) {
      alert(e?.message || "ลบรายการไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  };


  // ===== Inline Edit: แก้ไขราคาในรายการทันที =====
  const handleEditStart = (it) => {
    setEditingId(it.purchase_item_id);
    setEditValue(String(Number(it.price || 0)));
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleEditSave = async (it) => {
    const newPrice = Number(editValue);
    if (isNaN(newPrice) || newPrice < 0) {
      alert("กรุณากรอกราคาเป็นตัวเลขที่ถูกต้อง");
      return;
    }
    try {
      setSavingId(it.purchase_item_id);
      const params =
        roundStep === "normal"
          ? { round_mode: "none" }
          : { round_mode: "half_up", round_step: 1 };

      await api.put(
        `/purchases/${purchaseId}/items/${it.purchase_item_id}`,
        { price: newPrice },
        { params }
      );

      setEditingId(null);
      setEditValue("");
      await refreshCart();
    } catch (e) {
      alert(e?.message || "แก้ไขราคาไม่สำเร็จ");
    } finally {
      setSavingId(null);
    }
  };

  // จ่ายเงิน
  const handlePayClick = async (withPrint) => {
    if (paying) return;
    try {
      setPaying(true);
      setShowPayModal(false);

      const res = await payPurchase(purchaseId, {
        payment_method: payMethod,
        print_receipt: withPrint,
      });

      if (withPrint && res && res.will_print && res.printed === false) {
        alert(res.print_error || "พิมพ์ใบเสร็จไม่สำเร็จ (ไม่ทราบสาเหตุ)");
      }

      setConfirmText(withPrint ? "ยืนยันการพิมพ์ใบเสร็จ" : "ยืนยันการซื้อสินค้า");
      setShowConfirmPay(true);

      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => {
        setShowConfirmPay(false);
        refreshCart();
        window.location.href = "/purchase";
      }, AUTO_CLOSE_MS);
    } catch (e) {
      alert(e?.response?.data?.detail || e?.message || "ชำระเงินไม่สำเร็จ");
    } finally {
      setPaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  // helpers
  const getImg = (p) => {
    const base = (api?.defaults?.baseURL || "").replace(/\/+$/, "");
    if (p?.prod_img && String(p.prod_img).startsWith("/uploads/")) {
      return `${base}${p.prod_img}`;
    }
    if (p?.prod_img) {
      const cleaned = String(p.prod_img).replace(/^\/?uploads\/?/, "");
      return `${base}/uploads/${cleaned}`;
    }
    const alt = p?.image || p?.img_path || p?.photo || p?.photo_url || null;
    if (alt) {
      if (String(alt).startsWith("/uploads/")) return `${base}${alt}`;
      return `${base}/uploads/${String(alt).replace(/^\/?uploads\/?/, "")}`;
    }
    return null;
  };
  const getPrice = (p) => formatPrice(p?.prod_price ?? p?.price);
  const getUnit = (p) => (p?.unit ? ` / ${p.unit}` : "");

  return (
    <div className="purchase-page">
      <div className="purchase-main">
        {/* ==== สินค้า ==== */}
        <section className="catalog">
          {loading && <div className="cart-empty">กำลังโหลดสินค้า...</div>}
          {err && !loading && <div className="cart-empty">{err}</div>}

          {!loading && !err && (
            <div className="products-grid d-flex flex-wrap">
              {products.map((p) => {
                const img = getImg(p);
                return (
                  <div key={p.prod_id ?? p.id} className="col">
                    <div className="card" onClick={() => onProductClick(p)}>
                      <div className="thumb-wrap">
                        {img ? (
                          <img src={img} alt={p.prod_name} />
                        ) : (
                          <span style={{ color: "#9aa7b2", fontSize: 13 }}>
                            ไม่มีรูปสินค้า
                          </span>
                        )}
                      </div>
                      <div className="card-body">
                        <h6 className="card-title mb-1">
                          {p.prod_name ?? p.name}
                        </h6>
                        <div className="price-small">
                          {getPrice(p)} บาท{getUnit(p)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {products.length === 0 && (
                <div className="cart-empty" style={{ width: "100%" }}>
                  ยังไม่มีรายการสินค้า
                </div>
              )}
            </div>
          )}
        </section>

        {/* ==== รายการรับซื้อ  ==== */}
        <aside className="cart-panel">
          <div className="cart-header">สินค้าที่รับซื้อ</div>

          <div className="cart-list">
            {items.length === 0 ? (
              <div className="cart-empty">ยังไม่มีรายการ</div>
            ) : (
              items.map((it) => {
                const unitPrice = getUnitPrice(it);
                const isEditing = editingId === it.purchase_item_id;
                return (
                  <div key={it.purchase_item_id} className="cart-item mb-2">
                    <div className="item-actions">
                      <button
                        className="btn-icon edit-btn"
                        title={isEditing ? "กำลังแก้ไข" : "แก้ไข"}
                        onClick={() => {
                          if (!isEditing) handleEditStart(it);
                        }}
                        aria-label="แก้ไขรายการ"
                        disabled={isEditing}
                      >
                        <FaEdit size={12} color="#000000" />
                      </button>
                      <button
                        className="btn-icon delete-btn"
                        title="ลบ"
                        onClick={() => askDeleteItem(it.purchase_item_id)}
                        aria-label="ลบรายการ"
                        disabled={savingId === it.purchase_item_id}
                      >
                        <FaTrashAlt size={12} color="#000000" />
                      </button>

                    </div>

                    <div className="item-line">
                      <div className="item-name">
                        {it.prod_name || `#${it.prod_id}`}
                      </div>

                      {/* ==== แก้ไขรายการสินค้าที่รับซื้อ ==== */}
                      {isEditing ? (
                        <div className="item-price-edit d-flex align-items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="form-control form-control-sm"
                            style={{ width: 90, padding: "2px 6px" }}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditSave(it);
                              if (e.key === "Escape") handleEditCancel();
                            }}
                            autoFocus
                          />
                          <span className="text-muted" style={{ fontSize: 12 }}>บาท</span>

                          <button
                            className="btn btn-sm btn-primary p-1"
                            onClick={() => handleEditSave(it)}
                            disabled={savingId === it.purchase_item_id}
                            title="บันทึก (Enter)"
                            aria-label="บันทึก"
                            style={{ lineHeight: 1 }}
                          >
                            <FaCheck size={12} />
                          </button>

                          <button
                            className="btn btn-sm btn-outline-secondary p-1"
                            onClick={handleEditCancel}
                            disabled={savingId === it.purchase_item_id}
                            title="ยกเลิก (Esc)"
                            aria-label="ยกเลิก"
                            style={{ lineHeight: 1 }}
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="item-price">
                          {formatPrice(it.price)} บาท
                        </div>
                      )}
                    </div>

                    <div className="item-meta">
                      {Number(it.weight).toLocaleString()} kg /{" "}
                      {formatPrice(unitPrice)} บาท
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="checkout-bar">
            <div className="checkout-row">
              <div>ยอดรวม</div>
              <div>
                {formatPrice(total)} บาท
              </div>
            </div>
            <div className="checkout-buttons">
              <button
                className="btn-pay btn-cash"
                onClick={() => {
                  setPayMethod("เงินสด");
                  setShowPayModal(true);
                }}
                disabled={items.length === 0 || total <= 0}
              >
                เงินสด
              </button>
              <button
                className="btn-pay btn-transfer"
                onClick={() => {
                  setPayMethod("เงินโอน");
                  setShowPayModal(true);
                }}
                disabled={items.length === 0 || total <= 0}
              >
                เงินโอน
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ==== popup สินค้าที่รับซื้อ ==== */}
      <AddItemModal
        modalOpen={modalOpen}
        selectedProduct={selectedProduct}
        modalErr={modalErr}
        liveCameraUrl={liveCameraUrl}
        photoB64={photoB64}
        capturing={capturing}
        captured={captured}
        snapshotUrl={snapshotUrl}
        weight={weight}
        setWeight={setWeight}
        fetchWeightFromScale={fetchWeightFromScale}
        roundStep={roundStep}
        setRoundStep={setRoundStep}
        submitLoading={submitLoading}
        doPreviewFromHardware={doPreviewFromHardware}
        handleRetake={handleRetake}
        handleConfirmAdd={handleConfirmAdd}
        onClose={() => setModalOpen(false)}
      />


      {/* ==== popup ยืนยันการลบ ==== */}
      <DeleteItemModal
        open={showDeleteModal}
        deleting={deleting}
        onConfirm={confirmDeleteItem}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* ==== popup ชำระเงิน  ==== */}
      <PayModal
        open={showPayModal}
        payMethod={payMethod}
        total={total}
        paying={paying}
        onClose={() => setShowPayModal(false)}
        onPay={handlePayClick}
      />

      {/* ==== popup ยืนยัน ==== */}
      {showConfirmPay && (
        <div className="modal-confirm" role="dialog" aria-modal="true">
          <div className="dialog">
            <div className="title">{confirmText}</div>
            <div className="confirm-check">✓</div>
          </div>
        </div>
      )}
    </div>
  );
}
