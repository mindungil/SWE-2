// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * 인증 (Authentication) 테스트 케이스
 * TC-AUTH-001 ~ TC-AUTH-006
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';

test.describe('인증 테스트', () => {
  test('TC-AUTH-001: 로그인 성공', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/login`, {
      data: {
        student_id: '202519198',
        birth: '2006-05-22',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('access_token');
    expect(body).toHaveProperty('token_type', 'bearer');
  });

  test('TC-AUTH-002: 로그인 실패 - 잘못된 학번', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/login`, {
      data: {
        student_id: '202099999',
        birth: '2000-01-01',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('detail', 'Invalid student_id or birth.');
  });

  test('TC-AUTH-003: 로그인 실패 - 잘못된 생년월일', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/login`, {
      data: {
        student_id: '202519198',
        birth: '2000-01-01',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('detail', 'Invalid student_id or birth.');
  });

  test('TC-AUTH-004: 로그아웃 성공', async ({ request }) => {
    // 먼저 로그인하여 토큰 획득
    const loginResponse = await request.post(`${BASE_URL}/api/login`, {
      data: {
        student_id: '202519198',
        birth: '2006-05-22',
      },
    });

    expect(loginResponse.status()).toBe(200);
    const loginBody = await loginResponse.json();
    const accessToken = loginBody.access_token;

    // 로그아웃 요청
    const response = await request.post(`${BASE_URL}/api/logout`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('logged out');
  });

  test('TC-AUTH-005: 로그아웃 실패 - 토큰 없음', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/logout`);

    expect(response.status()).toBe(403);
  });

  test('TC-AUTH-006: 로그아웃 실패 - 잘못된 토큰', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/logout`, {
      headers: {
        Authorization: 'Bearer invalid_token_12345',
      },
    });

    expect(response.status()).toBe(401);
  });
});
