import React, { useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import th from "date-fns/locale/th";
import "react-datepicker/dist/react-datepicker.css";
import "../css/DateRangePicker.css";

registerLocale("th", th);

const formatDateLocal = (date) => {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const PopperContainer = ({ children }) => {
  return <div className="datepicker-inside-card">{children}</div>;
};

export default function DateRangePicker({
  open,
  onClose,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  onApply,
  onClear,
}) {
  const popRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (popRef.current && !popRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!open) return null;

  const renderHeader = ({ date, decreaseMonth, increaseMonth }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 8px",
        marginBottom: 4,
      }}
    >
      <button
        type="button"
        onClick={decreaseMonth}
        style={{
          border: "none",
          background: "none",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        {"<"}
      </button>

      <div style={{ fontWeight: 600 }}>
        {date.toLocaleString("th-TH", { month: "long" })}{" "}
        {date.getFullYear()}
      </div>

      <button
        type="button"
        onClick={increaseMonth}
        style={{
          border: "none",
          background: "none",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        {">"}
      </button>
    </div>
  );

  return (
    <div
      ref={popRef}
      className="cs-popover p-3"
      style={{
        position: "absolute",
        right: 0,
        top: "110%",
        zIndex: 9999,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        width: 360,
      }}
    >
      <div className="date-range-title">ช่วงวันที่</div>

      <div className="d-flex gap-2 mb-3">
        <div className="flex-grow-1">
          <label className="date-range-label">ตั้งแต่</label>
          <DatePicker
            selected={dateFrom ? new Date(dateFrom) : null}
            onChange={(d) => setDateFrom(formatDateLocal(d))}
            dateFormat="dd/MM/yyyy"
            locale="th"
            className="form-control"
            placeholderText="วว/ดด/ปปปป"
            popperContainer={PopperContainer}
            popperPlacement="bottom-start"
            calendarStartDay={0}
            renderCustomHeader={renderHeader}
          />
        </div>

        <div className="flex-grow-1">
          <label className="date-range-label">ถึง</label>
          <DatePicker
            selected={dateTo ? new Date(dateTo) : null}
            onChange={(d) => setDateTo(formatDateLocal(d))}
            dateFormat="dd/MM/yyyy"
            locale="th"
            className="form-control"
            placeholderText="วว/ดด/ปปปป"
            popperContainer={PopperContainer}
            popperPlacement="bottom-start"
            calendarStartDay={0}
            renderCustomHeader={renderHeader}
          />
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2">
        <button
          className="btn date-clear-btn"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
        >
          ล้างช่วง
        </button>

        <button
          className="btn date-apply-btn"
          onClick={(e) => {
            e.stopPropagation();
            onApply();
          }}
        >
          ตกลง
        </button>
      </div>
    </div>
  );
}
