import React, { useEffect, useMemo, useRef, useState } from "react";
import { updateProductForm, deleteProduct } from "../api/products";

export default function EditProductModal({
  show,
  onClose,
  onUpdated,
  product,
  categories = [],
}) {
  const [isEdit, setIsEdit] = useState(false);

  const [prod_name, setProdName] = useState("");
  const [prod_price, setProdPrice] = useState("");
  const [category_id, setCategoryId] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const fileRef = useRef(null);

  const baseApi = (process.env.REACT_APP_API_BASE || "http://localhost:8080").replace(/\/+$/, "");

  const currentImageUrl = useMemo(() => {
    const img = product?.prod_img;
    if (!img) return "";
    if (/^https?:\/\//i.test(img)) return img;
    if (/^\/?uploads\//i.test(img)) return `${baseApi}/${img.replace(/^\/+/, "")}`;
    const rel = img.includes("products/") ? img : `products/${img}`;
    return `${baseApi}/uploads/${rel}`;
  }, [product, baseApi]);

  // รีเซ็ตทุกครั้งที่เปิด modal
  useEffect(() => {
    if (!show || !product) return;
    setIsEdit(false);
    setProdName(product.prod_name || "");
    setProdPrice(String(product.prod_price ?? ""));
    setCategoryId(String(product.category_id ?? ""));
    setImageFile(null);
    setPreviewUrl(currentImageUrl || "");
    setErrMsg("");
    setLoading(false);
    setDeleting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, product]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const canSubmit = useMemo(() => {
    const priceOk = prod_price !== "" && !Number.isNaN(Number(prod_price));
    const cid = Number(category_id);
    return !!prod_name.trim() && priceOk && Number.isInteger(cid) && cid > 0;
  }, [prod_name, prod_price, category_id]);

  function enterEdit() {
    setIsEdit(true);
    setErrMsg("");
  }
  function cancelEdit() {
    setIsEdit(false);
    setProdName(product?.prod_name || "");
    setProdPrice(String(product?.prod_price ?? ""));
    setCategoryId(String(product?.category_id ?? ""));
    setImageFile(null);
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(currentImageUrl || "");
    setErrMsg("");
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : currentImageUrl);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!product?.prod_id || !canSubmit || loading || deleting) return;
    setLoading(true);
    setErrMsg("");
    try {
      await updateProductForm({
        prod_id: product.prod_id,
        prod_name: prod_name.trim(),
        prod_price: String(prod_price),
        category_id: Number(category_id),
        imageFile,
      });
      onUpdated?.();
      onClose?.();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "แก้ไขสินค้าไม่สำเร็จ กรุณาลองใหม่";
      setErrMsg(String(msg));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!product?.prod_id || loading || deleting) return;
    const ok = window.confirm(`ยืนยันการปิดใช้งานสินค้า: ${product.prod_name} ?`);
    if (!ok) return;
    setDeleting(true);
    setErrMsg("");
    try {
      await deleteProduct(product.prod_id);
      onUpdated?.();
      onClose?.();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "ปิดใช้งานสินค้าไม่สำเร็จ";
      setErrMsg(String(msg));
    } finally {
      setDeleting(false);
    }
  }

  if (!show || !product) return null;

  return (
    <div className="modal d-block modal-add" tabIndex="-1" style={{ background: "rgba(0,0,0,.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <div className="close-wrap">
                <button type="button" aria-label="Close" onClick={onClose} className="btn-close-circle">✕</button>
              </div>
              <h5 className="modal-title">{isEdit ? "แก้ไขสินค้า" : "รายละเอียดสินค้า"}</h5>
            </div>

            <div className="modal-body">
              {errMsg && <div className="alert alert-danger py-2">{errMsg}</div>}

              <div className="upload-wrap">
                <div
                  className="upload-box"
                  style={{ cursor: isEdit ? "pointer" : "default" }}
                  onClick={() => isEdit && fileRef.current?.click()}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="preview" className="upload-img" />
                  ) : (
                    <span className="upload-label">ไม่มีรูป</span>
                  )}

                  {isEdit && (
                    <button
                      type="button"
                      className="upload-choose-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileRef.current?.click();
                      }}
                    >
                      อัปโหลดรูป
                    </button>
                  )}

                  <input
                    ref={fileRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    hidden
                    disabled={!isEdit || loading || deleting}
                  />
                </div>
                {isEdit && (
                  <div className="upload-hint">รองรับ .jpg .jpeg .png .webp</div>
                )}
              </div>

              <div className="mb-3">
                <div className="field-label">ชื่อ :</div>
                <input
                  className="form-control input-ctl"
                  value={prod_name}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                  disabled={!isEdit || loading || deleting}
                />
              </div>

              <div className="mb-3">
                <div className="field-label">ราคา ต่อ กิโลกรัม:</div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control input-ctl"
                  value={prod_price}
                  onChange={(e) => setProdPrice(e.target.value)}
                  required
                  disabled={!isEdit || loading || deleting}
                />
              </div>

              <div className="mb-2">
                <div className="field-label">ประเภท :</div>
                <select
                  className="form-select input-ctl"
                  value={category_id}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  disabled={!isEdit || loading || deleting}
                >
                  <option value="">— เลือกหมวดหมู่ —</option>
                  {Array.isArray(categories) &&
                    categories.map((c) => (
                      <option key={c.category_id} value={String(c.category_id)}>
                        {c.category_name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="footer-actions">
              {!isEdit ? (
                <>
                  <button
                    type="button"
                    className="btn-confirm"
                    onClick={enterEdit}
                    disabled={loading || deleting}
                  >
                    แก้ไข
                  </button>

                  <button
                    type="button"
                    className="btn-danger-pill"
                    onClick={handleDelete}
                    disabled={loading || deleting}
                  >
                    {deleting ? "กำลังปิดใช้งาน..." : "ปิดใช้งาน"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn-cancel-outline"
                    onClick={cancelEdit}
                    disabled={loading}
                  >
                    ยกเลิกการแก้ไข
                  </button>

                  <button
                    type="submit"
                    className="btn-confirm"
                    disabled={!canSubmit || loading || deleting}
                  >
                    {loading ? "กำลังบันทึก..." : "ยืนยัน"}
                  </button>
                </>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
