"""
Machine learning inference layer.

Wraps two models behind a single class:
  - fastText (lid218e.bin): fast, lightweight language identification.
  - NLLB-200 (distilled-600M): actual sequence-to-sequence translation.

Both models are loaded once, at process startup, and kept resident in
memory — loading them per-request would be prohibitively slow.
"""

import logging

import fasttext
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

from app.core.config import settings

logger = logging.getLogger(__name__)

# The target language for all translations, as a fixed FLORES-200 code.
ENGLISH_FLORES_CODE = "eng_Latn"


class TranslationArchitecture:
    """
    Loads and orchestrates the language-detection and translation models.

    This class is intended to be instantiated exactly once (at app
    startup) and reused across all incoming requests, since model
    loading is expensive and the models themselves are stateless
    with respect to inference calls.
    """

    def __init__(self) -> None:
        """
        Load the fastText language-identification model and the NLLB
        translation model + tokenizer into memory.

        Raises:
            RuntimeError: If either model fails to load, since the API
                          cannot serve any traffic without them.
        """
        try:
            logger.info("Loading fastText model from %s", settings.FASTTEXT_MODEL_PATH)
            self.lang_detector = fasttext.load_model(settings.FASTTEXT_MODEL_PATH)
        except Exception as exc:
            raise RuntimeError(f"Failed to load fastText model: {exc}") from exc

        try:
            logger.info("Loading NLLB model: %s", settings.NLLB_MODEL_ID)
            self.device = torch.device(
                settings.DEVICE if torch.cuda.is_available() or settings.DEVICE == "cpu" else "cpu"
            )
            self.tokenizer = AutoTokenizer.from_pretrained(settings.NLLB_MODEL_ID)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(settings.NLLB_MODEL_ID)
            self.model.to(self.device)
            self.model.eval()
        except Exception as exc:
            raise RuntimeError(f"Failed to load NLLB model: {exc}") from exc

        logger.info("TranslationArchitecture ready on device: %s", self.device)

    def detect_language(self, text: str) -> str:
        """
        Detect the source language of the given text using fastText.

        Args:
            text: Raw input text. Newlines are stripped since fastText
                  treats them as example separators.

        Returns:
            The detected language as a FLORES-200 code (e.g., "fra_Latn").

        Raises:
            ValueError: If detection fails or returns no usable label.
        """
        cleaned_text = text.replace("\n", " ").strip()
        try:
            predictions, _confidence_scores = self.lang_detector.predict(cleaned_text, k=1)
            raw_label = predictions[0]  # e.g. "__label__fra_Latn"
            flores_code = raw_label.replace("__label__", "")
            return flores_code
        except Exception as exc:
            raise ValueError(f"Language detection failed: {exc}") from exc

    def translate_to_english(self, text: str, src_lang: str) -> str:
        """
        Translate text into English using NLLB, given a known source language.

        Args:
            text: The text to translate.
            src_lang: FLORES-200 code of the source language, as produced
                      by detect_language(). This is set dynamically on the
                      tokenizer for each request, since NLLB requires it
                      to correctly segment/tag the input.

        Returns:
            The translated English text.

        Raises:
            ValueError: If translation generation fails.
        """
        try:
            # Dynamically point the tokenizer at the detected source language.
            self.tokenizer.src_lang = src_lang

            inputs = self.tokenizer(text, return_tensors="pt").to(self.device)

            # Force generation to start with the English language token,
            # so output is always English regardless of the input language.
            forced_bos_token_id = self.tokenizer.convert_tokens_to_ids(ENGLISH_FLORES_CODE)

            with torch.no_grad():
                generated_tokens = self.model.generate(
                    **inputs,
                    forced_bos_token_id=forced_bos_token_id,
                    max_length=512,
                )

            translation = self.tokenizer.batch_decode(
                generated_tokens, skip_special_tokens=True
            )[0]
            return translation
        except Exception as exc:
            raise ValueError(f"Translation failed: {exc}") from exc