# Grievance Classification — ML Pipeline

Predicts **department** and **priority** for civic complaints from raw
text, in English, Hindi, and Hinglish.

## Why these targets
- `department` (8 classes) and `priority` (4 classes) are directly
  inferable from complaint text and are what an intake system actually
  needs to predict.
- `route_to` is intentionally **not** modeled — it has 760 near-unique
  values and is just `department + location`. Predict `department`,
  then resolve `route_to` with a lookup table keyed on
  (department, location) — that's a data-join problem, not an ML one.

## Files
| File | Purpose |
|---|---|
| `01_preprocess.py` | Cleans text, drops dupes, stratified 85/15 split |
| `02_train_baseline.py` | TF-IDF (word + char n-grams) + Logistic Regression, one model per target |
| `03_predict.py` | Load saved models, run inference on new text |
| `04_train_transformer_optional.py` | XLM-RoBERTa fine-tuning — next step for higher accuracy, needs GPU + internet |
| `model_department.joblib`, `model_priority.joblib` | Trained baseline models |

## Run it
```bash
pip install -r requirements.txt
python 01_preprocess.py
python 02_train_baseline.py
python 03_predict.py "Ward 12 mein paani ki supply nahi aa rahi hai."
```

## Results (held-out test set, 600 rows)
| Target | Macro-F1 |
|---|---|
| department | 1.000 |
| priority | 0.896 |

`department` is near-perfect because complaint text names the topic
directly (e.g. "street light", "paani/water"). `priority` is harder —
it depends on urgency language/context, not just topic keywords. The
weakest class is `low` (smallest class, 524 rows, F1≈0.81).

## Why TF-IDF + char n-grams as the baseline
Character n-grams (3–5 chars) capture sub-word patterns that work
across Latin and Devanagari script and across Hinglish code-switching,
without needing separate language-specific pipelines or translation.
This is fast to train (seconds, CPU-only) and a strong baseline to beat.

## Next steps to push accuracy further
1. **Fine-tune XLM-RoBERTa** (`04_train_transformer_optional.py`) —
   better handles code-switched Hinglish and paraphrased urgency cues
   than bag-of-words features. Expect the biggest gain on `priority`.
2. **More `low`-priority examples** — it's the smallest class and the
   weakest-performing one; targeted data collection or augmentation
   would help.
3. **Class-balanced sampling / focal loss** if `priority` imbalance
   persists after more data.
4. **Multi-task model** — a single transformer with two classification
   heads (department + priority) sharing the encoder, instead of two
   separate models — often improves both via shared representations.
5. **Calibrate confidence scores** (Platt scaling / temperature
   scaling) before using `predict_proba` thresholds in production,
   e.g. to route low-confidence predictions to human review.

## Deployment note
The baseline `.joblib` models are lightweight and CPU-only — good for
a low-latency API. `03_predict.py` shows the inference pattern
(predict + confidence) needed to wire this into a routing service.
