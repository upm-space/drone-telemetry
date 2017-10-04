
    // http://mavlink.org/messages/common
    const events = require('events');
    /**
     * Attitude ID:30 http://mavlink.org/messages/common#ATTITUDE
     */

    class ATTITUDEMessage {
    
  constructor(){
    this.time_boot_ms = 0;
    this.roll = 0;
    this.pitch = 0;
    this.yaw = 0;
    this.rollspeed = 0;
    this.pitchspeed = 0;
    this.yawspeed = 0;
    this.crcATTITUDE = 38;
    this.crc = 0;
    this.crcBuffer = 34;
    this.eventEmitter = new events.EventEmitter();
  }
  read(data) {
    this.time_boot_ms = readUInt32LE(6);
    this.roll = readFloatLE(10);
    this.pitch = readFloatLE(14);
    this.yaw = readFloatLE(18);
    this.rollspeed = readFloatLE(22);
    this.pitchspeed = readFloatLE(26);
    this.yawspeed = readFloatLE(30);
data.copy(this.buffer, 0, 0, this.buffer.length);
this.eventEmitter.emit('data', this.getData());
  }
  getData() {
    return{
      parameter: 'ATTITUDE',
      time_boot_ms = this.time_boot_ms,
      roll = this.roll,
      pitch = this.pitch,
      yaw = this.yaw,
      rollspeed = this.rollspeed,
      pitchspeed = this.pitchspeed,
      yawspeed = this.yawspeed,

    };
  }}