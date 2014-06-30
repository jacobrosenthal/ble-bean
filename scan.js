/*jslint node: true */
"use strict";

var noble = require('noble');

var discover = function(peripheral){
    console.log("(scan)found:" + peripheral.advertisement.localName);
    this.peripherals.unshift(peripheral);
};

var stopandreturn = function (){
    noble.stopScanning();
    noble.removeListener('discover', discover);
    console.log('Stop Scanning for BLE devices...');

    this.done(this.peripherals);
};

exports.scan = function (timeout, serviceUuid, peripherals, done) {
    noble.on('discover', discover.bind({peripherals:peripherals}));

    noble.startScanning([serviceUuid]);
    console.log('Scanning for BLE devices...');
    setTimeout(stopandreturn.bind({done:done, peripherals:peripherals}), timeout);
};