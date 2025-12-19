import React from "react";
import Header from "../ui/Header";
import "../styles/app.css";
import { useNavigate } from "react-router-dom";
import { useStore } from "../state/store";

export default function Home() {
  const nav = useNavigate();
  const { logout, user } = useStore();

  return (
    <div className="page">
      <Header small />
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0" }}>
          <div style={{ fontWeight: 900 }}>안녕하세요, {user?.studentId}</div>
          <button className="btn btnGhost" style={{ height: 38, padding: "0 12px", borderRadius: 12 }} onClick={() => logout()}>
            로그아웃
          </button>
        </div>

        <div className="grid2">
          <div className="card bigBox" onClick={() => nav("/room")} style={{ cursor: "pointer" }}>
            <div>
              <div className="bigBoxTop">무한상상실 예약</div>
              <div className="bigBoxMid">09~18시 · 1시간 단위 · 최대 2시간 · 3개 회의실</div>
            </div>
            <div className="bigBoxLink">예약하러 가기 →</div>
          </div>

          <div className="card bigBox" onClick={() => nav("/laptop")} style={{ cursor: "pointer" }}>
            <div>
              <div className="bigBoxTop">노트북 열람실 예약</div>
              <div className="bigBoxMid">09~18시 · 2시간 단위 · 최대 4시간 · 70석 · 랜덤예약</div>
            </div>
            <div className="bigBoxLink">예약하러 가기 →</div>
          </div>
        </div>

        <div className="fabWrap">
          <button className="fab" onClick={() => nav("/profile")} aria-label="개인 예약조회">
            👤
          </button>
        </div>
        <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, fontWeight: 800 }}>개인 예약조회</div>
      </div>
    </div>
  );
}
