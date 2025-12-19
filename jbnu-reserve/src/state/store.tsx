import React, { createContext, useContext, useMemo, useState } from "react";

export type User = { studentId: string };
export type Reservation =
  | { id: string; type: "room"; date: string; startHour: number; durationHours: number; roomNo: 1 | 2 | 3; party: { name: string; studentId: string }[] }
  | { id: string; type: "laptop"; date: string; startHour: number; durationHours: 2 | 4; seatNo: number; random: boolean };

type Store = {
  user: User | null;
  reservations: Reservation[];
  login: (studentId: string) => void;
  logout: () => void;
  addReservation: (r: Reservation) => { ok: boolean; msg: string };
  cancelReservation: (id: string) => void;
};

const StoreCtx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const login = (studentId: string) => setUser({ studentId });
  const logout = () => { setUser(null); setReservations([]); };

  // 더미데이터 없음: 충돌/시간제한 로직은 "UI 가드" 수준만
  const addReservation: Store["addReservation"] = (r) => {
    // 같은 타입/자원/시간 겹치면 막기(프론트 임시)
    const conflict = reservations.some((x) => {
      if (x.date !== r.date) return false;
      const a1 = x.startHour, a2 = x.startHour + x.durationHours;
      const b1 = r.startHour, b2 = r.startHour + r.durationHours;
      const overlap = Math.max(a1, b1) < Math.min(a2, b2);
      if (!overlap) return false;

      if (x.type === "room" && r.type === "room") return x.roomNo === r.roomNo;
      if (x.type === "laptop" && r.type === "laptop") return x.seatNo === r.seatNo;
      return false;
    });

    if (conflict) return { ok: false, msg: "이미 예약된 자리/회의실입니다." };

    setReservations((prev) => [r, ...prev]);
    return { ok: true, msg: "예약 성공!" };
  };

  const cancelReservation = (id: string) => setReservations((prev) => prev.filter((r) => r.id !== id));

  const value = useMemo<Store>(() => ({ user, reservations, login, logout, addReservation, cancelReservation }), [user, reservations]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
