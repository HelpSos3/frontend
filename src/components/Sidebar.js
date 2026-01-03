import React from "react";
import { NavLink } from "react-router-dom";

/* โลโก้ */
import logoLeaf from "../image/plant.png";

/* ไอคอน (ปกติ) */
import iconCart from "../image/grocery-store.png";
import iconList from "../image/wishlist.png";
import iconBox from "../image/logistics.png";
import iconShopping from "../image/shopping-list.png";
import iconPeople from "../image/customer.png";
import iconReceipt from "../image/bill.png";
import iconHelp from "../image/question.png";
import iconGear from "../image/management.png";

/* ไอคอน active */
import iconCartActive from "../image/grocery-store-active.png";
import iconListActive from "../image/wishlist-active.png";
import iconBoxActive from "../image/logistics-active.png";
import iconShoppingActive from "../image/shopping-list-active.png";
import iconPeopleActive from "../image/customer-active.png";
import iconReceiptActive from "../image/bill-active.png";
import iconHelpActive from "../image/question-active.png";
import iconGearActive from "../image/management-active.png";

/** เมนู 1 รายการ: สลับรูปตาม isActive (ถ้าไม่มี iconActive จะใช้ icon ปกติ) */
function MenuItem({ to, label, icon, iconActive, end }) {
  return (
    <li className="nav-item">
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
      >
        {({ isActive }) => {
          const src = isActive && iconActive ? iconActive : icon;
          return (
            <>
              <img
                className="menu-icon"
                src={src}
                alt=""
                width={22}
                height={22}
                loading="lazy"
              />
              <span>{label}</span>
            </>
          );
        }}
      </NavLink>
    </li>
  );
}

export default function Sidebar() {
  return (
    <aside className="sidebar d-flex flex-column p-3">
      {/* โลโก้ / ชื่อร้าน */}
      <div className="brand-strip rounded-3 p-3 mb-3 d-flex align-items-center gap-2">
        <div className="brand-logo">
          <img src={logoLeaf} alt="Logo" />
        </div>
        <div>
          <div className="fw-bold">ร้านรับซื้อของเก่า</div>
          <small className="text-light-50">Scrap Shop System</small>
        </div>
      </div>

      {/* เมนูหลัก */}
      <nav className="mb-2">
        <ul className="nav nav-pills flex-column gap-1">
          <MenuItem
            to="/purchase"
            label="รับซื้อสินค้า"
            icon={iconCart}
            iconActive={iconCartActive}
          />
        </ul>
      </nav>

      {/* สินค้า */}
      <div className="section-label px-2 mt-3 mb-1">สินค้า</div>
      <ul className="nav nav-pills flex-column gap-1">
        <MenuItem
          to="/products"
          label="สินค้าทั้งหมด"
          icon={iconList}
          iconActive={iconListActive}
        />
        <MenuItem
          to="/inventory"
          label="คลังสินค้า"
          icon={iconBox}
          iconActive={iconBoxActive}
        />
      </ul>

      {/* ประวัติการรับซื้อ */}
      <div className="section-label px-2 mt-4 mb-1">ประวัติการรับซื้อ</div>
      <ul className="nav nav-pills flex-column gap-1">
        <MenuItem
          to="/purchase-order"
          label="รายการรับซื้อ"
          icon={iconShopping}
          iconActive={iconShoppingActive}
        />
        <MenuItem
          to="/customers"
          label="ลูกค้า"
          icon={iconPeople}
          iconActive={iconPeopleActive}
        />
        <MenuItem
          to="/receipts"
          label="บิลใบเสร็จ"
          icon={iconReceipt}
          iconActive={iconReceiptActive}
        />
      </ul>

      {/* ล่างสุด */}
      <div className="sidebar-footer mt-auto pt-3 border-top border-light-subtle">
        <ul className="nav nav-pills flex-column gap-1 mt-3">
          <MenuItem
            to="/help"
            label="ศูนย์ช่วยเหลือ"
            icon={iconHelp}
            iconActive={iconHelpActive}
          />
        </ul>
        <ul className="nav nav-pills flex-column gap-1 mt-2">
          <MenuItem
            to="/settings"
            label="ตั้งค่า - System"
            icon={iconGear}
            iconActive={iconGearActive}
          />
        </ul>
      </div>
    </aside>
  );
}

