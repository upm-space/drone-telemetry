//http://mavlink.org/messages/common
const events = require('events');
/**
 * Attitude ID:0 http://mavlink.org/messages/common#HEARTBEAT
 */
var heartbeatMessage = function() {
    //HEARTBEAT uint32_t custom_mode uint8_t type uint8_t autopilot uint8_t base_mode uint8_t system_status uint8_t mavlink_version
    this.type=1; //fixed wing
    this.autopilot=12; //px4
    this.base_mode=0;
    this.custom_mode=0;
    this.system_status=0;
    this.mavlink_version=0;

    this.crcHeartbeat=50;
    this.crc = 0;
    this.buffer = new Buffer(17);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.eventEmitter = new events.EventEmitter();

    this.read = function(data){
        this.custom_mode = data.readUInt32LE(6);
        this.type = data.readUInt8(10);
        this.autopilot = data.readUInt8(11);
        this.base_mode = data.readUInt8(12);
        this.system_status = data.readUInt8(13);
        this.mavlink_version = data.readUInt8(14);
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
        this.buffer[5] = 0x0;
        this.buffer.writeUInt32LE(this.custom_mode, 6);
        this.buffer.writeUInt8(this.type ,10);
        this.buffer.writeUInt8(this.autopilot ,11);
        this.buffer.writeUInt8(this.base_mode ,12);
        this.buffer.writeUInt8(this.system_status ,13);
        this.buffer.writeUInt8(this.mavlink_version,14);

        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcHeartbeat;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };

    this.getData = ()=>{
        return{
            'parameter'         : "HEARTBEAT",
            'custom_mode'     : this.custom_mode,
            'type'             : this.type ,
            'autopilot'              : this.autopilot ,
            'base_mode'               : this.base_mode ,
            'system_status'        : this.system_status ,
            'mavlink_version'         : this.mavlink_version
        }
    };

};

module.exports.heartbeatMessage = heartbeatMessage