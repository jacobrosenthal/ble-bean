var SCRATCH_UUID = 'a495ff20c5b14b44b5121370f02d74de';
var SCRATCH_FOUR = 'a495ff24c5b14b44b5121370f02d74de';

function ScratchFour() {
}

ScratchFour.prototype.readFour = function(callback) {
  this.readDataCharacteristic(SCRATCH_UUID, SCRATCH_FOUR, callback);
};

ScratchFour.prototype.writeFour = function(data, callback) {
  this.writeDataCharacteristic(SCRATCH_UUID, SCRATCH_FOUR, data, callback);
};

ScratchFour.prototype.notifyFour = function(onRead, callback) {
  this.notifyCharacteristic(SCRATCH_UUID, SCRATCH_FOUR, true, onRead, callback);
};

ScratchFour.prototype.unnotifyFour = function(onRead, callback) {
  this.notifyCharacteristic(SCRATCH_UUID, SCRATCH_FOUR, false, onRead, callback);
};

module.exports = ScratchFour;