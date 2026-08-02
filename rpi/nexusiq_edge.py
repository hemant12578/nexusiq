#!/usr/bin/env python3
"""
NexusIQ Edge Agent — Raspberry Pi
Sends live compliance incidents to NexusIQ backend
Team Nexus — Hemant & Shubham
"""

import requests
import time
import random
import socket
from datetime import datetime

# === CONFIGURATION ===
API_URL = "https://nexusiq-backend-production.up.railway.app"
DEVICE_ID = socket.gethostname()
SEND_INTERVAL = 30  # seconds between auto-sends

# === INCIDENT TEMPLATES ===
INCIDENTS = [
    {
        "text": f"[RPi:{DEVICE_ID}] Unauthorized badge scan detected at server room door. Employee ID not in approved list. Timestamp: {{time}}. ISO 27001 A.11.1.2 Physical entry controls violated. Severity: HIGH. Auto-escalated to CISO.",
        "source": f"RPi_{DEVICE_ID}_BadgeScanner"
    },
    {
        "text": f"[RPi:{DEVICE_ID}] Temperature anomaly detected in data center rack B7. Current: {{temp}}°C, Threshold: 28°C. Timestamp: {{time}}. NIST SP 800-53 PE-14 Environmental controls breach.",
        "source": f"RPi_{DEVICE_ID}_ThermalSensor"
    },
    {
        "text": f"[RPi:{DEVICE_ID}] Network intrusion attempt on perimeter firewall. Source IP: 203.0.113.{{ip}}. Port scan on 22,80,443. Timestamp: {{time}}. PCI DSS Requirement 1.3.1 violated.",
        "source": f"RPi_{DEVICE_ID}_NetworkMonitor"
    },
    {
        "text": f"[RPi:{DEVICE_ID}] Motion detected in restricted zone C during off-hours. Timestamp: {{time}}. HIPAA Physical Safeguard violation. Security team dispatched.",
        "source": f"RPi_{DEVICE_ID}_MotionSensor"
    },
    {
        "text": f"[RPi:{DEVICE_ID}] USB device insertion on workstation WS-042. Device type: Mass Storage. Timestamp: {{time}}. SOC 2 CC6.1 violation. Device blocked.",
        "source": f"RPi_{DEVICE_ID}_USBMonitor"
    },
    {
        "text": f"[RPi:{DEVICE_ID}] Fire suppression test completed. Sprinkler zone 3 activated for 2.1s. Sensors nominal. Timestamp: {{time}}. ISO 27001 A.11.1.4 check PASSED.",
        "source": f"RPi_{DEVICE_ID}_FireSystem"
    },
    {
        "text": f"[RPi:{DEVICE_ID}] UPS switched to battery. Mains power lost at {{time}}. Generator startup: 4.8s. Load: 73%. NIST SP 800-53 PE-11 — switchover exceeded 3s SLA.",
        "source": f"RPi_{DEVICE_ID}_PowerMonitor"
    },
    {
        "text": f"[RPi:{DEVICE_ID}] Visitor badge {{visitor_id}} expired but holder on premises in Zone A. Last scan: {{time}}. GDPR Article 32 violated.",
        "source": f"RPi_{DEVICE_ID}_VisitorMgmt"
    }
]

def send_incident():
    incident = random.choice(INCIDENTS)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    text = incident["text"].format(
        time=now,
        temp=round(random.uniform(29.5, 35.2), 1),
        ip=random.randint(10, 250),
        visitor_id=f"VIS-{random.randint(1000, 9999)}"
    )
    try:
        resp = requests.post(
            f"{API_URL}/upload-text",
            json={"text": text, "source_name": incident["source"]},
            timeout=15
        )
        data = resp.json()
        print(f"✅ [{now}] Sent from {incident['source']}")
        print(f"   Entities: {data.get('entities_found', '?')}, Relations: {data.get('relationships_found', '?')}")
        return True
    except Exception as e:
        print(f"❌ [{now}] Failed: {e}")
        return False

def main():
    print("=" * 50)
    print("🔌 NexusIQ Edge Agent — Raspberry Pi")
    print(f"📡 Device: {DEVICE_ID}")
    print(f"🌐 Backend: {API_URL}")
    print("=" * 50)

    try:
        r = requests.get(f"{API_URL}/health", timeout=5)
        print(f"✅ Backend connected! Status: {r.json().get('status')}")
    except:
        print("⚠️  Backend not reachable, will retry on send")

    print("\nPress ENTER to send incident, or wait for auto-send...\n")

    if SEND_INTERVAL > 0:
        import threading
        def auto_send():
            while True:
                time.sleep(SEND_INTERVAL)
                print("\n🔄 Auto-sending incident...")
                send_incident()
        t = threading.Thread(target=auto_send, daemon=True)
        t.start()

    while True:
        try:
            input(">>> Press ENTER to send incident ")
            send_incident()
        except KeyboardInterrupt:
            print("\n👋 Edge agent stopped.")
            break

if __name__ == "__main__":
    main()
