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
        this.m.attitude.eventEmitter.on('data',(data)=>{
            this.emit('attitude',data);
        })
    }
    closeConnection(){

    }

}

module.exports.Telemetry = Telemetry;