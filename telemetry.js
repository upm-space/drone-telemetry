var SerialPort = require('serialport'); //Libreria para comunicarse por el serial
var mavlink = require('./mavlink/mavlink.js');//Libreria propia para comunicarse con mavlink
var fs = require('fs');
const EventEmitter = require('events');


m = new mavlink();

class Telemetry extends EventEmitter{
    constructor(){
        super();
        this.connectionType = "";
    }

    connectToMavLinkViaSerial(portName,bauds){
        this.connectionType = "mavLinkViaSerial"

        this.port = new SerialPort(portName, {
            baudrate: bauds
        });
        this.port.on('open', ()=> {
            //Lee cada nuevo buffer que llega
            this.port.on('data', (data)=> {
            m.readBuffer(data);
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

        m.heartbeatR.eventEmitter.on('data',(data)=>{
            this.emit('heartbeat',data);
    })

        m.sys_statusR.eventEmitter.on('data',(data)=>{
            this.emit('sys_status',data);
    })
        m.gps_raw_intR.eventEmitter.on('data',(data)=>{
            this.emit('gps_raw_int',data);
    })

        m.attitudeR.eventEmitter.on('data',(data)=>{
            this.emit('attitude',data);
    })

        m.mission_currentR.eventEmitter.on('data',(data)=>{
            this.emit('mission_current',data);
    })

        m.nav_controller_outputR.eventEmitter.on('data',(data)=>{
            this.emit('nav_controller_output',data);
    })

        m.vfr_hudR.eventEmitter.on('data',(data)=>{
            this.emit('vfr_hud',data);
    })

        m.command_ackR.eventEmitter.on('data',(data)=>{
            this.emit('command_ack',data);
    })

        //----------------------------------------
        m.on('logEntryRecibido', (listContador, num_logs)=> {
            console.log("Recibidos " + listContador+ " de " + num_logs);
            this.emit('logEntryRecibido',listContador, num_logs);
    });

        m.on('listaLogsRecibida', function() {
            console.log("Lista de logs recibida.");
        });
        //------------------------------------------
        m.on('paqueteLog',(logbytes, logsize)=> {
            console.log("Bytes recibidos: " + logbytes + "/" + logsize);
            this.emit('paqueteLog',logbytes, logsize);
        });

        m.on('logRecibido', (logID) => {
            console.log("Log recibido.");
            fs.writeFile("log" + logID + ".bin", m.logbuffer);
        });

    }

    closeConnection(){

    }

    //TODO set FlightMode

    setFlightMode(customMode){
        var setMode;
        switch (customMode){
            case "Manual":
                setMode = 0;
                break;
            case "Stabilize":
                setMode = 2;
                break;
            case "Auto":
                setMode = 10;
                break;
            case "RTL":
                setMode = 11;
                break;
            case "Loiter":
                setMode = 12;
                break;
            case "Guided":
                setMode = 15;
                break;
        }
        m.set_modeS.createBuffer(setMode);
        this.port.write(m.set_modeS.buffer);
    }


    //TODO set arm

    setArm(boolvalue){
        if(boolvalue == "arm"){
            m.command_longS.param1=1;
            m.command_longS.param2=0;
            m.command_longS.param3=0;
            m.command_longS.param4=0;
            m.command_longS.param5=0;
            m.command_longS.param6=0;
            m.command_longS.param7=0;
            m.command_longS.param7=0;
            m.command_longS.command=400;
            m.command_longS.target_system=1;
            m.command_longS.target_component=1;
            m.command_longS.confirmation=0;

            m.command_longS.createBuffer();
            this.port.write(m.command_longS.buffer);
        }
        if(boolvalue == "disarm"){
            m.command_longS.param1=0;
            m.command_longS.param2=0;
            m.command_longS.param3=0;
            m.command_longS.param4=0;
            m.command_longS.param5=0;
            m.command_longS.param6=0;
            m.command_longS.param7=0;
            m.command_longS.param7=0;
            m.command_longS.command=400;
            m.command_longS.target_system=1;
            m.command_longS.target_component=1;
            m.command_longS.confirmation=0;

            m.command_longS.createBuffer();
            this.port.write(m.command_longS.buffer);
        }
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
    getLogList(){
        m.loglistContador=0;
        m.logrequestlist.createBuffer();
        this.port.write(m.logrequestlist.buffer);
    }

    //TODO register event for each received log list item



    //TODO getLogFile (params log number and file name)
    getLogFile(id){
        m.logrequestdata.id = id;
        this.logID = id;
        var logentry = "log_entry" + id;
        var logname = "log" + id + ".bin";
        //eval("var size = m." + logentry + ".size;");
        m.createLogBuffer(m[logentry].size);

        m.logsize = m[logentry].size;
        m.logoffset=0;
        m.logrequestdata.ofs = 0;
        m.logrequestdata.count = m[logentry].size;
        m.logrequestdata.createBuffer();
        this.port.write(m.logrequestdata.buffer);
    }

    //TODO register event for each received block file


}

module.exports.Telemetry = Telemetry;
