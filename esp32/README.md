# ⚡ NexusIQ ESP32 Edge Sensor Node

## Pinout & Wiring
- **DHT11 Data Pin**: GPIO 4
- **Relay Control Pin**: GPIO 26 (Active LOW relay module)
- **Power**: 3.3V / 5V & GND

## Required Arduino Libraries
1. `DHT sensor library` by Adafruit
2. `Adafruit Unified Sensor` by Adafruit
3. `ArduinoJson` (v6.x) by Benoit Blanchon

## Gateway Destination
- **RPi Target**: `http://192.168.1.17:5001/sensor`
- **Temperature Safety Limit**: `32.0°C`
