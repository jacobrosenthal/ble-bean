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

  var seq = data[0];
  var size = data[1];

  var buf = new Buffer(size + 2);
  data.copy(buf, 0, 1, size + 3);

  var crcString = crc.crc16ccitt(buf);
  var crc16 = new Buffer(crcString, 'hex');

  var valid = false;

  if(crc16[0]===data[data.length-1] && crc16[1]===data[data.length-2])
    valid = true;

  this.emit('read', data, valid, seq, size);

  if(data[3]==commands.MSG_ID_CC_ACCEL_READ_RSP[0] && data[4]==commands.MSG_ID_CC_ACCEL_READ_RSP[1])
  {
    var x = (((data[6] << 24) >> 16) | data[5]) * 0.00391;
    var y = (((data[8] << 24) >> 16) | data[7]) * 0.00391;
    var z = (((data[10] << 24) >> 16) | data[9]) * 0.00391;

    this.emit('accell', x.toFixed(5), y.toFixed(5), z.toFixed(5), valid, seq);
  }
};

Bean.prototype.send = function(cmd,payload,done){

  var sizeint = cmd.length + payload.length;
  var size = new Buffer(2);
  size.writeUInt8(sizeint,0);
  size.writeUInt8(0,1);

  var gst = Buffer.concat([size,cmd,payload]);

  var crcString = crc.crc16ccitt(gst);

  var crc16 = new Buffer(crcString, 'hex');

  var gatt = new Buffer(gst.length + crc16.length + 1);
  gst.copy(gatt,1,0); //copy gst into gatt shifted right 1

  var header = (((this.count++ * 0x20) | 0x80) & 0xff);
  gatt[0]=header;

  gatt[gatt.length-2]=crc16[1]; //swap 2 crc bytes and add to end of gatt
  gatt[gatt.length-1]=crc16[0];

  // console.log(gatt);

  this.chara.write(gatt, false, done);
};

Bean.prototype.setColor = function(color,done){
  this.send(commands.MSG_ID_CC_LED_WRITE_ALL,color,done);
};

Bean.prototype.requestAccell = function(done){
  var cmd = commands.MSG_ID_CC_ACCEL_READ;
  var payload = new Buffer([]);
  this.send(cmd,payload,done);
};