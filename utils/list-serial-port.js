var SerialPort = require('serialport');
var Promise = require('promise'); // we have to use it and change callbacks

class SerialPortUtilities{
    constructor(){
    }
    list(callback){
        const serials = [];
        SerialPort.list(function (err, ports) {

            ports.forEach(function(port) {
                //console.log(port.comName);
                //console.log(port.pnpId);
                //console.log(port.manufacturer);
                if(port.pnpId !== undefined){
                    serials.push(port);
                }
            });
            callback(serials);

        });
    }
}

module.exports.SerialPortUtilities = SerialPortUtilities;
