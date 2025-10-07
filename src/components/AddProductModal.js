import React, { useEffect, useMemo, useRef, useState } from "react";
import { createProductForm } from "../api/products";
import api from "../api/client";

export default function AddProductModal({ show, onClose, onCreated, categories = [], onCategoryCreated }) {
  const [prod_name, setProdName] = useState("");
  const [prod_price, setProdPrice] = useState("");
  const [category_id, setCategoryId] = useState("");        
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // เพิ่มหมวดหมู่
  const [localCats, setLocalCats] = useState([]);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const [catErr, setCatErr] = useState("");

  useEffect(() => {
    const list = Array.isArray(categories) ? categories : [];
    list.sort((a, b) => (a.category_name || "").localeCompare(b.category_name || "", "th"));
    setLocalCats(list);
  }, [categories]);

  const fileRef = useRef(null);
  const addCatInputRef = useRef(null);

  useEffect(() => {
    if (!show) {
      setProdName("");
      setProdPrice("");
      setCategoryId("");
      setImageFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      setErrMsg("");
      setLoading(false);
      setShowAddCat(false);
      setNewCatName("");
      setSavingCat(false);
      setCatErr("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // โฟกัสช่องเพิ่มหมวดเมื่อเปิดฟอร์มย่อย
  useEffect(() => {
    if (showAddCat) addCatInputRef.current?.focus();
  }, [showAddCat]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const canSubmit = useMemo(() => {
    const cid = Number(category_id); // แปลงเป็นตัวเลขตอน validate/submit
    const priceOk = prod_price !== "" && !Number.isNaN(Number(prod_price));
    return !!prod_name.trim() && priceOk && Number.isInteger(cid) && cid > 0;
  }, [prod_name, prod_price, category_id]);

  function handleFileChange(e) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setErrMsg("");
    try {
      await createProductForm({
        prod_name: prod_name.trim(),
        prod_price: String(prod_price),
        category_id: Number(category_id),  // ส่งเป็นตัวเลขให้ backend
        imageFile,
      });
      onCreated?.();
      onClose?.();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "เพิ่มสินค้าไม่สำเร็จ กรุณาลองใหม่";
      setErrMsg(String(msg));
    } finally {
      setLoading(false);
    }
  }

  // สร้างหมวดหมู่ใหม่
  async function createCategoryInline() {
    const name = newCatName.trim();
    if (!name) {
      setCatErr("กรุณากรอกชื่อหมวดหมู่");
      return;
    }
    setSavingCat(true);
    setCatErr("");
    try {
      const res = await api.post("/categories/", { category_name: name });
      const cat = res.data; // { category_id, category_name }

      // รวมเข้า local, กันซ้ำตาม id 
      setLocalCats((prev) => {
        const nextMap = new Map(prev.map((x) => [String(x.category_id), x]));
        nextMap.set(String(cat.category_id), cat);
        const next = Array.from(nextMap.values());
        next.sort((a, b) => (a.category_name || "").localeCompare(b.category_name || "", "th"));
        return next;
      });

      // เลือกหมวดที่เพิ่งสร้าง
      setCategoryId(String(cat.category_id));

      // แจ้ง parent (ถ้าต้อง sync dropdown ภายนอก)
      onCategoryCreated?.(cat);

      // ปิดฟอร์มย่อย
      setShowAddCat(false);
      setNewCatName("");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        (err?.response?.status === 409 ? "มีชื่อหมวดหมู่นี้อยู่แล้ว" : err?.message) ||
        "เพิ่มหมวดหมู่ไม่สำเร็จ";
      setCatErr(String(msg));
    } finally {
      setSavingCat(false);
    }
  }

  if (!show) return null;

  return (
    <div className="modal d-block modal-add" tabIndex="-1" style={{ background: "rgba(0,0,0,.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit} noValidate>
            {/* Header */}
            <div className="modal-header">
              <div className="close-wrap">
                <button type="button" aria-label="Close" onClick={onClose} className="btn-close-circle">
                  ✕
                </button>
              </div>
              <h5 className="modal-title">เพิ่มสินค้า</h5>
            </div>

            {/* Body */}
            <div className="modal-body">
              {errMsg && <div className="alert alert-danger py-2">{errMsg}</div>}

              {/* อัปโหลดรูป */}
              <div className="upload-wrap">
                <div className="upload-box" onClick={() => fileRef.current?.click()}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="preview" className="upload-img" />
                  ) : (
                    <span className="upload-label">อัปโหลดรูป</span>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    hidden
                  />
                </div>
                <div className="upload-hint">รองรับ .jpg .jpeg .png .webp</div>
              </div>

              {/* Fields */}
              <div className="mb-3">
                <div className="field-label">ชื่อ :</div>
                <input
                  className="form-control input-ctl"
                  value={prod_name}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>

              <div className="mb-2">
                <div className="field-label">ประเภท :</div>
                <select
                  className="form-select input-ctl"
                  value={category_id}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">— เลือกหมวดหมู่ —</option>
                  {localCats.map((c) => (
                    <option key={c.category_id} value={String(c.category_id)}>
                      {c.category_name}
                    </option>
                  ))}
                </select>

                {/* เพิ่มหมวดหมู่ */}
                {!showAddCat ? (
                  <button
                    type="button"
                    className="addcat-link"
                    onClick={() => {
                      setShowAddCat(true);
                      setCatErr("");
                      setNewCatName("");
                    }}
                    disabled={loading}
                  >
                    + เพิ่มหมวดหมู่
                  </button>
                ) : (
                  <div className="addcat-inline">
                    <input
                      ref={addCatInputRef}
                      className="addcat-input"
                      placeholder="ชื่อหมวดหมู่ใหม่"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (!savingCat && newCatName.trim()) createCategoryInline();
                        }
                      }}
                      disabled={savingCat}
                    />
                    <button
                      type="button"
                      className="btn-addcat"
                      onClick={createCategoryInline}
                      disabled={savingCat || !newCatName.trim()}
                    >
                      {savingCat ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                    <button
                      type="button"
                      className="btn-cancelcat"
                      onClick={() => {
                        setShowAddCat(false);
                        setNewCatName("");
                        setCatErr("");
                      }}
                      disabled={savingCat}
                    >
                      ยกเลิก
                    </button>
                    {catErr && <div className="text-danger small" style={{ flexBasis: "100%" }}>{catErr}</div>}
                  </div>
                )}
              </div>

              {/* ยืนยัน */}
              <div className="submit-wrap">
                <button type="submit" className="btn-confirm" disabled={!canSubmit || loading}>
                  {loading ? "กำลังบันทึก..." : "ยืนยัน"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
