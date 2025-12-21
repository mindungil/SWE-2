#!/usr/bin/env python3
"""
데이터베이스 초기화 스크립트
users와 facilities 테이블에 더미 데이터를 삽입합니다.
"""
import sqlite3
import os
from pathlib import Path

# 현재 스크립트의 디렉토리
SCRIPT_DIR = Path(__file__).parent
DB_PATH = SCRIPT_DIR / "data" / "app.db"
INSERT_USERS_SQL = SCRIPT_DIR / "insert_users.sql"
INSERT_FACILITIES_SQL = SCRIPT_DIR / "insert_facilities.sql"


def init_database():
    """데이터베이스에 초기 데이터를 삽입합니다."""
    if not DB_PATH.exists():
        print(f"❌ 데이터베이스 파일을 찾을 수 없습니다: {DB_PATH}")
        print("   먼저 'alembic upgrade head'를 실행하세요.")
        return False

    try:
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()

        # users 데이터 삽입
        if INSERT_USERS_SQL.exists():
            print("📝 users 테이블에 데이터 삽입 중...")
            with open(INSERT_USERS_SQL, "r", encoding="utf-8") as f:
                sql_script = f.read()
            cursor.executescript(sql_script)
            print("✓ users 데이터 삽입 완료")
        else:
            print(f"⚠️  {INSERT_USERS_SQL} 파일을 찾을 수 없습니다.")

        # facilities 데이터 삽입
        if INSERT_FACILITIES_SQL.exists():
            print("📝 facilities 테이블에 데이터 삽입 중...")
            with open(INSERT_FACILITIES_SQL, "r", encoding="utf-8") as f:
                sql_script = f.read()
            cursor.executescript(sql_script)
            print("✓ facilities 데이터 삽입 완료")
        else:
            print(f"⚠️  {INSERT_FACILITIES_SQL} 파일을 찾을 수 없습니다.")

        conn.commit()
        conn.close()

        # 데이터 확인
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM facilities")
        facility_count = cursor.fetchone()[0]
        conn.close()

        print(f"\n✓ 데이터베이스 초기화 완료")
        print(f"  - users: {user_count}개")
        print(f"  - facilities: {facility_count}개")
        return True

    except sqlite3.Error as e:
        print(f"❌ 데이터베이스 오류: {e}")
        return False
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False


if __name__ == "__main__":
    success = init_database()
    exit(0 if success else 1)
