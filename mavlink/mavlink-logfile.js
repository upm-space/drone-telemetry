const EventEmitter = require('events');
const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');

const mavlogdump = '/usr/local/bin/mavlogdump.py';

class MavlinkLogfile extends EventEmitter {
  constructor() {
    super();
    this.fileSize = 0;
    this.logbuffer = new Buffer(0);
    this.logbytes = 0;
    this.segmentsWithErrors = [];
    this.arrCamFile = [];
    this.idLog = '';
    this.logDir = ''; // path where we will store the logs
    this.binFile = ''; // bin file downloaded from autopilot
    this.textFile = ''; // text file converted from bin file
    this.camFile = ''; // CAM items from text file in csv format
  }

  setPathAndFilename(logDir, idLog) {
    this.logDir = logDir;
    this.idLog = idLog;
    this.binFile = path.join(logDir, `${idLog}.bin`);
    this.textFile = path.join(logDir, `${idLog}.txt`);
    this.camFile = path.join(logDir, `${idLog}_CAM.txt`);

    if (fs.existsSync(this.binFile)) {
      fs.unlinkSync(this.binFile);
    }
    if (fs.existsSync(this.textFile)) {
      fs.unlinkSync(this.textFile);
    }
    if (fs.existsSync(this.camFile)) {
      fs.unlinkSync(this.camFile);
    }
  }

  createBuffer(size) {
    this.fileSize = size;
    this.logbuffer = new Buffer(size);
    this.logbytes = 0;
    this.segmentsWithErrors = [];
  }

  fillinBuffer(buffer, offset, count) {
    if (this.logbytes !== offset) {
      this.segmentsWithErrors.push({ currentIndex: this.logbytes, bytesLeft: offset });
    }
    buffer.copy(this.logbuffer, offset, 0, count);
    // this.logbuffer.copy(buffer, buffer.count, 0, offset);
    this.logbytes = offset + count;
    if (this.logbytes === this.fileSize) {
      this.emit('loadedLog');
      this.storeBuffer(() => {
        this.convertBinToTxt(() => {
          this.emit('convertedBinToTxt', { id: this.idLog });
          this.processLogFileToGetCAM();
        });
      });
    }
  }

  storeBuffer(callback) {
    fs.writeFile(this.binFile, this.logbuffer, (error) => {
      if (error) throw error;
      callback();
    });
  }

  convertBinToTxt(callback) {
    const spawn = require('child_process').spawn;
    // let missionBin = binFile;
    const logStream = fs.createWriteStream(this.textFile);
    // console.log(`paso 1: ${binFile}`);
    const fileToConvert = spawn(mavlogdump, [this.binFile]);
    // console.log('paso 2');
    fileToConvert.stdout.pipe(logStream);
    fileToConvert.on('close', () => {
      callback();
      // console.log('log file converted to txt');
      // this._data.status.code = 3;
      // this._data.status.description = "3/4 Converted binary to txt";
      // return this.processLogFileToGetCAM(txtFile);
    });
  }

  processLogFileToGetCAM() {
    this.arrCamFile = [];
    const arrCAM = [];
    const extendedArrCAM = [];
    const fs = require('fs');
    const readline = require('readline');
    const instream = fs.createReadStream(this.textFile);
    const outstream = new (require('stream'))();
    const rl = readline.createInterface(instream, outstream);

    // pathCamfile = path.dirname(logfile);
    // pathCamfile = path.join(pathCamfile, 'camFile.txt');

    // if (fs.existsSync(this.camFile)) {
    //  fs.unlinkSync(this.camFile);
    // }

    // let extendedPathCamfile = path.dirname(logfile);
    // extendedPathCamfile = path.join(extendedPathCamfile, 'extendedCamFile.txt');
    // if (fs.existsSync(extendedPathCamfile))fs.unlinkSync(extendedPathCamfile);


    let lineCounter = 0;
    rl.on('line', (line) => {
      lineCounter++;
      if (line.includes('CAM {')) {
        const init = line.indexOf('{');
        const fin = line.indexOf('}');
        arrCAM.push(line.substr(init, fin - init + 1));
        // extendedArrCAM.push(line);
        // console.log(`Detectada linea CAM ${line.substr(init, fin - init + 1)}`);
      }
    });

    rl.on('close', () => {
      // console.log(`done reading file. lines ${lineCounter}`);
      for (let i = 0; i < arrCAM.length; i += 1) {
        arrCAM[i] = this.replaceAll(arrCAM[i], ' ', '');
        const items = arrCAM[i].split(',');
        const lat = items[3].split(':')[1];
        const lng = items[4].split(':')[1];
        const alt = items[5].split(':')[1];
        this.arrCamFile.push(`${lat},${lng},${alt}0,0,0,0\n`);
      }

      // console.log(`Cam file: ${this._data.arrCAMFile}`);


      const wpFile = fs.createWriteStream(this.camFile, {
        flags: 'a', // 'a' means appending (old data will be preserved)
      });
      this.arrCamFile.forEach((item) => {
        wpFile.write(item);
      });
      wpFile.end;
      console.log('Finished cam log creation');
      this.emit('camFileCreated', { camItems: this.arrCamFile.length });

      /*
      const extendedWpFile = fs.createWriteStream(extendedPathCamfile, {
        flags: 'a', // 'a' means appending (old data will be preserved)
      });
      extendedArrCAM.forEach((item) => {
        extendedWpFile.write(`${item}\n`);
      });
      extendedWpFile.end;
      console.log('Finished extended cam log creation');
      */
      // this._data.status.code = 4;
      // this._data.status.description = "4/4 Converted CAM format. Process Finished for item " + this._data.itemNumber;
    });
  }

  replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
  }
}

module.exports = MavlinkLogfile;
