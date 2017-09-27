const MavlinkMessageGenerator = require('./message-generator.js');

const mav = new MavlinkMessageGenerator.MavlinkMessageGenerator(`${__dirname}/common.xml`);

mav.generateMessages();
