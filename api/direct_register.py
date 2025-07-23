from fastapi import APIRouter, Form, HTTPException, status
from passlib.context import CryptContext
from datetime import datetime
import os
import motor.motor_asyncio

router = APIRouter()

# MongoDB connection
MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb+srv://drviktorexe:Vansh240703@ttmod2025.9vmzbje.mongodb.net/?retryWrites=true&w=majority&appName=TTMod2025")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
db = client.personal_finance_tracker

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

@router.post("/direct-register")
async def direct_register(username: str = Form(...), password: str = Form(...)):
    try:
        print(f"Direct Register attempt for user: {username}")
        
        # Check if user exists
        user_exists = await db.users.find_one({"username": username})
        if user_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Hash password and create user
        hashed_password = get_password_hash(password)
        user = {"username": username, "hashed_password": hashed_password}
        await db.users.insert_one(user)
        
        # Create user collection
        user_collection = db[f"user_{username}"]
        
        # Create initial settings
        settings = {
            "type": "settings",
            "currency": "USD",
            "theme": "light",
            "categories": ["Food", "Transport", "Housing", "Entertainment", "Utilities", "Other"],
            "last_updated": datetime.utcnow()
        }
        await user_collection.insert_one(settings)
        
        print(f"User {username} registered successfully via direct endpoint")
        return {"message": "User registered successfully"}
    
    except Exception as e:
        print(f"Error in direct register: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration error: {str(e)}"
        )