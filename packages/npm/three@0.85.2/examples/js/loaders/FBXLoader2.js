/* */ 
(function(Buffer) {
  (function() {
    THREE.FBXLoader = function(manager) {
      this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
    };
    Object.assign(THREE.FBXLoader.prototype, {
      load: function(url, onLoad, onProgress, onError) {
        var self = this;
        var resourceDirectory = url.split(/[\\\/]/);
        resourceDirectory.pop();
        resourceDirectory = resourceDirectory.join('/') + '/';
        var loader = new THREE.FileLoader(this.manager);
        loader.load(url, function(text) {
          try {
            var scene = self.parse(text, resourceDirectory);
            onLoad(scene);
          } catch (error) {
            window.setTimeout(function() {
              if (onError)
                onError(error);
              self.manager.itemError(url);
            }, 0);
          }
        }, onProgress, onError);
      },
      parse: function(FBXText, resourceDirectory) {
        if (!isFbxFormatASCII(FBXText)) {
          throw new Error('FBXLoader: FBX Binary format not supported.');
          self.manager.itemError(url);
          return;
        }
        if (getFbxVersion(FBXText) < 7000) {
          throw new Error('FBXLoader: FBX version not supported for file at ' + url + ', FileVersion: ' + getFbxVersion(text));
          self.manager.itemError(url);
          return;
        }
        var FBXTree = new TextParser().parse(FBXText);
        var connections = parseConnections(FBXTree);
        var textures = parseTextures(FBXTree, new THREE.TextureLoader(this.manager).setPath(resourceDirectory));
        var materials = parseMaterials(FBXTree, textures, connections);
        var deformers = parseDeformers(FBXTree, connections);
        var geometryMap = parseGeometries(FBXTree, connections, deformers);
        var sceneGraph = parseScene(FBXTree, connections, deformers, geometryMap, materials);
        return sceneGraph;
      }
    });
    function parseConnections(FBXTree) {
      var connectionMap = new Map();
      if ('Connections' in FBXTree) {
        var connectionArray = FBXTree.Connections.properties.connections;
        for (var connectionArrayIndex = 0,
            connectionArrayLength = connectionArray.length; connectionArrayIndex < connectionArrayLength; ++connectionArrayIndex) {
          var connection = connectionArray[connectionArrayIndex];
          if (!connectionMap.has(connection[0])) {
            connectionMap.set(connection[0], {
              parents: [],
              children: []
            });
          }
          var parentRelationship = {
            ID: connection[1],
            relationship: connection[2]
          };
          connectionMap.get(connection[0]).parents.push(parentRelationship);
          if (!connectionMap.has(connection[1])) {
            connectionMap.set(connection[1], {
              parents: [],
              children: []
            });
          }
          var childRelationship = {
            ID: connection[0],
            relationship: connection[2]
          };
          connectionMap.get(connection[1]).children.push(childRelationship);
        }
      }
      return connectionMap;
    }
    function parseTextures(FBXTree, loader) {
      var textureMap = new Map();
      if ('Texture' in FBXTree.Objects.subNodes) {
        var textureNodes = FBXTree.Objects.subNodes.Texture;
        for (var nodeID in textureNodes) {
          var texture = parseTexture(textureNodes[nodeID], loader);
          textureMap.set(parseInt(nodeID), texture);
        }
      }
      return textureMap;
    }
    function parseTexture(textureNode, loader) {
      var FBX_ID = textureNode.id;
      var name = textureNode.name;
      var filePath = textureNode.properties.FileName;
      var split = filePath.split(/[\\\/]/);
      if (split.length > 0) {
        var fileName = split[split.length - 1];
      } else {
        var fileName = filePath;
      }
      var texture = loader.load(fileName);
      texture.name = name;
      texture.FBX_ID = FBX_ID;
      return texture;
    }
    function parseMaterials(FBXTree, textureMap, connections) {
      var materialMap = new Map();
      if ('Material' in FBXTree.Objects.subNodes) {
        var materialNodes = FBXTree.Objects.subNodes.Material;
        for (var nodeID in materialNodes) {
          var material = parseMaterial(materialNodes[nodeID], textureMap, connections);
          materialMap.set(parseInt(nodeID), material);
        }
      }
      return materialMap;
    }
    function parseMaterial(materialNode, textureMap, connections) {
      var FBX_ID = materialNode.id;
      var name = materialNode.attrName;
      var type = materialNode.properties.ShadingModel;
      if (typeof type === 'object') {
        type = type.value;
      }
      var children = connections.get(FBX_ID).children;
      var parameters = parseParameters(materialNode.properties, textureMap, children);
      var material;
      switch (type) {
        case 'phong':
          material = new THREE.MeshPhongMaterial();
          break;
        case 'lambert':
          material = new THREE.MeshLambertMaterial();
          break;
        default:
          console.warn('No implementation given for material type ' + type + ' in FBXLoader.js.  Defaulting to basic material');
          material = new THREE.MeshBasicMaterial({color: 0x3300ff});
          break;
      }
      material.setValues(parameters);
      material.name = name;
      return material;
    }
    function parseParameters(properties, textureMap, childrenRelationships) {
      var parameters = {};
      if (properties.Diffuse) {
        parameters.color = parseColor(properties.Diffuse);
      }
      if (properties.Specular) {
        parameters.specular = parseColor(properties.Specular);
      }
      if (properties.Shininess) {
        parameters.shininess = properties.Shininess.value;
      }
      if (properties.Emissive) {
        parameters.emissive = parseColor(properties.Emissive);
      }
      if (properties.EmissiveFactor) {
        parameters.emissiveIntensity = properties.EmissiveFactor.value;
      }
      if (properties.Opacity) {
        parameters.opacity = properties.Opacity.value;
      }
      if (parameters.opacity < 1.0) {
        parameters.transparent = true;
      }
      for (var childrenRelationshipsIndex = 0,
          childrenRelationshipsLength = childrenRelationships.length; childrenRelationshipsIndex < childrenRelationshipsLength; ++childrenRelationshipsIndex) {
        var relationship = childrenRelationships[childrenRelationshipsIndex];
        var type = relationship.relationship;
        switch (type) {
          case " \"DiffuseColor":
            parameters.map = textureMap.get(relationship.ID);
            break;
          case " \"AmbientColor":
          case " \"Bump":
          case " \"EmissiveColor":
          default:
            console.warn('Unknown texture application of type ' + type + ', skipping texture');
            break;
        }
      }
      return parameters;
    }
    function parseDeformers(FBXTree, connections) {
      var deformers = {};
      if ('Deformer' in FBXTree.Objects.subNodes) {
        var DeformerNodes = FBXTree.Objects.subNodes.Deformer;
        for (var nodeID in DeformerNodes) {
          var deformerNode = DeformerNodes[nodeID];
          if (deformerNode.attrType === 'Skin') {
            var conns = connections.get(parseInt(nodeID));
            var skeleton = parseSkeleton(conns, DeformerNodes);
            skeleton.FBX_ID = parseInt(nodeID);
            deformers[nodeID] = skeleton;
          }
        }
      }
      return deformers;
    }
    function parseSkeleton(connections, DeformerNodes) {
      var subDeformers = {};
      var children = connections.children;
      for (var i = 0,
          l = children.length; i < l; ++i) {
        var child = children[i];
        var subDeformerNode = DeformerNodes[child.ID];
        var subDeformer = {
          FBX_ID: child.ID,
          index: i,
          indices: [],
          weights: [],
          transform: parseMatrixArray(subDeformerNode.subNodes.Transform.properties.a),
          transformLink: parseMatrixArray(subDeformerNode.subNodes.TransformLink.properties.a),
          linkMode: subDeformerNode.properties.Mode
        };
        if ('Indexes' in subDeformerNode.subNodes) {
          subDeformer.indices = parseIntArray(subDeformerNode.subNodes.Indexes.properties.a);
          subDeformer.weights = parseFloatArray(subDeformerNode.subNodes.Weights.properties.a);
        }
        subDeformers[child.ID] = subDeformer;
      }
      return {
        map: subDeformers,
        bones: []
      };
    }
    function parseGeometries(FBXTree, connections, deformers) {
      var geometryMap = new Map();
      if ('Geometry' in FBXTree.Objects.subNodes) {
        var geometryNodes = FBXTree.Objects.subNodes.Geometry;
        for (var nodeID in geometryNodes) {
          var relationships = connections.get(parseInt(nodeID));
          var geo = parseGeometry(geometryNodes[nodeID], relationships, deformers);
          geometryMap.set(parseInt(nodeID), geo);
        }
      }
      return geometryMap;
    }
    function parseGeometry(geometryNode, relationships, deformers) {
      switch (geometryNode.attrType) {
        case 'Mesh':
          return parseMeshGeometry(geometryNode, relationships, deformers);
          break;
        case 'NurbsCurve':
          return parseNurbsGeometry(geometryNode);
          break;
      }
    }
    function parseMeshGeometry(geometryNode, relationships, deformers) {
      for (var i = 0; i < relationships.children.length; ++i) {
        var deformer = deformers[relationships.children[i].ID];
        if (deformer !== undefined)
          break;
      }
      return genGeometry(geometryNode, deformer);
    }
    function genGeometry(geometryNode, deformer) {
      var geometry = new Geometry();
      var subNodes = geometryNode.subNodes;
      var vertexBuffer = parseFloatArray(subNodes.Vertices.properties.a);
      var indexBuffer = parseIntArray(subNodes.PolygonVertexIndex.properties.a);
      if (subNodes.LayerElementNormal) {
        var normalInfo = getNormals(subNodes.LayerElementNormal[0]);
      }
      if (subNodes.LayerElementUV) {
        var uvInfo = getUVs(subNodes.LayerElementUV[0]);
      }
      if (subNodes.LayerElementColor) {
        var colorInfo = getColors(subNodes.LayerElementColor[0]);
      }
      if (subNodes.LayerElementMaterial) {
        var materialInfo = getMaterials(subNodes.LayerElementMaterial[0]);
      }
      var faceVertexBuffer = [];
      var polygonIndex = 0;
      for (var polygonVertexIndex = 0; polygonVertexIndex < indexBuffer.length; polygonVertexIndex++) {
        var vertexIndex = indexBuffer[polygonVertexIndex];
        var endOfFace = false;
        if (vertexIndex < 0) {
          vertexIndex = vertexIndex ^ -1;
          indexBuffer[polygonVertexIndex] = vertexIndex;
          endOfFace = true;
        }
        var vertex = new Vertex();
        var weightIndices = [];
        var weights = [];
        vertex.position.fromArray(vertexBuffer, vertexIndex * 3);
        if (deformer) {
          var subDeformers = deformer.map;
          for (var key in subDeformers) {
            var subDeformer = subDeformers[key];
            var indices = subDeformer.indices;
            for (var j = 0; j < indices.length; j++) {
              var index = indices[j];
              if (index === vertexIndex) {
                weights.push(subDeformer.weights[j]);
                weightIndices.push(subDeformer.index);
                break;
              }
            }
          }
          if (weights.length > 4) {
            console.warn('FBXLoader: Vertex has more than 4 skinning weights assigned to vertex.  Deleting additional weights.');
            var WIndex = [0, 0, 0, 0];
            var Weight = [0, 0, 0, 0];
            weights.forEach(function(weight, weightIndex) {
              var currentWeight = weight;
              var currentIndex = weightIndices[weightIndex];
              Weight.forEach(function(comparedWeight, comparedWeightIndex, comparedWeightArray) {
                if (currentWeight > comparedWeight) {
                  comparedWeightArray[comparedWeightIndex] = currentWeight;
                  currentWeight = comparedWeight;
                  var tmp = WIndex[comparedWeightIndex];
                  WIndex[comparedWeightIndex] = currentIndex;
                  currentIndex = tmp;
                }
              });
            });
            weightIndices = WIndex;
            weights = Weight;
          }
          for (var i = weights.length; i < 4; ++i) {
            weights[i] = 0;
            weightIndices[i] = 0;
          }
          vertex.skinWeights.fromArray(weights);
          vertex.skinIndices.fromArray(weightIndices);
        }
        if (normalInfo) {
          vertex.normal.fromArray(getData(polygonVertexIndex, polygonIndex, vertexIndex, normalInfo));
        }
        if (uvInfo) {
          vertex.uv.fromArray(getData(polygonVertexIndex, polygonIndex, vertexIndex, uvInfo));
        }
        if (colorInfo) {
          vertex.color.fromArray(getData(polygonVertexIndex, polygonIndex, vertexIndex, colorInfo));
        }
        faceVertexBuffer.push(vertex);
        if (endOfFace) {
          var face = new Face();
          var materials = getData(polygonVertexIndex, polygonIndex, vertexIndex, materialInfo);
          face.genTrianglesFromVertices(faceVertexBuffer);
          face.materialIndex = materials[0];
          geometry.faces.push(face);
          faceVertexBuffer = [];
          polygonIndex++;
          endOfFace = false;
        }
      }
      var bufferInfo = geometry.flattenToBuffers();
      var geo = new THREE.BufferGeometry();
      geo.name = geometryNode.name;
      geo.addAttribute('position', new THREE.Float32BufferAttribute(bufferInfo.vertexBuffer, 3));
      if (bufferInfo.normalBuffer.length > 0) {
        geo.addAttribute('normal', new THREE.Float32BufferAttribute(bufferInfo.normalBuffer, 3));
      }
      if (bufferInfo.uvBuffer.length > 0) {
        geo.addAttribute('uv', new THREE.Float32BufferAttribute(bufferInfo.uvBuffer, 2));
      }
      if (subNodes.LayerElementColor) {
        geo.addAttribute('color', new THREE.Float32BufferAttribute(bufferInfo.colorBuffer, 3));
      }
      if (deformer) {
        geo.addAttribute('skinIndex', new THREE.Float32BufferAttribute(bufferInfo.skinIndexBuffer, 4));
        geo.addAttribute('skinWeight', new THREE.Float32BufferAttribute(bufferInfo.skinWeightBuffer, 4));
        geo.FBX_Deformer = deformer;
      }
      var materialIndexBuffer = bufferInfo.materialIndexBuffer;
      var prevMaterialIndex = materialIndexBuffer[0];
      var startIndex = 0;
      for (var i = 0; i < materialIndexBuffer.length; ++i) {
        if (materialIndexBuffer[i] !== prevMaterialIndex) {
          geo.addGroup(startIndex, i - startIndex, prevMaterialIndex);
          prevMaterialIndex = materialIndexBuffer[i];
          startIndex = i;
        }
      }
      return geo;
    }
    function getNormals(NormalNode) {
      var mappingType = NormalNode.properties.MappingInformationType;
      var referenceType = NormalNode.properties.ReferenceInformationType;
      var buffer = parseFloatArray(NormalNode.subNodes.Normals.properties.a);
      var indexBuffer = [];
      if (referenceType === 'IndexToDirect') {
        if ('NormalIndex' in NormalNode.subNodes) {
          indexBuffer = parseIntArray(NormalNode.subNodes.NormalIndex.properties.a);
        } else if ('NormalsIndex' in NormalNode.subNodes) {
          indexBuffer = parseIntArray(NormalNode.subNodes.NormalsIndex.properties.a);
        }
      }
      return {
        dataSize: 3,
        buffer: buffer,
        indices: indexBuffer,
        mappingType: mappingType,
        referenceType: referenceType
      };
    }
    function getUVs(UVNode) {
      var mappingType = UVNode.properties.MappingInformationType;
      var referenceType = UVNode.properties.ReferenceInformationType;
      var buffer = parseFloatArray(UVNode.subNodes.UV.properties.a);
      var indexBuffer = [];
      if (referenceType === 'IndexToDirect') {
        indexBuffer = parseIntArray(UVNode.subNodes.UVIndex.properties.a);
      }
      return {
        dataSize: 2,
        buffer: buffer,
        indices: indexBuffer,
        mappingType: mappingType,
        referenceType: referenceType
      };
    }
    function getColors(ColorNode) {
      var mappingType = ColorNode.properties.MappingInformationType;
      var referenceType = ColorNode.properties.ReferenceInformationType;
      var buffer = parseFloatArray(ColorNode.subNodes.Colors.properties.a);
      var indexBuffer = [];
      if (referenceType === 'IndexToDirect') {
        indexBuffer = parseFloatArray(ColorNode.subNodes.ColorIndex.properties.a);
      }
      return {
        dataSize: 4,
        buffer: buffer,
        indices: indexBuffer,
        mappingType: mappingType,
        referenceType: referenceType
      };
    }
    function getMaterials(MaterialNode) {
      var mappingType = MaterialNode.properties.MappingInformationType;
      var referenceType = MaterialNode.properties.ReferenceInformationType;
      if (mappingType === 'NoMappingInformation') {
        return {
          dataSize: 1,
          buffer: [0],
          indices: [0],
          mappingType: 'AllSame',
          referenceType: referenceType
        };
      }
      var materialIndexBuffer = parseIntArray(MaterialNode.subNodes.Materials.properties.a);
      var materialIndices = [];
      for (var materialIndexBufferIndex = 0,
          materialIndexBufferLength = materialIndexBuffer.length; materialIndexBufferIndex < materialIndexBufferLength; ++materialIndexBufferIndex) {
        materialIndices.push(materialIndexBufferIndex);
      }
      return {
        dataSize: 1,
        buffer: materialIndexBuffer,
        indices: materialIndices,
        mappingType: mappingType,
        referenceType: referenceType
      };
    }
    var dataArray = [];
    var GetData = {
      ByPolygonVertex: {
        Direct: function(polygonVertexIndex, polygonIndex, vertexIndex, infoObject) {
          var from = (polygonVertexIndex * infoObject.dataSize);
          var to = (polygonVertexIndex * infoObject.dataSize) + infoObject.dataSize;
          return slice(dataArray, infoObject.buffer, from, to);
        },
        IndexToDirect: function(polygonVertexIndex, polygonIndex, vertexIndex, infoObject) {
          var index = infoObject.indices[polygonVertexIndex];
          var from = (index * infoObject.dataSize);
          var to = (index * infoObject.dataSize) + infoObject.dataSize;
          return slice(dataArray, infoObject.buffer, from, to);
        }
      },
      ByPolygon: {
        Direct: function(polygonVertexIndex, polygonIndex, vertexIndex, infoObject) {
          var from = polygonIndex * infoObject.dataSize;
          var to = polygonIndex * infoObject.dataSize + infoObject.dataSize;
          return slice(dataArray, infoObject.buffer, from, to);
        },
        IndexToDirect: function(polygonVertexIndex, polygonIndex, vertexIndex, infoObject) {
          var index = infoObject.indices[polygonIndex];
          var from = index * infoObject.dataSize;
          var to = index * infoObject.dataSize + infoObject.dataSize;
          return slice(dataArray, infoObject.buffer, from, to);
        }
      },
      ByVertice: {Direct: function(polygonVertexIndex, polygonIndex, vertexIndex, infoObject) {
          var from = (vertexIndex * infoObject.dataSize);
          var to = (vertexIndex * infoObject.dataSize) + infoObject.dataSize;
          return slice(dataArray, infoObject.buffer, from, to);
        }},
      AllSame: {IndexToDirect: function(polygonVertexIndex, polygonIndex, vertexIndex, infoObject) {
          var from = infoObject.indices[0] * infoObject.dataSize;
          var to = infoObject.indices[0] * infoObject.dataSize + infoObject.dataSize;
          return slice(dataArray, infoObject.buffer, from, to);
        }}
    };
    function getData(polygonVertexIndex, polygonIndex, vertexIndex, infoObject) {
      return GetData[infoObject.mappingType][infoObject.referenceType](polygonVertexIndex, polygonIndex, vertexIndex, infoObject);
    }
    function parseNurbsGeometry(geometryNode) {
      if (THREE.NURBSCurve === undefined) {
        console.error("THREE.FBXLoader relies on THREE.NURBSCurve for any nurbs present in the model.  Nurbs will show up as empty geometry.");
        return new THREE.BufferGeometry();
      }
      var order = parseInt(geometryNode.properties.Order);
      if (isNaN(order)) {
        console.error("FBXLoader: Invalid Order " + geometryNode.properties.Order + " given for geometry ID: " + geometryNode.id);
        return new THREE.BufferGeometry();
      }
      var degree = order - 1;
      var knots = parseFloatArray(geometryNode.subNodes.KnotVector.properties.a);
      var controlPoints = [];
      var pointsValues = parseFloatArray(geometryNode.subNodes.Points.properties.a);
      for (var i = 0,
          l = pointsValues.length; i < l; i += 4) {
        controlPoints.push(new THREE.Vector4().fromArray(pointsValues, i));
      }
      var startKnot,
          endKnot;
      if (geometryNode.properties.Form === 'Closed') {
        controlPoints.push(controlPoints[0]);
      } else if (geometryNode.properties.Form === 'Periodic') {
        startKnot = degree;
        endKnot = knots.length - 1 - startKnot;
        for (var i = 0; i < degree; ++i) {
          controlPoints.push(controlPoints[i]);
        }
      }
      var curve = new THREE.NURBSCurve(degree, knots, controlPoints, startKnot, endKnot);
      var vertices = curve.getPoints(controlPoints.length * 7);
      var positions = new Float32Array(vertices.length * 3);
      for (var i = 0,
          l = vertices.length; i < l; ++i) {
        vertices[i].toArray(positions, i * 3);
      }
      var geometry = new THREE.BufferGeometry();
      geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
      return geometry;
    }
    function parseScene(FBXTree, connections, deformers, geometryMap, materialMap) {
      var sceneGraph = new THREE.Group();
      var ModelNode = FBXTree.Objects.subNodes.Model;
      var modelArray = [];
      var modelMap = new Map();
      for (var nodeID in ModelNode) {
        var id = parseInt(nodeID);
        var node = ModelNode[nodeID];
        var conns = connections.get(id);
        var model = null;
        for (var i = 0; i < conns.parents.length; ++i) {
          for (var FBX_ID in deformers) {
            var deformer = deformers[FBX_ID];
            var subDeformers = deformer.map;
            var subDeformer = subDeformers[conns.parents[i].ID];
            if (subDeformer) {
              model = new THREE.Bone();
              deformer.bones[subDeformer.index] = model;
            }
          }
        }
        if (!model) {
          switch (node.attrType) {
            case "Mesh":
              var geometry = null;
              var material = null;
              var materials = [];
              for (var childrenIndex = 0,
                  childrenLength = conns.children.length; childrenIndex < childrenLength; ++childrenIndex) {
                var child = conns.children[childrenIndex];
                if (geometryMap.has(child.ID)) {
                  geometry = geometryMap.get(child.ID);
                }
                if (materialMap.has(child.ID)) {
                  materials.push(materialMap.get(child.ID));
                }
              }
              if (materials.length > 1) {
                material = new THREE.MultiMaterial(materials);
              } else if (materials.length > 0) {
                material = materials[0];
              } else {
                material = new THREE.MeshBasicMaterial({color: 0x3300ff});
                materials.push(material);
              }
              if ('color' in geometry.attributes) {
                for (var materialIndex = 0,
                    numMaterials = materials.length; materialIndex < numMaterials; ++materialIndex) {
                  materials[materialIndex].vertexColors = THREE.VertexColors;
                }
              }
              if (geometry.FBX_Deformer) {
                for (var materialsIndex = 0,
                    materialsLength = materials.length; materialsIndex < materialsLength; ++materialsIndex) {
                  materials[materialsIndex].skinning = true;
                }
                model = new THREE.SkinnedMesh(geometry, material);
              } else {
                model = new THREE.Mesh(geometry, material);
              }
              break;
            case "NurbsCurve":
              var geometry = null;
              for (var childrenIndex = 0,
                  childrenLength = conns.children.length; childrenIndex < childrenLength; ++childrenIndex) {
                var child = conns.children[childrenIndex];
                if (geometryMap.has(child.ID)) {
                  geometry = geometryMap.get(child.ID);
                }
              }
              material = new THREE.LineBasicMaterial({
                color: 0x3300ff,
                linewidth: 5
              });
              model = new THREE.Line(geometry, material);
              break;
            default:
              model = new THREE.Object3D();
              break;
          }
        }
        model.name = node.attrName.replace(/:/, '').replace(/_/, '').replace(/-/, '');
        model.FBX_ID = id;
        modelArray.push(model);
        modelMap.set(id, model);
      }
      for (var modelArrayIndex = 0,
          modelArrayLength = modelArray.length; modelArrayIndex < modelArrayLength; ++modelArrayIndex) {
        var model = modelArray[modelArrayIndex];
        var node = ModelNode[model.FBX_ID];
        if ('Lcl_Translation' in node.properties) {
          model.position.fromArray(parseFloatArray(node.properties.Lcl_Translation.value));
        }
        if ('Lcl_Rotation' in node.properties) {
          var rotation = parseFloatArray(node.properties.Lcl_Rotation.value).map(degreeToRadian);
          rotation.push('ZYX');
          model.rotation.fromArray(rotation);
        }
        if ('Lcl_Scaling' in node.properties) {
          model.scale.fromArray(parseFloatArray(node.properties.Lcl_Scaling.value));
        }
        if ('PreRotation' in node.properties) {
          var preRotations = new THREE.Euler().setFromVector3(parseVector3(node.properties.PreRotation).multiplyScalar(DEG2RAD), 'ZYX');
          preRotations = new THREE.Quaternion().setFromEuler(preRotations);
          var currentRotation = new THREE.Quaternion().setFromEuler(model.rotation);
          preRotations.multiply(currentRotation);
          model.rotation.setFromQuaternion(preRotations, 'ZYX');
        }
        var conns = connections.get(model.FBX_ID);
        for (var parentIndex = 0; parentIndex < conns.parents.length; parentIndex++) {
          var pIndex = findIndex(modelArray, function(mod) {
            return mod.FBX_ID === conns.parents[parentIndex].ID;
          });
          if (pIndex > -1) {
            modelArray[pIndex].add(model);
            break;
          }
        }
        if (model.parent === null) {
          sceneGraph.add(model);
        }
      }
      sceneGraph.updateMatrixWorld(true);
      var BindPoseNode = FBXTree.Objects.subNodes.Pose;
      for (var nodeID in BindPoseNode) {
        if (BindPoseNode[nodeID].attrType === 'BindPose') {
          BindPoseNode = BindPoseNode[nodeID];
          break;
        }
      }
      if (BindPoseNode) {
        var PoseNode = BindPoseNode.subNodes.PoseNode;
        var worldMatrices = new Map();
        for (var PoseNodeIndex = 0,
            PoseNodeLength = PoseNode.length; PoseNodeIndex < PoseNodeLength; ++PoseNodeIndex) {
          var node = PoseNode[PoseNodeIndex];
          var rawMatWrd = parseMatrixArray(node.subNodes.Matrix.properties.a);
          worldMatrices.set(parseInt(node.id), rawMatWrd);
        }
      }
      for (var FBX_ID in deformers) {
        var deformer = deformers[FBX_ID];
        var subDeformers = deformer.map;
        for (var key in subDeformers) {
          var subDeformer = subDeformers[key];
          var subDeformerIndex = subDeformer.index;
          var bone = deformer.bones[subDeformerIndex];
          if (!worldMatrices.has(bone.FBX_ID)) {
            break;
          }
          var mat = worldMatrices.get(bone.FBX_ID);
          bone.matrixWorld.copy(mat);
        }
        deformer.skeleton = new THREE.Skeleton(deformer.bones);
        var conns = connections.get(deformer.FBX_ID);
        var parents = conns.parents;
        for (var parentsIndex = 0,
            parentsLength = parents.length; parentsIndex < parentsLength; ++parentsIndex) {
          var parent = parents[parentsIndex];
          if (geometryMap.has(parent.ID)) {
            var geoID = parent.ID;
            var geoConns = connections.get(geoID);
            for (var i = 0; i < geoConns.parents.length; ++i) {
              if (modelMap.has(geoConns.parents[i].ID)) {
                var model = modelMap.get(geoConns.parents[i].ID);
                model.bind(deformer.skeleton, model.matrixWorld);
                break;
              }
            }
          }
        }
      }
      sceneGraph.updateMatrixWorld(true);
      sceneGraph.skeleton = {bones: modelArray};
      var animations = parseAnimations(FBXTree, connections, sceneGraph);
      addAnimations(sceneGraph, animations);
      return sceneGraph;
    }
    function parseAnimations(FBXTree, connections, sceneGraph) {
      var rawNodes = FBXTree.Objects.subNodes.AnimationCurveNode;
      var rawCurves = FBXTree.Objects.subNodes.AnimationCurve;
      var rawLayers = FBXTree.Objects.subNodes.AnimationLayer;
      var rawStacks = FBXTree.Objects.subNodes.AnimationStack;
      var returnObject = {
        curves: new Map(),
        layers: {},
        stacks: {},
        length: 0,
        fps: 30,
        frames: 0
      };
      var animationCurveNodes = [];
      for (var nodeID in rawNodes) {
        if (nodeID.match(/\d+/)) {
          var animationNode = parseAnimationNode(FBXTree, rawNodes[nodeID], connections, sceneGraph);
          animationCurveNodes.push(animationNode);
        }
      }
      var tmpMap = new Map();
      for (var animationCurveNodeIndex = 0; animationCurveNodeIndex < animationCurveNodes.length; ++animationCurveNodeIndex) {
        if (animationCurveNodes[animationCurveNodeIndex] === null) {
          continue;
        }
        tmpMap.set(animationCurveNodes[animationCurveNodeIndex].id, animationCurveNodes[animationCurveNodeIndex]);
      }
      var animationCurves = [];
      for (nodeID in rawCurves) {
        if (nodeID.match(/\d+/)) {
          var animationCurve = parseAnimationCurve(rawCurves[nodeID]);
          animationCurves.push(animationCurve);
          var firstParentConn = connections.get(animationCurve.id).parents[0];
          var firstParentID = firstParentConn.ID;
          var firstParentRelationship = firstParentConn.relationship;
          var axis = '';
          if (firstParentRelationship.match(/X/)) {
            axis = 'x';
          } else if (firstParentRelationship.match(/Y/)) {
            axis = 'y';
          } else if (firstParentRelationship.match(/Z/)) {
            axis = 'z';
          } else {
            continue;
          }
          tmpMap.get(firstParentID).curves[axis] = animationCurve;
        }
      }
      tmpMap.forEach(function(curveNode) {
        var id = curveNode.containerBoneID;
        if (!returnObject.curves.has(id)) {
          returnObject.curves.set(id, {
            T: null,
            R: null,
            S: null
          });
        }
        returnObject.curves.get(id)[curveNode.attr] = curveNode;
        if (curveNode.attr === 'R') {
          var curves = curveNode.curves;
          curves.x.values = curves.x.values.map(degreeToRadian);
          curves.y.values = curves.y.values.map(degreeToRadian);
          curves.z.values = curves.z.values.map(degreeToRadian);
          if (curveNode.preRotations !== null) {
            var preRotations = new THREE.Euler().setFromVector3(curveNode.preRotations, 'ZYX');
            preRotations = new THREE.Quaternion().setFromEuler(preRotations);
            var frameRotation = new THREE.Euler();
            var frameRotationQuaternion = new THREE.Quaternion();
            for (var frame = 0; frame < curves.x.times.length; ++frame) {
              frameRotation.set(curves.x.values[frame], curves.y.values[frame], curves.z.values[frame], 'ZYX');
              frameRotationQuaternion.setFromEuler(frameRotation).premultiply(preRotations);
              frameRotation.setFromQuaternion(frameRotationQuaternion, 'ZYX');
              curves.x.values[frame] = frameRotation.x;
              curves.y.values[frame] = frameRotation.y;
              curves.z.values[frame] = frameRotation.z;
            }
          }
        }
      });
      for (var nodeID in rawLayers) {
        var layer = [];
        var children = connections.get(parseInt(nodeID)).children;
        for (var childIndex = 0; childIndex < children.length; childIndex++) {
          if (tmpMap.has(children[childIndex].ID)) {
            var curveNode = tmpMap.get(children[childIndex].ID);
            var boneID = curveNode.containerBoneID;
            if (layer[boneID] === undefined) {
              layer[boneID] = {
                T: null,
                R: null,
                S: null
              };
            }
            layer[boneID][curveNode.attr] = curveNode;
          }
        }
        returnObject.layers[nodeID] = layer;
      }
      for (var nodeID in rawStacks) {
        var layers = [];
        var children = connections.get(parseInt(nodeID)).children;
        var timestamps = {
          max: 0,
          min: Number.MAX_VALUE
        };
        for (var childIndex = 0; childIndex < children.length; ++childIndex) {
          var currentLayer = returnObject.layers[children[childIndex].ID];
          if (currentLayer !== undefined) {
            layers.push(currentLayer);
            for (var currentLayerIndex = 0,
                currentLayerLength = currentLayer.length; currentLayerIndex < currentLayerLength; ++currentLayerIndex) {
              var layer = currentLayer[currentLayerIndex];
              if (layer) {
                getCurveNodeMaxMinTimeStamps(layer, timestamps);
              }
            }
          }
        }
        if (timestamps.max > timestamps.min) {
          returnObject.stacks[nodeID] = {
            name: rawStacks[nodeID].attrName,
            layers: layers,
            length: timestamps.max - timestamps.min,
            frames: (timestamps.max - timestamps.min) * 30
          };
        }
      }
      return returnObject;
    }
    function parseAnimationNode(FBXTree, animationCurveNode, connections, sceneGraph) {
      var rawModels = FBXTree.Objects.subNodes.Model;
      var returnObject = {
        id: animationCurveNode.id,
        attr: animationCurveNode.attrName,
        internalID: animationCurveNode.id,
        attrX: false,
        attrY: false,
        attrZ: false,
        containerBoneID: -1,
        containerID: -1,
        curves: {
          x: null,
          y: null,
          z: null
        },
        preRotations: null
      };
      if (returnObject.attr.match(/S|R|T/)) {
        for (var attributeKey in animationCurveNode.properties) {
          if (attributeKey.match(/X/)) {
            returnObject.attrX = true;
          }
          if (attributeKey.match(/Y/)) {
            returnObject.attrY = true;
          }
          if (attributeKey.match(/Z/)) {
            returnObject.attrZ = true;
          }
        }
      } else {
        return null;
      }
      var conns = connections.get(returnObject.id);
      var containerIndices = conns.parents;
      for (var containerIndicesIndex = containerIndices.length - 1; containerIndicesIndex >= 0; --containerIndicesIndex) {
        var boneID = findIndex(sceneGraph.skeleton.bones, function(bone) {
          return bone.FBX_ID === containerIndices[containerIndicesIndex].ID;
        });
        if (boneID > -1) {
          returnObject.containerBoneID = boneID;
          returnObject.containerID = containerIndices[containerIndicesIndex].ID;
          var model = rawModels[returnObject.containerID.toString()];
          if ('PreRotation' in model.properties) {
            returnObject.preRotations = parseVector3(model.properties.PreRotation).multiplyScalar(Math.PI / 180);
          }
          break;
        }
      }
      return returnObject;
    }
    function parseAnimationCurve(animationCurve) {
      return {
        version: null,
        id: animationCurve.id,
        internalID: animationCurve.id,
        times: parseFloatArray(animationCurve.subNodes.KeyTime.properties.a).map(convertFBXTimeToSeconds),
        values: parseFloatArray(animationCurve.subNodes.KeyValueFloat.properties.a),
        attrFlag: parseIntArray(animationCurve.subNodes.KeyAttrFlags.properties.a),
        attrData: parseFloatArray(animationCurve.subNodes.KeyAttrDataFloat.properties.a)
      };
    }
    function getCurveNodeMaxMinTimeStamps(layer, timestamps) {
      if (layer.R) {
        getCurveMaxMinTimeStamp(layer.R.curves, timestamps);
      }
      if (layer.S) {
        getCurveMaxMinTimeStamp(layer.S.curves, timestamps);
      }
      if (layer.T) {
        getCurveMaxMinTimeStamp(layer.T.curves, timestamps);
      }
    }
    function getCurveMaxMinTimeStamp(curve, timestamps) {
      if (curve.x) {
        getCurveAxisMaxMinTimeStamps(curve.x, timestamps);
      }
      if (curve.y) {
        getCurveAxisMaxMinTimeStamps(curve.y, timestamps);
      }
      if (curve.z) {
        getCurveAxisMaxMinTimeStamps(curve.z, timestamps);
      }
    }
    function getCurveAxisMaxMinTimeStamps(axis, timestamps) {
      timestamps.max = axis.times[axis.times.length - 1] > timestamps.max ? axis.times[axis.times.length - 1] : timestamps.max;
      timestamps.min = axis.times[0] < timestamps.min ? axis.times[0] : timestamps.min;
    }
    function addAnimations(group, animations) {
      if (group.animations === undefined) {
        group.animations = [];
      }
      var stacks = animations.stacks;
      for (var key in stacks) {
        var stack = stacks[key];
        var animationData = {
          name: stack.name,
          fps: 30,
          length: stack.length,
          hierarchy: []
        };
        var bones = group.skeleton.bones;
        for (var bonesIndex = 0,
            bonesLength = bones.length; bonesIndex < bonesLength; ++bonesIndex) {
          var bone = bones[bonesIndex];
          var name = bone.name.replace(/.*:/, '');
          var parentIndex = findIndex(bones, function(parentBone) {
            return bone.parent === parentBone;
          });
          animationData.hierarchy.push({
            parent: parentIndex,
            name: name,
            keys: []
          });
        }
        for (var frame = 0; frame <= stack.frames; frame++) {
          for (var bonesIndex = 0,
              bonesLength = bones.length; bonesIndex < bonesLength; ++bonesIndex) {
            var bone = bones[bonesIndex];
            var boneIndex = bonesIndex;
            var animationNode = stack.layers[0][boneIndex];
            for (var hierarchyIndex = 0,
                hierarchyLength = animationData.hierarchy.length; hierarchyIndex < hierarchyLength; ++hierarchyIndex) {
              var node = animationData.hierarchy[hierarchyIndex];
              if (node.name === bone.name) {
                node.keys.push(generateKey(animations, animationNode, bone, frame));
              }
            }
          }
        }
        group.animations.push(THREE.AnimationClip.parseAnimation(animationData, bones));
      }
    }
    var euler = new THREE.Euler();
    var quaternion = new THREE.Quaternion();
    function generateKey(animations, animationNode, bone, frame) {
      var key = {
        time: frame / animations.fps,
        pos: bone.position.toArray(),
        rot: bone.quaternion.toArray(),
        scl: bone.scale.toArray()
      };
      if (animationNode === undefined)
        return key;
      try {
        if (hasCurve(animationNode, 'T') && hasKeyOnFrame(animationNode.T, frame)) {
          key.pos = [animationNode.T.curves.x.values[frame], animationNode.T.curves.y.values[frame], animationNode.T.curves.z.values[frame]];
        }
        if (hasCurve(animationNode, 'R') && hasKeyOnFrame(animationNode.R, frame)) {
          var rotationX = animationNode.R.curves.x.values[frame];
          var rotationY = animationNode.R.curves.y.values[frame];
          var rotationZ = animationNode.R.curves.z.values[frame];
          quaternion.setFromEuler(euler.set(rotationX, rotationY, rotationZ, 'ZYX'));
          key.rot = quaternion.toArray();
        }
        if (hasCurve(animationNode, 'S') && hasKeyOnFrame(animationNode.S, frame)) {
          key.scl = [animationNode.S.curves.x.values[frame], animationNode.S.curves.y.values[frame], animationNode.S.curves.z.values[frame]];
        }
      } catch (error) {
        console.log(bone);
        console.log(error);
      }
      return key;
    }
    var AXES = ['x', 'y', 'z'];
    function hasCurve(animationNode, attribute) {
      if (animationNode === undefined) {
        return false;
      }
      var attributeNode = animationNode[attribute];
      if (!attributeNode) {
        return false;
      }
      return AXES.every(function(key) {
        return attributeNode.curves[key] !== null;
      });
    }
    function hasKeyOnFrame(attributeNode, frame) {
      return AXES.every(function(key) {
        return isKeyExistOnFrame(attributeNode.curves[key], frame);
      });
    }
    function isKeyExistOnFrame(curve, frame) {
      return curve.values[frame] !== undefined;
    }
    function Vertex() {
      this.position = new THREE.Vector3();
      this.normal = new THREE.Vector3();
      this.uv = new THREE.Vector2();
      this.color = new THREE.Vector3();
      this.skinIndices = new THREE.Vector4(0, 0, 0, 0);
      this.skinWeights = new THREE.Vector4(0, 0, 0, 0);
    }
    Object.assign(Vertex.prototype, {
      copy: function(target) {
        var returnVar = target || new Vertex();
        returnVar.position.copy(this.position);
        returnVar.normal.copy(this.normal);
        returnVar.uv.copy(this.uv);
        returnVar.skinIndices.copy(this.skinIndices);
        returnVar.skinWeights.copy(this.skinWeights);
        return returnVar;
      },
      flattenToBuffers: function(vertexBuffer, normalBuffer, uvBuffer, colorBuffer, skinIndexBuffer, skinWeightBuffer) {
        this.position.toArray(vertexBuffer, vertexBuffer.length);
        this.normal.toArray(normalBuffer, normalBuffer.length);
        this.uv.toArray(uvBuffer, uvBuffer.length);
        this.color.toArray(colorBuffer, colorBuffer.length);
        this.skinIndices.toArray(skinIndexBuffer, skinIndexBuffer.length);
        this.skinWeights.toArray(skinWeightBuffer, skinWeightBuffer.length);
      }
    });
    function Triangle() {
      this.vertices = [];
    }
    Object.assign(Triangle.prototype, {
      copy: function(target) {
        var returnVar = target || new Triangle();
        for (var i = 0; i < this.vertices.length; ++i) {
          this.vertices[i].copy(returnVar.vertices[i]);
        }
        return returnVar;
      },
      flattenToBuffers: function(vertexBuffer, normalBuffer, uvBuffer, colorBuffer, skinIndexBuffer, skinWeightBuffer) {
        var vertices = this.vertices;
        for (var i = 0,
            l = vertices.length; i < l; ++i) {
          vertices[i].flattenToBuffers(vertexBuffer, normalBuffer, uvBuffer, colorBuffer, skinIndexBuffer, skinWeightBuffer);
        }
      }
    });
    function Face() {
      this.triangles = [];
      this.materialIndex = 0;
    }
    Object.assign(Face.prototype, {
      copy: function(target) {
        var returnVar = target || new Face();
        for (var i = 0; i < this.triangles.length; ++i) {
          this.triangles[i].copy(returnVar.triangles[i]);
        }
        returnVar.materialIndex = this.materialIndex;
        return returnVar;
      },
      genTrianglesFromVertices: function(vertexArray) {
        for (var i = 2; i < vertexArray.length; ++i) {
          var triangle = new Triangle();
          triangle.vertices[0] = vertexArray[0];
          triangle.vertices[1] = vertexArray[i - 1];
          triangle.vertices[2] = vertexArray[i];
          this.triangles.push(triangle);
        }
      },
      flattenToBuffers: function(vertexBuffer, normalBuffer, uvBuffer, colorBuffer, skinIndexBuffer, skinWeightBuffer, materialIndexBuffer) {
        var triangles = this.triangles;
        var materialIndex = this.materialIndex;
        for (var i = 0,
            l = triangles.length; i < l; ++i) {
          triangles[i].flattenToBuffers(vertexBuffer, normalBuffer, uvBuffer, colorBuffer, skinIndexBuffer, skinWeightBuffer);
          append(materialIndexBuffer, [materialIndex, materialIndex, materialIndex]);
        }
      }
    });
    function Geometry() {
      this.faces = [];
      this.skeleton = null;
    }
    Object.assign(Geometry.prototype, {flattenToBuffers: function() {
        var vertexBuffer = [];
        var normalBuffer = [];
        var uvBuffer = [];
        var colorBuffer = [];
        var skinIndexBuffer = [];
        var skinWeightBuffer = [];
        var materialIndexBuffer = [];
        var faces = this.faces;
        for (var i = 0,
            l = faces.length; i < l; ++i) {
          faces[i].flattenToBuffers(vertexBuffer, normalBuffer, uvBuffer, colorBuffer, skinIndexBuffer, skinWeightBuffer, materialIndexBuffer);
        }
        return {
          vertexBuffer: vertexBuffer,
          normalBuffer: normalBuffer,
          uvBuffer: uvBuffer,
          colorBuffer: colorBuffer,
          skinIndexBuffer: skinIndexBuffer,
          skinWeightBuffer: skinWeightBuffer,
          materialIndexBuffer: materialIndexBuffer
        };
      }});
    function TextParser() {}
    Object.assign(TextParser.prototype, {
      getPrevNode: function() {
        return this.nodeStack[this.currentIndent - 2];
      },
      getCurrentNode: function() {
        return this.nodeStack[this.currentIndent - 1];
      },
      getCurrentProp: function() {
        return this.currentProp;
      },
      pushStack: function(node) {
        this.nodeStack.push(node);
        this.currentIndent += 1;
      },
      popStack: function() {
        this.nodeStack.pop();
        this.currentIndent -= 1;
      },
      setCurrentProp: function(val, name) {
        this.currentProp = val;
        this.currentPropName = name;
      },
      parse: function(text) {
        this.currentIndent = 0;
        this.allNodes = new FBXTree();
        this.nodeStack = [];
        this.currentProp = [];
        this.currentPropName = '';
        var split = text.split("\n");
        for (var line in split) {
          var l = split[line];
          if (l.match(/^[\s\t]*;/)) {
            continue;
          }
          if (l.match(/^[\s\t]*$/)) {
            continue;
          }
          var beginningOfNodeExp = new RegExp("^\\t{" + this.currentIndent + "}(\\w+):(.*){", '');
          var match = l.match(beginningOfNodeExp);
          if (match) {
            var nodeName = match[1].trim().replace(/^"/, '').replace(/"$/, "");
            var nodeAttrs = match[2].split(',');
            for (var i = 0,
                l = nodeAttrs.length; i < l; i++) {
              nodeAttrs[i] = nodeAttrs[i].trim().replace(/^"/, '').replace(/"$/, '');
            }
            this.parseNodeBegin(l, nodeName, nodeAttrs || null);
            continue;
          }
          var propExp = new RegExp("^\\t{" + (this.currentIndent) + "}(\\w+):[\\s\\t\\r\\n](.*)");
          var match = l.match(propExp);
          if (match) {
            var propName = match[1].replace(/^"/, '').replace(/"$/, "").trim();
            var propValue = match[2].replace(/^"/, '').replace(/"$/, "").trim();
            this.parseNodeProperty(l, propName, propValue);
            continue;
          }
          var endOfNodeExp = new RegExp("^\\t{" + (this.currentIndent - 1) + "}}");
          if (l.match(endOfNodeExp)) {
            this.nodeEnd();
            continue;
          }
          if (l.match(/^[^\s\t}]/)) {
            this.parseNodePropertyContinued(l);
          }
        }
        return this.allNodes;
      },
      parseNodeBegin: function(line, nodeName, nodeAttrs) {
        var node = {
          'name': nodeName,
          properties: {},
          'subNodes': {}
        };
        var attrs = this.parseNodeAttr(nodeAttrs);
        var currentNode = this.getCurrentNode();
        if (this.currentIndent === 0) {
          this.allNodes.add(nodeName, node);
        } else {
          if (nodeName in currentNode.subNodes) {
            var tmp = currentNode.subNodes[nodeName];
            if (this.isFlattenNode(currentNode.subNodes[nodeName])) {
              if (attrs.id === '') {
                currentNode.subNodes[nodeName] = [];
                currentNode.subNodes[nodeName].push(tmp);
              } else {
                currentNode.subNodes[nodeName] = {};
                currentNode.subNodes[nodeName][tmp.id] = tmp;
              }
            }
            if (attrs.id === '') {
              currentNode.subNodes[nodeName].push(node);
            } else {
              currentNode.subNodes[nodeName][attrs.id] = node;
            }
          } else if (typeof attrs.id === 'number' || attrs.id.match(/^\d+$/)) {
            currentNode.subNodes[nodeName] = {};
            currentNode.subNodes[nodeName][attrs.id] = node;
          } else {
            currentNode.subNodes[nodeName] = node;
          }
        }
        if (nodeAttrs) {
          node.id = attrs.id;
          node.attrName = attrs.name;
          node.attrType = attrs.type;
        }
        this.pushStack(node);
      },
      parseNodeAttr: function(attrs) {
        var id = attrs[0];
        if (attrs[0] !== "") {
          id = parseInt(attrs[0]);
          if (isNaN(id)) {
            id = attrs[0];
          }
        }
        var name = '',
            type = '';
        if (attrs.length > 1) {
          name = attrs[1].replace(/^(\w+)::/, '');
          type = attrs[2];
        }
        return {
          id: id,
          name: name,
          type: type
        };
      },
      parseNodeProperty: function(line, propName, propValue) {
        var currentNode = this.getCurrentNode();
        var parentName = currentNode.name;
        if (parentName !== undefined) {
          var propMatch = parentName.match(/Properties(\d)+/);
          if (propMatch) {
            this.parseNodeSpecialProperty(line, propName, propValue);
            return;
          }
        }
        if (propName == 'C') {
          var connProps = propValue.split(',').slice(1);
          var from = parseInt(connProps[0]);
          var to = parseInt(connProps[1]);
          var rest = propValue.split(',').slice(3);
          propName = 'connections';
          propValue = [from, to];
          append(propValue, rest);
          if (currentNode.properties[propName] === undefined) {
            currentNode.properties[propName] = [];
          }
        }
        if (propName == 'Node') {
          var id = parseInt(propValue);
          currentNode.properties.id = id;
          currentNode.id = id;
        }
        if (propName in currentNode.properties) {
          if (Array.isArray(currentNode.properties[propName])) {
            currentNode.properties[propName].push(propValue);
          } else {
            currentNode.properties[propName] += propValue;
          }
        } else {
          if (Array.isArray(currentNode.properties[propName])) {
            currentNode.properties[propName].push(propValue);
          } else {
            currentNode.properties[propName] = propValue;
          }
        }
        this.setCurrentProp(currentNode.properties, propName);
      },
      parseNodePropertyContinued: function(line) {
        this.currentProp[this.currentPropName] += line;
      },
      parseNodeSpecialProperty: function(line, propName, propValue) {
        var props = propValue.split('",');
        for (var i = 0,
            l = props.length; i < l; i++) {
          props[i] = props[i].trim().replace(/^\"/, '').replace(/\s/, '_');
        }
        var innerPropName = props[0];
        var innerPropType1 = props[1];
        var innerPropType2 = props[2];
        var innerPropFlag = props[3];
        var innerPropValue = props[4];
        switch (innerPropType1) {
          case "int":
            innerPropValue = parseInt(innerPropValue);
            break;
          case "double":
            innerPropValue = parseFloat(innerPropValue);
            break;
          case "ColorRGB":
          case "Vector3D":
            innerPropValue = parseFloatArray(innerPropValue);
            break;
        }
        this.getPrevNode().properties[innerPropName] = {
          'type': innerPropType1,
          'type2': innerPropType2,
          'flag': innerPropFlag,
          'value': innerPropValue
        };
        this.setCurrentProp(this.getPrevNode().properties, innerPropName);
      },
      nodeEnd: function() {
        this.popStack();
      },
      isFlattenNode: function(node) {
        return ('subNodes' in node && 'properties' in node) ? true : false;
      }
    });
    function FBXTree() {}
    Object.assign(FBXTree.prototype, {
      add: function(key, val) {
        this[key] = val;
      },
      searchConnectionParent: function(id) {
        if (this.__cache_search_connection_parent === undefined) {
          this.__cache_search_connection_parent = [];
        }
        if (this.__cache_search_connection_parent[id] !== undefined) {
          return this.__cache_search_connection_parent[id];
        } else {
          this.__cache_search_connection_parent[id] = [];
        }
        var conns = this.Connections.properties.connections;
        var results = [];
        for (var i = 0; i < conns.length; ++i) {
          if (conns[i][0] == id) {
            var res = conns[i][1] === 0 ? -1 : conns[i][1];
            results.push(res);
          }
        }
        if (results.length > 0) {
          append(this.__cache_search_connection_parent[id], results);
          return results;
        } else {
          this.__cache_search_connection_parent[id] = [-1];
          return [-1];
        }
      },
      searchConnectionChildren: function(id) {
        if (this.__cache_search_connection_children === undefined) {
          this.__cache_search_connection_children = [];
        }
        if (this.__cache_search_connection_children[id] !== undefined) {
          return this.__cache_search_connection_children[id];
        } else {
          this.__cache_search_connection_children[id] = [];
        }
        var conns = this.Connections.properties.connections;
        var res = [];
        for (var i = 0; i < conns.length; ++i) {
          if (conns[i][1] == id) {
            res.push(conns[i][0] === 0 ? -1 : conns[i][0]);
          }
        }
        if (res.length > 0) {
          append(this.__cache_search_connection_children[id], res);
          return res;
        } else {
          this.__cache_search_connection_children[id] = [];
          return [];
        }
      },
      searchConnectionType: function(id, to) {
        var key = id + ',' + to;
        if (this.__cache_search_connection_type === undefined) {
          this.__cache_search_connection_type = {};
        }
        if (this.__cache_search_connection_type[key] !== undefined) {
          return this.__cache_search_connection_type[key];
        } else {
          this.__cache_search_connection_type[key] = '';
        }
        var conns = this.Connections.properties.connections;
        for (var i = 0; i < conns.length; ++i) {
          if (conns[i][0] == id && conns[i][1] == to) {
            this.__cache_search_connection_type[key] = conns[i][2];
            return conns[i][2];
          }
        }
        this.__cache_search_connection_type[id] = null;
        return null;
      }
    });
    function isFbxFormatASCII(text) {
      var CORRECT = ['K', 'a', 'y', 'd', 'a', 'r', 'a', '\\', 'F', 'B', 'X', '\\', 'B', 'i', 'n', 'a', 'r', 'y', '\\', '\\'];
      var cursor = 0;
      function read(offset) {
        var result = text[offset - 1];
        text = text.slice(cursor + offset);
        cursor++;
        return result;
      }
      for (var i = 0; i < CORRECT.length; ++i) {
        var num = read(1);
        if (num == CORRECT[i]) {
          return false;
        }
      }
      return true;
    }
    function getFbxVersion(text) {
      var versionRegExp = /FBXVersion: (\d+)/;
      var match = text.match(versionRegExp);
      if (match) {
        var version = parseInt(match[1]);
        return version;
      }
      throw new Error('FBXLoader: Cannot find the version number for the file given.');
    }
    function convertFBXTimeToSeconds(time) {
      return time / 46186158000;
    }
    function parseFloatArray(string) {
      var array = string.split(',');
      for (var i = 0,
          l = array.length; i < l; i++) {
        array[i] = parseFloat(array[i]);
      }
      return array;
    }
    function parseIntArray(string) {
      var array = string.split(',');
      for (var i = 0,
          l = array.length; i < l; i++) {
        array[i] = parseInt(array[i]);
      }
      return array;
    }
    function parseVector3(property) {
      return new THREE.Vector3().fromArray(property.value);
    }
    function parseColor(property) {
      return new THREE.Color().fromArray(property.value);
    }
    function parseMatrixArray(floatString) {
      return new THREE.Matrix4().fromArray(parseFloatArray(floatString));
    }
    function degreeToRadian(value) {
      return value * DEG2RAD;
    }
    var DEG2RAD = Math.PI / 180;
    function findIndex(array, func) {
      for (var i = 0,
          l = array.length; i < l; i++) {
        if (func(array[i]))
          return i;
      }
      return -1;
    }
    function append(a, b) {
      for (var i = 0,
          j = a.length,
          l = b.length; i < l; i++, j++) {
        a[j] = b[i];
      }
    }
    function slice(a, b, from, to) {
      for (var i = from,
          j = 0; i < to; i++, j++) {
        a[j] = b[i];
      }
      return a;
    }
  })();
})(require('buffer').Buffer);
