from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user_dict

router = APIRouter(prefix="/api/test", tags=["test"])

@router.get("/hello")
async def test_hello():
    return {"message": "Hello from test route"}

@router.get("/auth")
async def test_auth(current_user: dict = Depends(get_current_user_dict)):
    return {"user": current_user}

@router.get("/db")
async def test_db(db: Session = Depends(get_db)):
    try:
        result = db.execute("SELECT 1")
        return {"db": "connected"}
    except Exception as e:
        return {"error": str(e)}