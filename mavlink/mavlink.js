var inicioMensaje = false;
let attitudeMessage = require('./messages/attitude.js');
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
//-------------------------------------------------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------------------------------------------------
//DEFINICION DE PARAMETROS

//---------------------------------
//HEARTBEAT
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

    this.read = function(data){
        this.custom_mode = data.readUInt32LE(6);
        this.type = data.readUInt8(10);
        this.autopilot = data.readUInt8(11);
        this.base_mode = data.readUInt8(12);
        this.system_status = data.readUInt8(13);
        this.mavlink_version = data.readUInt8(14);
        data.copy(this.buffer,0,0,this.buffer.length);
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
};

//---------------------------------
//SYS_STATUS
var sys_statustMessage = function() {
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
};

//---------------------------------
//ATTITUDE
/*
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

        this.read = function(data){
            this.time_boot_ms = data.readUInt32LE(6);
            this.pitch = data.readFloatLE(10);
            this.roll = data.readFloatLE(14);
            this.yaw = data.readFloatLE(18);
            this.pitchspeed = data.readFloatLE(22);
            this.rollspeed = data.readFloatLE(26);
            this.yawspeed = data.readFloatLE(30);
            data.copy(this.buffer,0,0,this.buffer.length);
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
};
*/
//---------------------------------
//MISSION_REQUEST
var mission_requestMessage = function() {
    //MISSION_REQUEST uint16_t seq uint8_t target_system uint8_t target_component
    this.target_system=1;
    this.target_component=1;
    this.seq=0;
    //this.mission_type=0;
    this.crcMission_request=230;
    this.crc = 0;
    this.buffer=new Buffer(12);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.read = function(data){
        this.seq = data.readUInt16LE(6);
        this.target_system = data.readUInt8(8);
        this.target_component = data.readUInt8(9);
        //this.mission_type = data.readFloatLE(18);
        data.copy(this.buffer,0,0,this.buffer.length);
    };

    this.createBuffer = function(){
        this.buffer = sendMessage(this.buffer);
        this.buffer[0] = 0xfe;
        this.buffer[1] = this.buffer.length-8;
        //this.buffer[2] = 0;
        this.buffer[3] = 1;
        this.buffer[4] = 1;
        this.buffer[5] = 0x28;
        this.buffer.writeUInt16LE(this.seq,6);
        this.buffer.writeUInt8(this.target_system,8);
        this.buffer.writeUInt8(this.target_component,9);
        //this.buffer.writeUInt8(this.mission_type,18);


        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcMission_request;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };
};

//---------------------------------
//MISSION_REQUEST_LIST
var mission_request_listMessage = function() {
    //MISSION_REQUEST_LIST uint8_t target_system uint8_t target_component
    this.target_system=1;
    this.target_component=1;
    //this.mission_type=0;
    this.crcMission_request_list=132;
    this.crc = 0;
    this.buffer=new Buffer(10);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.read = function(data){
        this.target_system = data.readUInt8(6);
        this.target_component = data.readUInt8(7);
        //this.mission_type = data.readFloatLE(18);
        data.copy(this.buffer,0,0,this.buffer.length);
    };

    this.createBuffer = function(){
        this.buffer = sendMessage(this.buffer);
        this.buffer[0] = 0xfe;
        this.buffer[1] = this.buffer.length-8;
        //this.buffer[2] = 3;
        this.buffer[3] = 1;
        this.buffer[4] = 1;
        this.buffer[5] = 0x2B;
        this.buffer.writeUInt8(this.target_system,6);
        this.buffer.writeUInt8(this.target_component,7);
        //this.buffer.writeFloatLE(this.mission_type,18);

        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcMission_request_list;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };
};

//---------------------------------
//MISSION_COUNT
var mission_countMessage = function() {
    //MISSION_COUNT uint16_t count uint8_t target_system uint8_t target_component
    this.count=0;
    this.target_system=1;
    this.target_component=1;
    this.crcMission_count=221;
    this.crc = 0;
    this.buffer=new Buffer(12);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.read = function(data){
        this.count=data.readUInt16LE(6);
        this.target_system = data.readUInt8(8);
        this.target_component = data.readUInt8(9);
        data.copy(this.buffer,0,0,this.buffer.length);
    };

    this.createBuffer = function(){
        this.buffer = sendMessage(this.buffer);
        this.buffer[0] = 0xfe;
        this.buffer[1] = this.buffer.length-8;
        //this.buffer[2] = 3;
        this.buffer[3] = 1;
        this.buffer[4] = 1;
        this.buffer[5] = 0x2C;
        this.buffer.writeUInt16(this.count,6);
        this.buffer.writeUInt8(this.target_system,8);
        this.buffer.writeUInt8(this.target_component,9);

        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcMission_count;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };
};

//---------------------------------
//MISSION_ITEM
var mission_itemMessage = function() {
    //MISSION_ITEM float param1 float param2 float param3 float param4 float x float y float z uint16_t seq uint16_t command uint8_t target_system uint8_t target_component uint8_t frame uint8_t current uint8_t autocontinue
    this.param1=0;
    this.param2=0;
    this.param3=0;
    this.param4=0;
    this.x=0;
    this.y=0;
    this.z=0;
    this.seq=0;
    this.command=0;
    this.target_system=1;
    this.target_component=1;
    this.frame=0;
    this.current=0;
    this.autocontinue=0;
    this.crcMission_item=254;
    this.crc = 0;
    this.buffer=new Buffer(45);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.read = function(data){
        this.param1=data.readFloatLE(6);
        this.param2=data.readFloatLE(10);
        this.param3=data.readFloatLE(14);
        this.param4=data.readFloatLE(18);
        this.x=data.readFloatLE(22);
        this.y=data.readFloatLE(26);
        this.z=data.readFloatLE(30);
        this.seq=data.readUInt16LE(34);
        this.command=data.readUInt16LE(36);
        this.target_system=data.readUInt8(38);
        this.target_component=data.readUInt8(39);
        this.frame=data.readUInt8(40);
        this.current=data.readUInt8(41);
        this.autocontinue=data.readUInt8(42);
        data.copy(this.buffer,0,0,this.buffer.length);
    };

    this.createBuffer = function(){
        this.buffer = sendMessage(this.buffer);
        this.buffer[0] = 0xfe;
        this.buffer[1] = this.buffer.length-8;
        //this.buffer[2] = 3;
        this.buffer[3] = 1;
        this.buffer[4] = 1;
        this.buffer[5] = 0x27;
        this.buffer.writeFloatLE(this.param1,6);
        this.buffer.writeFloatLE(this.param2,10);
        this.buffer.writeFloatLE(this.param3,14);
        this.buffer.writeFloatLE(this.param4,18);
        this.buffer.writeFloatLE(this.x,22);
        this.buffer.writeFloatLE(this.y,26);
        this.buffer.writeFloatLE(this.z,30);
        this.buffer.writeUInt16LE(this.seq,34);
        this.buffer.writeUInt16LE(this.command,36);
        this.buffer.writeUInt8(this.target_system,38);
        this.buffer.writeUInt8(this.target_component,39);
        this.buffer.writeUInt8(this.frame,40);
        this.buffer.writeUInt8(this.current,41);
        this.buffer.writeUInt8(this.autocontinue,42);

        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcMission_item;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };
};

//---------------------------------
//LOG_REQUEST_LIST
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

    this.read = function(data){
        this.start=data.readUInt16LE(6);
        this.end=data.readUInt16LE(8);
        this.target_system = data.readUInt8(10);
        this.target_component = data.readUInt8(11);
        data.copy(this.buffer,0,0,this.buffer.length);
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
};

//---------------------------------
//LOG_ENTRY
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

    this.read = function(data){
        this.time_utc=data.readUInt32LE(6);
        this.size=data.readUInt32LE(10);
        this.id=data.readUInt16LE(14);
        this.num_logs=data.readUInt16LE(16);
        this.last_log_num=data.readUInt16LE(18);
        data.copy(this.buffer,0,0,this.buffer.length);
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
};

//---------------------------------
//LOG_REQUEST_DATA
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

    this.read = function(data){
        this.ofs=data.readUInt32LE(6);
        this.count=data.readUInt32LE(10);
        this.id=data.readUInt16LE(14);
        this.target_system=data.readUInt8(16);
        this.target_component=data.readUInt8(17);
        data.copy(this.buffer,0,0,this.buffer.length);
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
};

//---------------------------------
//LOG_DATA
var log_dataMessage = function() {
    //LOG_DATA uint32_t ofs uint16_t id uint8_t count uint8_t data
    this.ofs=0;
    this.id=0;
    this.count=0;
    this.data = new Buffer(90);

    this.crcLog_data=1;
    this.crc = 0;
    this.buffer=new Buffer(105);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.read = function(bufferIn){
        this.ofs=bufferIn.readUInt32LE(6);
        this.id=bufferIn.readUInt16LE(10);
        this.count=bufferIn.readUInt8(12);
        for (var i=0; i<90; i++) {
            this.data[i]=bufferIn.readUInt8(i+13);
        }

      //  bufferIn.copy(this.buffer,0,0,this.buffer.length);
    };

    /*this.createBuffer = function(){
        this.buffer[0] = 0xfe;
        this.buffer[1] = this.buffer.length-8;
        this.buffer[2] = 3;
        this.buffer[3] = 255;
        this.buffer[4] = 190;
        this.buffer[5] = 0x78;
        this.buffer.writeUInt32LE(this.ofs,6);
        this.buffer.writeUInt32LE(this.count,10);
        this.buffer.writeUInt16LE(this.id,14);
        this.buffer.writeUInt8(this.target_system,16);
        this.buffer.writeUInt8(this.target_component,17);

        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcLog_data;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };*/
};

//---------------------------------
//LOG_END
var log_request_endMessage = function() {
    //LOG_REQUEST_END uint8_t target_system uint8_t target_component
    this.target_system=1;
    this.target_component=1;
    this.crcLog_request_end=203;
    this.crc = 0;
    this.buffer=new Buffer(10);
    this.crc_buf = new Buffer(this.buffer.length-2);

    this.read = function(data){
        this.target_system=data.readUInt8(6);
        this.target_component=data.readUInt8(7);
        data.copy(this.buffer,0,0,this.buffer.length);
    };

    this.createBuffer = function(){

        this.buffer[0] = 0xfe;
        this.buffer[1] = this.buffer.length-8;
        this.buffer[2] = 3;
        this.buffer[3] = 255;
        this.buffer[4] = 190;
        this.buffer[5] = 0x7A;
        this.buffer.writeUInt8(this.target_system,6);
        this.buffer.writeUInt8(this.target_component,7);

        this.buffer.copy(this.crc_buf,0,1,this.buffer[1]+6);
        this.crc_buf[this.crc_buf.length-1] = this.crcLog_request_end;
        this.crc = calculateChecksum(this.crc_buf)
        this.buffer.writeUInt16LE(this.crc,this.buffer[1]+6);
    };
};
//-------------------------------------------------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------------------------------------------------
//Objeto principal
var mavlinkMessage = function(){
    this.startCharacter = 0xfe;
    this.payloadLength = 0;
    this.packetSequence = 0;
    this.systemID = 1;
    this.componentID = 1;
    this.messageID = 0;
    this.payload = 0;
    this.messageBuffer = new Buffer(512);
    this.bufferIndex = 0;


    //Variable para leer la lista de logs
    this.listalogrecibida = false;

    //Variables para leer un log
    this.logrecibido = false;
    this.pedirlog = false;
    this.offset = 0;
    this.size = 0;
    this.logContador1 = 4590;
    this.logContador2 = 1;
    this.logCount = 4590;
    this.logsize = 0;

    //Para enviar mensajes
    this.heartbeatS = new heartbeatMessage();
    this.logrequestlist = new log_request_listMessage();
    this.logrequestdata = new log_request_dataMessage();

    //Para leer los mensajes que vayan llegando
    this.attitude = new attitudeMessage.attitudeMessage();
    this.heartbeatR = new heartbeatMessage();
    this.sys_statusR= new sys_statustMessage();
    this.mission_countR= new mission_countMessage();
    this.mission_itemR= new mission_itemMessage();
    this.log_entryR = new log_entryMessage();
    this.log_dataR = new log_dataMessage();
};



mavlinkMessage.prototype.decodeMessage = function(char){
    if (this.bufferIndex == 0 && char == this.startCharacter) {
        this.messageBuffer[this.bufferIndex] = char;
        this.bufferIndex++;
        return;
    }

    if (this.bufferIndex == 1) {
        this.messageBuffer[this.bufferIndex] = char;
        this.payloadLength = char;
        this.bufferIndex++;
        return;
    }


    if (this.bufferIndex > 1 && this.bufferIndex < this.payloadLength + 8) {
        this.messageBuffer[this.bufferIndex] = char;
        this.bufferIndex++;
    }

    if (this.bufferIndex == this.payloadLength + 8) {
        this.packetSequence = this.messageBuffer[2];
        this.messageID = this.messageBuffer[5];

        var messageB = new Buffer(this.payloadLength + 8);
        this.messageBuffer.copy(messageB,0,0,this.payloadLength + 8);

        switch (this.messageID){
            case 0x0: //heartbeat
                this.heartbeatR.read(messageB);
                break;
            case 0x1: //sys_status
                this.sys_statusR.read(messageB);
                break;
            case 0x1E: //actitud
                this.attitude.read(messageB);
                break;
            case 0x2C: //mission_count
                this.mission_countR.read(messageB);
                break;
            case 0x27: //mission_item
                this.mission_itemR.read(messageB);
                console.log(this.mission_itemR);
                break;
            case 0x76: //log_entry
                this.readloglist(messageB);
                console.log(this.log_entryR);
                break;
            case 0x78: //log_data
                this.readlogdata(messageB);
                break;
        }

        this.bufferIndex = 0;
        this.payloadLength = 0;
    }
};


mavlinkMessage.prototype.readBuffer = function(buffer){
    for (var i=0; i<buffer.length; i++) {
        this.decodeMessage(buffer[i]);
    }
};


mavlinkMessage.prototype.createParameter = function(parameter, name){
    switch (parameter) {
        case "heartbeat":
            this[name] = new heartbeatMessage();
            break;
        case "sys_status":
            this[name] = new sys_statustMessage();
            break;
        case "attitude":
            this[name] = new attitudeMessage();
            break;
        case "mission_request":
            this[name] = new mission_requestMessage();
            break;
        case "mission_request_list":
            this[name] = new mission_request_listMessage();
            break;
        case "mission_count":
            this[name] = new mission_countMessage();
            break;
        case "mission_item":
            this[name] = new mission_itemMessage();
            break;
        case "log_request_list":
            this[name] = new log_request_listMessage();
            break;
        case "log_entry":
            this[name] = new log_entryMessage();
            break;
        case "log_request_data":
            this[name] = new log_request_dataMessage();
            break;
        /*case "log_data":
            this[name] = new log_dataMessage();
            break;*/
        case "log_request_end":
            this[name] = new log_request_endMessage();
            break;
    }
};

mavlinkMessage.prototype.readloglist = function(buffer){
    this.log_entryR.read(buffer);
    var logentryname = "log_entry" + this.log_entryR.id;
    this[logentryname] = Object.assign({},this.log_entryR);
    if (this.log_entryR.id == this.log_entryR.num_logs){
        this.listalogrecibida = true;
    }
};

mavlinkMessage.prototype.readlogdata = function(buffer){
    this.log_dataR.read(buffer);
    this.log_dataR.data.copy(this.logbuffer,this.offset,0,90);
    this.offset+=90;


    if (this.offset == this.logContador1) {
        this.logContador2++;
        this.logContador1 = this.logContador1+4590;
        this.pedirlog = true;
    }


    if (this.offset != this.log_dataR.ofs + 90) {
        this.offset = 0;
        this.pedirlog = true;
        this.logCount = 4590;
        console.log("Error en envio");
    }

    if (this.log_dataR.count < 90){
        this.logrecibido = true;
        this.offset = 0;
    }
    console.log(this.log_dataR);

};

mavlinkMessage.prototype.createLogBuffer = function(size){
    this.logbuffer = new Buffer(size);
};

sendMessage = function(payload){
    if (inicioMensaje == false){
        var packetSequence = 0;
        inicioMensaje == true;
    }
    if (packetSequence++ == 255) {
        packetSequence = 0;
    }
    payload[2]=packetSequence;
    return payload
};


module.exports = mavlinkMessage;

