/*jslint node: true */
"use strict";

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var crc = require('crc');
var commands = require('./commands');

var UUID = 'a495ff10c5b14b44b5121370f02d74de';
var BEAN_SERIAL_CHAR_UUID = 'a495ff11c5b14b44b5121370f02d74de';

module.exports = {
  Bean : Bean,
  UUID : UUID
};

function Bean(service) {
  if (!(this instanceof Bean)) 
  return new Bean();
  
  EventEmitter.call(this);

  var self = this;

  this.count = 0;

  service.discoverCharacteristics([BEAN_SERIAL_CHAR_UUID], function(err, characteristics){
    self._initialize(err, characteristics);
  });

}
util.inherits(Bean, EventEmitter);

Bean.prototype._initialize = function(err,characteristics) {
  this.chara = characteristics[0];
  this.chara.on('read', this._onRead.bind(this));

  this.chara.notify(true, function(err) {
    if (err) throw err;
    console.log('Successfully subscribed to Bean serial notifications.');
  });

  this.emit('ready',err);
};

Bean.prototype._onRead = function(data){

  var seq = data[0]; //TODO check if seq in order
  var size = data[1]; //size of the cmd and payload
  
  //crc only the size, cmd and payload
  var crcString = crc.crc16ccitt(data.slice(1,size+3));

  //messy buffer equality because we have to swap bytes and can't use string equality because tostring drops leading zeros
  var crc16 = new Buffer(crcString, 'hex');
  var valid = (crc16[0]===data[data.length-1] && crc16[1]===data[data.length-2]);

  this.emit('read', data, valid, seq, size);

  //messy buffer equality because tostring drops leading zeros
  if(valid && data[3]==commands.MSG_ID_CC_ACCEL_READ_RSP[0] && data[4]==commands.MSG_ID_CC_ACCEL_READ_RSP[1])
  {
    var x = (((data[6] << 24) >> 16) | data[5]) * 0.00391;
    var y = (((data[8] << 24) >> 16) | data[7]) * 0.00391;
    var z = (((data[10] << 24) >> 16) | data[9]) * 0.00391;

    this.emit('accell', x.toFixed(5), y.toFixed(5), z.toFixed(5), valid, seq);
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

  this.chara.write(gattBuffer, false, done);
};

Bean.prototype.setColor = function(color,done){
  this.send(commands.MSG_ID_CC_LED_WRITE_ALL,color,done);
};

Bean.prototype.requestAccell = function(done){
  var cmd = commands.MSG_ID_CC_ACCEL_READ;
  var payload = new Buffer([]);
  this.send(cmd,payload,done);
};