//http://mavlink.org/messages/common
const events = require('events');
/**
 * COMMAND_LONG ID:76 http://mavlink.org/messages/common#COMMAND_LONG
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

var command_longMessage = function() {
    //COMMAND_LONG float param1 float param2 float param3 float param4 float param5 float param6 float param7 uint16_t command uint8_t target_system uint8_t target_component uint8_t confirmation
    this.param1=0;
    this.param2=0;
    this.param3=0;
    this.param4=0;
    this.param5=0;
    this.param6=0;
    this.param7=0;
    this.command=0;
    this.target_system=0;
    this.target_component=0;
    this.confirmation=0;

    this.crcCommand_long=152;
    this.crc = 0;
    this.buffer = new Buffer(41);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.eventEmitter = new events.EventEmitter();

    this.read = function(data){
        this.param1 = data.readFloatLE(6);
        this.param2 = data.readFloatLE(10);
        this.param3 = data.readFloatLE(14);
        this.param4 = data.readFloatLE(18);
        this.param5 = data.readFloatLE(22);
        this.param6 = data.readFloatLE(26);
        this.param7 = data.readFloatLE(30);
        this.command = data.readUInt16LE(34);
        this.target_system = data.readUInt8(36);
        this.target_component = data.readUInt8(37);
        this.confirmation = data.readUInt8(38);

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
        this.buffer[5] = 0x4c;
        this.buffer.writeFloatLE(this.param1, 6);
        this.buffer.writeFloatLE(this.param2, 10);
        this.buffer.writeFloatLE(this.param3, 14);
        this.buffer.writeFloatLE(this.param4, 18);
        this.buffer.writeFloatLE(this.param5, 22);
        this.buffer.writeFloatLE(this.param6, 26);
        this.buffer.writeFloatLE(this.param7, 30);
        this.buffer.writeUInt16LE(this.command ,34);
        this.buffer.writeUInt8(this.target_system ,36);
        this.buffer.writeUInt8(this.target_component ,37);
        this.buffer.writeUInt8(this.confirmation ,38);


        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcCommand_long;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };

    this.getData = ()=>{
        return{
            'parameter'         : "COMMAND_LONG",
            'param1'     : this.param1,
            'param2'     : this.param2,
            'param3'     : this.param3,
            'param4'     : this.param4,
            'param5'     : this.param5,
            'param6'     : this.param6,
            'param7'     : this.param7,
            'command'             : this.command ,
            'target_system'              : this.target_system ,
            'target_component'               : this.target_component ,
            'confirmation'        : this.confirmation
        }
    };

};

module.exports.command_longMessage = command_longMessage
