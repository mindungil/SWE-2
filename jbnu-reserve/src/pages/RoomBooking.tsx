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

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startHour, setStartHour] = useState(9);
  const [duration, setDuration] = useState<1 | 2>(1);
  const [roomNo, setRoomNo] = useState<1 | 2 | 3>(1);

  const [party, setParty] = useState<PartyMember[]>(
    Array.from({ length: 5 }, () => ({ name: "", studentId: "" })) // 본인 제외 최대 5명 입력
  );

  const availableStartHours = useMemo(() => Array.from({ length: 9 }, (_, i) => 9 + i), []); // 09시 ~ 17시

  useEffect(() => {
    // 17시에 시작하면 2시간 예약은 불가능하므로 1시간으로 강제 변경
    if (startHour >= 17 && duration === 2) {
      setDuration(1);
    }
  }, [startHour, duration]);

  // 실패 케이스에도 filled를 항상 포함시켜서 v.filled 타입 오류 제거
  const validParty = ():
    | { ok: true; filled: PartyMember[] }
    | { ok: false; msg: string; filled: PartyMember[] } => {

    const filled = party
      .map((p) => ({ name: p.name.trim(), studentId: p.studentId.trim() }))
      .filter((p) => p.name || p.studentId);

    // 최소 2명 동반 => 본인 포함 총 3명 이상이 되려면, 동반 입력 2명 이상 필요
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

// 내부 submit 함수 수정
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
      // 성공
      toast("회의실 예약이 완료되었습니다!", "ok");
      nav("/profile");
    } else if (response.status === 409) {
      // 실패
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
                  {availableStartHours.map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00
                    </option>
                  ))}
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
                동반 인원 입력 (본인 제외 최대 5명)
              </div>
              <div className="cardDesc">최소 2명 입력 필요 (본인 포함 3명)</div>

              {party.map((p, idx) => (
                <div className="row" key={idx}>
                  <div className="field">
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
                    />
                  </div>
                  <div className="field">
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
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn btnBlue"
              style={{ width: "100%", marginTop: 12 }}
              type="submit"
            >
              예약하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
