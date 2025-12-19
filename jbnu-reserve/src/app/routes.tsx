import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useStore } from "../state/store";

import Login from "../pages/Login";
import Home from "../pages/Home";
import RoomBooking from "../pages/RoomBooking";
import LaptopBooking from "../pages/LaptopBooking";
import Profile from "../pages/Profile";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function RoutesRoot() {
  const { user } = useStore();
  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? "/home" : "/login"} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
      <Route path="/room" element={<RequireAuth><RoomBooking /></RequireAuth>} />
      <Route path="/laptop" element={<RequireAuth><LaptopBooking /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
