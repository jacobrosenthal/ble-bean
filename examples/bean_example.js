/*jslint node: true */
"use strict";

var scan = require('../scan');
var beanAPI = require('../lib/bean');

var connectedBean;
var intervalId;
var periph;

var ready = function(){

  connectedBean.on("accell", function(x,y,z){
    console.log("received accell");
    console.log(x);
    console.log(y);
    console.log(z);
  });

  connectedBean.on("read", function(data){
    console.log("received raw read");
    console.log(data);
  });

  intervalId = setInterval(function() {

    connectedBean.setColor(new Buffer([getRandomInt(0,64),getRandomInt(0,255),getRandomInt(0,255)]),
      function(){
        console.log("set");
    });

    connectedBean.requestAccell(
    function(){
      console.log("requested");
    });

  },1000);

};

var connect = function(err){
  if (err) throw err;

  periph = this.peripheral;
  process.on('SIGINT', exitHandler);

  this.peripheral.discoverServices(['a495ff10c5b14b44b5121370f02d74de'], setupService);
};

var setupService = function(err,services) {
  if (err) throw err;
  connectedBean = new beanAPI.Bean(services[0]);
  connectedBean.on('ready', ready);
};

var peripherals = new Array(1);
scan.scan(10000, beanAPI.UUID, peripherals, function(peripherals){
  peripherals[0].connect(connect.bind({peripheral:peripherals[0]}));
});

var getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

process.stdin.resume();//so the program will not close instantly
var triedToExit = false;

//turns off led before disconnecting
var exitHandler = function exitHandler() {

  if (periph && !triedToExit) {
    triedToExit = true;
    console.log('Disconnecting from Device...');
    clearInterval(intervalId);
    connectedBean.setColor(new Buffer([0x00,0x00,0x00]), function(){
      periph.disconnect( function(){
          console.log('disconnected');
          process.exit();
      });
    });
  } else {
    //if this is uncommented it doesnt disconnect device?
    process.exit();
  }
};