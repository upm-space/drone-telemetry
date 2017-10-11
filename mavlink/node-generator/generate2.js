const fs = require('fs');
const xml2js = require('xml2js');
const EventEmitter = require('events').EventEmitter;
const MavlinkChecksum = require('./checksum.js');

const parser = new xml2js.Parser();
const chk = new MavlinkChecksum.MavlinkChecksum();

const xmlFile = `${__dirname}/common.xml`;
fs.readFile(xmlFile, (error, data) => {
  parser.parseString(data, (err, result) => {
    const resultado = result;


    resultado.mavlink.messages[0].message.forEach((msg) => {
      if (msg.$.id === '30') {
        // console.log(msg);
        const datoCHK = chk.calculateMessageChecksum(msg);
        console.log(`Datos CHK ${datoCHK}`);
      }
    });
  });
});
