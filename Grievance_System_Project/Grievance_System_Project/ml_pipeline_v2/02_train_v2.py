"""
Step 2: Train classifiers on the new taxonomy-aligned dataset.

Two models, same TF-IDF (word + char n-gram) + Logistic Regression
approach as the first pipeline (proven to work well for multilingual
short text), now trained on the official 8,000-complaint dataset:

  - department: 9-class taxonomy from the AI routing system prompt
                (8 real departments + INVALID)
  - severity:   LOW / MEDIUM / HIGH (trained only on valid complaints —
                severity doesn't apply to non-complaints)
"""
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.metrics import classification_report, f1_score

train_df = pd.read_csv("train_v2.csv")
test_df = pd.read_csv("test_v2.csv")


def build_pipeline():
    word_vec = TfidfVectorizer(analyzer="word", ngram_range=(1, 2), min_df=2, sublinear_tf=True)
    char_vec = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=2, sublinear_tf=True)
    features = FeatureUnion([("word", word_vec), ("char", char_vec)])
    clf = LogisticRegression(max_iter=3000, class_weight="balanced", C=5)
    return Pipeline([("features", features), ("clf", clf)])


def train_department():
    print(f"\n{'='*60}\nTraining classifier for: department (9-class taxonomy)\n{'='*60}")
    X_train, y_train = train_df["complaint_text"], train_df["department"]
    X_test, y_test = test_df["complaint_text"], test_df["department"]

    pipe = build_pipeline()
    pipe.fit(X_train, y_train)

    preds = pipe.predict(X_test)
    print(classification_report(y_test, preds, digits=3, zero_division=0))
    macro_f1 = f1_score(y_test, preds, average="macro")
    print(f"Macro-F1: {macro_f1:.3f}")

    joblib.dump(pipe, "model_department_v2.joblib")
    return macro_f1


def train_severity():
    print(f"\n{'='*60}\nTraining classifier for: severity\n{'='*60}")
    train_valid = train_df[train_df["department"] != "INVALID"].dropna(subset=["severity"])
    test_valid = test_df[test_df["department"] != "INVALID"].dropna(subset=["severity"])

    X_train, y_train = train_valid["complaint_text"], train_valid["severity"]
    X_test, y_test = test_valid["complaint_text"], test_valid["severity"]

    pipe = build_pipeline()
    pipe.fit(X_train, y_train)

    preds = pipe.predict(X_test)
    print(classification_report(y_test, preds, digits=3, zero_division=0))
    macro_f1 = f1_score(y_test, preds, average="macro")
    print(f"Macro-F1: {macro_f1:.3f}")

    joblib.dump(pipe, "model_severity_v2.joblib")
    return macro_f1


if __name__ == "__main__":
    dept_f1 = train_department()
    sev_f1 = train_severity()
    print("\nSummary (macro-F1):")
    print(f"  department: {dept_f1:.3f}")
    print(f"  severity:   {sev_f1:.3f}")
