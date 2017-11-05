

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

    try {
      const msg = JSON.parse(message);
      console.log(msg.type);
      if (msg.type) {
        if (msg.type === 'connect') {
          console.log(msg.bauds);
          telemetry.connectToMavLinkViaSerial(msg.port, msg.bauds);
        }

        if (msg.type === 'arm') {
          telemetry.setArm(msg.result);
        }
        if (msg.type === 'setFlighMode') {
          telemetry.setFlightMode(msg.flightMode);
        }
        if (msg.type === 'getPorts') {
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
            telemetry.setDirLogAndIdLog('/media/luis/data/basura/mavlink/log', msg.id);
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

  /*
  telemetry.on('attitude', (data) => {
    // console.log(data.roll);
    const message = `${'attitude' + ','}${(data.roll * 180 / 3.14159).toFixed(2)},${(data.pitch * 180 / 3.14159).toFixed(2)},${(data.yaw * 180 / 3.14159).toFixed(2)}`;
    ws.send(message);
  });
  */
  telemetry.on('attitude', (data) => {
    ws.send(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
  });
  telemetry.on('gpsRawInt', (data) => {
    ws.send(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
  });
  telemetry.on('vfrHud', (data) => {
    ws.send(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
  });
  /*
  telemetry.on('heartbeat', (data) => {
    // console.log(data);
    const message = `${'heartbeat' + ','}${data.armDisarm},${data.flightMode},${data.mav_autopilot},${data.mav_type}`;
    ws.send(message);
  });
  */
  telemetry.on('heartbeat', (data) => {
    ws.send(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
  });
  telemetry.on('sysStatus', (data) => {
    ws.send(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
  });
  telemetry.on('missionCurrent', (data) => {
    ws.send(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
  });
  telemetry.on('navControllerOutput', (data) => {
    ws.send(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
  });

  telemetry.on('logEntry', (data) => {
    // console.log(data);
    logList.push(data);
    const size = ((data.size / 1024) / 1024).toFixed(2); // converted from bytes to Mg
    // const message = `${'logEntryRecibido' + ','}${data.id} (${size})Mb` + `,${data.numLogs}`;
    acumulado = 0;
    // const message = `{"type":"itemLogList","data":${JSON.stringify(data)}}`;
    const message = `{"type":"itemLogList","id":${data.id},"numLogs":${data.num_logs},"MbSize":${size}}`;
    ws.send(message);
  });

  telemetry.on('logData', (data) => {
    acumulado += 1;
    if (acumulado > 500) {
      acumulado = 0;
      const ofset = ((data.ofs / 1024) / 1024).toFixed(2);
      const message = `{"type":"logData","ofset":${ofset},"id":${data.id}}`;
      ws.send(message);
    }
  });
  /*
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
  */
  /*
  telemetry.on('logData', (data) => {
    console.log(data);
  });
  */
});
