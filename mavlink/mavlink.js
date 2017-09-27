const EventEmitter = require('events').EventEmitter;

const inicioMensaje = false;

// ------------------------------------------------------------------------
// DEFINICION DE PARAMETROS

const HeartbeatMessage = require('./messages/heartbeat.js');
const sys_statusMessage = require('./messages/sys_status.js');
const gps_raw_intMessage = require('./messages/gps_raw_int.js');
const attitudeMessage = require('./messages/attitude.js');
const mission_currentMessage = require('./messages/mission_current.js');
const nav_controller_outputMessage = require('./messages/nav_controller_output.js');
const vfr_hudMessage = require('./messages/vfr_hud.js');
const command_longMessage = require('./messages/command_long.js');
const command_ackMessage = require('./messages/command_ack.js');
const set_modeMessage = require('./messages/set_mode.js');
const log_request_listMessage = require('./messages/log_request_list.js');
const log_entryMessage = require('./messages/log_entry.js');
const log_request_dataMessage = require('./messages/log_request_data.js');
const log_dataMessage = require('./messages/log_data.js');
//--------------------------------------------------------------------------------------

//--------------------------------------------------------------------------------------
// Calcula Crc-16/x.25
/*
const calculateChecksum = function (buffer) {
  checksum = 0xffff;
  for (let i = 0; i < buffer.length; i++) {
    let tmp = buffer[i] ^ (checksum & 0xff);
    tmp = (tmp ^ (tmp << 4)) & 0xFF;
    checksum = (checksum >> 8) ^ (tmp << 8) ^ (tmp << 3) ^ (tmp >> 4);
    checksum &= 0xFFFF;
  }
  return checksum;
};
*/
//-----------------------------------------------------------------------------


//-----------------------------------------------------------------------------
// Objeto principal
const mavlinkMessage = function () {
  this.startCharacter = 0xfe;
  this.payloadLength = 0;
  this.packetSequence = 0;
  this.systemID = 1;
  this.componentID = 1;
  this.messageID = 0;
  this.payload = 0;
  this.messageBuffer = new Buffer(512);
  this.bufferIndex = 0;


  // Para leer los mensajes que vayan llegando
  this.heartbeatR = new HeartbeatMessage.HeartbeatMessage();
  this.sys_statusR = new sys_statusMessage.sys_statusMessage();
  this.gps_raw_intR = new gps_raw_intMessage.gps_raw_intMessage();
  this.attitudeR = new attitudeMessage.attitudeMessage();
  this.mission_currentR = new mission_currentMessage.mission_currentMessage();
  this.nav_controller_outputR = new nav_controller_outputMessage.nav_controller_outputMessage();
  this.vfr_hudR = new vfr_hudMessage.vfr_hudMessage();
  this.command_ackR = new command_ackMessage.command_ackMessage();

  // Para enviar mensajes
  this.command_longS = new command_longMessage.command_longMessage();
  this.set_modeS = new set_modeMessage.set_modeMessage();

  // Variables para recibir lista de logs
  this.logrequestlist = new log_request_listMessage.log_request_listMessage();
  this.log_entryR = new log_entryMessage.log_entryMessage();

  // Variables para recibir log
  this.logrequestdata = new log_request_dataMessage.log_request_dataMessage();
  this.log_dataR = new log_dataMessage.log_dataMessage();

  this.logoffset = 0;
  this.logsize = 0;
  this.logbytes = 0;
};

mavlinkMessage.super_ = EventEmitter;
mavlinkMessage.prototype = Object.create(EventEmitter.prototype, {
  constructor: {
    value: mavlinkMessage,
    enumerable: false,
  },
});


mavlinkMessage.prototype.decodeMessage = function (char) {
  if (this.bufferIndex == 0 && char == this.startCharacter) {
    this.messageBuffer[this.bufferIndex] = char;
    this.bufferIndex++;
    return;
  }

  if (this.bufferIndex == 1) {
    this.messageBuffer[this.bufferIndex] = char;
    this.payloadLength = char;
    this.bufferIndex++;
    return;
  }


  if (this.bufferIndex > 1 && this.bufferIndex < this.payloadLength + 8) {
    this.messageBuffer[this.bufferIndex] = char;
    this.bufferIndex++;
  }

  if (this.bufferIndex == this.payloadLength + 8) {
    this.packetSequence = this.messageBuffer[2];
    this.messageID = this.messageBuffer[5];

    const messageB = new Buffer(this.payloadLength + 8);
    this.messageBuffer.copy(messageB, 0, 0, this.payloadLength + 8);

    switch (this.messageID) {
    case 0x0: // heartbeat
      this.heartbeatR.read(messageB);
      break;
    case 0x1: // sys_status
      this.sys_statusR.read(messageB);
      break;
    case 0x18: // gps_raw_int
      // this.gps_raw_intR.read(messageB);
      break;
    case 0x1E: // attitud
      this.attitudeR.read(messageB);
      break;
    case 0x2a: // mission_current
      this.mission_currentR.read(messageB);
      break;
    case 0x3e: // nav_controller_output
      this.nav_controller_outputR.read(messageB);
      break;
    case 0x4a: // vfr_hud
      this.vfr_hudR.read(messageB);
      break;
    case 0x4d: // command_ack
      this.command_ackR.read(messageB);
      break;
    case 0x76: // log_entry
      this.readloglist(messageB);
      break;
    case 0x78: // log_data
      this.readlogdata(messageB);
      break;
    }

    this.bufferIndex = 0;
    this.payloadLength = 0;
  }
};


mavlinkMessage.prototype.readBuffer = function (buffer) {
  for (let i = 0; i < buffer.length; i++) {
    this.decodeMessage(buffer[i]);
  }
};

mavlinkMessage.prototype.readloglist = function (buffer) {
  this.log_entryR.read(buffer);
  const logentryname = `log_entry${this.log_entryR.id}`;
  // this[logentryname] = Object.assign({},this.log_entryR);
  this[logentryname] = new log_entryMessage.log_entryMessage();
  this[logentryname].id = this.log_entryR.id;
  this[logentryname].size = this.log_entryR.size;
  console.log(this[logentryname].id);
  this.loglistContador++;

  this.emit('logEntryRecibido', this.loglistContador, this.log_entryR.numLogs, this.log_entryR.size);

  if (this.log_entryR.id == this.log_entryR.numLogs) {
    /* if(this.loglistContador != this.log_entryR.numLogs){
            console.log("ERROR EN LA ENTREGA");
            console.log("NUEVA PETICION");
            this.emit("pedirListaLogs");
        } */
    if (this.loglistContador == this.log_entryR.numLogs) {
      this.emit('listaLogsRecibida');
    }
  }
};

mavlinkMessage.prototype.readlogdata = function (buffer) {
  this.log_dataR.read(buffer);
  this.log_dataR.data.copy(this.logbuffer, this.log_dataR.ofs, 0, this.log_dataR.count);
  this.logbytes += this.log_dataR.count;

  if (this.logoffset != this.log_dataR.ofs) {
    console.log('ERROR AL RECIBIR EL LOG!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  }

  this.emit('paqueteLog', this.logbytes, this.logsize);

  if (this.logbytes == this.logsize) {
    this.logoffset = 0;
    this.logbytes = 0;
    this.emit('logRecibido', this.log_dataR.id);
  }
  this.logoffset += 90;
};

mavlinkMessage.prototype.createLogBuffer = function (size) {
  this.logbuffer = new Buffer(size);
};


sendMessage = function (payload) {
  if (inicioMensaje == false) {
    var packetSequence = 0;
    inicioMensaje == true;
  }
  if (packetSequence++ == 255) {
    packetSequence = 0;
  }
  payload[2] = packetSequence;
  return payload;
};


module.exports = mavlinkMessage;
