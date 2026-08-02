# hemant: we just pass audio straight to gemini now in gemini_engine.py
# keeping this around just in case we want to add local whisper later or something
# shubham tested the formats, webm is best for frontend

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
