# Grievance System Project — Full Package

## Contents

**`presentation/`**
Final PPTX for your project presentation (16 slides — architecture, data
flow, methodology, live app screenshots, model results, references).

**`ml_pipeline_v1/`**
First baseline model — trained on a 3,996-row sample dataset with 8
project-specific departments + priority (critical/high/medium/low).
Department macro-F1 = 1.000, priority macro-F1 = 0.896.
Includes an optional XLM-RoBERTa fine-tuning script for future work.

**`ml_pipeline_v2/`**
Retrained model on the official 8,000-row dataset, with departments
mapped to the 9-category taxonomy used by your AI routing system prompt
(includes an INVALID class for non-complaints). Department accuracy =
83.5% (macro-F1 0.649), severity accuracy = 80.7% (macro-F1 0.719).
Read `ml_pipeline_v2/README_v2.md` for the honest limitations section —
worth reviewing before your viva, especially the ML-vs-LLM trade-off on
adversarial input.

## Which model to use going forward

`ml_pipeline_v2` is the one aligned with your actual system prompt and
official dataset — use that as the "current" model. Keep `ml_pipeline_v1`
for reference / comparison, since it shows the department classification
task performing at 100% on a cleaner, smaller sample — useful context for
explaining why v2's numbers look different (harder, real-world, imbalanced
data) rather than worse.

## Quick start (either pipeline)
```bash
cd ml_pipeline_v2
pip install -r requirements.txt
python 03_predict_v2.py "Meri gali me bahut kachra pada hua hai."
```
