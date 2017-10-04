const MavlinkMessageGenerator = require('./message-generator.js');
const MessageClassGenerator = require('./message-class-generator.js');

const mav = new MavlinkMessageGenerator.MavlinkMessageGenerator(`${__dirname}/common.xml`);
// mav.generateMessages();
mav.generateMessagesSet(['30']);

// const generator = new MessageClassGenerator.MessageClassGenerator('obj');
// console.log(generator.chooseByteFieldLength('int8_t[32]'));
