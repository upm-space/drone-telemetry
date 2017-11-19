
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

const buff = new Buffer([4, 243, 255, 190, 51, 0, 0, 1, 1, 196]);
const checks = calculateChecksum(buff);
const buffCheck = new Buffer(2);
buffCheck.writeUInt16LE(checks, 0, 1);
console.log(`${buffCheck[0]} ${buffCheck[1]}`);
