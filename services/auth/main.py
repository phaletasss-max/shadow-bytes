from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel

from common.security import UserContext, create_access_token, get_current_user

app = FastAPI(title="ShadowBytes Authentication Service", version="0.1.0")

DEMO_USERS = {
    "student@shadowbytes.local": {
        "password": "demo123",
        "user_id": "usr-student-001",
        "role": "USER",
        "display_name": "Estudiante ShadowBytes",
    },
    "admin@shadowbytes.local": {
        "password": "admin123",
        "user_id": "usr-admin-001",
        "role": "ADMIN",
        "display_name": "Administración ShadowBytes",
    },
}


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserContext


@app.get("/health")
async def health() -> dict[str, str]:
    return {"service": "auth-service", "status": "UP"}


@app.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest) -> LoginResponse:
    user = DEMO_USERS.get(request.email.lower())
    if user is None or user["password"] != request.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    context = UserContext(
        user_id=user["user_id"], email=request.email.lower(), role=user["role"]
    )
    return LoginResponse(
        access_token=create_access_token(**context.model_dump()),
        user=context,
    )


@app.get("/me", response_model=UserContext)
async def current_user(user: UserContext = Depends(get_current_user)) -> UserContext:
    return user

