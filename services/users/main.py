from fastapi import Depends, FastAPI

from common.security import UserContext, get_current_user

app = FastAPI(title="ShadowBytes User Service", version="0.1.0")

USER_PROFILES = {
    "usr-student-001": {"name": "Estudiante ShadowBytes", "city": "Arequipa"},
    "usr-admin-001": {"name": "Administración ShadowBytes", "city": "Arequipa"},
}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"service": "user-service", "status": "UP"}


@app.get("/me")
async def profile(user: UserContext = Depends(get_current_user)) -> dict[str, str]:
    return {"user_id": user.user_id, "email": user.email, "role": user.role, **USER_PROFILES[user.user_id]}

