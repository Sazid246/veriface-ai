"""Loads the trained artifact once and runs inference. Never trains."""
import json, threading, warnings
from pathlib import Path
import numpy as np
from PIL import Image
from joblib.numpy_pickle import NumpyUnpickler
from .features import extract_features, feature_dim

_ALLOWED_MODULES = {"sklearn", "numpy", "scipy"}
_ALLOWED_EXACT = {("joblib.numpy_pickle", "NumpyArrayWrapper"), ("collections", "OrderedDict")} | {
    ("builtins", n) for n in ("dict", "list", "tuple", "set", "frozenset", "int", "float", "str", "object", "complex", "bytes", "slice")}


class ModelUnavailable(Exception): ...
class FeatureMismatch(Exception): ...


class _SafeUnpickler(NumpyUnpickler):
    """Refuses to import anything except scikit-learn / numpy / scipy classes (defence against malicious pickles)."""
    def find_class(self, module, name):
        if (module, name) in _ALLOWED_EXACT or module.split(".")[0] in _ALLOWED_MODULES:
            return super().find_class(module, name)
        raise ModelUnavailable(f"blocked object in model file: {module}.{name}")


class ModelService:
    def __init__(self):
        self.artifact = None; self.metrics = None; self.metadata = None
        self.error = None; self.version_warning = None; self._lock = threading.Lock()

    @property
    def loaded(self) -> bool: return self.artifact is not None

    def load(self, model_dir: Path) -> None:
        self.artifact = None
        try:
            path = Path(model_dir) / "real_fake_hog.joblib"
            if not path.is_file(): raise ModelUnavailable("model file not found")
            with warnings.catch_warnings(record=True) as w:
                warnings.simplefilter("always")
                with open(path, "rb") as f:
                    art = _SafeUnpickler(str(path), f, None).load()
            self.version_warning = next((str(x.message).split(".")[0] for x in w if "version" in str(x.message).lower()), None)
            self._validate(art)
            self.artifact = art
            for attr, fname in (("metrics", "metrics.json"), ("metadata", "metadata.json")):
                p = Path(model_dir) / fname
                setattr(self, attr, json.loads(p.read_text()) if p.is_file() else None)
            self.error = None
        except Exception as e:  # keep reason generic for clients; details stay in server logs
            self.error = type(e).__name__
            raise ModelUnavailable(str(e)) from e

    @staticmethod
    def _validate(art) -> None:
        if not isinstance(art, dict) or not {"model", "img_size", "label_map"} <= set(art):
            raise ModelUnavailable("unexpected artifact structure")
        m = art["model"]
        if not hasattr(m, "predict_proba") or set(getattr(m, "classes_", [])) != {0, 1}:
            raise ModelUnavailable("model must be a binary classifier with predict_proba")
        if {int(k): v for k, v in art["label_map"].items()} != {0: "FAKE", 1: "REAL"}:
            raise ModelUnavailable("unexpected label map")
        if getattr(m, "n_features_in_", None) != feature_dim(art["img_size"]):
            raise FeatureMismatch(f"model expects {getattr(m, 'n_features_in_', '?')} features, "
                                  f"extractor produces {feature_dim(art['img_size'])}")

    def predict(self, im: Image.Image) -> dict:
        if not self.loaded: raise ModelUnavailable("model not loaded")
        feats = extract_features(im, self.artifact["img_size"]).reshape(1, -1)
        if feats.shape[1] != self.artifact["model"].n_features_in_:
            raise FeatureMismatch("feature dimension mismatch")
        with self._lock:  # keep inference serialised per worker; the SVM is cheap
            m = self.artifact["model"]
            p_real = float(m.predict_proba(feats)[0, list(m.classes_).index(1)])
        return {"predicted_label": "REAL" if p_real >= 0.5 else "FAKE",  # 0.5 = notebook's threshold (not re-tuned)
                "scores": {"REAL": round(p_real, 4), "FAKE": round(1 - p_real, 4)}}

    def info(self) -> dict:
        m = self.artifact["model"]
        return {"model_name": self.artifact["model_name"], "ready": True,
                "pipeline": [type(s).__name__ for _, s in m.steps],
                "classes": {"0": "FAKE", "1": "REAL"}, "positive_class": "REAL",
                "feature_extraction": {"library": "Pillow + scikit-image", "image_size": self.artifact["img_size"],
                                       "resize": "centre-crop fit, bilinear, RGB", "hog": {"orientations": 9, "pixels_per_cell": 8, "cells_per_block": 2, "block_norm": "L2-Hys", "input": "grayscale"},
                                       "colour": "8x8x8 HSV histogram, sum-normalised", "feature_dim": feature_dim(self.artifact["img_size"])},
                "score_type": "model_score", "score_note": "Platt-scaled SVM output; not a calibrated probability that an image is authentic.",
                "decision_threshold": 0.5, "evaluation_metrics": self.metrics,
                "metrics_note": None if self.metrics else "No evaluation results have been supplied for this model, so none are shown.",
                "version_warning": self.version_warning}
