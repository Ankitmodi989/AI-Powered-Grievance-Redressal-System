"""
Step 3: Inference for the v2 (taxonomy-aligned) models.

Mirrors the system prompt's output shape (is_valid_complaint, department,
confidence) but backed by a trained classifier instead of an LLM call.

Usage:
    python 03_predict_v2.py "Meri gali me bahut kachra pada hua hai."
"""
import os
import sys
import json
import warnings
import joblib

warnings.filterwarnings("ignore")

CONFIDENCE_THRESHOLD = 0.6
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

dept_model = joblib.load(os.path.join(BASE_DIR, "model_department_v2.joblib"))
severity_model = joblib.load(os.path.join(BASE_DIR, "model_severity_v2.joblib"))


def predict(text: str):
    department = dept_model.predict([text])[0]
    dept_conf = float(dept_model.predict_proba([text]).max())
    is_valid = department != "INVALID"

    result = {
        "is_valid_complaint": is_valid,
        "department": department if is_valid else "INVALID",
        "department_confidence": round(dept_conf, 3),
        "needs_review": dept_conf < CONFIDENCE_THRESHOLD,
    }

    if is_valid:
        severity = severity_model.predict([text])[0]
        sev_conf = float(severity_model.predict_proba([text]).max())
        result["severity"] = severity
        result["severity_confidence"] = round(sev_conf, 3)
        if sev_conf < CONFIDENCE_THRESHOLD:
            result["needs_review"] = True
    else:
        result["severity"] = None
        result["severity_confidence"] = None

    return result


if __name__ == "__main__":
    is_json = "--json" in sys.argv
    args = [a for a in sys.argv[1:] if a != "--json"]
    text = args[0] if len(args) > 0 else "Meri gali me bahut kachra pada hua hai."
    result = predict(text)
    if is_json:
        print(json.dumps(result, ensure_ascii=False))
    else:
        print(f"Text: {text}")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        if result["needs_review"]:
            print("\n  >>> FLAGGED: send to human review queue instead of auto-routing.")
