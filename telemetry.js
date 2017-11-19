/* eslint-disable prefer-numeric-literals */

const SerialPort = require('serialport'); // Libreria para comunicarse por el serial
const mavlink = require('./mavlink/mavlink-node.js');// Libreria propia para comunicarse con mavlink
const fs = require('fs');
const EventEmitter = require('events');
const path = require('path');
// const MavlinkLogs = require('./utils/logs');
const MavlinkLogfile = require('./mavlink/mavlink-logfile.js');
const MavlinkWP = require('./mavlink/mavlink-wp.js');


const m = new mavlink();
const WebSocket = require('ws');

const wst = new WebSocket.Server({ port: 14550 });

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
    this.logFile.on('convertedBinToTxt', (data) => {
      this.emit('convertedBinToTxt', data);
    });
    this.logFile.on('camFileCreated', (data) => {
      console.log(`Cam file created with ${data.camItems} items`);
    });
    this.logFile.setPathAndFilename(dirLog, idLog);
  }

  setWpManager() {
    this.wpManager = new MavlinkWP.MavlinkWP();
  }

  manageWp(i) {
    let counter = 0;
    const maxIterations = 10;
    const inter = setInterval(() => {
      const wp = this.wpManager.getCurrentWp();
      if (i > wp) {
        console.log(`${wp} Conseguido al intento ${counter}`);
        clearInterval(inter);
        this.getWaypoint(i);
      }
      if (counter === maxIterations) {
        console.log(`${wp} no conseguido en 10 intentos`);
        clearInterval(inter);
      }
      counter += 1;
    }, 2000);
  }
  askForWps() {
    if (this.wpManager) {
      const currWp = -1;
      this.wpManager.setCurrentWp(-1);
      const wpsInAutopilot = this.wpManager.getWpsInAutopilot();


      const maximumIteraction = 500;
      let counter = 0;
      let i = 0;
      this.getWaypoint(0);
      const inter = setInterval(() => {
        i += 1;
        if (this.wpManager.getCurrentWp() > currWp) {
          counter += 1;
          console.log(`number of tries: ${i}`);
          this.getWaypoint(counter);
        } else {
          console.log(`loop outside of tries: ${i}`);
        }

        if (i > maximumIteraction) { // avoid infinite loop
          clearInterval(inter);
          this.emit('downloadedWps', { finished: false, totalDownloaded:counter -1 , totalInAutopilot: wpsInAutopilot, tries: i });
        }
        if (counter > wpsInAutopilot) {
          clearInterval(inter);
          this.emit('downloadedWps', { finished: true, totalDownloaded:counter -1, totalInAutopilot: wpsInAutopilot, tries: i });
        }
      }, 50);


      // for (i = 0; i < this.wpManager.getWpsInAutopilot(); i += 1) {
      //  this.manageWp(i);
        /*
        let counter = 0;
        const maxIterations = 10;
        const inter = setInterval(() => {

          const wp = this.wpManager.getCurrentWp();
          if (i > wp) {
            console.log(`${currWp} Conseguido al intento ${counter}`);
            clearInterval(inter);
            this.getWaypoint(i);
          }
          if (counter === maxIterations) {
            console.log(`${currWp} no conseguido en 10 intentos`);
            clearInterval(inter);
          }
          counter += 1;
        }, 2000);
        */
      // }
      // setTimeout(() => { this.getWaypoint(0); }, 2000);
      /*
      const maximumIteraction = 100;
      let counter = 0;

      const inter = setInterval(() => {
        this.wpManager.setCurrentWp(-1);
        let currWp = 0;
        if (currWp > this.wpManager.getCurrentWp()) {
          if (this.wpManager.getWpsInAutopilot() > this.wpManager.getCurrentWp()) {
            this.getWaypoint(currWp);
            currWp = this.wpManager.getCurrentWp();
          } else { // hemos llegado al final;
            clearInterval(inter);
          }
        }
        counter += 1;
        if (counter === maximumIteraction) {
          clearInterval(inter);
        }
      }, 600);
      */
    }
  }

  connectToMavLinkViaSerial(portName, bauds) {
    /** serial connectio */
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

  connectToMavLinkViaIP() {
    /** lectura por ip */
    this.connectionType = 'mavLinkViaIP';
    wst.on('connection', (ws) => {
      ws.on('message', (message) => {
        m.readBuffer(data);
        console.log(data);
      });
    });
    this.activateMavlinkSerialListeners();
  }

  sendRawMessage(buffer) {
    if (this.connectionType === 'mavLinkViaSerial') {
      /** lectura por serial */
      this.port.write(buffer);
    }
    if (this.connectionType === 'mavLinkViaIP') {
    /** lectura por ip */
      wst.clients.forEach((client) => {
        // if (client !== ws && client.readyState === WebSocket.OPEN) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(buffer);
        }
      });
    }
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
    this.sendRawMessage(m.setModeReader.buffer);

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
    this.sendRawMessage(m.commandLongReader.buffer);
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
    // La creación del buffer no funciona correctamente, lo hacemos manualmente
    // m.missionRequestListReader.target_system = 0;
    // m.missionRequestListReader.target_component = 1;
    // m.missionRequestListReader.mission_type = 0;
    // m.missionRequestListReader.createBuffer();
    // this.sendRawMessage(m.missionRequestListReader.buffer);

    const buff = new Buffer([254, 2, 67, 255, 190, 43, 1, 1, 243, 20]);
    this.sendRawMessage(buff);
  }

  getWaypoint(seq) {
    // hemos procedido a sustituir todo el buffer del objeto
    // m.missionRequestIntReader. No hemos llamado a la funcion
    // createBuffer, sino que la hemos creado nosotros. Dicha
    // función no funciona correctamente
    /*
    m.missionRequestIntReader.buffer = new Buffer(12);
    m.missionRequestIntReader.crc_buf = new Buffer(10);
    m.missionRequestIntReader.buffer[0] = 0xfe;
    m.missionRequestIntReader.buffer[1] = 4;
    m.missionRequestIntReader.buffer[2] = 243;
    m.missionRequestIntReader.buffer[3] = 255;
    m.missionRequestIntReader.buffer[4] = 190;
    m.missionRequestIntReader.buffer[5] = 0x33;
    m.missionRequestIntReader.buffer[6] = seq;
    m.missionRequestIntReader.buffer[7] = 0;
    m.missionRequestIntReader.buffer[8] = 1;
    m.missionRequestIntReader.buffer[9] = 1;
    // m.missionRequestIntReader.buffer[10] = 219;
    // m.missionRequestIntReader.buffer[11] = 252;
*/
    /*
    m.missionRequestIntReader.buffer.copy(
      m.missionRequestIntReader.crc_buf, 0, 1,
      m.missionRequestIntReader.buffer[1] + 6);

    m.missionRequestIntReader.buffer.copy(
      m.missionRequestIntReader.crc_buf, 0, 0,
      10);

    m.missionRequestIntReader.crc_buf[
      m.missionRequestIntReader.crc_buf.length - 1] =
      m.missionRequestIntReader.crcMissionRequestInt;
*/
    /*
    m.missionRequestIntReader.crc =
      this.calculateChecksum(m.missionRequestIntReader.crc_buf);

    m.missionRequestIntReader.buffer.writeUInt16LE(
      m.missionRequestIntReader.crc,
      m.missionRequestIntReader.buffer[1] + 6);

    this.sendRawMessage(m.missionRequestIntReader.buffer);
    */
    // const buff = new Buffer([254, 4, 114, 255, 190, 51, seq, 0, 1, 1, 241, 117]);
    // const numb = 114 + seq;
    // const buff = new Buffer([254, 4, 243, 255, 190, 51, 0, 0, 1, 1, 219, 252]);
    // this.sendRawMessage(buff);

    m.missionRequestIntReader.target_system = 1;
    m.missionRequestIntReader.base_mode = 1;
    m.missionRequestIntReader.seq = seq;
    // el crc está mal calculado. Lo hemos sacado del
    // código fuente de pixhawk en concreto este Fichero
    // https://github.com/mavlink/c_library_v1/blob/61a161e9d550df9d464f85ad47e3cf7b32d5bd94/common/mavlink_msg_mission_request_int.h
    m.missionRequestIntReader.crcMissionRequestInt = 196;
    m.missionRequestIntReader.createBuffer();
    this.sendRawMessage(m.missionRequestIntReader.buffer);
  }
  // Calcula Crc-16/x.25
  calculateChecksum(buffer) {
    let checksum = 0xffff;
    for (let i = 0; i < buffer.length; i += 1) {
      let tmp = buffer[i] ^ (checksum & 0xff);
      tmp = (tmp ^ (tmp << 4)) & 0xFF;
      checksum = (checksum >> 8) ^ (tmp << 8) ^ (tmp << 3) ^ (tmp >> 4);
      checksum &= 0xFFFF;
    }
    return checksum;
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
    this.sendRawMessage(m.logRequestListReader.buffer);
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
    this.sendRawMessage(m.logRequestDataReader.buffer);
    console.log('getLogFile from telemetry');
  }


  // TODO register event for each received block file
}

module.exports.Telemetry = Telemetry;
