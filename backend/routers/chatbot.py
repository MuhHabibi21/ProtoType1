from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """Kamu adalah Nusantara AI Guard, asisten edukasi keamanan digital untuk masyarakat Indonesia.
Tugasmu adalah membantu masyarakat memahami ancaman digital sehari-hari dengan bahasa yang mudah dipahami, friendly, dan tidak menggurui.

Fokus topikmu:
- Hoaks dan disinformasi
- Deepfake dan manipulasi media
- Phishing dan scam digital
- Keamanan password dan akun
- Keamanan media sosial
- Literasi digital umum

Aturan menjawab:
- Menggunakan bahasa Indonesia yang santai tapi informatif
- Jawaban maksimal 3-4 paragraf pendek
- Gunakan emoji yang relevan untuk membuat jawaban lebih menarik
- Selalu akhiri dengan 1 tips praktis yang bisa langsung diterapkan
- Jika pertanyaan di luar topik keamanan digital, arahkan kembali ke topik tersebut dengan sopan"""

class ChatMessage(BaseModel):
    message: str
    history: list[dict] = []

@router.post("/chat")
def chat(req: ChatMessage):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for h in req.history[-10:]:  # ambil 10 pesan terakhir saja
        messages.append({"role": h["role"], "content": h["content"]})

    messages.append({"role": "user", "content": req.message})

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
        )
        reply = response.choices[0].message.content
        return {"reply": reply, "status": "ok"}
    except Exception as e:
        return {"reply": f"Maaf, terjadi kesalahan: {str(e)}", "status": "error"}