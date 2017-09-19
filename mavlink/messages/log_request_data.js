//http://mavlink.org/messages/common
const events = require('events');
/**
 * LOG_REQUEST_DATA ID:119 http://mavlink.org/messages/common#LOG_REQUEST_DATA
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

var log_request_dataMessage = function() {
    //LOG_REQUEST_DATA uint32_t ofs uint32_t count uint16_t id uint8_t target_system uint8_t target_component
    this.ofs=0;
    this.count=0;
    this.id=0;
    this.target_system=0;
    this.target_component=0;

    this.crcLog_request_data=116;
    this.crc = 0;
    this.buffer=new Buffer(20);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.eventEmitter = new events.EventEmitter();

    this.read = function(data){
        this.ofs=data.readUInt32LE(6);
        this.count=data.readUInt32LE(10);
        this.id=data.readUInt16LE(14);
        this.target_system=data.readUInt8(16);
        this.target_component=data.readUInt8(17);

        data.copy(this.buffer,0,0,this.buffer.length);
        this.eventEmitter.emit('data',this.getData());
    };

    this.createBuffer = function(){
        this.buffer = sendMessage(this.buffer);
        this.buffer[0] = 0xfe;
        this.buffer[1] = this.buffer.length-8;
        //this.buffer[2] = 3;
        this.buffer[3] = 255;
        this.buffer[4] = 190;
        this.buffer[5] = 0x77;
        this.buffer.writeUInt32LE(this.ofs,6);
        this.buffer.writeUInt32LE(this.count,10);
        this.buffer.writeUInt16LE(this.id,14);
        this.buffer.writeUInt8(this.target_system,16);
        this.buffer.writeUInt8(this.target_component,17);

        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcLog_request_data;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };

    this.getData = ()=>{
        return{
            'parameter'         : "LOG_REQUEST_DATA",
            'ofs'     : this.ofs,
            'count'     : this.count,
            'id' : this.id,
            'target_system'  : this.target_system,
            'target_component' : this.target_component
        }
    };
};

module.exports.log_request_dataMessage = log_request_dataMessage
