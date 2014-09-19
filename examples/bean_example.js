/*jslint node: true */
"use strict";

var noble = require('noble');
var beanAPI = require('../lib/bean');
var scratchAPI = require('../lib/scratch');

var connectedBean;
var connectedScratch;
var intervalId;

var readyBean = function(){

  connectedBean.on("accell", function(x, y, z, valid){
    var status = valid ? "valid" : "invalid";
    console.log("received " + status + " accell\tx:\t" + x + "\ty:\t" + y + "\tz:\t" + z );
  });

  connectedBean.on("temp", function(temp, valid){
    var status = valid ? "valid" : "invalid";
    console.log("received " + status + " temp:\t" + temp);
  });

  connectedBean.on("serial", function(data, valid){
    var status = valid ? "valid" : "invalid";
    console.log("received " + status + " serial");
    console.log(data);
  });

  connectedBean.on("raw", function(data, length, valid, command){
    var status = valid ? "valid" : "invalid";
    console.log("received " + status + " packet with " + length + " bytes of payload and a command of " + command);
    console.log(data);
  });

  intervalId = setInterval(function() {

    //set random led colors between 0-255. I find red overpowering so red between 0-64
    connectedBean.setColor(new Buffer([getRandomInt(0,64),getRandomInt(0,255),getRandomInt(0,255)]),
      function(){
        console.log("set led");
    });

    connectedBean.requestAccell(
    function(){
      console.log("requested accell");
    });

    connectedBean.requestTemp(
    function(){
      console.log("requested temp");
    });

  },1000);

};

var readyScratch = function(){

  connectedScratch.on("scratch1", function(data){
    console.log("scratch1");
    console.log(data);
  });

  connectedScratch.on("scratch2", function(data){
    console.log("scratch2");
    console.log(data);
  });

  connectedScratch.on("scratch3", function(data){
    console.log("scratch3");
    console.log(data);
  });

  connectedScratch.on("scratch4", function(data){
    console.log("scratch4");
    console.log(data);
  });

  connectedScratch.on("scratch5", function(data){
    console.log("scratch5");
    console.log(data);
  });

};

var connect = function(err){
  if (err) throw err;
  process.on('SIGINT', exitHandler.bind({peripheral:this.peripheral}));

  this.peripheral.discoverServices([], setupService);
};

var setupService = function(err,services) {
  if (err) throw err;
  services.forEach(function(service){
    if(service.uuid === beanAPI.UUID){
      connectedBean = new beanAPI.Bean(service);
      connectedBean.on('ready', readyBean);
    }else if(service.uuid === scratchAPI.UUID){
      console.log("found");
      connectedScratch = new scratchAPI.Scratch(service);
      connectedScratch.on('ready', readyScratch);
    }
  });

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