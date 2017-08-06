/* */ 
(function(process) {
  'use strict';
  if (THREE.OBJLoader2 === undefined) {
    THREE.OBJLoader2 = {};
  }
  THREE.OBJLoader2.WWOBJLoader2 = (function() {
    var WWOBJLOADER2_VERSION = '1.2.1';
    var Validator = THREE.OBJLoader2.prototype._getValidator();
    function WWOBJLoader2() {
      this._init();
    }
    WWOBJLoader2.prototype._init = function() {
      console.log("Using THREE.OBJLoader2.WWOBJLoader2 version: " + WWOBJLOADER2_VERSION);
      if (window.Worker === undefined)
        throw "This browser does not support web workers!";
      if (window.Blob === undefined)
        throw "This browser does not support Blob!";
      if (!typeof window.URL.createObjectURL === 'function')
        throw "This browser does not support Object creation from URL!";
      this.instanceNo = 0;
      this.worker = null;
      this.workerCode = null;
      this.debug = false;
      this.sceneGraphBaseNode = null;
      this.streamMeshes = true;
      this.meshStore = null;
      this.modelName = 'none';
      this.validated = false;
      this.running = false;
      this.requestTerminate = false;
      this.clearAllCallbacks();
      this.manager = THREE.DefaultLoadingManager;
      this.fileLoader = new THREE.FileLoader(this.manager);
      this.mtlLoader = null;
      this.crossOrigin = null;
      this.dataAvailable = false;
      this.objAsArrayBuffer = null;
      this.fileObj = null;
      this.pathObj = null;
      this.fileMtl = null;
      this.mtlAsString = null;
      this.texturePath = null;
      this.materials = [];
      this.counter = 0;
    };
    WWOBJLoader2.prototype.setDebug = function(enabled) {
      this.debug = enabled;
    };
    WWOBJLoader2.prototype.setCrossOrigin = function(crossOrigin) {
      this.crossOrigin = crossOrigin;
    };
    WWOBJLoader2.prototype.registerCallbackProgress = function(callbackProgress) {
      if (Validator.isValid(callbackProgress))
        this.callbacks.progress.push(callbackProgress);
    };
    WWOBJLoader2.prototype.registerCallbackCompletedLoading = function(callbackCompletedLoading) {
      if (Validator.isValid(callbackCompletedLoading))
        this.callbacks.completedLoading.push(callbackCompletedLoading);
    };
    WWOBJLoader2.prototype.registerCallbackMaterialsLoaded = function(callbackMaterialsLoaded) {
      if (Validator.isValid(callbackMaterialsLoaded))
        this.callbacks.materialsLoaded.push(callbackMaterialsLoaded);
    };
    WWOBJLoader2.prototype.registerCallbackMeshLoaded = function(callbackMeshLoaded) {
      if (Validator.isValid(callbackMeshLoaded))
        this.callbacks.meshLoaded.push(callbackMeshLoaded);
    };
    WWOBJLoader2.prototype.registerCallbackErrorWhileLoading = function(callbackErrorWhileLoading) {
      if (Validator.isValid(callbackErrorWhileLoading))
        this.callbacks.errorWhileLoading.push(callbackErrorWhileLoading);
    };
    WWOBJLoader2.prototype.clearAllCallbacks = function() {
      this.callbacks = {
        progress: [],
        completedLoading: [],
        errorWhileLoading: [],
        materialsLoaded: [],
        meshLoaded: []
      };
    };
    WWOBJLoader2.prototype.setRequestTerminate = function(requestTerminate) {
      this.requestTerminate = requestTerminate === true;
    };
    WWOBJLoader2.prototype._validate = function() {
      if (this.validated)
        return;
      if (!Validator.isValid(this.worker)) {
        this._buildWebWorkerCode();
        var blob = new Blob([this.workerCode], {type: 'text/plain'});
        this.worker = new Worker(window.URL.createObjectURL(blob));
        var scope = this;
        var scopeFunction = function(e) {
          scope._receiveWorkerMessage(e);
        };
        this.worker.addEventListener('message', scopeFunction, false);
      }
      this.sceneGraphBaseNode = null;
      this.streamMeshes = true;
      this.meshStore = [];
      this.modelName = 'none';
      this.validated = true;
      this.running = true;
      this.requestTerminate = false;
      this.fileLoader = Validator.verifyInput(this.fileLoader, new THREE.FileLoader(this.manager));
      this.mtlLoader = Validator.verifyInput(this.mtlLoader, new THREE.MTLLoader());
      if (Validator.isValid(this.crossOrigin))
        this.mtlLoader.setCrossOrigin(this.crossOrigin);
      this.dataAvailable = false;
      this.fileObj = null;
      this.pathObj = null;
      this.fileMtl = null;
      this.texturePath = null;
      this.objAsArrayBuffer = null;
      this.mtlAsString = null;
      this.materials = [];
      var defaultMaterial = new THREE.MeshStandardMaterial({color: 0xDCF1FF});
      defaultMaterial.name = 'defaultMaterial';
      this.materials[defaultMaterial.name] = defaultMaterial;
      this.counter = 0;
    };
    WWOBJLoader2.prototype.prepareRun = function(params) {
      this._validate();
      this.dataAvailable = params.dataAvailable;
      this.modelName = params.modelName;
      console.time('WWOBJLoader2');
      if (this.dataAvailable) {
        if (!(params.objAsArrayBuffer instanceof Uint8Array)) {
          throw 'Provided input is not of type arraybuffer! Aborting...';
        }
        this.worker.postMessage({
          cmd: 'init',
          debug: this.debug
        });
        this.objAsArrayBuffer = params.objAsArrayBuffer;
        this.mtlAsString = params.mtlAsString;
      } else {
        if (!(typeof(params.fileObj) === 'string' || params.fileObj instanceof String)) {
          throw 'Provided file is not properly defined! Aborting...';
        }
        this.worker.postMessage({
          cmd: 'init',
          debug: this.debug
        });
        this.fileObj = params.fileObj;
        this.pathObj = params.pathObj;
        this.fileMtl = params.fileMtl;
      }
      this.setRequestTerminate(params.requestTerminate);
      this.pathTexture = params.pathTexture;
      this.sceneGraphBaseNode = params.sceneGraphBaseNode;
      this.streamMeshes = params.streamMeshes;
      if (!this.streamMeshes)
        this.meshStore = [];
    };
    WWOBJLoader2.prototype.run = function() {
      var scope = this;
      var processLoadedMaterials = function(materialCreator) {
        var materialCreatorMaterials = [];
        var materialNames = [];
        if (Validator.isValid(materialCreator)) {
          materialCreator.preload();
          materialCreatorMaterials = materialCreator.materials;
          for (var materialName in materialCreatorMaterials) {
            if (materialCreatorMaterials.hasOwnProperty(materialName)) {
              materialNames.push(materialName);
              scope.materials[materialName] = materialCreatorMaterials[materialName];
            }
          }
        }
        scope.worker.postMessage({
          cmd: 'setMaterials',
          materialNames: materialNames
        });
        var materialsFromCallback;
        var callbackMaterialsLoaded;
        for (var index in scope.callbacks.materialsLoaded) {
          callbackMaterialsLoaded = scope.callbacks.materialsLoaded[index];
          materialsFromCallback = callbackMaterialsLoaded(scope.materials);
          if (Validator.isValid(materialsFromCallback))
            scope.materials = materialsFromCallback;
        }
        if (scope.dataAvailable && scope.objAsArrayBuffer) {
          scope.worker.postMessage({
            cmd: 'run',
            objAsArrayBuffer: scope.objAsArrayBuffer
          }, [scope.objAsArrayBuffer.buffer]);
        } else {
          var refPercentComplete = 0;
          var percentComplete = 0;
          var output;
          var onLoad = function(objAsArrayBuffer) {
            scope._announceProgress('Running web worker!');
            scope.objAsArrayBuffer = new Uint8Array(objAsArrayBuffer);
            scope.worker.postMessage({
              cmd: 'run',
              objAsArrayBuffer: scope.objAsArrayBuffer
            }, [scope.objAsArrayBuffer.buffer]);
          };
          var onProgress = function(event) {
            if (!event.lengthComputable)
              return;
            percentComplete = Math.round(event.loaded / event.total * 100);
            if (percentComplete > refPercentComplete) {
              refPercentComplete = percentComplete;
              output = 'Download of "' + scope.fileObj + '": ' + percentComplete + '%';
              console.log(output);
              scope._announceProgress(output);
            }
          };
          var onError = function(event) {
            output = 'Error occurred while downloading "' + scope.fileObj + '"';
            console.error(output + ': ' + event);
            scope._announceProgress(output);
            scope._finalize('error');
          };
          scope.fileLoader.setPath(scope.pathObj);
          scope.fileLoader.setResponseType('arraybuffer');
          scope.fileLoader.load(scope.fileObj, onLoad, onProgress, onError);
        }
        console.timeEnd('Loading MTL textures');
      };
      this.mtlLoader.setPath(this.pathTexture);
      if (this.dataAvailable) {
        processLoadedMaterials(Validator.isValid(this.mtlAsString) ? this.mtlLoader.parse(this.mtlAsString) : null);
      } else {
        if (Validator.isValid(this.fileMtl)) {
          var onError = function(event) {
            output = 'Error occurred while downloading "' + scope.fileMtl + '"';
            console.error(output + ': ' + event);
            scope._announceProgress(output);
            scope._finalize('error');
          };
          this.mtlLoader.load(this.fileMtl, processLoadedMaterials, undefined, onError);
        } else {
          processLoadedMaterials();
        }
      }
    };
    WWOBJLoader2.prototype._receiveWorkerMessage = function(event) {
      var payload = event.data;
      switch (payload.cmd) {
        case 'objData':
          this.counter++;
          var meshName = payload.meshName;
          var bufferGeometry = new THREE.BufferGeometry();
          bufferGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(payload.vertices), 3));
          if (Validator.isValid(payload.normals)) {
            bufferGeometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(payload.normals), 3));
          } else {
            bufferGeometry.computeVertexNormals();
          }
          if (Validator.isValid(payload.uvs)) {
            bufferGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(payload.uvs), 2));
          }
          var materialDescriptions = payload.materialDescriptions;
          var materialDescription;
          var material;
          var materialName;
          var createMultiMaterial = payload.multiMaterial;
          var multiMaterials = [];
          var key;
          for (key in materialDescriptions) {
            materialDescription = materialDescriptions[key];
            material = this.materials[materialDescription.name];
            if (materialDescription.default) {
              material = this.materials['defaultMaterial'];
            } else if (materialDescription.clone) {
              materialName = material.name + '_flat';
              var materialClone = this.materials[materialName];
              if (!materialClone) {
                materialClone = material.clone();
                materialClone.name = materialName;
                materialClone.shading = THREE.FlatShading;
                this.materials[materialName] = name;
              }
            } else if (!material) {
              material = this.materials['defaultMaterial'];
            }
            if (createMultiMaterial)
              multiMaterials.push(material);
          }
          if (createMultiMaterial) {
            material = multiMaterials;
            var materialGroups = payload.materialGroups;
            var materialGroup;
            for (key in materialGroups) {
              materialGroup = materialGroups[key];
              bufferGeometry.addGroup(materialGroup.start, materialGroup.count, materialGroup.index);
            }
          }
          var callbackMeshLoaded;
          var callbackMeshLoadedResult;
          var disregardMesh = false;
          for (var index in this.callbacks.meshLoaded) {
            callbackMeshLoaded = this.callbacks.meshLoaded[index];
            callbackMeshLoadedResult = callbackMeshLoaded(meshName, bufferGeometry, material);
            if (Validator.isValid(callbackMeshLoadedResult)) {
              if (callbackMeshLoadedResult.disregardMesh) {
                disregardMesh = true;
                break;
              }
              if (callbackMeshLoadedResult.replaceBufferGeometry)
                bufferGeometry = callbackMeshLoadedResult.bufferGeometry;
              if (callbackMeshLoadedResult.replaceMaterial)
                material = callbackMeshLoadedResult.material;
            }
          }
          if (!disregardMesh) {
            var mesh = new THREE.Mesh(bufferGeometry, material);
            mesh.name = meshName;
            if (this.streamMeshes) {
              this.sceneGraphBaseNode.add(mesh);
            } else {
              this.meshStore.push(mesh);
            }
            this._announceProgress('Adding mesh (' + this.counter + '):', meshName);
          } else {
            this._announceProgress('Removing mesh:', meshName);
          }
          break;
        case 'complete':
          if (!this.streamMeshes) {
            for (var meshStoreKey in this.meshStore) {
              if (this.meshStore.hasOwnProperty(meshStoreKey))
                this.sceneGraphBaseNode.add(this.meshStore[meshStoreKey]);
            }
          }
          console.timeEnd('WWOBJLoader2');
          if (Validator.isValid(payload.msg)) {
            this._announceProgress(payload.msg);
          } else {
            this._announceProgress('');
          }
          this._finalize('complete');
          break;
        case 'report_progress':
          this._announceProgress('', payload.output);
          break;
        default:
          console.error('Received unknown command: ' + payload.cmd);
          break;
      }
    };
    WWOBJLoader2.prototype._terminate = function() {
      if (Validator.isValid(this.worker)) {
        if (this.running)
          throw 'Unable to gracefully terminate worker as it is currently running!';
        this.worker.terminate();
        this.worker = null;
        this.workerCode = null;
        this._finalize('terminate');
      }
      this.fileLoader = null;
      this.mtlLoader = null;
    };
    WWOBJLoader2.prototype._finalize = function(reason, requestTerminate) {
      this.running = false;
      var index;
      var callback;
      if (reason === 'complete') {
        for (index in this.callbacks.completedLoading) {
          callback = this.callbacks.completedLoading[index];
          callback(this.modelName, this.instanceNo, this.requestTerminate);
        }
      } else if (reason === 'error') {
        for (index in this.callbacks.errorWhileLoading) {
          callback = this.callbacks.errorWhileLoading[index];
          callback(this.modelName, this.instanceNo, this.requestTerminate);
        }
      }
      this.validated = false;
      this.setRequestTerminate(requestTerminate);
      if (this.requestTerminate) {
        this._terminate();
      }
    };
    WWOBJLoader2.prototype._announceProgress = function(baseText, text) {
      var output = Validator.isValid(baseText) ? baseText : "";
      output = Validator.isValid(text) ? output + " " + text : output;
      var callbackProgress;
      for (var index in this.callbacks.progress) {
        callbackProgress = this.callbacks.progress[index];
        callbackProgress(output);
      }
      if (this.debug)
        console.log(output);
    };
    WWOBJLoader2.prototype._buildWebWorkerCode = function(existingWorkerCode) {
      if (Validator.isValid(existingWorkerCode))
        this.workerCode = existingWorkerCode;
      if (!Validator.isValid(this.workerCode)) {
        console.time('buildWebWorkerCode');
        var wwDef = (function() {
          function WWOBJLoader() {
            this.wwMeshCreator = new WWMeshCreator();
            this.parser = new Parser(this.wwMeshCreator);
            this.validated = false;
            this.cmdState = 'created';
            this.debug = false;
          }
          WWOBJLoader.prototype.setDebug = function(parserDebug, meshCreatorDebug) {
            this.parser.setDebug(parserDebug);
            this.wwMeshCreator.setDebug(meshCreatorDebug);
          };
          WWOBJLoader.prototype.parse = function(arrayBuffer) {
            console.log('Parsing arrayBuffer...');
            console.time('parseArrayBuffer');
            this.validate();
            this.parser.parseArrayBuffer(arrayBuffer);
            var objGroup = this._finalize();
            console.timeEnd('parseArrayBuffer');
            return objGroup;
          };
          WWOBJLoader.prototype.validate = function() {
            if (this.validated)
              return;
            this.parser.validate();
            this.wwMeshCreator.validate();
            this.validated = true;
          };
          WWOBJLoader.prototype._finalize = function() {
            console.log('Global output object count: ' + this.wwMeshCreator.globalObjectCount);
            this.parser.finalize();
            this.wwMeshCreator.finalize();
            this.validated = false;
          };
          WWOBJLoader.prototype.init = function(payload) {
            this.cmdState = 'init';
            this.setDebug(payload.debug, payload.debug);
          };
          WWOBJLoader.prototype.setMaterials = function(payload) {
            this.cmdState = 'setMaterials';
            this.wwMeshCreator.setMaterials(payload.materialNames);
          };
          WWOBJLoader.prototype.run = function(payload) {
            this.cmdState = 'run';
            this.parse(payload.objAsArrayBuffer);
            console.log('OBJ loading complete!');
            this.cmdState = 'complete';
            self.postMessage({
              cmd: this.cmdState,
              msg: null
            });
          };
          return WWOBJLoader;
        })();
        var wwMeshCreatorDef = (function() {
          function WWMeshCreator() {
            this.materials = null;
            this.debug = false;
            this.globalObjectCount = 1;
            this.validated = false;
          }
          WWMeshCreator.prototype.setMaterials = function(materials) {
            this.materials = Validator.verifyInput(materials, this.materials);
            this.materials = Validator.verifyInput(this.materials, {materials: []});
          };
          WWMeshCreator.prototype.setDebug = function(debug) {
            if (debug === true || debug === false)
              this.debug = debug;
          };
          WWMeshCreator.prototype.validate = function() {
            if (this.validated)
              return;
            this.setMaterials(null);
            this.setDebug(null);
            this.globalObjectCount = 1;
          };
          WWMeshCreator.prototype.finalize = function() {
            this.materials = null;
            this.validated = false;
          };
          WWMeshCreator.prototype.buildMesh = function(rawObjectDescriptions, inputObjectCount, absoluteVertexCount, absoluteNormalCount, absoluteUvCount) {
            if (this.debug)
              console.log('OBJLoader.buildMesh:\nInput object no.: ' + inputObjectCount);
            var vertexFa = new Float32Array(absoluteVertexCount);
            var normalFA = (absoluteNormalCount > 0) ? new Float32Array(absoluteNormalCount) : null;
            var uvFA = (absoluteUvCount > 0) ? new Float32Array(absoluteUvCount) : null;
            var rawObjectDescription;
            var materialDescription;
            var materialDescriptions = [];
            var createMultiMaterial = (rawObjectDescriptions.length > 1);
            var materialIndex = 0;
            var materialIndexMapping = [];
            var selectedMaterialIndex;
            var materialGroup;
            var materialGroups = [];
            var vertexBAOffset = 0;
            var vertexGroupOffset = 0;
            var vertexLength;
            var normalOffset = 0;
            var uvOffset = 0;
            for (var oodIndex in rawObjectDescriptions) {
              if (!rawObjectDescriptions.hasOwnProperty(oodIndex))
                continue;
              rawObjectDescription = rawObjectDescriptions[oodIndex];
              materialDescription = {
                name: rawObjectDescription.materialName,
                flat: false,
                default: false
              };
              if (this.materials[materialDescription.name] === null) {
                materialDescription.default = true;
                console.warn('object_group "' + rawObjectDescription.objectName + '_' + rawObjectDescription.groupName + '" was defined without material! Assigning "defaultMaterial".');
              }
              if (rawObjectDescription.smoothingGroup === 0)
                materialDescription.flat = true;
              vertexLength = rawObjectDescription.vertices.length;
              if (createMultiMaterial) {
                selectedMaterialIndex = materialIndexMapping[materialDescription.name];
                if (!selectedMaterialIndex) {
                  selectedMaterialIndex = materialIndex;
                  materialIndexMapping[materialDescription.name] = materialIndex;
                  materialDescriptions.push(materialDescription);
                  materialIndex++;
                }
                materialGroup = {
                  start: vertexGroupOffset,
                  count: vertexLength / 3,
                  index: selectedMaterialIndex
                };
                materialGroups.push(materialGroup);
                vertexGroupOffset += vertexLength / 3;
              } else {
                materialDescriptions.push(materialDescription);
              }
              vertexFa.set(rawObjectDescription.vertices, vertexBAOffset);
              vertexBAOffset += vertexLength;
              if (normalFA) {
                normalFA.set(rawObjectDescription.normals, normalOffset);
                normalOffset += rawObjectDescription.normals.length;
              }
              if (uvFA) {
                uvFA.set(rawObjectDescription.uvs, uvOffset);
                uvOffset += rawObjectDescription.uvs.length;
              }
              if (this.debug)
                this.printReport(rawObjectDescription, selectedMaterialIndex);
            }
            self.postMessage({
              cmd: 'objData',
              meshName: rawObjectDescription.objectName,
              multiMaterial: createMultiMaterial,
              materialDescriptions: materialDescriptions,
              materialGroups: materialGroups,
              vertices: vertexFa,
              normals: normalFA,
              uvs: uvFA
            }, [vertexFa.buffer], normalFA !== null ? [normalFA.buffer] : null, uvFA !== null ? [uvFA.buffer] : null);
            this.globalObjectCount++;
          };
          return WWMeshCreator;
        })();
        var wwObjLoaderRunnerDef = (function() {
          function WWOBJLoaderRunner() {
            self.addEventListener('message', this.runner, false);
          }
          WWOBJLoaderRunner.prototype.runner = function(event) {
            var payload = event.data;
            console.log('Command state before: ' + WWOBJLoaderRef.cmdState);
            switch (payload.cmd) {
              case 'init':
                WWOBJLoaderRef.init(payload);
                break;
              case 'setMaterials':
                WWOBJLoaderRef.setMaterials(payload);
                break;
              case 'run':
                WWOBJLoaderRef.run(payload);
                break;
              default:
                console.error('OBJLoader: Received unknown command: ' + payload.cmd);
                break;
            }
            console.log('Command state after: ' + WWOBJLoaderRef.cmdState);
          };
          return WWOBJLoaderRunner;
        })();
        var buildObject = function(fullName, object) {
          var objectString = fullName + ' = {\n';
          var part;
          for (var name in object) {
            part = object[name];
            if (typeof(part) === 'string' || part instanceof String) {
              part = part.replace('\n', '\\n');
              part = part.replace('\r', '\\r');
              objectString += '\t' + name + ': "' + part + '",\n';
            } else if (part instanceof Array) {
              objectString += '\t' + name + ': [' + part + '],\n';
            } else if (Number.isInteger(part)) {
              objectString += '\t' + name + ': ' + part + ',\n';
            } else if (typeof part === 'function') {
              objectString += '\t' + name + ': ' + part + ',\n';
            }
          }
          objectString += '}\n\n';
          return objectString;
        };
        var buildSingelton = function(fullName, internalName, object) {
          var objectString = fullName + ' = (function () {\n\n';
          objectString += '\t' + object.prototype.constructor.toString() + '\n\n';
          var funcString;
          var objectPart;
          for (var name in object.prototype) {
            objectPart = object.prototype[name];
            if (typeof objectPart === 'function') {
              funcString = objectPart.toString();
              objectString += '\t' + internalName + '.prototype.' + name + ' = ' + funcString + ';\n\n';
            }
          }
          objectString += '\treturn ' + internalName + ';\n';
          objectString += '})();\n\n';
          return objectString;
        };
        this.workerCode = '';
        this.workerCode += '/**\n';
        this.workerCode += '  * This code was constructed by WWOBJLoader2._buildWebWorkerCode\n';
        this.workerCode += '  */\n\n';
        this.workerCode += THREE.OBJLoader2.prototype._buildWebWorkerCode(buildObject, buildSingelton);
        this.workerCode += buildSingelton('WWOBJLoader', 'WWOBJLoader', wwDef);
        this.workerCode += buildSingelton('WWMeshCreator', 'WWMeshCreator', wwMeshCreatorDef);
        this.workerCode += 'WWOBJLoaderRef = new WWOBJLoader();\n\n';
        this.workerCode += buildSingelton('WWOBJLoaderRunner', 'WWOBJLoaderRunner', wwObjLoaderRunnerDef);
        this.workerCode += 'new WWOBJLoaderRunner();\n\n';
        console.timeEnd('buildWebWorkerCode');
      }
      return this.workerCode;
    };
    return WWOBJLoader2;
  })();
  THREE.OBJLoader2.WWOBJLoader2.PrepDataArrayBuffer = function(modelName, objAsArrayBuffer, pathTexture, mtlAsString) {
    var Validator = THREE.OBJLoader2.prototype._getValidator();
    return {
      setSceneGraphBaseNode: function(sceneGraphBaseNode) {
        this.sceneGraphBaseNode = Validator.verifyInput(sceneGraphBaseNode, null);
      },
      setStreamMeshes: function(streamMeshes) {
        this.streamMeshes = streamMeshes !== false;
      },
      setRequestTerminate: function(requestTerminate) {
        this.requestTerminate = requestTerminate === true;
      },
      getCallbacks: function() {
        return this.callbacks;
      },
      modelName: Validator.verifyInput(modelName, 'none'),
      dataAvailable: true,
      objAsArrayBuffer: Validator.verifyInput(objAsArrayBuffer, null),
      pathTexture: Validator.verifyInput(pathTexture, null),
      mtlAsString: Validator.verifyInput(mtlAsString, null),
      sceneGraphBaseNode: null,
      streamMeshes: true,
      requestTerminate: false,
      callbacks: new THREE.OBJLoader2.WWOBJLoader2.PrepDataCallbacks()
    };
  };
  THREE.OBJLoader2.WWOBJLoader2.PrepDataFile = function(modelName, pathObj, fileObj, pathTexture, fileMtl) {
    var Validator = THREE.OBJLoader2.prototype._getValidator();
    return {
      setSceneGraphBaseNode: function(sceneGraphBaseNode) {
        this.sceneGraphBaseNode = Validator.verifyInput(sceneGraphBaseNode, null);
      },
      setStreamMeshes: function(streamMeshes) {
        this.streamMeshes = streamMeshes !== false;
      },
      setRequestTerminate: function(requestTerminate) {
        this.requestTerminate = requestTerminate === true;
      },
      getCallbacks: function() {
        return this.callbacks;
      },
      modelName: Validator.verifyInput(modelName, 'none'),
      dataAvailable: false,
      pathObj: Validator.verifyInput(pathObj, null),
      fileObj: Validator.verifyInput(fileObj, null),
      pathTexture: Validator.verifyInput(pathTexture, null),
      fileMtl: Validator.verifyInput(fileMtl, null),
      sceneGraphBaseNode: null,
      streamMeshes: true,
      requestTerminate: false,
      callbacks: new THREE.OBJLoader2.WWOBJLoader2.PrepDataCallbacks()
    };
  };
  THREE.OBJLoader2.WWOBJLoader2.PrepDataCallbacks = function() {
    var Validator = THREE.OBJLoader2.prototype._getValidator();
    return {
      registerCallbackProgress: function(callbackProgress) {
        if (Validator.isValid(callbackProgress))
          this.progress = callbackProgress;
      },
      registerCallbackCompletedLoading: function(callbackCompletedLoading) {
        if (Validator.isValid(callbackCompletedLoading))
          this.completedLoading = callbackCompletedLoading;
      },
      registerCallbackMaterialsLoaded: function(callbackMaterialsLoaded) {
        if (Validator.isValid(callbackMaterialsLoaded))
          this.materialsLoaded = callbackMaterialsLoaded;
      },
      registerCallbackMeshLoaded: function(callbackMeshLoaded) {
        if (Validator.isValid(callbackMeshLoaded))
          this.meshLoaded = callbackMeshLoaded;
      },
      registerCallbackErrorWhileLoading: function(callbackErrorWhileLoading) {
        if (Validator.isValid(callbackErrorWhileLoading))
          this.errorWhileLoading = callbackErrorWhileLoading;
      },
      progress: null,
      completedLoading: null,
      errorWhileLoading: null,
      materialsLoaded: null,
      meshLoaded: null
    };
  };
  THREE.OBJLoader2.WWOBJLoader2.LoadedMeshUserOverride = function(disregardMesh, bufferGeometry, material) {
    var Validator = THREE.OBJLoader2.prototype._getValidator();
    return {
      disregardMesh: disregardMesh === true,
      replaceBufferGeometry: Validator.isValid(bufferGeometry),
      bufferGeometry: Validator.verifyInput(bufferGeometry, null),
      replaceMaterial: Validator.isValid(material),
      material: Validator.verifyInput(material, null)
    };
  };
  THREE.OBJLoader2.WWOBJLoader2Director = (function() {
    var Validator = THREE.OBJLoader2.prototype._getValidator();
    var MAX_WEB_WORKER = 16;
    var MAX_QUEUE_SIZE = 1024;
    function WWOBJLoader2Director() {
      this.maxQueueSize = MAX_QUEUE_SIZE;
      this.maxWebWorkers = MAX_WEB_WORKER;
      this.crossOrigin = null;
      this.workerDescription = {
        prototypeDef: THREE.OBJLoader2.WWOBJLoader2.prototype,
        globalCallbacks: {},
        webWorkers: [],
        codeBuffer: null
      };
      this.objectsCompleted = 0;
      this.instructionQueue = [];
    }
    WWOBJLoader2Director.prototype.getMaxQueueSize = function() {
      return this.maxQueueSize;
    };
    WWOBJLoader2Director.prototype.getMaxWebWorkers = function() {
      return this.maxWebWorkers;
    };
    WWOBJLoader2Director.prototype.setCrossOrigin = function(crossOrigin) {
      this.crossOrigin = crossOrigin;
    };
    WWOBJLoader2Director.prototype.prepareWorkers = function(globalCallbacks, maxQueueSize, maxWebWorkers) {
      if (Validator.isValid(globalCallbacks))
        this.workerDescription.globalCallbacks = globalCallbacks;
      this.maxQueueSize = Math.min(maxQueueSize, MAX_QUEUE_SIZE);
      this.maxWebWorkers = Math.min(maxWebWorkers, MAX_WEB_WORKER);
      this.objectsCompleted = 0;
      this.instructionQueue = [];
      var start = this.workerDescription.webWorkers.length;
      if (start < this.maxWebWorkers) {
        for (i = start; i < this.maxWebWorkers; i++) {
          webWorker = this._buildWebWorker();
          this.workerDescription.webWorkers[i] = webWorker;
        }
      } else {
        for (var webWorker,
            i = start - 1; i >= this.maxWebWorkers; i--) {
          webWorker = this.workerDescription.webWorkers[i];
          webWorker.setRequestTerminate(true);
          this.workerDescription.webWorkers.pop();
        }
      }
    };
    WWOBJLoader2Director.prototype.enqueueForRun = function(runParams) {
      if (this.instructionQueue.length < this.maxQueueSize) {
        this.instructionQueue.push(runParams);
      }
    };
    WWOBJLoader2Director.prototype.processQueue = function() {
      if (this.instructionQueue.length === 0)
        return;
      var length = Math.min(this.maxWebWorkers, this.instructionQueue.length);
      for (var i = 0; i < length; i++) {
        this._kickWebWorkerRun(this.workerDescription.webWorkers[i], this.instructionQueue[0]);
        this.instructionQueue.shift();
      }
    };
    WWOBJLoader2Director.prototype._kickWebWorkerRun = function(worker, runParams) {
      worker.clearAllCallbacks();
      var key;
      var globalCallbacks = this.workerDescription.globalCallbacks;
      var workerCallbacks = worker.callbacks;
      var selectedGlobalCallback;
      for (key in globalCallbacks) {
        if (workerCallbacks.hasOwnProperty(key) && globalCallbacks.hasOwnProperty(key)) {
          selectedGlobalCallback = globalCallbacks[key];
          if (Validator.isValid(selectedGlobalCallback))
            workerCallbacks[key].push(selectedGlobalCallback);
        }
      }
      var runCallbacks = runParams.callbacks;
      if (Validator.isValid(runCallbacks)) {
        for (key in runCallbacks) {
          if (workerCallbacks.hasOwnProperty(key) && runCallbacks.hasOwnProperty(key) && Validator.isValid(runCallbacks[key])) {
            workerCallbacks[key].push(runCallbacks[key]);
          }
        }
      }
      var scope = this;
      var directorCompletedLoading = function(modelName, instanceNo, requestTerminate) {
        scope.objectsCompleted++;
        if (!requestTerminate) {
          var worker = scope.workerDescription.webWorkers[instanceNo];
          var runParams = scope.instructionQueue[0];
          if (Validator.isValid(runParams)) {
            console.log('\nAssigning next item from queue to worker (queue length: ' + scope.instructionQueue.length + ')\n\n');
            scope._kickWebWorkerRun(worker, runParams);
            scope.instructionQueue.shift();
          }
        }
      };
      worker.registerCallbackCompletedLoading(directorCompletedLoading);
      worker.prepareRun(runParams);
      worker.run();
    };
    WWOBJLoader2Director.prototype._buildWebWorker = function() {
      var webWorker = Object.create(this.workerDescription.prototypeDef);
      webWorker._init();
      if (Validator.isValid(this.crossOrigin))
        webWorker.setCrossOrigin(this.crossOrigin);
      if (Validator.isValid(this.workerDescription.codeBuffer)) {
        webWorker._buildWebWorkerCode(this.workerDescription.codeBuffer);
      } else {
        this.workerDescription.codeBuffer = webWorker._buildWebWorkerCode();
      }
      webWorker.instanceNo = this.workerDescription.webWorkers.length;
      this.workerDescription.webWorkers.push(webWorker);
      return webWorker;
    };
    WWOBJLoader2Director.prototype.deregister = function() {
      console.log('WWOBJLoader2Director received the unregister call. Terminating all workers!');
      for (var i = 0,
          webWorker,
          length = this.workerDescription.webWorkers.length; i < length; i++) {
        webWorker = this.workerDescription.webWorkers[i];
        webWorker.setRequestTerminate(true);
      }
      this.workerDescription.globalCallbacks = {};
      this.workerDescription.webWorkers = [];
      this.workerDescription.codeBuffer = null;
    };
    return WWOBJLoader2Director;
  })();
})(require('process'));
