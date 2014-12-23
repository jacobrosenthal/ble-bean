/*jslint node: true */
"use strict";

/* 
 * This script sends the digital write 13 (for various reason Bean Pin 5) off and on.
 * I SUPER highly dont recommend you actually do it this way, this is just for testing.
 * Please see bean-serial for firmata.j
 * https://www.npmjs.com/package/bean-serial
 * or bean-io for a Johnny for Johnny Five support
 * https://www.npmjs.com/package/bean-io
 * Needs a firmata sketch programmed onto Arduino:
 * https://gist.github.com/jacobrosenthal/5044a5f660d2bda84060
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

    setInterval(bean.write.bind(bean, new Buffer([0x91, 0x00, 0x00]), function(){}), 5000);
    setInterval(bean.write.bind(bean, new Buffer([0x91, 0x20, 0x00]), function(){}), 7500);

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