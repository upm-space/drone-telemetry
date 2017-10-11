// from https://github.com/omcaree/node-mavlink/blob/master/src/mavlink.js
// In this file see method mavlink.prototype.calculateMessageChecksum

class MavlinkChecksum {
  calculateMessageChecksum(message) {
    // First order fields
    this.orderFields(message);

    let checksumString = `${message.$.name} `;
    for (let i = 0; i < message.field.length; i++) {
      const type = message.field[i].$.type.replace('[', ' ').replace(']', ' ').split(' ');
      checksumString += `${type[0]} `;
      checksumString += `${message.field[i].$.name} `;
      if (type[1] !== undefined) {
        checksumString += String.fromCharCode(type[1]);
      }
    }

    const checksum = this.calculateChecksum(new Buffer(checksumString));
    return (checksum & 0xFF) ^ (checksum >> 8);
  }

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

  orderFields(message) {
    message.payloadLength = 0;
    // First make a few corrections
    for (let i = 0; i < message.field.length; i++) {
      // add initial position in XML to preserve this if sizes equal (see sort function below)
      message.field[i].initialPos = i;

      // change a few types
      if (message.field[i].$.type === 'uint8_t_mavlink_version') {
        message.field[i].$.type = 'uint8_t';
      }
      if (message.field[i].$.type === 'array') {
        message.field[i].$.type = 'int8_t';
      }

      // Calculate some useful lengths
      message.field[i].length = this.fieldLength(message.field[i]);
      message.field[i].typeLength = this.fieldTypeLength(message.field[i]);
      message.field[i].arrayLength = message.field[i].length / message.field[i].typeLength;
      message.payloadLength += message.field[i].length;
    }

    // Sort fields by type length
    message.field.sort((a, b) => {
      // Determine lengths of a and b
      const lenA = a.typeLength;
      const lenB = b.typeLength;

      // if lengths are equal, preserve initial ordering
      if (lenA === lenB) {
        return a.initialPos - b.initialPos;
      }
      // otherwise reverse sort on size
      return lenB - lenA;
    });
  }

  fieldLength(field) {
    // Get the types size
    let typeLength = this.fieldTypeLength(field);

    // Split up the field name to find array size
    const fieldSplit = field.$.type.replace('[', ' ').replace(']', ' ').split(' ');

    // For each element after the type name (>1), multiply up
    for (let i = 1; i < fieldSplit.length; i += 1) {
      if (fieldSplit[i] !== '') {
        typeLength *= fieldSplit[i];
      }
    }
    return typeLength;
  }

  fieldTypeLength(field) {
    // Define all the lengths
    const typeLengths = {
      float: 4,
      double: 8,
      char: 1,
      int8_t: 1,
      uint8_t: 1,
      uint8_t_mavlink_version: 1,
      int16_t: 2,
      uint16_t: 2,
      int32_t: 4,
      uint32_t: 4,
      int64_t: 8,
      uint64_t: 8,
    };
    return typeLengths[field.$.type.replace('[', ' ').replace(']', ' ').split(' ')[0]];
  }
}

module.exports.MavlinkChecksum = MavlinkChecksum;
