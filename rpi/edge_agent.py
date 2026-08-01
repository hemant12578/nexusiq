import requests
import time
import os
import sys

try:
    import RPi.GPIO as GPIO
    GPIO_AVAILABLE = True
except ImportError:
    GPIO_AVAILABLE = False

# Default to Live Railway Production Backend URL, with local override via environment variable
BACKEND_URL = os.getenv("BACKEND_URL", "https://nexusiq-backend-production.up.railway.app").rstrip("/")
LED_PIN = 18

if GPIO_AVAILABLE:
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(LED_PIN, GPIO.OUT)

def blink_led(times=3):
    """Blink physical GPIO LED or print simulated blink."""
    if not GPIO_AVAILABLE:
        print(f"[Simulated LED] Blink {times} times")
        return
    for _ in range(times):
        GPIO.output(LED_PIN, GPIO.HIGH)
        time.sleep(0.2)
        GPIO.output(LED_PIN, GPIO.LOW)
        time.sleep(0.2)

def forward_audio(audio_path: str):
    """Upload audio incident log from Raspberry Pi to NexusIQ backend."""
    if not os.path.exists(audio_path):
        print(f"[FAIL] File not found: {audio_path}")
        return False
    
    print(f"Uploading audio incident {audio_path} to {BACKEND_URL}...")
    blink_led(2)
    try:
        with open(audio_path, "rb") as f:
            files = {"file": (os.path.basename(audio_path), f, "audio/webm")}
            response = requests.post(f"{BACKEND_URL}/upload-audio", files=files, timeout=60)
            if response.status_code == 200:
                print(f"[OK] Audio Forwarded Successfully: {response.json()}")
                blink_led(1)
                return True
            else:
                print(f"[FAIL] Audio Upload Error ({response.status_code}): {response.text}")
                return False
    except Exception as e:
        print(f"[FAIL] Audio Upload Exception: {e}")
        return False

def forward_text(text_content: str, source_name="rpi_sensor"):
    """Upload text incident report from Raspberry Pi sensor to NexusIQ backend."""
    print(f"Uploading text incident to {BACKEND_URL}...")
    blink_led(2)
    try:
        payload = {"text": text_content, "source_name": source_name}
        response = requests.post(f"{BACKEND_URL}/upload-text", json=payload, timeout=45)
        if response.status_code == 200:
            print(f"[OK] Text Incident Logged: {response.json()}")
            blink_led(1)
            return True
        else:
            print(f"[FAIL] Text Ingestion Error ({response.status_code}): {response.text}")
            return False
    except Exception as e:
        print(f"[FAIL] Text Ingestion Exception: {e}")
        return False

def health_check():
    """Verify health status of NexusIQ backend."""
    try:
        res = requests.get(f"{BACKEND_URL}/health", timeout=10)
        return res.status_code == 200
    except:
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("  NexusIQ Raspberry Pi Edge Agent")
    print(f"  Backend URL : {BACKEND_URL}")
    print(f"  GPIO Hardware: {'RPi.GPIO Active' if GPIO_AVAILABLE else 'Simulated Mode'}")
    print("=" * 60)

    # Check CLI arguments for manual upload
    if len(sys.argv) > 1:
        file_arg = sys.argv[1]
        forward_audio(file_arg)
        sys.exit(0)

    # Daemon heartbeat loop
    print("Starting continuous edge monitoring loop (Ctrl+C to stop)...")
    try:
        while True:
            if health_check():
                print(f"[{time.strftime('%H:%M:%S')}] [OK] Backend Connection Active ({BACKEND_URL})")
                blink_led(1)
            else:
                print(f"[{time.strftime('%H:%M:%S')}] [FAIL] Backend Unreachable")
            time.sleep(30)
    except KeyboardInterrupt:
        print("\nStopping Raspberry Pi Edge Agent.")
        if GPIO_AVAILABLE:
            GPIO.cleanup()
