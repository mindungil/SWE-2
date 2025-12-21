# SWE-2 시설 예약 시스템

소프트웨어공학 팀 프로젝트 2조

전북대학교 시설 예약 시스템 (회의실 및 노트북 좌석 예약)

## 프로젝트 구조

```
SWE-2/
├── jbnu-reserve/    # 프론트엔드 (React + TypeScript + Vite)
├── server/          # 백엔드 (FastAPI)
└── tests/           # 테스트 스위트 (Playwright)
```

---

## 프론트엔드 (jbnu-reserve)

React + TypeScript + Vite 기반 프론트엔드 애플리케이션

### 기술 스택

- React
- TypeScript
- Vite
- ESLint

### React Compiler

React Compiler는 개발 및 빌드 성능에 영향을 미치기 때문에 이 템플릿에서는 기본적으로 비활성화되어 있습니다. 추가하려면 [공식 문서](https://react.dev/learn/react-compiler/installation)를 참조하세요.

### ESLint 설정 확장

프로덕션 애플리케이션 개발 시 타입 인식 린트 규칙을 활성화하는 것을 권장합니다:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      tseslint.configs.recommendedTypeChecked,
      // 또는 더 엄격한 규칙
      tseslint.configs.strictTypeChecked,
      // 스타일 규칙 (선택사항)
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

React 전용 린트 규칙을 위해 [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x)와 [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom)을 설치할 수 있습니다.

---

## 백엔드 (server)

FastAPI 기반 REST API 서버

### 설정

```bash
cd server
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

서버는 기본적으로 `http://localhost:8000`에서 실행됩니다.

### 데이터베이스 마이그레이션 (Alembic)

- `.env` 파일을 편집하여 데이터베이스 URL을 변경할 수 있습니다 (기본값: `data/app.db` SQLite)
- 마이그레이션 실행: `alembic upgrade head`
- 새 마이그레이션 생성 (모델 변경 후): `alembic revision --autogenerate -m "설명"`

### API 엔드포인트

#### 인증
- `POST /api/login` – 학생 ID와 생년월일로 로그인, JWT 토큰 반환
  ```json
  {
    "student_id": "202519198",
    "birth": "2006-05-22"
  }
  ```
- `POST /api/logout` – 로그아웃 (Bearer 토큰 필요)

#### 회의실 예약
- `POST /api/meeting-rooms/bookings` – 회의실 예약 생성 (Bearer 토큰 필요)

#### 노트북 좌석 예약
- `POST /api/laptop-seats/bookings` – 노트북 좌석 예약 생성 (일일 4시간 제한, Bearer 토큰 필요)
- `POST /api/laptop-seats/bookings/random` – 사용 가능한 랜덤 좌석으로 예약 생성 (Bearer 토큰 필요)
- `GET /api/laptop_seats` – 특정 시간 범위의 사용 가능한 노트북 좌석 조회 (Bearer 토큰 필요)

#### 예약 관리
- `GET /api/my-bookings?status=CONFIRMED` – 내 예약 목록 조회 (회의실 + 노트북 좌석, 상태별 필터링, Bearer 토큰 필요)
- `DELETE /api/my-bookings/{booking_id}` – 예약 취소 (시작 시간 2시간 전까지만 가능, Bearer 토큰 필요)

#### 오버뷰
- `GET /api/overview?date=YYYY-MM-DD` – 회의실 및 노트북 좌석의 실시간 상태 조회

#### 헬스 체크
- `GET /health` – 서버 상태 확인

#### 예제 API (개발용)
- `GET /items` – 아이템 목록 조회
- `POST /items` – 아이템 생성 (`{ "name": "Widget", "description": "Demo" }`)
- `GET /items/{id}` – 특정 아이템 조회

---

## 테스트 (tests)

Playwright 기반 API 테스트 스위트

### 설치

```bash
cd tests
npm install
```

또는

```bash
yarn install
```

### 사전 요구사항

1. **서버 실행**: 테스트 실행 전에 서버가 실행 중이어야 합니다.

```bash
cd ../server
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

2. **데이터베이스 설정**: 테스트 실행 전에 데이터베이스가 초기화되어 있어야 합니다.

```bash
cd ../server
alembic upgrade head
# 필요시 insert_users.sql 실행
```

### 테스트 실행

#### 모든 테스트 실행
```bash
npm test
```

#### 특정 테스트 그룹 실행
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

#### UI 모드로 실행
```bash
npm run test:ui
```

#### 디버그 모드
```bash
npm run test:debug
```

#### 헤드 모드 (브라우저 표시)
```bash
npm run test:headed
```

### 환경 변수

`BASE_URL` 환경 변수를 설정하여 서버 URL을 변경할 수 있습니다:

```bash
BASE_URL=http://localhost:8000 npm test
```

또는 `.env` 파일을 생성하여 설정할 수 있습니다.

### 테스트 구조

- `auth.spec.js`: 인증 테스트 (TC-AUTH-001 ~ TC-AUTH-006)
- `meeting_rooms.spec.js`: 회의실 예약 테스트 (TC-MR-001 ~ TC-MR-012)
- `laptop_seats.spec.js`: 노트북 좌석 예약 테스트 (TC-LS-001 ~ TC-LS-009)
- `my_bookings.spec.js`: 내 예약 조회 및 취소 테스트 (TC-MB-001 ~ TC-MB-009)
- `overview.spec.js`: 오버뷰 테스트 (TC-OV-001 ~ TC-OV-005)
- `integration.spec.js`: 통합 테스트 (TC-INT-001 ~ TC-INT-003)
- `edge_cases.spec.js`: 엣지 케이스 테스트 (TC-EDGE-001 ~ TC-EDGE-004)

### 테스트 리포트

테스트 실행 후 리포트를 확인하려면:

```bash
npm run report
```

### 주의사항

1. **테스트 데이터**: 일부 테스트는 특정 테스트 데이터가 필요할 수 있습니다. 테스트 실행 전에 데이터베이스 상태를 확인하세요.

2. **시간 의존성**: 일부 테스트(예: 예약 취소)는 시간에 의존합니다. 테스트가 실패하는 경우 시간 설정을 확인하세요.

3. **동시성**: 동시 예약 충돌 테스트는 실제 동시 요청을 시뮬레이션합니다.

4. **독립성**: 각 테스트는 독립적으로 실행 가능해야 하지만, 일부 테스트는 이전 테스트의 결과에 의존할 수 있습니다.

### 문제 해결

#### 테스트가 실패하는 경우

1. 서버가 실행 중인지 확인
2. 데이터베이스가 올바르게 초기화되었는지 확인
3. 테스트 데이터가 올바른지 확인
4. 네트워크 연결 확인

#### 포트 충돌

서버가 다른 포트에서 실행되는 경우 `BASE_URL` 환경 변수를 설정하세요:

```bash
BASE_URL=http://localhost:3000 npm test
```

### 참고

- [Playwright 공식 문서](https://playwright.dev/)
- [test_cases.md](./tests/test_cases.md) - 상세한 테스트 케이스 명세

---

## 전체 시스템 실행 순서

1. **백엔드 서버 시작**
   ```bash
   cd server
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   alembic upgrade head
   uvicorn app.main:app --reload
   ```

2. **프론트엔드 개발 서버 시작** (별도 터미널)
   ```bash
   cd jbnu-reserve
   npm install
   npm run dev
   ```

3. **테스트 실행** (선택사항)
   ```bash
   cd tests
   npm install
   npm test
   ```
