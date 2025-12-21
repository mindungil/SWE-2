import React, { useEffect, useState } from "react";
import Header from "../ui/Header";
import "../styles/app.css";
import { useNavigate } from "react-router-dom";
import { useToast } from "../ui/Toast";
import { apiFetch } from "../api/client";

interface Booking {
  booking_id: number;
  resource_type: "MEETING_ROOM" | "LAPTOP_SEAT";
  resource_number: number;
  start_time: string;
  end_time: string;
  status: string;
  can_cancel: boolean;
}

export default function Profile() {
  const nav = useNavigate();
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // 내 예약 목록 조회
  const fetchBookings = async () => {
    try {
      const response = await apiFetch("/api/my-bookings?status=CONFIRMED");
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
      }
    } catch (error) {
      toast("내역을 불러오는데 실패했습니다.", "bad");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // 예약 취소
  const cancel = async (bookingId: number) => {
    if (!confirm("예약을 취소하시겠습니까?")) return;

    try {
      const response = await apiFetch(`/api/my-bookings/${bookingId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast("예약이 취소되었습니다.", "ok");
        fetchBookings(); // 목록 새로고침
      } else {
        // 취소 불가 시간(2시간 이내) 등 에러 메시지 처리
        toast(data.detail || "취소할 수 없는 예약입니다.", "bad");
      }
    } catch (error) {
      toast("서버와 통신 중 오류가 발생했습니다.", "bad");
    }
  };

  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="page">
      <Header small />
      <div className="container">
        <div className="card">
          <h2 className="cardTitle">개인 예약조회</h2>
          {loading ? (
            <div className="cardDesc">불러오는 중...</div>
          ) : bookings.length === 0 ? (
            <div className="cardDesc">예약 내역이 없습니다.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {bookings.map((b) => (
                <div key={b.booking_id} className="card" style={{ background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>
                      {b.resource_type === "MEETING_ROOM" ? `회의실 ${b.resource_number}` : `좌석 ${b.resource_number}`}
                    </div>
                    <button 
                      className="btn btnPrimary" 
                      style={{ height: 36, padding: "0 12px", borderRadius: 12, opacity: b.can_cancel ? 1 : 0.5 }} 
                      onClick={() => cancel(b.booking_id)}
                    >
                      취소
                    </button>
                  </div>
                  <div className="cardDesc" style={{ marginTop: 6 }}>
                    {b.start_time.split("T")[0]} · {formatTime(b.start_time)} ~ {formatTime(b.end_time)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}