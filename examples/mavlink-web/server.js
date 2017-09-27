'use strict';

let Telemetry = require('../../telemetry.js');
let SerialPortUtilities = require('../../utils/list-serial-port');
let telemetry = new Telemetry.Telemetry();
let port = new SerialPortUtilities.SerialPortUtilities();
let acumulado = 0;

//var serialPort = 'COM10';          //windows

//telemetry.connectToMavLinkViaSerial(serialPort,115200);

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });


wss.on('connection', function connection(ws) {
    telemetry.setWs(ws);
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        var mensaje = message;
        var separar = mensaje.split(",");

        if(separar[0] == "armDisarm"){
            telemetry.setArm(separar[1]);
        }

        if(separar[0] == "setFlighMode"){
            telemetry.setFlightMode(separar[1]);
        }

        if(separar[0] == "requestLogList"){
            telemetry.getLogList();
        }

        if(separar[0] == "requestLog"){
            telemetry.getLogFile(separar[1]);
        }
        try{
            var msg = JSON.parse(message);
            console.log(msg.type)
            if(msg.type){
                if(msg.type == "connect"){
                    console.log(msg.bauds);
                    telemetry.connectToMavLinkViaSerial(msg.port,msg.bauds);
                }
                if(msg.type == "getPorts"){
                    let arrports = [];
                    port.list((ports)=>{
                        ports.forEach((port)=>{
                            arrports.push({portName:port.comName});
                        })
                        let msg = {type:"ports", ports:arrports};
                        msg = JSON.stringify(msg);
                        ws.send(msg);
                    });
                    //console.log(msg.bauds);
                    //telemetry.connectToMavLinkViaSerial(msg.port,msg.bauds);
                }

            }
        }catch(error){
            console.log(error)
        }


    });

    telemetry.on('attitude', (data)=>{
        console.log(data.roll);
        var message = "attitude" + "," + (data.roll*180/3.14159).toFixed(2) + "," + (data.pitch*180/3.14159).toFixed(2) + "," + (data.yaw*180/3.14159).toFixed(2);
        ws.send(message);
    });

    telemetry.on('heartbeat', (data)=>{
        //console.log(data);
        var message = "heartbeat" + "," + data.armDisarm + "," + data.flightMode +"," + data.mav_autopilot+ "," + data.mav_type;
        ws.send(message);
    });

    telemetry.on('logEntryRecibido', (listContador, numLogs, size)=>{
        //console.log(data);
        size = (size/1024)/1024; // converted from bytes to Mg
        size = size.toFixed(2);
        var message = 'logEntryRecibido' + "," + listContador + ` (${size})Mb` + "," + numLogs;
        acumulado = 0;
        ws.send(message);
    });

    telemetry.on('paqueteLog', (logbytes, logsize)=>{
        //console.log('paquete log');
        acumulado += 1;
        //acumulado +=logbytes;
        if(acumulado > 40) {
            console.log(`ACUMULADO*******************************************************${acumulado}`);
            acumulado = 0;
            var message = 'paqueteLog' + "," + logbytes + "," + logsize;
            ws.send(message);
        }
        if(logbytes == logsize){
            let msg = {type:"message", msg:`descarga finalizada (${logbytes} bytes)`};
            msg = JSON.stringify(msg);
            ws.send(msg);
        }
});


});
