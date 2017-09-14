//http://mavlink.org/messages/common
const events = require('events');
/**
 * Attitude ID:42 http://mavlink.org/messages/common#MISSION_CURRENT
 */
var heartbeatMessage = function() {
    //MISSION_CURRENT uint16_t seq
    this.seq=0;

    this.crcMission_current=28;
    this.crc = 0;
    this.buffer = new Buffer(10);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.eventEmitter = new events.EventEmitter();

    this.read = function(data){
        this.seq = data.readUInt16LE(6);

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
        this.buffer[5] = 0x2a;
        this.buffer.writeUInt16LE(this.seq, 6);

        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcMission_current;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };

    this.getData = ()=>{
        return{
            'parameter'         : "MISSION_CURRENT",
            'seq'     : this.seq
        }
    };

};

module.exports.mission_currentMessage = mission_currentMessage