from fastapi import APIRouter, UploadFile, File, Form
from groq import Groq
import base64, os, io, re, json, tempfile
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ─────────────────────────────────────────
# HELPER: analisis satu frame (gambar PIL)
# ─────────────────────────────────────────
def analyze_frame(pil_image: Image.Image, caption: str = "", frame_info: str = "") -> dict:
    pil_image.thumbnail((800, 800))
    buffer = io.BytesIO()
    pil_image.save(buffer, format="JPEG", quality=85)
    image_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    caption_section = f'\n\nJudul/Caption yang menyertai: "{caption}"' if caption.strip() else ""
    frame_section = f'\n\nInfo: {frame_info}' if frame_info else ""

    prompt = f"""Kamu adalah sistem verifikasi fakta dan deteksi deepfake untuk Indonesia.
Analisis gambar ini secara komprehensif.{caption_section}{frame_section}

Lakukan analisis berikut:
1. Apakah gambar ini asli atau hasil manipulasi AI/deepfake?
2. Apakah judul/caption yang menyertai gambar ini sesuai dengan isi gambar?
3. Apakah klaim dalam caption dapat diverifikasi atau justru menyesatkan?

Perhatikan anomali visual: wajah tidak natural, inkonsistensi pencahayaan, artefak AI, blur tidak wajar.

Balas HANYA dalam format JSON berikut, tanpa teks lain:
{{
  "verdict": "HOAKS TERVERIFIKASI" atau "DEEPFAKE TERDETEKSI" atau "MENCURIGAKAN" atau "KEMUNGKINAN VALID",
  "ai_manipulation_probability": angka 0-100,
  "authenticity_score": angka 0-100,
  "threat_level": "HIGH" atau "MEDIUM" atau "LOW",
  "alasan": "penjelasan singkat dalam bahasa Indonesia maksimal 2 kalimat",
  "anomali_visual": ["daftar anomali visual pada gambar"],
  "analisis_caption": "penjelasan apakah caption sesuai dengan gambar atau tidak",
  "verdict_caption": "CAPTION MENYESATKAN" atau "CAPTION MENCURIGAKAN" atau "CAPTION SESUAI" atau "TIDAK ADA CAPTION",
  "sumber_verifikasi": [
    {{
      "klaim": "klaim spesifik yang diverifikasi",
      "status": "SALAH" atau "TIDAK TERBUKTI" atau "BENAR" atau "MENYESATKAN",
      "penjelasan": "penjelasan singkat berdasarkan pengetahuan faktual"
    }}
  ]
}}"""

    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}
                    }
                ]
            }
        ],
        temperature=0.3,
    )
    raw = response.choices[0].message.content.strip()
    raw = re.sub(r"```json|```", "", raw).strip()
    return json.loads(raw)


# ─────────────────────────────────────────
# HELPER: gabungkan hasil beberapa frame
# ─────────────────────────────────────────
def merge_frame_results(results: list[dict], total_frames: int) -> dict:
    if not results:
        return {}

    # Rata-rata skor
    avg_manipulation = round(sum(r.get("ai_manipulation_probability", 0) for r in results) / len(results))
    avg_authenticity = round(sum(r.get("authenticity_score", 0) for r in results) / len(results))

    # Verdict berdasarkan skor tertinggi manipulasi
    if avg_manipulation >= 70:
        verdict = "DEEPFAKE TERDETEKSI"
        threat_level = "HIGH"
    elif avg_manipulation >= 40:
        verdict = "MENCURIGAKAN"
        threat_level = "MEDIUM"
    else:
        verdict = "KEMUNGKINAN VALID"
        threat_level = "LOW"

    # Kumpulkan semua anomali unik
    all_anomali = []
    for r in results:
        for a in r.get("anomali_visual", []):
            if a not in all_anomali:
                all_anomali.append(a)

    # Ambil alasan dari frame dengan manipulasi tertinggi
    worst_frame = max(results, key=lambda r: r.get("ai_manipulation_probability", 0))

    # Kumpulkan sumber verifikasi unik
    all_sumber = []
    seen_klaim = set()
    for r in results:
        for s in r.get("sumber_verifikasi", []):
            if s.get("klaim") not in seen_klaim:
                all_sumber.append(s)
                seen_klaim.add(s.get("klaim"))

    return {
        "verdict": verdict,
        "ai_manipulation_probability": avg_manipulation,
        "authenticity_score": avg_authenticity,
        "threat_level": threat_level,
        "alasan": worst_frame.get("alasan", ""),
        "anomali_visual": all_anomali,
        "analisis_caption": worst_frame.get("analisis_caption", ""),
        "verdict_caption": worst_frame.get("verdict_caption", "TIDAK ADA CAPTION"),
        "sumber_verifikasi": all_sumber,
        "total_frames_analyzed": len(results),
        "total_frames_extracted": total_frames,
        "media_type": "video"
    }


# ─────────────────────────────────────────
# ENDPOINT 1: Analisis Gambar (existing)
# ─────────────────────────────────────────
@router.post("/analyze")
async def analyze_deepfake(
    file: UploadFile = File(...),
    caption: str = Form(default="")
):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        result = analyze_frame(image, caption)
        result["media_type"] = "image"
        return result
    except Exception as e:
        return {
            "verdict": "ERROR",
            "ai_manipulation_probability": 0,
            "authenticity_score": 0,
            "threat_level": "LOW",
            "alasan": f"Terjadi kesalahan: {str(e)}",
            "anomali_visual": [],
            "analisis_caption": "",
            "verdict_caption": "TIDAK ADA CAPTION",
            "sumber_verifikasi": [],
            "media_type": "image"
        }


# ─────────────────────────────────────────
# ENDPOINT 2: Analisis Video
# ─────────────────────────────────────────
@router.post("/analyze-video")
async def analyze_deepfake_video(
    file: UploadFile = File(...),
    caption: str = Form(default="")
):
    try:
        import cv2
        import numpy as np
    except ImportError:
        return {
            "verdict": "ERROR",
            "alasan": "OpenCV belum terinstall. Jalankan: pip install opencv-python",
            "media_type": "video"
        }

    try:
        contents = await file.read()

        # Simpan video ke file temporary
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        # Ekstrak frame dari video
        cap = cv2.VideoCapture(tmp_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = total_frames / fps if fps > 0 else 0

        # Ambil maksimal 5 frame yang tersebar merata
        NUM_FRAMES = 5
        if total_frames < NUM_FRAMES:
            frame_indices = list(range(total_frames))
        else:
            frame_indices = [int(total_frames * i / NUM_FRAMES) for i in range(NUM_FRAMES)]

        frames = []
        for idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if ret:
                # Convert BGR (OpenCV) ke RGB (PIL)
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(frame_rgb)
                frames.append((idx, pil_image))

        cap.release()
        os.unlink(tmp_path)

        if not frames:
            return {
                "verdict": "ERROR",
                "alasan": "Tidak dapat mengekstrak frame dari video.",
                "media_type": "video"
            }

        # Analisis tiap frame
        frame_results = []
        for frame_idx, pil_image in frames:
            timestamp = round(frame_idx / fps, 1) if fps > 0 else 0
            frame_info = f"Frame {frame_idx} (detik ke-{timestamp} dari video {round(duration, 1)} detik)"
            try:
                result = analyze_frame(pil_image, caption, frame_info)
                result["frame_index"] = frame_idx
                result["timestamp_seconds"] = timestamp
                frame_results.append(result)
            except Exception:
                continue

        if not frame_results:
            return {
                "verdict": "ERROR",
                "alasan": "Gagal menganalisis frame video.",
                "media_type": "video"
            }

        # Gabungkan hasil semua frame
        merged = merge_frame_results(frame_results, total_frames)
        merged["video_duration_seconds"] = round(duration, 1)
        merged["frame_details"] = [
            {
                "frame": r.get("frame_index"),
                "timestamp": r.get("timestamp_seconds"),
                "verdict": r.get("verdict"),
                "manipulation_probability": r.get("ai_manipulation_probability")
            }
            for r in frame_results
        ]
        return merged

    except Exception as e:
        return {
            "verdict": "ERROR",
            "ai_manipulation_probability": 0,
            "authenticity_score": 0,
            "threat_level": "LOW",
            "alasan": f"Terjadi kesalahan: {str(e)}",
            "anomali_visual": [],
            "analisis_caption": "",
            "verdict_caption": "TIDAK ADA CAPTION",
            "sumber_verifikasi": [],
            "media_type": "video"
        }