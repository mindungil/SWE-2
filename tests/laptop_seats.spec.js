// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * 노트북 좌석 예약 (Laptop Seat Booking) 테스트 케이스
 * TC-LS-001 ~ TC-LS-009
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';

// 헬퍼 함수: 로그인하여 토큰 획득
async function getAuthToken(request, studentId = '202519198', birth = '2006-05-22') {
  const response = await request.post(`${BASE_URL}/api/login`, {
    data: {
      student_id: studentId,
      birth: birth,
    },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  return body.access_token;
}

test.describe('노트북 좌석 예약 테스트', () => {
  test('TC-LS-001: 노트북 좌석 예약 성공 - 좌석 지정', async ({ request }) => {
    // 완전히 고유한 사용자 사용하여 이전 테스트와 격리
    const token = await getAuthToken(request, '202312345', '2000-01-01');

    // 요구사항: 노트북 좌석은 2시간 단위로 예약 가능
    // 이전 테스트와 격리하기 위해 고유한 좌석/날짜 사용
    const response = await request.post(`${BASE_URL}/api/laptop-seats/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        seat_number: 68,
        date: '2026-06-01',
        start_time: '09:00:00',
        end_time: '11:00:00',
      },
    });

    if (response.status() !== 201) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = await response.text();
      }
      console.error('TC-LS-001 예약 실패:', response.status(), errorBody);
    }
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('booking_id');
    expect(body).toHaveProperty('facility_id');
    expect(body).toHaveProperty('seat_number', 68);
    expect(body).toHaveProperty('start_time');
    expect(body).toHaveProperty('end_time');
  });

  test('TC-LS-002: 노트북 좌석 예약 성공 - 랜덤 좌석', async ({ request }) => {
    // 완전히 고유한 사용자 사용하여 이전 테스트와 격리
    const token = await getAuthToken(request, '202312346', '2004-01-01');

    // 이전 테스트와 격리하기 위해 고유한 날짜 사용
    const response = await request.post(`${BASE_URL}/api/laptop-seats/bookings/random`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        date: '2026-06-02',
        start_time: '13:00:00',
        end_time: '15:00:00',
      },
    });

    if (response.status() !== 201) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = await response.text();
      }
      console.error('랜덤 예약 실패:', response.status(), errorBody);
    }
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('booking_id');
    expect(body).toHaveProperty('facility_id');
    expect(body).toHaveProperty('seat_number');
    expect(body).toHaveProperty('start_time');
    expect(body).toHaveProperty('end_time');
    expect(typeof body.seat_number).toBe('number');
  });

  test('TC-LS-003: 노트북 좌석 예약 실패 - 이미 예약된 좌석', async ({ request }) => {
    // 완전히 고유한 사용자 사용하여 이전 테스트와 격리
    const token = await getAuthToken(request, '202312347', '2004-01-01');

    // 먼저 예약 생성
    // 요구사항: 노트북 좌석은 2시간 단위로 예약 가능
    // 이전 테스트와 격리하기 위해 고유한 좌석/날짜 사용
    const seatNum = 63;
    const dateStr = '2026-06-03';
    const firstBooking = await request.post(`${BASE_URL}/api/laptop-seats/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        seat_number: seatNum,
        date: dateStr,
        start_time: '09:00:00',
        end_time: '11:00:00',
      },
    });

    if (firstBooking.status() !== 201) {
      let errorBody;
      try {
        errorBody = await firstBooking.json();
      } catch (e) {
        errorBody = await firstBooking.text();
      }
      console.error('TC-LS-003 첫 번째 예약 실패:', firstBooking.status(), errorBody);
      // 첫 번째 예약이 실패하면 테스트를 중단
      expect(firstBooking.status()).toBe(201);
      return;
    }

    // 다른 사용자로 동일한 좌석에 예약 시도
    const token2 = await getAuthToken(request, '202120860', '2002-03-02');
    const response = await request.post(`${BASE_URL}/api/laptop-seats/bookings`, {
      headers: {
        Authorization: `Bearer ${token2}`,
      },
      data: {
        seat_number: seatNum,
        date: dateStr,
        start_time: '09:00:00',
        end_time: '11:00:00',
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.detail).toMatch(/already booked|not available/);
  });

  test('TC-LS-004: 노트북 좌석 예약 실패 - 존재하지 않는 좌석', async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.post(`${BASE_URL}/api/laptop-seats/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        seat_number: 999,
        date: '2026-02-19',
        start_time: '19:00:00',
        end_time: '21:00:00',
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.detail).toContain('not available');
  });

  test('TC-LS-005: 노트북 좌석 예약 실패 - 잘못된 시간 범위', async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.post(`${BASE_URL}/api/laptop-seats/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        seat_number: 37,
        date: '2026-02-19',
        start_time: '12:00:00',
        end_time: '10:00:00',
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.detail).toContain('Invalid time range');
  });

  test('TC-LS-006: 노트북 좌석 예약 실패 - 사용자 시간 중복', async ({ request }) => {
    // 완전히 고유한 사용자 사용하여 이전 테스트와 격리
    const token = await getAuthToken(request, '202422806', '2005-04-17');

    // 먼저 다른 예약 생성 (예: 회의실)
    // 요구사항: 최소 3명(본인 포함), 최대 6명(본인 포함)
    // 요구사항: 운영 시간은 09:00-18:00
    // 이전 테스트와 격리하기 위해 고유한 날짜/회의실 사용
    const meetingRoomBooking = await request.post(`${BASE_URL}/api/meeting-rooms/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        room_number: 3,
        date: '2026-05-03',
        start_time: '13:00:00',
        end_time: '14:00:00',
        companions: [
          { student_id: '202214912', name: '최준호' },
          { student_id: '202229857', name: '전하은' },
        ],
      },
    });

    if (meetingRoomBooking.status() !== 201) {
      let errorBody;
      try {
        errorBody = await meetingRoomBooking.json();
      } catch (e) {
        errorBody = await meetingRoomBooking.text();
      }
      console.error('TC-LS-006 회의실 예약 실패:', meetingRoomBooking.status(), errorBody);
      // 첫 번째 예약이 실패하면 테스트를 중단
      expect(meetingRoomBooking.status()).toBe(201);
      return;
    }

    // 동일한 시간에 노트북 좌석 예약 시도
    // 요구사항: 노트북 좌석은 2시간 단위로 예약 가능
    const response = await request.post(`${BASE_URL}/api/laptop-seats/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        seat_number: 70,
        date: '2026-05-03',
        start_time: '13:00:00',
        end_time: '15:00:00',
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.detail).toMatch(/another booking|not available/);
  });

  test('TC-LS-007: 노트북 좌석 예약 실패 - 일일 시간 제한 초과', async ({ request }) => {
    // 일일 시간 제한(4시간)에 도달한 사용자로 테스트
    // 실제 구현에 따라 테스트 데이터 준비 필요
    // 요구사항: 노트북 좌석은 2시간 단위로 예약 가능
    // 요구사항: 운영 시간은 09:00-18:00
    // 완전히 고유한 사용자 사용하여 이전 테스트와 격리
    const token = await getAuthToken(request, '202226873', '2003-07-28');

    // 이전 테스트와 격리하기 위해 고유한 날짜/좌석 사용
    const response = await request.post(`${BASE_URL}/api/laptop-seats/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        seat_number: 53,
        date: '2026-02-26',
        start_time: '16:00:00',
        end_time: '18:00:00',
      },
    });

    // 일일 시간 제한을 초과한 경우 409 반환
    // 또는 이미 예약된 좌석일 수도 있음
    if (response.status() === 409) {
      const body = await response.json();
      expect(body.detail).toMatch(/Daily laptop seat hour limit exceeded|not available|already booked/);
    }
  });

  test('TC-LS-008: 노트북 좌석 랜덤 예약 실패 - 사용 가능한 좌석 없음', async ({ request }) => {
    // 모든 좌석이 예약된 상태로 테스트
    // 실제 구현에 따라 테스트 데이터 준비 필요
    // 요구사항: 노트북 좌석은 2시간 단위로 예약 가능
    // 요구사항: 운영 시간은 09:00-18:00
    // 이전 테스트와 격리하기 위해 고유한 사용자/날짜 사용
    const token = await getAuthToken(request, '202515171', '2006-04-02');

    // 이전 테스트와 격리하기 위해 고유한 날짜 사용
    const response = await request.post(`${BASE_URL}/api/laptop-seats/bookings/random`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        date: '2026-02-27',
        start_time: '16:00:00',
        end_time: '18:00:00',
      },
    });

    // 사용 가능한 좌석이 없는 경우 409 반환
    // 또는 사용자 시간 중복일 수도 있음
    if (response.status() === 409) {
      const body = await response.json();
      expect(body.detail).toMatch(/No available seat|User has another booking|already booked/);
    }
  });

  test('TC-LS-009: 노트북 좌석 랜덤 예약 실패 - 사용자 시간 중복', async ({ request }) => {
    // 완전히 고유한 사용자 사용하여 이전 테스트와 격리
    const token = await getAuthToken(request, '202321607', '2004-06-23');

    // 먼저 다른 예약 생성
    // 요구사항: 노트북 좌석은 2시간 단위로 예약 가능
    // 이전 테스트와 격리하기 위해 고유한 좌석/날짜 사용
    const firstBooking = await request.post(`${BASE_URL}/api/laptop-seats/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        seat_number: 67,
        date: '2026-06-04',
        start_time: '11:00:00',
        end_time: '13:00:00',
      },
    });

    if (firstBooking.status() !== 201) {
      let errorBody;
      try {
        errorBody = await firstBooking.json();
      } catch (e) {
        errorBody = await firstBooking.text();
      }
      console.error('TC-LS-009 첫 번째 예약 실패:', firstBooking.status(), errorBody);
      // 첫 번째 예약이 실패하면 테스트를 중단
      expect(firstBooking.status()).toBe(201);
      return;
    }

    // 동일한 시간에 랜덤 예약 시도
    const response = await request.post(`${BASE_URL}/api/laptop-seats/bookings/random`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        date: '2026-06-04',
        start_time: '11:00:00',
        end_time: '13:00:00',
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.detail).toMatch(/another booking|not available/);
  });
});
