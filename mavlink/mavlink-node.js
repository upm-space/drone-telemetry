const EventEmitter = require('events').EventEmitter;
const MavlinkNode = require('./node-generator/autogenerated/mavlinkV3D0/MavlinkNode.js').MavlinkNode;

const inicioMensaje = false;

//-----------------------------------------------------------------------------
// Objeto principal
class mavlinkMessage extends MavlinkNode {
  constructor() {
    super();
    this.startCharacter = 0xfe;
    this.payloadLength = 0;
    this.packetSequence = 0;
    this.systemID = 1;
    this.componentID = 1;
    this.messageID = 0;
    this.payload = 0;
    this.messageBuffer = new Buffer(512);
    this.bufferIndex = 0;
  }

  decodeMessage(char) {
    if (this.bufferIndex === 0 && char === this.startCharacter) {
      this.messageBuffer[this.bufferIndex] = char;
      this.bufferIndex += 1;
      return;
    }

    if (this.bufferIndex === 1) {
      this.messageBuffer[this.bufferIndex] = char;
      this.payloadLength = char;
      this.bufferIndex += 1;
      return;
    }


    if (this.bufferIndex > 1 && this.bufferIndex < this.payloadLength + 8) {
      this.messageBuffer[this.bufferIndex] = char;
      this.bufferIndex += 1;
    }

    if (this.bufferIndex === this.payloadLength + 8) {
      this.packetSequence = this.messageBuffer[2];
      this.messageID = this.messageBuffer[5];
      // console.log(`Message ID: ${this.messageID}`);

      const messageB = new Buffer(this.payloadLength + 8);
      this.messageBuffer.copy(messageB, 0, 0, this.payloadLength + 8);
      super.readMessage(this.messageID, messageB);

      this.bufferIndex = 0;
      this.payloadLength = 0;
    }
  }

  readBuffer(buffer) {
    for (let i = 0; i < buffer.length; i += 1) {
      this.decodeMessage(buffer[i]);
    }
  }

  readloglist(buffer) {
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
  }

  readlogdata(buffer) {
    this.log_dataR.read(buffer);
    this.log_dataR.data.copy(this.logbuffer, this.log_dataR.ofs, 0, this.log_dataR.count);
    this.logbytes += this.log_dataR.count;

    if (this.logoffset !== this.log_dataR.ofs) {
      console.log('ERROR AL RECIBIR EL LOG!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    }

    this.emit('paqueteLog', this.logbytes, this.logsize);

    if (this.logbytes == this.logsize) {
      this.logoffset = 0;
      this.logbytes = 0;
      this.emit('logRecibido', this.log_dataR.id);
    }
    this.logoffset += 90;
  }

  createLogBuffer(size) {
    this.logbuffer = new Buffer(size);
  }
}
/*
mavlinkMessage.super_ = EventEmitter;
mavlinkMessage.prototype = Object.create(EventEmitter.prototype, {
  constructor: {
    value: mavlinkMessage,
    enumerable: false,
  },
});
*/

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