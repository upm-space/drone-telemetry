//http://mavlink.org/messages/common
const events = require('events');
/**
 * Set_mode ID:11 http://mavlink.org/messages/common#SET_MODE
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

var set_modeMessage = function() {
    //SET_MODE uint32_t custom_mode uint8_t target_system uint8_t base_mode
    this.custom_mode=0;
    this.target_system=1;
    this.base_mode=1;

    this.crcSet_mode=89;
    this.crc = 0;
    this.buffer = new Buffer(14);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.eventEmitter = new events.EventEmitter();

    this.read = function(data){
        this.custom_mode = data.readUInt32LE(6);
        this.target_system = data.readUInt(10);
        this.base_mode = data.readUInt(11);

        data.copy(this.buffer,0,0,this.buffer.length);
        this.eventEmitter.emit('data',this.getData());
    };

    this.createBuffer = function(mode){
        this.custom_mode = mode;
        this.buffer = sendMessage(this.buffer);
        this.buffer[0] = 0xfe;
        this.buffer[1] = this.buffer.length-8;
        //this.buffer[2] = 2;
        this.buffer[3] = 1;
        this.buffer[4] = 1;
        this.buffer[5] = 0xb;
        this.buffer.writeUInt32LE(this.custom_mode, 6);
        this.buffer.writeUInt8(this.target_system, 10);
        this.buffer.writeUInt8(this.base_mode, 11);


        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcSet_mode;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };

    this.getData = ()=>{
        return{
            'parameter'         : "SET_MODE",
            'custom_mode'     : this.custom_mode,
            'target_system'     : this.target_system,
            'base_mode'     : this.base_mode
        }
    };
};

module.exports.set_modeMessage = set_modeMessage
