/* */ 
(function(Buffer, process) {
  THREE.Face3.prototype.set = function(a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;
  };
  var TypedArrayHelper = function(size, registers, register_type, array_type, unit_size, accessors) {
    this.array_type = array_type;
    this.register_type = register_type;
    this.unit_size = unit_size;
    this.accessors = accessors;
    this.buffer = new array_type(size * unit_size);
    this.register = [];
    this.length = 0;
    this.real_length = size;
    this.available_registers = registers;
    for (var i = 0; i < registers; i++) {
      this.register.push(new register_type());
    }
  };
  TypedArrayHelper.prototype = {
    constructor: TypedArrayHelper,
    index_to_register: function(index, register, isLoop) {
      var base = index * this.unit_size;
      if (register >= this.available_registers) {
        throw new Error('THREE.BufferSubdivisionModifier: Not enough registers in TypedArrayHelper.');
      }
      if (index > this.length) {
        throw new Error('THREE.BufferSubdivisionModifier: Index is out of range in TypedArrayHelper.');
      }
      for (var i = 0; i < this.unit_size; i++) {
        (this.register[register])[this.accessors[i]] = this.buffer[base + i];
      }
    },
    resize: function(new_size) {
      if (new_size === 0) {
        new_size = 8;
      }
      if (new_size < this.length) {
        this.buffer = this.buffer.subarray(0, this.length * this.unit_size);
      } else {
        var nBuffer;
        if (this.buffer.length < new_size * this.unit_size) {
          nBuffer = new this.array_type(new_size * this.unit_size);
          nBuffer.set(this.buffer);
          this.buffer = nBuffer;
          this.real_length = new_size;
        } else {
          nBuffer = new this.array_type(new_size * this.unit_size);
          nBuffer.set(this.buffer.subarray(0, this.length * this.unit_size));
          this.buffer = nBuffer;
          this.real_length = new_size;
        }
      }
    },
    from_existing: function(oldArray) {
      var new_size = oldArray.length;
      this.buffer = new this.array_type(new_size);
      this.buffer.set(oldArray);
      this.length = oldArray.length / this.unit_size;
      this.real_length = this.length;
    },
    push_element: function(vector) {
      if (this.length + 1 > this.real_length) {
        this.resize(this.real_length * 2);
      }
      var bpos = this.length * this.unit_size;
      for (var i = 0; i < this.unit_size; i++) {
        this.buffer[bpos + i] = vector[this.accessors[i]];
      }
      this.length++;
    },
    trim_size: function() {
      if (this.length < this.real_length) {
        this.resize(this.length);
      }
    }
  };
  function convertGeometryToIndexedBuffer(geometry) {
    var BGeom = new THREE.BufferGeometry();
    var vertArray = new TypedArrayHelper(geometry.vertices.length, 0, THREE.Vector3, Float32Array, 3, ['x', 'y', 'z']);
    var indexArray = new TypedArrayHelper(geometry.faces.length, 0, THREE.Face3, Uint32Array, 3, ['a', 'b', 'c']);
    var uvArray = new TypedArrayHelper(geometry.faceVertexUvs[0].length * 3 * 3, 0, THREE.Vector2, Float32Array, 2, ['x', 'y']);
    var i,
        il;
    for (i = 0, il = geometry.vertices.length; i < il; i++) {
      vertArray.push_element(geometry.vertices[i]);
    }
    for (i = 0, il = geometry.faces.length; i < il; i++) {
      indexArray.push_element(geometry.faces[i]);
    }
    for (i = 0, il = geometry.faceVertexUvs[0].length; i < il; i++) {
      uvArray.push_element(geometry.faceVertexUvs[0][i][0]);
      uvArray.push_element(geometry.faceVertexUvs[0][i][1]);
      uvArray.push_element(geometry.faceVertexUvs[0][i][2]);
    }
    indexArray.trim_size();
    vertArray.trim_size();
    uvArray.trim_size();
    BGeom.setIndex(new THREE.BufferAttribute(indexArray.buffer, 3));
    BGeom.addAttribute('position', new THREE.BufferAttribute(vertArray.buffer, 3));
    BGeom.addAttribute('uv', new THREE.BufferAttribute(uvArray.buffer, 2));
    return BGeom;
  }
  function compute_vertex_normals(geometry) {
    var ABC = ['a', 'b', 'c'];
    var XYZ = ['x', 'y', 'z'];
    var XY = ['x', 'y'];
    var oldVertices = new TypedArrayHelper(0, 5, THREE.Vector3, Float32Array, 3, XYZ);
    var oldFaces = new TypedArrayHelper(0, 3, THREE.Face3, Uint32Array, 3, ABC);
    oldVertices.from_existing(geometry.getAttribute('position').array);
    var newNormals = new TypedArrayHelper(oldVertices.length * 3, 4, THREE.Vector3, Float32Array, 3, XYZ);
    var newNormalFaces = new TypedArrayHelper(oldVertices.length, 1, function() {
      this.x = 0;
    }, Float32Array, 1, ['x']);
    newNormals.length = oldVertices.length;
    oldFaces.from_existing(geometry.index.array);
    var a,
        b,
        c;
    var i,
        j,
        jl;
    var my_weight;
    var full_weights = [0.0, 0.0, 0.0];
    for (i = 0, il = oldFaces.length; i < il; i++) {
      oldFaces.index_to_register(i, 0);
      oldVertices.index_to_register(oldFaces.register[0].a, 0);
      oldVertices.index_to_register(oldFaces.register[0].b, 1);
      oldVertices.index_to_register(oldFaces.register[0].c, 2);
      newNormals.register[0].subVectors(oldVertices.register[1], oldVertices.register[0]);
      newNormals.register[1].subVectors(oldVertices.register[2], oldVertices.register[1]);
      newNormals.register[0].cross(newNormals.register[1]);
      my_weight = Math.abs(newNormals.register[0].length());
      newNormalFaces.buffer[oldFaces.register[0].a] += my_weight;
      newNormalFaces.buffer[oldFaces.register[0].b] += my_weight;
      newNormalFaces.buffer[oldFaces.register[0].c] += my_weight;
    }
    var tmpx,
        tmpy,
        tmpz;
    var t_len;
    for (i = 0, il = oldFaces.length; i < il; i++) {
      oldFaces.index_to_register(i, 0);
      oldVertices.index_to_register(oldFaces.register[0].a, 0);
      oldVertices.index_to_register(oldFaces.register[0].b, 1);
      oldVertices.index_to_register(oldFaces.register[0].c, 2);
      newNormals.register[0].subVectors(oldVertices.register[1], oldVertices.register[0]);
      newNormals.register[1].subVectors(oldVertices.register[2], oldVertices.register[0]);
      newNormals.register[3].set(0, 0, 0);
      newNormals.register[3].x = (newNormals.register[0].y * newNormals.register[1].z) - (newNormals.register[0].z * newNormals.register[1].y);
      newNormals.register[3].y = (newNormals.register[0].z * newNormals.register[1].x) - (newNormals.register[0].x * newNormals.register[1].z);
      newNormals.register[3].z = (newNormals.register[0].x * newNormals.register[1].y) - (newNormals.register[0].y * newNormals.register[1].x);
      newNormals.register[0].cross(newNormals.register[1]);
      my_weight = Math.abs(newNormals.register[0].length());
      full_weights[0] = (my_weight / newNormalFaces.buffer[oldFaces.register[0].a]);
      full_weights[1] = (my_weight / newNormalFaces.buffer[oldFaces.register[0].b]);
      full_weights[2] = (my_weight / newNormalFaces.buffer[oldFaces.register[0].c]);
      tmpx = newNormals.register[3].x * full_weights[0];
      tmpy = newNormals.register[3].y * full_weights[0];
      tmpz = newNormals.register[3].z * full_weights[0];
      newNormals.buffer[(oldFaces.register[0].a * 3) + 0] += newNormals.register[3].x * full_weights[0];
      newNormals.buffer[(oldFaces.register[0].a * 3) + 1] += newNormals.register[3].y * full_weights[0];
      newNormals.buffer[(oldFaces.register[0].a * 3) + 2] += newNormals.register[3].z * full_weights[0];
      newNormals.buffer[(oldFaces.register[0].b * 3) + 0] += newNormals.register[3].x * full_weights[1];
      newNormals.buffer[(oldFaces.register[0].b * 3) + 1] += newNormals.register[3].y * full_weights[1];
      newNormals.buffer[(oldFaces.register[0].b * 3) + 2] += newNormals.register[3].z * full_weights[1];
      newNormals.buffer[(oldFaces.register[0].c * 3) + 0] += newNormals.register[3].x * full_weights[2];
      newNormals.buffer[(oldFaces.register[0].c * 3) + 1] += newNormals.register[3].y * full_weights[2];
      newNormals.buffer[(oldFaces.register[0].c * 3) + 2] += newNormals.register[3].z * full_weights[2];
    }
    newNormals.trim_size();
    geometry.addAttribute('normal', new THREE.BufferAttribute(newNormals.buffer, 3));
  }
  function unIndexIndexedGeometry(geometry) {
    var ABC = ['a', 'b', 'c'];
    var XYZ = ['x', 'y', 'z'];
    var XY = ['x', 'y'];
    var oldVertices = new TypedArrayHelper(0, 3, THREE.Vector3, Float32Array, 3, XYZ);
    var oldFaces = new TypedArrayHelper(0, 3, THREE.Face3, Uint32Array, 3, ABC);
    var oldUvs = new TypedArrayHelper(0, 3, THREE.Vector2, Float32Array, 2, XY);
    var oldNormals = new TypedArrayHelper(0, 3, THREE.Vector3, Float32Array, 3, XYZ);
    oldVertices.from_existing(geometry.getAttribute('position').array);
    oldFaces.from_existing(geometry.index.array);
    oldUvs.from_existing(geometry.getAttribute('uv').array);
    compute_vertex_normals(geometry);
    oldNormals.from_existing(geometry.getAttribute('normal').array);
    var newVertices = new TypedArrayHelper(oldFaces.length * 3, 3, THREE.Vector3, Float32Array, 3, XYZ);
    var newNormals = new TypedArrayHelper(oldFaces.length * 3, 3, THREE.Vector3, Float32Array, 3, XYZ);
    var newUvs = new TypedArrayHelper(oldFaces.length * 3, 3, THREE.Vector2, Float32Array, 2, XY);
    var v,
        w;
    for (var i = 0,
        il = oldFaces.length; i < il; i++) {
      oldFaces.index_to_register(i, 0);
      oldVertices.index_to_register(oldFaces.register[0].a, 0);
      oldVertices.index_to_register(oldFaces.register[0].b, 1);
      oldVertices.index_to_register(oldFaces.register[0].c, 2);
      newVertices.push_element(oldVertices.register[0]);
      newVertices.push_element(oldVertices.register[1]);
      newVertices.push_element(oldVertices.register[2]);
      if (oldUvs.length !== 0) {
        oldUvs.index_to_register((i * 3) + 0, 0);
        oldUvs.index_to_register((i * 3) + 1, 1);
        oldUvs.index_to_register((i * 3) + 2, 2);
        newUvs.push_element(oldUvs.register[0]);
        newUvs.push_element(oldUvs.register[1]);
        newUvs.push_element(oldUvs.register[2]);
      }
      oldNormals.index_to_register(oldFaces.register[0].a, 0);
      oldNormals.index_to_register(oldFaces.register[0].b, 1);
      oldNormals.index_to_register(oldFaces.register[0].c, 2);
      newNormals.push_element(oldNormals.register[0]);
      newNormals.push_element(oldNormals.register[1]);
      newNormals.push_element(oldNormals.register[2]);
    }
    newVertices.trim_size();
    newUvs.trim_size();
    newNormals.trim_size();
    geometry.index = null;
    geometry.addAttribute('position', new THREE.BufferAttribute(newVertices.buffer, 3));
    geometry.addAttribute('normal', new THREE.BufferAttribute(newNormals.buffer, 3));
    if (newUvs.length !== 0) {
      geometry.addAttribute('uv', new THREE.BufferAttribute(newUvs.buffer, 2));
    }
    return geometry;
  }
  THREE.BufferSubdivisionModifier = function(subdivisions) {
    this.subdivisions = (subdivisions === undefined) ? 1 : subdivisions;
  };
  THREE.BufferSubdivisionModifier.prototype.modify = function(geometry) {
    if (geometry instanceof THREE.Geometry) {
      geometry.mergeVertices();
      if (typeof geometry.normals === 'undefined') {
        geometry.normals = [];
      }
      geometry = convertGeometryToIndexedBuffer(geometry);
    } else if (!(geometry instanceof THREE.BufferGeometry)) {
      console.error('THREE.BufferSubdivisionModifier: Geometry is not an instance of THREE.BufferGeometry or THREE.Geometry');
    }
    var repeats = this.subdivisions;
    while (repeats-- > 0) {
      this.smooth(geometry);
    }
    return unIndexIndexedGeometry(geometry);
  };
  var edge_type = function(a, b) {
    this.a = a;
    this.b = b;
    this.faces = [];
    this.newEdge = null;
  };
  (function() {
    var ABC = ['a', 'b', 'c'];
    var XYZ = ['x', 'y', 'z'];
    var XY = ['x', 'y'];
    function getEdge(a, b, map) {
      var key = Math.min(a, b) + '_' + Math.max(a, b);
      return map[key];
    }
    function processEdge(a, b, vertices, map, face, metaVertices) {
      var vertexIndexA = Math.min(a, b);
      var vertexIndexB = Math.max(a, b);
      var key = vertexIndexA + '_' + vertexIndexB;
      var edge;
      if (key in map) {
        edge = map[key];
      } else {
        edge = new edge_type(vertexIndexA, vertexIndexB);
        map[key] = edge;
      }
      edge.faces.push(face);
      metaVertices[a].edges.push(edge);
      metaVertices[b].edges.push(edge);
    }
    function generateLookups(vertices, faces, metaVertices, edges) {
      var i,
          il,
          face,
          edge;
      for (i = 0, il = vertices.length; i < il; i++) {
        metaVertices[i] = {edges: []};
      }
      for (i = 0, il = faces.length; i < il; i++) {
        faces.index_to_register(i, 0);
        face = faces.register[0];
        processEdge(face.a, face.b, vertices, edges, i, metaVertices);
        processEdge(face.b, face.c, vertices, edges, i, metaVertices);
        processEdge(face.c, face.a, vertices, edges, i, metaVertices);
      }
    }
    function newFace(newFaces, face) {
      newFaces.push_element(face);
    }
    function midpoint(a, b) {
      return (Math.abs(b - a) / 2) + Math.min(a, b);
    }
    function newUv(newUvs, a, b, c) {
      newUvs.push_element(a);
      newUvs.push_element(b);
      newUvs.push_element(c);
    }
    THREE.BufferSubdivisionModifier.prototype.smooth = function(geometry) {
      var oldVertices,
          oldFaces,
          oldUvs;
      var newVertices,
          newFaces,
          newUVs;
      var n,
          l,
          i,
          il,
          j,
          k;
      var metaVertices,
          sourceEdges;
      oldVertices = new TypedArrayHelper(0, 3, THREE.Vector3, Float32Array, 3, XYZ);
      oldFaces = new TypedArrayHelper(0, 3, THREE.Face3, Uint32Array, 3, ABC);
      oldUvs = new TypedArrayHelper(0, 3, THREE.Vector2, Float32Array, 2, XY);
      oldVertices.from_existing(geometry.getAttribute('position').array);
      oldFaces.from_existing(geometry.index.array);
      oldUvs.from_existing(geometry.getAttribute('uv').array);
      var doUvs = false;
      if (typeof oldUvs !== 'undefined' && oldUvs.length !== 0) {
        doUvs = true;
      }
      metaVertices = new Array(oldVertices.length);
      sourceEdges = {};
      generateLookups(oldVertices, oldFaces, metaVertices, sourceEdges);
      newVertices = new TypedArrayHelper((geometry.getAttribute('position').array.length * 2) / 3, 2, THREE.Vector3, Float32Array, 3, XYZ);
      var other,
          currentEdge,
          newEdge,
          face;
      var edgeVertexWeight,
          adjacentVertexWeight,
          connectedFaces;
      var tmp = newVertices.register[1];
      for (i in sourceEdges) {
        currentEdge = sourceEdges[i];
        newEdge = newVertices.register[0];
        edgeVertexWeight = 3 / 8;
        adjacentVertexWeight = 1 / 8;
        connectedFaces = currentEdge.faces.length;
        if (connectedFaces !== 2) {
          edgeVertexWeight = 0.5;
          adjacentVertexWeight = 0;
        }
        oldVertices.index_to_register(currentEdge.a, 0);
        oldVertices.index_to_register(currentEdge.b, 1);
        newEdge.addVectors(oldVertices.register[0], oldVertices.register[1]).multiplyScalar(edgeVertexWeight);
        tmp.set(0, 0, 0);
        for (j = 0; j < connectedFaces; j++) {
          oldFaces.index_to_register(currentEdge.faces[j], 0);
          face = oldFaces.register[0];
          for (k = 0; k < 3; k++) {
            oldVertices.index_to_register(face[ABC[k]], 2);
            other = oldVertices.register[2];
            if (face[ABC[k]] !== currentEdge.a && face[ABC[k]] !== currentEdge.b) {
              break;
            }
          }
          tmp.add(other);
        }
        tmp.multiplyScalar(adjacentVertexWeight);
        newEdge.add(tmp);
        currentEdge.newEdge = newVertices.length;
        newVertices.push_element(newEdge);
      }
      var edgeLength = newVertices.length;
      var beta,
          sourceVertexWeight,
          connectingVertexWeight;
      var connectingEdge,
          connectingEdges,
          oldVertex,
          newSourceVertex;
      for (i = 0, il = oldVertices.length; i < il; i++) {
        oldVertices.index_to_register(i, 0, XYZ);
        oldVertex = oldVertices.register[0];
        connectingEdges = metaVertices[i].edges;
        n = connectingEdges.length;
        if (n === 3) {
          beta = 3 / 16;
        } else if (n > 3) {
          beta = 3 / (8 * n);
        }
        sourceVertexWeight = 1 - n * beta;
        connectingVertexWeight = beta;
        if (n <= 2) {
          if (n === 2) {
            sourceVertexWeight = 3 / 4;
            connectingVertexWeight = 1 / 8;
          }
        }
        newSourceVertex = oldVertex.multiplyScalar(sourceVertexWeight);
        tmp.set(0, 0, 0);
        for (j = 0; j < n; j++) {
          connectingEdge = connectingEdges[j];
          other = connectingEdge.a !== i ? connectingEdge.a : connectingEdge.b;
          oldVertices.index_to_register(other, 1, XYZ);
          tmp.add(oldVertices.register[1]);
        }
        tmp.multiplyScalar(connectingVertexWeight);
        newSourceVertex.add(tmp);
        newVertices.push_element(newSourceVertex, XYZ);
      }
      var edge1,
          edge2,
          edge3;
      newFaces = new TypedArrayHelper((geometry.index.array.length * 4) / 3, 1, THREE.Face3, Float32Array, 3, ABC);
      newUVs = new TypedArrayHelper((geometry.getAttribute('uv').array.length * 4) / 2, 3, THREE.Vector2, Float32Array, 2, XY);
      var x3 = newUVs.register[0];
      var x4 = newUVs.register[1];
      var x5 = newUVs.register[2];
      var tFace = newFaces.register[0];
      for (i = 0, il = oldFaces.length; i < il; i++) {
        oldFaces.index_to_register(i, 0);
        face = oldFaces.register[0];
        edge1 = getEdge(face.a, face.b, sourceEdges).newEdge;
        edge2 = getEdge(face.b, face.c, sourceEdges).newEdge;
        edge3 = getEdge(face.c, face.a, sourceEdges).newEdge;
        tFace.set(edge1, edge2, edge3);
        newFace(newFaces, tFace);
        tFace.set(face.a + edgeLength, edge1, edge3);
        newFace(newFaces, tFace);
        tFace.set(face.b + edgeLength, edge2, edge1);
        newFace(newFaces, tFace);
        tFace.set(face.c + edgeLength, edge3, edge2);
        newFace(newFaces, tFace);
        if (doUvs === true) {
          oldUvs.index_to_register((i * 3) + 0, 0);
          oldUvs.index_to_register((i * 3) + 1, 1);
          oldUvs.index_to_register((i * 3) + 2, 2);
          x0 = oldUvs.register[0];
          x1 = oldUvs.register[1];
          x2 = oldUvs.register[2];
          x3.set(midpoint(x0.x, x1.x), midpoint(x0.y, x1.y));
          x4.set(midpoint(x1.x, x2.x), midpoint(x1.y, x2.y));
          x5.set(midpoint(x0.x, x2.x), midpoint(x0.y, x2.y));
          newUv(newUVs, x3, x4, x5);
          newUv(newUVs, x0, x3, x5);
          newUv(newUVs, x1, x4, x3);
          newUv(newUVs, x2, x5, x4);
        }
      }
      newFaces.trim_size();
      newVertices.trim_size();
      newUVs.trim_size();
      geometry.setIndex(new THREE.BufferAttribute(newFaces.buffer, 3));
      geometry.addAttribute('position', new THREE.BufferAttribute(newVertices.buffer, 3));
      geometry.addAttribute('uv', new THREE.BufferAttribute(newUVs.buffer, 2));
    };
  })();
})(require('buffer').Buffer, require('process'));
