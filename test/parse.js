'use strict';

var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;

var Bean = require('../');

var ACCELLEROMETER_DATA = new Buffer([0x80, 0x09, 0x00, 0x20, 0x90, 0xc4, 0x00, 0xe4, 0xff, 0x6d, 0x00, 0x02, 0x03, 0x7e]);
var TEMP_DATA = new Buffer([0xa0, 0x03, 0x00, 0x20, 0x91, 0x15, 0x56, 0x10]);
var SERIAL_DATA = Buffer([0xc0, 0x07, 0x00, 0x00, 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x0f, 0x62]);
var BAD_SERIAL_DATA = Buffer([0xc0, 0x07, 0x00, 0x00, 0x00, 0x49, 0x65, 0x6c, 0x6c, 0x6f, 0x0f, 0x62]);


describe('Bean', function () {
  var sandbox;
  var bean;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    bean = new Bean();
    bean.writeDataCharacteristic = function(SERIAL_UUID, BEAN_SERIAL_CHAR_UUID, gattBuffer, done){done();};
  });

  // afterEach(function () {

  //   sandbox.restore();
  // });

  //accell temp serial
  describe('Emitting', function () {
    it('emits raw on receive', function (done) {
      bean.on('raw', function(buf, length, valid, command){
        done();
      });
      bean._onRead(ACCELLEROMETER_DATA);
    });

    it('emits acell on accell', function (done) {
      bean.on('accell', function(x, y, z, valid){
        done();
      });
      bean._onRead(ACCELLEROMETER_DATA);
    });

    it('emits temp on temp', function (done) {
      bean.on('temp', function(temp, valid){
        done();
      });
      bean._onRead(TEMP_DATA);
    });

    it('emits serial on serial', function (done) {
      bean.on('serial', function(data, valid){
        done();
      });
      bean._onRead(SERIAL_DATA);
    });
  });

  describe('Parse', function () {

    it('parses raw data', function (done) {
      bean.on('raw', function(buf, length, valid){
        expect(buf).to.eql(new Buffer([0x20, 0x90, 0xc4, 0x00, 0xe4, 0xff, 0x6d, 0x00, 0x02]));
        expect(length).to.eql(9);
        expect(valid).to.eql(true);

        done();
      });
      bean._onRead(ACCELLEROMETER_DATA);
    });

    it.skip('parses acell on accell', function (done) {
      bean.on('accell', function(x, y, z, valid){
        expect(x).to.eql(0.76636);
        expect(y).to.eql(-0.10948);
        expect(z).to.eql(0.42619);
        expect(valid).to.eql(true);

        done();
      });
      bean._onRead(ACCELLEROMETER_DATA);
    });

    it('parses temp on temp', function (done) {
      bean.on('temp', function(temp, valid){
        expect(temp).to.eql(21);
        expect(valid).to.eql(true);

        done();
      });
      bean._onRead(TEMP_DATA);
    });

    it('parses serial on serial', function (done) {
      bean.on('serial', function(data, valid){
        expect(data).to.eql(new Buffer([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
        expect(valid).to.eql(true);

        done();
      });
      bean._onRead(SERIAL_DATA);
    });


    it('returns invalid on bad checksum', function (done) {
      bean.on('raw', function(data, valid){
        expect(valid).to.not.eql(true);

        done();
      });
      bean._onRead(BAD_SERIAL_DATA);
    });

    it.skip('emits invalid on bad checksum', function (done) {
      bean.on('invalid', function(data, length, valid, command){
        done();
      });
      bean._onRead(BAD_SERIAL_DATA);
    });

  });

  describe('Send', function () {

    it('requests led on', function (done) {
      var spy = sandbox.spy(bean, 'writeDataCharacteristic');
      bean.setColor(new Buffer([0x04, 0x1f, 0x5c]), function(){
        expect(spy.args[0][2]).to.eql(new Buffer([0x80, 0x05, 0x00, 0x20, 0x01, 0x04, 0x1f, 0x5c, 0x9d, 0xa2]));
        done();
      });
    });

    it('requests accell', function (done) {
      var spy = sandbox.spy(bean, 'writeDataCharacteristic');
      bean.requestAccell(
      function(){
        expect(spy.args[0][2]).to.eql(new Buffer([0x80, 0x02, 0x00, 0x20, 0x10, 0x7f, 0x7d]));
        done();
      });
    });

    it('requests temp', function (done) {
      var spy = sandbox.spy(bean, 'writeDataCharacteristic');
      bean.requestTemp(
      function(){
        expect(spy.args[0][2]).to.eql(new Buffer([0x80, 0x02, 0x00, 0x20, 0x11, 0x5e, 0x6d]));
        done();
      });
    });

    it('requests ungate', function (done) {
      var spy = sandbox.spy(bean, 'writeDataCharacteristic');
      bean.unGate(
        function(){
        expect(spy.args[0][2]).to.eql(new Buffer([0x80, 0x02, 0x00, 0x05, 0x50, 0xa8, 0xcc]));
        done();
      });
    });


    it('requests led off', function (done) {
      var spy = sandbox.spy(bean, 'writeDataCharacteristic');
      bean.setColor(new Buffer([0x00, 0x00, 0x00]), function(){
        expect(spy.args[0][2]).to.eql(new Buffer([0x80, 0x05, 0x00, 0x20, 0x01, 0x00, 0x00, 0x00, 0x69, 0xf6]));
        done();
      });
    });

    it('increments counter', function (done) {
      var spy = sandbox.spy(bean, 'writeDataCharacteristic');
      bean.setColor(new Buffer([0x00, 0x00, 0x00]), function(){
        bean.setColor(new Buffer([0x00, 0x00, 0x00]), function(){
          expect(spy.args[1][2]).to.eql(new Buffer([0xa0, 0x05, 0x00, 0x20, 0x01, 0x00, 0x00, 0x00, 0x69, 0xf6]));
          done();
        });
      });
    });

    it('rolls over counter', function (done) {
      var spy = sandbox.spy(bean, 'writeDataCharacteristic');
      bean.setColor(new Buffer([0x00, 0x00, 0x00]), function(){
        bean.setColor(new Buffer([0x00, 0x00, 0x00]), function(){
          bean.setColor(new Buffer([0x00, 0x00, 0x00]), function(){
            bean.setColor(new Buffer([0x00, 0x00, 0x00]), function(){
              bean.setColor(new Buffer([0x00, 0x00, 0x00]), function(){
                expect(spy.args[4][2]).to.eql(new Buffer([0x80, 0x05, 0x00, 0x20, 0x01, 0x00, 0x00, 0x00, 0x69, 0xf6]));
                done();
              });
            });
          });
        });
      });
    });

  });

});

