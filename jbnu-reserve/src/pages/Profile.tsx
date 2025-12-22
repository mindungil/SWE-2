import { useEffect, useState } from "react";
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
  // 초기값을 확실한 빈 배열로 선언
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    bookingId: number | null;
  }>({ open: false, bookingId: null });

  // 내 예약 목록 조회
  const fetchBookings = async () => {
    try {
      const response = await apiFetch("/api/my-bookings?status=CONFIRMED");
      if (response.ok) {
        const data = await response.json();

        // 방어 로직: data.bookings가 없으면 빈 배열([])을 넣어서 렌더링 에러 방지
        if (data.bookings && Array.isArray(data.bookings)) {
          setBookings(data.bookings);
        } else if (Array.isArray(data)) {
          // 혹시라도 서버가 { bookings: [...] } 형태가 아니라 [...] 배열 자체를 줄 경우 대비
          setBookings(data);
        } else {
          setBookings([]); // 데이터가 이상하면 빈 목록 처리
        }
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

  // 예약 취소 확인 모달 열기
  const openCancelModal = (bookingId: number) => {
    setCancelModal({ open: true, bookingId });
  };

  // 예약 취소 확인 모달 닫기
  const closeCancelModal = () => {
    setCancelModal({ open: false, bookingId: null });
  };

  // 예약 취소 실행
  const cancel = async () => {
    if (!cancelModal.bookingId) return;

    try {
      const response = await apiFetch(`/api/my-bookings/${cancelModal.bookingId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast("예약이 취소되었습니다.", "ok");
        fetchBookings(); // 목록 새로고침
      } else {
        toast(data.detail || "취소할 수 없는 예약입니다.", "bad");
      }
    } catch (error) {
      toast("서버와 통신 중 오류가 발생했습니다.", "bad");
    } finally {
      closeCancelModal(); // 어떤 응답이든 모달 닫기
    }
  };

  const formatTime = (isoStr: string) => {
    if (!isoStr) return "--:--"; // 날짜 데이터 없을 때 방어
    const d = new Date(isoStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="page">
      <Header small />
      <div className="container">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 0 }}>
            <h2 className="cardTitle" style={{ marginBottom: 0 }}>개인 예약조회</h2>
            <button className="btn btnGhost" onClick={() => nav("/home")}>← 홈</button>
          </div>
          {loading ? (
            <div className="cardDesc">불러오는 중...</div>
          ) : !bookings || bookings.length === 0 ? ( // bookings가 null/undefined일 경우 대비
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
                      onClick={() => openCancelModal(b.booking_id)}
                    >
                      취소
                    </button>
                  </div>
                  <div className="cardDesc" style={{ marginTop: 6 }}>
                    {/* start_time이 있을 때만 split 실행 */}
                    {b.start_time ? b.start_time.split("T")[0] : ""} · {formatTime(b.start_time)} ~ {formatTime(b.end_time)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 취소 확인 모달 */}
      {cancelModal.open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "14px",
          }}
          onClick={closeCancelModal}
        >
          <div
            className="card"
            style={{
              maxWidth: "420px",
              width: "100%",
              margin: "0 auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="cardTitle" style={{ marginBottom: 12 }}>
              예약 취소 확인
            </h2>
            <div style={{ marginBottom: 20, lineHeight: 1.6 }}>
              <div style={{ fontSize: 14, color: "var(--text)" }}>
                예약을 취소하시겠습니까?
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btnGhost"
                style={{ flex: 1 }}
                onClick={closeCancelModal}
              >
                취소
              </button>
              <button
                className="btn btnPrimary"
                style={{ flex: 1 }}
                onClick={cancel}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}