# main.py — Monagrid FastAPI Backend  v3.0
#
# Pipeline:
#   1. Binary classifier  → Healthy (0) | Faulty (1)
#   2. If Faulty → Multiclass classifier → fault type
#
# Binary classes:      Healthy=0, Faulty=1
# Multiclass classes:  Bird-drop=0, Dusty=1, Electrical-damage=2, Physical-Damage=3

import os
from pathlib import Path
from io import BytesIO

import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# ─────────────────────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────────────────────
BASE_DIR          = Path(__file__).resolve().parent
BINARY_MODEL_PATH = BASE_DIR / "model" / "best_binary_resnet18.pth"
MULTI_MODEL_PATH  = BASE_DIR / "model" / "best_multiclass_resnet18.pth"

# ─────────────────────────────────────────────────────────────
# Class definitions — Binary
# ─────────────────────────────────────────────────────────────
BINARY_CLASSES = {0: "Healthy", 1: "Faulty"}
BINARY_DESCRIPTIONS = {
    0: "The solar panel is operating within normal parameters. No visible defect detected.",
    1: "A fault has been detected on this solar panel. Immediate inspection is recommended.",
}
BINARY_SEVERITY = {0: "ok", 1: "critical"}

# ─────────────────────────────────────────────────────────────
# Class definitions — Multiclass (fault type)
# ─────────────────────────────────────────────────────────────
FAULT_CLASSES = {
    0: "Bird-drop",
    1: "Dusty",
    2: "Electrical-damage",
    3: "Physical-Damage",
}
FAULT_DESCRIPTIONS = {
    0: "Bird droppings detected on the panel surface. Clean the affected area to restore efficiency.",
    1: "Dust or dirt accumulation reducing panel efficiency. Cleaning is recommended.",
    2: "Electrical damage detected. A qualified technician should inspect the wiring and connections.",
    3: "Physical damage such as cracks or broken glass detected. Panel replacement may be required.",
}
FAULT_SEVERITY = {
    0: "moderate",
    1: "low",
    2: "critical",
    3: "critical",
}

# ─────────────────────────────────────────────────────────────
# Model factory
# ─────────────────────────────────────────────────────────────
def build_resnet18(num_classes: int) -> nn.Module:
    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    return model


def load_weights(model: nn.Module, path: Path, device: torch.device) -> nn.Module:
    if not path.exists():
        raise FileNotFoundError(f"Model file not found: {path}")
    state_dict = torch.load(path, map_location=device)
    # Support checkpoint dicts
    if isinstance(state_dict, dict) and "model_state_dict" in state_dict:
        state_dict = state_dict["model_state_dict"]
        
    # Handle the multiclass model which was saved with an nn.Sequential head (fc.1)
    if "fc.1.weight" in state_dict:
        state_dict["fc.weight"] = state_dict.pop("fc.1.weight")
        state_dict["fc.bias"] = state_dict.pop("fc.1.bias")
        # Also remove fc.0 if it exists (e.g. Dropout state which has no parameters)
        state_dict = {k: v for k, v in state_dict.items() if not k.startswith("fc.0.")}
        
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    return model

# ─────────────────────────────────────────────────────────────
# Image pre-processing — standard ImageNet pipeline
# ─────────────────────────────────────────────────────────────
TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])


def preprocess(image_bytes: bytes) -> torch.Tensor:
    """Convert raw bytes → normalised tensor (1, 3, 224, 224)."""
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    return TRANSFORM(image).unsqueeze(0)


def run_inference(tensor: torch.Tensor, model: nn.Module, device: torch.device):
    """Forward pass → (class_index, confidence, prob_list)."""
    tensor = tensor.to(device)
    with torch.no_grad():
        logits = model(tensor)
        probs  = torch.softmax(logits, dim=1)[0]
        idx    = int(torch.argmax(probs).item())
        conf   = float(probs[idx].item())
        prob_list = [float(p.item()) for p in probs]
    return idx, conf, prob_list

# ─────────────────────────────────────────────────────────────
# FastAPI application
# ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="Monagrid API",
    description=(
        "Two-stage solar panel fault detection.\n\n"
        "Stage 1 (Binary): Healthy (0) vs Faulty (1).\n"
        "Stage 2 (Multiclass — only if Faulty): Bird-drop (0) | Dusty (1) | "
        "Electrical-damage (2) | Physical-Damage (3)."
    ),
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Globals populated on startup
DEVICE: torch.device     = torch.device("cpu")
BINARY_MODEL: nn.Module  = None
MULTI_MODEL: nn.Module   = None


@app.on_event("startup")
async def startup_event():
    global BINARY_MODEL, MULTI_MODEL
    print("Loading Monagrid binary classifier...")
    BINARY_MODEL = load_weights(build_resnet18(2), BINARY_MODEL_PATH, DEVICE)
    print(f"Binary model loaded: {BINARY_MODEL_PATH}")

    print("Loading Monagrid multiclass fault classifier...")
    MULTI_MODEL = load_weights(build_resnet18(4), MULTI_MODEL_PATH, DEVICE)
    print(f"Multiclass model loaded: {MULTI_MODEL_PATH}")


# ─────────────────────────────────────────────────────────────
# Response schemas
# ─────────────────────────────────────────────────────────────
class FaultDetail(BaseModel):
    """Populated only when the binary classifier returns Faulty."""
    class_index: int
    label: str          # e.g. "Dusty"
    confidence: float
    confidence_pct: str
    severity: str       # "low" | "moderate" | "critical"
    description: str
    probabilities: dict # {"Bird-drop": 0.05, "Dusty": 0.82, ...}


class PredictionResult(BaseModel):
    # ── Binary result ──────────────────────────────
    class_index: int
    label: str          # "Healthy" | "Faulty"
    confidence: float
    confidence_pct: str
    severity: str       # "ok" | "critical"
    description: str
    probabilities: dict # {"Healthy": 0.95, "Faulty": 0.05}
    # ── Fault detail (None when Healthy) ───────────
    fault_detail: Optional[FaultDetail] = None


class BatchResult(BaseModel):
    filename: str
    prediction: PredictionResult
    error: Optional[str] = None


# ─────────────────────────────────────────────────────────────
# Helper — full two-stage pipeline for one image
# ─────────────────────────────────────────────────────────────
def analyse_image(image_bytes: bytes) -> PredictionResult:
    tensor = preprocess(image_bytes)

    # Stage 1 — binary
    bin_idx, bin_conf, bin_probs = run_inference(tensor, BINARY_MODEL, DEVICE)

    result = PredictionResult(
        class_index   = bin_idx,
        label         = BINARY_CLASSES[bin_idx],
        confidence    = round(bin_conf, 4),
        confidence_pct= f"{bin_conf * 100:.2f}%",
        severity      = BINARY_SEVERITY[bin_idx],
        description   = BINARY_DESCRIPTIONS[bin_idx],
        probabilities = {
            BINARY_CLASSES[i]: round(float(bin_probs[i]), 4)
            for i in range(len(bin_probs))
        },
        fault_detail  = None,
    )

    # Stage 2 — multiclass (only if Faulty)
    if bin_idx == 1:
        fault_idx, fault_conf, fault_probs = run_inference(tensor, MULTI_MODEL, DEVICE)
        result.fault_detail = FaultDetail(
            class_index   = fault_idx,
            label         = FAULT_CLASSES[fault_idx],
            confidence    = round(fault_conf, 4),
            confidence_pct= f"{fault_conf * 100:.2f}%",
            severity      = FAULT_SEVERITY[fault_idx],
            description   = FAULT_DESCRIPTIONS[fault_idx],
            probabilities = {
                FAULT_CLASSES[i]: round(float(fault_probs[i]), 4)
                for i in range(len(fault_probs))
            },
        )

    return result


# ─────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "service": "Monagrid Solar Panel Classifier",
        "version": "3.0.0",
        "status": "running",
        "binary_classes": BINARY_CLASSES,
        "fault_classes": FAULT_CLASSES,
    }


@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "binary_model_loaded": BINARY_MODEL is not None,
        "multiclass_model_loaded": MULTI_MODEL is not None,
    }


@app.post("/predict", response_model=PredictionResult, tags=["Inference"])
async def predict_single(
    file: UploadFile = File(..., description="Solar panel image (JPG/PNG)")
):
    """
    Two-stage inference on a single image.
    - Stage 1: Healthy vs Faulty (binary).
    - Stage 2: If Faulty → Bird-drop | Dusty | Electrical-damage | Physical-Damage.
    """
    if BINARY_MODEL is None or MULTI_MODEL is None:
        raise HTTPException(status_code=503, detail="Models not loaded yet. Retry in a moment.")

    if file.content_type not in ("image/jpeg", "image/png", "image/jpg", "image/webp"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Use JPG or PNG."
        )

    try:
        image_bytes = await file.read()
        return analyse_image(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@app.post("/predict/batch", response_model=List[BatchResult], tags=["Inference"])
async def predict_batch(
    files: List[UploadFile] = File(..., description="Multiple solar panel images")
):
    """
    Two-stage inference on a batch of images (max 50).
    Each image goes through the binary classifier first, then the fault classifier if needed.
    """
    if BINARY_MODEL is None or MULTI_MODEL is None:
        raise HTTPException(status_code=503, detail="Models not loaded yet. Retry in a moment.")

    if len(files) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 images per batch request.")

    results: List[BatchResult] = []

    for upload in files:
        try:
            image_bytes = await upload.read()
            prediction  = analyse_image(image_bytes)
            results.append(BatchResult(filename=upload.filename, prediction=prediction))
        except Exception as e:
            results.append(BatchResult(
                filename=upload.filename,
                prediction=PredictionResult(
                    class_index=-1,
                    label="Error",
                    confidence=0.0,
                    confidence_pct="0.00%",
                    severity="error",
                    description=str(e),
                    probabilities={},
                    fault_detail=None,
                ),
                error=str(e),
            ))

    return results
