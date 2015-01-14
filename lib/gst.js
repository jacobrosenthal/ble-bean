var crc = require('crc');

function wrap(cmdBuffer, payloadBuffer){

  //size buffer contains size of(cmdBuffer, and payloadBuffer) and a reserved byte set to 0
  var sizeBuffer = new Buffer(2);
  sizeBuffer.writeUInt8(cmdBuffer.length + payloadBuffer.length,0);
  sizeBuffer.writeUInt8(0,1);

  return Buffer.concat([sizeBuffer,cmdBuffer,payloadBuffer]);
}

function unwrap(gst){

  var length = gst[0]; //size of thse cmd and payload

  //crc only the size, cmd and payload
  var crcString = crc.crc16ccitt(gst.slice(0,gst.length-2));
  //messy buffer equality because we have to swap bytes and can't use string equality because tostring drops leading zeros
  var crc16 = new Buffer(crcString, 'hex');
  var valid = (crc16[0]===gst[gst.length-1] && crc16[1]===gst[gst.length-2]);
  
  var appMessage = gst.slice(2, gst.length-2);

  var gstObject = {
    length: length,
    appMessage: appMessage,
    valid: valid
  };
  
  return gstObject;
}

module.exports = {
  wrap: wrap,
  unwrap: unwrap
};