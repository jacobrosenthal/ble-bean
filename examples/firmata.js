/*jslint node: true */
"use strict";

/* 
 * This script sends digital write 13 (for various reasons Bean Pin 5 currently) off and on.
 * NOTE this has no relation to the RGB led on the bean, you would have to hook an led to pin 5.
 * a0 -> a4
 * a1 -> a5
 * d0 -> d6
 * d1 -> d9
 * d2 -> d10
 * d3 -> d11
 * d4 -> d12
 * d5 -> d13
 * I SUPER highly dont recommend you actually don't actually use this script. 
 * other than for testing. There are great firmata implementations already written in 
 * javascript. See bean-serial for a firmata.js implementation
 * https://www.npmjs.com/package/bean-serial
 * or bean-io for a Johnny for Johnny Five implementation
 * https://www.npmjs.com/package/bean-io
 *
 * Requires the default StandardFirmata found in the examples menu to be programmed onto Arduino:
 */

var Bean = require('../');

var intervalId;
var connectedBean;

Bean.discover(function(bean){
  connectedBean = bean;
  process.on('SIGINT', exitHandler.bind(this));

  bean.on("serial", function(data, valid){
    console.log("javascript received", data.toString('hex'), data.toString('utf8'));
  });

  bean.on("disconnect", function(){
    process.exit();
  });

  bean.connectAndSetup(function(){
    //theres a new feature where the bean disable serial SENDS for the first x seconds
    //if you're using the bean for serial stuff you probably dont want this
    bean.unGate(function(){
      console.log('ungated');
      setInterval(toggle, 1000);
    });
  });

});

var on = false;

function toggle(){

  if(on){
    connectedBean.write(new Buffer([0x91, 0x00, 0x00]), function(){
      console.log("toggled off");
    });
  }else{
    connectedBean.write(new Buffer([0x91, 0x20, 0x00]), function(){
      console.log("toggled on");
    });
  }

  on=!on;
}

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