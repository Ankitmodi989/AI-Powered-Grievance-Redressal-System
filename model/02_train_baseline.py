"""
Step 2: Baseline model — TF-IDF features + Linear classifiers.

Why this baseline first:
  - Fast to train (seconds), no GPU needed, easy to deploy.
  - Character n-grams (3-5 chars) work well across English, Hindi
    (Devanagari) and Hinglish (romanized Hindi) simultaneously,
    because they capture sub-word patterns regardless of script,
    without needing separate per-language pipelines.
  - Gives a strong reference score to beat with a transformer later.

Trains two independent classifiers (multi-task via two heads):
  - department  classifier
  - priority    classifier
"""
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, f1_score

train_df = pd.read_csv("train.csv")
test_df = pd.read_csv("test.csv")

X_train, X_test = train_df["complaint_text"], test_df["complaint_text"]


def build_pipeline():
    # word n-grams capture vocabulary/topic signal (works well for English)
    # char n-grams capture sub-word patterns (works well for Hindi/Hinglish)
    word_vec = TfidfVectorizer(analyzer="word", ngram_range=(1, 2), min_df=2, sublinear_tf=True)
    char_vec = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=2, sublinear_tf=True)
    from sklearn.pipeline import FeatureUnion
    features = FeatureUnion([("word", word_vec), ("char", char_vec)])
    clf = LogisticRegression(max_iter=2000, class_weight="balanced", C=5)
    return Pipeline([("features", features), ("clf", clf)])


def train_and_eval(target_col: str):
    print(f"\n{'='*60}\nTraining classifier for: {target_col}\n{'='*60}")
    y_train, y_test = train_df[target_col], test_df[target_col]

    pipe = build_pipeline()
    pipe.fit(X_train, y_train)

    preds = pipe.predict(X_test)
    print(classification_report(y_test, preds, digits=3))
    macro_f1 = f1_score(y_test, preds, average="macro")
    print(f"Macro-F1: {macro_f1:.3f}")

    joblib.dump(pipe, f"model_{target_col}.joblib")
    return pipe, macro_f1


if __name__ == "__main__":
    results = {}
    for target in ["department", "priority"]:
        _, f1 = train_and_eval(target)
        results[target] = f1

    print("\nSummary (macro-F1):")
    for k, v in results.items():
        print(f"  {k}: {v:.3f}")
