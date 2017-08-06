/* */ 
"format cjs";
(function(Buffer) {
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
      g.opentype = f();
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
      1: [function(require, module, exports) {
        var TINF_OK = 0;
        var TINF_DATA_ERROR = -3;
        function Tree() {
          this.table = new Uint16Array(16);
          this.trans = new Uint16Array(288);
        }
        function Data(source, dest) {
          this.source = source;
          this.sourceIndex = 0;
          this.tag = 0;
          this.bitcount = 0;
          this.dest = dest;
          this.destLen = 0;
          this.ltree = new Tree();
          this.dtree = new Tree();
        }
        var sltree = new Tree();
        var sdtree = new Tree();
        var length_bits = new Uint8Array(30);
        var length_base = new Uint16Array(30);
        var dist_bits = new Uint8Array(30);
        var dist_base = new Uint16Array(30);
        var clcidx = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
        var code_tree = new Tree();
        var lengths = new Uint8Array(288 + 32);
        function tinf_build_bits_base(bits, base, delta, first) {
          var i,
              sum;
          for (i = 0; i < delta; ++i)
            bits[i] = 0;
          for (i = 0; i < 30 - delta; ++i)
            bits[i + delta] = i / delta | 0;
          for (sum = first, i = 0; i < 30; ++i) {
            base[i] = sum;
            sum += 1 << bits[i];
          }
        }
        function tinf_build_fixed_trees(lt, dt) {
          var i;
          for (i = 0; i < 7; ++i)
            lt.table[i] = 0;
          lt.table[7] = 24;
          lt.table[8] = 152;
          lt.table[9] = 112;
          for (i = 0; i < 24; ++i)
            lt.trans[i] = 256 + i;
          for (i = 0; i < 144; ++i)
            lt.trans[24 + i] = i;
          for (i = 0; i < 8; ++i)
            lt.trans[24 + 144 + i] = 280 + i;
          for (i = 0; i < 112; ++i)
            lt.trans[24 + 144 + 8 + i] = 144 + i;
          for (i = 0; i < 5; ++i)
            dt.table[i] = 0;
          dt.table[5] = 32;
          for (i = 0; i < 32; ++i)
            dt.trans[i] = i;
        }
        var offs = new Uint16Array(16);
        function tinf_build_tree(t, lengths, off, num) {
          var i,
              sum;
          for (i = 0; i < 16; ++i)
            t.table[i] = 0;
          for (i = 0; i < num; ++i)
            t.table[lengths[off + i]]++;
          t.table[0] = 0;
          for (sum = 0, i = 0; i < 16; ++i) {
            offs[i] = sum;
            sum += t.table[i];
          }
          for (i = 0; i < num; ++i) {
            if (lengths[off + i])
              t.trans[offs[lengths[off + i]]++] = i;
          }
        }
        function tinf_getbit(d) {
          if (!d.bitcount--) {
            d.tag = d.source[d.sourceIndex++];
            d.bitcount = 7;
          }
          var bit = d.tag & 1;
          d.tag >>>= 1;
          return bit;
        }
        function tinf_read_bits(d, num, base) {
          if (!num)
            return base;
          while (d.bitcount < 24) {
            d.tag |= d.source[d.sourceIndex++] << d.bitcount;
            d.bitcount += 8;
          }
          var val = d.tag & (0xffff >>> (16 - num));
          d.tag >>>= num;
          d.bitcount -= num;
          return val + base;
        }
        function tinf_decode_symbol(d, t) {
          while (d.bitcount < 24) {
            d.tag |= d.source[d.sourceIndex++] << d.bitcount;
            d.bitcount += 8;
          }
          var sum = 0,
              cur = 0,
              len = 0;
          var tag = d.tag;
          do {
            cur = 2 * cur + (tag & 1);
            tag >>>= 1;
            ++len;
            sum += t.table[len];
            cur -= t.table[len];
          } while (cur >= 0);
          d.tag = tag;
          d.bitcount -= len;
          return t.trans[sum + cur];
        }
        function tinf_decode_trees(d, lt, dt) {
          var hlit,
              hdist,
              hclen;
          var i,
              num,
              length;
          hlit = tinf_read_bits(d, 5, 257);
          hdist = tinf_read_bits(d, 5, 1);
          hclen = tinf_read_bits(d, 4, 4);
          for (i = 0; i < 19; ++i)
            lengths[i] = 0;
          for (i = 0; i < hclen; ++i) {
            var clen = tinf_read_bits(d, 3, 0);
            lengths[clcidx[i]] = clen;
          }
          tinf_build_tree(code_tree, lengths, 0, 19);
          for (num = 0; num < hlit + hdist; ) {
            var sym = tinf_decode_symbol(d, code_tree);
            switch (sym) {
              case 16:
                var prev = lengths[num - 1];
                for (length = tinf_read_bits(d, 2, 3); length; --length) {
                  lengths[num++] = prev;
                }
                break;
              case 17:
                for (length = tinf_read_bits(d, 3, 3); length; --length) {
                  lengths[num++] = 0;
                }
                break;
              case 18:
                for (length = tinf_read_bits(d, 7, 11); length; --length) {
                  lengths[num++] = 0;
                }
                break;
              default:
                lengths[num++] = sym;
                break;
            }
          }
          tinf_build_tree(lt, lengths, 0, hlit);
          tinf_build_tree(dt, lengths, hlit, hdist);
        }
        function tinf_inflate_block_data(d, lt, dt) {
          while (1) {
            var sym = tinf_decode_symbol(d, lt);
            if (sym === 256) {
              return TINF_OK;
            }
            if (sym < 256) {
              d.dest[d.destLen++] = sym;
            } else {
              var length,
                  dist,
                  offs;
              var i;
              sym -= 257;
              length = tinf_read_bits(d, length_bits[sym], length_base[sym]);
              dist = tinf_decode_symbol(d, dt);
              offs = d.destLen - tinf_read_bits(d, dist_bits[dist], dist_base[dist]);
              for (i = offs; i < offs + length; ++i) {
                d.dest[d.destLen++] = d.dest[i];
              }
            }
          }
        }
        function tinf_inflate_uncompressed_block(d) {
          var length,
              invlength;
          var i;
          while (d.bitcount > 8) {
            d.sourceIndex--;
            d.bitcount -= 8;
          }
          length = d.source[d.sourceIndex + 1];
          length = 256 * length + d.source[d.sourceIndex];
          invlength = d.source[d.sourceIndex + 3];
          invlength = 256 * invlength + d.source[d.sourceIndex + 2];
          if (length !== (~invlength & 0x0000ffff))
            return TINF_DATA_ERROR;
          d.sourceIndex += 4;
          for (i = length; i; --i)
            d.dest[d.destLen++] = d.source[d.sourceIndex++];
          d.bitcount = 0;
          return TINF_OK;
        }
        function tinf_uncompress(source, dest) {
          var d = new Data(source, dest);
          var bfinal,
              btype,
              res;
          do {
            bfinal = tinf_getbit(d);
            btype = tinf_read_bits(d, 2, 0);
            switch (btype) {
              case 0:
                res = tinf_inflate_uncompressed_block(d);
                break;
              case 1:
                res = tinf_inflate_block_data(d, sltree, sdtree);
                break;
              case 2:
                tinf_decode_trees(d, d.ltree, d.dtree);
                res = tinf_inflate_block_data(d, d.ltree, d.dtree);
                break;
              default:
                res = TINF_DATA_ERROR;
            }
            if (res !== TINF_OK)
              throw new Error('Data error');
          } while (!bfinal);
          if (d.destLen < d.dest.length) {
            if (typeof d.dest.slice === 'function')
              return d.dest.slice(0, d.destLen);
            else
              return d.dest.subarray(0, d.destLen);
          }
          return d.dest;
        }
        tinf_build_fixed_trees(sltree, sdtree);
        tinf_build_bits_base(length_bits, length_base, 4, 3);
        tinf_build_bits_base(dist_bits, dist_base, 2, 1);
        length_bits[28] = 0;
        length_base[28] = 258;
        module.exports = tinf_uncompress;
      }, {}],
      2: [function(require, module, exports) {
        'use strict';
        function derive(v0, v1, v2, v3, t) {
          return Math.pow(1 - t, 3) * v0 + 3 * Math.pow(1 - t, 2) * t * v1 + 3 * (1 - t) * Math.pow(t, 2) * v2 + Math.pow(t, 3) * v3;
        }
        function BoundingBox() {
          this.x1 = Number.NaN;
          this.y1 = Number.NaN;
          this.x2 = Number.NaN;
          this.y2 = Number.NaN;
        }
        BoundingBox.prototype.isEmpty = function() {
          return isNaN(this.x1) || isNaN(this.y1) || isNaN(this.x2) || isNaN(this.y2);
        };
        BoundingBox.prototype.addPoint = function(x, y) {
          if (typeof x === 'number') {
            if (isNaN(this.x1) || isNaN(this.x2)) {
              this.x1 = x;
              this.x2 = x;
            }
            if (x < this.x1) {
              this.x1 = x;
            }
            if (x > this.x2) {
              this.x2 = x;
            }
          }
          if (typeof y === 'number') {
            if (isNaN(this.y1) || isNaN(this.y2)) {
              this.y1 = y;
              this.y2 = y;
            }
            if (y < this.y1) {
              this.y1 = y;
            }
            if (y > this.y2) {
              this.y2 = y;
            }
          }
        };
        BoundingBox.prototype.addX = function(x) {
          this.addPoint(x, null);
        };
        BoundingBox.prototype.addY = function(y) {
          this.addPoint(null, y);
        };
        BoundingBox.prototype.addBezier = function(x0, y0, x1, y1, x2, y2, x, y) {
          var p0 = [x0, y0];
          var p1 = [x1, y1];
          var p2 = [x2, y2];
          var p3 = [x, y];
          this.addPoint(x0, y0);
          this.addPoint(x, y);
          for (var i = 0; i <= 1; i++) {
            var b = 6 * p0[i] - 12 * p1[i] + 6 * p2[i];
            var a = -3 * p0[i] + 9 * p1[i] - 9 * p2[i] + 3 * p3[i];
            var c = 3 * p1[i] - 3 * p0[i];
            if (a === 0) {
              if (b === 0)
                continue;
              var t = -c / b;
              if (0 < t && t < 1) {
                if (i === 0)
                  this.addX(derive(p0[i], p1[i], p2[i], p3[i], t));
                if (i === 1)
                  this.addY(derive(p0[i], p1[i], p2[i], p3[i], t));
              }
              continue;
            }
            var b2ac = Math.pow(b, 2) - 4 * c * a;
            if (b2ac < 0)
              continue;
            var t1 = (-b + Math.sqrt(b2ac)) / (2 * a);
            if (0 < t1 && t1 < 1) {
              if (i === 0)
                this.addX(derive(p0[i], p1[i], p2[i], p3[i], t1));
              if (i === 1)
                this.addY(derive(p0[i], p1[i], p2[i], p3[i], t1));
            }
            var t2 = (-b - Math.sqrt(b2ac)) / (2 * a);
            if (0 < t2 && t2 < 1) {
              if (i === 0)
                this.addX(derive(p0[i], p1[i], p2[i], p3[i], t2));
              if (i === 1)
                this.addY(derive(p0[i], p1[i], p2[i], p3[i], t2));
            }
          }
        };
        BoundingBox.prototype.addQuad = function(x0, y0, x1, y1, x, y) {
          var cp1x = x0 + 2 / 3 * (x1 - x0);
          var cp1y = y0 + 2 / 3 * (y1 - y0);
          var cp2x = cp1x + 1 / 3 * (x - x0);
          var cp2y = cp1y + 1 / 3 * (y - y0);
          this.addBezier(x0, y0, cp1x, cp1y, cp2x, cp2y, x, y);
        };
        exports.BoundingBox = BoundingBox;
      }, {}],
      3: [function(require, module, exports) {
        'use strict';
        exports.fail = function(message) {
          throw new Error(message);
        };
        exports.argument = function(predicate, message) {
          if (!predicate) {
            exports.fail(message);
          }
        };
        exports.assert = exports.argument;
      }, {}],
      4: [function(require, module, exports) {
        'use strict';
        function line(ctx, x1, y1, x2, y2) {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        exports.line = line;
      }, {}],
      5: [function(require, module, exports) {
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
            } else if (font.glyphNames.names) {
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
      6: [function(require, module, exports) {
        'use strict';
        var path = require('./path');
        var sfnt = require('./tables/sfnt');
        var encoding = require('./encoding');
        var glyphset = require('./glyphset');
        var Substitution = require('./substitution');
        var util = require('./util');
        function Font(options) {
          options = options || {};
          if (!options.empty) {
            util.checkArgument(options.familyName, 'When creating a new Font object, familyName is required.');
            util.checkArgument(options.styleName, 'When creating a new Font object, styleName is required.');
            util.checkArgument(options.unitsPerEm, 'When creating a new Font object, unitsPerEm is required.');
            util.checkArgument(options.ascender, 'When creating a new Font object, ascender is required.');
            util.checkArgument(options.descender, 'When creating a new Font object, descender is required.');
            util.checkArgument(options.descender < 0, 'Descender should be negative (e.g. -512).');
            this.names = {
              fontFamily: {en: options.familyName || ' '},
              fontSubfamily: {en: options.styleName || ' '},
              fullName: {en: options.fullName || options.familyName + ' ' + options.styleName},
              postScriptName: {en: options.postScriptName || options.familyName + options.styleName},
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
            this.createdTimestamp = options.createdTimestamp;
            this.tables = {os2: {
                usWeightClass: options.weightClass || this.usWeightClasses.MEDIUM,
                usWidthClass: options.widthClass || this.usWidthClasses.MEDIUM,
                fsSelection: options.fsSelection || this.fsSelectionValues.REGULAR
              }};
          }
          this.supported = true;
          this.glyphs = new glyphset.GlyphSet(this, options.glyphs || []);
          this.encoding = new encoding.DefaultEncoding(this);
          this.substitution = new Substitution(this);
          this.tables = this.tables || {};
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
        Font.prototype.stringToGlyphs = function(s, options) {
          options = options || this.defaultRenderOptions;
          var i;
          var indexes = [];
          for (i = 0; i < s.length; i += 1) {
            var c = s[i];
            indexes.push(this.charToGlyphIndex(c));
          }
          var length = indexes.length;
          if (options.features) {
            var script = options.script || this.substitution.getDefaultScriptName();
            var manyToOne = [];
            if (options.features.liga)
              manyToOne = manyToOne.concat(this.substitution.getFeature('liga', script, options.language));
            if (options.features.rlig)
              manyToOne = manyToOne.concat(this.substitution.getFeature('rlig', script, options.language));
            for (i = 0; i < length; i += 1) {
              for (var j = 0; j < manyToOne.length; j++) {
                var ligature = manyToOne[j];
                var components = ligature.sub;
                var compCount = components.length;
                var k = 0;
                while (k < compCount && components[k] === indexes[i + k])
                  k++;
                if (k === compCount) {
                  indexes.splice(i, compCount, ligature.by);
                  length = length - compCount + 1;
                }
              }
            }
          }
          var glyphs = new Array(length);
          var notdef = this.glyphs.get(0);
          for (i = 0; i < length; i += 1) {
            glyphs[i] = this.glyphs.get(indexes[i]) || notdef;
          }
          return glyphs;
        };
        Font.prototype.nameToGlyphIndex = function(name) {
          return this.glyphNames.nameToGlyphIndex(name);
        };
        Font.prototype.nameToGlyph = function(name) {
          var glyphIndex = this.nameToGlyphIndex(name);
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
        Font.prototype.defaultRenderOptions = {
          kerning: true,
          features: {
            liga: true,
            rlig: true
          }
        };
        Font.prototype.forEachGlyph = function(text, x, y, fontSize, options, callback) {
          x = x !== undefined ? x : 0;
          y = y !== undefined ? y : 0;
          fontSize = fontSize !== undefined ? fontSize : 72;
          options = options || this.defaultRenderOptions;
          var fontScale = 1 / this.unitsPerEm * fontSize;
          var glyphs = this.stringToGlyphs(text, options);
          for (var i = 0; i < glyphs.length; i += 1) {
            var glyph = glyphs[i];
            callback(glyph, x, y, fontSize, options);
            if (glyph.advanceWidth) {
              x += glyph.advanceWidth * fontScale;
            }
            if (options.kerning && i < glyphs.length - 1) {
              var kerningValue = this.getKerningValue(glyph, glyphs[i + 1]);
              x += kerningValue * fontScale;
            }
            if (options.letterSpacing) {
              x += options.letterSpacing * fontSize;
            } else if (options.tracking) {
              x += (options.tracking / 1000) * fontSize;
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
        Font.prototype.getPaths = function(text, x, y, fontSize, options) {
          var glyphPaths = [];
          this.forEachGlyph(text, x, y, fontSize, options, function(glyph, gX, gY, gFontSize) {
            var glyphPath = glyph.getPath(gX, gY, gFontSize);
            glyphPaths.push(glyphPath);
          });
          return glyphPaths;
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
          console.warn('Font.toBuffer is deprecated. Use Font.toArrayBuffer instead.');
          return this.toArrayBuffer();
        };
        Font.prototype.toArrayBuffer = function() {
          var sfntTable = this.toTables();
          var bytes = sfntTable.encode();
          var buffer = new ArrayBuffer(bytes.length);
          var intArray = new Uint8Array(buffer);
          for (var i = 0; i < bytes.length; i++) {
            intArray[i] = bytes[i];
          }
          return buffer;
        };
        Font.prototype.download = function(fileName) {
          var familyName = this.getEnglishName('fontFamily');
          var styleName = this.getEnglishName('fontSubfamily');
          fileName = fileName || familyName.replace(/\s/g, '') + '-' + styleName + '.otf';
          var arrayBuffer = this.toArrayBuffer();
          if (util.isBrowser()) {
            window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
            window.requestFileSystem(window.TEMPORARY, arrayBuffer.byteLength, function(fs) {
              fs.root.getFile(fileName, {create: true}, function(fileEntry) {
                fileEntry.createWriter(function(writer) {
                  var dataView = new DataView(arrayBuffer);
                  var blob = new Blob([dataView], {type: 'font/opentype'});
                  writer.write(blob);
                  writer.addEventListener('writeend', function() {
                    location.href = fileEntry.toURL();
                  }, false);
                });
              });
            }, function(err) {
              throw new Error(err.name + ': ' + err.message);
            });
          } else {
            var fs = require('@empty');
            var buffer = util.arrayBufferToNodeBuffer(arrayBuffer);
            fs.writeFileSync(fileName, buffer);
          }
        };
        Font.prototype.fsSelectionValues = {
          ITALIC: 0x001,
          UNDERSCORE: 0x002,
          NEGATIVE: 0x004,
          OUTLINED: 0x008,
          STRIKEOUT: 0x010,
          BOLD: 0x020,
          REGULAR: 0x040,
          USER_TYPO_METRICS: 0x080,
          WWS: 0x100,
          OBLIQUE: 0x200
        };
        Font.prototype.usWidthClasses = {
          ULTRA_CONDENSED: 1,
          EXTRA_CONDENSED: 2,
          CONDENSED: 3,
          SEMI_CONDENSED: 4,
          MEDIUM: 5,
          SEMI_EXPANDED: 6,
          EXPANDED: 7,
          EXTRA_EXPANDED: 8,
          ULTRA_EXPANDED: 9
        };
        Font.prototype.usWeightClasses = {
          THIN: 100,
          EXTRA_LIGHT: 200,
          LIGHT: 300,
          NORMAL: 400,
          MEDIUM: 500,
          SEMI_BOLD: 600,
          BOLD: 700,
          EXTRA_BOLD: 800,
          BLACK: 900
        };
        exports.Font = Font;
      }, {
        "./encoding": 5,
        "./glyphset": 8,
        "./path": 12,
        "./substitution": 13,
        "./tables/sfnt": 32,
        "./util": 34,
        "fs": undefined
      }],
      7: [function(require, module, exports) {
        'use strict';
        var check = require('./check');
        var draw = require('./draw');
        var path = require('./path');
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
        Glyph.prototype.getBoundingBox = function() {
          return this.path.getBoundingBox();
        };
        Glyph.prototype.getPath = function(x, y, fontSize, options) {
          x = x !== undefined ? x : 0;
          y = y !== undefined ? y : 0;
          options = options !== undefined ? options : {
            xScale: 1.0,
            yScale: 1.0
          };
          fontSize = fontSize !== undefined ? fontSize : 72;
          var scale = 1 / this.path.unitsPerEm * fontSize;
          var xScale = options.xScale * scale;
          var yScale = options.yScale * scale;
          var p = new path.Path();
          var commands = this.path.commands;
          for (var i = 0; i < commands.length; i += 1) {
            var cmd = commands[i];
            if (cmd.type === 'M') {
              p.moveTo(x + (cmd.x * xScale), y + (-cmd.y * yScale));
            } else if (cmd.type === 'L') {
              p.lineTo(x + (cmd.x * xScale), y + (-cmd.y * yScale));
            } else if (cmd.type === 'Q') {
              p.quadraticCurveTo(x + (cmd.x1 * xScale), y + (-cmd.y1 * yScale), x + (cmd.x * xScale), y + (-cmd.y * yScale));
            } else if (cmd.type === 'C') {
              p.curveTo(x + (cmd.x1 * xScale), y + (-cmd.y1 * yScale), x + (cmd.x2 * xScale), y + (-cmd.y2 * yScale), x + (cmd.x * xScale), y + (-cmd.y * yScale));
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
            leftSideBearing: this.leftSideBearing
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
        Glyph.prototype.draw = function(ctx, x, y, fontSize, options) {
          this.getPath(x, y, fontSize, options).draw(ctx);
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
        "./check": 3,
        "./draw": 4,
        "./path": 12
      }],
      8: [function(require, module, exports) {
        'use strict';
        var _glyph = require('./glyph');
        function defineDependentProperty(glyph, externalName, internalName) {
          Object.defineProperty(glyph, externalName, {
            get: function() {
              glyph.path;
              return glyph[internalName];
            },
            set: function(newValue) {
              glyph[internalName] = newValue;
            },
            enumerable: true,
            configurable: true
          });
        }
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
            defineDependentProperty(glyph, 'xMin', '_xMin');
            defineDependentProperty(glyph, 'xMax', '_xMax');
            defineDependentProperty(glyph, 'yMin', '_yMin');
            defineDependentProperty(glyph, 'yMax', '_yMax');
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
      }, {"./glyph": 7}],
      9: [function(require, module, exports) {
        'use strict';
        var check = require('./check');
        function searchTag(arr, tag) {
          var imin = 0;
          var imax = arr.length - 1;
          while (imin <= imax) {
            var imid = (imin + imax) >>> 1;
            var val = arr[imid].tag;
            if (val === tag) {
              return imid;
            } else if (val < tag) {
              imin = imid + 1;
            } else {
              imax = imid - 1;
            }
          }
          return -imin - 1;
        }
        function binSearch(arr, value) {
          var imin = 0;
          var imax = arr.length - 1;
          while (imin <= imax) {
            var imid = (imin + imax) >>> 1;
            var val = arr[imid];
            if (val === value) {
              return imid;
            } else if (val < value) {
              imin = imid + 1;
            } else {
              imax = imid - 1;
            }
          }
          return -imin - 1;
        }
        function Layout(font, tableName) {
          this.font = font;
          this.tableName = tableName;
        }
        Layout.prototype = {
          searchTag: searchTag,
          binSearch: binSearch,
          getTable: function(create) {
            var layout = this.font.tables[this.tableName];
            if (!layout && create) {
              layout = this.font.tables[this.tableName] = this.createDefaultTable();
            }
            return layout;
          },
          getScriptNames: function() {
            var layout = this.getTable();
            if (!layout) {
              return [];
            }
            return layout.scripts.map(function(script) {
              return script.tag;
            });
          },
          getDefaultScriptName: function() {
            var layout = this.getTable();
            if (!layout) {
              return;
            }
            var hasLatn = false;
            for (var i = 0; i < layout.scripts.length; i++) {
              var name = layout.scripts[i].tag;
              if (name === 'DFLT')
                return name;
              if (name === 'latn')
                hasLatn = true;
            }
            if (hasLatn)
              return 'latn';
          },
          getScriptTable: function(script, create) {
            var layout = this.getTable(create);
            if (layout) {
              script = script || 'DFLT';
              var scripts = layout.scripts;
              var pos = searchTag(layout.scripts, script);
              if (pos >= 0) {
                return scripts[pos].script;
              } else if (create) {
                var scr = {
                  tag: script,
                  script: {
                    defaultLangSys: {
                      reserved: 0,
                      reqFeatureIndex: 0xffff,
                      featureIndexes: []
                    },
                    langSysRecords: []
                  }
                };
                scripts.splice(-1 - pos, 0, scr);
                return scr.script;
              }
            }
          },
          getLangSysTable: function(script, language, create) {
            var scriptTable = this.getScriptTable(script, create);
            if (scriptTable) {
              if (!language || language === 'dflt' || language === 'DFLT') {
                return scriptTable.defaultLangSys;
              }
              var pos = searchTag(scriptTable.langSysRecords, language);
              if (pos >= 0) {
                return scriptTable.langSysRecords[pos].langSys;
              } else if (create) {
                var langSysRecord = {
                  tag: language,
                  langSys: {
                    reserved: 0,
                    reqFeatureIndex: 0xffff,
                    featureIndexes: []
                  }
                };
                scriptTable.langSysRecords.splice(-1 - pos, 0, langSysRecord);
                return langSysRecord.langSys;
              }
            }
          },
          getFeatureTable: function(script, language, feature, create) {
            var langSysTable = this.getLangSysTable(script, language, create);
            if (langSysTable) {
              var featureRecord;
              var featIndexes = langSysTable.featureIndexes;
              var allFeatures = this.font.tables[this.tableName].features;
              for (var i = 0; i < featIndexes.length; i++) {
                featureRecord = allFeatures[featIndexes[i]];
                if (featureRecord.tag === feature) {
                  return featureRecord.feature;
                }
              }
              if (create) {
                var index = allFeatures.length;
                check.assert(index === 0 || feature >= allFeatures[index - 1].tag, 'Features must be added in alphabetical order.');
                featureRecord = {
                  tag: feature,
                  feature: {
                    params: 0,
                    lookupListIndexes: []
                  }
                };
                allFeatures.push(featureRecord);
                featIndexes.push(index);
                return featureRecord.feature;
              }
            }
          },
          getLookupTables: function(script, language, feature, lookupType, create) {
            var featureTable = this.getFeatureTable(script, language, feature, create);
            var tables = [];
            if (featureTable) {
              var lookupTable;
              var lookupListIndexes = featureTable.lookupListIndexes;
              var allLookups = this.font.tables[this.tableName].lookups;
              for (var i = 0; i < lookupListIndexes.length; i++) {
                lookupTable = allLookups[lookupListIndexes[i]];
                if (lookupTable.lookupType === lookupType) {
                  tables.push(lookupTable);
                }
              }
              if (tables.length === 0 && create) {
                lookupTable = {
                  lookupType: lookupType,
                  lookupFlag: 0,
                  subtables: [],
                  markFilteringSet: undefined
                };
                var index = allLookups.length;
                allLookups.push(lookupTable);
                lookupListIndexes.push(index);
                return [lookupTable];
              }
            }
            return tables;
          },
          expandCoverage: function(coverageTable) {
            if (coverageTable.format === 1) {
              return coverageTable.glyphs;
            } else {
              var glyphs = [];
              var ranges = coverageTable.ranges;
              for (var i = 0; i < ranges; i++) {
                var range = ranges[i];
                var start = range.start;
                var end = range.end;
                for (var j = start; j <= end; j++) {
                  glyphs.push(j);
                }
              }
              return glyphs;
            }
          }
        };
        module.exports = Layout;
      }, {"./check": 3}],
      10: [function(require, module, exports) {
        'use strict';
        var inflate = require('tiny-inflate');
        var encoding = require('./encoding');
        var _font = require('./font');
        var glyph = require('./glyph');
        var parse = require('./parse');
        var bbox = require('./bbox');
        var path = require('./path');
        var util = require('./util');
        var cmap = require('./tables/cmap');
        var cff = require('./tables/cff');
        var fvar = require('./tables/fvar');
        var glyf = require('./tables/glyf');
        var gpos = require('./tables/gpos');
        var gsub = require('./tables/gsub');
        var head = require('./tables/head');
        var hhea = require('./tables/hhea');
        var hmtx = require('./tables/hmtx');
        var kern = require('./tables/kern');
        var ltag = require('./tables/ltag');
        var loca = require('./tables/loca');
        var maxp = require('./tables/maxp');
        var _name = require('./tables/name');
        var os2 = require('./tables/os2');
        var post = require('./tables/post');
        var meta = require('./tables/meta');
        function loadFromFile(path, callback) {
          var fs = require('@empty');
          fs.readFile(path, function(err, buffer) {
            if (err) {
              return callback(err.message);
            }
            callback(null, util.nodeBufferToArrayBuffer(buffer));
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
        function parseOpenTypeTableEntries(data, numTables) {
          var tableEntries = [];
          var p = 12;
          for (var i = 0; i < numTables; i += 1) {
            var tag = parse.getTag(data, p);
            var checksum = parse.getULong(data, p + 4);
            var offset = parse.getULong(data, p + 8);
            var length = parse.getULong(data, p + 12);
            tableEntries.push({
              tag: tag,
              checksum: checksum,
              offset: offset,
              length: length,
              compression: false
            });
            p += 16;
          }
          return tableEntries;
        }
        function parseWOFFTableEntries(data, numTables) {
          var tableEntries = [];
          var p = 44;
          for (var i = 0; i < numTables; i += 1) {
            var tag = parse.getTag(data, p);
            var offset = parse.getULong(data, p + 4);
            var compLength = parse.getULong(data, p + 8);
            var origLength = parse.getULong(data, p + 12);
            var compression;
            if (compLength < origLength) {
              compression = 'WOFF';
            } else {
              compression = false;
            }
            tableEntries.push({
              tag: tag,
              offset: offset,
              compression: compression,
              compressedLength: compLength,
              originalLength: origLength
            });
            p += 20;
          }
          return tableEntries;
        }
        function uncompressTable(data, tableEntry) {
          if (tableEntry.compression === 'WOFF') {
            var inBuffer = new Uint8Array(data.buffer, tableEntry.offset + 2, tableEntry.compressedLength - 2);
            var outBuffer = new Uint8Array(tableEntry.originalLength);
            inflate(inBuffer, outBuffer);
            if (outBuffer.byteLength !== tableEntry.originalLength) {
              throw new Error('Decompression error: ' + tableEntry.tag + ' decompressed length doesn\'t match recorded length');
            }
            var view = new DataView(outBuffer.buffer, 0);
            return {
              data: view,
              offset: 0
            };
          } else {
            return {
              data: data,
              offset: tableEntry.offset
            };
          }
        }
        function parseBuffer(buffer) {
          var indexToLocFormat;
          var ltagTable;
          var font = new _font.Font({empty: true});
          var data = new DataView(buffer, 0);
          var numTables;
          var tableEntries = [];
          var signature = parse.getTag(data, 0);
          if (signature === String.fromCharCode(0, 1, 0, 0)) {
            font.outlinesFormat = 'truetype';
            numTables = parse.getUShort(data, 4);
            tableEntries = parseOpenTypeTableEntries(data, numTables);
          } else if (signature === 'OTTO') {
            font.outlinesFormat = 'cff';
            numTables = parse.getUShort(data, 4);
            tableEntries = parseOpenTypeTableEntries(data, numTables);
          } else if (signature === 'wOFF') {
            var flavor = parse.getTag(data, 4);
            if (flavor === String.fromCharCode(0, 1, 0, 0)) {
              font.outlinesFormat = 'truetype';
            } else if (flavor === 'OTTO') {
              font.outlinesFormat = 'cff';
            } else {
              throw new Error('Unsupported OpenType flavor ' + signature);
            }
            numTables = parse.getUShort(data, 12);
            tableEntries = parseWOFFTableEntries(data, numTables);
          } else {
            throw new Error('Unsupported OpenType signature ' + signature);
          }
          var cffTableEntry;
          var fvarTableEntry;
          var glyfTableEntry;
          var gposTableEntry;
          var gsubTableEntry;
          var hmtxTableEntry;
          var kernTableEntry;
          var locaTableEntry;
          var nameTableEntry;
          var metaTableEntry;
          for (var i = 0; i < numTables; i += 1) {
            var tableEntry = tableEntries[i];
            var table;
            switch (tableEntry.tag) {
              case 'cmap':
                table = uncompressTable(data, tableEntry);
                font.tables.cmap = cmap.parse(table.data, table.offset);
                font.encoding = new encoding.CmapEncoding(font.tables.cmap);
                break;
              case 'fvar':
                fvarTableEntry = tableEntry;
                break;
              case 'head':
                table = uncompressTable(data, tableEntry);
                font.tables.head = head.parse(table.data, table.offset);
                font.unitsPerEm = font.tables.head.unitsPerEm;
                indexToLocFormat = font.tables.head.indexToLocFormat;
                break;
              case 'hhea':
                table = uncompressTable(data, tableEntry);
                font.tables.hhea = hhea.parse(table.data, table.offset);
                font.ascender = font.tables.hhea.ascender;
                font.descender = font.tables.hhea.descender;
                font.numberOfHMetrics = font.tables.hhea.numberOfHMetrics;
                break;
              case 'hmtx':
                hmtxTableEntry = tableEntry;
                break;
              case 'ltag':
                table = uncompressTable(data, tableEntry);
                ltagTable = ltag.parse(table.data, table.offset);
                break;
              case 'maxp':
                table = uncompressTable(data, tableEntry);
                font.tables.maxp = maxp.parse(table.data, table.offset);
                font.numGlyphs = font.tables.maxp.numGlyphs;
                break;
              case 'name':
                nameTableEntry = tableEntry;
                break;
              case 'OS/2':
                table = uncompressTable(data, tableEntry);
                font.tables.os2 = os2.parse(table.data, table.offset);
                break;
              case 'post':
                table = uncompressTable(data, tableEntry);
                font.tables.post = post.parse(table.data, table.offset);
                font.glyphNames = new encoding.GlyphNames(font.tables.post);
                break;
              case 'glyf':
                glyfTableEntry = tableEntry;
                break;
              case 'loca':
                locaTableEntry = tableEntry;
                break;
              case 'CFF ':
                cffTableEntry = tableEntry;
                break;
              case 'kern':
                kernTableEntry = tableEntry;
                break;
              case 'GPOS':
                gposTableEntry = tableEntry;
                break;
              case 'GSUB':
                gsubTableEntry = tableEntry;
                break;
              case 'meta':
                metaTableEntry = tableEntry;
                break;
            }
          }
          var nameTable = uncompressTable(data, nameTableEntry);
          font.tables.name = _name.parse(nameTable.data, nameTable.offset, ltagTable);
          font.names = font.tables.name;
          if (glyfTableEntry && locaTableEntry) {
            var shortVersion = indexToLocFormat === 0;
            var locaTable = uncompressTable(data, locaTableEntry);
            var locaOffsets = loca.parse(locaTable.data, locaTable.offset, font.numGlyphs, shortVersion);
            var glyfTable = uncompressTable(data, glyfTableEntry);
            font.glyphs = glyf.parse(glyfTable.data, glyfTable.offset, locaOffsets, font);
          } else if (cffTableEntry) {
            var cffTable = uncompressTable(data, cffTableEntry);
            cff.parse(cffTable.data, cffTable.offset, font);
          } else {
            throw new Error('Font doesn\'t contain TrueType or CFF outlines.');
          }
          var hmtxTable = uncompressTable(data, hmtxTableEntry);
          hmtx.parse(hmtxTable.data, hmtxTable.offset, font.numberOfHMetrics, font.numGlyphs, font.glyphs);
          encoding.addGlyphNames(font);
          if (kernTableEntry) {
            var kernTable = uncompressTable(data, kernTableEntry);
            font.kerningPairs = kern.parse(kernTable.data, kernTable.offset);
          } else {
            font.kerningPairs = {};
          }
          if (gposTableEntry) {
            var gposTable = uncompressTable(data, gposTableEntry);
            gpos.parse(gposTable.data, gposTable.offset, font);
          }
          if (gsubTableEntry) {
            var gsubTable = uncompressTable(data, gsubTableEntry);
            font.tables.gsub = gsub.parse(gsubTable.data, gsubTable.offset);
          }
          if (fvarTableEntry) {
            var fvarTable = uncompressTable(data, fvarTableEntry);
            font.tables.fvar = fvar.parse(fvarTable.data, fvarTable.offset, font.names);
          }
          if (metaTableEntry) {
            var metaTable = uncompressTable(data, metaTableEntry);
            font.tables.meta = meta.parse(metaTable.data, metaTable.offset);
            font.metas = font.tables.meta;
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
            var font;
            try {
              font = parseBuffer(arrayBuffer);
            } catch (e) {
              return callback(e, null);
            }
            return callback(null, font);
          });
        }
        function loadSync(url) {
          var fs = require('@empty');
          var buffer = fs.readFileSync(url);
          return parseBuffer(util.nodeBufferToArrayBuffer(buffer));
        }
        exports._parse = parse;
        exports.Font = _font.Font;
        exports.Glyph = glyph.Glyph;
        exports.Path = path.Path;
        exports.BoundingBox = bbox.BoundingBox;
        exports.parse = parseBuffer;
        exports.load = load;
        exports.loadSync = loadSync;
      }, {
        "./bbox": 2,
        "./encoding": 5,
        "./font": 6,
        "./glyph": 7,
        "./parse": 11,
        "./path": 12,
        "./tables/cff": 15,
        "./tables/cmap": 16,
        "./tables/fvar": 17,
        "./tables/glyf": 18,
        "./tables/gpos": 19,
        "./tables/gsub": 20,
        "./tables/head": 21,
        "./tables/hhea": 22,
        "./tables/hmtx": 23,
        "./tables/kern": 24,
        "./tables/loca": 25,
        "./tables/ltag": 26,
        "./tables/maxp": 27,
        "./tables/meta": 28,
        "./tables/name": 29,
        "./tables/os2": 30,
        "./tables/post": 31,
        "./util": 34,
        "fs": undefined,
        "tiny-inflate": 1
      }],
      11: [function(require, module, exports) {
        'use strict';
        var check = require('./check');
        exports.getByte = function getByte(dataView, offset) {
          return dataView.getUint8(offset);
        };
        exports.getCard8 = exports.getByte;
        function getUShort(dataView, offset) {
          return dataView.getUint16(offset, false);
        }
        exports.getUShort = exports.getCard16 = getUShort;
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
          v -= 2082844800;
          this.relativeOffset += 8;
          return v;
        };
        Parser.prototype.parseVersion = function() {
          var major = getUShort(this.data, this.offset + this.relativeOffset);
          var minor = getUShort(this.data, this.offset + this.relativeOffset + 2);
          this.relativeOffset += 4;
          return major + minor / 0x1000 / 10;
        };
        Parser.prototype.skip = function(type, amount) {
          if (amount === undefined) {
            amount = 1;
          }
          this.relativeOffset += typeOffsets[type] * amount;
        };
        Parser.prototype.parseOffset16List = Parser.prototype.parseUShortList = function(count) {
          if (count === undefined) {
            count = this.parseUShort();
          }
          var offsets = new Array(count);
          var dataView = this.data;
          var offset = this.offset + this.relativeOffset;
          for (var i = 0; i < count; i++) {
            offsets[i] = dataView.getUint16(offset);
            offset += 2;
          }
          this.relativeOffset += count * 2;
          return offsets;
        };
        Parser.prototype.parseList = function(count, itemCallback) {
          if (!itemCallback) {
            itemCallback = count;
            count = this.parseUShort();
          }
          var list = new Array(count);
          for (var i = 0; i < count; i++) {
            list[i] = itemCallback.call(this);
          }
          return list;
        };
        Parser.prototype.parseRecordList = function(count, recordDescription) {
          if (!recordDescription) {
            recordDescription = count;
            count = this.parseUShort();
          }
          var records = new Array(count);
          var fields = Object.keys(recordDescription);
          for (var i = 0; i < count; i++) {
            var rec = {};
            for (var j = 0; j < fields.length; j++) {
              var fieldName = fields[j];
              var fieldType = recordDescription[fieldName];
              rec[fieldName] = fieldType.call(this);
            }
            records[i] = rec;
          }
          return records;
        };
        Parser.prototype.parseStruct = function(description) {
          if (typeof description === 'function') {
            return description.call(this);
          } else {
            var fields = Object.keys(description);
            var struct = {};
            for (var j = 0; j < fields.length; j++) {
              var fieldName = fields[j];
              var fieldType = description[fieldName];
              struct[fieldName] = fieldType.call(this);
            }
            return struct;
          }
        };
        Parser.prototype.parsePointer = function(description) {
          var structOffset = this.parseOffset16();
          if (structOffset > 0) {
            return new Parser(this.data, this.offset + structOffset).parseStruct(description);
          }
        };
        Parser.prototype.parseListOfLists = function(itemCallback) {
          var offsets = this.parseOffset16List();
          var count = offsets.length;
          var relativeOffset = this.relativeOffset;
          var list = new Array(count);
          for (var i = 0; i < count; i++) {
            var start = offsets[i];
            if (start === 0) {
              list[i] = undefined;
              continue;
            }
            this.relativeOffset = start;
            if (itemCallback) {
              var subOffsets = this.parseOffset16List();
              var subList = new Array(subOffsets.length);
              for (var j = 0; j < subOffsets.length; j++) {
                this.relativeOffset = start + subOffsets[j];
                subList[j] = itemCallback.call(this);
              }
              list[i] = subList;
            } else {
              list[i] = this.parseUShortList();
            }
          }
          this.relativeOffset = relativeOffset;
          return list;
        };
        Parser.prototype.parseCoverage = function() {
          var startOffset = this.offset + this.relativeOffset;
          var format = this.parseUShort();
          var count = this.parseUShort();
          if (format === 1) {
            return {
              format: 1,
              glyphs: this.parseUShortList(count)
            };
          } else if (format === 2) {
            var ranges = new Array(count);
            for (var i = 0; i < count; i++) {
              ranges[i] = {
                start: this.parseUShort(),
                end: this.parseUShort(),
                index: this.parseUShort()
              };
            }
            return {
              format: 2,
              ranges: ranges
            };
          }
          check.assert(false, '0x' + startOffset.toString(16) + ': Coverage format must be 1 or 2.');
        };
        Parser.prototype.parseClassDef = function() {
          var startOffset = this.offset + this.relativeOffset;
          var format = this.parseUShort();
          if (format === 1) {
            return {
              format: 1,
              startGlyph: this.parseUShort(),
              classes: this.parseUShortList()
            };
          } else if (format === 2) {
            return {
              format: 2,
              ranges: this.parseRecordList({
                start: Parser.uShort,
                end: Parser.uShort,
                classId: Parser.uShort
              })
            };
          }
          check.assert(false, '0x' + startOffset.toString(16) + ': ClassDef format must be 1 or 2.');
        };
        Parser.list = function(count, itemCallback) {
          return function() {
            return this.parseList(count, itemCallback);
          };
        };
        Parser.recordList = function(count, recordDescription) {
          return function() {
            return this.parseRecordList(count, recordDescription);
          };
        };
        Parser.pointer = function(description) {
          return function() {
            return this.parsePointer(description);
          };
        };
        Parser.tag = Parser.prototype.parseTag;
        Parser.byte = Parser.prototype.parseByte;
        Parser.uShort = Parser.offset16 = Parser.prototype.parseUShort;
        Parser.uShortList = Parser.prototype.parseUShortList;
        Parser.struct = Parser.prototype.parseStruct;
        Parser.coverage = Parser.prototype.parseCoverage;
        Parser.classDef = Parser.prototype.parseClassDef;
        var langSysTable = {
          reserved: Parser.uShort,
          reqFeatureIndex: Parser.uShort,
          featureIndexes: Parser.uShortList
        };
        Parser.prototype.parseScriptList = function() {
          return this.parsePointer(Parser.recordList({
            tag: Parser.tag,
            script: Parser.pointer({
              defaultLangSys: Parser.pointer(langSysTable),
              langSysRecords: Parser.recordList({
                tag: Parser.tag,
                langSys: Parser.pointer(langSysTable)
              })
            })
          }));
        };
        Parser.prototype.parseFeatureList = function() {
          return this.parsePointer(Parser.recordList({
            tag: Parser.tag,
            feature: Parser.pointer({
              featureParams: Parser.offset16,
              lookupListIndexes: Parser.uShortList
            })
          }));
        };
        Parser.prototype.parseLookupList = function(lookupTableParsers) {
          return this.parsePointer(Parser.list(Parser.pointer(function() {
            var lookupType = this.parseUShort();
            check.argument(1 <= lookupType && lookupType <= 8, 'GSUB lookup type ' + lookupType + ' unknown.');
            var lookupFlag = this.parseUShort();
            var useMarkFilteringSet = lookupFlag & 0x10;
            return {
              lookupType: lookupType,
              lookupFlag: lookupFlag,
              subtables: this.parseList(Parser.pointer(lookupTableParsers[lookupType])),
              markFilteringSet: useMarkFilteringSet ? this.parseUShort() : undefined
            };
          })));
        };
        exports.Parser = Parser;
      }, {"./check": 3}],
      12: [function(require, module, exports) {
        'use strict';
        var bbox = require('./bbox');
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
          } else if (pathOrCommands instanceof bbox.BoundingBox) {
            var box = pathOrCommands;
            this.moveTo(box.x1, box.y1);
            this.lineTo(box.x2, box.y1);
            this.lineTo(box.x2, box.y2);
            this.lineTo(box.x1, box.y2);
            this.close();
            return;
          }
          Array.prototype.push.apply(this.commands, pathOrCommands);
        };
        Path.prototype.getBoundingBox = function() {
          var box = new bbox.BoundingBox();
          var startX = 0;
          var startY = 0;
          var prevX = 0;
          var prevY = 0;
          for (var i = 0; i < this.commands.length; i++) {
            var cmd = this.commands[i];
            switch (cmd.type) {
              case 'M':
                box.addPoint(cmd.x, cmd.y);
                startX = prevX = cmd.x;
                startY = prevY = cmd.y;
                break;
              case 'L':
                box.addPoint(cmd.x, cmd.y);
                prevX = cmd.x;
                prevY = cmd.y;
                break;
              case 'Q':
                box.addQuad(prevX, prevY, cmd.x1, cmd.y1, cmd.x, cmd.y);
                prevX = cmd.x;
                prevY = cmd.y;
                break;
              case 'C':
                box.addBezier(prevX, prevY, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
                prevX = cmd.x;
                prevY = cmd.y;
                break;
              case 'Z':
                prevX = startX;
                prevY = startY;
                break;
              default:
                throw new Error('Unexpected path commmand ' + cmd.type);
            }
          }
          if (box.isEmpty()) {
            box.addPoint(0, 0);
          }
          return box;
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
          if (this.fill && this.fill !== 'black') {
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
        Path.prototype.toDOMElement = function(decimalPlaces) {
          var temporaryPath = this.toPathData(decimalPlaces);
          var newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          newPath.setAttribute('d', temporaryPath);
          return newPath;
        };
        exports.Path = Path;
      }, {"./bbox": 2}],
      13: [function(require, module, exports) {
        'use strict';
        var check = require('./check');
        var Layout = require('./layout');
        var Substitution = function(font) {
          Layout.call(this, font, 'gsub');
        };
        function arraysEqual(ar1, ar2) {
          var n = ar1.length;
          if (n !== ar2.length) {
            return false;
          }
          for (var i = 0; i < n; i++) {
            if (ar1[i] !== ar2[i]) {
              return false;
            }
          }
          return true;
        }
        function getSubstFormat(lookupTable, format, defaultSubtable) {
          var subtables = lookupTable.subtables;
          for (var i = 0; i < subtables.length; i++) {
            var subtable = subtables[i];
            if (subtable.substFormat === format) {
              return subtable;
            }
          }
          if (defaultSubtable) {
            subtables.push(defaultSubtable);
            return defaultSubtable;
          }
        }
        Substitution.prototype = Layout.prototype;
        Substitution.prototype.createDefaultTable = function() {
          return {
            version: 1,
            scripts: [{
              tag: 'DFLT',
              script: {
                defaultLangSys: {
                  reserved: 0,
                  reqFeatureIndex: 0xffff,
                  featureIndexes: []
                },
                langSysRecords: []
              }
            }],
            features: [],
            lookups: []
          };
        };
        Substitution.prototype.getSingle = function(feature, script, language) {
          var substitutions = [];
          var lookupTables = this.getLookupTables(script, language, feature, 1);
          for (var idx = 0; idx < lookupTables.length; idx++) {
            var subtables = lookupTables[idx].subtables;
            for (var i = 0; i < subtables.length; i++) {
              var subtable = subtables[i];
              var glyphs = this.expandCoverage(subtable.coverage);
              var j;
              if (subtable.substFormat === 1) {
                var delta = subtable.deltaGlyphId;
                for (j = 0; j < glyphs.length; j++) {
                  var glyph = glyphs[j];
                  substitutions.push({
                    sub: glyph,
                    by: glyph + delta
                  });
                }
              } else {
                var substitute = subtable.substitute;
                for (j = 0; j < glyphs.length; j++) {
                  substitutions.push({
                    sub: glyphs[j],
                    by: substitute[j]
                  });
                }
              }
            }
          }
          return substitutions;
        };
        Substitution.prototype.getAlternates = function(feature, script, language) {
          var alternates = [];
          var lookupTables = this.getLookupTables(script, language, feature, 3);
          for (var idx = 0; idx < lookupTables.length; idx++) {
            var subtables = lookupTables[idx].subtables;
            for (var i = 0; i < subtables.length; i++) {
              var subtable = subtables[i];
              var glyphs = this.expandCoverage(subtable.coverage);
              var alternateSets = subtable.alternateSets;
              for (var j = 0; j < glyphs.length; j++) {
                alternates.push({
                  sub: glyphs[j],
                  by: alternateSets[j]
                });
              }
            }
          }
          return alternates;
        };
        Substitution.prototype.getLigatures = function(feature, script, language) {
          var ligatures = [];
          var lookupTables = this.getLookupTables(script, language, feature, 4);
          for (var idx = 0; idx < lookupTables.length; idx++) {
            var subtables = lookupTables[idx].subtables;
            for (var i = 0; i < subtables.length; i++) {
              var subtable = subtables[i];
              var glyphs = this.expandCoverage(subtable.coverage);
              var ligatureSets = subtable.ligatureSets;
              for (var j = 0; j < glyphs.length; j++) {
                var startGlyph = glyphs[j];
                var ligSet = ligatureSets[j];
                for (var k = 0; k < ligSet.length; k++) {
                  var lig = ligSet[k];
                  ligatures.push({
                    sub: [startGlyph].concat(lig.components),
                    by: lig.ligGlyph
                  });
                }
              }
            }
          }
          return ligatures;
        };
        Substitution.prototype.addSingle = function(feature, substitution, script, language) {
          var lookupTable = this.getLookupTables(script, language, feature, 1, true)[0];
          var subtable = getSubstFormat(lookupTable, 2, {
            substFormat: 2,
            coverage: {
              format: 1,
              glyphs: []
            },
            substitute: []
          });
          check.assert(subtable.coverage.format === 1, 'Ligature: unable to modify coverage table format ' + subtable.coverage.format);
          var coverageGlyph = substitution.sub;
          var pos = this.binSearch(subtable.coverage.glyphs, coverageGlyph);
          if (pos < 0) {
            pos = -1 - pos;
            subtable.coverage.glyphs.splice(pos, 0, coverageGlyph);
            subtable.substitute.splice(pos, 0, 0);
          }
          subtable.substitute[pos] = substitution.by;
        };
        Substitution.prototype.addAlternate = function(feature, substitution, script, language) {
          var lookupTable = this.getLookupTables(script, language, feature, 3, true)[0];
          var subtable = getSubstFormat(lookupTable, 1, {
            substFormat: 1,
            coverage: {
              format: 1,
              glyphs: []
            },
            alternateSets: []
          });
          check.assert(subtable.coverage.format === 1, 'Ligature: unable to modify coverage table format ' + subtable.coverage.format);
          var coverageGlyph = substitution.sub;
          var pos = this.binSearch(subtable.coverage.glyphs, coverageGlyph);
          if (pos < 0) {
            pos = -1 - pos;
            subtable.coverage.glyphs.splice(pos, 0, coverageGlyph);
            subtable.alternateSets.splice(pos, 0, 0);
          }
          subtable.alternateSets[pos] = substitution.by;
        };
        Substitution.prototype.addLigature = function(feature, ligature, script, language) {
          var lookupTable = this.getLookupTables(script, language, feature, 4, true)[0];
          var subtable = lookupTable.subtables[0];
          if (!subtable) {
            subtable = {
              substFormat: 1,
              coverage: {
                format: 1,
                glyphs: []
              },
              ligatureSets: []
            };
            lookupTable.subtables[0] = subtable;
          }
          check.assert(subtable.coverage.format === 1, 'Ligature: unable to modify coverage table format ' + subtable.coverage.format);
          var coverageGlyph = ligature.sub[0];
          var ligComponents = ligature.sub.slice(1);
          var ligatureTable = {
            ligGlyph: ligature.by,
            components: ligComponents
          };
          var pos = this.binSearch(subtable.coverage.glyphs, coverageGlyph);
          if (pos >= 0) {
            var ligatureSet = subtable.ligatureSets[pos];
            for (var i = 0; i < ligatureSet.length; i++) {
              if (arraysEqual(ligatureSet[i].components, ligComponents)) {
                return;
              }
            }
            ligatureSet.push(ligatureTable);
          } else {
            pos = -1 - pos;
            subtable.coverage.glyphs.splice(pos, 0, coverageGlyph);
            subtable.ligatureSets.splice(pos, 0, [ligatureTable]);
          }
        };
        Substitution.prototype.getFeature = function(feature, script, language) {
          if (/ss\d\d/.test(feature)) {
            return this.getSingle(feature, script, language);
          }
          switch (feature) {
            case 'aalt':
            case 'salt':
              return this.getSingle(feature, script, language).concat(this.getAlternates(feature, script, language));
            case 'dlig':
            case 'liga':
            case 'rlig':
              return this.getLigatures(feature, script, language);
          }
        };
        Substitution.prototype.add = function(feature, sub, script, language) {
          if (/ss\d\d/.test(feature)) {
            return this.addSingle(feature, sub, script, language);
          }
          switch (feature) {
            case 'aalt':
            case 'salt':
              if (typeof sub.by === 'number') {
                return this.addSingle(feature, sub, script, language);
              }
              return this.addAlternate(feature, sub, script, language);
            case 'dlig':
            case 'liga':
            case 'rlig':
              return this.addLigature(feature, sub, script, language);
          }
        };
        module.exports = Substitution;
      }, {
        "./check": 3,
        "./layout": 9
      }],
      14: [function(require, module, exports) {
        'use strict';
        var check = require('./check');
        var encode = require('./types').encode;
        var sizeOf = require('./types').sizeOf;
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
        Table.prototype.encode = function() {
          return encode.TABLE(this);
        };
        Table.prototype.sizeOf = function() {
          return sizeOf.TABLE(this);
        };
        function ushortList(itemName, list, count) {
          if (count === undefined) {
            count = list.length;
          }
          var fields = new Array(list.length + 1);
          fields[0] = {
            name: itemName + 'Count',
            type: 'USHORT',
            value: count
          };
          for (var i = 0; i < list.length; i++) {
            fields[i + 1] = {
              name: itemName + i,
              type: 'USHORT',
              value: list[i]
            };
          }
          return fields;
        }
        function tableList(itemName, records, itemCallback) {
          var count = records.length;
          var fields = new Array(count + 1);
          fields[0] = {
            name: itemName + 'Count',
            type: 'USHORT',
            value: count
          };
          for (var i = 0; i < count; i++) {
            fields[i + 1] = {
              name: itemName + i,
              type: 'TABLE',
              value: itemCallback(records[i], i)
            };
          }
          return fields;
        }
        function recordList(itemName, records, itemCallback) {
          var count = records.length;
          var fields = [];
          fields[0] = {
            name: itemName + 'Count',
            type: 'USHORT',
            value: count
          };
          for (var i = 0; i < count; i++) {
            fields = fields.concat(itemCallback(records[i], i));
          }
          return fields;
        }
        function Coverage(coverageTable) {
          if (coverageTable.format === 1) {
            Table.call(this, 'coverageTable', [{
              name: 'coverageFormat',
              type: 'USHORT',
              value: 1
            }].concat(ushortList('glyph', coverageTable.glyphs)));
          } else {
            check.assert(false, 'Can\'t create coverage table format 2 yet.');
          }
        }
        Coverage.prototype = Object.create(Table.prototype);
        Coverage.prototype.constructor = Coverage;
        function ScriptList(scriptListTable) {
          Table.call(this, 'scriptListTable', recordList('scriptRecord', scriptListTable, function(scriptRecord, i) {
            var script = scriptRecord.script;
            var defaultLangSys = script.defaultLangSys;
            check.assert(!!defaultLangSys, 'Unable to write GSUB: script ' + scriptRecord.tag + ' has no default language system.');
            return [{
              name: 'scriptTag' + i,
              type: 'TAG',
              value: scriptRecord.tag
            }, {
              name: 'script' + i,
              type: 'TABLE',
              value: new Table('scriptTable', [{
                name: 'defaultLangSys',
                type: 'TABLE',
                value: new Table('defaultLangSys', [{
                  name: 'lookupOrder',
                  type: 'USHORT',
                  value: 0
                }, {
                  name: 'reqFeatureIndex',
                  type: 'USHORT',
                  value: defaultLangSys.reqFeatureIndex
                }].concat(ushortList('featureIndex', defaultLangSys.featureIndexes)))
              }].concat(recordList('langSys', script.langSysRecords, function(langSysRecord, i) {
                var langSys = langSysRecord.langSys;
                return [{
                  name: 'langSysTag' + i,
                  type: 'TAG',
                  value: langSysRecord.tag
                }, {
                  name: 'langSys' + i,
                  type: 'TABLE',
                  value: new Table('langSys', [{
                    name: 'lookupOrder',
                    type: 'USHORT',
                    value: 0
                  }, {
                    name: 'reqFeatureIndex',
                    type: 'USHORT',
                    value: langSys.reqFeatureIndex
                  }].concat(ushortList('featureIndex', langSys.featureIndexes)))
                }];
              })))
            }];
          }));
        }
        ScriptList.prototype = Object.create(Table.prototype);
        ScriptList.prototype.constructor = ScriptList;
        function FeatureList(featureListTable) {
          Table.call(this, 'featureListTable', recordList('featureRecord', featureListTable, function(featureRecord, i) {
            var feature = featureRecord.feature;
            return [{
              name: 'featureTag' + i,
              type: 'TAG',
              value: featureRecord.tag
            }, {
              name: 'feature' + i,
              type: 'TABLE',
              value: new Table('featureTable', [{
                name: 'featureParams',
                type: 'USHORT',
                value: feature.featureParams
              }].concat(ushortList('lookupListIndex', feature.lookupListIndexes)))
            }];
          }));
        }
        FeatureList.prototype = Object.create(Table.prototype);
        FeatureList.prototype.constructor = FeatureList;
        function LookupList(lookupListTable, subtableMakers) {
          Table.call(this, 'lookupListTable', tableList('lookup', lookupListTable, function(lookupTable) {
            var subtableCallback = subtableMakers[lookupTable.lookupType];
            check.assert(!!subtableCallback, 'Unable to write GSUB lookup type ' + lookupTable.lookupType + ' tables.');
            return new Table('lookupTable', [{
              name: 'lookupType',
              type: 'USHORT',
              value: lookupTable.lookupType
            }, {
              name: 'lookupFlag',
              type: 'USHORT',
              value: lookupTable.lookupFlag
            }].concat(tableList('subtable', lookupTable.subtables, subtableCallback)));
          }));
        }
        LookupList.prototype = Object.create(Table.prototype);
        LookupList.prototype.constructor = LookupList;
        exports.Record = exports.Table = Table;
        exports.Coverage = Coverage;
        exports.ScriptList = ScriptList;
        exports.FeatureList = FeatureList;
        exports.LookupList = LookupList;
        exports.ushortList = ushortList;
        exports.tableList = tableList;
        exports.recordList = recordList;
      }, {
        "./check": 3,
        "./types": 33
      }],
      15: [function(require, module, exports) {
        'use strict';
        var encoding = require('../encoding');
        var glyphset = require('../glyphset');
        var parse = require('../parse');
        var path = require('../path');
        var table = require('../table');
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
          return new table.Record('Header', [{
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
          var t = new table.Record('Name INDEX', [{
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
          var t = new table.Record('Top DICT', [{
            name: 'dict',
            type: 'DICT',
            value: {}
          }]);
          t.dict = makeDict(TOP_DICT_META, attrs, strings);
          return t;
        }
        function makeTopDictIndex(topDict) {
          var t = new table.Record('Top DICT INDEX', [{
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
          var t = new table.Record('String INDEX', [{
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
          return new table.Record('Global Subr INDEX', [{
            name: 'subrs',
            type: 'INDEX',
            value: []
          }]);
        }
        function makeCharsets(glyphNames, strings) {
          var t = new table.Record('Charsets', [{
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
          var t = new table.Record('CharStrings INDEX', [{
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
          var t = new table.Record('Private DICT', [{
            name: 'dict',
            type: 'DICT',
            value: {}
          }]);
          t.dict = makeDict(PRIVATE_DICT_META, attrs, strings);
          return t;
        }
        function makeCFFTable(glyphs, options) {
          var t = new table.Table('CFF ', [{
            name: 'header',
            type: 'RECORD'
          }, {
            name: 'nameIndex',
            type: 'RECORD'
          }, {
            name: 'topDictIndex',
            type: 'RECORD'
          }, {
            name: 'stringIndex',
            type: 'RECORD'
          }, {
            name: 'globalSubrIndex',
            type: 'RECORD'
          }, {
            name: 'charsets',
            type: 'RECORD'
          }, {
            name: 'charStringsIndex',
            type: 'RECORD'
          }, {
            name: 'privateDict',
            type: 'RECORD'
          }]);
          var fontScale = 1 / options.unitsPerEm;
          var attrs = {
            version: options.version,
            fullName: options.fullName,
            familyName: options.familyName,
            weight: options.weightName,
            fontBBox: options.fontBBox || [0, 0, 0, 0],
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
          t.privateDict = makePrivateDict(privateAttrs, strings);
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
        "../encoding": 5,
        "../glyphset": 8,
        "../parse": 11,
        "../path": 12,
        "../table": 14
      }],
      16: [function(require, module, exports) {
        'use strict';
        var check = require('../check');
        var parse = require('../parse');
        var table = require('../table');
        function parseCmapTableFormat12(cmap, p) {
          var i;
          p.parseUShort();
          cmap.length = p.parseULong();
          cmap.language = p.parseULong();
          var groupCount;
          cmap.groupCount = groupCount = p.parseULong();
          cmap.glyphIndexMap = {};
          for (i = 0; i < groupCount; i += 1) {
            var startCharCode = p.parseULong();
            var endCharCode = p.parseULong();
            var startGlyphId = p.parseULong();
            for (var c = startCharCode; c <= endCharCode; c += 1) {
              cmap.glyphIndexMap[c] = startGlyphId;
              startGlyphId++;
            }
          }
        }
        function parseCmapTableFormat4(cmap, p, data, start, offset) {
          var i;
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
        }
        function parseCmapTable(data, start) {
          var i;
          var cmap = {};
          cmap.version = parse.getUShort(data, start);
          check.argument(cmap.version === 0, 'cmap table version should be 0.');
          cmap.numTables = parse.getUShort(data, start + 2);
          var offset = -1;
          for (i = cmap.numTables - 1; i >= 0; i -= 1) {
            var platformId = parse.getUShort(data, start + 4 + (i * 8));
            var encodingId = parse.getUShort(data, start + 4 + (i * 8) + 2);
            if (platformId === 3 && (encodingId === 0 || encodingId === 1 || encodingId === 10)) {
              offset = parse.getULong(data, start + 4 + (i * 8) + 4);
              break;
            }
          }
          if (offset === -1) {
            return null;
          }
          var p = new parse.Parser(data, start + offset);
          cmap.format = p.parseUShort();
          if (cmap.format === 12) {
            parseCmapTableFormat12(cmap, p);
          } else if (cmap.format === 4) {
            parseCmapTableFormat4(cmap, p, data, start, offset);
          } else {
            throw new Error('Only format 4 and 12 cmap tables are supported.');
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
        "../check": 3,
        "../parse": 11,
        "../table": 14
      }],
      17: [function(require, module, exports) {
        'use strict';
        var check = require('../check');
        var parse = require('../parse');
        var table = require('../table');
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
        function makeFvarAxis(n, axis, names) {
          var nameID = addName(axis.name, names);
          return [{
            name: 'tag_' + n,
            type: 'TAG',
            value: axis.tag
          }, {
            name: 'minValue_' + n,
            type: 'FIXED',
            value: axis.minValue << 16
          }, {
            name: 'defaultValue_' + n,
            type: 'FIXED',
            value: axis.defaultValue << 16
          }, {
            name: 'maxValue_' + n,
            type: 'FIXED',
            value: axis.maxValue << 16
          }, {
            name: 'flags_' + n,
            type: 'USHORT',
            value: 0
          }, {
            name: 'nameID_' + n,
            type: 'USHORT',
            value: nameID
          }];
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
        function makeFvarInstance(n, inst, axes, names) {
          var nameID = addName(inst.name, names);
          var fields = [{
            name: 'nameID_' + n,
            type: 'USHORT',
            value: nameID
          }, {
            name: 'flags_' + n,
            type: 'USHORT',
            value: 0
          }];
          for (var i = 0; i < axes.length; ++i) {
            var axisTag = axes[i].tag;
            fields.push({
              name: 'axis_' + n + ' ' + axisTag,
              type: 'FIXED',
              value: inst.coordinates[axisTag] << 16
            });
          }
          return fields;
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
            result.fields = result.fields.concat(makeFvarAxis(i, fvar.axes[i], names));
          }
          for (var j = 0; j < fvar.instances.length; j++) {
            result.fields = result.fields.concat(makeFvarInstance(j, fvar.instances[j], fvar.axes, names));
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
        "../check": 3,
        "../parse": 11,
        "../table": 14
      }],
      18: [function(require, module, exports) {
        'use strict';
        var check = require('../check');
        var glyphset = require('../glyphset');
        var parse = require('../parse');
        var path = require('../path');
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
          glyph._xMin = p.parseShort();
          glyph._yMin = p.parseShort();
          glyph._xMax = p.parseShort();
          glyph._yMax = p.parseShort();
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
                if ((flags & 2) > 0) {
                  component.dx = p.parseShort();
                  component.dy = p.parseShort();
                } else {
                  component.matchedPoints = [p.parseUShort(), p.parseUShort()];
                }
              } else {
                if ((flags & 2) > 0) {
                  component.dx = p.parseChar();
                  component.dy = p.parseChar();
                } else {
                  component.matchedPoints = [p.parseByte(), p.parseByte()];
                }
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
                var transformedPoints;
                if (component.matchedPoints === undefined) {
                  transformedPoints = transformPoints(componentGlyph.points, component);
                } else {
                  if ((component.matchedPoints[0] > glyph.points.length - 1) || (component.matchedPoints[1] > componentGlyph.points.length - 1)) {
                    throw Error('Matched points out of range in ' + glyph.name);
                  }
                  var firstPt = glyph.points[component.matchedPoints[0]];
                  var secondPt = componentGlyph.points[component.matchedPoints[1]];
                  var transform = {
                    xScale: component.xScale,
                    scale01: component.scale01,
                    scale10: component.scale10,
                    yScale: component.yScale,
                    dx: 0,
                    dy: 0
                  };
                  secondPt = transformPoints([secondPt], transform)[0];
                  transform.dx = firstPt.x - secondPt.x;
                  transform.dy = firstPt.y - secondPt.y;
                  transformedPoints = transformPoints(componentGlyph.points, transform);
                }
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
        "../check": 3,
        "../glyphset": 8,
        "../parse": 11,
        "../path": 12
      }],
      19: [function(require, module, exports) {
        'use strict';
        var check = require('../check');
        var parse = require('../parse');
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
              var pairPosSubTable = parsePairPosSubTable(data, start + subTableOffsets[i]);
              if (pairPosSubTable)
                subtables.push(pairPosSubTable);
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
        "../check": 3,
        "../parse": 11
      }],
      20: [function(require, module, exports) {
        'use strict';
        var check = require('../check');
        var Parser = require('../parse').Parser;
        var subtableParsers = new Array(9);
        var table = require('../table');
        subtableParsers[1] = function parseLookup1() {
          var start = this.offset + this.relativeOffset;
          var substFormat = this.parseUShort();
          if (substFormat === 1) {
            return {
              substFormat: 1,
              coverage: this.parsePointer(Parser.coverage),
              deltaGlyphId: this.parseUShort()
            };
          } else if (substFormat === 2) {
            return {
              substFormat: 2,
              coverage: this.parsePointer(Parser.coverage),
              substitute: this.parseOffset16List()
            };
          }
          check.assert(false, '0x' + start.toString(16) + ': lookup type 1 format must be 1 or 2.');
        };
        subtableParsers[2] = function parseLookup2() {
          var substFormat = this.parseUShort();
          check.argument(substFormat === 1, 'GSUB Multiple Substitution Subtable identifier-format must be 1');
          return {
            substFormat: substFormat,
            coverage: this.parsePointer(Parser.coverage),
            sequences: this.parseListOfLists()
          };
        };
        subtableParsers[3] = function parseLookup3() {
          var substFormat = this.parseUShort();
          check.argument(substFormat === 1, 'GSUB Alternate Substitution Subtable identifier-format must be 1');
          return {
            substFormat: substFormat,
            coverage: this.parsePointer(Parser.coverage),
            alternateSets: this.parseListOfLists()
          };
        };
        subtableParsers[4] = function parseLookup4() {
          var substFormat = this.parseUShort();
          check.argument(substFormat === 1, 'GSUB ligature table identifier-format must be 1');
          return {
            substFormat: substFormat,
            coverage: this.parsePointer(Parser.coverage),
            ligatureSets: this.parseListOfLists(function() {
              return {
                ligGlyph: this.parseUShort(),
                components: this.parseUShortList(this.parseUShort() - 1)
              };
            })
          };
        };
        var lookupRecordDesc = {
          sequenceIndex: Parser.uShort,
          lookupListIndex: Parser.uShort
        };
        subtableParsers[5] = function parseLookup5() {
          var start = this.offset + this.relativeOffset;
          var substFormat = this.parseUShort();
          if (substFormat === 1) {
            return {
              substFormat: substFormat,
              coverage: this.parsePointer(Parser.coverage),
              ruleSets: this.parseListOfLists(function() {
                var glyphCount = this.parseUShort();
                var substCount = this.parseUShort();
                return {
                  input: this.parseUShortList(glyphCount - 1),
                  lookupRecords: this.parseRecordList(substCount, lookupRecordDesc)
                };
              })
            };
          } else if (substFormat === 2) {
            return {
              substFormat: substFormat,
              coverage: this.parsePointer(Parser.coverage),
              classDef: this.parsePointer(Parser.classDef),
              classSets: this.parseListOfLists(function() {
                var glyphCount = this.parseUShort();
                var substCount = this.parseUShort();
                return {
                  classes: this.parseUShortList(glyphCount - 1),
                  lookupRecords: this.parseRecordList(substCount, lookupRecordDesc)
                };
              })
            };
          } else if (substFormat === 3) {
            var glyphCount = this.parseUShort();
            var substCount = this.parseUShort();
            return {
              substFormat: substFormat,
              coverages: this.parseList(glyphCount, Parser.pointer(Parser.coverage)),
              lookupRecords: this.parseRecordList(substCount, lookupRecordDesc)
            };
          }
          check.assert(false, '0x' + start.toString(16) + ': lookup type 5 format must be 1, 2 or 3.');
        };
        subtableParsers[6] = function parseLookup6() {
          var start = this.offset + this.relativeOffset;
          var substFormat = this.parseUShort();
          if (substFormat === 1) {
            return {
              substFormat: 1,
              coverage: this.parsePointer(Parser.coverage),
              chainRuleSets: this.parseListOfLists(function() {
                return {
                  backtrack: this.parseUShortList(),
                  input: this.parseUShortList(this.parseShort() - 1),
                  lookahead: this.parseUShortList(),
                  lookupRecords: this.parseRecordList(lookupRecordDesc)
                };
              })
            };
          } else if (substFormat === 2) {
            return {
              substFormat: 2,
              coverage: this.parsePointer(Parser.coverage),
              backtrackClassDef: this.parsePointer(Parser.classDef),
              inputClassDef: this.parsePointer(Parser.classDef),
              lookaheadClassDef: this.parsePointer(Parser.classDef),
              chainClassSet: this.parseListOfLists(function() {
                return {
                  backtrack: this.parseUShortList(),
                  input: this.parseUShortList(this.parseShort() - 1),
                  lookahead: this.parseUShortList(),
                  lookupRecords: this.parseRecordList(lookupRecordDesc)
                };
              })
            };
          } else if (substFormat === 3) {
            return {
              substFormat: 3,
              backtrackCoverage: this.parseList(Parser.pointer(Parser.coverage)),
              inputCoverage: this.parseList(Parser.pointer(Parser.coverage)),
              lookaheadCoverage: this.parseList(Parser.pointer(Parser.coverage)),
              lookupRecords: this.parseRecordList(lookupRecordDesc)
            };
          }
          check.assert(false, '0x' + start.toString(16) + ': lookup type 6 format must be 1, 2 or 3.');
        };
        subtableParsers[7] = function parseLookup7() {
          var substFormat = this.parseUShort();
          check.argument(substFormat === 1, 'GSUB Extension Substitution subtable identifier-format must be 1');
          var extensionLookupType = this.parseUShort();
          var extensionParser = new Parser(this.data, this.offset + this.parseULong());
          return {
            substFormat: 1,
            lookupType: extensionLookupType,
            extension: subtableParsers[extensionLookupType].call(extensionParser)
          };
        };
        subtableParsers[8] = function parseLookup8() {
          var substFormat = this.parseUShort();
          check.argument(substFormat === 1, 'GSUB Reverse Chaining Contextual Single Substitution Subtable identifier-format must be 1');
          return {
            substFormat: substFormat,
            coverage: this.parsePointer(Parser.coverage),
            backtrackCoverage: this.parseList(Parser.pointer(Parser.coverage)),
            lookaheadCoverage: this.parseList(Parser.pointer(Parser.coverage)),
            substitutes: this.parseUShortList()
          };
        };
        function parseGsubTable(data, start) {
          start = start || 0;
          var p = new Parser(data, start);
          var tableVersion = p.parseVersion();
          check.argument(tableVersion === 1, 'Unsupported GSUB table version.');
          return {
            version: tableVersion,
            scripts: p.parseScriptList(),
            features: p.parseFeatureList(),
            lookups: p.parseLookupList(subtableParsers)
          };
        }
        var subtableMakers = new Array(9);
        subtableMakers[1] = function makeLookup1(subtable) {
          if (subtable.substFormat === 1) {
            return new table.Table('substitutionTable', [{
              name: 'substFormat',
              type: 'USHORT',
              value: 1
            }, {
              name: 'coverage',
              type: 'TABLE',
              value: new table.Coverage(subtable.coverage)
            }, {
              name: 'deltaGlyphID',
              type: 'USHORT',
              value: subtable.deltaGlyphId
            }]);
          } else {
            return new table.Table('substitutionTable', [{
              name: 'substFormat',
              type: 'USHORT',
              value: 2
            }, {
              name: 'coverage',
              type: 'TABLE',
              value: new table.Coverage(subtable.coverage)
            }].concat(table.ushortList('substitute', subtable.substitute)));
          }
          check.fail('Lookup type 1 substFormat must be 1 or 2.');
        };
        subtableMakers[3] = function makeLookup3(subtable) {
          check.assert(subtable.substFormat === 1, 'Lookup type 3 substFormat must be 1.');
          return new table.Table('substitutionTable', [{
            name: 'substFormat',
            type: 'USHORT',
            value: 1
          }, {
            name: 'coverage',
            type: 'TABLE',
            value: new table.Coverage(subtable.coverage)
          }].concat(table.tableList('altSet', subtable.alternateSets, function(alternateSet) {
            return new table.Table('alternateSetTable', table.ushortList('alternate', alternateSet));
          })));
        };
        subtableMakers[4] = function makeLookup4(subtable) {
          check.assert(subtable.substFormat === 1, 'Lookup type 4 substFormat must be 1.');
          return new table.Table('substitutionTable', [{
            name: 'substFormat',
            type: 'USHORT',
            value: 1
          }, {
            name: 'coverage',
            type: 'TABLE',
            value: new table.Coverage(subtable.coverage)
          }].concat(table.tableList('ligSet', subtable.ligatureSets, function(ligatureSet) {
            return new table.Table('ligatureSetTable', table.tableList('ligature', ligatureSet, function(ligature) {
              return new table.Table('ligatureTable', [{
                name: 'ligGlyph',
                type: 'USHORT',
                value: ligature.ligGlyph
              }].concat(table.ushortList('component', ligature.components, ligature.components.length + 1)));
            }));
          })));
        };
        function makeGsubTable(gsub) {
          return new table.Table('GSUB', [{
            name: 'version',
            type: 'ULONG',
            value: 0x10000
          }, {
            name: 'scripts',
            type: 'TABLE',
            value: new table.ScriptList(gsub.scripts)
          }, {
            name: 'features',
            type: 'TABLE',
            value: new table.FeatureList(gsub.features)
          }, {
            name: 'lookups',
            type: 'TABLE',
            value: new table.LookupList(gsub.lookups, subtableMakers)
          }]);
        }
        exports.parse = parseGsubTable;
        exports.make = makeGsubTable;
      }, {
        "../check": 3,
        "../parse": 11,
        "../table": 14
      }],
      21: [function(require, module, exports) {
        'use strict';
        var check = require('../check');
        var parse = require('../parse');
        var table = require('../table');
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
          var timestamp = Math.round(new Date().getTime() / 1000) + 2082844800;
          var createdTimestamp = timestamp;
          if (options.createdTimestamp) {
            createdTimestamp = options.createdTimestamp + 2082844800;
          }
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
            value: createdTimestamp
          }, {
            name: 'modified',
            type: 'LONGDATETIME',
            value: timestamp
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
        "../check": 3,
        "../parse": 11,
        "../table": 14
      }],
      22: [function(require, module, exports) {
        'use strict';
        var parse = require('../parse');
        var table = require('../table');
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
        "../table": 14
      }],
      23: [function(require, module, exports) {
        'use strict';
        var parse = require('../parse');
        var table = require('../table');
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
        "../table": 14
      }],
      24: [function(require, module, exports) {
        'use strict';
        var check = require('../check');
        var parse = require('../parse');
        function parseWindowsKernTable(p) {
          var pairs = {};
          p.skip('uShort');
          var subtableVersion = p.parseUShort();
          check.argument(subtableVersion === 0, 'Unsupported kern sub-table version.');
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
        function parseMacKernTable(p) {
          var pairs = {};
          p.skip('uShort');
          var nTables = p.parseULong();
          if (nTables > 1) {
            console.warn('Only the first kern subtable is supported.');
          }
          p.skip('uLong');
          var coverage = p.parseUShort();
          var subtableVersion = coverage & 0xFF;
          p.skip('uShort');
          if (subtableVersion === 0) {
            var nPairs = p.parseUShort();
            p.skip('uShort', 3);
            for (var i = 0; i < nPairs; i += 1) {
              var leftIndex = p.parseUShort();
              var rightIndex = p.parseUShort();
              var value = p.parseShort();
              pairs[leftIndex + ',' + rightIndex] = value;
            }
          }
          return pairs;
        }
        function parseKernTable(data, start) {
          var p = new parse.Parser(data, start);
          var tableVersion = p.parseUShort();
          if (tableVersion === 0) {
            return parseWindowsKernTable(p);
          } else if (tableVersion === 1) {
            return parseMacKernTable(p);
          } else {
            throw new Error('Unsupported kern table version (' + tableVersion + ').');
          }
        }
        exports.parse = parseKernTable;
      }, {
        "../check": 3,
        "../parse": 11
      }],
      25: [function(require, module, exports) {
        'use strict';
        var parse = require('../parse');
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
      26: [function(require, module, exports) {
        'use strict';
        var check = require('../check');
        var parse = require('../parse');
        var table = require('../table');
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
        "../check": 3,
        "../parse": 11,
        "../table": 14
      }],
      27: [function(require, module, exports) {
        'use strict';
        var parse = require('../parse');
        var table = require('../table');
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
        "../table": 14
      }],
      28: [function(require, module, exports) {
        'use strict';
        var types = require('../types');
        var decode = types.decode;
        var check = require('../check');
        var parse = require('../parse');
        var table = require('../table');
        function parseMetaTable(data, start) {
          var p = new parse.Parser(data, start);
          var tableVersion = p.parseULong();
          check.argument(tableVersion === 1, 'Unsupported META table version.');
          p.parseULong();
          p.parseULong();
          var numDataMaps = p.parseULong();
          var tags = {};
          for (var i = 0; i < numDataMaps; i++) {
            var tag = p.parseTag();
            var dataOffset = p.parseULong();
            var dataLength = p.parseULong();
            var text = decode.UTF8(data, start + dataOffset, dataLength);
            tags[tag] = text;
          }
          return tags;
        }
        function makeMetaTable(tags) {
          var numTags = Object.keys(tags).length;
          var stringPool = '';
          var stringPoolOffset = 16 + numTags * 12;
          var result = new table.Table('meta', [{
            name: 'version',
            type: 'ULONG',
            value: 1
          }, {
            name: 'flags',
            type: 'ULONG',
            value: 0
          }, {
            name: 'offset',
            type: 'ULONG',
            value: stringPoolOffset
          }, {
            name: 'numTags',
            type: 'ULONG',
            value: numTags
          }]);
          for (var tag in tags) {
            var pos = stringPool.length;
            stringPool += tags[tag];
            result.fields.push({
              name: 'tag ' + tag,
              type: 'TAG',
              value: tag
            });
            result.fields.push({
              name: 'offset ' + tag,
              type: 'ULONG',
              value: stringPoolOffset + pos
            });
            result.fields.push({
              name: 'length ' + tag,
              type: 'ULONG',
              value: tags[tag].length
            });
          }
          result.fields.push({
            name: 'stringPool',
            type: 'CHARARRAY',
            value: stringPool
          });
          return result;
        }
        exports.parse = parseMetaTable;
        exports.make = makeMetaTable;
      }, {
        "../check": 3,
        "../parse": 11,
        "../table": 14,
        "../types": 33
      }],
      29: [function(require, module, exports) {
        'use strict';
        var types = require('../types');
        var decode = types.decode;
        var encode = types.encode;
        var parse = require('../parse');
        var table = require('../table');
        var nameTableNames = ['copyright', 'fontFamily', 'fontSubfamily', 'uniqueID', 'fullName', 'version', 'postScriptName', 'trademark', 'manufacturer', 'designer', 'description', 'manufacturerURL', 'designerURL', 'license', 'licenseURL', 'reserved', 'preferredFamily', 'preferredSubfamily', 'compatibleFullName', 'sampleText', 'postScriptFindFontName', 'wwsFamily', 'wwsSubfamily'];
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
          return new table.Record('NameRecord', [{
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
            if (isNaN(nameID)) {
              throw new Error('Name table entry "' + key + '" does not exist, see nameTableNames for complete list.');
            }
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
              type: 'RECORD',
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
        "../table": 14,
        "../types": 33
      }],
      30: [function(require, module, exports) {
        'use strict';
        var parse = require('../parse');
        var table = require('../table');
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
        "../table": 14
      }],
      31: [function(require, module, exports) {
        'use strict';
        var encoding = require('../encoding');
        var parse = require('../parse');
        var table = require('../table');
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
        "../encoding": 5,
        "../parse": 11,
        "../table": 14
      }],
      32: [function(require, module, exports) {
        'use strict';
        var check = require('../check');
        var table = require('../table');
        var cmap = require('./cmap');
        var cff = require('./cff');
        var head = require('./head');
        var hhea = require('./hhea');
        var hmtx = require('./hmtx');
        var ltag = require('./ltag');
        var maxp = require('./maxp');
        var _name = require('./name');
        var os2 = require('./os2');
        var post = require('./post');
        var gsub = require('./gsub');
        var meta = require('./meta');
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
          return new table.Record('Table Record', [{
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
              type: 'RECORD',
              value: tableRecord
            });
            tableFields.push({
              name: t.tableName + ' table',
              type: 'RECORD',
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
            if (isNaN(glyph.advanceWidth)) {
              throw new Error('Glyph ' + glyph.name + ' (' + i + '): advanceWidth is not a number.');
            }
            if (firstCharIndex > unicode || firstCharIndex === undefined) {
              if (unicode > 0) {
                firstCharIndex = unicode;
              }
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
          globals.ascender = font.ascender;
          globals.descender = font.descender;
          var headTable = head.make({
            flags: 3,
            unitsPerEm: font.unitsPerEm,
            xMin: globals.xMin,
            yMin: globals.yMin,
            xMax: globals.xMax,
            yMax: globals.yMax,
            lowestRecPPEM: 3,
            createdTimestamp: font.createdTimestamp
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
            usWeightClass: font.tables.os2.usWeightClass,
            usWidthClass: font.tables.os2.usWidthClass,
            usFirstCharIndex: firstCharIndex,
            usLastCharIndex: lastCharIndex,
            ulUnicodeRange1: ulUnicodeRange1,
            ulUnicodeRange2: ulUnicodeRange2,
            ulUnicodeRange3: ulUnicodeRange3,
            ulUnicodeRange4: ulUnicodeRange4,
            fsSelection: font.tables.os2.fsSelection,
            sTypoAscender: globals.ascender,
            sTypoDescender: globals.descender,
            sTypoLineGap: 0,
            usWinAscent: globals.yMax,
            usWinDescent: Math.abs(globals.yMin),
            ulCodePageRange1: 1,
            sxHeight: metricsForChar(font, 'xyvw', {yMax: Math.round(globals.ascender / 2)}).yMax,
            sCapHeight: metricsForChar(font, 'HIKLEFJMNTZBDPRAGOQSUVWXY', globals).yMax,
            usDefaultChar: font.hasChar(' ') ? 32 : 0,
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
            unitsPerEm: font.unitsPerEm,
            fontBBox: [0, globals.yMin, globals.ascender, globals.advanceWidthMax]
          });
          var metaTable = (font.metas && Object.keys(font.metas).length > 0) ? meta.make(font.metas) : undefined;
          var tables = [headTable, hheaTable, maxpTable, os2Table, nameTable, cmapTable, postTable, cffTable, hmtxTable];
          if (ltagTable) {
            tables.push(ltagTable);
          }
          if (font.tables.gsub) {
            tables.push(gsub.make(font.tables.gsub));
          }
          if (metaTable) {
            tables.push(metaTable);
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
        "../check": 3,
        "../table": 14,
        "./cff": 15,
        "./cmap": 16,
        "./gsub": 20,
        "./head": 21,
        "./hhea": 22,
        "./hmtx": 23,
        "./ltag": 26,
        "./maxp": 27,
        "./meta": 28,
        "./name": 29,
        "./os2": 30,
        "./post": 31
      }],
      33: [function(require, module, exports) {
        'use strict';
        var check = require('./check');
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
            b[i] = v.charCodeAt(i);
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
        encode.LONGDATETIME = function(v) {
          return [0, 0, 0, 0, (v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
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
        decode.UTF8 = function(data, offset, numBytes) {
          var codePoints = [];
          var numChars = numBytes;
          for (var j = 0; j < numChars; j++, offset += 1) {
            codePoints[j] = data.getUint8(offset);
          }
          return String.fromCharCode.apply(null, codePoints);
        };
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
            b[b.length] = (codepoint >> 8) & 0xFF;
            b[b.length] = codepoint & 0xFF;
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
            result[i] = c;
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
          for (i = 0; i < l.length; i += 1) {
            var v = encode.OBJECT(l[i]);
            Array.prototype.push.apply(data, v);
            offset += v.length;
            offsets.push(offset);
          }
          if (data.length === 0) {
            return [0, 0];
          }
          var encodedOffsets = [];
          var offSize = (1 + Math.floor(Math.log(offset) / Math.log(2)) / 8) | 0;
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
          var subtables = [];
          var subtableOffsets = [];
          var i;
          for (i = 0; i < length; i += 1) {
            var field = table.fields[i];
            var encodingFunction = encode[field.type];
            check.argument(encodingFunction !== undefined, 'No encoding function for field type ' + field.type + ' (' + field.name + ')');
            var value = table[field.name];
            if (value === undefined) {
              value = field.value;
            }
            var bytes = encodingFunction(value);
            if (field.type === 'TABLE') {
              subtableOffsets.push(d.length);
              d = d.concat([0, 0]);
              subtables.push(bytes);
            } else {
              d = d.concat(bytes);
            }
          }
          for (i = 0; i < subtables.length; i += 1) {
            var o = subtableOffsets[i];
            var offset = d.length;
            check.argument(offset < 65536, 'Table ' + table.tableName + ' too big.');
            d[o] = offset >> 8;
            d[o + 1] = offset & 0xff;
            d = d.concat(subtables[i]);
          }
          return d;
        };
        sizeOf.TABLE = function(table) {
          var numBytes = 0;
          var length = table.fields.length;
          for (var i = 0; i < length; i += 1) {
            var field = table.fields[i];
            var sizeOfFunction = sizeOf[field.type];
            check.argument(sizeOfFunction !== undefined, 'No sizeOf function for field type ' + field.type + ' (' + field.name + ')');
            var value = table[field.name];
            if (value === undefined) {
              value = field.value;
            }
            numBytes += sizeOfFunction(value);
            if (field.type === 'TABLE') {
              numBytes += 2;
            }
          }
          return numBytes;
        };
        encode.RECORD = encode.TABLE;
        sizeOf.RECORD = sizeOf.TABLE;
        encode.LITERAL = function(v) {
          return v;
        };
        sizeOf.LITERAL = function(v) {
          return v.length;
        };
        exports.decode = decode;
        exports.encode = encode;
        exports.sizeOf = sizeOf;
      }, {"./check": 3}],
      34: [function(require, module, exports) {
        'use strict';
        exports.isBrowser = function() {
          return typeof window !== 'undefined';
        };
        exports.isNode = function() {
          return typeof window === 'undefined';
        };
        exports.nodeBufferToArrayBuffer = function(buffer) {
          var ab = new ArrayBuffer(buffer.length);
          var view = new Uint8Array(ab);
          for (var i = 0; i < buffer.length; ++i) {
            view[i] = buffer[i];
          }
          return ab;
        };
        exports.arrayBufferToNodeBuffer = function(ab) {
          var buffer = new Buffer(ab.byteLength);
          var view = new Uint8Array(ab);
          for (var i = 0; i < buffer.length; ++i) {
            buffer[i] = view[i];
          }
          return buffer;
        };
        exports.checkArgument = function(expression, message) {
          if (!expression) {
            throw message;
          }
        };
      }, {}]
    }, {}, [10])(10);
  });
})(require('buffer').Buffer);
