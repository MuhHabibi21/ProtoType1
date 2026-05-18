from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import hoax, deepfake, blockchain, chatbot

app = FastAPI(title="Nusantara Defense AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hoax.router, prefix="/api/hoax", tags=["Hoax Detection"])
app.include_router(deepfake.router, prefix="/api/deepfake", tags=["Deepfake Detection"])
app.include_router(blockchain.router, prefix="/api/blockchain", tags=["Blockchain Log"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Chatbot Edukasi"])

@app.get("/")
def root():
    return {"status": "Nusantara Defense AI aktif"}