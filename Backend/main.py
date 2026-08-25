# main.py — Monagrid FastAPI Backend
# Binary solar panel classifier: 0 = Healthy, 1 = Faulty
# Model: ResNet-18 fine-tuned, saved as best_binary_resnet18.pth

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
from typing import List

# ─────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "best_binary_resnet18.pth"

# ─────────────────────────────────────────────
# Class definitions
# ─────────────────────────────────────────────
CLASS_NAMES = {0: "Healthy", 1: "Faulty"}
CLASS_DESCRIPTIONS = {
    0: "The solar panel is operating within normal parameters. No visible defect detected.",
    1: "A fault has been detected on this solar panel. Immediate inspection is recommended.",
}
CLASS_SEVERITY = {0: "ok", 1: "critical"}

# ─────────────────────────────────────────────
# Model loading
# ─────────────────────────────────────────────
def build_model() -> nn.Module:
    """Build a ResNet-18 with a 2-class output head (binary classifier)."""
    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, 2)  # 2 output classes: Healthy / Faulty
    return model


def load_model(device: torch.device) -> nn.Module:
    """Load weights from disk and put model in eval mode."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model file not found at: {MODEL_PATH}\n"
            "Make sure best_binary_resnet18.pth is inside Backend/model/"
        )
    model = build_model()
    state_dict = torch.load(MODEL_PATH, map_location=device)

    # Support both raw state_dict and checkpoint dicts ({"model_state_dict": ...})
    if isinstance(state_dict, dict) and "model_state_dict" in state_dict:
        state_dict = state_dict["model_state_dict"]

    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    return model


# ─────────────────────────────────────────────
# Image pre-processing — standard ImageNet pipeline
# ─────────────────────────────────────────────
TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])


def preprocess(image_bytes: bytes) -> torch.Tensor:
    """Convert raw bytes → normalised tensor (1, 3, 224, 224)."""
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    tensor = TRANSFORM(image).unsqueeze(0)   # add batch dim
    return tensor


def run_inference(tensor: torch.Tensor, device: torch.device):
    """Run a single forward pass and return (class_index, confidence, probabilities)."""
    tensor = tensor.to(device)
    with torch.no_grad():
        logits = MODEL(tensor)                      # shape: (1, 2)
        probs = torch.softmax(logits, dim=1)[0]     # shape: (2,)
        class_idx = int(torch.argmax(probs).item())
        confidence = float(probs[class_idx].item())
        prob_list = [float(p.item()) for p in probs]
    return class_idx, confidence, prob_list


# ─────────────────────────────────────────────
# FastAPI setup
# ─────────────────────────────────────────────
app = FastAPI(
    title="Monagrid API",
    description="Binary solar panel fault detection: Healthy (0) vs Faulty (1)",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Tighten this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model / device (loaded on startup)
DEVICE = torch.device("cpu")  # swap to "cuda" if GPU available
MODEL: nn.Module = None


@app.on_event("startup")
async def startup_event():
    global MODEL
    print("Loading Monagrid binary classifier...")
    MODEL = load_model(DEVICE)
    print(f"Model loaded successfully from: {MODEL_PATH}")


# ─────────────────────────────────────────────
# Response schemas
# ─────────────────────────────────────────────
class PredictionResult(BaseModel):
    class_index: int
    label: str          # "Healthy" or "Faulty"
    confidence: float   # 0.0 – 1.0
    confidence_pct: str # e.g. "94.37%"
    severity: str       # "ok" or "critical"
    description: str
    probabilities: dict # {"Healthy": 0.9437, "Faulty": 0.0563}


class BatchResult(BaseModel):
    filename: str
    prediction: PredictionResult
    error: str | None = None


# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "service": "Monagrid Solar Panel Classifier",
        "version": "2.0.0",
        "status": "running",
        "classes": CLASS_NAMES,
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "model_loaded": MODEL is not None}


@app.post("/predict", response_model=PredictionResult, tags=["Inference"])
async def predict_single(file: UploadFile = File(..., description="Solar panel image (JPG/PNG)")):
    """
    Upload a single solar panel image.
    Returns: class label (Healthy / Faulty), confidence, and probability breakdown.
    """
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet. Retry in a moment.")

    # Validate file type
    if file.content_type not in ("image/jpeg", "image/png", "image/jpg", "image/webp"):
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}. Use JPG or PNG.")

    try:
        image_bytes = await file.read()
        tensor = preprocess(image_bytes)
        class_idx, confidence, probs = run_inference(tensor, DEVICE)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    return PredictionResult(
        class_index=class_idx,
        label=CLASS_NAMES[class_idx],
        confidence=round(confidence, 4),
        confidence_pct=f"{confidence * 100:.2f}%",
        severity=CLASS_SEVERITY[class_idx],
        description=CLASS_DESCRIPTIONS[class_idx],
        probabilities={
            CLASS_NAMES[i]: round(float(probs[i]), 4)
            for i in range(len(probs))
        },
    )


@app.post("/predict/batch", response_model=List[BatchResult], tags=["Inference"])
async def predict_batch(files: List[UploadFile] = File(..., description="Multiple solar panel images")):
    """
    Upload multiple solar panel images for fleet batch analysis.
    Returns a list of predictions — one per uploaded image.
    """
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet. Retry in a moment.")

    if len(files) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 images per batch request.")

    results: List[BatchResult] = []

    for upload in files:
        try:
            image_bytes = await upload.read()
            tensor = preprocess(image_bytes)
            class_idx, confidence, probs = run_inference(tensor, DEVICE)

            prediction = PredictionResult(
                class_index=class_idx,
                label=CLASS_NAMES[class_idx],
                confidence=round(confidence, 4),
                confidence_pct=f"{confidence * 100:.2f}%",
                severity=CLASS_SEVERITY[class_idx],
                description=CLASS_DESCRIPTIONS[class_idx],
                probabilities={
                    CLASS_NAMES[i]: round(float(probs[i]), 4)
                    for i in range(len(probs))
                },
            )
            results.append(BatchResult(filename=upload.filename, prediction=prediction))

        except Exception as e:
            # Don't abort entire batch — log the error per image
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
                ),
                error=str(e),
            ))

    return results
