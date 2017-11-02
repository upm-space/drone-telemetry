const MavlinkChecksum = require('./checksum.js');

class MessageClassGenerator {
  constructor(messajeObj) {
    const chk = new MavlinkChecksum.MavlinkChecksum();
    this.messajeObj = messajeObj;
    this.EF = 'LE'; // Endian Format;
    this.xmlChecksum = chk.calculateMessageChecksum(messajeObj);
    this.classNameSeed = this.createClassName(messajeObj.$.name);
    this.constructorFieldArray = [];
    this.readFieldArray = [];
    this.createBufferFieldArray = [];
    this.getDataFieldArray = [];
    this.fieldByteLenght = [];
  }
  returnClassString() {
    this.fillinFieldArrayMethods();
    let classString = '';
    classString += this.returnHeaderClass();
    classString += this.returnConstructor();
    classString += this.returnRead();
    classString += this.returnCreateBuffer();
    classString += this.returnGetData();
    classString += '\n}\n';
    classString += `module.exports.${this.classNameSeed}Message = ${this.classNameSeed}Message;\n`;
    return classString;
  }

  /**
   * fill in the arrays defined in the constructor
   */
  fillinFieldArrayMethods() {
    // messages[0].message[0].field[0].$.type
    this.messajeObj.field.forEach((field) => {
      // this.constructorFieldArray.push(`    this.${field.$.enum} = 0;\n`);
      field.dataType = this.chooseByteFieldLength(field.$.type);
      this.constructorFieldArray.push(field);
    });
  }

  returnHeaderClass() {
    return `
// http://mavlink.org/messages/common
const events = require('events');

//----------------------------------------------------------------------------
// Calcula Crc-16/x.25
const calculateChecksum = (buffer) => {
  let checksum = 0xffff;
  for (let i = 0; i < buffer.length; i += 1) {
    let tmp = buffer[i] ^ (checksum & 0xff);
    tmp = (tmp ^ (tmp << 4)) & 0xFF;
    checksum = (checksum >> 8) ^ (tmp << 8) ^ (tmp << 3) ^ (tmp >> 4);
    checksum &= 0xFFFF;
  }
  return checksum;
};

/**
* Attitude ID:${this.messajeObj.$.id} http://mavlink.org/messages/common#${this.messajeObj.$.name}
*/

class ${this.classNameSeed}Message {
    `;
  }


  returnConstructor() {
    let text = '';
    let accumulated = 6;
    this.constructorFieldArray.forEach((item1) => {
      text += `    this.${item1.$.name} = ${item1.dataType.defaultValue};\n`;
      accumulated += item1.dataType.lengthType * item1.dataType.lengthArray;
    });
    text += `    this.crc${this.classNameSeed} = ${this.xmlChecksum};\n`;
    text += '    this.crc = 0;\n';
    text += `    this.buffer = new Buffer(${(accumulated) + 2});\n`;
    text += `    this.crc_buf = new Buffer(${(accumulated)});\n`;
    text += '    this.eventEmitter = new events.EventEmitter();\n';

    text = `\n  constructor(){\n${text}  }`;
    return text;
  }

  returnRead() {
    let text = '';
    let accumulated = 6;
    this.constructorFieldArray.forEach((item1) => {
      text += '   try {\n';
      if (item1.dataType.lengthArray === 1) {
        if (item1.dataType.lengthType === 8) {
          text += `    var val1 = data.${item1.dataType.methodToRead}(${accumulated});\n`;
          accumulated += 4;
          text += `    var val2 = data.${item1.dataType.methodToRead}(${accumulated});\n`;
          accumulated += 4;
          text += `    this.${item1.$.name} = (val1<<32) + (val2);\n`;
        } else {
          text += `    this.${item1.$.name} = data.${item1.dataType.methodToRead}(${accumulated});\n`;
          accumulated += item1.dataType.lengthType;
        }
      } else if (item1.dataType.type === 'char') {
        text += `    this.${item1.$.name} = data.toString('ascii',${accumulated}, ${(accumulated + item1.dataType.lengthArray)});\n`;
        accumulated += item1.dataType.lengthArray; // multiplied by char length, which is 1
      } else {
        text += `    for (var i=0; i<${item1.dataType.lengthArray}; i += 1) {
        this.data[i]=${item1.$.name}.${item1.dataType.methodToRead}(i + ${accumulated});
    }\n`;
        accumulated += item1.dataType.lengthType * item1.dataType.lengthArray;
      }
      text += '   }catch (e) {/*console.log(\'Tamaño de paquete excedido: \' + e)*/};\n';
    });

    text += '    data.copy(this.buffer, 0, 0, this.buffer.length);\n';
    text += '    this.eventEmitter.emit(\'data\', this.getData());\n';
    text = `\n  read(data) {\n${text}  }`;
    return text;
  }
  /**
   * definitions on http://qgroundcontrol.org/mavlink/start
   * @return {[type]} [description]
   */
  returnCreateBuffer() {
    let text = '';
    let accumulated = 6;
    text += '    this.buffer[0] = 0xfe;\n'; // Indicates the start of a new packet. V1.0 0xFE
    text += '    this.buffer[1] = this.buffer.length - 8;\n';// Indicates length of the following payload.
    // this.buffer[2] = 3;// Each component counts up his send sequence. Allows to detect packet loss
    text += '    this.buffer[3] = 1;\n';// ID of the SENDING system. Allows to differentiate different MAVs on the same network.
    text += '    this.buffer[4] = 1;\n';// ID of the SENDING component. Allows to differentiate different components of the same system, e.g. the IMU and the autopilot.
    text += `    this.buffer[5] = 0x${(+this.messajeObj.$.id).toString(16)};\n`; // ID of the message
    this.constructorFieldArray.forEach((item1) => {
      if (item1.dataType.lengthArray === 1) {
        if (item1.dataType.lengthType === 8) {
          // TODO: int64, uint64
        } else {
          text += `    this.buffer.${item1.dataType.methodToWrite}(this.${item1.$.name},${accumulated});\n`;
          accumulated += item1.dataType.lengthType * item1.dataType.lengthArray;
        }
      } else if (item1.dataType.type === 'char') {
        // TODO: array of chars
      } else {
        // TODO: array of other types
      }
    });
    text += '    this.buffer.copy(this.crc_buf, 0, 1, this.buffer[1] + 6);\n';
    text += `    this.crc_buf[this.crc_buf.length - 1] = this.crc${this.classNameSeed};\n`;
    text += '    this.crc = calculateChecksum(this.crc_buf);\n';
    text += '    this.buffer.writeUInt16LE(this.crc, this.buffer[1] + 6);\n';
    text = `\n  createBuffer() {\n${text}  }`;
    return text;
  }

  returnGetData() {
    let text = `      parameter: '${this.messajeObj.$.name}',\n`;
    this.constructorFieldArray.forEach((item1) => {
      text += `      ${item1.$.name} : this.${item1.$.name},\n`;
    });
    text = `\n  getData() {\n    return{\n${text}\n    };\n  }`;
    return text;
  }


  // uint16_t
  // uint32_t
  // uint64_t
  // int16_t
  // int32_t
  // int64_t
  // float
  // char[
  // uint8_t[
  // uint16_t[
  // int8_t[
  // int16_t[
  // float[
  chooseByteFieldLength(fieldType) {
    let lengthType = 0;
    let lengthArray = 1;
    let type = '';
    let methodToWrite = '';
    let methodToRead = '';
    const defaultValue = 0;

    if (fieldType === 'int8_t') {
      lengthType = 1;
      methodToRead = 'readInt8'; // https://nodejs.org/api/buffer.html#buffer_buf_re'';adint8_offset_noassert
      methodToWrite = 'writeInt8';// https://nodejs.org/api/buffer.html#buffer_buf_writeint8_value_offset_noassert
      type = 'int';
    }
    if (fieldType === 'int16_t') {
      lengthType = 2;
      methodToRead = `readInt16${this.EF}`;
      methodToWrite = `writeInt16${this.EF}`;
      type = 'int';
    }
    if (fieldType === 'int32_t') {
      lengthType = 4;
      methodToRead = `readInt32${this.EF}`;
      methodToWrite = `writeInt32${this.EF}`;
      type = 'int';
    }
    if (fieldType === 'int64_t') {
      lengthType = 8;
      methodToRead = `readInt32${this.EF}`; // ponemos 32 y no 64 ver el trato que se le hace en el método
      methodToWrite = `writeInt32${this.EF}`; // returnRead() de esta misma clase
      type = 'int';
    }

    if (fieldType === 'uint8_t') {
      lengthType = 1;
      methodToRead = 'readUInt8'; // https://nodejs.org/api/buffer.html#buffer_buf_re'';adint8_offset_noassert
      methodToWrite = 'writeUInt8';// https://nodejs.org/api/buffer.html#buffer_buf_writeint8_value_offset_noassert
      type = 'uint';
    }
    if (fieldType === 'uint16_t') {
      lengthType = 2;
      methodToRead = `readUInt16${this.EF}`;
      methodToWrite = `writeUInt16${this.EF}`;
      type = 'uint';
    }
    if (fieldType === 'uint32_t') {
      lengthType = 4;
      methodToRead = `readUInt32${this.EF}`;
      methodToWrite = `writeUInt32${this.EF}`;
      type = 'uint';
    }
    if (fieldType === 'uint64_t') {
      lengthType = 8;
      methodToRead = `readUInt32${this.EF}`;
      methodToWrite = `writeUInt32${this.EF}`;
      type = 'uint';
    }

    if (fieldType === 'float') {
      lengthType = 4;
      methodToRead = `readFloat${this.EF}`;
      methodToWrite = `writeFloat${this.EF}`;
      type = 'float';
    }

    if (fieldType.includes('int8_t[')) {
      lengthArray = this.getIntegerBetweenBrackets(fieldType);
      lengthType = 1;
      methodToRead = 'readInt8'; // https://nodejs.org/api/buffer.html#buffer_buf_re'';adint8_offset_noassert
      methodToWrite = 'writeInt8';// https://nodejs.org/api/buffer.html#buffer_buf_writeint8_value_offset_noassert
      type = 'int';
    }

    if (fieldType.includes('int16_t[')) {
      lengthArray = this.getIntegerBetweenBrackets(fieldType);
      lengthType = 2;
      methodToRead = `readInt16${this.EF}`;
      methodToWrite = `writeInt16${this.EF}`;
      type = 'int';
    }

    if (fieldType.includes('int32_t[')) {
      lengthArray = this.getIntegerBetweenBrackets(fieldType);
      lengthType = 4;
      methodToRead = `readInt32${this.EF}`;
      methodToWrite = `writeInt32${this.EF}`;
      type = 'int';
    }

    if (fieldType.includes('int64_t[')) {
      lengthArray = this.getIntegerBetweenBrackets(fieldType);
      lengthType = 8;
      methodToRead = `readInt64${this.EF}`;
      methodToWrite = `writeInt64${this.EF}`;
      type = 'int';
    }

    if (fieldType.includes('uint8_t[')) {
      lengthArray = this.getIntegerBetweenBrackets(fieldType);
      lengthType = 1;
      methodToRead = 'readUInt8'; // https://nodejs.org/api/buffer.html#buffer_buf_re'';adint8_offset_noassert
      methodToWrite = 'writeUInt8';// https://nodejs.org/api/buffer.html#buffer_buf_writeint8_value_offset_noassert
      type = 'int';
    }

    if (fieldType.includes('uint16_t[')) {
      lengthArray = this.getIntegerBetweenBrackets(fieldType);
      lengthType = 2;
      methodToRead = `readUInt16${this.EF}`;
      methodToWrite = `writeUInt16${this.EF}`;
      type = 'int';
    }

    if (fieldType.includes('uint32_t[')) {
      lengthArray = this.getIntegerBetweenBrackets(fieldType);
      lengthType = 4;
      methodToRead = `readUInt32${this.EF}`;
      methodToWrite = `writeUInt32${this.EF}`;
      type = 'int';
    }

    if (fieldType.includes('uint64_t[')) {
      lengthArray = this.getIntegerBetweenBrackets(fieldType);
      lengthType = 8;
      methodToRead = `readUInt64${this.EF}`;
      methodToWrite = `writeUInt64${this.EF}`;
      type = 'int';
    }

    if (fieldType.includes('float[')) {
      lengthArray = this.getIntegerBetweenBrackets(fieldType);
      lengthType = 4;
      methodToRead = `readFloat${this.EF}`;
      methodToWrite = `writeFloat${this.EF}`;
      type = 'float';
    }

    if (fieldType.includes('char[')) {
      lengthArray = this.getIntegerBetweenBrackets(fieldType);
      lengthType = 1;
      methodToRead = '';
      methodToWrite = '';
      type = 'char';
    }

    return { type, lengthType, methodToRead, methodToWrite, lengthArray, defaultValue };
  }

  getIntegerBetweenBrackets(expression) {
    return parseInt(expression.replace(/.*\[|\]/gi, ''), 10);
  }
  createClassName(text) {
    const textArr = text.split('_');
    let name = '';
    textArr.forEach((fragment) => {
      name += this.capitalize(fragment);
    });
    return name;
  }
  capitalize(s) {
    return s[0].toUpperCase() + s.slice(1).toLowerCase();
  }
}

module.exports.MessageClassGenerator = MessageClassGenerator;
