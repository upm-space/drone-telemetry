'use strict';

let Telemetry = require('../telemetry.js');
let telemetry = new Telemetry.Telemetry();

//var serialPort = '/dev/ttyACM0'; //linux
var serialPort = 'COM10';          //windows

telemetry.connectToMavLinkViaSerial(serialPort,115200);
telemetry.on('attitude', (data)=>{
    console.log(data);
});

telemetry.on('heartbeat', (data)=>{
    console.log(data);
});

telemetry.on('sys_status', (data)=>{
    console.log(data);
});
