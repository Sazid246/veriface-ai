"""Feature extraction mirroring `extract_features` in notebooks/real_fake.ipynb.
Uses Pillow + scikit-image (the notebook does NOT use OpenCV; OpenCV's HSV scale differs and would change the features)."""
import numpy as np
from PIL import Image, ImageOps
from skimage.feature import hog

IMG_SIZE, HOG_CELL, HOG_BLOCK, HOG_BINS, HSV_BINS = 128, 8, 2, 9, 8


def feature_dim(img_size: int = IMG_SIZE) -> int:
    n = img_size // HOG_CELL - HOG_BLOCK + 1
    return n * n * HOG_BLOCK ** 2 * HOG_BINS + HSV_BINS ** 3


def extract_features(im: Image.Image, img_size: int = IMG_SIZE) -> np.ndarray:
    im = ImageOps.fit(im.convert("RGB"), (img_size, img_size), method=Image.BILINEAR)
    gray = np.asarray(im.convert("L"), dtype=np.float32) / 255.0
    hsv = np.asarray(im.convert("HSV")).reshape(-1, 3)
    h = hog(gray, orientations=HOG_BINS, pixels_per_cell=(HOG_CELL, HOG_CELL),
            cells_per_block=(HOG_BLOCK, HOG_BLOCK), block_norm="L2-Hys", feature_vector=True).astype(np.float32)
    c, _ = np.histogramdd(hsv, bins=(HSV_BINS,) * 3, range=((0, 256),) * 3)
    c = c.ravel().astype(np.float32)
    c /= c.sum() + 1e-7
    return np.concatenate([h, c])
