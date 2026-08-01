"""Audio handler module for NexusIQ.

Audio transcription is handled directly via the Gemini multimodal API
in gemini_engine.py. This module provides utility functions for audio
format validation and preprocessing if needed in the future.
"""

SUPPORTED_FORMATS = ["audio/webm", "audio/wav", "audio/mp3", "audio/ogg", "audio/mpeg"]

def validate_audio_format(mime_type: str) -> bool:
    """Check if the audio format is supported by Gemini."""
    return mime_type in SUPPORTED_FORMATS

def get_mime_type(filename: str) -> str:
    """Infer MIME type from filename extension."""
    ext_map = {
        ".webm": "audio/webm",
        ".wav": "audio/wav",
        ".mp3": "audio/mp3",
        ".ogg": "audio/ogg",
    }
    for ext, mime in ext_map.items():
        if filename.lower().endswith(ext):
            return mime
    return "audio/webm"
