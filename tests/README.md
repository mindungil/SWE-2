# Playwright 테스트 스위트

이 디렉토리는 SWE-2 시설 예약 시스템의 Playwright API 테스트를 포함합니다.

## 설치

```bash
npm install
```

또는

```bash
yarn install
```

## 사전 요구사항

1. **서버 실행**: 테스트를 실행하기 전에 서버가 실행 중이어야 합니다.

```bash
cd ../server
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

서버는 기본적으로 `http://localhost:8000`에서 실행됩니다.

2. **데이터베이스 설정**: 테스트를 실행하기 전에 데이터베이스가 초기화되어 있어야 합니다.

```bash
cd ../server
alembic upgrade head
# 필요시 insert_users.sql 실행
```

## 테스트 실행

### 모든 테스트 실행

```bash
npm test
```

### 특정 테스트 그룹 실행

```bash
# 인증 테스트
npm run test:auth

# 회의실 예약 테스트
npm run test:meeting-rooms

# 노트북 좌석 예약 테스트
npm run test:laptop-seats

# 내 예약 조회 및 취소 테스트
npm run test:my-bookings

# 오버뷰 테스트
npm run test:overview

# 통합 테스트
npm run test:integration

# 엣지 케이스 테스트
npm run test:edge
```

### UI 모드로 실행

```bash
npm run test:ui
```

### 디버그 모드

```bash
npm run test:debug
```

### 헤드 모드 (브라우저 표시)

```bash
npm run test:headed
```

## 환경 변수

`BASE_URL` 환경 변수를 설정하여 서버 URL을 변경할 수 있습니다:

```bash
BASE_URL=http://localhost:8000 npm test
```

또는 `.env` 파일을 생성하여 설정할 수 있습니다.

## 테스트 구조

- `auth.spec.js`: 인증 테스트 (TC-AUTH-001 ~ TC-AUTH-006)
- `meeting_rooms.spec.js`: 회의실 예약 테스트 (TC-MR-001 ~ TC-MR-012)
- `laptop_seats.spec.js`: 노트북 좌석 예약 테스트 (TC-LS-001 ~ TC-LS-009)
- `my_bookings.spec.js`: 내 예약 조회 및 취소 테스트 (TC-MB-001 ~ TC-MB-009)
- `overview.spec.js`: 오버뷰 테스트 (TC-OV-001 ~ TC-OV-005)
- `integration.spec.js`: 통합 테스트 (TC-INT-001 ~ TC-INT-003)
- `edge_cases.spec.js`: 엣지 케이스 테스트 (TC-EDGE-001 ~ TC-EDGE-004)

## 테스트 리포트

테스트 실행 후 리포트를 확인하려면:

```bash
npm run report
```

## 주의사항

1. **테스트 데이터**: 일부 테스트는 특정 테스트 데이터가 필요할 수 있습니다. 테스트 실행 전에 데이터베이스 상태를 확인하세요.

2. **시간 의존성**: 일부 테스트(예: 예약 취소)는 시간에 의존합니다. 테스트가 실패하는 경우 시간 설정을 확인하세요.

3. **동시성**: 동시 예약 충돌 테스트는 실제 동시 요청을 시뮬레이션합니다.

4. **독립성**: 각 테스트는 독립적으로 실행 가능해야 하지만, 일부 테스트는 이전 테스트의 결과에 의존할 수 있습니다.

## 문제 해결

### 테스트가 실패하는 경우

1. 서버가 실행 중인지 확인
2. 데이터베이스가 올바르게 초기화되었는지 확인
3. 테스트 데이터가 올바른지 확인
4. 네트워크 연결 확인

### 포트 충돌

서버가 다른 포트에서 실행되는 경우 `BASE_URL` 환경 변수를 설정하세요:

```bash
BASE_URL=http://localhost:3000 npm test
```

## 참고

- [Playwright 공식 문서](https://playwright.dev/)
- [test_cases.md](./test_cases.md) - 상세한 테스트 케이스 명세
