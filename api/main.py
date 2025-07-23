from fastapi import FastAPI, Request, Depends, HTTPException, status, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
import motor.motor_asyncio
import os
from mangum import Mangum

# MongoDB connection
MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb+srv://drviktorexe:Vansh240703@ttmod2025.9vmzbje.mongodb.net/?retryWrites=true&w=majority&appName=TTMod2025")

# Configure MongoDB client with serverless-friendly settings
client = motor.motor_asyncio.AsyncIOMotorClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=5000,  # Timeout after 5 seconds
    connectTimeoutMS=10000,  # Timeout after 10 seconds
    socketTimeoutMS=20000,  # Timeout after 20 seconds
    maxPoolSize=10,  # Limit connection pool for serverless
    retryWrites=True  # Enable retry writes for better reliability
)
db = client.personal_finance_tracker

# Security
SECRET_KEY = os.environ.get("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class User(BaseModel):
    username: str
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class Transaction(BaseModel):
    amount: float
    category: str
    description: str
    date: str
    transaction_type: str  # income or expense

class Budget(BaseModel):
    total_budget: float
    category_budgets: dict

# App setup
app = FastAPI(
    title="Personal Finance Tracker API",
    description="API for tracking personal finances with MongoDB integration",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return HTMLResponse(
        content=f"""
        <html>
            <head>
                <title>Error</title>
                <style>
                    body {{ font-family: Arial, sans-serif; padding: 2rem; line-height: 1.6; }}
                    .error-container {{ max-width: 800px; margin: 0 auto; background: #f8f9fa; padding: 2rem; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                    h1 {{ color: #e74c3c; }}
                    pre {{ background: #f1f1f1; padding: 1rem; overflow-x: auto; }}
                    .back-link {{ margin-top: 2rem; }}
                    .back-link a {{ color: #3498db; text-decoration: none; }}
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h1>Something went wrong</h1>
                    <p>The application encountered an error. Please try again later.</p>
                    <div class="back-link">
                        <a href="/">← Go back to homepage</a>
                    </div>
                </div>
            </body>
        </html>
        """,
        status_code=500
    )

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user(username: str):
    user = await db.users.find_one({"username": username})
    if user:
        return User(**user)

async def authenticate_user(username: str, password: str):
    user = await get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = await get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# Routes
@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "API is running"}

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register")
async def register(username: str = Form(...), password: str = Form(...)):
    user_exists = await db.users.find_one({"username": username})
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    hashed_password = get_password_hash(password)
    user = {"username": username, "hashed_password": hashed_password}
    await db.users.insert_one(user)
    
    # Create a user-specific collection for all user data
    user_collection = db[f"user_{username}"]
    
    # Create initial settings for the user
    settings = {
        "type": "settings",
        "currency": "USD",
        "theme": "light",
        "categories": ["Food", "Transport", "Housing", "Entertainment", "Utilities", "Other"],
        "last_updated": datetime.utcnow()
    }
    await user_collection.insert_one(settings)
    
    return {"message": "User registered successfully"}

# API endpoints
@app.post("/api/transactions")
async def create_transaction(transaction: Transaction, user: User = Depends(get_current_user)):
    user_collection = db[f"user_{user.username}"]
    transaction_dict = transaction.dict()
    transaction_dict["type"] = "transaction"
    transaction_dict["timestamp"] = datetime.utcnow()
    result = await user_collection.insert_one(transaction_dict)
    return {"id": str(result.inserted_id)}

@app.get("/api/transactions")
async def get_transactions(user: User = Depends(get_current_user)):
    user_collection = db[f"user_{user.username}"]
    transactions = []
    cursor = user_collection.find({"type": "transaction"})
    async for document in cursor:
        document["_id"] = str(document["_id"])
        transactions.append(document)
    return transactions

@app.put("/api/transactions/{transaction_id}")
async def update_transaction(transaction_id: str, transaction: dict, user: User = Depends(get_current_user)):
    from bson.objectid import ObjectId
    user_collection = db[f"user_{user.username}"]
    transaction["timestamp"] = datetime.utcnow()
    result = await user_collection.update_one(
        {"_id": ObjectId(transaction_id), "type": "transaction"},
        {"$set": transaction}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction updated successfully"}

@app.delete("/api/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, user: User = Depends(get_current_user)):
    from bson.objectid import ObjectId
    user_collection = db[f"user_{user.username}"]
    result = await user_collection.delete_one({"_id": ObjectId(transaction_id), "type": "transaction"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted successfully"}

@app.get("/api/stats")
async def get_stats(user: User = Depends(get_current_user)):
    user_collection = db[f"user_{user.username}"]
    
    # Get total income
    income_pipeline = [
        {"$match": {"type": "transaction", "transaction_type": "income"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    income_cursor = user_collection.aggregate(income_pipeline)
    income_result = await income_cursor.to_list(length=1)
    total_income = income_result[0]["total"] if income_result else 0
    
    # Get total expenses
    expense_pipeline = [
        {"$match": {"type": "transaction", "transaction_type": "expense"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    expense_cursor = user_collection.aggregate(expense_pipeline)
    expense_result = await expense_cursor.to_list(length=1)
    total_expenses = expense_result[0]["total"] if expense_result else 0
    
    # Get expenses by category
    category_pipeline = [
        {"$match": {"type": "transaction", "transaction_type": "expense"}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}}
    ]
    category_cursor = user_collection.aggregate(category_pipeline)
    categories = await category_cursor.to_list(length=100)
    
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": total_income - total_expenses,
        "expenses_by_category": categories
    }

@app.get("/api/settings")
async def get_settings(user: User = Depends(get_current_user)):
    user_collection = db[f"user_{user.username}"]
    settings = await user_collection.find_one({"type": "settings"})
    if settings:
        settings["_id"] = str(settings["_id"])
        return settings
    raise HTTPException(status_code=404, detail="Settings not found")

@app.put("/api/settings")
async def update_settings(settings: dict, user: User = Depends(get_current_user)):
    user_collection = db[f"user_{user.username}"]
    settings["type"] = "settings"
    settings["last_updated"] = datetime.utcnow()
    
    await user_collection.update_one(
        {"type": "settings"},
        {"$set": settings},
        upsert=True
    )
    return {"message": "Settings updated successfully"}

@app.post("/api/budget")
async def create_budget(budget: Budget, user: User = Depends(get_current_user)):
    user_collection = db[f"user_{user.username}"]
    budget_dict = budget.dict()
    budget_dict["type"] = "budget"
    budget_dict["timestamp"] = datetime.utcnow()
    
    # Check if budget already exists
    existing_budget = await user_collection.find_one({"type": "budget"})
    if existing_budget:
        await user_collection.update_one(
            {"type": "budget"},
            {"$set": budget_dict}
        )
        return {"message": "Budget updated successfully"}
    else:
        result = await user_collection.insert_one(budget_dict)
        return {"id": str(result.inserted_id)}

@app.get("/api/budget")
async def get_budget(user: User = Depends(get_current_user)):
    user_collection = db[f"user_{user.username}"]
    budget = await user_collection.find_one({"type": "budget"})
    if budget:
        budget["_id"] = str(budget["_id"])
        return budget
    return {"total_budget": 0, "category_budgets": {}}

# For Vercel serverless deployment
handler = Mangum(app)