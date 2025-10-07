// src/App.js
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/sidebar.css";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";

// pages
import AllProducts from "./pages/AllProducts";
import Purchase from "./pages/Purchase";
import CustomerSelect from "./pages/CustomerSelect"; //  เพิ่มหน้า "เลือกลูกค้า" (สำหรับเปิดบิลเท่านั้น)

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell d-flex">
        <Sidebar />
        <main className="content flex-grow-1 p-4">
          <Routes>
            {/* Home */}
            <Route path="/" element={<Navigate to="/products" replace />} />

            {/* หน้าเลือกลูกค้าสำหรับ flow รับซื้อ (แยกจาก /customers) */}
            <Route path="/purchase/customers" element={<CustomerSelect />} />

            {/* มีเพจย่อยของ purchase (เช่น /purchase/:id) */}
            <Route path="/purchase/*" element={<Purchase />} />

            {/* ถ้ามีเพจย่อยของ products ให้ใช้ /* */}
            <Route path="/products/*" element={<AllProducts />} />

            <Route path="/inventory" element={<div>หน้าคลังสินค้า</div>} />
            <Route path="/transactions" element={<div>หน้ารายการรับซื้อ</div>} />
            <Route path="/receipts" element={<div>หน้าบิล/ใบเสร็จ</div>} />

            {/* หน้าบริหารลูกค้า (ไม่ใช่หน้าเลือกลูกค้าเพื่อเปิดบิล) */}
            <Route path="/customers" element={<div>หน้าลูกค้า</div>} />

            <Route path="/help" element={<div>หน้าช่วยเหลือ</div>} />
            <Route path="/settings" element={<div>หน้าตั้งค่า</div>} />

            {/* 404 → products */}
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
