var inicioMensaje = false;

//-------------------------------------------------------------------------------------------------------------------------------------------
//DEFINICION DE PARAMETROS

let heartbeatMessage = require('./messages/heartbeat.js');
let sys_statusMessage = require('./messages/sys_status.js');
let gps_raw_intMessage = require('./messages/gps_raw_int.js');
let attitudeMessage = require('./messages/attitude.js');
let mission_currentMessage = require('./messages/mission_current.js');
let nav_controller_outputMessage = require('./messages/nav_controller_output.js');
let vfr_hudMessage = require('./messages/vfr_hud.js');
//-------------------------------------------------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------------------------------------------------
//Calcula Crc-16/x.25
var calculateChecksum = function(buffer) {
    checksum = 0xffff;
    for (var i = 0; i < buffer.length; i++) {
        var tmp = buffer[i] ^ (checksum & 0xff);
        tmp = (tmp ^ (tmp<<4)) & 0xFF;
        checksum = (checksum>>8) ^ (tmp<<8) ^ (tmp<<3) ^ (tmp>>4);
        checksum = checksum & 0xFFFF;
    }
    return checksum;
}
//-------------------------------------------------------------------------------------------------------------------------------------------


//-------------------------------------------------------------------------------------------------------------------------------------------
//Objeto principal
var mavlinkMessage = function(){
    this.startCharacter = 0xfe;
    this.payloadLength = 0;
    this.packetSequence = 0;
    this.systemID = 1;
    this.componentID = 1;
    this.messageID = 0;
    this.payload = 0;
    this.messageBuffer = new Buffer(512);
    this.bufferIndex = 0;


    //Para leer los mensajes que vayan llegando
    this.heartbeatR = new heartbeatMessage.heartbeatMessage();
    this.sys_statusR = new sys_statusMessage.sys_statusMessage();
    this.gps_raw_intR = new gps_raw_intMessage.gps_raw_intMessage();
    this.attitudeR = new attitudeMessage.attitudeMessage();
    this.mission_currentR = new mission_currentMessage.mission_currentMessage();
    this.nav_controller_outputR = new nav_controller_outputMessage.nav_controller_outputMessage();
    this.vfr_hudR = new vfr_hudMessage.vfr_hudMessage();

};



mavlinkMessage.prototype.decodeMessage = function(char){
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

        var messageB = new Buffer(this.payloadLength + 8);
        this.messageBuffer.copy(messageB,0,0,this.payloadLength + 8);

        switch (this.messageID){
            case 0x0: //heartbeat
                this.heartbeatR.read(messageB);
                break;
            case 0x1: //sys_status
                this.sys_statusR.read(messageB);
                break;
            case 0x18: //gps_raw_int
                //this.gps_raw_intR.read(messageB);
                break;
            case 0x1E: //attitud
                this.attitudeR.read(messageB);
                break;
            case 0x2a: //mission_current
                this.mission_currentR.read(messageB);
                break;
            case 0x3e: //nav_controller_output
                this.nav_controller_outputR.read(messageB);
                break;
            case 0x4a: //vfr_hud
                this.vfr_hudR.read(messageB);
                break;

        }

        this.bufferIndex = 0;
        this.payloadLength = 0;
    }
};


mavlinkMessage.prototype.readBuffer = function(buffer){
    for (var i=0; i<buffer.length; i++) {
        this.decodeMessage(buffer[i]);
    }
};

sendMessage = function(payload){
    if (inicioMensaje == false){
        var packetSequence = 0;
        inicioMensaje == true;
    }
    if (packetSequence++ == 255) {
        packetSequence = 0;
    }
    payload[2]=packetSequence;
    return payload
};


module.exports = mavlinkMessage;

