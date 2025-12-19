import React, { useState } from "react";
import Header from "../ui/Header";
import "../styles/app.css";
import { useStore } from "../state/store";
import { useNavigate } from "react-router-dom";
import { useToast } from "../ui/Toast";

export default function Login() {
  const [studentId, setStudentId] = useState("");
  const [birth6, setBirth6] = useState("");
  const { login } = useStore();
  const nav = useNavigate();
  const toast = useToast();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const okId = /^\d{9}$/.test(studentId);
    const okPw = /^\d{6}$/.test(birth6);

    if (!okId || !okPw) {
      toast("학번(9자리) / 생년월일(6자리)을 정확히 입력하세요. 다시 입력!", "bad");
      return;
    }

    login(studentId);
    toast("로그인 성공!", "ok");
    nav("/home");
  };

  return (
    <div className="page">
      <Header />
      <div className="container" style={{ paddingTop: 14 }}>
        <div className="card">
          <h2 className="cardTitle">로그인</h2>
          <p className="cardDesc">공대 학생 정보로 로그인합니다. (학번 9자리 / 생년월일 6자리)</p>

          <form onSubmit={onSubmit}>
            <div className="field">
              <div className="label">학번</div>
              <input className="input" value={studentId} onChange={(e) => setStudentId(e.target.value.trim())} placeholder="202012345" inputMode="numeric" />
            </div>

            <div className="field">
              <div className="label">생년월일</div>
              <input className="input" value={birth6} onChange={(e) => setBirth6(e.target.value.trim())} placeholder="001231" inputMode="numeric" />
            </div>

            <button className="btn btnBlue" style={{ width: "100%", marginTop: 8 }} type="submit">
              로그인
            </button>
          </form>

          <p className="cardDesc" style={{ marginTop: 10 }}>
            * 형식이 틀리면 “다시 입력” 안내가 뜹니다.
          </p>
        </div>
      </div>
    </div>
  );
}
