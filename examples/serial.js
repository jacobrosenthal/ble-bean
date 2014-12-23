/*jslint node: true */
"use strict";

/* 
 * This script requests the general BLE characteristics from the bean every second.
 * Requires a sketch on the Arduino to do a Serial.print() just like you were plugged
 * in over a serial cable. Any sketch will do.
 */

var Bean = require('../');

var intervalId;
var connectedBean;

Bean.discover(function(bean){
  connectedBean = bean;
  process.on('SIGINT', exitHandler.bind(this));

  bean.on("serial", function(data, valid){
    console.log(data.toString());
  });

  bean.on("disconnect", function(){
    process.exit();
  });

  bean.connectAndSetup(function(){

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