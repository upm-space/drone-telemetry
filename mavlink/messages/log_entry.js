//http://mavlink.org/messages/common
const events = require('events');
/**
 * LOG_ENTRY ID:118 http://mavlink.org/messages/common#LOG_ENTRY
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


var log_entryMessage = function() {
    //LOG_ENTRY uint32_t time_utc uint32_t size uint16_t id uint16_t num_logs uint16_t last_log_num
    this.time_utc=0;
    this.size=0;
    this.id=0;
    this.num_logs=0;
    this.last_log_num=0;

    this.crcLog_entry=56;
    this.crc = 0;
    this.buffer=new Buffer(22);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.eventEmitter = new events.EventEmitter();

    this.read = function(data){
        this.time_utc=data.readUInt32LE(6);
        this.size=data.readUInt32LE(10);
        this.id=data.readUInt16LE(14);
        this.num_logs=data.readUInt16LE(16);
        this.last_log_num=data.readUInt16LE(18);

        data.copy(this.buffer,0,0,this.buffer.length);
        this.eventEmitter.emit('data',this.getData());
    };

    this.createBuffer = function(){
        this.buffer = sendMessage(this.buffer);
        this.buffer[0] = 0xfe;
        this.buffer[1] = this.buffer.length-8;
        //this.buffer[2] = 3;
        this.buffer[3] = 1;
        this.buffer[4] = 1;
        this.buffer[5] = 0x76;
        this.buffer.writeUInt32LE(this.time_utc,6);
        this.buffer.writeUInt32LE(this.size,10);
        this.buffer.writeUInt16LE(this.id,14);
        this.buffer.writeUInt16LE(this.num_logs,16);
        this.buffer.writeUInt16LE(this.last_log_num,18);

        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcLog_entry;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };

    this.getData = ()=>{
        return{
            'parameter'         : "LOG_ENTRY",
            'time_utc'     : this.time_utc,
            'size'     : this.size,
            'id' : this.id,
            'num_logs'  : this.num_logs,
            'last_log_num' : this.last_log_num
        }
    };
};

module.exports.log_entryMessage = log_entryMessage