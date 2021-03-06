
// http://mavlink.org/messages/common
const events = require('events');

//----------------------------------------------------------------------------
// Calcula Crc-16/x.25
const calculateChecksum = (buffer) => {
  let checksum = 0xffff;
  for (let i = 0; i < buffer.length; i += 1) {
    let tmp = buffer[i] ^ (checksum & 0xff);
    tmp = (tmp ^ (tmp << 4)) & 0xFF;
    checksum = (checksum >> 8) ^ (tmp << 8) ^ (tmp << 3) ^ (tmp >> 4);
    checksum &= 0xFFFF;
  }
  return checksum;
};

/**
* Attitude ID:30 http://mavlink.org/messages/common#ATTITUDE
*/

class attitudeMessage {
  constructor() {
    this.time_boot_ms = 0;
    this.roll = 0;
    this.pitch = 0;
    this.yaw = 0;
    this.rollspeed = 0;
    this.pitchspeed = 0;
    this.yawspeed = 0;
    this.crcAttitude = 39;
    this.crc = 0;
    this.buffer = new Buffer(36);
    this.crc_buf = new Buffer(34);
    this.eventEmitter = new events.EventEmitter();
  }
  read(data) {
    this.time_boot_ms = data.readUInt32LE(6);
    this.roll = data.readFloatLE(10);
    this.pitch = data.readFloatLE(14);
    this.yaw = data.readFloatLE(18);
    this.rollspeed = data.readFloatLE(22);
    this.pitchspeed = data.readFloatLE(26);
    this.yawspeed = data.readFloatLE(30);
    data.copy(this.buffer, 0, 0, this.buffer.length);
    this.eventEmitter.emit('data', this.getData());
  }
  createBuffer() {
    this.buffer[0] = 0xfe;
    this.buffer[1] = this.buffer.length - 8;
    this.buffer[3] = 1;
    this.buffer[4] = 1;
    this.buffer[5] = 0x1e;
    this.buffer.readUInt32LE(this.time_boot_ms, 6);
    this.buffer.readFloatLE(this.roll, 10);
    this.buffer.readFloatLE(this.pitch, 14);
    this.buffer.readFloatLE(this.yaw, 18);
    this.buffer.readFloatLE(this.rollspeed, 22);
    this.buffer.readFloatLE(this.pitchspeed, 26);
    this.buffer.readFloatLE(this.yawspeed, 30);
    this.buffer.copy(this.crc_buf, 0, 1, this.buffer[1] + 6);
    this.crc_buf[this.crc_buf.length - 1] = this.crcAttitude;
    this.crc = calculateChecksum(this.crc_buf);
    this.buffer.writeUInt16LE(this.crc, this.buffer[1] + 6);
  }
  getData() {
    return {
      parameter: 'ATTITUDE',
      time_boot_ms: this.time_boot_ms,
      roll: this.roll,
      pitch: this.pitch,
      yaw: this.yaw,
      rollspeed: this.rollspeed,
      pitchspeed: this.pitchspeed,
      yawspeed: this.yawspeed,

    };
  }
}

module.exports.attitudeMessage = attitudeMessage;
