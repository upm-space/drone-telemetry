class MessageClassGenerator {
  constructor(messajeObj) {
    this.messajeObj = messajeObj;
    this.EF = 'LE'; // Endian Format;
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
    classString += this.returnGetData();
    classString += '}';
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
    /**
     * Attitude ID:${this.messajeObj.$.id} http://mavlink.org/messages/common#${this.messajeObj.$.name}
     */

    class ${this.classNameSeed}Message {
    `;
  }

  returnChecksum() {
    return `//----------------------------------------------------------------------------
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
    };`;
  }

  returnConstructor() {
    let text = '';
    let accumulated = 6;
    this.constructorFieldArray.forEach((item1) => {
      text += `    this.${item1.$.name} = ${item1.dataType.defaultValue};\n`;
      accumulated += item1.dataType.lengthType * item1.dataType.lengthArray;
    });
    text += `    this.crc${this.classNameSeed} = ${(accumulated + 4)};\n`;
    text += '    this.crc = 0;\n';
    text += `    this.crcBuffer = ${accumulated};\n`;
    text += '    this.eventEmitter = new events.EventEmitter();\n';

    text = `\n  constructor(){\n${text}  }`;
    return text;
  }

  returnRead() {
    let text = '';
    let accumulated = 6;
    this.constructorFieldArray.forEach((item1) => {
      text += `    this.${item1.$.name} = ${item1.dataType.methodToRead}(${accumulated});\n`;
      accumulated += item1.dataType.lengthType * item1.dataType.lengthArray;
    });
    text += 'data.copy(this.buffer, 0, 0, this.buffer.length);\n';
    text += 'this.eventEmitter.emit(\'data\', this.getData());\n';
    text = `\n  read(data) {\n${text}  }`;
    return text;
  }

  returnGetData() {
    let text = `      parameter: '${this.messajeObj.$.name}',\n`;
    this.constructorFieldArray.forEach((item1) => {
      text += `      ${item1.$.name} = this.${item1.$.name},\n`;
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
      methodToRead = `readInt64${this.EF}`;
      methodToWrite = `writeInt64${this.EF}`;
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
      methodToRead = `readUInt64${this.EF}`;
      methodToWrite = `writeUInt64${this.EF}`;
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
      type = 'int';
    }

    if (fieldType.includes('int16_t[')) {
      lengthArray = this.getIntegerBetweenBrackets(fieldType);
      lengthType = 2;
      type = 'int';
    }

    if (fieldType.includes('int32_t[')) {
      lengthArray = this.getIntegerBetweenBrackets(fieldType);
      lengthType = 4;
      type = 'int';
    }

    if (fieldType.includes('int64_t[')) {
      lengthArray = this.getIntegerBetweenBrackets(fieldType);
      lengthType = 8;
      type = 'int';
    }

    if (fieldType.includes('uint8_t[')) {
      lengthArray = this.getIntegerBetweenBrackets(fieldType);
      lengthType = 1;
      type = 'int';
    }

    if (fieldType.includes('uint16_t[')) {
      lengthArray = this.getIntegerBetweenBrackets(fieldType);
      lengthType = 2;
      type = 'int';
    }

    if (fieldType.includes('uint32_t[')) {
      lengthArray = this.getIntegerBetweenBrackets(fieldType);
      lengthType = 4;
      type = 'int';
    }

    if (fieldType.includes('uint64_t[')) {
      lengthArray = this.getIntegerBetweenBrackets(fieldType);
      lengthType = 8;
      type = 'int';
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
