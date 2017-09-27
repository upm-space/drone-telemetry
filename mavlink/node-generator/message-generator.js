const fs = require('fs');
const xml2js = require('xml2js');

class MavlinkMessageGenerator {
  constructor(xmlFile) {
    this.xml = xmlFile;
  }
  generateMessages() {
    this.readXmlFile((xmlObj) => {
      // console.log(xmlObj.mavlink.messages[0].message.length);
      // console.log(xmlObj.mavlink.messages[0].message[0].$.name);
      // console.log(xmlObj.mavlink.messages[0].message[0].$.id);
      // console.log(xmlObj.mavlink.messages[0].message[0].description[0]);
      console.log(xmlObj.mavlink.messages[0].message[0].field[0]._);
      console.log(xmlObj.mavlink.messages[0].message[0].field[0].$.type);
      console.log(xmlObj.mavlink.messages[0].message[0].field[0].$.name);
      console.log(xmlObj.mavlink.messages[0].message[0].field[0].$.enum);
      // xmlObj.mavlink.messages[0].message.forEach((data) => {
      //   console.log(data.name);
      // });
    });
  }

  readXmlFile(callback) {
    const parser = new xml2js.Parser();
    fs.readFile(this.xml, (err, data) => {
      parser.parseString(data, (err, result) => {
        if (err) {
          console.log(`Error reading XML file to generate Messages: ${err}`);
        }
        callback(result);
      });
    });
  }
}

module.exports.MavlinkMessageGenerator = MavlinkMessageGenerator;
