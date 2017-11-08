const SerialPort = require('serialport'); // Libreria para comunicarse por el serial
const mavlink = require('./mavlink/mavlink-node.js');// Libreria propia para comunicarse con mavlink
const fs = require('fs');
const EventEmitter = require('events');
const path = require('path');
// const MavlinkLogs = require('./utils/logs');
const MavlinkLogfile = require('./mavlink/mavlink-logfile.js');


const m = new mavlink();

class Telemetry extends EventEmitter {
  constructor() {
    super();
    // this.ws = null;
    this.connected = false;
    this.connectionType = '';

    m.activateListeners(this);
  }

  // created provisionally for CGET
  /*
  setWs(ws) {
    this.ws = ws;
    // TODO events to register
    // HEARTBEAT
    // SYS_STATUS
    // GPS_RAW_INT
  }
*/
  /**
   * setter for class atributes that will be used for MavlinkLogfile class
   * @param {string} dirLog absolute dir dor storing log files
   * @param {string} idLog  name of the log file without extension
   */
  setDirLogAndIdLog(dirLog, idLog) {
    this.logFile = new MavlinkLogfile();
    this.logFile.on('loadedLog', () => {
      console.log('loadedLog');
    });
    this.logFile.on('convertedBinToTxt',(data)=>{
      this.emit('convertedBinToTxt',data);
    })
    this.logFile.on('camFileCreated', (data) => {
      console.log(`Cam file created with ${data.camItems} items`);
    });
    this.logFile.setPathAndFilename(dirLog, idLog);
  }

  connectToMavLinkViaSerial(portName, bauds) {
    this.connectionType = 'mavLinkViaSerial';

    this.port = new SerialPort(portName, {
      baudrate: bauds,
    });
    this.port.on('open', () => {
      this.connected = true;
      // Lee cada nuevo buffer que llega
      this.port.on('data', (data) => {
        m.readBuffer(data);
      });
    });
    this.activateMavlinkSerialListeners();
  }

  checkConnection() {
    return (this.connected);
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
    /* Listeners */
    /*
    this.on('logRequestData', (data) => {
      console.log('Petición de log');
      this.logFile.createBuffer(data.size);
    });
    */
    this.on('logData', (data) => {
      if (this.logFile) {
        this.logFile.fillinBuffer(data.data, data.ofs, data.count);
      }
    });

    //----------------------------------------
    /*
    m.on('logEntryRecibido', (listContador, numLogs, size) => {
      console.log(`Recibidos ${listContador} de ${numLogs}`);
      const msg = `{"id":${listContador},"total":${numlogs},"size":${size}}`;
      logList.push(msg);
      this.emit('logEntryRecibido', listContador, numLogs, size);
    });
*/
    /*
    m.on('attitude', (data) => {
      this.emit('attitude', data);
    });
    */
    /*
    m.on('listaLogsRecibida', () => {
      console.log('Lista de logs recibida.');
    });
    //------------------------------------------
    m.on('paqueteLog', (logbytes, logsize) => {
      console.log(`Bytes recibidos: ${logbytes}/${logsize}`);
      this.emit('paqueteLog', logbytes, logsize);
    });
    */
    /*
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
    */
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

    m.setModeReader.target_system = 1;
    m.setModeReader.base_mode = 1;
    m.setModeReader.custom_mode = setMode;
    m.setModeReader.createBuffer();
    this.port.write(m.setModeReader.buffer);

    // m.set_modeS.createBuffer(setMode);
    // this.port.write(m.set_modeS.buffer);
  }


  // TODO set arm

  setArm(boolvalue) {
    if (boolvalue === true) {
      m.commandLongReader.param1 = 1;
    } else {
      m.commandLongReader.param1 = 0;
    }
    m.commandLongReader.param2 = 0;
    m.commandLongReader.param3 = 0;
    m.commandLongReader.param4 = 0;
    m.commandLongReader.param5 = 0;
    m.commandLongReader.param6 = 0;
    m.commandLongReader.param7 = 0;
    m.commandLongReader.param7 = 0;
    m.commandLongReader.command = 400;
    m.commandLongReader.target_system = 1;
    m.commandLongReader.target_component = 1;
    m.commandLongReader.confirmation = 0;

    m.commandLongReader.createBuffer();
    this.port.write(m.commandLongReader.buffer);
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
    m.logRequestListReader.createBuffer();
    this.port.write(m.logRequestListReader.buffer);
  }

  // TODO register event for each received log list item


  // TODO getLogFile (params log number and file name)
  getLogFile(id, size) {
    m.logRequestDataReader.id = id;
    this.logID = id;
    const logentry = `log_entry${id}`;
    // const logname = `log${id}.bin`;
    // eval("var size = m." + logentry + ".size;");
    // m.createLogBuffer(m[logentry].size);
    /* LIM */
    this.logFile.createBuffer(size);
    /* LIM */

    m.createLogBuffer(size);
    m.logsize = size;
    m.logoffset = 0;
    m.logRequestDataReader.ofs = 0;
    m.logRequestDataReader.count = size;
    m.logRequestDataReader.createBuffer();
    this.port.write(m.logRequestDataReader.buffer);
    console.log('getLogFile from telemetry');
  }

  // TODO register event for each received block file
}

module.exports.Telemetry = Telemetry;
