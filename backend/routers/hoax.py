from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq
import json, re, os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class HoaxRequest(BaseModel):
    text: str

@router.post("/analyze")
def analyze_hoax(req: HoaxRequest):
    prompt = f"""
Kamu adalah sistem deteksi hoaks dan disinformasi untuk Indonesia.
Analisis teks berikut dan tentukan apakah ini hoaks, mencurigakan, atau valid.

Teks: "{req.text}"

Balas HANYA dalam format JSON seperti ini, tanpa teks lain apapun:
{{
  "verdict": "KEMUNGKINAN HOAKS" atau "MENCURIGAKAN" atau "KEMUNGKINAN VALID",
  "confidence": angka 0-100,
  "threat_level": "HIGH" atau "MEDIUM" atau "LOW",
  "alasan": "penjelasan singkat dalam bahasa Indonesia maksimal 2 kalimat",
  "suspicious_keywords": ["kata", "mencurigakan"],
  "suspicious_patterns": ["pola mencurigakan"]
}}
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"```json|```", "", raw).strip()
        result = json.loads(raw)
        return result
    except json.JSONDecodeError:
        return {
            "verdict": "ERROR",
            "confidence": 0,
            "threat_level": "LOW",
            "alasan": "Gagal memproses respons AI, coba lagi.",
            "suspicious_keywords": [],
            "suspicious_patterns": []
        }
    except Exception as e:
        return {
            "verdict": "ERROR",
            "confidence": 0,
            "threat_level": "LOW",
            "alasan": f"Terjadi kesalahan: {str(e)}",
            "suspicious_keywords": [],
            "suspicious_patterns": []
        }