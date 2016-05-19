var PlayerProvider = {
    template: {},

    players: {
        video: {},
        audio: {},
        image: {}
    },

    context: null,

    equalizerColors: [],

    init: function(){
        var that = this;
        SystemProvider.ajax({
            url: SystemProvider.getUrl('newsTemplate'),
            type: 'GET',
            success: function(data) {
                if(data.status == 'success') {
                    that.template = data.html;
                }
            }
        });

        that.context = new AudioContext();

        for(var i = 0; i < 128; i++){
            if(i == 0){
                that.equalizerColors.push('FF0000');
            } else if(i > 0 && i < 64){
                that.equalizerColors.push(that.decToHex((255 - (4 * i)) * 65536 + (4 * i) * 256));
            } else if(i == 64){
                that.equalizerColors.push('00FF00');
            } else if(i > 64 && i < 127){
                var x = i - 64;
                that.equalizerColors.push(that.decToHex((255 - (4 * x)) * 256 + 4 * x));
            } else {
                that.equalizerColors.push('0000FF');
            }
        }
    },





    

    
    
    audio: function(option) {
        var that = this;

        function AudioPlayer(option) {
            this.parent = option.parent;
            var template = _.template(that.template.audio);

            option.parent.html(template({
                index: option.index,
                realName: option.name,
                tmpName: option.tmpName,
                audioUrl: window.baseUrl + option.url
            }));

            this.$audio = this.parent.find('audio');
            this.audio = this.parent.find('audio')[0];
            this.canvas = this.parent.find('canvas')[0];
            this.equalizer = 1;
        }

        AudioPlayer.prototype.init = function () {
            var that = this;

            that.node = PlayerProvider.context.createScriptProcessor(2048, 1, 1);
            that.analyser = PlayerProvider.context.createAnalyser();
            that.analyser.smoothingTimeConstant = 0.3;
            that.analyser.fftSize = 256;
            that.bands = new Uint8Array(that.analyser.frequencyBinCount);
            that.source = PlayerProvider.context.createMediaElementSource(that.audio);
            that.source.connect(that.analyser);
            that.analyser.connect(that.node);
            that.node.connect(PlayerProvider.context.destination);
            that.source.connect(PlayerProvider.context.destination);
            that.particles = [];

            for (var i = 0; i < that.bands.length; i++) {
                that.particles.push({
                    x: PlayerProvider.random(448),
                    y: PlayerProvider.random(120),
                    direction: {
                        x: 1,
                        y: 1
                    },
                    level: 1 * PlayerProvider.random(4),
                    speed: PlayerProvider.random(0.2, 1),
                    radius: PlayerProvider.random(1, 10),
                    color: PlayerProvider.equalizerColors[i],
                    opacity: PlayerProvider.random(0.2, 1),
                    band: Math.floor(PlayerProvider.random(128))
                });
            }

            that.node.onaudioprocess = function () {
                var ctx = that.canvas.getContext('2d');
                ctx.clearRect(0, 0, that.canvas.width, that.canvas.height);
                var dx = Math.round(that.canvas.width / 128 * 10) / 10;
                var dy = Math.round(that.canvas.height / 2 * 10) / 10;

                if (!that.audio.paused) {
                    switch (that.equalizer) {
                        case 1:
                        {
                            that.analyser.getByteFrequencyData(that.bands);

                            for (var i = 0; i < that.bands.length; i++) {
                                var grd = ctx.createLinearGradient(0, 0, 0, that.canvas.height);
                                grd.addColorStop(0, '#' + PlayerProvider.equalizerColors[i]);
                                grd.addColorStop(1, '#fff');

                                ctx.fillStyle = grd;
                                ctx.fillRect(that.canvas.width - (dx * (i + 1)), 0, dx, that.canvas.height * that.bands[i] / 255);
                            }
                        }
                            break;
                        case 2:
                        {
                            that.analyser.getByteTimeDomainData(that.bands);
                            var grd = ctx.createLinearGradient(0, 0, that.canvas.width, that.canvas.height);
                            grd.addColorStop(0, '#00f');
                            grd.addColorStop(0.5, '#0f0');
                            grd.addColorStop(1, '#f00');
                            ctx.strokeStyle = grd;
                            ctx.lineWidth = 3;

                            for (var i = 0; i < that.bands.length; i++) {
                                if (i == 0) {
                                    ctx.beginPath();
                                    ctx.moveTo(that.canvas.width, that.canvas.height * that.bands[i] / 255);
                                }
                                ctx.lineTo(that.canvas.width - (dx * (i + 1)), that.canvas.height * that.bands[i] / 255);
                            }

                            ctx.stroke();
                        }
                            break;
                        case 3:
                        {
                            that.analyser.getByteTimeDomainData(that.bands);

                            for (var i = 0; i < that.bands.length; i++) {
                                var pulsar = Math.exp(that.bands[i] / 256);
                                var scale = pulsar * that.particles[i].radius || that.particles[i].radius;

                                ctx.save();
                                ctx.beginPath();
                                ctx.arc(that.particles[i].x, that.particles[i].y, scale, 0, Math.PI * 2);
                                ctx.fillStyle = '#' + that.particles[i].color;
                                ctx.globalAlpha = that.particles[i].opacity / that.particles[i].level;
                                ctx.closePath();
                                ctx.fill();
                                ctx.strokeStyle = '#' + that.particles[i].color;
                                ctx.stroke();
                                ctx.restore();

                                that.particles[i].y = that.particles[i].y
                                    + that.particles[i].direction.y
                                    * that.particles[i].speed
                                    * that.particles[i].level;
                                that.particles[i].x = that.particles[i].x
                                    + that.particles[i].direction.x
                                    * that.particles[i].speed
                                    * that.particles[i].level;

                                if (that.particles[i].y >= 120) {
                                    that.particles[i].y = 120;
                                    that.particles[i].direction.y *= -1;
                                }

                                if (that.particles[i].y <= 0) {
                                    that.particles[i].y = 0;
                                    that.particles[i].direction.y *= -1;
                                }

                                if (that.particles[i].x >= 448) {
                                    that.particles[i].x = 448;
                                    that.particles[i].direction.x *= -1;
                                }

                                if (that.particles[i].x <= 0) {
                                    that.particles[i].x = 0;
                                    that.particles[i].direction.x *= -1;
                                }
                            }
                        }
                            break;
                    }
                }
            }

            that.progress = that.parent.find('#progress');
            that.speakerBar = that.parent.find('#speakerBar');
            that.speedometerBar = that.parent.find('#speedometerBar');

            that.progress.slider({
                handle: 'round',
                min: 0,
                max: 0,
                step: 0.25,
                tooltip: 'hide'
            });

            that.progress.on('change', function (e) {
                that.audio.currentTime = e.value.newValue;

                return true;
            });

            that.speakerBar.slider({
                handel: 'round',
                min: 0,
                max: 1,
                step: 0.1,
                ticks: [0, 0.33, 0.66, 1],
                tooltip: 'hide',
                change: function () {
                    debugger;
                }
            });

            that.speakerBar.on('change', function (e) {
                that.audio.volume = e.value.newValue;

                return true;
            });

            that.speedometerBar.slider({
                handel: 'round',
                min: 0,
                max: 100,
                value: 50,
                step: 1,
                ticks: [0, 17, 34, 50, 67, 84, 100],
                ticks_labels: ['1/8', '1/4', '1/2', '1', '2', '4', '8'],
                tooltip: 'hide',
                change: function () {
                    debugger;
                }
            });

            that.speedometerBar.on('change', function (e) {
                var value = e.value.newValue;

                if (value == 50) {
                    that.audio.playbackRate = 1;
                } else if (value > 50) {
                    that.audio.playbackRate = 1 + ((value - 50) * 0.06);
                } else if (value < 50) {
                    that.audio.playbackRate = 1 - ((value - 50) * 0.03);
                }

                return true;
            });

            that.$audio
                .on('loadedmetadata', function () {
                    that.progress.slider('setAttribute', 'max', Math.round(that.audio.duration));
                })
                .on('timeupdate', function () {
                    console.log(that.audio.currentTime);
                    that.progress.slider('setAttribute', 'value', that.audio.currentTime);
                    that.progress.slider('refresh');
                    that.current.text(Math.round(that.audio.currentTime));
                })
                .on('progress', function () {
                    //that.progress.slider('setAttribute', 'value', [Math.round(that.video.currentTime), Math.round(this.buffered.end(0))]);
                })
                .on('waiting', function () {
                    that.parent.find('.sk-circle').removeClass('hidden');
                })
                .on('canplay', function () {
                    that.parent.find('.sk-circle').addClass('hidden');
                });

            that.play = that.parent.find('#play');
            that.pause = that.parent.find('#pause');
            that.stop = that.parent.find('#stop');
            that.backward = that.parent.find('#backward');
            that.forward = that.parent.find('#forward');
            that.duretion = that.parent.find('.result #du');
            that.current = that.parent.find('.result #ct');
            that.speakers = that.parent.find('#speakers');
            that.speedometer = that.parent.find('#speedometer');
            that.left = that.parent.find('.eq-control #left')
            that.right = that.parent.find('.eq-control #right')

            that.speakers.find('.slider').addClass('hidden');
            that.speedometer.find('.slider').addClass('hidden');

            that.play.click(function (e) {
                e.stopPropagation();
                var $elem = $(e.target);
                $elem.addClass('hidden');
                that.pause.removeClass('hidden');

                that.audio.play();
                that.duretion.text(Math.round(that.audio.duration));
            });

            that.backward.click(function () {
                that.audio.currentTime -= 5;
            });

            that.forward.click(function () {
                that.audio.currentTime += 5;
            });

            that.stop.click(function () {
                that.audio.pause();
                that.audio.currentTime = 0;

                that.pause.addClass('hidden');
                that.play.removeClass('hidden');
            });

            that.pause.click(function () {
                that.audio.pause();

                that.pause.addClass('hidden');
                that.play.removeClass('hidden');
            });

            that.speakers.hover(function () {
                that.speakers.css('width', '200px');
                that.speakers.find('.slider').removeClass('hidden');
            }, function () {
                that.speakers.css('width', '20px');
                that.speakers.find('.slider').addClass('hidden');
            });

            that.speedometer.hover(function () {
                that.speedometer.css('width', '200px');
                that.speedometer.find('.slider').removeClass('hidden');
            }, function () {
                that.speedometer.css('width', '20px');
                that.speedometer.find('.slider').addClass('hidden');
            });

            that.left.click(function () {
                if (that.equalizer == 1) {
                    that.equalizer = 3;
                } else {
                    that.equalizer--;
                }
            });

            that.right.click(function () {
                if (that.equalizer == 3) {
                    that.equalizer = 1;
                } else {
                    that.equalizer++;
                }
            });
        }

        return new AudioPlayer(option);
    }