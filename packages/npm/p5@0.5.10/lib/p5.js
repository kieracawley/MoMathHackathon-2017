/* */ 
"format cjs";
(function(Buffer, process) {
  (function(f) {
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = f();
    } else if (typeof define === "function" && define.amd) {
      define([], f);
    } else {
      var g;
      if (typeof window !== "undefined") {
        g = window;
      } else if (typeof global !== "undefined") {
        g = global;
      } else if (typeof self !== "undefined") {
        g = self;
      } else {
        g = this;
      }
      g.p5 = f();
    }
  })(function() {
    var define,
        module,
        exports;
    return (function e(t, n, r) {
      function s(o, u) {
        if (!n[o]) {
          if (!t[o]) {
            var a = typeof require == "function" && require;
            if (!u && a)
              return a(o, !0);
            if (i)
              return i(o, !0);
            var f = new Error("Cannot find module '" + o + "'");
            throw f.code = "MODULE_NOT_FOUND", f;
          }
          var l = n[o] = {exports: {}};
          t[o][0].call(l.exports, function(e) {
            var n = t[o][1][e];
            return s(n ? n : e);
          }, l, l.exports, e, t, n, r);
        }
        return n[o].exports;
      }
      var i = typeof require == "function" && require;
      for (var o = 0; o < r.length; o++)
        s(r[o]);
      return s;
    })({
      1: [function(_dereq_, module, exports) {}, {}],
      2: [function(_dereq_, module, exports) {
        (function(process, global) {
          (function(global, factory) {
            typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : (global.ES6Promise = factory());
          }(this, (function() {
            'use strict';
            function objectOrFunction(x) {
              return typeof x === 'function' || typeof x === 'object' && x !== null;
            }
            function isFunction(x) {
              return typeof x === 'function';
            }
            var _isArray = undefined;
            if (!Array.isArray) {
              _isArray = function(x) {
                return Object.prototype.toString.call(x) === '[object Array]';
              };
            } else {
              _isArray = Array.isArray;
            }
            var isArray = _isArray;
            var len = 0;
            var vertxNext = undefined;
            var customSchedulerFn = undefined;
            var asap = function asap(callback, arg) {
              queue[len] = callback;
              queue[len + 1] = arg;
              len += 2;
              if (len === 2) {
                if (customSchedulerFn) {
                  customSchedulerFn(flush);
                } else {
                  scheduleFlush();
                }
              }
            };
            function setScheduler(scheduleFn) {
              customSchedulerFn = scheduleFn;
            }
            function setAsap(asapFn) {
              asap = asapFn;
            }
            var browserWindow = typeof window !== 'undefined' ? window : undefined;
            var browserGlobal = browserWindow || {};
            var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
            var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';
            var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';
            function useNextTick() {
              return function() {
                return process.nextTick(flush);
              };
            }
            function useVertxTimer() {
              if (typeof vertxNext !== 'undefined') {
                return function() {
                  vertxNext(flush);
                };
              }
              return useSetTimeout();
            }
            function useMutationObserver() {
              var iterations = 0;
              var observer = new BrowserMutationObserver(flush);
              var node = document.createTextNode('');
              observer.observe(node, {characterData: true});
              return function() {
                node.data = iterations = ++iterations % 2;
              };
            }
            function useMessageChannel() {
              var channel = new MessageChannel();
              channel.port1.onmessage = flush;
              return function() {
                return channel.port2.postMessage(0);
              };
            }
            function useSetTimeout() {
              var globalSetTimeout = setTimeout;
              return function() {
                return globalSetTimeout(flush, 1);
              };
            }
            var queue = new Array(1000);
            function flush() {
              for (var i = 0; i < len; i += 2) {
                var callback = queue[i];
                var arg = queue[i + 1];
                callback(arg);
                queue[i] = undefined;
                queue[i + 1] = undefined;
              }
              len = 0;
            }
            function attemptVertx() {
              try {
                var r = _dereq_;
                var vertx = r('vertx');
                vertxNext = vertx.runOnLoop || vertx.runOnContext;
                return useVertxTimer();
              } catch (e) {
                return useSetTimeout();
              }
            }
            var scheduleFlush = undefined;
            if (isNode) {
              scheduleFlush = useNextTick();
            } else if (BrowserMutationObserver) {
              scheduleFlush = useMutationObserver();
            } else if (isWorker) {
              scheduleFlush = useMessageChannel();
            } else if (browserWindow === undefined && typeof _dereq_ === 'function') {
              scheduleFlush = attemptVertx();
            } else {
              scheduleFlush = useSetTimeout();
            }
            function then(onFulfillment, onRejection) {
              var _arguments = arguments;
              var parent = this;
              var child = new this.constructor(noop);
              if (child[PROMISE_ID] === undefined) {
                makePromise(child);
              }
              var _state = parent._state;
              if (_state) {
                (function() {
                  var callback = _arguments[_state - 1];
                  asap(function() {
                    return invokeCallback(_state, child, callback, parent._result);
                  });
                })();
              } else {
                subscribe(parent, child, onFulfillment, onRejection);
              }
              return child;
            }
            function resolve(object) {
              var Constructor = this;
              if (object && typeof object === 'object' && object.constructor === Constructor) {
                return object;
              }
              var promise = new Constructor(noop);
              _resolve(promise, object);
              return promise;
            }
            var PROMISE_ID = Math.random().toString(36).substring(16);
            function noop() {}
            var PENDING = void 0;
            var FULFILLED = 1;
            var REJECTED = 2;
            var GET_THEN_ERROR = new ErrorObject();
            function selfFulfillment() {
              return new TypeError("You cannot resolve a promise with itself");
            }
            function cannotReturnOwn() {
              return new TypeError('A promises callback cannot return that same promise.');
            }
            function getThen(promise) {
              try {
                return promise.then;
              } catch (error) {
                GET_THEN_ERROR.error = error;
                return GET_THEN_ERROR;
              }
            }
            function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
              try {
                then.call(value, fulfillmentHandler, rejectionHandler);
              } catch (e) {
                return e;
              }
            }
            function handleForeignThenable(promise, thenable, then) {
              asap(function(promise) {
                var sealed = false;
                var error = tryThen(then, thenable, function(value) {
                  if (sealed) {
                    return;
                  }
                  sealed = true;
                  if (thenable !== value) {
                    _resolve(promise, value);
                  } else {
                    fulfill(promise, value);
                  }
                }, function(reason) {
                  if (sealed) {
                    return;
                  }
                  sealed = true;
                  _reject(promise, reason);
                }, 'Settle: ' + (promise._label || ' unknown promise'));
                if (!sealed && error) {
                  sealed = true;
                  _reject(promise, error);
                }
              }, promise);
            }
            function handleOwnThenable(promise, thenable) {
              if (thenable._state === FULFILLED) {
                fulfill(promise, thenable._result);
              } else if (thenable._state === REJECTED) {
                _reject(promise, thenable._result);
              } else {
                subscribe(thenable, undefined, function(value) {
                  return _resolve(promise, value);
                }, function(reason) {
                  return _reject(promise, reason);
                });
              }
            }
            function handleMaybeThenable(promise, maybeThenable, then$$) {
              if (maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve) {
                handleOwnThenable(promise, maybeThenable);
              } else {
                if (then$$ === GET_THEN_ERROR) {
                  _reject(promise, GET_THEN_ERROR.error);
                } else if (then$$ === undefined) {
                  fulfill(promise, maybeThenable);
                } else if (isFunction(then$$)) {
                  handleForeignThenable(promise, maybeThenable, then$$);
                } else {
                  fulfill(promise, maybeThenable);
                }
              }
            }
            function _resolve(promise, value) {
              if (promise === value) {
                _reject(promise, selfFulfillment());
              } else if (objectOrFunction(value)) {
                handleMaybeThenable(promise, value, getThen(value));
              } else {
                fulfill(promise, value);
              }
            }
            function publishRejection(promise) {
              if (promise._onerror) {
                promise._onerror(promise._result);
              }
              publish(promise);
            }
            function fulfill(promise, value) {
              if (promise._state !== PENDING) {
                return;
              }
              promise._result = value;
              promise._state = FULFILLED;
              if (promise._subscribers.length !== 0) {
                asap(publish, promise);
              }
            }
            function _reject(promise, reason) {
              if (promise._state !== PENDING) {
                return;
              }
              promise._state = REJECTED;
              promise._result = reason;
              asap(publishRejection, promise);
            }
            function subscribe(parent, child, onFulfillment, onRejection) {
              var _subscribers = parent._subscribers;
              var length = _subscribers.length;
              parent._onerror = null;
              _subscribers[length] = child;
              _subscribers[length + FULFILLED] = onFulfillment;
              _subscribers[length + REJECTED] = onRejection;
              if (length === 0 && parent._state) {
                asap(publish, parent);
              }
            }
            function publish(promise) {
              var subscribers = promise._subscribers;
              var settled = promise._state;
              if (subscribers.length === 0) {
                return;
              }
              var child = undefined,
                  callback = undefined,
                  detail = promise._result;
              for (var i = 0; i < subscribers.length; i += 3) {
                child = subscribers[i];
                callback = subscribers[i + settled];
                if (child) {
                  invokeCallback(settled, child, callback, detail);
                } else {
                  callback(detail);
                }
              }
              promise._subscribers.length = 0;
            }
            function ErrorObject() {
              this.error = null;
            }
            var TRY_CATCH_ERROR = new ErrorObject();
            function tryCatch(callback, detail) {
              try {
                return callback(detail);
              } catch (e) {
                TRY_CATCH_ERROR.error = e;
                return TRY_CATCH_ERROR;
              }
            }
            function invokeCallback(settled, promise, callback, detail) {
              var hasCallback = isFunction(callback),
                  value = undefined,
                  error = undefined,
                  succeeded = undefined,
                  failed = undefined;
              if (hasCallback) {
                value = tryCatch(callback, detail);
                if (value === TRY_CATCH_ERROR) {
                  failed = true;
                  error = value.error;
                  value = null;
                } else {
                  succeeded = true;
                }
                if (promise === value) {
                  _reject(promise, cannotReturnOwn());
                  return;
                }
              } else {
                value = detail;
                succeeded = true;
              }
              if (promise._state !== PENDING) {} else if (hasCallback && succeeded) {
                _resolve(promise, value);
              } else if (failed) {
                _reject(promise, error);
              } else if (settled === FULFILLED) {
                fulfill(promise, value);
              } else if (settled === REJECTED) {
                _reject(promise, value);
              }
            }
            function initializePromise(promise, resolver) {
              try {
                resolver(function resolvePromise(value) {
                  _resolve(promise, value);
                }, function rejectPromise(reason) {
                  _reject(promise, reason);
                });
              } catch (e) {
                _reject(promise, e);
              }
            }
            var id = 0;
            function nextId() {
              return id++;
            }
            function makePromise(promise) {
              promise[PROMISE_ID] = id++;
              promise._state = undefined;
              promise._result = undefined;
              promise._subscribers = [];
            }
            function Enumerator(Constructor, input) {
              this._instanceConstructor = Constructor;
              this.promise = new Constructor(noop);
              if (!this.promise[PROMISE_ID]) {
                makePromise(this.promise);
              }
              if (isArray(input)) {
                this._input = input;
                this.length = input.length;
                this._remaining = input.length;
                this._result = new Array(this.length);
                if (this.length === 0) {
                  fulfill(this.promise, this._result);
                } else {
                  this.length = this.length || 0;
                  this._enumerate();
                  if (this._remaining === 0) {
                    fulfill(this.promise, this._result);
                  }
                }
              } else {
                _reject(this.promise, validationError());
              }
            }
            function validationError() {
              return new Error('Array Methods must be provided an Array');
            }
            ;
            Enumerator.prototype._enumerate = function() {
              var length = this.length;
              var _input = this._input;
              for (var i = 0; this._state === PENDING && i < length; i++) {
                this._eachEntry(_input[i], i);
              }
            };
            Enumerator.prototype._eachEntry = function(entry, i) {
              var c = this._instanceConstructor;
              var resolve$$ = c.resolve;
              if (resolve$$ === resolve) {
                var _then = getThen(entry);
                if (_then === then && entry._state !== PENDING) {
                  this._settledAt(entry._state, i, entry._result);
                } else if (typeof _then !== 'function') {
                  this._remaining--;
                  this._result[i] = entry;
                } else if (c === Promise) {
                  var promise = new c(noop);
                  handleMaybeThenable(promise, entry, _then);
                  this._willSettleAt(promise, i);
                } else {
                  this._willSettleAt(new c(function(resolve$$) {
                    return resolve$$(entry);
                  }), i);
                }
              } else {
                this._willSettleAt(resolve$$(entry), i);
              }
            };
            Enumerator.prototype._settledAt = function(state, i, value) {
              var promise = this.promise;
              if (promise._state === PENDING) {
                this._remaining--;
                if (state === REJECTED) {
                  _reject(promise, value);
                } else {
                  this._result[i] = value;
                }
              }
              if (this._remaining === 0) {
                fulfill(promise, this._result);
              }
            };
            Enumerator.prototype._willSettleAt = function(promise, i) {
              var enumerator = this;
              subscribe(promise, undefined, function(value) {
                return enumerator._settledAt(FULFILLED, i, value);
              }, function(reason) {
                return enumerator._settledAt(REJECTED, i, reason);
              });
            };
            function all(entries) {
              return new Enumerator(this, entries).promise;
            }
            function race(entries) {
              var Constructor = this;
              if (!isArray(entries)) {
                return new Constructor(function(_, reject) {
                  return reject(new TypeError('You must pass an array to race.'));
                });
              } else {
                return new Constructor(function(resolve, reject) {
                  var length = entries.length;
                  for (var i = 0; i < length; i++) {
                    Constructor.resolve(entries[i]).then(resolve, reject);
                  }
                });
              }
            }
            function reject(reason) {
              var Constructor = this;
              var promise = new Constructor(noop);
              _reject(promise, reason);
              return promise;
            }
            function needsResolver() {
              throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
            }
            function needsNew() {
              throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
            }
            function Promise(resolver) {
              this[PROMISE_ID] = nextId();
              this._result = this._state = undefined;
              this._subscribers = [];
              if (noop !== resolver) {
                typeof resolver !== 'function' && needsResolver();
                this instanceof Promise ? initializePromise(this, resolver) : needsNew();
              }
            }
            Promise.all = all;
            Promise.race = race;
            Promise.resolve = resolve;
            Promise.reject = reject;
            Promise._setScheduler = setScheduler;
            Promise._setAsap = setAsap;
            Promise._asap = asap;
            Promise.prototype = {
              constructor: Promise,
              then: then,
              'catch': function _catch(onRejection) {
                return this.then(null, onRejection);
              }
            };
            function polyfill() {
              var local = undefined;
              if (typeof global !== 'undefined') {
                local = global;
              } else if (typeof self !== 'undefined') {
                local = self;
              } else {
                try {
                  local = Function('return this')();
                } catch (e) {
                  throw new Error('polyfill failed because global object is unavailable in this environment');
                }
              }
              var P = local.Promise;
              if (P) {
                var promiseToString = null;
                try {
                  promiseToString = Object.prototype.toString.call(P.resolve());
                } catch (e) {}
                if (promiseToString === '[object Promise]' && !P.cast) {
                  return;
                }
              }
              local.Promise = Promise;
            }
            Promise.polyfill = polyfill;
            Promise.Promise = Promise;
            return Promise;
          })));
        }).call(this, _dereq_('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
      }, {"_process": 31}],
      3: [function(_dereq_, module, exports) {
        (function(global, factory) {
          if (typeof define === 'function' && define.amd) {
            define(['exports', 'module'], factory);
          } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
            factory(exports, module);
          } else {
            var mod = {exports: {}};
            factory(mod.exports, mod);
            global.fetchJsonp = mod.exports;
          }
        })(this, function(exports, module) {
          'use strict';
          var defaultOptions = {
            timeout: 5000,
            jsonpCallback: 'callback',
            jsonpCallbackFunction: null
          };
          function generateCallbackFunction() {
            return 'jsonp_' + Date.now() + '_' + Math.ceil(Math.random() * 100000);
          }
          function clearFunction(functionName) {
            try {
              delete window[functionName];
            } catch (e) {
              window[functionName] = undefined;
            }
          }
          function removeScript(scriptId) {
            var script = document.getElementById(scriptId);
            document.getElementsByTagName('head')[0].removeChild(script);
          }
          function fetchJsonp(_url) {
            var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
            var url = _url;
            var timeout = options.timeout || defaultOptions.timeout;
            var jsonpCallback = options.jsonpCallback || defaultOptions.jsonpCallback;
            var timeoutId = undefined;
            return new Promise(function(resolve, reject) {
              var callbackFunction = options.jsonpCallbackFunction || generateCallbackFunction();
              var scriptId = jsonpCallback + '_' + callbackFunction;
              window[callbackFunction] = function(response) {
                resolve({
                  ok: true,
                  json: function json() {
                    return Promise.resolve(response);
                  }
                });
                if (timeoutId)
                  clearTimeout(timeoutId);
                removeScript(scriptId);
                clearFunction(callbackFunction);
              };
              url += url.indexOf('?') === -1 ? '?' : '&';
              var jsonpScript = document.createElement('script');
              jsonpScript.setAttribute('src', '' + url + jsonpCallback + '=' + callbackFunction);
              jsonpScript.id = scriptId;
              document.getElementsByTagName('head')[0].appendChild(jsonpScript);
              timeoutId = setTimeout(function() {
                reject(new Error('JSONP request to ' + _url + ' timed out'));
                clearFunction(callbackFunction);
                removeScript(scriptId);
              }, timeout);
            });
          }
          module.exports = fetchJsonp;
        });
      }, {}],
      4: [function(_dereq_, module, exports) {
        'use strict';
        exports.argument = function(predicate, message) {
          if (!predicate) {
            throw new Error(message);
          }
        };
        exports.assert = exports.argument;
      }, {}],
      5: [function(_dereq_, module, exports) {
        'use strict';
        function line(ctx, x1, y1, x2, y2) {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        exports.line = line;
      }, {}],
      6: [function(_dereq_, module, exports) {
        'use strict';
        var cffStandardStrings = ['.notdef', 'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent', 'ampersand', 'quoteright', 'parenleft', 'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash', 'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'colon', 'semicolon', 'less', 'equal', 'greater', 'question', 'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright', 'asciicircum', 'underscore', 'quoteleft', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'braceleft', 'bar', 'braceright', 'asciitilde', 'exclamdown', 'cent', 'sterling', 'fraction', 'yen', 'florin', 'section', 'currency', 'quotesingle', 'quotedblleft', 'guillemotleft', 'guilsinglleft', 'guilsinglright', 'fi', 'fl', 'endash', 'dagger', 'daggerdbl', 'periodcentered', 'paragraph', 'bullet', 'quotesinglbase', 'quotedblbase', 'quotedblright', 'guillemotright', 'ellipsis', 'perthousand', 'questiondown', 'grave', 'acute', 'circumflex', 'tilde', 'macron', 'breve', 'dotaccent', 'dieresis', 'ring', 'cedilla', 'hungarumlaut', 'ogonek', 'caron', 'emdash', 'AE', 'ordfeminine', 'Lslash', 'Oslash', 'OE', 'ordmasculine', 'ae', 'dotlessi', 'lslash', 'oslash', 'oe', 'germandbls', 'onesuperior', 'logicalnot', 'mu', 'trademark', 'Eth', 'onehalf', 'plusminus', 'Thorn', 'onequarter', 'divide', 'brokenbar', 'degree', 'thorn', 'threequarters', 'twosuperior', 'registered', 'minus', 'eth', 'multiply', 'threesuperior', 'copyright', 'Aacute', 'Acircumflex', 'Adieresis', 'Agrave', 'Aring', 'Atilde', 'Ccedilla', 'Eacute', 'Ecircumflex', 'Edieresis', 'Egrave', 'Iacute', 'Icircumflex', 'Idieresis', 'Igrave', 'Ntilde', 'Oacute', 'Ocircumflex', 'Odieresis', 'Ograve', 'Otilde', 'Scaron', 'Uacute', 'Ucircumflex', 'Udieresis', 'Ugrave', 'Yacute', 'Ydieresis', 'Zcaron', 'aacute', 'acircumflex', 'adieresis', 'agrave', 'aring', 'atilde', 'ccedilla', 'eacute', 'ecircumflex', 'edieresis', 'egrave', 'iacute', 'icircumflex', 'idieresis', 'igrave', 'ntilde', 'oacute', 'ocircumflex', 'odieresis', 'ograve', 'otilde', 'scaron', 'uacute', 'ucircumflex', 'udieresis', 'ugrave', 'yacute', 'ydieresis', 'zcaron', 'exclamsmall', 'Hungarumlautsmall', 'dollaroldstyle', 'dollarsuperior', 'ampersandsmall', 'Acutesmall', 'parenleftsuperior', 'parenrightsuperior', '266 ff', 'onedotenleader', 'zerooldstyle', 'oneoldstyle', 'twooldstyle', 'threeoldstyle', 'fouroldstyle', 'fiveoldstyle', 'sixoldstyle', 'sevenoldstyle', 'eightoldstyle', 'nineoldstyle', 'commasuperior', 'threequartersemdash', 'periodsuperior', 'questionsmall', 'asuperior', 'bsuperior', 'centsuperior', 'dsuperior', 'esuperior', 'isuperior', 'lsuperior', 'msuperior', 'nsuperior', 'osuperior', 'rsuperior', 'ssuperior', 'tsuperior', 'ff', 'ffi', 'ffl', 'parenleftinferior', 'parenrightinferior', 'Circumflexsmall', 'hyphensuperior', 'Gravesmall', 'Asmall', 'Bsmall', 'Csmall', 'Dsmall', 'Esmall', 'Fsmall', 'Gsmall', 'Hsmall', 'Ismall', 'Jsmall', 'Ksmall', 'Lsmall', 'Msmall', 'Nsmall', 'Osmall', 'Psmall', 'Qsmall', 'Rsmall', 'Ssmall', 'Tsmall', 'Usmall', 'Vsmall', 'Wsmall', 'Xsmall', 'Ysmall', 'Zsmall', 'colonmonetary', 'onefitted', 'rupiah', 'Tildesmall', 'exclamdownsmall', 'centoldstyle', 'Lslashsmall', 'Scaronsmall', 'Zcaronsmall', 'Dieresissmall', 'Brevesmall', 'Caronsmall', 'Dotaccentsmall', 'Macronsmall', 'figuredash', 'hypheninferior', 'Ogoneksmall', 'Ringsmall', 'Cedillasmall', 'questiondownsmall', 'oneeighth', 'threeeighths', 'fiveeighths', 'seveneighths', 'onethird', 'twothirds', 'zerosuperior', 'foursuperior', 'fivesuperior', 'sixsuperior', 'sevensuperior', 'eightsuperior', 'ninesuperior', 'zeroinferior', 'oneinferior', 'twoinferior', 'threeinferior', 'fourinferior', 'fiveinferior', 'sixinferior', 'seveninferior', 'eightinferior', 'nineinferior', 'centinferior', 'dollarinferior', 'periodinferior', 'commainferior', 'Agravesmall', 'Aacutesmall', 'Acircumflexsmall', 'Atildesmall', 'Adieresissmall', 'Aringsmall', 'AEsmall', 'Ccedillasmall', 'Egravesmall', 'Eacutesmall', 'Ecircumflexsmall', 'Edieresissmall', 'Igravesmall', 'Iacutesmall', 'Icircumflexsmall', 'Idieresissmall', 'Ethsmall', 'Ntildesmall', 'Ogravesmall', 'Oacutesmall', 'Ocircumflexsmall', 'Otildesmall', 'Odieresissmall', 'OEsmall', 'Oslashsmall', 'Ugravesmall', 'Uacutesmall', 'Ucircumflexsmall', 'Udieresissmall', 'Yacutesmall', 'Thornsmall', 'Ydieresissmall', '001.000', '001.001', '001.002', '001.003', 'Black', 'Bold', 'Book', 'Light', 'Medium', 'Regular', 'Roman', 'Semibold'];
        var cffStandardEncoding = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent', 'ampersand', 'quoteright', 'parenleft', 'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash', 'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'colon', 'semicolon', 'less', 'equal', 'greater', 'question', 'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright', 'asciicircum', 'underscore', 'quoteleft', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'braceleft', 'bar', 'braceright', 'asciitilde', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'exclamdown', 'cent', 'sterling', 'fraction', 'yen', 'florin', 'section', 'currency', 'quotesingle', 'quotedblleft', 'guillemotleft', 'guilsinglleft', 'guilsinglright', 'fi', 'fl', '', 'endash', 'dagger', 'daggerdbl', 'periodcentered', '', 'paragraph', 'bullet', 'quotesinglbase', 'quotedblbase', 'quotedblright', 'guillemotright', 'ellipsis', 'perthousand', '', 'questiondown', '', 'grave', 'acute', 'circumflex', 'tilde', 'macron', 'breve', 'dotaccent', 'dieresis', '', 'ring', 'cedilla', '', 'hungarumlaut', 'ogonek', 'caron', 'emdash', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'AE', '', 'ordfeminine', '', '', '', '', 'Lslash', 'Oslash', 'OE', 'ordmasculine', '', '', '', '', '', 'ae', '', '', '', 'dotlessi', '', '', 'lslash', 'oslash', 'oe', 'germandbls'];
        var cffExpertEncoding = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'space', 'exclamsmall', 'Hungarumlautsmall', '', 'dollaroldstyle', 'dollarsuperior', 'ampersandsmall', 'Acutesmall', 'parenleftsuperior', 'parenrightsuperior', 'twodotenleader', 'onedotenleader', 'comma', 'hyphen', 'period', 'fraction', 'zerooldstyle', 'oneoldstyle', 'twooldstyle', 'threeoldstyle', 'fouroldstyle', 'fiveoldstyle', 'sixoldstyle', 'sevenoldstyle', 'eightoldstyle', 'nineoldstyle', 'colon', 'semicolon', 'commasuperior', 'threequartersemdash', 'periodsuperior', 'questionsmall', '', 'asuperior', 'bsuperior', 'centsuperior', 'dsuperior', 'esuperior', '', '', 'isuperior', '', '', 'lsuperior', 'msuperior', 'nsuperior', 'osuperior', '', '', 'rsuperior', 'ssuperior', 'tsuperior', '', 'ff', 'fi', 'fl', 'ffi', 'ffl', 'parenleftinferior', '', 'parenrightinferior', 'Circumflexsmall', 'hyphensuperior', 'Gravesmall', 'Asmall', 'Bsmall', 'Csmall', 'Dsmall', 'Esmall', 'Fsmall', 'Gsmall', 'Hsmall', 'Ismall', 'Jsmall', 'Ksmall', 'Lsmall', 'Msmall', 'Nsmall', 'Osmall', 'Psmall', 'Qsmall', 'Rsmall', 'Ssmall', 'Tsmall', 'Usmall', 'Vsmall', 'Wsmall', 'Xsmall', 'Ysmall', 'Zsmall', 'colonmonetary', 'onefitted', 'rupiah', 'Tildesmall', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'exclamdownsmall', 'centoldstyle', 'Lslashsmall', '', '', 'Scaronsmall', 'Zcaronsmall', 'Dieresissmall', 'Brevesmall', 'Caronsmall', '', 'Dotaccentsmall', '', '', 'Macronsmall', '', '', 'figuredash', 'hypheninferior', '', '', 'Ogoneksmall', 'Ringsmall', 'Cedillasmall', '', '', '', 'onequarter', 'onehalf', 'threequarters', 'questiondownsmall', 'oneeighth', 'threeeighths', 'fiveeighths', 'seveneighths', 'onethird', 'twothirds', '', '', 'zerosuperior', 'onesuperior', 'twosuperior', 'threesuperior', 'foursuperior', 'fivesuperior', 'sixsuperior', 'sevensuperior', 'eightsuperior', 'ninesuperior', 'zeroinferior', 'oneinferior', 'twoinferior', 'threeinferior', 'fourinferior', 'fiveinferior', 'sixinferior', 'seveninferior', 'eightinferior', 'nineinferior', 'centinferior', 'dollarinferior', 'periodinferior', 'commainferior', 'Agravesmall', 'Aacutesmall', 'Acircumflexsmall', 'Atildesmall', 'Adieresissmall', 'Aringsmall', 'AEsmall', 'Ccedillasmall', 'Egravesmall', 'Eacutesmall', 'Ecircumflexsmall', 'Edieresissmall', 'Igravesmall', 'Iacutesmall', 'Icircumflexsmall', 'Idieresissmall', 'Ethsmall', 'Ntildesmall', 'Ogravesmall', 'Oacutesmall', 'Ocircumflexsmall', 'Otildesmall', 'Odieresissmall', 'OEsmall', 'Oslashsmall', 'Ugravesmall', 'Uacutesmall', 'Ucircumflexsmall', 'Udieresissmall', 'Yacutesmall', 'Thornsmall', 'Ydieresissmall'];
        var standardNames = ['.notdef', '.null', 'nonmarkingreturn', 'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent', 'ampersand', 'quotesingle', 'parenleft', 'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash', 'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'colon', 'semicolon', 'less', 'equal', 'greater', 'question', 'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright', 'asciicircum', 'underscore', 'grave', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'braceleft', 'bar', 'braceright', 'asciitilde', 'Adieresis', 'Aring', 'Ccedilla', 'Eacute', 'Ntilde', 'Odieresis', 'Udieresis', 'aacute', 'agrave', 'acircumflex', 'adieresis', 'atilde', 'aring', 'ccedilla', 'eacute', 'egrave', 'ecircumflex', 'edieresis', 'iacute', 'igrave', 'icircumflex', 'idieresis', 'ntilde', 'oacute', 'ograve', 'ocircumflex', 'odieresis', 'otilde', 'uacute', 'ugrave', 'ucircumflex', 'udieresis', 'dagger', 'degree', 'cent', 'sterling', 'section', 'bullet', 'paragraph', 'germandbls', 'registered', 'copyright', 'trademark', 'acute', 'dieresis', 'notequal', 'AE', 'Oslash', 'infinity', 'plusminus', 'lessequal', 'greaterequal', 'yen', 'mu', 'partialdiff', 'summation', 'product', 'pi', 'integral', 'ordfeminine', 'ordmasculine', 'Omega', 'ae', 'oslash', 'questiondown', 'exclamdown', 'logicalnot', 'radical', 'florin', 'approxequal', 'Delta', 'guillemotleft', 'guillemotright', 'ellipsis', 'nonbreakingspace', 'Agrave', 'Atilde', 'Otilde', 'OE', 'oe', 'endash', 'emdash', 'quotedblleft', 'quotedblright', 'quoteleft', 'quoteright', 'divide', 'lozenge', 'ydieresis', 'Ydieresis', 'fraction', 'currency', 'guilsinglleft', 'guilsinglright', 'fi', 'fl', 'daggerdbl', 'periodcentered', 'quotesinglbase', 'quotedblbase', 'perthousand', 'Acircumflex', 'Ecircumflex', 'Aacute', 'Edieresis', 'Egrave', 'Iacute', 'Icircumflex', 'Idieresis', 'Igrave', 'Oacute', 'Ocircumflex', 'apple', 'Ograve', 'Uacute', 'Ucircumflex', 'Ugrave', 'dotlessi', 'circumflex', 'tilde', 'macron', 'breve', 'dotaccent', 'ring', 'cedilla', 'hungarumlaut', 'ogonek', 'caron', 'Lslash', 'lslash', 'Scaron', 'scaron', 'Zcaron', 'zcaron', 'brokenbar', 'Eth', 'eth', 'Yacute', 'yacute', 'Thorn', 'thorn', 'minus', 'multiply', 'onesuperior', 'twosuperior', 'threesuperior', 'onehalf', 'onequarter', 'threequarters', 'franc', 'Gbreve', 'gbreve', 'Idotaccent', 'Scedilla', 'scedilla', 'Cacute', 'cacute', 'Ccaron', 'ccaron', 'dcroat'];
        function DefaultEncoding(font) {
          this.font = font;
        }
        DefaultEncoding.prototype.charToGlyphIndex = function(c) {
          var code = c.charCodeAt(0);
          var glyphs = this.font.glyphs;
          if (glyphs) {
            for (var i = 0; i < glyphs.length; i += 1) {
              var glyph = glyphs.get(i);
              for (var j = 0; j < glyph.unicodes.length; j += 1) {
                if (glyph.unicodes[j] === code) {
                  return i;
                }
              }
            }
          } else {
            return null;
          }
        };
        function CmapEncoding(cmap) {
          this.cmap = cmap;
        }
        CmapEncoding.prototype.charToGlyphIndex = function(c) {
          return this.cmap.glyphIndexMap[c.charCodeAt(0)] || 0;
        };
        function CffEncoding(encoding, charset) {
          this.encoding = encoding;
          this.charset = charset;
        }
        CffEncoding.prototype.charToGlyphIndex = function(s) {
          var code = s.charCodeAt(0);
          var charName = this.encoding[code];
          return this.charset.indexOf(charName);
        };
        function GlyphNames(post) {
          var i;
          switch (post.version) {
            case 1:
              this.names = exports.standardNames.slice();
              break;
            case 2:
              this.names = new Array(post.numberOfGlyphs);
              for (i = 0; i < post.numberOfGlyphs; i++) {
                if (post.glyphNameIndex[i] < exports.standardNames.length) {
                  this.names[i] = exports.standardNames[post.glyphNameIndex[i]];
                } else {
                  this.names[i] = post.names[post.glyphNameIndex[i] - exports.standardNames.length];
                }
              }
              break;
            case 2.5:
              this.names = new Array(post.numberOfGlyphs);
              for (i = 0; i < post.numberOfGlyphs; i++) {
                this.names[i] = exports.standardNames[i + post.glyphNameIndex[i]];
              }
              break;
            case 3:
              this.names = [];
              break;
          }
        }
        GlyphNames.prototype.nameToGlyphIndex = function(name) {
          return this.names.indexOf(name);
        };
        GlyphNames.prototype.glyphIndexToName = function(gid) {
          return this.names[gid];
        };
        function addGlyphNames(font) {
          var glyph;
          var glyphIndexMap = font.tables.cmap.glyphIndexMap;
          var charCodes = Object.keys(glyphIndexMap);
          for (var i = 0; i < charCodes.length; i += 1) {
            var c = charCodes[i];
            var glyphIndex = glyphIndexMap[c];
            glyph = font.glyphs.get(glyphIndex);
            glyph.addUnicode(parseInt(c));
          }
          for (i = 0; i < font.glyphs.length; i += 1) {
            glyph = font.glyphs.get(i);
            if (font.cffEncoding) {
              glyph.name = font.cffEncoding.charset[i];
            } else {
              glyph.name = font.glyphNames.glyphIndexToName(i);
            }
          }
        }
        exports.cffStandardStrings = cffStandardStrings;
        exports.cffStandardEncoding = cffStandardEncoding;
        exports.cffExpertEncoding = cffExpertEncoding;
        exports.standardNames = standardNames;
        exports.DefaultEncoding = DefaultEncoding;
        exports.CmapEncoding = CmapEncoding;
        exports.CffEncoding = CffEncoding;
        exports.GlyphNames = GlyphNames;
        exports.addGlyphNames = addGlyphNames;
      }, {}],
      7: [function(_dereq_, module, exports) {
        'use strict';
        var path = _dereq_('./path');
        var sfnt = _dereq_('./tables/sfnt');
        var encoding = _dereq_('./encoding');
        var glyphset = _dereq_('./glyphset');
        function Font(options) {
          options = options || {};
          this.names = {
            fontFamily: {en: options.familyName || ' '},
            fontSubfamily: {en: options.styleName || ' '},
            designer: {en: options.designer || ' '},
            designerURL: {en: options.designerURL || ' '},
            manufacturer: {en: options.manufacturer || ' '},
            manufacturerURL: {en: options.manufacturerURL || ' '},
            license: {en: options.license || ' '},
            licenseURL: {en: options.licenseURL || ' '},
            version: {en: options.version || 'Version 0.1'},
            description: {en: options.description || ' '},
            copyright: {en: options.copyright || ' '},
            trademark: {en: options.trademark || ' '}
          };
          this.unitsPerEm = options.unitsPerEm || 1000;
          this.ascender = options.ascender;
          this.descender = options.descender;
          this.supported = true;
          this.glyphs = new glyphset.GlyphSet(this, options.glyphs || []);
          this.encoding = new encoding.DefaultEncoding(this);
          this.tables = {};
        }
        Font.prototype.hasChar = function(c) {
          return this.encoding.charToGlyphIndex(c) !== null;
        };
        Font.prototype.charToGlyphIndex = function(s) {
          return this.encoding.charToGlyphIndex(s);
        };
        Font.prototype.charToGlyph = function(c) {
          var glyphIndex = this.charToGlyphIndex(c);
          var glyph = this.glyphs.get(glyphIndex);
          if (!glyph) {
            glyph = this.glyphs.get(0);
          }
          return glyph;
        };
        Font.prototype.stringToGlyphs = function(s) {
          var glyphs = [];
          for (var i = 0; i < s.length; i += 1) {
            var c = s[i];
            glyphs.push(this.charToGlyph(c));
          }
          return glyphs;
        };
        Font.prototype.nameToGlyphIndex = function(name) {
          return this.glyphNames.nameToGlyphIndex(name);
        };
        Font.prototype.nameToGlyph = function(name) {
          var glyphIndex = this.nametoGlyphIndex(name);
          var glyph = this.glyphs.get(glyphIndex);
          if (!glyph) {
            glyph = this.glyphs.get(0);
          }
          return glyph;
        };
        Font.prototype.glyphIndexToName = function(gid) {
          if (!this.glyphNames.glyphIndexToName) {
            return '';
          }
          return this.glyphNames.glyphIndexToName(gid);
        };
        Font.prototype.getKerningValue = function(leftGlyph, rightGlyph) {
          leftGlyph = leftGlyph.index || leftGlyph;
          rightGlyph = rightGlyph.index || rightGlyph;
          var gposKerning = this.getGposKerningValue;
          return gposKerning ? gposKerning(leftGlyph, rightGlyph) : (this.kerningPairs[leftGlyph + ',' + rightGlyph] || 0);
        };
        Font.prototype.forEachGlyph = function(text, x, y, fontSize, options, callback) {
          x = x !== undefined ? x : 0;
          y = y !== undefined ? y : 0;
          fontSize = fontSize !== undefined ? fontSize : 72;
          options = options || {};
          var kerning = options.kerning === undefined ? true : options.kerning;
          var fontScale = 1 / this.unitsPerEm * fontSize;
          var glyphs = this.stringToGlyphs(text);
          for (var i = 0; i < glyphs.length; i += 1) {
            var glyph = glyphs[i];
            callback(glyph, x, y, fontSize, options);
            if (glyph.advanceWidth) {
              x += glyph.advanceWidth * fontScale;
            }
            if (kerning && i < glyphs.length - 1) {
              var kerningValue = this.getKerningValue(glyph, glyphs[i + 1]);
              x += kerningValue * fontScale;
            }
          }
        };
        Font.prototype.getPath = function(text, x, y, fontSize, options) {
          var fullPath = new path.Path();
          this.forEachGlyph(text, x, y, fontSize, options, function(glyph, gX, gY, gFontSize) {
            var glyphPath = glyph.getPath(gX, gY, gFontSize);
            fullPath.extend(glyphPath);
          });
          return fullPath;
        };
        Font.prototype.draw = function(ctx, text, x, y, fontSize, options) {
          this.getPath(text, x, y, fontSize, options).draw(ctx);
        };
        Font.prototype.drawPoints = function(ctx, text, x, y, fontSize, options) {
          this.forEachGlyph(text, x, y, fontSize, options, function(glyph, gX, gY, gFontSize) {
            glyph.drawPoints(ctx, gX, gY, gFontSize);
          });
        };
        Font.prototype.drawMetrics = function(ctx, text, x, y, fontSize, options) {
          this.forEachGlyph(text, x, y, fontSize, options, function(glyph, gX, gY, gFontSize) {
            glyph.drawMetrics(ctx, gX, gY, gFontSize);
          });
        };
        Font.prototype.getEnglishName = function(name) {
          var translations = this.names[name];
          if (translations) {
            return translations.en;
          }
        };
        Font.prototype.validate = function() {
          var warnings = [];
          var _this = this;
          function assert(predicate, message) {
            if (!predicate) {
              warnings.push(message);
            }
          }
          function assertNamePresent(name) {
            var englishName = _this.getEnglishName(name);
            assert(englishName && englishName.trim().length > 0, 'No English ' + name + ' specified.');
          }
          assertNamePresent('fontFamily');
          assertNamePresent('weightName');
          assertNamePresent('manufacturer');
          assertNamePresent('copyright');
          assertNamePresent('version');
          assert(this.unitsPerEm > 0, 'No unitsPerEm specified.');
        };
        Font.prototype.toTables = function() {
          return sfnt.fontToTable(this);
        };
        Font.prototype.toBuffer = function() {
          var sfntTable = this.toTables();
          var bytes = sfntTable.encode();
          var buffer = new ArrayBuffer(bytes.length);
          var intArray = new Uint8Array(buffer);
          for (var i = 0; i < bytes.length; i++) {
            intArray[i] = bytes[i];
          }
          return buffer;
        };
        Font.prototype.download = function() {
          var familyName = this.getEnglishName('fontFamily');
          var styleName = this.getEnglishName('fontSubfamily');
          var fileName = familyName.replace(/\s/g, '') + '-' + styleName + '.otf';
          var buffer = this.toBuffer();
          window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
          window.requestFileSystem(window.TEMPORARY, buffer.byteLength, function(fs) {
            fs.root.getFile(fileName, {create: true}, function(fileEntry) {
              fileEntry.createWriter(function(writer) {
                var dataView = new DataView(buffer);
                var blob = new Blob([dataView], {type: 'font/opentype'});
                writer.write(blob);
                writer.addEventListener('writeend', function() {
                  location.href = fileEntry.toURL();
                }, false);
              });
            });
          }, function(err) {
            throw err;
          });
        };
        exports.Font = Font;
      }, {
        "./encoding": 6,
        "./glyphset": 9,
        "./path": 12,
        "./tables/sfnt": 29
      }],
      8: [function(_dereq_, module, exports) {
        'use strict';
        var check = _dereq_('./check');
        var draw = _dereq_('./draw');
        var path = _dereq_('./path');
        function getPathDefinition(glyph, path) {
          var _path = path || {commands: []};
          return {
            configurable: true,
            get: function() {
              if (typeof _path === 'function') {
                _path = _path();
              }
              return _path;
            },
            set: function(p) {
              _path = p;
            }
          };
        }
        function Glyph(options) {
          this.bindConstructorValues(options);
        }
        Glyph.prototype.bindConstructorValues = function(options) {
          this.index = options.index || 0;
          this.name = options.name || null;
          this.unicode = options.unicode || undefined;
          this.unicodes = options.unicodes || options.unicode !== undefined ? [options.unicode] : [];
          if (options.xMin) {
            this.xMin = options.xMin;
          }
          if (options.yMin) {
            this.yMin = options.yMin;
          }
          if (options.xMax) {
            this.xMax = options.xMax;
          }
          if (options.yMax) {
            this.yMax = options.yMax;
          }
          if (options.advanceWidth) {
            this.advanceWidth = options.advanceWidth;
          }
          Object.defineProperty(this, 'path', getPathDefinition(this, options.path));
        };
        Glyph.prototype.addUnicode = function(unicode) {
          if (this.unicodes.length === 0) {
            this.unicode = unicode;
          }
          this.unicodes.push(unicode);
        };
        Glyph.prototype.getPath = function(x, y, fontSize) {
          x = x !== undefined ? x : 0;
          y = y !== undefined ? y : 0;
          fontSize = fontSize !== undefined ? fontSize : 72;
          var scale = 1 / this.path.unitsPerEm * fontSize;
          var p = new path.Path();
          var commands = this.path.commands;
          for (var i = 0; i < commands.length; i += 1) {
            var cmd = commands[i];
            if (cmd.type === 'M') {
              p.moveTo(x + (cmd.x * scale), y + (-cmd.y * scale));
            } else if (cmd.type === 'L') {
              p.lineTo(x + (cmd.x * scale), y + (-cmd.y * scale));
            } else if (cmd.type === 'Q') {
              p.quadraticCurveTo(x + (cmd.x1 * scale), y + (-cmd.y1 * scale), x + (cmd.x * scale), y + (-cmd.y * scale));
            } else if (cmd.type === 'C') {
              p.curveTo(x + (cmd.x1 * scale), y + (-cmd.y1 * scale), x + (cmd.x2 * scale), y + (-cmd.y2 * scale), x + (cmd.x * scale), y + (-cmd.y * scale));
            } else if (cmd.type === 'Z') {
              p.closePath();
            }
          }
          return p;
        };
        Glyph.prototype.getContours = function() {
          if (this.points === undefined) {
            return [];
          }
          var contours = [];
          var currentContour = [];
          for (var i = 0; i < this.points.length; i += 1) {
            var pt = this.points[i];
            currentContour.push(pt);
            if (pt.lastPointOfContour) {
              contours.push(currentContour);
              currentContour = [];
            }
          }
          check.argument(currentContour.length === 0, 'There are still points left in the current contour.');
          return contours;
        };
        Glyph.prototype.getMetrics = function() {
          var commands = this.path.commands;
          var xCoords = [];
          var yCoords = [];
          for (var i = 0; i < commands.length; i += 1) {
            var cmd = commands[i];
            if (cmd.type !== 'Z') {
              xCoords.push(cmd.x);
              yCoords.push(cmd.y);
            }
            if (cmd.type === 'Q' || cmd.type === 'C') {
              xCoords.push(cmd.x1);
              yCoords.push(cmd.y1);
            }
            if (cmd.type === 'C') {
              xCoords.push(cmd.x2);
              yCoords.push(cmd.y2);
            }
          }
          var metrics = {
            xMin: Math.min.apply(null, xCoords),
            yMin: Math.min.apply(null, yCoords),
            xMax: Math.max.apply(null, xCoords),
            yMax: Math.max.apply(null, yCoords),
            leftSideBearing: 0
          };
          if (!isFinite(metrics.xMin)) {
            metrics.xMin = 0;
          }
          if (!isFinite(metrics.xMax)) {
            metrics.xMax = this.advanceWidth;
          }
          if (!isFinite(metrics.yMin)) {
            metrics.yMin = 0;
          }
          if (!isFinite(metrics.yMax)) {
            metrics.yMax = 0;
          }
          metrics.rightSideBearing = this.advanceWidth - metrics.leftSideBearing - (metrics.xMax - metrics.xMin);
          return metrics;
        };
        Glyph.prototype.draw = function(ctx, x, y, fontSize) {
          this.getPath(x, y, fontSize).draw(ctx);
        };
        Glyph.prototype.drawPoints = function(ctx, x, y, fontSize) {
          function drawCircles(l, x, y, scale) {
            var PI_SQ = Math.PI * 2;
            ctx.beginPath();
            for (var j = 0; j < l.length; j += 1) {
              ctx.moveTo(x + (l[j].x * scale), y + (l[j].y * scale));
              ctx.arc(x + (l[j].x * scale), y + (l[j].y * scale), 2, 0, PI_SQ, false);
            }
            ctx.closePath();
            ctx.fill();
          }
          x = x !== undefined ? x : 0;
          y = y !== undefined ? y : 0;
          fontSize = fontSize !== undefined ? fontSize : 24;
          var scale = 1 / this.path.unitsPerEm * fontSize;
          var blueCircles = [];
          var redCircles = [];
          var path = this.path;
          for (var i = 0; i < path.commands.length; i += 1) {
            var cmd = path.commands[i];
            if (cmd.x !== undefined) {
              blueCircles.push({
                x: cmd.x,
                y: -cmd.y
              });
            }
            if (cmd.x1 !== undefined) {
              redCircles.push({
                x: cmd.x1,
                y: -cmd.y1
              });
            }
            if (cmd.x2 !== undefined) {
              redCircles.push({
                x: cmd.x2,
                y: -cmd.y2
              });
            }
          }
          ctx.fillStyle = 'blue';
          drawCircles(blueCircles, x, y, scale);
          ctx.fillStyle = 'red';
          drawCircles(redCircles, x, y, scale);
        };
        Glyph.prototype.drawMetrics = function(ctx, x, y, fontSize) {
          var scale;
          x = x !== undefined ? x : 0;
          y = y !== undefined ? y : 0;
          fontSize = fontSize !== undefined ? fontSize : 24;
          scale = 1 / this.path.unitsPerEm * fontSize;
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'black';
          draw.line(ctx, x, -10000, x, 10000);
          draw.line(ctx, -10000, y, 10000, y);
          var xMin = this.xMin || 0;
          var yMin = this.yMin || 0;
          var xMax = this.xMax || 0;
          var yMax = this.yMax || 0;
          var advanceWidth = this.advanceWidth || 0;
          ctx.strokeStyle = 'blue';
          draw.line(ctx, x + (xMin * scale), -10000, x + (xMin * scale), 10000);
          draw.line(ctx, x + (xMax * scale), -10000, x + (xMax * scale), 10000);
          draw.line(ctx, -10000, y + (-yMin * scale), 10000, y + (-yMin * scale));
          draw.line(ctx, -10000, y + (-yMax * scale), 10000, y + (-yMax * scale));
          ctx.strokeStyle = 'green';
          draw.line(ctx, x + (advanceWidth * scale), -10000, x + (advanceWidth * scale), 10000);
        };
        exports.Glyph = Glyph;
      }, {
        "./check": 4,
        "./draw": 5,
        "./path": 12
      }],
      9: [function(_dereq_, module, exports) {
        'use strict';
        var _glyph = _dereq_('./glyph');
        function GlyphSet(font, glyphs) {
          this.font = font;
          this.glyphs = {};
          if (Array.isArray(glyphs)) {
            for (var i = 0; i < glyphs.length; i++) {
              this.glyphs[i] = glyphs[i];
            }
          }
          this.length = (glyphs && glyphs.length) || 0;
        }
        GlyphSet.prototype.get = function(index) {
          if (typeof this.glyphs[index] === 'function') {
            this.glyphs[index] = this.glyphs[index]();
          }
          return this.glyphs[index];
        };
        GlyphSet.prototype.push = function(index, loader) {
          this.glyphs[index] = loader;
          this.length++;
        };
        function glyphLoader(font, index) {
          return new _glyph.Glyph({
            index: index,
            font: font
          });
        }
        function ttfGlyphLoader(font, index, parseGlyph, data, position, buildPath) {
          return function() {
            var glyph = new _glyph.Glyph({
              index: index,
              font: font
            });
            glyph.path = function() {
              parseGlyph(glyph, data, position);
              var path = buildPath(font.glyphs, glyph);
              path.unitsPerEm = font.unitsPerEm;
              return path;
            };
            return glyph;
          };
        }
        function cffGlyphLoader(font, index, parseCFFCharstring, charstring) {
          return function() {
            var glyph = new _glyph.Glyph({
              index: index,
              font: font
            });
            glyph.path = function() {
              var path = parseCFFCharstring(font, glyph, charstring);
              path.unitsPerEm = font.unitsPerEm;
              return path;
            };
            return glyph;
          };
        }
        exports.GlyphSet = GlyphSet;
        exports.glyphLoader = glyphLoader;
        exports.ttfGlyphLoader = ttfGlyphLoader;
        exports.cffGlyphLoader = cffGlyphLoader;
      }, {"./glyph": 8}],
      10: [function(_dereq_, module, exports) {
        'use strict';
        var encoding = _dereq_('./encoding');
        var _font = _dereq_('./font');
        var glyph = _dereq_('./glyph');
        var parse = _dereq_('./parse');
        var path = _dereq_('./path');
        var cmap = _dereq_('./tables/cmap');
        var cff = _dereq_('./tables/cff');
        var fvar = _dereq_('./tables/fvar');
        var glyf = _dereq_('./tables/glyf');
        var gpos = _dereq_('./tables/gpos');
        var head = _dereq_('./tables/head');
        var hhea = _dereq_('./tables/hhea');
        var hmtx = _dereq_('./tables/hmtx');
        var kern = _dereq_('./tables/kern');
        var ltag = _dereq_('./tables/ltag');
        var loca = _dereq_('./tables/loca');
        var maxp = _dereq_('./tables/maxp');
        var _name = _dereq_('./tables/name');
        var os2 = _dereq_('./tables/os2');
        var post = _dereq_('./tables/post');
        function toArrayBuffer(buffer) {
          var arrayBuffer = new ArrayBuffer(buffer.length);
          var data = new Uint8Array(arrayBuffer);
          for (var i = 0; i < buffer.length; i += 1) {
            data[i] = buffer[i];
          }
          return arrayBuffer;
        }
        function loadFromFile(path, callback) {
          var fs = _dereq_('fs');
          fs.readFile(path, function(err, buffer) {
            if (err) {
              return callback(err.message);
            }
            callback(null, toArrayBuffer(buffer));
          });
        }
        function loadFromUrl(url, callback) {
          var request = new XMLHttpRequest();
          request.open('get', url, true);
          request.responseType = 'arraybuffer';
          request.onload = function() {
            if (request.status !== 200) {
              return callback('Font could not be loaded: ' + request.statusText);
            }
            return callback(null, request.response);
          };
          request.send();
        }
        function parseBuffer(buffer) {
          var indexToLocFormat;
          var ltagTable;
          var cffOffset;
          var fvarOffset;
          var glyfOffset;
          var gposOffset;
          var hmtxOffset;
          var kernOffset;
          var locaOffset;
          var nameOffset;
          var font = new _font.Font();
          var data = new DataView(buffer, 0);
          var version = parse.getFixed(data, 0);
          if (version === 1.0) {
            font.outlinesFormat = 'truetype';
          } else {
            version = parse.getTag(data, 0);
            if (version === 'OTTO') {
              font.outlinesFormat = 'cff';
            } else {
              throw new Error('Unsupported OpenType version ' + version);
            }
          }
          var numTables = parse.getUShort(data, 4);
          var p = 12;
          for (var i = 0; i < numTables; i += 1) {
            var tag = parse.getTag(data, p);
            var offset = parse.getULong(data, p + 8);
            switch (tag) {
              case 'cmap':
                font.tables.cmap = cmap.parse(data, offset);
                font.encoding = new encoding.CmapEncoding(font.tables.cmap);
                break;
              case 'fvar':
                fvarOffset = offset;
                break;
              case 'head':
                font.tables.head = head.parse(data, offset);
                font.unitsPerEm = font.tables.head.unitsPerEm;
                indexToLocFormat = font.tables.head.indexToLocFormat;
                break;
              case 'hhea':
                font.tables.hhea = hhea.parse(data, offset);
                font.ascender = font.tables.hhea.ascender;
                font.descender = font.tables.hhea.descender;
                font.numberOfHMetrics = font.tables.hhea.numberOfHMetrics;
                break;
              case 'hmtx':
                hmtxOffset = offset;
                break;
              case 'ltag':
                ltagTable = ltag.parse(data, offset);
                break;
              case 'maxp':
                font.tables.maxp = maxp.parse(data, offset);
                font.numGlyphs = font.tables.maxp.numGlyphs;
                break;
              case 'name':
                nameOffset = offset;
                break;
              case 'OS/2':
                font.tables.os2 = os2.parse(data, offset);
                break;
              case 'post':
                font.tables.post = post.parse(data, offset);
                font.glyphNames = new encoding.GlyphNames(font.tables.post);
                break;
              case 'glyf':
                glyfOffset = offset;
                break;
              case 'loca':
                locaOffset = offset;
                break;
              case 'CFF ':
                cffOffset = offset;
                break;
              case 'kern':
                kernOffset = offset;
                break;
              case 'GPOS':
                gposOffset = offset;
                break;
            }
            p += 16;
          }
          font.tables.name = _name.parse(data, nameOffset, ltagTable);
          font.names = font.tables.name;
          if (glyfOffset && locaOffset) {
            var shortVersion = indexToLocFormat === 0;
            var locaTable = loca.parse(data, locaOffset, font.numGlyphs, shortVersion);
            font.glyphs = glyf.parse(data, glyfOffset, locaTable, font);
          } else if (cffOffset) {
            cff.parse(data, cffOffset, font);
          } else {
            throw new Error('Font doesn\'t contain TrueType or CFF outlines.');
          }
          hmtx.parse(data, hmtxOffset, font.numberOfHMetrics, font.numGlyphs, font.glyphs);
          encoding.addGlyphNames(font);
          if (kernOffset) {
            font.kerningPairs = kern.parse(data, kernOffset);
          } else {
            font.kerningPairs = {};
          }
          if (gposOffset) {
            gpos.parse(data, gposOffset, font);
          }
          if (fvarOffset) {
            font.tables.fvar = fvar.parse(data, fvarOffset, font.names);
          }
          return font;
        }
        function load(url, callback) {
          var isNode = typeof window === 'undefined';
          var loadFn = isNode ? loadFromFile : loadFromUrl;
          loadFn(url, function(err, arrayBuffer) {
            if (err) {
              return callback(err);
            }
            var font = parseBuffer(arrayBuffer);
            return callback(null, font);
          });
        }
        function loadSync(url) {
          var fs = _dereq_('fs');
          var buffer = fs.readFileSync(url);
          return parseBuffer(toArrayBuffer(buffer));
        }
        exports._parse = parse;
        exports.Font = _font.Font;
        exports.Glyph = glyph.Glyph;
        exports.Path = path.Path;
        exports.parse = parseBuffer;
        exports.load = load;
        exports.loadSync = loadSync;
      }, {
        "./encoding": 6,
        "./font": 7,
        "./glyph": 8,
        "./parse": 11,
        "./path": 12,
        "./tables/cff": 14,
        "./tables/cmap": 15,
        "./tables/fvar": 16,
        "./tables/glyf": 17,
        "./tables/gpos": 18,
        "./tables/head": 19,
        "./tables/hhea": 20,
        "./tables/hmtx": 21,
        "./tables/kern": 22,
        "./tables/loca": 23,
        "./tables/ltag": 24,
        "./tables/maxp": 25,
        "./tables/name": 26,
        "./tables/os2": 27,
        "./tables/post": 28,
        "fs": 1
      }],
      11: [function(_dereq_, module, exports) {
        'use strict';
        exports.getByte = function getByte(dataView, offset) {
          return dataView.getUint8(offset);
        };
        exports.getCard8 = exports.getByte;
        exports.getUShort = function(dataView, offset) {
          return dataView.getUint16(offset, false);
        };
        exports.getCard16 = exports.getUShort;
        exports.getShort = function(dataView, offset) {
          return dataView.getInt16(offset, false);
        };
        exports.getULong = function(dataView, offset) {
          return dataView.getUint32(offset, false);
        };
        exports.getFixed = function(dataView, offset) {
          var decimal = dataView.getInt16(offset, false);
          var fraction = dataView.getUint16(offset + 2, false);
          return decimal + fraction / 65535;
        };
        exports.getTag = function(dataView, offset) {
          var tag = '';
          for (var i = offset; i < offset + 4; i += 1) {
            tag += String.fromCharCode(dataView.getInt8(i));
          }
          return tag;
        };
        exports.getOffset = function(dataView, offset, offSize) {
          var v = 0;
          for (var i = 0; i < offSize; i += 1) {
            v <<= 8;
            v += dataView.getUint8(offset + i);
          }
          return v;
        };
        exports.getBytes = function(dataView, startOffset, endOffset) {
          var bytes = [];
          for (var i = startOffset; i < endOffset; i += 1) {
            bytes.push(dataView.getUint8(i));
          }
          return bytes;
        };
        exports.bytesToString = function(bytes) {
          var s = '';
          for (var i = 0; i < bytes.length; i += 1) {
            s += String.fromCharCode(bytes[i]);
          }
          return s;
        };
        var typeOffsets = {
          byte: 1,
          uShort: 2,
          short: 2,
          uLong: 4,
          fixed: 4,
          longDateTime: 8,
          tag: 4
        };
        function Parser(data, offset) {
          this.data = data;
          this.offset = offset;
          this.relativeOffset = 0;
        }
        Parser.prototype.parseByte = function() {
          var v = this.data.getUint8(this.offset + this.relativeOffset);
          this.relativeOffset += 1;
          return v;
        };
        Parser.prototype.parseChar = function() {
          var v = this.data.getInt8(this.offset + this.relativeOffset);
          this.relativeOffset += 1;
          return v;
        };
        Parser.prototype.parseCard8 = Parser.prototype.parseByte;
        Parser.prototype.parseUShort = function() {
          var v = this.data.getUint16(this.offset + this.relativeOffset);
          this.relativeOffset += 2;
          return v;
        };
        Parser.prototype.parseCard16 = Parser.prototype.parseUShort;
        Parser.prototype.parseSID = Parser.prototype.parseUShort;
        Parser.prototype.parseOffset16 = Parser.prototype.parseUShort;
        Parser.prototype.parseShort = function() {
          var v = this.data.getInt16(this.offset + this.relativeOffset);
          this.relativeOffset += 2;
          return v;
        };
        Parser.prototype.parseF2Dot14 = function() {
          var v = this.data.getInt16(this.offset + this.relativeOffset) / 16384;
          this.relativeOffset += 2;
          return v;
        };
        Parser.prototype.parseULong = function() {
          var v = exports.getULong(this.data, this.offset + this.relativeOffset);
          this.relativeOffset += 4;
          return v;
        };
        Parser.prototype.parseFixed = function() {
          var v = exports.getFixed(this.data, this.offset + this.relativeOffset);
          this.relativeOffset += 4;
          return v;
        };
        Parser.prototype.parseOffset16List = Parser.prototype.parseUShortList = function(count) {
          var offsets = new Array(count);
          var dataView = this.data;
          var offset = this.offset + this.relativeOffset;
          for (var i = 0; i < count; i++) {
            offsets[i] = exports.getUShort(dataView, offset);
            offset += 2;
          }
          this.relativeOffset += count * 2;
          return offsets;
        };
        Parser.prototype.parseString = function(length) {
          var dataView = this.data;
          var offset = this.offset + this.relativeOffset;
          var string = '';
          this.relativeOffset += length;
          for (var i = 0; i < length; i++) {
            string += String.fromCharCode(dataView.getUint8(offset + i));
          }
          return string;
        };
        Parser.prototype.parseTag = function() {
          return this.parseString(4);
        };
        Parser.prototype.parseLongDateTime = function() {
          var v = exports.getULong(this.data, this.offset + this.relativeOffset + 4);
          this.relativeOffset += 8;
          return v;
        };
        Parser.prototype.parseFixed = function() {
          var v = exports.getULong(this.data, this.offset + this.relativeOffset);
          this.relativeOffset += 4;
          return v / 65536;
        };
        Parser.prototype.parseVersion = function() {
          var major = exports.getUShort(this.data, this.offset + this.relativeOffset);
          var minor = exports.getUShort(this.data, this.offset + this.relativeOffset + 2);
          this.relativeOffset += 4;
          return major + minor / 0x1000 / 10;
        };
        Parser.prototype.skip = function(type, amount) {
          if (amount === undefined) {
            amount = 1;
          }
          this.relativeOffset += typeOffsets[type] * amount;
        };
        exports.Parser = Parser;
      }, {}],
      12: [function(_dereq_, module, exports) {
        'use strict';
        function Path() {
          this.commands = [];
          this.fill = 'black';
          this.stroke = null;
          this.strokeWidth = 1;
        }
        Path.prototype.moveTo = function(x, y) {
          this.commands.push({
            type: 'M',
            x: x,
            y: y
          });
        };
        Path.prototype.lineTo = function(x, y) {
          this.commands.push({
            type: 'L',
            x: x,
            y: y
          });
        };
        Path.prototype.curveTo = Path.prototype.bezierCurveTo = function(x1, y1, x2, y2, x, y) {
          this.commands.push({
            type: 'C',
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            x: x,
            y: y
          });
        };
        Path.prototype.quadTo = Path.prototype.quadraticCurveTo = function(x1, y1, x, y) {
          this.commands.push({
            type: 'Q',
            x1: x1,
            y1: y1,
            x: x,
            y: y
          });
        };
        Path.prototype.close = Path.prototype.closePath = function() {
          this.commands.push({type: 'Z'});
        };
        Path.prototype.extend = function(pathOrCommands) {
          if (pathOrCommands.commands) {
            pathOrCommands = pathOrCommands.commands;
          }
          Array.prototype.push.apply(this.commands, pathOrCommands);
        };
        Path.prototype.draw = function(ctx) {
          ctx.beginPath();
          for (var i = 0; i < this.commands.length; i += 1) {
            var cmd = this.commands[i];
            if (cmd.type === 'M') {
              ctx.moveTo(cmd.x, cmd.y);
            } else if (cmd.type === 'L') {
              ctx.lineTo(cmd.x, cmd.y);
            } else if (cmd.type === 'C') {
              ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
            } else if (cmd.type === 'Q') {
              ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
            } else if (cmd.type === 'Z') {
              ctx.closePath();
            }
          }
          if (this.fill) {
            ctx.fillStyle = this.fill;
            ctx.fill();
          }
          if (this.stroke) {
            ctx.strokeStyle = this.stroke;
            ctx.lineWidth = this.strokeWidth;
            ctx.stroke();
          }
        };
        Path.prototype.toPathData = function(decimalPlaces) {
          decimalPlaces = decimalPlaces !== undefined ? decimalPlaces : 2;
          function floatToString(v) {
            if (Math.round(v) === v) {
              return '' + Math.round(v);
            } else {
              return v.toFixed(decimalPlaces);
            }
          }
          function packValues() {
            var s = '';
            for (var i = 0; i < arguments.length; i += 1) {
              var v = arguments[i];
              if (v >= 0 && i > 0) {
                s += ' ';
              }
              s += floatToString(v);
            }
            return s;
          }
          var d = '';
          for (var i = 0; i < this.commands.length; i += 1) {
            var cmd = this.commands[i];
            if (cmd.type === 'M') {
              d += 'M' + packValues(cmd.x, cmd.y);
            } else if (cmd.type === 'L') {
              d += 'L' + packValues(cmd.x, cmd.y);
            } else if (cmd.type === 'C') {
              d += 'C' + packValues(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
            } else if (cmd.type === 'Q') {
              d += 'Q' + packValues(cmd.x1, cmd.y1, cmd.x, cmd.y);
            } else if (cmd.type === 'Z') {
              d += 'Z';
            }
          }
          return d;
        };
        Path.prototype.toSVG = function(decimalPlaces) {
          var svg = '<path d="';
          svg += this.toPathData(decimalPlaces);
          svg += '"';
          if (this.fill & this.fill !== 'black') {
            if (this.fill === null) {
              svg += ' fill="none"';
            } else {
              svg += ' fill="' + this.fill + '"';
            }
          }
          if (this.stroke) {
            svg += ' stroke="' + this.stroke + '" stroke-width="' + this.strokeWidth + '"';
          }
          svg += '/>';
          return svg;
        };
        exports.Path = Path;
      }, {}],
      13: [function(_dereq_, module, exports) {
        'use strict';
        var check = _dereq_('./check');
        var encode = _dereq_('./types').encode;
        var sizeOf = _dereq_('./types').sizeOf;
        function Table(tableName, fields, options) {
          var i;
          for (i = 0; i < fields.length; i += 1) {
            var field = fields[i];
            this[field.name] = field.value;
          }
          this.tableName = tableName;
          this.fields = fields;
          if (options) {
            var optionKeys = Object.keys(options);
            for (i = 0; i < optionKeys.length; i += 1) {
              var k = optionKeys[i];
              var v = options[k];
              if (this[k] !== undefined) {
                this[k] = v;
              }
            }
          }
        }
        Table.prototype.sizeOf = function() {
          var v = 0;
          for (var i = 0; i < this.fields.length; i += 1) {
            var field = this.fields[i];
            var value = this[field.name];
            if (value === undefined) {
              value = field.value;
            }
            if (typeof value.sizeOf === 'function') {
              v += value.sizeOf();
            } else {
              var sizeOfFunction = sizeOf[field.type];
              check.assert(typeof sizeOfFunction === 'function', 'Could not find sizeOf function for field' + field.name);
              v += sizeOfFunction(value);
            }
          }
          return v;
        };
        Table.prototype.encode = function() {
          return encode.TABLE(this);
        };
        exports.Table = Table;
      }, {
        "./check": 4,
        "./types": 30
      }],
      14: [function(_dereq_, module, exports) {
        'use strict';
        var encoding = _dereq_('../encoding');
        var glyphset = _dereq_('../glyphset');
        var parse = _dereq_('../parse');
        var path = _dereq_('../path');
        var table = _dereq_('../table');
        function equals(a, b) {
          if (a === b) {
            return true;
          } else if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) {
              return false;
            }
            for (var i = 0; i < a.length; i += 1) {
              if (!equals(a[i], b[i])) {
                return false;
              }
            }
            return true;
          } else {
            return false;
          }
        }
        function parseCFFIndex(data, start, conversionFn) {
          var offsets = [];
          var objects = [];
          var count = parse.getCard16(data, start);
          var i;
          var objectOffset;
          var endOffset;
          if (count !== 0) {
            var offsetSize = parse.getByte(data, start + 2);
            objectOffset = start + ((count + 1) * offsetSize) + 2;
            var pos = start + 3;
            for (i = 0; i < count + 1; i += 1) {
              offsets.push(parse.getOffset(data, pos, offsetSize));
              pos += offsetSize;
            }
            endOffset = objectOffset + offsets[count];
          } else {
            endOffset = start + 2;
          }
          for (i = 0; i < offsets.length - 1; i += 1) {
            var value = parse.getBytes(data, objectOffset + offsets[i], objectOffset + offsets[i + 1]);
            if (conversionFn) {
              value = conversionFn(value);
            }
            objects.push(value);
          }
          return {
            objects: objects,
            startOffset: start,
            endOffset: endOffset
          };
        }
        function parseFloatOperand(parser) {
          var s = '';
          var eof = 15;
          var lookup = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', 'E', 'E-', null, '-'];
          while (true) {
            var b = parser.parseByte();
            var n1 = b >> 4;
            var n2 = b & 15;
            if (n1 === eof) {
              break;
            }
            s += lookup[n1];
            if (n2 === eof) {
              break;
            }
            s += lookup[n2];
          }
          return parseFloat(s);
        }
        function parseOperand(parser, b0) {
          var b1;
          var b2;
          var b3;
          var b4;
          if (b0 === 28) {
            b1 = parser.parseByte();
            b2 = parser.parseByte();
            return b1 << 8 | b2;
          }
          if (b0 === 29) {
            b1 = parser.parseByte();
            b2 = parser.parseByte();
            b3 = parser.parseByte();
            b4 = parser.parseByte();
            return b1 << 24 | b2 << 16 | b3 << 8 | b4;
          }
          if (b0 === 30) {
            return parseFloatOperand(parser);
          }
          if (b0 >= 32 && b0 <= 246) {
            return b0 - 139;
          }
          if (b0 >= 247 && b0 <= 250) {
            b1 = parser.parseByte();
            return (b0 - 247) * 256 + b1 + 108;
          }
          if (b0 >= 251 && b0 <= 254) {
            b1 = parser.parseByte();
            return -(b0 - 251) * 256 - b1 - 108;
          }
          throw new Error('Invalid b0 ' + b0);
        }
        function entriesToObject(entries) {
          var o = {};
          for (var i = 0; i < entries.length; i += 1) {
            var key = entries[i][0];
            var values = entries[i][1];
            var value;
            if (values.length === 1) {
              value = values[0];
            } else {
              value = values;
            }
            if (o.hasOwnProperty(key)) {
              throw new Error('Object ' + o + ' already has key ' + key);
            }
            o[key] = value;
          }
          return o;
        }
        function parseCFFDict(data, start, size) {
          start = start !== undefined ? start : 0;
          var parser = new parse.Parser(data, start);
          var entries = [];
          var operands = [];
          size = size !== undefined ? size : data.length;
          while (parser.relativeOffset < size) {
            var op = parser.parseByte();
            if (op <= 21) {
              if (op === 12) {
                op = 1200 + parser.parseByte();
              }
              entries.push([op, operands]);
              operands = [];
            } else {
              operands.push(parseOperand(parser, op));
            }
          }
          return entriesToObject(entries);
        }
        function getCFFString(strings, index) {
          if (index <= 390) {
            index = encoding.cffStandardStrings[index];
          } else {
            index = strings[index - 391];
          }
          return index;
        }
        function interpretDict(dict, meta, strings) {
          var newDict = {};
          for (var i = 0; i < meta.length; i += 1) {
            var m = meta[i];
            var value = dict[m.op];
            if (value === undefined) {
              value = m.value !== undefined ? m.value : null;
            }
            if (m.type === 'SID') {
              value = getCFFString(strings, value);
            }
            newDict[m.name] = value;
          }
          return newDict;
        }
        function parseCFFHeader(data, start) {
          var header = {};
          header.formatMajor = parse.getCard8(data, start);
          header.formatMinor = parse.getCard8(data, start + 1);
          header.size = parse.getCard8(data, start + 2);
          header.offsetSize = parse.getCard8(data, start + 3);
          header.startOffset = start;
          header.endOffset = start + 4;
          return header;
        }
        var TOP_DICT_META = [{
          name: 'version',
          op: 0,
          type: 'SID'
        }, {
          name: 'notice',
          op: 1,
          type: 'SID'
        }, {
          name: 'copyright',
          op: 1200,
          type: 'SID'
        }, {
          name: 'fullName',
          op: 2,
          type: 'SID'
        }, {
          name: 'familyName',
          op: 3,
          type: 'SID'
        }, {
          name: 'weight',
          op: 4,
          type: 'SID'
        }, {
          name: 'isFixedPitch',
          op: 1201,
          type: 'number',
          value: 0
        }, {
          name: 'italicAngle',
          op: 1202,
          type: 'number',
          value: 0
        }, {
          name: 'underlinePosition',
          op: 1203,
          type: 'number',
          value: -100
        }, {
          name: 'underlineThickness',
          op: 1204,
          type: 'number',
          value: 50
        }, {
          name: 'paintType',
          op: 1205,
          type: 'number',
          value: 0
        }, {
          name: 'charstringType',
          op: 1206,
          type: 'number',
          value: 2
        }, {
          name: 'fontMatrix',
          op: 1207,
          type: ['real', 'real', 'real', 'real', 'real', 'real'],
          value: [0.001, 0, 0, 0.001, 0, 0]
        }, {
          name: 'uniqueId',
          op: 13,
          type: 'number'
        }, {
          name: 'fontBBox',
          op: 5,
          type: ['number', 'number', 'number', 'number'],
          value: [0, 0, 0, 0]
        }, {
          name: 'strokeWidth',
          op: 1208,
          type: 'number',
          value: 0
        }, {
          name: 'xuid',
          op: 14,
          type: [],
          value: null
        }, {
          name: 'charset',
          op: 15,
          type: 'offset',
          value: 0
        }, {
          name: 'encoding',
          op: 16,
          type: 'offset',
          value: 0
        }, {
          name: 'charStrings',
          op: 17,
          type: 'offset',
          value: 0
        }, {
          name: 'private',
          op: 18,
          type: ['number', 'offset'],
          value: [0, 0]
        }];
        var PRIVATE_DICT_META = [{
          name: 'subrs',
          op: 19,
          type: 'offset',
          value: 0
        }, {
          name: 'defaultWidthX',
          op: 20,
          type: 'number',
          value: 0
        }, {
          name: 'nominalWidthX',
          op: 21,
          type: 'number',
          value: 0
        }];
        function parseCFFTopDict(data, strings) {
          var dict = parseCFFDict(data, 0, data.byteLength);
          return interpretDict(dict, TOP_DICT_META, strings);
        }
        function parseCFFPrivateDict(data, start, size, strings) {
          var dict = parseCFFDict(data, start, size);
          return interpretDict(dict, PRIVATE_DICT_META, strings);
        }
        function parseCFFCharset(data, start, nGlyphs, strings) {
          var i;
          var sid;
          var count;
          var parser = new parse.Parser(data, start);
          nGlyphs -= 1;
          var charset = ['.notdef'];
          var format = parser.parseCard8();
          if (format === 0) {
            for (i = 0; i < nGlyphs; i += 1) {
              sid = parser.parseSID();
              charset.push(getCFFString(strings, sid));
            }
          } else if (format === 1) {
            while (charset.length <= nGlyphs) {
              sid = parser.parseSID();
              count = parser.parseCard8();
              for (i = 0; i <= count; i += 1) {
                charset.push(getCFFString(strings, sid));
                sid += 1;
              }
            }
          } else if (format === 2) {
            while (charset.length <= nGlyphs) {
              sid = parser.parseSID();
              count = parser.parseCard16();
              for (i = 0; i <= count; i += 1) {
                charset.push(getCFFString(strings, sid));
                sid += 1;
              }
            }
          } else {
            throw new Error('Unknown charset format ' + format);
          }
          return charset;
        }
        function parseCFFEncoding(data, start, charset) {
          var i;
          var code;
          var enc = {};
          var parser = new parse.Parser(data, start);
          var format = parser.parseCard8();
          if (format === 0) {
            var nCodes = parser.parseCard8();
            for (i = 0; i < nCodes; i += 1) {
              code = parser.parseCard8();
              enc[code] = i;
            }
          } else if (format === 1) {
            var nRanges = parser.parseCard8();
            code = 1;
            for (i = 0; i < nRanges; i += 1) {
              var first = parser.parseCard8();
              var nLeft = parser.parseCard8();
              for (var j = first; j <= first + nLeft; j += 1) {
                enc[j] = code;
                code += 1;
              }
            }
          } else {
            throw new Error('Unknown encoding format ' + format);
          }
          return new encoding.CffEncoding(enc, charset);
        }
        function parseCFFCharstring(font, glyph, code) {
          var c1x;
          var c1y;
          var c2x;
          var c2y;
          var p = new path.Path();
          var stack = [];
          var nStems = 0;
          var haveWidth = false;
          var width = font.defaultWidthX;
          var open = false;
          var x = 0;
          var y = 0;
          function newContour(x, y) {
            if (open) {
              p.closePath();
            }
            p.moveTo(x, y);
            open = true;
          }
          function parseStems() {
            var hasWidthArg;
            hasWidthArg = stack.length % 2 !== 0;
            if (hasWidthArg && !haveWidth) {
              width = stack.shift() + font.nominalWidthX;
            }
            nStems += stack.length >> 1;
            stack.length = 0;
            haveWidth = true;
          }
          function parse(code) {
            var b1;
            var b2;
            var b3;
            var b4;
            var codeIndex;
            var subrCode;
            var jpx;
            var jpy;
            var c3x;
            var c3y;
            var c4x;
            var c4y;
            var i = 0;
            while (i < code.length) {
              var v = code[i];
              i += 1;
              switch (v) {
                case 1:
                  parseStems();
                  break;
                case 3:
                  parseStems();
                  break;
                case 4:
                  if (stack.length > 1 && !haveWidth) {
                    width = stack.shift() + font.nominalWidthX;
                    haveWidth = true;
                  }
                  y += stack.pop();
                  newContour(x, y);
                  break;
                case 5:
                  while (stack.length > 0) {
                    x += stack.shift();
                    y += stack.shift();
                    p.lineTo(x, y);
                  }
                  break;
                case 6:
                  while (stack.length > 0) {
                    x += stack.shift();
                    p.lineTo(x, y);
                    if (stack.length === 0) {
                      break;
                    }
                    y += stack.shift();
                    p.lineTo(x, y);
                  }
                  break;
                case 7:
                  while (stack.length > 0) {
                    y += stack.shift();
                    p.lineTo(x, y);
                    if (stack.length === 0) {
                      break;
                    }
                    x += stack.shift();
                    p.lineTo(x, y);
                  }
                  break;
                case 8:
                  while (stack.length > 0) {
                    c1x = x + stack.shift();
                    c1y = y + stack.shift();
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    x = c2x + stack.shift();
                    y = c2y + stack.shift();
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);
                  }
                  break;
                case 10:
                  codeIndex = stack.pop() + font.subrsBias;
                  subrCode = font.subrs[codeIndex];
                  if (subrCode) {
                    parse(subrCode);
                  }
                  break;
                case 11:
                  return;
                case 12:
                  v = code[i];
                  i += 1;
                  switch (v) {
                    case 35:
                      c1x = x + stack.shift();
                      c1y = y + stack.shift();
                      c2x = c1x + stack.shift();
                      c2y = c1y + stack.shift();
                      jpx = c2x + stack.shift();
                      jpy = c2y + stack.shift();
                      c3x = jpx + stack.shift();
                      c3y = jpy + stack.shift();
                      c4x = c3x + stack.shift();
                      c4y = c3y + stack.shift();
                      x = c4x + stack.shift();
                      y = c4y + stack.shift();
                      stack.shift();
                      p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
                      p.curveTo(c3x, c3y, c4x, c4y, x, y);
                      break;
                    case 34:
                      c1x = x + stack.shift();
                      c1y = y;
                      c2x = c1x + stack.shift();
                      c2y = c1y + stack.shift();
                      jpx = c2x + stack.shift();
                      jpy = c2y;
                      c3x = jpx + stack.shift();
                      c3y = c2y;
                      c4x = c3x + stack.shift();
                      c4y = y;
                      x = c4x + stack.shift();
                      p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
                      p.curveTo(c3x, c3y, c4x, c4y, x, y);
                      break;
                    case 36:
                      c1x = x + stack.shift();
                      c1y = y + stack.shift();
                      c2x = c1x + stack.shift();
                      c2y = c1y + stack.shift();
                      jpx = c2x + stack.shift();
                      jpy = c2y;
                      c3x = jpx + stack.shift();
                      c3y = c2y;
                      c4x = c3x + stack.shift();
                      c4y = c3y + stack.shift();
                      x = c4x + stack.shift();
                      p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
                      p.curveTo(c3x, c3y, c4x, c4y, x, y);
                      break;
                    case 37:
                      c1x = x + stack.shift();
                      c1y = y + stack.shift();
                      c2x = c1x + stack.shift();
                      c2y = c1y + stack.shift();
                      jpx = c2x + stack.shift();
                      jpy = c2y + stack.shift();
                      c3x = jpx + stack.shift();
                      c3y = jpy + stack.shift();
                      c4x = c3x + stack.shift();
                      c4y = c3y + stack.shift();
                      if (Math.abs(c4x - x) > Math.abs(c4y - y)) {
                        x = c4x + stack.shift();
                      } else {
                        y = c4y + stack.shift();
                      }
                      p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
                      p.curveTo(c3x, c3y, c4x, c4y, x, y);
                      break;
                    default:
                      console.log('Glyph ' + glyph.index + ': unknown operator ' + 1200 + v);
                      stack.length = 0;
                  }
                  break;
                case 14:
                  if (stack.length > 0 && !haveWidth) {
                    width = stack.shift() + font.nominalWidthX;
                    haveWidth = true;
                  }
                  if (open) {
                    p.closePath();
                    open = false;
                  }
                  break;
                case 18:
                  parseStems();
                  break;
                case 19:
                case 20:
                  parseStems();
                  i += (nStems + 7) >> 3;
                  break;
                case 21:
                  if (stack.length > 2 && !haveWidth) {
                    width = stack.shift() + font.nominalWidthX;
                    haveWidth = true;
                  }
                  y += stack.pop();
                  x += stack.pop();
                  newContour(x, y);
                  break;
                case 22:
                  if (stack.length > 1 && !haveWidth) {
                    width = stack.shift() + font.nominalWidthX;
                    haveWidth = true;
                  }
                  x += stack.pop();
                  newContour(x, y);
                  break;
                case 23:
                  parseStems();
                  break;
                case 24:
                  while (stack.length > 2) {
                    c1x = x + stack.shift();
                    c1y = y + stack.shift();
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    x = c2x + stack.shift();
                    y = c2y + stack.shift();
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);
                  }
                  x += stack.shift();
                  y += stack.shift();
                  p.lineTo(x, y);
                  break;
                case 25:
                  while (stack.length > 6) {
                    x += stack.shift();
                    y += stack.shift();
                    p.lineTo(x, y);
                  }
                  c1x = x + stack.shift();
                  c1y = y + stack.shift();
                  c2x = c1x + stack.shift();
                  c2y = c1y + stack.shift();
                  x = c2x + stack.shift();
                  y = c2y + stack.shift();
                  p.curveTo(c1x, c1y, c2x, c2y, x, y);
                  break;
                case 26:
                  if (stack.length % 2) {
                    x += stack.shift();
                  }
                  while (stack.length > 0) {
                    c1x = x;
                    c1y = y + stack.shift();
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    x = c2x;
                    y = c2y + stack.shift();
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);
                  }
                  break;
                case 27:
                  if (stack.length % 2) {
                    y += stack.shift();
                  }
                  while (stack.length > 0) {
                    c1x = x + stack.shift();
                    c1y = y;
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    x = c2x + stack.shift();
                    y = c2y;
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);
                  }
                  break;
                case 28:
                  b1 = code[i];
                  b2 = code[i + 1];
                  stack.push(((b1 << 24) | (b2 << 16)) >> 16);
                  i += 2;
                  break;
                case 29:
                  codeIndex = stack.pop() + font.gsubrsBias;
                  subrCode = font.gsubrs[codeIndex];
                  if (subrCode) {
                    parse(subrCode);
                  }
                  break;
                case 30:
                  while (stack.length > 0) {
                    c1x = x;
                    c1y = y + stack.shift();
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    x = c2x + stack.shift();
                    y = c2y + (stack.length === 1 ? stack.shift() : 0);
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);
                    if (stack.length === 0) {
                      break;
                    }
                    c1x = x + stack.shift();
                    c1y = y;
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    y = c2y + stack.shift();
                    x = c2x + (stack.length === 1 ? stack.shift() : 0);
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);
                  }
                  break;
                case 31:
                  while (stack.length > 0) {
                    c1x = x + stack.shift();
                    c1y = y;
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    y = c2y + stack.shift();
                    x = c2x + (stack.length === 1 ? stack.shift() : 0);
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);
                    if (stack.length === 0) {
                      break;
                    }
                    c1x = x;
                    c1y = y + stack.shift();
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    x = c2x + stack.shift();
                    y = c2y + (stack.length === 1 ? stack.shift() : 0);
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);
                  }
                  break;
                default:
                  if (v < 32) {
                    console.log('Glyph ' + glyph.index + ': unknown operator ' + v);
                  } else if (v < 247) {
                    stack.push(v - 139);
                  } else if (v < 251) {
                    b1 = code[i];
                    i += 1;
                    stack.push((v - 247) * 256 + b1 + 108);
                  } else if (v < 255) {
                    b1 = code[i];
                    i += 1;
                    stack.push(-(v - 251) * 256 - b1 - 108);
                  } else {
                    b1 = code[i];
                    b2 = code[i + 1];
                    b3 = code[i + 2];
                    b4 = code[i + 3];
                    i += 4;
                    stack.push(((b1 << 24) | (b2 << 16) | (b3 << 8) | b4) / 65536);
                  }
              }
            }
          }
          parse(code);
          glyph.advanceWidth = width;
          return p;
        }
        function calcCFFSubroutineBias(subrs) {
          var bias;
          if (subrs.length < 1240) {
            bias = 107;
          } else if (subrs.length < 33900) {
            bias = 1131;
          } else {
            bias = 32768;
          }
          return bias;
        }
        function parseCFFTable(data, start, font) {
          font.tables.cff = {};
          var header = parseCFFHeader(data, start);
          var nameIndex = parseCFFIndex(data, header.endOffset, parse.bytesToString);
          var topDictIndex = parseCFFIndex(data, nameIndex.endOffset);
          var stringIndex = parseCFFIndex(data, topDictIndex.endOffset, parse.bytesToString);
          var globalSubrIndex = parseCFFIndex(data, stringIndex.endOffset);
          font.gsubrs = globalSubrIndex.objects;
          font.gsubrsBias = calcCFFSubroutineBias(font.gsubrs);
          var topDictData = new DataView(new Uint8Array(topDictIndex.objects[0]).buffer);
          var topDict = parseCFFTopDict(topDictData, stringIndex.objects);
          font.tables.cff.topDict = topDict;
          var privateDictOffset = start + topDict['private'][1];
          var privateDict = parseCFFPrivateDict(data, privateDictOffset, topDict['private'][0], stringIndex.objects);
          font.defaultWidthX = privateDict.defaultWidthX;
          font.nominalWidthX = privateDict.nominalWidthX;
          if (privateDict.subrs !== 0) {
            var subrOffset = privateDictOffset + privateDict.subrs;
            var subrIndex = parseCFFIndex(data, subrOffset);
            font.subrs = subrIndex.objects;
            font.subrsBias = calcCFFSubroutineBias(font.subrs);
          } else {
            font.subrs = [];
            font.subrsBias = 0;
          }
          var charStringsIndex = parseCFFIndex(data, start + topDict.charStrings);
          font.nGlyphs = charStringsIndex.objects.length;
          var charset = parseCFFCharset(data, start + topDict.charset, font.nGlyphs, stringIndex.objects);
          if (topDict.encoding === 0) {
            font.cffEncoding = new encoding.CffEncoding(encoding.cffStandardEncoding, charset);
          } else if (topDict.encoding === 1) {
            font.cffEncoding = new encoding.CffEncoding(encoding.cffExpertEncoding, charset);
          } else {
            font.cffEncoding = parseCFFEncoding(data, start + topDict.encoding, charset);
          }
          font.encoding = font.encoding || font.cffEncoding;
          font.glyphs = new glyphset.GlyphSet(font);
          for (var i = 0; i < font.nGlyphs; i += 1) {
            var charString = charStringsIndex.objects[i];
            font.glyphs.push(i, glyphset.cffGlyphLoader(font, i, parseCFFCharstring, charString));
          }
        }
        function encodeString(s, strings) {
          var sid;
          var i = encoding.cffStandardStrings.indexOf(s);
          if (i >= 0) {
            sid = i;
          }
          i = strings.indexOf(s);
          if (i >= 0) {
            sid = i + encoding.cffStandardStrings.length;
          } else {
            sid = encoding.cffStandardStrings.length + strings.length;
            strings.push(s);
          }
          return sid;
        }
        function makeHeader() {
          return new table.Table('Header', [{
            name: 'major',
            type: 'Card8',
            value: 1
          }, {
            name: 'minor',
            type: 'Card8',
            value: 0
          }, {
            name: 'hdrSize',
            type: 'Card8',
            value: 4
          }, {
            name: 'major',
            type: 'Card8',
            value: 1
          }]);
        }
        function makeNameIndex(fontNames) {
          var t = new table.Table('Name INDEX', [{
            name: 'names',
            type: 'INDEX',
            value: []
          }]);
          t.names = [];
          for (var i = 0; i < fontNames.length; i += 1) {
            t.names.push({
              name: 'name_' + i,
              type: 'NAME',
              value: fontNames[i]
            });
          }
          return t;
        }
        function makeDict(meta, attrs, strings) {
          var m = {};
          for (var i = 0; i < meta.length; i += 1) {
            var entry = meta[i];
            var value = attrs[entry.name];
            if (value !== undefined && !equals(value, entry.value)) {
              if (entry.type === 'SID') {
                value = encodeString(value, strings);
              }
              m[entry.op] = {
                name: entry.name,
                type: entry.type,
                value: value
              };
            }
          }
          return m;
        }
        function makeTopDict(attrs, strings) {
          var t = new table.Table('Top DICT', [{
            name: 'dict',
            type: 'DICT',
            value: {}
          }]);
          t.dict = makeDict(TOP_DICT_META, attrs, strings);
          return t;
        }
        function makeTopDictIndex(topDict) {
          var t = new table.Table('Top DICT INDEX', [{
            name: 'topDicts',
            type: 'INDEX',
            value: []
          }]);
          t.topDicts = [{
            name: 'topDict_0',
            type: 'TABLE',
            value: topDict
          }];
          return t;
        }
        function makeStringIndex(strings) {
          var t = new table.Table('String INDEX', [{
            name: 'strings',
            type: 'INDEX',
            value: []
          }]);
          t.strings = [];
          for (var i = 0; i < strings.length; i += 1) {
            t.strings.push({
              name: 'string_' + i,
              type: 'STRING',
              value: strings[i]
            });
          }
          return t;
        }
        function makeGlobalSubrIndex() {
          return new table.Table('Global Subr INDEX', [{
            name: 'subrs',
            type: 'INDEX',
            value: []
          }]);
        }
        function makeCharsets(glyphNames, strings) {
          var t = new table.Table('Charsets', [{
            name: 'format',
            type: 'Card8',
            value: 0
          }]);
          for (var i = 0; i < glyphNames.length; i += 1) {
            var glyphName = glyphNames[i];
            var glyphSID = encodeString(glyphName, strings);
            t.fields.push({
              name: 'glyph_' + i,
              type: 'SID',
              value: glyphSID
            });
          }
          return t;
        }
        function glyphToOps(glyph) {
          var ops = [];
          var path = glyph.path;
          ops.push({
            name: 'width',
            type: 'NUMBER',
            value: glyph.advanceWidth
          });
          var x = 0;
          var y = 0;
          for (var i = 0; i < path.commands.length; i += 1) {
            var dx;
            var dy;
            var cmd = path.commands[i];
            if (cmd.type === 'Q') {
              var _13 = 1 / 3;
              var _23 = 2 / 3;
              cmd = {
                type: 'C',
                x: cmd.x,
                y: cmd.y,
                x1: _13 * x + _23 * cmd.x1,
                y1: _13 * y + _23 * cmd.y1,
                x2: _13 * cmd.x + _23 * cmd.x1,
                y2: _13 * cmd.y + _23 * cmd.y1
              };
            }
            if (cmd.type === 'M') {
              dx = Math.round(cmd.x - x);
              dy = Math.round(cmd.y - y);
              ops.push({
                name: 'dx',
                type: 'NUMBER',
                value: dx
              });
              ops.push({
                name: 'dy',
                type: 'NUMBER',
                value: dy
              });
              ops.push({
                name: 'rmoveto',
                type: 'OP',
                value: 21
              });
              x = Math.round(cmd.x);
              y = Math.round(cmd.y);
            } else if (cmd.type === 'L') {
              dx = Math.round(cmd.x - x);
              dy = Math.round(cmd.y - y);
              ops.push({
                name: 'dx',
                type: 'NUMBER',
                value: dx
              });
              ops.push({
                name: 'dy',
                type: 'NUMBER',
                value: dy
              });
              ops.push({
                name: 'rlineto',
                type: 'OP',
                value: 5
              });
              x = Math.round(cmd.x);
              y = Math.round(cmd.y);
            } else if (cmd.type === 'C') {
              var dx1 = Math.round(cmd.x1 - x);
              var dy1 = Math.round(cmd.y1 - y);
              var dx2 = Math.round(cmd.x2 - cmd.x1);
              var dy2 = Math.round(cmd.y2 - cmd.y1);
              dx = Math.round(cmd.x - cmd.x2);
              dy = Math.round(cmd.y - cmd.y2);
              ops.push({
                name: 'dx1',
                type: 'NUMBER',
                value: dx1
              });
              ops.push({
                name: 'dy1',
                type: 'NUMBER',
                value: dy1
              });
              ops.push({
                name: 'dx2',
                type: 'NUMBER',
                value: dx2
              });
              ops.push({
                name: 'dy2',
                type: 'NUMBER',
                value: dy2
              });
              ops.push({
                name: 'dx',
                type: 'NUMBER',
                value: dx
              });
              ops.push({
                name: 'dy',
                type: 'NUMBER',
                value: dy
              });
              ops.push({
                name: 'rrcurveto',
                type: 'OP',
                value: 8
              });
              x = Math.round(cmd.x);
              y = Math.round(cmd.y);
            }
          }
          ops.push({
            name: 'endchar',
            type: 'OP',
            value: 14
          });
          return ops;
        }
        function makeCharStringsIndex(glyphs) {
          var t = new table.Table('CharStrings INDEX', [{
            name: 'charStrings',
            type: 'INDEX',
            value: []
          }]);
          for (var i = 0; i < glyphs.length; i += 1) {
            var glyph = glyphs.get(i);
            var ops = glyphToOps(glyph);
            t.charStrings.push({
              name: glyph.name,
              type: 'CHARSTRING',
              value: ops
            });
          }
          return t;
        }
        function makePrivateDict(attrs, strings) {
          var t = new table.Table('Private DICT', [{
            name: 'dict',
            type: 'DICT',
            value: {}
          }]);
          t.dict = makeDict(PRIVATE_DICT_META, attrs, strings);
          return t;
        }
        function makePrivateDictIndex(privateDict) {
          var t = new table.Table('Private DICT INDEX', [{
            name: 'privateDicts',
            type: 'INDEX',
            value: []
          }]);
          t.privateDicts = [{
            name: 'privateDict_0',
            type: 'TABLE',
            value: privateDict
          }];
          return t;
        }
        function makeCFFTable(glyphs, options) {
          var t = new table.Table('CFF ', [{
            name: 'header',
            type: 'TABLE'
          }, {
            name: 'nameIndex',
            type: 'TABLE'
          }, {
            name: 'topDictIndex',
            type: 'TABLE'
          }, {
            name: 'stringIndex',
            type: 'TABLE'
          }, {
            name: 'globalSubrIndex',
            type: 'TABLE'
          }, {
            name: 'charsets',
            type: 'TABLE'
          }, {
            name: 'charStringsIndex',
            type: 'TABLE'
          }, {
            name: 'privateDictIndex',
            type: 'TABLE'
          }]);
          var fontScale = 1 / options.unitsPerEm;
          var attrs = {
            version: options.version,
            fullName: options.fullName,
            familyName: options.familyName,
            weight: options.weightName,
            fontMatrix: [fontScale, 0, 0, fontScale, 0, 0],
            charset: 999,
            encoding: 0,
            charStrings: 999,
            private: [0, 999]
          };
          var privateAttrs = {};
          var glyphNames = [];
          var glyph;
          for (var i = 1; i < glyphs.length; i += 1) {
            glyph = glyphs.get(i);
            glyphNames.push(glyph.name);
          }
          var strings = [];
          t.header = makeHeader();
          t.nameIndex = makeNameIndex([options.postScriptName]);
          var topDict = makeTopDict(attrs, strings);
          t.topDictIndex = makeTopDictIndex(topDict);
          t.globalSubrIndex = makeGlobalSubrIndex();
          t.charsets = makeCharsets(glyphNames, strings);
          t.charStringsIndex = makeCharStringsIndex(glyphs);
          var privateDict = makePrivateDict(privateAttrs, strings);
          t.privateDictIndex = makePrivateDictIndex(privateDict);
          t.stringIndex = makeStringIndex(strings);
          var startOffset = t.header.sizeOf() + t.nameIndex.sizeOf() + t.topDictIndex.sizeOf() + t.stringIndex.sizeOf() + t.globalSubrIndex.sizeOf();
          attrs.charset = startOffset;
          attrs.encoding = 0;
          attrs.charStrings = attrs.charset + t.charsets.sizeOf();
          attrs.private[1] = attrs.charStrings + t.charStringsIndex.sizeOf();
          topDict = makeTopDict(attrs, strings);
          t.topDictIndex = makeTopDictIndex(topDict);
          return t;
        }
        exports.parse = parseCFFTable;
        exports.make = makeCFFTable;
      }, {
        "../encoding": 6,
        "../glyphset": 9,
        "../parse": 11,
        "../path": 12,
        "../table": 13
      }],
      15: [function(_dereq_, module, exports) {
        'use strict';
        var check = _dereq_('../check');
        var parse = _dereq_('../parse');
        var table = _dereq_('../table');
        function parseCmapTable(data, start) {
          var i;
          var cmap = {};
          cmap.version = parse.getUShort(data, start);
          check.argument(cmap.version === 0, 'cmap table version should be 0.');
          cmap.numTables = parse.getUShort(data, start + 2);
          var offset = -1;
          for (i = 0; i < cmap.numTables; i += 1) {
            var platformId = parse.getUShort(data, start + 4 + (i * 8));
            var encodingId = parse.getUShort(data, start + 4 + (i * 8) + 2);
            if (platformId === 3 && (encodingId === 1 || encodingId === 0)) {
              offset = parse.getULong(data, start + 4 + (i * 8) + 4);
              break;
            }
          }
          if (offset === -1) {
            return null;
          }
          var p = new parse.Parser(data, start + offset);
          cmap.format = p.parseUShort();
          check.argument(cmap.format === 4, 'Only format 4 cmap tables are supported.');
          cmap.length = p.parseUShort();
          cmap.language = p.parseUShort();
          var segCount;
          cmap.segCount = segCount = p.parseUShort() >> 1;
          p.skip('uShort', 3);
          cmap.glyphIndexMap = {};
          var endCountParser = new parse.Parser(data, start + offset + 14);
          var startCountParser = new parse.Parser(data, start + offset + 16 + segCount * 2);
          var idDeltaParser = new parse.Parser(data, start + offset + 16 + segCount * 4);
          var idRangeOffsetParser = new parse.Parser(data, start + offset + 16 + segCount * 6);
          var glyphIndexOffset = start + offset + 16 + segCount * 8;
          for (i = 0; i < segCount - 1; i += 1) {
            var glyphIndex;
            var endCount = endCountParser.parseUShort();
            var startCount = startCountParser.parseUShort();
            var idDelta = idDeltaParser.parseShort();
            var idRangeOffset = idRangeOffsetParser.parseUShort();
            for (var c = startCount; c <= endCount; c += 1) {
              if (idRangeOffset !== 0) {
                glyphIndexOffset = (idRangeOffsetParser.offset + idRangeOffsetParser.relativeOffset - 2);
                glyphIndexOffset += idRangeOffset;
                glyphIndexOffset += (c - startCount) * 2;
                glyphIndex = parse.getUShort(data, glyphIndexOffset);
                if (glyphIndex !== 0) {
                  glyphIndex = (glyphIndex + idDelta) & 0xFFFF;
                }
              } else {
                glyphIndex = (c + idDelta) & 0xFFFF;
              }
              cmap.glyphIndexMap[c] = glyphIndex;
            }
          }
          return cmap;
        }
        function addSegment(t, code, glyphIndex) {
          t.segments.push({
            end: code,
            start: code,
            delta: -(code - glyphIndex),
            offset: 0
          });
        }
        function addTerminatorSegment(t) {
          t.segments.push({
            end: 0xFFFF,
            start: 0xFFFF,
            delta: 1,
            offset: 0
          });
        }
        function makeCmapTable(glyphs) {
          var i;
          var t = new table.Table('cmap', [{
            name: 'version',
            type: 'USHORT',
            value: 0
          }, {
            name: 'numTables',
            type: 'USHORT',
            value: 1
          }, {
            name: 'platformID',
            type: 'USHORT',
            value: 3
          }, {
            name: 'encodingID',
            type: 'USHORT',
            value: 1
          }, {
            name: 'offset',
            type: 'ULONG',
            value: 12
          }, {
            name: 'format',
            type: 'USHORT',
            value: 4
          }, {
            name: 'length',
            type: 'USHORT',
            value: 0
          }, {
            name: 'language',
            type: 'USHORT',
            value: 0
          }, {
            name: 'segCountX2',
            type: 'USHORT',
            value: 0
          }, {
            name: 'searchRange',
            type: 'USHORT',
            value: 0
          }, {
            name: 'entrySelector',
            type: 'USHORT',
            value: 0
          }, {
            name: 'rangeShift',
            type: 'USHORT',
            value: 0
          }]);
          t.segments = [];
          for (i = 0; i < glyphs.length; i += 1) {
            var glyph = glyphs.get(i);
            for (var j = 0; j < glyph.unicodes.length; j += 1) {
              addSegment(t, glyph.unicodes[j], i);
            }
            t.segments = t.segments.sort(function(a, b) {
              return a.start - b.start;
            });
          }
          addTerminatorSegment(t);
          var segCount;
          segCount = t.segments.length;
          t.segCountX2 = segCount * 2;
          t.searchRange = Math.pow(2, Math.floor(Math.log(segCount) / Math.log(2))) * 2;
          t.entrySelector = Math.log(t.searchRange / 2) / Math.log(2);
          t.rangeShift = t.segCountX2 - t.searchRange;
          var endCounts = [];
          var startCounts = [];
          var idDeltas = [];
          var idRangeOffsets = [];
          var glyphIds = [];
          for (i = 0; i < segCount; i += 1) {
            var segment = t.segments[i];
            endCounts = endCounts.concat({
              name: 'end_' + i,
              type: 'USHORT',
              value: segment.end
            });
            startCounts = startCounts.concat({
              name: 'start_' + i,
              type: 'USHORT',
              value: segment.start
            });
            idDeltas = idDeltas.concat({
              name: 'idDelta_' + i,
              type: 'SHORT',
              value: segment.delta
            });
            idRangeOffsets = idRangeOffsets.concat({
              name: 'idRangeOffset_' + i,
              type: 'USHORT',
              value: segment.offset
            });
            if (segment.glyphId !== undefined) {
              glyphIds = glyphIds.concat({
                name: 'glyph_' + i,
                type: 'USHORT',
                value: segment.glyphId
              });
            }
          }
          t.fields = t.fields.concat(endCounts);
          t.fields.push({
            name: 'reservedPad',
            type: 'USHORT',
            value: 0
          });
          t.fields = t.fields.concat(startCounts);
          t.fields = t.fields.concat(idDeltas);
          t.fields = t.fields.concat(idRangeOffsets);
          t.fields = t.fields.concat(glyphIds);
          t.length = 14 + endCounts.length * 2 + 2 + startCounts.length * 2 + idDeltas.length * 2 + idRangeOffsets.length * 2 + glyphIds.length * 2;
          return t;
        }
        exports.parse = parseCmapTable;
        exports.make = makeCmapTable;
      }, {
        "../check": 4,
        "../parse": 11,
        "../table": 13
      }],
      16: [function(_dereq_, module, exports) {
        'use strict';
        var check = _dereq_('../check');
        var parse = _dereq_('../parse');
        var table = _dereq_('../table');
        function addName(name, names) {
          var nameString = JSON.stringify(name);
          var nameID = 256;
          for (var nameKey in names) {
            var n = parseInt(nameKey);
            if (!n || n < 256) {
              continue;
            }
            if (JSON.stringify(names[nameKey]) === nameString) {
              return n;
            }
            if (nameID <= n) {
              nameID = n + 1;
            }
          }
          names[nameID] = name;
          return nameID;
        }
        function makeFvarAxis(axis, names) {
          var nameID = addName(axis.name, names);
          return new table.Table('fvarAxis', [{
            name: 'tag',
            type: 'TAG',
            value: axis.tag
          }, {
            name: 'minValue',
            type: 'FIXED',
            value: axis.minValue << 16
          }, {
            name: 'defaultValue',
            type: 'FIXED',
            value: axis.defaultValue << 16
          }, {
            name: 'maxValue',
            type: 'FIXED',
            value: axis.maxValue << 16
          }, {
            name: 'flags',
            type: 'USHORT',
            value: 0
          }, {
            name: 'nameID',
            type: 'USHORT',
            value: nameID
          }]);
        }
        function parseFvarAxis(data, start, names) {
          var axis = {};
          var p = new parse.Parser(data, start);
          axis.tag = p.parseTag();
          axis.minValue = p.parseFixed();
          axis.defaultValue = p.parseFixed();
          axis.maxValue = p.parseFixed();
          p.skip('uShort', 1);
          axis.name = names[p.parseUShort()] || {};
          return axis;
        }
        function makeFvarInstance(inst, axes, names) {
          var nameID = addName(inst.name, names);
          var fields = [{
            name: 'nameID',
            type: 'USHORT',
            value: nameID
          }, {
            name: 'flags',
            type: 'USHORT',
            value: 0
          }];
          for (var i = 0; i < axes.length; ++i) {
            var axisTag = axes[i].tag;
            fields.push({
              name: 'axis ' + axisTag,
              type: 'FIXED',
              value: inst.coordinates[axisTag] << 16
            });
          }
          return new table.Table('fvarInstance', fields);
        }
        function parseFvarInstance(data, start, axes, names) {
          var inst = {};
          var p = new parse.Parser(data, start);
          inst.name = names[p.parseUShort()] || {};
          p.skip('uShort', 1);
          inst.coordinates = {};
          for (var i = 0; i < axes.length; ++i) {
            inst.coordinates[axes[i].tag] = p.parseFixed();
          }
          return inst;
        }
        function makeFvarTable(fvar, names) {
          var result = new table.Table('fvar', [{
            name: 'version',
            type: 'ULONG',
            value: 0x10000
          }, {
            name: 'offsetToData',
            type: 'USHORT',
            value: 0
          }, {
            name: 'countSizePairs',
            type: 'USHORT',
            value: 2
          }, {
            name: 'axisCount',
            type: 'USHORT',
            value: fvar.axes.length
          }, {
            name: 'axisSize',
            type: 'USHORT',
            value: 20
          }, {
            name: 'instanceCount',
            type: 'USHORT',
            value: fvar.instances.length
          }, {
            name: 'instanceSize',
            type: 'USHORT',
            value: 4 + fvar.axes.length * 4
          }]);
          result.offsetToData = result.sizeOf();
          for (var i = 0; i < fvar.axes.length; i++) {
            result.fields.push({
              name: 'axis ' + i,
              type: 'TABLE',
              value: makeFvarAxis(fvar.axes[i], names)
            });
          }
          for (var j = 0; j < fvar.instances.length; j++) {
            result.fields.push({
              name: 'instance ' + j,
              type: 'TABLE',
              value: makeFvarInstance(fvar.instances[j], fvar.axes, names)
            });
          }
          return result;
        }
        function parseFvarTable(data, start, names) {
          var p = new parse.Parser(data, start);
          var tableVersion = p.parseULong();
          check.argument(tableVersion === 0x00010000, 'Unsupported fvar table version.');
          var offsetToData = p.parseOffset16();
          p.skip('uShort', 1);
          var axisCount = p.parseUShort();
          var axisSize = p.parseUShort();
          var instanceCount = p.parseUShort();
          var instanceSize = p.parseUShort();
          var axes = [];
          for (var i = 0; i < axisCount; i++) {
            axes.push(parseFvarAxis(data, start + offsetToData + i * axisSize, names));
          }
          var instances = [];
          var instanceStart = start + offsetToData + axisCount * axisSize;
          for (var j = 0; j < instanceCount; j++) {
            instances.push(parseFvarInstance(data, instanceStart + j * instanceSize, axes, names));
          }
          return {
            axes: axes,
            instances: instances
          };
        }
        exports.make = makeFvarTable;
        exports.parse = parseFvarTable;
      }, {
        "../check": 4,
        "../parse": 11,
        "../table": 13
      }],
      17: [function(_dereq_, module, exports) {
        'use strict';
        var check = _dereq_('../check');
        var glyphset = _dereq_('../glyphset');
        var parse = _dereq_('../parse');
        var path = _dereq_('../path');
        function parseGlyphCoordinate(p, flag, previousValue, shortVectorBitMask, sameBitMask) {
          var v;
          if ((flag & shortVectorBitMask) > 0) {
            v = p.parseByte();
            if ((flag & sameBitMask) === 0) {
              v = -v;
            }
            v = previousValue + v;
          } else {
            if ((flag & sameBitMask) > 0) {
              v = previousValue;
            } else {
              v = previousValue + p.parseShort();
            }
          }
          return v;
        }
        function parseGlyph(glyph, data, start) {
          var p = new parse.Parser(data, start);
          glyph.numberOfContours = p.parseShort();
          glyph.xMin = p.parseShort();
          glyph.yMin = p.parseShort();
          glyph.xMax = p.parseShort();
          glyph.yMax = p.parseShort();
          var flags;
          var flag;
          if (glyph.numberOfContours > 0) {
            var i;
            var endPointIndices = glyph.endPointIndices = [];
            for (i = 0; i < glyph.numberOfContours; i += 1) {
              endPointIndices.push(p.parseUShort());
            }
            glyph.instructionLength = p.parseUShort();
            glyph.instructions = [];
            for (i = 0; i < glyph.instructionLength; i += 1) {
              glyph.instructions.push(p.parseByte());
            }
            var numberOfCoordinates = endPointIndices[endPointIndices.length - 1] + 1;
            flags = [];
            for (i = 0; i < numberOfCoordinates; i += 1) {
              flag = p.parseByte();
              flags.push(flag);
              if ((flag & 8) > 0) {
                var repeatCount = p.parseByte();
                for (var j = 0; j < repeatCount; j += 1) {
                  flags.push(flag);
                  i += 1;
                }
              }
            }
            check.argument(flags.length === numberOfCoordinates, 'Bad flags.');
            if (endPointIndices.length > 0) {
              var points = [];
              var point;
              if (numberOfCoordinates > 0) {
                for (i = 0; i < numberOfCoordinates; i += 1) {
                  flag = flags[i];
                  point = {};
                  point.onCurve = !!(flag & 1);
                  point.lastPointOfContour = endPointIndices.indexOf(i) >= 0;
                  points.push(point);
                }
                var px = 0;
                for (i = 0; i < numberOfCoordinates; i += 1) {
                  flag = flags[i];
                  point = points[i];
                  point.x = parseGlyphCoordinate(p, flag, px, 2, 16);
                  px = point.x;
                }
                var py = 0;
                for (i = 0; i < numberOfCoordinates; i += 1) {
                  flag = flags[i];
                  point = points[i];
                  point.y = parseGlyphCoordinate(p, flag, py, 4, 32);
                  py = point.y;
                }
              }
              glyph.points = points;
            } else {
              glyph.points = [];
            }
          } else if (glyph.numberOfContours === 0) {
            glyph.points = [];
          } else {
            glyph.isComposite = true;
            glyph.points = [];
            glyph.components = [];
            var moreComponents = true;
            while (moreComponents) {
              flags = p.parseUShort();
              var component = {
                glyphIndex: p.parseUShort(),
                xScale: 1,
                scale01: 0,
                scale10: 0,
                yScale: 1,
                dx: 0,
                dy: 0
              };
              if ((flags & 1) > 0) {
                component.dx = p.parseShort();
                component.dy = p.parseShort();
              } else {
                component.dx = p.parseChar();
                component.dy = p.parseChar();
              }
              if ((flags & 8) > 0) {
                component.xScale = component.yScale = p.parseF2Dot14();
              } else if ((flags & 64) > 0) {
                component.xScale = p.parseF2Dot14();
                component.yScale = p.parseF2Dot14();
              } else if ((flags & 128) > 0) {
                component.xScale = p.parseF2Dot14();
                component.scale01 = p.parseF2Dot14();
                component.scale10 = p.parseF2Dot14();
                component.yScale = p.parseF2Dot14();
              }
              glyph.components.push(component);
              moreComponents = !!(flags & 32);
            }
          }
        }
        function transformPoints(points, transform) {
          var newPoints = [];
          for (var i = 0; i < points.length; i += 1) {
            var pt = points[i];
            var newPt = {
              x: transform.xScale * pt.x + transform.scale01 * pt.y + transform.dx,
              y: transform.scale10 * pt.x + transform.yScale * pt.y + transform.dy,
              onCurve: pt.onCurve,
              lastPointOfContour: pt.lastPointOfContour
            };
            newPoints.push(newPt);
          }
          return newPoints;
        }
        function getContours(points) {
          var contours = [];
          var currentContour = [];
          for (var i = 0; i < points.length; i += 1) {
            var pt = points[i];
            currentContour.push(pt);
            if (pt.lastPointOfContour) {
              contours.push(currentContour);
              currentContour = [];
            }
          }
          check.argument(currentContour.length === 0, 'There are still points left in the current contour.');
          return contours;
        }
        function getPath(points) {
          var p = new path.Path();
          if (!points) {
            return p;
          }
          var contours = getContours(points);
          for (var i = 0; i < contours.length; i += 1) {
            var contour = contours[i];
            var firstPt = contour[0];
            var lastPt = contour[contour.length - 1];
            var curvePt;
            var realFirstPoint;
            if (firstPt.onCurve) {
              curvePt = null;
              realFirstPoint = true;
            } else {
              if (lastPt.onCurve) {
                firstPt = lastPt;
              } else {
                firstPt = {
                  x: (firstPt.x + lastPt.x) / 2,
                  y: (firstPt.y + lastPt.y) / 2
                };
              }
              curvePt = firstPt;
              realFirstPoint = false;
            }
            p.moveTo(firstPt.x, firstPt.y);
            for (var j = realFirstPoint ? 1 : 0; j < contour.length; j += 1) {
              var pt = contour[j];
              var prevPt = j === 0 ? firstPt : contour[j - 1];
              if (prevPt.onCurve && pt.onCurve) {
                p.lineTo(pt.x, pt.y);
              } else if (prevPt.onCurve && !pt.onCurve) {
                curvePt = pt;
              } else if (!prevPt.onCurve && !pt.onCurve) {
                var midPt = {
                  x: (prevPt.x + pt.x) / 2,
                  y: (prevPt.y + pt.y) / 2
                };
                p.quadraticCurveTo(prevPt.x, prevPt.y, midPt.x, midPt.y);
                curvePt = pt;
              } else if (!prevPt.onCurve && pt.onCurve) {
                p.quadraticCurveTo(curvePt.x, curvePt.y, pt.x, pt.y);
                curvePt = null;
              } else {
                throw new Error('Invalid state.');
              }
            }
            if (firstPt !== lastPt) {
              if (curvePt) {
                p.quadraticCurveTo(curvePt.x, curvePt.y, firstPt.x, firstPt.y);
              } else {
                p.lineTo(firstPt.x, firstPt.y);
              }
            }
          }
          p.closePath();
          return p;
        }
        function buildPath(glyphs, glyph) {
          if (glyph.isComposite) {
            for (var j = 0; j < glyph.components.length; j += 1) {
              var component = glyph.components[j];
              var componentGlyph = glyphs.get(component.glyphIndex);
              componentGlyph.getPath();
              if (componentGlyph.points) {
                var transformedPoints = transformPoints(componentGlyph.points, component);
                glyph.points = glyph.points.concat(transformedPoints);
              }
            }
          }
          return getPath(glyph.points);
        }
        function parseGlyfTable(data, start, loca, font) {
          var glyphs = new glyphset.GlyphSet(font);
          var i;
          for (i = 0; i < loca.length - 1; i += 1) {
            var offset = loca[i];
            var nextOffset = loca[i + 1];
            if (offset !== nextOffset) {
              glyphs.push(i, glyphset.ttfGlyphLoader(font, i, parseGlyph, data, start + offset, buildPath));
            } else {
              glyphs.push(i, glyphset.glyphLoader(font, i));
            }
          }
          return glyphs;
        }
        exports.parse = parseGlyfTable;
      }, {
        "../check": 4,
        "../glyphset": 9,
        "../parse": 11,
        "../path": 12
      }],
      18: [function(_dereq_, module, exports) {
        'use strict';
        var check = _dereq_('../check');
        var parse = _dereq_('../parse');
        function parseTaggedListTable(data, start) {
          var p = new parse.Parser(data, start);
          var n = p.parseUShort();
          var list = [];
          for (var i = 0; i < n; i++) {
            list[p.parseTag()] = {offset: p.parseUShort()};
          }
          return list;
        }
        function parseCoverageTable(data, start) {
          var p = new parse.Parser(data, start);
          var format = p.parseUShort();
          var count = p.parseUShort();
          if (format === 1) {
            return p.parseUShortList(count);
          } else if (format === 2) {
            var coverage = [];
            for (; count--; ) {
              var begin = p.parseUShort();
              var end = p.parseUShort();
              var index = p.parseUShort();
              for (var i = begin; i <= end; i++) {
                coverage[index++] = i;
              }
            }
            return coverage;
          }
        }
        function parseClassDefTable(data, start) {
          var p = new parse.Parser(data, start);
          var format = p.parseUShort();
          if (format === 1) {
            var startGlyph = p.parseUShort();
            var glyphCount = p.parseUShort();
            var classes = p.parseUShortList(glyphCount);
            return function(glyphID) {
              return classes[glyphID - startGlyph] || 0;
            };
          } else if (format === 2) {
            var rangeCount = p.parseUShort();
            var startGlyphs = [];
            var endGlyphs = [];
            var classValues = [];
            for (var i = 0; i < rangeCount; i++) {
              startGlyphs[i] = p.parseUShort();
              endGlyphs[i] = p.parseUShort();
              classValues[i] = p.parseUShort();
            }
            return function(glyphID) {
              var l = 0;
              var r = startGlyphs.length - 1;
              while (l < r) {
                var c = (l + r + 1) >> 1;
                if (glyphID < startGlyphs[c]) {
                  r = c - 1;
                } else {
                  l = c;
                }
              }
              if (startGlyphs[l] <= glyphID && glyphID <= endGlyphs[l]) {
                return classValues[l] || 0;
              }
              return 0;
            };
          }
        }
        function parsePairPosSubTable(data, start) {
          var p = new parse.Parser(data, start);
          var format = p.parseUShort();
          var coverageOffset = p.parseUShort();
          var coverage = parseCoverageTable(data, start + coverageOffset);
          var valueFormat1 = p.parseUShort();
          var valueFormat2 = p.parseUShort();
          var value1;
          var value2;
          if (valueFormat1 !== 4 || valueFormat2 !== 0)
            return;
          var sharedPairSets = {};
          if (format === 1) {
            var pairSetCount = p.parseUShort();
            var pairSet = [];
            var pairSetOffsets = p.parseOffset16List(pairSetCount);
            for (var firstGlyph = 0; firstGlyph < pairSetCount; firstGlyph++) {
              var pairSetOffset = pairSetOffsets[firstGlyph];
              var sharedPairSet = sharedPairSets[pairSetOffset];
              if (!sharedPairSet) {
                sharedPairSet = {};
                p.relativeOffset = pairSetOffset;
                var pairValueCount = p.parseUShort();
                for (; pairValueCount--; ) {
                  var secondGlyph = p.parseUShort();
                  if (valueFormat1)
                    value1 = p.parseShort();
                  if (valueFormat2)
                    value2 = p.parseShort();
                  sharedPairSet[secondGlyph] = value1;
                }
              }
              pairSet[coverage[firstGlyph]] = sharedPairSet;
            }
            return function(leftGlyph, rightGlyph) {
              var pairs = pairSet[leftGlyph];
              if (pairs)
                return pairs[rightGlyph];
            };
          } else if (format === 2) {
            var classDef1Offset = p.parseUShort();
            var classDef2Offset = p.parseUShort();
            var class1Count = p.parseUShort();
            var class2Count = p.parseUShort();
            var getClass1 = parseClassDefTable(data, start + classDef1Offset);
            var getClass2 = parseClassDefTable(data, start + classDef2Offset);
            var kerningMatrix = [];
            for (var i = 0; i < class1Count; i++) {
              var kerningRow = kerningMatrix[i] = [];
              for (var j = 0; j < class2Count; j++) {
                if (valueFormat1)
                  value1 = p.parseShort();
                if (valueFormat2)
                  value2 = p.parseShort();
                kerningRow[j] = value1;
              }
            }
            var covered = {};
            for (i = 0; i < coverage.length; i++)
              covered[coverage[i]] = 1;
            return function(leftGlyph, rightGlyph) {
              if (!covered[leftGlyph])
                return;
              var class1 = getClass1(leftGlyph);
              var class2 = getClass2(rightGlyph);
              var kerningRow = kerningMatrix[class1];
              if (kerningRow) {
                return kerningRow[class2];
              }
            };
          }
        }
        function parseLookupTable(data, start) {
          var p = new parse.Parser(data, start);
          var lookupType = p.parseUShort();
          var lookupFlag = p.parseUShort();
          var useMarkFilteringSet = lookupFlag & 0x10;
          var subTableCount = p.parseUShort();
          var subTableOffsets = p.parseOffset16List(subTableCount);
          var table = {
            lookupType: lookupType,
            lookupFlag: lookupFlag,
            markFilteringSet: useMarkFilteringSet ? p.parseUShort() : -1
          };
          if (lookupType === 2) {
            var subtables = [];
            for (var i = 0; i < subTableCount; i++) {
              subtables.push(parsePairPosSubTable(data, start + subTableOffsets[i]));
            }
            table.getKerningValue = function(leftGlyph, rightGlyph) {
              for (var i = subtables.length; i--; ) {
                var value = subtables[i](leftGlyph, rightGlyph);
                if (value !== undefined)
                  return value;
              }
              return 0;
            };
          }
          return table;
        }
        function parseGposTable(data, start, font) {
          var p = new parse.Parser(data, start);
          var tableVersion = p.parseFixed();
          check.argument(tableVersion === 1, 'Unsupported GPOS table version.');
          parseTaggedListTable(data, start + p.parseUShort());
          parseTaggedListTable(data, start + p.parseUShort());
          var lookupListOffset = p.parseUShort();
          p.relativeOffset = lookupListOffset;
          var lookupCount = p.parseUShort();
          var lookupTableOffsets = p.parseOffset16List(lookupCount);
          var lookupListAbsoluteOffset = start + lookupListOffset;
          for (var i = 0; i < lookupCount; i++) {
            var table = parseLookupTable(data, lookupListAbsoluteOffset + lookupTableOffsets[i]);
            if (table.lookupType === 2 && !font.getGposKerningValue)
              font.getGposKerningValue = table.getKerningValue;
          }
        }
        exports.parse = parseGposTable;
      }, {
        "../check": 4,
        "../parse": 11
      }],
      19: [function(_dereq_, module, exports) {
        'use strict';
        var check = _dereq_('../check');
        var parse = _dereq_('../parse');
        var table = _dereq_('../table');
        function parseHeadTable(data, start) {
          var head = {};
          var p = new parse.Parser(data, start);
          head.version = p.parseVersion();
          head.fontRevision = Math.round(p.parseFixed() * 1000) / 1000;
          head.checkSumAdjustment = p.parseULong();
          head.magicNumber = p.parseULong();
          check.argument(head.magicNumber === 0x5F0F3CF5, 'Font header has wrong magic number.');
          head.flags = p.parseUShort();
          head.unitsPerEm = p.parseUShort();
          head.created = p.parseLongDateTime();
          head.modified = p.parseLongDateTime();
          head.xMin = p.parseShort();
          head.yMin = p.parseShort();
          head.xMax = p.parseShort();
          head.yMax = p.parseShort();
          head.macStyle = p.parseUShort();
          head.lowestRecPPEM = p.parseUShort();
          head.fontDirectionHint = p.parseShort();
          head.indexToLocFormat = p.parseShort();
          head.glyphDataFormat = p.parseShort();
          return head;
        }
        function makeHeadTable(options) {
          return new table.Table('head', [{
            name: 'version',
            type: 'FIXED',
            value: 0x00010000
          }, {
            name: 'fontRevision',
            type: 'FIXED',
            value: 0x00010000
          }, {
            name: 'checkSumAdjustment',
            type: 'ULONG',
            value: 0
          }, {
            name: 'magicNumber',
            type: 'ULONG',
            value: 0x5F0F3CF5
          }, {
            name: 'flags',
            type: 'USHORT',
            value: 0
          }, {
            name: 'unitsPerEm',
            type: 'USHORT',
            value: 1000
          }, {
            name: 'created',
            type: 'LONGDATETIME',
            value: 0
          }, {
            name: 'modified',
            type: 'LONGDATETIME',
            value: 0
          }, {
            name: 'xMin',
            type: 'SHORT',
            value: 0
          }, {
            name: 'yMin',
            type: 'SHORT',
            value: 0
          }, {
            name: 'xMax',
            type: 'SHORT',
            value: 0
          }, {
            name: 'yMax',
            type: 'SHORT',
            value: 0
          }, {
            name: 'macStyle',
            type: 'USHORT',
            value: 0
          }, {
            name: 'lowestRecPPEM',
            type: 'USHORT',
            value: 0
          }, {
            name: 'fontDirectionHint',
            type: 'SHORT',
            value: 2
          }, {
            name: 'indexToLocFormat',
            type: 'SHORT',
            value: 0
          }, {
            name: 'glyphDataFormat',
            type: 'SHORT',
            value: 0
          }], options);
        }
        exports.parse = parseHeadTable;
        exports.make = makeHeadTable;
      }, {
        "../check": 4,
        "../parse": 11,
        "../table": 13
      }],
      20: [function(_dereq_, module, exports) {
        'use strict';
        var parse = _dereq_('../parse');
        var table = _dereq_('../table');
        function parseHheaTable(data, start) {
          var hhea = {};
          var p = new parse.Parser(data, start);
          hhea.version = p.parseVersion();
          hhea.ascender = p.parseShort();
          hhea.descender = p.parseShort();
          hhea.lineGap = p.parseShort();
          hhea.advanceWidthMax = p.parseUShort();
          hhea.minLeftSideBearing = p.parseShort();
          hhea.minRightSideBearing = p.parseShort();
          hhea.xMaxExtent = p.parseShort();
          hhea.caretSlopeRise = p.parseShort();
          hhea.caretSlopeRun = p.parseShort();
          hhea.caretOffset = p.parseShort();
          p.relativeOffset += 8;
          hhea.metricDataFormat = p.parseShort();
          hhea.numberOfHMetrics = p.parseUShort();
          return hhea;
        }
        function makeHheaTable(options) {
          return new table.Table('hhea', [{
            name: 'version',
            type: 'FIXED',
            value: 0x00010000
          }, {
            name: 'ascender',
            type: 'FWORD',
            value: 0
          }, {
            name: 'descender',
            type: 'FWORD',
            value: 0
          }, {
            name: 'lineGap',
            type: 'FWORD',
            value: 0
          }, {
            name: 'advanceWidthMax',
            type: 'UFWORD',
            value: 0
          }, {
            name: 'minLeftSideBearing',
            type: 'FWORD',
            value: 0
          }, {
            name: 'minRightSideBearing',
            type: 'FWORD',
            value: 0
          }, {
            name: 'xMaxExtent',
            type: 'FWORD',
            value: 0
          }, {
            name: 'caretSlopeRise',
            type: 'SHORT',
            value: 1
          }, {
            name: 'caretSlopeRun',
            type: 'SHORT',
            value: 0
          }, {
            name: 'caretOffset',
            type: 'SHORT',
            value: 0
          }, {
            name: 'reserved1',
            type: 'SHORT',
            value: 0
          }, {
            name: 'reserved2',
            type: 'SHORT',
            value: 0
          }, {
            name: 'reserved3',
            type: 'SHORT',
            value: 0
          }, {
            name: 'reserved4',
            type: 'SHORT',
            value: 0
          }, {
            name: 'metricDataFormat',
            type: 'SHORT',
            value: 0
          }, {
            name: 'numberOfHMetrics',
            type: 'USHORT',
            value: 0
          }], options);
        }
        exports.parse = parseHheaTable;
        exports.make = makeHheaTable;
      }, {
        "../parse": 11,
        "../table": 13
      }],
      21: [function(_dereq_, module, exports) {
        'use strict';
        var parse = _dereq_('../parse');
        var table = _dereq_('../table');
        function parseHmtxTable(data, start, numMetrics, numGlyphs, glyphs) {
          var advanceWidth;
          var leftSideBearing;
          var p = new parse.Parser(data, start);
          for (var i = 0; i < numGlyphs; i += 1) {
            if (i < numMetrics) {
              advanceWidth = p.parseUShort();
              leftSideBearing = p.parseShort();
            }
            var glyph = glyphs.get(i);
            glyph.advanceWidth = advanceWidth;
            glyph.leftSideBearing = leftSideBearing;
          }
        }
        function makeHmtxTable(glyphs) {
          var t = new table.Table('hmtx', []);
          for (var i = 0; i < glyphs.length; i += 1) {
            var glyph = glyphs.get(i);
            var advanceWidth = glyph.advanceWidth || 0;
            var leftSideBearing = glyph.leftSideBearing || 0;
            t.fields.push({
              name: 'advanceWidth_' + i,
              type: 'USHORT',
              value: advanceWidth
            });
            t.fields.push({
              name: 'leftSideBearing_' + i,
              type: 'SHORT',
              value: leftSideBearing
            });
          }
          return t;
        }
        exports.parse = parseHmtxTable;
        exports.make = makeHmtxTable;
      }, {
        "../parse": 11,
        "../table": 13
      }],
      22: [function(_dereq_, module, exports) {
        'use strict';
        var check = _dereq_('../check');
        var parse = _dereq_('../parse');
        function parseKernTable(data, start) {
          var pairs = {};
          var p = new parse.Parser(data, start);
          var tableVersion = p.parseUShort();
          check.argument(tableVersion === 0, 'Unsupported kern table version.');
          p.skip('uShort', 1);
          var subTableVersion = p.parseUShort();
          check.argument(subTableVersion === 0, 'Unsupported kern sub-table version.');
          p.skip('uShort', 2);
          var nPairs = p.parseUShort();
          p.skip('uShort', 3);
          for (var i = 0; i < nPairs; i += 1) {
            var leftIndex = p.parseUShort();
            var rightIndex = p.parseUShort();
            var value = p.parseShort();
            pairs[leftIndex + ',' + rightIndex] = value;
          }
          return pairs;
        }
        exports.parse = parseKernTable;
      }, {
        "../check": 4,
        "../parse": 11
      }],
      23: [function(_dereq_, module, exports) {
        'use strict';
        var parse = _dereq_('../parse');
        function parseLocaTable(data, start, numGlyphs, shortVersion) {
          var p = new parse.Parser(data, start);
          var parseFn = shortVersion ? p.parseUShort : p.parseULong;
          var glyphOffsets = [];
          for (var i = 0; i < numGlyphs + 1; i += 1) {
            var glyphOffset = parseFn.call(p);
            if (shortVersion) {
              glyphOffset *= 2;
            }
            glyphOffsets.push(glyphOffset);
          }
          return glyphOffsets;
        }
        exports.parse = parseLocaTable;
      }, {"../parse": 11}],
      24: [function(_dereq_, module, exports) {
        'use strict';
        var check = _dereq_('../check');
        var parse = _dereq_('../parse');
        var table = _dereq_('../table');
        function makeLtagTable(tags) {
          var result = new table.Table('ltag', [{
            name: 'version',
            type: 'ULONG',
            value: 1
          }, {
            name: 'flags',
            type: 'ULONG',
            value: 0
          }, {
            name: 'numTags',
            type: 'ULONG',
            value: tags.length
          }]);
          var stringPool = '';
          var stringPoolOffset = 12 + tags.length * 4;
          for (var i = 0; i < tags.length; ++i) {
            var pos = stringPool.indexOf(tags[i]);
            if (pos < 0) {
              pos = stringPool.length;
              stringPool += tags[i];
            }
            result.fields.push({
              name: 'offset ' + i,
              type: 'USHORT',
              value: stringPoolOffset + pos
            });
            result.fields.push({
              name: 'length ' + i,
              type: 'USHORT',
              value: tags[i].length
            });
          }
          result.fields.push({
            name: 'stringPool',
            type: 'CHARARRAY',
            value: stringPool
          });
          return result;
        }
        function parseLtagTable(data, start) {
          var p = new parse.Parser(data, start);
          var tableVersion = p.parseULong();
          check.argument(tableVersion === 1, 'Unsupported ltag table version.');
          p.skip('uLong', 1);
          var numTags = p.parseULong();
          var tags = [];
          for (var i = 0; i < numTags; i++) {
            var tag = '';
            var offset = start + p.parseUShort();
            var length = p.parseUShort();
            for (var j = offset; j < offset + length; ++j) {
              tag += String.fromCharCode(data.getInt8(j));
            }
            tags.push(tag);
          }
          return tags;
        }
        exports.make = makeLtagTable;
        exports.parse = parseLtagTable;
      }, {
        "../check": 4,
        "../parse": 11,
        "../table": 13
      }],
      25: [function(_dereq_, module, exports) {
        'use strict';
        var parse = _dereq_('../parse');
        var table = _dereq_('../table');
        function parseMaxpTable(data, start) {
          var maxp = {};
          var p = new parse.Parser(data, start);
          maxp.version = p.parseVersion();
          maxp.numGlyphs = p.parseUShort();
          if (maxp.version === 1.0) {
            maxp.maxPoints = p.parseUShort();
            maxp.maxContours = p.parseUShort();
            maxp.maxCompositePoints = p.parseUShort();
            maxp.maxCompositeContours = p.parseUShort();
            maxp.maxZones = p.parseUShort();
            maxp.maxTwilightPoints = p.parseUShort();
            maxp.maxStorage = p.parseUShort();
            maxp.maxFunctionDefs = p.parseUShort();
            maxp.maxInstructionDefs = p.parseUShort();
            maxp.maxStackElements = p.parseUShort();
            maxp.maxSizeOfInstructions = p.parseUShort();
            maxp.maxComponentElements = p.parseUShort();
            maxp.maxComponentDepth = p.parseUShort();
          }
          return maxp;
        }
        function makeMaxpTable(numGlyphs) {
          return new table.Table('maxp', [{
            name: 'version',
            type: 'FIXED',
            value: 0x00005000
          }, {
            name: 'numGlyphs',
            type: 'USHORT',
            value: numGlyphs
          }]);
        }
        exports.parse = parseMaxpTable;
        exports.make = makeMaxpTable;
      }, {
        "../parse": 11,
        "../table": 13
      }],
      26: [function(_dereq_, module, exports) {
        'use strict';
        var types = _dereq_('../types');
        var decode = types.decode;
        var encode = types.encode;
        var parse = _dereq_('../parse');
        var table = _dereq_('../table');
        var nameTableNames = ['copyright', 'fontFamily', 'fontSubfamily', 'uniqueID', 'fullName', 'version', 'postScriptName', 'trademark', 'manufacturer', 'designer', 'description', 'manufacturerURL', 'designerURL', 'licence', 'licenceURL', 'reserved', 'preferredFamily', 'preferredSubfamily', 'compatibleFullName', 'sampleText', 'postScriptFindFontName', 'wwsFamily', 'wwsSubfamily'];
        var macLanguages = {
          0: 'en',
          1: 'fr',
          2: 'de',
          3: 'it',
          4: 'nl',
          5: 'sv',
          6: 'es',
          7: 'da',
          8: 'pt',
          9: 'no',
          10: 'he',
          11: 'ja',
          12: 'ar',
          13: 'fi',
          14: 'el',
          15: 'is',
          16: 'mt',
          17: 'tr',
          18: 'hr',
          19: 'zh-Hant',
          20: 'ur',
          21: 'hi',
          22: 'th',
          23: 'ko',
          24: 'lt',
          25: 'pl',
          26: 'hu',
          27: 'es',
          28: 'lv',
          29: 'se',
          30: 'fo',
          31: 'fa',
          32: 'ru',
          33: 'zh',
          34: 'nl-BE',
          35: 'ga',
          36: 'sq',
          37: 'ro',
          38: 'cz',
          39: 'sk',
          40: 'si',
          41: 'yi',
          42: 'sr',
          43: 'mk',
          44: 'bg',
          45: 'uk',
          46: 'be',
          47: 'uz',
          48: 'kk',
          49: 'az-Cyrl',
          50: 'az-Arab',
          51: 'hy',
          52: 'ka',
          53: 'mo',
          54: 'ky',
          55: 'tg',
          56: 'tk',
          57: 'mn-CN',
          58: 'mn',
          59: 'ps',
          60: 'ks',
          61: 'ku',
          62: 'sd',
          63: 'bo',
          64: 'ne',
          65: 'sa',
          66: 'mr',
          67: 'bn',
          68: 'as',
          69: 'gu',
          70: 'pa',
          71: 'or',
          72: 'ml',
          73: 'kn',
          74: 'ta',
          75: 'te',
          76: 'si',
          77: 'my',
          78: 'km',
          79: 'lo',
          80: 'vi',
          81: 'id',
          82: 'tl',
          83: 'ms',
          84: 'ms-Arab',
          85: 'am',
          86: 'ti',
          87: 'om',
          88: 'so',
          89: 'sw',
          90: 'rw',
          91: 'rn',
          92: 'ny',
          93: 'mg',
          94: 'eo',
          128: 'cy',
          129: 'eu',
          130: 'ca',
          131: 'la',
          132: 'qu',
          133: 'gn',
          134: 'ay',
          135: 'tt',
          136: 'ug',
          137: 'dz',
          138: 'jv',
          139: 'su',
          140: 'gl',
          141: 'af',
          142: 'br',
          143: 'iu',
          144: 'gd',
          145: 'gv',
          146: 'ga',
          147: 'to',
          148: 'el-polyton',
          149: 'kl',
          150: 'az',
          151: 'nn'
        };
        var macLanguageToScript = {
          0: 0,
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
          6: 0,
          7: 0,
          8: 0,
          9: 0,
          10: 5,
          11: 1,
          12: 4,
          13: 0,
          14: 6,
          15: 0,
          16: 0,
          17: 0,
          18: 0,
          19: 2,
          20: 4,
          21: 9,
          22: 21,
          23: 3,
          24: 29,
          25: 29,
          26: 29,
          27: 29,
          28: 29,
          29: 0,
          30: 0,
          31: 4,
          32: 7,
          33: 25,
          34: 0,
          35: 0,
          36: 0,
          37: 0,
          38: 29,
          39: 29,
          40: 0,
          41: 5,
          42: 7,
          43: 7,
          44: 7,
          45: 7,
          46: 7,
          47: 7,
          48: 7,
          49: 7,
          50: 4,
          51: 24,
          52: 23,
          53: 7,
          54: 7,
          55: 7,
          56: 7,
          57: 27,
          58: 7,
          59: 4,
          60: 4,
          61: 4,
          62: 4,
          63: 26,
          64: 9,
          65: 9,
          66: 9,
          67: 13,
          68: 13,
          69: 11,
          70: 10,
          71: 12,
          72: 17,
          73: 16,
          74: 14,
          75: 15,
          76: 18,
          77: 19,
          78: 20,
          79: 22,
          80: 30,
          81: 0,
          82: 0,
          83: 0,
          84: 4,
          85: 28,
          86: 28,
          87: 28,
          88: 0,
          89: 0,
          90: 0,
          91: 0,
          92: 0,
          93: 0,
          94: 0,
          128: 0,
          129: 0,
          130: 0,
          131: 0,
          132: 0,
          133: 0,
          134: 0,
          135: 7,
          136: 4,
          137: 26,
          138: 0,
          139: 0,
          140: 0,
          141: 0,
          142: 0,
          143: 28,
          144: 0,
          145: 0,
          146: 0,
          147: 0,
          148: 6,
          149: 0,
          150: 0,
          151: 0
        };
        var windowsLanguages = {
          0x0436: 'af',
          0x041C: 'sq',
          0x0484: 'gsw',
          0x045E: 'am',
          0x1401: 'ar-DZ',
          0x3C01: 'ar-BH',
          0x0C01: 'ar',
          0x0801: 'ar-IQ',
          0x2C01: 'ar-JO',
          0x3401: 'ar-KW',
          0x3001: 'ar-LB',
          0x1001: 'ar-LY',
          0x1801: 'ary',
          0x2001: 'ar-OM',
          0x4001: 'ar-QA',
          0x0401: 'ar-SA',
          0x2801: 'ar-SY',
          0x1C01: 'aeb',
          0x3801: 'ar-AE',
          0x2401: 'ar-YE',
          0x042B: 'hy',
          0x044D: 'as',
          0x082C: 'az-Cyrl',
          0x042C: 'az',
          0x046D: 'ba',
          0x042D: 'eu',
          0x0423: 'be',
          0x0845: 'bn',
          0x0445: 'bn-IN',
          0x201A: 'bs-Cyrl',
          0x141A: 'bs',
          0x047E: 'br',
          0x0402: 'bg',
          0x0403: 'ca',
          0x0C04: 'zh-HK',
          0x1404: 'zh-MO',
          0x0804: 'zh',
          0x1004: 'zh-SG',
          0x0404: 'zh-TW',
          0x0483: 'co',
          0x041A: 'hr',
          0x101A: 'hr-BA',
          0x0405: 'cs',
          0x0406: 'da',
          0x048C: 'prs',
          0x0465: 'dv',
          0x0813: 'nl-BE',
          0x0413: 'nl',
          0x0C09: 'en-AU',
          0x2809: 'en-BZ',
          0x1009: 'en-CA',
          0x2409: 'en-029',
          0x4009: 'en-IN',
          0x1809: 'en-IE',
          0x2009: 'en-JM',
          0x4409: 'en-MY',
          0x1409: 'en-NZ',
          0x3409: 'en-PH',
          0x4809: 'en-SG',
          0x1C09: 'en-ZA',
          0x2C09: 'en-TT',
          0x0809: 'en-GB',
          0x0409: 'en',
          0x3009: 'en-ZW',
          0x0425: 'et',
          0x0438: 'fo',
          0x0464: 'fil',
          0x040B: 'fi',
          0x080C: 'fr-BE',
          0x0C0C: 'fr-CA',
          0x040C: 'fr',
          0x140C: 'fr-LU',
          0x180C: 'fr-MC',
          0x100C: 'fr-CH',
          0x0462: 'fy',
          0x0456: 'gl',
          0x0437: 'ka',
          0x0C07: 'de-AT',
          0x0407: 'de',
          0x1407: 'de-LI',
          0x1007: 'de-LU',
          0x0807: 'de-CH',
          0x0408: 'el',
          0x046F: 'kl',
          0x0447: 'gu',
          0x0468: 'ha',
          0x040D: 'he',
          0x0439: 'hi',
          0x040E: 'hu',
          0x040F: 'is',
          0x0470: 'ig',
          0x0421: 'id',
          0x045D: 'iu',
          0x085D: 'iu-Latn',
          0x083C: 'ga',
          0x0434: 'xh',
          0x0435: 'zu',
          0x0410: 'it',
          0x0810: 'it-CH',
          0x0411: 'ja',
          0x044B: 'kn',
          0x043F: 'kk',
          0x0453: 'km',
          0x0486: 'quc',
          0x0487: 'rw',
          0x0441: 'sw',
          0x0457: 'kok',
          0x0412: 'ko',
          0x0440: 'ky',
          0x0454: 'lo',
          0x0426: 'lv',
          0x0427: 'lt',
          0x082E: 'dsb',
          0x046E: 'lb',
          0x042F: 'mk',
          0x083E: 'ms-BN',
          0x043E: 'ms',
          0x044C: 'ml',
          0x043A: 'mt',
          0x0481: 'mi',
          0x047A: 'arn',
          0x044E: 'mr',
          0x047C: 'moh',
          0x0450: 'mn',
          0x0850: 'mn-CN',
          0x0461: 'ne',
          0x0414: 'nb',
          0x0814: 'nn',
          0x0482: 'oc',
          0x0448: 'or',
          0x0463: 'ps',
          0x0415: 'pl',
          0x0416: 'pt',
          0x0816: 'pt-PT',
          0x0446: 'pa',
          0x046B: 'qu-BO',
          0x086B: 'qu-EC',
          0x0C6B: 'qu',
          0x0418: 'ro',
          0x0417: 'rm',
          0x0419: 'ru',
          0x243B: 'smn',
          0x103B: 'smj-NO',
          0x143B: 'smj',
          0x0C3B: 'se-FI',
          0x043B: 'se',
          0x083B: 'se-SE',
          0x203B: 'sms',
          0x183B: 'sma-NO',
          0x1C3B: 'sms',
          0x044F: 'sa',
          0x1C1A: 'sr-Cyrl-BA',
          0x0C1A: 'sr',
          0x181A: 'sr-Latn-BA',
          0x081A: 'sr-Latn',
          0x046C: 'nso',
          0x0432: 'tn',
          0x045B: 'si',
          0x041B: 'sk',
          0x0424: 'sl',
          0x2C0A: 'es-AR',
          0x400A: 'es-BO',
          0x340A: 'es-CL',
          0x240A: 'es-CO',
          0x140A: 'es-CR',
          0x1C0A: 'es-DO',
          0x300A: 'es-EC',
          0x440A: 'es-SV',
          0x100A: 'es-GT',
          0x480A: 'es-HN',
          0x080A: 'es-MX',
          0x4C0A: 'es-NI',
          0x180A: 'es-PA',
          0x3C0A: 'es-PY',
          0x280A: 'es-PE',
          0x500A: 'es-PR',
          0x0C0A: 'es',
          0x040A: 'es',
          0x540A: 'es-US',
          0x380A: 'es-UY',
          0x200A: 'es-VE',
          0x081D: 'sv-FI',
          0x041D: 'sv',
          0x045A: 'syr',
          0x0428: 'tg',
          0x085F: 'tzm',
          0x0449: 'ta',
          0x0444: 'tt',
          0x044A: 'te',
          0x041E: 'th',
          0x0451: 'bo',
          0x041F: 'tr',
          0x0442: 'tk',
          0x0480: 'ug',
          0x0422: 'uk',
          0x042E: 'hsb',
          0x0420: 'ur',
          0x0843: 'uz-Cyrl',
          0x0443: 'uz',
          0x042A: 'vi',
          0x0452: 'cy',
          0x0488: 'wo',
          0x0485: 'sah',
          0x0478: 'ii',
          0x046A: 'yo'
        };
        function getLanguageCode(platformID, languageID, ltag) {
          switch (platformID) {
            case 0:
              if (languageID === 0xFFFF) {
                return 'und';
              } else if (ltag) {
                return ltag[languageID];
              }
              break;
            case 1:
              return macLanguages[languageID];
            case 3:
              return windowsLanguages[languageID];
          }
          return undefined;
        }
        var utf16 = 'utf-16';
        var macScriptEncodings = {
          0: 'macintosh',
          1: 'x-mac-japanese',
          2: 'x-mac-chinesetrad',
          3: 'x-mac-korean',
          6: 'x-mac-greek',
          7: 'x-mac-cyrillic',
          9: 'x-mac-devanagai',
          10: 'x-mac-gurmukhi',
          11: 'x-mac-gujarati',
          12: 'x-mac-oriya',
          13: 'x-mac-bengali',
          14: 'x-mac-tamil',
          15: 'x-mac-telugu',
          16: 'x-mac-kannada',
          17: 'x-mac-malayalam',
          18: 'x-mac-sinhalese',
          19: 'x-mac-burmese',
          20: 'x-mac-khmer',
          21: 'x-mac-thai',
          22: 'x-mac-lao',
          23: 'x-mac-georgian',
          24: 'x-mac-armenian',
          25: 'x-mac-chinesesimp',
          26: 'x-mac-tibetan',
          27: 'x-mac-mongolian',
          28: 'x-mac-ethiopic',
          29: 'x-mac-ce',
          30: 'x-mac-vietnamese',
          31: 'x-mac-extarabic'
        };
        var macLanguageEncodings = {
          15: 'x-mac-icelandic',
          17: 'x-mac-turkish',
          18: 'x-mac-croatian',
          24: 'x-mac-ce',
          25: 'x-mac-ce',
          26: 'x-mac-ce',
          27: 'x-mac-ce',
          28: 'x-mac-ce',
          30: 'x-mac-icelandic',
          37: 'x-mac-romanian',
          38: 'x-mac-ce',
          39: 'x-mac-ce',
          40: 'x-mac-ce',
          143: 'x-mac-inuit',
          146: 'x-mac-gaelic'
        };
        function getEncoding(platformID, encodingID, languageID) {
          switch (platformID) {
            case 0:
              return utf16;
            case 1:
              return macLanguageEncodings[languageID] || macScriptEncodings[encodingID];
            case 3:
              if (encodingID === 1 || encodingID === 10) {
                return utf16;
              }
              break;
          }
          return undefined;
        }
        function parseNameTable(data, start, ltag) {
          var name = {};
          var p = new parse.Parser(data, start);
          var format = p.parseUShort();
          var count = p.parseUShort();
          var stringOffset = p.offset + p.parseUShort();
          for (var i = 0; i < count; i++) {
            var platformID = p.parseUShort();
            var encodingID = p.parseUShort();
            var languageID = p.parseUShort();
            var nameID = p.parseUShort();
            var property = nameTableNames[nameID] || nameID;
            var byteLength = p.parseUShort();
            var offset = p.parseUShort();
            var language = getLanguageCode(platformID, languageID, ltag);
            var encoding = getEncoding(platformID, encodingID, languageID);
            if (encoding !== undefined && language !== undefined) {
              var text;
              if (encoding === utf16) {
                text = decode.UTF16(data, stringOffset + offset, byteLength);
              } else {
                text = decode.MACSTRING(data, stringOffset + offset, byteLength, encoding);
              }
              if (text) {
                var translations = name[property];
                if (translations === undefined) {
                  translations = name[property] = {};
                }
                translations[language] = text;
              }
            }
          }
          var langTagCount = 0;
          if (format === 1) {
            langTagCount = p.parseUShort();
          }
          return name;
        }
        function reverseDict(dict) {
          var result = {};
          for (var key in dict) {
            result[dict[key]] = parseInt(key);
          }
          return result;
        }
        function makeNameRecord(platformID, encodingID, languageID, nameID, length, offset) {
          return new table.Table('NameRecord', [{
            name: 'platformID',
            type: 'USHORT',
            value: platformID
          }, {
            name: 'encodingID',
            type: 'USHORT',
            value: encodingID
          }, {
            name: 'languageID',
            type: 'USHORT',
            value: languageID
          }, {
            name: 'nameID',
            type: 'USHORT',
            value: nameID
          }, {
            name: 'length',
            type: 'USHORT',
            value: length
          }, {
            name: 'offset',
            type: 'USHORT',
            value: offset
          }]);
        }
        function findSubArray(needle, haystack) {
          var needleLength = needle.length;
          var limit = haystack.length - needleLength + 1;
          loop: for (var pos = 0; pos < limit; pos++) {
            for (; pos < limit; pos++) {
              for (var k = 0; k < needleLength; k++) {
                if (haystack[pos + k] !== needle[k]) {
                  continue loop;
                }
              }
              return pos;
            }
          }
          return -1;
        }
        function addStringToPool(s, pool) {
          var offset = findSubArray(s, pool);
          if (offset < 0) {
            offset = pool.length;
            for (var i = 0,
                len = s.length; i < len; ++i) {
              pool.push(s[i]);
            }
          }
          return offset;
        }
        function makeNameTable(names, ltag) {
          var nameID;
          var nameIDs = [];
          var namesWithNumericKeys = {};
          var nameTableIds = reverseDict(nameTableNames);
          for (var key in names) {
            var id = nameTableIds[key];
            if (id === undefined) {
              id = key;
            }
            nameID = parseInt(id);
            namesWithNumericKeys[nameID] = names[key];
            nameIDs.push(nameID);
          }
          var macLanguageIds = reverseDict(macLanguages);
          var windowsLanguageIds = reverseDict(windowsLanguages);
          var nameRecords = [];
          var stringPool = [];
          for (var i = 0; i < nameIDs.length; i++) {
            nameID = nameIDs[i];
            var translations = namesWithNumericKeys[nameID];
            for (var lang in translations) {
              var text = translations[lang];
              var macPlatform = 1;
              var macLanguage = macLanguageIds[lang];
              var macScript = macLanguageToScript[macLanguage];
              var macEncoding = getEncoding(macPlatform, macScript, macLanguage);
              var macName = encode.MACSTRING(text, macEncoding);
              if (macName === undefined) {
                macPlatform = 0;
                macLanguage = ltag.indexOf(lang);
                if (macLanguage < 0) {
                  macLanguage = ltag.length;
                  ltag.push(lang);
                }
                macScript = 4;
                macName = encode.UTF16(text);
              }
              var macNameOffset = addStringToPool(macName, stringPool);
              nameRecords.push(makeNameRecord(macPlatform, macScript, macLanguage, nameID, macName.length, macNameOffset));
              var winLanguage = windowsLanguageIds[lang];
              if (winLanguage !== undefined) {
                var winName = encode.UTF16(text);
                var winNameOffset = addStringToPool(winName, stringPool);
                nameRecords.push(makeNameRecord(3, 1, winLanguage, nameID, winName.length, winNameOffset));
              }
            }
          }
          nameRecords.sort(function(a, b) {
            return ((a.platformID - b.platformID) || (a.encodingID - b.encodingID) || (a.languageID - b.languageID) || (a.nameID - b.nameID));
          });
          var t = new table.Table('name', [{
            name: 'format',
            type: 'USHORT',
            value: 0
          }, {
            name: 'count',
            type: 'USHORT',
            value: nameRecords.length
          }, {
            name: 'stringOffset',
            type: 'USHORT',
            value: 6 + nameRecords.length * 12
          }]);
          for (var r = 0; r < nameRecords.length; r++) {
            t.fields.push({
              name: 'record_' + r,
              type: 'TABLE',
              value: nameRecords[r]
            });
          }
          t.fields.push({
            name: 'strings',
            type: 'LITERAL',
            value: stringPool
          });
          return t;
        }
        exports.parse = parseNameTable;
        exports.make = makeNameTable;
      }, {
        "../parse": 11,
        "../table": 13,
        "../types": 30
      }],
      27: [function(_dereq_, module, exports) {
        'use strict';
        var parse = _dereq_('../parse');
        var table = _dereq_('../table');
        var unicodeRanges = [{
          begin: 0x0000,
          end: 0x007F
        }, {
          begin: 0x0080,
          end: 0x00FF
        }, {
          begin: 0x0100,
          end: 0x017F
        }, {
          begin: 0x0180,
          end: 0x024F
        }, {
          begin: 0x0250,
          end: 0x02AF
        }, {
          begin: 0x02B0,
          end: 0x02FF
        }, {
          begin: 0x0300,
          end: 0x036F
        }, {
          begin: 0x0370,
          end: 0x03FF
        }, {
          begin: 0x2C80,
          end: 0x2CFF
        }, {
          begin: 0x0400,
          end: 0x04FF
        }, {
          begin: 0x0530,
          end: 0x058F
        }, {
          begin: 0x0590,
          end: 0x05FF
        }, {
          begin: 0xA500,
          end: 0xA63F
        }, {
          begin: 0x0600,
          end: 0x06FF
        }, {
          begin: 0x07C0,
          end: 0x07FF
        }, {
          begin: 0x0900,
          end: 0x097F
        }, {
          begin: 0x0980,
          end: 0x09FF
        }, {
          begin: 0x0A00,
          end: 0x0A7F
        }, {
          begin: 0x0A80,
          end: 0x0AFF
        }, {
          begin: 0x0B00,
          end: 0x0B7F
        }, {
          begin: 0x0B80,
          end: 0x0BFF
        }, {
          begin: 0x0C00,
          end: 0x0C7F
        }, {
          begin: 0x0C80,
          end: 0x0CFF
        }, {
          begin: 0x0D00,
          end: 0x0D7F
        }, {
          begin: 0x0E00,
          end: 0x0E7F
        }, {
          begin: 0x0E80,
          end: 0x0EFF
        }, {
          begin: 0x10A0,
          end: 0x10FF
        }, {
          begin: 0x1B00,
          end: 0x1B7F
        }, {
          begin: 0x1100,
          end: 0x11FF
        }, {
          begin: 0x1E00,
          end: 0x1EFF
        }, {
          begin: 0x1F00,
          end: 0x1FFF
        }, {
          begin: 0x2000,
          end: 0x206F
        }, {
          begin: 0x2070,
          end: 0x209F
        }, {
          begin: 0x20A0,
          end: 0x20CF
        }, {
          begin: 0x20D0,
          end: 0x20FF
        }, {
          begin: 0x2100,
          end: 0x214F
        }, {
          begin: 0x2150,
          end: 0x218F
        }, {
          begin: 0x2190,
          end: 0x21FF
        }, {
          begin: 0x2200,
          end: 0x22FF
        }, {
          begin: 0x2300,
          end: 0x23FF
        }, {
          begin: 0x2400,
          end: 0x243F
        }, {
          begin: 0x2440,
          end: 0x245F
        }, {
          begin: 0x2460,
          end: 0x24FF
        }, {
          begin: 0x2500,
          end: 0x257F
        }, {
          begin: 0x2580,
          end: 0x259F
        }, {
          begin: 0x25A0,
          end: 0x25FF
        }, {
          begin: 0x2600,
          end: 0x26FF
        }, {
          begin: 0x2700,
          end: 0x27BF
        }, {
          begin: 0x3000,
          end: 0x303F
        }, {
          begin: 0x3040,
          end: 0x309F
        }, {
          begin: 0x30A0,
          end: 0x30FF
        }, {
          begin: 0x3100,
          end: 0x312F
        }, {
          begin: 0x3130,
          end: 0x318F
        }, {
          begin: 0xA840,
          end: 0xA87F
        }, {
          begin: 0x3200,
          end: 0x32FF
        }, {
          begin: 0x3300,
          end: 0x33FF
        }, {
          begin: 0xAC00,
          end: 0xD7AF
        }, {
          begin: 0xD800,
          end: 0xDFFF
        }, {
          begin: 0x10900,
          end: 0x1091F
        }, {
          begin: 0x4E00,
          end: 0x9FFF
        }, {
          begin: 0xE000,
          end: 0xF8FF
        }, {
          begin: 0x31C0,
          end: 0x31EF
        }, {
          begin: 0xFB00,
          end: 0xFB4F
        }, {
          begin: 0xFB50,
          end: 0xFDFF
        }, {
          begin: 0xFE20,
          end: 0xFE2F
        }, {
          begin: 0xFE10,
          end: 0xFE1F
        }, {
          begin: 0xFE50,
          end: 0xFE6F
        }, {
          begin: 0xFE70,
          end: 0xFEFF
        }, {
          begin: 0xFF00,
          end: 0xFFEF
        }, {
          begin: 0xFFF0,
          end: 0xFFFF
        }, {
          begin: 0x0F00,
          end: 0x0FFF
        }, {
          begin: 0x0700,
          end: 0x074F
        }, {
          begin: 0x0780,
          end: 0x07BF
        }, {
          begin: 0x0D80,
          end: 0x0DFF
        }, {
          begin: 0x1000,
          end: 0x109F
        }, {
          begin: 0x1200,
          end: 0x137F
        }, {
          begin: 0x13A0,
          end: 0x13FF
        }, {
          begin: 0x1400,
          end: 0x167F
        }, {
          begin: 0x1680,
          end: 0x169F
        }, {
          begin: 0x16A0,
          end: 0x16FF
        }, {
          begin: 0x1780,
          end: 0x17FF
        }, {
          begin: 0x1800,
          end: 0x18AF
        }, {
          begin: 0x2800,
          end: 0x28FF
        }, {
          begin: 0xA000,
          end: 0xA48F
        }, {
          begin: 0x1700,
          end: 0x171F
        }, {
          begin: 0x10300,
          end: 0x1032F
        }, {
          begin: 0x10330,
          end: 0x1034F
        }, {
          begin: 0x10400,
          end: 0x1044F
        }, {
          begin: 0x1D000,
          end: 0x1D0FF
        }, {
          begin: 0x1D400,
          end: 0x1D7FF
        }, {
          begin: 0xFF000,
          end: 0xFFFFD
        }, {
          begin: 0xFE00,
          end: 0xFE0F
        }, {
          begin: 0xE0000,
          end: 0xE007F
        }, {
          begin: 0x1900,
          end: 0x194F
        }, {
          begin: 0x1950,
          end: 0x197F
        }, {
          begin: 0x1980,
          end: 0x19DF
        }, {
          begin: 0x1A00,
          end: 0x1A1F
        }, {
          begin: 0x2C00,
          end: 0x2C5F
        }, {
          begin: 0x2D30,
          end: 0x2D7F
        }, {
          begin: 0x4DC0,
          end: 0x4DFF
        }, {
          begin: 0xA800,
          end: 0xA82F
        }, {
          begin: 0x10000,
          end: 0x1007F
        }, {
          begin: 0x10140,
          end: 0x1018F
        }, {
          begin: 0x10380,
          end: 0x1039F
        }, {
          begin: 0x103A0,
          end: 0x103DF
        }, {
          begin: 0x10450,
          end: 0x1047F
        }, {
          begin: 0x10480,
          end: 0x104AF
        }, {
          begin: 0x10800,
          end: 0x1083F
        }, {
          begin: 0x10A00,
          end: 0x10A5F
        }, {
          begin: 0x1D300,
          end: 0x1D35F
        }, {
          begin: 0x12000,
          end: 0x123FF
        }, {
          begin: 0x1D360,
          end: 0x1D37F
        }, {
          begin: 0x1B80,
          end: 0x1BBF
        }, {
          begin: 0x1C00,
          end: 0x1C4F
        }, {
          begin: 0x1C50,
          end: 0x1C7F
        }, {
          begin: 0xA880,
          end: 0xA8DF
        }, {
          begin: 0xA900,
          end: 0xA92F
        }, {
          begin: 0xA930,
          end: 0xA95F
        }, {
          begin: 0xAA00,
          end: 0xAA5F
        }, {
          begin: 0x10190,
          end: 0x101CF
        }, {
          begin: 0x101D0,
          end: 0x101FF
        }, {
          begin: 0x102A0,
          end: 0x102DF
        }, {
          begin: 0x1F030,
          end: 0x1F09F
        }];
        function getUnicodeRange(unicode) {
          for (var i = 0; i < unicodeRanges.length; i += 1) {
            var range = unicodeRanges[i];
            if (unicode >= range.begin && unicode < range.end) {
              return i;
            }
          }
          return -1;
        }
        function parseOS2Table(data, start) {
          var os2 = {};
          var p = new parse.Parser(data, start);
          os2.version = p.parseUShort();
          os2.xAvgCharWidth = p.parseShort();
          os2.usWeightClass = p.parseUShort();
          os2.usWidthClass = p.parseUShort();
          os2.fsType = p.parseUShort();
          os2.ySubscriptXSize = p.parseShort();
          os2.ySubscriptYSize = p.parseShort();
          os2.ySubscriptXOffset = p.parseShort();
          os2.ySubscriptYOffset = p.parseShort();
          os2.ySuperscriptXSize = p.parseShort();
          os2.ySuperscriptYSize = p.parseShort();
          os2.ySuperscriptXOffset = p.parseShort();
          os2.ySuperscriptYOffset = p.parseShort();
          os2.yStrikeoutSize = p.parseShort();
          os2.yStrikeoutPosition = p.parseShort();
          os2.sFamilyClass = p.parseShort();
          os2.panose = [];
          for (var i = 0; i < 10; i++) {
            os2.panose[i] = p.parseByte();
          }
          os2.ulUnicodeRange1 = p.parseULong();
          os2.ulUnicodeRange2 = p.parseULong();
          os2.ulUnicodeRange3 = p.parseULong();
          os2.ulUnicodeRange4 = p.parseULong();
          os2.achVendID = String.fromCharCode(p.parseByte(), p.parseByte(), p.parseByte(), p.parseByte());
          os2.fsSelection = p.parseUShort();
          os2.usFirstCharIndex = p.parseUShort();
          os2.usLastCharIndex = p.parseUShort();
          os2.sTypoAscender = p.parseShort();
          os2.sTypoDescender = p.parseShort();
          os2.sTypoLineGap = p.parseShort();
          os2.usWinAscent = p.parseUShort();
          os2.usWinDescent = p.parseUShort();
          if (os2.version >= 1) {
            os2.ulCodePageRange1 = p.parseULong();
            os2.ulCodePageRange2 = p.parseULong();
          }
          if (os2.version >= 2) {
            os2.sxHeight = p.parseShort();
            os2.sCapHeight = p.parseShort();
            os2.usDefaultChar = p.parseUShort();
            os2.usBreakChar = p.parseUShort();
            os2.usMaxContent = p.parseUShort();
          }
          return os2;
        }
        function makeOS2Table(options) {
          return new table.Table('OS/2', [{
            name: 'version',
            type: 'USHORT',
            value: 0x0003
          }, {
            name: 'xAvgCharWidth',
            type: 'SHORT',
            value: 0
          }, {
            name: 'usWeightClass',
            type: 'USHORT',
            value: 0
          }, {
            name: 'usWidthClass',
            type: 'USHORT',
            value: 0
          }, {
            name: 'fsType',
            type: 'USHORT',
            value: 0
          }, {
            name: 'ySubscriptXSize',
            type: 'SHORT',
            value: 650
          }, {
            name: 'ySubscriptYSize',
            type: 'SHORT',
            value: 699
          }, {
            name: 'ySubscriptXOffset',
            type: 'SHORT',
            value: 0
          }, {
            name: 'ySubscriptYOffset',
            type: 'SHORT',
            value: 140
          }, {
            name: 'ySuperscriptXSize',
            type: 'SHORT',
            value: 650
          }, {
            name: 'ySuperscriptYSize',
            type: 'SHORT',
            value: 699
          }, {
            name: 'ySuperscriptXOffset',
            type: 'SHORT',
            value: 0
          }, {
            name: 'ySuperscriptYOffset',
            type: 'SHORT',
            value: 479
          }, {
            name: 'yStrikeoutSize',
            type: 'SHORT',
            value: 49
          }, {
            name: 'yStrikeoutPosition',
            type: 'SHORT',
            value: 258
          }, {
            name: 'sFamilyClass',
            type: 'SHORT',
            value: 0
          }, {
            name: 'bFamilyType',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bSerifStyle',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bWeight',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bProportion',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bContrast',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bStrokeVariation',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bArmStyle',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bLetterform',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bMidline',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bXHeight',
            type: 'BYTE',
            value: 0
          }, {
            name: 'ulUnicodeRange1',
            type: 'ULONG',
            value: 0
          }, {
            name: 'ulUnicodeRange2',
            type: 'ULONG',
            value: 0
          }, {
            name: 'ulUnicodeRange3',
            type: 'ULONG',
            value: 0
          }, {
            name: 'ulUnicodeRange4',
            type: 'ULONG',
            value: 0
          }, {
            name: 'achVendID',
            type: 'CHARARRAY',
            value: 'XXXX'
          }, {
            name: 'fsSelection',
            type: 'USHORT',
            value: 0
          }, {
            name: 'usFirstCharIndex',
            type: 'USHORT',
            value: 0
          }, {
            name: 'usLastCharIndex',
            type: 'USHORT',
            value: 0
          }, {
            name: 'sTypoAscender',
            type: 'SHORT',
            value: 0
          }, {
            name: 'sTypoDescender',
            type: 'SHORT',
            value: 0
          }, {
            name: 'sTypoLineGap',
            type: 'SHORT',
            value: 0
          }, {
            name: 'usWinAscent',
            type: 'USHORT',
            value: 0
          }, {
            name: 'usWinDescent',
            type: 'USHORT',
            value: 0
          }, {
            name: 'ulCodePageRange1',
            type: 'ULONG',
            value: 0
          }, {
            name: 'ulCodePageRange2',
            type: 'ULONG',
            value: 0
          }, {
            name: 'sxHeight',
            type: 'SHORT',
            value: 0
          }, {
            name: 'sCapHeight',
            type: 'SHORT',
            value: 0
          }, {
            name: 'usDefaultChar',
            type: 'USHORT',
            value: 0
          }, {
            name: 'usBreakChar',
            type: 'USHORT',
            value: 0
          }, {
            name: 'usMaxContext',
            type: 'USHORT',
            value: 0
          }], options);
        }
        exports.unicodeRanges = unicodeRanges;
        exports.getUnicodeRange = getUnicodeRange;
        exports.parse = parseOS2Table;
        exports.make = makeOS2Table;
      }, {
        "../parse": 11,
        "../table": 13
      }],
      28: [function(_dereq_, module, exports) {
        'use strict';
        var encoding = _dereq_('../encoding');
        var parse = _dereq_('../parse');
        var table = _dereq_('../table');
        function parsePostTable(data, start) {
          var post = {};
          var p = new parse.Parser(data, start);
          var i;
          post.version = p.parseVersion();
          post.italicAngle = p.parseFixed();
          post.underlinePosition = p.parseShort();
          post.underlineThickness = p.parseShort();
          post.isFixedPitch = p.parseULong();
          post.minMemType42 = p.parseULong();
          post.maxMemType42 = p.parseULong();
          post.minMemType1 = p.parseULong();
          post.maxMemType1 = p.parseULong();
          switch (post.version) {
            case 1:
              post.names = encoding.standardNames.slice();
              break;
            case 2:
              post.numberOfGlyphs = p.parseUShort();
              post.glyphNameIndex = new Array(post.numberOfGlyphs);
              for (i = 0; i < post.numberOfGlyphs; i++) {
                post.glyphNameIndex[i] = p.parseUShort();
              }
              post.names = [];
              for (i = 0; i < post.numberOfGlyphs; i++) {
                if (post.glyphNameIndex[i] >= encoding.standardNames.length) {
                  var nameLength = p.parseChar();
                  post.names.push(p.parseString(nameLength));
                }
              }
              break;
            case 2.5:
              post.numberOfGlyphs = p.parseUShort();
              post.offset = new Array(post.numberOfGlyphs);
              for (i = 0; i < post.numberOfGlyphs; i++) {
                post.offset[i] = p.parseChar();
              }
              break;
          }
          return post;
        }
        function makePostTable() {
          return new table.Table('post', [{
            name: 'version',
            type: 'FIXED',
            value: 0x00030000
          }, {
            name: 'italicAngle',
            type: 'FIXED',
            value: 0
          }, {
            name: 'underlinePosition',
            type: 'FWORD',
            value: 0
          }, {
            name: 'underlineThickness',
            type: 'FWORD',
            value: 0
          }, {
            name: 'isFixedPitch',
            type: 'ULONG',
            value: 0
          }, {
            name: 'minMemType42',
            type: 'ULONG',
            value: 0
          }, {
            name: 'maxMemType42',
            type: 'ULONG',
            value: 0
          }, {
            name: 'minMemType1',
            type: 'ULONG',
            value: 0
          }, {
            name: 'maxMemType1',
            type: 'ULONG',
            value: 0
          }]);
        }
        exports.parse = parsePostTable;
        exports.make = makePostTable;
      }, {
        "../encoding": 6,
        "../parse": 11,
        "../table": 13
      }],
      29: [function(_dereq_, module, exports) {
        'use strict';
        var check = _dereq_('../check');
        var table = _dereq_('../table');
        var cmap = _dereq_('./cmap');
        var cff = _dereq_('./cff');
        var head = _dereq_('./head');
        var hhea = _dereq_('./hhea');
        var hmtx = _dereq_('./hmtx');
        var ltag = _dereq_('./ltag');
        var maxp = _dereq_('./maxp');
        var _name = _dereq_('./name');
        var os2 = _dereq_('./os2');
        var post = _dereq_('./post');
        function log2(v) {
          return Math.log(v) / Math.log(2) | 0;
        }
        function computeCheckSum(bytes) {
          while (bytes.length % 4 !== 0) {
            bytes.push(0);
          }
          var sum = 0;
          for (var i = 0; i < bytes.length; i += 4) {
            sum += (bytes[i] << 24) + (bytes[i + 1] << 16) + (bytes[i + 2] << 8) + (bytes[i + 3]);
          }
          sum %= Math.pow(2, 32);
          return sum;
        }
        function makeTableRecord(tag, checkSum, offset, length) {
          return new table.Table('Table Record', [{
            name: 'tag',
            type: 'TAG',
            value: tag !== undefined ? tag : ''
          }, {
            name: 'checkSum',
            type: 'ULONG',
            value: checkSum !== undefined ? checkSum : 0
          }, {
            name: 'offset',
            type: 'ULONG',
            value: offset !== undefined ? offset : 0
          }, {
            name: 'length',
            type: 'ULONG',
            value: length !== undefined ? length : 0
          }]);
        }
        function makeSfntTable(tables) {
          var sfnt = new table.Table('sfnt', [{
            name: 'version',
            type: 'TAG',
            value: 'OTTO'
          }, {
            name: 'numTables',
            type: 'USHORT',
            value: 0
          }, {
            name: 'searchRange',
            type: 'USHORT',
            value: 0
          }, {
            name: 'entrySelector',
            type: 'USHORT',
            value: 0
          }, {
            name: 'rangeShift',
            type: 'USHORT',
            value: 0
          }]);
          sfnt.tables = tables;
          sfnt.numTables = tables.length;
          var highestPowerOf2 = Math.pow(2, log2(sfnt.numTables));
          sfnt.searchRange = 16 * highestPowerOf2;
          sfnt.entrySelector = log2(highestPowerOf2);
          sfnt.rangeShift = sfnt.numTables * 16 - sfnt.searchRange;
          var recordFields = [];
          var tableFields = [];
          var offset = sfnt.sizeOf() + (makeTableRecord().sizeOf() * sfnt.numTables);
          while (offset % 4 !== 0) {
            offset += 1;
            tableFields.push({
              name: 'padding',
              type: 'BYTE',
              value: 0
            });
          }
          for (var i = 0; i < tables.length; i += 1) {
            var t = tables[i];
            check.argument(t.tableName.length === 4, 'Table name' + t.tableName + ' is invalid.');
            var tableLength = t.sizeOf();
            var tableRecord = makeTableRecord(t.tableName, computeCheckSum(t.encode()), offset, tableLength);
            recordFields.push({
              name: tableRecord.tag + ' Table Record',
              type: 'TABLE',
              value: tableRecord
            });
            tableFields.push({
              name: t.tableName + ' table',
              type: 'TABLE',
              value: t
            });
            offset += tableLength;
            check.argument(!isNaN(offset), 'Something went wrong calculating the offset.');
            while (offset % 4 !== 0) {
              offset += 1;
              tableFields.push({
                name: 'padding',
                type: 'BYTE',
                value: 0
              });
            }
          }
          recordFields.sort(function(r1, r2) {
            if (r1.value.tag > r2.value.tag) {
              return 1;
            } else {
              return -1;
            }
          });
          sfnt.fields = sfnt.fields.concat(recordFields);
          sfnt.fields = sfnt.fields.concat(tableFields);
          return sfnt;
        }
        function metricsForChar(font, chars, notFoundMetrics) {
          for (var i = 0; i < chars.length; i += 1) {
            var glyphIndex = font.charToGlyphIndex(chars[i]);
            if (glyphIndex > 0) {
              var glyph = font.glyphs.get(glyphIndex);
              return glyph.getMetrics();
            }
          }
          return notFoundMetrics;
        }
        function average(vs) {
          var sum = 0;
          for (var i = 0; i < vs.length; i += 1) {
            sum += vs[i];
          }
          return sum / vs.length;
        }
        function fontToSfntTable(font) {
          var xMins = [];
          var yMins = [];
          var xMaxs = [];
          var yMaxs = [];
          var advanceWidths = [];
          var leftSideBearings = [];
          var rightSideBearings = [];
          var firstCharIndex;
          var lastCharIndex = 0;
          var ulUnicodeRange1 = 0;
          var ulUnicodeRange2 = 0;
          var ulUnicodeRange3 = 0;
          var ulUnicodeRange4 = 0;
          for (var i = 0; i < font.glyphs.length; i += 1) {
            var glyph = font.glyphs.get(i);
            var unicode = glyph.unicode | 0;
            if (firstCharIndex > unicode || firstCharIndex === null) {
              firstCharIndex = unicode;
            }
            if (lastCharIndex < unicode) {
              lastCharIndex = unicode;
            }
            var position = os2.getUnicodeRange(unicode);
            if (position < 32) {
              ulUnicodeRange1 |= 1 << position;
            } else if (position < 64) {
              ulUnicodeRange2 |= 1 << position - 32;
            } else if (position < 96) {
              ulUnicodeRange3 |= 1 << position - 64;
            } else if (position < 123) {
              ulUnicodeRange4 |= 1 << position - 96;
            } else {
              throw new Error('Unicode ranges bits > 123 are reserved for internal usage');
            }
            if (glyph.name === '.notdef')
              continue;
            var metrics = glyph.getMetrics();
            xMins.push(metrics.xMin);
            yMins.push(metrics.yMin);
            xMaxs.push(metrics.xMax);
            yMaxs.push(metrics.yMax);
            leftSideBearings.push(metrics.leftSideBearing);
            rightSideBearings.push(metrics.rightSideBearing);
            advanceWidths.push(glyph.advanceWidth);
          }
          var globals = {
            xMin: Math.min.apply(null, xMins),
            yMin: Math.min.apply(null, yMins),
            xMax: Math.max.apply(null, xMaxs),
            yMax: Math.max.apply(null, yMaxs),
            advanceWidthMax: Math.max.apply(null, advanceWidths),
            advanceWidthAvg: average(advanceWidths),
            minLeftSideBearing: Math.min.apply(null, leftSideBearings),
            maxLeftSideBearing: Math.max.apply(null, leftSideBearings),
            minRightSideBearing: Math.min.apply(null, rightSideBearings)
          };
          globals.ascender = font.ascender !== undefined ? font.ascender : globals.yMax;
          globals.descender = font.descender !== undefined ? font.descender : globals.yMin;
          var headTable = head.make({
            unitsPerEm: font.unitsPerEm,
            xMin: globals.xMin,
            yMin: globals.yMin,
            xMax: globals.xMax,
            yMax: globals.yMax
          });
          var hheaTable = hhea.make({
            ascender: globals.ascender,
            descender: globals.descender,
            advanceWidthMax: globals.advanceWidthMax,
            minLeftSideBearing: globals.minLeftSideBearing,
            minRightSideBearing: globals.minRightSideBearing,
            xMaxExtent: globals.maxLeftSideBearing + (globals.xMax - globals.xMin),
            numberOfHMetrics: font.glyphs.length
          });
          var maxpTable = maxp.make(font.glyphs.length);
          var os2Table = os2.make({
            xAvgCharWidth: Math.round(globals.advanceWidthAvg),
            usWeightClass: 500,
            usWidthClass: 5,
            usFirstCharIndex: firstCharIndex,
            usLastCharIndex: lastCharIndex,
            ulUnicodeRange1: ulUnicodeRange1,
            ulUnicodeRange2: ulUnicodeRange2,
            ulUnicodeRange3: ulUnicodeRange3,
            ulUnicodeRange4: ulUnicodeRange4,
            sTypoAscender: globals.ascender,
            sTypoDescender: globals.descender,
            sTypoLineGap: 0,
            usWinAscent: globals.ascender,
            usWinDescent: -globals.descender,
            sxHeight: metricsForChar(font, 'xyvw', {yMax: 0}).yMax,
            sCapHeight: metricsForChar(font, 'HIKLEFJMNTZBDPRAGOQSUVWXY', globals).yMax,
            usBreakChar: font.hasChar(' ') ? 32 : 0
          });
          var hmtxTable = hmtx.make(font.glyphs);
          var cmapTable = cmap.make(font.glyphs);
          var englishFamilyName = font.getEnglishName('fontFamily');
          var englishStyleName = font.getEnglishName('fontSubfamily');
          var englishFullName = englishFamilyName + ' ' + englishStyleName;
          var postScriptName = font.getEnglishName('postScriptName');
          if (!postScriptName) {
            postScriptName = englishFamilyName.replace(/\s/g, '') + '-' + englishStyleName;
          }
          var names = {};
          for (var n in font.names) {
            names[n] = font.names[n];
          }
          if (!names.uniqueID) {
            names.uniqueID = {en: font.getEnglishName('manufacturer') + ':' + englishFullName};
          }
          if (!names.postScriptName) {
            names.postScriptName = {en: postScriptName};
          }
          if (!names.preferredFamily) {
            names.preferredFamily = font.names.fontFamily;
          }
          if (!names.preferredSubfamily) {
            names.preferredSubfamily = font.names.fontSubfamily;
          }
          var languageTags = [];
          var nameTable = _name.make(names, languageTags);
          var ltagTable = (languageTags.length > 0 ? ltag.make(languageTags) : undefined);
          var postTable = post.make();
          var cffTable = cff.make(font.glyphs, {
            version: font.getEnglishName('version'),
            fullName: englishFullName,
            familyName: englishFamilyName,
            weightName: englishStyleName,
            postScriptName: postScriptName,
            unitsPerEm: font.unitsPerEm
          });
          var tables = [headTable, hheaTable, maxpTable, os2Table, nameTable, cmapTable, postTable, cffTable, hmtxTable];
          if (ltagTable) {
            tables.push(ltagTable);
          }
          var sfntTable = makeSfntTable(tables);
          var bytes = sfntTable.encode();
          var checkSum = computeCheckSum(bytes);
          var tableFields = sfntTable.fields;
          var checkSumAdjusted = false;
          for (i = 0; i < tableFields.length; i += 1) {
            if (tableFields[i].name === 'head table') {
              tableFields[i].value.checkSumAdjustment = 0xB1B0AFBA - checkSum;
              checkSumAdjusted = true;
              break;
            }
          }
          if (!checkSumAdjusted) {
            throw new Error('Could not find head table with checkSum to adjust.');
          }
          return sfntTable;
        }
        exports.computeCheckSum = computeCheckSum;
        exports.make = makeSfntTable;
        exports.fontToTable = fontToSfntTable;
      }, {
        "../check": 4,
        "../table": 13,
        "./cff": 14,
        "./cmap": 15,
        "./head": 19,
        "./hhea": 20,
        "./hmtx": 21,
        "./ltag": 24,
        "./maxp": 25,
        "./name": 26,
        "./os2": 27,
        "./post": 28
      }],
      30: [function(_dereq_, module, exports) {
        'use strict';
        var check = _dereq_('./check');
        var LIMIT16 = 32768;
        var LIMIT32 = 2147483648;
        var decode = {};
        var encode = {};
        var sizeOf = {};
        function constant(v) {
          return function() {
            return v;
          };
        }
        encode.BYTE = function(v) {
          check.argument(v >= 0 && v <= 255, 'Byte value should be between 0 and 255.');
          return [v];
        };
        sizeOf.BYTE = constant(1);
        encode.CHAR = function(v) {
          return [v.charCodeAt(0)];
        };
        sizeOf.CHAR = constant(1);
        encode.CHARARRAY = function(v) {
          var b = [];
          for (var i = 0; i < v.length; i += 1) {
            b.push(v.charCodeAt(i));
          }
          return b;
        };
        sizeOf.CHARARRAY = function(v) {
          return v.length;
        };
        encode.USHORT = function(v) {
          return [(v >> 8) & 0xFF, v & 0xFF];
        };
        sizeOf.USHORT = constant(2);
        encode.SHORT = function(v) {
          if (v >= LIMIT16) {
            v = -(2 * LIMIT16 - v);
          }
          return [(v >> 8) & 0xFF, v & 0xFF];
        };
        sizeOf.SHORT = constant(2);
        encode.UINT24 = function(v) {
          return [(v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
        };
        sizeOf.UINT24 = constant(3);
        encode.ULONG = function(v) {
          return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
        };
        sizeOf.ULONG = constant(4);
        encode.LONG = function(v) {
          if (v >= LIMIT32) {
            v = -(2 * LIMIT32 - v);
          }
          return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
        };
        sizeOf.LONG = constant(4);
        encode.FIXED = encode.ULONG;
        sizeOf.FIXED = sizeOf.ULONG;
        encode.FWORD = encode.SHORT;
        sizeOf.FWORD = sizeOf.SHORT;
        encode.UFWORD = encode.USHORT;
        sizeOf.UFWORD = sizeOf.USHORT;
        encode.LONGDATETIME = function() {
          return [0, 0, 0, 0, 0, 0, 0, 0];
        };
        sizeOf.LONGDATETIME = constant(8);
        encode.TAG = function(v) {
          check.argument(v.length === 4, 'Tag should be exactly 4 ASCII characters.');
          return [v.charCodeAt(0), v.charCodeAt(1), v.charCodeAt(2), v.charCodeAt(3)];
        };
        sizeOf.TAG = constant(4);
        encode.Card8 = encode.BYTE;
        sizeOf.Card8 = sizeOf.BYTE;
        encode.Card16 = encode.USHORT;
        sizeOf.Card16 = sizeOf.USHORT;
        encode.OffSize = encode.BYTE;
        sizeOf.OffSize = sizeOf.BYTE;
        encode.SID = encode.USHORT;
        sizeOf.SID = sizeOf.USHORT;
        encode.NUMBER = function(v) {
          if (v >= -107 && v <= 107) {
            return [v + 139];
          } else if (v >= 108 && v <= 1131) {
            v = v - 108;
            return [(v >> 8) + 247, v & 0xFF];
          } else if (v >= -1131 && v <= -108) {
            v = -v - 108;
            return [(v >> 8) + 251, v & 0xFF];
          } else if (v >= -32768 && v <= 32767) {
            return encode.NUMBER16(v);
          } else {
            return encode.NUMBER32(v);
          }
        };
        sizeOf.NUMBER = function(v) {
          return encode.NUMBER(v).length;
        };
        encode.NUMBER16 = function(v) {
          return [28, (v >> 8) & 0xFF, v & 0xFF];
        };
        sizeOf.NUMBER16 = constant(3);
        encode.NUMBER32 = function(v) {
          return [29, (v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
        };
        sizeOf.NUMBER32 = constant(5);
        encode.REAL = function(v) {
          var value = v.toString();
          var m = /\.(\d*?)(?:9{5,20}|0{5,20})\d{0,2}(?:e(.+)|$)/.exec(value);
          if (m) {
            var epsilon = parseFloat('1e' + ((m[2] ? +m[2] : 0) + m[1].length));
            value = (Math.round(v * epsilon) / epsilon).toString();
          }
          var nibbles = '';
          var i;
          var ii;
          for (i = 0, ii = value.length; i < ii; i += 1) {
            var c = value[i];
            if (c === 'e') {
              nibbles += value[++i] === '-' ? 'c' : 'b';
            } else if (c === '.') {
              nibbles += 'a';
            } else if (c === '-') {
              nibbles += 'e';
            } else {
              nibbles += c;
            }
          }
          nibbles += (nibbles.length & 1) ? 'f' : 'ff';
          var out = [30];
          for (i = 0, ii = nibbles.length; i < ii; i += 2) {
            out.push(parseInt(nibbles.substr(i, 2), 16));
          }
          return out;
        };
        sizeOf.REAL = function(v) {
          return encode.REAL(v).length;
        };
        encode.NAME = encode.CHARARRAY;
        sizeOf.NAME = sizeOf.CHARARRAY;
        encode.STRING = encode.CHARARRAY;
        sizeOf.STRING = sizeOf.CHARARRAY;
        decode.UTF16 = function(data, offset, numBytes) {
          var codePoints = [];
          var numChars = numBytes / 2;
          for (var j = 0; j < numChars; j++, offset += 2) {
            codePoints[j] = data.getUint16(offset);
          }
          return String.fromCharCode.apply(null, codePoints);
        };
        encode.UTF16 = function(v) {
          var b = [];
          for (var i = 0; i < v.length; i += 1) {
            var codepoint = v.charCodeAt(i);
            b.push((codepoint >> 8) & 0xFF);
            b.push(codepoint & 0xFF);
          }
          return b;
        };
        sizeOf.UTF16 = function(v) {
          return v.length * 2;
        };
        var eightBitMacEncodings = {
          'x-mac-croatian': 'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®Š™´¨≠ŽØ∞±≤≥∆µ∂∑∏š∫ªºΩžø' + '¿¡¬√ƒ≈Ć«Č… ÀÃÕŒœĐ—“”‘’÷◊©⁄€‹›Æ»–·‚„‰ÂćÁčÈÍÎÏÌÓÔđÒÚÛÙıˆ˜¯πË˚¸Êæˇ',
          'x-mac-cyrillic': 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°Ґ£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµґЈЄєЇїЉљЊњ' + 'јЅ¬√ƒ≈∆«»… ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю',
          'x-mac-gaelic': 'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØḂ±≤≥ḃĊċḊḋḞḟĠġṀæø' + 'ṁṖṗɼƒſṠ«»… ÀÃÕŒœ–—“”‘’ṡẛÿŸṪ€‹›Ŷŷṫ·Ỳỳ⁊ÂÊÁËÈÍÎÏÌÓÔ♣ÒÚÛÙıÝýŴŵẄẅẀẁẂẃ',
          'x-mac-greek': 'Ä¹²É³ÖÜ΅àâä΄¨çéèêë£™îï•½‰ôö¦€ùûü†ΓΔΘΛΞΠß®©ΣΪ§≠°·Α±≤≥¥ΒΕΖΗΙΚΜΦΫΨΩ' + 'άΝ¬ΟΡ≈Τ«»… ΥΧΆΈœ–―“”‘’÷ΉΊΌΎέήίόΏύαβψδεφγηιξκλμνοπώρστθωςχυζϊϋΐΰ\u00AD',
          'x-mac-icelandic': 'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûüÝ°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø' + '¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€ÐðÞþý·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ',
          'x-mac-inuit': 'ᐃᐄᐅᐆᐊᐋᐱᐲᐳᐴᐸᐹᑉᑎᑏᑐᑑᑕᑖᑦᑭᑮᑯᑰᑲᑳᒃᒋᒌᒍᒎᒐᒑ°ᒡᒥᒦ•¶ᒧ®©™ᒨᒪᒫᒻᓂᓃᓄᓅᓇᓈᓐᓯᓰᓱᓲᓴᓵᔅᓕᓖᓗ' + 'ᓘᓚᓛᓪᔨᔩᔪᔫᔭ… ᔮᔾᕕᕖᕗ–—“”‘’ᕘᕙᕚᕝᕆᕇᕈᕉᕋᕌᕐᕿᖀᖁᖂᖃᖄᖅᖏᖐᖑᖒᖓᖔᖕᙱᙲᙳᙴᙵᙶᖖᖠᖡᖢᖣᖤᖥᖦᕼŁł',
          'x-mac-ce': 'ÄĀāÉĄÖÜáąČäčĆćéŹźĎíďĒēĖóėôöõúĚěü†°Ę£§•¶ß®©™ę¨≠ģĮįĪ≤≥īĶ∂∑łĻļĽľĹĺŅ' + 'ņŃ¬√ńŇ∆«»… ňŐÕőŌ–—“”‘’÷◊ōŔŕŘ‹›řŖŗŠ‚„šŚśÁŤťÍŽžŪÓÔūŮÚůŰűŲųÝýķŻŁżĢˇ',
          macintosh: 'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø' + '¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ',
          'x-mac-romanian': 'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ĂȘ∞±≤≥¥µ∂∑∏π∫ªºΩăș' + '¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›Țț‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ',
          'x-mac-turkish': 'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø' + '¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸĞğİıŞş‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙˆ˜¯˘˙˚¸˝˛ˇ'
        };
        decode.MACSTRING = function(dataView, offset, dataLength, encoding) {
          var table = eightBitMacEncodings[encoding];
          if (table === undefined) {
            return undefined;
          }
          var result = '';
          for (var i = 0; i < dataLength; i++) {
            var c = dataView.getUint8(offset + i);
            if (c <= 0x7F) {
              result += String.fromCharCode(c);
            } else {
              result += table[c & 0x7F];
            }
          }
          return result;
        };
        var macEncodingTableCache = typeof WeakMap === 'function' && new WeakMap();
        var macEncodingCacheKeys;
        var getMacEncodingTable = function(encoding) {
          if (!macEncodingCacheKeys) {
            macEncodingCacheKeys = {};
            for (var e in eightBitMacEncodings) {
              macEncodingCacheKeys[e] = new String(e);
            }
          }
          var cacheKey = macEncodingCacheKeys[encoding];
          if (cacheKey === undefined) {
            return undefined;
          }
          if (macEncodingTableCache) {
            var cachedTable = macEncodingTableCache.get(cacheKey);
            if (cachedTable !== undefined) {
              return cachedTable;
            }
          }
          var decodingTable = eightBitMacEncodings[encoding];
          if (decodingTable === undefined) {
            return undefined;
          }
          var encodingTable = {};
          for (var i = 0; i < decodingTable.length; i++) {
            encodingTable[decodingTable.charCodeAt(i)] = i + 0x80;
          }
          if (macEncodingTableCache) {
            macEncodingTableCache.set(cacheKey, encodingTable);
          }
          return encodingTable;
        };
        encode.MACSTRING = function(str, encoding) {
          var table = getMacEncodingTable(encoding);
          if (table === undefined) {
            return undefined;
          }
          var result = [];
          for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            if (c >= 0x80) {
              c = table[c];
              if (c === undefined) {
                return undefined;
              }
            }
            result.push(c);
          }
          return result;
        };
        sizeOf.MACSTRING = function(str, encoding) {
          var b = encode.MACSTRING(str, encoding);
          if (b !== undefined) {
            return b.length;
          } else {
            return 0;
          }
        };
        encode.INDEX = function(l) {
          var i;
          var offset = 1;
          var offsets = [offset];
          var data = [];
          var dataSize = 0;
          for (i = 0; i < l.length; i += 1) {
            var v = encode.OBJECT(l[i]);
            Array.prototype.push.apply(data, v);
            dataSize += v.length;
            offset += v.length;
            offsets.push(offset);
          }
          if (data.length === 0) {
            return [0, 0];
          }
          var encodedOffsets = [];
          var offSize = (1 + Math.floor(Math.log(dataSize) / Math.log(2)) / 8) | 0;
          var offsetEncoder = [undefined, encode.BYTE, encode.USHORT, encode.UINT24, encode.ULONG][offSize];
          for (i = 0; i < offsets.length; i += 1) {
            var encodedOffset = offsetEncoder(offsets[i]);
            Array.prototype.push.apply(encodedOffsets, encodedOffset);
          }
          return Array.prototype.concat(encode.Card16(l.length), encode.OffSize(offSize), encodedOffsets, data);
        };
        sizeOf.INDEX = function(v) {
          return encode.INDEX(v).length;
        };
        encode.DICT = function(m) {
          var d = [];
          var keys = Object.keys(m);
          var length = keys.length;
          for (var i = 0; i < length; i += 1) {
            var k = parseInt(keys[i], 0);
            var v = m[k];
            d = d.concat(encode.OPERAND(v.value, v.type));
            d = d.concat(encode.OPERATOR(k));
          }
          return d;
        };
        sizeOf.DICT = function(m) {
          return encode.DICT(m).length;
        };
        encode.OPERATOR = function(v) {
          if (v < 1200) {
            return [v];
          } else {
            return [12, v - 1200];
          }
        };
        encode.OPERAND = function(v, type) {
          var d = [];
          if (Array.isArray(type)) {
            for (var i = 0; i < type.length; i += 1) {
              check.argument(v.length === type.length, 'Not enough arguments given for type' + type);
              d = d.concat(encode.OPERAND(v[i], type[i]));
            }
          } else {
            if (type === 'SID') {
              d = d.concat(encode.NUMBER(v));
            } else if (type === 'offset') {
              d = d.concat(encode.NUMBER32(v));
            } else if (type === 'number') {
              d = d.concat(encode.NUMBER(v));
            } else if (type === 'real') {
              d = d.concat(encode.REAL(v));
            } else {
              throw new Error('Unknown operand type ' + type);
            }
          }
          return d;
        };
        encode.OP = encode.BYTE;
        sizeOf.OP = sizeOf.BYTE;
        var wmm = typeof WeakMap === 'function' && new WeakMap();
        encode.CHARSTRING = function(ops) {
          if (wmm) {
            var cachedValue = wmm.get(ops);
            if (cachedValue !== undefined) {
              return cachedValue;
            }
          }
          var d = [];
          var length = ops.length;
          for (var i = 0; i < length; i += 1) {
            var op = ops[i];
            d = d.concat(encode[op.type](op.value));
          }
          if (wmm) {
            wmm.set(ops, d);
          }
          return d;
        };
        sizeOf.CHARSTRING = function(ops) {
          return encode.CHARSTRING(ops).length;
        };
        encode.OBJECT = function(v) {
          var encodingFunction = encode[v.type];
          check.argument(encodingFunction !== undefined, 'No encoding function for type ' + v.type);
          return encodingFunction(v.value);
        };
        sizeOf.OBJECT = function(v) {
          var sizeOfFunction = sizeOf[v.type];
          check.argument(sizeOfFunction !== undefined, 'No sizeOf function for type ' + v.type);
          return sizeOfFunction(v.value);
        };
        encode.TABLE = function(table) {
          var d = [];
          var length = table.fields.length;
          for (var i = 0; i < length; i += 1) {
            var field = table.fields[i];
            var encodingFunction = encode[field.type];
            check.argument(encodingFunction !== undefined, 'No encoding function for field type ' + field.type);
            var value = table[field.name];
            if (value === undefined) {
              value = field.value;
            }
            var bytes = encodingFunction(value);
            d = d.concat(bytes);
          }
          return d;
        };
        sizeOf.TABLE = function(table) {
          var numBytes = 0;
          var length = table.fields.length;
          for (var i = 0; i < length; i += 1) {
            var field = table.fields[i];
            var sizeOfFunction = sizeOf[field.type];
            check.argument(sizeOfFunction !== undefined, 'No sizeOf function for field type ' + field.type);
            var value = table[field.name];
            if (value === undefined) {
              value = field.value;
            }
            numBytes += sizeOfFunction(value);
          }
          return numBytes;
        };
        encode.LITERAL = function(v) {
          return v;
        };
        sizeOf.LITERAL = function(v) {
          return v.length;
        };
        exports.decode = decode;
        exports.encode = encode;
        exports.sizeOf = sizeOf;
      }, {"./check": 4}],
      31: [function(_dereq_, module, exports) {
        var process = module.exports = {};
        var cachedSetTimeout;
        var cachedClearTimeout;
        function defaultSetTimout() {
          throw new Error('setTimeout has not been defined');
        }
        function defaultClearTimeout() {
          throw new Error('clearTimeout has not been defined');
        }
        (function() {
          try {
            if (typeof setTimeout === 'function') {
              cachedSetTimeout = setTimeout;
            } else {
              cachedSetTimeout = defaultSetTimout;
            }
          } catch (e) {
            cachedSetTimeout = defaultSetTimout;
          }
          try {
            if (typeof clearTimeout === 'function') {
              cachedClearTimeout = clearTimeout;
            } else {
              cachedClearTimeout = defaultClearTimeout;
            }
          } catch (e) {
            cachedClearTimeout = defaultClearTimeout;
          }
        }());
        function runTimeout(fun) {
          if (cachedSetTimeout === setTimeout) {
            return setTimeout(fun, 0);
          }
          if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
            cachedSetTimeout = setTimeout;
            return setTimeout(fun, 0);
          }
          try {
            return cachedSetTimeout(fun, 0);
          } catch (e) {
            try {
              return cachedSetTimeout.call(null, fun, 0);
            } catch (e) {
              return cachedSetTimeout.call(this, fun, 0);
            }
          }
        }
        function runClearTimeout(marker) {
          if (cachedClearTimeout === clearTimeout) {
            return clearTimeout(marker);
          }
          if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
            cachedClearTimeout = clearTimeout;
            return clearTimeout(marker);
          }
          try {
            return cachedClearTimeout(marker);
          } catch (e) {
            try {
              return cachedClearTimeout.call(null, marker);
            } catch (e) {
              return cachedClearTimeout.call(this, marker);
            }
          }
        }
        var queue = [];
        var draining = false;
        var currentQueue;
        var queueIndex = -1;
        function cleanUpNextTick() {
          if (!draining || !currentQueue) {
            return;
          }
          draining = false;
          if (currentQueue.length) {
            queue = currentQueue.concat(queue);
          } else {
            queueIndex = -1;
          }
          if (queue.length) {
            drainQueue();
          }
        }
        function drainQueue() {
          if (draining) {
            return;
          }
          var timeout = runTimeout(cleanUpNextTick);
          draining = true;
          var len = queue.length;
          while (len) {
            currentQueue = queue;
            queue = [];
            while (++queueIndex < len) {
              if (currentQueue) {
                currentQueue[queueIndex].run();
              }
            }
            queueIndex = -1;
            len = queue.length;
          }
          currentQueue = null;
          draining = false;
          runClearTimeout(timeout);
        }
        process.nextTick = function(fun) {
          var args = new Array(arguments.length - 1);
          if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
              args[i - 1] = arguments[i];
            }
          }
          queue.push(new Item(fun, args));
          if (queue.length === 1 && !draining) {
            runTimeout(drainQueue);
          }
        };
        function Item(fun, array) {
          this.fun = fun;
          this.array = array;
        }
        Item.prototype.run = function() {
          this.fun.apply(null, this.array);
        };
        process.title = 'browser';
        process.browser = true;
        process.env = {};
        process.argv = [];
        process.version = '';
        process.versions = {};
        function noop() {}
        process.on = noop;
        process.addListener = noop;
        process.once = noop;
        process.off = noop;
        process.removeListener = noop;
        process.removeAllListeners = noop;
        process.emit = noop;
        process.binding = function(name) {
          throw new Error('process.binding is not supported');
        };
        process.cwd = function() {
          return '/';
        };
        process.chdir = function(dir) {
          throw new Error('process.chdir is not supported');
        };
        process.umask = function() {
          return 0;
        };
      }, {}],
      32: [function(_dereq_, module, exports) {
        (function(self) {
          'use strict';
          if (self.fetch) {
            return;
          }
          var support = {
            searchParams: 'URLSearchParams' in self,
            iterable: 'Symbol' in self && 'iterator' in Symbol,
            blob: 'FileReader' in self && 'Blob' in self && (function() {
              try {
                new Blob();
                return true;
              } catch (e) {
                return false;
              }
            })(),
            formData: 'FormData' in self,
            arrayBuffer: 'ArrayBuffer' in self
          };
          if (support.arrayBuffer) {
            var viewClasses = ['[object Int8Array]', '[object Uint8Array]', '[object Uint8ClampedArray]', '[object Int16Array]', '[object Uint16Array]', '[object Int32Array]', '[object Uint32Array]', '[object Float32Array]', '[object Float64Array]'];
            var isDataView = function(obj) {
              return obj && DataView.prototype.isPrototypeOf(obj);
            };
            var isArrayBufferView = ArrayBuffer.isView || function(obj) {
              return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
            };
          }
          function normalizeName(name) {
            if (typeof name !== 'string') {
              name = String(name);
            }
            if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
              throw new TypeError('Invalid character in header field name');
            }
            return name.toLowerCase();
          }
          function normalizeValue(value) {
            if (typeof value !== 'string') {
              value = String(value);
            }
            return value;
          }
          function iteratorFor(items) {
            var iterator = {next: function() {
                var value = items.shift();
                return {
                  done: value === undefined,
                  value: value
                };
              }};
            if (support.iterable) {
              iterator[Symbol.iterator] = function() {
                return iterator;
              };
            }
            return iterator;
          }
          function Headers(headers) {
            this.map = {};
            if (headers instanceof Headers) {
              headers.forEach(function(value, name) {
                this.append(name, value);
              }, this);
            } else if (Array.isArray(headers)) {
              headers.forEach(function(header) {
                this.append(header[0], header[1]);
              }, this);
            } else if (headers) {
              Object.getOwnPropertyNames(headers).forEach(function(name) {
                this.append(name, headers[name]);
              }, this);
            }
          }
          Headers.prototype.append = function(name, value) {
            name = normalizeName(name);
            value = normalizeValue(value);
            var oldValue = this.map[name];
            this.map[name] = oldValue ? oldValue + ',' + value : value;
          };
          Headers.prototype['delete'] = function(name) {
            delete this.map[normalizeName(name)];
          };
          Headers.prototype.get = function(name) {
            name = normalizeName(name);
            return this.has(name) ? this.map[name] : null;
          };
          Headers.prototype.has = function(name) {
            return this.map.hasOwnProperty(normalizeName(name));
          };
          Headers.prototype.set = function(name, value) {
            this.map[normalizeName(name)] = normalizeValue(value);
          };
          Headers.prototype.forEach = function(callback, thisArg) {
            for (var name in this.map) {
              if (this.map.hasOwnProperty(name)) {
                callback.call(thisArg, this.map[name], name, this);
              }
            }
          };
          Headers.prototype.keys = function() {
            var items = [];
            this.forEach(function(value, name) {
              items.push(name);
            });
            return iteratorFor(items);
          };
          Headers.prototype.values = function() {
            var items = [];
            this.forEach(function(value) {
              items.push(value);
            });
            return iteratorFor(items);
          };
          Headers.prototype.entries = function() {
            var items = [];
            this.forEach(function(value, name) {
              items.push([name, value]);
            });
            return iteratorFor(items);
          };
          if (support.iterable) {
            Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
          }
          function consumed(body) {
            if (body.bodyUsed) {
              return Promise.reject(new TypeError('Already read'));
            }
            body.bodyUsed = true;
          }
          function fileReaderReady(reader) {
            return new Promise(function(resolve, reject) {
              reader.onload = function() {
                resolve(reader.result);
              };
              reader.onerror = function() {
                reject(reader.error);
              };
            });
          }
          function readBlobAsArrayBuffer(blob) {
            var reader = new FileReader();
            var promise = fileReaderReady(reader);
            reader.readAsArrayBuffer(blob);
            return promise;
          }
          function readBlobAsText(blob) {
            var reader = new FileReader();
            var promise = fileReaderReady(reader);
            reader.readAsText(blob);
            return promise;
          }
          function readArrayBufferAsText(buf) {
            var view = new Uint8Array(buf);
            var chars = new Array(view.length);
            for (var i = 0; i < view.length; i++) {
              chars[i] = String.fromCharCode(view[i]);
            }
            return chars.join('');
          }
          function bufferClone(buf) {
            if (buf.slice) {
              return buf.slice(0);
            } else {
              var view = new Uint8Array(buf.byteLength);
              view.set(new Uint8Array(buf));
              return view.buffer;
            }
          }
          function Body() {
            this.bodyUsed = false;
            this._initBody = function(body) {
              this._bodyInit = body;
              if (!body) {
                this._bodyText = '';
              } else if (typeof body === 'string') {
                this._bodyText = body;
              } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
                this._bodyBlob = body;
              } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
                this._bodyFormData = body;
              } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
                this._bodyText = body.toString();
              } else if (support.arrayBuffer && support.blob && isDataView(body)) {
                this._bodyArrayBuffer = bufferClone(body.buffer);
                this._bodyInit = new Blob([this._bodyArrayBuffer]);
              } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
                this._bodyArrayBuffer = bufferClone(body);
              } else {
                throw new Error('unsupported BodyInit type');
              }
              if (!this.headers.get('content-type')) {
                if (typeof body === 'string') {
                  this.headers.set('content-type', 'text/plain;charset=UTF-8');
                } else if (this._bodyBlob && this._bodyBlob.type) {
                  this.headers.set('content-type', this._bodyBlob.type);
                } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
                  this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
                }
              }
            };
            if (support.blob) {
              this.blob = function() {
                var rejected = consumed(this);
                if (rejected) {
                  return rejected;
                }
                if (this._bodyBlob) {
                  return Promise.resolve(this._bodyBlob);
                } else if (this._bodyArrayBuffer) {
                  return Promise.resolve(new Blob([this._bodyArrayBuffer]));
                } else if (this._bodyFormData) {
                  throw new Error('could not read FormData body as blob');
                } else {
                  return Promise.resolve(new Blob([this._bodyText]));
                }
              };
              this.arrayBuffer = function() {
                if (this._bodyArrayBuffer) {
                  return consumed(this) || Promise.resolve(this._bodyArrayBuffer);
                } else {
                  return this.blob().then(readBlobAsArrayBuffer);
                }
              };
            }
            this.text = function() {
              var rejected = consumed(this);
              if (rejected) {
                return rejected;
              }
              if (this._bodyBlob) {
                return readBlobAsText(this._bodyBlob);
              } else if (this._bodyArrayBuffer) {
                return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));
              } else if (this._bodyFormData) {
                throw new Error('could not read FormData body as text');
              } else {
                return Promise.resolve(this._bodyText);
              }
            };
            if (support.formData) {
              this.formData = function() {
                return this.text().then(decode);
              };
            }
            this.json = function() {
              return this.text().then(JSON.parse);
            };
            return this;
          }
          var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];
          function normalizeMethod(method) {
            var upcased = method.toUpperCase();
            return (methods.indexOf(upcased) > -1) ? upcased : method;
          }
          function Request(input, options) {
            options = options || {};
            var body = options.body;
            if (input instanceof Request) {
              if (input.bodyUsed) {
                throw new TypeError('Already read');
              }
              this.url = input.url;
              this.credentials = input.credentials;
              if (!options.headers) {
                this.headers = new Headers(input.headers);
              }
              this.method = input.method;
              this.mode = input.mode;
              if (!body && input._bodyInit != null) {
                body = input._bodyInit;
                input.bodyUsed = true;
              }
            } else {
              this.url = String(input);
            }
            this.credentials = options.credentials || this.credentials || 'omit';
            if (options.headers || !this.headers) {
              this.headers = new Headers(options.headers);
            }
            this.method = normalizeMethod(options.method || this.method || 'GET');
            this.mode = options.mode || this.mode || null;
            this.referrer = null;
            if ((this.method === 'GET' || this.method === 'HEAD') && body) {
              throw new TypeError('Body not allowed for GET or HEAD requests');
            }
            this._initBody(body);
          }
          Request.prototype.clone = function() {
            return new Request(this, {body: this._bodyInit});
          };
          function decode(body) {
            var form = new FormData();
            body.trim().split('&').forEach(function(bytes) {
              if (bytes) {
                var split = bytes.split('=');
                var name = split.shift().replace(/\+/g, ' ');
                var value = split.join('=').replace(/\+/g, ' ');
                form.append(decodeURIComponent(name), decodeURIComponent(value));
              }
            });
            return form;
          }
          function parseHeaders(rawHeaders) {
            var headers = new Headers();
            rawHeaders.split(/\r?\n/).forEach(function(line) {
              var parts = line.split(':');
              var key = parts.shift().trim();
              if (key) {
                var value = parts.join(':').trim();
                headers.append(key, value);
              }
            });
            return headers;
          }
          Body.call(Request.prototype);
          function Response(bodyInit, options) {
            if (!options) {
              options = {};
            }
            this.type = 'default';
            this.status = 'status' in options ? options.status : 200;
            this.ok = this.status >= 200 && this.status < 300;
            this.statusText = 'statusText' in options ? options.statusText : 'OK';
            this.headers = new Headers(options.headers);
            this.url = options.url || '';
            this._initBody(bodyInit);
          }
          Body.call(Response.prototype);
          Response.prototype.clone = function() {
            return new Response(this._bodyInit, {
              status: this.status,
              statusText: this.statusText,
              headers: new Headers(this.headers),
              url: this.url
            });
          };
          Response.error = function() {
            var response = new Response(null, {
              status: 0,
              statusText: ''
            });
            response.type = 'error';
            return response;
          };
          var redirectStatuses = [301, 302, 303, 307, 308];
          Response.redirect = function(url, status) {
            if (redirectStatuses.indexOf(status) === -1) {
              throw new RangeError('Invalid status code');
            }
            return new Response(null, {
              status: status,
              headers: {location: url}
            });
          };
          self.Headers = Headers;
          self.Request = Request;
          self.Response = Response;
          self.fetch = function(input, init) {
            return new Promise(function(resolve, reject) {
              var request = new Request(input, init);
              var xhr = new XMLHttpRequest();
              xhr.onload = function() {
                var options = {
                  status: xhr.status,
                  statusText: xhr.statusText,
                  headers: parseHeaders(xhr.getAllResponseHeaders() || '')
                };
                options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
                var body = 'response' in xhr ? xhr.response : xhr.responseText;
                resolve(new Response(body, options));
              };
              xhr.onerror = function() {
                reject(new TypeError('Network request failed'));
              };
              xhr.ontimeout = function() {
                reject(new TypeError('Network request failed'));
              };
              xhr.open(request.method, request.url, true);
              if (request.credentials === 'include') {
                xhr.withCredentials = true;
              }
              if ('responseType' in xhr && support.blob) {
                xhr.responseType = 'blob';
              }
              request.headers.forEach(function(value, name) {
                xhr.setRequestHeader(name, value);
              });
              xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
            });
          };
          self.fetch.polyfill = true;
        })(typeof self !== 'undefined' ? self : this);
      }, {}],
      33: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('./core/core');
        _dereq_('./color/p5.Color');
        _dereq_('./core/p5.Element');
        _dereq_('./typography/p5.Font');
        _dereq_('./core/p5.Graphics');
        _dereq_('./core/p5.Renderer2D');
        _dereq_('./image/p5.Image');
        _dereq_('./math/p5.Vector');
        _dereq_('./io/p5.TableRow');
        _dereq_('./io/p5.Table');
        _dereq_('./io/p5.XML');
        _dereq_('./color/creating_reading');
        _dereq_('./color/setting');
        _dereq_('./core/constants');
        _dereq_('./utilities/conversion');
        _dereq_('./utilities/array_functions');
        _dereq_('./utilities/string_functions');
        _dereq_('./core/environment');
        _dereq_('./image/image');
        _dereq_('./image/loading_displaying');
        _dereq_('./image/pixels');
        _dereq_('./io/files');
        _dereq_('./events/keyboard');
        _dereq_('./events/acceleration');
        _dereq_('./events/mouse');
        _dereq_('./utilities/time_date');
        _dereq_('./events/touch');
        _dereq_('./math/math');
        _dereq_('./math/calculation');
        _dereq_('./math/random');
        _dereq_('./math/noise');
        _dereq_('./math/trigonometry');
        _dereq_('./core/rendering');
        _dereq_('./core/2d_primitives');
        _dereq_('./core/attributes');
        _dereq_('./core/curves');
        _dereq_('./core/vertex');
        _dereq_('./core/structure');
        _dereq_('./core/transform');
        _dereq_('./typography/attributes');
        _dereq_('./typography/loading_displaying');
        _dereq_('./webgl/p5.RendererGL');
        _dereq_('./webgl/p5.Geometry');
        _dereq_('./webgl/p5.RendererGL.Retained');
        _dereq_('./webgl/p5.RendererGL.Immediate');
        _dereq_('./webgl/primitives');
        _dereq_('./webgl/loading');
        _dereq_('./webgl/p5.Matrix');
        _dereq_('./webgl/material');
        _dereq_('./webgl/light');
        _dereq_('./webgl/shader');
        _dereq_('./webgl/camera');
        _dereq_('./webgl/interaction');
        var _globalInit = function() {
          if (!window.PHANTOMJS && !window.mocha) {
            if (((window.setup && typeof window.setup === 'function') || (window.draw && typeof window.draw === 'function')) && !p5.instance) {
              new p5();
            }
          }
        };
        if (document.readyState === 'complete') {
          _globalInit();
        } else {
          window.addEventListener('load', _globalInit, false);
        }
        module.exports = p5;
      }, {
        "./color/creating_reading": 35,
        "./color/p5.Color": 36,
        "./color/setting": 37,
        "./core/2d_primitives": 38,
        "./core/attributes": 39,
        "./core/constants": 41,
        "./core/core": 42,
        "./core/curves": 43,
        "./core/environment": 44,
        "./core/p5.Element": 46,
        "./core/p5.Graphics": 47,
        "./core/p5.Renderer2D": 49,
        "./core/rendering": 50,
        "./core/structure": 52,
        "./core/transform": 53,
        "./core/vertex": 54,
        "./events/acceleration": 55,
        "./events/keyboard": 56,
        "./events/mouse": 57,
        "./events/touch": 58,
        "./image/image": 60,
        "./image/loading_displaying": 61,
        "./image/p5.Image": 62,
        "./image/pixels": 63,
        "./io/files": 64,
        "./io/p5.Table": 65,
        "./io/p5.TableRow": 66,
        "./io/p5.XML": 67,
        "./math/calculation": 68,
        "./math/math": 69,
        "./math/noise": 70,
        "./math/p5.Vector": 71,
        "./math/random": 73,
        "./math/trigonometry": 74,
        "./typography/attributes": 75,
        "./typography/loading_displaying": 76,
        "./typography/p5.Font": 77,
        "./utilities/array_functions": 78,
        "./utilities/conversion": 79,
        "./utilities/string_functions": 80,
        "./utilities/time_date": 81,
        "./webgl/camera": 82,
        "./webgl/interaction": 83,
        "./webgl/light": 84,
        "./webgl/loading": 85,
        "./webgl/material": 86,
        "./webgl/p5.Geometry": 87,
        "./webgl/p5.Matrix": 88,
        "./webgl/p5.RendererGL": 91,
        "./webgl/p5.RendererGL.Immediate": 89,
        "./webgl/p5.RendererGL.Retained": 90,
        "./webgl/primitives": 92,
        "./webgl/shader": 93
      }],
      34: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.ColorConversion = {};
        p5.ColorConversion._hsbaToHSLA = function(hsba) {
          var hue = hsba[0];
          var sat = hsba[1];
          var val = hsba[2];
          var li = (2 - sat) * val / 2;
          if (li !== 0) {
            if (li === 1) {
              sat = 0;
            } else if (li < 0.5) {
              sat = sat / (2 - sat);
            } else {
              sat = sat * val / (2 - li * 2);
            }
          }
          return [hue, sat, li, hsba[3]];
        };
        p5.ColorConversion._hsbaToRGBA = function(hsba) {
          var hue = hsba[0] * 6;
          var sat = hsba[1];
          var val = hsba[2];
          var RGBA = [];
          if (sat === 0) {
            RGBA = [val, val, val, hsba[3]];
          } else {
            var sector = Math.floor(hue);
            var tint1 = val * (1 - sat);
            var tint2 = val * (1 - sat * (hue - sector));
            var tint3 = val * (1 - sat * (1 + sector - hue));
            var red,
                green,
                blue;
            if (sector === 1) {
              red = tint2;
              green = val;
              blue = tint1;
            } else if (sector === 2) {
              red = tint1;
              green = val;
              blue = tint3;
            } else if (sector === 3) {
              red = tint1;
              green = tint2;
              blue = val;
            } else if (sector === 4) {
              red = tint3;
              green = tint1;
              blue = val;
            } else if (sector === 5) {
              red = val;
              green = tint1;
              blue = tint2;
            } else {
              red = val;
              green = tint3;
              blue = tint1;
            }
            RGBA = [red, green, blue, hsba[3]];
          }
          return RGBA;
        };
        p5.ColorConversion._hslaToHSBA = function(hsla) {
          var hue = hsla[0];
          var sat = hsla[1];
          var li = hsla[2];
          var val;
          if (li < 0.5) {
            val = (1 + sat) * li;
          } else {
            val = li + sat - li * sat;
          }
          sat = 2 * (val - li) / val;
          return [hue, sat, val, hsla[3]];
        };
        p5.ColorConversion._hslaToRGBA = function(hsla) {
          var hue = hsla[0] * 6;
          var sat = hsla[1];
          var li = hsla[2];
          var RGBA = [];
          if (sat === 0) {
            RGBA = [li, li, li, hsla[3]];
          } else {
            var val;
            if (li < 0.5) {
              val = (1 + sat) * li;
            } else {
              val = li + sat - li * sat;
            }
            var zest = 2 * li - val;
            var hzvToRGB = function(hue, zest, val) {
              if (hue < 0) {
                hue += 6;
              } else if (hue >= 6) {
                hue -= 6;
              }
              if (hue < 1) {
                return (zest + (val - zest) * hue);
              } else if (hue < 3) {
                return val;
              } else if (hue < 4) {
                return (zest + (val - zest) * (4 - hue));
              } else {
                return zest;
              }
            };
            RGBA = [hzvToRGB(hue + 2, zest, val), hzvToRGB(hue, zest, val), hzvToRGB(hue - 2, zest, val), hsla[3]];
          }
          return RGBA;
        };
        p5.ColorConversion._rgbaToHSBA = function(rgba) {
          var red = rgba[0];
          var green = rgba[1];
          var blue = rgba[2];
          var val = Math.max(red, green, blue);
          var chroma = val - Math.min(red, green, blue);
          var hue,
              sat;
          if (chroma === 0) {
            hue = 0;
            sat = 0;
          } else {
            sat = chroma / val;
            if (red === val) {
              hue = (green - blue) / chroma;
            } else if (green === val) {
              hue = 2 + (blue - red) / chroma;
            } else if (blue === val) {
              hue = 4 + (red - green) / chroma;
            }
            if (hue < 0) {
              hue += 6;
            } else if (hue >= 6) {
              hue -= 6;
            }
          }
          return [hue / 6, sat, val, rgba[3]];
        };
        p5.ColorConversion._rgbaToHSLA = function(rgba) {
          var red = rgba[0];
          var green = rgba[1];
          var blue = rgba[2];
          var val = Math.max(red, green, blue);
          var min = Math.min(red, green, blue);
          var li = val + min;
          var chroma = val - min;
          var hue,
              sat;
          if (chroma === 0) {
            hue = 0;
            sat = 0;
          } else {
            if (li < 1) {
              sat = chroma / li;
            } else {
              sat = chroma / (2 - li);
            }
            if (red === val) {
              hue = (green - blue) / chroma;
            } else if (green === val) {
              hue = 2 + (blue - red) / chroma;
            } else if (blue === val) {
              hue = 4 + (red - green) / chroma;
            }
            if (hue < 0) {
              hue += 6;
            } else if (hue >= 6) {
              hue -= 6;
            }
          }
          return [hue / 6, sat, li / 2, rgba[3]];
        };
        module.exports = p5.ColorConversion;
      }, {"../core/core": 42}],
      35: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var constants = _dereq_('../core/constants');
        _dereq_('./p5.Color');
        p5.prototype.alpha = function(c) {
          if (c instanceof p5.Color || c instanceof Array) {
            return this.color(c)._getAlpha();
          } else {
            throw new Error('Needs p5.Color or pixel array as argument.');
          }
        };
        p5.prototype.blue = function(c) {
          if (c instanceof p5.Color || c instanceof Array) {
            return this.color(c)._getBlue();
          } else {
            throw new Error('Needs p5.Color or pixel array as argument.');
          }
        };
        p5.prototype.brightness = function(c) {
          if (c instanceof p5.Color || c instanceof Array) {
            return this.color(c)._getBrightness();
          } else {
            throw new Error('Needs p5.Color or pixel array as argument.');
          }
        };
        p5.prototype.color = function() {
          if (arguments[0] instanceof p5.Color) {
            return arguments[0];
          } else if (arguments[0] instanceof Array) {
            if (this instanceof p5.Renderer) {
              return new p5.Color(this, arguments[0]);
            } else {
              return new p5.Color(this._renderer, arguments[0]);
            }
          } else {
            if (this instanceof p5.Renderer) {
              return new p5.Color(this, arguments);
            } else {
              return new p5.Color(this._renderer, arguments);
            }
          }
        };
        p5.prototype.green = function(c) {
          if (c instanceof p5.Color || c instanceof Array) {
            return this.color(c)._getGreen();
          } else {
            throw new Error('Needs p5.Color or pixel array as argument.');
          }
        };
        p5.prototype.hue = function(c) {
          if (c instanceof p5.Color || c instanceof Array) {
            return this.color(c)._getHue();
          } else {
            throw new Error('Needs p5.Color or pixel array as argument.');
          }
        };
        p5.prototype.lerpColor = function(c1, c2, amt) {
          var mode = this._renderer._colorMode;
          var maxes = this._renderer._colorMaxes;
          var l0,
              l1,
              l2,
              l3;
          var fromArray,
              toArray;
          if (mode === constants.RGB) {
            fromArray = c1.levels.map(function(level) {
              return level / 255;
            });
            toArray = c2.levels.map(function(level) {
              return level / 255;
            });
          } else if (mode === constants.HSB) {
            c1._getBrightness();
            c2._getBrightness();
            fromArray = c1.hsba;
            toArray = c2.hsba;
          } else if (mode === constants.HSL) {
            c1._getLightness();
            c2._getLightness();
            fromArray = c1.hsla;
            toArray = c2.hsla;
          } else {
            throw new Error(mode + 'cannot be used for interpolation.');
          }
          amt = Math.max(Math.min(amt, 1), 0);
          l0 = this.lerp(fromArray[0], toArray[0], amt);
          l1 = this.lerp(fromArray[1], toArray[1], amt);
          l2 = this.lerp(fromArray[2], toArray[2], amt);
          l3 = this.lerp(fromArray[3], toArray[3], amt);
          l0 *= maxes[mode][0];
          l1 *= maxes[mode][1];
          l2 *= maxes[mode][2];
          l3 *= maxes[mode][3];
          return this.color(l0, l1, l2, l3);
        };
        p5.prototype.lightness = function(c) {
          if (c instanceof p5.Color || c instanceof Array) {
            return this.color(c)._getLightness();
          } else {
            throw new Error('Needs p5.Color or pixel array as argument.');
          }
        };
        p5.prototype.red = function(c) {
          if (c instanceof p5.Color || c instanceof Array) {
            return this.color(c)._getRed();
          } else {
            throw new Error('Needs p5.Color or pixel array as argument.');
          }
        };
        p5.prototype.saturation = function(c) {
          if (c instanceof p5.Color || c instanceof Array) {
            return this.color(c)._getSaturation();
          } else {
            throw new Error('Needs p5.Color or pixel array as argument.');
          }
        };
        module.exports = p5;
      }, {
        "../core/constants": 41,
        "../core/core": 42,
        "./p5.Color": 36
      }],
      36: [function(_dereq_, module, exports) {
        var p5 = _dereq_('../core/core');
        var constants = _dereq_('../core/constants');
        var color_conversion = _dereq_('./color_conversion');
        p5.Color = function(renderer, vals) {
          this.mode = renderer._colorMode;
          this.maxes = renderer._colorMaxes;
          if (this.mode !== constants.RGB && this.mode !== constants.HSL && this.mode !== constants.HSB) {
            throw new Error(this.mode + ' is an invalid colorMode.');
          } else {
            this._array = p5.Color._parseInputs.apply(renderer, vals);
          }
          this.levels = this._array.map(function(level) {
            return Math.round(level * 255);
          });
          return this;
        };
        p5.Color.prototype.toString = function() {
          var a = this.levels;
          var alpha = this._array[3];
          return 'rgba(' + a[0] + ',' + a[1] + ',' + a[2] + ',' + alpha + ')';
        };
        p5.Color.prototype._getAlpha = function() {
          return this._array[3] * this.maxes[this.mode][3];
        };
        p5.Color.prototype._getBlue = function() {
          return this._array[2] * this.maxes[constants.RGB][2];
        };
        p5.Color.prototype._getBrightness = function() {
          if (!this.hsba) {
            this.hsba = color_conversion._rgbaToHSBA(this._array);
          }
          return this.hsba[2] * this.maxes[constants.HSB][2];
        };
        p5.Color.prototype._getGreen = function() {
          return this._array[1] * this.maxes[constants.RGB][1];
        };
        p5.Color.prototype._getHue = function() {
          if (this.mode === constants.HSB) {
            if (!this.hsba) {
              this.hsba = color_conversion._rgbaToHSBA(this._array);
            }
            return this.hsba[0] * this.maxes[constants.HSB][0];
          } else {
            if (!this.hsla) {
              this.hsla = color_conversion._rgbaToHSLA(this._array);
            }
            return this.hsla[0] * this.maxes[constants.HSL][0];
          }
        };
        p5.Color.prototype._getLightness = function() {
          if (!this.hsla) {
            this.hsla = color_conversion._rgbaToHSLA(this._array);
          }
          return this.hsla[2] * this.maxes[constants.HSL][2];
        };
        p5.Color.prototype._getRed = function() {
          return this._array[0] * this.maxes[constants.RGB][0];
        };
        p5.Color.prototype._getSaturation = function() {
          if (this.mode === constants.HSB) {
            if (!this.hsba) {
              this.hsba = color_conversion._rgbaToHSBA(this._array);
            }
            return this.hsba[1] * this.maxes[constants.HSB][1];
          } else {
            if (!this.hsla) {
              this.hsla = color_conversion._rgbaToHSLA(this._array);
            }
            return this.hsla[1] * this.maxes[constants.HSL][1];
          }
        };
        var namedColors = {
          aliceblue: '#f0f8ff',
          antiquewhite: '#faebd7',
          aqua: '#00ffff',
          aquamarine: '#7fffd4',
          azure: '#f0ffff',
          beige: '#f5f5dc',
          bisque: '#ffe4c4',
          black: '#000000',
          blanchedalmond: '#ffebcd',
          blue: '#0000ff',
          blueviolet: '#8a2be2',
          brown: '#a52a2a',
          burlywood: '#deb887',
          cadetblue: '#5f9ea0',
          chartreuse: '#7fff00',
          chocolate: '#d2691e',
          coral: '#ff7f50',
          cornflowerblue: '#6495ed',
          cornsilk: '#fff8dc',
          crimson: '#dc143c',
          cyan: '#00ffff',
          darkblue: '#00008b',
          darkcyan: '#008b8b',
          darkgoldenrod: '#b8860b',
          darkgray: '#a9a9a9',
          darkgreen: '#006400',
          darkgrey: '#a9a9a9',
          darkkhaki: '#bdb76b',
          darkmagenta: '#8b008b',
          darkolivegreen: '#556b2f',
          darkorange: '#ff8c00',
          darkorchid: '#9932cc',
          darkred: '#8b0000',
          darksalmon: '#e9967a',
          darkseagreen: '#8fbc8f',
          darkslateblue: '#483d8b',
          darkslategray: '#2f4f4f',
          darkslategrey: '#2f4f4f',
          darkturquoise: '#00ced1',
          darkviolet: '#9400d3',
          deeppink: '#ff1493',
          deepskyblue: '#00bfff',
          dimgray: '#696969',
          dimgrey: '#696969',
          dodgerblue: '#1e90ff',
          firebrick: '#b22222',
          floralwhite: '#fffaf0',
          forestgreen: '#228b22',
          fuchsia: '#ff00ff',
          gainsboro: '#dcdcdc',
          ghostwhite: '#f8f8ff',
          gold: '#ffd700',
          goldenrod: '#daa520',
          gray: '#808080',
          green: '#008000',
          greenyellow: '#adff2f',
          grey: '#808080',
          honeydew: '#f0fff0',
          hotpink: '#ff69b4',
          indianred: '#cd5c5c',
          indigo: '#4b0082',
          ivory: '#fffff0',
          khaki: '#f0e68c',
          lavender: '#e6e6fa',
          lavenderblush: '#fff0f5',
          lawngreen: '#7cfc00',
          lemonchiffon: '#fffacd',
          lightblue: '#add8e6',
          lightcoral: '#f08080',
          lightcyan: '#e0ffff',
          lightgoldenrodyellow: '#fafad2',
          lightgray: '#d3d3d3',
          lightgreen: '#90ee90',
          lightgrey: '#d3d3d3',
          lightpink: '#ffb6c1',
          lightsalmon: '#ffa07a',
          lightseagreen: '#20b2aa',
          lightskyblue: '#87cefa',
          lightslategray: '#778899',
          lightslategrey: '#778899',
          lightsteelblue: '#b0c4de',
          lightyellow: '#ffffe0',
          lime: '#00ff00',
          limegreen: '#32cd32',
          linen: '#faf0e6',
          magenta: '#ff00ff',
          maroon: '#800000',
          mediumaquamarine: '#66cdaa',
          mediumblue: '#0000cd',
          mediumorchid: '#ba55d3',
          mediumpurple: '#9370db',
          mediumseagreen: '#3cb371',
          mediumslateblue: '#7b68ee',
          mediumspringgreen: '#00fa9a',
          mediumturquoise: '#48d1cc',
          mediumvioletred: '#c71585',
          midnightblue: '#191970',
          mintcream: '#f5fffa',
          mistyrose: '#ffe4e1',
          moccasin: '#ffe4b5',
          navajowhite: '#ffdead',
          navy: '#000080',
          oldlace: '#fdf5e6',
          olive: '#808000',
          olivedrab: '#6b8e23',
          orange: '#ffa500',
          orangered: '#ff4500',
          orchid: '#da70d6',
          palegoldenrod: '#eee8aa',
          palegreen: '#98fb98',
          paleturquoise: '#afeeee',
          palevioletred: '#db7093',
          papayawhip: '#ffefd5',
          peachpuff: '#ffdab9',
          peru: '#cd853f',
          pink: '#ffc0cb',
          plum: '#dda0dd',
          powderblue: '#b0e0e6',
          purple: '#800080',
          red: '#ff0000',
          rosybrown: '#bc8f8f',
          royalblue: '#4169e1',
          saddlebrown: '#8b4513',
          salmon: '#fa8072',
          sandybrown: '#f4a460',
          seagreen: '#2e8b57',
          seashell: '#fff5ee',
          sienna: '#a0522d',
          silver: '#c0c0c0',
          skyblue: '#87ceeb',
          slateblue: '#6a5acd',
          slategray: '#708090',
          slategrey: '#708090',
          snow: '#fffafa',
          springgreen: '#00ff7f',
          steelblue: '#4682b4',
          tan: '#d2b48c',
          teal: '#008080',
          thistle: '#d8bfd8',
          tomato: '#ff6347',
          turquoise: '#40e0d0',
          violet: '#ee82ee',
          wheat: '#f5deb3',
          white: '#ffffff',
          whitesmoke: '#f5f5f5',
          yellow: '#ffff00',
          yellowgreen: '#9acd32'
        };
        var WHITESPACE = /\s*/;
        var INTEGER = /(\d{1,3})/;
        var DECIMAL = /((?:\d+(?:\.\d+)?)|(?:\.\d+))/;
        var PERCENT = new RegExp(DECIMAL.source + '%');
        var colorPatterns = {
          HEX3: /^#([a-f0-9])([a-f0-9])([a-f0-9])$/i,
          HEX6: /^#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i,
          RGB: new RegExp(['^rgb\\(', INTEGER.source, ',', INTEGER.source, ',', INTEGER.source, '\\)$'].join(WHITESPACE.source), 'i'),
          RGB_PERCENT: new RegExp(['^rgb\\(', PERCENT.source, ',', PERCENT.source, ',', PERCENT.source, '\\)$'].join(WHITESPACE.source), 'i'),
          RGBA: new RegExp(['^rgba\\(', INTEGER.source, ',', INTEGER.source, ',', INTEGER.source, ',', DECIMAL.source, '\\)$'].join(WHITESPACE.source), 'i'),
          RGBA_PERCENT: new RegExp(['^rgba\\(', PERCENT.source, ',', PERCENT.source, ',', PERCENT.source, ',', DECIMAL.source, '\\)$'].join(WHITESPACE.source), 'i'),
          HSL: new RegExp(['^hsl\\(', INTEGER.source, ',', PERCENT.source, ',', PERCENT.source, '\\)$'].join(WHITESPACE.source), 'i'),
          HSLA: new RegExp(['^hsla\\(', INTEGER.source, ',', PERCENT.source, ',', PERCENT.source, ',', DECIMAL.source, '\\)$'].join(WHITESPACE.source), 'i'),
          HSB: new RegExp(['^hsb\\(', INTEGER.source, ',', PERCENT.source, ',', PERCENT.source, '\\)$'].join(WHITESPACE.source), 'i'),
          HSBA: new RegExp(['^hsba\\(', INTEGER.source, ',', PERCENT.source, ',', PERCENT.source, ',', DECIMAL.source, '\\)$'].join(WHITESPACE.source), 'i')
        };
        p5.Color._parseInputs = function() {
          var numArgs = arguments.length;
          var mode = this._colorMode;
          var maxes = this._colorMaxes;
          var results = [];
          if (numArgs >= 3) {
            results[0] = arguments[0] / maxes[mode][0];
            results[1] = arguments[1] / maxes[mode][1];
            results[2] = arguments[2] / maxes[mode][2];
            if (typeof arguments[3] === 'number') {
              results[3] = arguments[3] / maxes[mode][3];
            } else {
              results[3] = 1;
            }
            results = results.map(function(value) {
              return Math.max(Math.min(value, 1), 0);
            });
            if (mode === constants.HSL) {
              return color_conversion._hslaToRGBA(results);
            } else if (mode === constants.HSB) {
              return color_conversion._hsbaToRGBA(results);
            } else {
              return results;
            }
          } else if (numArgs === 1 && typeof arguments[0] === 'string') {
            var str = arguments[0].trim().toLowerCase();
            if (namedColors[str]) {
              return p5.Color._parseInputs.apply(this, [namedColors[str]]);
            }
            if (colorPatterns.HEX3.test(str)) {
              results = colorPatterns.HEX3.exec(str).slice(1).map(function(color) {
                return parseInt(color + color, 16) / 255;
              });
              results[3] = 1;
              return results;
            } else if (colorPatterns.HEX6.test(str)) {
              results = colorPatterns.HEX6.exec(str).slice(1).map(function(color) {
                return parseInt(color, 16) / 255;
              });
              results[3] = 1;
              return results;
            } else if (colorPatterns.RGB.test(str)) {
              results = colorPatterns.RGB.exec(str).slice(1).map(function(color) {
                return color / 255;
              });
              results[3] = 1;
              return results;
            } else if (colorPatterns.RGB_PERCENT.test(str)) {
              results = colorPatterns.RGB_PERCENT.exec(str).slice(1).map(function(color) {
                return parseFloat(color) / 100;
              });
              results[3] = 1;
              return results;
            } else if (colorPatterns.RGBA.test(str)) {
              results = colorPatterns.RGBA.exec(str).slice(1).map(function(color, idx) {
                if (idx === 3) {
                  return parseFloat(color);
                }
                return color / 255;
              });
              return results;
            } else if (colorPatterns.RGBA_PERCENT.test(str)) {
              results = colorPatterns.RGBA_PERCENT.exec(str).slice(1).map(function(color, idx) {
                if (idx === 3) {
                  return parseFloat(color);
                }
                return parseFloat(color) / 100;
              });
              return results;
            }
            if (colorPatterns.HSL.test(str)) {
              results = colorPatterns.HSL.exec(str).slice(1).map(function(color, idx) {
                if (idx === 0) {
                  return parseInt(color, 10) / 360;
                }
                return parseInt(color, 10) / 100;
              });
              results[3] = 1;
            } else if (colorPatterns.HSLA.test(str)) {
              results = colorPatterns.HSLA.exec(str).slice(1).map(function(color, idx) {
                if (idx === 0) {
                  return parseInt(color, 10) / 360;
                } else if (idx === 3) {
                  return parseFloat(color);
                }
                return parseInt(color, 10) / 100;
              });
            }
            results = results.map(function(value) {
              return Math.max(Math.min(value, 1), 0);
            });
            if (results.length) {
              return color_conversion._hslaToRGBA(results);
            }
            if (colorPatterns.HSB.test(str)) {
              results = colorPatterns.HSB.exec(str).slice(1).map(function(color, idx) {
                if (idx === 0) {
                  return parseInt(color, 10) / 360;
                }
                return parseInt(color, 10) / 100;
              });
              results[3] = 1;
            } else if (colorPatterns.HSBA.test(str)) {
              results = colorPatterns.HSBA.exec(str).slice(1).map(function(color, idx) {
                if (idx === 0) {
                  return parseInt(color, 10) / 360;
                } else if (idx === 3) {
                  return parseFloat(color);
                }
                return parseInt(color, 10) / 100;
              });
            }
            results = results.map(function(value) {
              return Math.max(Math.min(value, 1), 0);
            });
            if (results.length) {
              return color_conversion._hsbaToRGBA(results);
            }
            results = [1, 1, 1, 1];
          } else if ((numArgs === 1 || numArgs === 2) && typeof arguments[0] === 'number') {
            results[0] = arguments[0] / maxes[mode][2];
            results[1] = arguments[0] / maxes[mode][2];
            results[2] = arguments[0] / maxes[mode][2];
            if (typeof arguments[1] === 'number') {
              results[3] = arguments[1] / maxes[mode][3];
            } else {
              results[3] = 1;
            }
            results = results.map(function(value) {
              return Math.max(Math.min(value, 1), 0);
            });
          } else {
            throw new Error(arguments + 'is not a valid color representation.');
          }
          return results;
        };
        module.exports = p5.Color;
      }, {
        "../core/constants": 41,
        "../core/core": 42,
        "./color_conversion": 34
      }],
      37: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var constants = _dereq_('../core/constants');
        _dereq_('./p5.Color');
        p5.prototype.background = function() {
          if (arguments[0] instanceof p5.Image) {
            this.image(arguments[0], 0, 0, this.width, this.height);
          } else {
            this._renderer.background.apply(this._renderer, arguments);
          }
          return this;
        };
        p5.prototype.clear = function() {
          this._renderer.clear();
          return this;
        };
        p5.prototype.colorMode = function() {
          if (arguments[0] === constants.RGB || arguments[0] === constants.HSB || arguments[0] === constants.HSL) {
            this._renderer._colorMode = arguments[0];
            var maxes = this._renderer._colorMaxes[this._renderer._colorMode];
            if (arguments.length === 2) {
              maxes[0] = arguments[1];
              maxes[1] = arguments[1];
              maxes[2] = arguments[1];
              maxes[3] = arguments[1];
            } else if (arguments.length === 4) {
              maxes[0] = arguments[1];
              maxes[1] = arguments[2];
              maxes[2] = arguments[3];
            } else if (arguments.length === 5) {
              maxes[0] = arguments[1];
              maxes[1] = arguments[2];
              maxes[2] = arguments[3];
              maxes[3] = arguments[4];
            }
          }
          return this;
        };
        p5.prototype.fill = function() {
          this._renderer._setProperty('_fillSet', true);
          this._renderer._setProperty('_doFill', true);
          this._renderer.fill.apply(this._renderer, arguments);
          return this;
        };
        p5.prototype.noFill = function() {
          this._renderer._setProperty('_doFill', false);
          return this;
        };
        p5.prototype.noStroke = function() {
          this._renderer._setProperty('_doStroke', false);
          return this;
        };
        p5.prototype.stroke = function() {
          this._renderer._setProperty('_strokeSet', true);
          this._renderer._setProperty('_doStroke', true);
          this._renderer.stroke.apply(this._renderer, arguments);
          return this;
        };
        module.exports = p5;
      }, {
        "../core/constants": 41,
        "../core/core": 42,
        "./p5.Color": 36
      }],
      38: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('./core');
        var constants = _dereq_('./constants');
        var canvas = _dereq_('./canvas');
        _dereq_('./error_helpers');
        p5.prototype.arc = function(x, y, w, h, start, stop, mode) {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          if (!this._renderer._doStroke && !this._renderer._doFill) {
            return this;
          }
          if (this._angleMode === constants.DEGREES) {
            start = this.radians(start);
            stop = this.radians(stop);
          }
          while (start < 0) {
            start += constants.TWO_PI;
          }
          while (stop < 0) {
            stop += constants.TWO_PI;
          }
          start %= constants.TWO_PI;
          stop %= constants.TWO_PI;
          if (stop === start) {
            stop += constants.TWO_PI;
          }
          if (start <= constants.HALF_PI) {
            start = Math.atan(w / h * Math.tan(start));
          } else if (start > constants.HALF_PI && start <= 3 * constants.HALF_PI) {
            start = Math.atan(w / h * Math.tan(start)) + constants.PI;
          } else {
            start = Math.atan(w / h * Math.tan(start)) + constants.TWO_PI;
          }
          if (stop <= constants.HALF_PI) {
            stop = Math.atan(w / h * Math.tan(stop));
          } else if (stop > constants.HALF_PI && stop <= 3 * constants.HALF_PI) {
            stop = Math.atan(w / h * Math.tan(stop)) + constants.PI;
          } else {
            stop = Math.atan(w / h * Math.tan(stop)) + constants.TWO_PI;
          }
          if (start > stop) {
            stop += constants.TWO_PI;
          }
          w = Math.abs(w);
          h = Math.abs(h);
          this._renderer.arc(x, y, w, h, start, stop, mode);
          return this;
        };
        p5.prototype.ellipse = function() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          if (args.length === 3) {
            args.push(args[2]);
          }
          if (args[2] < 0) {
            args[2] = Math.abs(args[2]);
          }
          if (args[3] < 0) {
            args[3] = Math.abs(args[3]);
          }
          if (!this._renderer._doStroke && !this._renderer._doFill) {
            return this;
          }
          var vals = canvas.modeAdjust(args[0], args[1], args[2], args[3], this._renderer._ellipseMode);
          args[0] = vals.x;
          args[1] = vals.y;
          args[2] = vals.w;
          args[3] = vals.h;
          this._renderer.ellipse(args);
          return this;
        };
        p5.prototype.line = function() {
          if (!this._renderer._doStroke) {
            return this;
          }
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          if (this._renderer.isP3D) {
            this._renderer.line(args[0], args[1], args[2], args[3], args[4], args[5]);
          } else {
            this._renderer.line(args[0], args[1], args[2], args[3]);
          }
          return this;
        };
        p5.prototype.point = function() {
          if (!this._renderer._doStroke) {
            return this;
          }
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          if (this._renderer.isP3D) {
            this._renderer.point(args[0], args[1], args[2]);
          } else {
            this._renderer.point(args[0], args[1]);
          }
          return this;
        };
        p5.prototype.quad = function() {
          if (!this._renderer._doStroke && !this._renderer._doFill) {
            return this;
          }
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          if (this._renderer.isP3D) {
            this._renderer.quad(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11]);
          } else {
            this._renderer.quad(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
          }
          return this;
        };
        p5.prototype.rect = function() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          if (!this._renderer._doStroke && !this._renderer._doFill) {
            return;
          }
          var vals = canvas.modeAdjust(args[0], args[1], args[2], args[3], this._renderer._rectMode);
          args[0] = vals.x;
          args[1] = vals.y;
          args[2] = vals.w;
          args[3] = vals.h;
          this._renderer.rect(args);
          return this;
        };
        p5.prototype.triangle = function() {
          if (!this._renderer._doStroke && !this._renderer._doFill) {
            return this;
          }
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          this._renderer.triangle(args);
          return this;
        };
        module.exports = p5;
      }, {
        "./canvas": 40,
        "./constants": 41,
        "./core": 42,
        "./error_helpers": 45
      }],
      39: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('./core');
        var constants = _dereq_('./constants');
        p5.prototype.ellipseMode = function(m) {
          if (m === constants.CORNER || m === constants.CORNERS || m === constants.RADIUS || m === constants.CENTER) {
            this._renderer._ellipseMode = m;
          }
          return this;
        };
        p5.prototype.noSmooth = function() {
          this._renderer.noSmooth();
          return this;
        };
        p5.prototype.rectMode = function(m) {
          if (m === constants.CORNER || m === constants.CORNERS || m === constants.RADIUS || m === constants.CENTER) {
            this._renderer._rectMode = m;
          }
          return this;
        };
        p5.prototype.smooth = function() {
          this._renderer.smooth();
          return this;
        };
        p5.prototype.strokeCap = function(cap) {
          if (cap === constants.ROUND || cap === constants.SQUARE || cap === constants.PROJECT) {
            this._renderer.strokeCap(cap);
          }
          return this;
        };
        p5.prototype.strokeJoin = function(join) {
          if (join === constants.ROUND || join === constants.BEVEL || join === constants.MITER) {
            this._renderer.strokeJoin(join);
          }
          return this;
        };
        p5.prototype.strokeWeight = function(w) {
          this._renderer.strokeWeight(w);
          return this;
        };
        module.exports = p5;
      }, {
        "./constants": 41,
        "./core": 42
      }],
      40: [function(_dereq_, module, exports) {
        var constants = _dereq_('./constants');
        module.exports = {
          modeAdjust: function(a, b, c, d, mode) {
            if (mode === constants.CORNER) {
              return {
                x: a,
                y: b,
                w: c,
                h: d
              };
            } else if (mode === constants.CORNERS) {
              return {
                x: a,
                y: b,
                w: c - a,
                h: d - b
              };
            } else if (mode === constants.RADIUS) {
              return {
                x: a - c,
                y: b - d,
                w: 2 * c,
                h: 2 * d
              };
            } else if (mode === constants.CENTER) {
              return {
                x: a - c * 0.5,
                y: b - d * 0.5,
                w: c,
                h: d
              };
            }
          },
          arcModeAdjust: function(a, b, c, d, mode) {
            if (mode === constants.CORNER) {
              return {
                x: a + c * 0.5,
                y: b + d * 0.5,
                w: c,
                h: d
              };
            } else if (mode === constants.CORNERS) {
              return {
                x: a,
                y: b,
                w: c + a,
                h: d + b
              };
            } else if (mode === constants.RADIUS) {
              return {
                x: a,
                y: b,
                w: 2 * c,
                h: 2 * d
              };
            } else if (mode === constants.CENTER) {
              return {
                x: a,
                y: b,
                w: c,
                h: d
              };
            }
          }
        };
      }, {"./constants": 41}],
      41: [function(_dereq_, module, exports) {
        var PI = Math.PI;
        module.exports = {
          P2D: 'p2d',
          WEBGL: 'webgl',
          ARROW: 'default',
          CROSS: 'crosshair',
          HAND: 'pointer',
          MOVE: 'move',
          TEXT: 'text',
          WAIT: 'wait',
          HALF_PI: PI / 2,
          PI: PI,
          QUARTER_PI: PI / 4,
          TAU: PI * 2,
          TWO_PI: PI * 2,
          DEGREES: 'degrees',
          RADIANS: 'radians',
          CORNER: 'corner',
          CORNERS: 'corners',
          RADIUS: 'radius',
          RIGHT: 'right',
          LEFT: 'left',
          CENTER: 'center',
          TOP: 'top',
          BOTTOM: 'bottom',
          BASELINE: 'alphabetic',
          POINTS: 0x0000,
          LINES: 0x0001,
          LINE_STRIP: 0x0003,
          LINE_LOOP: 0x0002,
          TRIANGLES: 0x0004,
          TRIANGLE_FAN: 0x0006,
          TRIANGLE_STRIP: 0x0005,
          QUADS: 'quads',
          QUAD_STRIP: 'quad_strip',
          CLOSE: 'close',
          OPEN: 'open',
          CHORD: 'chord',
          PIE: 'pie',
          PROJECT: 'square',
          SQUARE: 'butt',
          ROUND: 'round',
          BEVEL: 'bevel',
          MITER: 'miter',
          RGB: 'rgb',
          HSB: 'hsb',
          HSL: 'hsl',
          AUTO: 'auto',
          ALT: 18,
          BACKSPACE: 8,
          CONTROL: 17,
          DELETE: 46,
          DOWN_ARROW: 40,
          ENTER: 13,
          ESCAPE: 27,
          LEFT_ARROW: 37,
          OPTION: 18,
          RETURN: 13,
          RIGHT_ARROW: 39,
          SHIFT: 16,
          TAB: 9,
          UP_ARROW: 38,
          BLEND: 'source-over',
          ADD: 'lighter',
          DARKEST: 'darken',
          LIGHTEST: 'lighten',
          DIFFERENCE: 'difference',
          EXCLUSION: 'exclusion',
          MULTIPLY: 'multiply',
          SCREEN: 'screen',
          REPLACE: 'copy',
          OVERLAY: 'overlay',
          HARD_LIGHT: 'hard-light',
          SOFT_LIGHT: 'soft-light',
          DODGE: 'color-dodge',
          BURN: 'color-burn',
          THRESHOLD: 'threshold',
          GRAY: 'gray',
          OPAQUE: 'opaque',
          INVERT: 'invert',
          POSTERIZE: 'posterize',
          DILATE: 'dilate',
          ERODE: 'erode',
          BLUR: 'blur',
          NORMAL: 'normal',
          ITALIC: 'italic',
          BOLD: 'bold',
          _DEFAULT_TEXT_FILL: '#000000',
          _DEFAULT_LEADMULT: 1.25,
          _CTX_MIDDLE: 'middle',
          LINEAR: 'linear',
          QUADRATIC: 'quadratic',
          BEZIER: 'bezier',
          CURVE: 'curve',
          _DEFAULT_STROKE: '#000000',
          _DEFAULT_FILL: '#FFFFFF'
        };
      }, {}],
      42: [function(_dereq_, module, exports) {
        'use strict';
        _dereq_('./shim');
        var constants = _dereq_('./constants');
        var p5 = function(sketch, node, sync) {
          if (arguments.length === 2 && typeof node === 'boolean') {
            sync = node;
            node = undefined;
          }
          this._setupDone = false;
          this._pixelDensity = Math.ceil(window.devicePixelRatio) || 1;
          this._userNode = node;
          this._curElement = null;
          this._elements = [];
          this._requestAnimId = 0;
          this._preloadCount = 0;
          this._isGlobal = false;
          this._loop = true;
          this._styles = [];
          this._defaultCanvasSize = {
            width: 100,
            height: 100
          };
          this._events = {
            'mousemove': null,
            'mousedown': null,
            'mouseup': null,
            'dragend': null,
            'dragover': null,
            'click': null,
            'mouseover': null,
            'mouseout': null,
            'keydown': null,
            'keyup': null,
            'keypress': null,
            'touchstart': null,
            'touchmove': null,
            'touchend': null,
            'resize': null,
            'blur': null
          };
          this._events.wheel = null;
          this._loadingScreenId = 'p5_loading';
          if (window.DeviceOrientationEvent) {
            this._events.deviceorientation = null;
          }
          if (window.DeviceMotionEvent && !window._isNodeWebkit) {
            this._events.devicemotion = null;
          }
          this._start = function() {
            if (this._userNode) {
              if (typeof this._userNode === 'string') {
                this._userNode = document.getElementById(this._userNode);
              }
            }
            var userPreload = this.preload || window.preload;
            if (userPreload) {
              var loadingScreen = document.getElementById(this._loadingScreenId);
              if (!loadingScreen) {
                loadingScreen = document.createElement('div');
                loadingScreen.innerHTML = 'Loading...';
                loadingScreen.style.position = 'absolute';
                loadingScreen.id = this._loadingScreenId;
                var node = this._userNode || document.body;
                node.appendChild(loadingScreen);
              }
              for (var method in this._preloadMethods) {
                this._preloadMethods[method] = this._preloadMethods[method] || p5;
                var obj = this._preloadMethods[method];
                if (obj === p5.prototype || obj === p5) {
                  obj = this._isGlobal ? window : this;
                }
                this._registeredPreloadMethods[method] = obj[method];
                obj[method] = this._wrapPreload(obj, method);
              }
              userPreload();
              this._runIfPreloadsAreDone();
            } else {
              this._setup();
              this._runFrames();
              this._draw();
            }
          }.bind(this);
          this._runIfPreloadsAreDone = function() {
            var context = this._isGlobal ? window : this;
            if (context._preloadCount === 0) {
              var loadingScreen = document.getElementById(context._loadingScreenId);
              if (loadingScreen) {
                loadingScreen.parentNode.removeChild(loadingScreen);
              }
              context._setup();
              context._runFrames();
              context._draw();
            }
          };
          this._decrementPreload = function() {
            var context = this._isGlobal ? window : this;
            context._setProperty('_preloadCount', context._preloadCount - 1);
            context._runIfPreloadsAreDone();
          };
          this._wrapPreload = function(obj, fnName) {
            return function() {
              this._incrementPreload();
              var args = new Array(arguments.length);
              for (var i = 0; i < args.length; ++i) {
                args[i] = arguments[i];
              }
              args.push(this._decrementPreload.bind(this));
              return this._registeredPreloadMethods[fnName].apply(obj, args);
            }.bind(this);
          };
          this._incrementPreload = function() {
            var context = this._isGlobal ? window : this;
            context._setProperty('_preloadCount', context._preloadCount + 1);
          };
          this._setup = function() {
            this.createCanvas(this._defaultCanvasSize.width, this._defaultCanvasSize.height, 'p2d', true);
            var context = this._isGlobal ? window : this;
            if (typeof context.preload === 'function') {
              for (var f in this._preloadMethods) {
                context[f] = this._preloadMethods[f][f];
                if (context[f] && this) {
                  context[f] = context[f].bind(this);
                }
              }
            }
            if (typeof context.setup === 'function') {
              context.setup();
            }
            var canvases = document.getElementsByTagName('canvas');
            for (var i = 0; i < canvases.length; i++) {
              var k = canvases[i];
              if (k.dataset.hidden === 'true') {
                k.style.visibility = '';
                delete(k.dataset.hidden);
              }
            }
            this._setupDone = true;
          }.bind(this);
          this._draw = function() {
            var now = window.performance.now();
            var time_since_last = now - this._lastFrameTime;
            var target_time_between_frames = 1000 / this._targetFrameRate;
            var epsilon = 5;
            if (!this._loop || time_since_last >= target_time_between_frames - epsilon) {
              this._setProperty('frameCount', this.frameCount + 1);
              this.redraw();
              this._updateMouseCoords();
              this._frameRate = 1000.0 / (now - this._lastFrameTime);
              this._lastFrameTime = now;
            }
            if (this._loop) {
              this._requestAnimId = window.requestAnimationFrame(this._draw);
            }
          }.bind(this);
          this._runFrames = function() {
            if (this._updateInterval) {
              clearInterval(this._updateInterval);
            }
          }.bind(this);
          this._setProperty = function(prop, value) {
            this[prop] = value;
            if (this._isGlobal) {
              window[prop] = value;
            }
          }.bind(this);
          this.remove = function() {
            if (this._curElement) {
              this._loop = false;
              if (this._requestAnimId) {
                window.cancelAnimationFrame(this._requestAnimId);
              }
              for (var ev in this._events) {
                window.removeEventListener(ev, this._events[ev]);
              }
              for (var i = 0; i < this._elements.length; i++) {
                var e = this._elements[i];
                if (e.elt.parentNode) {
                  e.elt.parentNode.removeChild(e.elt);
                }
                for (var elt_ev in e._events) {
                  e.elt.removeEventListener(elt_ev, e._events[elt_ev]);
                }
              }
              var self = this;
              this._registeredMethods.remove.forEach(function(f) {
                if (typeof(f) !== 'undefined') {
                  f.call(self);
                }
              });
              if (this._isGlobal) {
                for (var p in p5.prototype) {
                  try {
                    delete window[p];
                  } catch (x) {
                    window[p] = undefined;
                  }
                }
                for (var p2 in this) {
                  if (this.hasOwnProperty(p2)) {
                    try {
                      delete window[p2];
                    } catch (x) {
                      window[p2] = undefined;
                    }
                  }
                }
              }
            }
          }.bind(this);
          this._registeredMethods.init.forEach(function(f) {
            if (typeof(f) !== 'undefined') {
              f.call(this);
            }
          }, this);
          var friendlyBindGlobal = this._createFriendlyGlobalFunctionBinder();
          if (!sketch) {
            this._isGlobal = true;
            p5.instance = this;
            for (var p in p5.prototype) {
              if (typeof p5.prototype[p] === 'function') {
                var ev = p.substring(2);
                if (!this._events.hasOwnProperty(ev)) {
                  if (Math.hasOwnProperty(p) && (Math[p] === p5.prototype[p])) {
                    friendlyBindGlobal(p, p5.prototype[p]);
                  } else {
                    friendlyBindGlobal(p, p5.prototype[p].bind(this));
                  }
                }
              } else {
                friendlyBindGlobal(p, p5.prototype[p]);
              }
            }
            for (var p2 in this) {
              if (this.hasOwnProperty(p2)) {
                friendlyBindGlobal(p2, this[p2]);
              }
            }
          } else {
            sketch(this);
          }
          for (var e in this._events) {
            var f = this['_on' + e];
            if (f) {
              var m = f.bind(this);
              window.addEventListener(e, m, {passive: false});
              this._events[e] = m;
            }
          }
          var focusHandler = function() {
            this._setProperty('focused', true);
          }.bind(this);
          var blurHandler = function() {
            this._setProperty('focused', false);
          }.bind(this);
          window.addEventListener('focus', focusHandler);
          window.addEventListener('blur', blurHandler);
          this.registerMethod('remove', function() {
            window.removeEventListener('focus', focusHandler);
            window.removeEventListener('blur', blurHandler);
          });
          if (sync) {
            this._start();
          } else {
            if (document.readyState === 'complete') {
              this._start();
            } else {
              window.addEventListener('load', this._start.bind(this), false);
            }
          }
        };
        p5.instance = null;
        p5.disableFriendlyErrors = false;
        for (var k in constants) {
          p5.prototype[k] = constants[k];
        }
        p5.prototype._preloadMethods = {
          loadJSON: p5.prototype,
          loadImage: p5.prototype,
          loadStrings: p5.prototype,
          loadXML: p5.prototype,
          loadShape: p5.prototype,
          loadTable: p5.prototype,
          loadFont: p5.prototype,
          loadModel: p5.prototype
        };
        p5.prototype._registeredMethods = {
          init: [],
          pre: [],
          post: [],
          remove: []
        };
        p5.prototype._registeredPreloadMethods = {};
        p5.prototype.registerPreloadMethod = function(fnString, obj) {
          if (!p5.prototype._preloadMethods.hasOwnProperty(fnString)) {
            p5.prototype._preloadMethods[fnString] = obj;
          }
        };
        p5.prototype.registerMethod = function(name, m) {
          if (!p5.prototype._registeredMethods.hasOwnProperty(name)) {
            p5.prototype._registeredMethods[name] = [];
          }
          p5.prototype._registeredMethods[name].push(m);
        };
        p5.prototype._createFriendlyGlobalFunctionBinder = function(options) {
          options = options || {};
          var globalObject = options.globalObject || window;
          var log = options.log || console.log.bind(console);
          var propsToForciblyOverwrite = {'print': true};
          return function(prop, value) {
            if (!p5.disableFriendlyErrors && typeof(IS_MINIFIED) === 'undefined' && typeof(value) === 'function' && !(prop in p5.prototype._preloadMethods)) {
              try {
                if (prop in globalObject && !(prop in propsToForciblyOverwrite)) {
                  throw new Error('global "' + prop + '" already exists');
                }
                Object.defineProperty(globalObject, prop, {
                  configurable: true,
                  enumerable: true,
                  get: function() {
                    return value;
                  },
                  set: function(newValue) {
                    Object.defineProperty(globalObject, prop, {
                      configurable: true,
                      enumerable: true,
                      value: newValue,
                      writable: true
                    });
                    log('You just changed the value of "' + prop + '", which was ' + 'a p5 function. This could cause problems later if you\'re ' + 'not careful.');
                  }
                });
              } catch (e) {
                log('p5 had problems creating the global function "' + prop + '", ' + 'possibly because your code is already using that name as ' + 'a variable. You may want to rename your variable to something ' + 'else.');
                globalObject[prop] = value;
              }
            } else {
              globalObject[prop] = value;
            }
          };
        };
        module.exports = p5;
      }, {
        "./constants": 41,
        "./shim": 51
      }],
      43: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('./core');
        _dereq_('./error_helpers');
        var bezierDetail = 20;
        var curveDetail = 20;
        p5.prototype.bezier = function() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          if (!this._renderer._doStroke && !this._renderer._doFill) {
            return this;
          }
          if (this._renderer.isP3D) {
            args.push(bezierDetail);
            this._renderer.bezier(args);
          } else {
            this._renderer.bezier(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
          }
          return this;
        };
        p5.prototype.bezierDetail = function(d) {
          bezierDetail = d;
          return this;
        };
        p5.prototype.bezierPoint = function(a, b, c, d, t) {
          var adjustedT = 1 - t;
          return Math.pow(adjustedT, 3) * a + 3 * (Math.pow(adjustedT, 2)) * t * b + 3 * adjustedT * Math.pow(t, 2) * c + Math.pow(t, 3) * d;
        };
        p5.prototype.bezierTangent = function(a, b, c, d, t) {
          var adjustedT = 1 - t;
          return 3 * d * Math.pow(t, 2) - 3 * c * Math.pow(t, 2) + 6 * c * adjustedT * t - 6 * b * adjustedT * t + 3 * b * Math.pow(adjustedT, 2) - 3 * a * Math.pow(adjustedT, 2);
        };
        p5.prototype.curve = function() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          if (!this._renderer._doStroke) {
            return this;
          }
          if (this._renderer.isP3D) {
            args.push(curveDetail);
            this._renderer.curve(args);
          } else {
            this._renderer.curve(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
          }
          return this;
        };
        p5.prototype.curveDetail = function(d) {
          curveDetail = d;
          return this;
        };
        p5.prototype.curveTightness = function(t) {
          this._renderer._curveTightness = t;
        };
        p5.prototype.curvePoint = function(a, b, c, d, t) {
          var t3 = t * t * t,
              t2 = t * t,
              f1 = -0.5 * t3 + t2 - 0.5 * t,
              f2 = 1.5 * t3 - 2.5 * t2 + 1.0,
              f3 = -1.5 * t3 + 2.0 * t2 + 0.5 * t,
              f4 = 0.5 * t3 - 0.5 * t2;
          return a * f1 + b * f2 + c * f3 + d * f4;
        };
        p5.prototype.curveTangent = function(a, b, c, d, t) {
          var t2 = t * t,
              f1 = (-3 * t2) / 2 + 2 * t - 0.5,
              f2 = (9 * t2) / 2 - 5 * t,
              f3 = (-9 * t2) / 2 + 4 * t + 0.5,
              f4 = (3 * t2) / 2 - t;
          return a * f1 + b * f2 + c * f3 + d * f4;
        };
        module.exports = p5;
      }, {
        "./core": 42,
        "./error_helpers": 45
      }],
      44: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('./core');
        var C = _dereq_('./constants');
        var standardCursors = [C.ARROW, C.CROSS, C.HAND, C.MOVE, C.TEXT, C.WAIT];
        p5.prototype._frameRate = 0;
        p5.prototype._lastFrameTime = window.performance.now();
        p5.prototype._targetFrameRate = 60;
        var _windowPrint = window.print;
        if (window.console && console.log) {
          p5.prototype.print = function(args) {
            try {
              if (arguments.length === 0) {
                _windowPrint();
              } else if (arguments.length > 1) {
                console.log.apply(console, arguments);
              } else {
                var newArgs = JSON.parse(JSON.stringify(args));
                console.log(newArgs);
              }
            } catch (err) {
              console.log(args);
            }
          };
        } else {
          p5.prototype.print = function() {};
        }
        p5.prototype.frameCount = 0;
        p5.prototype.focused = (document.hasFocus());
        p5.prototype.cursor = function(type, x, y) {
          var cursor = 'auto';
          var canvas = this._curElement.elt;
          if (standardCursors.indexOf(type) > -1) {
            cursor = type;
          } else if (typeof type === 'string') {
            var coords = '';
            if (x && y && (typeof x === 'number' && typeof y === 'number')) {
              coords = x + ' ' + y;
            }
            if ((type.substring(0, 7) === 'http://') || (type.substring(0, 8) === 'https://')) {
              cursor = 'url(' + type + ') ' + coords + ', auto';
            } else if (/\.(cur|jpg|jpeg|gif|png|CUR|JPG|JPEG|GIF|PNG)$/.test(type)) {
              cursor = 'url(' + type + ') ' + coords + ', auto';
            } else {
              cursor = type;
            }
          }
          canvas.style.cursor = cursor;
        };
        p5.prototype.frameRate = function(fps) {
          if (typeof fps !== 'number' || fps <= 0) {
            return this._frameRate;
          } else {
            this._setProperty('_targetFrameRate', fps);
            this._runFrames();
            return this;
          }
        };
        p5.prototype.getFrameRate = function() {
          return this.frameRate();
        };
        p5.prototype.setFrameRate = function(fps) {
          return this.frameRate(fps);
        };
        p5.prototype.noCursor = function() {
          this._curElement.elt.style.cursor = 'none';
        };
        p5.prototype.displayWidth = screen.width;
        p5.prototype.displayHeight = screen.height;
        p5.prototype.windowWidth = getWindowWidth();
        p5.prototype.windowHeight = getWindowHeight();
        p5.prototype._onresize = function(e) {
          this._setProperty('windowWidth', getWindowWidth());
          this._setProperty('windowHeight', getWindowHeight());
          var context = this._isGlobal ? window : this;
          var executeDefault;
          if (typeof context.windowResized === 'function') {
            executeDefault = context.windowResized(e);
            if (executeDefault !== undefined && !executeDefault) {
              e.preventDefault();
            }
          }
        };
        function getWindowWidth() {
          return window.innerWidth || document.documentElement && document.documentElement.clientWidth || document.body && document.body.clientWidth || 0;
        }
        function getWindowHeight() {
          return window.innerHeight || document.documentElement && document.documentElement.clientHeight || document.body && document.body.clientHeight || 0;
        }
        p5.prototype.width = 0;
        p5.prototype.height = 0;
        p5.prototype.fullscreen = function(val) {
          if (typeof val === 'undefined') {
            return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
          } else {
            if (val) {
              launchFullscreen(document.documentElement);
            } else {
              exitFullscreen();
            }
          }
        };
        p5.prototype.pixelDensity = function(val) {
          if (typeof val === 'number') {
            this._pixelDensity = val;
          } else {
            return this._pixelDensity;
          }
          this.resizeCanvas(this.width, this.height, true);
        };
        p5.prototype.displayDensity = function() {
          return window.devicePixelRatio;
        };
        function launchFullscreen(element) {
          var enabled = document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled;
          if (!enabled) {
            throw new Error('Fullscreen not enabled in this browser.');
          }
          if (element.requestFullscreen) {
            element.requestFullscreen();
          } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
          } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
          } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
          }
        }
        function exitFullscreen() {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          }
        }
        p5.prototype.getURL = function() {
          return location.href;
        };
        p5.prototype.getURLPath = function() {
          return location.pathname.split('/').filter(function(v) {
            return v !== '';
          });
        };
        p5.prototype.getURLParams = function() {
          var re = /[?&]([^&=]+)(?:[&=])([^&=]+)/gim;
          var m;
          var v = {};
          while ((m = re.exec(location.search)) != null) {
            if (m.index === re.lastIndex) {
              re.lastIndex++;
            }
            v[m[1]] = m[2];
          }
          return v;
        };
        module.exports = p5;
      }, {
        "./constants": 41,
        "./core": 42
      }],
      45: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('./core');
        var doFriendlyWelcome = false;
        var class2type = {};
        var toString = class2type.toString;
        var names = ['Boolean', 'Number', 'String', 'Function', 'Array', 'Date', 'RegExp', 'Object', 'Error'];
        for (var n = 0; n < names.length; n++) {
          class2type['[object ' + names[n] + ']'] = names[n].toLowerCase();
        }
        var getType = function(obj) {
          if (obj == null) {
            return obj + '';
          }
          return typeof obj === 'object' || typeof obj === 'function' ? class2type[toString.call(obj)] || 'object' : typeof obj;
        };
        var FILE_LOAD = 3;
        var typeColors = ['#2D7BB6', '#EE9900', '#4DB200', '#C83C00'];
        function report(message, func, color) {
          if (doFriendlyWelcome) {
            friendlyWelcome();
            doFriendlyWelcome = false;
          }
          if ('undefined' === getType(color)) {
            color = '#B40033';
          } else if (getType(color) === 'number') {
            color = typeColors[color];
          }
        }
        var errorCases = {
          '0': {
            fileType: 'image',
            method: 'loadImage',
            message: ' hosting the image online,'
          },
          '1': {
            fileType: 'XML file',
            method: 'loadXML'
          },
          '2': {
            fileType: 'table file',
            method: 'loadTable'
          },
          '3': {
            fileType: 'text file',
            method: 'loadStrings'
          },
          '4': {
            fileType: 'font',
            method: 'loadFont',
            message: ' hosting the font online,'
          }
        };
        p5._friendlyFileLoadError = function(errorType, filePath) {
          var errorInfo = errorCases[errorType];
          var message = 'It looks like there was a problem' + ' loading your ' + errorInfo.fileType + '.' + ' Try checking if the file path%c [' + filePath + '] %cis correct,' + (errorInfo.message || '') + ' or running a local server.';
          report(message, errorInfo.method, FILE_LOAD);
        };
        function friendlyWelcome() {
          var astrixBgColor = 'transparent';
          var astrixTxtColor = '#ED225D';
          var welcomeBgColor = '#ED225D';
          var welcomeTextColor = 'white';
          console.log('%c    _ \n' + ' /\\| |/\\ \n' + ' \\ ` \' /  \n' + ' / , . \\  \n' + ' \\/|_|\\/ ' + '\n\n%c> p5.js says: Welcome! ' + 'This is your friendly debugger. ' + 'To turn me off switch to using “p5.min.js”.', 'background-color:' + astrixBgColor + ';color:' + astrixTxtColor + ';', 'background-color:' + welcomeBgColor + ';color:' + welcomeTextColor + ';');
        }
        var misusedAtTopLevelCode = null;
        var FAQ_URL = 'https://github.com/processing/p5.js/wiki/' + 'Frequently-Asked-Questions' + '#why-cant-i-assign-variables-using-p5-functions-and-' + 'variables-before-setup';
        function defineMisusedAtTopLevelCode() {
          var uniqueNamesFound = {};
          var getSymbols = function(obj) {
            return Object.getOwnPropertyNames(obj).filter(function(name) {
              if (name[0] === '_') {
                return false;
              }
              if (name in uniqueNamesFound) {
                return false;
              }
              uniqueNamesFound[name] = true;
              return true;
            }).map(function(name) {
              var type;
              if (typeof(obj[name]) === 'function') {
                type = 'function';
              } else if (name === name.toUpperCase()) {
                type = 'constant';
              } else {
                type = 'variable';
              }
              return {
                name: name,
                type: type
              };
            });
          };
          misusedAtTopLevelCode = [].concat(getSymbols(p5.prototype), getSymbols(_dereq_('./constants')));
          misusedAtTopLevelCode.sort(function(a, b) {
            return b.name.length - a.name.length;
          });
        }
        function helpForMisusedAtTopLevelCode(e, log) {
          if (!log) {
            log = console.log.bind(console);
          }
          if (!misusedAtTopLevelCode) {
            defineMisusedAtTopLevelCode();
          }
          misusedAtTopLevelCode.some(function(symbol) {
            if (e.message && e.message.match('\\W?' + symbol.name + '\\W') !== null) {
              log('%cDid you just try to use p5.js\'s ' + symbol.name + (symbol.type === 'function' ? '() ' : ' ') + symbol.type + '? If so, you may want to ' + 'move it into your sketch\'s setup() function.\n\n' + 'For more details, see: ' + FAQ_URL, 'color: #B40033');
              return true;
            }
          });
        }
        p5.prototype._helpForMisusedAtTopLevelCode = helpForMisusedAtTopLevelCode;
        if (document.readyState !== 'complete') {
          window.addEventListener('error', helpForMisusedAtTopLevelCode, false);
          window.addEventListener('load', function() {
            window.removeEventListener('error', helpForMisusedAtTopLevelCode, false);
          });
        }
        module.exports = p5;
      }, {
        "./constants": 41,
        "./core": 42
      }],
      46: [function(_dereq_, module, exports) {
        var p5 = _dereq_('./core');
        p5.Element = function(elt, pInst) {
          this.elt = elt;
          this._pInst = pInst;
          this._events = {};
          this.width = this.elt.offsetWidth;
          this.height = this.elt.offsetHeight;
        };
        p5.Element.prototype.parent = function(p) {
          if (arguments.length === 0) {
            return this.elt.parentNode;
          } else {
            if (typeof p === 'string') {
              if (p[0] === '#') {
                p = p.substring(1);
              }
              p = document.getElementById(p);
            } else if (p instanceof p5.Element) {
              p = p.elt;
            }
            p.appendChild(this.elt);
            return this;
          }
        };
        p5.Element.prototype.id = function(id) {
          if (arguments.length === 0) {
            return this.elt.id;
          } else {
            this.elt.id = id;
            this.width = this.elt.offsetWidth;
            this.height = this.elt.offsetHeight;
            return this;
          }
        };
        p5.Element.prototype.class = function(c) {
          if (arguments.length === 0) {
            return this.elt.className;
          } else {
            this.elt.className = c;
            return this;
          }
        };
        p5.Element.prototype.mousePressed = function(fxn) {
          attachListener('mousedown', fxn, this);
          if (!window.PointerEvent) {
            attachListener('touchstart', fxn, this);
          }
          return this;
        };
        p5.Element.prototype.mouseWheel = function(fxn) {
          attachListener('wheel', fxn, this);
          return this;
        };
        p5.Element.prototype.mouseReleased = function(fxn) {
          attachListener('mouseup', fxn, this);
          if (!window.PointerEvent) {
            attachListener('touchend', fxn, this);
          }
          return this;
        };
        p5.Element.prototype.mouseClicked = function(fxn) {
          attachListener('click', fxn, this);
          return this;
        };
        p5.Element.prototype.mouseMoved = function(fxn) {
          attachListener('mousemove', fxn, this);
          if (!window.PointerEvent) {
            attachListener('touchmove', fxn, this);
          }
          return this;
        };
        p5.Element.prototype.mouseOver = function(fxn) {
          attachListener('mouseover', fxn, this);
          return this;
        };
        p5.Element.prototype.changed = function(fxn) {
          attachListener('change', fxn, this);
          return this;
        };
        p5.Element.prototype.input = function(fxn) {
          attachListener('input', fxn, this);
          return this;
        };
        p5.Element.prototype.mouseOut = function(fxn) {
          attachListener('mouseout', fxn, this);
          return this;
        };
        p5.Element.prototype.touchStarted = function(fxn) {
          attachListener('touchstart', fxn, this);
          if (!window.PointerEvent) {
            attachListener('mousedown', fxn, this);
          }
          return this;
        };
        p5.Element.prototype.touchMoved = function(fxn) {
          attachListener('touchmove', fxn, this);
          if (!window.PointerEvent) {
            attachListener('mousemove', fxn, this);
          }
          return this;
        };
        p5.Element.prototype.touchEnded = function(fxn) {
          attachListener('touchend', fxn, this);
          if (!window.PointerEvent) {
            attachListener('mouseup', fxn, this);
          }
          return this;
        };
        p5.Element.prototype.dragOver = function(fxn) {
          attachListener('dragover', fxn, this);
          return this;
        };
        p5.Element.prototype.dragLeave = function(fxn) {
          attachListener('dragleave', fxn, this);
          return this;
        };
        p5.Element.prototype.drop = function(callback, fxn) {
          function makeLoader(theFile) {
            var p5file = new p5.File(theFile);
            return function(e) {
              p5file.data = e.target.result;
              callback(p5file);
            };
          }
          if (window.File && window.FileReader && window.FileList && window.Blob) {
            attachListener('dragover', function(evt) {
              evt.stopPropagation();
              evt.preventDefault();
            }, this);
            attachListener('dragleave', function(evt) {
              evt.stopPropagation();
              evt.preventDefault();
            }, this);
            if (arguments.length > 1) {
              attachListener('drop', fxn, this);
            }
            attachListener('drop', function(evt) {
              evt.stopPropagation();
              evt.preventDefault();
              var files = evt.dataTransfer.files;
              for (var i = 0; i < files.length; i++) {
                var f = files[i];
                var reader = new FileReader();
                reader.onload = makeLoader(f);
                if (f.type.indexOf('text') > -1) {
                  reader.readAsText(f);
                } else {
                  reader.readAsDataURL(f);
                }
              }
            }, this);
          } else {
            console.log('The File APIs are not fully supported in this browser.');
          }
          return this;
        };
        function attachListener(ev, fxn, ctx) {
          var f = fxn.bind(ctx);
          ctx.elt.addEventListener(ev, f, false);
          ctx._events[ev] = f;
        }
        p5.Element.prototype._setProperty = function(prop, value) {
          this[prop] = value;
        };
        module.exports = p5.Element;
      }, {"./core": 42}],
      47: [function(_dereq_, module, exports) {
        var p5 = _dereq_('./core');
        var constants = _dereq_('./constants');
        p5.Graphics = function(w, h, renderer, pInst) {
          var r = renderer || constants.P2D;
          var c = document.createElement('canvas');
          var node = this._userNode || document.body;
          node.appendChild(c);
          p5.Element.call(this, c, pInst, false);
          this._styles = [];
          this.width = w;
          this.height = h;
          this._pixelDensity = pInst._pixelDensity;
          if (r === constants.WEBGL) {
            this._renderer = new p5.RendererGL(c, this, false);
          } else {
            this._renderer = new p5.Renderer2D(c, this, false);
          }
          this._renderer.resize(w, h);
          this._renderer._applyDefaults();
          pInst._elements.push(this);
          for (var p in p5.prototype) {
            if (!this[p]) {
              if (typeof p5.prototype[p] === 'function') {
                this[p] = p5.prototype[p].bind(this);
              } else {
                this[p] = p5.prototype[p];
              }
            }
          }
          return this;
        };
        p5.Graphics.prototype = Object.create(p5.Element.prototype);
        p5.Graphics.prototype.remove = function() {
          if (this.elt.parentNode) {
            this.elt.parentNode.removeChild(this.elt);
          }
          for (var elt_ev in this._events) {
            this.elt.removeEventListener(elt_ev, this._events[elt_ev]);
          }
        };
        module.exports = p5.Graphics;
      }, {
        "./constants": 41,
        "./core": 42
      }],
      48: [function(_dereq_, module, exports) {
        var p5 = _dereq_('./core');
        var constants = _dereq_('../core/constants');
        p5.Renderer = function(elt, pInst, isMainCanvas) {
          p5.Element.call(this, elt, pInst);
          this.canvas = elt;
          this._pInst = pInst;
          if (isMainCanvas) {
            this._isMainCanvas = true;
            this._pInst._setProperty('_curElement', this);
            this._pInst._setProperty('canvas', this.canvas);
            this._pInst._setProperty('width', this.width);
            this._pInst._setProperty('height', this.height);
          } else {
            this.canvas.style.display = 'none';
            this._styles = [];
          }
          this._textSize = 12;
          this._textLeading = 15;
          this._textFont = 'sans-serif';
          this._textStyle = constants.NORMAL;
          this._textAscent = null;
          this._textDescent = null;
          this._rectMode = constants.CORNER;
          this._ellipseMode = constants.CENTER;
          this._curveTightness = 0;
          this._imageMode = constants.CORNER;
          this._tint = null;
          this._doStroke = true;
          this._doFill = true;
          this._strokeSet = false;
          this._fillSet = false;
          this._colorMode = constants.RGB;
          this._colorMaxes = {
            rgb: [255, 255, 255, 255],
            hsb: [360, 100, 100, 1],
            hsl: [360, 100, 100, 1]
          };
        };
        p5.Renderer.prototype = Object.create(p5.Element.prototype);
        p5.Renderer.prototype.resize = function(w, h) {
          this.width = w;
          this.height = h;
          this.elt.width = w * this._pInst._pixelDensity;
          this.elt.height = h * this._pInst._pixelDensity;
          this.elt.style.width = w + 'px';
          this.elt.style.height = h + 'px';
          if (this._isMainCanvas) {
            this._pInst._setProperty('width', this.width);
            this._pInst._setProperty('height', this.height);
          }
        };
        p5.Renderer.prototype.textLeading = function(l) {
          if (arguments.length && arguments[0]) {
            this._setProperty('_textLeading', l);
            return this;
          }
          return this._textLeading;
        };
        p5.Renderer.prototype.textSize = function(s) {
          if (arguments.length && arguments[0]) {
            this._setProperty('_textSize', s);
            this._setProperty('_textLeading', s * constants._DEFAULT_LEADMULT);
            return this._applyTextProperties();
          }
          return this._textSize;
        };
        p5.Renderer.prototype.textStyle = function(s) {
          if (arguments.length && arguments[0]) {
            if (s === constants.NORMAL || s === constants.ITALIC || s === constants.BOLD) {
              this._setProperty('_textStyle', s);
            }
            return this._applyTextProperties();
          }
          return this._textStyle;
        };
        p5.Renderer.prototype.textAscent = function() {
          if (this._textAscent === null) {
            this._updateTextMetrics();
          }
          return this._textAscent;
        };
        p5.Renderer.prototype.textDescent = function() {
          if (this._textDescent === null) {
            this._updateTextMetrics();
          }
          return this._textDescent;
        };
        p5.Renderer.prototype._applyDefaults = function() {
          return this;
        };
        p5.Renderer.prototype._isOpenType = function(f) {
          f = f || this._textFont;
          return (typeof f === 'object' && f.font && f.font.supported);
        };
        p5.Renderer.prototype._updateTextMetrics = function() {
          if (this._isOpenType()) {
            this._setProperty('_textAscent', this._textFont._textAscent());
            this._setProperty('_textDescent', this._textFont._textDescent());
            return this;
          }
          var text = document.createElement('span');
          text.style.fontFamily = this._textFont;
          text.style.fontSize = this._textSize + 'px';
          text.innerHTML = 'ABCjgq|';
          var block = document.createElement('div');
          block.style.display = 'inline-block';
          block.style.width = '1px';
          block.style.height = '0px';
          var container = document.createElement('div');
          container.appendChild(text);
          container.appendChild(block);
          container.style.height = '0px';
          container.style.overflow = 'hidden';
          document.body.appendChild(container);
          block.style.verticalAlign = 'baseline';
          var blockOffset = calculateOffset(block);
          var textOffset = calculateOffset(text);
          var ascent = blockOffset[1] - textOffset[1];
          block.style.verticalAlign = 'bottom';
          blockOffset = calculateOffset(block);
          textOffset = calculateOffset(text);
          var height = blockOffset[1] - textOffset[1];
          var descent = height - ascent;
          document.body.removeChild(container);
          this._setProperty('_textAscent', ascent);
          this._setProperty('_textDescent', descent);
          return this;
        };
        function calculateOffset(object) {
          var currentLeft = 0,
              currentTop = 0;
          if (object.offsetParent) {
            do {
              currentLeft += object.offsetLeft;
              currentTop += object.offsetTop;
            } while (object = object.offsetParent);
          } else {
            currentLeft += object.offsetLeft;
            currentTop += object.offsetTop;
          }
          return [currentLeft, currentTop];
        }
        module.exports = p5.Renderer;
      }, {
        "../core/constants": 41,
        "./core": 42
      }],
      49: [function(_dereq_, module, exports) {
        var p5 = _dereq_('./core');
        var canvas = _dereq_('./canvas');
        var constants = _dereq_('./constants');
        var filters = _dereq_('../image/filters');
        _dereq_('./p5.Renderer');
        var styleEmpty = 'rgba(0,0,0,0)';
        p5.Renderer2D = function(elt, pInst, isMainCanvas) {
          p5.Renderer.call(this, elt, pInst, isMainCanvas);
          this.drawingContext = this.canvas.getContext('2d');
          this._pInst._setProperty('drawingContext', this.drawingContext);
          return this;
        };
        p5.Renderer2D.prototype = Object.create(p5.Renderer.prototype);
        p5.Renderer2D.prototype._applyDefaults = function() {
          this.drawingContext.fillStyle = constants._DEFAULT_FILL;
          this.drawingContext.strokeStyle = constants._DEFAULT_STROKE;
          this.drawingContext.lineCap = constants.ROUND;
          this.drawingContext.font = 'normal 12px sans-serif';
        };
        p5.Renderer2D.prototype.resize = function(w, h) {
          p5.Renderer.prototype.resize.call(this, w, h);
          this.drawingContext.scale(this._pInst._pixelDensity, this._pInst._pixelDensity);
        };
        p5.Renderer2D.prototype.background = function() {
          this.drawingContext.save();
          this.drawingContext.setTransform(1, 0, 0, 1, 0, 0);
          this.drawingContext.scale(this._pInst._pixelDensity, this._pInst._pixelDensity);
          if (arguments[0] instanceof p5.Image) {
            this._pInst.image(arguments[0], 0, 0, this.width, this.height);
          } else {
            var curFill = this.drawingContext.fillStyle;
            var color = this._pInst.color.apply(this, arguments);
            var newFill = color.toString();
            this.drawingContext.fillStyle = newFill;
            this.drawingContext.fillRect(0, 0, this.width, this.height);
            this.drawingContext.fillStyle = curFill;
          }
          this.drawingContext.restore();
        };
        p5.Renderer2D.prototype.clear = function() {
          this.drawingContext.clearRect(0, 0, this.width, this.height);
        };
        p5.Renderer2D.prototype.fill = function() {
          var ctx = this.drawingContext;
          var color = this._pInst.color.apply(this, arguments);
          ctx.fillStyle = color.toString();
        };
        p5.Renderer2D.prototype.stroke = function() {
          var ctx = this.drawingContext;
          var color = this._pInst.color.apply(this, arguments);
          ctx.strokeStyle = color.toString();
        };
        p5.Renderer2D.prototype.image = function(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
          var cnv;
          try {
            if (this._tint) {
              if (p5.MediaElement && img instanceof p5.MediaElement) {
                img.loadPixels();
              }
              if (img.canvas) {
                cnv = this._getTintedImageCanvas(img);
              }
            }
            if (!cnv) {
              cnv = img.canvas || img.elt;
            }
            this.drawingContext.drawImage(cnv, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
          } catch (e) {
            if (e.name !== 'NS_ERROR_NOT_AVAILABLE') {
              throw e;
            }
          }
        };
        p5.Renderer2D.prototype._getTintedImageCanvas = function(img) {
          if (!img.canvas) {
            return img;
          }
          var pixels = filters._toPixels(img.canvas);
          var tmpCanvas = document.createElement('canvas');
          tmpCanvas.width = img.canvas.width;
          tmpCanvas.height = img.canvas.height;
          var tmpCtx = tmpCanvas.getContext('2d');
          var id = tmpCtx.createImageData(img.canvas.width, img.canvas.height);
          var newPixels = id.data;
          for (var i = 0; i < pixels.length; i += 4) {
            var r = pixels[i];
            var g = pixels[i + 1];
            var b = pixels[i + 2];
            var a = pixels[i + 3];
            newPixels[i] = r * this._tint[0] / 255;
            newPixels[i + 1] = g * this._tint[1] / 255;
            newPixels[i + 2] = b * this._tint[2] / 255;
            newPixels[i + 3] = a * this._tint[3] / 255;
          }
          tmpCtx.putImageData(id, 0, 0);
          return tmpCanvas;
        };
        p5.Renderer2D.prototype.blendMode = function(mode) {
          this.drawingContext.globalCompositeOperation = mode;
        };
        p5.Renderer2D.prototype.blend = function() {
          var currBlend = this.drawingContext.globalCompositeOperation;
          var blendMode = arguments[arguments.length - 1];
          var copyArgs = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
          this.drawingContext.globalCompositeOperation = blendMode;
          if (this._pInst) {
            this._pInst.copy.apply(this._pInst, copyArgs);
          } else {
            this.copy.apply(this, copyArgs);
          }
          this.drawingContext.globalCompositeOperation = currBlend;
        };
        p5.Renderer2D.prototype.copy = function() {
          var srcImage,
              sx,
              sy,
              sw,
              sh,
              dx,
              dy,
              dw,
              dh;
          if (arguments.length === 9) {
            srcImage = arguments[0];
            sx = arguments[1];
            sy = arguments[2];
            sw = arguments[3];
            sh = arguments[4];
            dx = arguments[5];
            dy = arguments[6];
            dw = arguments[7];
            dh = arguments[8];
          } else if (arguments.length === 8) {
            srcImage = this._pInst;
            sx = arguments[0];
            sy = arguments[1];
            sw = arguments[2];
            sh = arguments[3];
            dx = arguments[4];
            dy = arguments[5];
            dw = arguments[6];
            dh = arguments[7];
          } else {
            throw new Error('Signature not supported');
          }
          p5.Renderer2D._copyHelper(srcImage, sx, sy, sw, sh, dx, dy, dw, dh);
        };
        p5.Renderer2D._copyHelper = function(srcImage, sx, sy, sw, sh, dx, dy, dw, dh) {
          srcImage.loadPixels();
          var s = srcImage.canvas.width / srcImage.width;
          this.drawingContext.drawImage(srcImage.canvas, s * sx, s * sy, s * sw, s * sh, dx, dy, dw, dh);
        };
        p5.Renderer2D.prototype.get = function(x, y, w, h) {
          if (x === undefined && y === undefined && w === undefined && h === undefined) {
            x = 0;
            y = 0;
            w = this.width;
            h = this.height;
          } else if (w === undefined && h === undefined) {
            w = 1;
            h = 1;
          }
          if (x + w < 0 || y + h < 0 || x > this.width || y > this.height) {
            return [0, 0, 0, 255];
          }
          var ctx = this._pInst || this;
          ctx.loadPixels();
          var pd = ctx._pixelDensity;
          x = Math.floor(x);
          y = Math.floor(y);
          w = Math.floor(w);
          h = Math.floor(h);
          var sx = x * pd;
          var sy = y * pd;
          if (w === 1 && h === 1) {
            var imageData = this.drawingContext.getImageData(sx, sy, 1, 1).data;
            return [imageData[0], imageData[1], imageData[2], imageData[3]];
          } else {
            var dw = Math.min(w, ctx.width);
            var dh = Math.min(h, ctx.height);
            var sw = dw * pd;
            var sh = dh * pd;
            var region = new p5.Image(dw, dh);
            region.canvas.getContext('2d').drawImage(this.canvas, sx, sy, sw, sh, 0, 0, dw, dh);
            return region;
          }
        };
        p5.Renderer2D.prototype.loadPixels = function() {
          var pd = this._pixelDensity || this._pInst._pixelDensity;
          var w = this.width * pd;
          var h = this.height * pd;
          var imageData = this.drawingContext.getImageData(0, 0, w, h);
          if (this._pInst) {
            this._pInst._setProperty('imageData', imageData);
            this._pInst._setProperty('pixels', imageData.data);
          } else {
            this._setProperty('imageData', imageData);
            this._setProperty('pixels', imageData.data);
          }
        };
        p5.Renderer2D.prototype.set = function(x, y, imgOrCol) {
          x = Math.floor(x);
          y = Math.floor(y);
          if (imgOrCol instanceof p5.Image) {
            this.drawingContext.save();
            this.drawingContext.setTransform(1, 0, 0, 1, 0, 0);
            this.drawingContext.scale(this._pInst._pixelDensity, this._pInst._pixelDensity);
            this.drawingContext.drawImage(imgOrCol.canvas, x, y);
            this.loadPixels.call(this._pInst);
            this.drawingContext.restore();
          } else {
            var ctx = this._pInst || this;
            var r = 0,
                g = 0,
                b = 0,
                a = 0;
            var idx = 4 * ((y * ctx._pixelDensity) * (this.width * ctx._pixelDensity) + (x * ctx._pixelDensity));
            if (!ctx.imageData) {
              ctx.loadPixels.call(ctx);
            }
            if (typeof imgOrCol === 'number') {
              if (idx < ctx.pixels.length) {
                r = imgOrCol;
                g = imgOrCol;
                b = imgOrCol;
                a = 255;
              }
            } else if (imgOrCol instanceof Array) {
              if (imgOrCol.length < 4) {
                throw new Error('pixel array must be of the form [R, G, B, A]');
              }
              if (idx < ctx.pixels.length) {
                r = imgOrCol[0];
                g = imgOrCol[1];
                b = imgOrCol[2];
                a = imgOrCol[3];
              }
            } else if (imgOrCol instanceof p5.Color) {
              if (idx < ctx.pixels.length) {
                r = imgOrCol.levels[0];
                g = imgOrCol.levels[1];
                b = imgOrCol.levels[2];
                a = imgOrCol.levels[3];
              }
            }
            for (var i = 0; i < ctx._pixelDensity; i++) {
              for (var j = 0; j < ctx._pixelDensity; j++) {
                idx = 4 * ((y * ctx._pixelDensity + j) * this.width * ctx._pixelDensity + (x * ctx._pixelDensity + i));
                ctx.pixels[idx] = r;
                ctx.pixels[idx + 1] = g;
                ctx.pixels[idx + 2] = b;
                ctx.pixels[idx + 3] = a;
              }
            }
          }
        };
        p5.Renderer2D.prototype.updatePixels = function(x, y, w, h) {
          var pd = this._pixelDensity || this._pInst._pixelDensity;
          if (x === undefined && y === undefined && w === undefined && h === undefined) {
            x = 0;
            y = 0;
            w = this.width;
            h = this.height;
          }
          w *= pd;
          h *= pd;
          if (this._pInst) {
            this.drawingContext.putImageData(this._pInst.imageData, x, y, 0, 0, w, h);
          } else {
            this.drawingContext.putImageData(this.imageData, x, y, 0, 0, w, h);
          }
        };
        p5.Renderer2D.prototype._acuteArcToBezier = function _acuteArcToBezier(start, size) {
          var alpha = size / 2.0,
              cos_alpha = Math.cos(alpha),
              sin_alpha = Math.sin(alpha),
              cot_alpha = 1.0 / Math.tan(alpha),
              phi = start + alpha,
              cos_phi = Math.cos(phi),
              sin_phi = Math.sin(phi),
              lambda = (4.0 - cos_alpha) / 3.0,
              mu = sin_alpha + (cos_alpha - lambda) * cot_alpha;
          return {
            ax: Math.cos(start),
            ay: Math.sin(start),
            bx: lambda * cos_phi + mu * sin_phi,
            by: lambda * sin_phi - mu * cos_phi,
            cx: lambda * cos_phi - mu * sin_phi,
            cy: lambda * sin_phi + mu * cos_phi,
            dx: Math.cos(start + size),
            dy: Math.sin(start + size)
          };
        };
        p5.Renderer2D.prototype.arc = function(x, y, w, h, start, stop, mode) {
          var ctx = this.drawingContext;
          var vals = canvas.arcModeAdjust(x, y, w, h, this._ellipseMode);
          var rx = vals.w / 2.0;
          var ry = vals.h / 2.0;
          var epsilon = 0.00001;
          var arcToDraw = 0;
          var curves = [];
          while (stop - start > epsilon) {
            arcToDraw = Math.min(stop - start, constants.HALF_PI);
            curves.push(this._acuteArcToBezier(start, arcToDraw));
            start += arcToDraw;
          }
          if (this._doFill) {
            ctx.beginPath();
            curves.forEach(function(curve, index) {
              if (index === 0) {
                ctx.moveTo(vals.x + curve.ax * rx, vals.y + curve.ay * ry);
              }
              ctx.bezierCurveTo(vals.x + curve.bx * rx, vals.y + curve.by * ry, vals.x + curve.cx * rx, vals.y + curve.cy * ry, vals.x + curve.dx * rx, vals.y + curve.dy * ry);
            });
            if (mode === constants.PIE || mode == null) {
              ctx.lineTo(vals.x, vals.y);
            }
            ctx.closePath();
            ctx.fill();
          }
          if (this._doStroke) {
            ctx.beginPath();
            curves.forEach(function(curve, index) {
              if (index === 0) {
                ctx.moveTo(vals.x + curve.ax * rx, vals.y + curve.ay * ry);
              }
              ctx.bezierCurveTo(vals.x + curve.bx * rx, vals.y + curve.by * ry, vals.x + curve.cx * rx, vals.y + curve.cy * ry, vals.x + curve.dx * rx, vals.y + curve.dy * ry);
            });
            if (mode === constants.PIE) {
              ctx.lineTo(vals.x, vals.y);
              ctx.closePath();
            } else if (mode === constants.CHORD) {
              ctx.closePath();
            }
            ctx.stroke();
          }
          return this;
        };
        p5.Renderer2D.prototype.ellipse = function(args) {
          var ctx = this.drawingContext;
          var doFill = this._doFill,
              doStroke = this._doStroke;
          var x = args[0],
              y = args[1],
              w = args[2],
              h = args[3];
          if (doFill && !doStroke) {
            if (ctx.fillStyle === styleEmpty) {
              return this;
            }
          } else if (!doFill && doStroke) {
            if (ctx.strokeStyle === styleEmpty) {
              return this;
            }
          }
          var kappa = 0.5522847498,
              ox = (w / 2) * kappa,
              oy = (h / 2) * kappa,
              xe = x + w,
              ye = y + h,
              xm = x + w / 2,
              ym = y + h / 2;
          ctx.beginPath();
          ctx.moveTo(x, ym);
          ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
          ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
          ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
          ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
          ctx.closePath();
          if (doFill) {
            ctx.fill();
          }
          if (doStroke) {
            ctx.stroke();
          }
        };
        p5.Renderer2D.prototype.line = function(x1, y1, x2, y2) {
          var ctx = this.drawingContext;
          if (!this._doStroke) {
            return this;
          } else if (ctx.strokeStyle === styleEmpty) {
            return this;
          }
          if (ctx.lineWidth % 2 === 1) {
            ctx.translate(0.5, 0.5);
          }
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          if (ctx.lineWidth % 2 === 1) {
            ctx.translate(-0.5, -0.5);
          }
          return this;
        };
        p5.Renderer2D.prototype.point = function(x, y) {
          var ctx = this.drawingContext;
          var s = ctx.strokeStyle;
          var f = ctx.fillStyle;
          if (!this._doStroke) {
            return this;
          } else if (ctx.strokeStyle === styleEmpty) {
            return this;
          }
          x = Math.round(x);
          y = Math.round(y);
          ctx.fillStyle = s;
          if (ctx.lineWidth > 1) {
            ctx.beginPath();
            ctx.arc(x, y, ctx.lineWidth / 2, 0, constants.TWO_PI, false);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, 1, 1);
          }
          ctx.fillStyle = f;
        };
        p5.Renderer2D.prototype.quad = function(x1, y1, x2, y2, x3, y3, x4, y4) {
          var ctx = this.drawingContext;
          var doFill = this._doFill,
              doStroke = this._doStroke;
          if (doFill && !doStroke) {
            if (ctx.fillStyle === styleEmpty) {
              return this;
            }
          } else if (!doFill && doStroke) {
            if (ctx.strokeStyle === styleEmpty) {
              return this;
            }
          }
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x3, y3);
          ctx.lineTo(x4, y4);
          ctx.closePath();
          if (doFill) {
            ctx.fill();
          }
          if (doStroke) {
            ctx.stroke();
          }
          return this;
        };
        p5.Renderer2D.prototype.rect = function(args) {
          var x = args[0],
              y = args[1],
              w = args[2],
              h = args[3],
              tl = args[4],
              tr = args[5],
              br = args[6],
              bl = args[7];
          var ctx = this.drawingContext;
          var doFill = this._doFill,
              doStroke = this._doStroke;
          if (doFill && !doStroke) {
            if (ctx.fillStyle === styleEmpty) {
              return this;
            }
          } else if (!doFill && doStroke) {
            if (ctx.strokeStyle === styleEmpty) {
              return this;
            }
          }
          if (this._doStroke && ctx.lineWidth % 2 === 1) {
            ctx.translate(0.5, 0.5);
          }
          ctx.beginPath();
          if (typeof tl === 'undefined') {
            ctx.rect(x, y, w, h);
          } else {
            if (typeof tr === 'undefined') {
              tr = tl;
            }
            if (typeof br === 'undefined') {
              br = tr;
            }
            if (typeof bl === 'undefined') {
              bl = br;
            }
            var hw = w / 2;
            var hh = h / 2;
            if (w < 2 * tl) {
              tl = hw;
            }
            if (h < 2 * tl) {
              tl = hh;
            }
            if (w < 2 * tr) {
              tr = hw;
            }
            if (h < 2 * tr) {
              tr = hh;
            }
            if (w < 2 * br) {
              br = hw;
            }
            if (h < 2 * br) {
              br = hh;
            }
            if (w < 2 * bl) {
              bl = hw;
            }
            if (h < 2 * bl) {
              bl = hh;
            }
            ctx.beginPath();
            ctx.moveTo(x + tl, y);
            ctx.arcTo(x + w, y, x + w, y + h, tr);
            ctx.arcTo(x + w, y + h, x, y + h, br);
            ctx.arcTo(x, y + h, x, y, bl);
            ctx.arcTo(x, y, x + w, y, tl);
            ctx.closePath();
          }
          if (this._doFill) {
            ctx.fill();
          }
          if (this._doStroke) {
            ctx.stroke();
          }
          if (this._doStroke && ctx.lineWidth % 2 === 1) {
            ctx.translate(-0.5, -0.5);
          }
          return this;
        };
        p5.Renderer2D.prototype.triangle = function(args) {
          var ctx = this.drawingContext;
          var doFill = this._doFill,
              doStroke = this._doStroke;
          var x1 = args[0],
              y1 = args[1];
          var x2 = args[2],
              y2 = args[3];
          var x3 = args[4],
              y3 = args[5];
          if (doFill && !doStroke) {
            if (ctx.fillStyle === styleEmpty) {
              return this;
            }
          } else if (!doFill && doStroke) {
            if (ctx.strokeStyle === styleEmpty) {
              return this;
            }
          }
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x3, y3);
          ctx.closePath();
          if (doFill) {
            ctx.fill();
          }
          if (doStroke) {
            ctx.stroke();
          }
        };
        p5.Renderer2D.prototype.endShape = function(mode, vertices, isCurve, isBezier, isQuadratic, isContour, shapeKind) {
          if (vertices.length === 0) {
            return this;
          }
          if (!this._doStroke && !this._doFill) {
            return this;
          }
          var closeShape = mode === constants.CLOSE;
          var v;
          if (closeShape && !isContour) {
            vertices.push(vertices[0]);
          }
          var i,
              j;
          var numVerts = vertices.length;
          if (isCurve && (shapeKind === constants.POLYGON || shapeKind === null)) {
            if (numVerts > 3) {
              var b = [],
                  s = 1 - this._curveTightness;
              this.drawingContext.beginPath();
              this.drawingContext.moveTo(vertices[1][0], vertices[1][1]);
              for (i = 1; i + 2 < numVerts; i++) {
                v = vertices[i];
                b[0] = [v[0], v[1]];
                b[1] = [v[0] + (s * vertices[i + 1][0] - s * vertices[i - 1][0]) / 6, v[1] + (s * vertices[i + 1][1] - s * vertices[i - 1][1]) / 6];
                b[2] = [vertices[i + 1][0] + (s * vertices[i][0] - s * vertices[i + 2][0]) / 6, vertices[i + 1][1] + (s * vertices[i][1] - s * vertices[i + 2][1]) / 6];
                b[3] = [vertices[i + 1][0], vertices[i + 1][1]];
                this.drawingContext.bezierCurveTo(b[1][0], b[1][1], b[2][0], b[2][1], b[3][0], b[3][1]);
              }
              if (closeShape) {
                this.drawingContext.lineTo(vertices[i + 1][0], vertices[i + 1][1]);
              }
              this._doFillStrokeClose();
            }
          } else if (isBezier && (shapeKind === constants.POLYGON || shapeKind === null)) {
            this.drawingContext.beginPath();
            for (i = 0; i < numVerts; i++) {
              if (vertices[i].isVert) {
                if (vertices[i].moveTo) {
                  this.drawingContext.moveTo(vertices[i][0], vertices[i][1]);
                } else {
                  this.drawingContext.lineTo(vertices[i][0], vertices[i][1]);
                }
              } else {
                this.drawingContext.bezierCurveTo(vertices[i][0], vertices[i][1], vertices[i][2], vertices[i][3], vertices[i][4], vertices[i][5]);
              }
            }
            this._doFillStrokeClose();
          } else if (isQuadratic && (shapeKind === constants.POLYGON || shapeKind === null)) {
            this.drawingContext.beginPath();
            for (i = 0; i < numVerts; i++) {
              if (vertices[i].isVert) {
                if (vertices[i].moveTo) {
                  this.drawingContext.moveTo([0], vertices[i][1]);
                } else {
                  this.drawingContext.lineTo(vertices[i][0], vertices[i][1]);
                }
              } else {
                this.drawingContext.quadraticCurveTo(vertices[i][0], vertices[i][1], vertices[i][2], vertices[i][3]);
              }
            }
            this._doFillStrokeClose();
          } else {
            if (shapeKind === constants.POINTS) {
              for (i = 0; i < numVerts; i++) {
                v = vertices[i];
                if (this._doStroke) {
                  this._pInst.stroke(v[6]);
                }
                this._pInst.point(v[0], v[1]);
              }
            } else if (shapeKind === constants.LINES) {
              for (i = 0; i + 1 < numVerts; i += 2) {
                v = vertices[i];
                if (this._doStroke) {
                  this._pInst.stroke(vertices[i + 1][6]);
                }
                this._pInst.line(v[0], v[1], vertices[i + 1][0], vertices[i + 1][1]);
              }
            } else if (shapeKind === constants.TRIANGLES) {
              for (i = 0; i + 2 < numVerts; i += 3) {
                v = vertices[i];
                this.drawingContext.beginPath();
                this.drawingContext.moveTo(v[0], v[1]);
                this.drawingContext.lineTo(vertices[i + 1][0], vertices[i + 1][1]);
                this.drawingContext.lineTo(vertices[i + 2][0], vertices[i + 2][1]);
                this.drawingContext.lineTo(v[0], v[1]);
                if (this._doFill) {
                  this._pInst.fill(vertices[i + 2][5]);
                  this.drawingContext.fill();
                }
                if (this._doStroke) {
                  this._pInst.stroke(vertices[i + 2][6]);
                  this.drawingContext.stroke();
                }
                this.drawingContext.closePath();
              }
            } else if (shapeKind === constants.TRIANGLE_STRIP) {
              for (i = 0; i + 1 < numVerts; i++) {
                v = vertices[i];
                this.drawingContext.beginPath();
                this.drawingContext.moveTo(vertices[i + 1][0], vertices[i + 1][1]);
                this.drawingContext.lineTo(v[0], v[1]);
                if (this._doStroke) {
                  this._pInst.stroke(vertices[i + 1][6]);
                }
                if (this._doFill) {
                  this._pInst.fill(vertices[i + 1][5]);
                }
                if (i + 2 < numVerts) {
                  this.drawingContext.lineTo(vertices[i + 2][0], vertices[i + 2][1]);
                  if (this._doStroke) {
                    this._pInst.stroke(vertices[i + 2][6]);
                  }
                  if (this._doFill) {
                    this._pInst.fill(vertices[i + 2][5]);
                  }
                }
                this._doFillStrokeClose();
              }
            } else if (shapeKind === constants.TRIANGLE_FAN) {
              if (numVerts > 2) {
                this.drawingContext.beginPath();
                this.drawingContext.moveTo(vertices[0][0], vertices[0][1]);
                this.drawingContext.lineTo(vertices[1][0], vertices[1][1]);
                this.drawingContext.lineTo(vertices[2][0], vertices[2][1]);
                if (this._doFill) {
                  this._pInst.fill(vertices[2][5]);
                }
                if (this._doStroke) {
                  this._pInst.stroke(vertices[2][6]);
                }
                this._doFillStrokeClose();
                for (i = 3; i < numVerts; i++) {
                  v = vertices[i];
                  this.drawingContext.beginPath();
                  this.drawingContext.moveTo(vertices[0][0], vertices[0][1]);
                  this.drawingContext.lineTo(vertices[i - 1][0], vertices[i - 1][1]);
                  this.drawingContext.lineTo(v[0], v[1]);
                  if (this._doFill) {
                    this._pInst.fill(v[5]);
                  }
                  if (this._doStroke) {
                    this._pInst.stroke(v[6]);
                  }
                  this._doFillStrokeClose();
                }
              }
            } else if (shapeKind === constants.QUADS) {
              for (i = 0; i + 3 < numVerts; i += 4) {
                v = vertices[i];
                this.drawingContext.beginPath();
                this.drawingContext.moveTo(v[0], v[1]);
                for (j = 1; j < 4; j++) {
                  this.drawingContext.lineTo(vertices[i + j][0], vertices[i + j][1]);
                }
                this.drawingContext.lineTo(v[0], v[1]);
                if (this._doFill) {
                  this._pInst.fill(vertices[i + 3][5]);
                }
                if (this._doStroke) {
                  this._pInst.stroke(vertices[i + 3][6]);
                }
                this._doFillStrokeClose();
              }
            } else if (shapeKind === constants.QUAD_STRIP) {
              if (numVerts > 3) {
                for (i = 0; i + 1 < numVerts; i += 2) {
                  v = vertices[i];
                  this.drawingContext.beginPath();
                  if (i + 3 < numVerts) {
                    this.drawingContext.moveTo(vertices[i + 2][0], vertices[i + 2][1]);
                    this.drawingContext.lineTo(v[0], v[1]);
                    this.drawingContext.lineTo(vertices[i + 1][0], vertices[i + 1][1]);
                    this.drawingContext.lineTo(vertices[i + 3][0], vertices[i + 3][1]);
                    if (this._doFill) {
                      this._pInst.fill(vertices[i + 3][5]);
                    }
                    if (this._doStroke) {
                      this._pInst.stroke(vertices[i + 3][6]);
                    }
                  } else {
                    this.drawingContext.moveTo(v[0], v[1]);
                    this.drawingContext.lineTo(vertices[i + 1][0], vertices[i + 1][1]);
                  }
                  this._doFillStrokeClose();
                }
              }
            } else {
              this.drawingContext.beginPath();
              this.drawingContext.moveTo(vertices[0][0], vertices[0][1]);
              for (i = 1; i < numVerts; i++) {
                v = vertices[i];
                if (v.isVert) {
                  if (v.moveTo) {
                    this.drawingContext.moveTo(v[0], v[1]);
                  } else {
                    this.drawingContext.lineTo(v[0], v[1]);
                  }
                }
              }
              this._doFillStrokeClose();
            }
          }
          isCurve = false;
          isBezier = false;
          isQuadratic = false;
          isContour = false;
          if (closeShape) {
            vertices.pop();
          }
          return this;
        };
        p5.Renderer2D.prototype.noSmooth = function() {
          if ('imageSmoothingEnabled' in this.drawingContext) {
            this.drawingContext.imageSmoothingEnabled = false;
          } else if ('mozImageSmoothingEnabled' in this.drawingContext) {
            this.drawingContext.mozImageSmoothingEnabled = false;
          } else if ('webkitImageSmoothingEnabled' in this.drawingContext) {
            this.drawingContext.webkitImageSmoothingEnabled = false;
          } else if ('msImageSmoothingEnabled' in this.drawingContext) {
            this.drawingContext.msImageSmoothingEnabled = false;
          }
          return this;
        };
        p5.Renderer2D.prototype.smooth = function() {
          if ('imageSmoothingEnabled' in this.drawingContext) {
            this.drawingContext.imageSmoothingEnabled = true;
          } else if ('mozImageSmoothingEnabled' in this.drawingContext) {
            this.drawingContext.mozImageSmoothingEnabled = true;
          } else if ('webkitImageSmoothingEnabled' in this.drawingContext) {
            this.drawingContext.webkitImageSmoothingEnabled = true;
          } else if ('msImageSmoothingEnabled' in this.drawingContext) {
            this.drawingContext.msImageSmoothingEnabled = true;
          }
          return this;
        };
        p5.Renderer2D.prototype.strokeCap = function(cap) {
          if (cap === constants.ROUND || cap === constants.SQUARE || cap === constants.PROJECT) {
            this.drawingContext.lineCap = cap;
          }
          return this;
        };
        p5.Renderer2D.prototype.strokeJoin = function(join) {
          if (join === constants.ROUND || join === constants.BEVEL || join === constants.MITER) {
            this.drawingContext.lineJoin = join;
          }
          return this;
        };
        p5.Renderer2D.prototype.strokeWeight = function(w) {
          if (typeof w === 'undefined' || w === 0) {
            this.drawingContext.lineWidth = 0.0001;
          } else {
            this.drawingContext.lineWidth = w;
          }
          return this;
        };
        p5.Renderer2D.prototype._getFill = function() {
          return this.drawingContext.fillStyle;
        };
        p5.Renderer2D.prototype._getStroke = function() {
          return this.drawingContext.strokeStyle;
        };
        p5.Renderer2D.prototype.bezier = function(x1, y1, x2, y2, x3, y3, x4, y4) {
          this._pInst.beginShape();
          this._pInst.vertex(x1, y1);
          this._pInst.bezierVertex(x2, y2, x3, y3, x4, y4);
          this._pInst.endShape();
          return this;
        };
        p5.Renderer2D.prototype.curve = function(x1, y1, x2, y2, x3, y3, x4, y4) {
          this._pInst.beginShape();
          this._pInst.curveVertex(x1, y1);
          this._pInst.curveVertex(x2, y2);
          this._pInst.curveVertex(x3, y3);
          this._pInst.curveVertex(x4, y4);
          this._pInst.endShape();
          return this;
        };
        p5.Renderer2D.prototype._doFillStrokeClose = function() {
          if (this._doFill) {
            this.drawingContext.fill();
          }
          if (this._doStroke) {
            this.drawingContext.stroke();
          }
          this.drawingContext.closePath();
        };
        p5.Renderer2D.prototype.applyMatrix = function(n00, n01, n02, n10, n11, n12) {
          this.drawingContext.transform(n00, n01, n02, n10, n11, n12);
        };
        p5.Renderer2D.prototype.resetMatrix = function() {
          this.drawingContext.setTransform(1, 0, 0, 1, 0, 0);
          this.drawingContext.scale(this._pInst._pixelDensity, this._pInst._pixelDensity);
          return this;
        };
        p5.Renderer2D.prototype.rotate = function(r) {
          this.drawingContext.rotate(r);
        };
        p5.Renderer2D.prototype.scale = function(x, y) {
          this.drawingContext.scale(x, y);
          return this;
        };
        p5.Renderer2D.prototype.shearX = function(angle) {
          if (this._pInst._angleMode === constants.DEGREES) {
            angle = this._pInst.degrees(angle);
          }
          this.drawingContext.transform(1, 0, this._pInst.tan(angle), 1, 0, 0);
          return this;
        };
        p5.Renderer2D.prototype.shearY = function(angle) {
          if (this._pInst._angleMode === constants.DEGREES) {
            angle = this._pInst.degrees(angle);
          }
          this.drawingContext.transform(1, this._pInst.tan(angle), 0, 1, 0, 0);
          return this;
        };
        p5.Renderer2D.prototype.translate = function(x, y) {
          this.drawingContext.translate(x, y);
          return this;
        };
        p5.Renderer2D.prototype.text = function(str, x, y, maxWidth, maxHeight) {
          var p = this._pInst,
              cars,
              n,
              ii,
              jj,
              line,
              testLine,
              testWidth,
              words,
              totalHeight,
              baselineHacked,
              finalMaxHeight = Number.MAX_VALUE;
          if (!(this._doFill || this._doStroke)) {
            return;
          }
          if (typeof str !== 'string') {
            str = str.toString();
          }
          str = str.replace(/(\t)/g, '  ');
          cars = str.split('\n');
          if (typeof maxWidth !== 'undefined') {
            totalHeight = 0;
            for (ii = 0; ii < cars.length; ii++) {
              line = '';
              words = cars[ii].split(' ');
              for (n = 0; n < words.length; n++) {
                testLine = line + words[n] + ' ';
                testWidth = this.textWidth(testLine);
                if (testWidth > maxWidth) {
                  line = words[n] + ' ';
                  totalHeight += p.textLeading();
                } else {
                  line = testLine;
                }
              }
            }
            if (this._rectMode === constants.CENTER) {
              x -= maxWidth / 2;
              y -= maxHeight / 2;
            }
            switch (this.drawingContext.textAlign) {
              case constants.CENTER:
                x += maxWidth / 2;
                break;
              case constants.RIGHT:
                x += maxWidth;
                break;
            }
            if (typeof maxHeight !== 'undefined') {
              switch (this.drawingContext.textBaseline) {
                case constants.BOTTOM:
                  y += (maxHeight - totalHeight);
                  break;
                case constants._CTX_MIDDLE:
                  y += (maxHeight - totalHeight) / 2;
                  break;
                case constants.BASELINE:
                  baselineHacked = true;
                  this.drawingContext.textBaseline = constants.TOP;
                  break;
              }
              finalMaxHeight = (y + maxHeight) - p.textAscent();
            }
            for (ii = 0; ii < cars.length; ii++) {
              line = '';
              words = cars[ii].split(' ');
              for (n = 0; n < words.length; n++) {
                testLine = line + words[n] + ' ';
                testWidth = this.textWidth(testLine);
                if (testWidth > maxWidth && line.length > 0) {
                  this._renderText(p, line, x, y, finalMaxHeight);
                  line = words[n] + ' ';
                  y += p.textLeading();
                } else {
                  line = testLine;
                }
              }
              this._renderText(p, line, x, y, finalMaxHeight);
              y += p.textLeading();
            }
          } else {
            var offset = 0,
                vAlign = p.textAlign().vertical;
            if (vAlign === constants.CENTER) {
              offset = ((cars.length - 1) * p.textLeading()) / 2;
            } else if (vAlign === constants.BOTTOM) {
              offset = (cars.length - 1) * p.textLeading();
            }
            for (jj = 0; jj < cars.length; jj++) {
              this._renderText(p, cars[jj], x, y - offset, finalMaxHeight);
              y += p.textLeading();
            }
          }
          if (baselineHacked) {
            this.drawingContext.textBaseline = constants.BASELINE;
          }
          return p;
        };
        p5.Renderer2D.prototype._renderText = function(p, line, x, y, maxY) {
          if (y >= maxY) {
            return;
          }
          p.push();
          if (!this._isOpenType()) {
            if (this._doStroke && this._strokeSet) {
              this.drawingContext.strokeText(line, x, y);
            }
            if (this._doFill) {
              this.drawingContext.fillStyle = this._fillSet ? this.drawingContext.fillStyle : constants._DEFAULT_TEXT_FILL;
              this.drawingContext.fillText(line, x, y);
            }
          } else {
            this._textFont._renderPath(line, x, y, {renderer: this});
          }
          p.pop();
          return p;
        };
        p5.Renderer2D.prototype.textWidth = function(s) {
          if (this._isOpenType()) {
            return this._textFont._textWidth(s, this._textSize);
          }
          return this.drawingContext.measureText(s).width;
        };
        p5.Renderer2D.prototype.textAlign = function(h, v) {
          if (arguments.length) {
            if (h === constants.LEFT || h === constants.RIGHT || h === constants.CENTER) {
              this.drawingContext.textAlign = h;
            }
            if (v === constants.TOP || v === constants.BOTTOM || v === constants.CENTER || v === constants.BASELINE) {
              if (v === constants.CENTER) {
                this.drawingContext.textBaseline = constants._CTX_MIDDLE;
              } else {
                this.drawingContext.textBaseline = v;
              }
            }
            return this._pInst;
          } else {
            var valign = this.drawingContext.textBaseline;
            if (valign === constants._CTX_MIDDLE) {
              valign = constants.CENTER;
            }
            return {
              horizontal: this.drawingContext.textAlign,
              vertical: valign
            };
          }
        };
        p5.Renderer2D.prototype._applyTextProperties = function() {
          var font,
              p = this._pInst;
          this._setProperty('_textAscent', null);
          this._setProperty('_textDescent', null);
          font = this._textFont;
          if (this._isOpenType()) {
            font = this._textFont.font.familyName;
            this._setProperty('_textStyle', this._textFont.font.styleName);
          }
          this.drawingContext.font = this._textStyle + ' ' + this._textSize + 'px ' + font;
          return p;
        };
        p5.Renderer2D.prototype.push = function() {
          this.drawingContext.save();
        };
        p5.Renderer2D.prototype.pop = function() {
          this.drawingContext.restore();
        };
        module.exports = p5.Renderer2D;
      }, {
        "../image/filters": 59,
        "./canvas": 40,
        "./constants": 41,
        "./core": 42,
        "./p5.Renderer": 48
      }],
      50: [function(_dereq_, module, exports) {
        var p5 = _dereq_('./core');
        var constants = _dereq_('./constants');
        _dereq_('./p5.Graphics');
        _dereq_('./p5.Renderer2D');
        _dereq_('../webgl/p5.RendererGL');
        var defaultId = 'defaultCanvas0';
        p5.prototype.createCanvas = function(w, h, renderer) {
          var r = renderer || constants.P2D;
          var isDefault,
              c;
          if (arguments[3]) {
            isDefault = (typeof arguments[3] === 'boolean') ? arguments[3] : false;
          }
          if (r === constants.WEBGL) {
            c = document.getElementById(defaultId);
            if (c) {
              c.parentNode.removeChild(c);
            }
            c = document.createElement('canvas');
            c.id = defaultId;
          } else {
            if (isDefault) {
              c = document.createElement('canvas');
              var i = 0;
              while (document.getElementById('defaultCanvas' + i)) {
                i++;
              }
              defaultId = 'defaultCanvas' + i;
              c.id = defaultId;
            } else {
              c = this.canvas;
            }
          }
          if (!this._setupDone) {
            c.dataset.hidden = true;
            c.style.visibility = 'hidden';
          }
          if (this._userNode) {
            this._userNode.appendChild(c);
          } else {
            document.body.appendChild(c);
          }
          if (r === constants.WEBGL) {
            this._setProperty('_renderer', new p5.RendererGL(c, this, true));
            this._isdefaultGraphics = true;
          } else {
            if (!this._isdefaultGraphics) {
              this._setProperty('_renderer', new p5.Renderer2D(c, this, true));
              this._isdefaultGraphics = true;
            }
          }
          this._renderer.resize(w, h);
          this._renderer._applyDefaults();
          if (isDefault) {
            this._elements.push(this._renderer);
          }
          return this._renderer;
        };
        p5.prototype.resizeCanvas = function(w, h, noRedraw) {
          if (this._renderer) {
            var props = {};
            for (var key in this.drawingContext) {
              var val = this.drawingContext[key];
              if (typeof val !== 'object' && typeof val !== 'function') {
                props[key] = val;
              }
            }
            this._renderer.resize(w, h);
            for (var savedKey in props) {
              this.drawingContext[savedKey] = props[savedKey];
            }
            if (!noRedraw) {
              this.redraw();
            }
          }
        };
        p5.prototype.noCanvas = function() {
          if (this.canvas) {
            this.canvas.parentNode.removeChild(this.canvas);
          }
        };
        p5.prototype.createGraphics = function(w, h, renderer) {
          return new p5.Graphics(w, h, renderer, this);
        };
        p5.prototype.blendMode = function(mode) {
          if (mode === constants.BLEND || mode === constants.DARKEST || mode === constants.LIGHTEST || mode === constants.DIFFERENCE || mode === constants.MULTIPLY || mode === constants.EXCLUSION || mode === constants.SCREEN || mode === constants.REPLACE || mode === constants.OVERLAY || mode === constants.HARD_LIGHT || mode === constants.SOFT_LIGHT || mode === constants.DODGE || mode === constants.BURN || mode === constants.ADD || mode === constants.NORMAL) {
            this._renderer.blendMode(mode);
          } else {
            throw new Error('Mode ' + mode + ' not recognized.');
          }
        };
        module.exports = p5;
      }, {
        "../webgl/p5.RendererGL": 91,
        "./constants": 41,
        "./core": 42,
        "./p5.Graphics": 47,
        "./p5.Renderer2D": 49
      }],
      51: [function(_dereq_, module, exports) {
        window.requestAnimationFrame = (function() {
          return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback, element) {
            window.setTimeout(callback, 1000 / 60);
          };
        })();
        window.performance = window.performance || {};
        window.performance.now = (function() {
          var load_date = Date.now();
          return window.performance.now || window.performance.mozNow || window.performance.msNow || window.performance.oNow || window.performance.webkitNow || function() {
            return Date.now() - load_date;
          };
        })();
        (function() {
          'use strict';
          if (typeof Uint8ClampedArray !== 'undefined' && !Uint8ClampedArray.prototype.slice) {
            Object.defineProperty(Uint8ClampedArray.prototype, 'slice', {
              value: Array.prototype.slice,
              writable: true,
              configurable: true,
              enumerable: false
            });
          }
        }());
      }, {}],
      52: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('./core');
        p5.prototype.exit = function() {
          throw 'exit() not implemented, see remove()';
        };
        p5.prototype.noLoop = function() {
          this._loop = false;
        };
        p5.prototype.loop = function() {
          this._loop = true;
          this._draw();
        };
        p5.prototype.push = function() {
          this._renderer.push();
          this._styles.push({
            _doStroke: this._renderer._doStroke,
            _strokeSet: this._renderer._strokeSet,
            _doFill: this._renderer._doFill,
            _fillSet: this._renderer._fillSet,
            _tint: this._renderer._tint,
            _imageMode: this._renderer._imageMode,
            _rectMode: this._renderer._rectMode,
            _ellipseMode: this._renderer._ellipseMode,
            _colorMode: this._renderer._colorMode,
            _textFont: this._renderer._textFont,
            _textLeading: this._renderer._textLeading,
            _textSize: this._renderer._textSize,
            _textStyle: this._renderer._textStyle
          });
        };
        p5.prototype.pop = function() {
          this._renderer.pop();
          var lastS = this._styles.pop();
          for (var prop in lastS) {
            this._renderer[prop] = lastS[prop];
          }
        };
        p5.prototype.pushStyle = function() {
          throw new Error('pushStyle() not used, see push()');
        };
        p5.prototype.popStyle = function() {
          throw new Error('popStyle() not used, see pop()');
        };
        p5.prototype.redraw = function() {
          this.resetMatrix();
          if (this._renderer.isP3D) {
            this._renderer._update();
          }
          var numberOfRedraws = 1;
          if (arguments.length === 1) {
            try {
              if (parseInt(arguments[0]) > 1) {
                numberOfRedraws = parseInt(arguments[0]);
              }
            } catch (error) {}
          }
          var userSetup = this.setup || window.setup;
          var userDraw = this.draw || window.draw;
          if (typeof userDraw === 'function') {
            if (typeof userSetup === 'undefined') {
              this.scale(this._pixelDensity, this._pixelDensity);
            }
            var self = this;
            var callMethod = function(f) {
              f.call(self);
            };
            for (var idxRedraw = 0; idxRedraw < numberOfRedraws; idxRedraw++) {
              this._registeredMethods.pre.forEach(callMethod);
              userDraw();
              this._registeredMethods.post.forEach(callMethod);
            }
          }
        };
        p5.prototype.size = function() {
          var s = 'size() is not a valid p5 function, to set the size of the ';
          s += 'drawing canvas, please use createCanvas() instead';
          throw s;
        };
        module.exports = p5;
      }, {"./core": 42}],
      53: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('./core');
        var constants = _dereq_('./constants');
        p5.prototype.applyMatrix = function(n00, n01, n02, n10, n11, n12) {
          this._renderer.applyMatrix(n00, n01, n02, n10, n11, n12);
          return this;
        };
        p5.prototype.popMatrix = function() {
          throw new Error('popMatrix() not used, see pop()');
        };
        p5.prototype.printMatrix = function() {
          throw new Error('printMatrix() not implemented');
        };
        p5.prototype.pushMatrix = function() {
          throw new Error('pushMatrix() not used, see push()');
        };
        p5.prototype.resetMatrix = function() {
          this._renderer.resetMatrix();
          return this;
        };
        p5.prototype.rotate = function() {
          var args = new Array(arguments.length);
          var r;
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          if (this._angleMode === constants.DEGREES) {
            r = this.radians(args[0]);
          } else if (this._angleMode === constants.RADIANS) {
            r = args[0];
          }
          if (args.length > 1) {
            this._renderer.rotate(r, args[1]);
          } else {
            this._renderer.rotate(r);
          }
          return this;
        };
        p5.prototype.rotateX = function(rad) {
          if (this._renderer.isP3D) {
            this._renderer.rotateX(rad);
          } else {
            throw 'not supported in p2d. Please use webgl mode';
          }
          return this;
        };
        p5.prototype.rotateY = function(rad) {
          if (this._renderer.isP3D) {
            this._renderer.rotateY(rad);
          } else {
            throw 'not supported in p2d. Please use webgl mode';
          }
          return this;
        };
        p5.prototype.rotateZ = function(rad) {
          if (this._renderer.isP3D) {
            this._renderer.rotateZ(rad);
          } else {
            throw 'not supported in p2d. Please use webgl mode';
          }
          return this;
        };
        p5.prototype.scale = function() {
          var x,
              y,
              z;
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; i++) {
            args[i] = arguments[i];
          }
          if (args[0] instanceof p5.Vector) {
            x = args[0].x;
            y = args[0].y;
            z = args[0].z;
          } else if (args[0] instanceof Array) {
            x = args[0][0];
            y = args[0][1];
            z = args[0][2] || 1;
          } else {
            if (args.length === 1) {
              x = y = z = args[0];
            } else {
              x = args[0];
              y = args[1];
              z = args[2] || 1;
            }
          }
          if (this._renderer.isP3D) {
            this._renderer.scale.call(this._renderer, x, y, z);
          } else {
            this._renderer.scale.call(this._renderer, x, y);
          }
          return this;
        };
        p5.prototype.shearX = function(angle) {
          if (this._angleMode === constants.DEGREES) {
            angle = this.radians(angle);
          }
          this._renderer.shearX(angle);
          return this;
        };
        p5.prototype.shearY = function(angle) {
          if (this._angleMode === constants.DEGREES) {
            angle = this.radians(angle);
          }
          this._renderer.shearY(angle);
          return this;
        };
        p5.prototype.translate = function(x, y, z) {
          if (this._renderer.isP3D) {
            this._renderer.translate(x, y, z);
          } else {
            this._renderer.translate(x, y);
          }
          return this;
        };
        module.exports = p5;
      }, {
        "./constants": 41,
        "./core": 42
      }],
      54: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('./core');
        var constants = _dereq_('./constants');
        var shapeKind = null;
        var vertices = [];
        var contourVertices = [];
        var isBezier = false;
        var isCurve = false;
        var isQuadratic = false;
        var isContour = false;
        var isFirstContour = true;
        p5.prototype.beginContour = function() {
          contourVertices = [];
          isContour = true;
          return this;
        };
        p5.prototype.beginShape = function(kind) {
          if (kind === constants.POINTS || kind === constants.LINES || kind === constants.TRIANGLES || kind === constants.TRIANGLE_FAN || kind === constants.TRIANGLE_STRIP || kind === constants.QUADS || kind === constants.QUAD_STRIP) {
            shapeKind = kind;
          } else {
            shapeKind = null;
          }
          if (this._renderer.isP3D) {
            this._renderer.beginShape(kind);
          } else {
            vertices = [];
            contourVertices = [];
          }
          return this;
        };
        p5.prototype.bezierVertex = function(x2, y2, x3, y3, x4, y4) {
          if (vertices.length === 0) {
            throw 'vertex() must be used once before calling bezierVertex()';
          } else {
            isBezier = true;
            var vert = [];
            for (var i = 0; i < arguments.length; i++) {
              vert[i] = arguments[i];
            }
            vert.isVert = false;
            if (isContour) {
              contourVertices.push(vert);
            } else {
              vertices.push(vert);
            }
          }
          return this;
        };
        p5.prototype.curveVertex = function(x, y) {
          isCurve = true;
          this.vertex(x, y);
          return this;
        };
        p5.prototype.endContour = function() {
          var vert = contourVertices[0].slice();
          vert.isVert = contourVertices[0].isVert;
          vert.moveTo = false;
          contourVertices.push(vert);
          if (isFirstContour) {
            vertices.push(vertices[0]);
            isFirstContour = false;
          }
          for (var i = 0; i < contourVertices.length; i++) {
            vertices.push(contourVertices[i]);
          }
          return this;
        };
        p5.prototype.endShape = function(mode) {
          if (this._renderer.isP3D) {
            this._renderer.endShape(mode, isCurve, isBezier, isQuadratic, isContour, shapeKind);
          } else {
            if (vertices.length === 0) {
              return this;
            }
            if (!this._renderer._doStroke && !this._renderer._doFill) {
              return this;
            }
            var closeShape = mode === constants.CLOSE;
            if (closeShape && !isContour) {
              vertices.push(vertices[0]);
            }
            this._renderer.endShape(mode, vertices, isCurve, isBezier, isQuadratic, isContour, shapeKind);
            isCurve = false;
            isBezier = false;
            isQuadratic = false;
            isContour = false;
            isFirstContour = true;
            if (closeShape) {
              vertices.pop();
            }
          }
          return this;
        };
        p5.prototype.quadraticVertex = function(cx, cy, x3, y3) {
          if (this._contourInited) {
            var pt = {};
            pt.x = cx;
            pt.y = cy;
            pt.x3 = x3;
            pt.y3 = y3;
            pt.type = constants.QUADRATIC;
            this._contourVertices.push(pt);
            return this;
          }
          if (vertices.length > 0) {
            isQuadratic = true;
            var vert = [];
            for (var i = 0; i < arguments.length; i++) {
              vert[i] = arguments[i];
            }
            vert.isVert = false;
            if (isContour) {
              contourVertices.push(vert);
            } else {
              vertices.push(vert);
            }
          } else {
            throw 'vertex() must be used once before calling quadraticVertex()';
          }
          return this;
        };
        p5.prototype.vertex = function(x, y, moveTo) {
          if (this._renderer.isP3D) {
            this._renderer.vertex(x, y, moveTo);
          } else {
            var vert = [];
            vert.isVert = true;
            vert[0] = x;
            vert[1] = y;
            vert[2] = 0;
            vert[3] = 0;
            vert[4] = 0;
            vert[5] = this._renderer._getFill();
            vert[6] = this._renderer._getStroke();
            if (moveTo) {
              vert.moveTo = moveTo;
            }
            if (isContour) {
              if (contourVertices.length === 0) {
                vert.moveTo = true;
              }
              contourVertices.push(vert);
            } else {
              vertices.push(vert);
            }
          }
          return this;
        };
        module.exports = p5;
      }, {
        "./constants": 41,
        "./core": 42
      }],
      55: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.prototype.deviceOrientation = undefined;
        p5.prototype.accelerationX = 0;
        p5.prototype.accelerationY = 0;
        p5.prototype.accelerationZ = 0;
        p5.prototype.pAccelerationX = 0;
        p5.prototype.pAccelerationY = 0;
        p5.prototype.pAccelerationZ = 0;
        p5.prototype._updatePAccelerations = function() {
          this._setProperty('pAccelerationX', this.accelerationX);
          this._setProperty('pAccelerationY', this.accelerationY);
          this._setProperty('pAccelerationZ', this.accelerationZ);
        };
        p5.prototype.rotationX = 0;
        p5.prototype.rotationY = 0;
        p5.prototype.rotationZ = 0;
        p5.prototype.pRotationX = 0;
        p5.prototype.pRotationY = 0;
        p5.prototype.pRotationZ = 0;
        var startAngleX = 0;
        var startAngleY = 0;
        var startAngleZ = 0;
        var rotateDirectionX = 'clockwise';
        var rotateDirectionY = 'clockwise';
        var rotateDirectionZ = 'clockwise';
        var pRotateDirectionX;
        var pRotateDirectionY;
        var pRotateDirectionZ;
        p5.prototype._updatePRotations = function() {
          this._setProperty('pRotationX', this.rotationX);
          this._setProperty('pRotationY', this.rotationY);
          this._setProperty('pRotationZ', this.rotationZ);
        };
        p5.prototype.turnAxis = undefined;
        var move_threshold = 0.5;
        var shake_threshold = 30;
        p5.prototype.setMoveThreshold = function(val) {
          if (typeof val === 'number') {
            move_threshold = val;
          }
        };
        p5.prototype.setShakeThreshold = function(val) {
          if (typeof val === 'number') {
            shake_threshold = val;
          }
        };
        p5.prototype._ondeviceorientation = function(e) {
          this._updatePRotations();
          this._setProperty('rotationX', e.beta);
          this._setProperty('rotationY', e.gamma);
          this._setProperty('rotationZ', e.alpha);
          this._handleMotion();
        };
        p5.prototype._ondevicemotion = function(e) {
          this._updatePAccelerations();
          this._setProperty('accelerationX', e.acceleration.x * 2);
          this._setProperty('accelerationY', e.acceleration.y * 2);
          this._setProperty('accelerationZ', e.acceleration.z * 2);
          this._handleMotion();
        };
        p5.prototype._handleMotion = function() {
          if (window.orientation === 90 || window.orientation === -90) {
            this._setProperty('deviceOrientation', 'landscape');
          } else if (window.orientation === 0) {
            this._setProperty('deviceOrientation', 'portrait');
          } else if (window.orientation === undefined) {
            this._setProperty('deviceOrientation', 'undefined');
          }
          var deviceMoved = this.deviceMoved || window.deviceMoved;
          if (typeof deviceMoved === 'function') {
            if (Math.abs(this.accelerationX - this.pAccelerationX) > move_threshold || Math.abs(this.accelerationY - this.pAccelerationY) > move_threshold || Math.abs(this.accelerationZ - this.pAccelerationZ) > move_threshold) {
              deviceMoved();
            }
          }
          var deviceTurned = this.deviceTurned || window.deviceTurned;
          if (typeof deviceTurned === 'function') {
            var wRX = this.rotationX + 180;
            var wPRX = this.pRotationX + 180;
            var wSAX = startAngleX + 180;
            if ((wRX - wPRX > 0 && wRX - wPRX < 270) || wRX - wPRX < -270) {
              rotateDirectionX = 'clockwise';
            } else if (wRX - wPRX < 0 || wRX - wPRX > 270) {
              rotateDirectionX = 'counter-clockwise';
            }
            if (rotateDirectionX !== pRotateDirectionX) {
              wSAX = wRX;
            }
            if (Math.abs(wRX - wSAX) > 90 && Math.abs(wRX - wSAX) < 270) {
              wSAX = wRX;
              this._setProperty('turnAxis', 'X');
              deviceTurned();
            }
            pRotateDirectionX = rotateDirectionX;
            startAngleX = wSAX - 180;
            var wRY = this.rotationY + 180;
            var wPRY = this.pRotationY + 180;
            var wSAY = startAngleY + 180;
            if ((wRY - wPRY > 0 && wRY - wPRY < 270) || wRY - wPRY < -270) {
              rotateDirectionY = 'clockwise';
            } else if (wRY - wPRY < 0 || wRY - this.pRotationY > 270) {
              rotateDirectionY = 'counter-clockwise';
            }
            if (rotateDirectionY !== pRotateDirectionY) {
              wSAY = wRY;
            }
            if (Math.abs(wRY - wSAY) > 90 && Math.abs(wRY - wSAY) < 270) {
              wSAY = wRY;
              this._setProperty('turnAxis', 'Y');
              deviceTurned();
            }
            pRotateDirectionY = rotateDirectionY;
            startAngleY = wSAY - 180;
            if ((this.rotationZ - this.pRotationZ > 0 && this.rotationZ - this.pRotationZ < 270) || this.rotationZ - this.pRotationZ < -270) {
              rotateDirectionZ = 'clockwise';
            } else if (this.rotationZ - this.pRotationZ < 0 || this.rotationZ - this.pRotationZ > 270) {
              rotateDirectionZ = 'counter-clockwise';
            }
            if (rotateDirectionZ !== pRotateDirectionZ) {
              startAngleZ = this.rotationZ;
            }
            if (Math.abs(this.rotationZ - startAngleZ) > 90 && Math.abs(this.rotationZ - startAngleZ) < 270) {
              startAngleZ = this.rotationZ;
              this._setProperty('turnAxis', 'Z');
              deviceTurned();
            }
            pRotateDirectionZ = rotateDirectionZ;
            this._setProperty('turnAxis', undefined);
          }
          var deviceShaken = this.deviceShaken || window.deviceShaken;
          if (typeof deviceShaken === 'function') {
            var accelerationChangeX;
            var accelerationChangeY;
            if (this.pAccelerationX !== null) {
              accelerationChangeX = Math.abs(this.accelerationX - this.pAccelerationX);
              accelerationChangeY = Math.abs(this.accelerationY - this.pAccelerationY);
            }
            if (accelerationChangeX + accelerationChangeY > shake_threshold) {
              deviceShaken();
            }
          }
        };
        module.exports = p5;
      }, {"../core/core": 42}],
      56: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var downKeys = {};
        p5.prototype.isKeyPressed = false;
        p5.prototype.keyIsPressed = false;
        p5.prototype.key = '';
        p5.prototype.keyCode = 0;
        p5.prototype._onkeydown = function(e) {
          if (downKeys[e.which]) {
            return;
          }
          this._setProperty('isKeyPressed', true);
          this._setProperty('keyIsPressed', true);
          this._setProperty('keyCode', e.which);
          downKeys[e.which] = true;
          var key = String.fromCharCode(e.which);
          if (!key) {
            key = e.which;
          }
          this._setProperty('key', key);
          var keyPressed = this.keyPressed || window.keyPressed;
          if (typeof keyPressed === 'function' && !e.charCode) {
            var executeDefault = keyPressed(e);
            if (executeDefault === false) {
              e.preventDefault();
            }
          }
        };
        p5.prototype._onkeyup = function(e) {
          var keyReleased = this.keyReleased || window.keyReleased;
          downKeys[e.which] = false;
          if (!areDownKeys()) {
            this._setProperty('isKeyPressed', false);
            this._setProperty('keyIsPressed', false);
          }
          this._setProperty('_lastKeyCodeTyped', null);
          var key = String.fromCharCode(e.which);
          if (!key) {
            key = e.which;
          }
          this._setProperty('key', key);
          this._setProperty('keyCode', e.which);
          if (typeof keyReleased === 'function') {
            var executeDefault = keyReleased(e);
            if (executeDefault === false) {
              e.preventDefault();
            }
          }
        };
        p5.prototype._onkeypress = function(e) {
          if (e.which === this._lastKeyCodeTyped) {
            return;
          }
          this._setProperty('keyCode', e.which);
          this._setProperty('_lastKeyCodeTyped', e.which);
          this._setProperty('key', String.fromCharCode(e.which));
          var keyTyped = this.keyTyped || window.keyTyped;
          if (typeof keyTyped === 'function') {
            var executeDefault = keyTyped(e);
            if (executeDefault === false) {
              e.preventDefault();
            }
          }
        };
        p5.prototype._onblur = function(e) {
          downKeys = {};
        };
        p5.prototype.keyIsDown = function(code) {
          return downKeys[code];
        };
        function areDownKeys() {
          for (var key in downKeys) {
            if (downKeys.hasOwnProperty(key) && downKeys[key] === true) {
              return true;
            }
          }
          return false;
        }
        module.exports = p5;
      }, {"../core/core": 42}],
      57: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var constants = _dereq_('../core/constants');
        p5.prototype._hasMouseInteracted = false;
        p5.prototype.mouseX = 0;
        p5.prototype.mouseY = 0;
        p5.prototype.pmouseX = 0;
        p5.prototype.pmouseY = 0;
        p5.prototype.winMouseX = 0;
        p5.prototype.winMouseY = 0;
        p5.prototype.pwinMouseX = 0;
        p5.prototype.pwinMouseY = 0;
        p5.prototype.mouseButton = 0;
        p5.prototype.mouseIsPressed = false;
        p5.prototype.isMousePressed = false;
        p5.prototype._updateNextMouseCoords = function(e) {
          if (this._curElement !== null && (!e.touches || e.touches.length > 0)) {
            var mousePos = getMousePos(this._curElement.elt, this.width, this.height, e);
            this._setProperty('mouseX', mousePos.x);
            this._setProperty('mouseY', mousePos.y);
            this._setProperty('winMouseX', mousePos.winX);
            this._setProperty('winMouseY', mousePos.winY);
          }
          if (!this._hasMouseInteracted) {
            this._updateMouseCoords();
            this._setProperty('_hasMouseInteracted', true);
          }
        };
        p5.prototype._updateMouseCoords = function() {
          this._setProperty('pmouseX', this.mouseX);
          this._setProperty('pmouseY', this.mouseY);
          this._setProperty('pwinMouseX', this.winMouseX);
          this._setProperty('pwinMouseY', this.winMouseY);
        };
        function getMousePos(canvas, w, h, evt) {
          if (evt && !evt.clientX) {
            if (evt.touches) {
              evt = evt.touches[0];
            } else if (evt.changedTouches) {
              evt = evt.changedTouches[0];
            }
          }
          var rect = canvas.getBoundingClientRect();
          var sx = canvas.scrollWidth / w;
          var sy = canvas.scrollHeight / h;
          return {
            x: (evt.clientX - rect.left) / sx,
            y: (evt.clientY - rect.top) / sy,
            winX: evt.clientX,
            winY: evt.clientY,
            id: evt.identifier
          };
        }
        p5.prototype._setMouseButton = function(e) {
          if (e.button === 1) {
            this._setProperty('mouseButton', constants.CENTER);
          } else if (e.button === 2) {
            this._setProperty('mouseButton', constants.RIGHT);
          } else {
            this._setProperty('mouseButton', constants.LEFT);
          }
        };
        p5.prototype._onmousemove = function(e) {
          var context = this._isGlobal ? window : this;
          var executeDefault;
          this._updateNextMouseCoords(e);
          if (!this.isMousePressed) {
            if (typeof context.mouseMoved === 'function') {
              executeDefault = context.mouseMoved(e);
              if (executeDefault === false) {
                e.preventDefault();
              }
            }
          } else {
            if (typeof context.mouseDragged === 'function') {
              executeDefault = context.mouseDragged(e);
              if (executeDefault === false) {
                e.preventDefault();
              }
            } else if (!window.PointerEvent && typeof context.touchMoved === 'function') {
              executeDefault = context.touchMoved(e);
              if (executeDefault === false) {
                e.preventDefault();
              }
            }
          }
        };
        p5.prototype._onmousedown = function(e) {
          var context = this._isGlobal ? window : this;
          var executeDefault;
          this._setProperty('mouseIsPressed', true);
          this._setMouseButton(e);
          this._updateNextMouseCoords(e);
          if (typeof context.mousePressed === 'function') {
            executeDefault = context.mousePressed(e);
            if (executeDefault === false) {
              e.preventDefault();
            }
          } else if (!window.PointerEvent && typeof context.touchStarted === 'function') {
            executeDefault = context.touchStarted(e);
            if (executeDefault === false) {
              e.preventDefault();
            }
          }
        };
        p5.prototype._onmouseup = function(e) {
          var context = this._isGlobal ? window : this;
          var executeDefault;
          this._setProperty('mouseIsPressed', false);
          if (typeof context.mouseReleased === 'function') {
            executeDefault = context.mouseReleased(e);
            if (executeDefault === false) {
              e.preventDefault();
            }
          } else if (!window.PointerEvent && typeof context.touchEnded === 'function') {
            executeDefault = context.touchEnded(e);
            if (executeDefault === false) {
              e.preventDefault();
            }
          }
        };
        p5.prototype._ondragend = p5.prototype._onmouseup;
        p5.prototype._ondragover = p5.prototype._onmousemove;
        p5.prototype._onclick = function(e) {
          var context = this._isGlobal ? window : this;
          if (typeof context.mouseClicked === 'function') {
            var executeDefault = context.mouseClicked(e);
            if (executeDefault === false) {
              e.preventDefault();
            }
          }
        };
        p5.prototype._onwheel = function(e) {
          var context = this._isGlobal ? window : this;
          if (typeof context.mouseWheel === 'function') {
            e.delta = e.deltaY;
            var executeDefault = context.mouseWheel(e);
            if (executeDefault === false) {
              e.preventDefault();
            }
          }
        };
        module.exports = p5;
      }, {
        "../core/constants": 41,
        "../core/core": 42
      }],
      58: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.prototype.touches = [];
        p5.prototype._updateTouchCoords = function(e) {
          if (this._curElement !== null) {
            var touches = [];
            for (var i = 0; i < e.touches.length; i++) {
              touches[i] = getTouchInfo(this._curElement.elt, this.width, this.height, e, i);
            }
            this._setProperty('touches', touches);
          }
        };
        function getTouchInfo(canvas, w, h, e, i) {
          i = i || 0;
          var rect = canvas.getBoundingClientRect();
          var sx = canvas.scrollWidth / w;
          var sy = canvas.scrollHeight / h;
          var touch = e.touches[i] || e.changedTouches[i];
          return {
            x: (touch.clientX - rect.left) / sx,
            y: (touch.clientY - rect.top) / sy,
            winX: touch.clientX,
            winY: touch.clientY,
            id: touch.identifier
          };
        }
        p5.prototype._ontouchstart = function(e) {
          var context = this._isGlobal ? window : this;
          var executeDefault;
          this._setProperty('mouseIsPressed', true);
          this._updateTouchCoords(e);
          this._updateNextMouseCoords(e);
          if (typeof context.touchStarted === 'function') {
            executeDefault = context.touchStarted(e);
            if (executeDefault === false) {
              e.preventDefault();
            }
          } else if (!window.PointerEvent && typeof context.mousePressed === 'function') {
            executeDefault = context.mousePressed(e);
            if (executeDefault === false) {
              e.preventDefault();
            }
          }
        };
        p5.prototype._ontouchmove = function(e) {
          var context = this._isGlobal ? window : this;
          var executeDefault;
          this._updateTouchCoords(e);
          this._updateNextMouseCoords(e);
          if (typeof context.touchMoved === 'function') {
            executeDefault = context.touchMoved(e);
            if (executeDefault === false) {
              e.preventDefault();
            }
          } else if (!window.PointerEvent && typeof context.mouseDragged === 'function') {
            executeDefault = context.mouseDragged(e);
            if (executeDefault === false) {
              e.preventDefault();
            }
          }
        };
        p5.prototype._ontouchend = function(e) {
          this._setProperty('mouseIsPressed', false);
          this._updateTouchCoords(e);
          this._updateNextMouseCoords(e);
          var context = this._isGlobal ? window : this;
          var executeDefault;
          if (typeof context.touchEnded === 'function') {
            executeDefault = context.touchEnded(e);
            if (executeDefault === false) {
              e.preventDefault();
            }
          } else if (!window.PointerEvent && typeof context.mouseReleased === 'function') {
            executeDefault = context.mouseReleased(e);
            if (executeDefault === false) {
              e.preventDefault();
            }
          }
        };
        module.exports = p5;
      }, {"../core/core": 42}],
      59: [function(_dereq_, module, exports) {
        'use strict';
        var Filters = {};
        Filters._toPixels = function(canvas) {
          if (canvas instanceof ImageData) {
            return canvas.data;
          } else {
            return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
          }
        };
        Filters._getARGB = function(data, i) {
          var offset = i * 4;
          return (data[offset + 3] << 24) & 0xff000000 | (data[offset] << 16) & 0x00ff0000 | (data[offset + 1] << 8) & 0x0000ff00 | data[offset + 2] & 0x000000ff;
        };
        Filters._setPixels = function(pixels, data) {
          var offset = 0;
          for (var i = 0,
              al = pixels.length; i < al; i++) {
            offset = i * 4;
            pixels[offset + 0] = (data[i] & 0x00ff0000) >>> 16;
            pixels[offset + 1] = (data[i] & 0x0000ff00) >>> 8;
            pixels[offset + 2] = (data[i] & 0x000000ff);
            pixels[offset + 3] = (data[i] & 0xff000000) >>> 24;
          }
        };
        Filters._toImageData = function(canvas) {
          if (canvas instanceof ImageData) {
            return canvas;
          } else {
            return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
          }
        };
        Filters._createImageData = function(width, height) {
          Filters._tmpCanvas = document.createElement('canvas');
          Filters._tmpCtx = Filters._tmpCanvas.getContext('2d');
          return this._tmpCtx.createImageData(width, height);
        };
        Filters.apply = function(canvas, func, filterParam) {
          var ctx = canvas.getContext('2d');
          var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          var newImageData = func(imageData, filterParam);
          if (newImageData instanceof ImageData) {
            ctx.putImageData(newImageData, 0, 0, 0, 0, canvas.width, canvas.height);
          } else {
            ctx.putImageData(imageData, 0, 0, 0, 0, canvas.width, canvas.height);
          }
        };
        Filters.threshold = function(canvas, level) {
          var pixels = Filters._toPixels(canvas);
          if (level === undefined) {
            level = 0.5;
          }
          var thresh = Math.floor(level * 255);
          for (var i = 0; i < pixels.length; i += 4) {
            var r = pixels[i];
            var g = pixels[i + 1];
            var b = pixels[i + 2];
            var gray = (0.2126 * r + 0.7152 * g + 0.0722 * b);
            var val;
            if (gray >= thresh) {
              val = 255;
            } else {
              val = 0;
            }
            pixels[i] = pixels[i + 1] = pixels[i + 2] = val;
          }
        };
        Filters.gray = function(canvas) {
          var pixels = Filters._toPixels(canvas);
          for (var i = 0; i < pixels.length; i += 4) {
            var r = pixels[i];
            var g = pixels[i + 1];
            var b = pixels[i + 2];
            var gray = (0.2126 * r + 0.7152 * g + 0.0722 * b);
            pixels[i] = pixels[i + 1] = pixels[i + 2] = gray;
          }
        };
        Filters.opaque = function(canvas) {
          var pixels = Filters._toPixels(canvas);
          for (var i = 0; i < pixels.length; i += 4) {
            pixels[i + 3] = 255;
          }
          return pixels;
        };
        Filters.invert = function(canvas) {
          var pixels = Filters._toPixels(canvas);
          for (var i = 0; i < pixels.length; i += 4) {
            pixels[i] = 255 - pixels[i];
            pixels[i + 1] = 255 - pixels[i + 1];
            pixels[i + 2] = 255 - pixels[i + 2];
          }
        };
        Filters.posterize = function(canvas, level) {
          var pixels = Filters._toPixels(canvas);
          if ((level < 2) || (level > 255)) {
            throw new Error('Level must be greater than 2 and less than 255 for posterize');
          }
          var levels1 = level - 1;
          for (var i = 0; i < pixels.length; i += 4) {
            var rlevel = pixels[i];
            var glevel = pixels[i + 1];
            var blevel = pixels[i + 2];
            pixels[i] = (((rlevel * level) >> 8) * 255) / levels1;
            pixels[i + 1] = (((glevel * level) >> 8) * 255) / levels1;
            pixels[i + 2] = (((blevel * level) >> 8) * 255) / levels1;
          }
        };
        Filters.dilate = function(canvas) {
          var pixels = Filters._toPixels(canvas);
          var currIdx = 0;
          var maxIdx = pixels.length ? pixels.length / 4 : 0;
          var out = new Int32Array(maxIdx);
          var currRowIdx,
              maxRowIdx,
              colOrig,
              colOut,
              currLum;
          var idxRight,
              idxLeft,
              idxUp,
              idxDown,
              colRight,
              colLeft,
              colUp,
              colDown,
              lumRight,
              lumLeft,
              lumUp,
              lumDown;
          while (currIdx < maxIdx) {
            currRowIdx = currIdx;
            maxRowIdx = currIdx + canvas.width;
            while (currIdx < maxRowIdx) {
              colOrig = colOut = Filters._getARGB(pixels, currIdx);
              idxLeft = currIdx - 1;
              idxRight = currIdx + 1;
              idxUp = currIdx - canvas.width;
              idxDown = currIdx + canvas.width;
              if (idxLeft < currRowIdx) {
                idxLeft = currIdx;
              }
              if (idxRight >= maxRowIdx) {
                idxRight = currIdx;
              }
              if (idxUp < 0) {
                idxUp = 0;
              }
              if (idxDown >= maxIdx) {
                idxDown = currIdx;
              }
              colUp = Filters._getARGB(pixels, idxUp);
              colLeft = Filters._getARGB(pixels, idxLeft);
              colDown = Filters._getARGB(pixels, idxDown);
              colRight = Filters._getARGB(pixels, idxRight);
              currLum = 77 * (colOrig >> 16 & 0xff) + 151 * (colOrig >> 8 & 0xff) + 28 * (colOrig & 0xff);
              lumLeft = 77 * (colLeft >> 16 & 0xff) + 151 * (colLeft >> 8 & 0xff) + 28 * (colLeft & 0xff);
              lumRight = 77 * (colRight >> 16 & 0xff) + 151 * (colRight >> 8 & 0xff) + 28 * (colRight & 0xff);
              lumUp = 77 * (colUp >> 16 & 0xff) + 151 * (colUp >> 8 & 0xff) + 28 * (colUp & 0xff);
              lumDown = 77 * (colDown >> 16 & 0xff) + 151 * (colDown >> 8 & 0xff) + 28 * (colDown & 0xff);
              if (lumLeft > currLum) {
                colOut = colLeft;
                currLum = lumLeft;
              }
              if (lumRight > currLum) {
                colOut = colRight;
                currLum = lumRight;
              }
              if (lumUp > currLum) {
                colOut = colUp;
                currLum = lumUp;
              }
              if (lumDown > currLum) {
                colOut = colDown;
                currLum = lumDown;
              }
              out[currIdx++] = colOut;
            }
          }
          Filters._setPixels(pixels, out);
        };
        Filters.erode = function(canvas) {
          var pixels = Filters._toPixels(canvas);
          var currIdx = 0;
          var maxIdx = pixels.length ? pixels.length / 4 : 0;
          var out = new Int32Array(maxIdx);
          var currRowIdx,
              maxRowIdx,
              colOrig,
              colOut,
              currLum;
          var idxRight,
              idxLeft,
              idxUp,
              idxDown,
              colRight,
              colLeft,
              colUp,
              colDown,
              lumRight,
              lumLeft,
              lumUp,
              lumDown;
          while (currIdx < maxIdx) {
            currRowIdx = currIdx;
            maxRowIdx = currIdx + canvas.width;
            while (currIdx < maxRowIdx) {
              colOrig = colOut = Filters._getARGB(pixels, currIdx);
              idxLeft = currIdx - 1;
              idxRight = currIdx + 1;
              idxUp = currIdx - canvas.width;
              idxDown = currIdx + canvas.width;
              if (idxLeft < currRowIdx) {
                idxLeft = currIdx;
              }
              if (idxRight >= maxRowIdx) {
                idxRight = currIdx;
              }
              if (idxUp < 0) {
                idxUp = 0;
              }
              if (idxDown >= maxIdx) {
                idxDown = currIdx;
              }
              colUp = Filters._getARGB(pixels, idxUp);
              colLeft = Filters._getARGB(pixels, idxLeft);
              colDown = Filters._getARGB(pixels, idxDown);
              colRight = Filters._getARGB(pixels, idxRight);
              currLum = 77 * (colOrig >> 16 & 0xff) + 151 * (colOrig >> 8 & 0xff) + 28 * (colOrig & 0xff);
              lumLeft = 77 * (colLeft >> 16 & 0xff) + 151 * (colLeft >> 8 & 0xff) + 28 * (colLeft & 0xff);
              lumRight = 77 * (colRight >> 16 & 0xff) + 151 * (colRight >> 8 & 0xff) + 28 * (colRight & 0xff);
              lumUp = 77 * (colUp >> 16 & 0xff) + 151 * (colUp >> 8 & 0xff) + 28 * (colUp & 0xff);
              lumDown = 77 * (colDown >> 16 & 0xff) + 151 * (colDown >> 8 & 0xff) + 28 * (colDown & 0xff);
              if (lumLeft < currLum) {
                colOut = colLeft;
                currLum = lumLeft;
              }
              if (lumRight < currLum) {
                colOut = colRight;
                currLum = lumRight;
              }
              if (lumUp < currLum) {
                colOut = colUp;
                currLum = lumUp;
              }
              if (lumDown < currLum) {
                colOut = colDown;
                currLum = lumDown;
              }
              out[currIdx++] = colOut;
            }
          }
          Filters._setPixels(pixels, out);
        };
        var blurRadius;
        var blurKernelSize;
        var blurKernel;
        var blurMult;
        function buildBlurKernel(r) {
          var radius = (r * 3.5) | 0;
          radius = (radius < 1) ? 1 : ((radius < 248) ? radius : 248);
          if (blurRadius !== radius) {
            blurRadius = radius;
            blurKernelSize = 1 + blurRadius << 1;
            blurKernel = new Int32Array(blurKernelSize);
            blurMult = new Array(blurKernelSize);
            for (var l = 0; l < blurKernelSize; l++) {
              blurMult[l] = new Int32Array(256);
            }
            var bk,
                bki;
            var bm,
                bmi;
            for (var i = 1,
                radiusi = radius - 1; i < radius; i++) {
              blurKernel[radius + i] = blurKernel[radiusi] = bki = radiusi * radiusi;
              bm = blurMult[radius + i];
              bmi = blurMult[radiusi--];
              for (var j = 0; j < 256; j++) {
                bm[j] = bmi[j] = bki * j;
              }
            }
            bk = blurKernel[radius] = radius * radius;
            bm = blurMult[radius];
            for (var k = 0; k < 256; k++) {
              bm[k] = bk * k;
            }
          }
        }
        function blurARGB(canvas, radius) {
          var pixels = Filters._toPixels(canvas);
          var width = canvas.width;
          var height = canvas.height;
          var numPackedPixels = width * height;
          var argb = new Int32Array(numPackedPixels);
          for (var j = 0; j < numPackedPixels; j++) {
            argb[j] = Filters._getARGB(pixels, j);
          }
          var sum,
              cr,
              cg,
              cb,
              ca;
          var read,
              ri,
              ym,
              ymi,
              bk0;
          var a2 = new Int32Array(numPackedPixels);
          var r2 = new Int32Array(numPackedPixels);
          var g2 = new Int32Array(numPackedPixels);
          var b2 = new Int32Array(numPackedPixels);
          var yi = 0;
          buildBlurKernel(radius);
          var x,
              y,
              i;
          var bm;
          for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
              cb = cg = cr = ca = sum = 0;
              read = x - blurRadius;
              if (read < 0) {
                bk0 = -read;
                read = 0;
              } else {
                if (read >= width) {
                  break;
                }
                bk0 = 0;
              }
              for (i = bk0; i < blurKernelSize; i++) {
                if (read >= width) {
                  break;
                }
                var c = argb[read + yi];
                bm = blurMult[i];
                ca += bm[(c & -16777216) >>> 24];
                cr += bm[(c & 16711680) >> 16];
                cg += bm[(c & 65280) >> 8];
                cb += bm[c & 255];
                sum += blurKernel[i];
                read++;
              }
              ri = yi + x;
              a2[ri] = ca / sum;
              r2[ri] = cr / sum;
              g2[ri] = cg / sum;
              b2[ri] = cb / sum;
            }
            yi += width;
          }
          yi = 0;
          ym = -blurRadius;
          ymi = ym * width;
          for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
              cb = cg = cr = ca = sum = 0;
              if (ym < 0) {
                bk0 = ri = -ym;
                read = x;
              } else {
                if (ym >= height) {
                  break;
                }
                bk0 = 0;
                ri = ym;
                read = x + ymi;
              }
              for (i = bk0; i < blurKernelSize; i++) {
                if (ri >= height) {
                  break;
                }
                bm = blurMult[i];
                ca += bm[a2[read]];
                cr += bm[r2[read]];
                cg += bm[g2[read]];
                cb += bm[b2[read]];
                sum += blurKernel[i];
                ri++;
                read += width;
              }
              argb[x + yi] = (ca / sum) << 24 | (cr / sum) << 16 | (cg / sum) << 8 | (cb / sum);
            }
            yi += width;
            ymi += width;
            ym++;
          }
          Filters._setPixels(pixels, argb);
        }
        Filters.blur = function(canvas, radius) {
          blurARGB(canvas, radius);
        };
        module.exports = Filters;
      }, {}],
      60: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var frames = [];
        p5.prototype.createImage = function(width, height) {
          return new p5.Image(width, height);
        };
        p5.prototype.saveCanvas = function() {
          var cnv,
              filename,
              extension;
          if (arguments.length === 3) {
            cnv = arguments[0];
            filename = arguments[1];
            extension = arguments[2];
          } else if (arguments.length === 2) {
            if (typeof arguments[0] === 'object') {
              cnv = arguments[0];
              filename = arguments[1];
            } else {
              filename = arguments[0];
              extension = arguments[1];
            }
          } else if (arguments.length === 1) {
            if (typeof arguments[0] === 'object') {
              cnv = arguments[0];
            } else {
              filename = arguments[0];
            }
          }
          if (cnv instanceof p5.Element) {
            cnv = cnv.elt;
          }
          if (!(cnv instanceof HTMLCanvasElement)) {
            cnv = null;
          }
          if (!extension) {
            extension = p5.prototype._checkFileExtension(filename, extension)[1];
            if (extension === '') {
              extension = 'png';
            }
          }
          if (!cnv) {
            if (this._curElement && this._curElement.elt) {
              cnv = this._curElement.elt;
            }
          }
          if (p5.prototype._isSafari()) {
            var aText = 'Hello, Safari user!\n';
            aText += 'Now capturing a screenshot...\n';
            aText += 'To save this image,\n';
            aText += 'go to File --> Save As.\n';
            alert(aText);
            window.location.href = cnv.toDataURL();
          } else {
            var mimeType;
            if (typeof(extension) === 'undefined') {
              extension = 'png';
              mimeType = 'image/png';
            } else {
              switch (extension) {
                case 'png':
                  mimeType = 'image/png';
                  break;
                case 'jpeg':
                  mimeType = 'image/jpeg';
                  break;
                case 'jpg':
                  mimeType = 'image/jpeg';
                  break;
                default:
                  mimeType = 'image/png';
                  break;
              }
            }
            var downloadMime = 'image/octet-stream';
            var imageData = cnv.toDataURL(mimeType);
            imageData = imageData.replace(mimeType, downloadMime);
            p5.prototype.downloadFile(imageData, filename, extension);
          }
        };
        p5.prototype.saveFrames = function(fName, ext, _duration, _fps, callback) {
          var duration = _duration || 3;
          duration = p5.prototype.constrain(duration, 0, 15);
          duration = duration * 1000;
          var fps = _fps || 15;
          fps = p5.prototype.constrain(fps, 0, 22);
          var count = 0;
          var makeFrame = p5.prototype._makeFrame;
          var cnv = this._curElement.elt;
          var frameFactory = setInterval(function() {
            makeFrame(fName + count, ext, cnv);
            count++;
          }, 1000 / fps);
          setTimeout(function() {
            clearInterval(frameFactory);
            if (callback) {
              callback(frames);
            } else {
              for (var i = 0; i < frames.length; i++) {
                var f = frames[i];
                p5.prototype.downloadFile(f.imageData, f.filename, f.ext);
              }
            }
            frames = [];
          }, duration + 0.01);
        };
        p5.prototype._makeFrame = function(filename, extension, _cnv) {
          var cnv;
          if (this) {
            cnv = this._curElement.elt;
          } else {
            cnv = _cnv;
          }
          var mimeType;
          if (!extension) {
            extension = 'png';
            mimeType = 'image/png';
          } else {
            switch (extension.toLowerCase()) {
              case 'png':
                mimeType = 'image/png';
                break;
              case 'jpeg':
                mimeType = 'image/jpeg';
                break;
              case 'jpg':
                mimeType = 'image/jpeg';
                break;
              default:
                mimeType = 'image/png';
                break;
            }
          }
          var downloadMime = 'image/octet-stream';
          var imageData = cnv.toDataURL(mimeType);
          imageData = imageData.replace(mimeType, downloadMime);
          var thisFrame = {};
          thisFrame.imageData = imageData;
          thisFrame.filename = filename;
          thisFrame.ext = extension;
          frames.push(thisFrame);
        };
        module.exports = p5;
      }, {"../core/core": 42}],
      61: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var Filters = _dereq_('./filters');
        var canvas = _dereq_('../core/canvas');
        var constants = _dereq_('../core/constants');
        _dereq_('../core/error_helpers');
        p5.prototype.loadImage = function(path, successCallback, failureCallback) {
          var img = new Image();
          var pImg = new p5.Image(1, 1, this);
          var decrementPreload = p5._getDecrementPreload.apply(this, arguments);
          img.onload = function() {
            pImg.width = pImg.canvas.width = img.width;
            pImg.height = pImg.canvas.height = img.height;
            pImg.drawingContext.drawImage(img, 0, 0);
            if (typeof successCallback === 'function') {
              successCallback(pImg);
            }
            if (decrementPreload && (successCallback !== decrementPreload)) {
              decrementPreload();
            }
          };
          img.onerror = function(e) {
            p5._friendlyFileLoadError(0, img.src);
            if ((typeof failureCallback === 'function') && (failureCallback !== decrementPreload)) {
              failureCallback(e);
            }
          };
          if (path.indexOf('data:image/') !== 0) {
            img.crossOrigin = 'Anonymous';
          }
          img.src = path;
          return pImg;
        };
        function _sAssign(sVal, iVal) {
          if (sVal > 0 && sVal < iVal) {
            return sVal;
          } else {
            return iVal;
          }
        }
        p5.prototype.image = function(img, dx, dy, dWidth, dHeight, sx, sy, sWidth, sHeight) {
          var defW = img.width;
          var defH = img.height;
          if (img.elt && img.elt.videoWidth && !img.canvas) {
            defW = img.elt.videoWidth;
            defH = img.elt.videoHeight;
          }
          var _dx = dx;
          var _dy = dy;
          var _dw = dWidth || defW;
          var _dh = dHeight || defH;
          var _sx = sx || 0;
          var _sy = sy || 0;
          var _sw = sWidth || defW;
          var _sh = sHeight || defH;
          _sw = _sAssign(_sw, defW);
          _sh = _sAssign(_sh, defH);
          var pd = 1;
          if (img.elt && !img.canvas && img.elt.style.width) {
            if (img.elt.videoWidth && !dWidth) {
              pd = img.elt.videoWidth;
            } else {
              pd = img.elt.width;
            }
            pd /= parseInt(img.elt.style.width, 10);
          }
          _sx *= pd;
          _sy *= pd;
          _sh *= pd;
          _sw *= pd;
          var vals = canvas.modeAdjust(_dx, _dy, _dw, _dh, this._renderer._imageMode);
          this._renderer.image(img, _sx, _sy, _sw, _sh, vals.x, vals.y, vals.w, vals.h);
        };
        p5.prototype.tint = function() {
          var c = this.color.apply(this, arguments);
          this._renderer._tint = c.levels;
        };
        p5.prototype.noTint = function() {
          this._renderer._tint = null;
        };
        p5.prototype._getTintedImageCanvas = function(img) {
          if (!img.canvas) {
            return img;
          }
          var pixels = Filters._toPixels(img.canvas);
          var tmpCanvas = document.createElement('canvas');
          tmpCanvas.width = img.canvas.width;
          tmpCanvas.height = img.canvas.height;
          var tmpCtx = tmpCanvas.getContext('2d');
          var id = tmpCtx.createImageData(img.canvas.width, img.canvas.height);
          var newPixels = id.data;
          for (var i = 0; i < pixels.length; i += 4) {
            var r = pixels[i];
            var g = pixels[i + 1];
            var b = pixels[i + 2];
            var a = pixels[i + 3];
            newPixels[i] = r * this._renderer._tint[0] / 255;
            newPixels[i + 1] = g * this._renderer._tint[1] / 255;
            newPixels[i + 2] = b * this._renderer._tint[2] / 255;
            newPixels[i + 3] = a * this._renderer._tint[3] / 255;
          }
          tmpCtx.putImageData(id, 0, 0);
          return tmpCanvas;
        };
        p5.prototype.imageMode = function(m) {
          if (m === constants.CORNER || m === constants.CORNERS || m === constants.CENTER) {
            this._renderer._imageMode = m;
          }
        };
        module.exports = p5;
      }, {
        "../core/canvas": 40,
        "../core/constants": 41,
        "../core/core": 42,
        "../core/error_helpers": 45,
        "./filters": 59
      }],
      62: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var Filters = _dereq_('./filters');
        p5.Image = function(width, height) {
          this.width = width;
          this.height = height;
          this.canvas = document.createElement('canvas');
          this.canvas.width = this.width;
          this.canvas.height = this.height;
          this.drawingContext = this.canvas.getContext('2d');
          this._pixelDensity = 1;
          this.isTexture = false;
          this.pixels = [];
        };
        p5.Image.prototype._setProperty = function(prop, value) {
          this[prop] = value;
        };
        p5.Image.prototype.loadPixels = function() {
          p5.Renderer2D.prototype.loadPixels.call(this);
        };
        p5.Image.prototype.updatePixels = function(x, y, w, h) {
          p5.Renderer2D.prototype.updatePixels.call(this, x, y, w, h);
        };
        p5.Image.prototype.get = function(x, y, w, h) {
          return p5.Renderer2D.prototype.get.call(this, x, y, w, h);
        };
        p5.Image.prototype.set = function(x, y, imgOrCol) {
          p5.Renderer2D.prototype.set.call(this, x, y, imgOrCol);
        };
        p5.Image.prototype.resize = function(width, height) {
          if (width === 0 && height === 0) {
            width = this.canvas.width;
            height = this.canvas.height;
          } else if (width === 0) {
            width = this.canvas.width * height / this.canvas.height;
          } else if (height === 0) {
            height = this.canvas.height * width / this.canvas.width;
          }
          width = Math.floor(width);
          height = Math.floor(height);
          var tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          tempCanvas.getContext('2d').drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height, 0, 0, tempCanvas.width, tempCanvas.height);
          this.canvas.width = this.width = width;
          this.canvas.height = this.height = height;
          this.drawingContext.drawImage(tempCanvas, 0, 0, width, height, 0, 0, width, height);
          if (this.pixels.length > 0) {
            this.loadPixels();
          }
        };
        p5.Image.prototype.copy = function() {
          p5.prototype.copy.apply(this, arguments);
        };
        p5.Image.prototype.mask = function(p5Image) {
          if (p5Image === undefined) {
            p5Image = this;
          }
          var currBlend = this.drawingContext.globalCompositeOperation;
          var scaleFactor = 1;
          if (p5Image instanceof p5.Renderer) {
            scaleFactor = p5Image._pInst._pixelDensity;
          }
          var copyArgs = [p5Image, 0, 0, scaleFactor * p5Image.width, scaleFactor * p5Image.height, 0, 0, this.width, this.height];
          this.drawingContext.globalCompositeOperation = 'destination-in';
          p5.Image.prototype.copy.apply(this, copyArgs);
          this.drawingContext.globalCompositeOperation = currBlend;
        };
        p5.Image.prototype.filter = function(operation, value) {
          Filters.apply(this.canvas, Filters[operation.toLowerCase()], value);
        };
        p5.Image.prototype.blend = function() {
          p5.prototype.blend.apply(this, arguments);
        };
        p5.Image.prototype.save = function(filename, extension) {
          var mimeType;
          if (!extension) {
            extension = 'png';
            mimeType = 'image/png';
          } else {
            switch (extension.toLowerCase()) {
              case 'png':
                mimeType = 'image/png';
                break;
              case 'jpeg':
                mimeType = 'image/jpeg';
                break;
              case 'jpg':
                mimeType = 'image/jpeg';
                break;
              default:
                mimeType = 'image/png';
                break;
            }
          }
          var downloadMime = 'image/octet-stream';
          var imageData = this.canvas.toDataURL(mimeType);
          imageData = imageData.replace(mimeType, downloadMime);
          p5.prototype.downloadFile(imageData, filename, extension);
        };
        module.exports = p5.Image;
      }, {
        "../core/core": 42,
        "./filters": 59
      }],
      63: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var Filters = _dereq_('./filters');
        _dereq_('../color/p5.Color');
        p5.prototype.pixels = [];
        p5.prototype.blend = function() {
          if (this._renderer) {
            this._renderer.blend.apply(this._renderer, arguments);
          } else {
            p5.Renderer2D.prototype.blend.apply(this, arguments);
          }
        };
        p5.prototype.copy = function() {
          p5.Renderer2D._copyHelper.apply(this, arguments);
        };
        p5.prototype.filter = function(operation, value) {
          if (this.canvas !== undefined) {
            Filters.apply(this.canvas, Filters[operation.toLowerCase()], value);
          } else {
            Filters.apply(this.elt, Filters[operation.toLowerCase()], value);
          }
        };
        p5.prototype.get = function(x, y, w, h) {
          return this._renderer.get(x, y, w, h);
        };
        p5.prototype.loadPixels = function() {
          this._renderer.loadPixels();
        };
        p5.prototype.set = function(x, y, imgOrCol) {
          this._renderer.set(x, y, imgOrCol);
        };
        p5.prototype.updatePixels = function(x, y, w, h) {
          if (this.pixels.length === 0) {
            return;
          }
          this._renderer.updatePixels(x, y, w, h);
        };
        module.exports = p5;
      }, {
        "../color/p5.Color": 36,
        "../core/core": 42,
        "./filters": 59
      }],
      64: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var opentype = _dereq_('opentype.js');
        _dereq_('whatwg-fetch');
        _dereq_('es6-promise').polyfill();
        var fetchJsonp = _dereq_('fetch-jsonp');
        _dereq_('../core/error_helpers');
        p5._getDecrementPreload = function() {
          var decrementPreload = arguments[arguments.length - 1];
          if ((window.preload || (this && this.preload)) && typeof decrementPreload === 'function') {
            return decrementPreload;
          } else {
            return null;
          }
        };
        p5.prototype.loadFont = function(path, onSuccess, onError) {
          var p5Font = new p5.Font(this);
          var decrementPreload = p5._getDecrementPreload.apply(this, arguments);
          opentype.load(path, function(err, font) {
            if (err) {
              if ((typeof onError !== 'undefined') && (onError !== decrementPreload)) {
                return onError(err);
              }
              p5._friendlyFileLoadError(4, path);
              console.error(err, path);
              return;
            }
            p5Font.font = font;
            if (typeof onSuccess !== 'undefined') {
              onSuccess(p5Font);
            }
            if (decrementPreload && (onSuccess !== decrementPreload)) {
              decrementPreload();
            }
            var validFontTypes = ['ttf', 'otf', 'woff', 'woff2'],
                fileNoPath = path.split('\\').pop().split('/').pop(),
                lastDotIdx = fileNoPath.lastIndexOf('.'),
                fontFamily,
                newStyle,
                fileExt = lastDotIdx < 1 ? null : fileNoPath.substr(lastDotIdx + 1);
            if (validFontTypes.indexOf(fileExt) > -1) {
              fontFamily = fileNoPath.substr(0, lastDotIdx);
              newStyle = document.createElement('style');
              newStyle.appendChild(document.createTextNode('\n@font-face {' + '\nfont-family: ' + fontFamily + ';\nsrc: url(' + path + ');\n}\n'));
              document.head.appendChild(newStyle);
            }
          });
          return p5Font;
        };
        p5.prototype.loadJSON = function() {
          var path = arguments[0];
          var callback;
          var errorCallback;
          var options;
          var decrementPreload = p5._getDecrementPreload.apply(this, arguments);
          var ret = {};
          var t = 'json';
          for (var i = 1; i < arguments.length; i++) {
            var arg = arguments[i];
            if (typeof arg === 'string') {
              if (arg === 'jsonp' || arg === 'json') {
                t = arg;
              }
            } else if (typeof arg === 'function' && arg !== decrementPreload) {
              if (!callback) {
                callback = arg;
              } else {
                errorCallback = arg;
              }
            } else if (typeof arg === 'object' && arg.hasOwnProperty('jsonpCallback')) {
              t = 'jsonp';
              options = arg;
            }
          }
          p5.prototype.httpDo(path, 'GET', options, t, function(resp) {
            for (var k in resp) {
              ret[k] = resp[k];
            }
            if (typeof callback !== 'undefined') {
              callback(resp);
            }
            if (decrementPreload && (callback !== decrementPreload)) {
              decrementPreload();
            }
          }, errorCallback);
          return ret;
        };
        p5.prototype.loadStrings = function() {
          var ret = [];
          var decrementPreload = p5._getDecrementPreload.apply(this, arguments);
          var callback,
              errorCallback;
          for (var i = 1; i < arguments.length; i++) {
            var arg = arguments[i];
            if (typeof arg === 'function' && arg !== decrementPreload) {
              if (typeof callback === 'undefined') {
                callback = arg;
              } else {
                errorCallback = arg;
              }
            }
          }
          p5.prototype.httpDo(arguments[0], 'GET', 'text', function(data) {
            var arr = data.match(/[^\r\n]+/g);
            for (var k in arr) {
              ret[k] = arr[k];
            }
            if (typeof callback !== 'undefined') {
              callback(ret);
            }
            if (decrementPreload && (callback !== decrementPreload)) {
              decrementPreload();
            }
          }, errorCallback);
          return ret;
        };
        p5.prototype.loadTable = function(path) {
          var callback = null;
          var errorCallback = null;
          var options = [];
          var header = false;
          var ext = path.substring(path.lastIndexOf('.') + 1, path.length);
          var sep = ',';
          var separatorSet = false;
          var decrementPreload = p5._getDecrementPreload.apply(this, arguments);
          if (ext === 'tsv') {
            sep = '\t';
          }
          for (var i = 1; i < arguments.length; i++) {
            if ((typeof(arguments[i]) === 'function') && (arguments[i] !== decrementPreload)) {
              if (!callback) {
                callback = arguments[i];
              } else {
                errorCallback = arguments[i];
              }
            } else if (typeof(arguments[i]) === 'string') {
              options.push(arguments[i]);
              if (arguments[i] === 'header') {
                header = true;
              }
              if (arguments[i] === 'csv') {
                if (separatorSet) {
                  throw new Error('Cannot set multiple separator types.');
                } else {
                  sep = ',';
                  separatorSet = true;
                }
              } else if (arguments[i] === 'tsv') {
                if (separatorSet) {
                  throw new Error('Cannot set multiple separator types.');
                } else {
                  sep = '\t';
                  separatorSet = true;
                }
              }
            }
          }
          var t = new p5.Table();
          p5.prototype.httpDo(path, 'GET', 'text', function(resp) {
            var state = {};
            var PRE_TOKEN = 0,
                MID_TOKEN = 1,
                POST_TOKEN = 2,
                POST_RECORD = 4;
            var QUOTE = '\"',
                CR = '\r',
                LF = '\n';
            var records = [];
            var offset = 0;
            var currentRecord = null;
            var currentChar;
            var tokenBegin = function() {
              state.currentState = PRE_TOKEN;
              state.token = '';
            };
            var tokenEnd = function() {
              currentRecord.push(state.token);
              tokenBegin();
            };
            var recordBegin = function() {
              state.escaped = false;
              currentRecord = [];
              tokenBegin();
            };
            var recordEnd = function() {
              state.currentState = POST_RECORD;
              records.push(currentRecord);
              currentRecord = null;
            };
            while (true) {
              currentChar = resp[offset++];
              if (currentChar == null) {
                if (state.escaped) {
                  throw new Error('Unclosed quote in file.');
                }
                if (currentRecord) {
                  tokenEnd();
                  recordEnd();
                  break;
                }
              }
              if (currentRecord === null) {
                recordBegin();
              }
              if (state.currentState === PRE_TOKEN) {
                if (currentChar === QUOTE) {
                  state.escaped = true;
                  state.currentState = MID_TOKEN;
                  continue;
                }
                state.currentState = MID_TOKEN;
              }
              if (state.currentState === MID_TOKEN && state.escaped) {
                if (currentChar === QUOTE) {
                  if (resp[offset] === QUOTE) {
                    state.token += QUOTE;
                    offset++;
                  } else {
                    state.escaped = false;
                    state.currentState = POST_TOKEN;
                  }
                } else {
                  state.token += currentChar;
                }
                continue;
              }
              if (currentChar === CR) {
                if (resp[offset] === LF) {
                  offset++;
                }
                tokenEnd();
                recordEnd();
              } else if (currentChar === LF) {
                tokenEnd();
                recordEnd();
              } else if (currentChar === sep) {
                tokenEnd();
              } else if (state.currentState === MID_TOKEN) {
                state.token += currentChar;
              }
            }
            if (header) {
              t.columns = records.shift();
            } else {
              for (i = 0; i < records[0].length; i++) {
                t.columns[i] = 'null';
              }
            }
            var row;
            for (i = 0; i < records.length; i++) {
              if (records[i].length === 1) {
                if (records[i][0] === 'undefined' || records[i][0] === '') {
                  continue;
                }
              }
              row = new p5.TableRow();
              row.arr = records[i];
              row.obj = makeObject(records[i], t.columns);
              t.addRow(row);
            }
            if (callback !== null) {
              callback(t);
            }
            if (decrementPreload && (callback !== decrementPreload)) {
              decrementPreload();
            }
          }, function(err) {
            p5._friendlyFileLoadError(2, path);
            if (errorCallback) {
              errorCallback(err);
            } else {
              throw err;
            }
          });
          return t;
        };
        function makeObject(row, headers) {
          var ret = {};
          headers = headers || [];
          if (typeof(headers) === 'undefined') {
            for (var j = 0; j < row.length; j++) {
              headers[j.toString()] = j;
            }
          }
          for (var i = 0; i < headers.length; i++) {
            var key = headers[i];
            var val = row[i];
            ret[key] = val;
          }
          return ret;
        }
        p5.prototype.parseXML = function(two) {
          var one = new p5.XML();
          var i;
          if (two.children.length) {
            for (i = 0; i < two.children.length; i++) {
              var node = parseXML(two.children[i]);
              one.addChild(node);
            }
            one.setName(two.nodeName);
            one._setCont(two.textContent);
            one._setAttributes(two);
            for (var j = 0; j < one.children.length; j++) {
              one.children[j].parent = one;
            }
            return one;
          } else {
            one.setName(two.nodeName);
            one._setCont(two.textContent);
            one._setAttributes(two);
            return one;
          }
        };
        p5.prototype.loadXML = function() {
          var ret = {};
          var decrementPreload = p5._getDecrementPreload.apply(this, arguments);
          var callback,
              errorCallback;
          for (var i = 1; i < arguments.length; i++) {
            var arg = arguments[i];
            if (typeof arg === 'function' && arg !== decrementPreload) {
              if (typeof callback === 'undefined') {
                callback = arg;
              } else {
                errorCallback = arg;
              }
            }
          }
          p5.prototype.httpDo(arguments[0], 'GET', 'xml', function(xml) {
            for (var key in xml) {
              ret[key] = xml[key];
            }
            if (typeof callback !== 'undefined') {
              callback(ret);
            }
            if (decrementPreload && (callback !== decrementPreload)) {
              decrementPreload();
            }
          }, errorCallback);
          return ret;
        };
        p5.prototype.httpGet = function() {
          var args = Array.prototype.slice.call(arguments);
          args.splice(1, 0, 'GET');
          p5.prototype.httpDo.apply(this, args);
        };
        p5.prototype.httpPost = function() {
          var args = Array.prototype.slice.call(arguments);
          args.splice(1, 0, 'POST');
          p5.prototype.httpDo.apply(this, args);
        };
        p5.prototype.httpDo = function() {
          var type = '';
          var callback;
          var errorCallback;
          var request;
          var jsonpOptions = {};
          var cbCount = 0;
          var contentType = 'text/plain';
          for (var i = arguments.length - 1; i > 0; i--) {
            if (typeof arguments[i] === 'function') {
              cbCount++;
            } else {
              break;
            }
          }
          var argsCount = arguments.length - cbCount;
          if (argsCount === 2 && typeof arguments[0] === 'string' && typeof arguments[1] === 'object') {
            request = new Request(arguments[0], arguments[1]);
            callback = arguments[2];
            errorCallback = arguments[3];
            if (type === '') {
              if (request.url.indexOf('json') !== -1) {
                type = 'json';
              } else if (request.url.indexOf('xml') !== -1) {
                type = 'xml';
              } else {
                type = 'text';
              }
            }
          } else {
            var path = arguments[0];
            var method = 'GET';
            var data;
            for (var j = 1; j < arguments.length; j++) {
              var a = arguments[j];
              if (typeof a === 'string') {
                if (a === 'GET' || a === 'POST' || a === 'PUT' || a === 'DELETE') {
                  method = a;
                } else if (a === 'json' || a === 'jsonp' || a === 'xml' || a === 'text') {
                  type = a;
                } else {
                  data = a;
                }
              } else if (typeof a === 'number') {
                data = a.toString();
              } else if (typeof a === 'object') {
                if (a.hasOwnProperty('jsonpCallback')) {
                  for (var attr in a) {
                    jsonpOptions[attr] = a[attr];
                  }
                } else {
                  data = JSON.stringify(a);
                  contentType = 'application/json';
                }
              } else if (typeof a === 'function') {
                if (!callback) {
                  callback = a;
                } else {
                  errorCallback = a;
                }
              }
            }
            if (type === '') {
              if (path.indexOf('json') !== -1) {
                type = 'json';
              } else if (path.indexOf('xml') !== -1) {
                type = 'xml';
              } else {
                type = 'text';
              }
            }
            request = new Request(path, {
              method: method,
              mode: 'cors',
              body: data,
              headers: new Headers({'Content-Type': contentType})
            });
          }
          if (type === 'jsonp') {
            fetchJsonp(arguments[0], jsonpOptions).then(function(res) {
              if (res.ok) {
                return res.json();
              }
              throw res;
            }).then(function(resp) {
              callback(resp);
            }).catch(function(err) {
              if (errorCallback) {
                errorCallback(err);
              } else {
                throw err;
              }
            });
          } else {
            fetch(request).then(function(res) {
              if (res.ok) {
                if (type === 'json') {
                  return res.json();
                } else {
                  return res.text();
                }
              }
              throw res;
            }).then(function(resp) {
              if (type === 'xml') {
                var parser = new DOMParser();
                resp = parser.parseFromString(resp, 'text/xml');
                resp = parseXML(resp.documentElement);
              }
              callback(resp);
            }).catch(function(err, msg) {
              if (errorCallback) {
                errorCallback(err);
              } else {
                throw err;
              }
            });
          }
        };
        window.URL = window.URL || window.webkitURL;
        p5.prototype._pWriters = [];
        p5.prototype.createWriter = function(name, extension) {
          var newPW;
          for (var i in p5.prototype._pWriters) {
            if (p5.prototype._pWriters[i].name === name) {
              newPW = new p5.PrintWriter(name + window.millis(), extension);
              p5.prototype._pWriters.push(newPW);
              return newPW;
            }
          }
          newPW = new p5.PrintWriter(name, extension);
          p5.prototype._pWriters.push(newPW);
          return newPW;
        };
        p5.PrintWriter = function(filename, extension) {
          var self = this;
          this.name = filename;
          this.content = '';
          this.write = function(data) {
            this.content += data;
          };
          this.print = function(data) {
            this.content += data + '\n';
          };
          this.flush = function() {
            this.content = '';
          };
          this.close = function() {
            var arr = [];
            arr.push(this.content);
            p5.prototype.writeFile(arr, filename, extension);
            for (var i in p5.prototype._pWriters) {
              if (p5.prototype._pWriters[i].name === this.name) {
                p5.prototype._pWriters.splice(i, 1);
              }
            }
            self.flush();
            self = {};
          };
        };
        p5.prototype.save = function(object, _filename, _options) {
          var args = arguments;
          var cnv = this._curElement.elt;
          if (args.length === 0) {
            p5.prototype.saveCanvas(cnv);
            return;
          } else if (args[0] instanceof p5.Renderer || args[0] instanceof p5.Graphics) {
            p5.prototype.saveCanvas(args[0].elt, args[1], args[2]);
            return;
          } else if (args.length === 1 && typeof(args[0]) === 'string') {
            p5.prototype.saveCanvas(cnv, args[0]);
          } else {
            var extension = _checkFileExtension(args[1], args[2])[1];
            switch (extension) {
              case 'json':
                p5.prototype.saveJSON(args[0], args[1], args[2]);
                return;
              case 'txt':
                p5.prototype.saveStrings(args[0], args[1], args[2]);
                return;
              default:
                if (args[0] instanceof Array) {
                  p5.prototype.saveStrings(args[0], args[1], args[2]);
                } else if (args[0] instanceof p5.Table) {
                  p5.prototype.saveTable(args[0], args[1], args[2], args[3]);
                } else if (args[0] instanceof p5.Image) {
                  p5.prototype.saveCanvas(args[0].canvas, args[1]);
                } else if (args[0] instanceof p5.SoundFile) {
                  p5.prototype.saveSound(args[0], args[1], args[2], args[3]);
                }
            }
          }
        };
        p5.prototype.saveJSON = function(json, filename, opt) {
          var stringify;
          if (opt) {
            stringify = JSON.stringify(json);
          } else {
            stringify = JSON.stringify(json, undefined, 2);
          }
          this.saveStrings(stringify.split('\n'), filename, 'json');
        };
        p5.prototype.saveJSONObject = p5.prototype.saveJSON;
        p5.prototype.saveJSONArray = p5.prototype.saveJSON;
        p5.prototype.saveStrings = function(list, filename, extension) {
          var ext = extension || 'txt';
          var pWriter = this.createWriter(filename, ext);
          for (var i = 0; i < list.length; i++) {
            if (i < list.length - 1) {
              pWriter.print(list[i]);
            } else {
              pWriter.print(list[i]);
            }
          }
          pWriter.close();
          pWriter.flush();
        };
        function escapeHelper(content) {
          return content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        }
        p5.prototype.saveTable = function(table, filename, options) {
          var ext;
          if (options === undefined) {
            ext = filename.substring(filename.lastIndexOf('.') + 1, filename.length);
          } else {
            ext = options;
          }
          var pWriter = this.createWriter(filename, ext);
          var header = table.columns;
          var sep = ',';
          if (ext === 'tsv') {
            sep = '\t';
          }
          if (ext !== 'html') {
            if (header[0] !== '0') {
              for (var h = 0; h < header.length; h++) {
                if (h < header.length - 1) {
                  pWriter.write(header[h] + sep);
                } else {
                  pWriter.write(header[h]);
                }
              }
              pWriter.write('\n');
            }
            for (var i = 0; i < table.rows.length; i++) {
              var j;
              for (j = 0; j < table.rows[i].arr.length; j++) {
                if (j < table.rows[i].arr.length - 1) {
                  pWriter.write(table.rows[i].arr[j] + sep);
                } else if (i < table.rows.length - 1) {
                  pWriter.write(table.rows[i].arr[j]);
                } else {
                  pWriter.write(table.rows[i].arr[j]);
                }
              }
              pWriter.write('\n');
            }
          } else {
            pWriter.print('<html>');
            pWriter.print('<head>');
            var str = '  <meta http-equiv=\"content-type\" content';
            str += '=\"text/html;charset=utf-8\" />';
            pWriter.print(str);
            pWriter.print('</head>');
            pWriter.print('<body>');
            pWriter.print('  <table>');
            if (header[0] !== '0') {
              pWriter.print('    <tr>');
              for (var k = 0; k < header.length; k++) {
                var e = escapeHelper(header[k]);
                pWriter.print('      <td>' + e);
                pWriter.print('      </td>');
              }
              pWriter.print('    </tr>');
            }
            for (var row = 0; row < table.rows.length; row++) {
              pWriter.print('    <tr>');
              for (var col = 0; col < table.columns.length; col++) {
                var entry = table.rows[row].getString(col);
                var htmlEntry = escapeHelper(entry);
                pWriter.print('      <td>' + htmlEntry);
                pWriter.print('      </td>');
              }
              pWriter.print('    </tr>');
            }
            pWriter.print('  </table>');
            pWriter.print('</body>');
            pWriter.print('</html>');
          }
          pWriter.close();
          pWriter.flush();
        };
        p5.prototype.writeFile = function(dataToDownload, filename, extension) {
          var type = 'application\/octet-stream';
          if (p5.prototype._isSafari()) {
            type = 'text\/plain';
          }
          var blob = new Blob(dataToDownload, {'type': type});
          var href = window.URL.createObjectURL(blob);
          p5.prototype.downloadFile(href, filename, extension);
        };
        p5.prototype.downloadFile = function(href, fName, extension) {
          var fx = _checkFileExtension(fName, extension);
          var filename = fx[0];
          var ext = fx[1];
          var a = document.createElement('a');
          a.href = href;
          a.download = filename;
          a.onclick = function(e) {
            destroyClickedElement(e);
            e.stopPropagation();
          };
          a.style.display = 'none';
          document.body.appendChild(a);
          if (p5.prototype._isSafari()) {
            var aText = 'Hello, Safari user! To download this file...\n';
            aText += '1. Go to File --> Save As.\n';
            aText += '2. Choose "Page Source" as the Format.\n';
            aText += '3. Name it with this extension: .\"' + ext + '\"';
            alert(aText);
          }
          a.click();
          href = null;
        };
        function _checkFileExtension(filename, extension) {
          if (!extension || extension === true || extension === 'true') {
            extension = '';
          }
          if (!filename) {
            filename = 'untitled';
          }
          var ext = '';
          if (filename && filename.indexOf('.') > -1) {
            ext = filename.split('.').pop();
          }
          if (extension) {
            if (ext !== extension) {
              ext = extension;
              filename = filename + '.' + ext;
            }
          }
          return [filename, ext];
        }
        p5.prototype._checkFileExtension = _checkFileExtension;
        p5.prototype._isSafari = function() {
          var x = Object.prototype.toString.call(window.HTMLElement);
          return x.indexOf('Constructor') > 0;
        };
        function destroyClickedElement(event) {
          document.body.removeChild(event.target);
        }
        module.exports = p5;
      }, {
        "../core/core": 42,
        "../core/error_helpers": 45,
        "es6-promise": 2,
        "fetch-jsonp": 3,
        "opentype.js": 10,
        "whatwg-fetch": 32
      }],
      65: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.Table = function(rows) {
          this.columns = [];
          this.rows = [];
        };
        p5.Table.prototype.addRow = function(row) {
          var r = row || new p5.TableRow();
          if (typeof(r.arr) === 'undefined' || typeof(r.obj) === 'undefined') {
            throw 'invalid TableRow: ' + r;
          }
          r.table = this;
          this.rows.push(r);
          return r;
        };
        p5.Table.prototype.removeRow = function(id) {
          this.rows[id].table = null;
          var chunk = this.rows.splice(id + 1, this.rows.length);
          this.rows.pop();
          this.rows = this.rows.concat(chunk);
        };
        p5.Table.prototype.getRow = function(r) {
          return this.rows[r];
        };
        p5.Table.prototype.getRows = function() {
          return this.rows;
        };
        p5.Table.prototype.findRow = function(value, column) {
          if (typeof(column) === 'string') {
            for (var i = 0; i < this.rows.length; i++) {
              if (this.rows[i].obj[column] === value) {
                return this.rows[i];
              }
            }
          } else {
            for (var j = 0; j < this.rows.length; j++) {
              if (this.rows[j].arr[column] === value) {
                return this.rows[j];
              }
            }
          }
          return null;
        };
        p5.Table.prototype.findRows = function(value, column) {
          var ret = [];
          if (typeof(column) === 'string') {
            for (var i = 0; i < this.rows.length; i++) {
              if (this.rows[i].obj[column] === value) {
                ret.push(this.rows[i]);
              }
            }
          } else {
            for (var j = 0; j < this.rows.length; j++) {
              if (this.rows[j].arr[column] === value) {
                ret.push(this.rows[j]);
              }
            }
          }
          return ret;
        };
        p5.Table.prototype.matchRow = function(regexp, column) {
          if (typeof(column) === 'number') {
            for (var j = 0; j < this.rows.length; j++) {
              if (this.rows[j].arr[column].match(regexp)) {
                return this.rows[j];
              }
            }
          } else {
            for (var i = 0; i < this.rows.length; i++) {
              if (this.rows[i].obj[column].match(regexp)) {
                return this.rows[i];
              }
            }
          }
          return null;
        };
        p5.Table.prototype.matchRows = function(regexp, column) {
          var ret = [];
          if (typeof(column) === 'number') {
            for (var j = 0; j < this.rows.length; j++) {
              if (this.rows[j].arr[column].match(regexp)) {
                ret.push(this.rows[j]);
              }
            }
          } else {
            for (var i = 0; i < this.rows.length; i++) {
              if (this.rows[i].obj[column].match(regexp)) {
                ret.push(this.rows[i]);
              }
            }
          }
          return ret;
        };
        p5.Table.prototype.getColumn = function(value) {
          var ret = [];
          if (typeof(value) === 'string') {
            for (var i = 0; i < this.rows.length; i++) {
              ret.push(this.rows[i].obj[value]);
            }
          } else {
            for (var j = 0; j < this.rows.length; j++) {
              ret.push(this.rows[j].arr[value]);
            }
          }
          return ret;
        };
        p5.Table.prototype.clearRows = function() {
          delete this.rows;
          this.rows = [];
        };
        p5.Table.prototype.addColumn = function(title) {
          var t = title || null;
          this.columns.push(t);
        };
        p5.Table.prototype.getColumnCount = function() {
          return this.columns.length;
        };
        p5.Table.prototype.getRowCount = function() {
          return this.rows.length;
        };
        p5.Table.prototype.removeTokens = function(chars, column) {
          var escape = function(s) {
            return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          };
          var charArray = [];
          for (var i = 0; i < chars.length; i++) {
            charArray.push(escape(chars.charAt(i)));
          }
          var regex = new RegExp(charArray.join('|'), 'g');
          if (typeof(column) === 'undefined') {
            for (var c = 0; c < this.columns.length; c++) {
              for (var d = 0; d < this.rows.length; d++) {
                var s = this.rows[d].arr[c];
                s = s.replace(regex, '');
                this.rows[d].arr[c] = s;
                this.rows[d].obj[this.columns[c]] = s;
              }
            }
          } else if (typeof(column) === 'string') {
            for (var j = 0; j < this.rows.length; j++) {
              var val = this.rows[j].obj[column];
              val = val.replace(regex, '');
              this.rows[j].obj[column] = val;
              var pos = this.columns.indexOf(column);
              this.rows[j].arr[pos] = val;
            }
          } else {
            for (var k = 0; k < this.rows.length; k++) {
              var str = this.rows[k].arr[column];
              str = str.replace(regex, '');
              this.rows[k].arr[column] = str;
              this.rows[k].obj[this.columns[column]] = str;
            }
          }
        };
        p5.Table.prototype.trim = function(column) {
          var regex = new RegExp((' '), 'g');
          if (typeof(column) === 'undefined') {
            for (var c = 0; c < this.columns.length; c++) {
              for (var d = 0; d < this.rows.length; d++) {
                var s = this.rows[d].arr[c];
                s = s.replace(regex, '');
                this.rows[d].arr[c] = s;
                this.rows[d].obj[this.columns[c]] = s;
              }
            }
          } else if (typeof(column) === 'string') {
            for (var j = 0; j < this.rows.length; j++) {
              var val = this.rows[j].obj[column];
              val = val.replace(regex, '');
              this.rows[j].obj[column] = val;
              var pos = this.columns.indexOf(column);
              this.rows[j].arr[pos] = val;
            }
          } else {
            for (var k = 0; k < this.rows.length; k++) {
              var str = this.rows[k].arr[column];
              str = str.replace(regex, '');
              this.rows[k].arr[column] = str;
              this.rows[k].obj[this.columns[column]] = str;
            }
          }
        };
        p5.Table.prototype.removeColumn = function(c) {
          var cString;
          var cNumber;
          if (typeof(c) === 'string') {
            cString = c;
            cNumber = this.columns.indexOf(c);
            console.log('string');
          } else {
            cNumber = c;
            cString = this.columns[c];
          }
          var chunk = this.columns.splice(cNumber + 1, this.columns.length);
          this.columns.pop();
          this.columns = this.columns.concat(chunk);
          for (var i = 0; i < this.rows.length; i++) {
            var tempR = this.rows[i].arr;
            var chip = tempR.splice(cNumber + 1, tempR.length);
            tempR.pop();
            this.rows[i].arr = tempR.concat(chip);
            delete this.rows[i].obj[cString];
          }
        };
        p5.Table.prototype.set = function(row, column, value) {
          this.rows[row].set(column, value);
        };
        p5.Table.prototype.setNum = function(row, column, value) {
          this.rows[row].setNum(column, value);
        };
        p5.Table.prototype.setString = function(row, column, value) {
          this.rows[row].setString(column, value);
        };
        p5.Table.prototype.get = function(row, column) {
          return this.rows[row].get(column);
        };
        p5.Table.prototype.getNum = function(row, column) {
          return this.rows[row].getNum(column);
        };
        p5.Table.prototype.getString = function(row, column) {
          return this.rows[row].getString(column);
        };
        p5.Table.prototype.getObject = function(headerColumn) {
          var tableObject = {};
          var obj,
              cPos,
              index;
          for (var i = 0; i < this.rows.length; i++) {
            obj = this.rows[i].obj;
            if (typeof(headerColumn) === 'string') {
              cPos = this.columns.indexOf(headerColumn);
              if (cPos >= 0) {
                index = obj[headerColumn];
                tableObject[index] = obj;
              } else {
                throw 'This table has no column named "' + headerColumn + '"';
              }
            } else {
              tableObject[i] = this.rows[i].obj;
            }
          }
          return tableObject;
        };
        p5.Table.prototype.getArray = function() {
          var tableArray = [];
          for (var i = 0; i < this.rows.length; i++) {
            tableArray.push(this.rows[i].arr);
          }
          return tableArray;
        };
        module.exports = p5.Table;
      }, {"../core/core": 42}],
      66: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.TableRow = function(str, separator) {
          var arr = [];
          var obj = {};
          if (str) {
            separator = separator || ',';
            arr = str.split(separator);
          }
          for (var i = 0; i < arr.length; i++) {
            var key = i;
            var val = arr[i];
            obj[key] = val;
          }
          this.arr = arr;
          this.obj = obj;
          this.table = null;
        };
        p5.TableRow.prototype.set = function(column, value) {
          if (typeof(column) === 'string') {
            var cPos = this.table.columns.indexOf(column);
            if (cPos >= 0) {
              this.obj[column] = value;
              this.arr[cPos] = value;
            } else {
              throw 'This table has no column named "' + column + '"';
            }
          } else {
            if (column < this.table.columns.length) {
              this.arr[column] = value;
              var cTitle = this.table.columns[column];
              this.obj[cTitle] = value;
            } else {
              throw 'Column #' + column + ' is out of the range of this table';
            }
          }
        };
        p5.TableRow.prototype.setNum = function(column, value) {
          var floatVal = parseFloat(value, 10);
          this.set(column, floatVal);
        };
        p5.TableRow.prototype.setString = function(column, value) {
          var stringVal = value.toString();
          this.set(column, stringVal);
        };
        p5.TableRow.prototype.get = function(column) {
          if (typeof(column) === 'string') {
            return this.obj[column];
          } else {
            return this.arr[column];
          }
        };
        p5.TableRow.prototype.getNum = function(column) {
          var ret;
          if (typeof(column) === 'string') {
            ret = parseFloat(this.obj[column], 10);
          } else {
            ret = parseFloat(this.arr[column], 10);
          }
          if (ret.toString() === 'NaN') {
            throw 'Error: ' + this.obj[column] + ' is NaN (Not a Number)';
          }
          return ret;
        };
        p5.TableRow.prototype.getString = function(column) {
          if (typeof(column) === 'string') {
            return this.obj[column].toString();
          } else {
            return this.arr[column].toString();
          }
        };
        module.exports = p5.TableRow;
      }, {"../core/core": 42}],
      67: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.XML = function() {
          this.name = null;
          this.attributes = {};
          this.children = [];
          this.parent = null;
          this.content = null;
        };
        p5.XML.prototype.getParent = function() {
          return this.parent;
        };
        p5.XML.prototype.getName = function() {
          return this.name;
        };
        p5.XML.prototype.setName = function(name) {
          this.name = name;
        };
        p5.XML.prototype.hasChildren = function() {
          return this.children.length > 0;
        };
        p5.XML.prototype.listChildren = function() {
          return this.children.map(function(c) {
            return c.name;
          });
        };
        p5.XML.prototype.getChildren = function(param) {
          if (param) {
            return this.children.filter(function(c) {
              return c.name === param;
            });
          } else {
            return this.children;
          }
        };
        p5.XML.prototype.getChild = function(param) {
          if (typeof param === 'string') {
            return this.children.find(function(c) {
              return c.name === param;
            });
          } else {
            return this.children[param];
          }
        };
        p5.XML.prototype.addChild = function(node) {
          if (node instanceof p5.XML) {
            this.children.push(node);
          } else {}
        };
        p5.XML.prototype.removeChild = function(param) {
          var ind = -1;
          if (typeof param === 'string') {
            for (var i = 0; i < this.children.length; i++) {
              if (this.children[i].name === param) {
                ind = i;
                break;
              }
            }
          } else {
            ind = param;
          }
          if (ind !== -1) {
            this.children.splice(ind, 1);
          }
        };
        p5.XML.prototype.getAttributeCount = function() {
          return Object.keys(this.attributes).length;
        };
        p5.XML.prototype.listAttributes = function() {
          return Object.keys(this.attributes);
        };
        p5.XML.prototype.hasAttribute = function(name) {
          return this.attributes[name] ? true : false;
        };
        p5.XML.prototype.getNum = function(name, defaultValue) {
          return Number(this.attributes[name]) || defaultValue || 0;
        };
        p5.XML.prototype.getString = function(name, defaultValue) {
          return String(this.attributes[name]) || defaultValue || null;
        };
        p5.XML.prototype.setAttribute = function(name, value) {
          if (this.attributes[name]) {
            this.attributes[name] = value;
          }
        };
        p5.XML.prototype.getContent = function(defaultValue) {
          return this.content || defaultValue || null;
        };
        p5.XML.prototype.setContent = function(content) {
          if (!this.children.length) {
            this.content = content;
          }
        };
        p5.XML.prototype._setCont = function(content) {
          var str;
          str = content;
          str = str.replace(/\s\s+/g, ',');
          this.content = str;
        };
        p5.XML.prototype._setAttributes = function(node) {
          var i,
              att = {};
          for (i = 0; i < node.attributes.length; i++) {
            att[node.attributes[i].nodeName] = node.attributes[i].nodeValue;
          }
          this.attributes = att;
        };
        module.exports = p5.XML;
      }, {"../core/core": 42}],
      68: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.prototype.abs = Math.abs;
        p5.prototype.ceil = Math.ceil;
        p5.prototype.constrain = function(n, low, high) {
          return Math.max(Math.min(n, high), low);
        };
        p5.prototype.dist = function(x1, y1, z1, x2, y2, z2) {
          if (arguments.length === 4) {
            return hypot(z1 - x1, x2 - y1);
          } else if (arguments.length === 6) {
            return hypot(x2 - x1, y2 - y1, z2 - z1);
          }
        };
        p5.prototype.exp = Math.exp;
        p5.prototype.floor = Math.floor;
        p5.prototype.lerp = function(start, stop, amt) {
          return amt * (stop - start) + start;
        };
        p5.prototype.log = Math.log;
        p5.prototype.mag = function(x, y) {
          return hypot(x, y);
        };
        p5.prototype.map = function(n, start1, stop1, start2, stop2) {
          return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
        };
        p5.prototype.max = function() {
          if (arguments[0] instanceof Array) {
            return Math.max.apply(null, arguments[0]);
          } else {
            return Math.max.apply(null, arguments);
          }
        };
        p5.prototype.min = function() {
          if (arguments[0] instanceof Array) {
            return Math.min.apply(null, arguments[0]);
          } else {
            return Math.min.apply(null, arguments);
          }
        };
        p5.prototype.norm = function(n, start, stop) {
          return this.map(n, start, stop, 0, 1);
        };
        p5.prototype.pow = Math.pow;
        p5.prototype.round = Math.round;
        p5.prototype.sq = function(n) {
          return n * n;
        };
        p5.prototype.sqrt = Math.sqrt;
        function hypot(x, y, z) {
          if (typeof Math.hypot === 'function') {
            return Math.hypot.apply(null, arguments);
          }
          var length = arguments.length;
          var args = [];
          var max = 0;
          for (var i = 0; i < length; i++) {
            var n = arguments[i];
            n = +n;
            if (n === Infinity || n === -Infinity) {
              return Infinity;
            }
            n = Math.abs(n);
            if (n > max) {
              max = n;
            }
            args[i] = n;
          }
          if (max === 0) {
            max = 1;
          }
          var sum = 0;
          var compensation = 0;
          for (var j = 0; j < length; j++) {
            var m = args[j] / max;
            var summand = m * m - compensation;
            var preliminary = sum + summand;
            compensation = (preliminary - sum) - summand;
            sum = preliminary;
          }
          return Math.sqrt(sum) * max;
        }
        module.exports = p5;
      }, {"../core/core": 42}],
      69: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.prototype.createVector = function(x, y, z) {
          if (this instanceof p5) {
            return new p5.Vector(this, arguments);
          } else {
            return new p5.Vector(x, y, z);
          }
        };
        module.exports = p5;
      }, {"../core/core": 42}],
      70: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var PERLIN_YWRAPB = 4;
        var PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
        var PERLIN_ZWRAPB = 8;
        var PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
        var PERLIN_SIZE = 4095;
        var perlin_octaves = 4;
        var perlin_amp_falloff = 0.5;
        var scaled_cosine = function(i) {
          return 0.5 * (1.0 - Math.cos(i * Math.PI));
        };
        var perlin;
        p5.prototype.noise = function(x, y, z) {
          y = y || 0;
          z = z || 0;
          if (perlin == null) {
            perlin = new Array(PERLIN_SIZE + 1);
            for (var i = 0; i < PERLIN_SIZE + 1; i++) {
              perlin[i] = Math.random();
            }
          }
          if (x < 0) {
            x = -x;
          }
          if (y < 0) {
            y = -y;
          }
          if (z < 0) {
            z = -z;
          }
          var xi = Math.floor(x),
              yi = Math.floor(y),
              zi = Math.floor(z);
          var xf = x - xi;
          var yf = y - yi;
          var zf = z - zi;
          var rxf,
              ryf;
          var r = 0;
          var ampl = 0.5;
          var n1,
              n2,
              n3;
          for (var o = 0; o < perlin_octaves; o++) {
            var of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);
            rxf = scaled_cosine(xf);
            ryf = scaled_cosine(yf);
            n1 = perlin[of & PERLIN_SIZE];
            n1 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n1);
            n2 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
            n2 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
            n1 += ryf * (n2 - n1);
            of += PERLIN_ZWRAP;
            n2 = perlin[of & PERLIN_SIZE];
            n2 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n2);
            n3 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
            n3 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
            n2 += ryf * (n3 - n2);
            n1 += scaled_cosine(zf) * (n2 - n1);
            r += n1 * ampl;
            ampl *= perlin_amp_falloff;
            xi <<= 1;
            xf *= 2;
            yi <<= 1;
            yf *= 2;
            zi <<= 1;
            zf *= 2;
            if (xf >= 1.0) {
              xi++;
              xf--;
            }
            if (yf >= 1.0) {
              yi++;
              yf--;
            }
            if (zf >= 1.0) {
              zi++;
              zf--;
            }
          }
          return r;
        };
        p5.prototype.noiseDetail = function(lod, falloff) {
          if (lod > 0) {
            perlin_octaves = lod;
          }
          if (falloff > 0) {
            perlin_amp_falloff = falloff;
          }
        };
        p5.prototype.noiseSeed = function(seed) {
          var lcg = (function() {
            var m = 4294967296,
                a = 1664525,
                c = 1013904223,
                seed,
                z;
            return {
              setSeed: function(val) {
                z = seed = (val == null ? Math.random() * m : val) >>> 0;
              },
              getSeed: function() {
                return seed;
              },
              rand: function() {
                z = (a * z + c) % m;
                return z / m;
              }
            };
          }());
          lcg.setSeed(seed);
          perlin = new Array(PERLIN_SIZE + 1);
          for (var i = 0; i < PERLIN_SIZE + 1; i++) {
            perlin[i] = lcg.rand();
          }
        };
        module.exports = p5;
      }, {"../core/core": 42}],
      71: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var polarGeometry = _dereq_('./polargeometry');
        var constants = _dereq_('../core/constants');
        p5.Vector = function() {
          var x,
              y,
              z;
          if (arguments[0] instanceof p5) {
            this.p5 = arguments[0];
            x = arguments[1][0] || 0;
            y = arguments[1][1] || 0;
            z = arguments[1][2] || 0;
          } else {
            x = arguments[0] || 0;
            y = arguments[1] || 0;
            z = arguments[2] || 0;
          }
          this.x = x;
          this.y = y;
          this.z = z;
        };
        p5.Vector.prototype.toString = function p5VectorToString() {
          return 'p5.Vector Object : [' + this.x + ', ' + this.y + ', ' + this.z + ']';
        };
        p5.Vector.prototype.set = function(x, y, z) {
          if (x instanceof p5.Vector) {
            this.x = x.x || 0;
            this.y = x.y || 0;
            this.z = x.z || 0;
            return this;
          }
          if (x instanceof Array) {
            this.x = x[0] || 0;
            this.y = x[1] || 0;
            this.z = x[2] || 0;
            return this;
          }
          this.x = x || 0;
          this.y = y || 0;
          this.z = z || 0;
          return this;
        };
        p5.Vector.prototype.copy = function() {
          if (this.p5) {
            return new p5.Vector(this.p5, [this.x, this.y, this.z]);
          } else {
            return new p5.Vector(this.x, this.y, this.z);
          }
        };
        p5.Vector.prototype.add = function(x, y, z) {
          if (x instanceof p5.Vector) {
            this.x += x.x || 0;
            this.y += x.y || 0;
            this.z += x.z || 0;
            return this;
          }
          if (x instanceof Array) {
            this.x += x[0] || 0;
            this.y += x[1] || 0;
            this.z += x[2] || 0;
            return this;
          }
          this.x += x || 0;
          this.y += y || 0;
          this.z += z || 0;
          return this;
        };
        p5.Vector.prototype.sub = function(x, y, z) {
          if (x instanceof p5.Vector) {
            this.x -= x.x || 0;
            this.y -= x.y || 0;
            this.z -= x.z || 0;
            return this;
          }
          if (x instanceof Array) {
            this.x -= x[0] || 0;
            this.y -= x[1] || 0;
            this.z -= x[2] || 0;
            return this;
          }
          this.x -= x || 0;
          this.y -= y || 0;
          this.z -= z || 0;
          return this;
        };
        p5.Vector.prototype.mult = function(n) {
          this.x *= n || 0;
          this.y *= n || 0;
          this.z *= n || 0;
          return this;
        };
        p5.Vector.prototype.div = function(n) {
          this.x /= n;
          this.y /= n;
          this.z /= n;
          return this;
        };
        p5.Vector.prototype.mag = function() {
          return Math.sqrt(this.magSq());
        };
        p5.Vector.prototype.magSq = function() {
          var x = this.x,
              y = this.y,
              z = this.z;
          return (x * x + y * y + z * z);
        };
        p5.Vector.prototype.dot = function(x, y, z) {
          if (x instanceof p5.Vector) {
            return this.dot(x.x, x.y, x.z);
          }
          return this.x * (x || 0) + this.y * (y || 0) + this.z * (z || 0);
        };
        p5.Vector.prototype.cross = function(v) {
          var x = this.y * v.z - this.z * v.y;
          var y = this.z * v.x - this.x * v.z;
          var z = this.x * v.y - this.y * v.x;
          if (this.p5) {
            return new p5.Vector(this.p5, [x, y, z]);
          } else {
            return new p5.Vector(x, y, z);
          }
        };
        p5.Vector.prototype.dist = function(v) {
          var d = v.copy().sub(this);
          return d.mag();
        };
        p5.Vector.prototype.normalize = function() {
          return this.mag() === 0 ? this : this.div(this.mag());
        };
        p5.Vector.prototype.limit = function(max) {
          var mSq = this.magSq();
          if (mSq > max * max) {
            this.div(Math.sqrt(mSq));
            this.mult(max);
          }
          return this;
        };
        p5.Vector.prototype.setMag = function(n) {
          return this.normalize().mult(n);
        };
        p5.Vector.prototype.heading = function() {
          var h = Math.atan2(this.y, this.x);
          if (this.p5) {
            if (this.p5._angleMode === constants.RADIANS) {
              return h;
            } else {
              return polarGeometry.radiansToDegrees(h);
            }
          } else {
            return h;
          }
        };
        p5.Vector.prototype.rotate = function(a) {
          var newHeading = this.heading() + a;
          if (this.p5) {
            if (this.p5._angleMode === constants.DEGREES) {
              newHeading = polarGeometry.degreesToRadians(newHeading);
            }
          }
          var mag = this.mag();
          this.x = Math.cos(newHeading) * mag;
          this.y = Math.sin(newHeading) * mag;
          return this;
        };
        p5.Vector.prototype.lerp = function(x, y, z, amt) {
          if (x instanceof p5.Vector) {
            return this.lerp(x.x, x.y, x.z, y);
          }
          this.x += (x - this.x) * amt || 0;
          this.y += (y - this.y) * amt || 0;
          this.z += (z - this.z) * amt || 0;
          return this;
        };
        p5.Vector.prototype.array = function() {
          return [this.x || 0, this.y || 0, this.z || 0];
        };
        p5.Vector.prototype.equals = function(x, y, z) {
          var a,
              b,
              c;
          if (x instanceof p5.Vector) {
            a = x.x || 0;
            b = x.y || 0;
            c = x.z || 0;
          } else if (x instanceof Array) {
            a = x[0] || 0;
            b = x[1] || 0;
            c = x[2] || 0;
          } else {
            a = x || 0;
            b = y || 0;
            c = z || 0;
          }
          return this.x === a && this.y === b && this.z === c;
        };
        p5.Vector.fromAngle = function(angle) {
          if (this.p5) {
            if (this.p5._angleMode === constants.DEGREES) {
              angle = polarGeometry.degreesToRadians(angle);
            }
          }
          if (this.p5) {
            return new p5.Vector(this.p5, [Math.cos(angle), Math.sin(angle), 0]);
          } else {
            return new p5.Vector(Math.cos(angle), Math.sin(angle), 0);
          }
        };
        p5.Vector.random2D = function() {
          var angle;
          if (this.p5) {
            if (this.p5._angleMode === constants.DEGREES) {
              angle = this.p5.random(360);
            } else {
              angle = this.p5.random(constants.TWO_PI);
            }
          } else {
            angle = Math.random() * Math.PI * 2;
          }
          return this.fromAngle(angle);
        };
        p5.Vector.random3D = function() {
          var angle,
              vz;
          if (this.p5) {
            angle = this.p5.random(0, constants.TWO_PI);
            vz = this.p5.random(-1, 1);
          } else {
            angle = Math.random() * Math.PI * 2;
            vz = Math.random() * 2 - 1;
          }
          var vx = Math.sqrt(1 - vz * vz) * Math.cos(angle);
          var vy = Math.sqrt(1 - vz * vz) * Math.sin(angle);
          if (this.p5) {
            return new p5.Vector(this.p5, [vx, vy, vz]);
          } else {
            return new p5.Vector(vx, vy, vz);
          }
        };
        p5.Vector.add = function(v1, v2, target) {
          if (!target) {
            target = v1.copy();
          } else {
            target.set(v1);
          }
          target.add(v2);
          return target;
        };
        p5.Vector.sub = function(v1, v2, target) {
          if (!target) {
            target = v1.copy();
          } else {
            target.set(v1);
          }
          target.sub(v2);
          return target;
        };
        p5.Vector.mult = function(v, n, target) {
          if (!target) {
            target = v.copy();
          } else {
            target.set(v);
          }
          target.mult(n);
          return target;
        };
        p5.Vector.div = function(v, n, target) {
          if (!target) {
            target = v.copy();
          } else {
            target.set(v);
          }
          target.div(n);
          return target;
        };
        p5.Vector.dot = function(v1, v2) {
          return v1.dot(v2);
        };
        p5.Vector.cross = function(v1, v2) {
          return v1.cross(v2);
        };
        p5.Vector.dist = function(v1, v2) {
          return v1.dist(v2);
        };
        p5.Vector.lerp = function(v1, v2, amt, target) {
          if (!target) {
            target = v1.copy();
          } else {
            target.set(v1);
          }
          target.lerp(v2, amt);
          return target;
        };
        p5.Vector.angleBetween = function(v1, v2) {
          var angle = Math.acos(v1.dot(v2) / (v1.mag() * v2.mag()));
          if (this.p5) {
            if (this.p5._angleMode === constants.DEGREES) {
              angle = polarGeometry.radiansToDegrees(angle);
            }
          }
          return angle;
        };
        p5.Vector.mag = function(vecT) {
          var x = vecT.x,
              y = vecT.y,
              z = vecT.z;
          var magSq = x * x + y * y + z * z;
          return Math.sqrt(magSq);
        };
        module.exports = p5.Vector;
      }, {
        "../core/constants": 41,
        "../core/core": 42,
        "./polargeometry": 72
      }],
      72: [function(_dereq_, module, exports) {
        module.exports = {
          degreesToRadians: function(x) {
            return 2 * Math.PI * x / 360;
          },
          radiansToDegrees: function(x) {
            return 360 * x / (2 * Math.PI);
          }
        };
      }, {}],
      73: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var seeded = false;
        var previous = false;
        var y2 = 0;
        var lcg = (function() {
          var m = 4294967296,
              a = 1664525,
              c = 1013904223,
              seed,
              z;
          return {
            setSeed: function(val) {
              z = seed = (val == null ? Math.random() * m : val) >>> 0;
            },
            getSeed: function() {
              return seed;
            },
            rand: function() {
              z = (a * z + c) % m;
              return z / m;
            }
          };
        }());
        p5.prototype.randomSeed = function(seed) {
          lcg.setSeed(seed);
          seeded = true;
          previous = false;
        };
        p5.prototype.random = function(min, max) {
          var rand;
          if (seeded) {
            rand = lcg.rand();
          } else {
            rand = Math.random();
          }
          if (typeof min === 'undefined') {
            return rand;
          } else if (typeof max === 'undefined') {
            if (min instanceof Array) {
              return min[Math.floor(rand * min.length)];
            } else {
              return rand * min;
            }
          } else {
            if (min > max) {
              var tmp = min;
              min = max;
              max = tmp;
            }
            return rand * (max - min) + min;
          }
        };
        p5.prototype.randomGaussian = function(mean, sd) {
          var y1,
              x1,
              x2,
              w;
          if (previous) {
            y1 = y2;
            previous = false;
          } else {
            do {
              x1 = this.random(2) - 1;
              x2 = this.random(2) - 1;
              w = x1 * x1 + x2 * x2;
            } while (w >= 1);
            w = Math.sqrt((-2 * Math.log(w)) / w);
            y1 = x1 * w;
            y2 = x2 * w;
            previous = true;
          }
          var m = mean || 0;
          var s = sd || 1;
          return y1 * s + m;
        };
        module.exports = p5;
      }, {"../core/core": 42}],
      74: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var polarGeometry = _dereq_('./polargeometry');
        var constants = _dereq_('../core/constants');
        p5.prototype._angleMode = constants.RADIANS;
        p5.prototype.acos = function(ratio) {
          if (this._angleMode === constants.RADIANS) {
            return Math.acos(ratio);
          } else {
            return polarGeometry.radiansToDegrees(Math.acos(ratio));
          }
        };
        p5.prototype.asin = function(ratio) {
          if (this._angleMode === constants.RADIANS) {
            return Math.asin(ratio);
          } else {
            return polarGeometry.radiansToDegrees(Math.asin(ratio));
          }
        };
        p5.prototype.atan = function(ratio) {
          if (this._angleMode === constants.RADIANS) {
            return Math.atan(ratio);
          } else {
            return polarGeometry.radiansToDegrees(Math.atan(ratio));
          }
        };
        p5.prototype.atan2 = function(y, x) {
          if (this._angleMode === constants.RADIANS) {
            return Math.atan2(y, x);
          } else {
            return polarGeometry.radiansToDegrees(Math.atan2(y, x));
          }
        };
        p5.prototype.cos = function(angle) {
          if (this._angleMode === constants.RADIANS) {
            return Math.cos(angle);
          } else {
            return Math.cos(this.radians(angle));
          }
        };
        p5.prototype.sin = function(angle) {
          if (this._angleMode === constants.RADIANS) {
            return Math.sin(angle);
          } else {
            return Math.sin(this.radians(angle));
          }
        };
        p5.prototype.tan = function(angle) {
          if (this._angleMode === constants.RADIANS) {
            return Math.tan(angle);
          } else {
            return Math.tan(this.radians(angle));
          }
        };
        p5.prototype.degrees = function(angle) {
          return polarGeometry.radiansToDegrees(angle);
        };
        p5.prototype.radians = function(angle) {
          return polarGeometry.degreesToRadians(angle);
        };
        p5.prototype.angleMode = function(mode) {
          if (mode === constants.DEGREES || mode === constants.RADIANS) {
            this._angleMode = mode;
          }
        };
        module.exports = p5;
      }, {
        "../core/constants": 41,
        "../core/core": 42,
        "./polargeometry": 72
      }],
      75: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.prototype.textAlign = function(horizAlign, vertAlign) {
          return this._renderer.textAlign.apply(this._renderer, arguments);
        };
        p5.prototype.textLeading = function(theLeading) {
          return this._renderer.textLeading.apply(this._renderer, arguments);
        };
        p5.prototype.textSize = function(theSize) {
          return this._renderer.textSize.apply(this._renderer, arguments);
        };
        p5.prototype.textStyle = function(theStyle) {
          return this._renderer.textStyle.apply(this._renderer, arguments);
        };
        p5.prototype.textWidth = function(theText) {
          if (theText.length === 0) {
            return 0;
          }
          return this._renderer.textWidth.apply(this._renderer, arguments);
        };
        p5.prototype.textAscent = function() {
          return this._renderer.textAscent();
        };
        p5.prototype.textDescent = function() {
          return this._renderer.textDescent();
        };
        p5.prototype._updateTextMetrics = function() {
          return this._renderer._updateTextMetrics();
        };
        module.exports = p5;
      }, {"../core/core": 42}],
      76: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var constants = _dereq_('../core/constants');
        _dereq_('../core/error_helpers');
        p5.prototype.text = function(str, x, y, maxWidth, maxHeight) {
          return (!(this._renderer._doFill || this._renderer._doStroke)) ? this : this._renderer.text.apply(this._renderer, arguments);
        };
        p5.prototype.textFont = function(theFont, theSize) {
          if (arguments.length) {
            if (!theFont) {
              throw Error('null font passed to textFont');
            }
            this._renderer._setProperty('_textFont', theFont);
            if (theSize) {
              this._renderer._setProperty('_textSize', theSize);
              this._renderer._setProperty('_textLeading', theSize * constants._DEFAULT_LEADMULT);
            }
            return this._renderer._applyTextProperties();
          }
          return this._renderer._textFont;
        };
        module.exports = p5;
      }, {
        "../core/constants": 41,
        "../core/core": 42,
        "../core/error_helpers": 45
      }],
      77: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var constants = _dereq_('../core/constants');
        p5.Font = function(p) {
          this.parent = p;
          this.cache = {};
          this.font = undefined;
        };
        p5.Font.prototype.list = function() {
          throw 'not yet implemented';
        };
        p5.Font.prototype.textBounds = function(str, x, y, fontSize, options) {
          x = x !== undefined ? x : 0;
          y = y !== undefined ? y : 0;
          fontSize = fontSize || this.parent._renderer._textSize;
          var p = (options && options.renderer && options.renderer._pInst) || this.parent,
              ctx = p._renderer.drawingContext,
              alignment = ctx.textAlign || constants.LEFT,
              baseline = ctx.textBaseline || constants.BASELINE;
          var result = this.cache[cacheKey('textBounds', str, x, y, fontSize, alignment, baseline)];
          if (!result) {
            var xCoords = [],
                yCoords = [],
                self = this,
                scale = this._scale(fontSize),
                minX,
                minY,
                maxX,
                maxY;
            this.font.forEachGlyph(str, x, y, fontSize, options, function(glyph, gX, gY, gFontSize) {
              xCoords.push(gX);
              yCoords.push(gY);
              var gm = glyph.getMetrics();
              if (glyph.name !== 'space' && glyph.unicode !== 32) {
                xCoords.push(gX + (gm.xMax * scale));
                yCoords.push(gY + (-gm.yMin * scale));
                yCoords.push(gY + (-gm.yMax * scale));
              } else {
                xCoords.push(gX + self.font.charToGlyph(' ').advanceWidth * self._scale(fontSize));
              }
            });
            minX = Math.min.apply(null, xCoords);
            minY = Math.min.apply(null, yCoords);
            maxX = Math.max.apply(null, xCoords);
            maxY = Math.max.apply(null, yCoords);
            result = {
              x: minX,
              y: minY,
              h: maxY - minY,
              w: maxX - minX,
              advance: minX - x
            };
            var textWidth = result.w + result.advance;
            var pos = this._handleAlignment(p, ctx, str, result.x, result.y, textWidth);
            result.x = pos.x;
            result.y = pos.y;
            this.cache[cacheKey('textBounds', str, x, y, fontSize, alignment, baseline)] = result;
          }
          return result;
        };
        p5.Font.prototype.textToPoints = function(txt, x, y, fontSize, options) {
          var xoff = 0,
              result = [],
              glyphs = this._getGlyphs(txt);
          fontSize = fontSize || this.parent._renderer._textSize;
          for (var i = 0; i < glyphs.length; i++) {
            if (glyphs[i].name !== 'space') {
              var gpath = glyphs[i].getPath(x, y, fontSize),
                  paths = splitPaths(gpath.commands);
              for (var j = 0; j < paths.length; j++) {
                var pts = pathToPoints(paths[j], options);
                for (var k = 0; k < pts.length; k++) {
                  pts[k].x += xoff;
                  result.push(pts[k]);
                }
              }
            }
            xoff += glyphs[i].advanceWidth * this._scale(fontSize);
          }
          return result;
        };
        p5.Font.prototype._getGlyphs = function(str) {
          return this.font.stringToGlyphs(str);
        };
        p5.Font.prototype._getPath = function(line, x, y, options) {
          var p = (options && options.renderer && options.renderer._pInst) || this.parent,
              ctx = p._renderer.drawingContext,
              pos = this._handleAlignment(p, ctx, line, x, y);
          return this.font.getPath(line, pos.x, pos.y, p._renderer._textSize, options);
        };
        p5.Font.prototype._getPathData = function(line, x, y, options) {
          var decimals = 3;
          if (typeof line === 'string' && arguments.length > 2) {
            line = this._getPath(line, x, y, options);
          } else if (typeof x === 'object') {
            options = x;
          }
          if (options && typeof options.decimals === 'number') {
            decimals = options.decimals;
          }
          return line.toPathData(decimals);
        };
        p5.Font.prototype._getSVG = function(line, x, y, options) {
          var decimals = 3;
          if (typeof line === 'string' && arguments.length > 2) {
            line = this._getPath(line, x, y, options);
          } else if (typeof x === 'object') {
            options = x;
          }
          if (options) {
            if (typeof options.decimals === 'number') {
              decimals = options.decimals;
            }
            if (typeof options.strokeWidth === 'number') {
              line.strokeWidth = options.strokeWidth;
            }
            if (typeof options.fill !== 'undefined') {
              line.fill = options.fill;
            }
            if (typeof options.stroke !== 'undefined') {
              line.stroke = options.stroke;
            }
          }
          return line.toSVG(decimals);
        };
        p5.Font.prototype._renderPath = function(line, x, y, options) {
          var pdata,
              pg = (options && options.renderer) || this.parent._renderer,
              ctx = pg.drawingContext;
          if (typeof line === 'object' && line.commands) {
            pdata = line.commands;
          } else {
            pdata = this._getPath(line, x, y, options).commands;
          }
          ctx.beginPath();
          for (var i = 0; i < pdata.length; i += 1) {
            var cmd = pdata[i];
            if (cmd.type === 'M') {
              ctx.moveTo(cmd.x, cmd.y);
            } else if (cmd.type === 'L') {
              ctx.lineTo(cmd.x, cmd.y);
            } else if (cmd.type === 'C') {
              ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
            } else if (cmd.type === 'Q') {
              ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
            } else if (cmd.type === 'Z') {
              ctx.closePath();
            }
          }
          if (pg._doStroke && pg._strokeSet) {
            ctx.stroke();
          }
          if (pg._doFill) {
            ctx.fillStyle = pg._fillSet ? ctx.fillStyle : constants._DEFAULT_TEXT_FILL;
            ctx.fill();
          }
          return this;
        };
        p5.Font.prototype._textWidth = function(str, fontSize) {
          if (str === ' ') {
            return this.font.charToGlyph(' ').advanceWidth * this._scale(fontSize);
          }
          var bounds = this.textBounds(str, 0, 0, fontSize);
          return bounds.w + bounds.advance;
        };
        p5.Font.prototype._textAscent = function(fontSize) {
          return this.font.ascender * this._scale(fontSize);
        };
        p5.Font.prototype._textDescent = function(fontSize) {
          return -this.font.descender * this._scale(fontSize);
        };
        p5.Font.prototype._scale = function(fontSize) {
          return (1 / this.font.unitsPerEm) * (fontSize || this.parent._renderer._textSize);
        };
        p5.Font.prototype._handleAlignment = function(p, ctx, line, x, y, textWidth) {
          var fontSize = p._renderer._textSize,
              textAscent = this._textAscent(fontSize),
              textDescent = this._textDescent(fontSize);
          textWidth = textWidth !== undefined ? textWidth : this._textWidth(line, fontSize);
          if (ctx.textAlign === constants.CENTER) {
            x -= textWidth / 2;
          } else if (ctx.textAlign === constants.RIGHT) {
            x -= textWidth;
          }
          if (ctx.textBaseline === constants.TOP) {
            y += textAscent;
          } else if (ctx.textBaseline === constants._CTX_MIDDLE) {
            y += textAscent / 2;
          } else if (ctx.textBaseline === constants.BOTTOM) {
            y -= textDescent;
          }
          return {
            x: x,
            y: y
          };
        };
        function pathToPoints(cmds, options) {
          var opts = parseOpts(options, {
            sampleFactor: 0.1,
            simplifyThreshold: 0
          });
          var len = pointAtLength(cmds, 0, 1),
              t = len / (len * opts.sampleFactor),
              pts = [];
          for (var i = 0; i < len; i += t) {
            pts.push(pointAtLength(cmds, i));
          }
          if (opts.simplifyThreshold) {
            simplify(pts, opts.simplifyThreshold);
          }
          return pts;
        }
        function simplify(pts, angle) {
          angle = (typeof angle === 'undefined') ? 0 : angle;
          var num = 0;
          for (var i = pts.length - 1; pts.length > 3 && i >= 0; --i) {
            if (collinear(at(pts, i - 1), at(pts, i), at(pts, i + 1), angle)) {
              pts.splice(i % pts.length, 1);
              num++;
            }
          }
          return num;
        }
        function splitPaths(cmds) {
          var paths = [],
              current;
          for (var i = 0; i < cmds.length; i++) {
            if (cmds[i].type === 'M') {
              if (current) {
                paths.push(current);
              }
              current = [];
            }
            current.push(cmdToArr(cmds[i]));
          }
          paths.push(current);
          return paths;
        }
        function cmdToArr(cmd) {
          var arr = [cmd.type];
          if (cmd.type === 'M' || cmd.type === 'L') {
            arr.push(cmd.x, cmd.y);
          } else if (cmd.type === 'C') {
            arr.push(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
          } else if (cmd.type === 'Q') {
            arr.push(cmd.x1, cmd.y1, cmd.x, cmd.y);
          }
          return arr;
        }
        function parseOpts(options, defaults) {
          if (typeof options !== 'object') {
            options = defaults;
          } else {
            for (var key in defaults) {
              if (typeof options[key] === 'undefined') {
                options[key] = defaults[key];
              }
            }
          }
          return options;
        }
        function at(v, i) {
          var s = v.length;
          return v[i < 0 ? i % s + s : i % s];
        }
        function collinear(a, b, c, thresholdAngle) {
          if (!thresholdAngle) {
            return areaTriangle(a, b, c) === 0;
          }
          if (typeof collinear.tmpPoint1 === 'undefined') {
            collinear.tmpPoint1 = [];
            collinear.tmpPoint2 = [];
          }
          var ab = collinear.tmpPoint1,
              bc = collinear.tmpPoint2;
          ab.x = b.x - a.x;
          ab.y = b.y - a.y;
          bc.x = c.x - b.x;
          bc.y = c.y - b.y;
          var dot = ab.x * bc.x + ab.y * bc.y,
              magA = Math.sqrt(ab.x * ab.x + ab.y * ab.y),
              magB = Math.sqrt(bc.x * bc.x + bc.y * bc.y),
              angle = Math.acos(dot / (magA * magB));
          return angle < thresholdAngle;
        }
        function areaTriangle(a, b, c) {
          return (((b[0] - a[0]) * (c[1] - a[1])) - ((c[0] - a[0]) * (b[1] - a[1])));
        }
        function findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
          var t1 = 1 - t,
              t13 = Math.pow(t1, 3),
              t12 = Math.pow(t1, 2),
              t2 = t * t,
              t3 = t2 * t,
              x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x,
              y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y,
              mx = p1x + 2 * t * (c1x - p1x) + t2 * (c2x - 2 * c1x + p1x),
              my = p1y + 2 * t * (c1y - p1y) + t2 * (c2y - 2 * c1y + p1y),
              nx = c1x + 2 * t * (c2x - c1x) + t2 * (p2x - 2 * c2x + c1x),
              ny = c1y + 2 * t * (c2y - c1y) + t2 * (p2y - 2 * c2y + c1y),
              ax = t1 * p1x + t * c1x,
              ay = t1 * p1y + t * c1y,
              cx = t1 * c2x + t * p2x,
              cy = t1 * c2y + t * p2y,
              alpha = (90 - Math.atan2(mx - nx, my - ny) * 180 / Math.PI);
          if (mx > nx || my < ny) {
            alpha += 180;
          }
          return {
            x: x,
            y: y,
            m: {
              x: mx,
              y: my
            },
            n: {
              x: nx,
              y: ny
            },
            start: {
              x: ax,
              y: ay
            },
            end: {
              x: cx,
              y: cy
            },
            alpha: alpha
          };
        }
        function getPointAtSegmentLength(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length) {
          return (length == null) ? bezlen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) : findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, getTatLen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length));
        }
        function pointAtLength(path, length, istotal) {
          path = path2curve(path);
          var x,
              y,
              p,
              l,
              sp = '',
              subpaths = {},
              point,
              len = 0;
          for (var i = 0,
              ii = path.length; i < ii; i++) {
            p = path[i];
            if (p[0] === 'M') {
              x = +p[1];
              y = +p[2];
            } else {
              l = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
              if (len + l > length) {
                if (!istotal) {
                  point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                  return {
                    x: point.x,
                    y: point.y,
                    alpha: point.alpha
                  };
                }
              }
              len += l;
              x = +p[5];
              y = +p[6];
            }
            sp += p.shift() + p;
          }
          subpaths.end = sp;
          point = istotal ? len : findDotsAtSegment(x, y, p[0], p[1], p[2], p[3], p[4], p[5], 1);
          if (point.alpha) {
            point = {
              x: point.x,
              y: point.y,
              alpha: point.alpha
            };
          }
          return point;
        }
        function pathToAbsolute(pathArray) {
          var res = [],
              x = 0,
              y = 0,
              mx = 0,
              my = 0,
              start = 0;
          if (pathArray[0][0] === 'M') {
            x = +pathArray[0][1];
            y = +pathArray[0][2];
            mx = x;
            my = y;
            start++;
            res[0] = ['M', x, y];
          }
          var dots,
              crz = pathArray.length === 3 && pathArray[0][0] === 'M' && pathArray[1][0].toUpperCase() === 'R' && pathArray[2][0].toUpperCase() === 'Z';
          for (var r,
              pa,
              i = start,
              ii = pathArray.length; i < ii; i++) {
            res.push(r = []);
            pa = pathArray[i];
            if (pa[0] !== String.prototype.toUpperCase.call(pa[0])) {
              r[0] = String.prototype.toUpperCase.call(pa[0]);
              switch (r[0]) {
                case 'A':
                  r[1] = pa[1];
                  r[2] = pa[2];
                  r[3] = pa[3];
                  r[4] = pa[4];
                  r[5] = pa[5];
                  r[6] = +(pa[6] + x);
                  r[7] = +(pa[7] + y);
                  break;
                case 'V':
                  r[1] = +pa[1] + y;
                  break;
                case 'H':
                  r[1] = +pa[1] + x;
                  break;
                case 'R':
                  dots = [x, y].concat(pa.slice(1));
                  for (var j = 2,
                      jj = dots.length; j < jj; j++) {
                    dots[j] = +dots[j] + x;
                    dots[++j] = +dots[j] + y;
                  }
                  res.pop();
                  res = res.concat(catmullRom2bezier(dots, crz));
                  break;
                case 'M':
                  mx = +pa[1] + x;
                  my = +pa[2] + y;
                  break;
                default:
                  for (j = 1, jj = pa.length; j < jj; j++) {
                    r[j] = +pa[j] + ((j % 2) ? x : y);
                  }
              }
            } else if (pa[0] === 'R') {
              dots = [x, y].concat(pa.slice(1));
              res.pop();
              res = res.concat(catmullRom2bezier(dots, crz));
              r = ['R'].concat(pa.slice(-2));
            } else {
              for (var k = 0,
                  kk = pa.length; k < kk; k++) {
                r[k] = pa[k];
              }
            }
            switch (r[0]) {
              case 'Z':
                x = mx;
                y = my;
                break;
              case 'H':
                x = r[1];
                break;
              case 'V':
                y = r[1];
                break;
              case 'M':
                mx = r[r.length - 2];
                my = r[r.length - 1];
                break;
              default:
                x = r[r.length - 2];
                y = r[r.length - 1];
            }
          }
          return res;
        }
        function path2curve(path, path2) {
          var p = pathToAbsolute(path),
              p2 = path2 && pathToAbsolute(path2),
              attrs = {
                x: 0,
                y: 0,
                bx: 0,
                by: 0,
                X: 0,
                Y: 0,
                qx: null,
                qy: null
              },
              attrs2 = {
                x: 0,
                y: 0,
                bx: 0,
                by: 0,
                X: 0,
                Y: 0,
                qx: null,
                qy: null
              },
              processPath = function(path, d, pcom) {
                var nx,
                    ny,
                    tq = {
                      T: 1,
                      Q: 1
                    };
                if (!path) {
                  return ['C', d.x, d.y, d.x, d.y, d.x, d.y];
                }
                if (!(path[0] in tq)) {
                  d.qx = d.qy = null;
                }
                switch (path[0]) {
                  case 'M':
                    d.X = path[1];
                    d.Y = path[2];
                    break;
                  case 'A':
                    path = ['C'].concat(a2c.apply(0, [d.x, d.y].concat(path.slice(1))));
                    break;
                  case 'S':
                    if (pcom === 'C' || pcom === 'S') {
                      nx = d.x * 2 - d.bx;
                      ny = d.y * 2 - d.by;
                    } else {
                      nx = d.x;
                      ny = d.y;
                    }
                    path = ['C', nx, ny].concat(path.slice(1));
                    break;
                  case 'T':
                    if (pcom === 'Q' || pcom === 'T') {
                      d.qx = d.x * 2 - d.qx;
                      d.qy = d.y * 2 - d.qy;
                    } else {
                      d.qx = d.x;
                      d.qy = d.y;
                    }
                    path = ['C'].concat(q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
                    break;
                  case 'Q':
                    d.qx = path[1];
                    d.qy = path[2];
                    path = ['C'].concat(q2c(d.x, d.y, path[1], path[2], path[3], path[4]));
                    break;
                  case 'L':
                    path = ['C'].concat(l2c(d.x, d.y, path[1], path[2]));
                    break;
                  case 'H':
                    path = ['C'].concat(l2c(d.x, d.y, path[1], d.y));
                    break;
                  case 'V':
                    path = ['C'].concat(l2c(d.x, d.y, d.x, path[1]));
                    break;
                  case 'Z':
                    path = ['C'].concat(l2c(d.x, d.y, d.X, d.Y));
                    break;
                }
                return path;
              },
              fixArc = function(pp, i) {
                if (pp[i].length > 7) {
                  pp[i].shift();
                  var pi = pp[i];
                  while (pi.length) {
                    pcoms1[i] = 'A';
                    if (p2) {
                      pcoms2[i] = 'A';
                    }
                    pp.splice(i++, 0, ['C'].concat(pi.splice(0, 6)));
                  }
                  pp.splice(i, 1);
                  ii = Math.max(p.length, p2 && p2.length || 0);
                }
              },
              fixM = function(path1, path2, a1, a2, i) {
                if (path1 && path2 && path1[i][0] === 'M' && path2[i][0] !== 'M') {
                  path2.splice(i, 0, ['M', a2.x, a2.y]);
                  a1.bx = 0;
                  a1.by = 0;
                  a1.x = path1[i][1];
                  a1.y = path1[i][2];
                  ii = Math.max(p.length, p2 && p2.length || 0);
                }
              },
              pcoms1 = [],
              pcoms2 = [],
              pfirst = '',
              pcom = '';
          for (var i = 0,
              ii = Math.max(p.length, p2 && p2.length || 0); i < ii; i++) {
            if (p[i]) {
              pfirst = p[i][0];
            }
            if (pfirst !== 'C') {
              pcoms1[i] = pfirst;
              if (i) {
                pcom = pcoms1[i - 1];
              }
            }
            p[i] = processPath(p[i], attrs, pcom);
            if (pcoms1[i] !== 'A' && pfirst === 'C') {
              pcoms1[i] = 'C';
            }
            fixArc(p, i);
            if (p2) {
              if (p2[i]) {
                pfirst = p2[i][0];
              }
              if (pfirst !== 'C') {
                pcoms2[i] = pfirst;
                if (i) {
                  pcom = pcoms2[i - 1];
                }
              }
              p2[i] = processPath(p2[i], attrs2, pcom);
              if (pcoms2[i] !== 'A' && pfirst === 'C') {
                pcoms2[i] = 'C';
              }
              fixArc(p2, i);
            }
            fixM(p, p2, attrs, attrs2, i);
            fixM(p2, p, attrs2, attrs, i);
            var seg = p[i],
                seg2 = p2 && p2[i],
                seglen = seg.length,
                seg2len = p2 && seg2.length;
            attrs.x = seg[seglen - 2];
            attrs.y = seg[seglen - 1];
            attrs.bx = parseFloat(seg[seglen - 4]) || attrs.x;
            attrs.by = parseFloat(seg[seglen - 3]) || attrs.y;
            attrs2.bx = p2 && (parseFloat(seg2[seg2len - 4]) || attrs2.x);
            attrs2.by = p2 && (parseFloat(seg2[seg2len - 3]) || attrs2.y);
            attrs2.x = p2 && seg2[seg2len - 2];
            attrs2.y = p2 && seg2[seg2len - 1];
          }
          return p2 ? [p, p2] : p;
        }
        function a2c(x1, y1, rx, ry, angle, lac, sweep_flag, x2, y2, recursive) {
          var PI = Math.PI,
              _120 = PI * 120 / 180,
              f1,
              f2,
              cx,
              cy,
              rad = PI / 180 * (+angle || 0),
              res = [],
              xy,
              rotate = function(x, y, rad) {
                var X = x * Math.cos(rad) - y * Math.sin(rad),
                    Y = x * Math.sin(rad) + y * Math.cos(rad);
                return {
                  x: X,
                  y: Y
                };
              };
          if (!recursive) {
            xy = rotate(x1, y1, -rad);
            x1 = xy.x;
            y1 = xy.y;
            xy = rotate(x2, y2, -rad);
            x2 = xy.x;
            y2 = xy.y;
            var x = (x1 - x2) / 2,
                y = (y1 - y2) / 2,
                h = (x * x) / (rx * rx) + (y * y) / (ry * ry);
            if (h > 1) {
              h = Math.sqrt(h);
              rx = h * rx;
              ry = h * ry;
            }
            var rx2 = rx * rx,
                ry2 = ry * ry,
                k = (lac === sweep_flag ? -1 : 1) * Math.sqrt(Math.abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x)));
            cx = k * rx * y / ry + (x1 + x2) / 2;
            cy = k * -ry * x / rx + (y1 + y2) / 2;
            f1 = Math.asin(((y1 - cy) / ry).toFixed(9));
            f2 = Math.asin(((y2 - cy) / ry).toFixed(9));
            f1 = x1 < cx ? PI - f1 : f1;
            f2 = x2 < cx ? PI - f2 : f2;
            if (f1 < 0) {
              f1 = PI * 2 + f1;
            }
            if (f2 < 0) {
              f2 = PI * 2 + f2;
            }
            if (sweep_flag && f1 > f2) {
              f1 = f1 - PI * 2;
            }
            if (!sweep_flag && f2 > f1) {
              f2 = f2 - PI * 2;
            }
          } else {
            f1 = recursive[0];
            f2 = recursive[1];
            cx = recursive[2];
            cy = recursive[3];
          }
          var df = f2 - f1;
          if (Math.abs(df) > _120) {
            var f2old = f2,
                x2old = x2,
                y2old = y2;
            f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
            x2 = cx + rx * Math.cos(f2);
            y2 = cy + ry * Math.sin(f2);
            res = a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [f2, f2old, cx, cy]);
          }
          df = f2 - f1;
          var c1 = Math.cos(f1),
              s1 = Math.sin(f1),
              c2 = Math.cos(f2),
              s2 = Math.sin(f2),
              t = Math.tan(df / 4),
              hx = 4 / 3 * rx * t,
              hy = 4 / 3 * ry * t,
              m1 = [x1, y1],
              m2 = [x1 + hx * s1, y1 - hy * c1],
              m3 = [x2 + hx * s2, y2 - hy * c2],
              m4 = [x2, y2];
          m2[0] = 2 * m1[0] - m2[0];
          m2[1] = 2 * m1[1] - m2[1];
          if (recursive) {
            return [m2, m3, m4].concat(res);
          } else {
            res = [m2, m3, m4].concat(res).join().split(',');
            var newres = [];
            for (var i = 0,
                ii = res.length; i < ii; i++) {
              newres[i] = i % 2 ? rotate(res[i - 1], res[i], rad).y : rotate(res[i], res[i + 1], rad).x;
            }
            return newres;
          }
        }
        function catmullRom2bezier(crp, z) {
          var d = [];
          for (var i = 0,
              iLen = crp.length; iLen - 2 * !z > i; i += 2) {
            var p = [{
              x: +crp[i - 2],
              y: +crp[i - 1]
            }, {
              x: +crp[i],
              y: +crp[i + 1]
            }, {
              x: +crp[i + 2],
              y: +crp[i + 3]
            }, {
              x: +crp[i + 4],
              y: +crp[i + 5]
            }];
            if (z) {
              if (!i) {
                p[0] = {
                  x: +crp[iLen - 2],
                  y: +crp[iLen - 1]
                };
              } else if (iLen - 4 === i) {
                p[3] = {
                  x: +crp[0],
                  y: +crp[1]
                };
              } else if (iLen - 2 === i) {
                p[2] = {
                  x: +crp[0],
                  y: +crp[1]
                };
                p[3] = {
                  x: +crp[2],
                  y: +crp[3]
                };
              }
            } else {
              if (iLen - 4 === i) {
                p[3] = p[2];
              } else if (!i) {
                p[0] = {
                  x: +crp[i],
                  y: +crp[i + 1]
                };
              }
            }
            d.push(['C', (-p[0].x + 6 * p[1].x + p[2].x) / 6, (-p[0].y + 6 * p[1].y + p[2].y) / 6, (p[1].x + 6 * p[2].x - p[3].x) / 6, (p[1].y + 6 * p[2].y - p[3].y) / 6, p[2].x, p[2].y]);
          }
          return d;
        }
        function l2c(x1, y1, x2, y2) {
          return [x1, y1, x2, y2, x2, y2];
        }
        function q2c(x1, y1, ax, ay, x2, y2) {
          var _13 = 1 / 3,
              _23 = 2 / 3;
          return [_13 * x1 + _23 * ax, _13 * y1 + _23 * ay, _13 * x2 + _23 * ax, _13 * y2 + _23 * ay, x2, y2];
        }
        function bezlen(x1, y1, x2, y2, x3, y3, x4, y4, z) {
          if (z == null) {
            z = 1;
          }
          z = z > 1 ? 1 : z < 0 ? 0 : z;
          var z2 = z / 2,
              n = 12,
              Tvalues = [-0.1252, 0.1252, -0.3678, 0.3678, -0.5873, 0.5873, -0.7699, 0.7699, -0.9041, 0.9041, -0.9816, 0.9816],
              sum = 0,
              Cvalues = [0.2491, 0.2491, 0.2335, 0.2335, 0.2032, 0.2032, 0.1601, 0.1601, 0.1069, 0.1069, 0.0472, 0.0472];
          for (var i = 0; i < n; i++) {
            var ct = z2 * Tvalues[i] + z2,
                xbase = base3(ct, x1, x2, x3, x4),
                ybase = base3(ct, y1, y2, y3, y4),
                comb = xbase * xbase + ybase * ybase;
            sum += Cvalues[i] * Math.sqrt(comb);
          }
          return z2 * sum;
        }
        function getTatLen(x1, y1, x2, y2, x3, y3, x4, y4, ll) {
          if (ll < 0 || bezlen(x1, y1, x2, y2, x3, y3, x4, y4) < ll) {
            return;
          }
          var t = 1,
              step = t / 2,
              t2 = t - step,
              l,
              e = 0.01;
          l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
          while (Math.abs(l - ll) > e) {
            step /= 2;
            t2 += (l < ll ? 1 : -1) * step;
            l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
          }
          return t2;
        }
        function base3(t, p1, p2, p3, p4) {
          var t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4,
              t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
          return t * t2 - 3 * p1 + 3 * p2;
        }
        function cacheKey() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          i = args.length;
          var hash = '';
          while (i--) {
            hash += (args[i] === Object(args[i])) ? JSON.stringify(args[i]) : args[i];
          }
          return hash;
        }
        module.exports = p5.Font;
      }, {
        "../core/constants": 41,
        "../core/core": 42
      }],
      78: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.prototype.append = function(array, value) {
          array.push(value);
          return array;
        };
        p5.prototype.arrayCopy = function(src, srcPosition, dst, dstPosition, length) {
          var start,
              end;
          if (typeof length !== 'undefined') {
            end = Math.min(length, src.length);
            start = dstPosition;
            src = src.slice(srcPosition, end + srcPosition);
          } else {
            if (typeof dst !== 'undefined') {
              end = dst;
              end = Math.min(end, src.length);
            } else {
              end = src.length;
            }
            start = 0;
            dst = srcPosition;
            src = src.slice(0, end);
          }
          Array.prototype.splice.apply(dst, [start, end].concat(src));
        };
        p5.prototype.concat = function(list0, list1) {
          return list0.concat(list1);
        };
        p5.prototype.reverse = function(list) {
          return list.reverse();
        };
        p5.prototype.shorten = function(list) {
          list.pop();
          return list;
        };
        p5.prototype.shuffle = function(arr, bool) {
          var isView = ArrayBuffer && ArrayBuffer.isView && ArrayBuffer.isView(arr);
          arr = bool || isView ? arr : arr.slice();
          var rnd,
              tmp,
              idx = arr.length;
          while (idx > 1) {
            rnd = Math.random() * idx | 0;
            tmp = arr[--idx];
            arr[idx] = arr[rnd];
            arr[rnd] = tmp;
          }
          return arr;
        };
        p5.prototype.sort = function(list, count) {
          var arr = count ? list.slice(0, Math.min(count, list.length)) : list;
          var rest = count ? list.slice(Math.min(count, list.length)) : [];
          if (typeof arr[0] === 'string') {
            arr = arr.sort();
          } else {
            arr = arr.sort(function(a, b) {
              return a - b;
            });
          }
          return arr.concat(rest);
        };
        p5.prototype.splice = function(list, value, index) {
          Array.prototype.splice.apply(list, [index, 0].concat(value));
          return list;
        };
        p5.prototype.subset = function(list, start, count) {
          if (typeof count !== 'undefined') {
            return list.slice(start, start + count);
          } else {
            return list.slice(start, list.length);
          }
        };
        module.exports = p5;
      }, {"../core/core": 42}],
      79: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.prototype.float = function(str) {
          if (str instanceof Array) {
            return str.map(parseFloat);
          }
          return parseFloat(str);
        };
        p5.prototype.int = function(n, radix) {
          radix = radix || 10;
          if (typeof n === 'string') {
            return parseInt(n, radix);
          } else if (typeof n === 'number') {
            return n | 0;
          } else if (typeof n === 'boolean') {
            return n ? 1 : 0;
          } else if (n instanceof Array) {
            return n.map(function(n) {
              return p5.prototype.int(n, radix);
            });
          }
        };
        p5.prototype.str = function(n) {
          if (n instanceof Array) {
            return n.map(p5.prototype.str);
          } else {
            return String(n);
          }
        };
        p5.prototype.boolean = function(n) {
          if (typeof n === 'number') {
            return n !== 0;
          } else if (typeof n === 'string') {
            return n.toLowerCase() === 'true';
          } else if (typeof n === 'boolean') {
            return n;
          } else if (n instanceof Array) {
            return n.map(p5.prototype.boolean);
          }
        };
        p5.prototype.byte = function(n) {
          var nn = p5.prototype.int(n, 10);
          if (typeof nn === 'number') {
            return ((nn + 128) % 256) - 128;
          } else if (nn instanceof Array) {
            return nn.map(p5.prototype.byte);
          }
        };
        p5.prototype.char = function(n) {
          if (typeof n === 'number' && !isNaN(n)) {
            return String.fromCharCode(n);
          } else if (n instanceof Array) {
            return n.map(p5.prototype.char);
          } else if (typeof n === 'string') {
            return p5.prototype.char(parseInt(n, 10));
          }
        };
        p5.prototype.unchar = function(n) {
          if (typeof n === 'string' && n.length === 1) {
            return n.charCodeAt(0);
          } else if (n instanceof Array) {
            return n.map(p5.prototype.unchar);
          }
        };
        p5.prototype.hex = function(n, digits) {
          digits = (digits === undefined || digits === null) ? digits = 8 : digits;
          if (n instanceof Array) {
            return n.map(function(n) {
              return p5.prototype.hex(n, digits);
            });
          } else if (typeof n === 'number') {
            if (n < 0) {
              n = 0xFFFFFFFF + n + 1;
            }
            var hex = Number(n).toString(16).toUpperCase();
            while (hex.length < digits) {
              hex = '0' + hex;
            }
            if (hex.length >= digits) {
              hex = hex.substring(hex.length - digits, hex.length);
            }
            return hex;
          }
        };
        p5.prototype.unhex = function(n) {
          if (n instanceof Array) {
            return n.map(p5.prototype.unhex);
          } else {
            return parseInt('0x' + n, 16);
          }
        };
        module.exports = p5;
      }, {"../core/core": 42}],
      80: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.prototype.join = function(list, separator) {
          return list.join(separator);
        };
        p5.prototype.match = function(str, reg) {
          return str.match(reg);
        };
        p5.prototype.matchAll = function(str, reg) {
          var re = new RegExp(reg, 'g');
          var match = re.exec(str);
          var matches = [];
          while (match !== null) {
            matches.push(match);
            match = re.exec(str);
          }
          return matches;
        };
        p5.prototype.nf = function() {
          if (arguments[0] instanceof Array) {
            var a = arguments[1];
            var b = arguments[2];
            return arguments[0].map(function(x) {
              return doNf(x, a, b);
            });
          } else {
            var typeOfFirst = Object.prototype.toString.call(arguments[0]);
            if (typeOfFirst === '[object Arguments]') {
              if (arguments[0].length === 3) {
                return this.nf(arguments[0][0], arguments[0][1], arguments[0][2]);
              } else if (arguments[0].length === 2) {
                return this.nf(arguments[0][0], arguments[0][1]);
              } else {
                return this.nf(arguments[0][0]);
              }
            } else {
              return doNf.apply(this, arguments);
            }
          }
        };
        function doNf() {
          var num = arguments[0];
          var neg = num < 0;
          var n = neg ? num.toString().substring(1) : num.toString();
          var decimalInd = n.indexOf('.');
          var intPart = decimalInd !== -1 ? n.substring(0, decimalInd) : n;
          var decPart = decimalInd !== -1 ? n.substring(decimalInd + 1) : '';
          var str = neg ? '-' : '';
          if (arguments.length === 3) {
            var decimal = '';
            if (decimalInd !== -1 || arguments[2] - decPart.length > 0) {
              decimal = '.';
            }
            if (decPart.length > arguments[2]) {
              decPart = decPart.substring(0, arguments[2]);
            }
            for (var i = 0; i < arguments[1] - intPart.length; i++) {
              str += '0';
            }
            str += intPart;
            str += decimal;
            str += decPart;
            for (var j = 0; j < arguments[2] - decPart.length; j++) {
              str += '0';
            }
            return str;
          } else {
            for (var k = 0; k < Math.max(arguments[1] - intPart.length, 0); k++) {
              str += '0';
            }
            str += n;
            return str;
          }
        }
        p5.prototype.nfc = function() {
          if (arguments[0] instanceof Array) {
            var a = arguments[1];
            return arguments[0].map(function(x) {
              return doNfc(x, a);
            });
          } else {
            return doNfc.apply(this, arguments);
          }
        };
        function doNfc() {
          var num = arguments[0].toString();
          var dec = num.indexOf('.');
          var rem = dec !== -1 ? num.substring(dec) : '';
          var n = dec !== -1 ? num.substring(0, dec) : num;
          n = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          if (arguments[1] === 0) {
            rem = '';
          } else if (arguments[1] !== undefined) {
            if (arguments[1] > rem.length) {
              rem += dec === -1 ? '.' : '';
              var len = arguments[1] - rem.length + 1;
              for (var i = 0; i < len; i++) {
                rem += '0';
              }
            } else {
              rem = rem.substring(0, arguments[1] + 1);
            }
          }
          return n + rem;
        }
        p5.prototype.nfp = function() {
          var nfRes = this.nf.apply(this, arguments);
          if (nfRes instanceof Array) {
            return nfRes.map(addNfp);
          } else {
            return addNfp(nfRes);
          }
        };
        function addNfp() {
          return (parseFloat(arguments[0]) > 0) ? '+' + arguments[0].toString() : arguments[0].toString();
        }
        p5.prototype.nfs = function() {
          var nfRes = this.nf.apply(this, arguments);
          if (nfRes instanceof Array) {
            return nfRes.map(addNfs);
          } else {
            return addNfs(nfRes);
          }
        };
        function addNfs() {
          return (parseFloat(arguments[0]) > 0) ? ' ' + arguments[0].toString() : arguments[0].toString();
        }
        p5.prototype.split = function(str, delim) {
          return str.split(delim);
        };
        p5.prototype.splitTokens = function() {
          var d,
              sqo,
              sqc,
              str;
          str = arguments[1];
          if (arguments.length > 1) {
            sqc = /\]/g.exec(str);
            sqo = /\[/g.exec(str);
            if (sqo && sqc) {
              str = str.slice(0, sqc.index) + str.slice(sqc.index + 1);
              sqo = /\[/g.exec(str);
              str = str.slice(0, sqo.index) + str.slice(sqo.index + 1);
              d = new RegExp('[\\[' + str + '\\]]', 'g');
            } else if (sqc) {
              str = str.slice(0, sqc.index) + str.slice(sqc.index + 1);
              d = new RegExp('[' + str + '\\]]', 'g');
            } else if (sqo) {
              str = str.slice(0, sqo.index) + str.slice(sqo.index + 1);
              d = new RegExp('[' + str + '\\[]', 'g');
            } else {
              d = new RegExp('[' + str + ']', 'g');
            }
          } else {
            d = /\s/g;
          }
          return arguments[0].split(d).filter(function(n) {
            return n;
          });
        };
        p5.prototype.trim = function(str) {
          if (str instanceof Array) {
            return str.map(this.trim);
          } else {
            return str.trim();
          }
        };
        module.exports = p5;
      }, {"../core/core": 42}],
      81: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.prototype.day = function() {
          return new Date().getDate();
        };
        p5.prototype.hour = function() {
          return new Date().getHours();
        };
        p5.prototype.minute = function() {
          return new Date().getMinutes();
        };
        p5.prototype.millis = function() {
          return window.performance.now();
        };
        p5.prototype.month = function() {
          return new Date().getMonth() + 1;
        };
        p5.prototype.second = function() {
          return new Date().getSeconds();
        };
        p5.prototype.year = function() {
          return new Date().getFullYear();
        };
        module.exports = p5;
      }, {"../core/core": 42}],
      82: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.prototype.camera = function(x, y, z) {
          this._renderer.translate(-x, -y, -z);
        };
        p5.prototype.perspective = function(fovy, aspect, near, far) {
          fovy = fovy || (60 / 180 * this.PI);
          aspect = aspect || (this.width / this.height);
          near = near || ((this.height / 2.0) / this.tan(fovy / 2.0) * 0.1);
          far = far || ((this.height / 2.0) / this.tan(fovy / 2.0) * 10);
          this._renderer.uPMatrix = p5.Matrix.identity();
          this._renderer.uPMatrix.perspective(fovy, aspect, near, far);
          this._renderer._curCamera = 'custom';
        };
        p5.prototype.ortho = function(left, right, bottom, top, near, far) {
          left = left || (-this.width / 2);
          right = right || (this.width / 2);
          bottom = bottom || (-this.height / 2);
          top = top || (this.height / 2);
          near = near || 0;
          far = far || Math.max(this.width, this.height);
          this._renderer.uPMatrix = p5.Matrix.identity();
          this._renderer.uPMatrix.ortho(left, right, bottom, top, near, far);
          this._renderer._curCamera = 'custom';
        };
        module.exports = p5;
      }, {"../core/core": 42}],
      83: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.prototype.orbitControl = function() {
          if (this.mouseIsPressed) {
            this.rotateY((this.mouseX - this.width / 2) / (this.width / 2));
            this.rotateX((this.mouseY - this.height / 2) / (this.width / 2));
          }
          return this;
        };
        module.exports = p5;
      }, {"../core/core": 42}],
      84: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.prototype.ambientLight = function(v1, v2, v3, a) {
          var gl = this._renderer.GL;
          var shaderProgram = this._renderer._getShader('lightVert', 'lightTextureFrag');
          gl.useProgram(shaderProgram);
          shaderProgram.uAmbientColor = gl.getUniformLocation(shaderProgram, 'uAmbientColor[' + this._renderer.ambientLightCount + ']');
          var color = this._renderer._pInst.color.apply(this._renderer._pInst, arguments);
          var colors = color._array;
          gl.uniform3f(shaderProgram.uAmbientColor, colors[0], colors[1], colors[2]);
          shaderProgram.uMaterialColor = gl.getUniformLocation(shaderProgram, 'uMaterialColor');
          gl.uniform4f(shaderProgram.uMaterialColor, 1, 1, 1, 1);
          this._renderer.ambientLightCount++;
          shaderProgram.uAmbientLightCount = gl.getUniformLocation(shaderProgram, 'uAmbientLightCount');
          gl.uniform1i(shaderProgram.uAmbientLightCount, this._renderer.ambientLightCount);
          return this;
        };
        p5.prototype.directionalLight = function(v1, v2, v3, a, x, y, z) {
          var gl = this._renderer.GL;
          var shaderProgram = this._renderer._getShader('lightVert', 'lightTextureFrag');
          gl.useProgram(shaderProgram);
          shaderProgram.uDirectionalColor = gl.getUniformLocation(shaderProgram, 'uDirectionalColor[' + this._renderer.directionalLightCount + ']');
          var color = this._renderer._pInst.color.apply(this._renderer._pInst, [v1, v2, v3]);
          var colors = color._array;
          gl.uniform3f(shaderProgram.uDirectionalColor, colors[0], colors[1], colors[2]);
          var _x,
              _y,
              _z;
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          if (typeof args[args.length - 1] === 'number') {
            _x = args[args.length - 3];
            _y = args[args.length - 2];
            _z = args[args.length - 1];
          } else {
            try {
              _x = args[args.length - 1].x;
              _y = args[args.length - 1].y;
              _z = args[args.length - 1].z;
            } catch (error) {
              throw error;
            }
          }
          shaderProgram.uLightingDirection = gl.getUniformLocation(shaderProgram, 'uLightingDirection[' + this._renderer.directionalLightCount + ']');
          gl.uniform3f(shaderProgram.uLightingDirection, _x, _y, _z);
          shaderProgram.uMaterialColor = gl.getUniformLocation(shaderProgram, 'uMaterialColor');
          gl.uniform4f(shaderProgram.uMaterialColor, 1, 1, 1, 1);
          this._renderer.directionalLightCount++;
          shaderProgram.uDirectionalLightCount = gl.getUniformLocation(shaderProgram, 'uDirectionalLightCount');
          gl.uniform1i(shaderProgram.uDirectionalLightCount, this._renderer.directionalLightCount);
          return this;
        };
        p5.prototype.pointLight = function(v1, v2, v3, a, x, y, z) {
          var gl = this._renderer.GL;
          var shaderProgram = this._renderer._getShader('lightVert', 'lightTextureFrag');
          gl.useProgram(shaderProgram);
          shaderProgram.uPointLightColor = gl.getUniformLocation(shaderProgram, 'uPointLightColor[' + this._renderer.pointLightCount + ']');
          var color = this._renderer._pInst.color.apply(this._renderer._pInst, [v1, v2, v3]);
          var colors = color._array;
          gl.uniform3f(shaderProgram.uPointLightColor, colors[0], colors[1], colors[2]);
          var _x,
              _y,
              _z;
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          if (typeof args[args.length - 1] === 'number') {
            _x = args[args.length - 3];
            _y = args[args.length - 2];
            _z = args[args.length - 1];
          } else {
            try {
              _x = args[args.length - 1].x;
              _y = args[args.length - 1].y;
              _z = args[args.length - 1].z;
            } catch (error) {
              throw error;
            }
          }
          shaderProgram.uPointLightLocation = gl.getUniformLocation(shaderProgram, 'uPointLightLocation[' + this._renderer.pointLightCount + ']');
          gl.uniform3f(shaderProgram.uPointLightLocation, _x, _y, _z);
          shaderProgram.uMaterialColor = gl.getUniformLocation(shaderProgram, 'uMaterialColor');
          gl.uniform4f(shaderProgram.uMaterialColor, 1, 1, 1, 1);
          this._renderer.pointLightCount++;
          shaderProgram.uPointLightCount = gl.getUniformLocation(shaderProgram, 'uPointLightCount');
          gl.uniform1i(shaderProgram.uPointLightCount, this._renderer.pointLightCount);
          return this;
        };
        module.exports = p5;
      }, {"../core/core": 42}],
      85: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        _dereq_('./p5.Geometry');
        p5.prototype.loadModel = function() {
          var path = arguments[0];
          var normalize;
          var successCallback;
          var failureCallback;
          if (typeof arguments[1] === 'boolean') {
            normalize = arguments[1];
            successCallback = arguments[2];
            failureCallback = arguments[3];
          } else {
            normalize = false;
            successCallback = arguments[1];
            failureCallback = arguments[2];
          }
          var model = new p5.Geometry();
          model.gid = path + '|' + normalize;
          this.loadStrings(path, function(strings) {
            parseObj(model, strings);
            if (normalize) {
              model.normalize();
            }
            if (typeof successCallback === 'function') {
              successCallback(model);
            }
          }.bind(this), failureCallback);
          return model;
        };
        function parseObj(model, lines) {
          var loadedVerts = {
            'v': [],
            'vt': [],
            'vn': []
          };
          var indexedVerts = {};
          for (var line = 0; line < lines.length; ++line) {
            var tokens = lines[line].trim().split(/\b\s+/);
            if (tokens.length > 0) {
              if (tokens[0] === 'v' || tokens[0] === 'vn') {
                var vertex = new p5.Vector(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
                loadedVerts[tokens[0]].push(vertex);
              } else if (tokens[0] === 'vt') {
                var texVertex = [parseFloat(tokens[1]), parseFloat(tokens[2])];
                loadedVerts[tokens[0]].push(texVertex);
              } else if (tokens[0] === 'f') {
                for (var tri = 3; tri < tokens.length; ++tri) {
                  var face = [];
                  var vertexTokens = [1, tri - 1, tri];
                  for (var tokenInd = 0; tokenInd < vertexTokens.length; ++tokenInd) {
                    var vertString = tokens[vertexTokens[tokenInd]];
                    var vertIndex = 0;
                    if (indexedVerts[vertString] !== undefined) {
                      vertIndex = indexedVerts[vertString];
                    } else {
                      var vertParts = vertString.split('/');
                      for (var i = 0; i < vertParts.length; i++) {
                        vertParts[i] = parseInt(vertParts[i]) - 1;
                      }
                      vertIndex = indexedVerts[vertString] = model.vertices.length;
                      model.vertices.push(loadedVerts.v[vertParts[0]].copy());
                      if (loadedVerts.vt[vertParts[1]]) {
                        model.uvs.push(loadedVerts.vt[vertParts[1]].slice());
                      } else {
                        model.uvs.push([0, 0]);
                      }
                      if (loadedVerts.vn[vertParts[2]]) {
                        model.vertexNormals.push(loadedVerts.vn[vertParts[2]].copy());
                      }
                    }
                    face.push(vertIndex);
                  }
                  model.faces.push(face);
                }
              }
            }
          }
          if (model.vertexNormals.length === 0) {
            model.computeNormals();
          }
          return model;
        }
        p5.prototype.model = function(model) {
          if (model.vertices.length > 0) {
            if (!this._renderer.geometryInHash(model.gid)) {
              this._renderer.createBuffers(model.gid, model);
            }
            this._renderer.drawBuffers(model.gid);
          }
        };
        module.exports = p5;
      }, {
        "../core/core": 42,
        "./p5.Geometry": 87
      }],
      86: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.prototype.normalMaterial = function() {
          this._renderer._getShader('normalVert', 'normalFrag');
          return this;
        };
        p5.prototype.texture = function() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          var gl = this._renderer.GL;
          this._renderer.drawMode = 'texture';
          var shaderProgram = this._renderer._getShader('lightVert', 'lightTextureFrag');
          gl.useProgram(shaderProgram);
          var textureData;
          if (!args[0].isTexture) {
            if (args[0] instanceof p5.Image) {
              textureData = args[0].canvas;
            } else if (typeof p5.MediaElement !== 'undefined' && args[0] instanceof p5.MediaElement) {
              if (!args[0].loadedmetadata) {
                return;
              }
              textureData = args[0].elt;
            } else if (args[0] instanceof p5.Graphics) {
              textureData = args[0].elt;
            }
            var tex = gl.createTexture();
            args[0]._setProperty('tex', tex);
            args[0]._setProperty('isTexture', true);
            this._renderer._bind.call(this, tex, textureData);
          } else {
            if (args[0] instanceof p5.Graphics || (typeof p5.MediaElement !== 'undefined' && args[0] instanceof p5.MediaElement)) {
              textureData = args[0].elt;
            } else if (args[0] instanceof p5.Image) {
              textureData = args[0].canvas;
            }
            this._renderer._bind.call(this, args[0].tex, textureData);
          }
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, args[0].tex);
          gl.uniform1i(gl.getUniformLocation(shaderProgram, 'isTexture'), true);
          gl.uniform1i(gl.getUniformLocation(shaderProgram, 'uSampler'), 0);
          return this;
        };
        p5.RendererGL.prototype._bind = function(tex, data) {
          var gl = this._renderer.GL;
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.bindTexture(gl.TEXTURE_2D, null);
        };
        p5.prototype.ambientMaterial = function(v1, v2, v3, a) {
          var gl = this._renderer.GL;
          var shaderProgram = this._renderer._getShader('lightVert', 'lightTextureFrag');
          gl.useProgram(shaderProgram);
          shaderProgram.uMaterialColor = gl.getUniformLocation(shaderProgram, 'uMaterialColor');
          var colors = this._renderer._applyColorBlend.apply(this._renderer, arguments);
          gl.uniform4f(shaderProgram.uMaterialColor, colors[0], colors[1], colors[2], colors[3]);
          shaderProgram.uSpecular = gl.getUniformLocation(shaderProgram, 'uSpecular');
          gl.uniform1i(shaderProgram.uSpecular, false);
          gl.uniform1i(gl.getUniformLocation(shaderProgram, 'isTexture'), false);
          return this;
        };
        p5.prototype.specularMaterial = function(v1, v2, v3, a) {
          var gl = this._renderer.GL;
          var shaderProgram = this._renderer._getShader('lightVert', 'lightTextureFrag');
          gl.useProgram(shaderProgram);
          gl.uniform1i(gl.getUniformLocation(shaderProgram, 'isTexture'), false);
          shaderProgram.uMaterialColor = gl.getUniformLocation(shaderProgram, 'uMaterialColor');
          var colors = this._renderer._applyColorBlend.apply(this._renderer, arguments);
          gl.uniform4f(shaderProgram.uMaterialColor, colors[0], colors[1], colors[2], colors[3]);
          shaderProgram.uSpecular = gl.getUniformLocation(shaderProgram, 'uSpecular');
          gl.uniform1i(shaderProgram.uSpecular, true);
          return this;
        };
        p5.RendererGL.prototype._applyColorBlend = function(v1, v2, v3, a) {
          var gl = this.GL;
          var color = this._pInst.color.apply(this._pInst, arguments);
          var colors = color._array;
          if (colors[colors.length - 1] < 1.0) {
            gl.depthMask(false);
            gl.enable(gl.BLEND);
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          } else {
            gl.depthMask(true);
            gl.disable(gl.BLEND);
          }
          return colors;
        };
        module.exports = p5;
      }, {"../core/core": 42}],
      87: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        p5.Geometry = function(detailX, detailY, callback) {
          this.vertices = [];
          this.vertexNormals = [];
          this.faces = [];
          this.uvs = [];
          this.detailX = (detailX !== undefined) ? detailX : 1;
          this.detailY = (detailY !== undefined) ? detailY : 1;
          if (callback instanceof Function) {
            callback.call(this);
          }
          return this;
        };
        p5.Geometry.prototype.computeFaces = function() {
          var sliceCount = this.detailX + 1;
          var a,
              b,
              c,
              d;
          for (var i = 0; i < this.detailY; i++) {
            for (var j = 0; j < this.detailX; j++) {
              a = i * sliceCount + j;
              b = i * sliceCount + j + 1;
              c = (i + 1) * sliceCount + j + 1;
              d = (i + 1) * sliceCount + j;
              this.faces.push([a, b, d]);
              this.faces.push([d, b, c]);
            }
          }
          return this;
        };
        p5.Geometry.prototype._getFaceNormal = function(faceId, vertId) {
          var face = this.faces[faceId];
          var vA = this.vertices[face[vertId % 3]];
          var vB = this.vertices[face[(vertId + 1) % 3]];
          var vC = this.vertices[face[(vertId + 2) % 3]];
          var n = p5.Vector.cross(p5.Vector.sub(vB, vA), p5.Vector.sub(vC, vA));
          var sinAlpha = p5.Vector.mag(n) / (p5.Vector.mag(p5.Vector.sub(vB, vA)) * p5.Vector.mag(p5.Vector.sub(vC, vA)));
          n = n.normalize();
          return n.mult(Math.asin(sinAlpha));
        };
        p5.Geometry.prototype.computeNormals = function() {
          for (var v = 0; v < this.vertices.length; v++) {
            var normal = new p5.Vector();
            for (var i = 0; i < this.faces.length; i++) {
              if (this.faces[i][0] === v || this.faces[i][1] === v || this.faces[i][2] === v) {
                normal = normal.add(this._getFaceNormal(i, v));
              }
            }
            normal = normal.normalize();
            this.vertexNormals.push(normal);
          }
          return this;
        };
        p5.Geometry.prototype.averageNormals = function() {
          for (var i = 0; i <= this.detailY; i++) {
            var offset = this.detailX + 1;
            var temp = p5.Vector.add(this.vertexNormals[i * offset], this.vertexNormals[i * offset + this.detailX]);
            temp = p5.Vector.div(temp, 2);
            this.vertexNormals[i * offset] = temp;
            this.vertexNormals[i * offset + this.detailX] = temp;
          }
          return this;
        };
        p5.Geometry.prototype.averagePoleNormals = function() {
          var sum = new p5.Vector(0, 0, 0);
          for (var i = 0; i < this.detailX; i++) {
            sum.add(this.vertexNormals[i]);
          }
          sum = p5.Vector.div(sum, this.detailX);
          for (i = 0; i < this.detailX; i++) {
            this.vertexNormals[i] = sum;
          }
          sum = new p5.Vector(0, 0, 0);
          for (i = this.vertices.length - 1; i > this.vertices.length - 1 - this.detailX; i--) {
            sum.add(this.vertexNormals[i]);
          }
          sum = p5.Vector.div(sum, this.detailX);
          for (i = this.vertices.length - 1; i > this.vertices.length - 1 - this.detailX; i--) {
            this.vertexNormals[i] = sum;
          }
          return this;
        };
        p5.Geometry.prototype.normalize = function() {
          if (this.vertices.length > 0) {
            var maxPosition = this.vertices[0].copy();
            var minPosition = this.vertices[0].copy();
            for (var i = 0; i < this.vertices.length; i++) {
              maxPosition.x = Math.max(maxPosition.x, this.vertices[i].x);
              minPosition.x = Math.min(minPosition.x, this.vertices[i].x);
              maxPosition.y = Math.max(maxPosition.y, this.vertices[i].y);
              minPosition.y = Math.min(minPosition.y, this.vertices[i].y);
              maxPosition.z = Math.max(maxPosition.z, this.vertices[i].z);
              minPosition.z = Math.min(minPosition.z, this.vertices[i].z);
            }
            var center = p5.Vector.lerp(maxPosition, minPosition, 0.5);
            var dist = p5.Vector.sub(maxPosition, minPosition);
            var longestDist = Math.max(Math.max(dist.x, dist.y), dist.z);
            var scale = 200 / longestDist;
            for (i = 0; i < this.vertices.length; i++) {
              this.vertices[i].sub(center);
              this.vertices[i].mult(scale);
            }
          }
          return this;
        };
        module.exports = p5.Geometry;
      }, {"../core/core": 42}],
      88: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var polarGeometry = _dereq_('../math/polargeometry');
        var constants = _dereq_('../core/constants');
        var GLMAT_ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
        p5.Matrix = function() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          if (args[0] instanceof p5) {
            this.p5 = args[0];
            if (args[1] === 'mat3') {
              this.mat3 = args[2] || new GLMAT_ARRAY_TYPE([1, 0, 0, 0, 1, 0, 0, 0, 1]);
            } else {
              this.mat4 = args[1] || new GLMAT_ARRAY_TYPE([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
            }
          } else {
            if (args[0] === 'mat3') {
              this.mat3 = args[1] || new GLMAT_ARRAY_TYPE([1, 0, 0, 0, 1, 0, 0, 0, 1]);
            } else {
              this.mat4 = args[0] || new GLMAT_ARRAY_TYPE([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
            }
          }
          return this;
        };
        p5.Matrix.prototype.set = function(inMatrix) {
          if (inMatrix instanceof p5.Matrix) {
            this.mat4 = inMatrix.mat4;
            return this;
          } else if (inMatrix instanceof GLMAT_ARRAY_TYPE) {
            this.mat4 = inMatrix;
            return this;
          }
          return this;
        };
        p5.Matrix.prototype.get = function() {
          return new p5.Matrix(this.mat4);
        };
        p5.Matrix.prototype.copy = function() {
          var copied = new p5.Matrix();
          copied.mat4[0] = this.mat4[0];
          copied.mat4[1] = this.mat4[1];
          copied.mat4[2] = this.mat4[2];
          copied.mat4[3] = this.mat4[3];
          copied.mat4[4] = this.mat4[4];
          copied.mat4[5] = this.mat4[5];
          copied.mat4[6] = this.mat4[6];
          copied.mat4[7] = this.mat4[7];
          copied.mat4[8] = this.mat4[8];
          copied.mat4[9] = this.mat4[9];
          copied.mat4[10] = this.mat4[10];
          copied.mat4[11] = this.mat4[11];
          copied.mat4[12] = this.mat4[12];
          copied.mat4[13] = this.mat4[13];
          copied.mat4[14] = this.mat4[14];
          copied.mat4[15] = this.mat4[15];
          return copied;
        };
        p5.Matrix.identity = function() {
          return new p5.Matrix();
        };
        p5.Matrix.prototype.transpose = function(a) {
          var a01,
              a02,
              a03,
              a12,
              a13,
              a23;
          if (a instanceof p5.Matrix) {
            a01 = a.mat4[1];
            a02 = a.mat4[2];
            a03 = a.mat4[3];
            a12 = a.mat4[6];
            a13 = a.mat4[7];
            a23 = a.mat4[11];
            this.mat4[0] = a.mat4[0];
            this.mat4[1] = a.mat4[4];
            this.mat4[2] = a.mat4[8];
            this.mat4[3] = a.mat4[12];
            this.mat4[4] = a01;
            this.mat4[5] = a.mat4[5];
            this.mat4[6] = a.mat4[9];
            this.mat4[7] = a.mat4[13];
            this.mat4[8] = a02;
            this.mat4[9] = a12;
            this.mat4[10] = a.mat4[10];
            this.mat4[11] = a.mat4[14];
            this.mat4[12] = a03;
            this.mat4[13] = a13;
            this.mat4[14] = a23;
            this.mat4[15] = a.mat4[15];
          } else if (a instanceof GLMAT_ARRAY_TYPE) {
            a01 = a[1];
            a02 = a[2];
            a03 = a[3];
            a12 = a[6];
            a13 = a[7];
            a23 = a[11];
            this.mat4[0] = a[0];
            this.mat4[1] = a[4];
            this.mat4[2] = a[8];
            this.mat4[3] = a[12];
            this.mat4[4] = a01;
            this.mat4[5] = a[5];
            this.mat4[6] = a[9];
            this.mat4[7] = a[13];
            this.mat4[8] = a02;
            this.mat4[9] = a12;
            this.mat4[10] = a[10];
            this.mat4[11] = a[14];
            this.mat4[12] = a03;
            this.mat4[13] = a13;
            this.mat4[14] = a23;
            this.mat4[15] = a[15];
          }
          return this;
        };
        p5.Matrix.prototype.invert = function(a) {
          var a00,
              a01,
              a02,
              a03,
              a10,
              a11,
              a12,
              a13,
              a20,
              a21,
              a22,
              a23,
              a30,
              a31,
              a32,
              a33;
          if (a instanceof p5.Matrix) {
            a00 = a.mat4[0];
            a01 = a.mat4[1];
            a02 = a.mat4[2];
            a03 = a.mat4[3];
            a10 = a.mat4[4];
            a11 = a.mat4[5];
            a12 = a.mat4[6];
            a13 = a.mat4[7];
            a20 = a.mat4[8];
            a21 = a.mat4[9];
            a22 = a.mat4[10];
            a23 = a.mat4[11];
            a30 = a.mat4[12];
            a31 = a.mat4[13];
            a32 = a.mat4[14];
            a33 = a.mat4[15];
          } else if (a instanceof GLMAT_ARRAY_TYPE) {
            a00 = a[0];
            a01 = a[1];
            a02 = a[2];
            a03 = a[3];
            a10 = a[4];
            a11 = a[5];
            a12 = a[6];
            a13 = a[7];
            a20 = a[8];
            a21 = a[9];
            a22 = a[10];
            a23 = a[11];
            a30 = a[12];
            a31 = a[13];
            a32 = a[14];
            a33 = a[15];
          }
          var b00 = a00 * a11 - a01 * a10,
              b01 = a00 * a12 - a02 * a10,
              b02 = a00 * a13 - a03 * a10,
              b03 = a01 * a12 - a02 * a11,
              b04 = a01 * a13 - a03 * a11,
              b05 = a02 * a13 - a03 * a12,
              b06 = a20 * a31 - a21 * a30,
              b07 = a20 * a32 - a22 * a30,
              b08 = a20 * a33 - a23 * a30,
              b09 = a21 * a32 - a22 * a31,
              b10 = a21 * a33 - a23 * a31,
              b11 = a22 * a33 - a23 * a32,
              det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
          if (!det) {
            return null;
          }
          det = 1.0 / det;
          this.mat4[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
          this.mat4[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
          this.mat4[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
          this.mat4[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
          this.mat4[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
          this.mat4[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
          this.mat4[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
          this.mat4[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
          this.mat4[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
          this.mat4[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
          this.mat4[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
          this.mat4[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
          this.mat4[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
          this.mat4[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
          this.mat4[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
          this.mat4[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
          return this;
        };
        p5.Matrix.prototype.invert3x3 = function() {
          var a00 = this.mat3[0],
              a01 = this.mat3[1],
              a02 = this.mat3[2],
              a10 = this.mat3[3],
              a11 = this.mat3[4],
              a12 = this.mat3[5],
              a20 = this.mat3[6],
              a21 = this.mat3[7],
              a22 = this.mat3[8],
              b01 = a22 * a11 - a12 * a21,
              b11 = -a22 * a10 + a12 * a20,
              b21 = a21 * a10 - a11 * a20,
              det = a00 * b01 + a01 * b11 + a02 * b21;
          if (!det) {
            return null;
          }
          det = 1.0 / det;
          this.mat3[0] = b01 * det;
          this.mat3[1] = (-a22 * a01 + a02 * a21) * det;
          this.mat3[2] = (a12 * a01 - a02 * a11) * det;
          this.mat3[3] = b11 * det;
          this.mat3[4] = (a22 * a00 - a02 * a20) * det;
          this.mat3[5] = (-a12 * a00 + a02 * a10) * det;
          this.mat3[6] = b21 * det;
          this.mat3[7] = (-a21 * a00 + a01 * a20) * det;
          this.mat3[8] = (a11 * a00 - a01 * a10) * det;
          return this;
        };
        p5.Matrix.prototype.transpose3x3 = function(mat3) {
          var a01 = mat3[1],
              a02 = mat3[2],
              a12 = mat3[5];
          this.mat3[1] = mat3[3];
          this.mat3[2] = mat3[6];
          this.mat3[3] = a01;
          this.mat3[5] = mat3[7];
          this.mat3[6] = a02;
          this.mat3[7] = a12;
          return this;
        };
        p5.Matrix.prototype.inverseTranspose = function(matrix) {
          if (this.mat3 === undefined) {
            console.error('sorry, this function only works with mat3');
          } else {
            this.mat3[0] = matrix.mat4[0];
            this.mat3[1] = matrix.mat4[1];
            this.mat3[2] = matrix.mat4[2];
            this.mat3[3] = matrix.mat4[4];
            this.mat3[4] = matrix.mat4[5];
            this.mat3[5] = matrix.mat4[6];
            this.mat3[6] = matrix.mat4[8];
            this.mat3[7] = matrix.mat4[9];
            this.mat3[8] = matrix.mat4[10];
          }
          this.invert3x3().transpose3x3(this.mat3);
          return this;
        };
        p5.Matrix.prototype.determinant = function() {
          var d00 = (this.mat4[0] * this.mat4[5]) - (this.mat4[1] * this.mat4[4]),
              d01 = (this.mat4[0] * this.mat4[6]) - (this.mat4[2] * this.mat4[4]),
              d02 = (this.mat4[0] * this.mat4[7]) - (this.mat4[3] * this.mat4[4]),
              d03 = (this.mat4[1] * this.mat4[6]) - (this.mat4[2] * this.mat4[5]),
              d04 = (this.mat4[1] * this.mat4[7]) - (this.mat4[3] * this.mat4[5]),
              d05 = (this.mat4[2] * this.mat4[7]) - (this.mat4[3] * this.mat4[6]),
              d06 = (this.mat4[8] * this.mat4[13]) - (this.mat4[9] * this.mat4[12]),
              d07 = (this.mat4[8] * this.mat4[14]) - (this.mat4[10] * this.mat4[12]),
              d08 = (this.mat4[8] * this.mat4[15]) - (this.mat4[11] * this.mat4[12]),
              d09 = (this.mat4[9] * this.mat4[14]) - (this.mat4[10] * this.mat4[13]),
              d10 = (this.mat4[9] * this.mat4[15]) - (this.mat4[11] * this.mat4[13]),
              d11 = (this.mat4[10] * this.mat4[15]) - (this.mat4[11] * this.mat4[14]);
          return d00 * d11 - d01 * d10 + d02 * d09 + d03 * d08 - d04 * d07 + d05 * d06;
        };
        p5.Matrix.prototype.mult = function(multMatrix) {
          var _dest = new GLMAT_ARRAY_TYPE(16);
          var _src = new GLMAT_ARRAY_TYPE(16);
          if (multMatrix instanceof p5.Matrix) {
            _src = multMatrix.mat4;
          } else if (multMatrix instanceof GLMAT_ARRAY_TYPE) {
            _src = multMatrix;
          }
          var b0 = this.mat4[0],
              b1 = this.mat4[1],
              b2 = this.mat4[2],
              b3 = this.mat4[3];
          _dest[0] = b0 * _src[0] + b1 * _src[4] + b2 * _src[8] + b3 * _src[12];
          _dest[1] = b0 * _src[1] + b1 * _src[5] + b2 * _src[9] + b3 * _src[13];
          _dest[2] = b0 * _src[2] + b1 * _src[6] + b2 * _src[10] + b3 * _src[14];
          _dest[3] = b0 * _src[3] + b1 * _src[7] + b2 * _src[11] + b3 * _src[15];
          b0 = this.mat4[4];
          b1 = this.mat4[5];
          b2 = this.mat4[6];
          b3 = this.mat4[7];
          _dest[4] = b0 * _src[0] + b1 * _src[4] + b2 * _src[8] + b3 * _src[12];
          _dest[5] = b0 * _src[1] + b1 * _src[5] + b2 * _src[9] + b3 * _src[13];
          _dest[6] = b0 * _src[2] + b1 * _src[6] + b2 * _src[10] + b3 * _src[14];
          _dest[7] = b0 * _src[3] + b1 * _src[7] + b2 * _src[11] + b3 * _src[15];
          b0 = this.mat4[8];
          b1 = this.mat4[9];
          b2 = this.mat4[10];
          b3 = this.mat4[11];
          _dest[8] = b0 * _src[0] + b1 * _src[4] + b2 * _src[8] + b3 * _src[12];
          _dest[9] = b0 * _src[1] + b1 * _src[5] + b2 * _src[9] + b3 * _src[13];
          _dest[10] = b0 * _src[2] + b1 * _src[6] + b2 * _src[10] + b3 * _src[14];
          _dest[11] = b0 * _src[3] + b1 * _src[7] + b2 * _src[11] + b3 * _src[15];
          b0 = this.mat4[12];
          b1 = this.mat4[13];
          b2 = this.mat4[14];
          b3 = this.mat4[15];
          _dest[12] = b0 * _src[0] + b1 * _src[4] + b2 * _src[8] + b3 * _src[12];
          _dest[13] = b0 * _src[1] + b1 * _src[5] + b2 * _src[9] + b3 * _src[13];
          _dest[14] = b0 * _src[2] + b1 * _src[6] + b2 * _src[10] + b3 * _src[14];
          _dest[15] = b0 * _src[3] + b1 * _src[7] + b2 * _src[11] + b3 * _src[15];
          this.mat4 = _dest;
          return this;
        };
        p5.Matrix.prototype.scale = function() {
          var x,
              y,
              z;
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          if (args[0] instanceof p5.Vector) {
            x = args[0].x;
            y = args[0].y;
            z = args[0].z;
          } else if (args[0] instanceof Array) {
            x = args[0][0];
            y = args[0][1];
            z = args[0][2];
          }
          var _dest = new GLMAT_ARRAY_TYPE(16);
          _dest[0] = this.mat4[0] * x;
          _dest[1] = this.mat4[1] * x;
          _dest[2] = this.mat4[2] * x;
          _dest[3] = this.mat4[3] * x;
          _dest[4] = this.mat4[4] * y;
          _dest[5] = this.mat4[5] * y;
          _dest[6] = this.mat4[6] * y;
          _dest[7] = this.mat4[7] * y;
          _dest[8] = this.mat4[8] * z;
          _dest[9] = this.mat4[9] * z;
          _dest[10] = this.mat4[10] * z;
          _dest[11] = this.mat4[11] * z;
          _dest[12] = this.mat4[12];
          _dest[13] = this.mat4[13];
          _dest[14] = this.mat4[14];
          _dest[15] = this.mat4[15];
          this.mat4 = _dest;
          return this;
        };
        p5.Matrix.prototype.rotate = function(a, axis) {
          var x,
              y,
              z,
              _a,
              len;
          if (this.p5) {
            if (this.p5._angleMode === constants.DEGREES) {
              _a = polarGeometry.degreesToRadians(a);
            }
          } else {
            _a = a;
          }
          if (axis instanceof p5.Vector) {
            x = axis.x;
            y = axis.y;
            z = axis.z;
          } else if (axis instanceof Array) {
            x = axis[0];
            y = axis[1];
            z = axis[2];
          }
          len = Math.sqrt(x * x + y * y + z * z);
          x *= (1 / len);
          y *= (1 / len);
          z *= (1 / len);
          var a00 = this.mat4[0];
          var a01 = this.mat4[1];
          var a02 = this.mat4[2];
          var a03 = this.mat4[3];
          var a10 = this.mat4[4];
          var a11 = this.mat4[5];
          var a12 = this.mat4[6];
          var a13 = this.mat4[7];
          var a20 = this.mat4[8];
          var a21 = this.mat4[9];
          var a22 = this.mat4[10];
          var a23 = this.mat4[11];
          var sA = Math.sin(_a);
          var cA = Math.cos(_a);
          var tA = 1 - cA;
          var b00 = x * x * tA + cA;
          var b01 = y * x * tA + z * sA;
          var b02 = z * x * tA - y * sA;
          var b10 = x * y * tA - z * sA;
          var b11 = y * y * tA + cA;
          var b12 = z * y * tA + x * sA;
          var b20 = x * z * tA + y * sA;
          var b21 = y * z * tA - x * sA;
          var b22 = z * z * tA + cA;
          this.mat4[0] = a00 * b00 + a10 * b01 + a20 * b02;
          this.mat4[1] = a01 * b00 + a11 * b01 + a21 * b02;
          this.mat4[2] = a02 * b00 + a12 * b01 + a22 * b02;
          this.mat4[3] = a03 * b00 + a13 * b01 + a23 * b02;
          this.mat4[4] = a00 * b10 + a10 * b11 + a20 * b12;
          this.mat4[5] = a01 * b10 + a11 * b11 + a21 * b12;
          this.mat4[6] = a02 * b10 + a12 * b11 + a22 * b12;
          this.mat4[7] = a03 * b10 + a13 * b11 + a23 * b12;
          this.mat4[8] = a00 * b20 + a10 * b21 + a20 * b22;
          this.mat4[9] = a01 * b20 + a11 * b21 + a21 * b22;
          this.mat4[10] = a02 * b20 + a12 * b21 + a22 * b22;
          this.mat4[11] = a03 * b20 + a13 * b21 + a23 * b22;
          return this;
        };
        p5.Matrix.prototype.translate = function(v) {
          var x = v[0],
              y = v[1],
              z = v[2] || 0;
          this.mat4[12] = this.mat4[0] * x + this.mat4[4] * y + this.mat4[8] * z + this.mat4[12];
          this.mat4[13] = this.mat4[1] * x + this.mat4[5] * y + this.mat4[9] * z + this.mat4[13];
          this.mat4[14] = this.mat4[2] * x + this.mat4[6] * y + this.mat4[10] * z + this.mat4[14];
          this.mat4[15] = this.mat4[3] * x + this.mat4[7] * y + this.mat4[11] * z + this.mat4[15];
        };
        p5.Matrix.prototype.rotateX = function(a) {
          this.rotate(a, [1, 0, 0]);
        };
        p5.Matrix.prototype.rotateY = function(a) {
          this.rotate(a, [0, 1, 0]);
        };
        p5.Matrix.prototype.rotateZ = function(a) {
          this.rotate(a, [0, 0, 1]);
        };
        p5.Matrix.prototype.perspective = function(fovy, aspect, near, far) {
          var f = 1.0 / Math.tan(fovy / 2),
              nf = 1 / (near - far);
          this.mat4[0] = f / aspect;
          this.mat4[1] = 0;
          this.mat4[2] = 0;
          this.mat4[3] = 0;
          this.mat4[4] = 0;
          this.mat4[5] = f;
          this.mat4[6] = 0;
          this.mat4[7] = 0;
          this.mat4[8] = 0;
          this.mat4[9] = 0;
          this.mat4[10] = (far + near) * nf;
          this.mat4[11] = -1;
          this.mat4[12] = 0;
          this.mat4[13] = 0;
          this.mat4[14] = (2 * far * near) * nf;
          this.mat4[15] = 0;
          return this;
        };
        p5.Matrix.prototype.ortho = function(left, right, bottom, top, near, far) {
          var lr = 1 / (left - right),
              bt = 1 / (bottom - top),
              nf = 1 / (near - far);
          this.mat4[0] = -2 * lr;
          this.mat4[1] = 0;
          this.mat4[2] = 0;
          this.mat4[3] = 0;
          this.mat4[4] = 0;
          this.mat4[5] = -2 * bt;
          this.mat4[6] = 0;
          this.mat4[7] = 0;
          this.mat4[8] = 0;
          this.mat4[9] = 0;
          this.mat4[10] = 2 * nf;
          this.mat4[11] = 0;
          this.mat4[12] = (left + right) * lr;
          this.mat4[13] = (top + bottom) * bt;
          this.mat4[14] = (far + near) * nf;
          this.mat4[15] = 1;
          return this;
        };
        module.exports = p5.Matrix;
      }, {
        "../core/constants": 41,
        "../core/core": 42,
        "../math/polargeometry": 72
      }],
      89: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var constants = _dereq_('../core/constants');
        p5.RendererGL.prototype.beginShape = function(mode) {
          this.immediateMode.shapeMode = (mode !== undefined) ? mode : constants.LINE_STRIP;
          if (this.immediateMode.vertexPositions === undefined) {
            this.immediateMode.vertexPositions = [];
            this.immediateMode.vertexColors = [];
            this.immediateMode.vertexBuffer = this.GL.createBuffer();
            this.immediateMode.colorBuffer = this.GL.createBuffer();
          } else {
            this.immediateMode.vertexPositions.length = 0;
            this.immediateMode.vertexColors.length = 0;
          }
          this.isImmediateDrawing = true;
          return this;
        };
        p5.RendererGL.prototype.vertex = function(x, y, z) {
          this.immediateMode.vertexPositions.push(x, y, z);
          var vertexColor = this.curFillColor || [0.5, 0.5, 0.5, 1.0];
          this.immediateMode.vertexColors.push(vertexColor[0], vertexColor[1], vertexColor[2], vertexColor[3]);
          return this;
        };
        p5.RendererGL.prototype.endShape = function(mode, isCurve, isBezier, isQuadratic, isContour, shapeKind) {
          var gl = this.GL;
          this._bindImmediateBuffers(this.immediateMode.vertexPositions, this.immediateMode.vertexColors);
          if (mode) {
            if (this.drawMode === 'fill' || this.drawMode === 'texture') {
              switch (this.immediateMode.shapeMode) {
                case constants.LINE_STRIP:
                  this.immediateMode.shapeMode = constants.TRIANGLE_FAN;
                  break;
                case constants.LINES:
                  this.immediateMode.shapeMode = constants.TRIANGLE_FAN;
                  break;
                case constants.TRIANGLES:
                  this.immediateMode.shapeMode = constants.TRIANGLE_FAN;
                  break;
              }
            } else {
              switch (this.immediateMode.shapeMode) {
                case constants.LINE_STRIP:
                  this.immediateMode.shapeMode = constants.LINE_LOOP;
                  break;
                case constants.LINES:
                  this.immediateMode.shapeMode = constants.LINE_LOOP;
                  break;
              }
            }
          }
          if (this.immediateMode.shapeMode === constants.QUADS || this.immediateMode.shapeMode === constants.QUAD_STRIP) {
            throw new Error('sorry, ' + this.immediateMode.shapeMode + ' not yet implemented in webgl mode.');
          } else {
            gl.enable(gl.BLEND);
            gl.drawArrays(this.immediateMode.shapeMode, 0, this.immediateMode.vertexPositions.length / 3);
          }
          this.immediateMode.vertexPositions.length = 0;
          this.immediateMode.vertexColors.length = 0;
          this.isImmediateDrawing = false;
          return this;
        };
        p5.RendererGL.prototype._bindImmediateBuffers = function(vertices, colors) {
          this._setDefaultCamera();
          var gl = this.GL;
          var shaderKey = this._getCurShaderId();
          var shaderProgram = this.mHash[shaderKey];
          shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aPosition');
          gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.immediateMode.vertexBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
          gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
          shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, 'aVertexColor');
          gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.immediateMode.colorBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
          gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
          this._setMatrixUniforms(shaderKey);
          return this;
        };
        p5.RendererGL.prototype._getColorVertexShader = function() {
          var gl = this.GL;
          var mId = 'immediateVert|vertexColorFrag';
          var shaderProgram;
          if (!this.materialInHash(mId)) {
            shaderProgram = this._initShaders('immediateVert', 'vertexColorFrag', true);
            this.mHash[mId] = shaderProgram;
            shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, 'aVertexColor');
            gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
          } else {
            shaderProgram = this.mHash[mId];
          }
          return shaderProgram;
        };
        module.exports = p5.RendererGL;
      }, {
        "../core/constants": 41,
        "../core/core": 42
      }],
      90: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var hashCount = 0;
        p5.RendererGL.prototype._initBufferDefaults = function(gId) {
          hashCount++;
          if (hashCount > 1000) {
            var key = Object.keys(this.gHash)[0];
            delete this.gHash[key];
            hashCount--;
          }
          var gl = this.GL;
          this.gHash[gId] = {};
          this.gHash[gId].vertexBuffer = gl.createBuffer();
          this.gHash[gId].normalBuffer = gl.createBuffer();
          this.gHash[gId].uvBuffer = gl.createBuffer();
          this.gHash[gId].indexBuffer = gl.createBuffer();
        };
        p5.RendererGL.prototype.createBuffers = function(gId, obj) {
          var gl = this.GL;
          this._setDefaultCamera();
          this._initBufferDefaults(gId);
          var shaderProgram = this.mHash[this._getCurShaderId()];
          this.gHash[gId].numberOfItems = obj.faces.length * 3;
          gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].vertexBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vToNArray(obj.vertices)), gl.STATIC_DRAW);
          shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aPosition');
          gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
          gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].normalBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vToNArray(obj.vertexNormals)), gl.STATIC_DRAW);
          shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, 'aNormal');
          gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
          gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].uvBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(obj.uvs)), gl.STATIC_DRAW);
          shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, 'aTexCoord');
          gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
          gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.gHash[gId].indexBuffer);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(obj.faces)), gl.STATIC_DRAW);
        };
        p5.RendererGL.prototype.drawBuffers = function(gId) {
          this._setDefaultCamera();
          var gl = this.GL;
          var shaderKey = this._getCurShaderId();
          var shaderProgram = this.mHash[shaderKey];
          gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].vertexBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].normalBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].uvBuffer);
          gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.gHash[gId].indexBuffer);
          this._setMatrixUniforms(shaderKey);
          gl.drawElements(gl.TRIANGLES, this.gHash[gId].numberOfItems, gl.UNSIGNED_SHORT, 0);
          return this;
        };
        function flatten(arr) {
          if (arr.length > 0) {
            return arr.reduce(function(a, b) {
              return a.concat(b);
            });
          } else {
            return [];
          }
        }
        function vToNArray(arr) {
          return flatten(arr.map(function(item) {
            return [item.x, item.y, item.z];
          }));
        }
        module.exports = p5.RendererGL;
      }, {"../core/core": 42}],
      91: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        var shader = _dereq_('./shader');
        _dereq_('../core/p5.Renderer');
        _dereq_('./p5.Matrix');
        var uMVMatrixStack = [];
        var attributes = {
          alpha: true,
          depth: true,
          stencil: true,
          antialias: false,
          premultipliedAlpha: false,
          preserveDrawingBuffer: false
        };
        p5.RendererGL = function(elt, pInst, isMainCanvas) {
          p5.Renderer.call(this, elt, pInst, isMainCanvas);
          this._initContext();
          this.isP3D = true;
          this.GL = this.drawingContext;
          this.ambientLightCount = 0;
          this.directionalLightCount = 0;
          this.pointLightCount = 0;
          this._curCamera = null;
          this.uMVMatrix = new p5.Matrix();
          this.uPMatrix = new p5.Matrix();
          this.uNMatrix = new p5.Matrix('mat3');
          this.gHash = {};
          this.mHash = {};
          this.isImmediateDrawing = false;
          this.immediateMode = {};
          this.curFillColor = [0.5, 0.5, 0.5, 1.0];
          this.curStrokeColor = [0.5, 0.5, 0.5, 1.0];
          this.pointSize = 5.0;
          return this;
        };
        p5.RendererGL.prototype = Object.create(p5.Renderer.prototype);
        p5.RendererGL.prototype._initContext = function() {
          try {
            this.drawingContext = this.canvas.getContext('webgl', attributes) || this.canvas.getContext('experimental-webgl', attributes);
            if (this.drawingContext === null) {
              throw new Error('Error creating webgl context');
            } else {
              console.log('p5.RendererGL: enabled webgl context');
              var gl = this.drawingContext;
              gl.enable(gl.DEPTH_TEST);
              gl.depthFunc(gl.LEQUAL);
              gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            }
          } catch (er) {
            throw new Error(er);
          }
        };
        p5.RendererGL.prototype._setDefaultCamera = function() {
          if (this._curCamera === null) {
            var _w = this.width;
            var _h = this.height;
            this.uPMatrix = p5.Matrix.identity();
            var cameraZ = (this.height / 2) / Math.tan(Math.PI * 30 / 180);
            this.uPMatrix.perspective(60 / 180 * Math.PI, _w / _h, cameraZ * 0.1, cameraZ * 10);
            this._curCamera = 'default';
          }
        };
        p5.RendererGL.prototype._update = function() {
          this.uMVMatrix = p5.Matrix.identity();
          this.translate(0, 0, -(this.height / 2) / Math.tan(Math.PI * 30 / 180));
          this.ambientLightCount = 0;
          this.directionalLightCount = 0;
          this.pointLightCount = 0;
        };
        p5.RendererGL.prototype.background = function() {
          var gl = this.GL;
          var _col = this._pInst.color.apply(this._pInst, arguments);
          var _r = (_col.levels[0]) / 255;
          var _g = (_col.levels[1]) / 255;
          var _b = (_col.levels[2]) / 255;
          var _a = (_col.levels[3]) / 255;
          gl.clearColor(_r, _g, _b, _a);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        };
        p5.RendererGL.prototype._initShaders = function(vertId, fragId, isImmediateMode) {
          var gl = this.GL;
          var _vertShader = gl.createShader(gl.VERTEX_SHADER);
          gl.shaderSource(_vertShader, shader[vertId]);
          gl.compileShader(_vertShader);
          if (!gl.getShaderParameter(_vertShader, gl.COMPILE_STATUS)) {
            alert('Yikes! An error occurred compiling the shaders:' + gl.getShaderInfoLog(_vertShader));
            return null;
          }
          var _fragShader = gl.createShader(gl.FRAGMENT_SHADER);
          gl.shaderSource(_fragShader, shader[fragId]);
          gl.compileShader(_fragShader);
          if (!gl.getShaderParameter(_fragShader, gl.COMPILE_STATUS)) {
            alert('Darn! An error occurred compiling the shaders:' + gl.getShaderInfoLog(_fragShader));
            return null;
          }
          var shaderProgram = gl.createProgram();
          gl.attachShader(shaderProgram, _vertShader);
          gl.attachShader(shaderProgram, _fragShader);
          gl.linkProgram(shaderProgram);
          if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert('Snap! Error linking shader program');
          }
          this._getLocation(shaderProgram, isImmediateMode);
          return shaderProgram;
        };
        p5.RendererGL.prototype._getLocation = function(shaderProgram, isImmediateMode) {
          var gl = this.GL;
          gl.useProgram(shaderProgram);
          shaderProgram.uPMatrixUniform = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
          shaderProgram.uMVMatrixUniform = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');
          if (isImmediateMode === undefined) {
            shaderProgram.uNMatrixUniform = gl.getUniformLocation(shaderProgram, 'uNormalMatrix');
            shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, 'uSampler');
          }
        };
        p5.RendererGL.prototype._setUniform1f = function(shaderKey, uniform, data) {
          var gl = this.GL;
          var shaderProgram = this.mHash[shaderKey];
          gl.useProgram(shaderProgram);
          shaderProgram[uniform] = gl.getUniformLocation(shaderProgram, uniform);
          gl.uniform1f(shaderProgram[uniform], data);
          return this;
        };
        p5.RendererGL.prototype._setMatrixUniforms = function(shaderKey) {
          var gl = this.GL;
          var shaderProgram = this.mHash[shaderKey];
          gl.useProgram(shaderProgram);
          gl.uniformMatrix4fv(shaderProgram.uPMatrixUniform, false, this.uPMatrix.mat4);
          gl.uniformMatrix4fv(shaderProgram.uMVMatrixUniform, false, this.uMVMatrix.mat4);
          this.uNMatrix.inverseTranspose(this.uMVMatrix);
          gl.uniformMatrix3fv(shaderProgram.uNMatrixUniform, false, this.uNMatrix.mat3);
        };
        p5.RendererGL.prototype._getShader = function(vertId, fragId, isImmediateMode) {
          var mId = vertId + '|' + fragId;
          if (!this.materialInHash(mId)) {
            var shaderProgram = this._initShaders(vertId, fragId, isImmediateMode);
            this.mHash[mId] = shaderProgram;
          }
          this.curShaderId = mId;
          return this.mHash[this.curShaderId];
        };
        p5.RendererGL.prototype._getCurShaderId = function() {
          var mId,
              shaderProgram;
          if (this.drawMode !== 'fill' && this.curShaderId === undefined) {
            mId = 'normalVert|normalFrag';
            shaderProgram = this._initShaders('normalVert', 'normalFrag');
            this.mHash[mId] = shaderProgram;
            this.curShaderId = mId;
          } else if (this.isImmediateDrawing && this.drawMode === 'fill') {
            mId = 'immediateVert|vertexColorFrag';
            shaderProgram = this._initShaders('immediateVert', 'vertexColorFrag');
            this.mHash[mId] = shaderProgram;
            this.curShaderId = mId;
          }
          return this.curShaderId;
        };
        p5.RendererGL.prototype.fill = function(v1, v2, v3, a) {
          var gl = this.GL;
          var shaderProgram;
          var colors = this._applyColorBlend.apply(this, arguments);
          this.curFillColor = colors;
          this.drawMode = 'fill';
          if (this.isImmediateDrawing) {
            shaderProgram = this._getShader('immediateVert', 'vertexColorFrag');
            gl.useProgram(shaderProgram);
          } else {
            shaderProgram = this._getShader('normalVert', 'basicFrag');
            gl.useProgram(shaderProgram);
            shaderProgram.uMaterialColor = gl.getUniformLocation(shaderProgram, 'uMaterialColor');
            gl.uniform4f(shaderProgram.uMaterialColor, colors[0], colors[1], colors[2], colors[3]);
          }
          return this;
        };
        p5.RendererGL.prototype.stroke = function(r, g, b, a) {
          var color = this._pInst.color.apply(this._pInst, arguments);
          var colorNormalized = color._array;
          this.curStrokeColor = colorNormalized;
          this.drawMode = 'stroke';
          return this;
        };
        p5.RendererGL.prototype._strokeCheck = function() {
          if (this.drawMode === 'stroke') {
            throw new Error('stroke for shapes in 3D not yet implemented, use fill for now :(');
          }
        };
        p5.RendererGL.prototype.strokeWeight = function(pointSize) {
          this.pointSize = pointSize;
          return this;
        };
        p5.RendererGL.prototype.geometryInHash = function(gId) {
          return this.gHash[gId] !== undefined;
        };
        p5.RendererGL.prototype.materialInHash = function(mId) {
          return this.mHash[mId] !== undefined;
        };
        p5.RendererGL.prototype.resize = function(w, h) {
          var gl = this.GL;
          p5.Renderer.prototype.resize.call(this, w, h);
          gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
          if (this._curCamera === 'default') {
            this._curCamera = null;
            this._setDefaultCamera();
          }
        };
        p5.RendererGL.prototype.clear = function() {
          var gl = this.GL;
          gl.clearColor(arguments[0], arguments[1], arguments[2], arguments[3]);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        };
        p5.RendererGL.prototype.translate = function(x, y, z) {
          this.uMVMatrix.translate([x, -y, z]);
          return this;
        };
        p5.RendererGL.prototype.scale = function(x, y, z) {
          this.uMVMatrix.scale([x, y, z]);
          return this;
        };
        p5.RendererGL.prototype.rotate = function(rad, axis) {
          this.uMVMatrix.rotate(rad, axis);
          return this;
        };
        p5.RendererGL.prototype.rotateX = function(rad) {
          this.rotate(rad, [1, 0, 0]);
          return this;
        };
        p5.RendererGL.prototype.rotateY = function(rad) {
          this.rotate(rad, [0, 1, 0]);
          return this;
        };
        p5.RendererGL.prototype.rotateZ = function(rad) {
          this.rotate(rad, [0, 0, 1]);
          return this;
        };
        p5.RendererGL.prototype.push = function() {
          uMVMatrixStack.push(this.uMVMatrix.copy());
        };
        p5.RendererGL.prototype.pop = function() {
          if (uMVMatrixStack.length === 0) {
            throw new Error('Invalid popMatrix!');
          }
          this.uMVMatrix = uMVMatrixStack.pop();
        };
        p5.RendererGL.prototype.resetMatrix = function() {
          this.uMVMatrix = p5.Matrix.identity();
          this.translate(0, 0, -800);
          return this;
        };
        p5.RendererGL.prototype._applyTextProperties = function() {
          console.error('text commands not yet implemented in webgl');
        };
        module.exports = p5.RendererGL;
      }, {
        "../core/core": 42,
        "../core/p5.Renderer": 48,
        "./p5.Matrix": 88,
        "./shader": 93
      }],
      92: [function(_dereq_, module, exports) {
        'use strict';
        var p5 = _dereq_('../core/core');
        _dereq_('./p5.Geometry');
        p5.prototype.plane = function() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          var width = args[0] || 50;
          var height = args[1] || width;
          var detailX = typeof args[2] === 'number' ? args[2] : 1;
          var detailY = typeof args[3] === 'number' ? args[3] : 1;
          var gId = 'plane|' + width + '|' + height + '|' + detailX + '|' + detailY;
          if (!this._renderer.geometryInHash(gId)) {
            var _plane = function() {
              var u,
                  v,
                  p;
              for (var i = 0; i <= this.detailY; i++) {
                v = i / this.detailY;
                for (var j = 0; j <= this.detailX; j++) {
                  u = j / this.detailX;
                  p = new p5.Vector(width * u - width / 2, height * v - height / 2, 0);
                  this.vertices.push(p);
                  this.uvs.push([u, v]);
                }
              }
            };
            var planeGeom = new p5.Geometry(detailX, detailY, _plane);
            planeGeom.computeFaces().computeNormals();
            this._renderer.createBuffers(gId, planeGeom);
          }
          this._renderer.drawBuffers(gId);
        };
        p5.prototype.box = function() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          var width = args[0] || 50;
          var height = args[1] || width;
          var depth = args[2] || width;
          var detailX = typeof args[3] === 'number' ? args[3] : 4;
          var detailY = typeof args[4] === 'number' ? args[4] : 4;
          var gId = 'box|' + width + '|' + height + '|' + depth + '|' + detailX + '|' + detailY;
          if (!this._renderer.geometryInHash(gId)) {
            var _box = function() {
              var cubeIndices = [[0, 4, 2, 6], [1, 3, 5, 7], [0, 1, 4, 5], [2, 6, 3, 7], [0, 2, 1, 3], [4, 5, 6, 7]];
              var id = 0;
              for (var i = 0; i < cubeIndices.length; i++) {
                var cubeIndex = cubeIndices[i];
                var v = i * 4;
                for (var j = 0; j < 4; j++) {
                  var d = cubeIndex[j];
                  var octant = new p5.Vector(((d & 1) * 2 - 1) * width / 2, ((d & 2) - 1) * height / 2, ((d & 4) / 2 - 1) * depth / 2);
                  this.vertices.push(octant);
                  this.uvs.push([j & 1, (j & 2) / 2]);
                  id++;
                }
                this.faces.push([v, v + 1, v + 2]);
                this.faces.push([v + 2, v + 1, v + 3]);
              }
            };
            var boxGeom = new p5.Geometry(detailX, detailY, _box);
            boxGeom.computeNormals();
            this._renderer.createBuffers(gId, boxGeom);
          }
          this._renderer.drawBuffers(gId);
          return this;
        };
        p5.prototype.sphere = function() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          var radius = args[0] || 50;
          var detailX = typeof args[1] === 'number' ? args[1] : 24;
          var detailY = typeof args[2] === 'number' ? args[2] : 16;
          var gId = 'sphere|' + radius + '|' + detailX + '|' + detailY;
          if (!this._renderer.geometryInHash(gId)) {
            var _sphere = function() {
              var u,
                  v,
                  p;
              for (var i = 0; i <= this.detailY; i++) {
                v = i / this.detailY;
                for (var j = 0; j <= this.detailX; j++) {
                  u = j / this.detailX;
                  var theta = 2 * Math.PI * u;
                  var phi = Math.PI * v - Math.PI / 2;
                  p = new p5.Vector(radius * Math.cos(phi) * Math.sin(theta), radius * Math.sin(phi), radius * Math.cos(phi) * Math.cos(theta));
                  this.vertices.push(p);
                  this.uvs.push([u, v]);
                }
              }
            };
            var sphereGeom = new p5.Geometry(detailX, detailY, _sphere);
            sphereGeom.computeFaces().computeNormals().averageNormals().averagePoleNormals();
            this._renderer.createBuffers(gId, sphereGeom);
          }
          this._renderer.drawBuffers(gId);
          return this;
        };
        var _truncatedCone = function(bottomRadius, topRadius, height, detailX, detailY, topCap, bottomCap) {
          detailX = (detailX < 3) ? 3 : detailX;
          detailY = (detailY < 1) ? 1 : detailY;
          topCap = (topCap === undefined) ? true : topCap;
          bottomCap = (bottomCap === undefined) ? true : bottomCap;
          var extra = (topCap ? 2 : 0) + (bottomCap ? 2 : 0);
          var vertsAroundEdge = detailX + 1;
          var slant = Math.atan2(bottomRadius - topRadius, height);
          var start = topCap ? -2 : 0;
          var end = detailY + (bottomCap ? 2 : 0);
          var yy,
              ii;
          for (yy = start; yy <= end; ++yy) {
            var v = yy / detailY;
            var y = height * v;
            var ringRadius;
            if (yy < 0) {
              y = 0;
              v = 1;
              ringRadius = bottomRadius;
            } else if (yy > detailY) {
              y = height;
              v = 1;
              ringRadius = topRadius;
            } else {
              ringRadius = bottomRadius + (topRadius - bottomRadius) * (yy / detailY);
            }
            if (yy === -2 || yy === detailY + 2) {
              ringRadius = 0;
              v = 0;
            }
            y -= height / 2;
            for (ii = 0; ii < vertsAroundEdge; ++ii) {
              this.vertices.push(new p5.Vector(Math.sin(ii * Math.PI * 2 / detailX) * ringRadius, y, Math.cos(ii * Math.PI * 2 / detailX) * ringRadius));
              this.vertexNormals.push(new p5.Vector((yy < 0 || yy > detailY) ? 0 : (Math.sin(ii * Math.PI * 2 / detailX) * Math.cos(slant)), (yy < 0) ? -1 : (yy > detailY ? 1 : Math.sin(slant)), (yy < 0 || yy > detailY) ? 0 : (Math.cos(ii * Math.PI * 2 / detailX) * Math.cos(slant))));
              this.uvs.push([(ii / detailX), v]);
            }
          }
          for (yy = 0; yy < detailY + extra; ++yy) {
            for (ii = 0; ii < detailX; ++ii) {
              this.faces.push([vertsAroundEdge * (yy + 0) + 0 + ii, vertsAroundEdge * (yy + 0) + 1 + ii, vertsAroundEdge * (yy + 1) + 1 + ii]);
              this.faces.push([vertsAroundEdge * (yy + 0) + 0 + ii, vertsAroundEdge * (yy + 1) + 1 + ii, vertsAroundEdge * (yy + 1) + 0 + ii]);
            }
          }
        };
        p5.prototype.cylinder = function() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          var radius = args[0] || 50;
          var height = args[1] || radius;
          var detailX = typeof args[2] === 'number' ? args[2] : 24;
          var detailY = typeof args[3] === 'number' ? args[3] : 16;
          var gId = 'cylinder|' + radius + '|' + height + '|' + detailX + '|' + detailY;
          if (!this._renderer.geometryInHash(gId)) {
            var cylinderGeom = new p5.Geometry(detailX, detailY);
            _truncatedCone.call(cylinderGeom, radius, radius, height, detailX, detailY, true, true);
            cylinderGeom.computeNormals();
            this._renderer.createBuffers(gId, cylinderGeom);
          }
          this._renderer.drawBuffers(gId);
          return this;
        };
        p5.prototype.cone = function() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          var baseRadius = args[0] || 50;
          var height = args[1] || baseRadius;
          var detailX = typeof args[2] === 'number' ? args[2] : 24;
          var detailY = typeof args[3] === 'number' ? args[3] : 16;
          var gId = 'cone|' + baseRadius + '|' + height + '|' + detailX + '|' + detailY;
          if (!this._renderer.geometryInHash(gId)) {
            var coneGeom = new p5.Geometry(detailX, detailY);
            _truncatedCone.call(coneGeom, baseRadius, 0, height, detailX, detailY, true, true);
            coneGeom.computeNormals();
            this._renderer.createBuffers(gId, coneGeom);
          }
          this._renderer.drawBuffers(gId);
          return this;
        };
        p5.prototype.ellipsoid = function() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          var detailX = typeof args[3] === 'number' ? args[3] : 24;
          var detailY = typeof args[4] === 'number' ? args[4] : 24;
          var radiusX = args[0] || 50;
          var radiusY = args[1] || radiusX;
          var radiusZ = args[2] || radiusX;
          var gId = 'ellipsoid|' + radiusX + '|' + radiusY + '|' + radiusZ + '|' + detailX + '|' + detailY;
          if (!this._renderer.geometryInHash(gId)) {
            var _ellipsoid = function() {
              var u,
                  v,
                  p;
              for (var i = 0; i <= this.detailY; i++) {
                v = i / this.detailY;
                for (var j = 0; j <= this.detailX; j++) {
                  u = j / this.detailX;
                  var theta = 2 * Math.PI * u;
                  var phi = Math.PI * v - Math.PI / 2;
                  p = new p5.Vector(radiusX * Math.cos(phi) * Math.sin(theta), radiusY * Math.sin(phi), radiusZ * Math.cos(phi) * Math.cos(theta));
                  this.vertices.push(p);
                  this.uvs.push([u, v]);
                }
              }
            };
            var ellipsoidGeom = new p5.Geometry(detailX, detailY, _ellipsoid);
            ellipsoidGeom.computeFaces().computeNormals();
            this._renderer.createBuffers(gId, ellipsoidGeom);
          }
          this._renderer.drawBuffers(gId);
          return this;
        };
        p5.prototype.torus = function() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          var detailX = typeof args[2] === 'number' ? args[2] : 24;
          var detailY = typeof args[3] === 'number' ? args[3] : 16;
          var radius = args[0] || 50;
          var tubeRadius = args[1] || 10;
          var gId = 'torus|' + radius + '|' + tubeRadius + '|' + detailX + '|' + detailY;
          if (!this._renderer.geometryInHash(gId)) {
            var _torus = function() {
              var u,
                  v,
                  p;
              for (var i = 0; i <= this.detailY; i++) {
                v = i / this.detailY;
                for (var j = 0; j <= this.detailX; j++) {
                  u = j / this.detailX;
                  var theta = 2 * Math.PI * u;
                  var phi = 2 * Math.PI * v;
                  p = new p5.Vector((radius + tubeRadius * Math.cos(phi)) * Math.cos(theta), (radius + tubeRadius * Math.cos(phi)) * Math.sin(theta), tubeRadius * Math.sin(phi));
                  this.vertices.push(p);
                  this.uvs.push([u, v]);
                }
              }
            };
            var torusGeom = new p5.Geometry(detailX, detailY, _torus);
            torusGeom.computeFaces().computeNormals().averageNormals();
            this._renderer.createBuffers(gId, torusGeom);
          }
          this._renderer.drawBuffers(gId);
          return this;
        };
        p5.RendererGL.prototype.point = function(x, y, z) {
          console.log('point not yet implemented in webgl');
          return this;
        };
        p5.RendererGL.prototype.triangle = function(args) {
          var x1 = args[0],
              y1 = args[1];
          var x2 = args[2],
              y2 = args[3];
          var x3 = args[4],
              y3 = args[5];
          var gId = 'tri|' + x1 + '|' + y1 + '|' + x2 + '|' + y2 + '|' + x3 + '|' + y3;
          if (!this.geometryInHash(gId)) {
            var _triangle = function() {
              var vertices = [];
              vertices.push(new p5.Vector(x1, y1, 0));
              vertices.push(new p5.Vector(x2, y2, 0));
              vertices.push(new p5.Vector(x3, y3, 0));
              this.vertices = vertices;
              this.faces = [[0, 1, 2]];
              this.uvs = [[0, 0], [0, 1], [1, 1]];
            };
            var triGeom = new p5.Geometry(1, 1, _triangle);
            triGeom.computeNormals();
            this.createBuffers(gId, triGeom);
          }
          this.drawBuffers(gId);
          return this;
        };
        p5.RendererGL.prototype.ellipse = function(args) {
          var x = args[0];
          var y = args[1];
          var width = args[2];
          var height = args[3];
          var detailX = args[4] || 24;
          var detailY = args[5] || 16;
          var gId = 'ellipse|' + args[0] + '|' + args[1] + '|' + args[2] + '|' + args[3];
          if (!this.geometryInHash(gId)) {
            var _ellipse = function() {
              var u,
                  v,
                  p;
              var centerX = x + width * 0.5;
              var centerY = y + height * 0.5;
              for (var i = 0; i <= this.detailY; i++) {
                v = i / this.detailY;
                for (var j = 0; j <= this.detailX; j++) {
                  u = j / this.detailX;
                  var theta = 2 * Math.PI * u;
                  if (v === 0) {
                    p = new p5.Vector(centerX, centerY, 0);
                  } else {
                    var _x = centerX + width * 0.5 * Math.cos(theta);
                    var _y = centerY + height * 0.5 * Math.sin(theta);
                    p = new p5.Vector(_x, _y, 0);
                  }
                  this.vertices.push(p);
                  this.uvs.push([u, v]);
                }
              }
            };
            var ellipseGeom = new p5.Geometry(detailX, detailY, _ellipse);
            ellipseGeom.computeFaces().computeNormals();
            this.createBuffers(gId, ellipseGeom);
          }
          this.drawBuffers(gId);
          return this;
        };
        p5.RendererGL.prototype.rect = function(args) {
          var gId = 'rect|' + args[0] + '|' + args[1] + '|' + args[2] + '|' + args[3];
          var x = args[0];
          var y = args[1];
          var width = args[2];
          var height = args[3];
          var detailX = args[4] || 24;
          var detailY = args[5] || 16;
          if (!this.geometryInHash(gId)) {
            var _rect = function() {
              var u,
                  v,
                  p;
              for (var i = 0; i <= this.detailY; i++) {
                v = i / this.detailY;
                for (var j = 0; j <= this.detailX; j++) {
                  u = j / this.detailX;
                  p = new p5.Vector(x + (width * u), y + (height * v), 0);
                  this.vertices.push(p);
                  this.uvs.push([u, v]);
                }
              }
            };
            var rectGeom = new p5.Geometry(detailX, detailY, _rect);
            rectGeom.computeFaces().computeNormals();
            this.createBuffers(gId, rectGeom);
          }
          this.drawBuffers(gId);
          return this;
        };
        p5.RendererGL.prototype.quad = function() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
          }
          var x1 = args[0],
              y1 = args[1],
              x2 = args[2],
              y2 = args[3],
              x3 = args[4],
              y3 = args[5],
              x4 = args[6],
              y4 = args[7];
          var gId = 'quad|' + x1 + '|' + y1 + '|' + x2 + '|' + y2 + '|' + x3 + '|' + y3 + '|' + x4 + '|' + y4;
          if (!this.geometryInHash(gId)) {
            var _quad = function() {
              this.vertices.push(new p5.Vector(x1, y1, 0));
              this.vertices.push(new p5.Vector(x2, y2, 0));
              this.vertices.push(new p5.Vector(x3, y3, 0));
              this.vertices.push(new p5.Vector(x4, y4, 0));
              this.uvs.push([0, 0], [1, 0], [1, 1], [0, 1]);
            };
            var quadGeom = new p5.Geometry(2, 2, _quad);
            quadGeom.computeNormals();
            quadGeom.faces = [[0, 1, 2], [2, 3, 0]];
            this.createBuffers(gId, quadGeom);
          }
          this.drawBuffers(gId);
          return this;
        };
        p5.RendererGL.prototype.bezier = function(args) {
          var bezierDetail = args[12] || 20;
          this.beginShape();
          var coeff = [0, 0, 0, 0];
          var vertex = [0, 0, 0];
          for (var i = 0; i <= bezierDetail; i++) {
            coeff[0] = Math.pow(1 - (i / bezierDetail), 3);
            coeff[1] = (3 * (i / bezierDetail)) * (Math.pow(1 - (i / bezierDetail), 2));
            coeff[2] = (3 * Math.pow(i / bezierDetail, 2)) * (1 - (i / bezierDetail));
            coeff[3] = Math.pow(i / bezierDetail, 3);
            vertex[0] = args[0] * coeff[0] + args[3] * coeff[1] + args[6] * coeff[2] + args[9] * coeff[3];
            vertex[1] = args[1] * coeff[0] + args[4] * coeff[1] + args[7] * coeff[2] + args[10] * coeff[3];
            vertex[2] = args[2] * coeff[0] + args[5] * coeff[1] + args[8] * coeff[2] + args[11] * coeff[3];
            this.vertex(vertex[0], vertex[1], vertex[2]);
          }
          this.endShape();
          return this;
        };
        p5.RendererGL.prototype.curve = function(args) {
          var curveDetail = args[12];
          this.beginShape();
          var coeff = [0, 0, 0, 0];
          var vertex = [0, 0, 0];
          for (var i = 0; i <= curveDetail; i++) {
            coeff[0] = Math.pow((i / curveDetail), 3) * 0.5;
            coeff[1] = Math.pow((i / curveDetail), 2) * 0.5;
            coeff[2] = (i / curveDetail) * 0.5;
            coeff[3] = 0.5;
            vertex[0] = coeff[0] * (-args[0] + (3 * args[3]) - (3 * args[6]) + args[9]) + coeff[1] * ((2 * args[0]) - (5 * args[3]) + (4 * args[6]) - args[9]) + coeff[2] * (-args[0] + args[6]) + coeff[3] * (2 * args[3]);
            vertex[1] = coeff[0] * (-args[1] + (3 * args[4]) - (3 * args[7]) + args[10]) + coeff[1] * ((2 * args[1]) - (5 * args[4]) + (4 * args[7]) - args[10]) + coeff[2] * (-args[1] + args[7]) + coeff[3] * (2 * args[4]);
            vertex[2] = coeff[0] * (-args[2] + (3 * args[5]) - (3 * args[8]) + args[11]) + coeff[1] * ((2 * args[2]) - (5 * args[5]) + (4 * args[8]) - args[11]) + coeff[2] * (-args[2] + args[8]) + coeff[3] * (2 * args[5]);
            this.vertex(vertex[0], vertex[1], vertex[2]);
          }
          this.endShape();
          return this;
        };
        module.exports = p5;
      }, {
        "../core/core": 42,
        "./p5.Geometry": 87
      }],
      93: [function(_dereq_, module, exports) {
        module.exports = {
          immediateVert: "attribute vec3 aPosition;\nattribute vec4 aVertexColor;\n\nuniform mat4 uModelViewMatrix;\nuniform mat4 uProjectionMatrix;\nuniform float uResolution;\nuniform float uPointSize;\n\nvarying vec4 vColor;\nvoid main(void) {\n  vec4 positionVec4 = vec4(aPosition * vec3(1.0, -1.0, 1.0), 1.0);\n  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;\n  vColor = aVertexColor;\n  gl_PointSize = uPointSize;\n}\n",
          vertexColorVert: "attribute vec3 aPosition;\nattribute vec4 aVertexColor;\n\nuniform mat4 uModelViewMatrix;\nuniform mat4 uProjectionMatrix;\n\nvarying vec4 vColor;\n\nvoid main(void) {\n  vec4 positionVec4 = vec4(aPosition * vec3(1.0, -1.0, 1.0), 1.0);\n  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;\n  vColor = aVertexColor;\n}\n",
          vertexColorFrag: "precision mediump float;\nvarying vec4 vColor;\nvoid main(void) {\n  gl_FragColor = vColor;\n}",
          normalVert: "attribute vec3 aPosition;\nattribute vec3 aNormal;\nattribute vec2 aTexCoord;\n\nuniform mat4 uModelViewMatrix;\nuniform mat4 uProjectionMatrix;\nuniform mat3 uNormalMatrix;\n\nvarying vec3 vVertexNormal;\nvarying highp vec2 vVertTexCoord;\n\nvoid main(void) {\n  vec4 positionVec4 = vec4(aPosition * vec3(1.0, -1.0, 1.0), 1.0);\n  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;\n  vVertexNormal = vec3( uNormalMatrix * aNormal );\n  vVertTexCoord = aTexCoord;\n}\n",
          normalFrag: "precision mediump float;\nvarying vec3 vVertexNormal;\nvoid main(void) {\n  gl_FragColor = vec4(vVertexNormal, 1.0);\n}",
          basicFrag: "precision mediump float;\nvarying vec3 vVertexNormal;\nuniform vec4 uMaterialColor;\nvoid main(void) {\n  gl_FragColor = uMaterialColor;\n}",
          lightVert: "attribute vec3 aPosition;\nattribute vec3 aNormal;\nattribute vec2 aTexCoord;\n\nuniform mat4 uModelViewMatrix;\nuniform mat4 uProjectionMatrix;\nuniform mat3 uNormalMatrix;\nuniform int uAmbientLightCount;\nuniform int uDirectionalLightCount;\nuniform int uPointLightCount;\n\nuniform vec3 uAmbientColor[8];\nuniform vec3 uLightingDirection[8];\nuniform vec3 uDirectionalColor[8];\nuniform vec3 uPointLightLocation[8];\nuniform vec3 uPointLightColor[8];\nuniform bool uSpecular;\n\nvarying vec3 vVertexNormal;\nvarying vec2 vVertTexCoord;\nvarying vec3 vLightWeighting;\n\nvec3 ambientLightFactor = vec3(0.0, 0.0, 0.0);\nvec3 directionalLightFactor = vec3(0.0, 0.0, 0.0);\nvec3 pointLightFactor = vec3(0.0, 0.0, 0.0);\nvec3 pointLightFactor2 = vec3(0.0, 0.0, 0.0);\n\nvoid main(void){\n\n  vec4 positionVec4 = vec4(aPosition, 1.0);\n  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;\n\n  vec3 vertexNormal = vec3( uNormalMatrix * aNormal );\n  vVertexNormal = vertexNormal;\n  vVertTexCoord = aTexCoord;\n\n  vec4 mvPosition = uModelViewMatrix * vec4(aPosition, 1.0);\n  vec3 eyeDirection = normalize(-mvPosition.xyz);\n\n  float shininess = 32.0;\n  float specularFactor = 2.0;\n  float diffuseFactor = 0.3;\n\n  for(int i = 0; i < 8; i++){\n    if(uAmbientLightCount == i) break;\n    ambientLightFactor += uAmbientColor[i];\n  }\n\n  for(int j = 0; j < 8; j++){\n    if(uDirectionalLightCount == j) break;\n    vec3 dir = uLightingDirection[j];\n    float directionalLightWeighting = max(dot(vertexNormal, dir), 0.0);\n    directionalLightFactor += uDirectionalColor[j] * directionalLightWeighting;\n  }\n\n  for(int k = 0; k < 8; k++){\n    if(uPointLightCount == k) break;\n    vec3 loc = uPointLightLocation[k];\n    vec3 lightDirection = normalize(loc - mvPosition.xyz);\n\n    float directionalLightWeighting = max(dot(vertexNormal, lightDirection), 0.0);\n    pointLightFactor += uPointLightColor[k] * directionalLightWeighting;\n\n    //factor2 for specular\n    vec3 reflectionDirection = reflect(-lightDirection, vertexNormal);\n    float specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), shininess);\n\n    pointLightFactor2 += uPointLightColor[k] * (specularFactor * specularLightWeighting\n      +  directionalLightWeighting * diffuseFactor);\n  }\n\n  if(!uSpecular){\n    vLightWeighting =  ambientLightFactor + directionalLightFactor + pointLightFactor;\n  }else{\n    vLightWeighting = ambientLightFactor + directionalLightFactor + pointLightFactor2;\n  }\n\n}\n",
          lightTextureFrag: "precision mediump float;\n\nuniform vec4 uMaterialColor;\nuniform sampler2D uSampler;\nuniform bool isTexture;\n\nvarying vec3 vLightWeighting;\nvarying highp vec2 vVertTexCoord;\n\nvoid main(void) {\n  if(!isTexture){\n    gl_FragColor = vec4(vec3(uMaterialColor.rgb * vLightWeighting), uMaterialColor.a);\n  }else{\n    vec4 textureColor = texture2D(uSampler, vVertTexCoord);\n    if(vLightWeighting == vec3(0., 0., 0.)){\n      gl_FragColor = textureColor;\n    }else{\n      gl_FragColor = vec4(vec3(textureColor.rgb * vLightWeighting), textureColor.a);\n    }\n  }\n}"
        };
      }, {}]
    }, {}, [33])(33);
  });
})(require('buffer').Buffer, require('process'));
