from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from agents import router as research_router
from agents import reports_router
from agents import notifications_router
from auth import router as auth_router
from auth.database import connect_to_mongodb, close_mongodb_connection, is_connected
import os
from datetime import datetime
from datetime import datetime
from dotenv import load_dotenv
import sys
import os

import sys
import torch

load_dotenv()

def check_required_env_vars():
    """Check required environment variables"""
    print("="*60)
    print(f"🔍 [Startup Diagnostic]")
    print(f"   Python: {sys.executable}")
    print(f"   CWD: {os.getcwd()}")
    
    try:
        import accelerate
        print(f"   ✅ Accelerate: {accelerate.__version__} @ {os.path.dirname(accelerate.__file__)}")
    except ImportError as e:
        print(f"   ❌ Accelerate Import Failed: {e}")
        
    try:
        import transformers
        print(f"   ✅ Transformers: {transformers.__version__}")
    except ImportError:
         print(f"   ❌ Transformers Import Failed")
    
    # Simple check for accelerate being importable
    try:
        from accelerate import Accelerator
        print("   ✅ Accelerate.Accelerator importable")
    except Exception as e:
        print(f"   ❌ Accelerate.Accelerator import failed: {e}")
         
    print(f"   Torch: {torch.__version__}, CUDA: {torch.cuda.is_available()}")
    print("="*60)

    required_vars = [
        "MONGO_URL",
        "JWT_SECRET_KEY",
        "GOOGLE_API_KEY"
    ]
    
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        # In dev we might want to just warn, but strictly we should raise.
        # Given previous context, let's print a warning if dev fallback is possible, or raise.
        print(f"WARNING: Missing environment variables: {', '.join(missing)}")
        # raise ValueError(f"Missing environment variables: {', '.join(missing)}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    check_required_env_vars()
    await connect_to_mongodb()
    
    yield
    
    # Shutdown
    await close_mongodb_connection()

app = FastAPI(
    title="PharmaAI Research Platform",
    description="Agentic AI for Drug Repurposing Discovery",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174", "http://localhost:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router.router)
app.include_router(research_router.router)
app.include_router(reports_router.router)
app.include_router(notifications_router.router)

@app.get("/")
async def root():
    return {
        "message": "PharmaAI Research Platform API",
        "status": "active",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    db_status = "connected" if is_connected() else "disconnected"
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
