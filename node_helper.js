const Psc = require('pocketsphinx-continuous');
const fs = require('fs');
const NodeHelper = require("node_helper");
var child = require('child_process');
const shell = require('shelljs');

module.exports = NodeHelper.create({

    start: function(){
        this.keyword = /(mirror)/g;
        this.listening = false;
        this.mode = false;
        this.hide = false;
        this.show = false;
        this.array = [];
        fs.createReadStream(__dirname + '/commands').pipe(fs.createWriteStream(__dirname + '/commands_clean'));

    },

    cleanCommand: function(s){
        return s.match(/("[^"]+"|[^"\s]+)/g);
    },

    socketNotificationReceived: function(notification, payload){
        if(notification === 'ADD MODULENAMES'){
            for(var i in payload)
            {
                var data = payload[i].toLowerCase();
                if(this.array.indexOf(data) == -1)
                {
                    fs.appendFile(__dirname + '/commands',"\n" + data);
                    this.array.push(data);
                    var cmdString = this.cleanCommand(data);
                    for(var c in cmdString)
                    {
                        fs.appendFile(__dirname + '/commands_clean', "\n" + cmdString[c]);

                    }
                    this.sendSocketNotification('ALL COMMANDS', this.array);
                }
            }
        }
        if(notification === 'GET COMMANDS'){
            this.array = (fs.readFileSync(__dirname + '/commands_clean').toString().split("\n"));
            this.sendSocketNotification('ALL COMMANDS', this.array);
        }
        if(notification === "ADD COMMANDS"){
            console.log('comms: ',payload);
            for(var i in payload)
            {
                var data = payload[i].toLowerCase();
                if(this.array.indexOf(data) == -1)
                {
                    fs.appendFile(__dirname + '/commands',"\n" + data);
                    this.array.push(data);
                    var cmdString = this.cleanCommand(data);
                    for(var c in cmdString)
                    {
                        fs.appendFile(__dirname + '/commands_clean', "\n" + cmdString[c]);

                    }
                    this.sendSocketNotification('ALL COMMANDS', this.array);

                }
            }
            this.sendSocketNotification('ADDED COMMANDS');
        }
        if(notification === 'START'){
            console.log('in start');

            // Generate dictionary
            child.execSync('g2p-seq2seq --decode modules/MMM-voice/commands_clean --model modules/MMM-voice/model | tail -n +3 > modules/MMM-voice/base.dic');

            var d = fs.readFileSync('modules/MMM-voice/commands');

                fs.writeFileSync('modules/MMM-voice/commands_model','');
                d.toString().split('\n').forEach(function(line){
                    fs.appendFileSync('modules/MMM-voice/commands_model','<s> ' + line + ' </s>\n');
                });

            // Generate language model
            child.execSync('text2wfreq < modules/MMM-voice/commands_model | wfreq2vocab > modules/MMM-voice/a.vocab');
            child.execSync('text2idngram -vocab modules/MMM-voice/a.vocab -idngram modules/MMM-voice/a.idngram < modules/MMM-voice/commands_model');
            child.execSync('idngram2lm -vocab_type 0 -idngram modules/MMM-voice/a.idngram -vocab modules/MMM-voice/a.vocab -arpa modules/MMM-voice/base.lm')

            this.modes = [];
            for(var i = 0; i < payload.modules.length; i++){
                this.modes.push({'key': payload.modules[i].mode.toLowerCase(), 'regex': new RegExp(payload.modules[i].mode.toLowerCase(), 'g')});

            }
            console.log(this.modes);
            this.time = payload.timeout*1000;
            this.ps = new Psc({
                setId: payload.id,
                verbose: true
            });
            this.ps.on('data', (data) => {
                if(typeof data == 'string'){
                    console.log("Received voice data: ", data);
                    if(this.keyword.test(data) || this.listening){
                        console.log('LISTENING');
                        this.listening = true;
                        this.sendSocketNotification('LISTENING', 'Listening...');
                        if(this.timer){
                            clearTimeout(this.timer);
                        }
                        this.timer = setTimeout(() => {
                            this.listening = false;
                            this.sendSocketNotification('SLEEPING', 'Sleeping ... zZzZ');
                            this.mode = false;
                            this.hide = false;
                            this.show = false;
                        }, this.time);
                    } else {
                        console.log('No KEYWORD DETECTED');
                        return;
                    }

                    if(/(hide)/g.test(data)){
                        this.hide = true;
                        this.sendSocketNotification('HIDE',{'words': data});
                    }
                    if(this.hide){
                        this.sendSocketNotification('HIDE',{'words': data});
                    }

                    if(/(show)/g.test(data)){
                        this.show = true;
                        this.sendSocketNotification('SHOW',{'words': data});
                    }
                    if(this.show){
                        this.sendSocketNotification('SHOW',{'words': data});
                    }

                    for(var i = 0; i < this.modes.length; i++){
                        if(this.modes[i].regex.test(data)){
                            this.mode = this.modes[i].key;
                             console.log('new mode: ', this.mode);
                            this.sendSocketNotification('VOICE', {'mode': this.mode, 'words': data});
                            //this.mode = false;
                            return;
                        }
                    }

                    if(this.mode){
                        this.sendSocketNotification('VOICE', {'mode': this.mode, 'words': data});

                    }
                }
            });
            this.ps.on('error', (error) => {
                console.log("ERR: " + error);
                fs.appendFile('modules/MMM-voice/error.log', error);
                this.sendSocketNotification('ERROR', error);
            });

            this.ps.on('debug', (data) => {
                //console.log("DEBUG: " + data);
                fs.appendFile('modules/MMM-voice/debug.log', data);
                //this.sendSocketNotification('ERROR', error);
            });
        }
    }
});