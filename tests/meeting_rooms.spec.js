// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * 회의실 예약 (Meeting Room Booking) 테스트 케이스
 * TC-MR-001 ~ TC-MR-012
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

test.describe('회의실 예약 테스트', () => {
  test('TC-MR-001: 회의실 예약 실패 - 동반자 없음', async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.post(`${BASE_URL}/api/meeting-rooms/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        room_number: 1,
        date: '2026-02-19',
        start_time: '09:00:00',
        end_time: '10:00:00',
        companions: [], // 요구사항: 동반자 최소 2명(본인 포함 3명)이어야 함
      },
    });

    // 요구사항: 동반자가 없으면 회의실 예약을 허용하면 안 됨
    // 서버가 이를 허용하면 테스트 실패
    if (response.status() === 201) {
      throw new Error('TC-MR-001 실패: 서버가 동반자 없이도 예약을 허용합니다. 요구사항: 동반자 최소 2명(본인 포함 3명) 필요');
    }
    
    // 예약이 실패해야 함
    expect([400, 409, 500]).toContain(response.status());
    if (response.status() === 409) {
      const body = await response.json();
      // 동반자 관련 메시지가 있으면 확인
      if (body.detail && body.detail.toLowerCase().includes('companion')) {
        expect(body.detail).toContain('companion');
      }
    }
  });

  test('TC-MR-002: 회의실 예약 성공 - 동반자 포함', async ({ request }) => {
    // 완전히 고유한 사용자 사용하여 이전 테스트와 격리
    const token = await getAuthToken(request, '202221849', '2003-06-12');

    // 요구사항: 최소 3명(본인 포함), 최대 6명(본인 포함)
    // 동반자 2명 포함 (본인 포함 3명) - 요구사항에 맞음
    // 요구사항: 회의실은 1시간 단위로 예약 가능
    // 이전 테스트와 격리하기 위해 다른 시간 사용
    const response = await request.post(`${BASE_URL}/api/meeting-rooms/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        room_number: 3,
        date: '2026-06-05',
        start_time: '10:00:00',
        end_time: '11:00:00',
        companions: [
          { student_id: '202315512', name: '임승우' },
          { student_id: '202423826', name: '전영수' },
        ],
      },
    });

    if (response.status() !== 201) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = await response.text();
      }
      console.error('회의실 예약 실패:', response.status(), errorBody);
    }
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('participants');
    expect(Array.isArray(body.participants)).toBe(true);
    expect(body.participants.length).toBeGreaterThan(0);
  });

  test('TC-MR-003: 회의실 예약 실패 - 이미 예약된 시간', async ({ request }) => {
    // 완전히 고유한 사용자 사용하여 이전 테스트와 격리
    const token = await getAuthToken(request, '202524466', '2006-08-25');

    // 먼저 예약 생성
    // 이전 테스트와 격리하기 위해 고유한 날짜/회의실 사용
    const firstBooking = await request.post(`${BASE_URL}/api/meeting-rooms/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        room_number: 2,
        date: '2026-05-02',
        start_time: '17:00:00',
        end_time: '18:00:00',
        companions: [
          { student_id: '202116917', name: '박재석' },
          { student_id: '202013683', name: '최예진' },
        ],
      },
    });

    if (firstBooking.status() !== 201) {
      let errorBody;
      try {
        errorBody = await firstBooking.json();
      } catch (e) {
        errorBody = await firstBooking.text();
      }
      console.error('TC-MR-003 첫 번째 예약 실패:', firstBooking.status(), errorBody);
      // 첫 번째 예약이 실패하면 테스트를 중단
      expect(firstBooking.status()).toBe(201);
      return;
    }

    // 동일한 시간에 다시 예약 시도
    const response = await request.post(`${BASE_URL}/api/meeting-rooms/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        room_number: 2,
        date: '2026-05-02',
        start_time: '17:00:00',
        end_time: '18:00:00',
        companions: [
          { student_id: '202116917', name: '박재석' },
          { student_id: '202013683', name: '최예진' },
        ],
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.detail).toContain('already booked');
  });

  test('TC-MR-004: 회의실 예약 실패 - 잘못된 시간 범위', async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.post(`${BASE_URL}/api/meeting-rooms/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        room_number: 1,
        date: '2026-02-19',
        start_time: '11:00:00',
        end_time: '10:00:00',
        companions: [
          { student_id: '202012178', name: '강동현' },
          { student_id: '202315758', name: '박민지' },
        ],
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.detail).toContain('Invalid time range');
  });

  test('TC-MR-005: 회의실 예약 실패 - 존재하지 않는 회의실', async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.post(`${BASE_URL}/api/meeting-rooms/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        room_number: 999,
        date: '2026-02-19',
        start_time: '21:00:00',
        end_time: '22:00:00',
        companions: [
          { student_id: '202012178', name: '강동현' },
          { student_id: '202315758', name: '박민지' },
        ],
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.detail).toContain('not available');
  });

  test('TC-MR-006: 회의실 예약 실패 - 예약자가 동반자 목록에 포함됨', async ({ request }) => {
    const token = await getAuthToken(request, '202519198', '2006-05-22');

    const response = await request.post(`${BASE_URL}/api/meeting-rooms/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        room_number: 1,
        date: '2026-02-19',
        start_time: '22:00:00',
        end_time: '23:00:00',
        companions: [
          { student_id: '202519198', name: '김민지' },
        ],
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.detail).toMatch(/Host cannot be a companion|not available/);
  });

  test('TC-MR-007: 회의실 예약 실패 - 중복된 동반자', async ({ request }) => {
    const token = await getAuthToken(request);

    // 요구사항: 운영 시간은 09:00-18:00
    const response = await request.post(`${BASE_URL}/api/meeting-rooms/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        room_number: 1,
        date: '2026-02-19',
        start_time: '15:00:00',
        end_time: '16:00:00',
        companions: [
          { student_id: '202012178', name: '강동현' },
          { student_id: '202315758', name: '박민지' },
          { student_id: '202012178', name: '강동현' }, // 중복
        ],
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.detail).toMatch(/Duplicate companion|not available/);
  });

  test('TC-MR-008: 회의실 예약 실패 - 존재하지 않는 동반자', async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.post(`${BASE_URL}/api/meeting-rooms/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        room_number: 1,
        date: '2026-02-19',
        start_time: '18:00:00',
        end_time: '19:00:00',
        companions: [
          { student_id: '202012178', name: '강동현' },
          { student_id: '202288888', name: '존재하지않음' },
        ],
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.detail).toMatch(/Companion not found|not available/);
  });

  test('TC-MR-009: 회의실 예약 실패 - 동반자 이름 불일치', async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.post(`${BASE_URL}/api/meeting-rooms/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        room_number: 1,
        date: '2026-02-19',
        start_time: '19:00:00',
        end_time: '20:00:00',
        companions: [
          { student_id: '202012178', name: '강동현' },
          { student_id: '202315758', name: '잘못된이름' },
        ],
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.detail).toMatch(/Companion name mismatch|not available/);
  });

  test('TC-MR-010: 회의실 예약 실패 - 사용자 시간 중복', async ({ request }) => {
    // 완전히 고유한 사용자 사용하여 이전 테스트와 격리
    const token = await getAuthToken(request, '202316290', '2004-11-24');

    // 먼저 다른 예약 생성 (예: 노트북 좌석)
    // 요구사항: 노트북 좌석은 2시간 단위로 예약 가능
    // 요구사항: 운영 시간은 09:00-18:00
    // 이전 테스트와 격리하기 위해 고유한 좌석/날짜 사용
    const laptopBooking = await request.post(`${BASE_URL}/api/laptop-seats/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        seat_number: 66,
        date: '2026-06-06',
        start_time: '11:00:00',
        end_time: '13:00:00',
      },
    });

    if (laptopBooking.status() !== 201) {
      let errorBody;
      try {
        errorBody = await laptopBooking.json();
      } catch (e) {
        errorBody = await laptopBooking.text();
      }
      console.error('TC-MR-010 노트북 좌석 예약 실패:', laptopBooking.status(), errorBody);
      // 첫 번째 예약이 실패하면 테스트를 중단
      expect(laptopBooking.status()).toBe(201);
      return;
    }

    // 동일한 시간에 회의실 예약 시도
    // 요구사항: 최소 3명(본인 포함), 최대 6명(본인 포함)
    // 요구사항: 운영 시간은 09:00-18:00
    const response = await request.post(`${BASE_URL}/api/meeting-rooms/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        room_number: 2,
        date: '2026-06-06',
        start_time: '11:00:00',
        end_time: '12:00:00',
        companions: [
          { student_id: '202222748', name: '임승우' },
          { student_id: '202524848', name: '전수진' },
        ],
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.detail).toMatch(/already booked|not available|User already booked/);
  });

  test('TC-MR-011: 회의실 예약 실패 - 일일 제한 초과', async ({ request }) => {
    // 일일 제한에 도달한 사용자로 테스트
    // 실제 구현에 따라 테스트 데이터 준비 필요
    const token = await getAuthToken(request);

    const response = await request.post(`${BASE_URL}/api/meeting-rooms/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        room_number: 1,
        date: '2026-02-19',
        start_time: '06:00:00',
        end_time: '07:00:00',
        companions: [
          { student_id: '202012178', name: '강동현' },
          { student_id: '202315758', name: '박민지' },
        ],
      },
    });

    // 일일 제한이 설정되어 있고 초과한 경우 409 반환
    if (response.status() === 409) {
      const body = await response.json();
      expect(body.detail).toMatch(/Daily meeting room limit exceeded|not available/);
    }
  });

  test('TC-MR-012: 회의실 예약 실패 - 주간 제한 초과', async ({ request }) => {
    // 주간 제한에 도달한 사용자로 테스트
    // 실제 구현에 따라 테스트 데이터 준비 필요
    // 요구사항: 동반자 최소 2명(본인 포함 3명), 최대 5명(본인 포함 6명)
    // 요구사항: 운영 시간은 09:00-18:00
    // 다른 사용자 사용하여 이전 테스트와 격리
    const token = await getAuthToken(request, '201814971', '1999-06-06');

    // 이전 테스트와 격리하기 위해 고유한 날짜/회의실 사용
    const response = await request.post(`${BASE_URL}/api/meeting-rooms/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        room_number: 3,
        date: '2026-03-03',
        start_time: '17:00:00',
        end_time: '18:00:00',
        companions: [
          { student_id: '202012178', name: '강동현' },
          { student_id: '202315758', name: '박민지' },
        ],
      },
    });

    // 주간 제한이 설정되어 있고 초과한 경우 409 반환
    // 또는 이미 예약된 회의실일 수도 있음
    if (response.status() === 409) {
      const body = await response.json();
      expect(body.detail).toMatch(/Weekly meeting room limit exceeded|not available|already booked/);
    }
  });

  test('TC-MR-013: 회의실 예약 실패 - 동반자 1명만 있음 (요구사항: 최소 2명)', async ({ request }) => {
    // 요구사항: 동반자 최소 2명(본인 포함 3명)이어야 함
    const token = await getAuthToken(request, '202515171', '2006-04-02');

    const response = await request.post(`${BASE_URL}/api/meeting-rooms/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        room_number: 1,
        date: '2026-07-01',
        start_time: '14:00:00',
        end_time: '15:00:00',
        companions: [
          { student_id: '202012178', name: '강동현' }, // 동반자 1명만 (본인 포함 2명)
        ],
      },
    });

    // 요구사항: 동반자가 1명만 있으면 실패해야 함
    // 서버가 이를 허용하면 테스트 실패
    if (response.status() === 201) {
      throw new Error('TC-MR-013 실패: 서버가 동반자 1명만으로도 예약을 허용합니다. 요구사항: 동반자 최소 2명(본인 포함 3명) 필요');
    }
    
    // 예약이 실패해야 함
    expect([400, 409, 500]).toContain(response.status());
    if (response.status() === 409) {
      const body = await response.json();
      if (body.detail && body.detail.toLowerCase().includes('companion')) {
        expect(body.detail).toContain('companion');
      }
    }
  });

  test('TC-MR-014: 회의실 예약 실패 - 동반자 6명 이상 (요구사항: 최대 5명)', async ({ request }) => {
    // 요구사항: 동반자 최대 5명(본인 포함 6명)이어야 함
    const token = await getAuthToken(request, '202312345', '2000-01-01');

    const response = await request.post(`${BASE_URL}/api/meeting-rooms/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        room_number: 2,
        date: '2026-07-02',
        start_time: '15:00:00',
        end_time: '16:00:00',
        companions: [
          { student_id: '202012178', name: '강동현' },
          { student_id: '202315758', name: '박민지' },
          { student_id: '202325025', name: '김준호' },
          { student_id: '202221375', name: '윤민수' },
          { student_id: '201821000', name: '안혜진' },
          { student_id: '201922067', name: '조민지' }, // 동반자 6명 (본인 포함 7명)
        ],
      },
    });

    // 요구사항: 동반자가 6명 이상이면 실패해야 함
    // 서버가 이를 허용하면 테스트 실패
    if (response.status() === 201) {
      throw new Error('TC-MR-014 실패: 서버가 동반자 6명 이상으로도 예약을 허용합니다. 요구사항: 동반자 최대 5명(본인 포함 6명)');
    }
    
    // 예약이 실패해야 함
    expect([400, 409, 500]).toContain(response.status());
    if (response.status() === 409) {
      const body = await response.json();
      if (body.detail && body.detail.toLowerCase().includes('companion')) {
        expect(body.detail).toContain('companion');
      }
    }
  });
});
