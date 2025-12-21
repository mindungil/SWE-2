import React, { useEffect, useState } from "react";
import Header from "../ui/Header";
import "../styles/app.css";
import { useNavigate } from "react-router-dom";
import { useStore } from "../state/store";
import { apiFetch } from "../api/client";

interface OverviewData {
  name: string;
  meeting_rooms: any[];
  laptop_seats: { resource_number: number; is_available: boolean }[];
}

export default function Home() {
  const nav = useNavigate();
  const { logout, user } = useStore();
  const [status, setStatus] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  // 현재 시간 및 날짜 관련 로직 추가
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  // 운영 시간 여부 판단 (09:00 ~ 18:00)
  const isOperating = now.getHours() >= 9 && now.getHours() < 18;

  const handleLogout = async () => {
    try {
      await apiFetch("/api/logout", { method: "POST" });
    } catch (error) {
      console.error("로그아웃 API 호출 실패:", error);
    } finally {
      localStorage.removeItem("access_token"); 
      logout(); 
      nav("/"); 
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await apiFetch(`/api/overview?date=${today}`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        console.error("현황 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [today]);

  const availableLaptops = status?.laptop_seats.filter(s => s.is_available).length || 0;

  return (
    <div className="page">
      <Header small />
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0" }}>
          {/* 서버에서 받은 name 우선 표시, 없으면 studentId 표시 */}
          <div style={{ fontWeight: 900 }}>
            안녕하세요, {status?.name || user?.studentId}님
          </div>
          <button className="btn btnGhost" style={{ height: 38, padding: "0 12px", borderRadius: 12 }} onClick={handleLogout}>
            로그아웃
          </button>
        </div>

        {/* 실시간 현황 요약 카드 */}
        <div className="card" style={{ marginBottom: 16, padding: "12px 16px", backgroundColor: "#f8f9fa", border: "none" }}>
          {/* 기준 시간(HH:MM) 표시 반영 */}
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--muted)" }}>
            실시간 예약 현황 ({today} {currentTimeStr} 기준)
          </div>

          {loading ? (
            <div style={{ fontSize: 14 }}>현황 불러오는 중...</div>
          ) : !isOperating ? (
            /* 운영 시간 외 안내 문구 추가 */
            <div style={{ fontWeight: 800, color: "var(--bad)", fontSize: 14, padding: "4px 0" }}>
              현재 이용 가능 시간이 아닙니다 (운영시간 09:00 ~ 18:00)
            </div>
          ) : (
            /* 운영 시간 내에만 현황 노출 */
            <div style={{ display: "flex", gap: "16px" }}>
              <div>
                <span style={{ fontSize: 12 }}>회의실</span>
                <div style={{ fontWeight: 800, color: "var(--blue)" }}>3개 운영 중</div>
              </div>
              <div style={{ width: 1, backgroundColor: "#ddd" }} />
              <div>
                <span style={{ fontSize: 12 }}>노트북석</span>
                <div style={{ fontWeight: 800, color: availableLaptops > 0 ? "var(--ok)" : "var(--bad)" }}>
                  {availableLaptops} / 70석 가능
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid2">
          <div className="card bigBox" onClick={() => nav("/room")} style={{ cursor: "pointer" }}>
            <div>
              <div className="bigBoxTop">무한상상실 예약</div>
              <div className="bigBoxMid">09~18시 · 1시간 단위 · 최대 2시간</div>
            </div>
            <div className="bigBoxLink">예약하러 가기 →</div>
          </div>

          <div className="card bigBox" onClick={() => nav("/laptop")} style={{ cursor: "pointer" }}>
            <div>
              <div className="bigBoxTop">노트북 열람실 예약</div>
              <div className="bigBoxMid">09~18시 · 4시간 제한 · 랜덤/지정</div>
            </div>
            <div className="bigBoxLink">예약하러 가기 →</div>
          </div>
        </div>

        <div className="fabWrap" style={{ marginTop: 24 }}>
          <button className="fab" onClick={() => nav("/profile")} aria-label="개인 예약조회">👤</button>
          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, fontWeight: 800, marginTop: 8 }}>나의 예약확인</div>
        </div>
      </div>
    </div>
  );
}