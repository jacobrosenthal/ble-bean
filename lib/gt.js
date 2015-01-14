var crc = require('crc');

//but not altering count right, need to increment before?
function wrap(gstBuffer, count){

  var crcString = crc.crc16ccitt(gstBuffer);
  var crc16Buffer = new Buffer(crcString, 'hex');

  //GATT contains sequence header, gstBuffer and crc166
  var gattBuffer = new Buffer(1 + gstBuffer.length + crc16Buffer.length);

  var header = (((count * 0x20) | 0x80) & 0xff);
  gattBuffer[0]=header;

  gstBuffer.copy(gattBuffer,1,0); //copy gstBuffer into gatt shifted right 1

  //swap 2 crc bytes and add to end of gatt
  gattBuffer[gattBuffer.length-2]=crc16Buffer[1];
  gattBuffer[gattBuffer.length-1]=crc16Buffer[0];

  return gattBuffer;
}

function unwrap(gt, done){

  var gtObject = {
    start: (gt[0] & 0x80),        //Set to 1 for the first packet of each App Message, 0 for every other packet
    messageCount: (gt[0] & 0x60), //Increments and rolls over on each new GT Message (0, 1, 2, 3, 0, ...)
    packetCount: (gt[0] & 0x1F),  //Represents the number of packets remaining in the GST message
    payload: gt.slice(1)              //TODO probably only if messageCount is in order
  };

  return gtObject;
}

module.exports = {
  wrap: wrap,
  unwrap: unwrap
};