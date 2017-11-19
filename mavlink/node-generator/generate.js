const MavlinkMessageGenerator = require('./message-generator.js');
const MessageClassGenerator = require('./message-class-generator.js');

const mav = new MavlinkMessageGenerator.MavlinkMessageGenerator(`${__dirname}/common-mission-planner.xml`);

// mav.generateMessagesSet([]);
mav.generateMessagesSet([]);
// mav.generateMessagesSet(['30', '77', '76', '24', '0', '120', '118', '119', '117', '42', '62', '11', '1', '74']);


// mav.generateMessagesSet(['0', '1', '24', '30']);


// const generator = new MessageClassGenerator.MessageClassGenerator('obj');
// console.log(generator.chooseByteFieldLength('int8_t[32]'));
