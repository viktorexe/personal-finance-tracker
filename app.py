from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Create a minimal app for testing
app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Finance Tracker API is running"}

@app.get("/api/test")
async def test():
    return {"status": "ok"}