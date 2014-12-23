/*jslint node: true */

/* 
 * Requests the general BLE characteristics from the bean every ten seconds.
 * This requires no specific sketch on the Arduino. All of this is just talking to the bean's radio. 
 */

"use strict";

var Bean = require('../');

var intervalId;
var connectedBean;

Bean.discover(function(bean){
  connectedBean = bean;
  process.on('SIGINT', exitHandler.bind(this));

  bean.on("disconnect", function(){
    process.exit();
  });

  bean.connectAndSetup(function(){

    var readData = function() {

      bean.readBatteryLevel(function(battery){
        console.log("battery:", battery);
      });

      bean.readModelNumber(function(model){
        console.log("model:", model);
      });

      bean.readSerialNumber(function(serial){
        console.log("serial:", serial);
      });

      bean.readFirmwareRevision(function(firmware){
        console.log("firmware:", firmware);
      });

      bean.readHardwareRevision(function(hardware){
        console.log("hardware:", hardware);
      });

      bean.readSoftwareRevision(function(software){
        console.log("software:", software);
      });

      bean.readManufacturerName(function(manufacturer){
        console.log("manufacturer", manufacturer);  
      });

    }

    intervalId = setInterval(readData, 5000);

  });

});

process.stdin.resume();//so the program will not close instantly
var triedToExit = false;

//turns off led before disconnecting
var exitHandler = function exitHandler() {

  var self = this;
  if (connectedBean && !triedToExit) {
    triedToExit = true;
    console.log('Turning off led...');
    clearInterval(intervalId);
    connectedBean.setColor(new Buffer([0x0,0x0,0x0]), function(){});
    //no way to know if succesful but often behind other commands going out, so just wait 2 seconds
    console.log('Disconnecting from Device...');
    setTimeout(connectedBean.disconnect.bind(connectedBean, function(){}), 2000);
  } else {
    process.exit();
  }
};