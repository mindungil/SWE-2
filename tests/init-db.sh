#!/bin/bash
# 데이터베이스 초기화 스크립트

set -e

SERVER_DIR="../server"
cd "$SERVER_DIR" || exit 1

# 가상환경 활성화
source .venv/bin/activate

# 서버가 실행 중이면 일시적으로 종료 (DB 초기화를 위해)
# 하지만 테스트 실행 전에 서버가 다시 시작되어야 함
pkill -f "uvicorn app.main:app" 2>/dev/null || true
sleep 1

# 데이터베이스 디렉토리 완전 삭제 및 재생성
rm -rf data
mkdir -p data

# Alembic 마이그레이션 실행 (downgrade 후 upgrade)
alembic downgrade base 2>/dev/null || true
alembic upgrade head

# 데이터 삽입
python init_db.py

# 데이터베이스 파일 권한 설정
chmod 666 data/app.db

echo "✓ 데이터베이스 초기화 완료"
