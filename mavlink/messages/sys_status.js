//http://mavlink.org/messages/common
const events = require('events');
/**
 * SYS_STATUS ID:1 http://mavlink.org/messages/common#SYS_STATUS
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

var sys_statusMessage = function() {
    //SYS_STATUS uint32_t onboard_control_sensors_present uint32_t onboard_control_sensors_enabled uint32_t onboard_control_sensors_health uint16_t load uint16_t voltage_battery int16_t current_battery uint16_t drop_rate_comm uint16_t errors_comm uint16_t errors_count1 uint16_t errors_count2 uint16_t errors_count3 uint16_t errors_count4 int8_t battery_remaining
    this.onboard_control_sensors_present=0;
    this.onboard_control_sensors_enabled=0;
    this.onboard_control_sensors_health=0;
    this.load=0;
    this.voltage_battery=0;
    this.current_battery=0;
    this.drop_rate_comm=0;
    this.errors_comm=0;
    this.errors_count1=0;
    this.errors_count2=0;
    this.errors_count3=0;
    this.errors_count4=0;
    this.battery_remaining=0;

    this.crcSys_status=124;
    this.crc = 0;
    this.buffer=new Buffer(39);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.eventEmitter = new events.EventEmitter();

    this.read = function(data){
        this.onboard_control_sensors_present=data.readUInt32LE(6);
        this.onboard_control_sensors_enabled=data.readUInt32LE(10);
        this.onboard_control_sensors_health=data.readUInt32LE(14);
        this.load=data.readUInt16LE(18);
        this.voltage_battery=data.readUInt16LE(20);
        this.current_battery=data.readInt16LE(22);
        this.drop_rate_comm=data.readUInt16LE(24);
        this.errors_comm=data.readUInt16LE(26);
        this.errors_count1=data.readUInt16LE(28);
        this.errors_count2=data.readUInt16LE(30);
        this.errors_count3=data.readUInt16LE(32);
        this.errors_count4=data.readUInt16LE(34);
        this.battery_remaining=data.readInt8(36);
        data.copy(this.buffer,0,0,this.buffer.length);
        this.eventEmitter.emit('data',this.getData());
    };

    this.createBuffer = function(){
        this.buffer = sendMessage(this.buffer);
        this.buffer[0] = 0xfe;
        this.buffer[1] = this.buffer.length-8;
        //this.buffer[2] = 0;
        this.buffer[3] = 1;
        this.buffer[4] = 1;
        this.buffer[5] = 0x1;
        this.buffer.writeUInt32LE(this.onboard_control_sensors_present,6);
        this.buffer.writeUInt32LE(this.onboard_control_sensors_enabled,10);
        this.buffer.writeUInt32LE(this.onboard_control_sensors_health,14);
        this.buffer.readUInt16LE(this.load,18);
        this.buffer.writeUInt16LE(this.voltage_battery,20);
        this.buffer.writeInt16LE(this.current_battery,22);
        this.buffer.writeUInt16LE(this.drop_rate_comm,24);
        this.buffer.writeUInt16LE(this.errors_comm,26);
        this.buffer.writeUInt16LE(this.errors_count1,28);
        this.buffer.writeUInt16LE(this.errors_count2,30);
        this.buffer.writeUInt16LE(this.errors_count3,32);
        this.buffer.writeUInt16LE(this.errors_count4,34);
        this.buffer.writeInt8(this.battery_remaining,36);

        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcSys_status;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };

    this.getData = ()=>{
        return{
            'parameter'                               : "SYS_STATUS",
            'onboard_control_sensors_present'         : this.onboard_control_sensors_present,
            'onboard_control_sensors_enabled'         : this.onboard_control_sensors_enabled ,
            'onboard_control_sensors_health'          : this.onboard_control_sensors_health ,
            'load'                                    : this.load ,
            'voltage_battery'                         : this.voltage_battery ,
            'current_battery'                         : this.current_battery ,
            'drop_rate_comm'                          : this.drop_rate_comm ,
            'errors_comm'                             : this.errors_comm ,
            'errors_count1'                           : this.errors_count1 ,
            'errors_count2'                           : this.errors_count2 ,
            'errors_count3'                           : this.errors_count3 ,
            'errors_count4'                           : this.errors_count4 ,
            'battery_remaining'                       : this.battery_remaining
        }
    };

};

module.exports.sys_statusMessage = sys_statusMessage