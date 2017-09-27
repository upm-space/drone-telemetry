
const MavlinkLogs = require('./logs');

const binFile = '/media/luis/data/srm/ImagenesPruebas/logs/calatayud/convertedByLIM/2017-09-21 19-11-43.bin';
const txtFile = '/media/luis/data/srm/ImagenesPruebas/logs/calatayud/convertedByLIM/2017-09-21 19-11-43.txt';
const log = new MavlinkLogs.MavlinkLogs(binFile);
console.log('Cominezo conversión de binario a texto');
log.convertBinToTxt(binFile, txtFile);
msg = { type: 'message', msg: '2/3 Conversión de binario a texto finalizado' };
msg = JSON.stringify(msg);
// this.ws.send(msg);
console.log('comienzo conversión de texto a cam');
log.processLogFileToGetCAM(txtFile);
