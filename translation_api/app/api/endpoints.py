"""
API route definitions for the translation service.

This module stays deliberately thin: it validates via Pydantic schemas,
delegates all actual work to the TranslationArchitecture instance (injected
as a dependency), and maps results/errors onto HTTP responses.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.ml.model import TranslationArchitecture
from app.schemas.payload import TranslationRequest, TranslationResponse

logger = logging.getLogger(__name__)
router = APIRouter()


def get_translation_model(request: Request) -> TranslationArchitecture:
    """
    Dependency provider that retrieves the shared TranslationArchitecture
    instance from application state.

    The model is instantiated exactly once, at app startup (see main.py),
    and stored on `app.state`. This function simply hands that same
    instance to each request handler, so no model weights are ever
    reloaded per-request.

    Args:
        request: The incoming FastAPI request, used to access `app.state`.

    Returns:
        The shared TranslationArchitecture instance.
    """
    return request.app.state.translation_model


@router.post(
    "/translate",
    response_model=TranslationResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect language and translate text into English",
)
def translate_text(
    payload: TranslationRequest,
    model: TranslationArchitecture = Depends(get_translation_model),
) -> TranslationResponse:
    """
    Detect the language of the input text and translate it into English.

    Args:
        payload: The validated request body containing the source text.
        model: The shared ML model instance, injected by FastAPI.

    Returns:
        A TranslationResponse containing the original text, the detected
        source language, and the English translation.

    Raises:
        HTTPException(400): If language detection or translation fails
                             due to malformed/unsupported input.
        HTTPException(500): For any unexpected internal error.
    """
    try:
        detected_language = model.detect_language(payload.text)
        english_translation = model.translate_to_english(
            text=payload.text, src_lang=detected_language
        )
    except ValueError as exc:
        # Raised deliberately by our ML layer for bad/unsupported input.
        logger.warning("Translation request rejected: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        # Anything unforeseen — don't leak internals to the client.
        logger.exception("Unexpected error during translation")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the translation.",
        )

    return TranslationResponse(
        original_text=payload.text,
        detected_language=detected_language,
        english_translation=english_translation,
    )