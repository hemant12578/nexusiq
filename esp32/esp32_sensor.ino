#include <DHT.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define DHTPIN 4
#define DHTTYPE DHT11
#define RELAY_PIN 26
#define TEMP_THRESHOLD 32.0

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* rpiIP = "192.168.1.17";
const int rpiPort = 5001;

DHT dht(DHTPIN, DHTTYPE);
bool systemShutdown = false;
unsigned long lastSend = 0;

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Active LOW relay — HIGH = relay OFF = fan RUNS
  dht.begin();

  Serial.println("\nNexusIQ ESP32 Edge Node Starting...");
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  Serial.println("IP: " + WiFi.localIP().toString());
  Serial.println("RPi: 192.168.1.17:5001");
  Serial.println("Threshold: " + String(TEMP_THRESHOLD) + "C");
  Serial.println("Fan status: RUNNING");
  Serial.println("Ready!\n");
}

void sendToRPi(float temp, float humidity, bool shutdown) {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.begin(ssid, password);
    return;
  }

  HTTPClient http;
  String url = "http://192.168.1.17:5001/sensor";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  StaticJsonDocument<256> doc;
  doc["temperature"] = temp;
  doc["humidity"] = humidity;
  doc["shutdown"] = shutdown;
  doc["device"] = "ESP32_DHT11";
  doc["threshold"] = TEMP_THRESHOLD;

  String body;
  serializeJson(doc, body);

  Serial.println("Sending to RPi: " + body);
  int code = http.POST(body);
  Serial.println("RPi responded: " + String(code));
  http.end();
}

void loop() {
  delay(2000);

  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(temp) || isnan(humidity)) {
    Serial.println("DHT11 read failed");
    return;
  }

  Serial.printf("[%lu] Temp: %.1f C | Humidity: %.1f%% | Fan: %s\n",
    millis()/1000, temp, humidity,
    systemShutdown ? "STOPPED" : "RUNNING");

  if (temp >= TEMP_THRESHOLD && !systemShutdown) {
    Serial.println("🚨 THRESHOLD EXCEEDED!");
    Serial.println("🔴 RELAY ON — FAN STOPPED");
    digitalWrite(RELAY_PIN, LOW);  // Active LOW — LOW triggers relay = fan stops
    systemShutdown = true;
    sendToRPi(temp, humidity, true);
    lastSend = millis();
  } 
  else if (temp < (TEMP_THRESHOLD - 2) && systemShutdown) {
    Serial.println("✅ Temperature normal");
    Serial.println("🟢 RELAY OFF — FAN RUNNING");
    digitalWrite(RELAY_PIN, HIGH); // HIGH = relay off = fan runs
    systemShutdown = false;
    sendToRPi(temp, humidity, false);
    lastSend = millis();
  }

  if (millis() - lastSend > 10000) {
    sendToRPi(temp, humidity, systemShutdown);
    lastSend = millis();
  }
}
