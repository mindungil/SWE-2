import React, { useState } from "react";
import Header from "../ui/Header";
import "../styles/app.css";
import { useStore } from "../state/store";
import { useNavigate } from "react-router-dom";
import { useToast } from "../ui/Toast";
import { apiFetch } from "../api/client";

export default function Login() {
  const [studentId, setStudentId] = useState("");
  const [birth6, setBirth6] = useState("");
  const { login } = useStore();
  const nav = useNavigate();
  const toast = useToast();

  const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const okId = /^\d{9}$/.test(studentId);
  const okPw = /^\d{6}$/.test(birth6);

  if (!okId || !okPw) {
    toast("학번(9자리) / 생년월일(6자리)을 정확히 입력하세요.", "bad");
    return;
  }

  // 생년월일 포맷 변환 (001231 -> 2000-12-31)
  const yearPrefix = parseInt(birth6.substring(0, 2)) <= 30 ? "20" : "19";
  const formattedBirth = `${yearPrefix}${birth6.substring(0, 2)}-${birth6.substring(2, 4)}-${birth6.substring(4, 6)}`;

  try {
    const response = await apiFetch("/api/login", {
      method: "POST",
      body: JSON.stringify({
        student_id: studentId,
        birth: formattedBirth,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // 성공 시 토큰 저장 및 상태 업데이트
      localStorage.setItem("access_token", data.access_token);
      login(data.student_id); // 기존 store의 login 함수 호출
      toast(`${data.name}님, 환영합니다!`, "ok");
      nav("/home");
    } else {
      // 실패 시 서버가 준 에러 메시지 출력
      toast(data.detail || "로그인에 실패했습니다.", "bad");
    }
  } catch (error) {
    toast("서버와 통신 중 오류가 발생했습니다.", "bad");
  }
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
