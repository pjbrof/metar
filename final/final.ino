
#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_GFX.h>
#include <Adafruit_NeoMatrix.h>
#include <Adafruit_NeoPixel.h>
#ifndef PSTR
 #define PSTR // Make Arduino Due happy
#endif

#define PIN 2

Adafruit_NeoMatrix matrix = Adafruit_NeoMatrix(64, 8, PIN,
  NEO_MATRIX_TOP     + NEO_MATRIX_LEFT +
  NEO_MATRIX_COLUMNS + NEO_MATRIX_ZIGZAG,
  NEO_RGB            + NEO_KHZ800);

const char* ssid = "Winter Chill Gang";
const char* password = "heavyhitters";

// Would need WiFiClientSecure to call directly so using node server as a passthrough
const char* serverName = "http://192.168.1.10:3000";

// the following variables are unsigned longs because the time, measured in
// milliseconds, will quickly become a bigger number than can be stored in an int.

unsigned long blinkStartMillis;
unsigned long metarStartMillis;
unsigned long currentMillis;
const unsigned long blinkPeriod = 100;
const unsigned long timerDelay = 600000; // 10 minutes

String metar;

int x = matrix.width();
int pass = 0;

void setup() {
  // Wifi Setup
  Serial.begin(115200);
  // while (!Serial) { delay(100); }

  // We start by connecting to a WiFi network

  Serial.println();
  Serial.println("******************************************************");
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  
  metar = httpGETRequest(serverName);
  
  // Matrix Setup
  matrix.begin();
  matrix.setTextWrap(false);
  matrix.setBrightness(40);
  matrix.setTextColor(matrix.Color(0, 255, 0));
  
  blinkStartMillis = millis();
  metarStartMillis = millis();
}

void loop() {
  currentMillis = millis();

  getMetar();
  matrixStep();
}

void getMetar()
{
  //Send an HTTP POST request every 10 minutes
  if (currentMillis - metarStartMillis >= timerDelay) {
    //Check WiFi connection status
    if(WiFi.status()== WL_CONNECTED){
      metar = httpGETRequest(serverName);
      Serial.println(metar);
    }
    else {
      Serial.println("WiFi Disconnected");
    }
    metarStartMillis = currentMillis;
  }
}

void matrixStep()
{
  if (currentMillis - blinkStartMillis >= blinkPeriod)
  {
    matrix.fillScreen(0);
    matrix.setCursor(x, 0);
    matrix.print(metar);
    if(--x < -300) {
      x = matrix.width();
      if(++pass >= 3) pass = 0;
    }
    matrix.show();
    blinkStartMillis = currentMillis;
  }
}

String httpGETRequest(const char* serverName) {
  WiFiClient client;
  HTTPClient http;
    
  // Your Domain name with URL path or IP address with path
  http.begin(client, serverName);
  
  // If you need Node-RED/server authentication, insert user and password below
  //http.setAuthorization("REPLACE_WITH_SERVER_USERNAME", "REPLACE_WITH_SERVER_PASSWORD");
  http.addHeader("accept", "*/*");
  
  // Send HTTP POST request
  int httpResponseCode = http.GET();
  
  String payload = ""; 
  
  if (httpResponseCode>0) {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    payload = http.getString();
  }
  else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
  }
  // Free resources
  http.end();

  return payload;
}
