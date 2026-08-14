"""
Application configuration.

Centralizes all tunable settings (model identifiers, file paths, device
selection) in a single place. Values can be overridden via environment
variables at deploy time without touching source code, thanks to
pydantic-settings.
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central application settings.

    Attributes:
        NLLB_MODEL_ID: Hugging Face Hub identifier for the translation model.
        FASTTEXT_MODEL_PATH: Local filesystem path to the fastText language
                              identification weights (lid218e.bin).
        DEVICE: Compute device for PyTorch ("cuda" or "cpu"). Kept as a
                plain string here; the ML layer resolves it against
                actual hardware availability.
        MAX_INPUT_LENGTH: Safety cap on input text length (characters) to
                           prevent excessively long/expensive translation
                           requests.
    """

    NLLB_MODEL_ID: str = "facebook/nllb-200-distilled-600M"
    FASTTEXT_MODEL_PATH: str = str(
        Path(__file__).resolve().parent.parent.parent / "weights" / "lid218e.bin"
    )
    DEVICE: str = "cpu"
    MAX_INPUT_LENGTH: int = 2000

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


# A single, importable settings instance used throughout the app.
settings = Settings()