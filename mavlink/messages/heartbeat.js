// http://mavlink.org/messages/common
const events = require('events');
/**
 * HEARTBEAT ID:0 http://mavlink.org/messages/common#HEARTBEAT
 */

//-------------------------------------------------------------------------------------------------------------------------------------------
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

class HeartbeatMessage {
  constructor() {
    // HEARTBEAT uint32_t custom_mode uint8_t type uint8_t autopilot uint8_t base_mode uint8_t
    // system_status uint8_t mavlink_version
    this.type = 1; // fixed wing
    this.autopilot = 12; // px4
    this.base_mode = 0;
    this.custom_mode = 0;
    this.system_status = 0;
    this.mavlink_version = 0;

    this.armDisarm = '';
    this.flightMode = '';
    this.mav_autopilot = '';
    this.mav_type = '';

    this.crcHeartbeat = 50;
    this.crc = 0;
    this.buffer = new Buffer(17);
    this.crc_buf = new Buffer(this.buffer.length - 2);

    this.eventEmitter = new events.EventEmitter();
  }

  read(data) {
    this.custom_mode = data.readUInt32LE(6);
    this.type = data.readUInt8(10);
    this.autopilot = data.readUInt8(11);
    this.base_mode = data.readUInt8(12);
    this.system_status = data.readUInt8(13);
    this.mavlink_version = data.readUInt8(14);
    data.copy(this.buffer, 0, 0, this.buffer.length);
    this.getStatus(this.base_mode, this.custom_mode, this.autopilot, this.type);
    this.eventEmitter.emit('data', this.getData());
  }

  createBuffer() {
    this.buffer = sendMessage(this.buffer);
    this.buffer[0] = 0xfe;
    this.buffer[1] = this.buffer.length - 8;
    // this.buffer[2] = 2;
    this.buffer[3] = 1;
    this.buffer[4] = 1;
    this.buffer[5] = 0x0;
    this.buffer.writeUInt32LE(this.custom_mode, 6);
    this.buffer.writeUInt8(this.type, 10);
    this.buffer.writeUInt8(this.autopilot, 11);
    this.buffer.writeUInt8(this.base_mode, 12);
    this.buffer.writeUInt8(this.system_status, 13);
    this.buffer.writeUInt8(this.mavlink_version, 14);

    this.buffer.copy(this.crc_buf, 0, 1, this.buffer[1] + 6);
    this.crc_buf[this.crc_buf.length - 1] = this.crcHeartbeat;
    this.crc = calculateChecksum(this.crc_buf);
    this.buffer.writeUInt16LE(this.crc, this.buffer[1] + 6);
  }

  getStatus(baseMode, customMode, autopilot, type) {
    if (baseMode == 89 || baseMode == 81) {
      this.armDisarm = 'Disarmed';
    }
    if (baseMode == 217 || baseMode == 209) {
      this.armDisarm = 'Armed';
    }
    switch (customMode) {
    case 0:
      this.flightMode = 'Manual';
      break;
    case 2:
      this.flightMode = 'Stabilize';
      break;
    case 10:
      this.flightMode = 'Auto';
      break;
    case 11:
      this.flightMode = 'RTL';
      break;
    case 12:
      this.flightMode = 'Loiter';
      break;
    case 15:
      this.flightMode = 'Guided';
      break;
    default:
      this.flightMode = 'Manual';
      break;
    }
    switch (autopilot) {
    case 3:
      this.mav_autopilot = 'Ardupilotmega';
      break;
    case 12:
      this.mav_autopilot = 'PX4';
      break;
    default:
      this.mav_autopilot = 'Ardupilotmega';
      break;
    }
    switch (type) {
    case 0:
      this.mav_type = 'Generic';
      break;
    case 1:
      this.mav_type = 'Fixed wing';
      break;
    case 2:
      this.mav_type = 'Quadrotor';
      break;
    case 6:
      this.mav_type = 'GCS';
      break;
    default:
      this.mav_type = 'Generic';
      break;
    }
  }

  getData() {
    return {
      parameter: 'HEARTBEAT',
      custom_mode: this.custom_mode,
      type: this.type,
      autopilot: this.autopilot,
      base_mode: this.base_mode,
      system_status: this.system_status,
      mavlink_version: this.mavlink_version,
      armDisarm: this.armDisarm,
      flightMode: this.flightMode,
      mav_autopilot: this.mav_autopilot,
      mav_type: this.mav_type,
    };
  }
}

module.exports.HeartbeatMessage = HeartbeatMessage;
