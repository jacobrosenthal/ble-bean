##BLE-Bean
Non Official api for the LightBlue Bean http://punchthrough.com/bean/

ble-bean is set up a litte differently than other BLE libraries. I'm playing with exposing services and characteristics, rather than the device. You need to use noble to search for services, and create an instance of Bean or Scratch. See the example.

###INSTALL
```
npm install ble-bean
```


####Bean:

You can wite data which can be read on arduino with Serial.read - in this instance 91,00,00 is firmata for all pins on port 0 low
```
connectedBean.write(new Buffer([0x91,0x00,0x00]),callback(error));
```

You can read the raw data from the device with:
```
connectedBean.on("raw", callback(data, length, valid, command));

```

Or theres a job specific emitters to do parsing for you, like serial:
```
connectedBean.on("serial", callback(data, valid));

```

Or accellerometer:
```
connectedBean.on("accell", callback(x, y, z, valid));
```

But to read the accelerometer, you need to ask it to take a reading with:
```
connectedBean.requestAccell(callback(error));
```

Temperature:
```
connectedBean.on("temp", callback(temp, valid));
```

But to read the temp, you need to ask it to take a reading with:
```
connectedBean.requestTemp(callback(error));
```

You can set the led color (in this case to a random color) with:
```
connectedBean.setColor(new Buffer([255,255,255]), callback(error));
```

If theres something I haven implemented you can create it yourself with the send command. See commands.js for commandBuffers to use:
```
connectedBean.send(commandBuffer, dataBuffer, callback(error));
```


####Scratch:

Scratch characteristics are 5 other characterists you can send and receive data on from the Arduino. See the reference page for more info: http://punchthrough.com/bean/arduino-reference/

You can write to the first scratch like:
```
connectedScratch.write1("scratch1", new Buffer([]), callback(error));
```

And you could listen for data on it like:
```
connectedScratch.on("scratch1", callback(data));
```


###CHANGELOG
0.1.0 
first

0.2.0
cleaned up scanning in the example and the package.json file

0.3.0 and 0.4.0 
add scratch characteristics with notify 
fix acellerometer readings
better logging in example, took console.log out of library

0.5.0 
scale acceleromter readings
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