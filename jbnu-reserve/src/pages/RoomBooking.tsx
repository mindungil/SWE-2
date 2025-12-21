import React, { useMemo, useState, useEffect } from "react";
import Header from "../ui/Header";
import "../styles/app.css";
import { useToast } from "../ui/Toast";
import { useStore } from "../state/store";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";

type PartyMember = { name: string; studentId: string };

export default function RoomBooking() {
  const nav = useNavigate();
  const toast = useToast();
  const { addReservation } = useStore();

  const getMinDate = () => {
    const now = new Date();
    // 17시 이후라면 내일 날짜를 계산 (회의실은 17시 마감)
    if (now.getHours() >= 17) {
      now.setDate(now.getDate() + 1);
    }
    
    // YYYY-MM-DD 포맷을 로컬 시간 기준으로 직접 조합
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(() => getMinDate());
  const [startHour, setStartHour] = useState(9);
  const [duration, setDuration] = useState<1 | 2>(1);
  const [roomNo, setRoomNo] = useState<1 | 2 | 3>(1);

  const [party, setParty] = useState<PartyMember[]>(
    Array.from({ length: 5 }, () => ({ name: "", studentId: "" }))
  );

  // todayStr 비교 시에도 로컬 시간 기준 포맷 사용
  const availableStartHours = useMemo(() => {
    const allHours = Array.from({ length: 9 }, (_, i) => 9 + i);
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    if (date === todayStr) {
      const currentHour = now.getHours();
      return allHours.filter(h => h > currentHour); 
    }
    return allHours;
  }, [date]);

  useEffect(() => {
    if (availableStartHours.length > 0 && !availableStartHours.includes(startHour)) {
      setStartHour(availableStartHours[0]);
    }
  }, [availableStartHours, startHour]);

  useEffect(() => {
    if (startHour >= 17 && duration === 2) {
      setDuration(1);
    }
  }, [startHour, duration]);

  const validParty = ():
    | { ok: true; filled: PartyMember[] }
    | { ok: false; msg: string; filled: PartyMember[] } => {

    const filled = party
      .map((p) => ({ name: p.name.trim(), studentId: p.studentId.trim() }))
      .filter((p) => p.name || p.studentId);

    if (filled.length < 2) {
      return { ok: false, msg: "동반 인원 최소 2명을 입력하세요. (본인 포함 3명)", filled: [] };
    }

    if (filled.length > 5) {
      return { ok: false, msg: "동반 인원은 최대 5명까지 입력 가능합니다.", filled: [] };
    }

    for (const p of filled) {
      if (!p.name || !/^\d{9}$/.test(p.studentId)) {
        return { ok: false, msg: "동반 인원 이름/학번(9자리)을 정확히 입력하세요.", filled: [] };
      }
    }

    return { ok: true, filled };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validParty();
    if (!v.ok) return toast(v.msg, "bad");

    const startTimeStr = `${String(startHour).padStart(2, "0")}:00`;
    const endTimeStr = `${String(startHour + duration).padStart(2, "0")}:00`;

    try {
      const response = await apiFetch("/api/meeting-rooms/bookings", {
        method: "POST",
        body: JSON.stringify({
          room_number: roomNo,
          date: date,
          start_time: startTimeStr,
          end_time: endTimeStr,
          companions: v.filled.map(p => ({ name: p.name, student_id: p.studentId })),
        }),
      });

      const data = await response.json();

      if (response.status === 201) {
        toast("회의실 예약이 완료되었습니다!", "ok");
        nav("/home");
      } else if (response.status === 409) {
        toast(data.detail || "예약 조건에 맞지 않습니다.", "bad");
      } else {
        toast(data.detail || "예약에 실패했습니다.", "bad");
      }
    } catch (error) {
      toast("서버와 통신 중 오류가 발생했습니다.", "bad");
    }
  };

  return (
    <div className="page">
      <Header small />
      <div className="container">
        <div style={{ display: "flex", gap: 10, margin: "12px 0" }}>
          <button className="btn btnGhost" onClick={() => nav("/home")}>
            ← 홈
          </button>
          <div style={{ flex: 1 }} />
          <span className="badgeOk">일일 2시간</span>
          <span className="badgeBad">주간 5시간</span>
        </div>

        <div className="card">
          <h2 className="cardTitle">무한상상실 예약</h2>
          <p className="cardDesc">09~18시 · 1시간 단위 · 최대 2시간 · 3개 회의실</p>

          <form onSubmit={submit}>
            <div className="row">
              <div className="field">
                <div className="label">날짜</div>
                <input
                  className="input"
                  type="date"
                  value={date}
                  min={getMinDate()}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="field">
                <div className="label">시작</div>
                <select
                  className="input"
                  value={startHour}
                  onChange={(e) => setStartHour(Number(e.target.value))}
                >
                  {availableStartHours.length > 0 ? (
                    availableStartHours.map((h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, "0")}:00
                      </option>
                    ))
                  ) : (
                    <option disabled>예약 마감</option>
                  )}
                </select>
              </div>
            </div>

            <div className="row">
              <div className="field">
                <div className="label">시간(최대 2시간)</div>
                <select
                  className="input"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value) as 1 | 2)}
                >
                  <option value={1}>1시간</option>
                  {startHour < 17 && <option value={2}>2시간</option>}
                </select>
              </div>
              <div className="field">
                <div className="label">회의실(1~3)</div>
                <select
                  className="input"
                  value={roomNo}
                  onChange={(e) =>
                    setRoomNo(Number(e.target.value) as 1 | 2 | 3)
                  }
                >
                  <option value={1}>회의실 1</option>
                  <option value={2}>회의실 2</option>
                  <option value={3}>회의실 3</option>
                </select>
              </div>
            </div>

            <div className="card" style={{ marginTop: 12, background: "#f8fafc" }}>
              <div className="cardTitle" style={{ fontSize: 14 }}>
                동반 인원 입력 (본인 포함 최대 6명)
              </div>
              <div className="cardDesc">최소 2명 입력 필요 (본인 포함 3명)</div>

              {party.map((p, idx) => (
                <div className="row" key={idx}>
                  {/* style={{ flex: 1 }} 추가로 너비 균등 분배 및 삐져나감 방지 */}
                  <div className="field" style={{ flex: 1 }}>
                    <div className="label">이름</div>
                    <input
                      className="input"
                      value={p.name}
                      onChange={(e) => {
                        const next = [...party];
                        next[idx] = { ...next[idx], name: e.target.value };
                        setParty(next);
                      }}
                      placeholder="홍길동"
                      style={{ width: "100%" }} // input도 부모에 맞춤
                    />
                  </div>
                  {/* style={{ flex: 1 }} 추가 */}
                  <div className="field" style={{ flex: 1 }}>
                    <div className="label">학번(9자리)</div>
                    <input
                      className="input"
                      value={p.studentId}
                      onChange={(e) => {
                        const next = [...party];
                        next[idx] = { ...next[idx], studentId: e.target.value };
                        setParty(next);
                      }}
                      placeholder="202012345"
                      inputMode="numeric"
                      style={{ width: "100%" }} // input도 부모에 맞춤
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn btnBlue"
              style={{ width: "100%", marginTop: 12 }}
              type="submit"
              disabled={availableStartHours.length === 0}
            >
              {availableStartHours.length > 0 ? "예약하기" : "예약 가능한 시간이 없습니다"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}