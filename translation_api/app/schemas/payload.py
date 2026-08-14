"""
Pydantic schemas for the translation API.

These models define the request/response contracts for the /translate
endpoint. FastAPI uses them to:
  1. Validate incoming request bodies automatically.
  2. Serialize outgoing responses into a predictable JSON shape.
  3. Auto-generate OpenAPI (Swagger) documentation.
"""

from pydantic import BaseModel, Field


class TranslationRequest(BaseModel):
    """
    Schema for an incoming translation request.

    Attributes:
        text: The raw input text in any supported language that the
              client wants translated into English.
    """

    text: str = Field(
        ...,
        min_length=1,
        description="The source text to be translated into English.",
        examples=["Bonjour, comment allez-vous?"],
    )


class TranslationResponse(BaseModel):
    """
    Schema for the API's response after translation.

    Attributes:
        original_text: The exact text the client submitted (echoed back
                        so the response is self-contained for logging/debugging).
        detected_language: The FLORES-200 language code detected by fastText
                            (e.g., "fra_Latn" for French).
        english_translation: The resulting English translation from NLLB.
    """

    original_text: str
    detected_language: str
    english_translation: str