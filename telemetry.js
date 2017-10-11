const SerialPort = require('serialport'); // Libreria para comunicarse por el serial
const mavlink = require('./mavlink/mavlink-node.js');// Libreria propia para comunicarse con mavlink
const fs = require('fs');
const EventEmitter = require('events');
const path = require('path');
const MavlinkLogs = require('./utils/logs');


const m = new mavlink();

class Telemetry extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.connectionType = '';
  }

  // created provisionally for CGET
  setWs(ws) {
    this.ws = ws;
    // TODO events to register
    // HEARTBEAT
    // SYS_STATUS
    // GPS_RAW_INT
  }

  connectToMavLinkViaSerial(portName, bauds) {
    this.connectionType = 'mavLinkViaSerial';

    this.port = new SerialPort(portName, {
      baudrate: bauds,
    });
    this.port.on('open', () => {
      // Lee cada nuevo buffer que llega
      this.port.on('data', (data) => {
        m.readBuffer(data);
      });
    });
    this.activateMavlinkSerialListeners();
  }

  activateMavlinkSerialListeners() {
    // TODO events to register
    // HEARTBEAT
    // SYS_STATUS
    // GPS_RAW_INT
    // ATTITUDE
    // MISSION_CURRENT
    // NAV_CONTROLLER_OUTPUT
    // VFR_HUD

    m.heartbeatReader.eventEmitter.on('data', (data) => {
      this.emit('heartbeat', data);
    });


    m.sysStatusReader.eventEmitter.on('data', (data) => {
      this.emit('sys_status', data);
    });

    /*
    m.gpsRawIntReader.eventEmitter.on('data', (data) => {
      this.emit('gps_raw_int', data);
    });
*/
    m.attitudeReader.eventEmitter.on('data', (data) => {
      this.emit('attitude', data);
    });
    /*
    m.missionCurrentReader.eventEmitter.on('data', (data) => {
      this.emit('mission_current', data);
    });

    m.navControllerOutputReader.eventEmitter.on('data', (data) => {
      this.emit('nav_controller_output', data);
    });

    m.vfrHudReader.eventEmitter.on('data', (data) => {
      this.emit('vfr_hud', data);
    });

    m.commandAckReader.eventEmitter.on('data', (data) => {
      this.emit('command_ack', data);
    });
*/
    //----------------------------------------
    m.on('logEntryRecibido', (listContador, numLogs, size) => {
      console.log(`Recibidos ${listContador} de ${numLogs}`);
      this.emit('logEntryRecibido', listContador, numLogs, size);
    });

    m.on('listaLogsRecibida', () => {
      console.log('Lista de logs recibida.');
    });
    //------------------------------------------
    m.on('paqueteLog', (logbytes, logsize) => {
      console.log(`Bytes recibidos: ${logbytes}/${logsize}`);
      this.emit('paqueteLog', logbytes, logsize);
    });

    m.on('logRecibido', (logID) => {
      console.log('Log recibido.');
      let dir = process.argv[1];
      dir = path.parse(dir).dir;
      const binFile = path.join(dir, `log${logID}.bin`);
      const txtFile = path.join(dir, `log${logID}.txt`);
      console.log(`Antes de grabar a binario: ${Date.now()}`);
      fs.writeFileSync(binFile, m.logbuffer);
      console.log(`Despues de grabar a binario: ${Date.now()}`);
      let msg = { type: 'message', msg: '1/3 Procesos en servidor: binario grabado' };
      msg = JSON.stringify(msg);
      this.ws.send(msg);
      setTimeout(() => {
        const log = new MavlinkLogs.MavlinkLogs(binFile);
        console.log('Cominezo conversión de binario a texto');
        log.convertBinToTxt(binFile, txtFile);
        msg = { type: 'message', msg: '2/3 Conversión de binario a texto finalizado' };
        msg = JSON.stringify(msg);
        this.ws.send(msg);
        console.log('comienzo conversión de texto a cam');
        log.processLogFileToGetCAM(txtFile);
        let pathCamfile = path.dirname(txtFile);
        pathCamfile = path.join(pathCamfile, 'camFile.txt');
        msg = { type: 'message', msg: `3/3 Fichero CAM creado en ${pathCamfile}` };
        msg = JSON.stringify(msg);
        this.ws.send(msg);
      }, 2000);
    });
  }

  closeConnection() {

  }

  // TODO set FlightMode

  setFlightMode(customMode) {
    let setMode;
    switch (customMode) {
    case 'Manual':
      setMode = 0;
      break;
    case 'Stabilize':
      setMode = 2;
      break;
    case 'Auto':
      setMode = 10;
      break;
    case 'RTL':
      setMode = 11;
      break;
    case 'Loiter':
      setMode = 12;
      break;
    case 'Guided':
      setMode = 15;
      break;
    default:
      setMode = 0; // default Manual mode
      break;
    }
    m.set_modeS.createBuffer(setMode);
    this.port.write(m.set_modeS.buffer);
  }


  // TODO set arm

  setArm(boolvalue) {
    if (boolvalue === 'arm') {
      m.command_longS.param1 = 1;
      m.command_longS.param2 = 0;
      m.command_longS.param3 = 0;
      m.command_longS.param4 = 0;
      m.command_longS.param5 = 0;
      m.command_longS.param6 = 0;
      m.command_longS.param7 = 0;
      m.command_longS.param7 = 0;
      m.command_longS.command = 400;
      m.command_longS.target_system = 1;
      m.command_longS.target_component = 1;
      m.command_longS.confirmation = 0;

      m.command_longS.createBuffer();
      this.port.write(m.command_longS.buffer);
    }
    if (boolvalue === 'disarm') {
      m.command_longS.param1 = 0;
      m.command_longS.param2 = 0;
      m.command_longS.param3 = 0;
      m.command_longS.param4 = 0;
      m.command_longS.param5 = 0;
      m.command_longS.param6 = 0;
      m.command_longS.param7 = 0;
      m.command_longS.param7 = 0;
      m.command_longS.command = 400;
      m.command_longS.target_system = 1;
      m.command_longS.target_component = 1;
      m.command_longS.confirmation = 0;

      m.command_longS.createBuffer();
      this.port.write(m.command_longS.buffer);
    }
  }

  // TODO send RTL

  sendRtl() {

  }

  // TODO send Loiter

  sendLoiter() {

  }

  // TODO sendToWp

  sendToWP() {

  }

  // TODO set Waypoints

  setWaypoints() {

  }

  // TODO get waypoints

  getWaypoints() {

  }

  // TODO register event when receive a wp

  // TODO set Preflight Calibration

  setPreflightCalibration() {

  }

  // Set compass Calibration
  // register event for receiving compass calibration

  // TODO getLogList
  getLogList() {
    m.loglistContador = 0;
    m.logrequestlist.createBuffer();
    this.port.write(m.logrequestlist.buffer);
  }

  // TODO register event for each received log list item


  // TODO getLogFile (params log number and file name)
  getLogFile(id) {
    m.logrequestdata.id = id;
    this.logID = id;
    const logentry = `log_entry${id}`;
    // const logname = `log${id}.bin`;
    // eval("var size = m." + logentry + ".size;");
    m.createLogBuffer(m[logentry].size);

    m.logsize = m[logentry].size;
    m.logoffset = 0;
    m.logrequestdata.ofs = 0;
    m.logrequestdata.count = m[logentry].size;
    m.logrequestdata.createBuffer();
    this.port.write(m.logrequestdata.buffer);
  }

  // TODO register event for each received block file
}

module.exports.Telemetry = Telemetry;
