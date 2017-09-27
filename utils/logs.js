const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');

class MavlinkLogs{
    constructor(){
        this._data = {arrCAMFile: []};
    }
    convertBinToTxt(binFile, txtFile){
        const spawn = require( 'child_process' ).spawn;
        //let missionBin = binFile;
        var logStream = fs.createWriteStream(txtFile);
        console.log('paso 1: ' + binFile);
        const fileToConvert = spawn('/usr/local/bin/mavlogdump.py' ,[binFile]);
        console.log('paso 2');
        fileToConvert.stdout.pipe(logStream);
        fileToConvert.on( 'close', () => {
            console.log( 'log file converted to txt');
            //this._data.status.code = 3;
            //this._data.status.description = "3/4 Converted binary to txt";
            return this.processLogFileToGetCAM(txtFile);
        });
    }
    processLogFileToGetCAM(logfile){



        var arrCAM =[];
        this._data.arrCAMFile = []; // Ya ha sido vaciada desde downloadLogFromDrone, revisar bien el código
        var fs = require('fs'),
            readline = require('readline'),
            instream = fs.createReadStream(logfile),
            outstream = new (require('stream'))(),
            rl = readline.createInterface(instream, outstream);

        let pathCamfile = path.dirname(logfile);
        pathCamfile = path.join(pathCamfile, "camFile.txt");
        fs.unlinkSync(pathCamfile);

        var lineCounter = 0;
        rl.on('line', (line) => {
            lineCounter++;
            if(line.includes('CAM {')){
                var init = line.indexOf('{');
                var fin = line.indexOf('}');
                arrCAM.push(line.substr(init,fin-init +1));
                console.log("Detectada linea CAM " + line.substr(init,fin-init +1));
            }

        });

        rl.on('close', ()=> {
            console.log('done reading file. lines ' + lineCounter);
            for(var i =0; i < arrCAM.length; i++){
                arrCAM[i] = this.replaceAll(arrCAM[i]," ","");
                var items = arrCAM[i].split(",");
                var lat = items[3].split(":")[1];
                var lng = items[4].split(":")[1];
                var alt = items[5].split(":")[1];
                this._data.arrCAMFile.push(lat +',' + lng + ',' + alt + "0,0,0,0\n");

            }

            console.log("Cam file: " + this._data.arrCAMFile);


            var wpFile = fs.createWriteStream(pathCamfile, {
                flags: 'a' // 'a' means appending (old data will be preserved)
            })
            this._data.arrCAMFile.forEach(function(item){
                wpFile.write(item);
            })
            wpFile.end;
            console.log("Finished cam log creation");

            //this._data.status.code = 4;
            //this._data.status.description = "4/4 Converted CAM format. Process Finished for item " + this._data.itemNumber;

        });

    }

    replaceAll(str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    }

}

module.exports.MavlinkLogs = MavlinkLogs;