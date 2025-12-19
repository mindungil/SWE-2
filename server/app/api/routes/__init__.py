from fastapi import APIRouter

from app.api.routes import auth, health, items, laptop_seats, meeting_rooms

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(items.router)
api_router.include_router(auth.router)
api_router.include_router(meeting_rooms.router)
api_router.include_router(laptop_seats.router)
