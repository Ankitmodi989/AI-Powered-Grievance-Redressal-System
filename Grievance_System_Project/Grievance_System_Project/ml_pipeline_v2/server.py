"""
Lightweight FastAPI server for Grievance_System_Project (v2 pipeline).
Serves instant predictions for department, severity, validity, and confidence gating.
"""
import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import importlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
predict_mod = importlib.import_module("03_predict_v2")
predict = predict_mod.predict

app = FastAPI(title="Grievance Redressal ML Service (v2)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextPayload(BaseModel):
    text: str

@app.get("/health")
def health():
    return {"status": "ok", "model": "ml_pipeline_v2"}

@app.post("/predict")
def predict_endpoint(payload: TextPayload):
    return predict(payload.text)

if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5001))
    print(f"Starting ML inference server on http://127.0.0.1:{port}")
    uvicorn.run(app, host="127.0.0.1", port=port)
