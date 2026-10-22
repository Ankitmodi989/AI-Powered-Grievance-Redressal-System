"""
Step 4 (OPTIONAL — next step if you need higher `priority` accuracy
or better generalization to phrasing not seen in training).

Fine-tunes a multilingual transformer (XLM-RoBERTa) instead of TF-IDF.
XLM-R is pretrained on 100 languages including Hindi and English, so it
handles Hinglish code-switching far better than bag-of-words features
once fine-tuned, at the cost of needing a GPU and more training time.

Requires: pip install transformers datasets torch accelerate

NOTE: this needs internet access to download the pretrained checkpoint
(huggingface.co) and ideally a GPU. It was NOT run in this environment
because the sandbox network is restricted to package registries only —
run this on your own machine / Colab / cloud GPU.
"""
import pandas as pd
from datasets import Dataset
from sklearn.preprocessing import LabelEncoder
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
)
import numpy as np
from sklearn.metrics import f1_score

MODEL_NAME = "xlm-roberta-base"
TARGET = "department"  # change to "priority" for the second head

train_df = pd.read_csv("train.csv")
test_df = pd.read_csv("test.csv")

le = LabelEncoder()
train_df["label"] = le.fit_transform(train_df[TARGET])
test_df["label"] = le.transform(test_df[TARGET])

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

def tokenize(batch):
    return tokenizer(batch["complaint_text"], truncation=True, padding="max_length", max_length=64)

train_ds = Dataset.from_pandas(train_df[["complaint_text", "label"]]).map(tokenize, batched=True)
test_ds = Dataset.from_pandas(test_df[["complaint_text", "label"]]).map(tokenize, batched=True)

model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME, num_labels=len(le.classes_)
)

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {"macro_f1": f1_score(labels, preds, average="macro")}

args = TrainingArguments(
    output_dir=f"xlmr_{TARGET}",
    per_device_train_batch_size=16,
    per_device_eval_batch_size=32,
    num_train_epochs=4,
    learning_rate=2e-5,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="macro_f1",
)

trainer = Trainer(
    model=model,
    args=args,
    train_dataset=train_ds,
    eval_dataset=test_ds,
    compute_metrics=compute_metrics,
)

if __name__ == "__main__":
    trainer.train()
    print(trainer.evaluate())
    trainer.save_model(f"xlmr_{TARGET}_final")
    import joblib
    joblib.dump(le, f"label_encoder_{TARGET}.joblib")
