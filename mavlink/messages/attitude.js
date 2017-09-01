//http://mavlink.org/messages/common
const events = require('events');
/**
 * Attitude ID:30 http://mavlink.org/messages/common#ATTITUDE
 */
var attitudeMessage = function() {
    //ATTITUDE uint32_t time_boot_ms float roll float pitch float yaw float rollspeed float pitchspeed float yawspeed
    this.time_boot_ms=0;
    this.roll=0;
    this.pitch=0;
    this.yaw=0;
    this.rollspeed=0;
    this.pitchspeed=0;
    this.yawspeed=0;
    this.crcAttitude=39;
    this.crc = 0;
    this.buffer=new Buffer(36);
    this.crc_buf = new Buffer(this.buffer.length-2);
    this.eventEmitter = new events.EventEmitter();

    this.read = function(data){
        this.time_boot_ms = data.readUInt32LE(6);
        this.pitch = data.readFloatLE(10);
        this.roll = data.readFloatLE(14);
        this.yaw = data.readFloatLE(18);
        this.pitchspeed = data.readFloatLE(22);
        this.rollspeed = data.readFloatLE(26);
        this.yawspeed = data.readFloatLE(30);
        data.copy(this.buffer,0,0,this.buffer.length);
        this.eventEmitter.emit('data',this.getData());
    };

    this.createBuffer = function(){
        this.buffer = sendMessage(this.buffer);
        this.buffer[0] = 0xfe;
        this.buffer[1] = this.buffer.length-8;;
        //this.buffer[2] = 3;
        this.buffer[3] = 1;
        this.buffer[4] = 1;
        this.buffer[5] = 0x1e;
        this.buffer.writeFloatLE(this.time_boot_ms,6);
        this.buffer.writeFloatLE(this.pitch,10);
        this.buffer.writeFloatLE(this.roll,14);
        this.buffer.writeFloatLE(this.yaw,18);
        this.buffer.writeFloatLE(this.pitchspeed,22);
        this.buffer.writeFloatLE(this.rollspeed,26);
        this.buffer.writeFloatLE(this.yawspeed,30);

        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcAttitude;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };

    this.getData = ()=>{
        return{
            'time_boot_mst'     : this.time_boot_ms,
            'pitch'             : this.pitch ,
            'roll'              : this.roll ,
            'yaw'               : this.yaw ,
            'pitchspeed'        : this.pitchspeed ,
            'rollspeed'         : this.rollspeed ,
            'yawspeed'          : this.yawspeed

            }


    }
};

module.exports.attitudeMessage = attitudeMessage