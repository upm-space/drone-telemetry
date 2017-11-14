const WebSocket = require('ws');
const Telemetry = require('../telemetry.js');
const SerialPortUtilities = require('../utils/list-serial-port');

const wss = WebSocket.Server;

class MavlinkWS extends wss {
  constructor(objConfig) {
    super(objConfig);
    this.telemetry = new Telemetry.Telemetry();
    this.port = new SerialPortUtilities.SerialPortUtilities();
    this.currentWs = null;
    this.logList = [];
    this.logDataNumber = 0;
    this.activateTelemeryListeners();
    this.on('connection', (ws) => {
      ws.on('message', (message) => {
        const msg = this.checkMessage(message);
        if (msg) {
          this.processMessage(msg, ws);
        } else {
          console.log('message has no type attribute');
        }
      });
    });
  }

  checkMessage(message) {
    try {
      const msg = JSON.parse(message);
      console.log(msg.type);
      if (msg.type) {
        return msg;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  processMessage(msg, ws) {
    if (msg.type === 'connect') {
      if (this.telemetry.checkConnection()) {
        this.sendWsMessage(JSON.stringify({ type: 'connStatus', status: true, ports: [] }));
      } else if (msg.port && msg.bauds) {
        this.telemetry.connectToMavLinkViaSerial(msg.port, msg.bauds);
        this.sendWsMessage(JSON.stringify({ type: 'connStatus', status: true }));
      } else {
        this.getPorts((data) => { this.sendWsMessage(JSON.stringify({ type: 'connStatus', status: false, ports: data })); });
      }
    }
    if (msg.type === 'connectIP') {
      this.telemetry.connectToMavLinkViaIP();
    }
    if (msg.type === 'arm') {
      this.telemetry.setArm(msg.result);
    }
    if (msg.type === 'setFlighMode') {
      this.telemetry.setFlightMode(msg.flightMode);
    }
    if (msg.type === 'getPorts') {
      this.getPorts((data) => { this.sendWsMessage(JSON.stringify({ type: 'ports', ports: data })); });
    }
    if (msg.type === 'requestLogList') {
      this.getLogList = [];
      this.telemetry.getLogList();
    }
    if (msg.type === 'requestLog') {
      let size = 0;
      this.logList.forEach((item) => {
        if (item.id === parseInt(msg.id)) {
          size = item.size;
        }
      });
      if (size > 0) {
        this.telemetry.setDirLogAndIdLog('/media/luis/data/basura/mavlink/log', msg.id);
        this.telemetry.getLogFile(msg.id, size);
      } else {
        console.log('ERROR: No log file found');
      }
    }
    if (msg.type === 'askForWpList') {
      this.telemetry.getWaypoints();
    }
    if (msg.type === 'askForWp') {
      this.telemetry.getWaypoint(parseInt(msg.seq));
    }
  }

  activateTelemeryListeners() {
    this.telemetry.on('attitude', (data) => {
      // ws.send(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
      // wss.clients.forEach((client) => {
      //  if (client !== ws && client.readyState === WebSocket.OPEN) {
      //    client.send(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
      //  }
      // });
      this.sendWsMessage(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
    });
    this.telemetry.on('gpsRawInt', (data) => {
      this.sendWsMessage(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
    });
    this.telemetry.on('vfrHud', (data) => {
      this.sendWsMessage(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
    });

    this.telemetry.on('heartbeat', (data) => {
      this.sendWsMessage(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
    });
    this.telemetry.on('sysStatus', (data) => {
      this.sendWsMessage(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
    });
    this.telemetry.on('missionCurrent', (data) => {
      this.sendWsMessage(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
    });
    this.telemetry.on('navControllerOutput', (data) => {
      this.sendWsMessage(`{"type":"mavlink","data":${JSON.stringify(data)}}`);
    });

    this.telemetry.on('logEntry', (data) => {
      // console.log(data);
      this.logList.push(data);
      const size = ((data.size / 1024) / 1024).toFixed(2); // converted from bytes to Mg
      // const message = `${'logEntryRecibido' + ','}${data.id} (${size})Mb` + `,${data.numLogs}`;
      this.logDataNumber = 0;
      // const message = `{"type":"itemLogList","data":${JSON.stringify(data)}}`;
      const message = `{"type":"itemLogList","id":${data.id},"numLogs":${data.num_logs},"MbSize":${size}}`;
      this.sendWsMessage(message);
    });

    this.telemetry.on('logData', (data) => {
      this.logDataNumber += 1;
      if (this.logDataNumber > 500) {
        this.logDataNumber = 0;
        const ofset = ((data.ofs / 1024) / 1024).toFixed(2);
        const message = `{"type":"logData","ofset":${ofset},"id":${data.id}}`;
        this.sendWsMessage(message);
      }
    });
    this.telemetry.on('convertedBinToTxt', (data) => {
      const message = `{"type":"logConverted","id":${data.id}}`;
      this.sendWsMessage(message);
    });
    this.telemetry.on('missionCount', (data) => {
      console.log('missionCount');
    });

    this.telemetry.on('missionItemInt', (data) => {
      console.log('missionItemInt');
    });
  }

  getPorts(callback) {
    const arrports = [];
    this.port.list((ports) => {
      ports.forEach((port) => {
        arrports.push({ portName: port.comName });
      });
      callback({ type: 'ports', ports: arrports });
      // msg = JSON.stringify(msg);
      // ws.send(msg);
    });
  }

  sendWsMessage(msg) {
    this.clients.forEach((client) => {
      // if (client !== ws && client.readyState === WebSocket.OPEN) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }
}

module.exports.MavlinkWS = MavlinkWS;
