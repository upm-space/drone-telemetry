//http://mavlink.org/messages/common
const events = require('events');
/**
 * Command_ack ID:77 http://mavlink.org/messages/common#COMMAND_ACK
 */

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

var command_ackMessage = function() {
    //COMMAND_ACK uint16_t command uint8_t result
    this.command=0;
    this.result=0;

    this.crcCommand_ack=143;
    this.crc = 0;
    this.buffer = new Buffer(11);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.eventEmitter = new events.EventEmitter();

    this.read = function(data){
        this.command = data.readUInt16LE(6);
        this.result = data.readUInt8(8);

        data.copy(this.buffer,0,0,this.buffer.length);
        this.eventEmitter.emit('data',this.getData());
    };

    this.createBuffer = function(){
        this.buffer = sendMessage(this.buffer);
        this.buffer[0] = 0xfe;
        this.buffer[1] = this.buffer.length-8;
        //this.buffer[2] = 2;
        this.buffer[3] = 1;
        this.buffer[4] = 1;
        this.buffer[5] = 0x4d;
        this.buffer.writeUInt16LE(this.command, 6);
        this.buffer.writeUInt(this.result, 8);


        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcCommand_ack;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };

    this.getData = ()=>{
        return{
            'parameter'         : "COMMAND_ACK",
            'command'     : this.command,
            'result'     : this.result,
        }
    };
};

module.exports.command_ackMessage = command_ackMessage