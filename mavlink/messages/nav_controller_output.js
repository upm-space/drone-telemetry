//http://mavlink.org/messages/common
const events = require('events');
/**
 * Attitude ID:62 http://mavlink.org/messages/common#NAV_CONTROLLER_OUTPUT
 */
var nav_controller_outputMessage = function() {
    //NAV_CONTROLLER_OUTPUT float nav_roll float nav_pitch float alt_error float aspd_error float xtrack_error int16_t nav_bearing int16_t target_bearing uint16_t wp_dist
    this.nav_roll=0;
    this.nav_pitch=0;
    this.alt_error=0;
    this.aspd_error=0;
    this.xtrack_error=0;
    this.nav_bearing=0;
    this.target_bearing=0;
    this.wp_dist=0;

    this.crcNav_controller_output=183;
    this.crc = 0;
    this.buffer = new Buffer(34);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.eventEmitter = new events.EventEmitter();

    this.read = function(data){
        this.nav_roll = data.readFloatLE(6);
        this.nav_pitch=data.readFloatLE(10);
        this.alt_error=data.readFloatLE(14);
        this.aspd_error=data.readFloatLE(18);
        this.xtrack_error=data.readFloatLE(22);
        this.nav_bearing=data.readInt16LE(26);
        this.target_bearing=data.readInt16LE(28);
        this.wp_dist=data.readUInt16LE(30);

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
        this.buffer[5] = 0x3e;
        this.buffer.writeFloatLE(this.nav_roll, 6);
        this.buffer.writeFloatLE(this.nav_pitch, 10);
        this.buffer.writeFloatLE(this.alt_error, 14);
        this.buffer.writeFloatLE(this.aspd_error, 18);
        this.buffer.writeFloatLE(this.xtrack_error, 22);
        this.buffer.writeInt16LE(this.nav_bearing, 26);
        this.buffer.writeInt16LE(this.target_bearing, 28);
        this.buffer.writeUInt16LE(this.wp_dist, 30);

        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcNav_controller_output;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };

    this.getData = ()=>{
        return{
            'parameter'         : "MISSION_CURRENT",
            'nav_roll'     : this.nav_roll,
            'nav_pitch'     : this.nav_pitch,
            'alt_error'     : this.alt_error,
            'aspd_error'     : this.aspd_error,
            'xtrack_error'     : this.xtrack_error,
            'nav_bearing'     : this.nav_bearing,
            'target_bearing'     : this.target_bearing,
            'wp_dist'     : this.wp_dist
        }
    };

};

module.exports.nav_controller_outputMessage = nav_controller_outputMessage