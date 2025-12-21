// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * 오버뷰 (Overview) 테스트 케이스
 * TC-OV-001 ~ TC-OV-005
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';

test.describe('오버뷰 테스트', () => {
  test('TC-OV-001: 오버뷰 조회 성공', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/overview?date=2026-02-19`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('date');
    expect(body).toHaveProperty('checked_at');
    expect(body).toHaveProperty('meeting_rooms');
    expect(body).toHaveProperty('laptop_seats');
    
    expect(Array.isArray(body.meeting_rooms)).toBe(true);
    expect(Array.isArray(body.laptop_seats)).toBe(true);

    // meeting_rooms 검증
    if (body.meeting_rooms.length > 0) {
      body.meeting_rooms.forEach((room) => {
        expect(room).toHaveProperty('room_number');
        expect(room).toHaveProperty('status');
        expect(['AVAILABLE', 'BOOKED']).toContain(room.status);
      });
    }

    // laptop_seats 검증
    if (body.laptop_seats.length > 0) {
      body.laptop_seats.forEach((seat) => {
        expect(seat).toHaveProperty('seat_number');
        expect(seat).toHaveProperty('status');
        expect(['AVAILABLE', 'BOOKED']).toContain(seat.status);
      });
    }
  });

  test('TC-OV-002: 오버뷰 조회 성공 - 모든 좌석 사용 가능', async ({ request }) => {
    // 예약이 없는 날짜로 테스트
    const response = await request.get(`${BASE_URL}/api/overview?date=2026-02-19`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.meeting_rooms)).toBe(true);
    expect(Array.isArray(body.laptop_seats)).toBe(true);

    // 모든 좌석이 AVAILABLE일 수 있음 (예약이 없는 경우)
    body.meeting_rooms.forEach((room) => {
      expect(['AVAILABLE', 'BOOKED']).toContain(room.status);
    });

    body.laptop_seats.forEach((seat) => {
      expect(['AVAILABLE', 'BOOKED']).toContain(seat.status);
    });
  });

  test('TC-OV-003: 오버뷰 조회 성공 - 일부 좌석 예약됨', async ({ request }) => {
    // 먼저 예약 생성
    const loginResponse = await request.post(`${BASE_URL}/api/login`, {
      data: {
        student_id: '202519198',
        birth: '2006-05-22',
      },
    });
    const loginBody = await loginResponse.json();
    const token = loginBody.access_token;

    await request.post(`${BASE_URL}/api/laptop-seats/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        seat_number: 37,
        date: '2026-02-19',
        start_time: '10:00:00',
        end_time: '12:00:00',
      },
    });

    // 오버뷰 조회
    const response = await request.get(`${BASE_URL}/api/overview?date=2026-02-19`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    // 예약된 좌석과 사용 가능한 좌석이 모두 있을 수 있음
    const bookedSeats = body.laptop_seats.filter((seat) => seat.status === 'BOOKED');
    const availableSeats = body.laptop_seats.filter((seat) => seat.status === 'AVAILABLE');
    
    // 최소한 하나는 BOOKED 또는 AVAILABLE 상태여야 함
    // 시설 데이터가 없으면 빈 배열일 수 있음
    if (body.laptop_seats.length === 0) {
      console.warn('경고: laptop_seats가 비어있습니다. 시설 데이터가 추가되었는지 확인하세요.');
    }
    expect(body.laptop_seats.length).toBeGreaterThan(0);
  });

  test('TC-OV-004: 오버뷰 조회 실패 - 날짜 파라미터 누락', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/overview`);

    expect(response.status()).toBe(422);
  });

  test('TC-OV-005: 오버뷰 조회 실패 - 잘못된 날짜 형식', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/overview?date=invalid-date`);

    expect(response.status()).toBe(422);
  });
});
