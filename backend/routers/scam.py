from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import re, hashlib, json, os
from groq import Groq

router = APIRouter()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ─────────────────────────────────────────
# MODEL
# ─────────────────────────────────────────
class ScamRequest(BaseModel):
    text: str

# ─────────────────────────────────────────
# HELPER: Ekstrak URL & cek shortlink
# ─────────────────────────────────────────
URL_REGEX = re.compile(r'https?://[^\s/$.?#].[^\s]*', re.IGNORECASE)

SHORTLINK_DOMAINS = [
    'bit.ly', 'tinyurl.com', 't.co', 't.me',
    'cutt.ly', 's.id', 'ow.ly', 'rb.gy',
    'shorte.st', 'bc.vc', 'adf.ly', 'buff.ly'
]

def extract_urls(text: str) -> list[str]:
    return list(set(URL_REGEX.findall(text)))

def is_shortlink(url: str) -> bool:
    return any(domain in url.lower() for domain in SHORTLINK_DOMAINS)

# ─────────────────────────────────────────
# ENDPOINT: Analisis Scam/Phishing
# ✅ FIX: Hapus response_model agar field
#    tambahan tidak dibuang FastAPI
# ─────────────────────────────────────────
@router.post("/analyze")
async def analyze_scam(request: ScamRequest):
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Input teks tidak boleh kosong")

    # Ekstrak URL & shortlink sebelum kirim ke Groq
    urls = extract_urls(text)
    shortlink_urls = [u for u in urls if is_shortlink(u)]

    url_context = f"\nURL ditemukan: {', '.join(urls)}" if urls else ""
    shortlink_context = f"\nShortlink mencurigakan: {', '.join(shortlink_urls)}" if shortlink_urls else ""

    prompt = f"""Kamu adalah sistem deteksi scam dan phishing untuk Indonesia.
Analisis pesan berikut secara menyeluruh.{url_context}{shortlink_context}

Pesan yang dianalisis:
\"\"\"{text}\"\"\"

Periksa:
1. PHISHING: urgensi palsu, ancaman akun, ajakan transfer/OTP/password
2. ANALISIS URL: typosquatting (g00gle.com, BNl-bank.com), subdomain menyesatkan, shortlink
3. SKEMA SCAM INDONESIA: penipuan kurir (J&T/JNE palsu), undangan APK, giveaway crypto,
   pinjol ilegal, lowongan kerja palsu, mama minta pulsa, BPJS/PLN palsu, Ponzi/arisan bodong
4. MANIPULASI: social engineering, FOMO, mengaku pejabat/bank/polisi

Balas HANYA JSON, tanpa teks lain:
{{
  "verdict": "SCAM/PHISHING TERDETEKSI" atau "MENCURIGAKAN" atau "AMAN",
  "risk_score": angka 0-100,
  "risk_level": "HIGH" atau "MEDIUM" atau "LOW",
  "scam_category": "kategori jika terdeteksi, atau null",
  "red_flags": ["string deskripsi red flag 1", "string deskripsi red flag 2"],
  "url_analysis": [
    {{"url": "url", "risk": "HIGH/MEDIUM/LOW", "reason": "alasan"}}
  ],
  "alasan": "penjelasan singkat bahasa Indonesia maks 2 kalimat",
  "recommendation": "saran konkret untuk pengguna"
}}"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "Kamu ahli keamanan siber yang mendeteksi scam dan phishing di Indonesia."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=1024,
        )

        raw = completion.choices[0].message.content.strip()
        # Bersihkan markdown jika ada
        raw = re.sub(r"```json|```", "", raw).strip()

        # Parse JSON
        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            # Coba cari JSON di antara kurung kurawal
            start = raw.find('{')
            end = raw.rfind('}') + 1
            if start >= 0 and end > start:
                result = json.loads(raw[start:end])
            else:
                raise ValueError("Tidak bisa menemukan JSON dalam respons AI")

        # Normalisasi tipe data
        risk_score = result.get("risk_score", 0)
        if not isinstance(risk_score, int):
            risk_score = int(float(risk_score))
        risk_score = max(0, min(100, risk_score))
        result["risk_score"] = risk_score

        # Pastikan risk_level konsisten dengan risk_score
        if risk_score >= 70:
            result["risk_level"] = "HIGH"
        elif risk_score >= 40:
            result["risk_level"] = "MEDIUM"
        else:
            result["risk_level"] = "LOW"

        # Tambahkan field tambahan dari analisis lokal
        result["extracted_urls"] = urls
        result["shortlink_warnings"] = shortlink_urls

        # Tambahkan shortlink ke url_analysis jika belum ada
        existing = {u.get("url") for u in result.get("url_analysis", [])}
        for su in shortlink_urls:
            if su not in existing:
                result.setdefault("url_analysis", []).append({
                    "url": su,
                    "risk": "HIGH",
                    "reason": "Shortlink menyembunyikan tujuan URL asli"
                })

        # ── Blockchain: catat jika HIGH RISK ──────────────────────────
        if result["risk_level"] == "HIGH":
            try:
                import httpx
                content_hash = hashlib.sha256(text.encode()).hexdigest()
                async with httpx.AsyncClient() as http:
                    await http.post(
                        "http://localhost:8000/api/blockchain/log",
                        json={
                            "content_type": "scam",
                            "verdict": result.get("verdict", ""),
                            "confidence": float(risk_score),
                            "content_hash": content_hash
                        },
                        timeout=5.0
                    )
            except Exception as e:
                # Blockchain gagal tidak boleh hentikan response utama
                print(f"[Blockchain] Gagal log: {e}")

        return result

    except Exception as e:
        return {
            "verdict": "ERROR",
            "risk_score": 0,
            "risk_level": "LOW",
            "scam_category": None,
            "red_flags": [],
            "url_analysis": [],
            "alasan": f"Terjadi kesalahan: {str(e)}",
            "recommendation": "Coba ulangi analisis.",
            "extracted_urls": urls,
            "shortlink_warnings": shortlink_urls
        }