from fastapi import APIRouter
from pydantic import BaseModel
import hashlib, json, time
from datetime import datetime

router = APIRouter()

chain = []

class VerificationRecord(BaseModel):
    content_type: str   # "hoax" atau "deepfake"
    verdict: str
    confidence: float
    content_hash: str   # funsi nhash dari konten yang dianalisis

def create_block(data: dict, previous_hash: str) -> dict:
    block = {
        "index": len(chain) + 1,
        "timestamp": datetime.utcnow().isoformat(),
        "data": data,
        "previous_hash": previous_hash,
    }
    block_string = json.dumps(block, sort_keys=True)
    block["hash"] = hashlib.sha256(block_string.encode()).hexdigest()
    return block

@router.post("/log")
def log_verification(record: VerificationRecord):
    prev_hash = chain[-1]["hash"] if chain else "0" * 64
    block = create_block(record.dict(), prev_hash)
    chain.append(block)
    return {
        "message": "Verifikasi tercatat di blockchain",
        "block_index": block["index"],
        "block_hash": block["hash"],
        "timestamp": block["timestamp"]
    }

@router.get("/chain")
def get_chain():
    return {
        "total_verifications": len(chain),
        "chain": chain,
        "chain_valid": validate_chain()
    }

def validate_chain() -> bool:
    for i in range(1, len(chain)):
        curr, prev = chain[i], chain[i-1]
        if curr["previous_hash"] != prev["hash"]:
            return False
    return True