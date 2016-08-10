Module.register("MMM-voice", {
    // Default module config.
    defaults: {
        mode: "No mode detected",
        timeout: 5
    },

    needWorthy: [],
    done: 0,
    moduleObjects: {},

    start: function () {
        this.pulsing = false;
        this.modules = [];
        console.log(this.name + ' is started!');
        console.info(this.name + ' is waiting for voice modules');
        this.sendSocketNotification('GET COMMANDS');
        this.commands = [];
        this.availableModules = {};
    },

    getStyles: function () {
        return ["font-awesome.css", "MMM-voice.css"];
    },

    getScripts: function () {
        return ["modules/MMM-voice/js/jquery.js"];
    },


    // Override dom generator.
    getDom: function () {
        var wrapper = document.createElement("div");
        wrapper.classList.add('small');
        wrapper.style.textAlign = 'left';

        // var overlay = document.createElement("div");
        // overlay.className = "blur";
        // $(overlay).hide();
        var i = document.createElement("i");
        // wrapper.appendChild(overlay);
        i.setAttribute('id', 'microphone');
        i.classList.add('fa');
        i.classList.add('fa-microphone');

        if (this.pulsing) {
            wrapper.classList.remove('small');
            wrapper.classList.add('large');
            wrapper.classList.add('moveToCenter');
            $("body").children().children().children(':not(:has(#microphone))').fadeTo('slow', 0.1);


            //  $(overlay).show();

            //$(overlay).fadeOut(1000);
            //  $(i).fadeTo(1000,1);
            i.classList.add('pulse');
        }
        else {
            wrapper.classList.remove('large');
            wrapper.classList.add('small');
            wrapper.classList.remove('moveToCenter');
            $("body").children().children().children(':not(:has(#microphone))').fadeTo('slow', 1);
            this.config.mode = "No mode detected";
        }
        console.log('MODE: ', this.config.mode);
        var mode = document.createElement("span");
        mode.innerHTML = this.config.mode;
        wrapper.appendChild(i);
        wrapper.appendChild(mode);
        return wrapper;
    },


    readyToGo: function (callback) {
        /*if(this.done !== this.needWorthy.length)
         {
         console.log('NOTREADY');
         console.log('READY-DONE:', this.done);
         console.log('READY-NEED:', this.needWorthy.length);
         window.setTimeout(this.readyToGo(),1000);

         }else{
         console.log('NOW READY');
         this.sendSocketNotification('START', {'timeout': this.config.timeout, 'id': this.config.id, 'modules': this.modules});
         }*/
        var that = this;
        while (this.done !== this.needWorthy.length) {
            console.log('NOTREADY');
            console.log('READY-DONE:', this.done);
            console.log('READY-NEED:', this.needWorthy.length);
            setTimeout(function () {
                that.readyToGo(callback);
            }, 50);
            return;
        }
        console.log('NOW READY');
        callback();
    },

    cleanModuleName: function(s){
        if(s === 'MMM-voice')
            return "";
        return s.replace('MMM',"").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g," ");
    },

    notificationReceived: function (notification, payload, sender) {
        console.log("VOICENOTIF: ", notification);
        if (notification === 'DOM_OBJECTS_CREATED') {
            console.log('doms done');
            var mods = [];
            var that = this;
            MM.getModules().forEach(function(w){
                mods.push(that.cleanModuleName(w.name));
                that.availableModules[w.name] = that.cleanModuleName(w.name);
            });
            this.sendSocketNotification('ADD MODULENAMES',mods);

            this.readyToGo(function () {
                that.sendSocketNotification('START', {
                    'timeout': that.config.timeout,
                    'id': that.config.id,
                    'modules': that.modules
                });
            });
        } else if (notification === 'REGISTER_VOICE_MODULE') {

            console.log("REE!", payload);
            if (payload.hasOwnProperty('mode')) {
                this.needWorthy.push(sender);
                this.modules.push(payload);
                var that = this;
                $.getJSON(sender.data.path + 'commands.json', function (data) {
                    var commands = $.map(data, function (el) {
                        return el;
                    });
                    commands.push(payload.mode);

                    that.sendSocketNotification('ADD COMMANDS', commands);
                    console.log('added coms');
                    that.moduleObjects[payload.mode] = sender;
                    console.log('highlight', that.moduleObjects);
                });

            }
        }

    },

    highlightModule: function (w) {
        var i = document.getElementById(w.id).parentNode;
        $(i).fadeTo('slow', 1);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === 'ALL COMMANDS') {
            this.commands = payload;
            console.log('ALL COMMANDS: ', this.commands);

        }
        if (notification === 'ADDED COMMANDS') {
            this.done++;
        }
        if (notification === 'LISTENING') {
            this.config.mode = "Listening";
            this.pulsing = true;
            this.updateDom();
            console.log('listening!');
        } else if (notification === 'SLEEPING') {
            console.log('sleeping');
            this.pulsing = false;
            this.config.mode = "No mode detected";
            this.updateDom();
        }
        else if (notification === 'HIDE') {
            console.log('HIDE');
            console.log('words:', payload.words);
            this.config.mode = 'Hide';
            var that = this;
            if(payload.words.length > 0 && payload.words!='hide')
            {
                MM.getModules().forEach(function(w){
                   if(that.cleanModuleName(w.name) == payload.words)
                   {
                       console.log('HIDING ', w.name);
                       w.hide();
                   }
                });

            }
            this.updateDom();
        }
        else if (notification === 'SHOW') {
            console.log('SHOW');
            console.log('words:', payload.words);
            this.config.mode = 'Show';
            var that = this;
            if(payload.words.length > 0 && payload.words!='show')
            {
                MM.getModules().forEach(function(w){
                    if(that.cleanModuleName(w.name) == payload.words)
                    {
                        console.log('SHOWING ', w.name);
                        w.show();
                    }
                });

            }
            this.updateDom();
        }
        else if (notification === 'ERROR') {
            this.config.mode = notification;
            this.updateDom();
        } else if (notification === 'VOICE') {
            console.log('VOICEEEEEEEE');
            for (var i = 0; i < this.modules.length; i++) {
                if (payload.mode === this.modules[i].mode) {
                    this.config.mode = payload.mode;

                    this.sendNotification(notification + '_' + payload.mode, payload.words);
                    console.log('words:', payload.words);
                    this.updateDom();
                    this.highlightModule(this.moduleObjects[payload.mode]);
                    return;
                }
            }

        }
    }
});