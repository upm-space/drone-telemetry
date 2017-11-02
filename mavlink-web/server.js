

const Telemetry = require('../telemetry.js');
const SerialPortUtilities = require('../utils/list-serial-port');

const telemetry = new Telemetry.Telemetry();
const port = new SerialPortUtilities.SerialPortUtilities();
let acumulado = 0;

// var serialPort = 'COM10';          //windows

// telemetry.connectToMavLinkViaSerial(serialPort,115200);

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const logList = [];


wss.on('connection', (ws) => {
  telemetry.setWs(ws);
  ws.on('message', (message) => {
    console.log('received: %s', message);
    const mensaje = message;
    const separar = mensaje.split(',');

    if (separar[0] == 'armDisarm') {
      telemetry.setArm(separar[1]);
    }

    if (separar[0] == 'setFlighMode') {
      telemetry.setFlightMode(separar[1]);
    }

    if (separar[0] == 'requestLogList') {
      logList = [];
      telemetry.getLogList();
    }

    if (separar[0] == 'requestLog') {
      telemetry.getLogFile(separar[1]);
    }
    try {
      const msg = JSON.parse(message);
      console.log(msg.type);
      if (msg.type) {
        if (msg.type == 'connect') {
          console.log(msg.bauds);
          telemetry.connectToMavLinkViaSerial(msg.port, msg.bauds);
        }
        if (msg.type == 'getPorts') {
          const arrports = [];
          port.list((ports) => {
            ports.forEach((port) => {
              arrports.push({ portName: port.comName });
            });
            let msg = { type: 'ports', ports: arrports };
            msg = JSON.stringify(msg);
            ws.send(msg);
          });
          // console.log(msg.bauds);
          // telemetry.connectToMavLinkViaSerial(msg.port,msg.bauds);
        }
        if (msg.type === 'requestLogList') {
          telemetry.getLogList();
        }
        if (msg.type === 'requestLog') {
          let size = 0;
          logList.forEach((item) => {
            if (item.id === parseInt(msg.id)) {
              size = item.size;
            }
          });
          if (size > 0) {
            telemetry.getLogFile(msg.id, size);
          } else {
            console.log('ERROR: No log file found');
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  });

  telemetry.on('attitude', (data) => {
    // console.log(data.roll);
    const message = `${'attitude' + ','}${(data.roll * 180 / 3.14159).toFixed(2)},${(data.pitch * 180 / 3.14159).toFixed(2)},${(data.yaw * 180 / 3.14159).toFixed(2)}`;
    ws.send(message);
  });

  telemetry.on('heartbeat', (data) => {
    // console.log(data);
    const message = `${'heartbeat' + ','}${data.armDisarm},${data.flightMode},${data.mav_autopilot},${data.mav_type}`;
    ws.send(message);
  });

  // telemetry.on('logEntry', (listContador, numLogs, size) => {
  telemetry.on('logEntry', (data) => {
    // console.log(data);
    logList.push(data);
    size = (data.size / 1024) / 1024; // converted from bytes to Mg
    size = size.toFixed(2);
    // const message = `${'logEntryRecibido' + ','}${data.id} (${size})Mb` + `,${data.numLogs}`;
    acumulado = 0;
    const message = `{"type":"itemLogList","data":${JSON.stringify(data)}}`;
    ws.send(message);
  });

  telemetry.on('paqueteLog', (logbytes, logsize) => {
    // console.log('paquete log');
    acumulado += 1;
    // acumulado +=logbytes;
    if (acumulado > 40) {
      console.log(`ACUMULADO*******************************************************${acumulado}`);
      acumulado = 0;
      const message = `${'paqueteLog' + ','}${logbytes},${logsize}`;
      ws.send(message);
    }
    if (logbytes == logsize) {
      let msg = { type: 'message', msg: `descarga finalizada (${logbytes} bytes)` };
      msg = JSON.stringify(msg);
      ws.send(msg);
    }
  });
  /*
  telemetry.on('logData', (data) => {
    console.log(data);
  });
  */
});
