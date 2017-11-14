

/*
const Telemetry = require('../telemetry.js');
const SerialPortUtilities = require('../utils/list-serial-port');

const telemetry = new Telemetry.Telemetry();
const port = new SerialPortUtilities.SerialPortUtilities();
let acumulado = 0;
let lastWsClient = null;

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const logList = [];
*/

const MavlinkWS = require('./MavlinkWS.js');

const mavWS = new MavlinkWS.MavlinkWS({ port: 8080 });

/*
const getPorts = (callback) => {
  const arrports = [];
  port.list((ports) => {
    ports.forEach((port) => {
      arrports.push({ portName: port.comName });
    });
    callback({ type: 'ports', ports: arrports });
    // msg = JSON.stringify(msg);
    // ws.send(msg);
  });
};

const sendWsMessage = (msg) => {
  wss.clients.forEach((client) => {
    // if (client !== ws && client.readyState === WebSocket.OPEN) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
};
*/
/*
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log('received: %s', message);
    const mensaje = message;
    const separar = mensaje.split(',');

    try {
      const msg = JSON.parse(message);
      console.log(msg.type);
      if (msg.type) {
        if (msg.type === 'connect') {
          if (telemetry.checkConnection()) {
            sendWsMessage(JSON.stringify({ type: 'connStatus', status: true, ports: [] }));
          } else if (msg.port && msg.bauds) {
            telemetry.connectToMavLinkViaSerial(msg.port, msg.bauds);
            sendWsMessage(JSON.stringify({ type: 'connStatus', status: true }));
          } else {
            getPorts((data) => { sendWsMessage(JSON.stringify({ type: 'connStatus', status: false, ports: data })); });
          }
        }
        if (msg.type === 'connectIP') {
          telemetry.connectToMavLinkViaIP();
        }
        if (msg.type === 'arm') {
          telemetry.setArm(msg.result);
        }
        if (msg.type === 'setFlighMode') {
          telemetry.setFlightMode(msg.flightMode);
        }
        if (msg.type === 'getPorts') {
          getPorts((data) => { sendWsMessage(JSON.stringify({ type: 'ports', ports: data })); });
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
        if (msg.type === 'askForWpList') {
          telemetry.getWaypoints();
        }
        if (msg.type === 'askForWp') {
          telemetry.getWaypoint(parseInt(msg.seq));
        }
      }
    } catch (error) {
      console.log(error);
    }
  });


  telemetry.on('attitude', (data) => {
    // ws.send(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
    //wss.clients.forEach((client) => {
    //  if (client !== ws && client.readyState === WebSocket.OPEN) {
    //    client.send(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
    //  }
    //});
    sendWsMessage(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
  });
  telemetry.on('gpsRawInt', (data) => {
    sendWsMessage(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
  });
  telemetry.on('vfrHud', (data) => {
    sendWsMessage(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
  });

  telemetry.on('heartbeat', (data) => {
    sendWsMessage(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
  });
  telemetry.on('sysStatus', (data) => {
    sendWsMessage(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
  });
  telemetry.on('missionCurrent', (data) => {
    sendWsMessage(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
  });
  telemetry.on('navControllerOutput', (data) => {
    sendWsMessage(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
  });

  telemetry.on('logEntry', (data) => {
    // console.log(data);
    logList.push(data);
    const size = ((data.size / 1024) / 1024).toFixed(2); // converted from bytes to Mg
    // const message = `${'logEntryRecibido' + ','}${data.id} (${size})Mb` + `,${data.numLogs}`;
    acumulado = 0;
    // const message = `{"type":"itemLogList","data":${JSON.stringify(data)}}`;
    const message = `{"type":"itemLogList","id":${data.id},"numLogs":${data.num_logs},"MbSize":${size}}`;
    sendWsMessage(message);
  });

  telemetry.on('logData', (data) => {
    acumulado += 1;
    if (acumulado > 500) {
      acumulado = 0;
      const ofset = ((data.ofs / 1024) / 1024).toFixed(2);
      const message = `{"type":"logData","ofset":${ofset},"id":${data.id}}`;
      sendWsMessage(message);
    }
  });
  telemetry.on('convertedBinToTxt', (data) => {
    const message = `{"type":"logConverted","id":${data.id}}`;
    sendWsMessage(message);
  });
  telemetry.on('missionCount', (data) => {
    console.log('missionCount');
  });

  telemetry.on('missionItemInt', (data) => {
    console.log('missionItemInt');
  });
});
*/
