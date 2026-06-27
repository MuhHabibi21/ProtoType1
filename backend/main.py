from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ✅ FIX: import langsung dari routers (bukan backend.routers)
# Karena server dijalankan dari dalam folder backend/
from backend.routers import hoax, deepfake, blockchain, chatbot, scam

app = FastAPI(title="Nusantara Defense AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hoax.router,       prefix="/api/hoax",       tags=["Hoax Detection"])
app.include_router(deepfake.router,   prefix="/api/deepfake",   tags=["Deepfake Detection"])
app.include_router(blockchain.router, prefix="/api/blockchain", tags=["Blockchain Log"])
app.include_router(chatbot.router,    prefix="/api/chatbot",    tags=["Chatbot Edukasi"])
app.include_router(scam.router,       prefix="/api/scam",       tags=["Scam & Phishing Detection"])

@app.get("/")
def root():
    return {
        "status": "Nusantara Defense AI aktif",
        "routes": [
            "/api/hoax/analyze",
            "/api/deepfake/analyze",
            "/api/deepfake/analyze-video",
            "/api/blockchain/log",
            "/api/blockchain/chain",
            "/api/chatbot/chat",
            "/api/scam/analyze",
        ]
    }