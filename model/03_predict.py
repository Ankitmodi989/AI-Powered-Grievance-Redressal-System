"""
Step 3: Inference — load saved models and predict on new complaint text.

Usage:
    python 03_predict.py "Street light pole in Banaswadi needs repair near bus stop."

Predictions below CONFIDENCE_THRESHOLD are flagged with needs_review=True
instead of being silently auto-routed. Tune the threshold to your own
risk tolerance: lower = fewer flags but more silent mistakes slip through,
higher = more flags but safer auto-routing.
"""
import sys
import joblib

# Tune this based on how much manual review capacity you have.
# 0.6 is a reasonable starting point — raise it if too many wrong
# predictions are still getting auto-routed, lower it if too many
# correct predictions are getting flagged unnecessarily.
CONFIDENCE_THRESHOLD = 0.6

dept_model = joblib.load("model_department.joblib")
priority_model = joblib.load("model_priority.joblib")


def predict(text: str):
    department = dept_model.predict([text])[0]
    priority = priority_model.predict([text])[0]

    dept_conf = float(dept_model.predict_proba([text]).max())
    priority_conf = float(priority_model.predict_proba([text]).max())

    # Flag if EITHER prediction is below threshold — a low-confidence
    # priority guess is just as risky to auto-route as a low-confidence
    # department guess.
    needs_review = dept_conf < CONFIDENCE_THRESHOLD or priority_conf < CONFIDENCE_THRESHOLD

    return {
        "department": department,
        "department_confidence": round(dept_conf, 3),
        "priority": priority,
        "priority_confidence": round(priority_conf, 3),
        "needs_review": needs_review,
    }


if __name__ == "__main__":
    text = sys.argv[1] if len(sys.argv) > 1 else "my street light is broken and needs to be fixed"
    result = predict(text)
    print(f"Text: {text}")
    for k, v in result.items():
        print(f"  {k}: {v}")
    if result["needs_review"]:
        print("\n  >>> FLAGGED: send to human review queue instead of auto-routing.")