/*jslint node: true */
"use strict";

/* 
 * This script listens for data on the first two (of five available) Scratch characteristics
 * when this sketch is programmed to the Arduino:
 * https://punchthrough.com/bean/the-arduino-reference/setscratchdata/
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

    bean.notifyOne(
      //called when theres data
      function(data){
        if(data && data.length>=2){
          var value = data[1]<<8 || (data[0]);
          console.log("one:", value);
        }
      },
      //called when the notify is successfully or unsuccessfully setup
      function(error){
        if(error) console.log("one setup: ", error);
      });

    bean.notifyTwo(
      //called when theres data
      function(data){
        if(data && data.length>=2){
          var value = data[1]<<8 || (data[0]);
          console.log("two:", value);
        }
      },
      //called when the notify is successfully or unsuccessfully setup
      function(error){
        if(error) console.log("two setup: ", error);
      });

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