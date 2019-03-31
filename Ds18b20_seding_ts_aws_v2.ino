/*  ESP8266, DS18B20 with updates to ThinkSpeak.com
 *   
 *  Supports multiple DS18B20 sensors on one pin, see Dallas datasheet for 
 *  wiring schematics.
 *  
 *  Requires free ThingSpeak account: https://thingspeak.com/
 *  Requires the following libraries to be installed: 
 *  
 *  OneWire.h - Built in.
 *  ESP8266Wifi.h - Built in to ESP8266/Arduino integration.
 *  DallasTemperature.h - Dallas Temperature sensor  library by Miles Burton: 
 *  https://github.com/milesburton/Arduino-Temperature-Control-Library 
 *  ThingSpeak.h - Offical ThinkSpeak library by Mathworks:
 *  https://github.com/mathworks/thingspeak-arduino
 *  
 *  Portions of code taken from Dallas Temperature libray examples by Miles Burton.
 *  
 *  To test sensor readings without uploading to ThinkSpeak cooment out 
 *  line 144 (ThingSpeak.writeFields(myChannelNumber, myWriteAPIKey);)
 *  
 */

#include <DallasTemperature.h>
#include <OneWire.h>
#include <ThingSpeak.h> 
#include <ESP8266WiFi.h>

// User changeable vaules go here.

#define ONE_WIRE_BUS D4                                // Digital pin DS18B20 is connected to.
#define TEMPERATURE_PRECISION 11                       // Set sensor precision.  Valid options 8,10,11,12 Lower is faster but less precise

unsigned long myChannelNumber = ;               // Write your Thingspeak channel ID here
const char * myWriteAPIKey = "";                // Write your API key here
const char* ssid     = "";                      // Write your SSID of wireless network
const char* password = "";                      //  Write your Password for wireless network
String host_aws = "";                           //  Write your AWS address
const int httpPort = ;                          //  Write your Port Number
//String url = "/log?api_key=your_api_key"; 
String url = "/log?temperature=";
int fieldStart = 1;                               // Field number to start populating ThingSpeak channel data, leave at 
                                                  // 1 if this is the only device reporting to that channel.  
                                                  // If more than one device this should be the FIRST FREE field.

int updatePeriod = 120;                            //delay in seconds to update to ThingSpeak.  Should be set to not less than 15.


int status = WL_IDLE_STATUS;
WiFiClient  client;
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);


int numberOfDevices; // Number of temperature devices found
DeviceAddress tempDeviceAddress; // We'll use this variable to store a found device address

//

String working(String temp) { 
  //int  r = 40; // do some magic here!
  //return(String("temperature=")+String(temp));
  return String(temp);
}

void delivering(String payload) { 
  WiFiClient client;
  Serial.print("connecting to ");
  Serial.println(host_aws);
  if (!client.connect(host_aws, httpPort)) {
    Serial.print("connection failed: ");
    Serial.println(payload);
    return;
  }
  
  String getheader = "GET "+ String(url) + String(payload) +" HTTP/1.1";
  //String url = "/log?temperature=";
  //payload = (temperature_String);
  client.println(getheader);
  client.println("User-Agent: ESP8266 GC Shin Reference from Kyuho Kim");  
  client.println("Host: " + String(host_aws));  
  client.println("Connection: close");  
  client.println();

  Serial.println(getheader);
  while (client.connected()) {
    String line = client.readStringUntil('\n');
    Serial.println(line);
  }
  Serial.println("Done cycle.");
}

//

void setup() {
 Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println();
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


  ThingSpeak.begin(client);
  sensors.begin();
  
  // Grab a count of devices on the wire
  numberOfDevices = sensors.getDeviceCount();
  
  // locate devices on the bus
  Serial.print("Locating devices...");
  
  Serial.print("Found ");
  Serial.print(numberOfDevices, DEC);
  Serial.println(" devices.");

  // report parasite power requirements
  Serial.print("Parasite power is: "); 
  if (sensors.isParasitePowerMode()) Serial.println("ON");
  else Serial.println("OFF");
  
  // Loop through each device, print out address
  for(int i=0;i<numberOfDevices; i++)
  {
    // Search the wire for address
    if(sensors.getAddress(tempDeviceAddress, i))
  {
    Serial.print("Found device ");
    Serial.print(i, DEC);
    Serial.print(" with address: ");
    printAddress(tempDeviceAddress);
    Serial.println();
    
    Serial.print("Setting resolution to ");
    Serial.println(TEMPERATURE_PRECISION, DEC);
    
    // set the resolution to TEMPERATURE_PRECISION bit (Each Dallas/Maxim device is capable of several different resolutions)
    sensors.setResolution(tempDeviceAddress, TEMPERATURE_PRECISION);
    
    Serial.print("Resolution actually set to: ");
    Serial.print(sensors.getResolution(tempDeviceAddress), DEC); 
    Serial.println();
  }else{
    Serial.print("Found ghost device at ");
    Serial.print(i, DEC);
    Serial.print(" but could not detect address. Check power and cabling");
  }
  }
}

// function to print a device address
void printAddress(DeviceAddress deviceAddress)
{
  for (uint8_t i = 0; i < 8; i++)
  {
    if (deviceAddress[i] < 16) Serial.print("0");
    Serial.print(deviceAddress[i], HEX);
  }
}

void loop() {

  String path_aws = "/log?temperature=";
  String temperature_String;
  unsigned long start1, finished, elapsed;
  start1=millis();
  sensors.requestTemperatures();
  // Thingspeak START  
  for (int i=0; i<=(numberOfDevices - 1); i++){
    float temp=sensors.getTempCByIndex(i);
    ThingSpeak.setField(i+fieldStart,temp);
    Serial.println("Sensor #:");
    Serial.println(i);
    Serial.println("Temperature:");
    Serial.println(temp);
  }
  ThingSpeak.writeFields(myChannelNumber, myWriteAPIKey);  //Write fields to Thingspeak, comment this line out
                                                              //if you wish to test without uploading data.
    Serial.println("Data sent to ThinkSpeak");
    finished=millis();
    elapsed=finished-start1;
  delay(60000-elapsed);
  //delay(20000);
  //ThingSpeak END
  
  //AWS START
  start1=millis();
  sensors.requestTemperatures();

  float temp=sensors.getTempCByIndex(0);
  temperature_String = String(temp);
  //String payload = working(temperature_String);
   delivering(temperature_String);
  
  finished=millis();
  elapsed=finished-start1;
  delay(60000-elapsed);
  //delay(4000);
  //AWS END
}
