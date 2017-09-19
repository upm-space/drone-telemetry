'use strict';

let Telemetry = require('../telemetry.js');
let telemetry = new Telemetry.Telemetry();

var serialPort = 'COM10';          //windows

telemetry.connectToMavLinkViaSerial(serialPort,115200);

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });


wss.on('connection', function connection(ws) {

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

    telemetry.on('logEntryRecibido', (listContador, num_logs)=>{
        //console.log(data);
        var message = 'logEntryRecibido' + "," + listContador + "," + num_logs;
        ws.send(message);
    });

    telemetry.on('paqueteLog', (logbytes, logsize)=>{
        //console.log(data);
        var message = 'paqueteLog' + "," + logbytes + "," + logsize;
        ws.send(message);
});


});

