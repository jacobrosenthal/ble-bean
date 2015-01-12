#BLE-Bean
Non Official api for the [LightBlue Bean]( http://punchthrough.com/bean/)

I recommend you familiarize yourself with the Bean first, but the gist is it has a BLE transceiver and an Arduino onboard. You can program regular Arduino sketches on the Arduino, but the BLE transceiver is available no matter what sketch you have on the bean.

Second it might be helpful to familiarize yourself with [noble](https://www.npmjs.com/package/noble) as this library is built on [noble-device](https://www.npmjs.com/package/noble-device). 

#Install
```
npm install ble-bean
```
#Use
To get started You include this library and ask the library to discover a bean:
```
var Bean = require('ble-bean');
Bean.discover(function(bean){

}
```

But you're not done yet, inside the discover you need to ask the bean to set itself up:
```
bean.connectAndSetup(function(){

}
```

When that returns you're finally ready to use the ble-bean api:
```
bean.requestTemp(callback);
bean.requestAccell(callback);
bean.setColor(color, callback); //where color is a buffer of r,g,b hex values
bean.write(data, callback); //where data is a buffer
```
Huge gotcha here though, the callback to all api commands DO NOT GIVE YOU BACK YOUR DATA, they simply confirms that the request has left your computer. 

The data response is based on emitters. You need to listen for the event you're interested in. We offer:

* serial - which returns data, valid - serial data from the Arduino
* accell - which returns x, y, z, valid - accelerometer data from bean
* temp - which returns temp, valid - accelerometer data from bean
* raw - which returns packet, length, valid, command - which returns raw command packet from bean before it gets turned into accell, serial, temp, etc (with gst and gatt headers stripped) 

Each of the events offers a valid flag to see if the checksum matched up, etc. It probably doesn't matter to you unless you're doing something mission critical.

Theres are also five [scratch characteristics](https://punchthrough.com/bean/arduino-users-guide/#scratch_characteristics) available on the bean. These are just another way to send data to your Arduino:
```
bean.readOne(callback); //explicit read from characteristic
bean.notifyOne(readCallback, callback); //listen for all data from characteristic
bean.writeOne(callback); //write data to characteristic
bean.unnotifyOne(readCallback, callback); //stop listening for all data from characteristic
```

For a fairly exhaustive example that connects, listens for serial data, sets the led color randomly, asks the bean for temp and accell data every second, and disconnects cleanly when you control-c, from bean directory run:
```
node examples/bean_example.js
```



###CHANGELOG
0.1.0 
first

0.2.0
cleaned up scanning in the example and the package.json file

0.3.0 and 0.4.0 
add scratch characteristics with notify 
fix accelerometer readings
better logging in example, took console.log out of library

0.5.0 
scale accelerometer readings
added readme with changelog

0.6.0
only emit command specific emits when packets are valid
refactor for cleaner code
add write scratch characteristics

0.7.0
add write serial data to bean characteristic

0.7.1
Better readme, no code changes.

0.8.0
New Serial event for parsed serial data called 'serial'

1.0.0
Emitter callback signatures changed!! 
'read' emitter became 'raw'
accell and serial changed removing the sequence since its handled internally now.
Added requestTemp.

2.0.0
Move to new noble-device pattern which significantly removes noble cruft from implementation. 
Changes the scratch characteristic API.
Example has cleaner disconnect code.

2.0.1
Clean and split up examples

2.0.2
Fixed bug in Scratch write implementation
clean up firmata example

2.1.0
newer firmwares are gating serial SEND during first x seconds, added unGate function to disable