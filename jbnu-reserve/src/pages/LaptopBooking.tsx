import React, { useMemo, useState, useEffect } from "react";
import Header from "../ui/Header";
import "../styles/app.css";
import { useToast } from "../ui/Toast";
import { useStore } from "../state/store";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";

interface SeatStatus { resource_number: number; is_available: boolean; }

export default function LaptopBooking() {
  const nav = useNavigate();
  const toast = useToast();
  const { addReservation } = useStore();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startHour, setStartHour] = useState(9);
  const [duration, setDuration] = useState<2 | 4>(2);

  const [seatStatuses, setSeatStatuses] = useState<SeatStatus[]>([]); // 서버 좌석 상태 저장
  const [loading, setLoading] = useState(true); // 로딩 상태

  // 시작 시간에 따른 이용 가능 시간(duration) 강제 조정
  useEffect(() => {
    if (startHour >= 15 && duration === 4) {
      setDuration(2); // 15시 이후엔 4시간 예약이 불가능하므로 2시간으로 강제 변경
    }
  }, [startHour, duration]);

  // 실시간 좌석 상태를 서버에서 가져오는 함수
  const fetchStatus = async () => {
    setLoading(true);
    try {
      // 특정 날짜/시간/기간에 따른 가용 좌석 조회
      const startTimeStr = `${String(startHour).padStart(2, "0")}:00`;
      const response = await apiFetch(`/api/laptop_seats?date=${date}&start_time=${startTimeStr}&duration=${duration}`);
      
      if (response.ok) {
        const data = await response.json();
        // 응답 데이터의 available_seats 배열을 상태에 저장
        setSeatStatuses(data.available_seats); 
      }
    } catch (error) {
      toast("좌석 현황을 불러오는데 실패했습니다.", "bad");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, [date, startHour, duration]);

  const [page, setPage] = useState<1 | 2>(1);
  const seats = useMemo(() => Array.from({ length: 70 }, (_, i) => i + 1), []);
  const shown = seats.filter(s => (page === 1 ? s <= 35 : s >= 36));

  const availableStartHours = useMemo(() => {
    const allHours = Array.from({ length: 8 }, (_, i) => 9 + i); // 09:00 ~ 16:00 기본 선택지
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
  
    // 선택한 날짜가 오늘인 경우에만 시간 필터링 적용
    if (date === todayStr) {
      const currentHour = now.getHours();
      // 현재 시간보다 1시간 이후부터만 선택 가능하게 필터링 (예: 13시 51분이면 14시부터)
      return allHours.filter(h => h > currentHour); 
    }
  
    return allHours;
  }, [date]); // 날짜가 바뀔 때마다 다시 계산

  // 날짜나 시간이 바뀌었을 때, 현재 시점보다 과거라면 가능한 첫 번째 시간으로 자동 보정
  useEffect(() => {
    if (availableStartHours.length > 0 && !availableStartHours.includes(startHour)) {
      setStartHour(availableStartHours[0]); // 선택 가능한 가장 빠른 시간으로 자동 세팅
    }
  }, [availableStartHours, startHour]);

  const bookSeat = async (seatNo: number, isRandom: boolean) => {
    const startTimeStr = `${String(startHour).padStart(2, "0")}:00`;
    const endTimeStr = `${String(startHour + duration).padStart(2, "0")}:00`;

    // 랜덤 여부에 따른 엔드포인트 선택
    const endpoint = isRandom ? "/api/laptop-seats/bookings/random" : "/api/laptop-seats/bookings";

    // 랜덤 예약은 seat_number를 보내지 않음
    const body = isRandom 
      ? { date, start_time: startTimeStr, end_time: endTimeStr }
      : { seat_number: seatNo, date, start_time: startTimeStr, end_time: endTimeStr };

    try {
      const response = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.status === 201) {
        // 성공
        toast(isRandom ? `랜덤 예약 성공! 좌석: ${data.resource_number}` : "좌석 예약 성공!", "ok");
        nav("/profile");
      } else if (response.status === 409) {
        // 충돌케이스
        // 가용 좌석 없음이나 시간 초과 메시지를 서버에서 준 그대로 출력
        toast(data.detail || "예약이 불가능한 상태입니다.", "bad");
      } else {
        toast(data.detail || "예약 실패", "bad");
      }
    } catch (error) {
      toast("서버와 통신 중 오류가 발생했습니다.", "bad");
    }
  };

  const randomPick = () => {
    bookSeat(0, true); // 랜덤일 때는 seatNo가 의미 없으므로 0 전달
  };

  return (
    <div className="page">
      <Header small />
      <div className="container">
        <div style={{ display: "flex", gap: 10, margin: "12px 0" }}>
          <button className="btn btnGhost" onClick={() => nav("/home")}>← 홈</button>
          <div style={{ flex: 1 }} />
          <span className="badgeOk">일일 4시간</span>
        </div>

        <div className="card">
          <h2 className="cardTitle">노트북 열람실 예약</h2>
          <p className="cardDesc">09~18시 · 2시간 단위 · 최대 4시간 · 70석 · 랜덤예약</p>

          <div className="row">
            <div className="field">
              <div className="label">날짜</div>
              <input 
                className="input" 
                type="date" 
                value={date} 
                min={new Date().toISOString().slice(0, 10)} // 오늘 날짜 이후만 선택 가능하게 제한
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>
            <div className="field">
              <div className="label">시작</div>
              <select className="input" value={startHour} onChange={(e) => setStartHour(Number(e.target.value))}>
                {availableStartHours.map(h => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
              </select>
            </div>
          </div>

          <div className="row">
            <div className="field">
              <div className="label">시간(2시간 단위)</div>
              <select className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value) as 2 | 4)}>
                <option value={2}>2시간</option>
                {startHour < 15 && <option value={4}>4시간</option>}
              </select>
            </div>
            <div className="field">
              <div className="label">좌석 페이지</div>
              <select className="input" value={page} onChange={(e) => setPage(Number(e.target.value) as 1 | 2)}>
                <option value={1}>1~35</option>
                <option value={2}>36~70</option>
              </select>
            </div>
          </div>

          <button className="btn btnPrimary" style={{ width: "100%", margin: "10px 0" }} onClick={randomPick} type="button">
            랜덤 예약
          </button>

          <div className="card" style={{ background: "#f8fafc" }}>
            <div className="cardTitle" style={{ fontSize: 14, marginBottom: 10 }}>좌석 선택 (초록=가능 / 빨강=불가)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {shown.map(seat => {
                // 해당 좌석의 사용 가능 여부 확인
                const status = seatStatuses.find(s => s.resource_number === seat);
                const isAvailable = status ? status.is_available : false;

                return (
                  <button
                    key={seat}
                    disabled={!isAvailable || loading} // 예약 불가면 클릭 막기
                    className="btn"
                    style={{
                      height: 44,
                      borderRadius: 12,
                      background: isAvailable ? "#16a34a" : "#dc2626", // 가능 = 초록, 불가 = 빨강
                      color: "#fff",
                      opacity: isAvailable ? 1 : 0.6,
                      cursor: isAvailable ? "pointer" : "not-allowed"
                    }}
                    onClick={() => bookSeat(seat, false)}
                  >
                    {seat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
