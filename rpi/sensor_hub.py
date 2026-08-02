#!/usr/bin/env python3
"""
NexusIQ RPi Sensor Hub & Edge Gateway
Integrates ESP32 DHT11 temperature/humidity data + manual triggers
Team Nexus — Hemant & Shubham
"""

import json
import random
import requests
import socket
import threading
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer

API_URL = "https://nexusiq-backend-production.up.railway.app"
PORT = 5001
DEVICE_ID = socket.gethostname()

MANUAL_INCIDENTS = [
    ("Unauthorized badge scan at server room door. Employee ID not in approved list.", "RPi_BadgeScanner"),
    ("USB device insertion on workstation WS-042. Mass Storage type detected.", "RPi_USBMonitor"),
    ("Motion detected in restricted zone C during off-hours.", "RPi_MotionSensor"),
    ("Network intrusion attempt detected on perimeter firewall.", "RPi_NetworkMonitor"),
    ("UPS switched to battery mode. Mains power lost.", "RPi_PowerMonitor"),
]

def send_to_nexusiq(text: str, source: str):
    """Forward compliance text to NexusIQ backend API"""
    try:
        resp = requests.post(
            f"{API_URL}/upload-text",
            json={"text": text, "source_name": source},
            timeout=30
        )
        if resp.status_code == 200:
            res = resp.json()
            print(f"  └─ ✅ Synced to Graph RAG | Entities: {res.get('entities_found', 0)} | Relations: {res.get('relationships_found', 0)}")
        else:
            print(f"  └─ ⚠️  Backend HTTP {resp.status_code}")
    except Exception as e:
        print(f"  └─ ❌ Sync Failed: {e}")

class ESP32SensorHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/sensor":
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            try:
                data = json.loads(body)
                temp = float(data.get('temperature', 0))
                hum = float(data.get('humidity', 0))
                shutdown = bool(data.get('shutdown', False))
                device = data.get('device', 'ESP32_DHT11_Node')

                now = datetime.now().strftime("%H:%M:%S")
                print(f"\n📡 [{now}] ESP32 Data Received from {device}:")
                print(f"   ├─ Temperature: {temp}°C | Humidity: {hum}% | Shutdown: {shutdown}")

                if temp >= 32 and shutdown:
                    text = f"CRITICAL THERMAL INCIDENT: Data center node {device} temperature exceeded safety limit at {temp}°C (Threshold 32°C). Emergency hardware shutdown triggered at {now}. ISO 27001 A.11.2.1 Environmental Hazard breach. Escalated to CISO."
                    source = f"{device}_CRITICAL"
                    print("   └─ 🚨 CRITICAL: High Temperature Shutdown Triggered!")
                else:
                    text = f"Routine environmental log: Sensor node {device} reporting temperature {temp}°C and humidity {hum}% at {now}. All systems nominal. NIST SP 800-53 PE-14 check."
                    source = f"{device}_Telemetry"
                    print("   └─ 🟢 ROUTINE: Environmental Telemetry Logged")

                send_to_nexusiq(text, source)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status": "received"}')
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                print(f"   └─ ❌ Error parsing ESP32 payload: {e}")
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass  # Suppress standard HTTP request log lines for clean output

def run_server():
    server = HTTPServer(('0.0.0.0', PORT), ESP32SensorHandler)
    print(f"🌐 HTTP Gateway Listening for ESP32 on port {PORT}...")
    server.serve_forever()

def manual_input_loop():
    print("\nPress ENTER anytime to trigger a manual compliance incident...")
    while True:
        try:
            input()
            text_tmpl, source = random.choice(MANUAL_INCIDENTS)
            now = datetime.now().strftime("%H:%M:%S")
            full_text = f"Manual Edge Incident [{DEVICE_ID}] at {now}: {text_tmpl} ISO 27001 / NIST audit event."
            print(f"\n🔘 [{now}] Manual Incident Triggered:")
            print(f"   └─ Source: {source}")
            send_to_nexusiq(full_text, source)
        except (KeyboardInterrupt, EOFError):
            break

def main():
    print("=" * 60)
    print("🧠 NexusIQ RPi Edge Sensor Hub — ESP32 DHT11 Gateway")
    print(f"📡 RPi Hostname: {DEVICE_ID} | IP: 192.168.1.17")
    print(f"🌐 Listening on: http://192.168.1.17:{PORT}/sensor")
    print(f"☁️  Target Backend: {API_URL}")
    print("=" * 60)

    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    manual_input_loop()

if __name__ == "__main__":
    main()
