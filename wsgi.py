from api.main import app

# This file is needed for some WSGI servers
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)