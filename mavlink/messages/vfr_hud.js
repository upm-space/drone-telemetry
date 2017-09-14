//http://mavlink.org/messages/common
const events = require('events');
/**
 * Attitude ID:74 http://mavlink.org/messages/common#VFR_HUD
 */
var vfr_hudMessage = function() {
    //VRF_HUD float airspeed float groundspeed float alt float climb int16_t heading uint16_t throttle
    this.airspeed=0;
    this.groundspeed=0;
    this.heading=0;
    this.throttle=0;
    this.alt=0;
    this.climb=0;


    this.crcVfr_hud=111;
    this.crc = 0;
    this.buffer = new Buffer(28);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.eventEmitter = new events.EventEmitter();

    this.read = function(data){
        this.airspeed = data.readFloatLE(6);
        this.groundspeed=data.readFloatLE(10);
        this.heading=data.readFloatLE(14);
        this.throttle=data.readFloatLE(18);
        this.alt=data.readInt16LE(22);
        this.climb=data.readUInt16LE(24);

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
        this.buffer[5] = 0x4a;
        this.buffer.writeFloatLE(this.airspeed, 6);
        this.buffer.writeFloatLE(this.groundspeed, 10);
        this.buffer.writeFloatLE(this.heading, 14);
        this.buffer.writeFloatLE(this.throttle, 18);
        this.buffer.writeInt16LE(this.alt, 22);
        this.buffer.writeUInt16LE(this.climb, 24);


        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcVfr_hud;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };

    this.getData = ()=>{
        return{
            'parameter'         : "VFR_HUD",
            'airspeed'     : this.airspeed,
            'groundspeed'     : this.groundspeed,
            'heading'     : this.heading,
            'throttle'     : this.throttle,
            'alt'     : this.alt,
            'climb'     : this.climb
        }
    };

};

module.exports.vfr_hudMessage = vfr_hudMessage
