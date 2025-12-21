import React from "react";
import "../styles/app.css";

export default function Header({ small }: { small?: boolean }) {
  return (
    <div className="header" style={small ? { padding: "10px 14px 12px" } : undefined}>
      <div className="headerTitle">JBNU 공대 학습실 예약 관리 시스템</div>
      <div className="headerSub">모바일 웹 · 무한상상실 / 노트북 열람실</div>
    </div>
  );
}
