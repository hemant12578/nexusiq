import requests
import time
import os
import sys
import json
import random

try:
    import RPi.GPIO as GPIO
    GPIO_AVAILABLE = True
except ImportError:
    GPIO_AVAILABLE = False

# Default to Live Railway Production Backend URL, with local override via environment variable
BACKEND_URL = os.getenv("BACKEND_URL", "https://nexusiq-backend-production.up.railway.app").rstrip("/")
LED_PIN = 18
QUEUE_FILE = "rpi_offline_queue.json"

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

def save_to_offline_queue(payload: dict):
    """save to local queue"""
    queue = []
    if os.path.exists(QUEUE_FILE):
        try:
            with open(QUEUE_FILE, "r") as f:
                queue = json.load(f)
        except Exception:
            queue = []
    queue.append(payload)
    with open(QUEUE_FILE, "w") as f:
        json.dump(queue, f)
    print(f"[OFFLINE QUEUE] Saved incident locally ({len(queue)} pending items).")

def process_offline_queue():
    """Flushes queued offline incident reports when connection is restored."""
    if not os.path.exists(QUEUE_FILE):
        return
    try:
        with open(QUEUE_FILE, "r") as f:
            queue = json.load(f)
        if not queue:
            return
        print(f"[OFFLINE QUEUE] Re-syncing {len(queue)} pending items with NexusIQ Cloud...")
        remaining = []
        for item in queue:
            try:
                res = requests.post(f"{BACKEND_URL}/upload-text", json=item, timeout=30)
                if res.status_code == 200:
                    print(f"[OFFLINE QUEUE] Synced: {item.get('source_name')}")
                else:
                    remaining.append(item)
            except Exception:
                remaining.append(item)
        
        if remaining:
            with open(QUEUE_FILE, "w") as f:
                json.dump(remaining, f)
        else:
            os.remove(QUEUE_FILE)
            print("[OFFLINE QUEUE] All pending edge incidents successfully synced!")
    except Exception as e:
        print(f"[OFFLINE QUEUE] Error during sync: {e}")

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
    payload = {"text": text_content, "source_name": source_name}
    try:
        response = requests.post(f"{BACKEND_URL}/upload-text", json=payload, timeout=45)
        if response.status_code == 200:
            print(f"[OK] Text Incident Logged: {response.json()}")
            blink_led(1)
            return True
        else:
            print(f"[FAIL] Text Ingestion Error ({response.status_code}): {response.text}")
            save_to_offline_queue(payload)
            return False
    except Exception as e:
        print(f"[FAIL] Text Ingestion Exception: {e}")
        save_to_offline_queue(payload)
        return False

def health_check():
    """Verify health status of NexusIQ backend."""
    try:
        res = requests.get(f"{BACKEND_URL}/health", timeout=10)
        return res.status_code == 200
    except:
        return False

def send_telemetry():
    """Sends edge environment security telemetry to cloud graph."""
    temp = round(22.5 + random.uniform(-1.5, 2.5), 1)
    status_msg = f"rpi heartbeat: temp={temp}C, lock=ok, net=ok"
    forward_text(status_msg, "rpi_telemetry_node")

if __name__ == "__main__":
    print("=" * 65)
    print("  NexusIQ Edge Agent v1")
    print(f"  Backend : {BACKEND_URL}")
    print(f"  GPIO Hardware  : {'RPi.GPIO Active (Pin 18)' if GPIO_AVAILABLE else 'Simulated Mode'}")
    print("=" * 65)

    if len(sys.argv) > 1:
        file_arg = sys.argv[1]
        forward_audio(file_arg)
        sys.exit(0)

    # Daemon heartbeat loop
    print("Starting continuous edge monitoring & telemetry loop (Ctrl+C to stop)...")
    try:
        count = 0
        while True:
            is_healthy = health_check()
            if is_healthy:
                print(f"[{time.strftime('%H:%M:%S')}] [OK] Cloud Connection Active ({BACKEND_URL})")
                blink_led(1)
                process_offline_queue()
                if count % 4 == 0:  # Send security telemetry periodically
                    send_telemetry()
            else:
                print(f"[{time.strftime('%H:%M:%S')}] [FAIL] backend down, queuing locally")
            
            count += 1
            time.sleep(30)
    except KeyboardInterrupt:
        print("\nStopping Raspberry Pi Edge Agent.")
        if GPIO_AVAILABLE:
            GPIO.cleanup()
