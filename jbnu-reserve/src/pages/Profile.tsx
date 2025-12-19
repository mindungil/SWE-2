import React from "react";
import Header from "../ui/Header";
import "../styles/app.css";
import { useStore } from "../state/store";
import { useNavigate } from "react-router-dom";
import { useToast } from "../ui/Toast";

export default function Profile() {
  const nav = useNavigate();
  const toast = useToast();
  const { reservations, cancelReservation } = useStore();

  const cancel = (id: string) => {
    if (!confirm("예약을 취소하시겠습니까?")) return;
    cancelReservation(id);
    toast("예약이 취소되었습니다.", "ok");
  };

  return (
    <div className="page">
      <Header small />
      <div className="container">
        <div style={{ display: "flex", gap: 10, margin: "12px 0" }}>
          <button className="btn btnGhost" onClick={() => nav("/home")}>← 홈</button>
          <div style={{ flex: 1 }} />
          <span className="badgeOk">무한상상실: 일2/주5</span>
          <span className="badgeBad">열람실: 일4</span>
        </div>

        <div className="card">
          <h2 className="cardTitle">개인 예약조회</h2>
          <p className="cardDesc">현재 예약된 내역을 확인하고 취소할 수 있습니다.</p>

          {reservations.length === 0 ? (
            <div className="cardDesc">예약 내역이 없습니다.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {reservations.map((r) => (
                <div key={r.id} className="card" style={{ background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>
                      {r.type === "room" ? `회의실 ${r.roomNo}` : `좌석 ${r.seatNo}`}
                    </div>
                    <button className="btn btnPrimary" style={{ height: 36, padding: "0 12px", borderRadius: 12 }} onClick={() => cancel(r.id)}>
                      취소
                    </button>
                  </div>
                  <div className="cardDesc" style={{ marginTop: 6 }}>
                    {r.date} · {String(r.startHour).padStart(2,"0")}:00 ~ {String(r.startHour + r.durationHours).padStart(2,"0")}:00
                    {r.type === "laptop" && r.random ? " · (랜덤)" : ""}
                  </div>
                  {r.type === "room" && (
                    <div className="cardDesc">동반 인원: {r.party.length}명</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
