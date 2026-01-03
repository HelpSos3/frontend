import React, { useEffect, useState, useMemo } from "react";
import { getProducts, getProductsFiltered, enableProduct } from "../api/products";
import { getCategories } from "../api/categories";
import AddProductModal from "../components/AddProductModal";
import EditProductModal from "../components/EditProductModal";
import "../css/products.css";

export default function AllProducts() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selected, setSelected] = useState(null);

  // ฟิลเตอร์
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const baseApi = (process.env.REACT_APP_API_BASE || "http://localhost:8080").replace(/\/+$/, "");

  function resolveImageUrl(prod_img) {
    if (!prod_img) return "";
    if (/^https?:\/\//i.test(prod_img)) return prod_img;
    if (/^\/?uploads\//i.test(prod_img)) return `${baseApi}/${prod_img.replace(/^\/+/, "")}`;
    const rel = prod_img.includes("products/") ? prod_img : `products/${prod_img}`;
    return `${baseApi}/uploads/${rel}`;
  }

  async function loadProducts() {
    try {
      const data = await getProducts({ includeInactive: true });
      setItems(Array.isArray(data) ? data : data?.items ?? []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "โหลดสินค้าล้มเหลว");
    }
  }

  async function loadProductsFiltered({ q: q0 = q, categoryId: c0 = categoryId } = {}) {
    setLoading(true);
    setErr("");
    try {
      const list = await getProductsFiltered({ q: q0, categoryId: c0, includeInactive: true });
      setItems(Array.isArray(list) ? list : list?.items ?? []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "โหลดสินค้าล้มเหลว");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const cats = await getCategories();
      const list = Array.isArray(cats) ? cats : cats?.items ?? [];
      list.sort((a, b) => (a.category_name || "").localeCompare(b.category_name || "", "th"));
      setCategories(list);
    } catch (e) {
      console.error("load categories failed:", e);
    }
  }

  const filteredIems = useMemo(() => {
    if (!q.trim()) return items;

    return items.filter((x) =>
      x.prod_name?.toLowerCase().startsWith(q.toLowerCase())
    );
  }, [q, items]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.allSettled([loadProducts(), loadCategories()]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!q.trim() && !categoryId) loadProducts();
      else loadProductsFiltered();
    }, 300);
    return () => clearTimeout(t);
  }, [q, categoryId]); // eslint-disable-line


  const handleCategoryCreated = (cat) => {
    setCategories((prev) => {
      if (!cat || !cat.category_id) return prev;
      const exists = prev.some((x) => String(x.category_id) === String(cat.category_id));
      const next = exists
        ? prev.map((x) => (String(x.category_id) === String(cat.category_id) ? cat : x))
        : [...prev, cat];
      return next.sort((a, b) => (a.category_name || "").localeCompare(b.category_name || "", "th"));
    });
  };

  return (
    <div className="container py-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="tools-left">
          <select
            className="form-select tools-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">หมวดหมู่</option>
            {categories.map((c) => (
              <option key={c.category_id} value={String(c.category_id)}>
                {c.category_name}
              </option>
            ))}
          </select>

          <div className="input-group tools-search">
            <input
              type="text"
              className="form-control"
              placeholder="ค้นหาสินค้า"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setQ("")}
            />
            <span className="input-group-text">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242 1.156a5 5 0 1 1 0-10.001 5 5 0 0 1 0 10z" />
              </svg>
            </span>
          </div>
        </div>

        {/* ปุ่มเพิ่มสินค้า */}
        <button className="btn btn-pill" onClick={() => setShowAdd(true)}>
          เพิ่มสินค้า
        </button>
      </div>

      {err && <div className="alert alert-danger py-2">{err}</div>}

      {loading ? (
        <div className="row g-0 products-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="col">
              <div className="skel" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="row g-0 products-grid">
            {filteredIems.map((it) => {
              const imgUrl = resolveImageUrl(it.prod_img);
              return (
                <div className="col" key={it.prod_id}>
                  <div
                    className="card"
                    onClick={() => {
                      setSelected(it);
                      setShowEdit(true);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {imgUrl ? (
                      <div className="thumb-wrap">
                        <img
                          src={imgUrl}
                          alt={it.prod_name}
                        />
                      </div>
                    ) : (
                      <div className="thumb d-flex align-items-center justify-content-center">
                        <span className="text-muted small">ไม่มีรูป</span>
                      </div>
                    )}

                    <div className="card-body">
                      <div className="card-title text-truncate" title={it.prod_name}>
                        {it.prod_name}
                      </div>
                      <div className="price-small">
                        {Number(it.prod_price || 0).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        บาท
                      </div>
                    </div>

                    {/* แถบปิดใช้งาน */}
                    {!it.is_active && <div className="overlay-strip">ปิดใช้งาน</div>}
                  </div>

                  {/* ปุ่มเปิดใช้งาน */}
                  {!it.is_active && (
                    <div className="mt-2 text-center">
                      <button
                        className="btn btn-sm btn-light"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await enableProduct(it.prod_id);
                            await loadProductsFiltered();
                          } catch (err) {
                            alert("เปิดใช้งานไม่สำเร็จ");
                          }
                        }}
                      >
                        เปิดใช้งาน
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!items.length && (
            <div className="empty-state mt-3">
              ไม่พบสินค้า {q ? `ที่ตรงกับ “${q}”` : ""}
              {categoryId ? " ในหมวดที่เลือก" : ""}
            </div>
          )}
        </>
      )}

      <AddProductModal
        show={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={async () => {
          await loadProductsFiltered({ q: "", categoryId: "" });
          setShowAdd(false);
        }}
        categories={categories}
        onCategoryCreated={handleCategoryCreated}
      />

      <EditProductModal
        show={showEdit}
        onClose={() => setShowEdit(false)}
        onUpdated={async () => {
          await loadProductsFiltered();
          setShowEdit(false);
        }}
        product={selected}
        categories={categories}
      />
    </div>
  );
}
