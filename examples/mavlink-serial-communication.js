'use strict';

let Telemetry = require('../telemetry.js');
let telemetry = new Telemetry.Telemetry();

telemetry.connectToMavLinkViaSerial('/dev/ttyACM0',115200);
telemetry.on('attitude', (data)=>{
    console.log(data.pitch);
});
