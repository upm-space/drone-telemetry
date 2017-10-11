const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const MessageClassGenerator = require('./message-class-generator.js');

/**
 *LUIS IZQUIERDO MESA
 *
 * Class to generate a set of message based on MavLink.
 *
 * Example of use:
 *
 * const MavlinkMessageGenerator = require('./message-generator.js');
 * const mav = new MavlinkMessageGenerator.MavlinkMessageGenerator(`${__dirname}/common.xml`);
 * mav.generateMessagesSet(['30', '77', '76', '24', '0', '120', '118',
 *  '119', '117', '42', '62', '11', '1', '74']);
 *
 * This will generate a set of classes corresponding with the ID passed as
 * parameter
 *
 * @type {MavlinkMessageGenerator}
 */
class MavlinkMessageGenerator {
  /**
   * [constructor description]
   * @param  {string} xmlFile - path of the mavlink xml definition
   * @return {[type]}         [description]
   */
  constructor(xmlFile) {
    this.xml = xmlFile;
    this.messagesSet = [];
  }

  /**
   * generate a set of classes
   * @param  {[[string]]} idArr - Array of string with the ID of the messages
   */
  generateMessagesSet(idArr) {
    this.readXmlFile((xmlObj) => {
      const folderName = this.buildFolder(xmlObj);
      xmlObj.mavlink.messages[0].message.forEach((msg) => {
        if (idArr.includes(msg.$.id)) {
          const generator = new MessageClassGenerator.MessageClassGenerator(msg);
          this.messagesSet.push(generator);
          const stringClass = generator.returnClassString();
          fs.writeFileSync(path.join(folderName, `${generator.classNameSeed}Message.js`), stringClass);
        }
      });
      this.buildMavlinkClass(xmlObj);
    });
  }

  /**
   * Build a folder to store the classes generated by the generateMessagesSet function

   * @param  {object} xmlObj xml mavlink definition
   * @return {string}        dir path
   */
  buildFolder(xmlObj) {
    const name = `mavlinkV${xmlObj.mavlink.version}D${xmlObj.mavlink.dialect}`;
    const dir = `${__dirname}/${name}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, '0777');
    }
    return dir;
  }

  /**
   * Ansync method to read the xml file passed in the constructor
   * @param  {Function} callback it'll be tigered once th xml has been read
   */
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


  // ********************************************************************
  // *********    SECTION TO BUILD THE MAVLINK CLASS     ****************
  // ********************************************************************

  buildMavlinkClass(xmlObj) {
    const folderName = this.buildFolder(xmlObj);
    let text = 'const EventEmitter = require(\'events\');\n';
    text += this.createRequiredList();
    text += '\nclass MavlinkNode extends EventEmitter {';
    text += this.returnMavlinkConstructor();
    text += this.returnReadMessage();
    text += '}\n\n';
    text += 'module.exports.MavlinkNode = MavlinkNode;';
    fs.writeFileSync(path.join(folderName, 'MavlinkNode.js'), text);
  }

  createRequiredList() {
    let text = '';
    this.messagesSet.forEach((msg) => {
      text += `const ${msg.classNameSeed}Message = require('./${msg.classNameSeed}Message.js');\n`;
    });
    return text;
  }

  returnMavlinkConstructor() {
    let text = '';
    this.messagesSet.forEach((msg) => {
      const objectName = msg.classNameSeed[0].toLowerCase() + msg.classNameSeed.slice(1);
      const className = `${msg.classNameSeed}Message`;
      text += `    this.${objectName}Reader = new ${className}.${className}();\n`;
    });
    text = `\n  constructor() {\n    super();\n${text}  }\n`;
    return text;
  }

  returnReadMessage() {
    let text = '    switch (messageID) {\n';
    this.messagesSet.forEach((msg) => {
      const objectName = msg.classNameSeed[0].toLowerCase() + msg.classNameSeed.slice(1);
      text += `      case 0x${(+msg.messajeObj.$.id).toString(16)}:\n`;
      text += `        this.${objectName}Reader.read(messageB);\n`;
      text += '        break;\n';
    });
    text += '    }\n';
    text = `\n  readMessage(messageID,messageB) {\n${text}\n  }\n`;
    return text;
  }
}

module.exports.MavlinkMessageGenerator = MavlinkMessageGenerator;
