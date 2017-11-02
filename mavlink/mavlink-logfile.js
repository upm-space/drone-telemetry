class MavlinkLogfile {
  constructor() {
    this.fileSize = 0;
    this.logbuffer = new Buffer(0);
    this.currentIndex = 0;
    this.segmentsWithErrors = [];
  }
  createBuffer(size) {
    this.fileSize = size;
    this.logbuffer = new Buffer(size);
    this.currentIndex = 0;
    this.segmentsWithErrors = [];
  }
  fillinBuffer(buffer, index, offset) {
    if (index !== offset + 1) {
      this.segmentsWithErrors.push({ currentIndex: index, bytesLeft: (index - offset) });
    }
    this.log_dataR.data.copy(buffer, buffer.count, 0, offset);
    this.logbytes += buffer.count;
  }
}

module.exports = MavlinkLogfile;
