const SerialPortUtilities = require('./list-serial-port');

myserial = new SerialPortUtilities.SerialPortUtilities();
myserial.list((ports)=>{
    ports.forEach(()=>{
        console.log(ports);
    })
});