import React from "react";
import { Routes, Route } from "react-router-dom";
import IdentitySelect from "../components/IdentitySelect";

export default function PurchasePage() {
  return (
    <Routes>
      <Route index element={<IdentitySelect />} />
    </Routes>
  );
}
