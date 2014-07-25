/*jslint node: true */
"use strict";

var EventEmitter = require('events').EventEmitter;
var util = require('util');

var UUID = 'a495ff20c5b14b44b5121370f02d74de';

var SCRATCH1 = 'a495ff21c5b14b44b5121370f02d74de';
var SCRATCH2 = 'a495ff22c5b14b44b5121370f02d74de';
var SCRATCH3 = 'a495ff23c5b14b44b5121370f02d74de';
var SCRATCH4 = 'a495ff24c5b14b44b5121370f02d74de';
var SCRATCH5 = 'a495ff25c5b14b44b5121370f02d74de';

module.exports = {
  Scratch : Scratch,
  UUID : UUID
};

function Scratch(service) {
  if (!(this instanceof Scratch)) 
  return new Scratch();
  
  EventEmitter.call(this);

  var self = this;

  this.count = 0;

  service.discoverCharacteristics([], function(err, characteristics){
    self._initialize(err, characteristics);
  });

}
util.inherits(Scratch, EventEmitter);

Scratch.prototype._initialize = function(err,characteristics) {
    var self = this;
    characteristics.forEach(function(characteristic){
      if(characteristic.uuid === SCRATCH1){
        
        self.chara1 = characteristic;
        self.chara1.on('read', self._onRead1.bind(self));
        self.chara1.notify(true, function(err) {
          if (err) throw err;
          console.log('Successfully subscribed to Scratch1 notifications.');
        });

      }else if(characteristic.uuid === SCRATCH2){

        self.chara2 = characteristic;
        self.chara2.on('read', self._onRead2.bind(self));
        self.chara2.notify(true, function(err) {
          if (err) throw err;
          console.log('Successfully subscribed to Scratch2 notifications.');
        });

      }else if(characteristic.uuid === SCRATCH3){

        self.chara3 = characteristic;
        self.chara3.on('read', self._onRead3.bind(self));
        self.chara3.notify(true, function(err) {
          if (err) throw err;
          console.log('Successfully subscribed to Scratch3 notifications.');
        });

      }else if(characteristic.uuid === SCRATCH4){

        self.chara4 = characteristic;
        self.chara4.on('read', self._onRead4.bind(self));
        self.chara4.notify(true, function(err) {
          if (err) throw err;
          console.log('Successfully subscribed to Scratch4 notifications.');
        });

      }else if(characteristic.uuid === SCRATCH5){

        self.chara5 = characteristic;
        self.chara5.on('read', self._onRead5.bind(self));
        self.chara5.notify(true, function(err) {
          if (err) throw err;
          console.log('Successfully subscribed to Scratch5 notifications.');
        });

      }
    });

    this.emit('ready',err);
};

Scratch.prototype._onRead1 = function(data){
  this.emit('scratch1',data);
};

Scratch.prototype._onRead2 = function(data){
  this.emit('scratch2',data);
};

Scratch.prototype._onRead3 = function(data){
  this.emit('scratch3',data);
};

Scratch.prototype._onRead4 = function(data){
  this.emit('scratch4',data);
};

Scratch.prototype._onRead5 = function(data){
  this.emit('scratch5',data);
};

Scratch.prototype.write1 = function(data, callback){
  this.chara1.write(data, false, function(error){
    callback(error);
  });
};

Scratch.prototype.write2 = function(data, callback){
  this.chara2.write(data, false, function(error){
    callback(error);
  });
};

Scratch.prototype.write3 = function(data, callback){
  this.chara3.write(data, false, function(error){
    callback(error);
  });
};

Scratch.prototype.write4 = function(data, callback){
  this.chara4.write(data, false, function(error){
    callback(error);
  });
};

Scratch.prototype.write5 = function(data, callback){
  this.chara5.write(data, false, function(error){
    callback(error);
  });
};



