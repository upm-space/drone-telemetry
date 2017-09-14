//http://mavlink.org/messages/common
const events = require('events');
/**
 * Attitude ID:24 http://mavlink.org/messages/common#GPS_RAW_INT
 */
var gps_raw_intMessage = function() {
    //GPS_RAW_INT uint64_t time_usec int32_t lat int32_t lon int32_t alt int32_t alt_ellipsoid uint32_t h_acc uint32_t v_acc uint32_t vel_acc uint32_t hdg_acc uint16_t eph uint16_t epv uint16_t vel uint16_t cog uint8_t fix_type uint8_t satellites_visible
    this.time_usec=0;
    this.lat=0;
    this.lon=0;
    this.alt=0;
    this.alt_ellipsoid=0;
    this.h_acc=0;
    this.v_acc=0;
    this.vel_acc=0;
    this.hdg_acc=0;
    this.eph=0;
    this.epv=0;
    this.vel=0;
    this.cog=0;
    this.fix_type=0;
    this.satellites_visible=0;
    this.crcGps_raw_int = 111;
    this.crc = 0;
    this.buffer=new Buffer(58);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.eventEmitter = new events.EventEmitter();

    this.read = function(data){
        this.time_usec = data.readUInt64LE(6);
        this.lat = data.readInt32LE(14);
        this.lon = data.readInt32LE(18);
        this.alt = data.readInt32LE(22);
        this.alt_ellipsoid = data.readInt32LE(26);
        this.h_acc = data.readUInt32LE(30);
        this.v_acc = data.readUInt32LE(34);
        this.vel_acc = data.readUInt32LE(38);
        this.hdg_acc = data.readUInt32LE(42);
        this.eph = data.readUInt16LE(46);
        this.epv = data.readUInt16LE(48);
        this.vel = data.readUInt16LE(50);
        this.cog = data.readUInt16LE(52);
        this.fix_type = data.readUInt8(54);
        this.satellites_visible = data.readUInt8(55);
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
        this.buffer[5] = 0x18;
        this.time_usec = this.buffer.writeUInt64LE(6);
        this.buffer.writeInt32LE(this.lat, 14);
        this.buffer.writeInt32LE(this.lon, 18);
        this.buffer.writeInt32LE(this.alt, 22);
        this.buffer.writeInt32LE(this.alt_ellipsoid, 26);
        this.buffer.writeUInt32LE(this.h_acc, 30);
        this.buffer.writeUInt32LE(this.v_acc, 34);
        this.buffer.writeUInt32LE(this.vel_acc, 38);
        this.buffer.writeUInt32LE(this.hdg_acc, 42);
        this.buffer.writeUInt16LE(this.eph, 46);
        this.buffer.writeUInt16LE(this.epv, 48);
        this.buffer.writeUInt16LE(this.vel, 50);
        this.buffer.writeUInt16LE(this.cog, 52);
        this.buffer.writeUInt8(this.fix_type, 54);
        this.buffer.writeUInt8(this.satellites_visible, 55);

        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcGps_raw_int;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };

    this.getData = ()=>{
        return{
            'parameter'         : "GPS_RAW_INT",
            'time_usec'    :        this.time_usec,
            'this.lat'          : this.lat,
            'this.lon'   :       this.lon,
            'this.alt'    :      this.alt,
            'this.alt_ellipsoid' : this.alt_ellipsoid,
            'this.h_acc':   this.h_acc,
            'this.v_acc':   this.v_acc,
            'this.vel_acc':  this.vel_acc,
            'this.hdg_acc':  this.hdg_acc,
            'this.eph':      this.eph,
            'this.epv':      this.epv,
            'this.vel':      this.vel,
            'this.cog' :        this.cog
        }
    }

};

module.exports.gps_raw_intMessage = gps_raw_intMessage