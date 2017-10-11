const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');

class MavlinkLogs {
  constructor() {
    this._data = { arrCAMFile: [] };
  }
  convertBinToTxt(binFile, txtFile) {
    const spawn = require('child_process').spawn;
    // let missionBin = binFile;
    const logStream = fs.createWriteStream(txtFile);
    console.log(`paso 1: ${binFile}`);
    const fileToConvert = spawn('/usr/local/bin/mavlogdump.py', [binFile]);
    console.log('paso 2');
    fileToConvert.stdout.pipe(logStream);
    fileToConvert.on('close', () => {
      console.log('log file converted to txt');
      // this._data.status.code = 3;
      // this._data.status.description = "3/4 Converted binary to txt";
      return this.processLogFileToGetCAM(txtFile);
    });
  }
  processLogFileToGetCAM(logfile) {
    const arrCAM = [];
    const extendedArrCAM = [];
    this._data.arrCAMFile = []; // Ya ha sido vaciada desde downloadLogFromDrone, revisar bien el código
    let fs = require('fs'),
      readline = require('readline'),
      instream = fs.createReadStream(logfile),
      outstream = new (require('stream'))(),
      rl = readline.createInterface(instream, outstream);

    let pathCamfile = path.dirname(logfile);
    pathCamfile = path.join(pathCamfile, 'camFile.txt');
    if (fs.existsSync(pathCamfile))fs.unlinkSync(pathCamfile);

    let extendedPathCamfile = path.dirname(logfile);
    extendedPathCamfile = path.join(extendedPathCamfile, 'extendedCamFile.txt');
    if (fs.existsSync(extendedPathCamfile))fs.unlinkSync(extendedPathCamfile);


    let lineCounter = 0;
    rl.on('line', (line) => {
      lineCounter++;
      if (line.includes('CAM {')) {
        const init = line.indexOf('{');
        const fin = line.indexOf('}');
        arrCAM.push(line.substr(init, fin - init + 1));
        extendedArrCAM.push(line);
        console.log(`Detectada linea CAM ${line.substr(init, fin - init + 1)}`);
      }
    });

    rl.on('close', () => {
      console.log(`done reading file. lines ${lineCounter}`);
      for (let i = 0; i < arrCAM.length; i++) {
        arrCAM[i] = this.replaceAll(arrCAM[i], ' ', '');
        const items = arrCAM[i].split(',');
        const lat = items[3].split(':')[1];
        const lng = items[4].split(':')[1];
        const alt = items[5].split(':')[1];
        this._data.arrCAMFile.push(`${lat},${lng},${alt}0,0,0,0\n`);
      }

      console.log(`Cam file: ${this._data.arrCAMFile}`);


      const wpFile = fs.createWriteStream(pathCamfile, {
        flags: 'a', // 'a' means appending (old data will be preserved)
      });
      this._data.arrCAMFile.forEach((item) => {
        wpFile.write(item);
      });
      wpFile.end;
      console.log('Finished cam log creation');

      const extendedWpFile = fs.createWriteStream(extendedPathCamfile, {
        flags: 'a', // 'a' means appending (old data will be preserved)
      });
      extendedArrCAM.forEach((item) => {
        extendedWpFile.write(`${item}\n`);
      });
      extendedWpFile.end;
      console.log('Finished extended cam log creation');

      // this._data.status.code = 4;
      // this._data.status.description = "4/4 Converted CAM format. Process Finished for item " + this._data.itemNumber;
    });
  }

  replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
  }
}

module.exports.MavlinkLogs = MavlinkLogs;
