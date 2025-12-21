# Playwright 테스트 케이스 명세서

**프로젝트:** SWE-2 (시설 예약 시스템)  
**테스트 도구:** Playwright  
**작성일:** 2025

---

## 1. 인증 (Authentication) 테스트 케이스

### TC-AUTH-001: 로그인 성공

**설명:** 유효한 학번과 생년월일로 로그인 시도

**전제조건:**
- 사용자가 데이터베이스에 등록되어 있어야 함
- 서버가 실행 중이어야 함

**테스트 단계:**
1. POST /api/login 요청
2. Request Body: `{"student_id": "202519198", "birth": "2006-05-22"}`

**예상 결과:**
- Status Code: 200 OK
- Response Body에 access_token이 포함되어야 함
- token_type이 "bearer"여야 함

---

### TC-AUTH-002: 로그인 실패 - 잘못된 학번

**설명:** 존재하지 않는 학번으로 로그인 시도

**전제조건:** 서버가 실행 중이어야 함

**테스트 단계:**
1. POST /api/login 요청
2. Request Body: `{"student_id": "202099999", "birth": "2000-01-01"}`

**예상 결과:**
- Status Code: 401 Unauthorized
- Response Body: `{"detail": "Invalid student_id or birth."}`

---

### TC-AUTH-003: 로그인 실패 - 잘못된 생년월일

**설명:** 올바른 학번이지만 잘못된 생년월일로 로그인 시도

**전제조건:**
- 사용자가 데이터베이스에 등록되어 있어야 함
- 서버가 실행 중이어야 함

**테스트 단계:**
1. POST /api/login 요청
2. Request Body: `{"student_id": "202519198", "birth": "2000-01-01"}`

**예상 결과:**
- Status Code: 401 Unauthorized
- Response Body: `{"detail": "Invalid student_id or birth."}`

---

### TC-AUTH-004: 로그아웃 성공

**설명:** 유효한 JWT 토큰으로 로그아웃 시도

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 서버가 실행 중이어야 함

**테스트 단계:**
1. POST /api/logout 요청
2. Authorization Header: `Bearer {access_token}`

**예상 결과:**
- Status Code: 200 OK
- Response Body: `{"message": "User {student_id} logged out."}`

---

### TC-AUTH-005: 로그아웃 실패 - 토큰 없음

**설명:** Authorization 헤더 없이 로그아웃 시도

**전제조건:** 서버가 실행 중이어야 함

**테스트 단계:**
1. POST /api/logout 요청 (Authorization 헤더 없음)

**예상 결과:**
- Status Code: 401 Unauthorized

---

### TC-AUTH-006: 로그아웃 실패 - 잘못된 토큰

**설명:** 유효하지 않은 JWT 토큰으로 로그아웃 시도

**전제조건:** 서버가 실행 중이어야 함

**테스트 단계:**
1. POST /api/logout 요청
2. Authorization Header: `Bearer invalid_token_12345`

**예상 결과:**
- Status Code: 401 Unauthorized

---

## 2. 회의실 예약 (Meeting Room Booking) 테스트 케이스

### TC-MR-001: 회의실 예약 실패 - 동반자 없음

**설명:** 동반자 없이 회의실 예약 시도 (회의실 예약은 최소 1명 이상의 동반자가 필요함)

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 회의실이 데이터베이스에 등록되어 있어야 함

**테스트 단계:**
1. POST /api/meeting-rooms/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "room_number": 1,
  "date": "2024-12-25",
  "start_time": "10:00:00",
  "end_time": "11:00:00",
  "companions": []
}
```

**예상 결과:**
- Status Code: 400 Bad Request 또는 409 Conflict
- Response Body: `{"detail": "At least one companion is required for meeting room booking."}` 또는 유사한 에러 메시지

---

### TC-MR-002: 회의실 예약 성공 - 동반자 포함

**설명:** 동반자와 함께 회의실 예약

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 회의실이 데이터베이스에 등록되어 있어야 함
- 동반자 사용자들이 데이터베이스에 등록되어 있어야 함
- 해당 시간대에 회의실이 비어있어야 함

**테스트 단계:**
1. POST /api/meeting-rooms/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "room_number": 1,
  "date": "2024-12-25",
  "start_time": "10:00:00",
  "end_time": "11:00:00",
  "companions": [
    {"student_id": "202012178", "name": "강동현"}
  ]
}
```

**예상 결과:**
- Status Code: 201 Created
- Response Body의 participants에 예약자와 동반자가 모두 포함되어야 함

---

### TC-MR-003: 회의실 예약 실패 - 이미 예약된 시간

**설명:** 이미 예약된 회의실의 동일 시간대에 예약 시도

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 해당 회의실이 이미 해당 시간대에 예약되어 있어야 함

**테스트 단계:**
1. POST /api/meeting-rooms/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "room_number": 1,
  "date": "2024-12-25",
  "start_time": "10:00:00",
  "end_time": "11:00:00",
  "companions": []
}
```

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "Meeting room already booked."}`

---

### TC-MR-004: 회의실 예약 실패 - 잘못된 시간 범위

**설명:** 시작 시간이 종료 시간보다 늦거나 같은 경우

**전제조건:** 유효한 JWT 토큰이 있어야 함

**테스트 단계:**
1. POST /api/meeting-rooms/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "room_number": 1,
  "date": "2024-12-25",
  "start_time": "11:00:00",
  "end_time": "10:00:00",
  "companions": []
}
```

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "Invalid time range."}`

---

### TC-MR-005: 회의실 예약 실패 - 존재하지 않는 회의실

**설명:** 존재하지 않는 회의실 번호로 예약 시도

**전제조건:** 유효한 JWT 토큰이 있어야 함

**테스트 단계:**
1. POST /api/meeting-rooms/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "room_number": 999,
  "date": "2024-12-25",
  "start_time": "10:00:00",
  "end_time": "11:00:00",
  "companions": []
}
```

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "Meeting room not available."}`

---

### TC-MR-006: 회의실 예약 실패 - 예약자가 동반자 목록에 포함됨

**설명:** 예약자 본인이 동반자 목록에 포함된 경우

**전제조건:** 유효한 JWT 토큰이 있어야 함

**테스트 단계:**
1. POST /api/meeting-rooms/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "room_number": 1,
  "date": "2024-12-25",
  "start_time": "10:00:00",
  "end_time": "11:00:00",
  "companions": [
    {"student_id": "{현재_사용자_학번}", "name": "사용자이름"}
  ]
}
```

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "Host cannot be a companion."}`

---

### TC-MR-007: 회의실 예약 실패 - 중복된 동반자

**설명:** 동반자 목록에 동일한 학번이 중복된 경우

**전제조건:** 유효한 JWT 토큰이 있어야 함

**테스트 단계:**
1. POST /api/meeting-rooms/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "room_number": 1,
  "date": "2024-12-25",
  "start_time": "10:00:00",
  "end_time": "11:00:00",
  "companions": [
    {"student_id": "202012178", "name": "강동현"},
    {"student_id": "202012178", "name": "강동현"}
  ]
}
```

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "Duplicate companion detected."}`

---

### TC-MR-008: 회의실 예약 실패 - 존재하지 않는 동반자

**설명:** 데이터베이스에 존재하지 않는 동반자 학번

**전제조건:** 유효한 JWT 토큰이 있어야 함

**테스트 단계:**
1. POST /api/meeting-rooms/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "room_number": 1,
  "date": "2024-12-25",
  "start_time": "10:00:00",
  "end_time": "11:00:00",
  "companions": [
    {"student_id": "202288888", "name": "존재하지않음"}
  ]
}
```

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "Companion not found."}`

---

### TC-MR-009: 회의실 예약 실패 - 동반자 이름 불일치

**설명:** 동반자의 학번은 맞지만 이름이 데이터베이스와 다른 경우

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 동반자 사용자가 데이터베이스에 등록되어 있어야 함

**테스트 단계:**
1. POST /api/meeting-rooms/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "room_number": 1,
  "date": "2024-12-25",
  "start_time": "10:00:00",
  "end_time": "11:00:00",
  "companions": [
    {"student_id": "202012178", "name": "잘못된이름"}
  ]
}
```

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "Companion name mismatch for {student_id}."}`

---

### TC-MR-010: 회의실 예약 실패 - 사용자 시간 중복

**설명:** 사용자가 이미 다른 예약으로 해당 시간대에 예약되어 있는 경우

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 사용자가 이미 다른 예약(회의실 또는 노트북 좌석)으로 해당 시간대에 예약되어 있어야 함

**테스트 단계:**
1. POST /api/meeting-rooms/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "room_number": 1,
  "date": "2024-12-25",
  "start_time": "10:00:00",
  "end_time": "11:00:00",
  "companions": []
}
```

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "User already booked at this time."}`

---

### TC-MR-011: 회의실 예약 실패 - 일일 제한 초과

**설명:** 사용자의 일일 회의실 예약 제한을 초과한 경우

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 사용자의 daily_limit_meeting이 설정되어 있어야 함
- 사용자가 이미 해당 일자에 제한 횟수만큼 예약했어야 함

**테스트 단계:**
1. POST /api/meeting-rooms/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "room_number": 1,
  "date": "2024-12-25",
  "start_time": "14:00:00",
  "end_time": "15:00:00",
  "companions": []
}
```

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "Daily meeting room limit exceeded."}`

---

### TC-MR-012: 회의실 예약 실패 - 주간 제한 초과

**설명:** 사용자의 주간 회의실 예약 제한을 초과한 경우

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 사용자의 weekly_limit_meeting이 설정되어 있어야 함
- 사용자가 이미 해당 주에 제한 횟수만큼 예약했어야 함

**테스트 단계:**
1. POST /api/meeting-rooms/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "room_number": 1,
  "date": "2024-12-25",
  "start_time": "14:00:00",
  "end_time": "15:00:00",
  "companions": []
}
```

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "Weekly meeting room limit exceeded."}`

---

## 3. 노트북 좌석 예약 (Laptop Seat Booking) 테스트 케이스

### TC-LS-001: 노트북 좌석 예약 성공 - 좌석 지정

**설명:** 특정 좌석 번호를 지정하여 노트북 좌석 예약

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 노트북 좌석이 데이터베이스에 등록되어 있어야 함
- 해당 시간대에 좌석이 비어있어야 함

**테스트 단계:**
1. POST /api/laptop-seats/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "seat_number": 37,
  "date": "2024-12-25",
  "start_time": "10:00:00",
  "end_time": "12:00:00"
}
```

**예상 결과:**
- Status Code: 201 Created
- Response Body에 booking_id, facility_id, seat_number, start_time, end_time 포함

---

### TC-LS-002: 노트북 좌석 예약 성공 - 랜덤 좌석

**설명:** 사용 가능한 좌석 중 랜덤으로 할당받아 예약

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 사용 가능한 노트북 좌석이 최소 1개 이상 있어야 함
- 해당 시간대에 사용 가능한 좌석이 있어야 함

**테스트 단계:**
1. POST /api/laptop-seats/bookings/random 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "date": "2024-12-25",
  "start_time": "10:00:00",
  "end_time": "12:00:00"
}
```

**예상 결과:**
- Status Code: 201 Created
- Response Body에 booking_id, facility_id, seat_number, start_time, end_time 포함
- seat_number가 할당된 좌석 번호여야 함

---

### TC-LS-003: 노트북 좌석 예약 실패 - 이미 예약된 좌석

**설명:** 이미 예약된 좌석의 동일 시간대에 예약 시도

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 해당 좌석이 이미 해당 시간대에 예약되어 있어야 함

**테스트 단계:**
1. POST /api/laptop-seats/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "seat_number": 37,
  "date": "2024-12-25",
  "start_time": "10:00:00",
  "end_time": "12:00:00"
}
```

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "Seat already booked for this time."}`

---

### TC-LS-004: 노트북 좌석 예약 실패 - 존재하지 않는 좌석

**설명:** 존재하지 않는 좌석 번호로 예약 시도

**전제조건:** 유효한 JWT 토큰이 있어야 함

**테스트 단계:**
1. POST /api/laptop-seats/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "seat_number": 999,
  "date": "2024-12-25",
  "start_time": "10:00:00",
  "end_time": "12:00:00"
}
```

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "Seat not available."}`

---

### TC-LS-005: 노트북 좌석 예약 실패 - 잘못된 시간 범위

**설명:** 시작 시간이 종료 시간보다 늦거나 같은 경우

**전제조건:** 유효한 JWT 토큰이 있어야 함

**테스트 단계:**
1. POST /api/laptop-seats/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "seat_number": 37,
  "date": "2024-12-25",
  "start_time": "12:00:00",
  "end_time": "10:00:00"
}
```

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "Invalid time range."}`

---

### TC-LS-006: 노트북 좌석 예약 실패 - 사용자 시간 중복

**설명:** 사용자가 이미 다른 예약으로 해당 시간대에 예약되어 있는 경우

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 사용자가 이미 다른 예약(회의실 또는 노트북 좌석)으로 해당 시간대에 예약되어 있어야 함

**테스트 단계:**
1. POST /api/laptop-seats/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "seat_number": 37,
  "date": "2024-12-25",
  "start_time": "10:00:00",
  "end_time": "12:00:00"
}
```

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "User has another booking in this slot."}`

---

### TC-LS-007: 노트북 좌석 예약 실패 - 일일 시간 제한 초과

**설명:** 사용자의 일일 노트북 좌석 사용 시간 제한(기본 4시간)을 초과한 경우

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 사용자가 이미 해당 일자에 4시간(또는 daily_limit_laptop)에 가까운 시간을 예약했어야 함
- 새로운 예약을 추가하면 일일 제한을 초과해야 함

**테스트 단계:**
1. POST /api/laptop-seats/bookings 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "seat_number": 37,
  "date": "2024-12-25",
  "start_time": "15:00:00",
  "end_time": "19:00:00"
}
```

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "Daily laptop seat hour limit exceeded."}`

---

### TC-LS-008: 노트북 좌석 랜덤 예약 실패 - 사용 가능한 좌석 없음

**설명:** 해당 시간대에 사용 가능한 좌석이 없는 경우

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 모든 좌석이 해당 시간대에 예약되어 있어야 함

**테스트 단계:**
1. POST /api/laptop-seats/bookings/random 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "date": "2024-12-25",
  "start_time": "10:00:00",
  "end_time": "12:00:00"
}
```

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "No available seat for this time."}`

---

### TC-LS-009: 노트북 좌석 랜덤 예약 실패 - 사용자 시간 중복

**설명:** 사용자가 이미 다른 예약으로 해당 시간대에 예약되어 있는 경우

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 사용자가 이미 다른 예약으로 해당 시간대에 예약되어 있어야 함

**테스트 단계:**
1. POST /api/laptop-seats/bookings/random 요청
2. Authorization Header: `Bearer {access_token}`
3. Request Body:
```json
{
  "date": "2024-12-25",
  "start_time": "10:00:00",
  "end_time": "12:00:00"
}
```

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "User has another booking in this slot."}`

---

## 4. 내 예약 조회 및 취소 (My Bookings) 테스트 케이스

### TC-MB-001: 내 예약 조회 성공 - CONFIRMED 상태

**설명:** 현재 사용자의 확인된 예약 목록 조회

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 사용자가 최소 1개 이상의 CONFIRMED 예약을 가지고 있어야 함

**테스트 단계:**
1. GET /api/my-bookings?status=CONFIRMED 요청
2. Authorization Header: `Bearer {access_token}`

**예상 결과:**
- Status Code: 200 OK
- Response Body는 배열 형태
- 각 항목에 booking_id, resource_type, resource_number, start_time, end_time, status 포함
- status가 모두 "CONFIRMED"여야 함
- start_time 기준 내림차순 정렬되어야 함

---

### TC-MB-002: 내 예약 조회 성공 - CANCELED 상태

**설명:** 현재 사용자의 취소된 예약 목록 조회

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 사용자가 최소 1개 이상의 CANCELED 예약을 가지고 있어야 함

**테스트 단계:**
1. GET /api/my-bookings?status=CANCELED 요청
2. Authorization Header: `Bearer {access_token}`

**예상 결과:**
- Status Code: 200 OK
- Response Body는 배열 형태
- 각 항목의 status가 모두 "CANCELED"여야 함

---

### TC-MB-003: 내 예약 조회 성공 - 빈 목록

**설명:** 해당 상태의 예약이 없는 경우

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 사용자가 해당 상태의 예약을 가지고 있지 않아야 함

**테스트 단계:**
1. GET /api/my-bookings?status=CONFIRMED 요청
2. Authorization Header: `Bearer {access_token}`

**예상 결과:**
- Status Code: 200 OK
- Response Body: `[]`

---

### TC-MB-004: 내 예약 조회 실패 - 토큰 없음

**설명:** Authorization 헤더 없이 내 예약 조회 시도

**전제조건:** 서버가 실행 중이어야 함

**테스트 단계:**
1. GET /api/my-bookings?status=CONFIRMED 요청 (Authorization 헤더 없음)

**예상 결과:**
- Status Code: 401 Unauthorized

---

### TC-MB-005: 예약 취소 성공

**설명:** 예약 시작 시간 2시간 이상 전에 예약 취소

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 사용자가 CONFIRMED 상태의 예약을 가지고 있어야 함
- 예약 시작 시간이 현재 시간 + 2시간 이후여야 함

**테스트 단계:**
1. DELETE /api/my-bookings/{booking_id} 요청
2. Authorization Header: `Bearer {access_token}`

**예상 결과:**
- Status Code: 200 OK
- 예약 상태가 CANCELED로 변경되어야 함

---

### TC-MB-006: 예약 취소 실패 - 존재하지 않는 예약

**설명:** 존재하지 않는 예약 ID로 취소 시도

**전제조건:** 유효한 JWT 토큰이 있어야 함

**테스트 단계:**
1. DELETE /api/my-bookings/999999 요청
2. Authorization Header: `Bearer {access_token}`

**예상 결과:**
- Status Code: 404 Not Found
- Response Body: `{"detail": "Booking not found."}`

---

### TC-MB-007: 예약 취소 실패 - 다른 사용자의 예약

**설명:** 다른 사용자의 예약을 취소하려고 시도

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 다른 사용자의 예약 ID를 알아야 함

**테스트 단계:**
1. DELETE /api/my-bookings/{다른_사용자의_booking_id} 요청
2. Authorization Header: `Bearer {access_token}`

**예상 결과:**
- Status Code: 404 Not Found
- Response Body: `{"detail": "Booking not found."}`

---

### TC-MB-008: 예약 취소 실패 - 이미 취소된 예약

**설명:** 이미 CANCELED 상태인 예약을 취소하려고 시도

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 사용자가 CANCELED 상태의 예약을 가지고 있어야 함

**테스트 단계:**
1. DELETE /api/my-bookings/{canceled_booking_id} 요청
2. Authorization Header: `Bearer {access_token}`

**예상 결과:**
- Status Code: 400 Bad Request
- Response Body: `{"detail": "Only confirmed bookings can be canceled."}`

---

### TC-MB-009: 예약 취소 실패 - 2시간 이내

**설명:** 예약 시작 시간 2시간 이내에 취소 시도

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 사용자가 CONFIRMED 상태의 예약을 가지고 있어야 함
- 예약 시작 시간이 현재 시간 + 2시간 이내여야 함

**테스트 단계:**
1. DELETE /api/my-bookings/{booking_id} 요청
2. Authorization Header: `Bearer {access_token}`

**예상 결과:**
- Status Code: 400 Bad Request
- Response Body: `{"detail": "Cannot cancel within 2 hours of start."}`

---

## 5. 오버뷰 (Overview) 테스트 케이스

### TC-OV-001: 오버뷰 조회 성공

**설명:** 특정 날짜의 회의실 및 노트북 좌석 실시간 상태 조회

**전제조건:**
- 서버가 실행 중이어야 함
- 회의실과 노트북 좌석이 데이터베이스에 등록되어 있어야 함

**테스트 단계:**
1. GET /api/overview?date=2024-12-25 요청

**예상 결과:**
- Status Code: 200 OK
- Response Body에 date, checked_at, meeting_rooms, laptop_seats 포함
- meeting_rooms는 배열이며 각 항목에 room_number, status 포함
- laptop_seats는 배열이며 각 항목에 seat_number, status 포함
- status는 "AVAILABLE" 또는 "BOOKED"여야 함
- meeting_rooms와 laptop_seats는 resource_number 기준 오름차순 정렬되어야 함

---

### TC-OV-002: 오버뷰 조회 성공 - 모든 좌석 사용 가능

**설명:** 해당 시간대에 예약이 없는 경우

**전제조건:**
- 서버가 실행 중이어야 함
- 해당 날짜/시간에 예약이 없어야 함

**테스트 단계:**
1. GET /api/overview?date=2024-12-25 요청

**예상 결과:**
- Status Code: 200 OK
- 모든 meeting_rooms와 laptop_seats의 status가 "AVAILABLE"이어야 함

---

### TC-OV-003: 오버뷰 조회 성공 - 일부 좌석 예약됨

**설명:** 일부 좌석만 예약된 경우

**전제조건:**
- 서버가 실행 중이어야 함
- 일부 좌석이 해당 시간대에 예약되어 있어야 함

**테스트 단계:**
1. GET /api/overview?date=2024-12-25 요청

**예상 결과:**
- Status Code: 200 OK
- 예약된 좌석의 status는 "BOOKED"
- 예약되지 않은 좌석의 status는 "AVAILABLE"

---

### TC-OV-004: 오버뷰 조회 실패 - 날짜 파라미터 누락

**설명:** 필수 쿼리 파라미터인 date가 없는 경우

**전제조건:** 서버가 실행 중이어야 함

**테스트 단계:**
1. GET /api/overview 요청 (date 파라미터 없음)

**예상 결과:**
- Status Code: 422 Unprocessable Entity (FastAPI validation error)

---

### TC-OV-005: 오버뷰 조회 실패 - 잘못된 날짜 형식

**설명:** 날짜 형식이 올바르지 않은 경우

**전제조건:** 서버가 실행 중이어야 함

**테스트 단계:**
1. GET /api/overview?date=invalid-date 요청

**예상 결과:**
- Status Code: 422 Unprocessable Entity (FastAPI validation error)

---

## 6. 통합 테스트 케이스

### TC-INT-001: 전체 예약 플로우 테스트

**설명:** 로그인 → 오버뷰 조회 → 예약 생성 → 내 예약 조회 → 예약 취소의 전체 플로우

**전제조건:**
- 서버가 실행 중이어야 함
- 테스트용 사용자와 시설이 데이터베이스에 등록되어 있어야 함

**테스트 단계:**
1. POST /api/login으로 로그인하여 토큰 획득
2. GET /api/overview?date={날짜}로 사용 가능한 시설 확인
3. POST /api/meeting-rooms/bookings 또는 POST /api/laptop-seats/bookings로 예약 생성
4. GET /api/my-bookings?status=CONFIRMED로 예약 확인
5. DELETE /api/my-bookings/{booking_id}로 예약 취소
6. GET /api/my-bookings?status=CANCELED로 취소 확인

**예상 결과:**
- 각 단계가 순차적으로 성공해야 함
- 최종적으로 예약이 CANCELED 상태로 변경되어야 함

---

### TC-INT-002: 동시 예약 충돌 테스트

**설명:** 두 사용자가 동일한 시설의 동일 시간대에 동시에 예약을 시도하는 경우

**전제조건:**
- 서버가 실행 중이어야 함
- 두 명의 테스트용 사용자가 있어야 함

**테스트 단계:**
1. 사용자 A로 로그인하여 토큰 A 획득
2. 사용자 B로 로그인하여 토큰 B 획득
3. 사용자 A와 B가 동시에 동일한 시설의 동일 시간대에 예약 시도

**예상 결과:**
- 한 명의 예약은 성공 (201 Created)
- 다른 한 명의 예약은 실패 (409 Conflict, "already booked" 메시지)

---

### TC-INT-003: 일일 제한 테스트

**설명:** 사용자가 일일 제한에 도달한 후 추가 예약 시도

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 사용자의 일일 제한이 설정되어 있어야 함
- 사용자가 이미 제한에 도달했어야 함

**테스트 단계:**
1. GET /api/my-bookings?status=CONFIRMED로 현재 예약 확인
2. 추가 예약 시도

**예상 결과:**
- Status Code: 409 Conflict
- 적절한 제한 초과 메시지 반환

---

## 7. 엣지 케이스 및 경계값 테스트

### TC-EDGE-001: 시간 경계값 테스트 - 정확히 2시간 전 취소

**설명:** 예약 시작 시간 정확히 2시간 전에 취소 시도

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 예약 시작 시간이 현재 시간 + 정확히 2시간이어야 함

**테스트 단계:**
1. DELETE /api/my-bookings/{booking_id} 요청
2. Authorization Header: `Bearer {access_token}`

**예상 결과:**
- Status Code: 400 Bad Request (2시간 이내로 간주되어야 함)
- 또는 200 OK (2시간 이상으로 간주되는 경우 구현에 따라 다름)

---

### TC-EDGE-002: 시간 경계값 테스트 - 시작 시간 = 종료 시간

**설명:** 시작 시간과 종료 시간이 동일한 경우

**전제조건:** 유효한 JWT 토큰이 있어야 함

**테스트 단계:**
1. POST /api/meeting-rooms/bookings 또는 POST /api/laptop-seats/bookings 요청
2. Request Body에서 start_time과 end_time을 동일하게 설정

**예상 결과:**
- Status Code: 409 Conflict
- Response Body: `{"detail": "Invalid time range."}`

---

### TC-EDGE-003: 날짜 경계값 테스트 - 과거 날짜

**설명:** 과거 날짜로 예약 시도

**전제조건:** 유효한 JWT 토큰이 있어야 함

**테스트 단계:**
1. POST /api/meeting-rooms/bookings 요청
2. Request Body의 date를 과거 날짜로 설정

**예상 결과:**
- 구현에 따라 다를 수 있음 (과거 날짜 허용 여부에 따라)
- 일반적으로 400 Bad Request 또는 409 Conflict 예상

---

### TC-EDGE-004: 대용량 동반자 목록 테스트

**설명:** 많은 수의 동반자를 포함한 회의실 예약

**전제조건:**
- 유효한 JWT 토큰이 있어야 함
- 충분한 수의 동반자 사용자가 데이터베이스에 등록되어 있어야 함

**테스트 단계:**
1. POST /api/meeting-rooms/bookings 요청
2. Request Body의 companions 배열에 많은 수의 동반자 포함

**예상 결과:**
- 구현에 따라 다를 수 있음
- 성공 시 모든 동반자가 participants에 포함되어야 함

---

## 테스트 실행 시 고려사항

### 1. 테스트 데이터 준비
- 각 테스트 전에 필요한 테스트 데이터를 준비해야 함
- 테스트 간 데이터 격리를 위해 각 테스트 후 정리 작업 필요

### 2. 토큰 관리
- 각 인증이 필요한 테스트에서 유효한 JWT 토큰을 사용해야 함
- 토큰 만료 시간을 고려하여 필요시 재발급

### 3. 시간 의존성
- 예약 취소 테스트 등 시간에 의존하는 테스트는 현재 시간을 고려해야 함
- 필요시 모킹 또는 시간 조작 기능 활용

### 4. 동시성 테스트
- 동시 예약 충돌 테스트는 실제 동시 요청을 시뮬레이션해야 함

### 5. 데이터베이스 상태
- 각 테스트는 독립적으로 실행 가능해야 함
- 테스트 실행 순서에 의존하지 않도록 설계

### 6. 에러 메시지 검증
- 각 실패 케이스에서 반환되는 에러 메시지가 명세와 일치하는지 확인

### 7. 응답 스키마 검증
- 성공 케이스에서 반환되는 응답이 스키마와 일치하는지 확인
- 필수 필드가 모두 포함되어 있는지 확인

---

## 테스트 우선순위

### 높음 (High Priority)
- TC-AUTH-001, TC-AUTH-002, TC-AUTH-003 (로그인 기본 기능)
- TC-MR-001, TC-MR-003 (회의실 예약 기본 기능)
- TC-LS-001, TC-LS-003 (노트북 좌석 예약 기본 기능)
- TC-MB-001, TC-MB-005 (내 예약 조회 및 취소 기본 기능)
- TC-OV-001 (오버뷰 조회 기본 기능)

### 중간 (Medium Priority)
- TC-MR-002, TC-MR-006~TC-MR-009 (회의실 예약 검증 로직)
- TC-LS-002, TC-LS-007 (노트북 좌석 예약 제한)
- TC-MB-006~TC-MB-009 (예약 취소 에러 케이스)
- TC-INT-001 (통합 플로우)

### 낮음 (Low Priority)
- TC-MR-010~TC-MR-012 (회의실 예약 제한)
- TC-LS-008, TC-LS-009 (노트북 좌석 랜덤 예약 에러)
- TC-EDGE-001~TC-EDGE-004 (엣지 케이스)
- TC-INT-002, TC-INT-003 (고급 통합 테스트)
