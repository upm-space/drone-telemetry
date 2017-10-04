const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const MessageClassGenerator = require('./message-class-generator.js');

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

  generateMessagesSet(idArr) {
    this.readXmlFile((xmlObj) => {
      const folderName = this.buildFolder(xmlObj);
      xmlObj.mavlink.messages[0].message.forEach((msg) => {
        if (idArr.includes(msg.$.id)) {
          const generator = new MessageClassGenerator.MessageClassGenerator(msg);
          const stringClass = generator.returnClassString();
          fs.writeFileSync(path.join(folderName, `${generator.classNameSeed}Message.js`), stringClass);
        }
      });
    });
  }

  buildFolder(xmlObj) {
    const name = `mavlinkV${xmlObj.mavlink.version}D${xmlObj.mavlink.dialect}`;
    const dir = `${__dirname}/${name}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, '0777');
    }
    return dir;
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
