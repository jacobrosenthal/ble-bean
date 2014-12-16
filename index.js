/*jslint node: true */
"use strict";

var NobleDevice = require('noble-device');

var Bean = require('./lib/Bean');

var ScratchOne = require('./lib/ScratchOne');
var ScratchTwo = require('./lib/ScratchTwo');
var ScratchThree = require('./lib/ScratchThree');
var ScratchFour = require('./lib/ScratchFour');
var ScratchFive = require('./lib/ScratchFive');


NobleDevice.Util.mixin(Bean, NobleDevice.BatteryService);
NobleDevice.Util.mixin(Bean, NobleDevice.DeviceInformationService);

NobleDevice.Util.mixin(Bean, ScratchOne);
NobleDevice.Util.mixin(Bean, ScratchTwo);
NobleDevice.Util.mixin(Bean, ScratchThree);
NobleDevice.Util.mixin(Bean, ScratchFour);
NobleDevice.Util.mixin(Bean, ScratchFive);

module.exports = Bean;