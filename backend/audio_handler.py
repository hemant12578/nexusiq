# audio stuff
# just delegates to gemini for now, maybe add whisper later
# webm is best for frontend

SUPPORTED_FORMATS = ["audio/webm", "audio/wav", "audio/mp3", "audio/ogg", "audio/mpeg"]

def validate_audio_format(mime_type: str) -> bool:
    return mime_type in SUPPORTED_FORMATS

def get_mime_type(filename: str) -> str:
    # guess mime from ext
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
