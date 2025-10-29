// src/App.js
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/sidebar.css";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";

// pages
import AllProducts from "./pages/Products";
import Purchase from "./pages/Purchase";
import CustomerSelect from "./pages/CustomerSelect";
import InventoryPage from "./pages/Inventory"; 
import InventoryDetail from "./pages/InventoryDetail";


export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell d-flex">
        <Sidebar />
        <main className="content flex-grow-1 p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="/purchase/customers" element={<CustomerSelect />} />
            <Route path="/purchase/*" element={<Purchase />} />
            <Route path="/products/*" element={<AllProducts />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/inventory/:prodId" element={<InventoryDetail />} />


            <Route path="/transactions" element={<div>หน้ารายการรับซื้อ</div>} />
            <Route path="/receipts" element={<div>หน้าบิล/ใบเสร็จ</div>} />
            <Route path="/customers" element={<div>หน้าลูกค้า</div>} />
            <Route path="/help" element={<div>หน้าช่วยเหลือ</div>} />
            <Route path="/settings" element={<div>หน้าตั้งค่า</div>} />

            <Route path="*" element={<Navigate to="/products" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
