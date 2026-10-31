import io, os, re, tempfile
os.environ["HISTORY_DB"] = os.path.join(tempfile.mkdtemp(), "h.sqlite3")
os.environ["MAX_UPLOAD_MB"] = "1"
import numpy as np, pytest
from fastapi.testclient import TestClient
from PIL import Image
from app.main import app, service

def img_bytes(fmt="PNG", size=(200, 160), seed=0):
    arr = np.random.default_rng(seed).integers(0, 256, (size[1], size[0], 3), dtype=np.uint8)
    b = io.BytesIO(); Image.fromarray(arr).save(b, fmt); return b.getvalue()

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c: yield c

def test_health_and_model_loaded(client):
    r = client.get("/api/health").json(); assert r["status"] == "ok" and r["model_loaded"] is True

def test_model_info_has_no_paths_or_invented_metrics(client):
    r = client.get("/api/model-info"); assert r.status_code == 200
    j = r.json(); assert j["feature_extraction"]["feature_dim"] == 8612
    assert j["evaluation_metrics"] is None
    assert j["version_warning"] is None  # scikit-learn pinned to the training version
    blob = str(j); assert not re.search(r"(/home/|/Users/|/mnt/|\.joblib|models/)", blob)

def test_predict_schema_and_label_mapping(client):
    r = client.post("/api/predict", files={"file": ("a.png", img_bytes(), "image/png")}); assert r.status_code == 200
    j = r.json(); s = j["scores"]
    assert j["predicted_label"] in ("REAL", "FAKE") and abs(s["REAL"] + s["FAKE"] - 1) < 1e-3
    assert (j["predicted_label"] == "REAL") == (s["REAL"] >= 0.5) and j["score_type"] == "model_score"

def test_prediction_is_deterministic(client):
    d = img_bytes(seed=3)
    a = [client.post("/api/predict", files={"file": ("a.png", d)}).json()["scores"] for _ in range(2)]
    assert a[0] == a[1]

def test_matches_direct_model_call(client):
    from app.services.features import extract_features
    d = img_bytes("JPEG", seed=5)
    api = client.post("/api/predict", files={"file": ("a.jpg", d)}).json()["scores"]["REAL"]
    m = service.artifact["model"]; f = extract_features(Image.open(io.BytesIO(d))).reshape(1, -1)
    assert abs(api - round(float(m.predict_proba(f)[0, 1]), 4)) < 1e-9

@pytest.mark.parametrize("name,data,code", [
    ("a.gif", img_bytes("GIF"), 415), ("a.txt", b"hello", 415), ("a.png", b"", 400),
    ("a.png", b"not an image", 422), ("a.png", img_bytes("PNG")[:200], 422),
    ("a.png", img_bytes("PNG", (8, 8)), 422), ("a.png", b"\x00" * (2 * 1024 * 1024), 413),
    ("a.png", img_bytes("BMP"), 415)])
def test_rejections(client, name, data, code):
    assert client.post("/api/predict", files={"file": (name, data)}).status_code == code

def test_missing_file_400(client): assert client.post("/api/predict").status_code == 400

def test_history_roundtrip(client):
    client.delete("/api/history"); client.post("/api/predict", files={"file": ("a.png", img_bytes())})
    h = client.get("/api/history").json(); assert len(h["items"]) == 1
    assert client.delete("/api/history").json()["deleted"] == 1 and client.get("/api/history").json()["items"] == []

def test_incompatible_artifact_rejected(tmp_path):
    import joblib; from sklearn.linear_model import LogisticRegression
    X = np.random.rand(20, 10); y = np.array([0, 1] * 10)
    joblib.dump({"model": LogisticRegression().fit(X, y), "model_name": "x", "img_size": 128, "label_map": {0: "FAKE", 1: "REAL"}}, tmp_path / "real_fake_hog.joblib")
    from app.services.model_service import ModelService, ModelUnavailable
    with pytest.raises(ModelUnavailable): ModelService().load(tmp_path)
