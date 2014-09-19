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
  this.gst = new Buffer(0);

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

Bean.prototype._onRead = function(gt){

  //see https://github.com/PunchThrough/bean-documentation/blob/master/serial_message_protocol.md

  //Received a single GT packet
  var start = (gt[0] & 0x80); //Set to 1 for the first packet of each App Message, 0 for every other packet
  var messageCount = (gt[0] & 0x60); //Increments and rolls over on each new GT Message (0, 1, 2, 3, 0, ...)
  var packetCount = (gt[0] & 0x1F); //Represents the number of packets remaining in the GST message

  //first packet, reset data buffer
  if (start) {
    this.gst = new Buffer(0);
  }

  //TODO probably only if messageCount is in order
  this.gst = Buffer.concat( [this.gst, gt.slice(1)] );

  //last packet, process and emit
  if(packetCount === 0){

    var length = this.gst[0]; //size of thse cmd and payload

    //crc only the size, cmd and payload
    var crcString = crc.crc16ccitt(this.gst.slice(0,this.gst.length-2));
    //messy buffer equality because we have to swap bytes and can't use string equality because tostring drops leading zeros
    var crc16 = new Buffer(crcString, 'hex');
    var valid = (crc16[0]===this.gst[this.gst.length-1] && crc16[1]===this.gst[this.gst.length-2]);

    var command = ( (this.gst[2] << 8) + this.gst[3] ) & ~(0x80) ;

    this.emit('raw', this.gst.slice(2,this.gst.length-2), length, valid, command);

    if(valid){

      //ideally some better way to do lookup
      if(command === (commands.MSG_ID_CC_ACCEL_READ[0] << 8 ) + commands.MSG_ID_CC_ACCEL_READ[1])
      {
        var x = (((this.gst[5] << 24) >> 16) | this.gst[4]) * 0.00391;
        var y = (((this.gst[7] << 24) >> 16) | this.gst[6]) * 0.00391;
        var z = (((this.gst[9] << 24) >> 16) | this.gst[8]) * 0.00391;

        this.emit('accell', x.toFixed(5), y.toFixed(5), z.toFixed(5), valid);

      } else if(this.gst[2] === commands.MSG_ID_SERIAL_DATA[0] && this.gst[3] === commands.MSG_ID_SERIAL_DATA[1]){

        this.emit('serial', this.gst.slice(4,this.gst.length-2), valid);

      } else if(command === (commands.MSG_ID_CC_TEMP_READ[0] << 8 ) + commands.MSG_ID_CC_TEMP_READ[1]){

        this.emit('temp', this.gst[4], valid);

      }

    else{

      this.emit('invalid', this.gst.slice(2,this.gst.length-2), length, valid, command);

    }

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

  this.chara.write(gattBuffer, false, done);
};

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