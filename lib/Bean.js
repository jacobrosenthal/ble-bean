/*jslint node: true */
"use strict";

var NobleDevice = require('noble-device');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var bufferEqual = require('buffer-equal');

var commands = require('./commands');
var gt = require('./gt');
var gst = require('./gst');
var app = require('./app');

var SERIAL_UUID = 'a495ff10c5b14b44b5121370f02d74de';
var BEAN_SERIAL_CHAR_UUID = 'a495ff11c5b14b44b5121370f02d74de';

var Bean = function(peripheral) {
  if (!(this instanceof Bean)) 
  return new Bean();

  NobleDevice.call(this, peripheral);
  
  EventEmitter.call(this);

  this.count = 0;
  this.gstBuffer = new Buffer(0);

};

Bean.SCAN_UUIDS = [SERIAL_UUID];

util.inherits(Bean, EventEmitter);
NobleDevice.Util.inherits(Bean, NobleDevice);

Bean.prototype.connectAndSetup = function(callback) {

  var self = this;

  NobleDevice.prototype.connectAndSetup.call(self, function(){

    self.notifyCharacteristic(SERIAL_UUID, BEAN_SERIAL_CHAR_UUID, true, self._onRead.bind(self), function(err){

      if (err) throw err;

      self.emit('ready',err);
      callback(err);

    });

  });

};

Bean.prototype._onRead = function(data){

  var gtObject = gt.unwrap(data);

  if (gtObject.start) {
    this.gstBuffer = new Buffer(0);
  }

  //TODO probably only if gtObject.messageCount is in order
  this.gstBuffer = Buffer.concat( [this.gstBuffer, gtObject.payload] );

    //last packet, process and emit
  if(gtObject.packetCount === 0){

    var gstObject = gst.unwrap(this.gstBuffer);

    this.emit('raw', gstObject.appMessage, gstObject.length, gstObject.valid); //took command off

    if(!gstObject.valid){
      this.emit('invalid', gstObject.appMessage, gstObject.lenth, gstObject.valid); //took command off
      return;
    }

    var appMessageObject = app.unwrap(gstObject.appMessage);

    //ideally some better way to do lookup
    if(bufferEqual(appMessageObject.messageId, commands.MSG_ID_CC_ACCEL_RSP))
    {
      var x = (((appMessageObject.payload[5] << 24) >> 16) | appMessageObject.payload[4]) * 0.00391;
      var y = (((appMessageObject.payload[7] << 24) >> 16) | appMessageObject.payload[6]) * 0.00391;
      var z = (((appMessageObject.payload[9] << 24) >> 16) | appMessageObject.payload[8]) * 0.00391;
      this.emit('accell', x.toFixed(5), y.toFixed(5), z.toFixed(5), gstObject.valid);
    }
    if(bufferEqual(appMessageObject.messageId, commands.MSG_ID_SERIAL_RSP))
    {
      this.emit('serial', appMessageObject.payload, gstObject.valid);
    }
    if(bufferEqual(appMessageObject.messageId, commands.MSG_ID_CC_TEMP_RSP))
    {
      this.emit('temp', appMessageObject.payload[0], gstObject.valid);
    }
    else
    {
      this.emit('unknown', appMessageObject);
    }

  }

};

Bean.prototype.send = function(cmdBuffer,payloadBuffer,done){

  //size buffer contains size of(cmdBuffer, and payloadBuffer) and a reserved byte set to 0
  var sizeBuffer = new Buffer(2);
  sizeBuffer.writeUInt8(cmdBuffer.length + payloadBuffer.length,0);
  sizeBuffer.writeUInt8(0,1);

  //GST contains sizeBuffer, cmdBuffer, and payloadBuffer
  var gstBuffer = Buffer.concat([sizeBuffer,cmdBuffer,payloadBuffer]);

  var crcString = crc.crc16ccitt(gstBuffer);
  var crc16Buffer = new Buffer(crcString, 'hex');

  //GATT contains sequence header, gstBuffer and crc166
  var gattBuffer = new Buffer(1 + gstBuffer.length + crc16Buffer.length);

  var header = (((this.count++ * 0x20) | 0x80) & 0xff);
  gattBuffer[0]=header;

  gstBuffer.copy(gattBuffer,1,0); //copy gstBuffer into gatt shifted right 1

  //swap 2 crc bytes and add to end of gatt
  gattBuffer[gattBuffer.length-2]=crc16Buffer[1];
  gattBuffer[gattBuffer.length-1]=crc16Buffer[0];

  this.writeDataCharacteristic(SERIAL_UUID, BEAN_SERIAL_CHAR_UUID, gattBuffer, done);

};

Bean.prototype.unGate = function(done){
  this.send(commands.MSG_ID_GATING, new Buffer({}), done);
}

Bean.prototype.write = function(data, done){
  this.send(commands.MSG_ID_SERIAL_DATA, data, done);
}

Bean.prototype.setColor = function(color,done){
  this.send(commands.MSG_ID_CC_LED_WRITE_ALL, color, done);
};

Bean.prototype.requestAccell = function(done){
  this.send(commands.MSG_ID_CC_ACCEL_READ, new Buffer([]), done);
};

Bean.prototype.requestTemp = function(done){
  this.send(commands.MSG_ID_CC_TEMP_READ, new Buffer([]), done);
};

module.exports = Bean;