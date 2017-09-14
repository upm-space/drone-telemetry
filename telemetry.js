var SerialPort = require('serialport'); //Libreria para comunicarse por el serial
var mavlink = require('./mavlink/mavlink.js');//Libreria propia para comunicarse con mavlink
const EventEmitter = require('events');



class Telemetry extends EventEmitter{
    constructor(){
        super();
        this.connectionType = "";
    }

    connectToMavLinkViaSerial(portName,bauds){
        this.connectionType = "mavLinkViaSerial"
        this.m = new mavlink();

        this.port = new SerialPort(portName, {
            baudrate: bauds
        });
        this.port.on('open', ()=> {
                //Lee cada nuevo buffer que llega
                this.port.on('data', (data)=> {
                    this.m.readBuffer(data);
                });
        })
        this.activateMavlinkSerialListeners();

    }

    activateMavlinkSerialListeners(){
        //TODO events to register
        //HEARTBEAT
        //SYS_STATUS
        //GPS_RAW_INT
        //ATTITUDE
        //MISSION_CURRENT
        //NAV_CONTROLLER_OUTPUT
        //VFR_HUD

        this.m.heartbeatR.eventEmitter.on('data',(data)=>{
            this.emit('heartbeat',data);
        })

        this.m.sys_statusR.eventEmitter.on('data',(data)=>{
            this.emit('sys_status',data);
        })
        this.m.gps_raw_intR.eventEmitter.on('data',(data)=>{
            this.emit('gps_raw_int',data);
        })

        this.m.attitudeR.eventEmitter.on('data',(data)=>{
            this.emit('attitude',data);
        })

        this.m.mission_currentR.eventEmitter.on('data',(data)=>{
            this.emit('mission_current',data);
        })

        this.m.nav_controller_outputR.eventEmitter.on('data',(data)=>{
            this.emit('nav_controller_output',data);
        })

        this.m.vfr_hudR.eventEmitter.on('data',(data)=>{
            this.emit('vfr_hud',data);
        })

    }

    closeConnection(){

    }

    //TODO set FLightMode

    setFlightMode(){

    }

    //TODO set arm

    setArm(boolvalue){

    }

    //TODO send RTL

    sendRtl(){

    }

    //TODO send Loiter

    sendLoiter(){

    }

    //TODO sendToWp

    sendToWP(){

    }

    //TODO set Waypoints

    setWaypoints(){

    }

    //TODO get waypoints

    getWaypoints(){

    }

    //TODO register event when receive a wp

    //TODO set Preflight Calibration

    setPreflightCalibration(){

    }

    // Set compass Calibration
    // register event for receiving compass calibration

    //TODO getLogList

    //TODO register event for each received log list item

    //TODO getLogFile (params log number and file name)

    //TODO register event for each received block file


}

module.exports.Telemetry = Telemetry;