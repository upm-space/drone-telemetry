//http://mavlink.org/messages/common
const events = require('events');
/**
 * LOG_DATA ID:120 http://mavlink.org/messages/common#LOG_DATA
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


var log_dataMessage = function() {
    //LOG_DATA uint32_t ofs uint16_t id uint8_t count uint8_t data
    this.ofs=0;
    this.id=0;
    this.count=0;
    this.data = new Buffer(90);

    this.crcLog_data=1;
    this.crc = 0;
    this.buffer=new Buffer(105);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.eventEmitter = new events.EventEmitter();

    this.read = function(bufferIn){
        this.ofs=bufferIn.readUInt32LE(6);
        this.id=bufferIn.readUInt16LE(10);
        this.count=bufferIn.readUInt8(12);
        for (var i=0; i<90; i++) {
            this.data[i]=bufferIn.readUInt8(i+13);
        }

        this.eventEmitter.emit('data',this.getData());

    };

    this.getData = ()=>{
        return{
            'parameter'         : "LOG_DATA",
            'ofs'     : this.ofs,
            'id'     : this.id,
            'count' : this.count,
            'data'  : this.data
        }
    };
};

module.exports.log_dataMessage = log_dataMessage