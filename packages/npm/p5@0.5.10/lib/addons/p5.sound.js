/* */ 
"format cjs";
(function(Buffer, process) {
  (function(root, factory) {
    if (typeof define === 'function' && define.amd)
      define('p5.sound', ['p5'], function(p5) {
        (factory(p5));
      });
    else if (typeof exports === 'object')
      factory(require('../p5'));
    else
      factory(root['p5']);
  }(this, function(p5) {
    var sndcore;
    sndcore = function() {
      'use strict';
      (function(global, exports, perf) {
        exports = exports || {};
        'use strict';
        function fixSetTarget(param) {
          if (!param)
            return;
          if (!param.setTargetAtTime)
            param.setTargetAtTime = param.setTargetValueAtTime;
        }
        if (window.hasOwnProperty('webkitAudioContext') && !window.hasOwnProperty('AudioContext')) {
          window.AudioContext = webkitAudioContext;
          if (typeof AudioContext.prototype.createGain !== 'function')
            AudioContext.prototype.createGain = AudioContext.prototype.createGainNode;
          if (typeof AudioContext.prototype.createDelay !== 'function')
            AudioContext.prototype.createDelay = AudioContext.prototype.createDelayNode;
          if (typeof AudioContext.prototype.createScriptProcessor !== 'function')
            AudioContext.prototype.createScriptProcessor = AudioContext.prototype.createScriptProcessor;
          if (typeof AudioContext.prototype.createPeriodicWave !== 'function')
            AudioContext.prototype.createPeriodicWave = AudioContext.prototype.createWaveTable;
          AudioContext.prototype.internal_createGain = AudioContext.prototype.createGain;
          AudioContext.prototype.createGain = function() {
            var node = this.internal_createGain();
            fixSetTarget(node.gain);
            return node;
          };
          AudioContext.prototype.internal_createDelay = AudioContext.prototype.createDelay;
          AudioContext.prototype.createDelay = function(maxDelayTime) {
            var node = maxDelayTime ? this.internal_createDelay(maxDelayTime) : this.internal_createDelay();
            fixSetTarget(node.delayTime);
            return node;
          };
          AudioContext.prototype.internal_createBufferSource = AudioContext.prototype.createBufferSource;
          AudioContext.prototype.createBufferSource = function() {
            var node = this.internal_createBufferSource();
            if (!node.start) {
              node.start = function(when, offset, duration) {
                if (offset || duration)
                  this.noteGrainOn(when || 0, offset, duration);
                else
                  this.noteOn(when || 0);
              };
            } else {
              node.internal_start = node.start;
              node.start = function(when, offset, duration) {
                if (typeof duration !== 'undefined')
                  node.internal_start(when || 0, offset, duration);
                else
                  node.internal_start(when || 0, offset || 0);
              };
            }
            if (!node.stop) {
              node.stop = function(when) {
                this.noteOff(when || 0);
              };
            } else {
              node.internal_stop = node.stop;
              node.stop = function(when) {
                node.internal_stop(when || 0);
              };
            }
            fixSetTarget(node.playbackRate);
            return node;
          };
          AudioContext.prototype.internal_createDynamicsCompressor = AudioContext.prototype.createDynamicsCompressor;
          AudioContext.prototype.createDynamicsCompressor = function() {
            var node = this.internal_createDynamicsCompressor();
            fixSetTarget(node.threshold);
            fixSetTarget(node.knee);
            fixSetTarget(node.ratio);
            fixSetTarget(node.reduction);
            fixSetTarget(node.attack);
            fixSetTarget(node.release);
            return node;
          };
          AudioContext.prototype.internal_createBiquadFilter = AudioContext.prototype.createBiquadFilter;
          AudioContext.prototype.createBiquadFilter = function() {
            var node = this.internal_createBiquadFilter();
            fixSetTarget(node.frequency);
            fixSetTarget(node.detune);
            fixSetTarget(node.Q);
            fixSetTarget(node.gain);
            return node;
          };
          if (typeof AudioContext.prototype.createOscillator !== 'function') {
            AudioContext.prototype.internal_createOscillator = AudioContext.prototype.createOscillator;
            AudioContext.prototype.createOscillator = function() {
              var node = this.internal_createOscillator();
              if (!node.start) {
                node.start = function(when) {
                  this.noteOn(when || 0);
                };
              } else {
                node.internal_start = node.start;
                node.start = function(when) {
                  node.internal_start(when || 0);
                };
              }
              if (!node.stop) {
                node.stop = function(when) {
                  this.noteOff(when || 0);
                };
              } else {
                node.internal_stop = node.stop;
                node.stop = function(when) {
                  node.internal_stop(when || 0);
                };
              }
              if (!node.setPeriodicWave)
                node.setPeriodicWave = node.setWaveTable;
              fixSetTarget(node.frequency);
              fixSetTarget(node.detune);
              return node;
            };
          }
        }
        if (window.hasOwnProperty('webkitOfflineAudioContext') && !window.hasOwnProperty('OfflineAudioContext')) {
          window.OfflineAudioContext = webkitOfflineAudioContext;
        }
        return exports;
      }(window));
      var audiocontext = new window.AudioContext();
      p5.prototype.getAudioContext = function() {
        return audiocontext;
      };
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
      var el = document.createElement('audio');
      p5.prototype.isSupported = function() {
        return !!el.canPlayType;
      };
      var isOGGSupported = function() {
        return !!el.canPlayType && el.canPlayType('audio/ogg; codecs="vorbis"');
      };
      var isMP3Supported = function() {
        return !!el.canPlayType && el.canPlayType('audio/mpeg;');
      };
      var isWAVSupported = function() {
        return !!el.canPlayType && el.canPlayType('audio/wav; codecs="1"');
      };
      var isAACSupported = function() {
        return !!el.canPlayType && (el.canPlayType('audio/x-m4a;') || el.canPlayType('audio/aac;'));
      };
      var isAIFSupported = function() {
        return !!el.canPlayType && el.canPlayType('audio/x-aiff;');
      };
      p5.prototype.isFileSupported = function(extension) {
        switch (extension.toLowerCase()) {
          case 'mp3':
            return isMP3Supported();
          case 'wav':
            return isWAVSupported();
          case 'ogg':
            return isOGGSupported();
          case 'aac', 'm4a', 'mp4':
            return isAACSupported();
          case 'aif', 'aiff':
            return isAIFSupported();
          default:
            return false;
        }
      };
      var iOS = navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false;
      if (iOS) {
        var iosStarted = false;
        var startIOS = function() {
          if (iosStarted)
            return;
          var buffer = audiocontext.createBuffer(1, 1, 22050);
          var source = audiocontext.createBufferSource();
          source.buffer = buffer;
          source.connect(audiocontext.destination);
          source.start(0);
          console.log('start ios!');
          if (audiocontext.state === 'running') {
            iosStarted = true;
          }
        };
        document.addEventListener('touchend', startIOS, false);
        document.addEventListener('touchstart', startIOS, false);
      }
    }();
    var master;
    master = function() {
      'use strict';
      var Master = function() {
        var audiocontext = p5.prototype.getAudioContext();
        this.input = audiocontext.createGain();
        this.output = audiocontext.createGain();
        this.limiter = audiocontext.createDynamicsCompressor();
        this.limiter.threshold.value = 0;
        this.limiter.ratio.value = 20;
        this.audiocontext = audiocontext;
        this.output.disconnect();
        this.inputSources = [];
        this.input.connect(this.limiter);
        this.limiter.connect(this.output);
        this.meter = audiocontext.createGain();
        this.fftMeter = audiocontext.createGain();
        this.output.connect(this.meter);
        this.output.connect(this.fftMeter);
        this.output.connect(this.audiocontext.destination);
        this.soundArray = [];
        this.parts = [];
        this.extensions = [];
      };
      var p5sound = new Master();
      p5.prototype.getMasterVolume = function() {
        return p5sound.output.gain.value;
      };
      p5.prototype.masterVolume = function(vol, rampTime, tFromNow) {
        if (typeof vol === 'number') {
          var rampTime = rampTime || 0;
          var tFromNow = tFromNow || 0;
          var now = p5sound.audiocontext.currentTime;
          var currentVol = p5sound.output.gain.value;
          p5sound.output.gain.cancelScheduledValues(now + tFromNow);
          p5sound.output.gain.linearRampToValueAtTime(currentVol, now + tFromNow);
          p5sound.output.gain.linearRampToValueAtTime(vol, now + tFromNow + rampTime);
        } else if (vol) {
          vol.connect(p5sound.output.gain);
        } else {
          return p5sound.output.gain;
        }
      };
      p5.prototype.soundOut = p5.soundOut = p5sound;
      p5.soundOut._silentNode = p5sound.audiocontext.createGain();
      p5.soundOut._silentNode.gain.value = 0;
      p5.soundOut._silentNode.connect(p5sound.audiocontext.destination);
      return p5sound;
    }(sndcore);
    var helpers;
    helpers = function() {
      'use strict';
      var p5sound = master;
      p5.prototype.sampleRate = function() {
        return p5sound.audiocontext.sampleRate;
      };
      p5.prototype.freqToMidi = function(f) {
        var mathlog2 = Math.log(f / 440) / Math.log(2);
        var m = Math.round(12 * mathlog2) + 57;
        return m;
      };
      p5.prototype.midiToFreq = function(m) {
        return 440 * Math.pow(2, (m - 69) / 12);
      };
      p5.prototype.soundFormats = function() {
        p5sound.extensions = [];
        for (var i = 0; i < arguments.length; i++) {
          arguments[i] = arguments[i].toLowerCase();
          if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].indexOf(arguments[i]) > -1) {
            p5sound.extensions.push(arguments[i]);
          } else {
            throw arguments[i] + ' is not a valid sound format!';
          }
        }
      };
      p5.prototype.disposeSound = function() {
        for (var i = 0; i < p5sound.soundArray.length; i++) {
          p5sound.soundArray[i].dispose();
        }
      };
      p5.prototype.registerMethod('remove', p5.prototype.disposeSound);
      p5.prototype._checkFileFormats = function(paths) {
        var path;
        if (typeof paths === 'string') {
          path = paths;
          var extTest = path.split('.').pop();
          if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].indexOf(extTest) > -1) {
            var supported = p5.prototype.isFileSupported(extTest);
            if (supported) {
              path = path;
            } else {
              var pathSplit = path.split('.');
              var pathCore = pathSplit[pathSplit.length - 1];
              for (var i = 0; i < p5sound.extensions.length; i++) {
                var extension = p5sound.extensions[i];
                var supported = p5.prototype.isFileSupported(extension);
                if (supported) {
                  pathCore = '';
                  if (pathSplit.length === 2) {
                    pathCore += pathSplit[0];
                  }
                  for (var i = 1; i <= pathSplit.length - 2; i++) {
                    var p = pathSplit[i];
                    pathCore += '.' + p;
                  }
                  path = pathCore += '.';
                  path = path += extension;
                  break;
                }
              }
            }
          } else {
            for (var i = 0; i < p5sound.extensions.length; i++) {
              var extension = p5sound.extensions[i];
              var supported = p5.prototype.isFileSupported(extension);
              if (supported) {
                path = path + '.' + extension;
                break;
              }
            }
          }
        } else if (typeof paths === 'object') {
          for (var i = 0; i < paths.length; i++) {
            var extension = paths[i].split('.').pop();
            var supported = p5.prototype.isFileSupported(extension);
            if (supported) {
              path = paths[i];
              break;
            }
          }
        }
        return path;
      };
      p5.prototype._mathChain = function(o, math, thisChain, nextChain, type) {
        for (var i in o.mathOps) {
          if (o.mathOps[i] instanceof type) {
            o.mathOps[i].dispose();
            thisChain = i;
            if (thisChain < o.mathOps.length - 1) {
              nextChain = o.mathOps[i + 1];
            }
          }
        }
        o.mathOps[thisChain - 1].disconnect();
        o.mathOps[thisChain - 1].connect(math);
        math.connect(nextChain);
        o.mathOps[thisChain] = math;
        return o;
      };
    }(master);
    var errorHandler;
    errorHandler = function() {
      'use strict';
      var CustomError = function(name, errorTrace, failedPath) {
        var err = new Error();
        var tempStack,
            splitStack;
        err.name = name;
        err.originalStack = err.stack + errorTrace;
        tempStack = err.stack + errorTrace;
        err.failedPath = failedPath;
        var splitStack = tempStack.split('\n');
        splitStack = splitStack.filter(function(ln) {
          return !ln.match(/(p5.|native code|globalInit)/g);
        });
        err.stack = splitStack.join('\n');
        return err;
      };
      return CustomError;
    }();
    var panner;
    panner = function() {
      'use strict';
      var p5sound = master;
      var ac = p5sound.audiocontext;
      if (typeof ac.createStereoPanner !== 'undefined') {
        p5.Panner = function(input, output, numInputChannels) {
          this.stereoPanner = this.input = ac.createStereoPanner();
          input.connect(this.stereoPanner);
          this.stereoPanner.connect(output);
        };
        p5.Panner.prototype.pan = function(val, tFromNow) {
          var time = tFromNow || 0;
          var t = ac.currentTime + time;
          this.stereoPanner.pan.linearRampToValueAtTime(val, t);
        };
        p5.Panner.prototype.inputChannels = function(numChannels) {};
        p5.Panner.prototype.connect = function(obj) {
          this.stereoPanner.connect(obj);
        };
        p5.Panner.prototype.disconnect = function(obj) {
          this.stereoPanner.disconnect();
        };
      } else {
        p5.Panner = function(input, output, numInputChannels) {
          this.input = ac.createGain();
          input.connect(this.input);
          this.left = ac.createGain();
          this.right = ac.createGain();
          this.left.channelInterpretation = 'discrete';
          this.right.channelInterpretation = 'discrete';
          if (numInputChannels > 1) {
            this.splitter = ac.createChannelSplitter(2);
            this.input.connect(this.splitter);
            this.splitter.connect(this.left, 1);
            this.splitter.connect(this.right, 0);
          } else {
            this.input.connect(this.left);
            this.input.connect(this.right);
          }
          this.output = ac.createChannelMerger(2);
          this.left.connect(this.output, 0, 1);
          this.right.connect(this.output, 0, 0);
          this.output.connect(output);
        };
        p5.Panner.prototype.pan = function(val, tFromNow) {
          var time = tFromNow || 0;
          var t = ac.currentTime + time;
          var v = (val + 1) / 2;
          var rightVal = Math.cos(v * Math.PI / 2);
          var leftVal = Math.sin(v * Math.PI / 2);
          this.left.gain.linearRampToValueAtTime(leftVal, t);
          this.right.gain.linearRampToValueAtTime(rightVal, t);
        };
        p5.Panner.prototype.inputChannels = function(numChannels) {
          if (numChannels === 1) {
            this.input.disconnect();
            this.input.connect(this.left);
            this.input.connect(this.right);
          } else if (numChannels === 2) {
            if (typeof(this.splitter === 'undefined')) {
              this.splitter = ac.createChannelSplitter(2);
            }
            this.input.disconnect();
            this.input.connect(this.splitter);
            this.splitter.connect(this.left, 1);
            this.splitter.connect(this.right, 0);
          }
        };
        p5.Panner.prototype.connect = function(obj) {
          this.output.connect(obj);
        };
        p5.Panner.prototype.disconnect = function(obj) {
          this.output.disconnect();
        };
      }
      p5.Panner3D = function(input, output) {
        var panner3D = ac.createPanner();
        panner3D.panningModel = 'HRTF';
        panner3D.distanceModel = 'linear';
        panner3D.setPosition(0, 0, 0);
        input.connect(panner3D);
        panner3D.connect(output);
        panner3D.pan = function(xVal, yVal, zVal) {
          panner3D.setPosition(xVal, yVal, zVal);
        };
        return panner3D;
      };
    }(master);
    var soundfile;
    soundfile = function() {
      'use strict';
      var CustomError = errorHandler;
      var p5sound = master;
      var ac = p5sound.audiocontext;
      p5.SoundFile = function(paths, onload, onerror, whileLoading) {
        if (typeof paths !== 'undefined') {
          if (typeof paths == 'string' || typeof paths[0] == 'string') {
            var path = p5.prototype._checkFileFormats(paths);
            this.url = path;
          } else if (typeof paths == 'object') {
            if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
              throw 'Unable to load file because the File API is not supported';
            }
          }
          if (paths.file) {
            paths = paths.file;
          }
          this.file = paths;
        }
        this._onended = function() {};
        this._looping = false;
        this._playing = false;
        this._paused = false;
        this._pauseTime = 0;
        this._cues = [];
        this._lastPos = 0;
        this._counterNode;
        this._scopeNode;
        this.bufferSourceNodes = [];
        this.bufferSourceNode = null;
        this.buffer = null;
        this.playbackRate = 1;
        this.gain = 1;
        this.input = p5sound.audiocontext.createGain();
        this.output = p5sound.audiocontext.createGain();
        this.reversed = false;
        this.startTime = 0;
        this.endTime = null;
        this.pauseTime = 0;
        this.mode = 'sustain';
        this.startMillis = null;
        this.panPosition = 0;
        this.panner = new p5.Panner(this.output, p5sound.input, 2);
        if (this.url || this.file) {
          this.load(onload, onerror);
        }
        p5sound.soundArray.push(this);
        if (typeof whileLoading === 'function') {
          this._whileLoading = whileLoading;
        } else {
          this._whileLoading = function() {};
        }
      };
      p5.prototype.registerPreloadMethod('loadSound', p5.prototype);
      p5.prototype.loadSound = function(path, callback, onerror, whileLoading) {
        if (window.location.origin.indexOf('file://') > -1 && window.cordova === 'undefined') {
          alert('This sketch may require a server to load external files. Please see http://bit.ly/1qcInwS');
        }
        var s = new p5.SoundFile(path, callback, onerror, whileLoading);
        return s;
      };
      p5.SoundFile.prototype.load = function(callback, errorCallback) {
        var loggedError = false;
        var self = this;
        var errorTrace = new Error().stack;
        if (this.url != undefined && this.url != '') {
          var request = new XMLHttpRequest();
          request.addEventListener('progress', function(evt) {
            self._updateProgress(evt);
          }, false);
          request.open('GET', this.url, true);
          request.responseType = 'arraybuffer';
          request.onload = function() {
            if (request.status == 200) {
              ac.decodeAudioData(request.response, function(buff) {
                self.buffer = buff;
                self.panner.inputChannels(buff.numberOfChannels);
                if (callback) {
                  callback(self);
                }
              }, function(e) {
                var err = new CustomError('decodeAudioData', errorTrace, self.url);
                var msg = 'AudioContext error at decodeAudioData for ' + self.url;
                if (errorCallback) {
                  err.msg = msg;
                  errorCallback(err);
                } else {
                  console.error(msg + '\n The error stack trace includes: \n' + err.stack);
                }
              });
            } else {
              var err = new CustomError('loadSound', errorTrace, self.url);
              var msg = 'Unable to load ' + self.url + '. The request status was: ' + request.status + ' (' + request.statusText + ')';
              if (errorCallback) {
                err.message = msg;
                errorCallback(err);
              } else {
                console.error(msg + '\n The error stack trace includes: \n' + err.stack);
              }
            }
          };
          request.onerror = function(e) {
            var err = new CustomError('loadSound', errorTrace, self.url);
            var msg = 'There was no response from the server at ' + self.url + '. Check the url and internet connectivity.';
            if (errorCallback) {
              err.message = msg;
              errorCallback(err);
            } else {
              console.error(msg + '\n The error stack trace includes: \n' + err.stack);
            }
          };
          request.send();
        } else if (this.file != undefined) {
          var reader = new FileReader();
          var self = this;
          reader.onload = function() {
            ac.decodeAudioData(reader.result, function(buff) {
              self.buffer = buff;
              self.panner.inputChannels(buff.numberOfChannels);
              if (callback) {
                callback(self);
              }
            });
          };
          reader.onerror = function(e) {
            if (onerror)
              onerror(e);
          };
          reader.readAsArrayBuffer(this.file);
        }
      };
      p5.SoundFile.prototype._updateProgress = function(evt) {
        if (evt.lengthComputable) {
          var percentComplete = evt.loaded / evt.total * 0.99;
          this._whileLoading(percentComplete, evt);
        } else {
          this._whileLoading('size unknown');
        }
      };
      p5.SoundFile.prototype.isLoaded = function() {
        if (this.buffer) {
          return true;
        } else {
          return false;
        }
      };
      p5.SoundFile.prototype.play = function(time, rate, amp, _cueStart, duration) {
        var self = this;
        var now = p5sound.audiocontext.currentTime;
        var cueStart,
            cueEnd;
        var time = time || 0;
        if (time < 0) {
          time = 0;
        }
        time = time + now;
        if (this.buffer) {
          this._pauseTime = 0;
          if (this.mode === 'restart' && this.buffer && this.bufferSourceNode) {
            var now = p5sound.audiocontext.currentTime;
            this.bufferSourceNode.stop(time);
            this._counterNode.stop(time);
          }
          if (rate)
            this.playbackRate = rate;
          this.bufferSourceNode = this._initSourceNode();
          if (this._counterNode)
            this._counterNode = undefined;
          this._counterNode = this._initCounterNode();
          if (_cueStart) {
            if (_cueStart >= 0 && _cueStart < this.buffer.duration) {
              cueStart = _cueStart;
            } else {
              throw 'start time out of range';
            }
          } else {
            cueStart = 0;
          }
          if (duration) {
            duration = duration <= this.buffer.duration - cueStart ? duration : this.buffer.duration;
          } else {
            duration = this.buffer.duration - cueStart;
          }
          var a = amp || 1;
          this.bufferSourceNode.connect(this.output);
          this.output.gain.value = a;
          if (this._paused) {
            this.bufferSourceNode.start(time, this.pauseTime, duration);
            this._counterNode.start(time, this.pauseTime, duration);
          } else {
            this.bufferSourceNode.start(time, cueStart, duration);
            this._counterNode.start(time, cueStart, duration);
          }
          this._playing = true;
          this._paused = false;
          this.bufferSourceNodes.push(this.bufferSourceNode);
          this.bufferSourceNode._arrayIndex = this.bufferSourceNodes.length - 1;
          var clearOnEnd = function(e) {
            this._playing = false;
            this.removeEventListener('ended', clearOnEnd, false);
            self._onended(self);
            self.bufferSourceNodes.forEach(function(n, i) {
              if (n._playing === false) {
                self.bufferSourceNodes.splice(i);
              }
            });
            if (self.bufferSourceNodes.length === 0) {
              self._playing = false;
            }
          };
          this.bufferSourceNode.onended = clearOnEnd;
        } else {
          throw 'not ready to play file, buffer has yet to load. Try preload()';
        }
        this.bufferSourceNode.loop = this._looping;
        this._counterNode.loop = this._looping;
        if (this._looping === true) {
          var cueEnd = cueStart + duration;
          this.bufferSourceNode.loopStart = cueStart;
          this.bufferSourceNode.loopEnd = cueEnd;
          this._counterNode.loopStart = cueStart;
          this._counterNode.loopEnd = cueEnd;
        }
      };
      p5.SoundFile.prototype.playMode = function(str) {
        var s = str.toLowerCase();
        if (s === 'restart' && this.buffer && this.bufferSourceNode) {
          for (var i = 0; i < this.bufferSourceNodes.length - 1; i++) {
            var now = p5sound.audiocontext.currentTime;
            this.bufferSourceNodes[i].stop(now);
          }
        }
        if (s === 'restart' || s === 'sustain') {
          this.mode = s;
        } else {
          throw 'Invalid play mode. Must be either "restart" or "sustain"';
        }
      };
      p5.SoundFile.prototype.pause = function(time) {
        var now = p5sound.audiocontext.currentTime;
        var time = time || 0;
        var pTime = time + now;
        if (this.isPlaying() && this.buffer && this.bufferSourceNode) {
          this.pauseTime = this.currentTime();
          this.bufferSourceNode.stop(pTime);
          this._counterNode.stop(pTime);
          this._paused = true;
          this._playing = false;
          this._pauseTime = this.currentTime();
        } else {
          this._pauseTime = 0;
        }
      };
      p5.SoundFile.prototype.loop = function(startTime, rate, amp, loopStart, duration) {
        this._looping = true;
        this.play(startTime, rate, amp, loopStart, duration);
      };
      p5.SoundFile.prototype.setLoop = function(bool) {
        if (bool === true) {
          this._looping = true;
        } else if (bool === false) {
          this._looping = false;
        } else {
          throw 'Error: setLoop accepts either true or false';
        }
        if (this.bufferSourceNode) {
          this.bufferSourceNode.loop = this._looping;
          this._counterNode.loop = this._looping;
        }
      };
      p5.SoundFile.prototype.isLooping = function() {
        if (!this.bufferSourceNode) {
          return false;
        }
        if (this._looping === true && this.isPlaying() === true) {
          return true;
        }
        return false;
      };
      p5.SoundFile.prototype.isPlaying = function() {
        return this._playing;
      };
      p5.SoundFile.prototype.isPaused = function() {
        return this._paused;
      };
      p5.SoundFile.prototype.stop = function(timeFromNow) {
        var time = timeFromNow || 0;
        if (this.mode == 'sustain') {
          this.stopAll(time);
          this._playing = false;
          this.pauseTime = 0;
          this._paused = false;
        } else if (this.buffer && this.bufferSourceNode) {
          var now = p5sound.audiocontext.currentTime;
          var t = time || 0;
          this.pauseTime = 0;
          this.bufferSourceNode.stop(now + t);
          this._counterNode.stop(now + t);
          this._playing = false;
          this._paused = false;
        }
      };
      p5.SoundFile.prototype.stopAll = function(_time) {
        var now = p5sound.audiocontext.currentTime;
        var time = _time || 0;
        if (this.buffer && this.bufferSourceNode) {
          for (var i = 0; i < this.bufferSourceNodes.length; i++) {
            if (typeof this.bufferSourceNodes[i] != undefined) {
              try {
                this.bufferSourceNodes[i].onended = function() {};
                this.bufferSourceNodes[i].stop(now + time);
              } catch (e) {}
            }
          }
          this._counterNode.stop(now + time);
          this._onended(this);
        }
      };
      p5.SoundFile.prototype.setVolume = function(vol, rampTime, tFromNow) {
        if (typeof vol === 'number') {
          var rampTime = rampTime || 0;
          var tFromNow = tFromNow || 0;
          var now = p5sound.audiocontext.currentTime;
          var currentVol = this.output.gain.value;
          this.output.gain.cancelScheduledValues(now + tFromNow);
          this.output.gain.linearRampToValueAtTime(currentVol, now + tFromNow);
          this.output.gain.linearRampToValueAtTime(vol, now + tFromNow + rampTime);
        } else if (vol) {
          vol.connect(this.output.gain);
        } else {
          return this.output.gain;
        }
      };
      p5.SoundFile.prototype.amp = p5.SoundFile.prototype.setVolume;
      p5.SoundFile.prototype.fade = p5.SoundFile.prototype.setVolume;
      p5.SoundFile.prototype.getVolume = function() {
        return this.output.gain.value;
      };
      p5.SoundFile.prototype.pan = function(pval, tFromNow) {
        this.panPosition = pval;
        this.panner.pan(pval, tFromNow);
      };
      p5.SoundFile.prototype.getPan = function() {
        return this.panPosition;
      };
      p5.SoundFile.prototype.rate = function(playbackRate) {
        if (this.playbackRate === playbackRate && this.bufferSourceNode) {
          if (this.bufferSourceNode.playbackRate.value === playbackRate) {
            return;
          }
        }
        this.playbackRate = playbackRate;
        var rate = playbackRate;
        if (this.playbackRate === 0 && this._playing) {
          this.pause();
        }
        if (this.playbackRate < 0 && !this.reversed) {
          var cPos = this.currentTime();
          var cRate = this.bufferSourceNode.playbackRate.value;
          this.reverseBuffer();
          rate = Math.abs(playbackRate);
          var newPos = (cPos - this.duration()) / rate;
          this.pauseTime = newPos;
        } else if (this.playbackRate > 0 && this.reversed) {
          this.reverseBuffer();
        }
        if (this.bufferSourceNode) {
          var now = p5sound.audiocontext.currentTime;
          this.bufferSourceNode.playbackRate.cancelScheduledValues(now);
          this.bufferSourceNode.playbackRate.linearRampToValueAtTime(Math.abs(rate), now);
          this._counterNode.playbackRate.cancelScheduledValues(now);
          this._counterNode.playbackRate.linearRampToValueAtTime(Math.abs(rate), now);
        }
      };
      p5.SoundFile.prototype.setPitch = function(num) {
        var newPlaybackRate = midiToFreq(num) / midiToFreq(60);
        this.rate(newPlaybackRate);
      };
      p5.SoundFile.prototype.getPlaybackRate = function() {
        return this.playbackRate;
      };
      p5.SoundFile.prototype.duration = function() {
        if (this.buffer) {
          return this.buffer.duration;
        } else {
          return 0;
        }
      };
      p5.SoundFile.prototype.currentTime = function() {
        if (this._pauseTime > 0) {
          return this._pauseTime;
        } else {
          return this._lastPos / ac.sampleRate;
        }
      };
      p5.SoundFile.prototype.jump = function(cueTime, duration) {
        if (cueTime < 0 || cueTime > this.buffer.duration) {
          throw 'jump time out of range';
        }
        if (duration > this.buffer.duration - cueTime) {
          throw 'end time out of range';
        }
        var cTime = cueTime || 0;
        var eTime = duration || this.buffer.duration - cueTime;
        if (this.isPlaying()) {
          this.stop();
        }
        this.play(0, this.playbackRate, this.output.gain.value, cTime, eTime);
      };
      p5.SoundFile.prototype.channels = function() {
        return this.buffer.numberOfChannels;
      };
      p5.SoundFile.prototype.sampleRate = function() {
        return this.buffer.sampleRate;
      };
      p5.SoundFile.prototype.frames = function() {
        return this.buffer.length;
      };
      p5.SoundFile.prototype.getPeaks = function(length) {
        if (this.buffer) {
          if (!length) {
            length = window.width * 5;
          }
          if (this.buffer) {
            var buffer = this.buffer;
            var sampleSize = buffer.length / length;
            var sampleStep = ~~(sampleSize / 10) || 1;
            var channels = buffer.numberOfChannels;
            var peaks = new Float32Array(Math.round(length));
            for (var c = 0; c < channels; c++) {
              var chan = buffer.getChannelData(c);
              for (var i = 0; i < length; i++) {
                var start = ~~(i * sampleSize);
                var end = ~~(start + sampleSize);
                var max = 0;
                for (var j = start; j < end; j += sampleStep) {
                  var value = chan[j];
                  if (value > max) {
                    max = value;
                  } else if (-value > max) {
                    max = value;
                  }
                }
                if (c === 0 || Math.abs(max) > peaks[i]) {
                  peaks[i] = max;
                }
              }
            }
            return peaks;
          }
        } else {
          throw 'Cannot load peaks yet, buffer is not loaded';
        }
      };
      p5.SoundFile.prototype.reverseBuffer = function() {
        var curVol = this.getVolume();
        this.setVolume(0, 0.01, 0);
        this.pause();
        if (this.buffer) {
          for (var i = 0; i < this.buffer.numberOfChannels; i++) {
            Array.prototype.reverse.call(this.buffer.getChannelData(i));
          }
          this.reversed = !this.reversed;
        } else {
          throw 'SoundFile is not done loading';
        }
        this.setVolume(curVol, 0.01, 0.0101);
        this.play();
      };
      p5.SoundFile.prototype.onended = function(callback) {
        this._onended = callback;
        return this;
      };
      p5.SoundFile.prototype.add = function() {};
      p5.SoundFile.prototype.dispose = function() {
        var now = p5sound.audiocontext.currentTime;
        var index = p5sound.soundArray.indexOf(this);
        p5sound.soundArray.splice(index, 1);
        this.stop(now);
        if (this.buffer && this.bufferSourceNode) {
          for (var i = 0; i < this.bufferSourceNodes.length - 1; i++) {
            if (this.bufferSourceNodes[i] !== null) {
              this.bufferSourceNodes[i].disconnect();
              try {
                this.bufferSourceNodes[i].stop(now);
              } catch (e) {}
              this.bufferSourceNodes[i] = null;
            }
          }
          if (this.isPlaying()) {
            try {
              this._counterNode.stop(now);
            } catch (e) {
              console.log(e);
            }
            this._counterNode = null;
          }
        }
        if (this.output) {
          this.output.disconnect();
          this.output = null;
        }
        if (this.panner) {
          this.panner.disconnect();
          this.panner = null;
        }
      };
      p5.SoundFile.prototype.connect = function(unit) {
        if (!unit) {
          this.panner.connect(p5sound.input);
        } else {
          if (unit.hasOwnProperty('input')) {
            this.panner.connect(unit.input);
          } else {
            this.panner.connect(unit);
          }
        }
      };
      p5.SoundFile.prototype.disconnect = function() {
        this.panner.disconnect();
      };
      p5.SoundFile.prototype.getLevel = function(smoothing) {
        console.warn('p5.SoundFile.getLevel has been removed from the library. Use p5.Amplitude instead');
      };
      p5.SoundFile.prototype.setPath = function(p, callback) {
        var path = p5.prototype._checkFileFormats(p);
        this.url = path;
        this.load(callback);
      };
      p5.SoundFile.prototype.setBuffer = function(buf) {
        var numChannels = buf.length;
        var size = buf[0].length;
        var newBuffer = ac.createBuffer(numChannels, size, ac.sampleRate);
        if (!buf[0] instanceof Float32Array) {
          buf[0] = new Float32Array(buf[0]);
        }
        for (var channelNum = 0; channelNum < numChannels; channelNum++) {
          var channel = newBuffer.getChannelData(channelNum);
          channel.set(buf[channelNum]);
        }
        this.buffer = newBuffer;
        this.panner.inputChannels(numChannels);
      };
      p5.SoundFile.prototype._initCounterNode = function() {
        var self = this;
        var now = ac.currentTime;
        var cNode = ac.createBufferSource();
        if (self._scopeNode) {
          self._scopeNode.disconnect();
          self._scopeNode.onaudioprocess = undefined;
          self._scopeNode = null;
        }
        self._scopeNode = ac.createScriptProcessor(256, 1, 1);
        cNode.buffer = _createCounterBuffer(self.buffer);
        cNode.playbackRate.setValueAtTime(self.playbackRate, now);
        cNode.connect(self._scopeNode);
        self._scopeNode.connect(p5.soundOut._silentNode);
        self._scopeNode.onaudioprocess = function(processEvent) {
          var inputBuffer = processEvent.inputBuffer.getChannelData(0);
          self._lastPos = inputBuffer[inputBuffer.length - 1] || 0;
          self._onTimeUpdate(self._lastPos);
        };
        return cNode;
      };
      p5.SoundFile.prototype._initSourceNode = function() {
        var self = this;
        var now = ac.currentTime;
        var bufferSourceNode = ac.createBufferSource();
        bufferSourceNode.buffer = self.buffer;
        bufferSourceNode.playbackRate.value = self.playbackRate;
        return bufferSourceNode;
      };
      var _createCounterBuffer = function(buffer) {
        var array = new Float32Array(buffer.length);
        var audioBuf = ac.createBuffer(1, buffer.length, 44100);
        for (var index = 0; index < buffer.length; index++) {
          array[index] = index;
        }
        audioBuf.getChannelData(0).set(array);
        return audioBuf;
      };
      p5.SoundFile.prototype.processPeaks = function(callback, _initThreshold, _minThreshold, _minPeaks) {
        var bufLen = this.buffer.length;
        var sampleRate = this.buffer.sampleRate;
        var buffer = this.buffer;
        var initialThreshold = _initThreshold || 0.9,
            threshold = initialThreshold,
            minThreshold = _minThreshold || 0.22,
            minPeaks = _minPeaks || 200;
        var offlineContext = new OfflineAudioContext(1, bufLen, sampleRate);
        var source = offlineContext.createBufferSource();
        source.buffer = buffer;
        var filter = offlineContext.createBiquadFilter();
        filter.type = 'lowpass';
        source.connect(filter);
        filter.connect(offlineContext.destination);
        source.start(0);
        offlineContext.startRendering();
        offlineContext.oncomplete = function(e) {
          var data = {};
          var filteredBuffer = e.renderedBuffer;
          var bufferData = filteredBuffer.getChannelData(0);
          do {
            allPeaks = getPeaksAtThreshold(bufferData, threshold);
            threshold -= 0.005;
          } while (Object.keys(allPeaks).length < minPeaks && threshold >= minThreshold);
          var intervalCounts = countIntervalsBetweenNearbyPeaks(allPeaks);
          var groups = groupNeighborsByTempo(intervalCounts, filteredBuffer.sampleRate);
          var topTempos = groups.sort(function(intA, intB) {
            return intB.count - intA.count;
          }).splice(0, 5);
          this.tempo = topTempos[0].tempo;
          var bpmVariance = 5;
          var tempoPeaks = getPeaksAtTopTempo(allPeaks, topTempos[0].tempo, filteredBuffer.sampleRate, bpmVariance);
          callback(tempoPeaks);
        };
      };
      var Peak = function(amp, i) {
        this.sampleIndex = i;
        this.amplitude = amp;
        this.tempos = [];
        this.intervals = [];
      };
      var allPeaks = [];
      function getPeaksAtThreshold(data, threshold) {
        var peaksObj = {};
        var length = data.length;
        for (var i = 0; i < length; i++) {
          if (data[i] > threshold) {
            var amp = data[i];
            var peak = new Peak(amp, i);
            peaksObj[i] = peak;
            i += 6000;
          }
          i++;
        }
        return peaksObj;
      }
      function countIntervalsBetweenNearbyPeaks(peaksObj) {
        var intervalCounts = [];
        var peaksArray = Object.keys(peaksObj).sort();
        for (var index = 0; index < peaksArray.length; index++) {
          for (var i = 0; i < 10; i++) {
            var startPeak = peaksObj[peaksArray[index]];
            var endPeak = peaksObj[peaksArray[index + i]];
            if (startPeak && endPeak) {
              var startPos = startPeak.sampleIndex;
              var endPos = endPeak.sampleIndex;
              var interval = endPos - startPos;
              if (interval > 0) {
                startPeak.intervals.push(interval);
              }
              var foundInterval = intervalCounts.some(function(intervalCount, p) {
                if (intervalCount.interval === interval) {
                  intervalCount.count++;
                  return intervalCount;
                }
              });
              if (!foundInterval) {
                intervalCounts.push({
                  interval: interval,
                  count: 1
                });
              }
            }
          }
        }
        return intervalCounts;
      }
      function groupNeighborsByTempo(intervalCounts, sampleRate) {
        var tempoCounts = [];
        intervalCounts.forEach(function(intervalCount, i) {
          try {
            var theoreticalTempo = Math.abs(60 / (intervalCount.interval / sampleRate));
            theoreticalTempo = mapTempo(theoreticalTempo);
            var foundTempo = tempoCounts.some(function(tempoCount) {
              if (tempoCount.tempo === theoreticalTempo)
                return tempoCount.count += intervalCount.count;
            });
            if (!foundTempo) {
              if (isNaN(theoreticalTempo)) {
                return;
              }
              tempoCounts.push({
                tempo: Math.round(theoreticalTempo),
                count: intervalCount.count
              });
            }
          } catch (e) {
            throw e;
          }
        });
        return tempoCounts;
      }
      function getPeaksAtTopTempo(peaksObj, tempo, sampleRate, bpmVariance) {
        var peaksAtTopTempo = [];
        var peaksArray = Object.keys(peaksObj).sort();
        for (var i = 0; i < peaksArray.length; i++) {
          var key = peaksArray[i];
          var peak = peaksObj[key];
          for (var j = 0; j < peak.intervals.length; j++) {
            var intervalBPM = Math.round(Math.abs(60 / (peak.intervals[j] / sampleRate)));
            intervalBPM = mapTempo(intervalBPM);
            var dif = intervalBPM - tempo;
            if (Math.abs(intervalBPM - tempo) < bpmVariance) {
              peaksAtTopTempo.push(peak.sampleIndex / 44100);
            }
          }
        }
        peaksAtTopTempo = peaksAtTopTempo.filter(function(peakTime, index, arr) {
          var dif = arr[index + 1] - peakTime;
          if (dif > 0.01) {
            return true;
          }
        });
        return peaksAtTopTempo;
      }
      function mapTempo(theoreticalTempo) {
        if (!isFinite(theoreticalTempo) || theoreticalTempo == 0) {
          return;
        }
        while (theoreticalTempo < 90)
          theoreticalTempo *= 2;
        while (theoreticalTempo > 180 && theoreticalTempo > 90)
          theoreticalTempo /= 2;
        return theoreticalTempo;
      }
      p5.SoundFile.prototype.addCue = function(time, callback, val) {
        var id = this._cueIDCounter++;
        var cue = new Cue(callback, time, id, val);
        this._cues.push(cue);
        return id;
      };
      p5.SoundFile.prototype.removeCue = function(id) {
        var cueLength = this._cues.length;
        for (var i = 0; i < cueLength; i++) {
          var cue = this._cues[i];
          if (cue.id === id) {
            this.cues.splice(i, 1);
          }
        }
        if (this._cues.length === 0) {}
      };
      p5.SoundFile.prototype.clearCues = function() {
        this._cues = [];
      };
      p5.SoundFile.prototype._onTimeUpdate = function(position) {
        var playbackTime = position / this.buffer.sampleRate;
        var cueLength = this._cues.length;
        for (var i = 0; i < cueLength; i++) {
          var cue = this._cues[i];
          var callbackTime = cue.time;
          var val = cue.val;
          if (this._prevTime < callbackTime && callbackTime <= playbackTime) {
            cue.callback(val);
          }
        }
        this._prevTime = playbackTime;
      };
      var Cue = function(callback, time, id, val) {
        this.callback = callback;
        this.time = time;
        this.id = id;
        this.val = val;
      };
    }(sndcore, errorHandler, master);
    var amplitude;
    amplitude = function() {
      'use strict';
      var p5sound = master;
      p5.Amplitude = function(smoothing) {
        this.bufferSize = 2048;
        this.audiocontext = p5sound.audiocontext;
        this.processor = this.audiocontext.createScriptProcessor(this.bufferSize, 2, 1);
        this.input = this.processor;
        this.output = this.audiocontext.createGain();
        this.smoothing = smoothing || 0;
        this.volume = 0;
        this.average = 0;
        this.stereoVol = [0, 0];
        this.stereoAvg = [0, 0];
        this.stereoVolNorm = [0, 0];
        this.volMax = 0.001;
        this.normalize = false;
        this.processor.onaudioprocess = this._audioProcess.bind(this);
        this.processor.connect(this.output);
        this.output.gain.value = 0;
        this.output.connect(this.audiocontext.destination);
        p5sound.meter.connect(this.processor);
        p5sound.soundArray.push(this);
      };
      p5.Amplitude.prototype.setInput = function(source, smoothing) {
        p5sound.meter.disconnect();
        if (smoothing) {
          this.smoothing = smoothing;
        }
        if (source == null) {
          console.log('Amplitude input source is not ready! Connecting to master output instead');
          p5sound.meter.connect(this.processor);
        } else if (source instanceof p5.Signal) {
          source.output.connect(this.processor);
        } else if (source) {
          source.connect(this.processor);
          this.processor.disconnect();
          this.processor.connect(this.output);
        } else {
          p5sound.meter.connect(this.processor);
        }
      };
      p5.Amplitude.prototype.connect = function(unit) {
        if (unit) {
          if (unit.hasOwnProperty('input')) {
            this.output.connect(unit.input);
          } else {
            this.output.connect(unit);
          }
        } else {
          this.output.connect(this.panner.connect(p5sound.input));
        }
      };
      p5.Amplitude.prototype.disconnect = function(unit) {
        this.output.disconnect();
      };
      p5.Amplitude.prototype._audioProcess = function(event) {
        for (var channel = 0; channel < event.inputBuffer.numberOfChannels; channel++) {
          var inputBuffer = event.inputBuffer.getChannelData(channel);
          var bufLength = inputBuffer.length;
          var total = 0;
          var sum = 0;
          var x;
          for (var i = 0; i < bufLength; i++) {
            x = inputBuffer[i];
            if (this.normalize) {
              total += Math.max(Math.min(x / this.volMax, 1), -1);
              sum += Math.max(Math.min(x / this.volMax, 1), -1) * Math.max(Math.min(x / this.volMax, 1), -1);
            } else {
              total += x;
              sum += x * x;
            }
          }
          var average = total / bufLength;
          var rms = Math.sqrt(sum / bufLength);
          this.stereoVol[channel] = Math.max(rms, this.stereoVol[channel] * this.smoothing);
          this.stereoAvg[channel] = Math.max(average, this.stereoVol[channel] * this.smoothing);
          this.volMax = Math.max(this.stereoVol[channel], this.volMax);
        }
        var self = this;
        var volSum = this.stereoVol.reduce(function(previousValue, currentValue, index) {
          self.stereoVolNorm[index - 1] = Math.max(Math.min(self.stereoVol[index - 1] / self.volMax, 1), 0);
          self.stereoVolNorm[index] = Math.max(Math.min(self.stereoVol[index] / self.volMax, 1), 0);
          return previousValue + currentValue;
        });
        this.volume = volSum / this.stereoVol.length;
        this.volNorm = Math.max(Math.min(this.volume / this.volMax, 1), 0);
      };
      p5.Amplitude.prototype.getLevel = function(channel) {
        if (typeof channel !== 'undefined') {
          if (this.normalize) {
            return this.stereoVolNorm[channel];
          } else {
            return this.stereoVol[channel];
          }
        } else if (this.normalize) {
          return this.volNorm;
        } else {
          return this.volume;
        }
      };
      p5.Amplitude.prototype.toggleNormalize = function(bool) {
        if (typeof bool === 'boolean') {
          this.normalize = bool;
        } else {
          this.normalize = !this.normalize;
        }
      };
      p5.Amplitude.prototype.smooth = function(s) {
        if (s >= 0 && s < 1) {
          this.smoothing = s;
        } else {
          console.log('Error: smoothing must be between 0 and 1');
        }
      };
      p5.Amplitude.prototype.dispose = function() {
        var index = p5sound.soundArray.indexOf(this);
        p5sound.soundArray.splice(index, 1);
        this.input.disconnect();
        this.output.disconnect();
        this.input = this.processor = undefined;
        this.output = undefined;
      };
    }(master);
    var fft;
    fft = function() {
      'use strict';
      var p5sound = master;
      p5.FFT = function(smoothing, bins) {
        this.smoothing = smoothing || 0.8;
        this.bins = bins || 1024;
        var FFT_SIZE = bins * 2 || 2048;
        this.input = this.analyser = p5sound.audiocontext.createAnalyser();
        p5sound.fftMeter.connect(this.analyser);
        this.analyser.smoothingTimeConstant = this.smoothing;
        this.analyser.fftSize = FFT_SIZE;
        this.freqDomain = new Uint8Array(this.analyser.frequencyBinCount);
        this.timeDomain = new Uint8Array(this.analyser.frequencyBinCount);
        this.bass = [20, 140];
        this.lowMid = [140, 400];
        this.mid = [400, 2600];
        this.highMid = [2600, 5200];
        this.treble = [5200, 14000];
        p5sound.soundArray.push(this);
      };
      p5.FFT.prototype.setInput = function(source) {
        if (!source) {
          p5sound.fftMeter.connect(this.analyser);
        } else {
          if (source.output) {
            source.output.connect(this.analyser);
          } else if (source.connect) {
            source.connect(this.analyser);
          }
          p5sound.fftMeter.disconnect();
        }
      };
      p5.FFT.prototype.waveform = function() {
        var bins,
            mode,
            normalArray;
        for (var i = 0; i < arguments.length; i++) {
          if (typeof arguments[i] === 'number') {
            bins = arguments[i];
            this.analyser.fftSize = bins * 2;
          }
          if (typeof arguments[i] === 'string') {
            mode = arguments[i];
          }
        }
        if (mode && !p5.prototype._isSafari()) {
          timeToFloat(this, this.timeDomain);
          this.analyser.getFloatTimeDomainData(this.timeDomain);
          return this.timeDomain;
        } else {
          timeToInt(this, this.timeDomain);
          this.analyser.getByteTimeDomainData(this.timeDomain);
          var normalArray = new Array();
          for (var i = 0; i < this.timeDomain.length; i++) {
            var scaled = p5.prototype.map(this.timeDomain[i], 0, 255, -1, 1);
            normalArray.push(scaled);
          }
          return normalArray;
        }
      };
      p5.FFT.prototype.analyze = function() {
        var bins,
            mode;
        for (var i = 0; i < arguments.length; i++) {
          if (typeof arguments[i] === 'number') {
            bins = this.bins = arguments[i];
            this.analyser.fftSize = this.bins * 2;
          }
          if (typeof arguments[i] === 'string') {
            mode = arguments[i];
          }
        }
        if (mode && mode.toLowerCase() === 'db') {
          freqToFloat(this);
          this.analyser.getFloatFrequencyData(this.freqDomain);
          return this.freqDomain;
        } else {
          freqToInt(this, this.freqDomain);
          this.analyser.getByteFrequencyData(this.freqDomain);
          var normalArray = Array.apply([], this.freqDomain);
          normalArray.length === this.analyser.fftSize;
          normalArray.constructor === Array;
          return normalArray;
        }
      };
      p5.FFT.prototype.getEnergy = function(frequency1, frequency2) {
        var nyquist = p5sound.audiocontext.sampleRate / 2;
        if (frequency1 === 'bass') {
          frequency1 = this.bass[0];
          frequency2 = this.bass[1];
        } else if (frequency1 === 'lowMid') {
          frequency1 = this.lowMid[0];
          frequency2 = this.lowMid[1];
        } else if (frequency1 === 'mid') {
          frequency1 = this.mid[0];
          frequency2 = this.mid[1];
        } else if (frequency1 === 'highMid') {
          frequency1 = this.highMid[0];
          frequency2 = this.highMid[1];
        } else if (frequency1 === 'treble') {
          frequency1 = this.treble[0];
          frequency2 = this.treble[1];
        }
        if (typeof frequency1 !== 'number') {
          throw 'invalid input for getEnergy()';
        } else if (!frequency2) {
          var index = Math.round(frequency1 / nyquist * this.freqDomain.length);
          return this.freqDomain[index];
        } else if (frequency1 && frequency2) {
          if (frequency1 > frequency2) {
            var swap = frequency2;
            frequency2 = frequency1;
            frequency1 = swap;
          }
          var lowIndex = Math.round(frequency1 / nyquist * this.freqDomain.length);
          var highIndex = Math.round(frequency2 / nyquist * this.freqDomain.length);
          var total = 0;
          var numFrequencies = 0;
          for (var i = lowIndex; i <= highIndex; i++) {
            total += this.freqDomain[i];
            numFrequencies += 1;
          }
          var toReturn = total / numFrequencies;
          return toReturn;
        } else {
          throw 'invalid input for getEnergy()';
        }
      };
      p5.FFT.prototype.getFreq = function(freq1, freq2) {
        console.log('getFreq() is deprecated. Please use getEnergy() instead.');
        var x = this.getEnergy(freq1, freq2);
        return x;
      };
      p5.FFT.prototype.getCentroid = function() {
        var nyquist = p5sound.audiocontext.sampleRate / 2;
        var cumulative_sum = 0;
        var centroid_normalization = 0;
        for (var i = 0; i < this.freqDomain.length; i++) {
          cumulative_sum += i * this.freqDomain[i];
          centroid_normalization += this.freqDomain[i];
        }
        var mean_freq_index = 0;
        if (centroid_normalization != 0) {
          mean_freq_index = cumulative_sum / centroid_normalization;
        }
        var spec_centroid_freq = mean_freq_index * (nyquist / this.freqDomain.length);
        return spec_centroid_freq;
      };
      p5.FFT.prototype.smooth = function(s) {
        if (s) {
          this.smoothing = s;
        }
        this.analyser.smoothingTimeConstant = s;
      };
      p5.FFT.prototype.dispose = function() {
        var index = p5sound.soundArray.indexOf(this);
        p5sound.soundArray.splice(index, 1);
        this.analyser.disconnect();
        this.analyser = undefined;
      };
      p5.FFT.prototype.linAverages = function(N) {
        var N = N || 16;
        var spectrum = this.freqDomain;
        var spectrumLength = spectrum.length;
        var spectrumStep = Math.floor(spectrumLength / N);
        var linearAverages = new Array(N);
        var groupIndex = 0;
        for (var specIndex = 0; specIndex < spectrumLength; specIndex++) {
          linearAverages[groupIndex] = linearAverages[groupIndex] !== undefined ? (linearAverages[groupIndex] + spectrum[specIndex]) / 2 : spectrum[specIndex];
          if (specIndex % spectrumStep == spectrumStep - 1) {
            groupIndex++;
          }
        }
        return linearAverages;
      };
      p5.FFT.prototype.logAverages = function(octaveBands) {
        var nyquist = p5sound.audiocontext.sampleRate / 2;
        var spectrum = this.freqDomain;
        var spectrumLength = spectrum.length;
        var logAverages = new Array(octaveBands.length);
        var octaveIndex = 0;
        for (var specIndex = 0; specIndex < spectrumLength; specIndex++) {
          var specIndexFrequency = Math.round(specIndex * nyquist / this.freqDomain.length);
          if (specIndexFrequency > octaveBands[octaveIndex].hi) {
            octaveIndex++;
          }
          logAverages[octaveIndex] = logAverages[octaveIndex] !== undefined ? (logAverages[octaveIndex] + spectrum[specIndex]) / 2 : spectrum[specIndex];
        }
        return logAverages;
      };
      p5.FFT.prototype.getOctaveBands = function(N, fCtr0) {
        var N = N || 3;
        var fCtr0 = fCtr0 || 15.625;
        var octaveBands = [];
        var lastFrequencyBand = {
          lo: fCtr0 / Math.pow(2, 1 / (2 * N)),
          ctr: fCtr0,
          hi: fCtr0 * Math.pow(2, 1 / (2 * N))
        };
        octaveBands.push(lastFrequencyBand);
        var nyquist = p5sound.audiocontext.sampleRate / 2;
        while (lastFrequencyBand.hi < nyquist) {
          var newFrequencyBand = {};
          newFrequencyBand.lo = lastFrequencyBand.hi, newFrequencyBand.ctr = lastFrequencyBand.ctr * Math.pow(2, 1 / N), newFrequencyBand.hi = newFrequencyBand.ctr * Math.pow(2, 1 / (2 * N)), octaveBands.push(newFrequencyBand);
          lastFrequencyBand = newFrequencyBand;
        }
        return octaveBands;
      };
      var freqToFloat = function(fft) {
        if (fft.freqDomain instanceof Float32Array === false) {
          fft.freqDomain = new Float32Array(fft.analyser.frequencyBinCount);
        }
      };
      var freqToInt = function(fft) {
        if (fft.freqDomain instanceof Uint8Array === false) {
          fft.freqDomain = new Uint8Array(fft.analyser.frequencyBinCount);
        }
      };
      var timeToFloat = function(fft) {
        if (fft.timeDomain instanceof Float32Array === false) {
          fft.timeDomain = new Float32Array(fft.analyser.frequencyBinCount);
        }
      };
      var timeToInt = function(fft) {
        if (fft.timeDomain instanceof Uint8Array === false) {
          fft.timeDomain = new Uint8Array(fft.analyser.frequencyBinCount);
        }
      };
    }(master);
    var Tone_core_Tone;
    Tone_core_Tone = function() {
      'use strict';
      function isUndef(val) {
        return val === void 0;
      }
      function isFunction(val) {
        return typeof val === 'function';
      }
      var audioContext;
      if (isUndef(window.AudioContext)) {
        window.AudioContext = window.webkitAudioContext;
      }
      if (isUndef(window.OfflineAudioContext)) {
        window.OfflineAudioContext = window.webkitOfflineAudioContext;
      }
      if (!isUndef(AudioContext)) {
        audioContext = new AudioContext();
      } else {
        throw new Error('Web Audio is not supported in this browser');
      }
      if (!isFunction(AudioContext.prototype.createGain)) {
        AudioContext.prototype.createGain = AudioContext.prototype.createGainNode;
      }
      if (!isFunction(AudioContext.prototype.createDelay)) {
        AudioContext.prototype.createDelay = AudioContext.prototype.createDelayNode;
      }
      if (!isFunction(AudioContext.prototype.createPeriodicWave)) {
        AudioContext.prototype.createPeriodicWave = AudioContext.prototype.createWaveTable;
      }
      if (!isFunction(AudioBufferSourceNode.prototype.start)) {
        AudioBufferSourceNode.prototype.start = AudioBufferSourceNode.prototype.noteGrainOn;
      }
      if (!isFunction(AudioBufferSourceNode.prototype.stop)) {
        AudioBufferSourceNode.prototype.stop = AudioBufferSourceNode.prototype.noteOff;
      }
      if (!isFunction(OscillatorNode.prototype.start)) {
        OscillatorNode.prototype.start = OscillatorNode.prototype.noteOn;
      }
      if (!isFunction(OscillatorNode.prototype.stop)) {
        OscillatorNode.prototype.stop = OscillatorNode.prototype.noteOff;
      }
      if (!isFunction(OscillatorNode.prototype.setPeriodicWave)) {
        OscillatorNode.prototype.setPeriodicWave = OscillatorNode.prototype.setWaveTable;
      }
      AudioNode.prototype._nativeConnect = AudioNode.prototype.connect;
      AudioNode.prototype.connect = function(B, outNum, inNum) {
        if (B.input) {
          if (Array.isArray(B.input)) {
            if (isUndef(inNum)) {
              inNum = 0;
            }
            this.connect(B.input[inNum]);
          } else {
            this.connect(B.input, outNum, inNum);
          }
        } else {
          try {
            if (B instanceof AudioNode) {
              this._nativeConnect(B, outNum, inNum);
            } else {
              this._nativeConnect(B, outNum);
            }
          } catch (e) {
            throw new Error('error connecting to node: ' + B);
          }
        }
      };
      var Tone = function(inputs, outputs) {
        if (isUndef(inputs) || inputs === 1) {
          this.input = this.context.createGain();
        } else if (inputs > 1) {
          this.input = new Array(inputs);
        }
        if (isUndef(outputs) || outputs === 1) {
          this.output = this.context.createGain();
        } else if (outputs > 1) {
          this.output = new Array(inputs);
        }
      };
      Tone.prototype.set = function(params, value, rampTime) {
        if (this.isObject(params)) {
          rampTime = value;
        } else if (this.isString(params)) {
          var tmpObj = {};
          tmpObj[params] = value;
          params = tmpObj;
        }
        for (var attr in params) {
          value = params[attr];
          var parent = this;
          if (attr.indexOf('.') !== -1) {
            var attrSplit = attr.split('.');
            for (var i = 0; i < attrSplit.length - 1; i++) {
              parent = parent[attrSplit[i]];
            }
            attr = attrSplit[attrSplit.length - 1];
          }
          var param = parent[attr];
          if (isUndef(param)) {
            continue;
          }
          if (Tone.Signal && param instanceof Tone.Signal || Tone.Param && param instanceof Tone.Param) {
            if (param.value !== value) {
              if (isUndef(rampTime)) {
                param.value = value;
              } else {
                param.rampTo(value, rampTime);
              }
            }
          } else if (param instanceof AudioParam) {
            if (param.value !== value) {
              param.value = value;
            }
          } else if (param instanceof Tone) {
            param.set(value);
          } else if (param !== value) {
            parent[attr] = value;
          }
        }
        return this;
      };
      Tone.prototype.get = function(params) {
        if (isUndef(params)) {
          params = this._collectDefaults(this.constructor);
        } else if (this.isString(params)) {
          params = [params];
        }
        var ret = {};
        for (var i = 0; i < params.length; i++) {
          var attr = params[i];
          var parent = this;
          var subRet = ret;
          if (attr.indexOf('.') !== -1) {
            var attrSplit = attr.split('.');
            for (var j = 0; j < attrSplit.length - 1; j++) {
              var subAttr = attrSplit[j];
              subRet[subAttr] = subRet[subAttr] || {};
              subRet = subRet[subAttr];
              parent = parent[subAttr];
            }
            attr = attrSplit[attrSplit.length - 1];
          }
          var param = parent[attr];
          if (this.isObject(params[attr])) {
            subRet[attr] = param.get();
          } else if (Tone.Signal && param instanceof Tone.Signal) {
            subRet[attr] = param.value;
          } else if (Tone.Param && param instanceof Tone.Param) {
            subRet[attr] = param.value;
          } else if (param instanceof AudioParam) {
            subRet[attr] = param.value;
          } else if (param instanceof Tone) {
            subRet[attr] = param.get();
          } else if (!isFunction(param) && !isUndef(param)) {
            subRet[attr] = param;
          }
        }
        return ret;
      };
      Tone.prototype._collectDefaults = function(constr) {
        var ret = [];
        if (!isUndef(constr.defaults)) {
          ret = Object.keys(constr.defaults);
        }
        if (!isUndef(constr._super)) {
          var superDefs = this._collectDefaults(constr._super);
          for (var i = 0; i < superDefs.length; i++) {
            if (ret.indexOf(superDefs[i]) === -1) {
              ret.push(superDefs[i]);
            }
          }
        }
        return ret;
      };
      Tone.prototype.toString = function() {
        for (var className in Tone) {
          var isLetter = className[0].match(/^[A-Z]$/);
          var sameConstructor = Tone[className] === this.constructor;
          if (isFunction(Tone[className]) && isLetter && sameConstructor) {
            return className;
          }
        }
        return 'Tone';
      };
      Tone.context = audioContext;
      Tone.prototype.context = Tone.context;
      Tone.prototype.bufferSize = 2048;
      Tone.prototype.blockTime = 128 / Tone.context.sampleRate;
      Tone.prototype.dispose = function() {
        if (!this.isUndef(this.input)) {
          if (this.input instanceof AudioNode) {
            this.input.disconnect();
          }
          this.input = null;
        }
        if (!this.isUndef(this.output)) {
          if (this.output instanceof AudioNode) {
            this.output.disconnect();
          }
          this.output = null;
        }
        return this;
      };
      var _silentNode = null;
      Tone.prototype.noGC = function() {
        this.output.connect(_silentNode);
        return this;
      };
      AudioNode.prototype.noGC = function() {
        this.connect(_silentNode);
        return this;
      };
      Tone.prototype.connect = function(unit, outputNum, inputNum) {
        if (Array.isArray(this.output)) {
          outputNum = this.defaultArg(outputNum, 0);
          this.output[outputNum].connect(unit, 0, inputNum);
        } else {
          this.output.connect(unit, outputNum, inputNum);
        }
        return this;
      };
      Tone.prototype.disconnect = function(outputNum) {
        if (Array.isArray(this.output)) {
          outputNum = this.defaultArg(outputNum, 0);
          this.output[outputNum].disconnect();
        } else {
          this.output.disconnect();
        }
        return this;
      };
      Tone.prototype.connectSeries = function() {
        if (arguments.length > 1) {
          var currentUnit = arguments[0];
          for (var i = 1; i < arguments.length; i++) {
            var toUnit = arguments[i];
            currentUnit.connect(toUnit);
            currentUnit = toUnit;
          }
        }
        return this;
      };
      Tone.prototype.connectParallel = function() {
        var connectFrom = arguments[0];
        if (arguments.length > 1) {
          for (var i = 1; i < arguments.length; i++) {
            var connectTo = arguments[i];
            connectFrom.connect(connectTo);
          }
        }
        return this;
      };
      Tone.prototype.chain = function() {
        if (arguments.length > 0) {
          var currentUnit = this;
          for (var i = 0; i < arguments.length; i++) {
            var toUnit = arguments[i];
            currentUnit.connect(toUnit);
            currentUnit = toUnit;
          }
        }
        return this;
      };
      Tone.prototype.fan = function() {
        if (arguments.length > 0) {
          for (var i = 0; i < arguments.length; i++) {
            this.connect(arguments[i]);
          }
        }
        return this;
      };
      AudioNode.prototype.chain = Tone.prototype.chain;
      AudioNode.prototype.fan = Tone.prototype.fan;
      Tone.prototype.defaultArg = function(given, fallback) {
        if (this.isObject(given) && this.isObject(fallback)) {
          var ret = {};
          for (var givenProp in given) {
            ret[givenProp] = this.defaultArg(fallback[givenProp], given[givenProp]);
          }
          for (var fallbackProp in fallback) {
            ret[fallbackProp] = this.defaultArg(given[fallbackProp], fallback[fallbackProp]);
          }
          return ret;
        } else {
          return isUndef(given) ? fallback : given;
        }
      };
      Tone.prototype.optionsObject = function(values, keys, defaults) {
        var options = {};
        if (values.length === 1 && this.isObject(values[0])) {
          options = values[0];
        } else {
          for (var i = 0; i < keys.length; i++) {
            options[keys[i]] = values[i];
          }
        }
        if (!this.isUndef(defaults)) {
          return this.defaultArg(options, defaults);
        } else {
          return options;
        }
      };
      Tone.prototype.isUndef = isUndef;
      Tone.prototype.isFunction = isFunction;
      Tone.prototype.isNumber = function(arg) {
        return typeof arg === 'number';
      };
      Tone.prototype.isObject = function(arg) {
        return Object.prototype.toString.call(arg) === '[object Object]' && arg.constructor === Object;
      };
      Tone.prototype.isBoolean = function(arg) {
        return typeof arg === 'boolean';
      };
      Tone.prototype.isArray = function(arg) {
        return Array.isArray(arg);
      };
      Tone.prototype.isString = function(arg) {
        return typeof arg === 'string';
      };
      Tone.noOp = function() {};
      Tone.prototype._readOnly = function(property) {
        if (Array.isArray(property)) {
          for (var i = 0; i < property.length; i++) {
            this._readOnly(property[i]);
          }
        } else {
          Object.defineProperty(this, property, {
            writable: false,
            enumerable: true
          });
        }
      };
      Tone.prototype._writable = function(property) {
        if (Array.isArray(property)) {
          for (var i = 0; i < property.length; i++) {
            this._writable(property[i]);
          }
        } else {
          Object.defineProperty(this, property, {writable: true});
        }
      };
      Tone.State = {
        Started: 'started',
        Stopped: 'stopped',
        Paused: 'paused'
      };
      Tone.prototype.equalPowerScale = function(percent) {
        var piFactor = 0.5 * Math.PI;
        return Math.sin(percent * piFactor);
      };
      Tone.prototype.dbToGain = function(db) {
        return Math.pow(2, db / 6);
      };
      Tone.prototype.gainToDb = function(gain) {
        return 20 * (Math.log(gain) / Math.LN10);
      };
      Tone.prototype.now = function() {
        return this.context.currentTime;
      };
      Tone.extend = function(child, parent) {
        if (isUndef(parent)) {
          parent = Tone;
        }
        function TempConstructor() {}
        TempConstructor.prototype = parent.prototype;
        child.prototype = new TempConstructor();
        child.prototype.constructor = child;
        child._super = parent;
      };
      var newContextCallbacks = [];
      Tone._initAudioContext = function(callback) {
        callback(Tone.context);
        newContextCallbacks.push(callback);
      };
      Tone.setContext = function(ctx) {
        Tone.prototype.context = ctx;
        Tone.context = ctx;
        for (var i = 0; i < newContextCallbacks.length; i++) {
          newContextCallbacks[i](ctx);
        }
      };
      Tone.startMobile = function() {
        var osc = Tone.context.createOscillator();
        var silent = Tone.context.createGain();
        silent.gain.value = 0;
        osc.connect(silent);
        silent.connect(Tone.context.destination);
        var now = Tone.context.currentTime;
        osc.start(now);
        osc.stop(now + 1);
      };
      Tone._initAudioContext(function(audioContext) {
        Tone.prototype.blockTime = 128 / audioContext.sampleRate;
        _silentNode = audioContext.createGain();
        _silentNode.gain.value = 0;
        _silentNode.connect(audioContext.destination);
      });
      Tone.version = 'r7-dev';
      return Tone;
    }();
    var Tone_signal_SignalBase;
    Tone_signal_SignalBase = function(Tone) {
      'use strict';
      Tone.SignalBase = function() {};
      Tone.extend(Tone.SignalBase);
      Tone.SignalBase.prototype.connect = function(node, outputNumber, inputNumber) {
        if (Tone.Signal && Tone.Signal === node.constructor || Tone.Param && Tone.Param === node.constructor || Tone.TimelineSignal && Tone.TimelineSignal === node.constructor) {
          node._param.cancelScheduledValues(0);
          node._param.value = 0;
          node.overridden = true;
        } else if (node instanceof AudioParam) {
          node.cancelScheduledValues(0);
          node.value = 0;
        }
        Tone.prototype.connect.call(this, node, outputNumber, inputNumber);
        return this;
      };
      return Tone.SignalBase;
    }(Tone_core_Tone);
    var Tone_signal_WaveShaper;
    Tone_signal_WaveShaper = function(Tone) {
      'use strict';
      Tone.WaveShaper = function(mapping, bufferLen) {
        this._shaper = this.input = this.output = this.context.createWaveShaper();
        this._curve = null;
        if (Array.isArray(mapping)) {
          this.curve = mapping;
        } else if (isFinite(mapping) || this.isUndef(mapping)) {
          this._curve = new Float32Array(this.defaultArg(mapping, 1024));
        } else if (this.isFunction(mapping)) {
          this._curve = new Float32Array(this.defaultArg(bufferLen, 1024));
          this.setMap(mapping);
        }
      };
      Tone.extend(Tone.WaveShaper, Tone.SignalBase);
      Tone.WaveShaper.prototype.setMap = function(mapping) {
        for (var i = 0,
            len = this._curve.length; i < len; i++) {
          var normalized = i / len * 2 - 1;
          this._curve[i] = mapping(normalized, i);
        }
        this._shaper.curve = this._curve;
        return this;
      };
      Object.defineProperty(Tone.WaveShaper.prototype, 'curve', {
        get: function() {
          return this._shaper.curve;
        },
        set: function(mapping) {
          this._curve = new Float32Array(mapping);
          this._shaper.curve = this._curve;
        }
      });
      Object.defineProperty(Tone.WaveShaper.prototype, 'oversample', {
        get: function() {
          return this._shaper.oversample;
        },
        set: function(oversampling) {
          if (['none', '2x', '4x'].indexOf(oversampling) !== -1) {
            this._shaper.oversample = oversampling;
          } else {
            throw new Error('invalid oversampling: ' + oversampling);
          }
        }
      });
      Tone.WaveShaper.prototype.dispose = function() {
        Tone.prototype.dispose.call(this);
        this._shaper.disconnect();
        this._shaper = null;
        this._curve = null;
        return this;
      };
      return Tone.WaveShaper;
    }(Tone_core_Tone);
    var Tone_core_Type;
    Tone_core_Type = function(Tone) {
      'use strict';
      Tone.Type = {
        Default: 'number',
        Time: 'time',
        Frequency: 'frequency',
        NormalRange: 'normalRange',
        AudioRange: 'audioRange',
        Decibels: 'db',
        Interval: 'interval',
        BPM: 'bpm',
        Positive: 'positive',
        Cents: 'cents',
        Degrees: 'degrees',
        MIDI: 'midi',
        TransportTime: 'transportTime',
        Ticks: 'tick',
        Note: 'note',
        Milliseconds: 'milliseconds',
        Notation: 'notation'
      };
      Tone.prototype.isNowRelative = function() {
        var nowRelative = new RegExp(/^\s*\+(.)+/i);
        return function(note) {
          return nowRelative.test(note);
        };
      }();
      Tone.prototype.isTicks = function() {
        var tickFormat = new RegExp(/^\d+i$/i);
        return function(note) {
          return tickFormat.test(note);
        };
      }();
      Tone.prototype.isNotation = function() {
        var notationFormat = new RegExp(/^[0-9]+[mnt]$/i);
        return function(note) {
          return notationFormat.test(note);
        };
      }();
      Tone.prototype.isTransportTime = function() {
        var transportTimeFormat = new RegExp(/^(\d+(\.\d+)?\:){1,2}(\d+(\.\d+)?)?$/i);
        return function(transportTime) {
          return transportTimeFormat.test(transportTime);
        };
      }();
      Tone.prototype.isNote = function() {
        var noteFormat = new RegExp(/^[a-g]{1}(b|#|x|bb)?-?[0-9]+$/i);
        return function(note) {
          return noteFormat.test(note);
        };
      }();
      Tone.prototype.isFrequency = function() {
        var freqFormat = new RegExp(/^\d*\.?\d+hz$/i);
        return function(freq) {
          return freqFormat.test(freq);
        };
      }();
      function getTransportBpm() {
        if (Tone.Transport && Tone.Transport.bpm) {
          return Tone.Transport.bpm.value;
        } else {
          return 120;
        }
      }
      function getTransportTimeSignature() {
        if (Tone.Transport && Tone.Transport.timeSignature) {
          return Tone.Transport.timeSignature;
        } else {
          return 4;
        }
      }
      Tone.prototype.notationToSeconds = function(notation, bpm, timeSignature) {
        bpm = this.defaultArg(bpm, getTransportBpm());
        timeSignature = this.defaultArg(timeSignature, getTransportTimeSignature());
        var beatTime = 60 / bpm;
        if (notation === '1n') {
          notation = '1m';
        }
        var subdivision = parseInt(notation, 10);
        var beats = 0;
        if (subdivision === 0) {
          beats = 0;
        }
        var lastLetter = notation.slice(-1);
        if (lastLetter === 't') {
          beats = 4 / subdivision * 2 / 3;
        } else if (lastLetter === 'n') {
          beats = 4 / subdivision;
        } else if (lastLetter === 'm') {
          beats = subdivision * timeSignature;
        } else {
          beats = 0;
        }
        return beatTime * beats;
      };
      Tone.prototype.transportTimeToSeconds = function(transportTime, bpm, timeSignature) {
        bpm = this.defaultArg(bpm, getTransportBpm());
        timeSignature = this.defaultArg(timeSignature, getTransportTimeSignature());
        var measures = 0;
        var quarters = 0;
        var sixteenths = 0;
        var split = transportTime.split(':');
        if (split.length === 2) {
          measures = parseFloat(split[0]);
          quarters = parseFloat(split[1]);
        } else if (split.length === 1) {
          quarters = parseFloat(split[0]);
        } else if (split.length === 3) {
          measures = parseFloat(split[0]);
          quarters = parseFloat(split[1]);
          sixteenths = parseFloat(split[2]);
        }
        var beats = measures * timeSignature + quarters + sixteenths / 4;
        return beats * (60 / bpm);
      };
      Tone.prototype.ticksToSeconds = function(ticks, bpm) {
        if (this.isUndef(Tone.Transport)) {
          return 0;
        }
        ticks = parseFloat(ticks);
        bpm = this.defaultArg(bpm, getTransportBpm());
        var tickTime = 60 / bpm / Tone.Transport.PPQ;
        return tickTime * ticks;
      };
      Tone.prototype.frequencyToSeconds = function(freq) {
        return 1 / parseFloat(freq);
      };
      Tone.prototype.samplesToSeconds = function(samples) {
        return samples / this.context.sampleRate;
      };
      Tone.prototype.secondsToSamples = function(seconds) {
        return seconds * this.context.sampleRate;
      };
      Tone.prototype.secondsToTransportTime = function(seconds, bpm, timeSignature) {
        bpm = this.defaultArg(bpm, getTransportBpm());
        timeSignature = this.defaultArg(timeSignature, getTransportTimeSignature());
        var quarterTime = 60 / bpm;
        var quarters = seconds / quarterTime;
        var measures = Math.floor(quarters / timeSignature);
        var sixteenths = quarters % 1 * 4;
        quarters = Math.floor(quarters) % timeSignature;
        var progress = [measures, quarters, sixteenths];
        return progress.join(':');
      };
      Tone.prototype.secondsToFrequency = function(seconds) {
        return 1 / seconds;
      };
      Tone.prototype.toTransportTime = function(time, bpm, timeSignature) {
        var seconds = this.toSeconds(time);
        return this.secondsToTransportTime(seconds, bpm, timeSignature);
      };
      Tone.prototype.toFrequency = function(freq, now) {
        if (this.isFrequency(freq)) {
          return parseFloat(freq);
        } else if (this.isNotation(freq) || this.isTransportTime(freq)) {
          return this.secondsToFrequency(this.toSeconds(freq, now));
        } else if (this.isNote(freq)) {
          return this.noteToFrequency(freq);
        } else {
          return freq;
        }
      };
      Tone.prototype.toTicks = function(time) {
        if (this.isUndef(Tone.Transport)) {
          return 0;
        }
        var bpm = Tone.Transport.bpm.value;
        var plusNow = 0;
        if (this.isNowRelative(time)) {
          time = time.replace('+', '');
          plusNow = Tone.Transport.ticks;
        } else if (this.isUndef(time)) {
          return Tone.Transport.ticks;
        }
        var seconds = this.toSeconds(time);
        var quarter = 60 / bpm;
        var quarters = seconds / quarter;
        var tickNum = quarters * Tone.Transport.PPQ;
        return Math.round(tickNum + plusNow);
      };
      Tone.prototype.toSamples = function(time) {
        var seconds = this.toSeconds(time);
        return Math.round(seconds * this.context.sampleRate);
      };
      Tone.prototype.toSeconds = function(time, now) {
        now = this.defaultArg(now, this.now());
        if (this.isNumber(time)) {
          return time;
        } else if (this.isString(time)) {
          var plusTime = 0;
          if (this.isNowRelative(time)) {
            time = time.replace('+', '');
            plusTime = now;
          }
          var betweenParens = time.match(/\(([^)(]+)\)/g);
          if (betweenParens) {
            for (var j = 0; j < betweenParens.length; j++) {
              var symbol = betweenParens[j].replace(/[\(\)]/g, '');
              var symbolVal = this.toSeconds(symbol);
              time = time.replace(betweenParens[j], symbolVal);
            }
          }
          if (time.indexOf('@') !== -1) {
            var quantizationSplit = time.split('@');
            if (!this.isUndef(Tone.Transport)) {
              var toQuantize = quantizationSplit[0].trim();
              if (toQuantize === '') {
                toQuantize = undefined;
              }
              if (plusTime > 0) {
                toQuantize = '+' + toQuantize;
                plusTime = 0;
              }
              var subdivision = quantizationSplit[1].trim();
              time = Tone.Transport.quantize(toQuantize, subdivision);
            } else {
              throw new Error('quantization requires Tone.Transport');
            }
          } else {
            var components = time.split(/[\(\)\-\+\/\*]/);
            if (components.length > 1) {
              var originalTime = time;
              for (var i = 0; i < components.length; i++) {
                var symb = components[i].trim();
                if (symb !== '') {
                  var val = this.toSeconds(symb);
                  time = time.replace(symb, val);
                }
              }
              try {
                time = eval(time);
              } catch (e) {
                throw new EvalError('cannot evaluate Time: ' + originalTime);
              }
            } else if (this.isNotation(time)) {
              time = this.notationToSeconds(time);
            } else if (this.isTransportTime(time)) {
              time = this.transportTimeToSeconds(time);
            } else if (this.isFrequency(time)) {
              time = this.frequencyToSeconds(time);
            } else if (this.isTicks(time)) {
              time = this.ticksToSeconds(time);
            } else {
              time = parseFloat(time);
            }
          }
          return time + plusTime;
        } else {
          return now;
        }
      };
      Tone.prototype.toNotation = function(time, bpm, timeSignature) {
        var testNotations = ['1m', '2n', '4n', '8n', '16n', '32n', '64n', '128n'];
        var retNotation = toNotationHelper.call(this, time, bpm, timeSignature, testNotations);
        var testTripletNotations = ['1m', '2n', '2t', '4n', '4t', '8n', '8t', '16n', '16t', '32n', '32t', '64n', '64t', '128n'];
        var retTripletNotation = toNotationHelper.call(this, time, bpm, timeSignature, testTripletNotations);
        if (retTripletNotation.split('+').length < retNotation.split('+').length) {
          return retTripletNotation;
        } else {
          return retNotation;
        }
      };
      function toNotationHelper(time, bpm, timeSignature, testNotations) {
        var seconds = this.toSeconds(time);
        var threshold = this.notationToSeconds(testNotations[testNotations.length - 1], bpm, timeSignature);
        var retNotation = '';
        for (var i = 0; i < testNotations.length; i++) {
          var notationTime = this.notationToSeconds(testNotations[i], bpm, timeSignature);
          var multiple = seconds / notationTime;
          var floatingPointError = 0.000001;
          if (1 - multiple % 1 < floatingPointError) {
            multiple += floatingPointError;
          }
          multiple = Math.floor(multiple);
          if (multiple > 0) {
            if (multiple === 1) {
              retNotation += testNotations[i];
            } else {
              retNotation += multiple.toString() + '*' + testNotations[i];
            }
            seconds -= multiple * notationTime;
            if (seconds < threshold) {
              break;
            } else {
              retNotation += ' + ';
            }
          }
        }
        if (retNotation === '') {
          retNotation = '0';
        }
        return retNotation;
      }
      Tone.prototype.fromUnits = function(val, units) {
        if (this.convert || this.isUndef(this.convert)) {
          switch (units) {
            case Tone.Type.Time:
              return this.toSeconds(val);
            case Tone.Type.Frequency:
              return this.toFrequency(val);
            case Tone.Type.Decibels:
              return this.dbToGain(val);
            case Tone.Type.NormalRange:
              return Math.min(Math.max(val, 0), 1);
            case Tone.Type.AudioRange:
              return Math.min(Math.max(val, -1), 1);
            case Tone.Type.Positive:
              return Math.max(val, 0);
            default:
              return val;
          }
        } else {
          return val;
        }
      };
      Tone.prototype.toUnits = function(val, units) {
        if (this.convert || this.isUndef(this.convert)) {
          switch (units) {
            case Tone.Type.Decibels:
              return this.gainToDb(val);
            default:
              return val;
          }
        } else {
          return val;
        }
      };
      var noteToScaleIndex = {
        'cbb': -2,
        'cb': -1,
        'c': 0,
        'c#': 1,
        'cx': 2,
        'dbb': 0,
        'db': 1,
        'd': 2,
        'd#': 3,
        'dx': 4,
        'ebb': 2,
        'eb': 3,
        'e': 4,
        'e#': 5,
        'ex': 6,
        'fbb': 3,
        'fb': 4,
        'f': 5,
        'f#': 6,
        'fx': 7,
        'gbb': 5,
        'gb': 6,
        'g': 7,
        'g#': 8,
        'gx': 9,
        'abb': 7,
        'ab': 8,
        'a': 9,
        'a#': 10,
        'ax': 11,
        'bbb': 9,
        'bb': 10,
        'b': 11,
        'b#': 12,
        'bx': 13
      };
      var scaleIndexToNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      Tone.A4 = 440;
      Tone.prototype.noteToFrequency = function(note) {
        var parts = note.split(/(-?\d+)/);
        if (parts.length === 3) {
          var index = noteToScaleIndex[parts[0].toLowerCase()];
          var octave = parts[1];
          var noteNumber = index + (parseInt(octave, 10) + 1) * 12;
          return this.midiToFrequency(noteNumber);
        } else {
          return 0;
        }
      };
      Tone.prototype.frequencyToNote = function(freq) {
        var log = Math.log(freq / Tone.A4) / Math.LN2;
        var noteNumber = Math.round(12 * log) + 57;
        var octave = Math.floor(noteNumber / 12);
        if (octave < 0) {
          noteNumber += -12 * octave;
        }
        var noteName = scaleIndexToNote[noteNumber % 12];
        return noteName + octave.toString();
      };
      Tone.prototype.intervalToFrequencyRatio = function(interval) {
        return Math.pow(2, interval / 12);
      };
      Tone.prototype.midiToNote = function(midiNumber) {
        var octave = Math.floor(midiNumber / 12) - 1;
        var note = midiNumber % 12;
        return scaleIndexToNote[note] + octave;
      };
      Tone.prototype.noteToMidi = function(note) {
        var parts = note.split(/(\d+)/);
        if (parts.length === 3) {
          var index = noteToScaleIndex[parts[0].toLowerCase()];
          var octave = parts[1];
          return index + (parseInt(octave, 10) + 1) * 12;
        } else {
          return 0;
        }
      };
      Tone.prototype.midiToFrequency = function(midi) {
        return Tone.A4 * Math.pow(2, (midi - 69) / 12);
      };
      return Tone;
    }(Tone_core_Tone);
    var Tone_core_Param;
    Tone_core_Param = function(Tone) {
      'use strict';
      Tone.Param = function() {
        var options = this.optionsObject(arguments, ['param', 'units', 'convert'], Tone.Param.defaults);
        this._param = this.input = options.param;
        this.units = options.units;
        this.convert = options.convert;
        this.overridden = false;
        if (!this.isUndef(options.value)) {
          this.value = options.value;
        }
      };
      Tone.extend(Tone.Param);
      Tone.Param.defaults = {
        'units': Tone.Type.Default,
        'convert': true,
        'param': undefined
      };
      Object.defineProperty(Tone.Param.prototype, 'value', {
        get: function() {
          return this._toUnits(this._param.value);
        },
        set: function(value) {
          var convertedVal = this._fromUnits(value);
          this._param.value = convertedVal;
        }
      });
      Tone.Param.prototype._fromUnits = function(val) {
        if (this.convert || this.isUndef(this.convert)) {
          switch (this.units) {
            case Tone.Type.Time:
              return this.toSeconds(val);
            case Tone.Type.Frequency:
              return this.toFrequency(val);
            case Tone.Type.Decibels:
              return this.dbToGain(val);
            case Tone.Type.NormalRange:
              return Math.min(Math.max(val, 0), 1);
            case Tone.Type.AudioRange:
              return Math.min(Math.max(val, -1), 1);
            case Tone.Type.Positive:
              return Math.max(val, 0);
            default:
              return val;
          }
        } else {
          return val;
        }
      };
      Tone.Param.prototype._toUnits = function(val) {
        if (this.convert || this.isUndef(this.convert)) {
          switch (this.units) {
            case Tone.Type.Decibels:
              return this.gainToDb(val);
            default:
              return val;
          }
        } else {
          return val;
        }
      };
      Tone.Param.prototype._minOutput = 0.00001;
      Tone.Param.prototype.setValueAtTime = function(value, time) {
        value = this._fromUnits(value);
        this._param.setValueAtTime(value, this.toSeconds(time));
        return this;
      };
      Tone.Param.prototype.setRampPoint = function(now) {
        now = this.defaultArg(now, this.now());
        var currentVal = this._param.value;
        this._param.setValueAtTime(currentVal, now);
        return this;
      };
      Tone.Param.prototype.linearRampToValueAtTime = function(value, endTime) {
        value = this._fromUnits(value);
        this._param.linearRampToValueAtTime(value, this.toSeconds(endTime));
        return this;
      };
      Tone.Param.prototype.exponentialRampToValueAtTime = function(value, endTime) {
        value = this._fromUnits(value);
        value = Math.max(this._minOutput, value);
        this._param.exponentialRampToValueAtTime(value, this.toSeconds(endTime));
        return this;
      };
      Tone.Param.prototype.exponentialRampToValue = function(value, rampTime) {
        var now = this.now();
        var currentVal = this.value;
        this.setValueAtTime(Math.max(currentVal, this._minOutput), now);
        this.exponentialRampToValueAtTime(value, now + this.toSeconds(rampTime));
        return this;
      };
      Tone.Param.prototype.linearRampToValue = function(value, rampTime) {
        var now = this.now();
        this.setRampPoint(now);
        this.linearRampToValueAtTime(value, now + this.toSeconds(rampTime));
        return this;
      };
      Tone.Param.prototype.setTargetAtTime = function(value, startTime, timeConstant) {
        value = this._fromUnits(value);
        value = Math.max(this._minOutput, value);
        timeConstant = Math.max(this._minOutput, timeConstant);
        this._param.setTargetAtTime(value, this.toSeconds(startTime), timeConstant);
        return this;
      };
      Tone.Param.prototype.setValueCurveAtTime = function(values, startTime, duration) {
        for (var i = 0; i < values.length; i++) {
          values[i] = this._fromUnits(values[i]);
        }
        this._param.setValueCurveAtTime(values, this.toSeconds(startTime), this.toSeconds(duration));
        return this;
      };
      Tone.Param.prototype.cancelScheduledValues = function(startTime) {
        this._param.cancelScheduledValues(this.toSeconds(startTime));
        return this;
      };
      Tone.Param.prototype.rampTo = function(value, rampTime) {
        rampTime = this.defaultArg(rampTime, 0);
        if (this.units === Tone.Type.Frequency || this.units === Tone.Type.BPM) {
          this.exponentialRampToValue(value, rampTime);
        } else {
          this.linearRampToValue(value, rampTime);
        }
        return this;
      };
      Tone.Param.prototype.dispose = function() {
        Tone.prototype.dispose.call(this);
        this._param = null;
        return this;
      };
      return Tone.Param;
    }(Tone_core_Tone);
    var Tone_core_Gain;
    Tone_core_Gain = function(Tone) {
      'use strict';
      Tone.Gain = function() {
        var options = this.optionsObject(arguments, ['gain', 'units'], Tone.Gain.defaults);
        this.input = this.output = this._gainNode = this.context.createGain();
        this.gain = new Tone.Param({
          'param': this._gainNode.gain,
          'units': options.units,
          'value': options.gain,
          'convert': options.convert
        });
        this._readOnly('gain');
      };
      Tone.extend(Tone.Gain);
      Tone.Gain.defaults = {
        'gain': 1,
        'convert': true
      };
      Tone.Gain.prototype.dispose = function() {
        Tone.Param.prototype.dispose.call(this);
        this._gainNode.disconnect();
        this._gainNode = null;
        this._writable('gain');
        this.gain.dispose();
        this.gain = null;
      };
      return Tone.Gain;
    }(Tone_core_Tone, Tone_core_Param);
    var Tone_signal_Signal;
    Tone_signal_Signal = function(Tone) {
      'use strict';
      Tone.Signal = function() {
        var options = this.optionsObject(arguments, ['value', 'units'], Tone.Signal.defaults);
        this.output = this._gain = this.context.createGain();
        options.param = this._gain.gain;
        Tone.Param.call(this, options);
        this.input = this._param = this._gain.gain;
        Tone.Signal._constant.chain(this._gain);
      };
      Tone.extend(Tone.Signal, Tone.Param);
      Tone.Signal.defaults = {
        'value': 0,
        'units': Tone.Type.Default,
        'convert': true
      };
      Tone.Signal.prototype.connect = Tone.SignalBase.prototype.connect;
      Tone.Signal.prototype.dispose = function() {
        Tone.Param.prototype.dispose.call(this);
        this._param = null;
        this._gain.disconnect();
        this._gain = null;
        return this;
      };
      Tone.Signal._constant = null;
      Tone._initAudioContext(function(audioContext) {
        var buffer = audioContext.createBuffer(1, 128, audioContext.sampleRate);
        var arr = buffer.getChannelData(0);
        for (var i = 0; i < arr.length; i++) {
          arr[i] = 1;
        }
        Tone.Signal._constant = audioContext.createBufferSource();
        Tone.Signal._constant.channelCount = 1;
        Tone.Signal._constant.channelCountMode = 'explicit';
        Tone.Signal._constant.buffer = buffer;
        Tone.Signal._constant.loop = true;
        Tone.Signal._constant.start(0);
        Tone.Signal._constant.noGC();
      });
      return Tone.Signal;
    }(Tone_core_Tone, Tone_signal_WaveShaper, Tone_core_Type, Tone_core_Param);
    var Tone_signal_Add;
    Tone_signal_Add = function(Tone) {
      'use strict';
      Tone.Add = function(value) {
        Tone.call(this, 2, 0);
        this._sum = this.input[0] = this.input[1] = this.output = this.context.createGain();
        this._param = this.input[1] = new Tone.Signal(value);
        this._param.connect(this._sum);
      };
      Tone.extend(Tone.Add, Tone.Signal);
      Tone.Add.prototype.dispose = function() {
        Tone.prototype.dispose.call(this);
        this._sum.disconnect();
        this._sum = null;
        this._param.dispose();
        this._param = null;
        return this;
      };
      return Tone.Add;
    }(Tone_core_Tone);
    var Tone_signal_Multiply;
    Tone_signal_Multiply = function(Tone) {
      'use strict';
      Tone.Multiply = function(value) {
        Tone.call(this, 2, 0);
        this._mult = this.input[0] = this.output = this.context.createGain();
        this._param = this.input[1] = this.output.gain;
        this._param.value = this.defaultArg(value, 0);
      };
      Tone.extend(Tone.Multiply, Tone.Signal);
      Tone.Multiply.prototype.dispose = function() {
        Tone.prototype.dispose.call(this);
        this._mult.disconnect();
        this._mult = null;
        this._param = null;
        return this;
      };
      return Tone.Multiply;
    }(Tone_core_Tone);
    var Tone_signal_Scale;
    Tone_signal_Scale = function(Tone) {
      'use strict';
      Tone.Scale = function(outputMin, outputMax) {
        this._outputMin = this.defaultArg(outputMin, 0);
        this._outputMax = this.defaultArg(outputMax, 1);
        this._scale = this.input = new Tone.Multiply(1);
        this._add = this.output = new Tone.Add(0);
        this._scale.connect(this._add);
        this._setRange();
      };
      Tone.extend(Tone.Scale, Tone.SignalBase);
      Object.defineProperty(Tone.Scale.prototype, 'min', {
        get: function() {
          return this._outputMin;
        },
        set: function(min) {
          this._outputMin = min;
          this._setRange();
        }
      });
      Object.defineProperty(Tone.Scale.prototype, 'max', {
        get: function() {
          return this._outputMax;
        },
        set: function(max) {
          this._outputMax = max;
          this._setRange();
        }
      });
      Tone.Scale.prototype._setRange = function() {
        this._add.value = this._outputMin;
        this._scale.value = this._outputMax - this._outputMin;
      };
      Tone.Scale.prototype.dispose = function() {
        Tone.prototype.dispose.call(this);
        this._add.dispose();
        this._add = null;
        this._scale.dispose();
        this._scale = null;
        return this;
      };
      return Tone.Scale;
    }(Tone_core_Tone, Tone_signal_Add, Tone_signal_Multiply);
    var signal;
    signal = function() {
      'use strict';
      var Signal = Tone_signal_Signal;
      var Add = Tone_signal_Add;
      var Mult = Tone_signal_Multiply;
      var Scale = Tone_signal_Scale;
      var Tone = Tone_core_Tone;
      var p5sound = master;
      Tone.setContext(p5sound.audiocontext);
      p5.Signal = function(value) {
        var s = new Signal(value);
        return s;
      };
      Signal.prototype.fade = Signal.prototype.linearRampToValueAtTime;
      Mult.prototype.fade = Signal.prototype.fade;
      Add.prototype.fade = Signal.prototype.fade;
      Scale.prototype.fade = Signal.prototype.fade;
      Signal.prototype.setInput = function(_input) {
        _input.connect(this);
      };
      Mult.prototype.setInput = Signal.prototype.setInput;
      Add.prototype.setInput = Signal.prototype.setInput;
      Scale.prototype.setInput = Signal.prototype.setInput;
      Signal.prototype.add = function(num) {
        var add = new Add(num);
        this.connect(add);
        return add;
      };
      Mult.prototype.add = Signal.prototype.add;
      Add.prototype.add = Signal.prototype.add;
      Scale.prototype.add = Signal.prototype.add;
      Signal.prototype.mult = function(num) {
        var mult = new Mult(num);
        this.connect(mult);
        return mult;
      };
      Mult.prototype.mult = Signal.prototype.mult;
      Add.prototype.mult = Signal.prototype.mult;
      Scale.prototype.mult = Signal.prototype.mult;
      Signal.prototype.scale = function(inMin, inMax, outMin, outMax) {
        var mapOutMin,
            mapOutMax;
        if (arguments.length === 4) {
          mapOutMin = p5.prototype.map(outMin, inMin, inMax, 0, 1) - 0.5;
          mapOutMax = p5.prototype.map(outMax, inMin, inMax, 0, 1) - 0.5;
        } else {
          mapOutMin = arguments[0];
          mapOutMax = arguments[1];
        }
        var scale = new Scale(mapOutMin, mapOutMax);
        this.connect(scale);
        return scale;
      };
      Mult.prototype.scale = Signal.prototype.scale;
      Add.prototype.scale = Signal.prototype.scale;
      Scale.prototype.scale = Signal.prototype.scale;
    }(Tone_signal_Signal, Tone_signal_Add, Tone_signal_Multiply, Tone_signal_Scale, Tone_core_Tone, master);
    var oscillator;
    oscillator = function() {
      'use strict';
      var p5sound = master;
      var Signal = Tone_signal_Signal;
      var Add = Tone_signal_Add;
      var Mult = Tone_signal_Multiply;
      var Scale = Tone_signal_Scale;
      p5.Oscillator = function(freq, type) {
        if (typeof freq === 'string') {
          var f = type;
          type = freq;
          freq = f;
        }
        if (typeof type === 'number') {
          var f = type;
          type = freq;
          freq = f;
        }
        this.started = false;
        this.phaseAmount = undefined;
        this.oscillator = p5sound.audiocontext.createOscillator();
        this.f = freq || 440;
        this.oscillator.type = type || 'sine';
        this.oscillator.frequency.setValueAtTime(this.f, p5sound.audiocontext.currentTime);
        var o = this.oscillator;
        this.output = p5sound.audiocontext.createGain();
        this._freqMods = [];
        this.output.gain.value = 0.5;
        this.output.gain.setValueAtTime(0.5, p5sound.audiocontext.currentTime);
        this.oscillator.connect(this.output);
        this.panPosition = 0;
        this.connection = p5sound.input;
        this.panner = new p5.Panner(this.output, this.connection, 1);
        this.mathOps = [this.output];
        p5sound.soundArray.push(this);
      };
      p5.Oscillator.prototype.start = function(time, f) {
        if (this.started) {
          var now = p5sound.audiocontext.currentTime;
          this.stop(now);
        }
        if (!this.started) {
          var freq = f || this.f;
          var type = this.oscillator.type;
          if (this.oscillator) {
            this.oscillator.disconnect();
            this.oscillator = undefined;
          }
          this.oscillator = p5sound.audiocontext.createOscillator();
          this.oscillator.frequency.exponentialRampToValueAtTime(Math.abs(freq), p5sound.audiocontext.currentTime);
          this.oscillator.type = type;
          this.oscillator.connect(this.output);
          time = time || 0;
          this.oscillator.start(time + p5sound.audiocontext.currentTime);
          this.freqNode = this.oscillator.frequency;
          for (var i in this._freqMods) {
            if (typeof this._freqMods[i].connect !== 'undefined') {
              this._freqMods[i].connect(this.oscillator.frequency);
            }
          }
          this.started = true;
        }
      };
      p5.Oscillator.prototype.stop = function(time) {
        if (this.started) {
          var t = time || 0;
          var now = p5sound.audiocontext.currentTime;
          this.oscillator.stop(t + now);
          this.started = false;
        }
      };
      p5.Oscillator.prototype.amp = function(vol, rampTime, tFromNow) {
        var self = this;
        if (typeof vol === 'number') {
          var rampTime = rampTime || 0;
          var tFromNow = tFromNow || 0;
          var now = p5sound.audiocontext.currentTime;
          var currentVol = this.output.gain.value;
          this.output.gain.cancelScheduledValues(now);
          this.output.gain.linearRampToValueAtTime(currentVol, now + tFromNow);
          this.output.gain.linearRampToValueAtTime(vol, now + tFromNow + rampTime);
        } else if (vol) {
          vol.connect(self.output.gain);
        } else {
          return this.output.gain;
        }
      };
      p5.Oscillator.prototype.fade = p5.Oscillator.prototype.amp;
      p5.Oscillator.prototype.getAmp = function() {
        return this.output.gain.value;
      };
      p5.Oscillator.prototype.freq = function(val, rampTime, tFromNow) {
        if (typeof val === 'number' && !isNaN(val)) {
          this.f = val;
          var now = p5sound.audiocontext.currentTime;
          var rampTime = rampTime || 0;
          var tFromNow = tFromNow || 0;
          if (rampTime == 0) {
            this.oscillator.frequency.cancelScheduledValues(now);
            this.oscillator.frequency.setValueAtTime(val, tFromNow + now);
          } else {
            if (val > 0) {
              this.oscillator.frequency.exponentialRampToValueAtTime(val, tFromNow + rampTime + now);
            } else {
              this.oscillator.frequency.linearRampToValueAtTime(val, tFromNow + rampTime + now);
            }
          }
          if (this.phaseAmount) {
            this.phase(this.phaseAmount);
          }
        } else if (val) {
          if (val.output) {
            val = val.output;
          }
          val.connect(this.oscillator.frequency);
          this._freqMods.push(val);
        } else {
          return this.oscillator.frequency;
        }
      };
      p5.Oscillator.prototype.getFreq = function() {
        return this.oscillator.frequency.value;
      };
      p5.Oscillator.prototype.setType = function(type) {
        this.oscillator.type = type;
      };
      p5.Oscillator.prototype.getType = function() {
        return this.oscillator.type;
      };
      p5.Oscillator.prototype.connect = function(unit) {
        if (!unit) {
          this.panner.connect(p5sound.input);
        } else if (unit.hasOwnProperty('input')) {
          this.panner.connect(unit.input);
          this.connection = unit.input;
        } else {
          this.panner.connect(unit);
          this.connection = unit;
        }
      };
      p5.Oscillator.prototype.disconnect = function(unit) {
        this.output.disconnect();
        this.panner.disconnect();
        this.output.connect(this.panner);
        this.oscMods = [];
      };
      p5.Oscillator.prototype.pan = function(pval, tFromNow) {
        this.panPosition = pval;
        this.panner.pan(pval, tFromNow);
      };
      p5.Oscillator.prototype.getPan = function() {
        return this.panPosition;
      };
      p5.Oscillator.prototype.dispose = function() {
        var index = p5sound.soundArray.indexOf(this);
        p5sound.soundArray.splice(index, 1);
        if (this.oscillator) {
          var now = p5sound.audiocontext.currentTime;
          this.stop(now);
          this.disconnect();
          this.panner = null;
          this.oscillator = null;
        }
        if (this.osc2) {
          this.osc2.dispose();
        }
      };
      p5.Oscillator.prototype.phase = function(p) {
        var delayAmt = p5.prototype.map(p, 0, 1, 0, 1 / this.f);
        var now = p5sound.audiocontext.currentTime;
        this.phaseAmount = p;
        if (!this.dNode) {
          this.dNode = p5sound.audiocontext.createDelay();
          this.oscillator.disconnect();
          this.oscillator.connect(this.dNode);
          this.dNode.connect(this.output);
        }
        this.dNode.delayTime.setValueAtTime(delayAmt, now);
      };
      var sigChain = function(o, mathObj, thisChain, nextChain, type) {
        var chainSource = o.oscillator;
        for (var i in o.mathOps) {
          if (o.mathOps[i] instanceof type) {
            chainSource.disconnect();
            o.mathOps[i].dispose();
            thisChain = i;
            if (thisChain < o.mathOps.length - 2) {
              nextChain = o.mathOps[i + 1];
            }
          }
        }
        if (thisChain == o.mathOps.length - 1) {
          o.mathOps.push(nextChain);
        }
        if (i > 0) {
          chainSource = o.mathOps[i - 1];
        }
        chainSource.disconnect();
        chainSource.connect(mathObj);
        mathObj.connect(nextChain);
        o.mathOps[thisChain] = mathObj;
        return o;
      };
      p5.Oscillator.prototype.add = function(num) {
        var add = new Add(num);
        var thisChain = this.mathOps.length - 1;
        var nextChain = this.output;
        return sigChain(this, add, thisChain, nextChain, Add);
      };
      p5.Oscillator.prototype.mult = function(num) {
        var mult = new Mult(num);
        var thisChain = this.mathOps.length - 1;
        var nextChain = this.output;
        return sigChain(this, mult, thisChain, nextChain, Mult);
      };
      p5.Oscillator.prototype.scale = function(inMin, inMax, outMin, outMax) {
        var mapOutMin,
            mapOutMax;
        if (arguments.length === 4) {
          mapOutMin = p5.prototype.map(outMin, inMin, inMax, 0, 1) - 0.5;
          mapOutMax = p5.prototype.map(outMax, inMin, inMax, 0, 1) - 0.5;
        } else {
          mapOutMin = arguments[0];
          mapOutMax = arguments[1];
        }
        var scale = new Scale(mapOutMin, mapOutMax);
        var thisChain = this.mathOps.length - 1;
        var nextChain = this.output;
        return sigChain(this, scale, thisChain, nextChain, Scale);
      };
      p5.SinOsc = function(freq) {
        p5.Oscillator.call(this, freq, 'sine');
      };
      p5.SinOsc.prototype = Object.create(p5.Oscillator.prototype);
      p5.TriOsc = function(freq) {
        p5.Oscillator.call(this, freq, 'triangle');
      };
      p5.TriOsc.prototype = Object.create(p5.Oscillator.prototype);
      p5.SawOsc = function(freq) {
        p5.Oscillator.call(this, freq, 'sawtooth');
      };
      p5.SawOsc.prototype = Object.create(p5.Oscillator.prototype);
      p5.SqrOsc = function(freq) {
        p5.Oscillator.call(this, freq, 'square');
      };
      p5.SqrOsc.prototype = Object.create(p5.Oscillator.prototype);
    }(master, Tone_signal_Signal, Tone_signal_Add, Tone_signal_Multiply, Tone_signal_Scale);
    var Tone_core_Timeline;
    Tone_core_Timeline = function(Tone) {
      'use strict';
      Tone.Timeline = function() {
        var options = this.optionsObject(arguments, ['memory'], Tone.Timeline.defaults);
        this._timeline = [];
        this._toRemove = [];
        this._iterating = false;
        this.memory = options.memory;
      };
      Tone.extend(Tone.Timeline);
      Tone.Timeline.defaults = {'memory': Infinity};
      Object.defineProperty(Tone.Timeline.prototype, 'length', {get: function() {
          return this._timeline.length;
        }});
      Tone.Timeline.prototype.addEvent = function(event) {
        if (this.isUndef(event.time)) {
          throw new Error('events must have a time attribute');
        }
        event.time = this.toSeconds(event.time);
        if (this._timeline.length) {
          var index = this._search(event.time);
          this._timeline.splice(index + 1, 0, event);
        } else {
          this._timeline.push(event);
        }
        if (this.length > this.memory) {
          var diff = this.length - this.memory;
          this._timeline.splice(0, diff);
        }
        return this;
      };
      Tone.Timeline.prototype.removeEvent = function(event) {
        if (this._iterating) {
          this._toRemove.push(event);
        } else {
          var index = this._timeline.indexOf(event);
          if (index !== -1) {
            this._timeline.splice(index, 1);
          }
        }
        return this;
      };
      Tone.Timeline.prototype.getEvent = function(time) {
        time = this.toSeconds(time);
        var index = this._search(time);
        if (index !== -1) {
          return this._timeline[index];
        } else {
          return null;
        }
      };
      Tone.Timeline.prototype.getEventAfter = function(time) {
        time = this.toSeconds(time);
        var index = this._search(time);
        if (index + 1 < this._timeline.length) {
          return this._timeline[index + 1];
        } else {
          return null;
        }
      };
      Tone.Timeline.prototype.getEventBefore = function(time) {
        time = this.toSeconds(time);
        var index = this._search(time);
        if (index - 1 >= 0) {
          return this._timeline[index - 1];
        } else {
          return null;
        }
      };
      Tone.Timeline.prototype.cancel = function(after) {
        if (this._timeline.length > 1) {
          after = this.toSeconds(after);
          var index = this._search(after);
          if (index >= 0) {
            this._timeline = this._timeline.slice(0, index);
          } else {
            this._timeline = [];
          }
        } else if (this._timeline.length === 1) {
          if (this._timeline[0].time >= after) {
            this._timeline = [];
          }
        }
        return this;
      };
      Tone.Timeline.prototype.cancelBefore = function(time) {
        if (this._timeline.length) {
          time = this.toSeconds(time);
          var index = this._search(time);
          if (index >= 0) {
            this._timeline = this._timeline.slice(index + 1);
          }
        }
        return this;
      };
      Tone.Timeline.prototype._search = function(time) {
        var beginning = 0;
        var len = this._timeline.length;
        var end = len;
        while (beginning <= end && beginning < len) {
          var midPoint = Math.floor(beginning + (end - beginning) / 2);
          var event = this._timeline[midPoint];
          if (event.time === time) {
            for (var i = midPoint; i < this._timeline.length; i++) {
              var testEvent = this._timeline[i];
              if (testEvent.time === time) {
                midPoint = i;
              }
            }
            return midPoint;
          } else if (event.time > time) {
            end = midPoint - 1;
          } else if (event.time < time) {
            beginning = midPoint + 1;
          }
        }
        return beginning - 1;
      };
      Tone.Timeline.prototype._iterate = function(callback, lowerBound, upperBound) {
        this._iterating = true;
        lowerBound = this.defaultArg(lowerBound, 0);
        upperBound = this.defaultArg(upperBound, this._timeline.length - 1);
        for (var i = lowerBound; i <= upperBound; i++) {
          callback(this._timeline[i]);
        }
        this._iterating = false;
        if (this._toRemove.length > 0) {
          for (var j = 0; j < this._toRemove.length; j++) {
            var index = this._timeline.indexOf(this._toRemove[j]);
            if (index !== -1) {
              this._timeline.splice(index, 1);
            }
          }
          this._toRemove = [];
        }
      };
      Tone.Timeline.prototype.forEach = function(callback) {
        this._iterate(callback);
        return this;
      };
      Tone.Timeline.prototype.forEachBefore = function(time, callback) {
        time = this.toSeconds(time);
        var upperBound = this._search(time);
        if (upperBound !== -1) {
          this._iterate(callback, 0, upperBound);
        }
        return this;
      };
      Tone.Timeline.prototype.forEachAfter = function(time, callback) {
        time = this.toSeconds(time);
        var lowerBound = this._search(time);
        this._iterate(callback, lowerBound + 1);
        return this;
      };
      Tone.Timeline.prototype.forEachFrom = function(time, callback) {
        time = this.toSeconds(time);
        var lowerBound = this._search(time);
        while (lowerBound >= 0 && this._timeline[lowerBound].time >= time) {
          lowerBound--;
        }
        this._iterate(callback, lowerBound + 1);
        return this;
      };
      Tone.Timeline.prototype.forEachAtTime = function(time, callback) {
        time = this.toSeconds(time);
        var upperBound = this._search(time);
        if (upperBound !== -1) {
          this._iterate(function(event) {
            if (event.time === time) {
              callback(event);
            }
          }, 0, upperBound);
        }
        return this;
      };
      Tone.Timeline.prototype.dispose = function() {
        Tone.prototype.dispose.call(this);
        this._timeline = null;
        this._toRemove = null;
      };
      return Tone.Timeline;
    }(Tone_core_Tone);
    var Tone_signal_TimelineSignal;
    Tone_signal_TimelineSignal = function(Tone) {
      'use strict';
      Tone.TimelineSignal = function() {
        var options = this.optionsObject(arguments, ['value', 'units'], Tone.Signal.defaults);
        Tone.Signal.apply(this, options);
        options.param = this._param;
        Tone.Param.call(this, options);
        this._events = new Tone.Timeline(10);
        this._initial = this._fromUnits(this._param.value);
      };
      Tone.extend(Tone.TimelineSignal, Tone.Param);
      Tone.TimelineSignal.Type = {
        Linear: 'linear',
        Exponential: 'exponential',
        Target: 'target',
        Set: 'set'
      };
      Object.defineProperty(Tone.TimelineSignal.prototype, 'value', {
        get: function() {
          return this._toUnits(this._param.value);
        },
        set: function(value) {
          var convertedVal = this._fromUnits(value);
          this._initial = convertedVal;
          this._param.value = convertedVal;
        }
      });
      Tone.TimelineSignal.prototype.setValueAtTime = function(value, startTime) {
        value = this._fromUnits(value);
        startTime = this.toSeconds(startTime);
        this._events.addEvent({
          'type': Tone.TimelineSignal.Type.Set,
          'value': value,
          'time': startTime
        });
        this._param.setValueAtTime(value, startTime);
        return this;
      };
      Tone.TimelineSignal.prototype.linearRampToValueAtTime = function(value, endTime) {
        value = this._fromUnits(value);
        endTime = this.toSeconds(endTime);
        this._events.addEvent({
          'type': Tone.TimelineSignal.Type.Linear,
          'value': value,
          'time': endTime
        });
        this._param.linearRampToValueAtTime(value, endTime);
        return this;
      };
      Tone.TimelineSignal.prototype.exponentialRampToValueAtTime = function(value, endTime) {
        value = this._fromUnits(value);
        value = Math.max(this._minOutput, value);
        endTime = this.toSeconds(endTime);
        this._events.addEvent({
          'type': Tone.TimelineSignal.Type.Exponential,
          'value': value,
          'time': endTime
        });
        this._param.exponentialRampToValueAtTime(value, endTime);
        return this;
      };
      Tone.TimelineSignal.prototype.setTargetAtTime = function(value, startTime, timeConstant) {
        value = this._fromUnits(value);
        value = Math.max(this._minOutput, value);
        timeConstant = Math.max(this._minOutput, timeConstant);
        startTime = this.toSeconds(startTime);
        this._events.addEvent({
          'type': Tone.TimelineSignal.Type.Target,
          'value': value,
          'time': startTime,
          'constant': timeConstant
        });
        this._param.setTargetAtTime(value, startTime, timeConstant);
        return this;
      };
      Tone.TimelineSignal.prototype.cancelScheduledValues = function(after) {
        this._events.cancel(after);
        this._param.cancelScheduledValues(this.toSeconds(after));
        return this;
      };
      Tone.TimelineSignal.prototype.setRampPoint = function(time) {
        time = this.toSeconds(time);
        var val = this.getValueAtTime(time);
        var after = this._searchAfter(time);
        if (after) {
          this.cancelScheduledValues(time);
          if (after.type === Tone.TimelineSignal.Type.Linear) {
            this.linearRampToValueAtTime(val, time);
          } else if (after.type === Tone.TimelineSignal.Type.Exponential) {
            this.exponentialRampToValueAtTime(val, time);
          }
        }
        this.setValueAtTime(val, time);
        return this;
      };
      Tone.TimelineSignal.prototype.linearRampToValueBetween = function(value, start, finish) {
        this.setRampPoint(start);
        this.linearRampToValueAtTime(value, finish);
        return this;
      };
      Tone.TimelineSignal.prototype.exponentialRampToValueBetween = function(value, start, finish) {
        this.setRampPoint(start);
        this.exponentialRampToValueAtTime(value, finish);
        return this;
      };
      Tone.TimelineSignal.prototype._searchBefore = function(time) {
        return this._events.getEvent(time);
      };
      Tone.TimelineSignal.prototype._searchAfter = function(time) {
        return this._events.getEventAfter(time);
      };
      Tone.TimelineSignal.prototype.getValueAtTime = function(time) {
        var after = this._searchAfter(time);
        var before = this._searchBefore(time);
        var value = this._initial;
        if (before === null) {
          value = this._initial;
        } else if (before.type === Tone.TimelineSignal.Type.Target) {
          var previous = this._events.getEventBefore(before.time);
          var previouVal;
          if (previous === null) {
            previouVal = this._initial;
          } else {
            previouVal = previous.value;
          }
          value = this._exponentialApproach(before.time, previouVal, before.value, before.constant, time);
        } else if (after === null) {
          value = before.value;
        } else if (after.type === Tone.TimelineSignal.Type.Linear) {
          value = this._linearInterpolate(before.time, before.value, after.time, after.value, time);
        } else if (after.type === Tone.TimelineSignal.Type.Exponential) {
          value = this._exponentialInterpolate(before.time, before.value, after.time, after.value, time);
        } else {
          value = before.value;
        }
        return value;
      };
      Tone.TimelineSignal.prototype.connect = Tone.SignalBase.prototype.connect;
      Tone.TimelineSignal.prototype._exponentialApproach = function(t0, v0, v1, timeConstant, t) {
        return v1 + (v0 - v1) * Math.exp(-(t - t0) / timeConstant);
      };
      Tone.TimelineSignal.prototype._linearInterpolate = function(t0, v0, t1, v1, t) {
        return v0 + (v1 - v0) * ((t - t0) / (t1 - t0));
      };
      Tone.TimelineSignal.prototype._exponentialInterpolate = function(t0, v0, t1, v1, t) {
        v0 = Math.max(this._minOutput, v0);
        return v0 * Math.pow(v1 / v0, (t - t0) / (t1 - t0));
      };
      Tone.TimelineSignal.prototype.dispose = function() {
        Tone.Signal.prototype.dispose.call(this);
        Tone.Param.prototype.dispose.call(this);
        this._events.dispose();
        this._events = null;
      };
      return Tone.TimelineSignal;
    }(Tone_core_Tone, Tone_signal_Signal);
    var env;
    env = function() {
      'use strict';
      var p5sound = master;
      var Add = Tone_signal_Add;
      var Mult = Tone_signal_Multiply;
      var Scale = Tone_signal_Scale;
      var TimelineSignal = Tone_signal_TimelineSignal;
      var Tone = Tone_core_Tone;
      Tone.setContext(p5sound.audiocontext);
      p5.Env = function(t1, l1, t2, l2, t3, l3) {
        var now = p5sound.audiocontext.currentTime;
        this.aTime = t1 || 0.1;
        this.aLevel = l1 || 1;
        this.dTime = t2 || 0.5;
        this.dLevel = l2 || 0;
        this.rTime = t3 || 0;
        this.rLevel = l3 || 0;
        this._rampHighPercentage = 0.98;
        this._rampLowPercentage = 0.02;
        this.output = p5sound.audiocontext.createGain();
        this.control = new TimelineSignal();
        this._init();
        this.control.connect(this.output);
        this.connection = null;
        this.mathOps = [this.control];
        this.isExponential = false;
        this.sourceToClear = null;
        this.wasTriggered = false;
        p5sound.soundArray.push(this);
      };
      p5.Env.prototype._init = function() {
        var now = p5sound.audiocontext.currentTime;
        var t = now;
        this.control.setTargetAtTime(0.00001, t, 0.001);
        this._setRampAD(this.aTime, this.dTime);
      };
      p5.Env.prototype.set = function(t1, l1, t2, l2, t3, l3) {
        this.aTime = t1;
        this.aLevel = l1;
        this.dTime = t2 || 0;
        this.dLevel = l2 || 0;
        this.rTime = t3 || 0;
        this.rLevel = l3 || 0;
        this._setRampAD(t1, t2);
      };
      p5.Env.prototype.setADSR = function(aTime, dTime, sPercent, rTime) {
        this.aTime = aTime;
        this.dTime = dTime || 0;
        this.sPercent = sPercent || 0;
        this.dLevel = typeof sPercent !== 'undefined' ? sPercent * (this.aLevel - this.rLevel) + this.rLevel : 0;
        this.rTime = rTime || 0;
        this._setRampAD(aTime, dTime);
      };
      p5.Env.prototype.setRange = function(aLevel, rLevel) {
        this.aLevel = aLevel || 1;
        this.rLevel = rLevel || 0;
      };
      p5.Env.prototype._setRampAD = function(t1, t2) {
        this._rampAttackTime = this.checkExpInput(t1);
        this._rampDecayTime = this.checkExpInput(t2);
        var TCDenominator = 1;
        TCDenominator = Math.log(1 / this.checkExpInput(1 - this._rampHighPercentage));
        this._rampAttackTC = t1 / this.checkExpInput(TCDenominator);
        TCDenominator = Math.log(1 / this._rampLowPercentage);
        this._rampDecayTC = t2 / this.checkExpInput(TCDenominator);
      };
      p5.Env.prototype.setRampPercentages = function(p1, p2) {
        this._rampHighPercentage = this.checkExpInput(p1);
        this._rampLowPercentage = this.checkExpInput(p2);
        var TCDenominator = 1;
        TCDenominator = Math.log(1 / this.checkExpInput(1 - this._rampHighPercentage));
        this._rampAttackTC = this._rampAttackTime / this.checkExpInput(TCDenominator);
        TCDenominator = Math.log(1 / this._rampLowPercentage);
        this._rampDecayTC = this._rampDecayTime / this.checkExpInput(TCDenominator);
      };
      p5.Env.prototype.setInput = function(unit) {
        for (var i = 0; i < arguments.length; i++) {
          this.connect(arguments[i]);
        }
      };
      p5.Env.prototype.setExp = function(isExp) {
        this.isExponential = isExp;
      };
      p5.Env.prototype.checkExpInput = function(value) {
        if (value <= 0) {
          value = 1e-8;
        }
        return value;
      };
      p5.Env.prototype.play = function(unit, secondsFromNow, susTime) {
        var now = p5sound.audiocontext.currentTime;
        var tFromNow = secondsFromNow || 0;
        var susTime = susTime || 0;
        if (unit) {
          if (this.connection !== unit) {
            this.connect(unit);
          }
        }
        this.triggerAttack(unit, tFromNow);
        this.triggerRelease(unit, tFromNow + this.aTime + this.dTime + susTime);
      };
      p5.Env.prototype.triggerAttack = function(unit, secondsFromNow) {
        var now = p5sound.audiocontext.currentTime;
        var tFromNow = secondsFromNow || 0;
        var t = now + tFromNow;
        this.lastAttack = t;
        this.wasTriggered = true;
        if (unit) {
          if (this.connection !== unit) {
            this.connect(unit);
          }
        }
        var valToSet = this.control.getValueAtTime(t);
        this.control.cancelScheduledValues(t);
        if (this.isExponential == true) {
          this.control.exponentialRampToValueAtTime(this.checkExpInput(valToSet), t);
        } else {
          this.control.linearRampToValueAtTime(valToSet, t);
        }
        t += this.aTime;
        if (this.isExponential == true) {
          this.control.exponentialRampToValueAtTime(this.checkExpInput(this.aLevel), t);
          valToSet = this.checkExpInput(this.control.getValueAtTime(t));
          this.control.cancelScheduledValues(t);
          this.control.exponentialRampToValueAtTime(valToSet, t);
        } else {
          this.control.linearRampToValueAtTime(this.aLevel, t);
          valToSet = this.control.getValueAtTime(t);
          this.control.cancelScheduledValues(t);
          this.control.linearRampToValueAtTime(valToSet, t);
        }
        t += this.dTime;
        if (this.isExponential == true) {
          this.control.exponentialRampToValueAtTime(this.checkExpInput(this.dLevel), t);
          valToSet = this.checkExpInput(this.control.getValueAtTime(t));
          this.control.cancelScheduledValues(t);
          this.control.exponentialRampToValueAtTime(valToSet, t);
        } else {
          this.control.linearRampToValueAtTime(this.dLevel, t);
          valToSet = this.control.getValueAtTime(t);
          this.control.cancelScheduledValues(t);
          this.control.linearRampToValueAtTime(valToSet, t);
        }
      };
      p5.Env.prototype.triggerRelease = function(unit, secondsFromNow) {
        if (!this.wasTriggered) {
          return;
        }
        var now = p5sound.audiocontext.currentTime;
        var tFromNow = secondsFromNow || 0;
        var t = now + tFromNow;
        if (unit) {
          if (this.connection !== unit) {
            this.connect(unit);
          }
        }
        var valToSet = this.control.getValueAtTime(t);
        this.control.cancelScheduledValues(t);
        if (this.isExponential == true) {
          this.control.exponentialRampToValueAtTime(this.checkExpInput(valToSet), t);
        } else {
          this.control.linearRampToValueAtTime(valToSet, t);
        }
        t += this.rTime;
        if (this.isExponential == true) {
          this.control.exponentialRampToValueAtTime(this.checkExpInput(this.rLevel), t);
          valToSet = this.checkExpInput(this.control.getValueAtTime(t));
          this.control.cancelScheduledValues(t);
          this.control.exponentialRampToValueAtTime(valToSet, t);
        } else {
          this.control.linearRampToValueAtTime(this.rLevel, t);
          valToSet = this.control.getValueAtTime(t);
          this.control.cancelScheduledValues(t);
          this.control.linearRampToValueAtTime(valToSet, t);
        }
        this.wasTriggered = false;
      };
      p5.Env.prototype.ramp = function(unit, secondsFromNow, v1, v2) {
        var now = p5sound.audiocontext.currentTime;
        var tFromNow = secondsFromNow || 0;
        var t = now + tFromNow;
        var destination1 = this.checkExpInput(v1);
        var destination2 = typeof v2 !== 'undefined' ? this.checkExpInput(v2) : undefined;
        if (unit) {
          if (this.connection !== unit) {
            this.connect(unit);
          }
        }
        var currentVal = this.checkExpInput(this.control.getValueAtTime(t));
        this.control.cancelScheduledValues(t);
        if (destination1 > currentVal) {
          this.control.setTargetAtTime(destination1, t, this._rampAttackTC);
          t += this._rampAttackTime;
        } else if (destination1 < currentVal) {
          this.control.setTargetAtTime(destination1, t, this._rampDecayTC);
          t += this._rampDecayTime;
        }
        if (destination2 === undefined)
          return;
        if (destination2 > destination1) {
          this.control.setTargetAtTime(destination2, t, this._rampAttackTC);
        } else if (destination2 < destination1) {
          this.control.setTargetAtTime(destination2, t, this._rampDecayTC);
        }
      };
      p5.Env.prototype.connect = function(unit) {
        this.connection = unit;
        if (unit instanceof p5.Oscillator || unit instanceof p5.SoundFile || unit instanceof p5.AudioIn || unit instanceof p5.Reverb || unit instanceof p5.Noise || unit instanceof p5.Filter || unit instanceof p5.Delay) {
          unit = unit.output.gain;
        }
        if (unit instanceof AudioParam) {
          unit.setValueAtTime(0, p5sound.audiocontext.currentTime);
        }
        if (unit instanceof p5.Signal) {
          unit.setValue(0);
        }
        this.output.connect(unit);
      };
      p5.Env.prototype.disconnect = function(unit) {
        this.output.disconnect();
      };
      p5.Env.prototype.add = function(num) {
        var add = new Add(num);
        var thisChain = this.mathOps.length;
        var nextChain = this.output;
        return p5.prototype._mathChain(this, add, thisChain, nextChain, Add);
      };
      p5.Env.prototype.mult = function(num) {
        var mult = new Mult(num);
        var thisChain = this.mathOps.length;
        var nextChain = this.output;
        return p5.prototype._mathChain(this, mult, thisChain, nextChain, Mult);
      };
      p5.Env.prototype.scale = function(inMin, inMax, outMin, outMax) {
        var scale = new Scale(inMin, inMax, outMin, outMax);
        var thisChain = this.mathOps.length;
        var nextChain = this.output;
        return p5.prototype._mathChain(this, scale, thisChain, nextChain, Scale);
      };
      p5.Env.prototype.dispose = function() {
        var index = p5sound.soundArray.indexOf(this);
        p5sound.soundArray.splice(index, 1);
        var now = p5sound.audiocontext.currentTime;
        this.disconnect();
        try {
          this.control.dispose();
          this.control = null;
        } catch (e) {}
        for (var i = 1; i < this.mathOps.length; i++) {
          mathOps[i].dispose();
        }
      };
    }(master, Tone_signal_Add, Tone_signal_Multiply, Tone_signal_Scale, Tone_signal_TimelineSignal, Tone_core_Tone);
    var pulse;
    pulse = function() {
      'use strict';
      var p5sound = master;
      p5.Pulse = function(freq, w) {
        p5.Oscillator.call(this, freq, 'sawtooth');
        this.w = w || 0;
        this.osc2 = new p5.SawOsc(freq);
        this.dNode = p5sound.audiocontext.createDelay();
        this.dcOffset = createDCOffset();
        this.dcGain = p5sound.audiocontext.createGain();
        this.dcOffset.connect(this.dcGain);
        this.dcGain.connect(this.output);
        this.f = freq || 440;
        var mW = this.w / this.oscillator.frequency.value;
        this.dNode.delayTime.value = mW;
        this.dcGain.gain.value = 1.7 * (0.5 - this.w);
        this.osc2.disconnect();
        this.osc2.panner.disconnect();
        this.osc2.amp(-1);
        this.osc2.output.connect(this.dNode);
        this.dNode.connect(this.output);
        this.output.gain.value = 1;
        this.output.connect(this.panner);
      };
      p5.Pulse.prototype = Object.create(p5.Oscillator.prototype);
      p5.Pulse.prototype.width = function(w) {
        if (typeof w === 'number') {
          if (w <= 1 && w >= 0) {
            this.w = w;
            var mW = this.w / this.oscillator.frequency.value;
            this.dNode.delayTime.value = mW;
          }
          this.dcGain.gain.value = 1.7 * (0.5 - this.w);
        } else {
          w.connect(this.dNode.delayTime);
          var sig = new p5.SignalAdd(-0.5);
          sig.setInput(w);
          sig = sig.mult(-1);
          sig = sig.mult(1.7);
          sig.connect(this.dcGain.gain);
        }
      };
      p5.Pulse.prototype.start = function(f, time) {
        var now = p5sound.audiocontext.currentTime;
        var t = time || 0;
        if (!this.started) {
          var freq = f || this.f;
          var type = this.oscillator.type;
          this.oscillator = p5sound.audiocontext.createOscillator();
          this.oscillator.frequency.setValueAtTime(freq, now);
          this.oscillator.type = type;
          this.oscillator.connect(this.output);
          this.oscillator.start(t + now);
          this.osc2.oscillator = p5sound.audiocontext.createOscillator();
          this.osc2.oscillator.frequency.setValueAtTime(freq, t + now);
          this.osc2.oscillator.type = type;
          this.osc2.oscillator.connect(this.osc2.output);
          this.osc2.start(t + now);
          this.freqNode = [this.oscillator.frequency, this.osc2.oscillator.frequency];
          this.dcOffset = createDCOffset();
          this.dcOffset.connect(this.dcGain);
          this.dcOffset.start(t + now);
          if (this.mods !== undefined && this.mods.frequency !== undefined) {
            this.mods.frequency.connect(this.freqNode[0]);
            this.mods.frequency.connect(this.freqNode[1]);
          }
          this.started = true;
          this.osc2.started = true;
        }
      };
      p5.Pulse.prototype.stop = function(time) {
        if (this.started) {
          var t = time || 0;
          var now = p5sound.audiocontext.currentTime;
          this.oscillator.stop(t + now);
          this.osc2.oscillator.stop(t + now);
          this.dcOffset.stop(t + now);
          this.started = false;
          this.osc2.started = false;
        }
      };
      p5.Pulse.prototype.freq = function(val, rampTime, tFromNow) {
        if (typeof val === 'number') {
          this.f = val;
          var now = p5sound.audiocontext.currentTime;
          var rampTime = rampTime || 0;
          var tFromNow = tFromNow || 0;
          var currentFreq = this.oscillator.frequency.value;
          this.oscillator.frequency.cancelScheduledValues(now);
          this.oscillator.frequency.setValueAtTime(currentFreq, now + tFromNow);
          this.oscillator.frequency.exponentialRampToValueAtTime(val, tFromNow + rampTime + now);
          this.osc2.oscillator.frequency.cancelScheduledValues(now);
          this.osc2.oscillator.frequency.setValueAtTime(currentFreq, now + tFromNow);
          this.osc2.oscillator.frequency.exponentialRampToValueAtTime(val, tFromNow + rampTime + now);
          if (this.freqMod) {
            this.freqMod.output.disconnect();
            this.freqMod = null;
          }
        } else if (val.output) {
          val.output.disconnect();
          val.output.connect(this.oscillator.frequency);
          val.output.connect(this.osc2.oscillator.frequency);
          this.freqMod = val;
        }
      };
      function createDCOffset() {
        var ac = p5sound.audiocontext;
        var buffer = ac.createBuffer(1, 2048, ac.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < 2048; i++)
          data[i] = 1;
        var bufferSource = ac.createBufferSource();
        bufferSource.buffer = buffer;
        bufferSource.loop = true;
        return bufferSource;
      }
    }(master, oscillator);
    var noise;
    noise = function() {
      'use strict';
      var p5sound = master;
      p5.Noise = function(type) {
        var assignType;
        p5.Oscillator.call(this);
        delete this.f;
        delete this.freq;
        delete this.oscillator;
        if (type === 'brown') {
          assignType = _brownNoise;
        } else if (type === 'pink') {
          assignType = _pinkNoise;
        } else {
          assignType = _whiteNoise;
        }
        this.buffer = assignType;
      };
      p5.Noise.prototype = Object.create(p5.Oscillator.prototype);
      var _whiteNoise = function() {
        var bufferSize = 2 * p5sound.audiocontext.sampleRate;
        var whiteBuffer = p5sound.audiocontext.createBuffer(1, bufferSize, p5sound.audiocontext.sampleRate);
        var noiseData = whiteBuffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }
        whiteBuffer.type = 'white';
        return whiteBuffer;
      }();
      var _pinkNoise = function() {
        var bufferSize = 2 * p5sound.audiocontext.sampleRate;
        var pinkBuffer = p5sound.audiocontext.createBuffer(1, bufferSize, p5sound.audiocontext.sampleRate);
        var noiseData = pinkBuffer.getChannelData(0);
        var b0,
            b1,
            b2,
            b3,
            b4,
            b5,
            b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0;
        for (var i = 0; i < bufferSize; i++) {
          var white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          noiseData[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          noiseData[i] *= 0.11;
          b6 = white * 0.115926;
        }
        pinkBuffer.type = 'pink';
        return pinkBuffer;
      }();
      var _brownNoise = function() {
        var bufferSize = 2 * p5sound.audiocontext.sampleRate;
        var brownBuffer = p5sound.audiocontext.createBuffer(1, bufferSize, p5sound.audiocontext.sampleRate);
        var noiseData = brownBuffer.getChannelData(0);
        var lastOut = 0;
        for (var i = 0; i < bufferSize; i++) {
          var white = Math.random() * 2 - 1;
          noiseData[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = noiseData[i];
          noiseData[i] *= 3.5;
        }
        brownBuffer.type = 'brown';
        return brownBuffer;
      }();
      p5.Noise.prototype.setType = function(type) {
        switch (type) {
          case 'white':
            this.buffer = _whiteNoise;
            break;
          case 'pink':
            this.buffer = _pinkNoise;
            break;
          case 'brown':
            this.buffer = _brownNoise;
            break;
          default:
            this.buffer = _whiteNoise;
        }
        if (this.started) {
          var now = p5sound.audiocontext.currentTime;
          this.stop(now);
          this.start(now + 0.01);
        }
      };
      p5.Noise.prototype.getType = function() {
        return this.buffer.type;
      };
      p5.Noise.prototype.start = function() {
        if (this.started) {
          this.stop();
        }
        this.noise = p5sound.audiocontext.createBufferSource();
        this.noise.buffer = this.buffer;
        this.noise.loop = true;
        this.noise.connect(this.output);
        var now = p5sound.audiocontext.currentTime;
        this.noise.start(now);
        this.started = true;
      };
      p5.Noise.prototype.stop = function() {
        var now = p5sound.audiocontext.currentTime;
        if (this.noise) {
          this.noise.stop(now);
          this.started = false;
        }
      };
      p5.Noise.prototype.dispose = function() {
        var now = p5sound.audiocontext.currentTime;
        var index = p5sound.soundArray.indexOf(this);
        p5sound.soundArray.splice(index, 1);
        if (this.noise) {
          this.noise.disconnect();
          this.stop(now);
        }
        if (this.output) {
          this.output.disconnect();
        }
        if (this.panner) {
          this.panner.disconnect();
        }
        this.output = null;
        this.panner = null;
        this.buffer = null;
        this.noise = null;
      };
    }(master);
    var audioin;
    audioin = function() {
      'use strict';
      var p5sound = master;
      var CustomError = errorHandler;
      p5.AudioIn = function(errorCallback) {
        this.input = p5sound.audiocontext.createGain();
        this.output = p5sound.audiocontext.createGain();
        this.stream = null;
        this.mediaStream = null;
        this.currentSource = 0;
        this.enabled = false;
        this.amplitude = new p5.Amplitude();
        this.output.connect(this.amplitude.input);
        if (typeof window.MediaStreamTrack === 'undefined') {
          if (errorCallback) {
            errorCallback();
          } else {
            window.alert('This browser does not support AudioIn');
          }
        } else if (typeof window.MediaDevices.enumerateDevices === 'function') {
          window.MediaDevices.enumerateDevices(this._gotSources);
        } else {}
        p5sound.soundArray.push(this);
      };
      p5.AudioIn.prototype.start = function(successCallback, errorCallback) {
        var self = this;
        if (p5sound.inputSources[self.currentSource]) {
          var audioSource = p5sound.inputSources[self.currentSource].id;
          var constraints = {audio: {optional: [{sourceId: audioSource}]}};
          window.navigator.getUserMedia(constraints, this._onStream = function(stream) {
            self.stream = stream;
            self.enabled = true;
            self.mediaStream = p5sound.audiocontext.createMediaStreamSource(stream);
            self.mediaStream.connect(self.output);
            if (successCallback)
              successCallback();
            self.amplitude.setInput(self.output);
          }, this._onStreamError = function(e) {
            if (errorCallback)
              errorCallback(e);
            else
              console.error(e);
          });
        } else {
          window.navigator.getUserMedia({'audio': true}, this._onStream = function(stream) {
            self.stream = stream;
            self.enabled = true;
            self.mediaStream = p5sound.audiocontext.createMediaStreamSource(stream);
            self.mediaStream.connect(self.output);
            self.amplitude.setInput(self.output);
            if (successCallback)
              successCallback();
          }, this._onStreamError = function(e) {
            if (errorCallback)
              errorCallback(e);
            else
              console.error(e);
          });
        }
      };
      p5.AudioIn.prototype.stop = function() {
        if (this.stream) {
          this.stream.getTracks()[0].stop();
        }
      };
      p5.AudioIn.prototype.connect = function(unit) {
        if (unit) {
          if (unit.hasOwnProperty('input')) {
            this.output.connect(unit.input);
          } else if (unit.hasOwnProperty('analyser')) {
            this.output.connect(unit.analyser);
          } else {
            this.output.connect(unit);
          }
        } else {
          this.output.connect(p5sound.input);
        }
      };
      p5.AudioIn.prototype.disconnect = function() {
        this.output.disconnect();
        this.output.connect(this.amplitude.input);
      };
      p5.AudioIn.prototype.getLevel = function(smoothing) {
        if (smoothing) {
          this.amplitude.smoothing = smoothing;
        }
        return this.amplitude.getLevel();
      };
      p5.AudioIn.prototype._gotSources = function(sourceInfos) {
        for (var i = 0; i < sourceInfos.length; i++) {
          var sourceInfo = sourceInfos[i];
          if (sourceInfo.kind === 'audio') {
            return sourceInfo;
          }
        }
      };
      p5.AudioIn.prototype.amp = function(vol, t) {
        if (t) {
          var rampTime = t || 0;
          var currentVol = this.output.gain.value;
          this.output.gain.cancelScheduledValues(p5sound.audiocontext.currentTime);
          this.output.gain.setValueAtTime(currentVol, p5sound.audiocontext.currentTime);
          this.output.gain.linearRampToValueAtTime(vol, rampTime + p5sound.audiocontext.currentTime);
        } else {
          this.output.gain.cancelScheduledValues(p5sound.audiocontext.currentTime);
          this.output.gain.setValueAtTime(vol, p5sound.audiocontext.currentTime);
        }
      };
      p5.AudioIn.prototype.listSources = function() {
        console.log('listSources is deprecated - please use AudioIn.getSources');
        console.log('input sources: ');
        if (p5sound.inputSources.length > 0) {
          return p5sound.inputSources;
        } else {
          return 'This browser does not support MediaStreamTrack.getSources()';
        }
      };
      p5.AudioIn.prototype.getSources = function(callback) {
        if (typeof window.MediaStreamTrack.getSources === 'function') {
          window.MediaStreamTrack.getSources(function(data) {
            for (var i = 0,
                max = data.length; i < max; i++) {
              var sourceInfo = data[i];
              if (sourceInfo.kind === 'audio') {
                p5sound.inputSources.push(sourceInfo);
              }
            }
            callback(p5sound.inputSources);
          });
        } else {
          console.log('This browser does not support MediaStreamTrack.getSources()');
        }
      };
      p5.AudioIn.prototype.setSource = function(num) {
        var self = this;
        if (p5sound.inputSources.length > 0 && num < p5sound.inputSources.length) {
          self.currentSource = num;
          console.log('set source to ' + p5sound.inputSources[self.currentSource].id);
        } else {
          console.log('unable to set input source');
        }
      };
      p5.AudioIn.prototype.dispose = function() {
        var index = p5sound.soundArray.indexOf(this);
        p5sound.soundArray.splice(index, 1);
        this.stop();
        if (this.output) {
          this.output.disconnect();
        }
        if (this.amplitude) {
          this.amplitude.disconnect();
        }
        this.amplitude = null;
        this.output = null;
      };
    }(master, errorHandler);
    var filter;
    filter = function() {
      'use strict';
      var p5sound = master;
      p5.Filter = function(type) {
        this.ac = p5sound.audiocontext;
        this.input = this.ac.createGain();
        this.output = this.ac.createGain();
        this.biquad = this.ac.createBiquadFilter();
        this.input.connect(this.biquad);
        this.biquad.connect(this.output);
        this.connect();
        if (type) {
          this.setType(type);
        }
        p5sound.soundArray.push(this);
      };
      p5.Filter.prototype.process = function(src, freq, res) {
        src.connect(this.input);
        this.set(freq, res);
      };
      p5.Filter.prototype.set = function(freq, res, time) {
        if (freq) {
          this.freq(freq, time);
        }
        if (res) {
          this.res(res, time);
        }
      };
      p5.Filter.prototype.freq = function(freq, time) {
        var self = this;
        var t = time || 0;
        if (freq <= 0) {
          freq = 1;
        }
        if (typeof freq === 'number') {
          self.biquad.frequency.value = freq;
          self.biquad.frequency.cancelScheduledValues(this.ac.currentTime + 0.01 + t);
          self.biquad.frequency.exponentialRampToValueAtTime(freq, this.ac.currentTime + 0.02 + t);
        } else if (freq) {
          freq.connect(this.biquad.frequency);
        }
        return self.biquad.frequency.value;
      };
      p5.Filter.prototype.res = function(res, time) {
        var self = this;
        var t = time || 0;
        if (typeof res == 'number') {
          self.biquad.Q.value = res;
          self.biquad.Q.cancelScheduledValues(self.ac.currentTime + 0.01 + t);
          self.biquad.Q.linearRampToValueAtTime(res, self.ac.currentTime + 0.02 + t);
        } else if (res) {
          freq.connect(this.biquad.Q);
        }
        return self.biquad.Q.value;
      };
      p5.Filter.prototype.setType = function(t) {
        this.biquad.type = t;
      };
      p5.Filter.prototype.amp = function(vol, rampTime, tFromNow) {
        var rampTime = rampTime || 0;
        var tFromNow = tFromNow || 0;
        var now = p5sound.audiocontext.currentTime;
        var currentVol = this.output.gain.value;
        this.output.gain.cancelScheduledValues(now);
        this.output.gain.linearRampToValueAtTime(currentVol, now + tFromNow + 0.001);
        this.output.gain.linearRampToValueAtTime(vol, now + tFromNow + rampTime + 0.001);
      };
      p5.Filter.prototype.connect = function(unit) {
        var u = unit || p5.soundOut.input;
        this.output.connect(u);
      };
      p5.Filter.prototype.disconnect = function() {
        this.output.disconnect();
      };
      p5.Filter.prototype.dispose = function() {
        var index = p5sound.soundArray.indexOf(this);
        p5sound.soundArray.splice(index, 1);
        this.input.disconnect();
        this.input = undefined;
        this.output.disconnect();
        this.output = undefined;
        this.biquad.disconnect();
        this.biquad = undefined;
      };
      p5.LowPass = function() {
        p5.Filter.call(this, 'lowpass');
      };
      p5.LowPass.prototype = Object.create(p5.Filter.prototype);
      p5.HighPass = function() {
        p5.Filter.call(this, 'highpass');
      };
      p5.HighPass.prototype = Object.create(p5.Filter.prototype);
      p5.BandPass = function() {
        p5.Filter.call(this, 'bandpass');
      };
      p5.BandPass.prototype = Object.create(p5.Filter.prototype);
    }(master);
    var delay;
    delay = function() {
      'use strict';
      var p5sound = master;
      var Filter = filter;
      p5.Delay = function() {
        this.ac = p5sound.audiocontext;
        this.input = this.ac.createGain();
        this.output = this.ac.createGain();
        this._split = this.ac.createChannelSplitter(2);
        this._merge = this.ac.createChannelMerger(2);
        this._leftGain = this.ac.createGain();
        this._rightGain = this.ac.createGain();
        this.leftDelay = this.ac.createDelay();
        this.rightDelay = this.ac.createDelay();
        this._leftFilter = new p5.Filter();
        this._rightFilter = new p5.Filter();
        this._leftFilter.disconnect();
        this._rightFilter.disconnect();
        this._leftFilter.biquad.frequency.setValueAtTime(1200, this.ac.currentTime);
        this._rightFilter.biquad.frequency.setValueAtTime(1200, this.ac.currentTime);
        this._leftFilter.biquad.Q.setValueAtTime(0.3, this.ac.currentTime);
        this._rightFilter.biquad.Q.setValueAtTime(0.3, this.ac.currentTime);
        this.input.connect(this._split);
        this.leftDelay.connect(this._leftGain);
        this.rightDelay.connect(this._rightGain);
        this._leftGain.connect(this._leftFilter.input);
        this._rightGain.connect(this._rightFilter.input);
        this._merge.connect(this.output);
        this.output.connect(p5.soundOut.input);
        this._leftFilter.biquad.gain.setValueAtTime(1, this.ac.currentTime);
        this._rightFilter.biquad.gain.setValueAtTime(1, this.ac.currentTime);
        this.setType(0);
        this._maxDelay = this.leftDelay.delayTime.maxValue;
        p5sound.soundArray.push(this);
      };
      p5.Delay.prototype.process = function(src, _delayTime, _feedback, _filter) {
        var feedback = _feedback || 0;
        var delayTime = _delayTime || 0;
        if (feedback >= 1) {
          throw new Error('Feedback value will force a positive feedback loop.');
        }
        if (delayTime >= this._maxDelay) {
          throw new Error('Delay Time exceeds maximum delay time of ' + this._maxDelay + ' second.');
        }
        src.connect(this.input);
        this.leftDelay.delayTime.setValueAtTime(delayTime, this.ac.currentTime);
        this.rightDelay.delayTime.setValueAtTime(delayTime, this.ac.currentTime);
        this._leftGain.gain.setValueAtTime(feedback, this.ac.currentTime);
        this._rightGain.gain.setValueAtTime(feedback, this.ac.currentTime);
        if (_filter) {
          this._leftFilter.freq(_filter);
          this._rightFilter.freq(_filter);
        }
      };
      p5.Delay.prototype.delayTime = function(t) {
        if (typeof t !== 'number') {
          t.connect(this.leftDelay.delayTime);
          t.connect(this.rightDelay.delayTime);
        } else {
          this.leftDelay.delayTime.cancelScheduledValues(this.ac.currentTime);
          this.rightDelay.delayTime.cancelScheduledValues(this.ac.currentTime);
          this.leftDelay.delayTime.linearRampToValueAtTime(t, this.ac.currentTime);
          this.rightDelay.delayTime.linearRampToValueAtTime(t, this.ac.currentTime);
        }
      };
      p5.Delay.prototype.feedback = function(f) {
        if (typeof f !== 'number') {
          f.connect(this._leftGain.gain);
          f.connect(this._rightGain.gain);
        } else if (f >= 1) {
          throw new Error('Feedback value will force a positive feedback loop.');
        } else {
          this._leftGain.gain.exponentialRampToValueAtTime(f, this.ac.currentTime);
          this._rightGain.gain.exponentialRampToValueAtTime(f, this.ac.currentTime);
        }
      };
      p5.Delay.prototype.filter = function(freq, q) {
        this._leftFilter.set(freq, q);
        this._rightFilter.set(freq, q);
      };
      p5.Delay.prototype.setType = function(t) {
        if (t === 1) {
          t = 'pingPong';
        }
        this._split.disconnect();
        this._leftFilter.disconnect();
        this._rightFilter.disconnect();
        this._split.connect(this.leftDelay, 0);
        this._split.connect(this.rightDelay, 1);
        switch (t) {
          case 'pingPong':
            this._rightFilter.setType(this._leftFilter.biquad.type);
            this._leftFilter.output.connect(this._merge, 0, 0);
            this._rightFilter.output.connect(this._merge, 0, 1);
            this._leftFilter.output.connect(this.rightDelay);
            this._rightFilter.output.connect(this.leftDelay);
            break;
          default:
            this._leftFilter.output.connect(this._merge, 0, 0);
            this._leftFilter.output.connect(this._merge, 0, 1);
            this._leftFilter.output.connect(this.leftDelay);
            this._leftFilter.output.connect(this.rightDelay);
        }
      };
      p5.Delay.prototype.amp = function(vol, rampTime, tFromNow) {
        var rampTime = rampTime || 0;
        var tFromNow = tFromNow || 0;
        var now = p5sound.audiocontext.currentTime;
        var currentVol = this.output.gain.value;
        this.output.gain.cancelScheduledValues(now);
        this.output.gain.linearRampToValueAtTime(currentVol, now + tFromNow + 0.001);
        this.output.gain.linearRampToValueAtTime(vol, now + tFromNow + rampTime + 0.001);
      };
      p5.Delay.prototype.connect = function(unit) {
        var u = unit || p5.soundOut.input;
        this.output.connect(u);
      };
      p5.Delay.prototype.disconnect = function() {
        this.output.disconnect();
      };
      p5.Delay.prototype.dispose = function() {
        var index = p5sound.soundArray.indexOf(this);
        p5sound.soundArray.splice(index, 1);
        this.input.disconnect();
        this.output.disconnect();
        this._split.disconnect();
        this._leftFilter.disconnect();
        this._rightFilter.disconnect();
        this._merge.disconnect();
        this._leftGain.disconnect();
        this._rightGain.disconnect();
        this.leftDelay.disconnect();
        this.rightDelay.disconnect();
        this.input = undefined;
        this.output = undefined;
        this._split = undefined;
        this._leftFilter = undefined;
        this._rightFilter = undefined;
        this._merge = undefined;
        this._leftGain = undefined;
        this._rightGain = undefined;
        this.leftDelay = undefined;
        this.rightDelay = undefined;
      };
    }(master, filter);
    var reverb;
    reverb = function() {
      'use strict';
      var p5sound = master;
      var CustomError = errorHandler;
      p5.Reverb = function() {
        this.ac = p5sound.audiocontext;
        this.convolverNode = this.ac.createConvolver();
        this.input = this.ac.createGain();
        this.output = this.ac.createGain();
        this.input.gain.value = 0.5;
        this.input.connect(this.convolverNode);
        this.convolverNode.connect(this.output);
        this._seconds = 3;
        this._decay = 2;
        this._reverse = false;
        this._buildImpulse();
        this.connect();
        p5sound.soundArray.push(this);
      };
      p5.Reverb.prototype.process = function(src, seconds, decayRate, reverse) {
        src.connect(this.input);
        var rebuild = false;
        if (seconds) {
          this._seconds = seconds;
          rebuild = true;
        }
        if (decayRate) {
          this._decay = decayRate;
        }
        if (reverse) {
          this._reverse = reverse;
        }
        if (rebuild) {
          this._buildImpulse();
        }
      };
      p5.Reverb.prototype.set = function(seconds, decayRate, reverse) {
        var rebuild = false;
        if (seconds) {
          this._seconds = seconds;
          rebuild = true;
        }
        if (decayRate) {
          this._decay = decayRate;
        }
        if (reverse) {
          this._reverse = reverse;
        }
        if (rebuild) {
          this._buildImpulse();
        }
      };
      p5.Reverb.prototype.amp = function(vol, rampTime, tFromNow) {
        var rampTime = rampTime || 0;
        var tFromNow = tFromNow || 0;
        var now = p5sound.audiocontext.currentTime;
        var currentVol = this.output.gain.value;
        this.output.gain.cancelScheduledValues(now);
        this.output.gain.linearRampToValueAtTime(currentVol, now + tFromNow + 0.001);
        this.output.gain.linearRampToValueAtTime(vol, now + tFromNow + rampTime + 0.001);
      };
      p5.Reverb.prototype.connect = function(unit) {
        var u = unit || p5.soundOut.input;
        this.output.connect(u.input ? u.input : u);
      };
      p5.Reverb.prototype.disconnect = function() {
        this.output.disconnect();
      };
      p5.Reverb.prototype._buildImpulse = function() {
        var rate = this.ac.sampleRate;
        var length = rate * this._seconds;
        var decay = this._decay;
        var impulse = this.ac.createBuffer(2, length, rate);
        var impulseL = impulse.getChannelData(0);
        var impulseR = impulse.getChannelData(1);
        var n,
            i;
        for (i = 0; i < length; i++) {
          n = this.reverse ? length - i : i;
          impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
          impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        }
        this.convolverNode.buffer = impulse;
      };
      p5.Reverb.prototype.dispose = function() {
        var index = p5sound.soundArray.indexOf(this);
        p5sound.soundArray.splice(index, 1);
        if (this.convolverNode) {
          this.convolverNode.buffer = null;
          this.convolverNode = null;
        }
        if (typeof this.output !== 'undefined') {
          this.output.disconnect();
          this.output = null;
        }
        if (typeof this.panner !== 'undefined') {
          this.panner.disconnect();
          this.panner = null;
        }
      };
      p5.Convolver = function(path, callback, errorCallback) {
        this.ac = p5sound.audiocontext;
        this.convolverNode = this.ac.createConvolver();
        this.input = this.ac.createGain();
        this.output = this.ac.createGain();
        this.input.gain.value = 0.5;
        this.input.connect(this.convolverNode);
        this.convolverNode.connect(this.output);
        if (path) {
          this.impulses = [];
          this._loadBuffer(path, callback, errorCallback);
        } else {
          this._seconds = 3;
          this._decay = 2;
          this._reverse = false;
          this._buildImpulse();
        }
        this.connect();
        p5sound.soundArray.push(this);
      };
      p5.Convolver.prototype = Object.create(p5.Reverb.prototype);
      p5.prototype.registerPreloadMethod('createConvolver', p5.prototype);
      p5.prototype.createConvolver = function(path, callback, errorCallback) {
        if (window.location.origin.indexOf('file://') > -1 && window.cordova === 'undefined') {
          alert('This sketch may require a server to load external files. Please see http://bit.ly/1qcInwS');
        }
        var cReverb = new p5.Convolver(path, callback, errorCallback);
        cReverb.impulses = [];
        return cReverb;
      };
      p5.Convolver.prototype._loadBuffer = function(path, callback, errorCallback) {
        var path = p5.prototype._checkFileFormats(path);
        var self = this;
        var errorTrace = new Error().stack;
        var ac = p5.prototype.getAudioContext();
        var request = new XMLHttpRequest();
        request.open('GET', path, true);
        request.responseType = 'arraybuffer';
        request.onload = function() {
          if (request.status == 200) {
            ac.decodeAudioData(request.response, function(buff) {
              var buffer = {};
              var chunks = path.split('/');
              buffer.name = chunks[chunks.length - 1];
              buffer.audioBuffer = buff;
              self.impulses.push(buffer);
              self.convolverNode.buffer = buffer.audioBuffer;
              if (callback) {
                callback(buffer);
              }
            }, function(e) {
              var err = new CustomError('decodeAudioData', errorTrace, self.url);
              var msg = 'AudioContext error at decodeAudioData for ' + self.url;
              if (errorCallback) {
                err.msg = msg;
                errorCallback(err);
              } else {
                console.error(msg + '\n The error stack trace includes: \n' + err.stack);
              }
            });
          } else {
            var err = new CustomError('loadConvolver', errorTrace, self.url);
            var msg = 'Unable to load ' + self.url + '. The request status was: ' + request.status + ' (' + request.statusText + ')';
            if (errorCallback) {
              err.message = msg;
              errorCallback(err);
            } else {
              console.error(msg + '\n The error stack trace includes: \n' + err.stack);
            }
          }
        };
        request.onerror = function(e) {
          var err = new CustomError('loadConvolver', errorTrace, self.url);
          var msg = 'There was no response from the server at ' + self.url + '. Check the url and internet connectivity.';
          if (errorCallback) {
            err.message = msg;
            errorCallback(err);
          } else {
            console.error(msg + '\n The error stack trace includes: \n' + err.stack);
          }
        };
        request.send();
      };
      p5.Convolver.prototype.set = null;
      p5.Convolver.prototype.process = function(src) {
        src.connect(this.input);
      };
      p5.Convolver.prototype.impulses = [];
      p5.Convolver.prototype.addImpulse = function(path, callback, errorCallback) {
        if (window.location.origin.indexOf('file://') > -1 && window.cordova === 'undefined') {
          alert('This sketch may require a server to load external files. Please see http://bit.ly/1qcInwS');
        }
        this._loadBuffer(path, callback, errorCallback);
      };
      p5.Convolver.prototype.resetImpulse = function(path, callback, errorCallback) {
        if (window.location.origin.indexOf('file://') > -1 && window.cordova === 'undefined') {
          alert('This sketch may require a server to load external files. Please see http://bit.ly/1qcInwS');
        }
        this.impulses = [];
        this._loadBuffer(path, callback, errorCallback);
      };
      p5.Convolver.prototype.toggleImpulse = function(id) {
        if (typeof id === 'number' && id < this.impulses.length) {
          this.convolverNode.buffer = this.impulses[id].audioBuffer;
        }
        if (typeof id === 'string') {
          for (var i = 0; i < this.impulses.length; i++) {
            if (this.impulses[i].name === id) {
              this.convolverNode.buffer = this.impulses[i].audioBuffer;
              break;
            }
          }
        }
      };
      p5.Convolver.prototype.dispose = function() {
        for (var i in this.impulses) {
          this.impulses[i] = null;
        }
        this.convolverNode.disconnect();
        this.concolverNode = null;
        if (typeof this.output !== 'undefined') {
          this.output.disconnect();
          this.output = null;
        }
        if (typeof this.panner !== 'undefined') {
          this.panner.disconnect();
          this.panner = null;
        }
      };
    }(master, errorHandler, sndcore);
    var Tone_core_TimelineState;
    Tone_core_TimelineState = function(Tone) {
      'use strict';
      Tone.TimelineState = function(initial) {
        Tone.Timeline.call(this);
        this._initial = initial;
      };
      Tone.extend(Tone.TimelineState, Tone.Timeline);
      Tone.TimelineState.prototype.getStateAtTime = function(time) {
        var event = this.getEvent(time);
        if (event !== null) {
          return event.state;
        } else {
          return this._initial;
        }
      };
      Tone.TimelineState.prototype.setStateAtTime = function(state, time) {
        this.addEvent({
          'state': state,
          'time': this.toSeconds(time)
        });
      };
      return Tone.TimelineState;
    }(Tone_core_Tone, Tone_core_Timeline);
    var Tone_core_Clock;
    Tone_core_Clock = function(Tone) {
      'use strict';
      Tone.Clock = function() {
        var options = this.optionsObject(arguments, ['callback', 'frequency'], Tone.Clock.defaults);
        this.callback = options.callback;
        this._lookAhead = 'auto';
        this._computedLookAhead = 1 / 60;
        this._threshold = 0.5;
        this._nextTick = -1;
        this._lastUpdate = 0;
        this._loopID = -1;
        this.frequency = new Tone.TimelineSignal(options.frequency, Tone.Type.Frequency);
        this.ticks = 0;
        this._state = new Tone.TimelineState(Tone.State.Stopped);
        this._boundLoop = this._loop.bind(this);
        this._readOnly('frequency');
        this._loop();
      };
      Tone.extend(Tone.Clock);
      Tone.Clock.defaults = {
        'callback': Tone.noOp,
        'frequency': 1,
        'lookAhead': 'auto'
      };
      Object.defineProperty(Tone.Clock.prototype, 'state', {get: function() {
          return this._state.getStateAtTime(this.now());
        }});
      Object.defineProperty(Tone.Clock.prototype, 'lookAhead', {
        get: function() {
          return this._lookAhead;
        },
        set: function(val) {
          if (val === 'auto') {
            this._lookAhead = 'auto';
          } else {
            this._lookAhead = this.toSeconds(val);
          }
        }
      });
      Tone.Clock.prototype.start = function(time, offset) {
        time = this.toSeconds(time);
        if (this._state.getStateAtTime(time) !== Tone.State.Started) {
          this._state.addEvent({
            'state': Tone.State.Started,
            'time': time,
            'offset': offset
          });
        }
        return this;
      };
      Tone.Clock.prototype.stop = function(time) {
        time = this.toSeconds(time);
        if (this._state.getStateAtTime(time) !== Tone.State.Stopped) {
          this._state.setStateAtTime(Tone.State.Stopped, time);
        }
        return this;
      };
      Tone.Clock.prototype.pause = function(time) {
        time = this.toSeconds(time);
        if (this._state.getStateAtTime(time) === Tone.State.Started) {
          this._state.setStateAtTime(Tone.State.Paused, time);
        }
        return this;
      };
      Tone.Clock.prototype._loop = function(time) {
        this._loopID = requestAnimationFrame(this._boundLoop);
        if (this._lookAhead === 'auto') {
          if (!this.isUndef(time)) {
            var diff = (time - this._lastUpdate) / 1000;
            this._lastUpdate = time;
            if (diff < this._threshold) {
              this._computedLookAhead = (9 * this._computedLookAhead + diff) / 10;
            }
          }
        } else {
          this._computedLookAhead = this._lookAhead;
        }
        var now = this.now();
        var lookAhead = this._computedLookAhead * 2;
        var event = this._state.getEvent(now + lookAhead);
        var state = Tone.State.Stopped;
        if (event) {
          state = event.state;
          if (this._nextTick === -1 && state === Tone.State.Started) {
            this._nextTick = event.time;
            if (!this.isUndef(event.offset)) {
              this.ticks = event.offset;
            }
          }
        }
        if (state === Tone.State.Started) {
          while (now + lookAhead > this._nextTick) {
            if (now > this._nextTick + this._threshold) {
              this._nextTick = now;
            }
            var tickTime = this._nextTick;
            this._nextTick += 1 / this.frequency.getValueAtTime(this._nextTick);
            this.callback(tickTime);
            this.ticks++;
          }
        } else if (state === Tone.State.Stopped) {
          this._nextTick = -1;
          this.ticks = 0;
        }
      };
      Tone.Clock.prototype.getStateAtTime = function(time) {
        return this._state.getStateAtTime(time);
      };
      Tone.Clock.prototype.dispose = function() {
        cancelAnimationFrame(this._loopID);
        Tone.TimelineState.prototype.dispose.call(this);
        this._writable('frequency');
        this.frequency.dispose();
        this.frequency = null;
        this._boundLoop = Tone.noOp;
        this._nextTick = Infinity;
        this.callback = null;
        this._state.dispose();
        this._state = null;
      };
      return Tone.Clock;
    }(Tone_core_Tone, Tone_signal_TimelineSignal);
    var metro;
    metro = function() {
      'use strict';
      var p5sound = master;
      var Clock = Tone_core_Clock;
      var ac = p5sound.audiocontext;
      p5.Metro = function() {
        this.clock = new Clock({'callback': this.ontick.bind(this)});
        this.syncedParts = [];
        this.bpm = 120;
        this._init();
        this.tickCallback = function() {};
      };
      var prevTick = 0;
      var tatumTime = 0;
      p5.Metro.prototype.ontick = function(tickTime) {
        var elapsedTime = tickTime - prevTick;
        var secondsFromNow = tickTime - p5sound.audiocontext.currentTime;
        if (elapsedTime - tatumTime <= -0.02) {
          return;
        } else {
          prevTick = tickTime;
          for (var i in this.syncedParts) {
            var thisPart = this.syncedParts[i];
            if (!thisPart.isPlaying)
              return;
            thisPart.incrementStep(secondsFromNow);
            for (var j in thisPart.phrases) {
              var thisPhrase = thisPart.phrases[j];
              var phraseArray = thisPhrase.sequence;
              var bNum = this.metroTicks % phraseArray.length;
              if (phraseArray[bNum] !== 0 && (this.metroTicks < phraseArray.length || !thisPhrase.looping)) {
                thisPhrase.callback(secondsFromNow, phraseArray[bNum]);
              }
            }
          }
          this.metroTicks += 1;
          this.tickCallback(secondsFromNow);
        }
      };
      p5.Metro.prototype.setBPM = function(bpm, rampTime) {
        var beatTime = 60 / (bpm * this.tatums);
        var now = p5sound.audiocontext.currentTime;
        tatumTime = beatTime;
        var rampTime = rampTime || 0;
        this.clock.frequency.setValueAtTime(this.clock.frequency.value, now);
        this.clock.frequency.linearRampToValueAtTime(bpm, now + rampTime);
        this.bpm = bpm;
      };
      p5.Metro.prototype.getBPM = function(tempo) {
        return this.clock.getRate() / this.tatums * 60;
      };
      p5.Metro.prototype._init = function() {
        this.metroTicks = 0;
      };
      p5.Metro.prototype.resetSync = function(part) {
        this.syncedParts = [part];
      };
      p5.Metro.prototype.pushSync = function(part) {
        this.syncedParts.push(part);
      };
      p5.Metro.prototype.start = function(timeFromNow) {
        var t = timeFromNow || 0;
        var now = p5sound.audiocontext.currentTime;
        this.clock.start(now + t);
        this.setBPM(this.bpm);
      };
      p5.Metro.prototype.stop = function(timeFromNow) {
        var t = timeFromNow || 0;
        var now = p5sound.audiocontext.currentTime;
        if (this.clock._oscillator) {
          this.clock.stop(now + t);
        }
      };
      p5.Metro.prototype.beatLength = function(tatums) {
        this.tatums = 1 / tatums / 4;
      };
    }(master, Tone_core_Clock);
    var looper;
    looper = function() {
      'use strict';
      var p5sound = master;
      var bpm = 120;
      p5.prototype.setBPM = function(BPM, rampTime) {
        bpm = BPM;
        for (var i in p5sound.parts) {
          p5sound.parts[i].setBPM(bpm, rampTime);
        }
      };
      p5.Phrase = function(name, callback, sequence) {
        this.phraseStep = 0;
        this.name = name;
        this.callback = callback;
        this.sequence = sequence;
      };
      p5.Part = function(steps, bLength) {
        this.length = steps || 0;
        this.partStep = 0;
        this.phrases = [];
        this.isPlaying = false;
        this.noLoop();
        this.tatums = bLength || 0.0625;
        this.metro = new p5.Metro();
        this.metro._init();
        this.metro.beatLength(this.tatums);
        this.metro.setBPM(bpm);
        p5sound.parts.push(this);
        this.callback = function() {};
      };
      p5.Part.prototype.setBPM = function(tempo, rampTime) {
        this.metro.setBPM(tempo, rampTime);
      };
      p5.Part.prototype.getBPM = function() {
        return this.metro.getBPM();
      };
      p5.Part.prototype.start = function(time) {
        if (!this.isPlaying) {
          this.isPlaying = true;
          this.metro.resetSync(this);
          var t = time || 0;
          this.metro.start(t);
        }
      };
      p5.Part.prototype.loop = function(time) {
        this.looping = true;
        this.onended = function() {
          this.partStep = 0;
        };
        var t = time || 0;
        this.start(t);
      };
      p5.Part.prototype.noLoop = function() {
        this.looping = false;
        this.onended = function() {
          this.stop();
        };
      };
      p5.Part.prototype.stop = function(time) {
        this.partStep = 0;
        this.pause(time);
      };
      p5.Part.prototype.pause = function(time) {
        this.isPlaying = false;
        var t = time || 0;
        this.metro.stop(t);
      };
      p5.Part.prototype.addPhrase = function(name, callback, array) {
        var p;
        if (arguments.length === 3) {
          p = new p5.Phrase(name, callback, array);
        } else if (arguments[0] instanceof p5.Phrase) {
          p = arguments[0];
        } else {
          throw 'invalid input. addPhrase accepts name, callback, array or a p5.Phrase';
        }
        this.phrases.push(p);
        if (p.sequence.length > this.length) {
          this.length = p.sequence.length;
        }
      };
      p5.Part.prototype.removePhrase = function(name) {
        for (var i in this.phrases) {
          if (this.phrases[i].name === name) {
            this.phrases.splice(i, 1);
          }
        }
      };
      p5.Part.prototype.getPhrase = function(name) {
        for (var i in this.phrases) {
          if (this.phrases[i].name === name) {
            return this.phrases[i];
          }
        }
      };
      p5.Part.prototype.replaceSequence = function(name, array) {
        for (var i in this.phrases) {
          if (this.phrases[i].name === name) {
            this.phrases[i].sequence = array;
          }
        }
      };
      p5.Part.prototype.incrementStep = function(time) {
        if (this.partStep < this.length - 1) {
          this.callback(time);
          this.partStep += 1;
        } else {
          if (!this.looping && this.partStep == this.length - 1) {
            console.log('done');
            this.onended();
          }
        }
      };
      p5.Part.prototype.onStep = function(callback) {
        this.callback = callback;
      };
      p5.Score = function() {
        this.parts = [];
        this.currentPart = 0;
        var thisScore = this;
        for (var i in arguments) {
          this.parts[i] = arguments[i];
          this.parts[i].nextPart = this.parts[i + 1];
          this.parts[i].onended = function() {
            thisScore.resetPart(i);
            playNextPart(thisScore);
          };
        }
        this.looping = false;
      };
      p5.Score.prototype.onended = function() {
        if (this.looping) {
          this.parts[0].start();
        } else {
          this.parts[this.parts.length - 1].onended = function() {
            this.stop();
            this.resetParts();
          };
        }
        this.currentPart = 0;
      };
      p5.Score.prototype.start = function() {
        this.parts[this.currentPart].start();
        this.scoreStep = 0;
      };
      p5.Score.prototype.stop = function() {
        this.parts[this.currentPart].stop();
        this.currentPart = 0;
        this.scoreStep = 0;
      };
      p5.Score.prototype.pause = function() {
        this.parts[this.currentPart].stop();
      };
      p5.Score.prototype.loop = function() {
        this.looping = true;
        this.start();
      };
      p5.Score.prototype.noLoop = function() {
        this.looping = false;
      };
      p5.Score.prototype.resetParts = function() {
        for (var i in this.parts) {
          this.resetPart(i);
        }
      };
      p5.Score.prototype.resetPart = function(i) {
        this.parts[i].stop();
        this.parts[i].partStep = 0;
        for (var p in this.parts[i].phrases) {
          this.parts[i].phrases[p].phraseStep = 0;
        }
      };
      p5.Score.prototype.setBPM = function(bpm, rampTime) {
        for (var i in this.parts) {
          this.parts[i].setBPM(bpm, rampTime);
        }
      };
      function playNextPart(aScore) {
        aScore.currentPart++;
        if (aScore.currentPart >= aScore.parts.length) {
          aScore.scoreStep = 0;
          aScore.onended();
        } else {
          aScore.scoreStep = 0;
          aScore.parts[aScore.currentPart - 1].stop();
          aScore.parts[aScore.currentPart].start();
        }
      }
    }(master);
    var soundRecorder;
    soundRecorder = function() {
      'use strict';
      var p5sound = master;
      var ac = p5sound.audiocontext;
      p5.SoundRecorder = function() {
        this.input = ac.createGain();
        this.output = ac.createGain();
        this.recording = false;
        this.bufferSize = 1024;
        this._channels = 2;
        this._clear();
        this._jsNode = ac.createScriptProcessor(this.bufferSize, this._channels, 2);
        this._jsNode.onaudioprocess = this._audioprocess.bind(this);
        this._callback = function() {};
        this._jsNode.connect(p5.soundOut._silentNode);
        this.setInput();
        p5sound.soundArray.push(this);
      };
      p5.SoundRecorder.prototype.setInput = function(unit) {
        this.input.disconnect();
        this.input = null;
        this.input = ac.createGain();
        this.input.connect(this._jsNode);
        this.input.connect(this.output);
        if (unit) {
          unit.connect(this.input);
        } else {
          p5.soundOut.output.connect(this.input);
        }
      };
      p5.SoundRecorder.prototype.record = function(sFile, duration, callback) {
        this.recording = true;
        if (duration) {
          this.sampleLimit = Math.round(duration * ac.sampleRate);
        }
        if (sFile && callback) {
          this._callback = function() {
            this.buffer = this._getBuffer();
            sFile.setBuffer(this.buffer);
            callback();
          };
        } else if (sFile) {
          this._callback = function() {
            this.buffer = this._getBuffer();
            sFile.setBuffer(this.buffer);
          };
        }
      };
      p5.SoundRecorder.prototype.stop = function() {
        this.recording = false;
        this._callback();
        this._clear();
      };
      p5.SoundRecorder.prototype._clear = function() {
        this._leftBuffers = [];
        this._rightBuffers = [];
        this.recordedSamples = 0;
        this.sampleLimit = null;
      };
      p5.SoundRecorder.prototype._audioprocess = function(event) {
        if (this.recording === false) {
          return;
        } else if (this.recording === true) {
          if (this.sampleLimit && this.recordedSamples >= this.sampleLimit) {
            this.stop();
          } else {
            var left = event.inputBuffer.getChannelData(0);
            var right = event.inputBuffer.getChannelData(1);
            this._leftBuffers.push(new Float32Array(left));
            this._rightBuffers.push(new Float32Array(right));
            this.recordedSamples += this.bufferSize;
          }
        }
      };
      p5.SoundRecorder.prototype._getBuffer = function() {
        var buffers = [];
        buffers.push(this._mergeBuffers(this._leftBuffers));
        buffers.push(this._mergeBuffers(this._rightBuffers));
        return buffers;
      };
      p5.SoundRecorder.prototype._mergeBuffers = function(channelBuffer) {
        var result = new Float32Array(this.recordedSamples);
        var offset = 0;
        var lng = channelBuffer.length;
        for (var i = 0; i < lng; i++) {
          var buffer = channelBuffer[i];
          result.set(buffer, offset);
          offset += buffer.length;
        }
        return result;
      };
      p5.SoundRecorder.prototype.dispose = function() {
        this._clear();
        var index = p5sound.soundArray.indexOf(this);
        p5sound.soundArray.splice(index, 1);
        this._callback = function() {};
        if (this.input) {
          this.input.disconnect();
        }
        this.input = null;
        this._jsNode = null;
      };
      p5.prototype.saveSound = function(soundFile, name) {
        var leftChannel,
            rightChannel;
        leftChannel = soundFile.buffer.getChannelData(0);
        if (soundFile.buffer.numberOfChannels > 1) {
          rightChannel = soundFile.buffer.getChannelData(1);
        } else {
          rightChannel = leftChannel;
        }
        var interleaved = interleave(leftChannel, rightChannel);
        var buffer = new ArrayBuffer(44 + interleaved.length * 2);
        var view = new DataView(buffer);
        writeUTFBytes(view, 0, 'RIFF');
        view.setUint32(4, 36 + interleaved.length * 2, true);
        writeUTFBytes(view, 8, 'WAVE');
        writeUTFBytes(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 2, true);
        view.setUint32(24, 44100, true);
        view.setUint32(28, 44100 * 4, true);
        view.setUint16(32, 4, true);
        view.setUint16(34, 16, true);
        writeUTFBytes(view, 36, 'data');
        view.setUint32(40, interleaved.length * 2, true);
        var lng = interleaved.length;
        var index = 44;
        var volume = 1;
        for (var i = 0; i < lng; i++) {
          view.setInt16(index, interleaved[i] * (32767 * volume), true);
          index += 2;
        }
        p5.prototype.writeFile([view], name, 'wav');
      };
      function interleave(leftChannel, rightChannel) {
        var length = leftChannel.length + rightChannel.length;
        var result = new Float32Array(length);
        var inputIndex = 0;
        for (var index = 0; index < length; ) {
          result[index++] = leftChannel[inputIndex];
          result[index++] = rightChannel[inputIndex];
          inputIndex++;
        }
        return result;
      }
      function writeUTFBytes(view, offset, string) {
        var lng = string.length;
        for (var i = 0; i < lng; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      }
    }(sndcore, master);
    var peakdetect;
    peakdetect = function() {
      'use strict';
      var p5sound = master;
      p5.PeakDetect = function(freq1, freq2, threshold, _framesPerPeak) {
        var framesPerPeak;
        this.framesPerPeak = _framesPerPeak || 20;
        this.framesSinceLastPeak = 0;
        this.decayRate = 0.95;
        this.threshold = threshold || 0.35;
        this.cutoff = 0;
        this.cutoffMult = 1.5;
        this.energy = 0;
        this.penergy = 0;
        this.currentValue = 0;
        this.isDetected = false;
        this.f1 = freq1 || 40;
        this.f2 = freq2 || 20000;
        this._onPeak = function() {};
      };
      p5.PeakDetect.prototype.update = function(fftObject) {
        var nrg = this.energy = fftObject.getEnergy(this.f1, this.f2) / 255;
        if (nrg > this.cutoff && nrg > this.threshold && nrg - this.penergy > 0) {
          this._onPeak();
          this.isDetected = true;
          this.cutoff = nrg * this.cutoffMult;
          this.framesSinceLastPeak = 0;
        } else {
          this.isDetected = false;
          if (this.framesSinceLastPeak <= this.framesPerPeak) {
            this.framesSinceLastPeak++;
          } else {
            this.cutoff *= this.decayRate;
            this.cutoff = Math.max(this.cutoff, this.threshold);
          }
        }
        this.currentValue = nrg;
        this.penergy = nrg;
      };
      p5.PeakDetect.prototype.onPeak = function(callback, val) {
        var self = this;
        self._onPeak = function() {
          callback(self.energy, val);
        };
      };
    }(master);
    var gain;
    gain = function() {
      'use strict';
      var p5sound = master;
      p5.Gain = function() {
        this.ac = p5sound.audiocontext;
        this.input = this.ac.createGain();
        this.output = this.ac.createGain();
        this.input.gain.value = 0.5;
        this.input.connect(this.output);
        p5sound.soundArray.push(this);
      };
      p5.Gain.prototype.setInput = function(src) {
        src.connect(this.input);
      };
      p5.Gain.prototype.connect = function(unit) {
        var u = unit || p5.soundOut.input;
        this.output.connect(u.input ? u.input : u);
      };
      p5.Gain.prototype.disconnect = function() {
        this.output.disconnect();
      };
      p5.Gain.prototype.amp = function(vol, rampTime, tFromNow) {
        var rampTime = rampTime || 0;
        var tFromNow = tFromNow || 0;
        var now = p5sound.audiocontext.currentTime;
        var currentVol = this.output.gain.value;
        this.output.gain.cancelScheduledValues(now);
        this.output.gain.linearRampToValueAtTime(currentVol, now + tFromNow);
        this.output.gain.linearRampToValueAtTime(vol, now + tFromNow + rampTime);
      };
      p5.Gain.prototype.dispose = function() {
        var index = p5sound.soundArray.indexOf(this);
        p5sound.soundArray.splice(index, 1);
        this.output.disconnect();
        this.input.disconnect();
        this.output = undefined;
        this.input = undefined;
      };
    }(master, sndcore);
    var distortion;
    distortion = function() {
      'use strict';
      var p5sound = master;
      function makeDistortionCurve(amount) {
        var k = typeof amount === 'number' ? amount : 50;
        var n_samples = 44100;
        var curve = new Float32Array(n_samples);
        var deg = Math.PI / 180;
        var i = 0;
        var x;
        for (; i < n_samples; ++i) {
          x = i * 2 / n_samples - 1;
          curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
      }
      p5.Distortion = function(amount, oversample) {
        if (typeof amount === 'undefined') {
          amount = 0.25;
        }
        if (typeof amount !== 'number') {
          throw new Error('amount must be a number');
        }
        if (typeof oversample === 'undefined') {
          oversample = '2x';
        }
        if (typeof oversample !== 'string') {
          throw new Error('oversample must be a String');
        }
        var curveAmount = p5.prototype.map(amount, 0, 1, 0, 2000);
        this.ac = p5sound.audiocontext;
        this.input = this.ac.createGain();
        this.output = this.ac.createGain();
        this.waveShaperNode = this.ac.createWaveShaper();
        this.amount = curveAmount;
        this.waveShaperNode.curve = makeDistortionCurve(curveAmount);
        this.waveShaperNode.oversample = oversample;
        this.input.connect(this.waveShaperNode);
        this.waveShaperNode.connect(this.output);
        this.connect();
        p5sound.soundArray.push(this);
      };
      p5.Distortion.prototype.process = function(src, amount, oversample) {
        src.connect(this.input);
        this.set(amount, oversample);
      };
      p5.Distortion.prototype.set = function(amount, oversample) {
        if (amount) {
          var curveAmount = p5.prototype.map(amount, 0, 1, 0, 2000);
          this.amount = curveAmount;
          this.waveShaperNode.curve = makeDistortionCurve(curveAmount);
        }
        if (oversample) {
          this.waveShaperNode.oversample = oversample;
        }
      };
      p5.Distortion.prototype.getAmount = function() {
        return this.amount;
      };
      p5.Distortion.prototype.getOversample = function() {
        return this.waveShaperNode.oversample;
      };
      p5.Distortion.prototype.connect = function(unit) {
        var u = unit || p5.soundOut.input;
        this.output.connect(u);
      };
      p5.Distortion.prototype.disconnect = function() {
        this.output.disconnect();
      };
      p5.Distortion.prototype.dispose = function() {
        var index = p5sound.soundArray.indexOf(this);
        p5sound.soundArray.splice(index, 1);
        this.input.disconnect();
        this.waveShaperNode.disconnect();
        this.input = null;
        this.waveShaperNode = null;
        if (typeof this.output !== 'undefined') {
          this.output.disconnect();
          this.output = null;
        }
      };
    }(master);
    var src_app;
    src_app = function() {
      'use strict';
      var p5SOUND = sndcore;
      return p5SOUND;
    }(sndcore, master, helpers, errorHandler, panner, soundfile, amplitude, fft, signal, oscillator, env, pulse, noise, audioin, filter, delay, reverb, metro, looper, soundRecorder, peakdetect, gain, distortion);
  }));
})(require('buffer').Buffer, require('process'));
