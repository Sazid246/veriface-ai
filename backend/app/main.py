import logging, os, sqlite3, threading, time, uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError
from .services.model_service import FeatureMismatch, ModelService, ModelUnavailable

log = logging.getLogger("verifaceai")
MODEL_DIR = Path(os.getenv("MODEL_DIR", Path(__file__).resolve().parents[1] / "models"))
MAX_UPLOAD_MB = float(os.getenv("MAX_UPLOAD_MB", "10"))
MIN_SIDE, MAX_PIXELS = 32, 40_000_000
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
HISTORY_DB = os.getenv("HISTORY_DB", str(Path(__file__).resolve().parents[1] / "history.sqlite3"))
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
Image.MAX_IMAGE_PIXELS = MAX_PIXELS

service = ModelService()
_db_lock = threading.Lock()


def db():
    c = sqlite3.connect(HISTORY_DB, check_same_thread=False)
    c.execute("""CREATE TABLE IF NOT EXISTS history(id TEXT PRIMARY KEY, timestamp TEXT, predicted_label TEXT,
                 score_real REAL, score_fake REAL, processing_time_ms REAL, model_name TEXT)""")
    return c


@asynccontextmanager
async def lifespan(app):
    try:
        service.load(MODEL_DIR)
        log.info("model loaded")
    except Exception as e:
        log.error("model failed to load: %s", type(e).__name__)  # API stays up; /predict returns 503
    yield

app = FastAPI(title="VeriFace AI API", version="1.0.0", lifespan=lifespan,
              description="REAL vs FAKE image classifier. Scores are uncalibrated model outputs, not proof of authenticity.")
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=False,
                   allow_methods=["GET", "POST", "DELETE"], allow_headers=["*"])


@app.exception_handler(Exception)
async def unhandled(_: Request, exc: Exception):
    log.error("unhandled %s", type(exc).__name__)
    return JSONResponse({"detail": "Unexpected server error."}, status_code=500)


@app.get("/api/health")
def health():
    return {"status": "ok", "model_loaded": service.loaded,
            "model_name": service.artifact["model_name"] if service.loaded else None}


@app.get("/api/model-info")
def model_info():
    if not service.loaded: raise HTTPException(503, "Model is unavailable.")
    return service.info()


def read_limited(file: UploadFile) -> bytes:
    limit = int(MAX_UPLOAD_MB * 1024 * 1024); buf = bytearray()
    while chunk := file.file.read(1024 * 1024):
        buf += chunk
        if len(buf) > limit: raise HTTPException(413, f"File exceeds the {MAX_UPLOAD_MB:g} MB limit.")
    if not buf: raise HTTPException(400, "The uploaded file is empty.")
    return bytes(buf)


def decode_image(data: bytes, filename: str) -> Image.Image:
    if Path(filename or "").suffix.lower() not in ALLOWED_EXT:
        raise HTTPException(415, "Unsupported file extension. Use JPG, JPEG, PNG or WEBP.")
    try:
        with Image.open(BytesIO(data)) as probe:
            fmt = probe.format
            if fmt not in ALLOWED_FORMATS: raise HTTPException(415, "Unsupported image format. Use JPEG, PNG or WEBP.")
            probe.verify()
        im = Image.open(BytesIO(data)); im.load()  # verify() invalidates the handle, so reopen and fully decode
    except HTTPException: raise
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError, ValueError, SyntaxError):
        raise HTTPException(422, "The file could not be decoded as a valid image.")
    if min(im.size) < MIN_SIDE: raise HTTPException(422, f"Image is too small (minimum {MIN_SIDE}px per side).")
    return im


@app.post("/api/predict")
def predict(file: UploadFile | None = File(None)):
    if file is None: raise HTTPException(400, "No file uploaded. Send multipart field 'file'.")
    if not service.loaded: raise HTTPException(503, "Model is unavailable.")
    t0 = time.perf_counter()
    im = decode_image(read_limited(file), file.filename)
    try:
        out = service.predict(im)
    except (FeatureMismatch, ModelUnavailable):
        raise HTTPException(503, "Model is unavailable or incompatible.")
    result = {"prediction_id": uuid.uuid4().hex, **out, "score_type": "model_score",
              "model_name": service.artifact["model_name"],
              "processing_time_ms": round((time.perf_counter() - t0) * 1000, 1),
              "timestamp": datetime.now(timezone.utc).isoformat()}
    with _db_lock, db() as c:  # only metadata is stored; the image is never written to disk
        c.execute("INSERT INTO history VALUES(?,?,?,?,?,?,?)", (result["prediction_id"], result["timestamp"], result["predicted_label"],
                  out["scores"]["REAL"], out["scores"]["FAKE"], result["processing_time_ms"], result["model_name"]))
    return result


@app.get("/api/history")
def history():
    with _db_lock, db() as c:
        rows = c.execute("SELECT id,timestamp,predicted_label,score_real,score_fake,processing_time_ms,model_name FROM history ORDER BY timestamp DESC LIMIT 200").fetchall()
    return {"storage": "server-side SQLite (metadata only, no images)", "items": [
        {"prediction_id": r[0], "timestamp": r[1], "predicted_label": r[2], "scores": {"REAL": r[3], "FAKE": r[4]},
         "processing_time_ms": r[5], "model_name": r[6]} for r in rows]}


@app.delete("/api/history")
def clear_history():
    with _db_lock, db() as c:
        n = c.execute("DELETE FROM history").rowcount
    return {"deleted": n}
