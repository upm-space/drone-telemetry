//http://mavlink.org/messages/common
const events = require('events');
/**
 * LOG_REQUEST_LIST ID:117 http://mavlink.org/messages/common#LOG_REQUEST_LIST
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


var log_request_listMessage = function() {
    //LOG_REQUEST_LIST uint16_t start uint16_t end uint8_t target_system uint8_t target_component
    this.start=0;
    this.end=65535;
    this.target_system=1;
    this.target_component=1;

    this.crcLog_request_list=128;
    this.crc = 0;
    this.buffer=new Buffer(14);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.eventEmitter = new events.EventEmitter();

    this.read = function(data){
        this.start=data.readUInt16LE(6);
        this.end=data.readUInt16LE(8);
        this.target_system = data.readUInt8(10);
        this.target_component = data.readUInt8(11);

        data.copy(this.buffer,0,0,this.buffer.length);
        this.eventEmitter.emit('data',this.getData());
    };

    this.createBuffer = function(){
        this.buffer = sendMessage(this.buffer);
        this.buffer[0] = 0xfe;
        this.buffer[1] = this.buffer.length-8;
        //this.buffer[2] = 27;
        this.buffer[3] = 255;
        this.buffer[4] = 190;
        this.buffer[5] = 0x75;
        this.buffer.writeUInt16LE(this.start,6);
        this.buffer.writeUInt16LE(this.end,8);
        this.buffer.writeUInt8(this.target_system,10);
        this.buffer.writeUInt8(this.target_component,11);

        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcLog_request_list;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };

    this.getData = ()=>{
        return{
            'parameter'         : "LOG_REQUEST_LIST",
            'start'     : this.start,
            'end'     : this.end,
            'target_system' : this.target_system,
            'target_component'  : this.target_component
        }
    };
};

module.exports.log_request_listMessage = log_request_listMessage
