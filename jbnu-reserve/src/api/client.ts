const BASE_URL = "http://localhost:8080";

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("access_token");
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // 토큰 만료 등의 경우 로그아웃 처리 로직 추가 가능
    console.error("인증 에러 발생");
  }

  return response;
};