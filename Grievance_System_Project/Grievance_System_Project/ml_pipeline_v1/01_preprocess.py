"""
Step 1: Load, clean, and split the grievance dataset.

Targets:
  - department  (8 classes)   -> primary target
  - priority    (4 classes)   -> secondary target

`route_to` is dropped as an ML target: it has 760 near-unique values
and is really just `department + location` (a lookup table), not
something a text classifier should learn to predict directly.
Once `department` is predicted, `route_to` can be resolved with a
simple department+location lookup in the surrounding application.
"""
import pandas as pd
import re
from sklearn.model_selection import train_test_split

RAW_PATH = "/mnt/user-data/uploads/grievance_model_dataset.csv"
OUT_TRAIN = "train.csv"
OUT_TEST = "test.csv"


def clean_text(t: str) -> str:
    t = str(t).strip()
    t = re.sub(r"\s+", " ", t)          # collapse whitespace
    t = re.sub(r"[^\w\s.,?!\u0900-\u097F]", " ", t)  # keep Devanagari + basic punct
    t = re.sub(r"\s+", " ", t).strip()
    return t


def main():
    df = pd.read_csv(RAW_PATH)

    # Basic cleaning
    df["complaint_text"] = df["complaint_text"].apply(clean_text)
    df = df[df["complaint_text"].str.len() > 5].copy()

    # Drop exact duplicate texts (keep first)
    before = len(df)
    df = df.drop_duplicates(subset=["complaint_text"]).reset_index(drop=True)
    print(f"Dropped {before - len(df)} duplicate rows")

    # Keep only the columns needed for modeling
    keep_cols = ["complaint_text", "language", "location", "department", "priority"]
    df = df[keep_cols]

    # Stratify on department (priority is imbalanced with rare 'low', so
    # department is the safer stratification key with 8 balanced classes)
    train_df, test_df = train_test_split(
        df, test_size=0.15, random_state=42, stratify=df["department"]
    )

    train_df.to_csv(OUT_TRAIN, index=False)
    test_df.to_csv(OUT_TEST, index=False)

    print(f"Train: {len(train_df)}  Test: {len(test_df)}")
    print("\nDepartment distribution (train):")
    print(train_df["department"].value_counts())
    print("\nPriority distribution (train):")
    print(train_df["priority"].value_counts())


if __name__ == "__main__":
    main()
