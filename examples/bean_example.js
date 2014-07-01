/*jslint node: true */
"use strict";

var noble = require('noble');
var beanAPI = require('../lib/bean');

var connectedBean;
var intervalId;

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

    //set random led colors between 0-255. I find red overpowering so red between 0-64
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
  process.on('SIGINT', exitHandler.bind({peripheral:this.peripheral}));

  this.peripheral.discoverServices([beanAPI.UUID], setupService);
};

var setupService = function(err,services) {
  if (err) throw err;
  connectedBean = new beanAPI.Bean(services[0]);
  connectedBean.on('ready', ready);
};

var discover = function(peripheral){
  console.log("(scan)found:" + peripheral.advertisement.localName);
  noble.stopScanning();
  peripheral.connect(connect.bind({peripheral:peripheral}));
};

noble.startScanning([beanAPI.UUID]);
noble.on('discover', discover);

var getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

process.stdin.resume();//so the program will not close instantly
var triedToExit = false;

//turns off led before disconnecting
var exitHandler = function exitHandler() {

  var self = this;
  if (this.peripheral && !triedToExit) {
    triedToExit = true;
    console.log('Disconnecting from Device...');
    clearInterval(intervalId);
    connectedBean.setColor(new Buffer([0x00,0x00,0x00]), function(){
      self.peripheral.disconnect( function(){
          console.log('disconnected');
          process.exit();
      });
    });
  } else {
    process.exit();
  }
};