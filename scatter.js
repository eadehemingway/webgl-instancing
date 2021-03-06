(function () {
	'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getAugmentedNamespace(n) {
		if (n.__esModule) return n;
		var a = Object.defineProperty({}, '__esModule', {value: true});
		Object.keys(n).forEach(function (k) {
			var d = Object.getOwnPropertyDescriptor(n, k);
			Object.defineProperty(a, k, d.get ? d : {
				enumerable: true,
				get: function () {
					return n[k];
				}
			});
		});
		return a;
	}

	var src = {};

	var regl$1 = {exports: {}};

	(function (module, exports) {
	(function (global, factory) {
	    module.exports = factory() ;
	}(commonjsGlobal, (function () {
	var isTypedArray = function (x) {
	  return (
	    x instanceof Uint8Array ||
	    x instanceof Uint16Array ||
	    x instanceof Uint32Array ||
	    x instanceof Int8Array ||
	    x instanceof Int16Array ||
	    x instanceof Int32Array ||
	    x instanceof Float32Array ||
	    x instanceof Float64Array ||
	    x instanceof Uint8ClampedArray
	  )
	};

	var extend = function (base, opts) {
	  var keys = Object.keys(opts);
	  for (var i = 0; i < keys.length; ++i) {
	    base[keys[i]] = opts[keys[i]];
	  }
	  return base
	};

	// Error checking and parameter validation.
	//
	// Statements for the form `check.someProcedure(...)` get removed by
	// a browserify transform for optimized/minified bundles.
	//
	/* globals atob */
	var endl = '\n';

	// only used for extracting shader names.  if atob not present, then errors
	// will be slightly crappier
	function decodeB64 (str) {
	  if (typeof atob !== 'undefined') {
	    return atob(str)
	  }
	  return 'base64:' + str
	}

	function raise (message) {
	  var error = new Error('(regl) ' + message);
	  console.error(error);
	  throw error
	}

	function check (pred, message) {
	  if (!pred) {
	    raise(message);
	  }
	}

	function encolon (message) {
	  if (message) {
	    return ': ' + message
	  }
	  return ''
	}

	function checkParameter (param, possibilities, message) {
	  if (!(param in possibilities)) {
	    raise('unknown parameter (' + param + ')' + encolon(message) +
	          '. possible values: ' + Object.keys(possibilities).join());
	  }
	}

	function checkIsTypedArray (data, message) {
	  if (!isTypedArray(data)) {
	    raise(
	      'invalid parameter type' + encolon(message) +
	      '. must be a typed array');
	  }
	}

	function standardTypeEh (value, type) {
	  switch (type) {
	    case 'number': return typeof value === 'number'
	    case 'object': return typeof value === 'object'
	    case 'string': return typeof value === 'string'
	    case 'boolean': return typeof value === 'boolean'
	    case 'function': return typeof value === 'function'
	    case 'undefined': return typeof value === 'undefined'
	    case 'symbol': return typeof value === 'symbol'
	  }
	}

	function checkTypeOf (value, type, message) {
	  if (!standardTypeEh(value, type)) {
	    raise(
	      'invalid parameter type' + encolon(message) +
	      '. expected ' + type + ', got ' + (typeof value));
	  }
	}

	function checkNonNegativeInt (value, message) {
	  if (!((value >= 0) &&
	        ((value | 0) === value))) {
	    raise('invalid parameter type, (' + value + ')' + encolon(message) +
	          '. must be a nonnegative integer');
	  }
	}

	function checkOneOf (value, list, message) {
	  if (list.indexOf(value) < 0) {
	    raise('invalid value' + encolon(message) + '. must be one of: ' + list);
	  }
	}

	var constructorKeys = [
	  'gl',
	  'canvas',
	  'container',
	  'attributes',
	  'pixelRatio',
	  'extensions',
	  'optionalExtensions',
	  'profile',
	  'onDone'
	];

	function checkConstructor (obj) {
	  Object.keys(obj).forEach(function (key) {
	    if (constructorKeys.indexOf(key) < 0) {
	      raise('invalid regl constructor argument "' + key + '". must be one of ' + constructorKeys);
	    }
	  });
	}

	function leftPad (str, n) {
	  str = str + '';
	  while (str.length < n) {
	    str = ' ' + str;
	  }
	  return str
	}

	function ShaderFile () {
	  this.name = 'unknown';
	  this.lines = [];
	  this.index = {};
	  this.hasErrors = false;
	}

	function ShaderLine (number, line) {
	  this.number = number;
	  this.line = line;
	  this.errors = [];
	}

	function ShaderError (fileNumber, lineNumber, message) {
	  this.file = fileNumber;
	  this.line = lineNumber;
	  this.message = message;
	}

	function guessCommand () {
	  var error = new Error();
	  var stack = (error.stack || error).toString();
	  var pat = /compileProcedure.*\n\s*at.*\((.*)\)/.exec(stack);
	  if (pat) {
	    return pat[1]
	  }
	  var pat2 = /compileProcedure.*\n\s*at\s+(.*)(\n|$)/.exec(stack);
	  if (pat2) {
	    return pat2[1]
	  }
	  return 'unknown'
	}

	function guessCallSite () {
	  var error = new Error();
	  var stack = (error.stack || error).toString();
	  var pat = /at REGLCommand.*\n\s+at.*\((.*)\)/.exec(stack);
	  if (pat) {
	    return pat[1]
	  }
	  var pat2 = /at REGLCommand.*\n\s+at\s+(.*)\n/.exec(stack);
	  if (pat2) {
	    return pat2[1]
	  }
	  return 'unknown'
	}

	function parseSource (source, command) {
	  var lines = source.split('\n');
	  var lineNumber = 1;
	  var fileNumber = 0;
	  var files = {
	    unknown: new ShaderFile(),
	    0: new ShaderFile()
	  };
	  files.unknown.name = files[0].name = command || guessCommand();
	  files.unknown.lines.push(new ShaderLine(0, ''));
	  for (var i = 0; i < lines.length; ++i) {
	    var line = lines[i];
	    var parts = /^\s*#\s*(\w+)\s+(.+)\s*$/.exec(line);
	    if (parts) {
	      switch (parts[1]) {
	        case 'line':
	          var lineNumberInfo = /(\d+)(\s+\d+)?/.exec(parts[2]);
	          if (lineNumberInfo) {
	            lineNumber = lineNumberInfo[1] | 0;
	            if (lineNumberInfo[2]) {
	              fileNumber = lineNumberInfo[2] | 0;
	              if (!(fileNumber in files)) {
	                files[fileNumber] = new ShaderFile();
	              }
	            }
	          }
	          break
	        case 'define':
	          var nameInfo = /SHADER_NAME(_B64)?\s+(.*)$/.exec(parts[2]);
	          if (nameInfo) {
	            files[fileNumber].name = (nameInfo[1]
	              ? decodeB64(nameInfo[2])
	              : nameInfo[2]);
	          }
	          break
	      }
	    }
	    files[fileNumber].lines.push(new ShaderLine(lineNumber++, line));
	  }
	  Object.keys(files).forEach(function (fileNumber) {
	    var file = files[fileNumber];
	    file.lines.forEach(function (line) {
	      file.index[line.number] = line;
	    });
	  });
	  return files
	}

	function parseErrorLog (errLog) {
	  var result = [];
	  errLog.split('\n').forEach(function (errMsg) {
	    if (errMsg.length < 5) {
	      return
	    }
	    var parts = /^ERROR:\s+(\d+):(\d+):\s*(.*)$/.exec(errMsg);
	    if (parts) {
	      result.push(new ShaderError(
	        parts[1] | 0,
	        parts[2] | 0,
	        parts[3].trim()));
	    } else if (errMsg.length > 0) {
	      result.push(new ShaderError('unknown', 0, errMsg));
	    }
	  });
	  return result
	}

	function annotateFiles (files, errors) {
	  errors.forEach(function (error) {
	    var file = files[error.file];
	    if (file) {
	      var line = file.index[error.line];
	      if (line) {
	        line.errors.push(error);
	        file.hasErrors = true;
	        return
	      }
	    }
	    files.unknown.hasErrors = true;
	    files.unknown.lines[0].errors.push(error);
	  });
	}

	function checkShaderError (gl, shader, source, type, command) {
	  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
	    var errLog = gl.getShaderInfoLog(shader);
	    var typeName = type === gl.FRAGMENT_SHADER ? 'fragment' : 'vertex';
	    checkCommandType(source, 'string', typeName + ' shader source must be a string', command);
	    var files = parseSource(source, command);
	    var errors = parseErrorLog(errLog);
	    annotateFiles(files, errors);

	    Object.keys(files).forEach(function (fileNumber) {
	      var file = files[fileNumber];
	      if (!file.hasErrors) {
	        return
	      }

	      var strings = [''];
	      var styles = [''];

	      function push (str, style) {
	        strings.push(str);
	        styles.push(style || '');
	      }

	      push('file number ' + fileNumber + ': ' + file.name + '\n', 'color:red;text-decoration:underline;font-weight:bold');

	      file.lines.forEach(function (line) {
	        if (line.errors.length > 0) {
	          push(leftPad(line.number, 4) + '|  ', 'background-color:yellow; font-weight:bold');
	          push(line.line + endl, 'color:red; background-color:yellow; font-weight:bold');

	          // try to guess token
	          var offset = 0;
	          line.errors.forEach(function (error) {
	            var message = error.message;
	            var token = /^\s*'(.*)'\s*:\s*(.*)$/.exec(message);
	            if (token) {
	              var tokenPat = token[1];
	              message = token[2];
	              switch (tokenPat) {
	                case 'assign':
	                  tokenPat = '=';
	                  break
	              }
	              offset = Math.max(line.line.indexOf(tokenPat, offset), 0);
	            } else {
	              offset = 0;
	            }

	            push(leftPad('| ', 6));
	            push(leftPad('^^^', offset + 3) + endl, 'font-weight:bold');
	            push(leftPad('| ', 6));
	            push(message + endl, 'font-weight:bold');
	          });
	          push(leftPad('| ', 6) + endl);
	        } else {
	          push(leftPad(line.number, 4) + '|  ');
	          push(line.line + endl, 'color:red');
	        }
	      });
	      if (typeof document !== 'undefined' && !window.chrome) {
	        styles[0] = strings.join('%c');
	        console.log.apply(console, styles);
	      } else {
	        console.log(strings.join(''));
	      }
	    });

	    check.raise('Error compiling ' + typeName + ' shader, ' + files[0].name);
	  }
	}

	function checkLinkError (gl, program, fragShader, vertShader, command) {
	  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	    var errLog = gl.getProgramInfoLog(program);
	    var fragParse = parseSource(fragShader, command);
	    var vertParse = parseSource(vertShader, command);

	    var header = 'Error linking program with vertex shader, "' +
	      vertParse[0].name + '", and fragment shader "' + fragParse[0].name + '"';

	    if (typeof document !== 'undefined') {
	      console.log('%c' + header + endl + '%c' + errLog,
	        'color:red;text-decoration:underline;font-weight:bold',
	        'color:red');
	    } else {
	      console.log(header + endl + errLog);
	    }
	    check.raise(header);
	  }
	}

	function saveCommandRef (object) {
	  object._commandRef = guessCommand();
	}

	function saveDrawCommandInfo (opts, uniforms, attributes, stringStore) {
	  saveCommandRef(opts);

	  function id (str) {
	    if (str) {
	      return stringStore.id(str)
	    }
	    return 0
	  }
	  opts._fragId = id(opts.static.frag);
	  opts._vertId = id(opts.static.vert);

	  function addProps (dict, set) {
	    Object.keys(set).forEach(function (u) {
	      dict[stringStore.id(u)] = true;
	    });
	  }

	  var uniformSet = opts._uniformSet = {};
	  addProps(uniformSet, uniforms.static);
	  addProps(uniformSet, uniforms.dynamic);

	  var attributeSet = opts._attributeSet = {};
	  addProps(attributeSet, attributes.static);
	  addProps(attributeSet, attributes.dynamic);

	  opts._hasCount = (
	    'count' in opts.static ||
	    'count' in opts.dynamic ||
	    'elements' in opts.static ||
	    'elements' in opts.dynamic);
	}

	function commandRaise (message, command) {
	  var callSite = guessCallSite();
	  raise(message +
	    ' in command ' + (command || guessCommand()) +
	    (callSite === 'unknown' ? '' : ' called from ' + callSite));
	}

	function checkCommand (pred, message, command) {
	  if (!pred) {
	    commandRaise(message, command || guessCommand());
	  }
	}

	function checkParameterCommand (param, possibilities, message, command) {
	  if (!(param in possibilities)) {
	    commandRaise(
	      'unknown parameter (' + param + ')' + encolon(message) +
	      '. possible values: ' + Object.keys(possibilities).join(),
	      command || guessCommand());
	  }
	}

	function checkCommandType (value, type, message, command) {
	  if (!standardTypeEh(value, type)) {
	    commandRaise(
	      'invalid parameter type' + encolon(message) +
	      '. expected ' + type + ', got ' + (typeof value),
	      command || guessCommand());
	  }
	}

	function checkOptional (block) {
	  block();
	}

	function checkFramebufferFormat (attachment, texFormats, rbFormats) {
	  if (attachment.texture) {
	    checkOneOf(
	      attachment.texture._texture.internalformat,
	      texFormats,
	      'unsupported texture format for attachment');
	  } else {
	    checkOneOf(
	      attachment.renderbuffer._renderbuffer.format,
	      rbFormats,
	      'unsupported renderbuffer format for attachment');
	  }
	}

	var GL_CLAMP_TO_EDGE = 0x812F;

	var GL_NEAREST = 0x2600;
	var GL_NEAREST_MIPMAP_NEAREST = 0x2700;
	var GL_LINEAR_MIPMAP_NEAREST = 0x2701;
	var GL_NEAREST_MIPMAP_LINEAR = 0x2702;
	var GL_LINEAR_MIPMAP_LINEAR = 0x2703;

	var GL_BYTE = 5120;
	var GL_UNSIGNED_BYTE = 5121;
	var GL_SHORT = 5122;
	var GL_UNSIGNED_SHORT = 5123;
	var GL_INT = 5124;
	var GL_UNSIGNED_INT = 5125;
	var GL_FLOAT = 5126;

	var GL_UNSIGNED_SHORT_4_4_4_4 = 0x8033;
	var GL_UNSIGNED_SHORT_5_5_5_1 = 0x8034;
	var GL_UNSIGNED_SHORT_5_6_5 = 0x8363;
	var GL_UNSIGNED_INT_24_8_WEBGL = 0x84FA;

	var GL_HALF_FLOAT_OES = 0x8D61;

	var TYPE_SIZE = {};

	TYPE_SIZE[GL_BYTE] =
	TYPE_SIZE[GL_UNSIGNED_BYTE] = 1;

	TYPE_SIZE[GL_SHORT] =
	TYPE_SIZE[GL_UNSIGNED_SHORT] =
	TYPE_SIZE[GL_HALF_FLOAT_OES] =
	TYPE_SIZE[GL_UNSIGNED_SHORT_5_6_5] =
	TYPE_SIZE[GL_UNSIGNED_SHORT_4_4_4_4] =
	TYPE_SIZE[GL_UNSIGNED_SHORT_5_5_5_1] = 2;

	TYPE_SIZE[GL_INT] =
	TYPE_SIZE[GL_UNSIGNED_INT] =
	TYPE_SIZE[GL_FLOAT] =
	TYPE_SIZE[GL_UNSIGNED_INT_24_8_WEBGL] = 4;

	function pixelSize (type, channels) {
	  if (type === GL_UNSIGNED_SHORT_5_5_5_1 ||
	      type === GL_UNSIGNED_SHORT_4_4_4_4 ||
	      type === GL_UNSIGNED_SHORT_5_6_5) {
	    return 2
	  } else if (type === GL_UNSIGNED_INT_24_8_WEBGL) {
	    return 4
	  } else {
	    return TYPE_SIZE[type] * channels
	  }
	}

	function isPow2 (v) {
	  return !(v & (v - 1)) && (!!v)
	}

	function checkTexture2D (info, mipData, limits) {
	  var i;
	  var w = mipData.width;
	  var h = mipData.height;
	  var c = mipData.channels;

	  // Check texture shape
	  check(w > 0 && w <= limits.maxTextureSize &&
	        h > 0 && h <= limits.maxTextureSize,
	  'invalid texture shape');

	  // check wrap mode
	  if (info.wrapS !== GL_CLAMP_TO_EDGE || info.wrapT !== GL_CLAMP_TO_EDGE) {
	    check(isPow2(w) && isPow2(h),
	      'incompatible wrap mode for texture, both width and height must be power of 2');
	  }

	  if (mipData.mipmask === 1) {
	    if (w !== 1 && h !== 1) {
	      check(
	        info.minFilter !== GL_NEAREST_MIPMAP_NEAREST &&
	        info.minFilter !== GL_NEAREST_MIPMAP_LINEAR &&
	        info.minFilter !== GL_LINEAR_MIPMAP_NEAREST &&
	        info.minFilter !== GL_LINEAR_MIPMAP_LINEAR,
	        'min filter requires mipmap');
	    }
	  } else {
	    // texture must be power of 2
	    check(isPow2(w) && isPow2(h),
	      'texture must be a square power of 2 to support mipmapping');
	    check(mipData.mipmask === (w << 1) - 1,
	      'missing or incomplete mipmap data');
	  }

	  if (mipData.type === GL_FLOAT) {
	    if (limits.extensions.indexOf('oes_texture_float_linear') < 0) {
	      check(info.minFilter === GL_NEAREST && info.magFilter === GL_NEAREST,
	        'filter not supported, must enable oes_texture_float_linear');
	    }
	    check(!info.genMipmaps,
	      'mipmap generation not supported with float textures');
	  }

	  // check image complete
	  var mipimages = mipData.images;
	  for (i = 0; i < 16; ++i) {
	    if (mipimages[i]) {
	      var mw = w >> i;
	      var mh = h >> i;
	      check(mipData.mipmask & (1 << i), 'missing mipmap data');

	      var img = mipimages[i];

	      check(
	        img.width === mw &&
	        img.height === mh,
	        'invalid shape for mip images');

	      check(
	        img.format === mipData.format &&
	        img.internalformat === mipData.internalformat &&
	        img.type === mipData.type,
	        'incompatible type for mip image');

	      if (img.compressed) ; else if (img.data) {
	        // check(img.data.byteLength === mw * mh *
	        // Math.max(pixelSize(img.type, c), img.unpackAlignment),
	        var rowSize = Math.ceil(pixelSize(img.type, c) * mw / img.unpackAlignment) * img.unpackAlignment;
	        check(img.data.byteLength === rowSize * mh,
	          'invalid data for image, buffer size is inconsistent with image format');
	      } else if (img.element) ; else if (img.copy) ;
	    } else if (!info.genMipmaps) {
	      check((mipData.mipmask & (1 << i)) === 0, 'extra mipmap data');
	    }
	  }

	  if (mipData.compressed) {
	    check(!info.genMipmaps,
	      'mipmap generation for compressed images not supported');
	  }
	}

	function checkTextureCube (texture, info, faces, limits) {
	  var w = texture.width;
	  var h = texture.height;
	  var c = texture.channels;

	  // Check texture shape
	  check(
	    w > 0 && w <= limits.maxTextureSize && h > 0 && h <= limits.maxTextureSize,
	    'invalid texture shape');
	  check(
	    w === h,
	    'cube map must be square');
	  check(
	    info.wrapS === GL_CLAMP_TO_EDGE && info.wrapT === GL_CLAMP_TO_EDGE,
	    'wrap mode not supported by cube map');

	  for (var i = 0; i < faces.length; ++i) {
	    var face = faces[i];
	    check(
	      face.width === w && face.height === h,
	      'inconsistent cube map face shape');

	    if (info.genMipmaps) {
	      check(!face.compressed,
	        'can not generate mipmap for compressed textures');
	      check(face.mipmask === 1,
	        'can not specify mipmaps and generate mipmaps');
	    }

	    var mipmaps = face.images;
	    for (var j = 0; j < 16; ++j) {
	      var img = mipmaps[j];
	      if (img) {
	        var mw = w >> j;
	        var mh = h >> j;
	        check(face.mipmask & (1 << j), 'missing mipmap data');
	        check(
	          img.width === mw &&
	          img.height === mh,
	          'invalid shape for mip images');
	        check(
	          img.format === texture.format &&
	          img.internalformat === texture.internalformat &&
	          img.type === texture.type,
	          'incompatible type for mip image');

	        if (img.compressed) ; else if (img.data) {
	          check(img.data.byteLength === mw * mh *
	            Math.max(pixelSize(img.type, c), img.unpackAlignment),
	          'invalid data for image, buffer size is inconsistent with image format');
	        } else if (img.element) ; else if (img.copy) ;
	      }
	    }
	  }
	}

	var check$1 = extend(check, {
	  optional: checkOptional,
	  raise: raise,
	  commandRaise: commandRaise,
	  command: checkCommand,
	  parameter: checkParameter,
	  commandParameter: checkParameterCommand,
	  constructor: checkConstructor,
	  type: checkTypeOf,
	  commandType: checkCommandType,
	  isTypedArray: checkIsTypedArray,
	  nni: checkNonNegativeInt,
	  oneOf: checkOneOf,
	  shaderError: checkShaderError,
	  linkError: checkLinkError,
	  callSite: guessCallSite,
	  saveCommandRef: saveCommandRef,
	  saveDrawInfo: saveDrawCommandInfo,
	  framebufferFormat: checkFramebufferFormat,
	  guessCommand: guessCommand,
	  texture2D: checkTexture2D,
	  textureCube: checkTextureCube
	});

	var VARIABLE_COUNTER = 0;

	var DYN_FUNC = 0;
	var DYN_CONSTANT = 5;
	var DYN_ARRAY = 6;

	function DynamicVariable (type, data) {
	  this.id = (VARIABLE_COUNTER++);
	  this.type = type;
	  this.data = data;
	}

	function escapeStr (str) {
	  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
	}

	function splitParts (str) {
	  if (str.length === 0) {
	    return []
	  }

	  var firstChar = str.charAt(0);
	  var lastChar = str.charAt(str.length - 1);

	  if (str.length > 1 &&
	      firstChar === lastChar &&
	      (firstChar === '"' || firstChar === "'")) {
	    return ['"' + escapeStr(str.substr(1, str.length - 2)) + '"']
	  }

	  var parts = /\[(false|true|null|\d+|'[^']*'|"[^"]*")\]/.exec(str);
	  if (parts) {
	    return (
	      splitParts(str.substr(0, parts.index))
	        .concat(splitParts(parts[1]))
	        .concat(splitParts(str.substr(parts.index + parts[0].length)))
	    )
	  }

	  var subparts = str.split('.');
	  if (subparts.length === 1) {
	    return ['"' + escapeStr(str) + '"']
	  }

	  var result = [];
	  for (var i = 0; i < subparts.length; ++i) {
	    result = result.concat(splitParts(subparts[i]));
	  }
	  return result
	}

	function toAccessorString (str) {
	  return '[' + splitParts(str).join('][') + ']'
	}

	function defineDynamic (type, data) {
	  return new DynamicVariable(type, toAccessorString(data + ''))
	}

	function isDynamic (x) {
	  return (typeof x === 'function' && !x._reglType) || (x instanceof DynamicVariable)
	}

	function unbox (x, path) {
	  if (typeof x === 'function') {
	    return new DynamicVariable(DYN_FUNC, x)
	  } else if (typeof x === 'number' || typeof x === 'boolean') {
	    return new DynamicVariable(DYN_CONSTANT, x)
	  } else if (Array.isArray(x)) {
	    return new DynamicVariable(DYN_ARRAY, x.map(function (y, i) { return unbox(y, path + '[' + i + ']') }))
	  } else if (x instanceof DynamicVariable) {
	    return x
	  }
	  check$1(false, 'invalid option type in uniform ' + path);
	}

	var dynamic = {
	  DynamicVariable: DynamicVariable,
	  define: defineDynamic,
	  isDynamic: isDynamic,
	  unbox: unbox,
	  accessor: toAccessorString
	};

	/* globals requestAnimationFrame, cancelAnimationFrame */
	var raf = {
	  next: typeof requestAnimationFrame === 'function'
	    ? function (cb) { return requestAnimationFrame(cb) }
	    : function (cb) { return setTimeout(cb, 16) },
	  cancel: typeof cancelAnimationFrame === 'function'
	    ? function (raf) { return cancelAnimationFrame(raf) }
	    : clearTimeout
	};

	/* globals performance */
	var clock = (typeof performance !== 'undefined' && performance.now)
	    ? function () { return performance.now() }
	    : function () { return +(new Date()) };

	function createStringStore () {
	  var stringIds = { '': 0 };
	  var stringValues = [''];
	  return {
	    id: function (str) {
	      var result = stringIds[str];
	      if (result) {
	        return result
	      }
	      result = stringIds[str] = stringValues.length;
	      stringValues.push(str);
	      return result
	    },

	    str: function (id) {
	      return stringValues[id]
	    }
	  }
	}

	// Context and canvas creation helper functions
	function createCanvas (element, onDone, pixelRatio) {
	  var canvas = document.createElement('canvas');
	  extend(canvas.style, {
	    border: 0,
	    margin: 0,
	    padding: 0,
	    top: 0,
	    left: 0,
	    width: '100%',
	    height: '100%'
	  });
	  element.appendChild(canvas);

	  if (element === document.body) {
	    canvas.style.position = 'absolute';
	    extend(element.style, {
	      margin: 0,
	      padding: 0
	    });
	  }

	  function resize () {
	    var w = window.innerWidth;
	    var h = window.innerHeight;
	    if (element !== document.body) {
	      var bounds = canvas.getBoundingClientRect();
	      w = bounds.right - bounds.left;
	      h = bounds.bottom - bounds.top;
	    }
	    canvas.width = pixelRatio * w;
	    canvas.height = pixelRatio * h;
	  }

	  var resizeObserver;
	  if (element !== document.body && typeof ResizeObserver === 'function') {
	    // ignore 'ResizeObserver' is not defined
	    // eslint-disable-next-line
	    resizeObserver = new ResizeObserver(function () {
	      // setTimeout to avoid flicker
	      setTimeout(resize);
	    });
	    resizeObserver.observe(element);
	  } else {
	    window.addEventListener('resize', resize, false);
	  }

	  function onDestroy () {
	    if (resizeObserver) {
	      resizeObserver.disconnect();
	    } else {
	      window.removeEventListener('resize', resize);
	    }
	    element.removeChild(canvas);
	  }

	  resize();

	  return {
	    canvas: canvas,
	    onDestroy: onDestroy
	  }
	}

	function createContext (canvas, contextAttributes) {
	  function get (name) {
	    try {
	      return canvas.getContext(name, contextAttributes)
	    } catch (e) {
	      return null
	    }
	  }
	  return (
	    get('webgl') ||
	    get('experimental-webgl') ||
	    get('webgl-experimental')
	  )
	}

	function isHTMLElement (obj) {
	  return (
	    typeof obj.nodeName === 'string' &&
	    typeof obj.appendChild === 'function' &&
	    typeof obj.getBoundingClientRect === 'function'
	  )
	}

	function isWebGLContext (obj) {
	  return (
	    typeof obj.drawArrays === 'function' ||
	    typeof obj.drawElements === 'function'
	  )
	}

	function parseExtensions (input) {
	  if (typeof input === 'string') {
	    return input.split()
	  }
	  check$1(Array.isArray(input), 'invalid extension array');
	  return input
	}

	function getElement (desc) {
	  if (typeof desc === 'string') {
	    check$1(typeof document !== 'undefined', 'not supported outside of DOM');
	    return document.querySelector(desc)
	  }
	  return desc
	}

	function parseArgs (args_) {
	  var args = args_ || {};
	  var element, container, canvas, gl;
	  var contextAttributes = {};
	  var extensions = [];
	  var optionalExtensions = [];
	  var pixelRatio = (typeof window === 'undefined' ? 1 : window.devicePixelRatio);
	  var profile = false;
	  var onDone = function (err) {
	    if (err) {
	      check$1.raise(err);
	    }
	  };
	  var onDestroy = function () {};
	  if (typeof args === 'string') {
	    check$1(
	      typeof document !== 'undefined',
	      'selector queries only supported in DOM enviroments');
	    element = document.querySelector(args);
	    check$1(element, 'invalid query string for element');
	  } else if (typeof args === 'object') {
	    if (isHTMLElement(args)) {
	      element = args;
	    } else if (isWebGLContext(args)) {
	      gl = args;
	      canvas = gl.canvas;
	    } else {
	      check$1.constructor(args);
	      if ('gl' in args) {
	        gl = args.gl;
	      } else if ('canvas' in args) {
	        canvas = getElement(args.canvas);
	      } else if ('container' in args) {
	        container = getElement(args.container);
	      }
	      if ('attributes' in args) {
	        contextAttributes = args.attributes;
	        check$1.type(contextAttributes, 'object', 'invalid context attributes');
	      }
	      if ('extensions' in args) {
	        extensions = parseExtensions(args.extensions);
	      }
	      if ('optionalExtensions' in args) {
	        optionalExtensions = parseExtensions(args.optionalExtensions);
	      }
	      if ('onDone' in args) {
	        check$1.type(
	          args.onDone, 'function',
	          'invalid or missing onDone callback');
	        onDone = args.onDone;
	      }
	      if ('profile' in args) {
	        profile = !!args.profile;
	      }
	      if ('pixelRatio' in args) {
	        pixelRatio = +args.pixelRatio;
	        check$1(pixelRatio > 0, 'invalid pixel ratio');
	      }
	    }
	  } else {
	    check$1.raise('invalid arguments to regl');
	  }

	  if (element) {
	    if (element.nodeName.toLowerCase() === 'canvas') {
	      canvas = element;
	    } else {
	      container = element;
	    }
	  }

	  if (!gl) {
	    if (!canvas) {
	      check$1(
	        typeof document !== 'undefined',
	        'must manually specify webgl context outside of DOM environments');
	      var result = createCanvas(container || document.body, onDone, pixelRatio);
	      if (!result) {
	        return null
	      }
	      canvas = result.canvas;
	      onDestroy = result.onDestroy;
	    }
	    // workaround for chromium bug, premultiplied alpha value is platform dependent
	    if (contextAttributes.premultipliedAlpha === undefined) contextAttributes.premultipliedAlpha = true;
	    gl = createContext(canvas, contextAttributes);
	  }

	  if (!gl) {
	    onDestroy();
	    onDone('webgl not supported, try upgrading your browser or graphics drivers http://get.webgl.org');
	    return null
	  }

	  return {
	    gl: gl,
	    canvas: canvas,
	    container: container,
	    extensions: extensions,
	    optionalExtensions: optionalExtensions,
	    pixelRatio: pixelRatio,
	    profile: profile,
	    onDone: onDone,
	    onDestroy: onDestroy
	  }
	}

	function createExtensionCache (gl, config) {
	  var extensions = {};

	  function tryLoadExtension (name_) {
	    check$1.type(name_, 'string', 'extension name must be string');
	    var name = name_.toLowerCase();
	    var ext;
	    try {
	      ext = extensions[name] = gl.getExtension(name);
	    } catch (e) {}
	    return !!ext
	  }

	  for (var i = 0; i < config.extensions.length; ++i) {
	    var name = config.extensions[i];
	    if (!tryLoadExtension(name)) {
	      config.onDestroy();
	      config.onDone('"' + name + '" extension is not supported by the current WebGL context, try upgrading your system or a different browser');
	      return null
	    }
	  }

	  config.optionalExtensions.forEach(tryLoadExtension);

	  return {
	    extensions: extensions,
	    restore: function () {
	      Object.keys(extensions).forEach(function (name) {
	        if (extensions[name] && !tryLoadExtension(name)) {
	          throw new Error('(regl): error restoring extension ' + name)
	        }
	      });
	    }
	  }
	}

	function loop (n, f) {
	  var result = Array(n);
	  for (var i = 0; i < n; ++i) {
	    result[i] = f(i);
	  }
	  return result
	}

	var GL_BYTE$1 = 5120;
	var GL_UNSIGNED_BYTE$2 = 5121;
	var GL_SHORT$1 = 5122;
	var GL_UNSIGNED_SHORT$1 = 5123;
	var GL_INT$1 = 5124;
	var GL_UNSIGNED_INT$1 = 5125;
	var GL_FLOAT$2 = 5126;

	function nextPow16 (v) {
	  for (var i = 16; i <= (1 << 28); i *= 16) {
	    if (v <= i) {
	      return i
	    }
	  }
	  return 0
	}

	function log2 (v) {
	  var r, shift;
	  r = (v > 0xFFFF) << 4;
	  v >>>= r;
	  shift = (v > 0xFF) << 3;
	  v >>>= shift; r |= shift;
	  shift = (v > 0xF) << 2;
	  v >>>= shift; r |= shift;
	  shift = (v > 0x3) << 1;
	  v >>>= shift; r |= shift;
	  return r | (v >> 1)
	}

	function createPool () {
	  var bufferPool = loop(8, function () {
	    return []
	  });

	  function alloc (n) {
	    var sz = nextPow16(n);
	    var bin = bufferPool[log2(sz) >> 2];
	    if (bin.length > 0) {
	      return bin.pop()
	    }
	    return new ArrayBuffer(sz)
	  }

	  function free (buf) {
	    bufferPool[log2(buf.byteLength) >> 2].push(buf);
	  }

	  function allocType (type, n) {
	    var result = null;
	    switch (type) {
	      case GL_BYTE$1:
	        result = new Int8Array(alloc(n), 0, n);
	        break
	      case GL_UNSIGNED_BYTE$2:
	        result = new Uint8Array(alloc(n), 0, n);
	        break
	      case GL_SHORT$1:
	        result = new Int16Array(alloc(2 * n), 0, n);
	        break
	      case GL_UNSIGNED_SHORT$1:
	        result = new Uint16Array(alloc(2 * n), 0, n);
	        break
	      case GL_INT$1:
	        result = new Int32Array(alloc(4 * n), 0, n);
	        break
	      case GL_UNSIGNED_INT$1:
	        result = new Uint32Array(alloc(4 * n), 0, n);
	        break
	      case GL_FLOAT$2:
	        result = new Float32Array(alloc(4 * n), 0, n);
	        break
	      default:
	        return null
	    }
	    if (result.length !== n) {
	      return result.subarray(0, n)
	    }
	    return result
	  }

	  function freeType (array) {
	    free(array.buffer);
	  }

	  return {
	    alloc: alloc,
	    free: free,
	    allocType: allocType,
	    freeType: freeType
	  }
	}

	var pool = createPool();

	// zero pool for initial zero data
	pool.zero = createPool();

	var GL_SUBPIXEL_BITS = 0x0D50;
	var GL_RED_BITS = 0x0D52;
	var GL_GREEN_BITS = 0x0D53;
	var GL_BLUE_BITS = 0x0D54;
	var GL_ALPHA_BITS = 0x0D55;
	var GL_DEPTH_BITS = 0x0D56;
	var GL_STENCIL_BITS = 0x0D57;

	var GL_ALIASED_POINT_SIZE_RANGE = 0x846D;
	var GL_ALIASED_LINE_WIDTH_RANGE = 0x846E;

	var GL_MAX_TEXTURE_SIZE = 0x0D33;
	var GL_MAX_VIEWPORT_DIMS = 0x0D3A;
	var GL_MAX_VERTEX_ATTRIBS = 0x8869;
	var GL_MAX_VERTEX_UNIFORM_VECTORS = 0x8DFB;
	var GL_MAX_VARYING_VECTORS = 0x8DFC;
	var GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS = 0x8B4D;
	var GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS = 0x8B4C;
	var GL_MAX_TEXTURE_IMAGE_UNITS = 0x8872;
	var GL_MAX_FRAGMENT_UNIFORM_VECTORS = 0x8DFD;
	var GL_MAX_CUBE_MAP_TEXTURE_SIZE = 0x851C;
	var GL_MAX_RENDERBUFFER_SIZE = 0x84E8;

	var GL_VENDOR = 0x1F00;
	var GL_RENDERER = 0x1F01;
	var GL_VERSION = 0x1F02;
	var GL_SHADING_LANGUAGE_VERSION = 0x8B8C;

	var GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT = 0x84FF;

	var GL_MAX_COLOR_ATTACHMENTS_WEBGL = 0x8CDF;
	var GL_MAX_DRAW_BUFFERS_WEBGL = 0x8824;

	var GL_TEXTURE_2D = 0x0DE1;
	var GL_TEXTURE_CUBE_MAP = 0x8513;
	var GL_TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515;
	var GL_TEXTURE0 = 0x84C0;
	var GL_RGBA = 0x1908;
	var GL_FLOAT$1 = 0x1406;
	var GL_UNSIGNED_BYTE$1 = 0x1401;
	var GL_FRAMEBUFFER = 0x8D40;
	var GL_FRAMEBUFFER_COMPLETE = 0x8CD5;
	var GL_COLOR_ATTACHMENT0 = 0x8CE0;
	var GL_COLOR_BUFFER_BIT$1 = 0x4000;

	var wrapLimits = function (gl, extensions) {
	  var maxAnisotropic = 1;
	  if (extensions.ext_texture_filter_anisotropic) {
	    maxAnisotropic = gl.getParameter(GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT);
	  }

	  var maxDrawbuffers = 1;
	  var maxColorAttachments = 1;
	  if (extensions.webgl_draw_buffers) {
	    maxDrawbuffers = gl.getParameter(GL_MAX_DRAW_BUFFERS_WEBGL);
	    maxColorAttachments = gl.getParameter(GL_MAX_COLOR_ATTACHMENTS_WEBGL);
	  }

	  // detect if reading float textures is available (Safari doesn't support)
	  var readFloat = !!extensions.oes_texture_float;
	  if (readFloat) {
	    var readFloatTexture = gl.createTexture();
	    gl.bindTexture(GL_TEXTURE_2D, readFloatTexture);
	    gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 1, 1, 0, GL_RGBA, GL_FLOAT$1, null);

	    var fbo = gl.createFramebuffer();
	    gl.bindFramebuffer(GL_FRAMEBUFFER, fbo);
	    gl.framebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, readFloatTexture, 0);
	    gl.bindTexture(GL_TEXTURE_2D, null);

	    if (gl.checkFramebufferStatus(GL_FRAMEBUFFER) !== GL_FRAMEBUFFER_COMPLETE) readFloat = false;

	    else {
	      gl.viewport(0, 0, 1, 1);
	      gl.clearColor(1.0, 0.0, 0.0, 1.0);
	      gl.clear(GL_COLOR_BUFFER_BIT$1);
	      var pixels = pool.allocType(GL_FLOAT$1, 4);
	      gl.readPixels(0, 0, 1, 1, GL_RGBA, GL_FLOAT$1, pixels);

	      if (gl.getError()) readFloat = false;
	      else {
	        gl.deleteFramebuffer(fbo);
	        gl.deleteTexture(readFloatTexture);

	        readFloat = pixels[0] === 1.0;
	      }

	      pool.freeType(pixels);
	    }
	  }

	  // detect non power of two cube textures support (IE doesn't support)
	  var isIE = typeof navigator !== 'undefined' && (/MSIE/.test(navigator.userAgent) || /Trident\//.test(navigator.appVersion) || /Edge/.test(navigator.userAgent));

	  var npotTextureCube = true;

	  if (!isIE) {
	    var cubeTexture = gl.createTexture();
	    var data = pool.allocType(GL_UNSIGNED_BYTE$1, 36);
	    gl.activeTexture(GL_TEXTURE0);
	    gl.bindTexture(GL_TEXTURE_CUBE_MAP, cubeTexture);
	    gl.texImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X, 0, GL_RGBA, 3, 3, 0, GL_RGBA, GL_UNSIGNED_BYTE$1, data);
	    pool.freeType(data);
	    gl.bindTexture(GL_TEXTURE_CUBE_MAP, null);
	    gl.deleteTexture(cubeTexture);
	    npotTextureCube = !gl.getError();
	  }

	  return {
	    // drawing buffer bit depth
	    colorBits: [
	      gl.getParameter(GL_RED_BITS),
	      gl.getParameter(GL_GREEN_BITS),
	      gl.getParameter(GL_BLUE_BITS),
	      gl.getParameter(GL_ALPHA_BITS)
	    ],
	    depthBits: gl.getParameter(GL_DEPTH_BITS),
	    stencilBits: gl.getParameter(GL_STENCIL_BITS),
	    subpixelBits: gl.getParameter(GL_SUBPIXEL_BITS),

	    // supported extensions
	    extensions: Object.keys(extensions).filter(function (ext) {
	      return !!extensions[ext]
	    }),

	    // max aniso samples
	    maxAnisotropic: maxAnisotropic,

	    // max draw buffers
	    maxDrawbuffers: maxDrawbuffers,
	    maxColorAttachments: maxColorAttachments,

	    // point and line size ranges
	    pointSizeDims: gl.getParameter(GL_ALIASED_POINT_SIZE_RANGE),
	    lineWidthDims: gl.getParameter(GL_ALIASED_LINE_WIDTH_RANGE),
	    maxViewportDims: gl.getParameter(GL_MAX_VIEWPORT_DIMS),
	    maxCombinedTextureUnits: gl.getParameter(GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS),
	    maxCubeMapSize: gl.getParameter(GL_MAX_CUBE_MAP_TEXTURE_SIZE),
	    maxRenderbufferSize: gl.getParameter(GL_MAX_RENDERBUFFER_SIZE),
	    maxTextureUnits: gl.getParameter(GL_MAX_TEXTURE_IMAGE_UNITS),
	    maxTextureSize: gl.getParameter(GL_MAX_TEXTURE_SIZE),
	    maxAttributes: gl.getParameter(GL_MAX_VERTEX_ATTRIBS),
	    maxVertexUniforms: gl.getParameter(GL_MAX_VERTEX_UNIFORM_VECTORS),
	    maxVertexTextureUnits: gl.getParameter(GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS),
	    maxVaryingVectors: gl.getParameter(GL_MAX_VARYING_VECTORS),
	    maxFragmentUniforms: gl.getParameter(GL_MAX_FRAGMENT_UNIFORM_VECTORS),

	    // vendor info
	    glsl: gl.getParameter(GL_SHADING_LANGUAGE_VERSION),
	    renderer: gl.getParameter(GL_RENDERER),
	    vendor: gl.getParameter(GL_VENDOR),
	    version: gl.getParameter(GL_VERSION),

	    // quirks
	    readFloat: readFloat,
	    npotTextureCube: npotTextureCube
	  }
	};

	function isNDArrayLike (obj) {
	  return (
	    !!obj &&
	    typeof obj === 'object' &&
	    Array.isArray(obj.shape) &&
	    Array.isArray(obj.stride) &&
	    typeof obj.offset === 'number' &&
	    obj.shape.length === obj.stride.length &&
	    (Array.isArray(obj.data) ||
	      isTypedArray(obj.data)))
	}

	var values = function (obj) {
	  return Object.keys(obj).map(function (key) { return obj[key] })
	};

	var flattenUtils = {
	  shape: arrayShape$1,
	  flatten: flattenArray
	};

	function flatten1D (array, nx, out) {
	  for (var i = 0; i < nx; ++i) {
	    out[i] = array[i];
	  }
	}

	function flatten2D (array, nx, ny, out) {
	  var ptr = 0;
	  for (var i = 0; i < nx; ++i) {
	    var row = array[i];
	    for (var j = 0; j < ny; ++j) {
	      out[ptr++] = row[j];
	    }
	  }
	}

	function flatten3D (array, nx, ny, nz, out, ptr_) {
	  var ptr = ptr_;
	  for (var i = 0; i < nx; ++i) {
	    var row = array[i];
	    for (var j = 0; j < ny; ++j) {
	      var col = row[j];
	      for (var k = 0; k < nz; ++k) {
	        out[ptr++] = col[k];
	      }
	    }
	  }
	}

	function flattenRec (array, shape, level, out, ptr) {
	  var stride = 1;
	  for (var i = level + 1; i < shape.length; ++i) {
	    stride *= shape[i];
	  }
	  var n = shape[level];
	  if (shape.length - level === 4) {
	    var nx = shape[level + 1];
	    var ny = shape[level + 2];
	    var nz = shape[level + 3];
	    for (i = 0; i < n; ++i) {
	      flatten3D(array[i], nx, ny, nz, out, ptr);
	      ptr += stride;
	    }
	  } else {
	    for (i = 0; i < n; ++i) {
	      flattenRec(array[i], shape, level + 1, out, ptr);
	      ptr += stride;
	    }
	  }
	}

	function flattenArray (array, shape, type, out_) {
	  var sz = 1;
	  if (shape.length) {
	    for (var i = 0; i < shape.length; ++i) {
	      sz *= shape[i];
	    }
	  } else {
	    sz = 0;
	  }
	  var out = out_ || pool.allocType(type, sz);
	  switch (shape.length) {
	    case 0:
	      break
	    case 1:
	      flatten1D(array, shape[0], out);
	      break
	    case 2:
	      flatten2D(array, shape[0], shape[1], out);
	      break
	    case 3:
	      flatten3D(array, shape[0], shape[1], shape[2], out, 0);
	      break
	    default:
	      flattenRec(array, shape, 0, out, 0);
	  }
	  return out
	}

	function arrayShape$1 (array_) {
	  var shape = [];
	  for (var array = array_; array.length; array = array[0]) {
	    shape.push(array.length);
	  }
	  return shape
	}

	var arrayTypes =  {
		"[object Int8Array]": 5120,
		"[object Int16Array]": 5122,
		"[object Int32Array]": 5124,
		"[object Uint8Array]": 5121,
		"[object Uint8ClampedArray]": 5121,
		"[object Uint16Array]": 5123,
		"[object Uint32Array]": 5125,
		"[object Float32Array]": 5126,
		"[object Float64Array]": 5121,
		"[object ArrayBuffer]": 5121
	};

	var int8 = 5120;
	var int16 = 5122;
	var int32 = 5124;
	var uint8 = 5121;
	var uint16 = 5123;
	var uint32 = 5125;
	var float = 5126;
	var float32 = 5126;
	var glTypes = {
		int8: int8,
		int16: int16,
		int32: int32,
		uint8: uint8,
		uint16: uint16,
		uint32: uint32,
		float: float,
		float32: float32
	};

	var dynamic$1 = 35048;
	var stream = 35040;
	var usageTypes = {
		dynamic: dynamic$1,
		stream: stream,
		"static": 35044
	};

	var arrayFlatten = flattenUtils.flatten;
	var arrayShape = flattenUtils.shape;

	var GL_STATIC_DRAW = 0x88E4;
	var GL_STREAM_DRAW = 0x88E0;

	var GL_UNSIGNED_BYTE$3 = 5121;
	var GL_FLOAT$3 = 5126;

	var DTYPES_SIZES = [];
	DTYPES_SIZES[5120] = 1; // int8
	DTYPES_SIZES[5122] = 2; // int16
	DTYPES_SIZES[5124] = 4; // int32
	DTYPES_SIZES[5121] = 1; // uint8
	DTYPES_SIZES[5123] = 2; // uint16
	DTYPES_SIZES[5125] = 4; // uint32
	DTYPES_SIZES[5126] = 4; // float32

	function typedArrayCode (data) {
	  return arrayTypes[Object.prototype.toString.call(data)] | 0
	}

	function copyArray (out, inp) {
	  for (var i = 0; i < inp.length; ++i) {
	    out[i] = inp[i];
	  }
	}

	function transpose (
	  result, data, shapeX, shapeY, strideX, strideY, offset) {
	  var ptr = 0;
	  for (var i = 0; i < shapeX; ++i) {
	    for (var j = 0; j < shapeY; ++j) {
	      result[ptr++] = data[strideX * i + strideY * j + offset];
	    }
	  }
	}

	function wrapBufferState (gl, stats, config, destroyBuffer) {
	  var bufferCount = 0;
	  var bufferSet = {};

	  function REGLBuffer (type) {
	    this.id = bufferCount++;
	    this.buffer = gl.createBuffer();
	    this.type = type;
	    this.usage = GL_STATIC_DRAW;
	    this.byteLength = 0;
	    this.dimension = 1;
	    this.dtype = GL_UNSIGNED_BYTE$3;

	    this.persistentData = null;

	    if (config.profile) {
	      this.stats = { size: 0 };
	    }
	  }

	  REGLBuffer.prototype.bind = function () {
	    gl.bindBuffer(this.type, this.buffer);
	  };

	  REGLBuffer.prototype.destroy = function () {
	    destroy(this);
	  };

	  var streamPool = [];

	  function createStream (type, data) {
	    var buffer = streamPool.pop();
	    if (!buffer) {
	      buffer = new REGLBuffer(type);
	    }
	    buffer.bind();
	    initBufferFromData(buffer, data, GL_STREAM_DRAW, 0, 1, false);
	    return buffer
	  }

	  function destroyStream (stream$$1) {
	    streamPool.push(stream$$1);
	  }

	  function initBufferFromTypedArray (buffer, data, usage) {
	    buffer.byteLength = data.byteLength;
	    gl.bufferData(buffer.type, data, usage);
	  }

	  function initBufferFromData (buffer, data, usage, dtype, dimension, persist) {
	    var shape;
	    buffer.usage = usage;
	    if (Array.isArray(data)) {
	      buffer.dtype = dtype || GL_FLOAT$3;
	      if (data.length > 0) {
	        var flatData;
	        if (Array.isArray(data[0])) {
	          shape = arrayShape(data);
	          var dim = 1;
	          for (var i = 1; i < shape.length; ++i) {
	            dim *= shape[i];
	          }
	          buffer.dimension = dim;
	          flatData = arrayFlatten(data, shape, buffer.dtype);
	          initBufferFromTypedArray(buffer, flatData, usage);
	          if (persist) {
	            buffer.persistentData = flatData;
	          } else {
	            pool.freeType(flatData);
	          }
	        } else if (typeof data[0] === 'number') {
	          buffer.dimension = dimension;
	          var typedData = pool.allocType(buffer.dtype, data.length);
	          copyArray(typedData, data);
	          initBufferFromTypedArray(buffer, typedData, usage);
	          if (persist) {
	            buffer.persistentData = typedData;
	          } else {
	            pool.freeType(typedData);
	          }
	        } else if (isTypedArray(data[0])) {
	          buffer.dimension = data[0].length;
	          buffer.dtype = dtype || typedArrayCode(data[0]) || GL_FLOAT$3;
	          flatData = arrayFlatten(
	            data,
	            [data.length, data[0].length],
	            buffer.dtype);
	          initBufferFromTypedArray(buffer, flatData, usage);
	          if (persist) {
	            buffer.persistentData = flatData;
	          } else {
	            pool.freeType(flatData);
	          }
	        } else {
	          check$1.raise('invalid buffer data');
	        }
	      }
	    } else if (isTypedArray(data)) {
	      buffer.dtype = dtype || typedArrayCode(data);
	      buffer.dimension = dimension;
	      initBufferFromTypedArray(buffer, data, usage);
	      if (persist) {
	        buffer.persistentData = new Uint8Array(new Uint8Array(data.buffer));
	      }
	    } else if (isNDArrayLike(data)) {
	      shape = data.shape;
	      var stride = data.stride;
	      var offset = data.offset;

	      var shapeX = 0;
	      var shapeY = 0;
	      var strideX = 0;
	      var strideY = 0;
	      if (shape.length === 1) {
	        shapeX = shape[0];
	        shapeY = 1;
	        strideX = stride[0];
	        strideY = 0;
	      } else if (shape.length === 2) {
	        shapeX = shape[0];
	        shapeY = shape[1];
	        strideX = stride[0];
	        strideY = stride[1];
	      } else {
	        check$1.raise('invalid shape');
	      }

	      buffer.dtype = dtype || typedArrayCode(data.data) || GL_FLOAT$3;
	      buffer.dimension = shapeY;

	      var transposeData = pool.allocType(buffer.dtype, shapeX * shapeY);
	      transpose(transposeData,
	        data.data,
	        shapeX, shapeY,
	        strideX, strideY,
	        offset);
	      initBufferFromTypedArray(buffer, transposeData, usage);
	      if (persist) {
	        buffer.persistentData = transposeData;
	      } else {
	        pool.freeType(transposeData);
	      }
	    } else if (data instanceof ArrayBuffer) {
	      buffer.dtype = GL_UNSIGNED_BYTE$3;
	      buffer.dimension = dimension;
	      initBufferFromTypedArray(buffer, data, usage);
	      if (persist) {
	        buffer.persistentData = new Uint8Array(new Uint8Array(data));
	      }
	    } else {
	      check$1.raise('invalid buffer data');
	    }
	  }

	  function destroy (buffer) {
	    stats.bufferCount--;

	    // remove attribute link
	    destroyBuffer(buffer);

	    var handle = buffer.buffer;
	    check$1(handle, 'buffer must not be deleted already');
	    gl.deleteBuffer(handle);
	    buffer.buffer = null;
	    delete bufferSet[buffer.id];
	  }

	  function createBuffer (options, type, deferInit, persistent) {
	    stats.bufferCount++;

	    var buffer = new REGLBuffer(type);
	    bufferSet[buffer.id] = buffer;

	    function reglBuffer (options) {
	      var usage = GL_STATIC_DRAW;
	      var data = null;
	      var byteLength = 0;
	      var dtype = 0;
	      var dimension = 1;
	      if (Array.isArray(options) ||
	          isTypedArray(options) ||
	          isNDArrayLike(options) ||
	          options instanceof ArrayBuffer) {
	        data = options;
	      } else if (typeof options === 'number') {
	        byteLength = options | 0;
	      } else if (options) {
	        check$1.type(
	          options, 'object',
	          'buffer arguments must be an object, a number or an array');

	        if ('data' in options) {
	          check$1(
	            data === null ||
	            Array.isArray(data) ||
	            isTypedArray(data) ||
	            isNDArrayLike(data),
	            'invalid data for buffer');
	          data = options.data;
	        }

	        if ('usage' in options) {
	          check$1.parameter(options.usage, usageTypes, 'invalid buffer usage');
	          usage = usageTypes[options.usage];
	        }

	        if ('type' in options) {
	          check$1.parameter(options.type, glTypes, 'invalid buffer type');
	          dtype = glTypes[options.type];
	        }

	        if ('dimension' in options) {
	          check$1.type(options.dimension, 'number', 'invalid dimension');
	          dimension = options.dimension | 0;
	        }

	        if ('length' in options) {
	          check$1.nni(byteLength, 'buffer length must be a nonnegative integer');
	          byteLength = options.length | 0;
	        }
	      }

	      buffer.bind();
	      if (!data) {
	        // #475
	        if (byteLength) gl.bufferData(buffer.type, byteLength, usage);
	        buffer.dtype = dtype || GL_UNSIGNED_BYTE$3;
	        buffer.usage = usage;
	        buffer.dimension = dimension;
	        buffer.byteLength = byteLength;
	      } else {
	        initBufferFromData(buffer, data, usage, dtype, dimension, persistent);
	      }

	      if (config.profile) {
	        buffer.stats.size = buffer.byteLength * DTYPES_SIZES[buffer.dtype];
	      }

	      return reglBuffer
	    }

	    function setSubData (data, offset) {
	      check$1(offset + data.byteLength <= buffer.byteLength,
	        'invalid buffer subdata call, buffer is too small. ' + ' Can\'t write data of size ' + data.byteLength + ' starting from offset ' + offset + ' to a buffer of size ' + buffer.byteLength);

	      gl.bufferSubData(buffer.type, offset, data);
	    }

	    function subdata (data, offset_) {
	      var offset = (offset_ || 0) | 0;
	      var shape;
	      buffer.bind();
	      if (isTypedArray(data) || data instanceof ArrayBuffer) {
	        setSubData(data, offset);
	      } else if (Array.isArray(data)) {
	        if (data.length > 0) {
	          if (typeof data[0] === 'number') {
	            var converted = pool.allocType(buffer.dtype, data.length);
	            copyArray(converted, data);
	            setSubData(converted, offset);
	            pool.freeType(converted);
	          } else if (Array.isArray(data[0]) || isTypedArray(data[0])) {
	            shape = arrayShape(data);
	            var flatData = arrayFlatten(data, shape, buffer.dtype);
	            setSubData(flatData, offset);
	            pool.freeType(flatData);
	          } else {
	            check$1.raise('invalid buffer data');
	          }
	        }
	      } else if (isNDArrayLike(data)) {
	        shape = data.shape;
	        var stride = data.stride;

	        var shapeX = 0;
	        var shapeY = 0;
	        var strideX = 0;
	        var strideY = 0;
	        if (shape.length === 1) {
	          shapeX = shape[0];
	          shapeY = 1;
	          strideX = stride[0];
	          strideY = 0;
	        } else if (shape.length === 2) {
	          shapeX = shape[0];
	          shapeY = shape[1];
	          strideX = stride[0];
	          strideY = stride[1];
	        } else {
	          check$1.raise('invalid shape');
	        }
	        var dtype = Array.isArray(data.data)
	          ? buffer.dtype
	          : typedArrayCode(data.data);

	        var transposeData = pool.allocType(dtype, shapeX * shapeY);
	        transpose(transposeData,
	          data.data,
	          shapeX, shapeY,
	          strideX, strideY,
	          data.offset);
	        setSubData(transposeData, offset);
	        pool.freeType(transposeData);
	      } else {
	        check$1.raise('invalid data for buffer subdata');
	      }
	      return reglBuffer
	    }

	    if (!deferInit) {
	      reglBuffer(options);
	    }

	    reglBuffer._reglType = 'buffer';
	    reglBuffer._buffer = buffer;
	    reglBuffer.subdata = subdata;
	    if (config.profile) {
	      reglBuffer.stats = buffer.stats;
	    }
	    reglBuffer.destroy = function () { destroy(buffer); };

	    return reglBuffer
	  }

	  function restoreBuffers () {
	    values(bufferSet).forEach(function (buffer) {
	      buffer.buffer = gl.createBuffer();
	      gl.bindBuffer(buffer.type, buffer.buffer);
	      gl.bufferData(
	        buffer.type, buffer.persistentData || buffer.byteLength, buffer.usage);
	    });
	  }

	  if (config.profile) {
	    stats.getTotalBufferSize = function () {
	      var total = 0;
	      // TODO: Right now, the streams are not part of the total count.
	      Object.keys(bufferSet).forEach(function (key) {
	        total += bufferSet[key].stats.size;
	      });
	      return total
	    };
	  }

	  return {
	    create: createBuffer,

	    createStream: createStream,
	    destroyStream: destroyStream,

	    clear: function () {
	      values(bufferSet).forEach(destroy);
	      streamPool.forEach(destroy);
	    },

	    getBuffer: function (wrapper) {
	      if (wrapper && wrapper._buffer instanceof REGLBuffer) {
	        return wrapper._buffer
	      }
	      return null
	    },

	    restore: restoreBuffers,

	    _initBuffer: initBufferFromData
	  }
	}

	var points = 0;
	var point = 0;
	var lines = 1;
	var line = 1;
	var triangles = 4;
	var triangle = 4;
	var primTypes = {
		points: points,
		point: point,
		lines: lines,
		line: line,
		triangles: triangles,
		triangle: triangle,
		"line loop": 2,
		"line strip": 3,
		"triangle strip": 5,
		"triangle fan": 6
	};

	var GL_POINTS = 0;
	var GL_LINES = 1;
	var GL_TRIANGLES = 4;

	var GL_BYTE$2 = 5120;
	var GL_UNSIGNED_BYTE$4 = 5121;
	var GL_SHORT$2 = 5122;
	var GL_UNSIGNED_SHORT$2 = 5123;
	var GL_INT$2 = 5124;
	var GL_UNSIGNED_INT$2 = 5125;

	var GL_ELEMENT_ARRAY_BUFFER = 34963;

	var GL_STREAM_DRAW$1 = 0x88E0;
	var GL_STATIC_DRAW$1 = 0x88E4;

	function wrapElementsState (gl, extensions, bufferState, stats) {
	  var elementSet = {};
	  var elementCount = 0;

	  var elementTypes = {
	    'uint8': GL_UNSIGNED_BYTE$4,
	    'uint16': GL_UNSIGNED_SHORT$2
	  };

	  if (extensions.oes_element_index_uint) {
	    elementTypes.uint32 = GL_UNSIGNED_INT$2;
	  }

	  function REGLElementBuffer (buffer) {
	    this.id = elementCount++;
	    elementSet[this.id] = this;
	    this.buffer = buffer;
	    this.primType = GL_TRIANGLES;
	    this.vertCount = 0;
	    this.type = 0;
	  }

	  REGLElementBuffer.prototype.bind = function () {
	    this.buffer.bind();
	  };

	  var bufferPool = [];

	  function createElementStream (data) {
	    var result = bufferPool.pop();
	    if (!result) {
	      result = new REGLElementBuffer(bufferState.create(
	        null,
	        GL_ELEMENT_ARRAY_BUFFER,
	        true,
	        false)._buffer);
	    }
	    initElements(result, data, GL_STREAM_DRAW$1, -1, -1, 0, 0);
	    return result
	  }

	  function destroyElementStream (elements) {
	    bufferPool.push(elements);
	  }

	  function initElements (
	    elements,
	    data,
	    usage,
	    prim,
	    count,
	    byteLength,
	    type) {
	    elements.buffer.bind();
	    var dtype;
	    if (data) {
	      var predictedType = type;
	      if (!type && (
	        !isTypedArray(data) ||
	         (isNDArrayLike(data) && !isTypedArray(data.data)))) {
	        predictedType = extensions.oes_element_index_uint
	          ? GL_UNSIGNED_INT$2
	          : GL_UNSIGNED_SHORT$2;
	      }
	      bufferState._initBuffer(
	        elements.buffer,
	        data,
	        usage,
	        predictedType,
	        3);
	    } else {
	      gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, byteLength, usage);
	      elements.buffer.dtype = dtype || GL_UNSIGNED_BYTE$4;
	      elements.buffer.usage = usage;
	      elements.buffer.dimension = 3;
	      elements.buffer.byteLength = byteLength;
	    }

	    dtype = type;
	    if (!type) {
	      switch (elements.buffer.dtype) {
	        case GL_UNSIGNED_BYTE$4:
	        case GL_BYTE$2:
	          dtype = GL_UNSIGNED_BYTE$4;
	          break

	        case GL_UNSIGNED_SHORT$2:
	        case GL_SHORT$2:
	          dtype = GL_UNSIGNED_SHORT$2;
	          break

	        case GL_UNSIGNED_INT$2:
	        case GL_INT$2:
	          dtype = GL_UNSIGNED_INT$2;
	          break

	        default:
	          check$1.raise('unsupported type for element array');
	      }
	      elements.buffer.dtype = dtype;
	    }
	    elements.type = dtype;

	    // Check oes_element_index_uint extension
	    check$1(
	      dtype !== GL_UNSIGNED_INT$2 ||
	      !!extensions.oes_element_index_uint,
	      '32 bit element buffers not supported, enable oes_element_index_uint first');

	    // try to guess default primitive type and arguments
	    var vertCount = count;
	    if (vertCount < 0) {
	      vertCount = elements.buffer.byteLength;
	      if (dtype === GL_UNSIGNED_SHORT$2) {
	        vertCount >>= 1;
	      } else if (dtype === GL_UNSIGNED_INT$2) {
	        vertCount >>= 2;
	      }
	    }
	    elements.vertCount = vertCount;

	    // try to guess primitive type from cell dimension
	    var primType = prim;
	    if (prim < 0) {
	      primType = GL_TRIANGLES;
	      var dimension = elements.buffer.dimension;
	      if (dimension === 1) primType = GL_POINTS;
	      if (dimension === 2) primType = GL_LINES;
	      if (dimension === 3) primType = GL_TRIANGLES;
	    }
	    elements.primType = primType;
	  }

	  function destroyElements (elements) {
	    stats.elementsCount--;

	    check$1(elements.buffer !== null, 'must not double destroy elements');
	    delete elementSet[elements.id];
	    elements.buffer.destroy();
	    elements.buffer = null;
	  }

	  function createElements (options, persistent) {
	    var buffer = bufferState.create(null, GL_ELEMENT_ARRAY_BUFFER, true);
	    var elements = new REGLElementBuffer(buffer._buffer);
	    stats.elementsCount++;

	    function reglElements (options) {
	      if (!options) {
	        buffer();
	        elements.primType = GL_TRIANGLES;
	        elements.vertCount = 0;
	        elements.type = GL_UNSIGNED_BYTE$4;
	      } else if (typeof options === 'number') {
	        buffer(options);
	        elements.primType = GL_TRIANGLES;
	        elements.vertCount = options | 0;
	        elements.type = GL_UNSIGNED_BYTE$4;
	      } else {
	        var data = null;
	        var usage = GL_STATIC_DRAW$1;
	        var primType = -1;
	        var vertCount = -1;
	        var byteLength = 0;
	        var dtype = 0;
	        if (Array.isArray(options) ||
	            isTypedArray(options) ||
	            isNDArrayLike(options)) {
	          data = options;
	        } else {
	          check$1.type(options, 'object', 'invalid arguments for elements');
	          if ('data' in options) {
	            data = options.data;
	            check$1(
	              Array.isArray(data) ||
	                isTypedArray(data) ||
	                isNDArrayLike(data),
	              'invalid data for element buffer');
	          }
	          if ('usage' in options) {
	            check$1.parameter(
	              options.usage,
	              usageTypes,
	              'invalid element buffer usage');
	            usage = usageTypes[options.usage];
	          }
	          if ('primitive' in options) {
	            check$1.parameter(
	              options.primitive,
	              primTypes,
	              'invalid element buffer primitive');
	            primType = primTypes[options.primitive];
	          }
	          if ('count' in options) {
	            check$1(
	              typeof options.count === 'number' && options.count >= 0,
	              'invalid vertex count for elements');
	            vertCount = options.count | 0;
	          }
	          if ('type' in options) {
	            check$1.parameter(
	              options.type,
	              elementTypes,
	              'invalid buffer type');
	            dtype = elementTypes[options.type];
	          }
	          if ('length' in options) {
	            byteLength = options.length | 0;
	          } else {
	            byteLength = vertCount;
	            if (dtype === GL_UNSIGNED_SHORT$2 || dtype === GL_SHORT$2) {
	              byteLength *= 2;
	            } else if (dtype === GL_UNSIGNED_INT$2 || dtype === GL_INT$2) {
	              byteLength *= 4;
	            }
	          }
	        }
	        initElements(
	          elements,
	          data,
	          usage,
	          primType,
	          vertCount,
	          byteLength,
	          dtype);
	      }

	      return reglElements
	    }

	    reglElements(options);

	    reglElements._reglType = 'elements';
	    reglElements._elements = elements;
	    reglElements.subdata = function (data, offset) {
	      buffer.subdata(data, offset);
	      return reglElements
	    };
	    reglElements.destroy = function () {
	      destroyElements(elements);
	    };

	    return reglElements
	  }

	  return {
	    create: createElements,
	    createStream: createElementStream,
	    destroyStream: destroyElementStream,
	    getElements: function (elements) {
	      if (typeof elements === 'function' &&
	          elements._elements instanceof REGLElementBuffer) {
	        return elements._elements
	      }
	      return null
	    },
	    clear: function () {
	      values(elementSet).forEach(destroyElements);
	    }
	  }
	}

	var FLOAT = new Float32Array(1);
	var INT = new Uint32Array(FLOAT.buffer);

	var GL_UNSIGNED_SHORT$4 = 5123;

	function convertToHalfFloat (array) {
	  var ushorts = pool.allocType(GL_UNSIGNED_SHORT$4, array.length);

	  for (var i = 0; i < array.length; ++i) {
	    if (isNaN(array[i])) {
	      ushorts[i] = 0xffff;
	    } else if (array[i] === Infinity) {
	      ushorts[i] = 0x7c00;
	    } else if (array[i] === -Infinity) {
	      ushorts[i] = 0xfc00;
	    } else {
	      FLOAT[0] = array[i];
	      var x = INT[0];

	      var sgn = (x >>> 31) << 15;
	      var exp = ((x << 1) >>> 24) - 127;
	      var frac = (x >> 13) & ((1 << 10) - 1);

	      if (exp < -24) {
	        // round non-representable denormals to 0
	        ushorts[i] = sgn;
	      } else if (exp < -14) {
	        // handle denormals
	        var s = -14 - exp;
	        ushorts[i] = sgn + ((frac + (1 << 10)) >> s);
	      } else if (exp > 15) {
	        // round overflow to +/- Infinity
	        ushorts[i] = sgn + 0x7c00;
	      } else {
	        // otherwise convert directly
	        ushorts[i] = sgn + ((exp + 15) << 10) + frac;
	      }
	    }
	  }

	  return ushorts
	}

	function isArrayLike (s) {
	  return Array.isArray(s) || isTypedArray(s)
	}

	var isPow2$1 = function (v) {
	  return !(v & (v - 1)) && (!!v)
	};

	var GL_COMPRESSED_TEXTURE_FORMATS = 0x86A3;

	var GL_TEXTURE_2D$1 = 0x0DE1;
	var GL_TEXTURE_CUBE_MAP$1 = 0x8513;
	var GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 = 0x8515;

	var GL_RGBA$1 = 0x1908;
	var GL_ALPHA = 0x1906;
	var GL_RGB = 0x1907;
	var GL_LUMINANCE = 0x1909;
	var GL_LUMINANCE_ALPHA = 0x190A;

	var GL_RGBA4 = 0x8056;
	var GL_RGB5_A1 = 0x8057;
	var GL_RGB565 = 0x8D62;

	var GL_UNSIGNED_SHORT_4_4_4_4$1 = 0x8033;
	var GL_UNSIGNED_SHORT_5_5_5_1$1 = 0x8034;
	var GL_UNSIGNED_SHORT_5_6_5$1 = 0x8363;
	var GL_UNSIGNED_INT_24_8_WEBGL$1 = 0x84FA;

	var GL_DEPTH_COMPONENT = 0x1902;
	var GL_DEPTH_STENCIL = 0x84F9;

	var GL_SRGB_EXT = 0x8C40;
	var GL_SRGB_ALPHA_EXT = 0x8C42;

	var GL_HALF_FLOAT_OES$1 = 0x8D61;

	var GL_COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83F0;
	var GL_COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83F1;
	var GL_COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83F2;
	var GL_COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;

	var GL_COMPRESSED_RGB_ATC_WEBGL = 0x8C92;
	var GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL = 0x8C93;
	var GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL = 0x87EE;

	var GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8C00;
	var GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG = 0x8C01;
	var GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;
	var GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 0x8C03;

	var GL_COMPRESSED_RGB_ETC1_WEBGL = 0x8D64;

	var GL_UNSIGNED_BYTE$5 = 0x1401;
	var GL_UNSIGNED_SHORT$3 = 0x1403;
	var GL_UNSIGNED_INT$3 = 0x1405;
	var GL_FLOAT$4 = 0x1406;

	var GL_TEXTURE_WRAP_S = 0x2802;
	var GL_TEXTURE_WRAP_T = 0x2803;

	var GL_REPEAT = 0x2901;
	var GL_CLAMP_TO_EDGE$1 = 0x812F;
	var GL_MIRRORED_REPEAT = 0x8370;

	var GL_TEXTURE_MAG_FILTER = 0x2800;
	var GL_TEXTURE_MIN_FILTER = 0x2801;

	var GL_NEAREST$1 = 0x2600;
	var GL_LINEAR = 0x2601;
	var GL_NEAREST_MIPMAP_NEAREST$1 = 0x2700;
	var GL_LINEAR_MIPMAP_NEAREST$1 = 0x2701;
	var GL_NEAREST_MIPMAP_LINEAR$1 = 0x2702;
	var GL_LINEAR_MIPMAP_LINEAR$1 = 0x2703;

	var GL_GENERATE_MIPMAP_HINT = 0x8192;
	var GL_DONT_CARE = 0x1100;
	var GL_FASTEST = 0x1101;
	var GL_NICEST = 0x1102;

	var GL_TEXTURE_MAX_ANISOTROPY_EXT = 0x84FE;

	var GL_UNPACK_ALIGNMENT = 0x0CF5;
	var GL_UNPACK_FLIP_Y_WEBGL = 0x9240;
	var GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL = 0x9241;
	var GL_UNPACK_COLORSPACE_CONVERSION_WEBGL = 0x9243;

	var GL_BROWSER_DEFAULT_WEBGL = 0x9244;

	var GL_TEXTURE0$1 = 0x84C0;

	var MIPMAP_FILTERS = [
	  GL_NEAREST_MIPMAP_NEAREST$1,
	  GL_NEAREST_MIPMAP_LINEAR$1,
	  GL_LINEAR_MIPMAP_NEAREST$1,
	  GL_LINEAR_MIPMAP_LINEAR$1
	];

	var CHANNELS_FORMAT = [
	  0,
	  GL_LUMINANCE,
	  GL_LUMINANCE_ALPHA,
	  GL_RGB,
	  GL_RGBA$1
	];

	var FORMAT_CHANNELS = {};
	FORMAT_CHANNELS[GL_LUMINANCE] =
	FORMAT_CHANNELS[GL_ALPHA] =
	FORMAT_CHANNELS[GL_DEPTH_COMPONENT] = 1;
	FORMAT_CHANNELS[GL_DEPTH_STENCIL] =
	FORMAT_CHANNELS[GL_LUMINANCE_ALPHA] = 2;
	FORMAT_CHANNELS[GL_RGB] =
	FORMAT_CHANNELS[GL_SRGB_EXT] = 3;
	FORMAT_CHANNELS[GL_RGBA$1] =
	FORMAT_CHANNELS[GL_SRGB_ALPHA_EXT] = 4;

	function objectName (str) {
	  return '[object ' + str + ']'
	}

	var CANVAS_CLASS = objectName('HTMLCanvasElement');
	var OFFSCREENCANVAS_CLASS = objectName('OffscreenCanvas');
	var CONTEXT2D_CLASS = objectName('CanvasRenderingContext2D');
	var BITMAP_CLASS = objectName('ImageBitmap');
	var IMAGE_CLASS = objectName('HTMLImageElement');
	var VIDEO_CLASS = objectName('HTMLVideoElement');

	var PIXEL_CLASSES = Object.keys(arrayTypes).concat([
	  CANVAS_CLASS,
	  OFFSCREENCANVAS_CLASS,
	  CONTEXT2D_CLASS,
	  BITMAP_CLASS,
	  IMAGE_CLASS,
	  VIDEO_CLASS
	]);

	// for every texture type, store
	// the size in bytes.
	var TYPE_SIZES = [];
	TYPE_SIZES[GL_UNSIGNED_BYTE$5] = 1;
	TYPE_SIZES[GL_FLOAT$4] = 4;
	TYPE_SIZES[GL_HALF_FLOAT_OES$1] = 2;

	TYPE_SIZES[GL_UNSIGNED_SHORT$3] = 2;
	TYPE_SIZES[GL_UNSIGNED_INT$3] = 4;

	var FORMAT_SIZES_SPECIAL = [];
	FORMAT_SIZES_SPECIAL[GL_RGBA4] = 2;
	FORMAT_SIZES_SPECIAL[GL_RGB5_A1] = 2;
	FORMAT_SIZES_SPECIAL[GL_RGB565] = 2;
	FORMAT_SIZES_SPECIAL[GL_DEPTH_STENCIL] = 4;

	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_S3TC_DXT1_EXT] = 0.5;
	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_S3TC_DXT1_EXT] = 0.5;
	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_S3TC_DXT3_EXT] = 1;
	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_S3TC_DXT5_EXT] = 1;

	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_ATC_WEBGL] = 0.5;
	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL] = 1;
	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL] = 1;

	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG] = 0.5;
	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG] = 0.25;
	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG] = 0.5;
	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG] = 0.25;

	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_ETC1_WEBGL] = 0.5;

	function isNumericArray (arr) {
	  return (
	    Array.isArray(arr) &&
	    (arr.length === 0 ||
	    typeof arr[0] === 'number'))
	}

	function isRectArray (arr) {
	  if (!Array.isArray(arr)) {
	    return false
	  }
	  var width = arr.length;
	  if (width === 0 || !isArrayLike(arr[0])) {
	    return false
	  }
	  return true
	}

	function classString (x) {
	  return Object.prototype.toString.call(x)
	}

	function isCanvasElement (object) {
	  return classString(object) === CANVAS_CLASS
	}

	function isOffscreenCanvas (object) {
	  return classString(object) === OFFSCREENCANVAS_CLASS
	}

	function isContext2D (object) {
	  return classString(object) === CONTEXT2D_CLASS
	}

	function isBitmap (object) {
	  return classString(object) === BITMAP_CLASS
	}

	function isImageElement (object) {
	  return classString(object) === IMAGE_CLASS
	}

	function isVideoElement (object) {
	  return classString(object) === VIDEO_CLASS
	}

	function isPixelData (object) {
	  if (!object) {
	    return false
	  }
	  var className = classString(object);
	  if (PIXEL_CLASSES.indexOf(className) >= 0) {
	    return true
	  }
	  return (
	    isNumericArray(object) ||
	    isRectArray(object) ||
	    isNDArrayLike(object))
	}

	function typedArrayCode$1 (data) {
	  return arrayTypes[Object.prototype.toString.call(data)] | 0
	}

	function convertData (result, data) {
	  var n = data.length;
	  switch (result.type) {
	    case GL_UNSIGNED_BYTE$5:
	    case GL_UNSIGNED_SHORT$3:
	    case GL_UNSIGNED_INT$3:
	    case GL_FLOAT$4:
	      var converted = pool.allocType(result.type, n);
	      converted.set(data);
	      result.data = converted;
	      break

	    case GL_HALF_FLOAT_OES$1:
	      result.data = convertToHalfFloat(data);
	      break

	    default:
	      check$1.raise('unsupported texture type, must specify a typed array');
	  }
	}

	function preConvert (image, n) {
	  return pool.allocType(
	    image.type === GL_HALF_FLOAT_OES$1
	      ? GL_FLOAT$4
	      : image.type, n)
	}

	function postConvert (image, data) {
	  if (image.type === GL_HALF_FLOAT_OES$1) {
	    image.data = convertToHalfFloat(data);
	    pool.freeType(data);
	  } else {
	    image.data = data;
	  }
	}

	function transposeData (image, array, strideX, strideY, strideC, offset) {
	  var w = image.width;
	  var h = image.height;
	  var c = image.channels;
	  var n = w * h * c;
	  var data = preConvert(image, n);

	  var p = 0;
	  for (var i = 0; i < h; ++i) {
	    for (var j = 0; j < w; ++j) {
	      for (var k = 0; k < c; ++k) {
	        data[p++] = array[strideX * j + strideY * i + strideC * k + offset];
	      }
	    }
	  }

	  postConvert(image, data);
	}

	function getTextureSize (format, type, width, height, isMipmap, isCube) {
	  var s;
	  if (typeof FORMAT_SIZES_SPECIAL[format] !== 'undefined') {
	    // we have a special array for dealing with weird color formats such as RGB5A1
	    s = FORMAT_SIZES_SPECIAL[format];
	  } else {
	    s = FORMAT_CHANNELS[format] * TYPE_SIZES[type];
	  }

	  if (isCube) {
	    s *= 6;
	  }

	  if (isMipmap) {
	    // compute the total size of all the mipmaps.
	    var total = 0;

	    var w = width;
	    while (w >= 1) {
	      // we can only use mipmaps on a square image,
	      // so we can simply use the width and ignore the height:
	      total += s * w * w;
	      w /= 2;
	    }
	    return total
	  } else {
	    return s * width * height
	  }
	}

	function createTextureSet (
	  gl, extensions, limits, reglPoll, contextState, stats, config) {
	  // -------------------------------------------------------
	  // Initialize constants and parameter tables here
	  // -------------------------------------------------------
	  var mipmapHint = {
	    "don't care": GL_DONT_CARE,
	    'dont care': GL_DONT_CARE,
	    'nice': GL_NICEST,
	    'fast': GL_FASTEST
	  };

	  var wrapModes = {
	    'repeat': GL_REPEAT,
	    'clamp': GL_CLAMP_TO_EDGE$1,
	    'mirror': GL_MIRRORED_REPEAT
	  };

	  var magFilters = {
	    'nearest': GL_NEAREST$1,
	    'linear': GL_LINEAR
	  };

	  var minFilters = extend({
	    'mipmap': GL_LINEAR_MIPMAP_LINEAR$1,
	    'nearest mipmap nearest': GL_NEAREST_MIPMAP_NEAREST$1,
	    'linear mipmap nearest': GL_LINEAR_MIPMAP_NEAREST$1,
	    'nearest mipmap linear': GL_NEAREST_MIPMAP_LINEAR$1,
	    'linear mipmap linear': GL_LINEAR_MIPMAP_LINEAR$1
	  }, magFilters);

	  var colorSpace = {
	    'none': 0,
	    'browser': GL_BROWSER_DEFAULT_WEBGL
	  };

	  var textureTypes = {
	    'uint8': GL_UNSIGNED_BYTE$5,
	    'rgba4': GL_UNSIGNED_SHORT_4_4_4_4$1,
	    'rgb565': GL_UNSIGNED_SHORT_5_6_5$1,
	    'rgb5 a1': GL_UNSIGNED_SHORT_5_5_5_1$1
	  };

	  var textureFormats = {
	    'alpha': GL_ALPHA,
	    'luminance': GL_LUMINANCE,
	    'luminance alpha': GL_LUMINANCE_ALPHA,
	    'rgb': GL_RGB,
	    'rgba': GL_RGBA$1,
	    'rgba4': GL_RGBA4,
	    'rgb5 a1': GL_RGB5_A1,
	    'rgb565': GL_RGB565
	  };

	  var compressedTextureFormats = {};

	  if (extensions.ext_srgb) {
	    textureFormats.srgb = GL_SRGB_EXT;
	    textureFormats.srgba = GL_SRGB_ALPHA_EXT;
	  }

	  if (extensions.oes_texture_float) {
	    textureTypes.float32 = textureTypes.float = GL_FLOAT$4;
	  }

	  if (extensions.oes_texture_half_float) {
	    textureTypes['float16'] = textureTypes['half float'] = GL_HALF_FLOAT_OES$1;
	  }

	  if (extensions.webgl_depth_texture) {
	    extend(textureFormats, {
	      'depth': GL_DEPTH_COMPONENT,
	      'depth stencil': GL_DEPTH_STENCIL
	    });

	    extend(textureTypes, {
	      'uint16': GL_UNSIGNED_SHORT$3,
	      'uint32': GL_UNSIGNED_INT$3,
	      'depth stencil': GL_UNSIGNED_INT_24_8_WEBGL$1
	    });
	  }

	  if (extensions.webgl_compressed_texture_s3tc) {
	    extend(compressedTextureFormats, {
	      'rgb s3tc dxt1': GL_COMPRESSED_RGB_S3TC_DXT1_EXT,
	      'rgba s3tc dxt1': GL_COMPRESSED_RGBA_S3TC_DXT1_EXT,
	      'rgba s3tc dxt3': GL_COMPRESSED_RGBA_S3TC_DXT3_EXT,
	      'rgba s3tc dxt5': GL_COMPRESSED_RGBA_S3TC_DXT5_EXT
	    });
	  }

	  if (extensions.webgl_compressed_texture_atc) {
	    extend(compressedTextureFormats, {
	      'rgb atc': GL_COMPRESSED_RGB_ATC_WEBGL,
	      'rgba atc explicit alpha': GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL,
	      'rgba atc interpolated alpha': GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL
	    });
	  }

	  if (extensions.webgl_compressed_texture_pvrtc) {
	    extend(compressedTextureFormats, {
	      'rgb pvrtc 4bppv1': GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
	      'rgb pvrtc 2bppv1': GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG,
	      'rgba pvrtc 4bppv1': GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
	      'rgba pvrtc 2bppv1': GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG
	    });
	  }

	  if (extensions.webgl_compressed_texture_etc1) {
	    compressedTextureFormats['rgb etc1'] = GL_COMPRESSED_RGB_ETC1_WEBGL;
	  }

	  // Copy over all texture formats
	  var supportedCompressedFormats = Array.prototype.slice.call(
	    gl.getParameter(GL_COMPRESSED_TEXTURE_FORMATS));
	  Object.keys(compressedTextureFormats).forEach(function (name) {
	    var format = compressedTextureFormats[name];
	    if (supportedCompressedFormats.indexOf(format) >= 0) {
	      textureFormats[name] = format;
	    }
	  });

	  var supportedFormats = Object.keys(textureFormats);
	  limits.textureFormats = supportedFormats;

	  // associate with every format string its
	  // corresponding GL-value.
	  var textureFormatsInvert = [];
	  Object.keys(textureFormats).forEach(function (key) {
	    var val = textureFormats[key];
	    textureFormatsInvert[val] = key;
	  });

	  // associate with every type string its
	  // corresponding GL-value.
	  var textureTypesInvert = [];
	  Object.keys(textureTypes).forEach(function (key) {
	    var val = textureTypes[key];
	    textureTypesInvert[val] = key;
	  });

	  var magFiltersInvert = [];
	  Object.keys(magFilters).forEach(function (key) {
	    var val = magFilters[key];
	    magFiltersInvert[val] = key;
	  });

	  var minFiltersInvert = [];
	  Object.keys(minFilters).forEach(function (key) {
	    var val = minFilters[key];
	    minFiltersInvert[val] = key;
	  });

	  var wrapModesInvert = [];
	  Object.keys(wrapModes).forEach(function (key) {
	    var val = wrapModes[key];
	    wrapModesInvert[val] = key;
	  });

	  // colorFormats[] gives the format (channels) associated to an
	  // internalformat
	  var colorFormats = supportedFormats.reduce(function (color, key) {
	    var glenum = textureFormats[key];
	    if (glenum === GL_LUMINANCE ||
	        glenum === GL_ALPHA ||
	        glenum === GL_LUMINANCE ||
	        glenum === GL_LUMINANCE_ALPHA ||
	        glenum === GL_DEPTH_COMPONENT ||
	        glenum === GL_DEPTH_STENCIL ||
	        (extensions.ext_srgb &&
	                (glenum === GL_SRGB_EXT ||
	                 glenum === GL_SRGB_ALPHA_EXT))) {
	      color[glenum] = glenum;
	    } else if (glenum === GL_RGB5_A1 || key.indexOf('rgba') >= 0) {
	      color[glenum] = GL_RGBA$1;
	    } else {
	      color[glenum] = GL_RGB;
	    }
	    return color
	  }, {});

	  function TexFlags () {
	    // format info
	    this.internalformat = GL_RGBA$1;
	    this.format = GL_RGBA$1;
	    this.type = GL_UNSIGNED_BYTE$5;
	    this.compressed = false;

	    // pixel storage
	    this.premultiplyAlpha = false;
	    this.flipY = false;
	    this.unpackAlignment = 1;
	    this.colorSpace = GL_BROWSER_DEFAULT_WEBGL;

	    // shape info
	    this.width = 0;
	    this.height = 0;
	    this.channels = 0;
	  }

	  function copyFlags (result, other) {
	    result.internalformat = other.internalformat;
	    result.format = other.format;
	    result.type = other.type;
	    result.compressed = other.compressed;

	    result.premultiplyAlpha = other.premultiplyAlpha;
	    result.flipY = other.flipY;
	    result.unpackAlignment = other.unpackAlignment;
	    result.colorSpace = other.colorSpace;

	    result.width = other.width;
	    result.height = other.height;
	    result.channels = other.channels;
	  }

	  function parseFlags (flags, options) {
	    if (typeof options !== 'object' || !options) {
	      return
	    }

	    if ('premultiplyAlpha' in options) {
	      check$1.type(options.premultiplyAlpha, 'boolean',
	        'invalid premultiplyAlpha');
	      flags.premultiplyAlpha = options.premultiplyAlpha;
	    }

	    if ('flipY' in options) {
	      check$1.type(options.flipY, 'boolean',
	        'invalid texture flip');
	      flags.flipY = options.flipY;
	    }

	    if ('alignment' in options) {
	      check$1.oneOf(options.alignment, [1, 2, 4, 8],
	        'invalid texture unpack alignment');
	      flags.unpackAlignment = options.alignment;
	    }

	    if ('colorSpace' in options) {
	      check$1.parameter(options.colorSpace, colorSpace,
	        'invalid colorSpace');
	      flags.colorSpace = colorSpace[options.colorSpace];
	    }

	    if ('type' in options) {
	      var type = options.type;
	      check$1(extensions.oes_texture_float ||
	        !(type === 'float' || type === 'float32'),
	      'you must enable the OES_texture_float extension in order to use floating point textures.');
	      check$1(extensions.oes_texture_half_float ||
	        !(type === 'half float' || type === 'float16'),
	      'you must enable the OES_texture_half_float extension in order to use 16-bit floating point textures.');
	      check$1(extensions.webgl_depth_texture ||
	        !(type === 'uint16' || type === 'uint32' || type === 'depth stencil'),
	      'you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures.');
	      check$1.parameter(type, textureTypes,
	        'invalid texture type');
	      flags.type = textureTypes[type];
	    }

	    var w = flags.width;
	    var h = flags.height;
	    var c = flags.channels;
	    var hasChannels = false;
	    if ('shape' in options) {
	      check$1(Array.isArray(options.shape) && options.shape.length >= 2,
	        'shape must be an array');
	      w = options.shape[0];
	      h = options.shape[1];
	      if (options.shape.length === 3) {
	        c = options.shape[2];
	        check$1(c > 0 && c <= 4, 'invalid number of channels');
	        hasChannels = true;
	      }
	      check$1(w >= 0 && w <= limits.maxTextureSize, 'invalid width');
	      check$1(h >= 0 && h <= limits.maxTextureSize, 'invalid height');
	    } else {
	      if ('radius' in options) {
	        w = h = options.radius;
	        check$1(w >= 0 && w <= limits.maxTextureSize, 'invalid radius');
	      }
	      if ('width' in options) {
	        w = options.width;
	        check$1(w >= 0 && w <= limits.maxTextureSize, 'invalid width');
	      }
	      if ('height' in options) {
	        h = options.height;
	        check$1(h >= 0 && h <= limits.maxTextureSize, 'invalid height');
	      }
	      if ('channels' in options) {
	        c = options.channels;
	        check$1(c > 0 && c <= 4, 'invalid number of channels');
	        hasChannels = true;
	      }
	    }
	    flags.width = w | 0;
	    flags.height = h | 0;
	    flags.channels = c | 0;

	    var hasFormat = false;
	    if ('format' in options) {
	      var formatStr = options.format;
	      check$1(extensions.webgl_depth_texture ||
	        !(formatStr === 'depth' || formatStr === 'depth stencil'),
	      'you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures.');
	      check$1.parameter(formatStr, textureFormats,
	        'invalid texture format');
	      var internalformat = flags.internalformat = textureFormats[formatStr];
	      flags.format = colorFormats[internalformat];
	      if (formatStr in textureTypes) {
	        if (!('type' in options)) {
	          flags.type = textureTypes[formatStr];
	        }
	      }
	      if (formatStr in compressedTextureFormats) {
	        flags.compressed = true;
	      }
	      hasFormat = true;
	    }

	    // Reconcile channels and format
	    if (!hasChannels && hasFormat) {
	      flags.channels = FORMAT_CHANNELS[flags.format];
	    } else if (hasChannels && !hasFormat) {
	      if (flags.channels !== CHANNELS_FORMAT[flags.format]) {
	        flags.format = flags.internalformat = CHANNELS_FORMAT[flags.channels];
	      }
	    } else if (hasFormat && hasChannels) {
	      check$1(
	        flags.channels === FORMAT_CHANNELS[flags.format],
	        'number of channels inconsistent with specified format');
	    }
	  }

	  function setFlags (flags) {
	    gl.pixelStorei(GL_UNPACK_FLIP_Y_WEBGL, flags.flipY);
	    gl.pixelStorei(GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL, flags.premultiplyAlpha);
	    gl.pixelStorei(GL_UNPACK_COLORSPACE_CONVERSION_WEBGL, flags.colorSpace);
	    gl.pixelStorei(GL_UNPACK_ALIGNMENT, flags.unpackAlignment);
	  }

	  // -------------------------------------------------------
	  // Tex image data
	  // -------------------------------------------------------
	  function TexImage () {
	    TexFlags.call(this);

	    this.xOffset = 0;
	    this.yOffset = 0;

	    // data
	    this.data = null;
	    this.needsFree = false;

	    // html element
	    this.element = null;

	    // copyTexImage info
	    this.needsCopy = false;
	  }

	  function parseImage (image, options) {
	    var data = null;
	    if (isPixelData(options)) {
	      data = options;
	    } else if (options) {
	      check$1.type(options, 'object', 'invalid pixel data type');
	      parseFlags(image, options);
	      if ('x' in options) {
	        image.xOffset = options.x | 0;
	      }
	      if ('y' in options) {
	        image.yOffset = options.y | 0;
	      }
	      if (isPixelData(options.data)) {
	        data = options.data;
	      }
	    }

	    check$1(
	      !image.compressed ||
	      data instanceof Uint8Array,
	      'compressed texture data must be stored in a uint8array');

	    if (options.copy) {
	      check$1(!data, 'can not specify copy and data field for the same texture');
	      var viewW = contextState.viewportWidth;
	      var viewH = contextState.viewportHeight;
	      image.width = image.width || (viewW - image.xOffset);
	      image.height = image.height || (viewH - image.yOffset);
	      image.needsCopy = true;
	      check$1(image.xOffset >= 0 && image.xOffset < viewW &&
	            image.yOffset >= 0 && image.yOffset < viewH &&
	            image.width > 0 && image.width <= viewW &&
	            image.height > 0 && image.height <= viewH,
	      'copy texture read out of bounds');
	    } else if (!data) {
	      image.width = image.width || 1;
	      image.height = image.height || 1;
	      image.channels = image.channels || 4;
	    } else if (isTypedArray(data)) {
	      image.channels = image.channels || 4;
	      image.data = data;
	      if (!('type' in options) && image.type === GL_UNSIGNED_BYTE$5) {
	        image.type = typedArrayCode$1(data);
	      }
	    } else if (isNumericArray(data)) {
	      image.channels = image.channels || 4;
	      convertData(image, data);
	      image.alignment = 1;
	      image.needsFree = true;
	    } else if (isNDArrayLike(data)) {
	      var array = data.data;
	      if (!Array.isArray(array) && image.type === GL_UNSIGNED_BYTE$5) {
	        image.type = typedArrayCode$1(array);
	      }
	      var shape = data.shape;
	      var stride = data.stride;
	      var shapeX, shapeY, shapeC, strideX, strideY, strideC;
	      if (shape.length === 3) {
	        shapeC = shape[2];
	        strideC = stride[2];
	      } else {
	        check$1(shape.length === 2, 'invalid ndarray pixel data, must be 2 or 3D');
	        shapeC = 1;
	        strideC = 1;
	      }
	      shapeX = shape[0];
	      shapeY = shape[1];
	      strideX = stride[0];
	      strideY = stride[1];
	      image.alignment = 1;
	      image.width = shapeX;
	      image.height = shapeY;
	      image.channels = shapeC;
	      image.format = image.internalformat = CHANNELS_FORMAT[shapeC];
	      image.needsFree = true;
	      transposeData(image, array, strideX, strideY, strideC, data.offset);
	    } else if (isCanvasElement(data) || isOffscreenCanvas(data) || isContext2D(data)) {
	      if (isCanvasElement(data) || isOffscreenCanvas(data)) {
	        image.element = data;
	      } else {
	        image.element = data.canvas;
	      }
	      image.width = image.element.width;
	      image.height = image.element.height;
	      image.channels = 4;
	    } else if (isBitmap(data)) {
	      image.element = data;
	      image.width = data.width;
	      image.height = data.height;
	      image.channels = 4;
	    } else if (isImageElement(data)) {
	      image.element = data;
	      image.width = data.naturalWidth;
	      image.height = data.naturalHeight;
	      image.channels = 4;
	    } else if (isVideoElement(data)) {
	      image.element = data;
	      image.width = data.videoWidth;
	      image.height = data.videoHeight;
	      image.channels = 4;
	    } else if (isRectArray(data)) {
	      var w = image.width || data[0].length;
	      var h = image.height || data.length;
	      var c = image.channels;
	      if (isArrayLike(data[0][0])) {
	        c = c || data[0][0].length;
	      } else {
	        c = c || 1;
	      }
	      var arrayShape = flattenUtils.shape(data);
	      var n = 1;
	      for (var dd = 0; dd < arrayShape.length; ++dd) {
	        n *= arrayShape[dd];
	      }
	      var allocData = preConvert(image, n);
	      flattenUtils.flatten(data, arrayShape, '', allocData);
	      postConvert(image, allocData);
	      image.alignment = 1;
	      image.width = w;
	      image.height = h;
	      image.channels = c;
	      image.format = image.internalformat = CHANNELS_FORMAT[c];
	      image.needsFree = true;
	    }

	    if (image.type === GL_FLOAT$4) {
	      check$1(limits.extensions.indexOf('oes_texture_float') >= 0,
	        'oes_texture_float extension not enabled');
	    } else if (image.type === GL_HALF_FLOAT_OES$1) {
	      check$1(limits.extensions.indexOf('oes_texture_half_float') >= 0,
	        'oes_texture_half_float extension not enabled');
	    }

	    // do compressed texture  validation here.
	  }

	  function setImage (info, target, miplevel) {
	    var element = info.element;
	    var data = info.data;
	    var internalformat = info.internalformat;
	    var format = info.format;
	    var type = info.type;
	    var width = info.width;
	    var height = info.height;

	    setFlags(info);

	    if (element) {
	      gl.texImage2D(target, miplevel, format, format, type, element);
	    } else if (info.compressed) {
	      gl.compressedTexImage2D(target, miplevel, internalformat, width, height, 0, data);
	    } else if (info.needsCopy) {
	      reglPoll();
	      gl.copyTexImage2D(
	        target, miplevel, format, info.xOffset, info.yOffset, width, height, 0);
	    } else {
	      gl.texImage2D(target, miplevel, format, width, height, 0, format, type, data || null);
	    }
	  }

	  function setSubImage (info, target, x, y, miplevel) {
	    var element = info.element;
	    var data = info.data;
	    var internalformat = info.internalformat;
	    var format = info.format;
	    var type = info.type;
	    var width = info.width;
	    var height = info.height;

	    setFlags(info);

	    if (element) {
	      gl.texSubImage2D(
	        target, miplevel, x, y, format, type, element);
	    } else if (info.compressed) {
	      gl.compressedTexSubImage2D(
	        target, miplevel, x, y, internalformat, width, height, data);
	    } else if (info.needsCopy) {
	      reglPoll();
	      gl.copyTexSubImage2D(
	        target, miplevel, x, y, info.xOffset, info.yOffset, width, height);
	    } else {
	      gl.texSubImage2D(
	        target, miplevel, x, y, width, height, format, type, data);
	    }
	  }

	  // texImage pool
	  var imagePool = [];

	  function allocImage () {
	    return imagePool.pop() || new TexImage()
	  }

	  function freeImage (image) {
	    if (image.needsFree) {
	      pool.freeType(image.data);
	    }
	    TexImage.call(image);
	    imagePool.push(image);
	  }

	  // -------------------------------------------------------
	  // Mip map
	  // -------------------------------------------------------
	  function MipMap () {
	    TexFlags.call(this);

	    this.genMipmaps = false;
	    this.mipmapHint = GL_DONT_CARE;
	    this.mipmask = 0;
	    this.images = Array(16);
	  }

	  function parseMipMapFromShape (mipmap, width, height) {
	    var img = mipmap.images[0] = allocImage();
	    mipmap.mipmask = 1;
	    img.width = mipmap.width = width;
	    img.height = mipmap.height = height;
	    img.channels = mipmap.channels = 4;
	  }

	  function parseMipMapFromObject (mipmap, options) {
	    var imgData = null;
	    if (isPixelData(options)) {
	      imgData = mipmap.images[0] = allocImage();
	      copyFlags(imgData, mipmap);
	      parseImage(imgData, options);
	      mipmap.mipmask = 1;
	    } else {
	      parseFlags(mipmap, options);
	      if (Array.isArray(options.mipmap)) {
	        var mipData = options.mipmap;
	        for (var i = 0; i < mipData.length; ++i) {
	          imgData = mipmap.images[i] = allocImage();
	          copyFlags(imgData, mipmap);
	          imgData.width >>= i;
	          imgData.height >>= i;
	          parseImage(imgData, mipData[i]);
	          mipmap.mipmask |= (1 << i);
	        }
	      } else {
	        imgData = mipmap.images[0] = allocImage();
	        copyFlags(imgData, mipmap);
	        parseImage(imgData, options);
	        mipmap.mipmask = 1;
	      }
	    }
	    copyFlags(mipmap, mipmap.images[0]);

	    // For textures of the compressed format WEBGL_compressed_texture_s3tc
	    // we must have that
	    //
	    // "When level equals zero width and height must be a multiple of 4.
	    // When level is greater than 0 width and height must be 0, 1, 2 or a multiple of 4. "
	    //
	    // but we do not yet support having multiple mipmap levels for compressed textures,
	    // so we only test for level zero.

	    if (
	      mipmap.compressed &&
	      (
	        mipmap.internalformat === GL_COMPRESSED_RGB_S3TC_DXT1_EXT ||
	        mipmap.internalformat === GL_COMPRESSED_RGBA_S3TC_DXT1_EXT ||
	        mipmap.internalformat === GL_COMPRESSED_RGBA_S3TC_DXT3_EXT ||
	        mipmap.internalformat === GL_COMPRESSED_RGBA_S3TC_DXT5_EXT
	      )
	    ) {
	      check$1(mipmap.width % 4 === 0 && mipmap.height % 4 === 0,
	        'for compressed texture formats, mipmap level 0 must have width and height that are a multiple of 4');
	    }
	  }

	  function setMipMap (mipmap, target) {
	    var images = mipmap.images;
	    for (var i = 0; i < images.length; ++i) {
	      if (!images[i]) {
	        return
	      }
	      setImage(images[i], target, i);
	    }
	  }

	  var mipPool = [];

	  function allocMipMap () {
	    var result = mipPool.pop() || new MipMap();
	    TexFlags.call(result);
	    result.mipmask = 0;
	    for (var i = 0; i < 16; ++i) {
	      result.images[i] = null;
	    }
	    return result
	  }

	  function freeMipMap (mipmap) {
	    var images = mipmap.images;
	    for (var i = 0; i < images.length; ++i) {
	      if (images[i]) {
	        freeImage(images[i]);
	      }
	      images[i] = null;
	    }
	    mipPool.push(mipmap);
	  }

	  // -------------------------------------------------------
	  // Tex info
	  // -------------------------------------------------------
	  function TexInfo () {
	    this.minFilter = GL_NEAREST$1;
	    this.magFilter = GL_NEAREST$1;

	    this.wrapS = GL_CLAMP_TO_EDGE$1;
	    this.wrapT = GL_CLAMP_TO_EDGE$1;

	    this.anisotropic = 1;

	    this.genMipmaps = false;
	    this.mipmapHint = GL_DONT_CARE;
	  }

	  function parseTexInfo (info, options) {
	    if ('min' in options) {
	      var minFilter = options.min;
	      check$1.parameter(minFilter, minFilters);
	      info.minFilter = minFilters[minFilter];
	      if (MIPMAP_FILTERS.indexOf(info.minFilter) >= 0 && !('faces' in options)) {
	        info.genMipmaps = true;
	      }
	    }

	    if ('mag' in options) {
	      var magFilter = options.mag;
	      check$1.parameter(magFilter, magFilters);
	      info.magFilter = magFilters[magFilter];
	    }

	    var wrapS = info.wrapS;
	    var wrapT = info.wrapT;
	    if ('wrap' in options) {
	      var wrap = options.wrap;
	      if (typeof wrap === 'string') {
	        check$1.parameter(wrap, wrapModes);
	        wrapS = wrapT = wrapModes[wrap];
	      } else if (Array.isArray(wrap)) {
	        check$1.parameter(wrap[0], wrapModes);
	        check$1.parameter(wrap[1], wrapModes);
	        wrapS = wrapModes[wrap[0]];
	        wrapT = wrapModes[wrap[1]];
	      }
	    } else {
	      if ('wrapS' in options) {
	        var optWrapS = options.wrapS;
	        check$1.parameter(optWrapS, wrapModes);
	        wrapS = wrapModes[optWrapS];
	      }
	      if ('wrapT' in options) {
	        var optWrapT = options.wrapT;
	        check$1.parameter(optWrapT, wrapModes);
	        wrapT = wrapModes[optWrapT];
	      }
	    }
	    info.wrapS = wrapS;
	    info.wrapT = wrapT;

	    if ('anisotropic' in options) {
	      var anisotropic = options.anisotropic;
	      check$1(typeof anisotropic === 'number' &&
	         anisotropic >= 1 && anisotropic <= limits.maxAnisotropic,
	      'aniso samples must be between 1 and ');
	      info.anisotropic = options.anisotropic;
	    }

	    if ('mipmap' in options) {
	      var hasMipMap = false;
	      switch (typeof options.mipmap) {
	        case 'string':
	          check$1.parameter(options.mipmap, mipmapHint,
	            'invalid mipmap hint');
	          info.mipmapHint = mipmapHint[options.mipmap];
	          info.genMipmaps = true;
	          hasMipMap = true;
	          break

	        case 'boolean':
	          hasMipMap = info.genMipmaps = options.mipmap;
	          break

	        case 'object':
	          check$1(Array.isArray(options.mipmap), 'invalid mipmap type');
	          info.genMipmaps = false;
	          hasMipMap = true;
	          break

	        default:
	          check$1.raise('invalid mipmap type');
	      }
	      if (hasMipMap && !('min' in options)) {
	        info.minFilter = GL_NEAREST_MIPMAP_NEAREST$1;
	      }
	    }
	  }

	  function setTexInfo (info, target) {
	    gl.texParameteri(target, GL_TEXTURE_MIN_FILTER, info.minFilter);
	    gl.texParameteri(target, GL_TEXTURE_MAG_FILTER, info.magFilter);
	    gl.texParameteri(target, GL_TEXTURE_WRAP_S, info.wrapS);
	    gl.texParameteri(target, GL_TEXTURE_WRAP_T, info.wrapT);
	    if (extensions.ext_texture_filter_anisotropic) {
	      gl.texParameteri(target, GL_TEXTURE_MAX_ANISOTROPY_EXT, info.anisotropic);
	    }
	    if (info.genMipmaps) {
	      gl.hint(GL_GENERATE_MIPMAP_HINT, info.mipmapHint);
	      gl.generateMipmap(target);
	    }
	  }

	  // -------------------------------------------------------
	  // Full texture object
	  // -------------------------------------------------------
	  var textureCount = 0;
	  var textureSet = {};
	  var numTexUnits = limits.maxTextureUnits;
	  var textureUnits = Array(numTexUnits).map(function () {
	    return null
	  });

	  function REGLTexture (target) {
	    TexFlags.call(this);
	    this.mipmask = 0;
	    this.internalformat = GL_RGBA$1;

	    this.id = textureCount++;

	    this.refCount = 1;

	    this.target = target;
	    this.texture = gl.createTexture();

	    this.unit = -1;
	    this.bindCount = 0;

	    this.texInfo = new TexInfo();

	    if (config.profile) {
	      this.stats = { size: 0 };
	    }
	  }

	  function tempBind (texture) {
	    gl.activeTexture(GL_TEXTURE0$1);
	    gl.bindTexture(texture.target, texture.texture);
	  }

	  function tempRestore () {
	    var prev = textureUnits[0];
	    if (prev) {
	      gl.bindTexture(prev.target, prev.texture);
	    } else {
	      gl.bindTexture(GL_TEXTURE_2D$1, null);
	    }
	  }

	  function destroy (texture) {
	    var handle = texture.texture;
	    check$1(handle, 'must not double destroy texture');
	    var unit = texture.unit;
	    var target = texture.target;
	    if (unit >= 0) {
	      gl.activeTexture(GL_TEXTURE0$1 + unit);
	      gl.bindTexture(target, null);
	      textureUnits[unit] = null;
	    }
	    gl.deleteTexture(handle);
	    texture.texture = null;
	    texture.params = null;
	    texture.pixels = null;
	    texture.refCount = 0;
	    delete textureSet[texture.id];
	    stats.textureCount--;
	  }

	  extend(REGLTexture.prototype, {
	    bind: function () {
	      var texture = this;
	      texture.bindCount += 1;
	      var unit = texture.unit;
	      if (unit < 0) {
	        for (var i = 0; i < numTexUnits; ++i) {
	          var other = textureUnits[i];
	          if (other) {
	            if (other.bindCount > 0) {
	              continue
	            }
	            other.unit = -1;
	          }
	          textureUnits[i] = texture;
	          unit = i;
	          break
	        }
	        if (unit >= numTexUnits) {
	          check$1.raise('insufficient number of texture units');
	        }
	        if (config.profile && stats.maxTextureUnits < (unit + 1)) {
	          stats.maxTextureUnits = unit + 1; // +1, since the units are zero-based
	        }
	        texture.unit = unit;
	        gl.activeTexture(GL_TEXTURE0$1 + unit);
	        gl.bindTexture(texture.target, texture.texture);
	      }
	      return unit
	    },

	    unbind: function () {
	      this.bindCount -= 1;
	    },

	    decRef: function () {
	      if (--this.refCount <= 0) {
	        destroy(this);
	      }
	    }
	  });

	  function createTexture2D (a, b) {
	    var texture = new REGLTexture(GL_TEXTURE_2D$1);
	    textureSet[texture.id] = texture;
	    stats.textureCount++;

	    function reglTexture2D (a, b) {
	      var texInfo = texture.texInfo;
	      TexInfo.call(texInfo);
	      var mipData = allocMipMap();

	      if (typeof a === 'number') {
	        if (typeof b === 'number') {
	          parseMipMapFromShape(mipData, a | 0, b | 0);
	        } else {
	          parseMipMapFromShape(mipData, a | 0, a | 0);
	        }
	      } else if (a) {
	        check$1.type(a, 'object', 'invalid arguments to regl.texture');
	        parseTexInfo(texInfo, a);
	        parseMipMapFromObject(mipData, a);
	      } else {
	        // empty textures get assigned a default shape of 1x1
	        parseMipMapFromShape(mipData, 1, 1);
	      }

	      if (texInfo.genMipmaps) {
	        mipData.mipmask = (mipData.width << 1) - 1;
	      }
	      texture.mipmask = mipData.mipmask;

	      copyFlags(texture, mipData);

	      check$1.texture2D(texInfo, mipData, limits);
	      texture.internalformat = mipData.internalformat;

	      reglTexture2D.width = mipData.width;
	      reglTexture2D.height = mipData.height;

	      tempBind(texture);
	      setMipMap(mipData, GL_TEXTURE_2D$1);
	      setTexInfo(texInfo, GL_TEXTURE_2D$1);
	      tempRestore();

	      freeMipMap(mipData);

	      if (config.profile) {
	        texture.stats.size = getTextureSize(
	          texture.internalformat,
	          texture.type,
	          mipData.width,
	          mipData.height,
	          texInfo.genMipmaps,
	          false);
	      }
	      reglTexture2D.format = textureFormatsInvert[texture.internalformat];
	      reglTexture2D.type = textureTypesInvert[texture.type];

	      reglTexture2D.mag = magFiltersInvert[texInfo.magFilter];
	      reglTexture2D.min = minFiltersInvert[texInfo.minFilter];

	      reglTexture2D.wrapS = wrapModesInvert[texInfo.wrapS];
	      reglTexture2D.wrapT = wrapModesInvert[texInfo.wrapT];

	      return reglTexture2D
	    }

	    function subimage (image, x_, y_, level_) {
	      check$1(!!image, 'must specify image data');

	      var x = x_ | 0;
	      var y = y_ | 0;
	      var level = level_ | 0;

	      var imageData = allocImage();
	      copyFlags(imageData, texture);
	      imageData.width = 0;
	      imageData.height = 0;
	      parseImage(imageData, image);
	      imageData.width = imageData.width || ((texture.width >> level) - x);
	      imageData.height = imageData.height || ((texture.height >> level) - y);

	      check$1(
	        texture.type === imageData.type &&
	        texture.format === imageData.format &&
	        texture.internalformat === imageData.internalformat,
	        'incompatible format for texture.subimage');
	      check$1(
	        x >= 0 && y >= 0 &&
	        x + imageData.width <= texture.width &&
	        y + imageData.height <= texture.height,
	        'texture.subimage write out of bounds');
	      check$1(
	        texture.mipmask & (1 << level),
	        'missing mipmap data');
	      check$1(
	        imageData.data || imageData.element || imageData.needsCopy,
	        'missing image data');

	      tempBind(texture);
	      setSubImage(imageData, GL_TEXTURE_2D$1, x, y, level);
	      tempRestore();

	      freeImage(imageData);

	      return reglTexture2D
	    }

	    function resize (w_, h_) {
	      var w = w_ | 0;
	      var h = (h_ | 0) || w;
	      if (w === texture.width && h === texture.height) {
	        return reglTexture2D
	      }

	      reglTexture2D.width = texture.width = w;
	      reglTexture2D.height = texture.height = h;

	      tempBind(texture);

	      for (var i = 0; texture.mipmask >> i; ++i) {
	        var _w = w >> i;
	        var _h = h >> i;
	        if (!_w || !_h) break
	        gl.texImage2D(
	          GL_TEXTURE_2D$1,
	          i,
	          texture.format,
	          _w,
	          _h,
	          0,
	          texture.format,
	          texture.type,
	          null);
	      }
	      tempRestore();

	      // also, recompute the texture size.
	      if (config.profile) {
	        texture.stats.size = getTextureSize(
	          texture.internalformat,
	          texture.type,
	          w,
	          h,
	          false,
	          false);
	      }

	      return reglTexture2D
	    }

	    reglTexture2D(a, b);

	    reglTexture2D.subimage = subimage;
	    reglTexture2D.resize = resize;
	    reglTexture2D._reglType = 'texture2d';
	    reglTexture2D._texture = texture;
	    if (config.profile) {
	      reglTexture2D.stats = texture.stats;
	    }
	    reglTexture2D.destroy = function () {
	      texture.decRef();
	    };

	    return reglTexture2D
	  }

	  function createTextureCube (a0, a1, a2, a3, a4, a5) {
	    var texture = new REGLTexture(GL_TEXTURE_CUBE_MAP$1);
	    textureSet[texture.id] = texture;
	    stats.cubeCount++;

	    var faces = new Array(6);

	    function reglTextureCube (a0, a1, a2, a3, a4, a5) {
	      var i;
	      var texInfo = texture.texInfo;
	      TexInfo.call(texInfo);
	      for (i = 0; i < 6; ++i) {
	        faces[i] = allocMipMap();
	      }

	      if (typeof a0 === 'number' || !a0) {
	        var s = (a0 | 0) || 1;
	        for (i = 0; i < 6; ++i) {
	          parseMipMapFromShape(faces[i], s, s);
	        }
	      } else if (typeof a0 === 'object') {
	        if (a1) {
	          parseMipMapFromObject(faces[0], a0);
	          parseMipMapFromObject(faces[1], a1);
	          parseMipMapFromObject(faces[2], a2);
	          parseMipMapFromObject(faces[3], a3);
	          parseMipMapFromObject(faces[4], a4);
	          parseMipMapFromObject(faces[5], a5);
	        } else {
	          parseTexInfo(texInfo, a0);
	          parseFlags(texture, a0);
	          if ('faces' in a0) {
	            var faceInput = a0.faces;
	            check$1(Array.isArray(faceInput) && faceInput.length === 6,
	              'cube faces must be a length 6 array');
	            for (i = 0; i < 6; ++i) {
	              check$1(typeof faceInput[i] === 'object' && !!faceInput[i],
	                'invalid input for cube map face');
	              copyFlags(faces[i], texture);
	              parseMipMapFromObject(faces[i], faceInput[i]);
	            }
	          } else {
	            for (i = 0; i < 6; ++i) {
	              parseMipMapFromObject(faces[i], a0);
	            }
	          }
	        }
	      } else {
	        check$1.raise('invalid arguments to cube map');
	      }

	      copyFlags(texture, faces[0]);
	      check$1.optional(function () {
	        if (!limits.npotTextureCube) {
	          check$1(isPow2$1(texture.width) && isPow2$1(texture.height), 'your browser does not support non power or two texture dimensions');
	        }
	      });

	      if (texInfo.genMipmaps) {
	        texture.mipmask = (faces[0].width << 1) - 1;
	      } else {
	        texture.mipmask = faces[0].mipmask;
	      }

	      check$1.textureCube(texture, texInfo, faces, limits);
	      texture.internalformat = faces[0].internalformat;

	      reglTextureCube.width = faces[0].width;
	      reglTextureCube.height = faces[0].height;

	      tempBind(texture);
	      for (i = 0; i < 6; ++i) {
	        setMipMap(faces[i], GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + i);
	      }
	      setTexInfo(texInfo, GL_TEXTURE_CUBE_MAP$1);
	      tempRestore();

	      if (config.profile) {
	        texture.stats.size = getTextureSize(
	          texture.internalformat,
	          texture.type,
	          reglTextureCube.width,
	          reglTextureCube.height,
	          texInfo.genMipmaps,
	          true);
	      }

	      reglTextureCube.format = textureFormatsInvert[texture.internalformat];
	      reglTextureCube.type = textureTypesInvert[texture.type];

	      reglTextureCube.mag = magFiltersInvert[texInfo.magFilter];
	      reglTextureCube.min = minFiltersInvert[texInfo.minFilter];

	      reglTextureCube.wrapS = wrapModesInvert[texInfo.wrapS];
	      reglTextureCube.wrapT = wrapModesInvert[texInfo.wrapT];

	      for (i = 0; i < 6; ++i) {
	        freeMipMap(faces[i]);
	      }

	      return reglTextureCube
	    }

	    function subimage (face, image, x_, y_, level_) {
	      check$1(!!image, 'must specify image data');
	      check$1(typeof face === 'number' && face === (face | 0) &&
	        face >= 0 && face < 6, 'invalid face');

	      var x = x_ | 0;
	      var y = y_ | 0;
	      var level = level_ | 0;

	      var imageData = allocImage();
	      copyFlags(imageData, texture);
	      imageData.width = 0;
	      imageData.height = 0;
	      parseImage(imageData, image);
	      imageData.width = imageData.width || ((texture.width >> level) - x);
	      imageData.height = imageData.height || ((texture.height >> level) - y);

	      check$1(
	        texture.type === imageData.type &&
	        texture.format === imageData.format &&
	        texture.internalformat === imageData.internalformat,
	        'incompatible format for texture.subimage');
	      check$1(
	        x >= 0 && y >= 0 &&
	        x + imageData.width <= texture.width &&
	        y + imageData.height <= texture.height,
	        'texture.subimage write out of bounds');
	      check$1(
	        texture.mipmask & (1 << level),
	        'missing mipmap data');
	      check$1(
	        imageData.data || imageData.element || imageData.needsCopy,
	        'missing image data');

	      tempBind(texture);
	      setSubImage(imageData, GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + face, x, y, level);
	      tempRestore();

	      freeImage(imageData);

	      return reglTextureCube
	    }

	    function resize (radius_) {
	      var radius = radius_ | 0;
	      if (radius === texture.width) {
	        return
	      }

	      reglTextureCube.width = texture.width = radius;
	      reglTextureCube.height = texture.height = radius;

	      tempBind(texture);
	      for (var i = 0; i < 6; ++i) {
	        for (var j = 0; texture.mipmask >> j; ++j) {
	          gl.texImage2D(
	            GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + i,
	            j,
	            texture.format,
	            radius >> j,
	            radius >> j,
	            0,
	            texture.format,
	            texture.type,
	            null);
	        }
	      }
	      tempRestore();

	      if (config.profile) {
	        texture.stats.size = getTextureSize(
	          texture.internalformat,
	          texture.type,
	          reglTextureCube.width,
	          reglTextureCube.height,
	          false,
	          true);
	      }

	      return reglTextureCube
	    }

	    reglTextureCube(a0, a1, a2, a3, a4, a5);

	    reglTextureCube.subimage = subimage;
	    reglTextureCube.resize = resize;
	    reglTextureCube._reglType = 'textureCube';
	    reglTextureCube._texture = texture;
	    if (config.profile) {
	      reglTextureCube.stats = texture.stats;
	    }
	    reglTextureCube.destroy = function () {
	      texture.decRef();
	    };

	    return reglTextureCube
	  }

	  // Called when regl is destroyed
	  function destroyTextures () {
	    for (var i = 0; i < numTexUnits; ++i) {
	      gl.activeTexture(GL_TEXTURE0$1 + i);
	      gl.bindTexture(GL_TEXTURE_2D$1, null);
	      textureUnits[i] = null;
	    }
	    values(textureSet).forEach(destroy);

	    stats.cubeCount = 0;
	    stats.textureCount = 0;
	  }

	  if (config.profile) {
	    stats.getTotalTextureSize = function () {
	      var total = 0;
	      Object.keys(textureSet).forEach(function (key) {
	        total += textureSet[key].stats.size;
	      });
	      return total
	    };
	  }

	  function restoreTextures () {
	    for (var i = 0; i < numTexUnits; ++i) {
	      var tex = textureUnits[i];
	      if (tex) {
	        tex.bindCount = 0;
	        tex.unit = -1;
	        textureUnits[i] = null;
	      }
	    }

	    values(textureSet).forEach(function (texture) {
	      texture.texture = gl.createTexture();
	      gl.bindTexture(texture.target, texture.texture);
	      for (var i = 0; i < 32; ++i) {
	        if ((texture.mipmask & (1 << i)) === 0) {
	          continue
	        }
	        if (texture.target === GL_TEXTURE_2D$1) {
	          gl.texImage2D(GL_TEXTURE_2D$1,
	            i,
	            texture.internalformat,
	            texture.width >> i,
	            texture.height >> i,
	            0,
	            texture.internalformat,
	            texture.type,
	            null);
	        } else {
	          for (var j = 0; j < 6; ++j) {
	            gl.texImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + j,
	              i,
	              texture.internalformat,
	              texture.width >> i,
	              texture.height >> i,
	              0,
	              texture.internalformat,
	              texture.type,
	              null);
	          }
	        }
	      }
	      setTexInfo(texture.texInfo, texture.target);
	    });
	  }

	  function refreshTextures () {
	    for (var i = 0; i < numTexUnits; ++i) {
	      var tex = textureUnits[i];
	      if (tex) {
	        tex.bindCount = 0;
	        tex.unit = -1;
	        textureUnits[i] = null;
	      }
	      gl.activeTexture(GL_TEXTURE0$1 + i);
	      gl.bindTexture(GL_TEXTURE_2D$1, null);
	      gl.bindTexture(GL_TEXTURE_CUBE_MAP$1, null);
	    }
	  }

	  return {
	    create2D: createTexture2D,
	    createCube: createTextureCube,
	    clear: destroyTextures,
	    getTexture: function (wrapper) {
	      return null
	    },
	    restore: restoreTextures,
	    refresh: refreshTextures
	  }
	}

	var GL_RENDERBUFFER = 0x8D41;

	var GL_RGBA4$1 = 0x8056;
	var GL_RGB5_A1$1 = 0x8057;
	var GL_RGB565$1 = 0x8D62;
	var GL_DEPTH_COMPONENT16 = 0x81A5;
	var GL_STENCIL_INDEX8 = 0x8D48;
	var GL_DEPTH_STENCIL$1 = 0x84F9;

	var GL_SRGB8_ALPHA8_EXT = 0x8C43;

	var GL_RGBA32F_EXT = 0x8814;

	var GL_RGBA16F_EXT = 0x881A;
	var GL_RGB16F_EXT = 0x881B;

	var FORMAT_SIZES = [];

	FORMAT_SIZES[GL_RGBA4$1] = 2;
	FORMAT_SIZES[GL_RGB5_A1$1] = 2;
	FORMAT_SIZES[GL_RGB565$1] = 2;

	FORMAT_SIZES[GL_DEPTH_COMPONENT16] = 2;
	FORMAT_SIZES[GL_STENCIL_INDEX8] = 1;
	FORMAT_SIZES[GL_DEPTH_STENCIL$1] = 4;

	FORMAT_SIZES[GL_SRGB8_ALPHA8_EXT] = 4;
	FORMAT_SIZES[GL_RGBA32F_EXT] = 16;
	FORMAT_SIZES[GL_RGBA16F_EXT] = 8;
	FORMAT_SIZES[GL_RGB16F_EXT] = 6;

	function getRenderbufferSize (format, width, height) {
	  return FORMAT_SIZES[format] * width * height
	}

	var wrapRenderbuffers = function (gl, extensions, limits, stats, config) {
	  var formatTypes = {
	    'rgba4': GL_RGBA4$1,
	    'rgb565': GL_RGB565$1,
	    'rgb5 a1': GL_RGB5_A1$1,
	    'depth': GL_DEPTH_COMPONENT16,
	    'stencil': GL_STENCIL_INDEX8,
	    'depth stencil': GL_DEPTH_STENCIL$1
	  };

	  if (extensions.ext_srgb) {
	    formatTypes['srgba'] = GL_SRGB8_ALPHA8_EXT;
	  }

	  if (extensions.ext_color_buffer_half_float) {
	    formatTypes['rgba16f'] = GL_RGBA16F_EXT;
	    formatTypes['rgb16f'] = GL_RGB16F_EXT;
	  }

	  if (extensions.webgl_color_buffer_float) {
	    formatTypes['rgba32f'] = GL_RGBA32F_EXT;
	  }

	  var formatTypesInvert = [];
	  Object.keys(formatTypes).forEach(function (key) {
	    var val = formatTypes[key];
	    formatTypesInvert[val] = key;
	  });

	  var renderbufferCount = 0;
	  var renderbufferSet = {};

	  function REGLRenderbuffer (renderbuffer) {
	    this.id = renderbufferCount++;
	    this.refCount = 1;

	    this.renderbuffer = renderbuffer;

	    this.format = GL_RGBA4$1;
	    this.width = 0;
	    this.height = 0;

	    if (config.profile) {
	      this.stats = { size: 0 };
	    }
	  }

	  REGLRenderbuffer.prototype.decRef = function () {
	    if (--this.refCount <= 0) {
	      destroy(this);
	    }
	  };

	  function destroy (rb) {
	    var handle = rb.renderbuffer;
	    check$1(handle, 'must not double destroy renderbuffer');
	    gl.bindRenderbuffer(GL_RENDERBUFFER, null);
	    gl.deleteRenderbuffer(handle);
	    rb.renderbuffer = null;
	    rb.refCount = 0;
	    delete renderbufferSet[rb.id];
	    stats.renderbufferCount--;
	  }

	  function createRenderbuffer (a, b) {
	    var renderbuffer = new REGLRenderbuffer(gl.createRenderbuffer());
	    renderbufferSet[renderbuffer.id] = renderbuffer;
	    stats.renderbufferCount++;

	    function reglRenderbuffer (a, b) {
	      var w = 0;
	      var h = 0;
	      var format = GL_RGBA4$1;

	      if (typeof a === 'object' && a) {
	        var options = a;
	        if ('shape' in options) {
	          var shape = options.shape;
	          check$1(Array.isArray(shape) && shape.length >= 2,
	            'invalid renderbuffer shape');
	          w = shape[0] | 0;
	          h = shape[1] | 0;
	        } else {
	          if ('radius' in options) {
	            w = h = options.radius | 0;
	          }
	          if ('width' in options) {
	            w = options.width | 0;
	          }
	          if ('height' in options) {
	            h = options.height | 0;
	          }
	        }
	        if ('format' in options) {
	          check$1.parameter(options.format, formatTypes,
	            'invalid renderbuffer format');
	          format = formatTypes[options.format];
	        }
	      } else if (typeof a === 'number') {
	        w = a | 0;
	        if (typeof b === 'number') {
	          h = b | 0;
	        } else {
	          h = w;
	        }
	      } else if (!a) {
	        w = h = 1;
	      } else {
	        check$1.raise('invalid arguments to renderbuffer constructor');
	      }

	      // check shape
	      check$1(
	        w > 0 && h > 0 &&
	        w <= limits.maxRenderbufferSize && h <= limits.maxRenderbufferSize,
	        'invalid renderbuffer size');

	      if (w === renderbuffer.width &&
	          h === renderbuffer.height &&
	          format === renderbuffer.format) {
	        return
	      }

	      reglRenderbuffer.width = renderbuffer.width = w;
	      reglRenderbuffer.height = renderbuffer.height = h;
	      renderbuffer.format = format;

	      gl.bindRenderbuffer(GL_RENDERBUFFER, renderbuffer.renderbuffer);
	      gl.renderbufferStorage(GL_RENDERBUFFER, format, w, h);

	      check$1(
	        gl.getError() === 0,
	        'invalid render buffer format');

	      if (config.profile) {
	        renderbuffer.stats.size = getRenderbufferSize(renderbuffer.format, renderbuffer.width, renderbuffer.height);
	      }
	      reglRenderbuffer.format = formatTypesInvert[renderbuffer.format];

	      return reglRenderbuffer
	    }

	    function resize (w_, h_) {
	      var w = w_ | 0;
	      var h = (h_ | 0) || w;

	      if (w === renderbuffer.width && h === renderbuffer.height) {
	        return reglRenderbuffer
	      }

	      // check shape
	      check$1(
	        w > 0 && h > 0 &&
	        w <= limits.maxRenderbufferSize && h <= limits.maxRenderbufferSize,
	        'invalid renderbuffer size');

	      reglRenderbuffer.width = renderbuffer.width = w;
	      reglRenderbuffer.height = renderbuffer.height = h;

	      gl.bindRenderbuffer(GL_RENDERBUFFER, renderbuffer.renderbuffer);
	      gl.renderbufferStorage(GL_RENDERBUFFER, renderbuffer.format, w, h);

	      check$1(
	        gl.getError() === 0,
	        'invalid render buffer format');

	      // also, recompute size.
	      if (config.profile) {
	        renderbuffer.stats.size = getRenderbufferSize(
	          renderbuffer.format, renderbuffer.width, renderbuffer.height);
	      }

	      return reglRenderbuffer
	    }

	    reglRenderbuffer(a, b);

	    reglRenderbuffer.resize = resize;
	    reglRenderbuffer._reglType = 'renderbuffer';
	    reglRenderbuffer._renderbuffer = renderbuffer;
	    if (config.profile) {
	      reglRenderbuffer.stats = renderbuffer.stats;
	    }
	    reglRenderbuffer.destroy = function () {
	      renderbuffer.decRef();
	    };

	    return reglRenderbuffer
	  }

	  if (config.profile) {
	    stats.getTotalRenderbufferSize = function () {
	      var total = 0;
	      Object.keys(renderbufferSet).forEach(function (key) {
	        total += renderbufferSet[key].stats.size;
	      });
	      return total
	    };
	  }

	  function restoreRenderbuffers () {
	    values(renderbufferSet).forEach(function (rb) {
	      rb.renderbuffer = gl.createRenderbuffer();
	      gl.bindRenderbuffer(GL_RENDERBUFFER, rb.renderbuffer);
	      gl.renderbufferStorage(GL_RENDERBUFFER, rb.format, rb.width, rb.height);
	    });
	    gl.bindRenderbuffer(GL_RENDERBUFFER, null);
	  }

	  return {
	    create: createRenderbuffer,
	    clear: function () {
	      values(renderbufferSet).forEach(destroy);
	    },
	    restore: restoreRenderbuffers
	  }
	};

	// We store these constants so that the minifier can inline them
	var GL_FRAMEBUFFER$1 = 0x8D40;
	var GL_RENDERBUFFER$1 = 0x8D41;

	var GL_TEXTURE_2D$2 = 0x0DE1;
	var GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 = 0x8515;

	var GL_COLOR_ATTACHMENT0$1 = 0x8CE0;
	var GL_DEPTH_ATTACHMENT = 0x8D00;
	var GL_STENCIL_ATTACHMENT = 0x8D20;
	var GL_DEPTH_STENCIL_ATTACHMENT = 0x821A;

	var GL_FRAMEBUFFER_COMPLETE$1 = 0x8CD5;
	var GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 0x8CD6;
	var GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 0x8CD7;
	var GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 0x8CD9;
	var GL_FRAMEBUFFER_UNSUPPORTED = 0x8CDD;

	var GL_HALF_FLOAT_OES$2 = 0x8D61;
	var GL_UNSIGNED_BYTE$6 = 0x1401;
	var GL_FLOAT$5 = 0x1406;

	var GL_RGB$1 = 0x1907;
	var GL_RGBA$2 = 0x1908;

	var GL_DEPTH_COMPONENT$1 = 0x1902;

	var colorTextureFormatEnums = [
	  GL_RGB$1,
	  GL_RGBA$2
	];

	// for every texture format, store
	// the number of channels
	var textureFormatChannels = [];
	textureFormatChannels[GL_RGBA$2] = 4;
	textureFormatChannels[GL_RGB$1] = 3;

	// for every texture type, store
	// the size in bytes.
	var textureTypeSizes = [];
	textureTypeSizes[GL_UNSIGNED_BYTE$6] = 1;
	textureTypeSizes[GL_FLOAT$5] = 4;
	textureTypeSizes[GL_HALF_FLOAT_OES$2] = 2;

	var GL_RGBA4$2 = 0x8056;
	var GL_RGB5_A1$2 = 0x8057;
	var GL_RGB565$2 = 0x8D62;
	var GL_DEPTH_COMPONENT16$1 = 0x81A5;
	var GL_STENCIL_INDEX8$1 = 0x8D48;
	var GL_DEPTH_STENCIL$2 = 0x84F9;

	var GL_SRGB8_ALPHA8_EXT$1 = 0x8C43;

	var GL_RGBA32F_EXT$1 = 0x8814;

	var GL_RGBA16F_EXT$1 = 0x881A;
	var GL_RGB16F_EXT$1 = 0x881B;

	var colorRenderbufferFormatEnums = [
	  GL_RGBA4$2,
	  GL_RGB5_A1$2,
	  GL_RGB565$2,
	  GL_SRGB8_ALPHA8_EXT$1,
	  GL_RGBA16F_EXT$1,
	  GL_RGB16F_EXT$1,
	  GL_RGBA32F_EXT$1
	];

	var statusCode = {};
	statusCode[GL_FRAMEBUFFER_COMPLETE$1] = 'complete';
	statusCode[GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT] = 'incomplete attachment';
	statusCode[GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS] = 'incomplete dimensions';
	statusCode[GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT] = 'incomplete, missing attachment';
	statusCode[GL_FRAMEBUFFER_UNSUPPORTED] = 'unsupported';

	function wrapFBOState (
	  gl,
	  extensions,
	  limits,
	  textureState,
	  renderbufferState,
	  stats) {
	  var framebufferState = {
	    cur: null,
	    next: null,
	    dirty: false,
	    setFBO: null
	  };

	  var colorTextureFormats = ['rgba'];
	  var colorRenderbufferFormats = ['rgba4', 'rgb565', 'rgb5 a1'];

	  if (extensions.ext_srgb) {
	    colorRenderbufferFormats.push('srgba');
	  }

	  if (extensions.ext_color_buffer_half_float) {
	    colorRenderbufferFormats.push('rgba16f', 'rgb16f');
	  }

	  if (extensions.webgl_color_buffer_float) {
	    colorRenderbufferFormats.push('rgba32f');
	  }

	  var colorTypes = ['uint8'];
	  if (extensions.oes_texture_half_float) {
	    colorTypes.push('half float', 'float16');
	  }
	  if (extensions.oes_texture_float) {
	    colorTypes.push('float', 'float32');
	  }

	  function FramebufferAttachment (target, texture, renderbuffer) {
	    this.target = target;
	    this.texture = texture;
	    this.renderbuffer = renderbuffer;

	    var w = 0;
	    var h = 0;
	    if (texture) {
	      w = texture.width;
	      h = texture.height;
	    } else if (renderbuffer) {
	      w = renderbuffer.width;
	      h = renderbuffer.height;
	    }
	    this.width = w;
	    this.height = h;
	  }

	  function decRef (attachment) {
	    if (attachment) {
	      if (attachment.texture) {
	        attachment.texture._texture.decRef();
	      }
	      if (attachment.renderbuffer) {
	        attachment.renderbuffer._renderbuffer.decRef();
	      }
	    }
	  }

	  function incRefAndCheckShape (attachment, width, height) {
	    if (!attachment) {
	      return
	    }
	    if (attachment.texture) {
	      var texture = attachment.texture._texture;
	      var tw = Math.max(1, texture.width);
	      var th = Math.max(1, texture.height);
	      check$1(tw === width && th === height,
	        'inconsistent width/height for supplied texture');
	      texture.refCount += 1;
	    } else {
	      var renderbuffer = attachment.renderbuffer._renderbuffer;
	      check$1(
	        renderbuffer.width === width && renderbuffer.height === height,
	        'inconsistent width/height for renderbuffer');
	      renderbuffer.refCount += 1;
	    }
	  }

	  function attach (location, attachment) {
	    if (attachment) {
	      if (attachment.texture) {
	        gl.framebufferTexture2D(
	          GL_FRAMEBUFFER$1,
	          location,
	          attachment.target,
	          attachment.texture._texture.texture,
	          0);
	      } else {
	        gl.framebufferRenderbuffer(
	          GL_FRAMEBUFFER$1,
	          location,
	          GL_RENDERBUFFER$1,
	          attachment.renderbuffer._renderbuffer.renderbuffer);
	      }
	    }
	  }

	  function parseAttachment (attachment) {
	    var target = GL_TEXTURE_2D$2;
	    var texture = null;
	    var renderbuffer = null;

	    var data = attachment;
	    if (typeof attachment === 'object') {
	      data = attachment.data;
	      if ('target' in attachment) {
	        target = attachment.target | 0;
	      }
	    }

	    check$1.type(data, 'function', 'invalid attachment data');

	    var type = data._reglType;
	    if (type === 'texture2d') {
	      texture = data;
	      check$1(target === GL_TEXTURE_2D$2);
	    } else if (type === 'textureCube') {
	      texture = data;
	      check$1(
	        target >= GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 &&
	        target < GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 + 6,
	        'invalid cube map target');
	    } else if (type === 'renderbuffer') {
	      renderbuffer = data;
	      target = GL_RENDERBUFFER$1;
	    } else {
	      check$1.raise('invalid regl object for attachment');
	    }

	    return new FramebufferAttachment(target, texture, renderbuffer)
	  }

	  function allocAttachment (
	    width,
	    height,
	    isTexture,
	    format,
	    type) {
	    if (isTexture) {
	      var texture = textureState.create2D({
	        width: width,
	        height: height,
	        format: format,
	        type: type
	      });
	      texture._texture.refCount = 0;
	      return new FramebufferAttachment(GL_TEXTURE_2D$2, texture, null)
	    } else {
	      var rb = renderbufferState.create({
	        width: width,
	        height: height,
	        format: format
	      });
	      rb._renderbuffer.refCount = 0;
	      return new FramebufferAttachment(GL_RENDERBUFFER$1, null, rb)
	    }
	  }

	  function unwrapAttachment (attachment) {
	    return attachment && (attachment.texture || attachment.renderbuffer)
	  }

	  function resizeAttachment (attachment, w, h) {
	    if (attachment) {
	      if (attachment.texture) {
	        attachment.texture.resize(w, h);
	      } else if (attachment.renderbuffer) {
	        attachment.renderbuffer.resize(w, h);
	      }
	      attachment.width = w;
	      attachment.height = h;
	    }
	  }

	  var framebufferCount = 0;
	  var framebufferSet = {};

	  function REGLFramebuffer () {
	    this.id = framebufferCount++;
	    framebufferSet[this.id] = this;

	    this.framebuffer = gl.createFramebuffer();
	    this.width = 0;
	    this.height = 0;

	    this.colorAttachments = [];
	    this.depthAttachment = null;
	    this.stencilAttachment = null;
	    this.depthStencilAttachment = null;
	  }

	  function decFBORefs (framebuffer) {
	    framebuffer.colorAttachments.forEach(decRef);
	    decRef(framebuffer.depthAttachment);
	    decRef(framebuffer.stencilAttachment);
	    decRef(framebuffer.depthStencilAttachment);
	  }

	  function destroy (framebuffer) {
	    var handle = framebuffer.framebuffer;
	    check$1(handle, 'must not double destroy framebuffer');
	    gl.deleteFramebuffer(handle);
	    framebuffer.framebuffer = null;
	    stats.framebufferCount--;
	    delete framebufferSet[framebuffer.id];
	  }

	  function updateFramebuffer (framebuffer) {
	    var i;

	    gl.bindFramebuffer(GL_FRAMEBUFFER$1, framebuffer.framebuffer);
	    var colorAttachments = framebuffer.colorAttachments;
	    for (i = 0; i < colorAttachments.length; ++i) {
	      attach(GL_COLOR_ATTACHMENT0$1 + i, colorAttachments[i]);
	    }
	    for (i = colorAttachments.length; i < limits.maxColorAttachments; ++i) {
	      gl.framebufferTexture2D(
	        GL_FRAMEBUFFER$1,
	        GL_COLOR_ATTACHMENT0$1 + i,
	        GL_TEXTURE_2D$2,
	        null,
	        0);
	    }

	    gl.framebufferTexture2D(
	      GL_FRAMEBUFFER$1,
	      GL_DEPTH_STENCIL_ATTACHMENT,
	      GL_TEXTURE_2D$2,
	      null,
	      0);
	    gl.framebufferTexture2D(
	      GL_FRAMEBUFFER$1,
	      GL_DEPTH_ATTACHMENT,
	      GL_TEXTURE_2D$2,
	      null,
	      0);
	    gl.framebufferTexture2D(
	      GL_FRAMEBUFFER$1,
	      GL_STENCIL_ATTACHMENT,
	      GL_TEXTURE_2D$2,
	      null,
	      0);

	    attach(GL_DEPTH_ATTACHMENT, framebuffer.depthAttachment);
	    attach(GL_STENCIL_ATTACHMENT, framebuffer.stencilAttachment);
	    attach(GL_DEPTH_STENCIL_ATTACHMENT, framebuffer.depthStencilAttachment);

	    // Check status code
	    var status = gl.checkFramebufferStatus(GL_FRAMEBUFFER$1);
	    if (!gl.isContextLost() && status !== GL_FRAMEBUFFER_COMPLETE$1) {
	      check$1.raise('framebuffer configuration not supported, status = ' +
	        statusCode[status]);
	    }

	    gl.bindFramebuffer(GL_FRAMEBUFFER$1, framebufferState.next ? framebufferState.next.framebuffer : null);
	    framebufferState.cur = framebufferState.next;

	    // FIXME: Clear error code here.  This is a work around for a bug in
	    // headless-gl
	    gl.getError();
	  }

	  function createFBO (a0, a1) {
	    var framebuffer = new REGLFramebuffer();
	    stats.framebufferCount++;

	    function reglFramebuffer (a, b) {
	      var i;

	      check$1(framebufferState.next !== framebuffer,
	        'can not update framebuffer which is currently in use');

	      var width = 0;
	      var height = 0;

	      var needsDepth = true;
	      var needsStencil = true;

	      var colorBuffer = null;
	      var colorTexture = true;
	      var colorFormat = 'rgba';
	      var colorType = 'uint8';
	      var colorCount = 1;

	      var depthBuffer = null;
	      var stencilBuffer = null;
	      var depthStencilBuffer = null;
	      var depthStencilTexture = false;

	      if (typeof a === 'number') {
	        width = a | 0;
	        height = (b | 0) || width;
	      } else if (!a) {
	        width = height = 1;
	      } else {
	        check$1.type(a, 'object', 'invalid arguments for framebuffer');
	        var options = a;

	        if ('shape' in options) {
	          var shape = options.shape;
	          check$1(Array.isArray(shape) && shape.length >= 2,
	            'invalid shape for framebuffer');
	          width = shape[0];
	          height = shape[1];
	        } else {
	          if ('radius' in options) {
	            width = height = options.radius;
	          }
	          if ('width' in options) {
	            width = options.width;
	          }
	          if ('height' in options) {
	            height = options.height;
	          }
	        }

	        if ('color' in options ||
	            'colors' in options) {
	          colorBuffer =
	            options.color ||
	            options.colors;
	          if (Array.isArray(colorBuffer)) {
	            check$1(
	              colorBuffer.length === 1 || extensions.webgl_draw_buffers,
	              'multiple render targets not supported');
	          }
	        }

	        if (!colorBuffer) {
	          if ('colorCount' in options) {
	            colorCount = options.colorCount | 0;
	            check$1(colorCount > 0, 'invalid color buffer count');
	          }

	          if ('colorTexture' in options) {
	            colorTexture = !!options.colorTexture;
	            colorFormat = 'rgba4';
	          }

	          if ('colorType' in options) {
	            colorType = options.colorType;
	            if (!colorTexture) {
	              if (colorType === 'half float' || colorType === 'float16') {
	                check$1(extensions.ext_color_buffer_half_float,
	                  'you must enable EXT_color_buffer_half_float to use 16-bit render buffers');
	                colorFormat = 'rgba16f';
	              } else if (colorType === 'float' || colorType === 'float32') {
	                check$1(extensions.webgl_color_buffer_float,
	                  'you must enable WEBGL_color_buffer_float in order to use 32-bit floating point renderbuffers');
	                colorFormat = 'rgba32f';
	              }
	            } else {
	              check$1(extensions.oes_texture_float ||
	                !(colorType === 'float' || colorType === 'float32'),
	              'you must enable OES_texture_float in order to use floating point framebuffer objects');
	              check$1(extensions.oes_texture_half_float ||
	                !(colorType === 'half float' || colorType === 'float16'),
	              'you must enable OES_texture_half_float in order to use 16-bit floating point framebuffer objects');
	            }
	            check$1.oneOf(colorType, colorTypes, 'invalid color type');
	          }

	          if ('colorFormat' in options) {
	            colorFormat = options.colorFormat;
	            if (colorTextureFormats.indexOf(colorFormat) >= 0) {
	              colorTexture = true;
	            } else if (colorRenderbufferFormats.indexOf(colorFormat) >= 0) {
	              colorTexture = false;
	            } else {
	              check$1.optional(function () {
	                if (colorTexture) {
	                  check$1.oneOf(
	                    options.colorFormat, colorTextureFormats,
	                    'invalid color format for texture');
	                } else {
	                  check$1.oneOf(
	                    options.colorFormat, colorRenderbufferFormats,
	                    'invalid color format for renderbuffer');
	                }
	              });
	            }
	          }
	        }

	        if ('depthTexture' in options || 'depthStencilTexture' in options) {
	          depthStencilTexture = !!(options.depthTexture ||
	            options.depthStencilTexture);
	          check$1(!depthStencilTexture || extensions.webgl_depth_texture,
	            'webgl_depth_texture extension not supported');
	        }

	        if ('depth' in options) {
	          if (typeof options.depth === 'boolean') {
	            needsDepth = options.depth;
	          } else {
	            depthBuffer = options.depth;
	            needsStencil = false;
	          }
	        }

	        if ('stencil' in options) {
	          if (typeof options.stencil === 'boolean') {
	            needsStencil = options.stencil;
	          } else {
	            stencilBuffer = options.stencil;
	            needsDepth = false;
	          }
	        }

	        if ('depthStencil' in options) {
	          if (typeof options.depthStencil === 'boolean') {
	            needsDepth = needsStencil = options.depthStencil;
	          } else {
	            depthStencilBuffer = options.depthStencil;
	            needsDepth = false;
	            needsStencil = false;
	          }
	        }
	      }

	      // parse attachments
	      var colorAttachments = null;
	      var depthAttachment = null;
	      var stencilAttachment = null;
	      var depthStencilAttachment = null;

	      // Set up color attachments
	      if (Array.isArray(colorBuffer)) {
	        colorAttachments = colorBuffer.map(parseAttachment);
	      } else if (colorBuffer) {
	        colorAttachments = [parseAttachment(colorBuffer)];
	      } else {
	        colorAttachments = new Array(colorCount);
	        for (i = 0; i < colorCount; ++i) {
	          colorAttachments[i] = allocAttachment(
	            width,
	            height,
	            colorTexture,
	            colorFormat,
	            colorType);
	        }
	      }

	      check$1(extensions.webgl_draw_buffers || colorAttachments.length <= 1,
	        'you must enable the WEBGL_draw_buffers extension in order to use multiple color buffers.');
	      check$1(colorAttachments.length <= limits.maxColorAttachments,
	        'too many color attachments, not supported');

	      width = width || colorAttachments[0].width;
	      height = height || colorAttachments[0].height;

	      if (depthBuffer) {
	        depthAttachment = parseAttachment(depthBuffer);
	      } else if (needsDepth && !needsStencil) {
	        depthAttachment = allocAttachment(
	          width,
	          height,
	          depthStencilTexture,
	          'depth',
	          'uint32');
	      }

	      if (stencilBuffer) {
	        stencilAttachment = parseAttachment(stencilBuffer);
	      } else if (needsStencil && !needsDepth) {
	        stencilAttachment = allocAttachment(
	          width,
	          height,
	          false,
	          'stencil',
	          'uint8');
	      }

	      if (depthStencilBuffer) {
	        depthStencilAttachment = parseAttachment(depthStencilBuffer);
	      } else if (!depthBuffer && !stencilBuffer && needsStencil && needsDepth) {
	        depthStencilAttachment = allocAttachment(
	          width,
	          height,
	          depthStencilTexture,
	          'depth stencil',
	          'depth stencil');
	      }

	      check$1(
	        (!!depthBuffer) + (!!stencilBuffer) + (!!depthStencilBuffer) <= 1,
	        'invalid framebuffer configuration, can specify exactly one depth/stencil attachment');

	      var commonColorAttachmentSize = null;

	      for (i = 0; i < colorAttachments.length; ++i) {
	        incRefAndCheckShape(colorAttachments[i], width, height);
	        check$1(!colorAttachments[i] ||
	          (colorAttachments[i].texture &&
	            colorTextureFormatEnums.indexOf(colorAttachments[i].texture._texture.format) >= 0) ||
	          (colorAttachments[i].renderbuffer &&
	            colorRenderbufferFormatEnums.indexOf(colorAttachments[i].renderbuffer._renderbuffer.format) >= 0),
	        'framebuffer color attachment ' + i + ' is invalid');

	        if (colorAttachments[i] && colorAttachments[i].texture) {
	          var colorAttachmentSize =
	              textureFormatChannels[colorAttachments[i].texture._texture.format] *
	              textureTypeSizes[colorAttachments[i].texture._texture.type];

	          if (commonColorAttachmentSize === null) {
	            commonColorAttachmentSize = colorAttachmentSize;
	          } else {
	            // We need to make sure that all color attachments have the same number of bitplanes
	            // (that is, the same numer of bits per pixel)
	            // This is required by the GLES2.0 standard. See the beginning of Chapter 4 in that document.
	            check$1(commonColorAttachmentSize === colorAttachmentSize,
	              'all color attachments much have the same number of bits per pixel.');
	          }
	        }
	      }
	      incRefAndCheckShape(depthAttachment, width, height);
	      check$1(!depthAttachment ||
	        (depthAttachment.texture &&
	          depthAttachment.texture._texture.format === GL_DEPTH_COMPONENT$1) ||
	        (depthAttachment.renderbuffer &&
	          depthAttachment.renderbuffer._renderbuffer.format === GL_DEPTH_COMPONENT16$1),
	      'invalid depth attachment for framebuffer object');
	      incRefAndCheckShape(stencilAttachment, width, height);
	      check$1(!stencilAttachment ||
	        (stencilAttachment.renderbuffer &&
	          stencilAttachment.renderbuffer._renderbuffer.format === GL_STENCIL_INDEX8$1),
	      'invalid stencil attachment for framebuffer object');
	      incRefAndCheckShape(depthStencilAttachment, width, height);
	      check$1(!depthStencilAttachment ||
	        (depthStencilAttachment.texture &&
	          depthStencilAttachment.texture._texture.format === GL_DEPTH_STENCIL$2) ||
	        (depthStencilAttachment.renderbuffer &&
	          depthStencilAttachment.renderbuffer._renderbuffer.format === GL_DEPTH_STENCIL$2),
	      'invalid depth-stencil attachment for framebuffer object');

	      // decrement references
	      decFBORefs(framebuffer);

	      framebuffer.width = width;
	      framebuffer.height = height;

	      framebuffer.colorAttachments = colorAttachments;
	      framebuffer.depthAttachment = depthAttachment;
	      framebuffer.stencilAttachment = stencilAttachment;
	      framebuffer.depthStencilAttachment = depthStencilAttachment;

	      reglFramebuffer.color = colorAttachments.map(unwrapAttachment);
	      reglFramebuffer.depth = unwrapAttachment(depthAttachment);
	      reglFramebuffer.stencil = unwrapAttachment(stencilAttachment);
	      reglFramebuffer.depthStencil = unwrapAttachment(depthStencilAttachment);

	      reglFramebuffer.width = framebuffer.width;
	      reglFramebuffer.height = framebuffer.height;

	      updateFramebuffer(framebuffer);

	      return reglFramebuffer
	    }

	    function resize (w_, h_) {
	      check$1(framebufferState.next !== framebuffer,
	        'can not resize a framebuffer which is currently in use');

	      var w = Math.max(w_ | 0, 1);
	      var h = Math.max((h_ | 0) || w, 1);
	      if (w === framebuffer.width && h === framebuffer.height) {
	        return reglFramebuffer
	      }

	      // resize all buffers
	      var colorAttachments = framebuffer.colorAttachments;
	      for (var i = 0; i < colorAttachments.length; ++i) {
	        resizeAttachment(colorAttachments[i], w, h);
	      }
	      resizeAttachment(framebuffer.depthAttachment, w, h);
	      resizeAttachment(framebuffer.stencilAttachment, w, h);
	      resizeAttachment(framebuffer.depthStencilAttachment, w, h);

	      framebuffer.width = reglFramebuffer.width = w;
	      framebuffer.height = reglFramebuffer.height = h;

	      updateFramebuffer(framebuffer);

	      return reglFramebuffer
	    }

	    reglFramebuffer(a0, a1);

	    return extend(reglFramebuffer, {
	      resize: resize,
	      _reglType: 'framebuffer',
	      _framebuffer: framebuffer,
	      destroy: function () {
	        destroy(framebuffer);
	        decFBORefs(framebuffer);
	      },
	      use: function (block) {
	        framebufferState.setFBO({
	          framebuffer: reglFramebuffer
	        }, block);
	      }
	    })
	  }

	  function createCubeFBO (options) {
	    var faces = Array(6);

	    function reglFramebufferCube (a) {
	      var i;

	      check$1(faces.indexOf(framebufferState.next) < 0,
	        'can not update framebuffer which is currently in use');

	      var params = {
	        color: null
	      };

	      var radius = 0;

	      var colorBuffer = null;
	      var colorFormat = 'rgba';
	      var colorType = 'uint8';
	      var colorCount = 1;

	      if (typeof a === 'number') {
	        radius = a | 0;
	      } else if (!a) {
	        radius = 1;
	      } else {
	        check$1.type(a, 'object', 'invalid arguments for framebuffer');
	        var options = a;

	        if ('shape' in options) {
	          var shape = options.shape;
	          check$1(
	            Array.isArray(shape) && shape.length >= 2,
	            'invalid shape for framebuffer');
	          check$1(
	            shape[0] === shape[1],
	            'cube framebuffer must be square');
	          radius = shape[0];
	        } else {
	          if ('radius' in options) {
	            radius = options.radius | 0;
	          }
	          if ('width' in options) {
	            radius = options.width | 0;
	            if ('height' in options) {
	              check$1(options.height === radius, 'must be square');
	            }
	          } else if ('height' in options) {
	            radius = options.height | 0;
	          }
	        }

	        if ('color' in options ||
	            'colors' in options) {
	          colorBuffer =
	            options.color ||
	            options.colors;
	          if (Array.isArray(colorBuffer)) {
	            check$1(
	              colorBuffer.length === 1 || extensions.webgl_draw_buffers,
	              'multiple render targets not supported');
	          }
	        }

	        if (!colorBuffer) {
	          if ('colorCount' in options) {
	            colorCount = options.colorCount | 0;
	            check$1(colorCount > 0, 'invalid color buffer count');
	          }

	          if ('colorType' in options) {
	            check$1.oneOf(
	              options.colorType, colorTypes,
	              'invalid color type');
	            colorType = options.colorType;
	          }

	          if ('colorFormat' in options) {
	            colorFormat = options.colorFormat;
	            check$1.oneOf(
	              options.colorFormat, colorTextureFormats,
	              'invalid color format for texture');
	          }
	        }

	        if ('depth' in options) {
	          params.depth = options.depth;
	        }

	        if ('stencil' in options) {
	          params.stencil = options.stencil;
	        }

	        if ('depthStencil' in options) {
	          params.depthStencil = options.depthStencil;
	        }
	      }

	      var colorCubes;
	      if (colorBuffer) {
	        if (Array.isArray(colorBuffer)) {
	          colorCubes = [];
	          for (i = 0; i < colorBuffer.length; ++i) {
	            colorCubes[i] = colorBuffer[i];
	          }
	        } else {
	          colorCubes = [ colorBuffer ];
	        }
	      } else {
	        colorCubes = Array(colorCount);
	        var cubeMapParams = {
	          radius: radius,
	          format: colorFormat,
	          type: colorType
	        };
	        for (i = 0; i < colorCount; ++i) {
	          colorCubes[i] = textureState.createCube(cubeMapParams);
	        }
	      }

	      // Check color cubes
	      params.color = Array(colorCubes.length);
	      for (i = 0; i < colorCubes.length; ++i) {
	        var cube = colorCubes[i];
	        check$1(
	          typeof cube === 'function' && cube._reglType === 'textureCube',
	          'invalid cube map');
	        radius = radius || cube.width;
	        check$1(
	          cube.width === radius && cube.height === radius,
	          'invalid cube map shape');
	        params.color[i] = {
	          target: GL_TEXTURE_CUBE_MAP_POSITIVE_X$2,
	          data: colorCubes[i]
	        };
	      }

	      for (i = 0; i < 6; ++i) {
	        for (var j = 0; j < colorCubes.length; ++j) {
	          params.color[j].target = GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 + i;
	        }
	        // reuse depth-stencil attachments across all cube maps
	        if (i > 0) {
	          params.depth = faces[0].depth;
	          params.stencil = faces[0].stencil;
	          params.depthStencil = faces[0].depthStencil;
	        }
	        if (faces[i]) {
	          (faces[i])(params);
	        } else {
	          faces[i] = createFBO(params);
	        }
	      }

	      return extend(reglFramebufferCube, {
	        width: radius,
	        height: radius,
	        color: colorCubes
	      })
	    }

	    function resize (radius_) {
	      var i;
	      var radius = radius_ | 0;
	      check$1(radius > 0 && radius <= limits.maxCubeMapSize,
	        'invalid radius for cube fbo');

	      if (radius === reglFramebufferCube.width) {
	        return reglFramebufferCube
	      }

	      var colors = reglFramebufferCube.color;
	      for (i = 0; i < colors.length; ++i) {
	        colors[i].resize(radius);
	      }

	      for (i = 0; i < 6; ++i) {
	        faces[i].resize(radius);
	      }

	      reglFramebufferCube.width = reglFramebufferCube.height = radius;

	      return reglFramebufferCube
	    }

	    reglFramebufferCube(options);

	    return extend(reglFramebufferCube, {
	      faces: faces,
	      resize: resize,
	      _reglType: 'framebufferCube',
	      destroy: function () {
	        faces.forEach(function (f) {
	          f.destroy();
	        });
	      }
	    })
	  }

	  function restoreFramebuffers () {
	    framebufferState.cur = null;
	    framebufferState.next = null;
	    framebufferState.dirty = true;
	    values(framebufferSet).forEach(function (fb) {
	      fb.framebuffer = gl.createFramebuffer();
	      updateFramebuffer(fb);
	    });
	  }

	  return extend(framebufferState, {
	    getFramebuffer: function (object) {
	      if (typeof object === 'function' && object._reglType === 'framebuffer') {
	        var fbo = object._framebuffer;
	        if (fbo instanceof REGLFramebuffer) {
	          return fbo
	        }
	      }
	      return null
	    },
	    create: createFBO,
	    createCube: createCubeFBO,
	    clear: function () {
	      values(framebufferSet).forEach(destroy);
	    },
	    restore: restoreFramebuffers
	  })
	}

	var GL_FLOAT$6 = 5126;
	var GL_ARRAY_BUFFER$1 = 34962;
	var GL_ELEMENT_ARRAY_BUFFER$1 = 34963;

	var VAO_OPTIONS = [
	  'attributes',
	  'elements',
	  'offset',
	  'count',
	  'primitive',
	  'instances'
	];

	function AttributeRecord () {
	  this.state = 0;

	  this.x = 0.0;
	  this.y = 0.0;
	  this.z = 0.0;
	  this.w = 0.0;

	  this.buffer = null;
	  this.size = 0;
	  this.normalized = false;
	  this.type = GL_FLOAT$6;
	  this.offset = 0;
	  this.stride = 0;
	  this.divisor = 0;
	}

	function wrapAttributeState (
	  gl,
	  extensions,
	  limits,
	  stats,
	  bufferState,
	  elementState,
	  drawState) {
	  var NUM_ATTRIBUTES = limits.maxAttributes;
	  var attributeBindings = new Array(NUM_ATTRIBUTES);
	  for (var i = 0; i < NUM_ATTRIBUTES; ++i) {
	    attributeBindings[i] = new AttributeRecord();
	  }
	  var vaoCount = 0;
	  var vaoSet = {};

	  var state = {
	    Record: AttributeRecord,
	    scope: {},
	    state: attributeBindings,
	    currentVAO: null,
	    targetVAO: null,
	    restore: extVAO() ? restoreVAO : function () {},
	    createVAO: createVAO,
	    getVAO: getVAO,
	    destroyBuffer: destroyBuffer,
	    setVAO: extVAO() ? setVAOEXT : setVAOEmulated,
	    clear: extVAO() ? destroyVAOEXT : function () {}
	  };

	  function destroyBuffer (buffer) {
	    for (var i = 0; i < attributeBindings.length; ++i) {
	      var record = attributeBindings[i];
	      if (record.buffer === buffer) {
	        gl.disableVertexAttribArray(i);
	        record.buffer = null;
	      }
	    }
	  }

	  function extVAO () {
	    return extensions.oes_vertex_array_object
	  }

	  function extInstanced () {
	    return extensions.angle_instanced_arrays
	  }

	  function getVAO (vao) {
	    if (typeof vao === 'function' && vao._vao) {
	      return vao._vao
	    }
	    return null
	  }

	  function setVAOEXT (vao) {
	    if (vao === state.currentVAO) {
	      return
	    }
	    var ext = extVAO();
	    if (vao) {
	      ext.bindVertexArrayOES(vao.vao);
	    } else {
	      ext.bindVertexArrayOES(null);
	    }
	    state.currentVAO = vao;
	  }

	  function setVAOEmulated (vao) {
	    if (vao === state.currentVAO) {
	      return
	    }
	    if (vao) {
	      vao.bindAttrs();
	    } else {
	      var exti = extInstanced();
	      for (var i = 0; i < attributeBindings.length; ++i) {
	        var binding = attributeBindings[i];
	        if (binding.buffer) {
	          gl.enableVertexAttribArray(i);
	          binding.buffer.bind();
	          gl.vertexAttribPointer(i, binding.size, binding.type, binding.normalized, binding.stride, binding.offfset);
	          if (exti && binding.divisor) {
	            exti.vertexAttribDivisorANGLE(i, binding.divisor);
	          }
	        } else {
	          gl.disableVertexAttribArray(i);
	          gl.vertexAttrib4f(i, binding.x, binding.y, binding.z, binding.w);
	        }
	      }
	      if (drawState.elements) {
	        gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER$1, drawState.elements.buffer.buffer);
	      } else {
	        gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER$1, null);
	      }
	    }
	    state.currentVAO = vao;
	  }

	  function destroyVAOEXT () {
	    values(vaoSet).forEach(function (vao) {
	      vao.destroy();
	    });
	  }

	  function REGLVAO () {
	    this.id = ++vaoCount;
	    this.attributes = [];
	    this.elements = null;
	    this.ownsElements = false;
	    this.count = 0;
	    this.offset = 0;
	    this.instances = -1;
	    this.primitive = 4;
	    var extension = extVAO();
	    if (extension) {
	      this.vao = extension.createVertexArrayOES();
	    } else {
	      this.vao = null;
	    }
	    vaoSet[this.id] = this;
	    this.buffers = [];
	  }

	  REGLVAO.prototype.bindAttrs = function () {
	    var exti = extInstanced();
	    var attributes = this.attributes;
	    for (var i = 0; i < attributes.length; ++i) {
	      var attr = attributes[i];
	      if (attr.buffer) {
	        gl.enableVertexAttribArray(i);
	        gl.bindBuffer(GL_ARRAY_BUFFER$1, attr.buffer.buffer);
	        gl.vertexAttribPointer(i, attr.size, attr.type, attr.normalized, attr.stride, attr.offset);
	        if (exti && attr.divisor) {
	          exti.vertexAttribDivisorANGLE(i, attr.divisor);
	        }
	      } else {
	        gl.disableVertexAttribArray(i);
	        gl.vertexAttrib4f(i, attr.x, attr.y, attr.z, attr.w);
	      }
	    }
	    for (var j = attributes.length; j < NUM_ATTRIBUTES; ++j) {
	      gl.disableVertexAttribArray(j);
	    }
	    var elements = elementState.getElements(this.elements);
	    if (elements) {
	      gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER$1, elements.buffer.buffer);
	    } else {
	      gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER$1, null);
	    }
	  };

	  REGLVAO.prototype.refresh = function () {
	    var ext = extVAO();
	    if (ext) {
	      ext.bindVertexArrayOES(this.vao);
	      this.bindAttrs();
	      state.currentVAO = null;
	      ext.bindVertexArrayOES(null);
	    }
	  };

	  REGLVAO.prototype.destroy = function () {
	    if (this.vao) {
	      var extension = extVAO();
	      if (this === state.currentVAO) {
	        state.currentVAO = null;
	        extension.bindVertexArrayOES(null);
	      }
	      extension.deleteVertexArrayOES(this.vao);
	      this.vao = null;
	    }
	    if (this.ownsElements) {
	      this.elements.destroy();
	      this.elements = null;
	      this.ownsElements = false;
	    }
	    if (vaoSet[this.id]) {
	      delete vaoSet[this.id];
	      stats.vaoCount -= 1;
	    }
	  };

	  function restoreVAO () {
	    var ext = extVAO();
	    if (ext) {
	      values(vaoSet).forEach(function (vao) {
	        vao.refresh();
	      });
	    }
	  }

	  function createVAO (_attr) {
	    var vao = new REGLVAO();
	    stats.vaoCount += 1;

	    function updateVAO (options) {
	      var attributes;
	      if (Array.isArray(options)) {
	        attributes = options;
	        if (vao.elements && vao.ownsElements) {
	          vao.elements.destroy();
	        }
	        vao.elements = null;
	        vao.ownsElements = false;
	        vao.offset = 0;
	        vao.count = 0;
	        vao.instances = -1;
	        vao.primitive = 4;
	      } else {
	        check$1(typeof options === 'object', 'invalid arguments for create vao');
	        check$1('attributes' in options, 'must specify attributes for vao');
	        if (options.elements) {
	          var elements = options.elements;
	          if (vao.ownsElements) {
	            if (typeof elements === 'function' && elements._reglType === 'elements') {
	              vao.elements.destroy();
	              vao.ownsElements = false;
	            } else {
	              vao.elements(elements);
	              vao.ownsElements = false;
	            }
	          } else if (elementState.getElements(options.elements)) {
	            vao.elements = options.elements;
	            vao.ownsElements = false;
	          } else {
	            vao.elements = elementState.create(options.elements);
	            vao.ownsElements = true;
	          }
	        } else {
	          vao.elements = null;
	          vao.ownsElements = false;
	        }
	        attributes = options.attributes;

	        // set default vao
	        vao.offset = 0;
	        vao.count = -1;
	        vao.instances = -1;
	        vao.primitive = 4;

	        // copy element properties
	        if (vao.elements) {
	          vao.count = vao.elements._elements.vertCount;
	          vao.primitive = vao.elements._elements.primType;
	        }

	        if ('offset' in options) {
	          vao.offset = options.offset | 0;
	        }
	        if ('count' in options) {
	          vao.count = options.count | 0;
	        }
	        if ('instances' in options) {
	          vao.instances = options.instances | 0;
	        }
	        if ('primitive' in options) {
	          check$1(options.primitive in primTypes, 'bad primitive type: ' + options.primitive);
	          vao.primitive = primTypes[options.primitive];
	        }

	        check$1.optional(() => {
	          var keys = Object.keys(options);
	          for (var i = 0; i < keys.length; ++i) {
	            check$1(VAO_OPTIONS.indexOf(keys[i]) >= 0, 'invalid option for vao: "' + keys[i] + '" valid options are ' + VAO_OPTIONS);
	          }
	        });
	        check$1(Array.isArray(attributes), 'attributes must be an array');
	      }

	      check$1(attributes.length < NUM_ATTRIBUTES, 'too many attributes');
	      check$1(attributes.length > 0, 'must specify at least one attribute');

	      var bufUpdated = {};
	      var nattributes = vao.attributes;
	      nattributes.length = attributes.length;
	      for (var i = 0; i < attributes.length; ++i) {
	        var spec = attributes[i];
	        var rec = nattributes[i] = new AttributeRecord();
	        var data = spec.data || spec;
	        if (Array.isArray(data) || isTypedArray(data) || isNDArrayLike(data)) {
	          var buf;
	          if (vao.buffers[i]) {
	            buf = vao.buffers[i];
	            if (isTypedArray(data) && buf._buffer.byteLength >= data.byteLength) {
	              buf.subdata(data);
	            } else {
	              buf.destroy();
	              vao.buffers[i] = null;
	            }
	          }
	          if (!vao.buffers[i]) {
	            buf = vao.buffers[i] = bufferState.create(spec, GL_ARRAY_BUFFER$1, false, true);
	          }
	          rec.buffer = bufferState.getBuffer(buf);
	          rec.size = rec.buffer.dimension | 0;
	          rec.normalized = false;
	          rec.type = rec.buffer.dtype;
	          rec.offset = 0;
	          rec.stride = 0;
	          rec.divisor = 0;
	          rec.state = 1;
	          bufUpdated[i] = 1;
	        } else if (bufferState.getBuffer(spec)) {
	          rec.buffer = bufferState.getBuffer(spec);
	          rec.size = rec.buffer.dimension | 0;
	          rec.normalized = false;
	          rec.type = rec.buffer.dtype;
	          rec.offset = 0;
	          rec.stride = 0;
	          rec.divisor = 0;
	          rec.state = 1;
	        } else if (bufferState.getBuffer(spec.buffer)) {
	          rec.buffer = bufferState.getBuffer(spec.buffer);
	          rec.size = ((+spec.size) || rec.buffer.dimension) | 0;
	          rec.normalized = !!spec.normalized || false;
	          if ('type' in spec) {
	            check$1.parameter(spec.type, glTypes, 'invalid buffer type');
	            rec.type = glTypes[spec.type];
	          } else {
	            rec.type = rec.buffer.dtype;
	          }
	          rec.offset = (spec.offset || 0) | 0;
	          rec.stride = (spec.stride || 0) | 0;
	          rec.divisor = (spec.divisor || 0) | 0;
	          rec.state = 1;

	          check$1(rec.size >= 1 && rec.size <= 4, 'size must be between 1 and 4');
	          check$1(rec.offset >= 0, 'invalid offset');
	          check$1(rec.stride >= 0 && rec.stride <= 255, 'stride must be between 0 and 255');
	          check$1(rec.divisor >= 0, 'divisor must be positive');
	          check$1(!rec.divisor || !!extensions.angle_instanced_arrays, 'ANGLE_instanced_arrays must be enabled to use divisor');
	        } else if ('x' in spec) {
	          check$1(i > 0, 'first attribute must not be a constant');
	          rec.x = +spec.x || 0;
	          rec.y = +spec.y || 0;
	          rec.z = +spec.z || 0;
	          rec.w = +spec.w || 0;
	          rec.state = 2;
	        } else {
	          check$1(false, 'invalid attribute spec for location ' + i);
	        }
	      }

	      // retire unused buffers
	      for (var j = 0; j < vao.buffers.length; ++j) {
	        if (!bufUpdated[j] && vao.buffers[j]) {
	          vao.buffers[j].destroy();
	          vao.buffers[j] = null;
	        }
	      }

	      vao.refresh();
	      return updateVAO
	    }

	    updateVAO.destroy = function () {
	      for (var j = 0; j < vao.buffers.length; ++j) {
	        if (vao.buffers[j]) {
	          vao.buffers[j].destroy();
	        }
	      }
	      vao.buffers.length = 0;

	      if (vao.ownsElements) {
	        vao.elements.destroy();
	        vao.elements = null;
	        vao.ownsElements = false;
	      }

	      vao.destroy();
	    };

	    updateVAO._vao = vao;
	    updateVAO._reglType = 'vao';

	    return updateVAO(_attr)
	  }

	  return state
	}

	var GL_FRAGMENT_SHADER = 35632;
	var GL_VERTEX_SHADER = 35633;

	var GL_ACTIVE_UNIFORMS = 0x8B86;
	var GL_ACTIVE_ATTRIBUTES = 0x8B89;

	function wrapShaderState (gl, stringStore, stats, config) {
	  // ===================================================
	  // glsl compilation and linking
	  // ===================================================
	  var fragShaders = {};
	  var vertShaders = {};

	  function ActiveInfo (name, id, location, info) {
	    this.name = name;
	    this.id = id;
	    this.location = location;
	    this.info = info;
	  }

	  function insertActiveInfo (list, info) {
	    for (var i = 0; i < list.length; ++i) {
	      if (list[i].id === info.id) {
	        list[i].location = info.location;
	        return
	      }
	    }
	    list.push(info);
	  }

	  function getShader (type, id, command) {
	    var cache = type === GL_FRAGMENT_SHADER ? fragShaders : vertShaders;
	    var shader = cache[id];

	    if (!shader) {
	      var source = stringStore.str(id);
	      shader = gl.createShader(type);
	      gl.shaderSource(shader, source);
	      gl.compileShader(shader);
	      check$1.shaderError(gl, shader, source, type, command);
	      cache[id] = shader;
	    }

	    return shader
	  }

	  // ===================================================
	  // program linking
	  // ===================================================
	  var programCache = {};
	  var programList = [];

	  var PROGRAM_COUNTER = 0;

	  function REGLProgram (fragId, vertId) {
	    this.id = PROGRAM_COUNTER++;
	    this.fragId = fragId;
	    this.vertId = vertId;
	    this.program = null;
	    this.uniforms = [];
	    this.attributes = [];
	    this.refCount = 1;

	    if (config.profile) {
	      this.stats = {
	        uniformsCount: 0,
	        attributesCount: 0
	      };
	    }
	  }

	  function linkProgram (desc, command, attributeLocations) {
	    var i, info;

	    // -------------------------------
	    // compile & link
	    // -------------------------------
	    var fragShader = getShader(GL_FRAGMENT_SHADER, desc.fragId);
	    var vertShader = getShader(GL_VERTEX_SHADER, desc.vertId);

	    var program = desc.program = gl.createProgram();
	    gl.attachShader(program, fragShader);
	    gl.attachShader(program, vertShader);
	    if (attributeLocations) {
	      for (i = 0; i < attributeLocations.length; ++i) {
	        var binding = attributeLocations[i];
	        gl.bindAttribLocation(program, binding[0], binding[1]);
	      }
	    }

	    gl.linkProgram(program);
	    check$1.linkError(
	      gl,
	      program,
	      stringStore.str(desc.fragId),
	      stringStore.str(desc.vertId),
	      command);

	    // -------------------------------
	    // grab uniforms
	    // -------------------------------
	    var numUniforms = gl.getProgramParameter(program, GL_ACTIVE_UNIFORMS);
	    if (config.profile) {
	      desc.stats.uniformsCount = numUniforms;
	    }
	    var uniforms = desc.uniforms;
	    for (i = 0; i < numUniforms; ++i) {
	      info = gl.getActiveUniform(program, i);
	      if (info) {
	        if (info.size > 1) {
	          for (var j = 0; j < info.size; ++j) {
	            var name = info.name.replace('[0]', '[' + j + ']');
	            insertActiveInfo(uniforms, new ActiveInfo(
	              name,
	              stringStore.id(name),
	              gl.getUniformLocation(program, name),
	              info));
	          }
	        }
	        var uniName = info.name;
	        if (info.size > 1) {
	          uniName = uniName.replace('[0]', '');
	        }
	        insertActiveInfo(uniforms, new ActiveInfo(
	          uniName,
	          stringStore.id(uniName),
	          gl.getUniformLocation(program, uniName),
	          info));
	      }
	    }

	    // -------------------------------
	    // grab attributes
	    // -------------------------------
	    var numAttributes = gl.getProgramParameter(program, GL_ACTIVE_ATTRIBUTES);
	    if (config.profile) {
	      desc.stats.attributesCount = numAttributes;
	    }

	    var attributes = desc.attributes;
	    for (i = 0; i < numAttributes; ++i) {
	      info = gl.getActiveAttrib(program, i);
	      if (info) {
	        insertActiveInfo(attributes, new ActiveInfo(
	          info.name,
	          stringStore.id(info.name),
	          gl.getAttribLocation(program, info.name),
	          info));
	      }
	    }
	  }

	  if (config.profile) {
	    stats.getMaxUniformsCount = function () {
	      var m = 0;
	      programList.forEach(function (desc) {
	        if (desc.stats.uniformsCount > m) {
	          m = desc.stats.uniformsCount;
	        }
	      });
	      return m
	    };

	    stats.getMaxAttributesCount = function () {
	      var m = 0;
	      programList.forEach(function (desc) {
	        if (desc.stats.attributesCount > m) {
	          m = desc.stats.attributesCount;
	        }
	      });
	      return m
	    };
	  }

	  function restoreShaders () {
	    fragShaders = {};
	    vertShaders = {};
	    for (var i = 0; i < programList.length; ++i) {
	      linkProgram(programList[i], null, programList[i].attributes.map(function (info) {
	        return [info.location, info.name]
	      }));
	    }
	  }

	  return {
	    clear: function () {
	      var deleteShader = gl.deleteShader.bind(gl);
	      values(fragShaders).forEach(deleteShader);
	      fragShaders = {};
	      values(vertShaders).forEach(deleteShader);
	      vertShaders = {};

	      programList.forEach(function (desc) {
	        gl.deleteProgram(desc.program);
	      });
	      programList.length = 0;
	      programCache = {};

	      stats.shaderCount = 0;
	    },

	    program: function (vertId, fragId, command, attribLocations) {
	      check$1.command(vertId >= 0, 'missing vertex shader', command);
	      check$1.command(fragId >= 0, 'missing fragment shader', command);

	      var cache = programCache[fragId];
	      if (!cache) {
	        cache = programCache[fragId] = {};
	      }
	      var prevProgram = cache[vertId];
	      if (prevProgram) {
	        prevProgram.refCount++;
	        if (!attribLocations) {
	          return prevProgram
	        }
	      }
	      var program = new REGLProgram(fragId, vertId);
	      stats.shaderCount++;
	      linkProgram(program, command, attribLocations);
	      if (!prevProgram) {
	        cache[vertId] = program;
	      }
	      programList.push(program);
	      return extend(program, {
	        destroy: function () {
	          program.refCount--;
	          if (program.refCount <= 0) {
	            gl.deleteProgram(program.program);
	            var idx = programList.indexOf(program);
	            programList.splice(idx, 1);
	            stats.shaderCount--;
	          }
	          // no program is linked to this vert anymore
	          if (cache[program.vertId].refCount <= 0) {
	            gl.deleteShader(vertShaders[program.vertId]);
	            delete vertShaders[program.vertId];
	            delete programCache[program.fragId][program.vertId];
	          }
	          // no program is linked to this frag anymore
	          if (!Object.keys(programCache[program.fragId]).length) {
	            gl.deleteShader(fragShaders[program.fragId]);
	            delete fragShaders[program.fragId];
	            delete programCache[program.fragId];
	          }
	        }
	      })
	    },

	    restore: restoreShaders,

	    shader: getShader,

	    frag: -1,
	    vert: -1
	  }
	}

	var GL_RGBA$3 = 6408;
	var GL_UNSIGNED_BYTE$7 = 5121;
	var GL_PACK_ALIGNMENT = 0x0D05;
	var GL_FLOAT$7 = 0x1406; // 5126

	function wrapReadPixels (
	  gl,
	  framebufferState,
	  reglPoll,
	  context,
	  glAttributes,
	  extensions,
	  limits) {
	  function readPixelsImpl (input) {
	    var type;
	    if (framebufferState.next === null) {
	      check$1(
	        glAttributes.preserveDrawingBuffer,
	        'you must create a webgl context with "preserveDrawingBuffer":true in order to read pixels from the drawing buffer');
	      type = GL_UNSIGNED_BYTE$7;
	    } else {
	      check$1(
	        framebufferState.next.colorAttachments[0].texture !== null,
	        'You cannot read from a renderbuffer');
	      type = framebufferState.next.colorAttachments[0].texture._texture.type;

	      check$1.optional(function () {
	        if (extensions.oes_texture_float) {
	          check$1(
	            type === GL_UNSIGNED_BYTE$7 || type === GL_FLOAT$7,
	            'Reading from a framebuffer is only allowed for the types \'uint8\' and \'float\'');

	          if (type === GL_FLOAT$7) {
	            check$1(limits.readFloat, 'Reading \'float\' values is not permitted in your browser. For a fallback, please see: https://www.npmjs.com/package/glsl-read-float');
	          }
	        } else {
	          check$1(
	            type === GL_UNSIGNED_BYTE$7,
	            'Reading from a framebuffer is only allowed for the type \'uint8\'');
	        }
	      });
	    }

	    var x = 0;
	    var y = 0;
	    var width = context.framebufferWidth;
	    var height = context.framebufferHeight;
	    var data = null;

	    if (isTypedArray(input)) {
	      data = input;
	    } else if (input) {
	      check$1.type(input, 'object', 'invalid arguments to regl.read()');
	      x = input.x | 0;
	      y = input.y | 0;
	      check$1(
	        x >= 0 && x < context.framebufferWidth,
	        'invalid x offset for regl.read');
	      check$1(
	        y >= 0 && y < context.framebufferHeight,
	        'invalid y offset for regl.read');
	      width = (input.width || (context.framebufferWidth - x)) | 0;
	      height = (input.height || (context.framebufferHeight - y)) | 0;
	      data = input.data || null;
	    }

	    // sanity check input.data
	    if (data) {
	      if (type === GL_UNSIGNED_BYTE$7) {
	        check$1(
	          data instanceof Uint8Array,
	          'buffer must be \'Uint8Array\' when reading from a framebuffer of type \'uint8\'');
	      } else if (type === GL_FLOAT$7) {
	        check$1(
	          data instanceof Float32Array,
	          'buffer must be \'Float32Array\' when reading from a framebuffer of type \'float\'');
	      }
	    }

	    check$1(
	      width > 0 && width + x <= context.framebufferWidth,
	      'invalid width for read pixels');
	    check$1(
	      height > 0 && height + y <= context.framebufferHeight,
	      'invalid height for read pixels');

	    // Update WebGL state
	    reglPoll();

	    // Compute size
	    var size = width * height * 4;

	    // Allocate data
	    if (!data) {
	      if (type === GL_UNSIGNED_BYTE$7) {
	        data = new Uint8Array(size);
	      } else if (type === GL_FLOAT$7) {
	        data = data || new Float32Array(size);
	      }
	    }

	    // Type check
	    check$1.isTypedArray(data, 'data buffer for regl.read() must be a typedarray');
	    check$1(data.byteLength >= size, 'data buffer for regl.read() too small');

	    // Run read pixels
	    gl.pixelStorei(GL_PACK_ALIGNMENT, 4);
	    gl.readPixels(x, y, width, height, GL_RGBA$3,
	      type,
	      data);

	    return data
	  }

	  function readPixelsFBO (options) {
	    var result;
	    framebufferState.setFBO({
	      framebuffer: options.framebuffer
	    }, function () {
	      result = readPixelsImpl(options);
	    });
	    return result
	  }

	  function readPixels (options) {
	    if (!options || !('framebuffer' in options)) {
	      return readPixelsImpl(options)
	    } else {
	      return readPixelsFBO(options)
	    }
	  }

	  return readPixels
	}

	function slice (x) {
	  return Array.prototype.slice.call(x)
	}

	function join (x) {
	  return slice(x).join('')
	}

	function createEnvironment () {
	  // Unique variable id counter
	  var varCounter = 0;

	  // Linked values are passed from this scope into the generated code block
	  // Calling link() passes a value into the generated scope and returns
	  // the variable name which it is bound to
	  var linkedNames = [];
	  var linkedValues = [];
	  function link (value) {
	    for (var i = 0; i < linkedValues.length; ++i) {
	      if (linkedValues[i] === value) {
	        return linkedNames[i]
	      }
	    }

	    var name = 'g' + (varCounter++);
	    linkedNames.push(name);
	    linkedValues.push(value);
	    return name
	  }

	  // create a code block
	  function block () {
	    var code = [];
	    function push () {
	      code.push.apply(code, slice(arguments));
	    }

	    var vars = [];
	    function def () {
	      var name = 'v' + (varCounter++);
	      vars.push(name);

	      if (arguments.length > 0) {
	        code.push(name, '=');
	        code.push.apply(code, slice(arguments));
	        code.push(';');
	      }

	      return name
	    }

	    return extend(push, {
	      def: def,
	      toString: function () {
	        return join([
	          (vars.length > 0 ? 'var ' + vars.join(',') + ';' : ''),
	          join(code)
	        ])
	      }
	    })
	  }

	  function scope () {
	    var entry = block();
	    var exit = block();

	    var entryToString = entry.toString;
	    var exitToString = exit.toString;

	    function save (object, prop) {
	      exit(object, prop, '=', entry.def(object, prop), ';');
	    }

	    return extend(function () {
	      entry.apply(entry, slice(arguments));
	    }, {
	      def: entry.def,
	      entry: entry,
	      exit: exit,
	      save: save,
	      set: function (object, prop, value) {
	        save(object, prop);
	        entry(object, prop, '=', value, ';');
	      },
	      toString: function () {
	        return entryToString() + exitToString()
	      }
	    })
	  }

	  function conditional () {
	    var pred = join(arguments);
	    var thenBlock = scope();
	    var elseBlock = scope();

	    var thenToString = thenBlock.toString;
	    var elseToString = elseBlock.toString;

	    return extend(thenBlock, {
	      then: function () {
	        thenBlock.apply(thenBlock, slice(arguments));
	        return this
	      },
	      else: function () {
	        elseBlock.apply(elseBlock, slice(arguments));
	        return this
	      },
	      toString: function () {
	        var elseClause = elseToString();
	        if (elseClause) {
	          elseClause = 'else{' + elseClause + '}';
	        }
	        return join([
	          'if(', pred, '){',
	          thenToString(),
	          '}', elseClause
	        ])
	      }
	    })
	  }

	  // procedure list
	  var globalBlock = block();
	  var procedures = {};
	  function proc (name, count) {
	    var args = [];
	    function arg () {
	      var name = 'a' + args.length;
	      args.push(name);
	      return name
	    }

	    count = count || 0;
	    for (var i = 0; i < count; ++i) {
	      arg();
	    }

	    var body = scope();
	    var bodyToString = body.toString;

	    var result = procedures[name] = extend(body, {
	      arg: arg,
	      toString: function () {
	        return join([
	          'function(', args.join(), '){',
	          bodyToString(),
	          '}'
	        ])
	      }
	    });

	    return result
	  }

	  function compile () {
	    var code = ['"use strict";',
	      globalBlock,
	      'return {'];
	    Object.keys(procedures).forEach(function (name) {
	      code.push('"', name, '":', procedures[name].toString(), ',');
	    });
	    code.push('}');
	    var src = join(code)
	      .replace(/;/g, ';\n')
	      .replace(/}/g, '}\n')
	      .replace(/{/g, '{\n');
	    var proc = Function.apply(null, linkedNames.concat(src));
	    return proc.apply(null, linkedValues)
	  }

	  return {
	    global: globalBlock,
	    link: link,
	    block: block,
	    proc: proc,
	    scope: scope,
	    cond: conditional,
	    compile: compile
	  }
	}

	// "cute" names for vector components
	var CUTE_COMPONENTS = 'xyzw'.split('');

	var GL_UNSIGNED_BYTE$8 = 5121;

	var ATTRIB_STATE_POINTER = 1;
	var ATTRIB_STATE_CONSTANT = 2;

	var DYN_FUNC$1 = 0;
	var DYN_PROP$1 = 1;
	var DYN_CONTEXT$1 = 2;
	var DYN_STATE$1 = 3;
	var DYN_THUNK = 4;
	var DYN_CONSTANT$1 = 5;
	var DYN_ARRAY$1 = 6;

	var S_DITHER = 'dither';
	var S_BLEND_ENABLE = 'blend.enable';
	var S_BLEND_COLOR = 'blend.color';
	var S_BLEND_EQUATION = 'blend.equation';
	var S_BLEND_FUNC = 'blend.func';
	var S_DEPTH_ENABLE = 'depth.enable';
	var S_DEPTH_FUNC = 'depth.func';
	var S_DEPTH_RANGE = 'depth.range';
	var S_DEPTH_MASK = 'depth.mask';
	var S_COLOR_MASK = 'colorMask';
	var S_CULL_ENABLE = 'cull.enable';
	var S_CULL_FACE = 'cull.face';
	var S_FRONT_FACE = 'frontFace';
	var S_LINE_WIDTH = 'lineWidth';
	var S_POLYGON_OFFSET_ENABLE = 'polygonOffset.enable';
	var S_POLYGON_OFFSET_OFFSET = 'polygonOffset.offset';
	var S_SAMPLE_ALPHA = 'sample.alpha';
	var S_SAMPLE_ENABLE = 'sample.enable';
	var S_SAMPLE_COVERAGE = 'sample.coverage';
	var S_STENCIL_ENABLE = 'stencil.enable';
	var S_STENCIL_MASK = 'stencil.mask';
	var S_STENCIL_FUNC = 'stencil.func';
	var S_STENCIL_OPFRONT = 'stencil.opFront';
	var S_STENCIL_OPBACK = 'stencil.opBack';
	var S_SCISSOR_ENABLE = 'scissor.enable';
	var S_SCISSOR_BOX = 'scissor.box';
	var S_VIEWPORT = 'viewport';

	var S_PROFILE = 'profile';

	var S_FRAMEBUFFER = 'framebuffer';
	var S_VERT = 'vert';
	var S_FRAG = 'frag';
	var S_ELEMENTS = 'elements';
	var S_PRIMITIVE = 'primitive';
	var S_COUNT = 'count';
	var S_OFFSET = 'offset';
	var S_INSTANCES = 'instances';
	var S_VAO = 'vao';

	var SUFFIX_WIDTH = 'Width';
	var SUFFIX_HEIGHT = 'Height';

	var S_FRAMEBUFFER_WIDTH = S_FRAMEBUFFER + SUFFIX_WIDTH;
	var S_FRAMEBUFFER_HEIGHT = S_FRAMEBUFFER + SUFFIX_HEIGHT;
	var S_VIEWPORT_WIDTH = S_VIEWPORT + SUFFIX_WIDTH;
	var S_VIEWPORT_HEIGHT = S_VIEWPORT + SUFFIX_HEIGHT;
	var S_DRAWINGBUFFER = 'drawingBuffer';
	var S_DRAWINGBUFFER_WIDTH = S_DRAWINGBUFFER + SUFFIX_WIDTH;
	var S_DRAWINGBUFFER_HEIGHT = S_DRAWINGBUFFER + SUFFIX_HEIGHT;

	var NESTED_OPTIONS = [
	  S_BLEND_FUNC,
	  S_BLEND_EQUATION,
	  S_STENCIL_FUNC,
	  S_STENCIL_OPFRONT,
	  S_STENCIL_OPBACK,
	  S_SAMPLE_COVERAGE,
	  S_VIEWPORT,
	  S_SCISSOR_BOX,
	  S_POLYGON_OFFSET_OFFSET
	];

	var GL_ARRAY_BUFFER$2 = 34962;
	var GL_ELEMENT_ARRAY_BUFFER$2 = 34963;

	var GL_FRAGMENT_SHADER$1 = 35632;
	var GL_VERTEX_SHADER$1 = 35633;

	var GL_TEXTURE_2D$3 = 0x0DE1;
	var GL_TEXTURE_CUBE_MAP$2 = 0x8513;

	var GL_CULL_FACE = 0x0B44;
	var GL_BLEND = 0x0BE2;
	var GL_DITHER = 0x0BD0;
	var GL_STENCIL_TEST = 0x0B90;
	var GL_DEPTH_TEST = 0x0B71;
	var GL_SCISSOR_TEST = 0x0C11;
	var GL_POLYGON_OFFSET_FILL = 0x8037;
	var GL_SAMPLE_ALPHA_TO_COVERAGE = 0x809E;
	var GL_SAMPLE_COVERAGE = 0x80A0;

	var GL_FLOAT$8 = 5126;
	var GL_FLOAT_VEC2 = 35664;
	var GL_FLOAT_VEC3 = 35665;
	var GL_FLOAT_VEC4 = 35666;
	var GL_INT$3 = 5124;
	var GL_INT_VEC2 = 35667;
	var GL_INT_VEC3 = 35668;
	var GL_INT_VEC4 = 35669;
	var GL_BOOL = 35670;
	var GL_BOOL_VEC2 = 35671;
	var GL_BOOL_VEC3 = 35672;
	var GL_BOOL_VEC4 = 35673;
	var GL_FLOAT_MAT2 = 35674;
	var GL_FLOAT_MAT3 = 35675;
	var GL_FLOAT_MAT4 = 35676;
	var GL_SAMPLER_2D = 35678;
	var GL_SAMPLER_CUBE = 35680;

	var GL_TRIANGLES$1 = 4;

	var GL_FRONT = 1028;
	var GL_BACK = 1029;
	var GL_CW = 0x0900;
	var GL_CCW = 0x0901;
	var GL_MIN_EXT = 0x8007;
	var GL_MAX_EXT = 0x8008;
	var GL_ALWAYS = 519;
	var GL_KEEP = 7680;
	var GL_ZERO = 0;
	var GL_ONE = 1;
	var GL_FUNC_ADD = 0x8006;
	var GL_LESS = 513;

	var GL_FRAMEBUFFER$2 = 0x8D40;
	var GL_COLOR_ATTACHMENT0$2 = 0x8CE0;

	var blendFuncs = {
	  '0': 0,
	  '1': 1,
	  'zero': 0,
	  'one': 1,
	  'src color': 768,
	  'one minus src color': 769,
	  'src alpha': 770,
	  'one minus src alpha': 771,
	  'dst color': 774,
	  'one minus dst color': 775,
	  'dst alpha': 772,
	  'one minus dst alpha': 773,
	  'constant color': 32769,
	  'one minus constant color': 32770,
	  'constant alpha': 32771,
	  'one minus constant alpha': 32772,
	  'src alpha saturate': 776
	};

	// There are invalid values for srcRGB and dstRGB. See:
	// https://www.khronos.org/registry/webgl/specs/1.0/#6.13
	// https://github.com/KhronosGroup/WebGL/blob/0d3201f5f7ec3c0060bc1f04077461541f1987b9/conformance-suites/1.0.3/conformance/misc/webgl-specific.html#L56
	var invalidBlendCombinations = [
	  'constant color, constant alpha',
	  'one minus constant color, constant alpha',
	  'constant color, one minus constant alpha',
	  'one minus constant color, one minus constant alpha',
	  'constant alpha, constant color',
	  'constant alpha, one minus constant color',
	  'one minus constant alpha, constant color',
	  'one minus constant alpha, one minus constant color'
	];

	var compareFuncs = {
	  'never': 512,
	  'less': 513,
	  '<': 513,
	  'equal': 514,
	  '=': 514,
	  '==': 514,
	  '===': 514,
	  'lequal': 515,
	  '<=': 515,
	  'greater': 516,
	  '>': 516,
	  'notequal': 517,
	  '!=': 517,
	  '!==': 517,
	  'gequal': 518,
	  '>=': 518,
	  'always': 519
	};

	var stencilOps = {
	  '0': 0,
	  'zero': 0,
	  'keep': 7680,
	  'replace': 7681,
	  'increment': 7682,
	  'decrement': 7683,
	  'increment wrap': 34055,
	  'decrement wrap': 34056,
	  'invert': 5386
	};

	var shaderType = {
	  'frag': GL_FRAGMENT_SHADER$1,
	  'vert': GL_VERTEX_SHADER$1
	};

	var orientationType = {
	  'cw': GL_CW,
	  'ccw': GL_CCW
	};

	function isBufferArgs (x) {
	  return Array.isArray(x) ||
	    isTypedArray(x) ||
	    isNDArrayLike(x)
	}

	// Make sure viewport is processed first
	function sortState (state) {
	  return state.sort(function (a, b) {
	    if (a === S_VIEWPORT) {
	      return -1
	    } else if (b === S_VIEWPORT) {
	      return 1
	    }
	    return (a < b) ? -1 : 1
	  })
	}

	function Declaration (thisDep, contextDep, propDep, append) {
	  this.thisDep = thisDep;
	  this.contextDep = contextDep;
	  this.propDep = propDep;
	  this.append = append;
	}

	function isStatic (decl) {
	  return decl && !(decl.thisDep || decl.contextDep || decl.propDep)
	}

	function createStaticDecl (append) {
	  return new Declaration(false, false, false, append)
	}

	function createDynamicDecl (dyn, append) {
	  var type = dyn.type;
	  if (type === DYN_FUNC$1) {
	    var numArgs = dyn.data.length;
	    return new Declaration(
	      true,
	      numArgs >= 1,
	      numArgs >= 2,
	      append)
	  } else if (type === DYN_THUNK) {
	    var data = dyn.data;
	    return new Declaration(
	      data.thisDep,
	      data.contextDep,
	      data.propDep,
	      append)
	  } else if (type === DYN_CONSTANT$1) {
	    return new Declaration(
	      false,
	      false,
	      false,
	      append)
	  } else if (type === DYN_ARRAY$1) {
	    var thisDep = false;
	    var contextDep = false;
	    var propDep = false;
	    for (var i = 0; i < dyn.data.length; ++i) {
	      var subDyn = dyn.data[i];
	      if (subDyn.type === DYN_PROP$1) {
	        propDep = true;
	      } else if (subDyn.type === DYN_CONTEXT$1) {
	        contextDep = true;
	      } else if (subDyn.type === DYN_STATE$1) {
	        thisDep = true;
	      } else if (subDyn.type === DYN_FUNC$1) {
	        thisDep = true;
	        var subArgs = subDyn.data;
	        if (subArgs >= 1) {
	          contextDep = true;
	        }
	        if (subArgs >= 2) {
	          propDep = true;
	        }
	      } else if (subDyn.type === DYN_THUNK) {
	        thisDep = thisDep || subDyn.data.thisDep;
	        contextDep = contextDep || subDyn.data.contextDep;
	        propDep = propDep || subDyn.data.propDep;
	      }
	    }
	    return new Declaration(
	      thisDep,
	      contextDep,
	      propDep,
	      append)
	  } else {
	    return new Declaration(
	      type === DYN_STATE$1,
	      type === DYN_CONTEXT$1,
	      type === DYN_PROP$1,
	      append)
	  }
	}

	var SCOPE_DECL = new Declaration(false, false, false, function () {});

	function reglCore (
	  gl,
	  stringStore,
	  extensions,
	  limits,
	  bufferState,
	  elementState,
	  textureState,
	  framebufferState,
	  uniformState,
	  attributeState,
	  shaderState,
	  drawState,
	  contextState,
	  timer,
	  config) {
	  var AttributeRecord = attributeState.Record;

	  var blendEquations = {
	    'add': 32774,
	    'subtract': 32778,
	    'reverse subtract': 32779
	  };
	  if (extensions.ext_blend_minmax) {
	    blendEquations.min = GL_MIN_EXT;
	    blendEquations.max = GL_MAX_EXT;
	  }

	  var extInstancing = extensions.angle_instanced_arrays;
	  var extDrawBuffers = extensions.webgl_draw_buffers;
	  var extVertexArrays = extensions.oes_vertex_array_object;

	  // ===================================================
	  // ===================================================
	  // WEBGL STATE
	  // ===================================================
	  // ===================================================
	  var currentState = {
	    dirty: true,
	    profile: config.profile
	  };
	  var nextState = {};
	  var GL_STATE_NAMES = [];
	  var GL_FLAGS = {};
	  var GL_VARIABLES = {};

	  function propName (name) {
	    return name.replace('.', '_')
	  }

	  function stateFlag (sname, cap, init) {
	    var name = propName(sname);
	    GL_STATE_NAMES.push(sname);
	    nextState[name] = currentState[name] = !!init;
	    GL_FLAGS[name] = cap;
	  }

	  function stateVariable (sname, func, init) {
	    var name = propName(sname);
	    GL_STATE_NAMES.push(sname);
	    if (Array.isArray(init)) {
	      currentState[name] = init.slice();
	      nextState[name] = init.slice();
	    } else {
	      currentState[name] = nextState[name] = init;
	    }
	    GL_VARIABLES[name] = func;
	  }

	  // Dithering
	  stateFlag(S_DITHER, GL_DITHER);

	  // Blending
	  stateFlag(S_BLEND_ENABLE, GL_BLEND);
	  stateVariable(S_BLEND_COLOR, 'blendColor', [0, 0, 0, 0]);
	  stateVariable(S_BLEND_EQUATION, 'blendEquationSeparate',
	    [GL_FUNC_ADD, GL_FUNC_ADD]);
	  stateVariable(S_BLEND_FUNC, 'blendFuncSeparate',
	    [GL_ONE, GL_ZERO, GL_ONE, GL_ZERO]);

	  // Depth
	  stateFlag(S_DEPTH_ENABLE, GL_DEPTH_TEST, true);
	  stateVariable(S_DEPTH_FUNC, 'depthFunc', GL_LESS);
	  stateVariable(S_DEPTH_RANGE, 'depthRange', [0, 1]);
	  stateVariable(S_DEPTH_MASK, 'depthMask', true);

	  // Color mask
	  stateVariable(S_COLOR_MASK, S_COLOR_MASK, [true, true, true, true]);

	  // Face culling
	  stateFlag(S_CULL_ENABLE, GL_CULL_FACE);
	  stateVariable(S_CULL_FACE, 'cullFace', GL_BACK);

	  // Front face orientation
	  stateVariable(S_FRONT_FACE, S_FRONT_FACE, GL_CCW);

	  // Line width
	  stateVariable(S_LINE_WIDTH, S_LINE_WIDTH, 1);

	  // Polygon offset
	  stateFlag(S_POLYGON_OFFSET_ENABLE, GL_POLYGON_OFFSET_FILL);
	  stateVariable(S_POLYGON_OFFSET_OFFSET, 'polygonOffset', [0, 0]);

	  // Sample coverage
	  stateFlag(S_SAMPLE_ALPHA, GL_SAMPLE_ALPHA_TO_COVERAGE);
	  stateFlag(S_SAMPLE_ENABLE, GL_SAMPLE_COVERAGE);
	  stateVariable(S_SAMPLE_COVERAGE, 'sampleCoverage', [1, false]);

	  // Stencil
	  stateFlag(S_STENCIL_ENABLE, GL_STENCIL_TEST);
	  stateVariable(S_STENCIL_MASK, 'stencilMask', -1);
	  stateVariable(S_STENCIL_FUNC, 'stencilFunc', [GL_ALWAYS, 0, -1]);
	  stateVariable(S_STENCIL_OPFRONT, 'stencilOpSeparate',
	    [GL_FRONT, GL_KEEP, GL_KEEP, GL_KEEP]);
	  stateVariable(S_STENCIL_OPBACK, 'stencilOpSeparate',
	    [GL_BACK, GL_KEEP, GL_KEEP, GL_KEEP]);

	  // Scissor
	  stateFlag(S_SCISSOR_ENABLE, GL_SCISSOR_TEST);
	  stateVariable(S_SCISSOR_BOX, 'scissor',
	    [0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight]);

	  // Viewport
	  stateVariable(S_VIEWPORT, S_VIEWPORT,
	    [0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight]);

	  // ===================================================
	  // ===================================================
	  // ENVIRONMENT
	  // ===================================================
	  // ===================================================
	  var sharedState = {
	    gl: gl,
	    context: contextState,
	    strings: stringStore,
	    next: nextState,
	    current: currentState,
	    draw: drawState,
	    elements: elementState,
	    buffer: bufferState,
	    shader: shaderState,
	    attributes: attributeState.state,
	    vao: attributeState,
	    uniforms: uniformState,
	    framebuffer: framebufferState,
	    extensions: extensions,

	    timer: timer,
	    isBufferArgs: isBufferArgs
	  };

	  var sharedConstants = {
	    primTypes: primTypes,
	    compareFuncs: compareFuncs,
	    blendFuncs: blendFuncs,
	    blendEquations: blendEquations,
	    stencilOps: stencilOps,
	    glTypes: glTypes,
	    orientationType: orientationType
	  };

	  check$1.optional(function () {
	    sharedState.isArrayLike = isArrayLike;
	  });

	  if (extDrawBuffers) {
	    sharedConstants.backBuffer = [GL_BACK];
	    sharedConstants.drawBuffer = loop(limits.maxDrawbuffers, function (i) {
	      if (i === 0) {
	        return [0]
	      }
	      return loop(i, function (j) {
	        return GL_COLOR_ATTACHMENT0$2 + j
	      })
	    });
	  }

	  var drawCallCounter = 0;
	  function createREGLEnvironment () {
	    var env = createEnvironment();
	    var link = env.link;
	    var global = env.global;
	    env.id = drawCallCounter++;

	    env.batchId = '0';

	    // link shared state
	    var SHARED = link(sharedState);
	    var shared = env.shared = {
	      props: 'a0'
	    };
	    Object.keys(sharedState).forEach(function (prop) {
	      shared[prop] = global.def(SHARED, '.', prop);
	    });

	    // Inject runtime assertion stuff for debug builds
	    check$1.optional(function () {
	      env.CHECK = link(check$1);
	      env.commandStr = check$1.guessCommand();
	      env.command = link(env.commandStr);
	      env.assert = function (block, pred, message) {
	        block(
	          'if(!(', pred, '))',
	          this.CHECK, '.commandRaise(', link(message), ',', this.command, ');');
	      };

	      sharedConstants.invalidBlendCombinations = invalidBlendCombinations;
	    });

	    // Copy GL state variables over
	    var nextVars = env.next = {};
	    var currentVars = env.current = {};
	    Object.keys(GL_VARIABLES).forEach(function (variable) {
	      if (Array.isArray(currentState[variable])) {
	        nextVars[variable] = global.def(shared.next, '.', variable);
	        currentVars[variable] = global.def(shared.current, '.', variable);
	      }
	    });

	    // Initialize shared constants
	    var constants = env.constants = {};
	    Object.keys(sharedConstants).forEach(function (name) {
	      constants[name] = global.def(JSON.stringify(sharedConstants[name]));
	    });

	    // Helper function for calling a block
	    env.invoke = function (block, x) {
	      switch (x.type) {
	        case DYN_FUNC$1:
	          var argList = [
	            'this',
	            shared.context,
	            shared.props,
	            env.batchId
	          ];
	          return block.def(
	            link(x.data), '.call(',
	            argList.slice(0, Math.max(x.data.length + 1, 4)),
	            ')')
	        case DYN_PROP$1:
	          return block.def(shared.props, x.data)
	        case DYN_CONTEXT$1:
	          return block.def(shared.context, x.data)
	        case DYN_STATE$1:
	          return block.def('this', x.data)
	        case DYN_THUNK:
	          x.data.append(env, block);
	          return x.data.ref
	        case DYN_CONSTANT$1:
	          return x.data.toString()
	        case DYN_ARRAY$1:
	          return x.data.map(function (y) {
	            return env.invoke(block, y)
	          })
	      }
	    };

	    env.attribCache = {};

	    var scopeAttribs = {};
	    env.scopeAttrib = function (name) {
	      var id = stringStore.id(name);
	      if (id in scopeAttribs) {
	        return scopeAttribs[id]
	      }
	      var binding = attributeState.scope[id];
	      if (!binding) {
	        binding = attributeState.scope[id] = new AttributeRecord();
	      }
	      var result = scopeAttribs[id] = link(binding);
	      return result
	    };

	    return env
	  }

	  // ===================================================
	  // ===================================================
	  // PARSING
	  // ===================================================
	  // ===================================================
	  function parseProfile (options) {
	    var staticOptions = options.static;
	    var dynamicOptions = options.dynamic;

	    var profileEnable;
	    if (S_PROFILE in staticOptions) {
	      var value = !!staticOptions[S_PROFILE];
	      profileEnable = createStaticDecl(function (env, scope) {
	        return value
	      });
	      profileEnable.enable = value;
	    } else if (S_PROFILE in dynamicOptions) {
	      var dyn = dynamicOptions[S_PROFILE];
	      profileEnable = createDynamicDecl(dyn, function (env, scope) {
	        return env.invoke(scope, dyn)
	      });
	    }

	    return profileEnable
	  }

	  function parseFramebuffer (options, env) {
	    var staticOptions = options.static;
	    var dynamicOptions = options.dynamic;

	    if (S_FRAMEBUFFER in staticOptions) {
	      var framebuffer = staticOptions[S_FRAMEBUFFER];
	      if (framebuffer) {
	        framebuffer = framebufferState.getFramebuffer(framebuffer);
	        check$1.command(framebuffer, 'invalid framebuffer object');
	        return createStaticDecl(function (env, block) {
	          var FRAMEBUFFER = env.link(framebuffer);
	          var shared = env.shared;
	          block.set(
	            shared.framebuffer,
	            '.next',
	            FRAMEBUFFER);
	          var CONTEXT = shared.context;
	          block.set(
	            CONTEXT,
	            '.' + S_FRAMEBUFFER_WIDTH,
	            FRAMEBUFFER + '.width');
	          block.set(
	            CONTEXT,
	            '.' + S_FRAMEBUFFER_HEIGHT,
	            FRAMEBUFFER + '.height');
	          return FRAMEBUFFER
	        })
	      } else {
	        return createStaticDecl(function (env, scope) {
	          var shared = env.shared;
	          scope.set(
	            shared.framebuffer,
	            '.next',
	            'null');
	          var CONTEXT = shared.context;
	          scope.set(
	            CONTEXT,
	            '.' + S_FRAMEBUFFER_WIDTH,
	            CONTEXT + '.' + S_DRAWINGBUFFER_WIDTH);
	          scope.set(
	            CONTEXT,
	            '.' + S_FRAMEBUFFER_HEIGHT,
	            CONTEXT + '.' + S_DRAWINGBUFFER_HEIGHT);
	          return 'null'
	        })
	      }
	    } else if (S_FRAMEBUFFER in dynamicOptions) {
	      var dyn = dynamicOptions[S_FRAMEBUFFER];
	      return createDynamicDecl(dyn, function (env, scope) {
	        var FRAMEBUFFER_FUNC = env.invoke(scope, dyn);
	        var shared = env.shared;
	        var FRAMEBUFFER_STATE = shared.framebuffer;
	        var FRAMEBUFFER = scope.def(
	          FRAMEBUFFER_STATE, '.getFramebuffer(', FRAMEBUFFER_FUNC, ')');

	        check$1.optional(function () {
	          env.assert(scope,
	            '!' + FRAMEBUFFER_FUNC + '||' + FRAMEBUFFER,
	            'invalid framebuffer object');
	        });

	        scope.set(
	          FRAMEBUFFER_STATE,
	          '.next',
	          FRAMEBUFFER);
	        var CONTEXT = shared.context;
	        scope.set(
	          CONTEXT,
	          '.' + S_FRAMEBUFFER_WIDTH,
	          FRAMEBUFFER + '?' + FRAMEBUFFER + '.width:' +
	          CONTEXT + '.' + S_DRAWINGBUFFER_WIDTH);
	        scope.set(
	          CONTEXT,
	          '.' + S_FRAMEBUFFER_HEIGHT,
	          FRAMEBUFFER +
	          '?' + FRAMEBUFFER + '.height:' +
	          CONTEXT + '.' + S_DRAWINGBUFFER_HEIGHT);
	        return FRAMEBUFFER
	      })
	    } else {
	      return null
	    }
	  }

	  function parseViewportScissor (options, framebuffer, env) {
	    var staticOptions = options.static;
	    var dynamicOptions = options.dynamic;

	    function parseBox (param) {
	      if (param in staticOptions) {
	        var box = staticOptions[param];
	        check$1.commandType(box, 'object', 'invalid ' + param, env.commandStr);

	        var isStatic = true;
	        var x = box.x | 0;
	        var y = box.y | 0;
	        var w, h;
	        if ('width' in box) {
	          w = box.width | 0;
	          check$1.command(w >= 0, 'invalid ' + param, env.commandStr);
	        } else {
	          isStatic = false;
	        }
	        if ('height' in box) {
	          h = box.height | 0;
	          check$1.command(h >= 0, 'invalid ' + param, env.commandStr);
	        } else {
	          isStatic = false;
	        }

	        return new Declaration(
	          !isStatic && framebuffer && framebuffer.thisDep,
	          !isStatic && framebuffer && framebuffer.contextDep,
	          !isStatic && framebuffer && framebuffer.propDep,
	          function (env, scope) {
	            var CONTEXT = env.shared.context;
	            var BOX_W = w;
	            if (!('width' in box)) {
	              BOX_W = scope.def(CONTEXT, '.', S_FRAMEBUFFER_WIDTH, '-', x);
	            }
	            var BOX_H = h;
	            if (!('height' in box)) {
	              BOX_H = scope.def(CONTEXT, '.', S_FRAMEBUFFER_HEIGHT, '-', y);
	            }
	            return [x, y, BOX_W, BOX_H]
	          })
	      } else if (param in dynamicOptions) {
	        var dynBox = dynamicOptions[param];
	        var result = createDynamicDecl(dynBox, function (env, scope) {
	          var BOX = env.invoke(scope, dynBox);

	          check$1.optional(function () {
	            env.assert(scope,
	              BOX + '&&typeof ' + BOX + '==="object"',
	              'invalid ' + param);
	          });

	          var CONTEXT = env.shared.context;
	          var BOX_X = scope.def(BOX, '.x|0');
	          var BOX_Y = scope.def(BOX, '.y|0');
	          var BOX_W = scope.def(
	            '"width" in ', BOX, '?', BOX, '.width|0:',
	            '(', CONTEXT, '.', S_FRAMEBUFFER_WIDTH, '-', BOX_X, ')');
	          var BOX_H = scope.def(
	            '"height" in ', BOX, '?', BOX, '.height|0:',
	            '(', CONTEXT, '.', S_FRAMEBUFFER_HEIGHT, '-', BOX_Y, ')');

	          check$1.optional(function () {
	            env.assert(scope,
	              BOX_W + '>=0&&' +
	              BOX_H + '>=0',
	              'invalid ' + param);
	          });

	          return [BOX_X, BOX_Y, BOX_W, BOX_H]
	        });
	        if (framebuffer) {
	          result.thisDep = result.thisDep || framebuffer.thisDep;
	          result.contextDep = result.contextDep || framebuffer.contextDep;
	          result.propDep = result.propDep || framebuffer.propDep;
	        }
	        return result
	      } else if (framebuffer) {
	        return new Declaration(
	          framebuffer.thisDep,
	          framebuffer.contextDep,
	          framebuffer.propDep,
	          function (env, scope) {
	            var CONTEXT = env.shared.context;
	            return [
	              0, 0,
	              scope.def(CONTEXT, '.', S_FRAMEBUFFER_WIDTH),
	              scope.def(CONTEXT, '.', S_FRAMEBUFFER_HEIGHT)]
	          })
	      } else {
	        return null
	      }
	    }

	    var viewport = parseBox(S_VIEWPORT);

	    if (viewport) {
	      var prevViewport = viewport;
	      viewport = new Declaration(
	        viewport.thisDep,
	        viewport.contextDep,
	        viewport.propDep,
	        function (env, scope) {
	          var VIEWPORT = prevViewport.append(env, scope);
	          var CONTEXT = env.shared.context;
	          scope.set(
	            CONTEXT,
	            '.' + S_VIEWPORT_WIDTH,
	            VIEWPORT[2]);
	          scope.set(
	            CONTEXT,
	            '.' + S_VIEWPORT_HEIGHT,
	            VIEWPORT[3]);
	          return VIEWPORT
	        });
	    }

	    return {
	      viewport: viewport,
	      scissor_box: parseBox(S_SCISSOR_BOX)
	    }
	  }

	  function parseAttribLocations (options, attributes) {
	    var staticOptions = options.static;
	    var staticProgram =
	      typeof staticOptions[S_FRAG] === 'string' &&
	      typeof staticOptions[S_VERT] === 'string';
	    if (staticProgram) {
	      if (Object.keys(attributes.dynamic).length > 0) {
	        return null
	      }
	      var staticAttributes = attributes.static;
	      var sAttributes = Object.keys(staticAttributes);
	      if (sAttributes.length > 0 && typeof staticAttributes[sAttributes[0]] === 'number') {
	        var bindings = [];
	        for (var i = 0; i < sAttributes.length; ++i) {
	          check$1(typeof staticAttributes[sAttributes[i]] === 'number', 'must specify all vertex attribute locations when using vaos');
	          bindings.push([staticAttributes[sAttributes[i]] | 0, sAttributes[i]]);
	        }
	        return bindings
	      }
	    }
	    return null
	  }

	  function parseProgram (options, env, attribLocations) {
	    var staticOptions = options.static;
	    var dynamicOptions = options.dynamic;

	    function parseShader (name) {
	      if (name in staticOptions) {
	        var id = stringStore.id(staticOptions[name]);
	        check$1.optional(function () {
	          shaderState.shader(shaderType[name], id, check$1.guessCommand());
	        });
	        var result = createStaticDecl(function () {
	          return id
	        });
	        result.id = id;
	        return result
	      } else if (name in dynamicOptions) {
	        var dyn = dynamicOptions[name];
	        return createDynamicDecl(dyn, function (env, scope) {
	          var str = env.invoke(scope, dyn);
	          var id = scope.def(env.shared.strings, '.id(', str, ')');
	          check$1.optional(function () {
	            scope(
	              env.shared.shader, '.shader(',
	              shaderType[name], ',',
	              id, ',',
	              env.command, ');');
	          });
	          return id
	        })
	      }
	      return null
	    }

	    var frag = parseShader(S_FRAG);
	    var vert = parseShader(S_VERT);

	    var program = null;
	    var progVar;
	    if (isStatic(frag) && isStatic(vert)) {
	      program = shaderState.program(vert.id, frag.id, null, attribLocations);
	      progVar = createStaticDecl(function (env, scope) {
	        return env.link(program)
	      });
	    } else {
	      progVar = new Declaration(
	        (frag && frag.thisDep) || (vert && vert.thisDep),
	        (frag && frag.contextDep) || (vert && vert.contextDep),
	        (frag && frag.propDep) || (vert && vert.propDep),
	        function (env, scope) {
	          var SHADER_STATE = env.shared.shader;
	          var fragId;
	          if (frag) {
	            fragId = frag.append(env, scope);
	          } else {
	            fragId = scope.def(SHADER_STATE, '.', S_FRAG);
	          }
	          var vertId;
	          if (vert) {
	            vertId = vert.append(env, scope);
	          } else {
	            vertId = scope.def(SHADER_STATE, '.', S_VERT);
	          }
	          var progDef = SHADER_STATE + '.program(' + vertId + ',' + fragId;
	          check$1.optional(function () {
	            progDef += ',' + env.command;
	          });
	          return scope.def(progDef + ')')
	        });
	    }

	    return {
	      frag: frag,
	      vert: vert,
	      progVar: progVar,
	      program: program
	    }
	  }

	  function parseDraw (options, env) {
	    var staticOptions = options.static;
	    var dynamicOptions = options.dynamic;

	    // TODO: should use VAO to get default values for offset properties
	    // should move vao parse into here and out of the old stuff

	    var staticDraw = {};
	    var vaoActive = false;

	    function parseVAO () {
	      if (S_VAO in staticOptions) {
	        var vao = staticOptions[S_VAO];
	        if (vao !== null && attributeState.getVAO(vao) === null) {
	          vao = attributeState.createVAO(vao);
	        }

	        vaoActive = true;
	        staticDraw.vao = vao;

	        return createStaticDecl(function (env) {
	          var vaoRef = attributeState.getVAO(vao);
	          if (vaoRef) {
	            return env.link(vaoRef)
	          } else {
	            return 'null'
	          }
	        })
	      } else if (S_VAO in dynamicOptions) {
	        vaoActive = true;
	        var dyn = dynamicOptions[S_VAO];
	        return createDynamicDecl(dyn, function (env, scope) {
	          var vaoRef = env.invoke(scope, dyn);
	          return scope.def(env.shared.vao + '.getVAO(' + vaoRef + ')')
	        })
	      }
	      return null
	    }

	    var vao = parseVAO();

	    var elementsActive = false;

	    function parseElements () {
	      if (S_ELEMENTS in staticOptions) {
	        var elements = staticOptions[S_ELEMENTS];
	        staticDraw.elements = elements;
	        if (isBufferArgs(elements)) {
	          var e = staticDraw.elements = elementState.create(elements, true);
	          elements = elementState.getElements(e);
	          elementsActive = true;
	        } else if (elements) {
	          elements = elementState.getElements(elements);
	          elementsActive = true;
	          check$1.command(elements, 'invalid elements', env.commandStr);
	        }

	        var result = createStaticDecl(function (env, scope) {
	          if (elements) {
	            var result = env.link(elements);
	            env.ELEMENTS = result;
	            return result
	          }
	          env.ELEMENTS = null;
	          return null
	        });
	        result.value = elements;
	        return result
	      } else if (S_ELEMENTS in dynamicOptions) {
	        elementsActive = true;

	        var dyn = dynamicOptions[S_ELEMENTS];
	        return createDynamicDecl(dyn, function (env, scope) {
	          var shared = env.shared;

	          var IS_BUFFER_ARGS = shared.isBufferArgs;
	          var ELEMENT_STATE = shared.elements;

	          var elementDefn = env.invoke(scope, dyn);
	          var elements = scope.def('null');
	          var elementStream = scope.def(IS_BUFFER_ARGS, '(', elementDefn, ')');

	          var ifte = env.cond(elementStream)
	            .then(elements, '=', ELEMENT_STATE, '.createStream(', elementDefn, ');')
	            .else(elements, '=', ELEMENT_STATE, '.getElements(', elementDefn, ');');

	          check$1.optional(function () {
	            env.assert(ifte.else,
	              '!' + elementDefn + '||' + elements,
	              'invalid elements');
	          });

	          scope.entry(ifte);
	          scope.exit(
	            env.cond(elementStream)
	              .then(ELEMENT_STATE, '.destroyStream(', elements, ');'));

	          env.ELEMENTS = elements;

	          return elements
	        })
	      } else if (vaoActive) {
	        return new Declaration(
	          vao.thisDep,
	          vao.contextDep,
	          vao.propDep,
	          function (env, scope) {
	            return scope.def(env.shared.vao + '.currentVAO?' + env.shared.elements + '.getElements(' + env.shared.vao + '.currentVAO.elements):null')
	          })
	      }
	      return null
	    }

	    var elements = parseElements();

	    function parsePrimitive () {
	      if (S_PRIMITIVE in staticOptions) {
	        var primitive = staticOptions[S_PRIMITIVE];
	        staticDraw.primitive = primitive;
	        check$1.commandParameter(primitive, primTypes, 'invalid primitve', env.commandStr);
	        return createStaticDecl(function (env, scope) {
	          return primTypes[primitive]
	        })
	      } else if (S_PRIMITIVE in dynamicOptions) {
	        var dynPrimitive = dynamicOptions[S_PRIMITIVE];
	        return createDynamicDecl(dynPrimitive, function (env, scope) {
	          var PRIM_TYPES = env.constants.primTypes;
	          var prim = env.invoke(scope, dynPrimitive);
	          check$1.optional(function () {
	            env.assert(scope,
	              prim + ' in ' + PRIM_TYPES,
	              'invalid primitive, must be one of ' + Object.keys(primTypes));
	          });
	          return scope.def(PRIM_TYPES, '[', prim, ']')
	        })
	      } else if (elementsActive) {
	        if (isStatic(elements)) {
	          if (elements.value) {
	            return createStaticDecl(function (env, scope) {
	              return scope.def(env.ELEMENTS, '.primType')
	            })
	          } else {
	            return createStaticDecl(function () {
	              return GL_TRIANGLES$1
	            })
	          }
	        } else {
	          return new Declaration(
	            elements.thisDep,
	            elements.contextDep,
	            elements.propDep,
	            function (env, scope) {
	              var elements = env.ELEMENTS;
	              return scope.def(elements, '?', elements, '.primType:', GL_TRIANGLES$1)
	            })
	        }
	      } else if (vaoActive) {
	        return new Declaration(
	          vao.thisDep,
	          vao.contextDep,
	          vao.propDep,
	          function (env, scope) {
	            return scope.def(env.shared.vao + '.currentVAO?' + env.shared.vao + '.currentVAO.primitive:' + GL_TRIANGLES$1)
	          })
	      }
	      return null
	    }

	    function parseParam (param, isOffset) {
	      if (param in staticOptions) {
	        var value = staticOptions[param] | 0;
	        if (isOffset) {
	          staticDraw.offset = value;
	        } else {
	          staticDraw.instances = value;
	        }
	        check$1.command(!isOffset || value >= 0, 'invalid ' + param, env.commandStr);
	        return createStaticDecl(function (env, scope) {
	          if (isOffset) {
	            env.OFFSET = value;
	          }
	          return value
	        })
	      } else if (param in dynamicOptions) {
	        var dynValue = dynamicOptions[param];
	        return createDynamicDecl(dynValue, function (env, scope) {
	          var result = env.invoke(scope, dynValue);
	          if (isOffset) {
	            env.OFFSET = result;
	            check$1.optional(function () {
	              env.assert(scope,
	                result + '>=0',
	                'invalid ' + param);
	            });
	          }
	          return result
	        })
	      } else if (isOffset) {
	        if (elementsActive) {
	          return createStaticDecl(function (env, scope) {
	            env.OFFSET = 0;
	            return 0
	          })
	        } else if (vaoActive) {
	          return new Declaration(
	            vao.thisDep,
	            vao.contextDep,
	            vao.propDep,
	            function (env, scope) {
	              return scope.def(env.shared.vao + '.currentVAO?' + env.shared.vao + '.currentVAO.offset:0')
	            })
	        }
	      } else if (vaoActive) {
	        return new Declaration(
	          vao.thisDep,
	          vao.contextDep,
	          vao.propDep,
	          function (env, scope) {
	            return scope.def(env.shared.vao + '.currentVAO?' + env.shared.vao + '.currentVAO.instances:-1')
	          })
	      }
	      return null
	    }

	    var OFFSET = parseParam(S_OFFSET, true);

	    function parseVertCount () {
	      if (S_COUNT in staticOptions) {
	        var count = staticOptions[S_COUNT] | 0;
	        staticDraw.count = count;
	        check$1.command(
	          typeof count === 'number' && count >= 0, 'invalid vertex count', env.commandStr);
	        return createStaticDecl(function () {
	          return count
	        })
	      } else if (S_COUNT in dynamicOptions) {
	        var dynCount = dynamicOptions[S_COUNT];
	        return createDynamicDecl(dynCount, function (env, scope) {
	          var result = env.invoke(scope, dynCount);
	          check$1.optional(function () {
	            env.assert(scope,
	              'typeof ' + result + '==="number"&&' +
	              result + '>=0&&' +
	              result + '===(' + result + '|0)',
	              'invalid vertex count');
	          });
	          return result
	        })
	      } else if (elementsActive) {
	        if (isStatic(elements)) {
	          if (elements) {
	            if (OFFSET) {
	              return new Declaration(
	                OFFSET.thisDep,
	                OFFSET.contextDep,
	                OFFSET.propDep,
	                function (env, scope) {
	                  var result = scope.def(
	                    env.ELEMENTS, '.vertCount-', env.OFFSET);

	                  check$1.optional(function () {
	                    env.assert(scope,
	                      result + '>=0',
	                      'invalid vertex offset/element buffer too small');
	                  });

	                  return result
	                })
	            } else {
	              return createStaticDecl(function (env, scope) {
	                return scope.def(env.ELEMENTS, '.vertCount')
	              })
	            }
	          } else {
	            var result = createStaticDecl(function () {
	              return -1
	            });
	            check$1.optional(function () {
	              result.MISSING = true;
	            });
	            return result
	          }
	        } else {
	          var variable = new Declaration(
	            elements.thisDep || OFFSET.thisDep,
	            elements.contextDep || OFFSET.contextDep,
	            elements.propDep || OFFSET.propDep,
	            function (env, scope) {
	              var elements = env.ELEMENTS;
	              if (env.OFFSET) {
	                return scope.def(elements, '?', elements, '.vertCount-',
	                  env.OFFSET, ':-1')
	              }
	              return scope.def(elements, '?', elements, '.vertCount:-1')
	            });
	          check$1.optional(function () {
	            variable.DYNAMIC = true;
	          });
	          return variable
	        }
	      } else if (vaoActive) {
	        var countVariable = new Declaration(
	          vao.thisDep,
	          vao.contextDep,
	          vao.propDep,
	          function (env, scope) {
	            return scope.def(env.shared.vao, '.currentVAO?', env.shared.vao, '.currentVAO.count:-1')
	          });
	        return countVariable
	      }
	      return null
	    }

	    var primitive = parsePrimitive();
	    var count = parseVertCount();
	    var instances = parseParam(S_INSTANCES, false);

	    return {
	      elements: elements,
	      primitive: primitive,
	      count: count,
	      instances: instances,
	      offset: OFFSET,
	      vao: vao,

	      vaoActive: vaoActive,
	      elementsActive: elementsActive,

	      // static draw props
	      static: staticDraw
	    }
	  }

	  function parseGLState (options, env) {
	    var staticOptions = options.static;
	    var dynamicOptions = options.dynamic;

	    var STATE = {};

	    GL_STATE_NAMES.forEach(function (prop) {
	      var param = propName(prop);

	      function parseParam (parseStatic, parseDynamic) {
	        if (prop in staticOptions) {
	          var value = parseStatic(staticOptions[prop]);
	          STATE[param] = createStaticDecl(function () {
	            return value
	          });
	        } else if (prop in dynamicOptions) {
	          var dyn = dynamicOptions[prop];
	          STATE[param] = createDynamicDecl(dyn, function (env, scope) {
	            return parseDynamic(env, scope, env.invoke(scope, dyn))
	          });
	        }
	      }

	      switch (prop) {
	        case S_CULL_ENABLE:
	        case S_BLEND_ENABLE:
	        case S_DITHER:
	        case S_STENCIL_ENABLE:
	        case S_DEPTH_ENABLE:
	        case S_SCISSOR_ENABLE:
	        case S_POLYGON_OFFSET_ENABLE:
	        case S_SAMPLE_ALPHA:
	        case S_SAMPLE_ENABLE:
	        case S_DEPTH_MASK:
	          return parseParam(
	            function (value) {
	              check$1.commandType(value, 'boolean', prop, env.commandStr);
	              return value
	            },
	            function (env, scope, value) {
	              check$1.optional(function () {
	                env.assert(scope,
	                  'typeof ' + value + '==="boolean"',
	                  'invalid flag ' + prop, env.commandStr);
	              });
	              return value
	            })

	        case S_DEPTH_FUNC:
	          return parseParam(
	            function (value) {
	              check$1.commandParameter(value, compareFuncs, 'invalid ' + prop, env.commandStr);
	              return compareFuncs[value]
	            },
	            function (env, scope, value) {
	              var COMPARE_FUNCS = env.constants.compareFuncs;
	              check$1.optional(function () {
	                env.assert(scope,
	                  value + ' in ' + COMPARE_FUNCS,
	                  'invalid ' + prop + ', must be one of ' + Object.keys(compareFuncs));
	              });
	              return scope.def(COMPARE_FUNCS, '[', value, ']')
	            })

	        case S_DEPTH_RANGE:
	          return parseParam(
	            function (value) {
	              check$1.command(
	                isArrayLike(value) &&
	                value.length === 2 &&
	                typeof value[0] === 'number' &&
	                typeof value[1] === 'number' &&
	                value[0] <= value[1],
	                'depth range is 2d array',
	                env.commandStr);
	              return value
	            },
	            function (env, scope, value) {
	              check$1.optional(function () {
	                env.assert(scope,
	                  env.shared.isArrayLike + '(' + value + ')&&' +
	                  value + '.length===2&&' +
	                  'typeof ' + value + '[0]==="number"&&' +
	                  'typeof ' + value + '[1]==="number"&&' +
	                  value + '[0]<=' + value + '[1]',
	                  'depth range must be a 2d array');
	              });

	              var Z_NEAR = scope.def('+', value, '[0]');
	              var Z_FAR = scope.def('+', value, '[1]');
	              return [Z_NEAR, Z_FAR]
	            })

	        case S_BLEND_FUNC:
	          return parseParam(
	            function (value) {
	              check$1.commandType(value, 'object', 'blend.func', env.commandStr);
	              var srcRGB = ('srcRGB' in value ? value.srcRGB : value.src);
	              var srcAlpha = ('srcAlpha' in value ? value.srcAlpha : value.src);
	              var dstRGB = ('dstRGB' in value ? value.dstRGB : value.dst);
	              var dstAlpha = ('dstAlpha' in value ? value.dstAlpha : value.dst);
	              check$1.commandParameter(srcRGB, blendFuncs, param + '.srcRGB', env.commandStr);
	              check$1.commandParameter(srcAlpha, blendFuncs, param + '.srcAlpha', env.commandStr);
	              check$1.commandParameter(dstRGB, blendFuncs, param + '.dstRGB', env.commandStr);
	              check$1.commandParameter(dstAlpha, blendFuncs, param + '.dstAlpha', env.commandStr);

	              check$1.command(
	                (invalidBlendCombinations.indexOf(srcRGB + ', ' + dstRGB) === -1),
	                'unallowed blending combination (srcRGB, dstRGB) = (' + srcRGB + ', ' + dstRGB + ')', env.commandStr);

	              return [
	                blendFuncs[srcRGB],
	                blendFuncs[dstRGB],
	                blendFuncs[srcAlpha],
	                blendFuncs[dstAlpha]
	              ]
	            },
	            function (env, scope, value) {
	              var BLEND_FUNCS = env.constants.blendFuncs;

	              check$1.optional(function () {
	                env.assert(scope,
	                  value + '&&typeof ' + value + '==="object"',
	                  'invalid blend func, must be an object');
	              });

	              function read (prefix, suffix) {
	                var func = scope.def(
	                  '"', prefix, suffix, '" in ', value,
	                  '?', value, '.', prefix, suffix,
	                  ':', value, '.', prefix);

	                check$1.optional(function () {
	                  env.assert(scope,
	                    func + ' in ' + BLEND_FUNCS,
	                    'invalid ' + prop + '.' + prefix + suffix + ', must be one of ' + Object.keys(blendFuncs));
	                });

	                return func
	              }

	              var srcRGB = read('src', 'RGB');
	              var dstRGB = read('dst', 'RGB');

	              check$1.optional(function () {
	                var INVALID_BLEND_COMBINATIONS = env.constants.invalidBlendCombinations;

	                env.assert(scope,
	                  INVALID_BLEND_COMBINATIONS +
	                           '.indexOf(' + srcRGB + '+", "+' + dstRGB + ') === -1 ',
	                  'unallowed blending combination for (srcRGB, dstRGB)'
	                );
	              });

	              var SRC_RGB = scope.def(BLEND_FUNCS, '[', srcRGB, ']');
	              var SRC_ALPHA = scope.def(BLEND_FUNCS, '[', read('src', 'Alpha'), ']');
	              var DST_RGB = scope.def(BLEND_FUNCS, '[', dstRGB, ']');
	              var DST_ALPHA = scope.def(BLEND_FUNCS, '[', read('dst', 'Alpha'), ']');

	              return [SRC_RGB, DST_RGB, SRC_ALPHA, DST_ALPHA]
	            })

	        case S_BLEND_EQUATION:
	          return parseParam(
	            function (value) {
	              if (typeof value === 'string') {
	                check$1.commandParameter(value, blendEquations, 'invalid ' + prop, env.commandStr);
	                return [
	                  blendEquations[value],
	                  blendEquations[value]
	                ]
	              } else if (typeof value === 'object') {
	                check$1.commandParameter(
	                  value.rgb, blendEquations, prop + '.rgb', env.commandStr);
	                check$1.commandParameter(
	                  value.alpha, blendEquations, prop + '.alpha', env.commandStr);
	                return [
	                  blendEquations[value.rgb],
	                  blendEquations[value.alpha]
	                ]
	              } else {
	                check$1.commandRaise('invalid blend.equation', env.commandStr);
	              }
	            },
	            function (env, scope, value) {
	              var BLEND_EQUATIONS = env.constants.blendEquations;

	              var RGB = scope.def();
	              var ALPHA = scope.def();

	              var ifte = env.cond('typeof ', value, '==="string"');

	              check$1.optional(function () {
	                function checkProp (block, name, value) {
	                  env.assert(block,
	                    value + ' in ' + BLEND_EQUATIONS,
	                    'invalid ' + name + ', must be one of ' + Object.keys(blendEquations));
	                }
	                checkProp(ifte.then, prop, value);

	                env.assert(ifte.else,
	                  value + '&&typeof ' + value + '==="object"',
	                  'invalid ' + prop);
	                checkProp(ifte.else, prop + '.rgb', value + '.rgb');
	                checkProp(ifte.else, prop + '.alpha', value + '.alpha');
	              });

	              ifte.then(
	                RGB, '=', ALPHA, '=', BLEND_EQUATIONS, '[', value, '];');
	              ifte.else(
	                RGB, '=', BLEND_EQUATIONS, '[', value, '.rgb];',
	                ALPHA, '=', BLEND_EQUATIONS, '[', value, '.alpha];');

	              scope(ifte);

	              return [RGB, ALPHA]
	            })

	        case S_BLEND_COLOR:
	          return parseParam(
	            function (value) {
	              check$1.command(
	                isArrayLike(value) &&
	                value.length === 4,
	                'blend.color must be a 4d array', env.commandStr);
	              return loop(4, function (i) {
	                return +value[i]
	              })
	            },
	            function (env, scope, value) {
	              check$1.optional(function () {
	                env.assert(scope,
	                  env.shared.isArrayLike + '(' + value + ')&&' +
	                  value + '.length===4',
	                  'blend.color must be a 4d array');
	              });
	              return loop(4, function (i) {
	                return scope.def('+', value, '[', i, ']')
	              })
	            })

	        case S_STENCIL_MASK:
	          return parseParam(
	            function (value) {
	              check$1.commandType(value, 'number', param, env.commandStr);
	              return value | 0
	            },
	            function (env, scope, value) {
	              check$1.optional(function () {
	                env.assert(scope,
	                  'typeof ' + value + '==="number"',
	                  'invalid stencil.mask');
	              });
	              return scope.def(value, '|0')
	            })

	        case S_STENCIL_FUNC:
	          return parseParam(
	            function (value) {
	              check$1.commandType(value, 'object', param, env.commandStr);
	              var cmp = value.cmp || 'keep';
	              var ref = value.ref || 0;
	              var mask = 'mask' in value ? value.mask : -1;
	              check$1.commandParameter(cmp, compareFuncs, prop + '.cmp', env.commandStr);
	              check$1.commandType(ref, 'number', prop + '.ref', env.commandStr);
	              check$1.commandType(mask, 'number', prop + '.mask', env.commandStr);
	              return [
	                compareFuncs[cmp],
	                ref,
	                mask
	              ]
	            },
	            function (env, scope, value) {
	              var COMPARE_FUNCS = env.constants.compareFuncs;
	              check$1.optional(function () {
	                function assert () {
	                  env.assert(scope,
	                    Array.prototype.join.call(arguments, ''),
	                    'invalid stencil.func');
	                }
	                assert(value + '&&typeof ', value, '==="object"');
	                assert('!("cmp" in ', value, ')||(',
	                  value, '.cmp in ', COMPARE_FUNCS, ')');
	              });
	              var cmp = scope.def(
	                '"cmp" in ', value,
	                '?', COMPARE_FUNCS, '[', value, '.cmp]',
	                ':', GL_KEEP);
	              var ref = scope.def(value, '.ref|0');
	              var mask = scope.def(
	                '"mask" in ', value,
	                '?', value, '.mask|0:-1');
	              return [cmp, ref, mask]
	            })

	        case S_STENCIL_OPFRONT:
	        case S_STENCIL_OPBACK:
	          return parseParam(
	            function (value) {
	              check$1.commandType(value, 'object', param, env.commandStr);
	              var fail = value.fail || 'keep';
	              var zfail = value.zfail || 'keep';
	              var zpass = value.zpass || 'keep';
	              check$1.commandParameter(fail, stencilOps, prop + '.fail', env.commandStr);
	              check$1.commandParameter(zfail, stencilOps, prop + '.zfail', env.commandStr);
	              check$1.commandParameter(zpass, stencilOps, prop + '.zpass', env.commandStr);
	              return [
	                prop === S_STENCIL_OPBACK ? GL_BACK : GL_FRONT,
	                stencilOps[fail],
	                stencilOps[zfail],
	                stencilOps[zpass]
	              ]
	            },
	            function (env, scope, value) {
	              var STENCIL_OPS = env.constants.stencilOps;

	              check$1.optional(function () {
	                env.assert(scope,
	                  value + '&&typeof ' + value + '==="object"',
	                  'invalid ' + prop);
	              });

	              function read (name) {
	                check$1.optional(function () {
	                  env.assert(scope,
	                    '!("' + name + '" in ' + value + ')||' +
	                    '(' + value + '.' + name + ' in ' + STENCIL_OPS + ')',
	                    'invalid ' + prop + '.' + name + ', must be one of ' + Object.keys(stencilOps));
	                });

	                return scope.def(
	                  '"', name, '" in ', value,
	                  '?', STENCIL_OPS, '[', value, '.', name, ']:',
	                  GL_KEEP)
	              }

	              return [
	                prop === S_STENCIL_OPBACK ? GL_BACK : GL_FRONT,
	                read('fail'),
	                read('zfail'),
	                read('zpass')
	              ]
	            })

	        case S_POLYGON_OFFSET_OFFSET:
	          return parseParam(
	            function (value) {
	              check$1.commandType(value, 'object', param, env.commandStr);
	              var factor = value.factor | 0;
	              var units = value.units | 0;
	              check$1.commandType(factor, 'number', param + '.factor', env.commandStr);
	              check$1.commandType(units, 'number', param + '.units', env.commandStr);
	              return [factor, units]
	            },
	            function (env, scope, value) {
	              check$1.optional(function () {
	                env.assert(scope,
	                  value + '&&typeof ' + value + '==="object"',
	                  'invalid ' + prop);
	              });

	              var FACTOR = scope.def(value, '.factor|0');
	              var UNITS = scope.def(value, '.units|0');

	              return [FACTOR, UNITS]
	            })

	        case S_CULL_FACE:
	          return parseParam(
	            function (value) {
	              var face = 0;
	              if (value === 'front') {
	                face = GL_FRONT;
	              } else if (value === 'back') {
	                face = GL_BACK;
	              }
	              check$1.command(!!face, param, env.commandStr);
	              return face
	            },
	            function (env, scope, value) {
	              check$1.optional(function () {
	                env.assert(scope,
	                  value + '==="front"||' +
	                  value + '==="back"',
	                  'invalid cull.face');
	              });
	              return scope.def(value, '==="front"?', GL_FRONT, ':', GL_BACK)
	            })

	        case S_LINE_WIDTH:
	          return parseParam(
	            function (value) {
	              check$1.command(
	                typeof value === 'number' &&
	                value >= limits.lineWidthDims[0] &&
	                value <= limits.lineWidthDims[1],
	                'invalid line width, must be a positive number between ' +
	                limits.lineWidthDims[0] + ' and ' + limits.lineWidthDims[1], env.commandStr);
	              return value
	            },
	            function (env, scope, value) {
	              check$1.optional(function () {
	                env.assert(scope,
	                  'typeof ' + value + '==="number"&&' +
	                  value + '>=' + limits.lineWidthDims[0] + '&&' +
	                  value + '<=' + limits.lineWidthDims[1],
	                  'invalid line width');
	              });

	              return value
	            })

	        case S_FRONT_FACE:
	          return parseParam(
	            function (value) {
	              check$1.commandParameter(value, orientationType, param, env.commandStr);
	              return orientationType[value]
	            },
	            function (env, scope, value) {
	              check$1.optional(function () {
	                env.assert(scope,
	                  value + '==="cw"||' +
	                  value + '==="ccw"',
	                  'invalid frontFace, must be one of cw,ccw');
	              });
	              return scope.def(value + '==="cw"?' + GL_CW + ':' + GL_CCW)
	            })

	        case S_COLOR_MASK:
	          return parseParam(
	            function (value) {
	              check$1.command(
	                isArrayLike(value) && value.length === 4,
	                'color.mask must be length 4 array', env.commandStr);
	              return value.map(function (v) { return !!v })
	            },
	            function (env, scope, value) {
	              check$1.optional(function () {
	                env.assert(scope,
	                  env.shared.isArrayLike + '(' + value + ')&&' +
	                  value + '.length===4',
	                  'invalid color.mask');
	              });
	              return loop(4, function (i) {
	                return '!!' + value + '[' + i + ']'
	              })
	            })

	        case S_SAMPLE_COVERAGE:
	          return parseParam(
	            function (value) {
	              check$1.command(typeof value === 'object' && value, param, env.commandStr);
	              var sampleValue = 'value' in value ? value.value : 1;
	              var sampleInvert = !!value.invert;
	              check$1.command(
	                typeof sampleValue === 'number' &&
	                sampleValue >= 0 && sampleValue <= 1,
	                'sample.coverage.value must be a number between 0 and 1', env.commandStr);
	              return [sampleValue, sampleInvert]
	            },
	            function (env, scope, value) {
	              check$1.optional(function () {
	                env.assert(scope,
	                  value + '&&typeof ' + value + '==="object"',
	                  'invalid sample.coverage');
	              });
	              var VALUE = scope.def(
	                '"value" in ', value, '?+', value, '.value:1');
	              var INVERT = scope.def('!!', value, '.invert');
	              return [VALUE, INVERT]
	            })
	      }
	    });

	    return STATE
	  }

	  function parseUniforms (uniforms, env) {
	    var staticUniforms = uniforms.static;
	    var dynamicUniforms = uniforms.dynamic;

	    var UNIFORMS = {};

	    Object.keys(staticUniforms).forEach(function (name) {
	      var value = staticUniforms[name];
	      var result;
	      if (typeof value === 'number' ||
	          typeof value === 'boolean') {
	        result = createStaticDecl(function () {
	          return value
	        });
	      } else if (typeof value === 'function') {
	        var reglType = value._reglType;
	        if (reglType === 'texture2d' ||
	            reglType === 'textureCube') {
	          result = createStaticDecl(function (env) {
	            return env.link(value)
	          });
	        } else if (reglType === 'framebuffer' ||
	                   reglType === 'framebufferCube') {
	          check$1.command(value.color.length > 0,
	            'missing color attachment for framebuffer sent to uniform "' + name + '"', env.commandStr);
	          result = createStaticDecl(function (env) {
	            return env.link(value.color[0])
	          });
	        } else {
	          check$1.commandRaise('invalid data for uniform "' + name + '"', env.commandStr);
	        }
	      } else if (isArrayLike(value)) {
	        result = createStaticDecl(function (env) {
	          var ITEM = env.global.def('[',
	            loop(value.length, function (i) {
	              check$1.command(
	                typeof value[i] === 'number' ||
	                typeof value[i] === 'boolean',
	                'invalid uniform ' + name, env.commandStr);
	              return value[i]
	            }), ']');
	          return ITEM
	        });
	      } else {
	        check$1.commandRaise('invalid or missing data for uniform "' + name + '"', env.commandStr);
	      }
	      result.value = value;
	      UNIFORMS[name] = result;
	    });

	    Object.keys(dynamicUniforms).forEach(function (key) {
	      var dyn = dynamicUniforms[key];
	      UNIFORMS[key] = createDynamicDecl(dyn, function (env, scope) {
	        return env.invoke(scope, dyn)
	      });
	    });

	    return UNIFORMS
	  }

	  function parseAttributes (attributes, env) {
	    var staticAttributes = attributes.static;
	    var dynamicAttributes = attributes.dynamic;

	    var attributeDefs = {};

	    Object.keys(staticAttributes).forEach(function (attribute) {
	      var value = staticAttributes[attribute];
	      var id = stringStore.id(attribute);

	      var record = new AttributeRecord();
	      if (isBufferArgs(value)) {
	        record.state = ATTRIB_STATE_POINTER;
	        record.buffer = bufferState.getBuffer(
	          bufferState.create(value, GL_ARRAY_BUFFER$2, false, true));
	        record.type = 0;
	      } else {
	        var buffer = bufferState.getBuffer(value);
	        if (buffer) {
	          record.state = ATTRIB_STATE_POINTER;
	          record.buffer = buffer;
	          record.type = 0;
	        } else {
	          check$1.command(typeof value === 'object' && value,
	            'invalid data for attribute ' + attribute, env.commandStr);
	          if ('constant' in value) {
	            var constant = value.constant;
	            record.buffer = 'null';
	            record.state = ATTRIB_STATE_CONSTANT;
	            if (typeof constant === 'number') {
	              record.x = constant;
	            } else {
	              check$1.command(
	                isArrayLike(constant) &&
	                constant.length > 0 &&
	                constant.length <= 4,
	                'invalid constant for attribute ' + attribute, env.commandStr);
	              CUTE_COMPONENTS.forEach(function (c, i) {
	                if (i < constant.length) {
	                  record[c] = constant[i];
	                }
	              });
	            }
	          } else {
	            if (isBufferArgs(value.buffer)) {
	              buffer = bufferState.getBuffer(
	                bufferState.create(value.buffer, GL_ARRAY_BUFFER$2, false, true));
	            } else {
	              buffer = bufferState.getBuffer(value.buffer);
	            }
	            check$1.command(!!buffer, 'missing buffer for attribute "' + attribute + '"', env.commandStr);

	            var offset = value.offset | 0;
	            check$1.command(offset >= 0,
	              'invalid offset for attribute "' + attribute + '"', env.commandStr);

	            var stride = value.stride | 0;
	            check$1.command(stride >= 0 && stride < 256,
	              'invalid stride for attribute "' + attribute + '", must be integer betweeen [0, 255]', env.commandStr);

	            var size = value.size | 0;
	            check$1.command(!('size' in value) || (size > 0 && size <= 4),
	              'invalid size for attribute "' + attribute + '", must be 1,2,3,4', env.commandStr);

	            var normalized = !!value.normalized;

	            var type = 0;
	            if ('type' in value) {
	              check$1.commandParameter(
	                value.type, glTypes,
	                'invalid type for attribute ' + attribute, env.commandStr);
	              type = glTypes[value.type];
	            }

	            var divisor = value.divisor | 0;
	            check$1.optional(function () {
	              if ('divisor' in value) {
	                check$1.command(divisor === 0 || extInstancing,
	                  'cannot specify divisor for attribute "' + attribute + '", instancing not supported', env.commandStr);
	                check$1.command(divisor >= 0,
	                  'invalid divisor for attribute "' + attribute + '"', env.commandStr);
	              }

	              var command = env.commandStr;

	              var VALID_KEYS = [
	                'buffer',
	                'offset',
	                'divisor',
	                'normalized',
	                'type',
	                'size',
	                'stride'
	              ];

	              Object.keys(value).forEach(function (prop) {
	                check$1.command(
	                  VALID_KEYS.indexOf(prop) >= 0,
	                  'unknown parameter "' + prop + '" for attribute pointer "' + attribute + '" (valid parameters are ' + VALID_KEYS + ')',
	                  command);
	              });
	            });

	            record.buffer = buffer;
	            record.state = ATTRIB_STATE_POINTER;
	            record.size = size;
	            record.normalized = normalized;
	            record.type = type || buffer.dtype;
	            record.offset = offset;
	            record.stride = stride;
	            record.divisor = divisor;
	          }
	        }
	      }

	      attributeDefs[attribute] = createStaticDecl(function (env, scope) {
	        var cache = env.attribCache;
	        if (id in cache) {
	          return cache[id]
	        }
	        var result = {
	          isStream: false
	        };
	        Object.keys(record).forEach(function (key) {
	          result[key] = record[key];
	        });
	        if (record.buffer) {
	          result.buffer = env.link(record.buffer);
	          result.type = result.type || (result.buffer + '.dtype');
	        }
	        cache[id] = result;
	        return result
	      });
	    });

	    Object.keys(dynamicAttributes).forEach(function (attribute) {
	      var dyn = dynamicAttributes[attribute];

	      function appendAttributeCode (env, block) {
	        var VALUE = env.invoke(block, dyn);

	        var shared = env.shared;
	        var constants = env.constants;

	        var IS_BUFFER_ARGS = shared.isBufferArgs;
	        var BUFFER_STATE = shared.buffer;

	        // Perform validation on attribute
	        check$1.optional(function () {
	          env.assert(block,
	            VALUE + '&&(typeof ' + VALUE + '==="object"||typeof ' +
	            VALUE + '==="function")&&(' +
	            IS_BUFFER_ARGS + '(' + VALUE + ')||' +
	            BUFFER_STATE + '.getBuffer(' + VALUE + ')||' +
	            BUFFER_STATE + '.getBuffer(' + VALUE + '.buffer)||' +
	            IS_BUFFER_ARGS + '(' + VALUE + '.buffer)||' +
	            '("constant" in ' + VALUE +
	            '&&(typeof ' + VALUE + '.constant==="number"||' +
	            shared.isArrayLike + '(' + VALUE + '.constant))))',
	            'invalid dynamic attribute "' + attribute + '"');
	        });

	        // allocate names for result
	        var result = {
	          isStream: block.def(false)
	        };
	        var defaultRecord = new AttributeRecord();
	        defaultRecord.state = ATTRIB_STATE_POINTER;
	        Object.keys(defaultRecord).forEach(function (key) {
	          result[key] = block.def('' + defaultRecord[key]);
	        });

	        var BUFFER = result.buffer;
	        var TYPE = result.type;
	        block(
	          'if(', IS_BUFFER_ARGS, '(', VALUE, ')){',
	          result.isStream, '=true;',
	          BUFFER, '=', BUFFER_STATE, '.createStream(', GL_ARRAY_BUFFER$2, ',', VALUE, ');',
	          TYPE, '=', BUFFER, '.dtype;',
	          '}else{',
	          BUFFER, '=', BUFFER_STATE, '.getBuffer(', VALUE, ');',
	          'if(', BUFFER, '){',
	          TYPE, '=', BUFFER, '.dtype;',
	          '}else if("constant" in ', VALUE, '){',
	          result.state, '=', ATTRIB_STATE_CONSTANT, ';',
	          'if(typeof ' + VALUE + '.constant === "number"){',
	          result[CUTE_COMPONENTS[0]], '=', VALUE, '.constant;',
	          CUTE_COMPONENTS.slice(1).map(function (n) {
	            return result[n]
	          }).join('='), '=0;',
	          '}else{',
	          CUTE_COMPONENTS.map(function (name, i) {
	            return (
	              result[name] + '=' + VALUE + '.constant.length>' + i +
	              '?' + VALUE + '.constant[' + i + ']:0;'
	            )
	          }).join(''),
	          '}}else{',
	          'if(', IS_BUFFER_ARGS, '(', VALUE, '.buffer)){',
	          BUFFER, '=', BUFFER_STATE, '.createStream(', GL_ARRAY_BUFFER$2, ',', VALUE, '.buffer);',
	          '}else{',
	          BUFFER, '=', BUFFER_STATE, '.getBuffer(', VALUE, '.buffer);',
	          '}',
	          TYPE, '="type" in ', VALUE, '?',
	          constants.glTypes, '[', VALUE, '.type]:', BUFFER, '.dtype;',
	          result.normalized, '=!!', VALUE, '.normalized;');
	        function emitReadRecord (name) {
	          block(result[name], '=', VALUE, '.', name, '|0;');
	        }
	        emitReadRecord('size');
	        emitReadRecord('offset');
	        emitReadRecord('stride');
	        emitReadRecord('divisor');

	        block('}}');

	        block.exit(
	          'if(', result.isStream, '){',
	          BUFFER_STATE, '.destroyStream(', BUFFER, ');',
	          '}');

	        return result
	      }

	      attributeDefs[attribute] = createDynamicDecl(dyn, appendAttributeCode);
	    });

	    return attributeDefs
	  }

	  function parseContext (context) {
	    var staticContext = context.static;
	    var dynamicContext = context.dynamic;
	    var result = {};

	    Object.keys(staticContext).forEach(function (name) {
	      var value = staticContext[name];
	      result[name] = createStaticDecl(function (env, scope) {
	        if (typeof value === 'number' || typeof value === 'boolean') {
	          return '' + value
	        } else {
	          return env.link(value)
	        }
	      });
	    });

	    Object.keys(dynamicContext).forEach(function (name) {
	      var dyn = dynamicContext[name];
	      result[name] = createDynamicDecl(dyn, function (env, scope) {
	        return env.invoke(scope, dyn)
	      });
	    });

	    return result
	  }

	  function parseArguments (options, attributes, uniforms, context, env) {
	    var staticOptions = options.static;
	    var dynamicOptions = options.dynamic;

	    check$1.optional(function () {
	      var KEY_NAMES = [
	        S_FRAMEBUFFER,
	        S_VERT,
	        S_FRAG,
	        S_ELEMENTS,
	        S_PRIMITIVE,
	        S_OFFSET,
	        S_COUNT,
	        S_INSTANCES,
	        S_PROFILE,
	        S_VAO
	      ].concat(GL_STATE_NAMES);

	      function checkKeys (dict) {
	        Object.keys(dict).forEach(function (key) {
	          check$1.command(
	            KEY_NAMES.indexOf(key) >= 0,
	            'unknown parameter "' + key + '"',
	            env.commandStr);
	        });
	      }

	      checkKeys(staticOptions);
	      checkKeys(dynamicOptions);
	    });

	    var attribLocations = parseAttribLocations(options, attributes);

	    var framebuffer = parseFramebuffer(options);
	    var viewportAndScissor = parseViewportScissor(options, framebuffer, env);
	    var draw = parseDraw(options, env);
	    var state = parseGLState(options, env);
	    var shader = parseProgram(options, env, attribLocations);

	    function copyBox (name) {
	      var defn = viewportAndScissor[name];
	      if (defn) {
	        state[name] = defn;
	      }
	    }
	    copyBox(S_VIEWPORT);
	    copyBox(propName(S_SCISSOR_BOX));

	    var dirty = Object.keys(state).length > 0;

	    var result = {
	      framebuffer: framebuffer,
	      draw: draw,
	      shader: shader,
	      state: state,
	      dirty: dirty,
	      scopeVAO: null,
	      drawVAO: null,
	      useVAO: false,
	      attributes: {}
	    };

	    result.profile = parseProfile(options);
	    result.uniforms = parseUniforms(uniforms, env);
	    result.drawVAO = result.scopeVAO = draw.vao;
	    // special case: check if we can statically allocate a vertex array object for this program
	    if (!result.drawVAO &&
	      shader.program &&
	      !attribLocations &&
	      extensions.angle_instanced_arrays &&
	      draw.static.elements) {
	      var useVAO = true;
	      var staticBindings = shader.program.attributes.map(function (attr) {
	        var binding = attributes.static[attr];
	        useVAO = useVAO && !!binding;
	        return binding
	      });
	      if (useVAO && staticBindings.length > 0) {
	        var vao = attributeState.getVAO(attributeState.createVAO({
	          attributes: staticBindings,
	          elements: draw.static.elements
	        }));
	        result.drawVAO = new Declaration(null, null, null, function (env, scope) {
	          return env.link(vao)
	        });
	        result.useVAO = true;
	      }
	    }
	    if (attribLocations) {
	      result.useVAO = true;
	    } else {
	      result.attributes = parseAttributes(attributes, env);
	    }
	    result.context = parseContext(context);
	    return result
	  }

	  // ===================================================
	  // ===================================================
	  // COMMON UPDATE FUNCTIONS
	  // ===================================================
	  // ===================================================
	  function emitContext (env, scope, context) {
	    var shared = env.shared;
	    var CONTEXT = shared.context;

	    var contextEnter = env.scope();

	    Object.keys(context).forEach(function (name) {
	      scope.save(CONTEXT, '.' + name);
	      var defn = context[name];
	      var value = defn.append(env, scope);
	      if (Array.isArray(value)) {
	        contextEnter(CONTEXT, '.', name, '=[', value.join(), '];');
	      } else {
	        contextEnter(CONTEXT, '.', name, '=', value, ';');
	      }
	    });

	    scope(contextEnter);
	  }

	  // ===================================================
	  // ===================================================
	  // COMMON DRAWING FUNCTIONS
	  // ===================================================
	  // ===================================================
	  function emitPollFramebuffer (env, scope, framebuffer, skipCheck) {
	    var shared = env.shared;

	    var GL = shared.gl;
	    var FRAMEBUFFER_STATE = shared.framebuffer;
	    var EXT_DRAW_BUFFERS;
	    if (extDrawBuffers) {
	      EXT_DRAW_BUFFERS = scope.def(shared.extensions, '.webgl_draw_buffers');
	    }

	    var constants = env.constants;

	    var DRAW_BUFFERS = constants.drawBuffer;
	    var BACK_BUFFER = constants.backBuffer;

	    var NEXT;
	    if (framebuffer) {
	      NEXT = framebuffer.append(env, scope);
	    } else {
	      NEXT = scope.def(FRAMEBUFFER_STATE, '.next');
	    }

	    if (!skipCheck) {
	      scope('if(', NEXT, '!==', FRAMEBUFFER_STATE, '.cur){');
	    }
	    scope(
	      'if(', NEXT, '){',
	      GL, '.bindFramebuffer(', GL_FRAMEBUFFER$2, ',', NEXT, '.framebuffer);');
	    if (extDrawBuffers) {
	      scope(EXT_DRAW_BUFFERS, '.drawBuffersWEBGL(',
	        DRAW_BUFFERS, '[', NEXT, '.colorAttachments.length]);');
	    }
	    scope('}else{',
	      GL, '.bindFramebuffer(', GL_FRAMEBUFFER$2, ',null);');
	    if (extDrawBuffers) {
	      scope(EXT_DRAW_BUFFERS, '.drawBuffersWEBGL(', BACK_BUFFER, ');');
	    }
	    scope(
	      '}',
	      FRAMEBUFFER_STATE, '.cur=', NEXT, ';');
	    if (!skipCheck) {
	      scope('}');
	    }
	  }

	  function emitPollState (env, scope, args) {
	    var shared = env.shared;

	    var GL = shared.gl;

	    var CURRENT_VARS = env.current;
	    var NEXT_VARS = env.next;
	    var CURRENT_STATE = shared.current;
	    var NEXT_STATE = shared.next;

	    var block = env.cond(CURRENT_STATE, '.dirty');

	    GL_STATE_NAMES.forEach(function (prop) {
	      var param = propName(prop);
	      if (param in args.state) {
	        return
	      }

	      var NEXT, CURRENT;
	      if (param in NEXT_VARS) {
	        NEXT = NEXT_VARS[param];
	        CURRENT = CURRENT_VARS[param];
	        var parts = loop(currentState[param].length, function (i) {
	          return block.def(NEXT, '[', i, ']')
	        });
	        block(env.cond(parts.map(function (p, i) {
	          return p + '!==' + CURRENT + '[' + i + ']'
	        }).join('||'))
	          .then(
	            GL, '.', GL_VARIABLES[param], '(', parts, ');',
	            parts.map(function (p, i) {
	              return CURRENT + '[' + i + ']=' + p
	            }).join(';'), ';'));
	      } else {
	        NEXT = block.def(NEXT_STATE, '.', param);
	        var ifte = env.cond(NEXT, '!==', CURRENT_STATE, '.', param);
	        block(ifte);
	        if (param in GL_FLAGS) {
	          ifte(
	            env.cond(NEXT)
	              .then(GL, '.enable(', GL_FLAGS[param], ');')
	              .else(GL, '.disable(', GL_FLAGS[param], ');'),
	            CURRENT_STATE, '.', param, '=', NEXT, ';');
	        } else {
	          ifte(
	            GL, '.', GL_VARIABLES[param], '(', NEXT, ');',
	            CURRENT_STATE, '.', param, '=', NEXT, ';');
	        }
	      }
	    });
	    if (Object.keys(args.state).length === 0) {
	      block(CURRENT_STATE, '.dirty=false;');
	    }
	    scope(block);
	  }

	  function emitSetOptions (env, scope, options, filter) {
	    var shared = env.shared;
	    var CURRENT_VARS = env.current;
	    var CURRENT_STATE = shared.current;
	    var GL = shared.gl;
	    sortState(Object.keys(options)).forEach(function (param) {
	      var defn = options[param];
	      if (filter && !filter(defn)) {
	        return
	      }
	      var variable = defn.append(env, scope);
	      if (GL_FLAGS[param]) {
	        var flag = GL_FLAGS[param];
	        if (isStatic(defn)) {
	          if (variable) {
	            scope(GL, '.enable(', flag, ');');
	          } else {
	            scope(GL, '.disable(', flag, ');');
	          }
	        } else {
	          scope(env.cond(variable)
	            .then(GL, '.enable(', flag, ');')
	            .else(GL, '.disable(', flag, ');'));
	        }
	        scope(CURRENT_STATE, '.', param, '=', variable, ';');
	      } else if (isArrayLike(variable)) {
	        var CURRENT = CURRENT_VARS[param];
	        scope(
	          GL, '.', GL_VARIABLES[param], '(', variable, ');',
	          variable.map(function (v, i) {
	            return CURRENT + '[' + i + ']=' + v
	          }).join(';'), ';');
	      } else {
	        scope(
	          GL, '.', GL_VARIABLES[param], '(', variable, ');',
	          CURRENT_STATE, '.', param, '=', variable, ';');
	      }
	    });
	  }

	  function injectExtensions (env, scope) {
	    if (extInstancing) {
	      env.instancing = scope.def(
	        env.shared.extensions, '.angle_instanced_arrays');
	    }
	  }

	  function emitProfile (env, scope, args, useScope, incrementCounter) {
	    var shared = env.shared;
	    var STATS = env.stats;
	    var CURRENT_STATE = shared.current;
	    var TIMER = shared.timer;
	    var profileArg = args.profile;

	    function perfCounter () {
	      if (typeof performance === 'undefined') {
	        return 'Date.now()'
	      } else {
	        return 'performance.now()'
	      }
	    }

	    var CPU_START, QUERY_COUNTER;
	    function emitProfileStart (block) {
	      CPU_START = scope.def();
	      block(CPU_START, '=', perfCounter(), ';');
	      if (typeof incrementCounter === 'string') {
	        block(STATS, '.count+=', incrementCounter, ';');
	      } else {
	        block(STATS, '.count++;');
	      }
	      if (timer) {
	        if (useScope) {
	          QUERY_COUNTER = scope.def();
	          block(QUERY_COUNTER, '=', TIMER, '.getNumPendingQueries();');
	        } else {
	          block(TIMER, '.beginQuery(', STATS, ');');
	        }
	      }
	    }

	    function emitProfileEnd (block) {
	      block(STATS, '.cpuTime+=', perfCounter(), '-', CPU_START, ';');
	      if (timer) {
	        if (useScope) {
	          block(TIMER, '.pushScopeStats(',
	            QUERY_COUNTER, ',',
	            TIMER, '.getNumPendingQueries(),',
	            STATS, ');');
	        } else {
	          block(TIMER, '.endQuery();');
	        }
	      }
	    }

	    function scopeProfile (value) {
	      var prev = scope.def(CURRENT_STATE, '.profile');
	      scope(CURRENT_STATE, '.profile=', value, ';');
	      scope.exit(CURRENT_STATE, '.profile=', prev, ';');
	    }

	    var USE_PROFILE;
	    if (profileArg) {
	      if (isStatic(profileArg)) {
	        if (profileArg.enable) {
	          emitProfileStart(scope);
	          emitProfileEnd(scope.exit);
	          scopeProfile('true');
	        } else {
	          scopeProfile('false');
	        }
	        return
	      }
	      USE_PROFILE = profileArg.append(env, scope);
	      scopeProfile(USE_PROFILE);
	    } else {
	      USE_PROFILE = scope.def(CURRENT_STATE, '.profile');
	    }

	    var start = env.block();
	    emitProfileStart(start);
	    scope('if(', USE_PROFILE, '){', start, '}');
	    var end = env.block();
	    emitProfileEnd(end);
	    scope.exit('if(', USE_PROFILE, '){', end, '}');
	  }

	  function emitAttributes (env, scope, args, attributes, filter) {
	    var shared = env.shared;

	    function typeLength (x) {
	      switch (x) {
	        case GL_FLOAT_VEC2:
	        case GL_INT_VEC2:
	        case GL_BOOL_VEC2:
	          return 2
	        case GL_FLOAT_VEC3:
	        case GL_INT_VEC3:
	        case GL_BOOL_VEC3:
	          return 3
	        case GL_FLOAT_VEC4:
	        case GL_INT_VEC4:
	        case GL_BOOL_VEC4:
	          return 4
	        default:
	          return 1
	      }
	    }

	    function emitBindAttribute (ATTRIBUTE, size, record) {
	      var GL = shared.gl;

	      var LOCATION = scope.def(ATTRIBUTE, '.location');
	      var BINDING = scope.def(shared.attributes, '[', LOCATION, ']');

	      var STATE = record.state;
	      var BUFFER = record.buffer;
	      var CONST_COMPONENTS = [
	        record.x,
	        record.y,
	        record.z,
	        record.w
	      ];

	      var COMMON_KEYS = [
	        'buffer',
	        'normalized',
	        'offset',
	        'stride'
	      ];

	      function emitBuffer () {
	        scope(
	          'if(!', BINDING, '.buffer){',
	          GL, '.enableVertexAttribArray(', LOCATION, ');}');

	        var TYPE = record.type;
	        var SIZE;
	        if (!record.size) {
	          SIZE = size;
	        } else {
	          SIZE = scope.def(record.size, '||', size);
	        }

	        scope('if(',
	          BINDING, '.type!==', TYPE, '||',
	          BINDING, '.size!==', SIZE, '||',
	          COMMON_KEYS.map(function (key) {
	            return BINDING + '.' + key + '!==' + record[key]
	          }).join('||'),
	          '){',
	          GL, '.bindBuffer(', GL_ARRAY_BUFFER$2, ',', BUFFER, '.buffer);',
	          GL, '.vertexAttribPointer(', [
	            LOCATION,
	            SIZE,
	            TYPE,
	            record.normalized,
	            record.stride,
	            record.offset
	          ], ');',
	          BINDING, '.type=', TYPE, ';',
	          BINDING, '.size=', SIZE, ';',
	          COMMON_KEYS.map(function (key) {
	            return BINDING + '.' + key + '=' + record[key] + ';'
	          }).join(''),
	          '}');

	        if (extInstancing) {
	          var DIVISOR = record.divisor;
	          scope(
	            'if(', BINDING, '.divisor!==', DIVISOR, '){',
	            env.instancing, '.vertexAttribDivisorANGLE(', [LOCATION, DIVISOR], ');',
	            BINDING, '.divisor=', DIVISOR, ';}');
	        }
	      }

	      function emitConstant () {
	        scope(
	          'if(', BINDING, '.buffer){',
	          GL, '.disableVertexAttribArray(', LOCATION, ');',
	          BINDING, '.buffer=null;',
	          '}if(', CUTE_COMPONENTS.map(function (c, i) {
	            return BINDING + '.' + c + '!==' + CONST_COMPONENTS[i]
	          }).join('||'), '){',
	          GL, '.vertexAttrib4f(', LOCATION, ',', CONST_COMPONENTS, ');',
	          CUTE_COMPONENTS.map(function (c, i) {
	            return BINDING + '.' + c + '=' + CONST_COMPONENTS[i] + ';'
	          }).join(''),
	          '}');
	      }

	      if (STATE === ATTRIB_STATE_POINTER) {
	        emitBuffer();
	      } else if (STATE === ATTRIB_STATE_CONSTANT) {
	        emitConstant();
	      } else {
	        scope('if(', STATE, '===', ATTRIB_STATE_POINTER, '){');
	        emitBuffer();
	        scope('}else{');
	        emitConstant();
	        scope('}');
	      }
	    }

	    attributes.forEach(function (attribute) {
	      var name = attribute.name;
	      var arg = args.attributes[name];
	      var record;
	      if (arg) {
	        if (!filter(arg)) {
	          return
	        }
	        record = arg.append(env, scope);
	      } else {
	        if (!filter(SCOPE_DECL)) {
	          return
	        }
	        var scopeAttrib = env.scopeAttrib(name);
	        check$1.optional(function () {
	          env.assert(scope,
	            scopeAttrib + '.state',
	            'missing attribute ' + name);
	        });
	        record = {};
	        Object.keys(new AttributeRecord()).forEach(function (key) {
	          record[key] = scope.def(scopeAttrib, '.', key);
	        });
	      }
	      emitBindAttribute(
	        env.link(attribute), typeLength(attribute.info.type), record);
	    });
	  }

	  function emitUniforms (env, scope, args, uniforms, filter, isBatchInnerLoop) {
	    var shared = env.shared;
	    var GL = shared.gl;

	    var definedArrUniforms = {};
	    var infix;
	    for (var i = 0; i < uniforms.length; ++i) {
	      var uniform = uniforms[i];
	      var name = uniform.name;
	      var type = uniform.info.type;
	      var size = uniform.info.size;
	      var arg = args.uniforms[name];
	      if (size > 1) {
	        // either foo[n] or foos, avoid define both
	        if (!arg) {
	          continue
	        }
	        var arrUniformName = name.replace('[0]', '');
	        if (definedArrUniforms[arrUniformName]) {
	          continue
	        }
	        definedArrUniforms[arrUniformName] = 1;
	      }
	      var UNIFORM = env.link(uniform);
	      var LOCATION = UNIFORM + '.location';

	      var VALUE;
	      if (arg) {
	        if (!filter(arg)) {
	          continue
	        }
	        if (isStatic(arg)) {
	          var value = arg.value;
	          check$1.command(
	            value !== null && typeof value !== 'undefined',
	            'missing uniform "' + name + '"', env.commandStr);
	          if (type === GL_SAMPLER_2D || type === GL_SAMPLER_CUBE) {
	            check$1.command(
	              typeof value === 'function' &&
	              ((type === GL_SAMPLER_2D &&
	                (value._reglType === 'texture2d' ||
	                value._reglType === 'framebuffer')) ||
	              (type === GL_SAMPLER_CUBE &&
	                (value._reglType === 'textureCube' ||
	                value._reglType === 'framebufferCube'))),
	              'invalid texture for uniform ' + name, env.commandStr);
	            var TEX_VALUE = env.link(value._texture || value.color[0]._texture);
	            scope(GL, '.uniform1i(', LOCATION, ',', TEX_VALUE + '.bind());');
	            scope.exit(TEX_VALUE, '.unbind();');
	          } else if (
	            type === GL_FLOAT_MAT2 ||
	            type === GL_FLOAT_MAT3 ||
	            type === GL_FLOAT_MAT4) {
	            check$1.optional(function () {
	              check$1.command(isArrayLike(value),
	                'invalid matrix for uniform ' + name, env.commandStr);
	              check$1.command(
	                (type === GL_FLOAT_MAT2 && value.length === 4) ||
	                (type === GL_FLOAT_MAT3 && value.length === 9) ||
	                (type === GL_FLOAT_MAT4 && value.length === 16),
	                'invalid length for matrix uniform ' + name, env.commandStr);
	            });
	            var MAT_VALUE = env.global.def('new Float32Array([' +
	              Array.prototype.slice.call(value) + '])');
	            var dim = 2;
	            if (type === GL_FLOAT_MAT3) {
	              dim = 3;
	            } else if (type === GL_FLOAT_MAT4) {
	              dim = 4;
	            }
	            scope(
	              GL, '.uniformMatrix', dim, 'fv(',
	              LOCATION, ',false,', MAT_VALUE, ');');
	          } else {
	            switch (type) {
	              case GL_FLOAT$8:
	                if (size === 1) {
	                  check$1.commandType(value, 'number', 'uniform ' + name, env.commandStr);
	                } else {
	                  check$1.command(
	                    isArrayLike(value) && (value.length === size),
	                    'uniform ' + name, env.commandStr);
	                }
	                infix = '1f';
	                break
	              case GL_FLOAT_VEC2:
	                check$1.command(
	                  isArrayLike(value) && (value.length && value.length % 2 === 0 && value.length <= size * 2),
	                  'uniform ' + name, env.commandStr);
	                infix = '2f';
	                break
	              case GL_FLOAT_VEC3:
	                check$1.command(
	                  isArrayLike(value) && (value.length && value.length % 3 === 0 && value.length <= size * 3),
	                  'uniform ' + name, env.commandStr);
	                infix = '3f';
	                break
	              case GL_FLOAT_VEC4:
	                check$1.command(
	                  isArrayLike(value) && (value.length && value.length % 4 === 0 && value.length <= size * 4),
	                  'uniform ' + name, env.commandStr);
	                infix = '4f';
	                break
	              case GL_BOOL:
	                if (size === 1) {
	                  check$1.commandType(value, 'boolean', 'uniform ' + name, env.commandStr);
	                } else {
	                  check$1.command(
	                    isArrayLike(value) && (value.length === size),
	                    'uniform ' + name, env.commandStr);
	                }
	                infix = '1i';
	                break
	              case GL_INT$3:
	                if (size === 1) {
	                  check$1.commandType(value, 'number', 'uniform ' + name, env.commandStr);
	                } else {
	                  check$1.command(
	                    isArrayLike(value) && (value.length === size),
	                    'uniform ' + name, env.commandStr);
	                }
	                infix = '1i';
	                break
	              case GL_BOOL_VEC2:
	                check$1.command(
	                  isArrayLike(value) && (value.length && value.length % 2 === 0 && value.length <= size * 2),
	                  'uniform ' + name, env.commandStr);
	                infix = '2i';
	                break
	              case GL_INT_VEC2:
	                check$1.command(
	                  isArrayLike(value) && (value.length && value.length % 2 === 0 && value.length <= size * 2),
	                  'uniform ' + name, env.commandStr);
	                infix = '2i';
	                break
	              case GL_BOOL_VEC3:
	                check$1.command(
	                  isArrayLike(value) && (value.length && value.length % 3 === 0 && value.length <= size * 3),
	                  'uniform ' + name, env.commandStr);
	                infix = '3i';
	                break
	              case GL_INT_VEC3:
	                check$1.command(
	                  isArrayLike(value) && (value.length && value.length % 3 === 0 && value.length <= size * 3),
	                  'uniform ' + name, env.commandStr);
	                infix = '3i';
	                break
	              case GL_BOOL_VEC4:
	                check$1.command(
	                  isArrayLike(value) && (value.length && value.length % 4 === 0 && value.length <= size * 4),
	                  'uniform ' + name, env.commandStr);
	                infix = '4i';
	                break
	              case GL_INT_VEC4:
	                check$1.command(
	                  isArrayLike(value) && (value.length && value.length % 4 === 0 && value.length <= size * 4),
	                  'uniform ' + name, env.commandStr);
	                infix = '4i';
	                break
	            }
	            if (size > 1) {
	              infix += 'v';
	              value = env.global.def('[' +
	              Array.prototype.slice.call(value) + ']');
	            } else {
	              value = isArrayLike(value) ? Array.prototype.slice.call(value) : value;
	            }
	            scope(GL, '.uniform', infix, '(', LOCATION, ',',
	              value,
	              ');');
	          }
	          continue
	        } else {
	          VALUE = arg.append(env, scope);
	        }
	      } else {
	        if (!filter(SCOPE_DECL)) {
	          continue
	        }
	        VALUE = scope.def(shared.uniforms, '[', stringStore.id(name), ']');
	      }

	      if (type === GL_SAMPLER_2D) {
	        check$1(!Array.isArray(VALUE), 'must specify a scalar prop for textures');
	        scope(
	          'if(', VALUE, '&&', VALUE, '._reglType==="framebuffer"){',
	          VALUE, '=', VALUE, '.color[0];',
	          '}');
	      } else if (type === GL_SAMPLER_CUBE) {
	        check$1(!Array.isArray(VALUE), 'must specify a scalar prop for cube maps');
	        scope(
	          'if(', VALUE, '&&', VALUE, '._reglType==="framebufferCube"){',
	          VALUE, '=', VALUE, '.color[0];',
	          '}');
	      }

	      // perform type validation
	      check$1.optional(function () {
	        function emitCheck (pred, message) {
	          env.assert(scope, pred,
	            'bad data or missing for uniform "' + name + '".  ' + message);
	        }

	        function checkType (type, size) {
	          if (size === 1) {
	            check$1(!Array.isArray(VALUE), 'must not specify an array type for uniform');
	          }
	          emitCheck(
	            'Array.isArray(' + VALUE + ') && typeof ' + VALUE + '[0]===" ' + type + '"' +
	            ' || typeof ' + VALUE + '==="' + type + '"',
	            'invalid type, expected ' + type);
	        }

	        function checkVector (n, type, size) {
	          if (Array.isArray(VALUE)) {
	            check$1(VALUE.length && VALUE.length % n === 0 && VALUE.length <= n * size, 'must have length of ' + (size === 1 ? '' : 'n * ') + n);
	          } else {
	            emitCheck(
	              shared.isArrayLike + '(' + VALUE + ')&&' + VALUE + '.length && ' + VALUE + '.length % ' + n + ' === 0' +
	              ' && ' + VALUE + '.length<=' + n * size,
	              'invalid vector, should have length of ' + (size === 1 ? '' : 'n * ') + n, env.commandStr);
	          }
	        }

	        function checkTexture (target) {
	          check$1(!Array.isArray(VALUE), 'must not specify a value type');
	          emitCheck(
	            'typeof ' + VALUE + '==="function"&&' +
	            VALUE + '._reglType==="texture' +
	            (target === GL_TEXTURE_2D$3 ? '2d' : 'Cube') + '"',
	            'invalid texture type', env.commandStr);
	        }

	        switch (type) {
	          case GL_INT$3:
	            checkType('number', size);
	            break
	          case GL_INT_VEC2:
	            checkVector(2, 'number', size);
	            break
	          case GL_INT_VEC3:
	            checkVector(3, 'number', size);
	            break
	          case GL_INT_VEC4:
	            checkVector(4, 'number', size);
	            break
	          case GL_FLOAT$8:
	            checkType('number', size);
	            break
	          case GL_FLOAT_VEC2:
	            checkVector(2, 'number', size);
	            break
	          case GL_FLOAT_VEC3:
	            checkVector(3, 'number', size);
	            break
	          case GL_FLOAT_VEC4:
	            checkVector(4, 'number', size);
	            break
	          case GL_BOOL:
	            checkType('boolean', size);
	            break
	          case GL_BOOL_VEC2:
	            checkVector(2, 'boolean', size);
	            break
	          case GL_BOOL_VEC3:
	            checkVector(3, 'boolean', size);
	            break
	          case GL_BOOL_VEC4:
	            checkVector(4, 'boolean', size);
	            break
	          case GL_FLOAT_MAT2:
	            checkVector(4, 'number', size);
	            break
	          case GL_FLOAT_MAT3:
	            checkVector(9, 'number', size);
	            break
	          case GL_FLOAT_MAT4:
	            checkVector(16, 'number', size);
	            break
	          case GL_SAMPLER_2D:
	            checkTexture(GL_TEXTURE_2D$3);
	            break
	          case GL_SAMPLER_CUBE:
	            checkTexture(GL_TEXTURE_CUBE_MAP$2);
	            break
	        }
	      });

	      var unroll = 1;
	      switch (type) {
	        case GL_SAMPLER_2D:
	        case GL_SAMPLER_CUBE:
	          var TEX = scope.def(VALUE, '._texture');
	          scope(GL, '.uniform1i(', LOCATION, ',', TEX, '.bind());');
	          scope.exit(TEX, '.unbind();');
	          continue

	        case GL_INT$3:
	        case GL_BOOL:
	          infix = '1i';
	          break

	        case GL_INT_VEC2:
	        case GL_BOOL_VEC2:
	          infix = '2i';
	          unroll = 2;
	          break

	        case GL_INT_VEC3:
	        case GL_BOOL_VEC3:
	          infix = '3i';
	          unroll = 3;
	          break

	        case GL_INT_VEC4:
	        case GL_BOOL_VEC4:
	          infix = '4i';
	          unroll = 4;
	          break

	        case GL_FLOAT$8:
	          infix = '1f';
	          break

	        case GL_FLOAT_VEC2:
	          infix = '2f';
	          unroll = 2;
	          break

	        case GL_FLOAT_VEC3:
	          infix = '3f';
	          unroll = 3;
	          break

	        case GL_FLOAT_VEC4:
	          infix = '4f';
	          unroll = 4;
	          break

	        case GL_FLOAT_MAT2:
	          infix = 'Matrix2fv';
	          break

	        case GL_FLOAT_MAT3:
	          infix = 'Matrix3fv';
	          break

	        case GL_FLOAT_MAT4:
	          infix = 'Matrix4fv';
	          break
	      }

	      if (infix.indexOf('Matrix') === -1 && size > 1) {
	        infix += 'v';
	        unroll = 1;
	      }

	      if (infix.charAt(0) === 'M') {
	        scope(GL, '.uniform', infix, '(', LOCATION, ',');
	        var matSize = Math.pow(type - GL_FLOAT_MAT2 + 2, 2);
	        var STORAGE = env.global.def('new Float32Array(', matSize, ')');
	        if (Array.isArray(VALUE)) {
	          scope(
	            'false,(',
	            loop(matSize, function (i) {
	              return STORAGE + '[' + i + ']=' + VALUE[i]
	            }), ',', STORAGE, ')');
	        } else {
	          scope(
	            'false,(Array.isArray(', VALUE, ')||', VALUE, ' instanceof Float32Array)?', VALUE, ':(',
	            loop(matSize, function (i) {
	              return STORAGE + '[' + i + ']=' + VALUE + '[' + i + ']'
	            }), ',', STORAGE, ')');
	        }
	        scope(');');
	      } else if (unroll > 1) {
	        var prev = [];
	        var cur = [];
	        for (var j = 0; j < unroll; ++j) {
	          if (Array.isArray(VALUE)) {
	            cur.push(VALUE[j]);
	          } else {
	            cur.push(scope.def(VALUE + '[' + j + ']'));
	          }
	          if (isBatchInnerLoop) {
	            prev.push(scope.def());
	          }
	        }
	        if (isBatchInnerLoop) {
	          scope('if(!', env.batchId, '||', prev.map(function (p, i) {
	            return p + '!==' + cur[i]
	          }).join('||'), '){', prev.map(function (p, i) {
	            return p + '=' + cur[i] + ';'
	          }).join(''));
	        }
	        scope(GL, '.uniform', infix, '(', LOCATION, ',', cur.join(','), ');');
	        if (isBatchInnerLoop) {
	          scope('}');
	        }
	      } else {
	        check$1(!Array.isArray(VALUE), 'uniform value must not be an array');
	        if (isBatchInnerLoop) {
	          var prevS = scope.def();
	          scope('if(!', env.batchId, '||', prevS, '!==', VALUE, '){',
	            prevS, '=', VALUE, ';');
	        }
	        scope(GL, '.uniform', infix, '(', LOCATION, ',', VALUE, ');');
	        if (isBatchInnerLoop) {
	          scope('}');
	        }
	      }
	    }
	  }

	  function emitDraw (env, outer, inner, args) {
	    var shared = env.shared;
	    var GL = shared.gl;
	    var DRAW_STATE = shared.draw;

	    var drawOptions = args.draw;

	    function emitElements () {
	      var defn = drawOptions.elements;
	      var ELEMENTS;
	      var scope = outer;
	      if (defn) {
	        if ((defn.contextDep && args.contextDynamic) || defn.propDep) {
	          scope = inner;
	        }
	        ELEMENTS = defn.append(env, scope);
	        if (drawOptions.elementsActive) {
	          scope(
	            'if(' + ELEMENTS + ')' +
	            GL + '.bindBuffer(' + GL_ELEMENT_ARRAY_BUFFER$2 + ',' + ELEMENTS + '.buffer.buffer);');
	        }
	      } else {
	        ELEMENTS = scope.def();
	        scope(
	          ELEMENTS, '=', DRAW_STATE, '.', S_ELEMENTS, ';',
	          'if(', ELEMENTS, '){',
	          GL, '.bindBuffer(', GL_ELEMENT_ARRAY_BUFFER$2, ',', ELEMENTS, '.buffer.buffer);}',
	          'else if(', shared.vao, '.currentVAO){',
	          ELEMENTS, '=', env.shared.elements + '.getElements(' + shared.vao, '.currentVAO.elements);',
	          (!extVertexArrays ? 'if(' + ELEMENTS + ')' + GL + '.bindBuffer(' + GL_ELEMENT_ARRAY_BUFFER$2 + ',' + ELEMENTS + '.buffer.buffer);' : ''),
	          '}');
	      }
	      return ELEMENTS
	    }

	    function emitCount () {
	      var defn = drawOptions.count;
	      var COUNT;
	      var scope = outer;
	      if (defn) {
	        if ((defn.contextDep && args.contextDynamic) || defn.propDep) {
	          scope = inner;
	        }
	        COUNT = defn.append(env, scope);
	        check$1.optional(function () {
	          if (defn.MISSING) {
	            env.assert(outer, 'false', 'missing vertex count');
	          }
	          if (defn.DYNAMIC) {
	            env.assert(scope, COUNT + '>=0', 'missing vertex count');
	          }
	        });
	      } else {
	        COUNT = scope.def(DRAW_STATE, '.', S_COUNT);
	        check$1.optional(function () {
	          env.assert(scope, COUNT + '>=0', 'missing vertex count');
	        });
	      }
	      return COUNT
	    }

	    var ELEMENTS = emitElements();
	    function emitValue (name) {
	      var defn = drawOptions[name];
	      if (defn) {
	        if ((defn.contextDep && args.contextDynamic) || defn.propDep) {
	          return defn.append(env, inner)
	        } else {
	          return defn.append(env, outer)
	        }
	      } else {
	        return outer.def(DRAW_STATE, '.', name)
	      }
	    }

	    var PRIMITIVE = emitValue(S_PRIMITIVE);
	    var OFFSET = emitValue(S_OFFSET);

	    var COUNT = emitCount();
	    if (typeof COUNT === 'number') {
	      if (COUNT === 0) {
	        return
	      }
	    } else {
	      inner('if(', COUNT, '){');
	      inner.exit('}');
	    }

	    var INSTANCES, EXT_INSTANCING;
	    if (extInstancing) {
	      INSTANCES = emitValue(S_INSTANCES);
	      EXT_INSTANCING = env.instancing;
	    }

	    var ELEMENT_TYPE = ELEMENTS + '.type';

	    var elementsStatic = drawOptions.elements && isStatic(drawOptions.elements) && !drawOptions.vaoActive;

	    function emitInstancing () {
	      function drawElements () {
	        inner(EXT_INSTANCING, '.drawElementsInstancedANGLE(', [
	          PRIMITIVE,
	          COUNT,
	          ELEMENT_TYPE,
	          OFFSET + '<<((' + ELEMENT_TYPE + '-' + GL_UNSIGNED_BYTE$8 + ')>>1)',
	          INSTANCES
	        ], ');');
	      }

	      function drawArrays () {
	        inner(EXT_INSTANCING, '.drawArraysInstancedANGLE(',
	          [PRIMITIVE, OFFSET, COUNT, INSTANCES], ');');
	      }

	      if (ELEMENTS && ELEMENTS !== 'null') {
	        if (!elementsStatic) {
	          inner('if(', ELEMENTS, '){');
	          drawElements();
	          inner('}else{');
	          drawArrays();
	          inner('}');
	        } else {
	          drawElements();
	        }
	      } else {
	        drawArrays();
	      }
	    }

	    function emitRegular () {
	      function drawElements () {
	        inner(GL + '.drawElements(' + [
	          PRIMITIVE,
	          COUNT,
	          ELEMENT_TYPE,
	          OFFSET + '<<((' + ELEMENT_TYPE + '-' + GL_UNSIGNED_BYTE$8 + ')>>1)'
	        ] + ');');
	      }

	      function drawArrays () {
	        inner(GL + '.drawArrays(' + [PRIMITIVE, OFFSET, COUNT] + ');');
	      }

	      if (ELEMENTS && ELEMENTS !== 'null') {
	        if (!elementsStatic) {
	          inner('if(', ELEMENTS, '){');
	          drawElements();
	          inner('}else{');
	          drawArrays();
	          inner('}');
	        } else {
	          drawElements();
	        }
	      } else {
	        drawArrays();
	      }
	    }

	    if (extInstancing && (typeof INSTANCES !== 'number' || INSTANCES >= 0)) {
	      if (typeof INSTANCES === 'string') {
	        inner('if(', INSTANCES, '>0){');
	        emitInstancing();
	        inner('}else if(', INSTANCES, '<0){');
	        emitRegular();
	        inner('}');
	      } else {
	        emitInstancing();
	      }
	    } else {
	      emitRegular();
	    }
	  }

	  function createBody (emitBody, parentEnv, args, program, count) {
	    var env = createREGLEnvironment();
	    var scope = env.proc('body', count);
	    check$1.optional(function () {
	      env.commandStr = parentEnv.commandStr;
	      env.command = env.link(parentEnv.commandStr);
	    });
	    if (extInstancing) {
	      env.instancing = scope.def(
	        env.shared.extensions, '.angle_instanced_arrays');
	    }
	    emitBody(env, scope, args, program);
	    return env.compile().body
	  }

	  // ===================================================
	  // ===================================================
	  // DRAW PROC
	  // ===================================================
	  // ===================================================
	  function emitDrawBody (env, draw, args, program) {
	    injectExtensions(env, draw);
	    if (args.useVAO) {
	      if (args.drawVAO) {
	        draw(env.shared.vao, '.setVAO(', args.drawVAO.append(env, draw), ');');
	      } else {
	        draw(env.shared.vao, '.setVAO(', env.shared.vao, '.targetVAO);');
	      }
	    } else {
	      draw(env.shared.vao, '.setVAO(null);');
	      emitAttributes(env, draw, args, program.attributes, function () {
	        return true
	      });
	    }
	    emitUniforms(env, draw, args, program.uniforms, function () {
	      return true
	    }, false);
	    emitDraw(env, draw, draw, args);
	  }

	  function emitDrawProc (env, args) {
	    var draw = env.proc('draw', 1);

	    injectExtensions(env, draw);

	    emitContext(env, draw, args.context);
	    emitPollFramebuffer(env, draw, args.framebuffer);

	    emitPollState(env, draw, args);
	    emitSetOptions(env, draw, args.state);

	    emitProfile(env, draw, args, false, true);

	    var program = args.shader.progVar.append(env, draw);
	    draw(env.shared.gl, '.useProgram(', program, '.program);');

	    if (args.shader.program) {
	      emitDrawBody(env, draw, args, args.shader.program);
	    } else {
	      draw(env.shared.vao, '.setVAO(null);');
	      var drawCache = env.global.def('{}');
	      var PROG_ID = draw.def(program, '.id');
	      var CACHED_PROC = draw.def(drawCache, '[', PROG_ID, ']');
	      draw(
	        env.cond(CACHED_PROC)
	          .then(CACHED_PROC, '.call(this,a0);')
	          .else(
	            CACHED_PROC, '=', drawCache, '[', PROG_ID, ']=',
	            env.link(function (program) {
	              return createBody(emitDrawBody, env, args, program, 1)
	            }), '(', program, ');',
	            CACHED_PROC, '.call(this,a0);'));
	    }

	    if (Object.keys(args.state).length > 0) {
	      draw(env.shared.current, '.dirty=true;');
	    }
	    if (env.shared.vao) {
	      draw(env.shared.vao, '.setVAO(null);');
	    }
	  }

	  // ===================================================
	  // ===================================================
	  // BATCH PROC
	  // ===================================================
	  // ===================================================

	  function emitBatchDynamicShaderBody (env, scope, args, program) {
	    env.batchId = 'a1';

	    injectExtensions(env, scope);

	    function all () {
	      return true
	    }

	    emitAttributes(env, scope, args, program.attributes, all);
	    emitUniforms(env, scope, args, program.uniforms, all, false);
	    emitDraw(env, scope, scope, args);
	  }

	  function emitBatchBody (env, scope, args, program) {
	    injectExtensions(env, scope);

	    var contextDynamic = args.contextDep;

	    var BATCH_ID = scope.def();
	    var PROP_LIST = 'a0';
	    var NUM_PROPS = 'a1';
	    var PROPS = scope.def();
	    env.shared.props = PROPS;
	    env.batchId = BATCH_ID;

	    var outer = env.scope();
	    var inner = env.scope();

	    scope(
	      outer.entry,
	      'for(', BATCH_ID, '=0;', BATCH_ID, '<', NUM_PROPS, ';++', BATCH_ID, '){',
	      PROPS, '=', PROP_LIST, '[', BATCH_ID, '];',
	      inner,
	      '}',
	      outer.exit);

	    function isInnerDefn (defn) {
	      return ((defn.contextDep && contextDynamic) || defn.propDep)
	    }

	    function isOuterDefn (defn) {
	      return !isInnerDefn(defn)
	    }

	    if (args.needsContext) {
	      emitContext(env, inner, args.context);
	    }
	    if (args.needsFramebuffer) {
	      emitPollFramebuffer(env, inner, args.framebuffer);
	    }
	    emitSetOptions(env, inner, args.state, isInnerDefn);

	    if (args.profile && isInnerDefn(args.profile)) {
	      emitProfile(env, inner, args, false, true);
	    }

	    if (!program) {
	      var progCache = env.global.def('{}');
	      var PROGRAM = args.shader.progVar.append(env, inner);
	      var PROG_ID = inner.def(PROGRAM, '.id');
	      var CACHED_PROC = inner.def(progCache, '[', PROG_ID, ']');
	      inner(
	        env.shared.gl, '.useProgram(', PROGRAM, '.program);',
	        'if(!', CACHED_PROC, '){',
	        CACHED_PROC, '=', progCache, '[', PROG_ID, ']=',
	        env.link(function (program) {
	          return createBody(
	            emitBatchDynamicShaderBody, env, args, program, 2)
	        }), '(', PROGRAM, ');}',
	        CACHED_PROC, '.call(this,a0[', BATCH_ID, '],', BATCH_ID, ');');
	    } else {
	      if (args.useVAO) {
	        if (args.drawVAO) {
	          if (isInnerDefn(args.drawVAO)) {
	            // vao is a prop
	            inner(env.shared.vao, '.setVAO(', args.drawVAO.append(env, inner), ');');
	          } else {
	            // vao is invariant
	            outer(env.shared.vao, '.setVAO(', args.drawVAO.append(env, outer), ');');
	          }
	        } else {
	          // scoped vao binding
	          outer(env.shared.vao, '.setVAO(', env.shared.vao, '.targetVAO);');
	        }
	      } else {
	        outer(env.shared.vao, '.setVAO(null);');
	        emitAttributes(env, outer, args, program.attributes, isOuterDefn);
	        emitAttributes(env, inner, args, program.attributes, isInnerDefn);
	      }
	      emitUniforms(env, outer, args, program.uniforms, isOuterDefn, false);
	      emitUniforms(env, inner, args, program.uniforms, isInnerDefn, true);
	      emitDraw(env, outer, inner, args);
	    }
	  }

	  function emitBatchProc (env, args) {
	    var batch = env.proc('batch', 2);
	    env.batchId = '0';

	    injectExtensions(env, batch);

	    // Check if any context variables depend on props
	    var contextDynamic = false;
	    var needsContext = true;
	    Object.keys(args.context).forEach(function (name) {
	      contextDynamic = contextDynamic || args.context[name].propDep;
	    });
	    if (!contextDynamic) {
	      emitContext(env, batch, args.context);
	      needsContext = false;
	    }

	    // framebuffer state affects framebufferWidth/height context vars
	    var framebuffer = args.framebuffer;
	    var needsFramebuffer = false;
	    if (framebuffer) {
	      if (framebuffer.propDep) {
	        contextDynamic = needsFramebuffer = true;
	      } else if (framebuffer.contextDep && contextDynamic) {
	        needsFramebuffer = true;
	      }
	      if (!needsFramebuffer) {
	        emitPollFramebuffer(env, batch, framebuffer);
	      }
	    } else {
	      emitPollFramebuffer(env, batch, null);
	    }

	    // viewport is weird because it can affect context vars
	    if (args.state.viewport && args.state.viewport.propDep) {
	      contextDynamic = true;
	    }

	    function isInnerDefn (defn) {
	      return (defn.contextDep && contextDynamic) || defn.propDep
	    }

	    // set webgl options
	    emitPollState(env, batch, args);
	    emitSetOptions(env, batch, args.state, function (defn) {
	      return !isInnerDefn(defn)
	    });

	    if (!args.profile || !isInnerDefn(args.profile)) {
	      emitProfile(env, batch, args, false, 'a1');
	    }

	    // Save these values to args so that the batch body routine can use them
	    args.contextDep = contextDynamic;
	    args.needsContext = needsContext;
	    args.needsFramebuffer = needsFramebuffer;

	    // determine if shader is dynamic
	    var progDefn = args.shader.progVar;
	    if ((progDefn.contextDep && contextDynamic) || progDefn.propDep) {
	      emitBatchBody(
	        env,
	        batch,
	        args,
	        null);
	    } else {
	      var PROGRAM = progDefn.append(env, batch);
	      batch(env.shared.gl, '.useProgram(', PROGRAM, '.program);');
	      if (args.shader.program) {
	        emitBatchBody(
	          env,
	          batch,
	          args,
	          args.shader.program);
	      } else {
	        batch(env.shared.vao, '.setVAO(null);');
	        var batchCache = env.global.def('{}');
	        var PROG_ID = batch.def(PROGRAM, '.id');
	        var CACHED_PROC = batch.def(batchCache, '[', PROG_ID, ']');
	        batch(
	          env.cond(CACHED_PROC)
	            .then(CACHED_PROC, '.call(this,a0,a1);')
	            .else(
	              CACHED_PROC, '=', batchCache, '[', PROG_ID, ']=',
	              env.link(function (program) {
	                return createBody(emitBatchBody, env, args, program, 2)
	              }), '(', PROGRAM, ');',
	              CACHED_PROC, '.call(this,a0,a1);'));
	      }
	    }

	    if (Object.keys(args.state).length > 0) {
	      batch(env.shared.current, '.dirty=true;');
	    }

	    if (env.shared.vao) {
	      batch(env.shared.vao, '.setVAO(null);');
	    }
	  }

	  // ===================================================
	  // ===================================================
	  // SCOPE COMMAND
	  // ===================================================
	  // ===================================================
	  function emitScopeProc (env, args) {
	    var scope = env.proc('scope', 3);
	    env.batchId = 'a2';

	    var shared = env.shared;
	    var CURRENT_STATE = shared.current;

	    emitContext(env, scope, args.context);

	    if (args.framebuffer) {
	      args.framebuffer.append(env, scope);
	    }

	    sortState(Object.keys(args.state)).forEach(function (name) {
	      var defn = args.state[name];
	      var value = defn.append(env, scope);
	      if (isArrayLike(value)) {
	        value.forEach(function (v, i) {
	          scope.set(env.next[name], '[' + i + ']', v);
	        });
	      } else {
	        scope.set(shared.next, '.' + name, value);
	      }
	    });

	    emitProfile(env, scope, args, true, true)

	    ;[S_ELEMENTS, S_OFFSET, S_COUNT, S_INSTANCES, S_PRIMITIVE].forEach(
	      function (opt) {
	        var variable = args.draw[opt];
	        if (!variable) {
	          return
	        }
	        scope.set(shared.draw, '.' + opt, '' + variable.append(env, scope));
	      });

	    Object.keys(args.uniforms).forEach(function (opt) {
	      var value = args.uniforms[opt].append(env, scope);
	      if (Array.isArray(value)) {
	        value = '[' + value.join() + ']';
	      }
	      scope.set(
	        shared.uniforms,
	        '[' + stringStore.id(opt) + ']',
	        value);
	    });

	    Object.keys(args.attributes).forEach(function (name) {
	      var record = args.attributes[name].append(env, scope);
	      var scopeAttrib = env.scopeAttrib(name);
	      Object.keys(new AttributeRecord()).forEach(function (prop) {
	        scope.set(scopeAttrib, '.' + prop, record[prop]);
	      });
	    });

	    if (args.scopeVAO) {
	      scope.set(shared.vao, '.targetVAO', args.scopeVAO.append(env, scope));
	    }

	    function saveShader (name) {
	      var shader = args.shader[name];
	      if (shader) {
	        scope.set(shared.shader, '.' + name, shader.append(env, scope));
	      }
	    }
	    saveShader(S_VERT);
	    saveShader(S_FRAG);

	    if (Object.keys(args.state).length > 0) {
	      scope(CURRENT_STATE, '.dirty=true;');
	      scope.exit(CURRENT_STATE, '.dirty=true;');
	    }

	    scope('a1(', env.shared.context, ',a0,', env.batchId, ');');
	  }

	  function isDynamicObject (object) {
	    if (typeof object !== 'object' || isArrayLike(object)) {
	      return
	    }
	    var props = Object.keys(object);
	    for (var i = 0; i < props.length; ++i) {
	      if (dynamic.isDynamic(object[props[i]])) {
	        return true
	      }
	    }
	    return false
	  }

	  function splatObject (env, options, name) {
	    var object = options.static[name];
	    if (!object || !isDynamicObject(object)) {
	      return
	    }

	    var globals = env.global;
	    var keys = Object.keys(object);
	    var thisDep = false;
	    var contextDep = false;
	    var propDep = false;
	    var objectRef = env.global.def('{}');
	    keys.forEach(function (key) {
	      var value = object[key];
	      if (dynamic.isDynamic(value)) {
	        if (typeof value === 'function') {
	          value = object[key] = dynamic.unbox(value);
	        }
	        var deps = createDynamicDecl(value, null);
	        thisDep = thisDep || deps.thisDep;
	        propDep = propDep || deps.propDep;
	        contextDep = contextDep || deps.contextDep;
	      } else {
	        globals(objectRef, '.', key, '=');
	        switch (typeof value) {
	          case 'number':
	            globals(value);
	            break
	          case 'string':
	            globals('"', value, '"');
	            break
	          case 'object':
	            if (Array.isArray(value)) {
	              globals('[', value.join(), ']');
	            }
	            break
	          default:
	            globals(env.link(value));
	            break
	        }
	        globals(';');
	      }
	    });

	    function appendBlock (env, block) {
	      keys.forEach(function (key) {
	        var value = object[key];
	        if (!dynamic.isDynamic(value)) {
	          return
	        }
	        var ref = env.invoke(block, value);
	        block(objectRef, '.', key, '=', ref, ';');
	      });
	    }

	    options.dynamic[name] = new dynamic.DynamicVariable(DYN_THUNK, {
	      thisDep: thisDep,
	      contextDep: contextDep,
	      propDep: propDep,
	      ref: objectRef,
	      append: appendBlock
	    });
	    delete options.static[name];
	  }

	  // ===========================================================================
	  // ===========================================================================
	  // MAIN DRAW COMMAND
	  // ===========================================================================
	  // ===========================================================================
	  function compileCommand (options, attributes, uniforms, context, stats) {
	    var env = createREGLEnvironment();

	    // link stats, so that we can easily access it in the program.
	    env.stats = env.link(stats);

	    // splat options and attributes to allow for dynamic nested properties
	    Object.keys(attributes.static).forEach(function (key) {
	      splatObject(env, attributes, key);
	    });
	    NESTED_OPTIONS.forEach(function (name) {
	      splatObject(env, options, name);
	    });

	    var args = parseArguments(options, attributes, uniforms, context, env);

	    emitDrawProc(env, args);
	    emitScopeProc(env, args);
	    emitBatchProc(env, args);

	    return extend(env.compile(), {
	      destroy: function () {
	        args.shader.program.destroy();
	      }
	    })
	  }

	  // ===========================================================================
	  // ===========================================================================
	  // POLL / REFRESH
	  // ===========================================================================
	  // ===========================================================================
	  return {
	    next: nextState,
	    current: currentState,
	    procs: (function () {
	      var env = createREGLEnvironment();
	      var poll = env.proc('poll');
	      var refresh = env.proc('refresh');
	      var common = env.block();
	      poll(common);
	      refresh(common);

	      var shared = env.shared;
	      var GL = shared.gl;
	      var NEXT_STATE = shared.next;
	      var CURRENT_STATE = shared.current;

	      common(CURRENT_STATE, '.dirty=false;');

	      emitPollFramebuffer(env, poll);
	      emitPollFramebuffer(env, refresh, null, true);

	      // Refresh updates all attribute state changes
	      var INSTANCING;
	      if (extInstancing) {
	        INSTANCING = env.link(extInstancing);
	      }

	      // update vertex array bindings
	      if (extensions.oes_vertex_array_object) {
	        refresh(env.link(extensions.oes_vertex_array_object), '.bindVertexArrayOES(null);');
	      }
	      for (var i = 0; i < limits.maxAttributes; ++i) {
	        var BINDING = refresh.def(shared.attributes, '[', i, ']');
	        var ifte = env.cond(BINDING, '.buffer');
	        ifte.then(
	          GL, '.enableVertexAttribArray(', i, ');',
	          GL, '.bindBuffer(',
	          GL_ARRAY_BUFFER$2, ',',
	          BINDING, '.buffer.buffer);',
	          GL, '.vertexAttribPointer(',
	          i, ',',
	          BINDING, '.size,',
	          BINDING, '.type,',
	          BINDING, '.normalized,',
	          BINDING, '.stride,',
	          BINDING, '.offset);'
	        ).else(
	          GL, '.disableVertexAttribArray(', i, ');',
	          GL, '.vertexAttrib4f(',
	          i, ',',
	          BINDING, '.x,',
	          BINDING, '.y,',
	          BINDING, '.z,',
	          BINDING, '.w);',
	          BINDING, '.buffer=null;');
	        refresh(ifte);
	        if (extInstancing) {
	          refresh(
	            INSTANCING, '.vertexAttribDivisorANGLE(',
	            i, ',',
	            BINDING, '.divisor);');
	        }
	      }
	      refresh(
	        env.shared.vao, '.currentVAO=null;',
	        env.shared.vao, '.setVAO(', env.shared.vao, '.targetVAO);');

	      Object.keys(GL_FLAGS).forEach(function (flag) {
	        var cap = GL_FLAGS[flag];
	        var NEXT = common.def(NEXT_STATE, '.', flag);
	        var block = env.block();
	        block('if(', NEXT, '){',
	          GL, '.enable(', cap, ')}else{',
	          GL, '.disable(', cap, ')}',
	          CURRENT_STATE, '.', flag, '=', NEXT, ';');
	        refresh(block);
	        poll(
	          'if(', NEXT, '!==', CURRENT_STATE, '.', flag, '){',
	          block,
	          '}');
	      });

	      Object.keys(GL_VARIABLES).forEach(function (name) {
	        var func = GL_VARIABLES[name];
	        var init = currentState[name];
	        var NEXT, CURRENT;
	        var block = env.block();
	        block(GL, '.', func, '(');
	        if (isArrayLike(init)) {
	          var n = init.length;
	          NEXT = env.global.def(NEXT_STATE, '.', name);
	          CURRENT = env.global.def(CURRENT_STATE, '.', name);
	          block(
	            loop(n, function (i) {
	              return NEXT + '[' + i + ']'
	            }), ');',
	            loop(n, function (i) {
	              return CURRENT + '[' + i + ']=' + NEXT + '[' + i + '];'
	            }).join(''));
	          poll(
	            'if(', loop(n, function (i) {
	              return NEXT + '[' + i + ']!==' + CURRENT + '[' + i + ']'
	            }).join('||'), '){',
	            block,
	            '}');
	        } else {
	          NEXT = common.def(NEXT_STATE, '.', name);
	          CURRENT = common.def(CURRENT_STATE, '.', name);
	          block(
	            NEXT, ');',
	            CURRENT_STATE, '.', name, '=', NEXT, ';');
	          poll(
	            'if(', NEXT, '!==', CURRENT, '){',
	            block,
	            '}');
	        }
	        refresh(block);
	      });

	      return env.compile()
	    })(),
	    compile: compileCommand
	  }
	}

	function stats () {
	  return {
	    vaoCount: 0,
	    bufferCount: 0,
	    elementsCount: 0,
	    framebufferCount: 0,
	    shaderCount: 0,
	    textureCount: 0,
	    cubeCount: 0,
	    renderbufferCount: 0,
	    maxTextureUnits: 0
	  }
	}

	var GL_QUERY_RESULT_EXT = 0x8866;
	var GL_QUERY_RESULT_AVAILABLE_EXT = 0x8867;
	var GL_TIME_ELAPSED_EXT = 0x88BF;

	var createTimer = function (gl, extensions) {
	  if (!extensions.ext_disjoint_timer_query) {
	    return null
	  }

	  // QUERY POOL BEGIN
	  var queryPool = [];
	  function allocQuery () {
	    return queryPool.pop() || extensions.ext_disjoint_timer_query.createQueryEXT()
	  }
	  function freeQuery (query) {
	    queryPool.push(query);
	  }
	  // QUERY POOL END

	  var pendingQueries = [];
	  function beginQuery (stats) {
	    var query = allocQuery();
	    extensions.ext_disjoint_timer_query.beginQueryEXT(GL_TIME_ELAPSED_EXT, query);
	    pendingQueries.push(query);
	    pushScopeStats(pendingQueries.length - 1, pendingQueries.length, stats);
	  }

	  function endQuery () {
	    extensions.ext_disjoint_timer_query.endQueryEXT(GL_TIME_ELAPSED_EXT);
	  }

	  //
	  // Pending stats pool.
	  //
	  function PendingStats () {
	    this.startQueryIndex = -1;
	    this.endQueryIndex = -1;
	    this.sum = 0;
	    this.stats = null;
	  }
	  var pendingStatsPool = [];
	  function allocPendingStats () {
	    return pendingStatsPool.pop() || new PendingStats()
	  }
	  function freePendingStats (pendingStats) {
	    pendingStatsPool.push(pendingStats);
	  }
	  // Pending stats pool end

	  var pendingStats = [];
	  function pushScopeStats (start, end, stats) {
	    var ps = allocPendingStats();
	    ps.startQueryIndex = start;
	    ps.endQueryIndex = end;
	    ps.sum = 0;
	    ps.stats = stats;
	    pendingStats.push(ps);
	  }

	  // we should call this at the beginning of the frame,
	  // in order to update gpuTime
	  var timeSum = [];
	  var queryPtr = [];
	  function update () {
	    var ptr, i;

	    var n = pendingQueries.length;
	    if (n === 0) {
	      return
	    }

	    // Reserve space
	    queryPtr.length = Math.max(queryPtr.length, n + 1);
	    timeSum.length = Math.max(timeSum.length, n + 1);
	    timeSum[0] = 0;
	    queryPtr[0] = 0;

	    // Update all pending timer queries
	    var queryTime = 0;
	    ptr = 0;
	    for (i = 0; i < pendingQueries.length; ++i) {
	      var query = pendingQueries[i];
	      if (extensions.ext_disjoint_timer_query.getQueryObjectEXT(query, GL_QUERY_RESULT_AVAILABLE_EXT)) {
	        queryTime += extensions.ext_disjoint_timer_query.getQueryObjectEXT(query, GL_QUERY_RESULT_EXT);
	        freeQuery(query);
	      } else {
	        pendingQueries[ptr++] = query;
	      }
	      timeSum[i + 1] = queryTime;
	      queryPtr[i + 1] = ptr;
	    }
	    pendingQueries.length = ptr;

	    // Update all pending stat queries
	    ptr = 0;
	    for (i = 0; i < pendingStats.length; ++i) {
	      var stats = pendingStats[i];
	      var start = stats.startQueryIndex;
	      var end = stats.endQueryIndex;
	      stats.sum += timeSum[end] - timeSum[start];
	      var startPtr = queryPtr[start];
	      var endPtr = queryPtr[end];
	      if (endPtr === startPtr) {
	        stats.stats.gpuTime += stats.sum / 1e6;
	        freePendingStats(stats);
	      } else {
	        stats.startQueryIndex = startPtr;
	        stats.endQueryIndex = endPtr;
	        pendingStats[ptr++] = stats;
	      }
	    }
	    pendingStats.length = ptr;
	  }

	  return {
	    beginQuery: beginQuery,
	    endQuery: endQuery,
	    pushScopeStats: pushScopeStats,
	    update: update,
	    getNumPendingQueries: function () {
	      return pendingQueries.length
	    },
	    clear: function () {
	      queryPool.push.apply(queryPool, pendingQueries);
	      for (var i = 0; i < queryPool.length; i++) {
	        extensions.ext_disjoint_timer_query.deleteQueryEXT(queryPool[i]);
	      }
	      pendingQueries.length = 0;
	      queryPool.length = 0;
	    },
	    restore: function () {
	      pendingQueries.length = 0;
	      queryPool.length = 0;
	    }
	  }
	};

	var GL_COLOR_BUFFER_BIT = 16384;
	var GL_DEPTH_BUFFER_BIT = 256;
	var GL_STENCIL_BUFFER_BIT = 1024;

	var GL_ARRAY_BUFFER = 34962;

	var CONTEXT_LOST_EVENT = 'webglcontextlost';
	var CONTEXT_RESTORED_EVENT = 'webglcontextrestored';

	var DYN_PROP = 1;
	var DYN_CONTEXT = 2;
	var DYN_STATE = 3;

	function find (haystack, needle) {
	  for (var i = 0; i < haystack.length; ++i) {
	    if (haystack[i] === needle) {
	      return i
	    }
	  }
	  return -1
	}

	function wrapREGL (args) {
	  var config = parseArgs(args);
	  if (!config) {
	    return null
	  }

	  var gl = config.gl;
	  var glAttributes = gl.getContextAttributes();
	  var contextLost = gl.isContextLost();

	  var extensionState = createExtensionCache(gl, config);
	  if (!extensionState) {
	    return null
	  }

	  var stringStore = createStringStore();
	  var stats$$1 = stats();
	  var extensions = extensionState.extensions;
	  var timer = createTimer(gl, extensions);

	  var START_TIME = clock();
	  var WIDTH = gl.drawingBufferWidth;
	  var HEIGHT = gl.drawingBufferHeight;

	  var contextState = {
	    tick: 0,
	    time: 0,
	    viewportWidth: WIDTH,
	    viewportHeight: HEIGHT,
	    framebufferWidth: WIDTH,
	    framebufferHeight: HEIGHT,
	    drawingBufferWidth: WIDTH,
	    drawingBufferHeight: HEIGHT,
	    pixelRatio: config.pixelRatio
	  };
	  var uniformState = {};
	  var drawState = {
	    elements: null,
	    primitive: 4, // GL_TRIANGLES
	    count: -1,
	    offset: 0,
	    instances: -1
	  };

	  var limits = wrapLimits(gl, extensions);
	  var bufferState = wrapBufferState(
	    gl,
	    stats$$1,
	    config,
	    destroyBuffer);
	  var elementState = wrapElementsState(gl, extensions, bufferState, stats$$1);
	  var attributeState = wrapAttributeState(
	    gl,
	    extensions,
	    limits,
	    stats$$1,
	    bufferState,
	    elementState,
	    drawState);
	  function destroyBuffer (buffer) {
	    return attributeState.destroyBuffer(buffer)
	  }
	  var shaderState = wrapShaderState(gl, stringStore, stats$$1, config);
	  var textureState = createTextureSet(
	    gl,
	    extensions,
	    limits,
	    function () { core.procs.poll(); },
	    contextState,
	    stats$$1,
	    config);
	  var renderbufferState = wrapRenderbuffers(gl, extensions, limits, stats$$1, config);
	  var framebufferState = wrapFBOState(
	    gl,
	    extensions,
	    limits,
	    textureState,
	    renderbufferState,
	    stats$$1);
	  var core = reglCore(
	    gl,
	    stringStore,
	    extensions,
	    limits,
	    bufferState,
	    elementState,
	    textureState,
	    framebufferState,
	    uniformState,
	    attributeState,
	    shaderState,
	    drawState,
	    contextState,
	    timer,
	    config);
	  var readPixels = wrapReadPixels(
	    gl,
	    framebufferState,
	    core.procs.poll,
	    contextState,
	    glAttributes, extensions, limits);

	  var nextState = core.next;
	  var canvas = gl.canvas;

	  var rafCallbacks = [];
	  var lossCallbacks = [];
	  var restoreCallbacks = [];
	  var destroyCallbacks = [config.onDestroy];

	  var activeRAF = null;
	  function handleRAF () {
	    if (rafCallbacks.length === 0) {
	      if (timer) {
	        timer.update();
	      }
	      activeRAF = null;
	      return
	    }

	    // schedule next animation frame
	    activeRAF = raf.next(handleRAF);

	    // poll for changes
	    poll();

	    // fire a callback for all pending rafs
	    for (var i = rafCallbacks.length - 1; i >= 0; --i) {
	      var cb = rafCallbacks[i];
	      if (cb) {
	        cb(contextState, null, 0);
	      }
	    }

	    // flush all pending webgl calls
	    gl.flush();

	    // poll GPU timers *after* gl.flush so we don't delay command dispatch
	    if (timer) {
	      timer.update();
	    }
	  }

	  function startRAF () {
	    if (!activeRAF && rafCallbacks.length > 0) {
	      activeRAF = raf.next(handleRAF);
	    }
	  }

	  function stopRAF () {
	    if (activeRAF) {
	      raf.cancel(handleRAF);
	      activeRAF = null;
	    }
	  }

	  function handleContextLoss (event) {
	    event.preventDefault();

	    // set context lost flag
	    contextLost = true;

	    // pause request animation frame
	    stopRAF();

	    // lose context
	    lossCallbacks.forEach(function (cb) {
	      cb();
	    });
	  }

	  function handleContextRestored (event) {
	    // clear error code
	    gl.getError();

	    // clear context lost flag
	    contextLost = false;

	    // refresh state
	    extensionState.restore();
	    shaderState.restore();
	    bufferState.restore();
	    textureState.restore();
	    renderbufferState.restore();
	    framebufferState.restore();
	    attributeState.restore();
	    if (timer) {
	      timer.restore();
	    }

	    // refresh state
	    core.procs.refresh();

	    // restart RAF
	    startRAF();

	    // restore context
	    restoreCallbacks.forEach(function (cb) {
	      cb();
	    });
	  }

	  if (canvas) {
	    canvas.addEventListener(CONTEXT_LOST_EVENT, handleContextLoss, false);
	    canvas.addEventListener(CONTEXT_RESTORED_EVENT, handleContextRestored, false);
	  }

	  function destroy () {
	    rafCallbacks.length = 0;
	    stopRAF();

	    if (canvas) {
	      canvas.removeEventListener(CONTEXT_LOST_EVENT, handleContextLoss);
	      canvas.removeEventListener(CONTEXT_RESTORED_EVENT, handleContextRestored);
	    }

	    shaderState.clear();
	    framebufferState.clear();
	    renderbufferState.clear();
	    attributeState.clear();
	    textureState.clear();
	    elementState.clear();
	    bufferState.clear();

	    if (timer) {
	      timer.clear();
	    }

	    destroyCallbacks.forEach(function (cb) {
	      cb();
	    });
	  }

	  function compileProcedure (options) {
	    check$1(!!options, 'invalid args to regl({...})');
	    check$1.type(options, 'object', 'invalid args to regl({...})');

	    function flattenNestedOptions (options) {
	      var result = extend({}, options);
	      delete result.uniforms;
	      delete result.attributes;
	      delete result.context;
	      delete result.vao;

	      if ('stencil' in result && result.stencil.op) {
	        result.stencil.opBack = result.stencil.opFront = result.stencil.op;
	        delete result.stencil.op;
	      }

	      function merge (name) {
	        if (name in result) {
	          var child = result[name];
	          delete result[name];
	          Object.keys(child).forEach(function (prop) {
	            result[name + '.' + prop] = child[prop];
	          });
	        }
	      }
	      merge('blend');
	      merge('depth');
	      merge('cull');
	      merge('stencil');
	      merge('polygonOffset');
	      merge('scissor');
	      merge('sample');

	      if ('vao' in options) {
	        result.vao = options.vao;
	      }

	      return result
	    }

	    function separateDynamic (object, useArrays) {
	      var staticItems = {};
	      var dynamicItems = {};
	      Object.keys(object).forEach(function (option) {
	        var value = object[option];
	        if (dynamic.isDynamic(value)) {
	          dynamicItems[option] = dynamic.unbox(value, option);
	          return
	        } else if (useArrays && Array.isArray(value)) {
	          for (var i = 0; i < value.length; ++i) {
	            if (dynamic.isDynamic(value[i])) {
	              dynamicItems[option] = dynamic.unbox(value, option);
	              return
	            }
	          }
	        }
	        staticItems[option] = value;
	      });
	      return {
	        dynamic: dynamicItems,
	        static: staticItems
	      }
	    }

	    // Treat context variables separate from other dynamic variables
	    var context = separateDynamic(options.context || {}, true);
	    var uniforms = separateDynamic(options.uniforms || {}, true);
	    var attributes = separateDynamic(options.attributes || {}, false);
	    var opts = separateDynamic(flattenNestedOptions(options), false);

	    var stats$$1 = {
	      gpuTime: 0.0,
	      cpuTime: 0.0,
	      count: 0
	    };

	    var compiled = core.compile(opts, attributes, uniforms, context, stats$$1);

	    var draw = compiled.draw;
	    var batch = compiled.batch;
	    var scope = compiled.scope;

	    // FIXME: we should modify code generation for batch commands so this
	    // isn't necessary
	    var EMPTY_ARRAY = [];
	    function reserve (count) {
	      while (EMPTY_ARRAY.length < count) {
	        EMPTY_ARRAY.push(null);
	      }
	      return EMPTY_ARRAY
	    }

	    function REGLCommand (args, body) {
	      var i;
	      if (contextLost) {
	        check$1.raise('context lost');
	      }
	      if (typeof args === 'function') {
	        return scope.call(this, null, args, 0)
	      } else if (typeof body === 'function') {
	        if (typeof args === 'number') {
	          for (i = 0; i < args; ++i) {
	            scope.call(this, null, body, i);
	          }
	        } else if (Array.isArray(args)) {
	          for (i = 0; i < args.length; ++i) {
	            scope.call(this, args[i], body, i);
	          }
	        } else {
	          return scope.call(this, args, body, 0)
	        }
	      } else if (typeof args === 'number') {
	        if (args > 0) {
	          return batch.call(this, reserve(args | 0), args | 0)
	        }
	      } else if (Array.isArray(args)) {
	        if (args.length) {
	          return batch.call(this, args, args.length)
	        }
	      } else {
	        return draw.call(this, args)
	      }
	    }

	    return extend(REGLCommand, {
	      stats: stats$$1,
	      destroy: function () {
	        compiled.destroy();
	      }
	    })
	  }

	  var setFBO = framebufferState.setFBO = compileProcedure({
	    framebuffer: dynamic.define.call(null, DYN_PROP, 'framebuffer')
	  });

	  function clearImpl (_, options) {
	    var clearFlags = 0;
	    core.procs.poll();

	    var c = options.color;
	    if (c) {
	      gl.clearColor(+c[0] || 0, +c[1] || 0, +c[2] || 0, +c[3] || 0);
	      clearFlags |= GL_COLOR_BUFFER_BIT;
	    }
	    if ('depth' in options) {
	      gl.clearDepth(+options.depth);
	      clearFlags |= GL_DEPTH_BUFFER_BIT;
	    }
	    if ('stencil' in options) {
	      gl.clearStencil(options.stencil | 0);
	      clearFlags |= GL_STENCIL_BUFFER_BIT;
	    }

	    check$1(!!clearFlags, 'called regl.clear with no buffer specified');
	    gl.clear(clearFlags);
	  }

	  function clear (options) {
	    check$1(
	      typeof options === 'object' && options,
	      'regl.clear() takes an object as input');
	    if ('framebuffer' in options) {
	      if (options.framebuffer &&
	          options.framebuffer_reglType === 'framebufferCube') {
	        for (var i = 0; i < 6; ++i) {
	          setFBO(extend({
	            framebuffer: options.framebuffer.faces[i]
	          }, options), clearImpl);
	        }
	      } else {
	        setFBO(options, clearImpl);
	      }
	    } else {
	      clearImpl(null, options);
	    }
	  }

	  function frame (cb) {
	    check$1.type(cb, 'function', 'regl.frame() callback must be a function');
	    rafCallbacks.push(cb);

	    function cancel () {
	      // FIXME:  should we check something other than equals cb here?
	      // what if a user calls frame twice with the same callback...
	      //
	      var i = find(rafCallbacks, cb);
	      check$1(i >= 0, 'cannot cancel a frame twice');
	      function pendingCancel () {
	        var index = find(rafCallbacks, pendingCancel);
	        rafCallbacks[index] = rafCallbacks[rafCallbacks.length - 1];
	        rafCallbacks.length -= 1;
	        if (rafCallbacks.length <= 0) {
	          stopRAF();
	        }
	      }
	      rafCallbacks[i] = pendingCancel;
	    }

	    startRAF();

	    return {
	      cancel: cancel
	    }
	  }

	  // poll viewport
	  function pollViewport () {
	    var viewport = nextState.viewport;
	    var scissorBox = nextState.scissor_box;
	    viewport[0] = viewport[1] = scissorBox[0] = scissorBox[1] = 0;
	    contextState.viewportWidth =
	      contextState.framebufferWidth =
	      contextState.drawingBufferWidth =
	      viewport[2] =
	      scissorBox[2] = gl.drawingBufferWidth;
	    contextState.viewportHeight =
	      contextState.framebufferHeight =
	      contextState.drawingBufferHeight =
	      viewport[3] =
	      scissorBox[3] = gl.drawingBufferHeight;
	  }

	  function poll () {
	    contextState.tick += 1;
	    contextState.time = now();
	    pollViewport();
	    core.procs.poll();
	  }

	  function refresh () {
	    textureState.refresh();
	    pollViewport();
	    core.procs.refresh();
	    if (timer) {
	      timer.update();
	    }
	  }

	  function now () {
	    return (clock() - START_TIME) / 1000.0
	  }

	  refresh();

	  function addListener (event, callback) {
	    check$1.type(callback, 'function', 'listener callback must be a function');

	    var callbacks;
	    switch (event) {
	      case 'frame':
	        return frame(callback)
	      case 'lost':
	        callbacks = lossCallbacks;
	        break
	      case 'restore':
	        callbacks = restoreCallbacks;
	        break
	      case 'destroy':
	        callbacks = destroyCallbacks;
	        break
	      default:
	        check$1.raise('invalid event, must be one of frame,lost,restore,destroy');
	    }

	    callbacks.push(callback);
	    return {
	      cancel: function () {
	        for (var i = 0; i < callbacks.length; ++i) {
	          if (callbacks[i] === callback) {
	            callbacks[i] = callbacks[callbacks.length - 1];
	            callbacks.pop();
	            return
	          }
	        }
	      }
	    }
	  }

	  var regl = extend(compileProcedure, {
	    // Clear current FBO
	    clear: clear,

	    // Short cuts for dynamic variables
	    prop: dynamic.define.bind(null, DYN_PROP),
	    context: dynamic.define.bind(null, DYN_CONTEXT),
	    this: dynamic.define.bind(null, DYN_STATE),

	    // executes an empty draw command
	    draw: compileProcedure({}),

	    // Resources
	    buffer: function (options) {
	      return bufferState.create(options, GL_ARRAY_BUFFER, false, false)
	    },
	    elements: function (options) {
	      return elementState.create(options, false)
	    },
	    texture: textureState.create2D,
	    cube: textureState.createCube,
	    renderbuffer: renderbufferState.create,
	    framebuffer: framebufferState.create,
	    framebufferCube: framebufferState.createCube,
	    vao: attributeState.createVAO,

	    // Expose context attributes
	    attributes: glAttributes,

	    // Frame rendering
	    frame: frame,
	    on: addListener,

	    // System limits
	    limits: limits,
	    hasExtension: function (name) {
	      return limits.extensions.indexOf(name.toLowerCase()) >= 0
	    },

	    // Read pixels
	    read: readPixels,

	    // Destroy regl and all associated resources
	    destroy: destroy,

	    // Direct GL state manipulation
	    _gl: gl,
	    _refresh: refresh,

	    poll: function () {
	      poll();
	      if (timer) {
	        timer.update();
	      }
	    },

	    // Current time
	    now: now,

	    // regl Statistics Information
	    stats: stats$$1
	  });

	  config.onDone(null, regl);

	  return regl
	}

	return wrapREGL;

	})));

	}(regl$1));

	var unindexMesh = unindex$1;

	function unindex$1(positions, cells, out) {
	  if (positions.positions && positions.cells) {
	    out = cells;
	    cells = positions.cells;
	    positions = positions.positions;
	  }

	  var dims = positions.length ? positions[0].length : 0;
	  var points = cells.length ? cells[0].length : 0;

	  out = out || new Float32Array(cells.length * points * dims);

	  if (points === 3 && dims === 2) {
	    for (var i = 0, n = 0, l = cells.length; i < l; i += 1) {
	      var cell = cells[i];
	      out[n++] = positions[cell[0]][0];
	      out[n++] = positions[cell[0]][1];
	      out[n++] = positions[cell[1]][0];
	      out[n++] = positions[cell[1]][1];
	      out[n++] = positions[cell[2]][0];
	      out[n++] = positions[cell[2]][1];
	    }
	  } else
	  if (points === 3 && dims === 3) {
	    for (var i = 0, n = 0, l = cells.length; i < l; i += 1) {
	      var cell = cells[i];
	      out[n++] = positions[cell[0]][0];
	      out[n++] = positions[cell[0]][1];
	      out[n++] = positions[cell[0]][2];
	      out[n++] = positions[cell[1]][0];
	      out[n++] = positions[cell[1]][1];
	      out[n++] = positions[cell[1]][2];
	      out[n++] = positions[cell[2]][0];
	      out[n++] = positions[cell[2]][1];
	      out[n++] = positions[cell[2]][2];
	    }
	  } else {
	    for (var i = 0, n = 0, l = cells.length; i < l; i += 1) {
	      var cell = cells[i];
	      for (var c = 0; c < cell.length; c++) {
	        var C = cell[c];
	        for (var k = 0; k < dims; k++) {
	          out[n++] = positions[C][k];
	        }
	      }
	    }
	  }

	  return out
	}

	var faceNormals_1 = faceNormals$1;

	function faceNormals$1(verts, output) {
	  var l = verts.length;
	  if (!output) output = new Float32Array(l);

	  for (var i = 0; i < l; i += 9) {
	    var p1x = verts[i+3] - verts[i];
	    var p1y = verts[i+4] - verts[i+1];
	    var p1z = verts[i+5] - verts[i+2];

	    var p2x = verts[i+6] - verts[i];
	    var p2y = verts[i+7] - verts[i+1];
	    var p2z = verts[i+8] - verts[i+2];

	    var p3x = p1y * p2z - p1z * p2y;
	    var p3y = p1z * p2x - p1x * p2z;
	    var p3z = p1x * p2y - p1y * p2x;

	    var mag = Math.sqrt(p3x * p3x + p3y * p3y + p3z * p3z);
	    if (mag === 0) {
	      output[i  ] = 0;
	      output[i+1] = 0;
	      output[i+2] = 0;

	      output[i+3] = 0;
	      output[i+4] = 0;
	      output[i+5] = 0;

	      output[i+6] = 0;
	      output[i+7] = 0;
	      output[i+8] = 0;
	    } else {
	      p3x = p3x / mag;
	      p3y = p3y / mag;
	      p3z = p3z / mag;

	      output[i  ] = p3x;
	      output[i+1] = p3y;
	      output[i+2] = p3z;

	      output[i+3] = p3x;
	      output[i+4] = p3y;
	      output[i+5] = p3z;

	      output[i+6] = p3x;
	      output[i+7] = p3y;
	      output[i+8] = p3z;
	    }
	  }

	  return output
	}

	const unindex = unindexMesh;
	const faceNormals = faceNormals_1;

	const indexed_cube = {
	    cells: [
	        [1, 0, 2],
	        [3, 1, 2],
	        [4, 5, 6],
	        [5, 7, 6],
	        [0, 1, 5],
	        [4, 0, 5],
	        [1, 3, 5],
	        [3, 7, 5],
	        [2, 0, 4],
	        [2, 4, 6],
	        [2, 6, 3],
	        [6, 7, 3]
	    ],
	    positions: [
	        [0, 0, 0],
	        [0, 0, 1],
	        [1, 0, 0],
	        [1, 0, 1],
	        [0, 1, 0],
	        [0, 1, 1],
	        [1, 1, 0],
	        [1, 1, 1]
	    ]
	};

	// position without cells, unindexed, full list of triangles
	const triangle_soup_cube = unindex(indexed_cube.positions, indexed_cube.cells);
	const normals = faceNormals(triangle_soup_cube);

	var cube$1 = {
	    positions: triangle_soup_cube,
	    normals: normals,
	};

	/**
	 * Common utilities
	 * @module glMatrix
	 */
	// Configuration Constants
	var EPSILON = 0.000001;
	var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
	var RANDOM = Math.random;
	/**
	 * Sets the type of array used when creating new vectors and matrices
	 *
	 * @param {Float32ArrayConstructor | ArrayConstructor} type Array type, such as Float32Array or Array
	 */

	function setMatrixArrayType(type) {
	  ARRAY_TYPE = type;
	}
	var degree = Math.PI / 180;
	/**
	 * Convert Degree To Radian
	 *
	 * @param {Number} a Angle in Degrees
	 */

	function toRadian(a) {
	  return a * degree;
	}
	/**
	 * Tests whether or not the arguments have approximately the same value, within an absolute
	 * or relative tolerance of glMatrix.EPSILON (an absolute tolerance is used for values less
	 * than or equal to 1.0, and a relative tolerance is used for larger values)
	 *
	 * @param {Number} a The first number to test.
	 * @param {Number} b The second number to test.
	 * @returns {Boolean} True if the numbers are approximately equal, false otherwise.
	 */

	function equals$9(a, b) {
	  return Math.abs(a - b) <= EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
	}
	if (!Math.hypot) Math.hypot = function () {
	  var y = 0,
	      i = arguments.length;

	  while (i--) {
	    y += arguments[i] * arguments[i];
	  }

	  return Math.sqrt(y);
	};

	var common = /*#__PURE__*/Object.freeze({
		__proto__: null,
		EPSILON: EPSILON,
		get ARRAY_TYPE () { return ARRAY_TYPE; },
		RANDOM: RANDOM,
		setMatrixArrayType: setMatrixArrayType,
		toRadian: toRadian,
		equals: equals$9
	});

	/**
	 * 2x2 Matrix
	 * @module mat2
	 */

	/**
	 * Creates a new identity mat2
	 *
	 * @returns {mat2} a new 2x2 matrix
	 */

	function create$8() {
	  var out = new ARRAY_TYPE(4);

	  if (ARRAY_TYPE != Float32Array) {
	    out[1] = 0;
	    out[2] = 0;
	  }

	  out[0] = 1;
	  out[3] = 1;
	  return out;
	}
	/**
	 * Creates a new mat2 initialized with values from an existing matrix
	 *
	 * @param {ReadonlyMat2} a matrix to clone
	 * @returns {mat2} a new 2x2 matrix
	 */

	function clone$8(a) {
	  var out = new ARRAY_TYPE(4);
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  out[3] = a[3];
	  return out;
	}
	/**
	 * Copy the values from one mat2 to another
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {ReadonlyMat2} a the source matrix
	 * @returns {mat2} out
	 */

	function copy$8(out, a) {
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  out[3] = a[3];
	  return out;
	}
	/**
	 * Set a mat2 to the identity matrix
	 *
	 * @param {mat2} out the receiving matrix
	 * @returns {mat2} out
	 */

	function identity$5(out) {
	  out[0] = 1;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 1;
	  return out;
	}
	/**
	 * Create a new mat2 with the given values
	 *
	 * @param {Number} m00 Component in column 0, row 0 position (index 0)
	 * @param {Number} m01 Component in column 0, row 1 position (index 1)
	 * @param {Number} m10 Component in column 1, row 0 position (index 2)
	 * @param {Number} m11 Component in column 1, row 1 position (index 3)
	 * @returns {mat2} out A new 2x2 matrix
	 */

	function fromValues$8(m00, m01, m10, m11) {
	  var out = new ARRAY_TYPE(4);
	  out[0] = m00;
	  out[1] = m01;
	  out[2] = m10;
	  out[3] = m11;
	  return out;
	}
	/**
	 * Set the components of a mat2 to the given values
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {Number} m00 Component in column 0, row 0 position (index 0)
	 * @param {Number} m01 Component in column 0, row 1 position (index 1)
	 * @param {Number} m10 Component in column 1, row 0 position (index 2)
	 * @param {Number} m11 Component in column 1, row 1 position (index 3)
	 * @returns {mat2} out
	 */

	function set$8(out, m00, m01, m10, m11) {
	  out[0] = m00;
	  out[1] = m01;
	  out[2] = m10;
	  out[3] = m11;
	  return out;
	}
	/**
	 * Transpose the values of a mat2
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {ReadonlyMat2} a the source matrix
	 * @returns {mat2} out
	 */

	function transpose$2(out, a) {
	  // If we are transposing ourselves we can skip a few steps but have to cache
	  // some values
	  if (out === a) {
	    var a1 = a[1];
	    out[1] = a[2];
	    out[2] = a1;
	  } else {
	    out[0] = a[0];
	    out[1] = a[2];
	    out[2] = a[1];
	    out[3] = a[3];
	  }

	  return out;
	}
	/**
	 * Inverts a mat2
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {ReadonlyMat2} a the source matrix
	 * @returns {mat2} out
	 */

	function invert$5(out, a) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2],
	      a3 = a[3]; // Calculate the determinant

	  var det = a0 * a3 - a2 * a1;

	  if (!det) {
	    return null;
	  }

	  det = 1.0 / det;
	  out[0] = a3 * det;
	  out[1] = -a1 * det;
	  out[2] = -a2 * det;
	  out[3] = a0 * det;
	  return out;
	}
	/**
	 * Calculates the adjugate of a mat2
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {ReadonlyMat2} a the source matrix
	 * @returns {mat2} out
	 */

	function adjoint$2(out, a) {
	  // Caching this value is nessecary if out == a
	  var a0 = a[0];
	  out[0] = a[3];
	  out[1] = -a[1];
	  out[2] = -a[2];
	  out[3] = a0;
	  return out;
	}
	/**
	 * Calculates the determinant of a mat2
	 *
	 * @param {ReadonlyMat2} a the source matrix
	 * @returns {Number} determinant of a
	 */

	function determinant$3(a) {
	  return a[0] * a[3] - a[2] * a[1];
	}
	/**
	 * Multiplies two mat2's
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {ReadonlyMat2} a the first operand
	 * @param {ReadonlyMat2} b the second operand
	 * @returns {mat2} out
	 */

	function multiply$8(out, a, b) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2],
	      a3 = a[3];
	  var b0 = b[0],
	      b1 = b[1],
	      b2 = b[2],
	      b3 = b[3];
	  out[0] = a0 * b0 + a2 * b1;
	  out[1] = a1 * b0 + a3 * b1;
	  out[2] = a0 * b2 + a2 * b3;
	  out[3] = a1 * b2 + a3 * b3;
	  return out;
	}
	/**
	 * Rotates a mat2 by the given angle
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {ReadonlyMat2} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat2} out
	 */

	function rotate$4(out, a, rad) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2],
	      a3 = a[3];
	  var s = Math.sin(rad);
	  var c = Math.cos(rad);
	  out[0] = a0 * c + a2 * s;
	  out[1] = a1 * c + a3 * s;
	  out[2] = a0 * -s + a2 * c;
	  out[3] = a1 * -s + a3 * c;
	  return out;
	}
	/**
	 * Scales the mat2 by the dimensions in the given vec2
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {ReadonlyMat2} a the matrix to rotate
	 * @param {ReadonlyVec2} v the vec2 to scale the matrix by
	 * @returns {mat2} out
	 **/

	function scale$8(out, a, v) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2],
	      a3 = a[3];
	  var v0 = v[0],
	      v1 = v[1];
	  out[0] = a0 * v0;
	  out[1] = a1 * v0;
	  out[2] = a2 * v1;
	  out[3] = a3 * v1;
	  return out;
	}
	/**
	 * Creates a matrix from a given angle
	 * This is equivalent to (but much faster than):
	 *
	 *     mat2.identity(dest);
	 *     mat2.rotate(dest, dest, rad);
	 *
	 * @param {mat2} out mat2 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat2} out
	 */

	function fromRotation$4(out, rad) {
	  var s = Math.sin(rad);
	  var c = Math.cos(rad);
	  out[0] = c;
	  out[1] = s;
	  out[2] = -s;
	  out[3] = c;
	  return out;
	}
	/**
	 * Creates a matrix from a vector scaling
	 * This is equivalent to (but much faster than):
	 *
	 *     mat2.identity(dest);
	 *     mat2.scale(dest, dest, vec);
	 *
	 * @param {mat2} out mat2 receiving operation result
	 * @param {ReadonlyVec2} v Scaling vector
	 * @returns {mat2} out
	 */

	function fromScaling$3(out, v) {
	  out[0] = v[0];
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = v[1];
	  return out;
	}
	/**
	 * Returns a string representation of a mat2
	 *
	 * @param {ReadonlyMat2} a matrix to represent as a string
	 * @returns {String} string representation of the matrix
	 */

	function str$8(a) {
	  return "mat2(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
	}
	/**
	 * Returns Frobenius norm of a mat2
	 *
	 * @param {ReadonlyMat2} a the matrix to calculate Frobenius norm of
	 * @returns {Number} Frobenius norm
	 */

	function frob$3(a) {
	  return Math.hypot(a[0], a[1], a[2], a[3]);
	}
	/**
	 * Returns L, D and U matrices (Lower triangular, Diagonal and Upper triangular) by factorizing the input matrix
	 * @param {ReadonlyMat2} L the lower triangular matrix
	 * @param {ReadonlyMat2} D the diagonal matrix
	 * @param {ReadonlyMat2} U the upper triangular matrix
	 * @param {ReadonlyMat2} a the input matrix to factorize
	 */

	function LDU(L, D, U, a) {
	  L[2] = a[2] / a[0];
	  U[0] = a[0];
	  U[1] = a[1];
	  U[3] = a[3] - L[2] * U[1];
	  return [L, D, U];
	}
	/**
	 * Adds two mat2's
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {ReadonlyMat2} a the first operand
	 * @param {ReadonlyMat2} b the second operand
	 * @returns {mat2} out
	 */

	function add$8(out, a, b) {
	  out[0] = a[0] + b[0];
	  out[1] = a[1] + b[1];
	  out[2] = a[2] + b[2];
	  out[3] = a[3] + b[3];
	  return out;
	}
	/**
	 * Subtracts matrix b from matrix a
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {ReadonlyMat2} a the first operand
	 * @param {ReadonlyMat2} b the second operand
	 * @returns {mat2} out
	 */

	function subtract$6(out, a, b) {
	  out[0] = a[0] - b[0];
	  out[1] = a[1] - b[1];
	  out[2] = a[2] - b[2];
	  out[3] = a[3] - b[3];
	  return out;
	}
	/**
	 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
	 *
	 * @param {ReadonlyMat2} a The first matrix.
	 * @param {ReadonlyMat2} b The second matrix.
	 * @returns {Boolean} True if the matrices are equal, false otherwise.
	 */

	function exactEquals$8(a, b) {
	  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
	}
	/**
	 * Returns whether or not the matrices have approximately the same elements in the same position.
	 *
	 * @param {ReadonlyMat2} a The first matrix.
	 * @param {ReadonlyMat2} b The second matrix.
	 * @returns {Boolean} True if the matrices are equal, false otherwise.
	 */

	function equals$8(a, b) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2],
	      a3 = a[3];
	  var b0 = b[0],
	      b1 = b[1],
	      b2 = b[2],
	      b3 = b[3];
	  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
	}
	/**
	 * Multiply each element of the matrix by a scalar.
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {ReadonlyMat2} a the matrix to scale
	 * @param {Number} b amount to scale the matrix's elements by
	 * @returns {mat2} out
	 */

	function multiplyScalar$3(out, a, b) {
	  out[0] = a[0] * b;
	  out[1] = a[1] * b;
	  out[2] = a[2] * b;
	  out[3] = a[3] * b;
	  return out;
	}
	/**
	 * Adds two mat2's after multiplying each element of the second operand by a scalar value.
	 *
	 * @param {mat2} out the receiving vector
	 * @param {ReadonlyMat2} a the first operand
	 * @param {ReadonlyMat2} b the second operand
	 * @param {Number} scale the amount to scale b's elements by before adding
	 * @returns {mat2} out
	 */

	function multiplyScalarAndAdd$3(out, a, b, scale) {
	  out[0] = a[0] + b[0] * scale;
	  out[1] = a[1] + b[1] * scale;
	  out[2] = a[2] + b[2] * scale;
	  out[3] = a[3] + b[3] * scale;
	  return out;
	}
	/**
	 * Alias for {@link mat2.multiply}
	 * @function
	 */

	var mul$8 = multiply$8;
	/**
	 * Alias for {@link mat2.subtract}
	 * @function
	 */

	var sub$6 = subtract$6;

	var mat2 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		create: create$8,
		clone: clone$8,
		copy: copy$8,
		identity: identity$5,
		fromValues: fromValues$8,
		set: set$8,
		transpose: transpose$2,
		invert: invert$5,
		adjoint: adjoint$2,
		determinant: determinant$3,
		multiply: multiply$8,
		rotate: rotate$4,
		scale: scale$8,
		fromRotation: fromRotation$4,
		fromScaling: fromScaling$3,
		str: str$8,
		frob: frob$3,
		LDU: LDU,
		add: add$8,
		subtract: subtract$6,
		exactEquals: exactEquals$8,
		equals: equals$8,
		multiplyScalar: multiplyScalar$3,
		multiplyScalarAndAdd: multiplyScalarAndAdd$3,
		mul: mul$8,
		sub: sub$6
	});

	/**
	 * 2x3 Matrix
	 * @module mat2d
	 * @description
	 * A mat2d contains six elements defined as:
	 * <pre>
	 * [a, b,
	 *  c, d,
	 *  tx, ty]
	 * </pre>
	 * This is a short form for the 3x3 matrix:
	 * <pre>
	 * [a, b, 0,
	 *  c, d, 0,
	 *  tx, ty, 1]
	 * </pre>
	 * The last column is ignored so the array is shorter and operations are faster.
	 */

	/**
	 * Creates a new identity mat2d
	 *
	 * @returns {mat2d} a new 2x3 matrix
	 */

	function create$7() {
	  var out = new ARRAY_TYPE(6);

	  if (ARRAY_TYPE != Float32Array) {
	    out[1] = 0;
	    out[2] = 0;
	    out[4] = 0;
	    out[5] = 0;
	  }

	  out[0] = 1;
	  out[3] = 1;
	  return out;
	}
	/**
	 * Creates a new mat2d initialized with values from an existing matrix
	 *
	 * @param {ReadonlyMat2d} a matrix to clone
	 * @returns {mat2d} a new 2x3 matrix
	 */

	function clone$7(a) {
	  var out = new ARRAY_TYPE(6);
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  out[3] = a[3];
	  out[4] = a[4];
	  out[5] = a[5];
	  return out;
	}
	/**
	 * Copy the values from one mat2d to another
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {ReadonlyMat2d} a the source matrix
	 * @returns {mat2d} out
	 */

	function copy$7(out, a) {
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  out[3] = a[3];
	  out[4] = a[4];
	  out[5] = a[5];
	  return out;
	}
	/**
	 * Set a mat2d to the identity matrix
	 *
	 * @param {mat2d} out the receiving matrix
	 * @returns {mat2d} out
	 */

	function identity$4(out) {
	  out[0] = 1;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 1;
	  out[4] = 0;
	  out[5] = 0;
	  return out;
	}
	/**
	 * Create a new mat2d with the given values
	 *
	 * @param {Number} a Component A (index 0)
	 * @param {Number} b Component B (index 1)
	 * @param {Number} c Component C (index 2)
	 * @param {Number} d Component D (index 3)
	 * @param {Number} tx Component TX (index 4)
	 * @param {Number} ty Component TY (index 5)
	 * @returns {mat2d} A new mat2d
	 */

	function fromValues$7(a, b, c, d, tx, ty) {
	  var out = new ARRAY_TYPE(6);
	  out[0] = a;
	  out[1] = b;
	  out[2] = c;
	  out[3] = d;
	  out[4] = tx;
	  out[5] = ty;
	  return out;
	}
	/**
	 * Set the components of a mat2d to the given values
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {Number} a Component A (index 0)
	 * @param {Number} b Component B (index 1)
	 * @param {Number} c Component C (index 2)
	 * @param {Number} d Component D (index 3)
	 * @param {Number} tx Component TX (index 4)
	 * @param {Number} ty Component TY (index 5)
	 * @returns {mat2d} out
	 */

	function set$7(out, a, b, c, d, tx, ty) {
	  out[0] = a;
	  out[1] = b;
	  out[2] = c;
	  out[3] = d;
	  out[4] = tx;
	  out[5] = ty;
	  return out;
	}
	/**
	 * Inverts a mat2d
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {ReadonlyMat2d} a the source matrix
	 * @returns {mat2d} out
	 */

	function invert$4(out, a) {
	  var aa = a[0],
	      ab = a[1],
	      ac = a[2],
	      ad = a[3];
	  var atx = a[4],
	      aty = a[5];
	  var det = aa * ad - ab * ac;

	  if (!det) {
	    return null;
	  }

	  det = 1.0 / det;
	  out[0] = ad * det;
	  out[1] = -ab * det;
	  out[2] = -ac * det;
	  out[3] = aa * det;
	  out[4] = (ac * aty - ad * atx) * det;
	  out[5] = (ab * atx - aa * aty) * det;
	  return out;
	}
	/**
	 * Calculates the determinant of a mat2d
	 *
	 * @param {ReadonlyMat2d} a the source matrix
	 * @returns {Number} determinant of a
	 */

	function determinant$2(a) {
	  return a[0] * a[3] - a[1] * a[2];
	}
	/**
	 * Multiplies two mat2d's
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {ReadonlyMat2d} a the first operand
	 * @param {ReadonlyMat2d} b the second operand
	 * @returns {mat2d} out
	 */

	function multiply$7(out, a, b) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2],
	      a3 = a[3],
	      a4 = a[4],
	      a5 = a[5];
	  var b0 = b[0],
	      b1 = b[1],
	      b2 = b[2],
	      b3 = b[3],
	      b4 = b[4],
	      b5 = b[5];
	  out[0] = a0 * b0 + a2 * b1;
	  out[1] = a1 * b0 + a3 * b1;
	  out[2] = a0 * b2 + a2 * b3;
	  out[3] = a1 * b2 + a3 * b3;
	  out[4] = a0 * b4 + a2 * b5 + a4;
	  out[5] = a1 * b4 + a3 * b5 + a5;
	  return out;
	}
	/**
	 * Rotates a mat2d by the given angle
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {ReadonlyMat2d} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat2d} out
	 */

	function rotate$3(out, a, rad) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2],
	      a3 = a[3],
	      a4 = a[4],
	      a5 = a[5];
	  var s = Math.sin(rad);
	  var c = Math.cos(rad);
	  out[0] = a0 * c + a2 * s;
	  out[1] = a1 * c + a3 * s;
	  out[2] = a0 * -s + a2 * c;
	  out[3] = a1 * -s + a3 * c;
	  out[4] = a4;
	  out[5] = a5;
	  return out;
	}
	/**
	 * Scales the mat2d by the dimensions in the given vec2
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {ReadonlyMat2d} a the matrix to translate
	 * @param {ReadonlyVec2} v the vec2 to scale the matrix by
	 * @returns {mat2d} out
	 **/

	function scale$7(out, a, v) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2],
	      a3 = a[3],
	      a4 = a[4],
	      a5 = a[5];
	  var v0 = v[0],
	      v1 = v[1];
	  out[0] = a0 * v0;
	  out[1] = a1 * v0;
	  out[2] = a2 * v1;
	  out[3] = a3 * v1;
	  out[4] = a4;
	  out[5] = a5;
	  return out;
	}
	/**
	 * Translates the mat2d by the dimensions in the given vec2
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {ReadonlyMat2d} a the matrix to translate
	 * @param {ReadonlyVec2} v the vec2 to translate the matrix by
	 * @returns {mat2d} out
	 **/

	function translate$3(out, a, v) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2],
	      a3 = a[3],
	      a4 = a[4],
	      a5 = a[5];
	  var v0 = v[0],
	      v1 = v[1];
	  out[0] = a0;
	  out[1] = a1;
	  out[2] = a2;
	  out[3] = a3;
	  out[4] = a0 * v0 + a2 * v1 + a4;
	  out[5] = a1 * v0 + a3 * v1 + a5;
	  return out;
	}
	/**
	 * Creates a matrix from a given angle
	 * This is equivalent to (but much faster than):
	 *
	 *     mat2d.identity(dest);
	 *     mat2d.rotate(dest, dest, rad);
	 *
	 * @param {mat2d} out mat2d receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat2d} out
	 */

	function fromRotation$3(out, rad) {
	  var s = Math.sin(rad),
	      c = Math.cos(rad);
	  out[0] = c;
	  out[1] = s;
	  out[2] = -s;
	  out[3] = c;
	  out[4] = 0;
	  out[5] = 0;
	  return out;
	}
	/**
	 * Creates a matrix from a vector scaling
	 * This is equivalent to (but much faster than):
	 *
	 *     mat2d.identity(dest);
	 *     mat2d.scale(dest, dest, vec);
	 *
	 * @param {mat2d} out mat2d receiving operation result
	 * @param {ReadonlyVec2} v Scaling vector
	 * @returns {mat2d} out
	 */

	function fromScaling$2(out, v) {
	  out[0] = v[0];
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = v[1];
	  out[4] = 0;
	  out[5] = 0;
	  return out;
	}
	/**
	 * Creates a matrix from a vector translation
	 * This is equivalent to (but much faster than):
	 *
	 *     mat2d.identity(dest);
	 *     mat2d.translate(dest, dest, vec);
	 *
	 * @param {mat2d} out mat2d receiving operation result
	 * @param {ReadonlyVec2} v Translation vector
	 * @returns {mat2d} out
	 */

	function fromTranslation$3(out, v) {
	  out[0] = 1;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 1;
	  out[4] = v[0];
	  out[5] = v[1];
	  return out;
	}
	/**
	 * Returns a string representation of a mat2d
	 *
	 * @param {ReadonlyMat2d} a matrix to represent as a string
	 * @returns {String} string representation of the matrix
	 */

	function str$7(a) {
	  return "mat2d(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ")";
	}
	/**
	 * Returns Frobenius norm of a mat2d
	 *
	 * @param {ReadonlyMat2d} a the matrix to calculate Frobenius norm of
	 * @returns {Number} Frobenius norm
	 */

	function frob$2(a) {
	  return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], 1);
	}
	/**
	 * Adds two mat2d's
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {ReadonlyMat2d} a the first operand
	 * @param {ReadonlyMat2d} b the second operand
	 * @returns {mat2d} out
	 */

	function add$7(out, a, b) {
	  out[0] = a[0] + b[0];
	  out[1] = a[1] + b[1];
	  out[2] = a[2] + b[2];
	  out[3] = a[3] + b[3];
	  out[4] = a[4] + b[4];
	  out[5] = a[5] + b[5];
	  return out;
	}
	/**
	 * Subtracts matrix b from matrix a
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {ReadonlyMat2d} a the first operand
	 * @param {ReadonlyMat2d} b the second operand
	 * @returns {mat2d} out
	 */

	function subtract$5(out, a, b) {
	  out[0] = a[0] - b[0];
	  out[1] = a[1] - b[1];
	  out[2] = a[2] - b[2];
	  out[3] = a[3] - b[3];
	  out[4] = a[4] - b[4];
	  out[5] = a[5] - b[5];
	  return out;
	}
	/**
	 * Multiply each element of the matrix by a scalar.
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {ReadonlyMat2d} a the matrix to scale
	 * @param {Number} b amount to scale the matrix's elements by
	 * @returns {mat2d} out
	 */

	function multiplyScalar$2(out, a, b) {
	  out[0] = a[0] * b;
	  out[1] = a[1] * b;
	  out[2] = a[2] * b;
	  out[3] = a[3] * b;
	  out[4] = a[4] * b;
	  out[5] = a[5] * b;
	  return out;
	}
	/**
	 * Adds two mat2d's after multiplying each element of the second operand by a scalar value.
	 *
	 * @param {mat2d} out the receiving vector
	 * @param {ReadonlyMat2d} a the first operand
	 * @param {ReadonlyMat2d} b the second operand
	 * @param {Number} scale the amount to scale b's elements by before adding
	 * @returns {mat2d} out
	 */

	function multiplyScalarAndAdd$2(out, a, b, scale) {
	  out[0] = a[0] + b[0] * scale;
	  out[1] = a[1] + b[1] * scale;
	  out[2] = a[2] + b[2] * scale;
	  out[3] = a[3] + b[3] * scale;
	  out[4] = a[4] + b[4] * scale;
	  out[5] = a[5] + b[5] * scale;
	  return out;
	}
	/**
	 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
	 *
	 * @param {ReadonlyMat2d} a The first matrix.
	 * @param {ReadonlyMat2d} b The second matrix.
	 * @returns {Boolean} True if the matrices are equal, false otherwise.
	 */

	function exactEquals$7(a, b) {
	  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5];
	}
	/**
	 * Returns whether or not the matrices have approximately the same elements in the same position.
	 *
	 * @param {ReadonlyMat2d} a The first matrix.
	 * @param {ReadonlyMat2d} b The second matrix.
	 * @returns {Boolean} True if the matrices are equal, false otherwise.
	 */

	function equals$7(a, b) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2],
	      a3 = a[3],
	      a4 = a[4],
	      a5 = a[5];
	  var b0 = b[0],
	      b1 = b[1],
	      b2 = b[2],
	      b3 = b[3],
	      b4 = b[4],
	      b5 = b[5];
	  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5));
	}
	/**
	 * Alias for {@link mat2d.multiply}
	 * @function
	 */

	var mul$7 = multiply$7;
	/**
	 * Alias for {@link mat2d.subtract}
	 * @function
	 */

	var sub$5 = subtract$5;

	var mat2d = /*#__PURE__*/Object.freeze({
		__proto__: null,
		create: create$7,
		clone: clone$7,
		copy: copy$7,
		identity: identity$4,
		fromValues: fromValues$7,
		set: set$7,
		invert: invert$4,
		determinant: determinant$2,
		multiply: multiply$7,
		rotate: rotate$3,
		scale: scale$7,
		translate: translate$3,
		fromRotation: fromRotation$3,
		fromScaling: fromScaling$2,
		fromTranslation: fromTranslation$3,
		str: str$7,
		frob: frob$2,
		add: add$7,
		subtract: subtract$5,
		multiplyScalar: multiplyScalar$2,
		multiplyScalarAndAdd: multiplyScalarAndAdd$2,
		exactEquals: exactEquals$7,
		equals: equals$7,
		mul: mul$7,
		sub: sub$5
	});

	/**
	 * 3x3 Matrix
	 * @module mat3
	 */

	/**
	 * Creates a new identity mat3
	 *
	 * @returns {mat3} a new 3x3 matrix
	 */

	function create$6() {
	  var out = new ARRAY_TYPE(9);

	  if (ARRAY_TYPE != Float32Array) {
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[5] = 0;
	    out[6] = 0;
	    out[7] = 0;
	  }

	  out[0] = 1;
	  out[4] = 1;
	  out[8] = 1;
	  return out;
	}
	/**
	 * Copies the upper-left 3x3 values into the given mat3.
	 *
	 * @param {mat3} out the receiving 3x3 matrix
	 * @param {ReadonlyMat4} a   the source 4x4 matrix
	 * @returns {mat3} out
	 */

	function fromMat4$1(out, a) {
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  out[3] = a[4];
	  out[4] = a[5];
	  out[5] = a[6];
	  out[6] = a[8];
	  out[7] = a[9];
	  out[8] = a[10];
	  return out;
	}
	/**
	 * Creates a new mat3 initialized with values from an existing matrix
	 *
	 * @param {ReadonlyMat3} a matrix to clone
	 * @returns {mat3} a new 3x3 matrix
	 */

	function clone$6(a) {
	  var out = new ARRAY_TYPE(9);
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  out[3] = a[3];
	  out[4] = a[4];
	  out[5] = a[5];
	  out[6] = a[6];
	  out[7] = a[7];
	  out[8] = a[8];
	  return out;
	}
	/**
	 * Copy the values from one mat3 to another
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat3} a the source matrix
	 * @returns {mat3} out
	 */

	function copy$6(out, a) {
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  out[3] = a[3];
	  out[4] = a[4];
	  out[5] = a[5];
	  out[6] = a[6];
	  out[7] = a[7];
	  out[8] = a[8];
	  return out;
	}
	/**
	 * Create a new mat3 with the given values
	 *
	 * @param {Number} m00 Component in column 0, row 0 position (index 0)
	 * @param {Number} m01 Component in column 0, row 1 position (index 1)
	 * @param {Number} m02 Component in column 0, row 2 position (index 2)
	 * @param {Number} m10 Component in column 1, row 0 position (index 3)
	 * @param {Number} m11 Component in column 1, row 1 position (index 4)
	 * @param {Number} m12 Component in column 1, row 2 position (index 5)
	 * @param {Number} m20 Component in column 2, row 0 position (index 6)
	 * @param {Number} m21 Component in column 2, row 1 position (index 7)
	 * @param {Number} m22 Component in column 2, row 2 position (index 8)
	 * @returns {mat3} A new mat3
	 */

	function fromValues$6(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
	  var out = new ARRAY_TYPE(9);
	  out[0] = m00;
	  out[1] = m01;
	  out[2] = m02;
	  out[3] = m10;
	  out[4] = m11;
	  out[5] = m12;
	  out[6] = m20;
	  out[7] = m21;
	  out[8] = m22;
	  return out;
	}
	/**
	 * Set the components of a mat3 to the given values
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {Number} m00 Component in column 0, row 0 position (index 0)
	 * @param {Number} m01 Component in column 0, row 1 position (index 1)
	 * @param {Number} m02 Component in column 0, row 2 position (index 2)
	 * @param {Number} m10 Component in column 1, row 0 position (index 3)
	 * @param {Number} m11 Component in column 1, row 1 position (index 4)
	 * @param {Number} m12 Component in column 1, row 2 position (index 5)
	 * @param {Number} m20 Component in column 2, row 0 position (index 6)
	 * @param {Number} m21 Component in column 2, row 1 position (index 7)
	 * @param {Number} m22 Component in column 2, row 2 position (index 8)
	 * @returns {mat3} out
	 */

	function set$6(out, m00, m01, m02, m10, m11, m12, m20, m21, m22) {
	  out[0] = m00;
	  out[1] = m01;
	  out[2] = m02;
	  out[3] = m10;
	  out[4] = m11;
	  out[5] = m12;
	  out[6] = m20;
	  out[7] = m21;
	  out[8] = m22;
	  return out;
	}
	/**
	 * Set a mat3 to the identity matrix
	 *
	 * @param {mat3} out the receiving matrix
	 * @returns {mat3} out
	 */

	function identity$3(out) {
	  out[0] = 1;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 0;
	  out[4] = 1;
	  out[5] = 0;
	  out[6] = 0;
	  out[7] = 0;
	  out[8] = 1;
	  return out;
	}
	/**
	 * Transpose the values of a mat3
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat3} a the source matrix
	 * @returns {mat3} out
	 */

	function transpose$1(out, a) {
	  // If we are transposing ourselves we can skip a few steps but have to cache some values
	  if (out === a) {
	    var a01 = a[1],
	        a02 = a[2],
	        a12 = a[5];
	    out[1] = a[3];
	    out[2] = a[6];
	    out[3] = a01;
	    out[5] = a[7];
	    out[6] = a02;
	    out[7] = a12;
	  } else {
	    out[0] = a[0];
	    out[1] = a[3];
	    out[2] = a[6];
	    out[3] = a[1];
	    out[4] = a[4];
	    out[5] = a[7];
	    out[6] = a[2];
	    out[7] = a[5];
	    out[8] = a[8];
	  }

	  return out;
	}
	/**
	 * Inverts a mat3
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat3} a the source matrix
	 * @returns {mat3} out
	 */

	function invert$3(out, a) {
	  var a00 = a[0],
	      a01 = a[1],
	      a02 = a[2];
	  var a10 = a[3],
	      a11 = a[4],
	      a12 = a[5];
	  var a20 = a[6],
	      a21 = a[7],
	      a22 = a[8];
	  var b01 = a22 * a11 - a12 * a21;
	  var b11 = -a22 * a10 + a12 * a20;
	  var b21 = a21 * a10 - a11 * a20; // Calculate the determinant

	  var det = a00 * b01 + a01 * b11 + a02 * b21;

	  if (!det) {
	    return null;
	  }

	  det = 1.0 / det;
	  out[0] = b01 * det;
	  out[1] = (-a22 * a01 + a02 * a21) * det;
	  out[2] = (a12 * a01 - a02 * a11) * det;
	  out[3] = b11 * det;
	  out[4] = (a22 * a00 - a02 * a20) * det;
	  out[5] = (-a12 * a00 + a02 * a10) * det;
	  out[6] = b21 * det;
	  out[7] = (-a21 * a00 + a01 * a20) * det;
	  out[8] = (a11 * a00 - a01 * a10) * det;
	  return out;
	}
	/**
	 * Calculates the adjugate of a mat3
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat3} a the source matrix
	 * @returns {mat3} out
	 */

	function adjoint$1(out, a) {
	  var a00 = a[0],
	      a01 = a[1],
	      a02 = a[2];
	  var a10 = a[3],
	      a11 = a[4],
	      a12 = a[5];
	  var a20 = a[6],
	      a21 = a[7],
	      a22 = a[8];
	  out[0] = a11 * a22 - a12 * a21;
	  out[1] = a02 * a21 - a01 * a22;
	  out[2] = a01 * a12 - a02 * a11;
	  out[3] = a12 * a20 - a10 * a22;
	  out[4] = a00 * a22 - a02 * a20;
	  out[5] = a02 * a10 - a00 * a12;
	  out[6] = a10 * a21 - a11 * a20;
	  out[7] = a01 * a20 - a00 * a21;
	  out[8] = a00 * a11 - a01 * a10;
	  return out;
	}
	/**
	 * Calculates the determinant of a mat3
	 *
	 * @param {ReadonlyMat3} a the source matrix
	 * @returns {Number} determinant of a
	 */

	function determinant$1(a) {
	  var a00 = a[0],
	      a01 = a[1],
	      a02 = a[2];
	  var a10 = a[3],
	      a11 = a[4],
	      a12 = a[5];
	  var a20 = a[6],
	      a21 = a[7],
	      a22 = a[8];
	  return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
	}
	/**
	 * Multiplies two mat3's
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat3} a the first operand
	 * @param {ReadonlyMat3} b the second operand
	 * @returns {mat3} out
	 */

	function multiply$6(out, a, b) {
	  var a00 = a[0],
	      a01 = a[1],
	      a02 = a[2];
	  var a10 = a[3],
	      a11 = a[4],
	      a12 = a[5];
	  var a20 = a[6],
	      a21 = a[7],
	      a22 = a[8];
	  var b00 = b[0],
	      b01 = b[1],
	      b02 = b[2];
	  var b10 = b[3],
	      b11 = b[4],
	      b12 = b[5];
	  var b20 = b[6],
	      b21 = b[7],
	      b22 = b[8];
	  out[0] = b00 * a00 + b01 * a10 + b02 * a20;
	  out[1] = b00 * a01 + b01 * a11 + b02 * a21;
	  out[2] = b00 * a02 + b01 * a12 + b02 * a22;
	  out[3] = b10 * a00 + b11 * a10 + b12 * a20;
	  out[4] = b10 * a01 + b11 * a11 + b12 * a21;
	  out[5] = b10 * a02 + b11 * a12 + b12 * a22;
	  out[6] = b20 * a00 + b21 * a10 + b22 * a20;
	  out[7] = b20 * a01 + b21 * a11 + b22 * a21;
	  out[8] = b20 * a02 + b21 * a12 + b22 * a22;
	  return out;
	}
	/**
	 * Translate a mat3 by the given vector
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat3} a the matrix to translate
	 * @param {ReadonlyVec2} v vector to translate by
	 * @returns {mat3} out
	 */

	function translate$2(out, a, v) {
	  var a00 = a[0],
	      a01 = a[1],
	      a02 = a[2],
	      a10 = a[3],
	      a11 = a[4],
	      a12 = a[5],
	      a20 = a[6],
	      a21 = a[7],
	      a22 = a[8],
	      x = v[0],
	      y = v[1];
	  out[0] = a00;
	  out[1] = a01;
	  out[2] = a02;
	  out[3] = a10;
	  out[4] = a11;
	  out[5] = a12;
	  out[6] = x * a00 + y * a10 + a20;
	  out[7] = x * a01 + y * a11 + a21;
	  out[8] = x * a02 + y * a12 + a22;
	  return out;
	}
	/**
	 * Rotates a mat3 by the given angle
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat3} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat3} out
	 */

	function rotate$2(out, a, rad) {
	  var a00 = a[0],
	      a01 = a[1],
	      a02 = a[2],
	      a10 = a[3],
	      a11 = a[4],
	      a12 = a[5],
	      a20 = a[6],
	      a21 = a[7],
	      a22 = a[8],
	      s = Math.sin(rad),
	      c = Math.cos(rad);
	  out[0] = c * a00 + s * a10;
	  out[1] = c * a01 + s * a11;
	  out[2] = c * a02 + s * a12;
	  out[3] = c * a10 - s * a00;
	  out[4] = c * a11 - s * a01;
	  out[5] = c * a12 - s * a02;
	  out[6] = a20;
	  out[7] = a21;
	  out[8] = a22;
	  return out;
	}
	/**
	 * Scales the mat3 by the dimensions in the given vec2
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat3} a the matrix to rotate
	 * @param {ReadonlyVec2} v the vec2 to scale the matrix by
	 * @returns {mat3} out
	 **/

	function scale$6(out, a, v) {
	  var x = v[0],
	      y = v[1];
	  out[0] = x * a[0];
	  out[1] = x * a[1];
	  out[2] = x * a[2];
	  out[3] = y * a[3];
	  out[4] = y * a[4];
	  out[5] = y * a[5];
	  out[6] = a[6];
	  out[7] = a[7];
	  out[8] = a[8];
	  return out;
	}
	/**
	 * Creates a matrix from a vector translation
	 * This is equivalent to (but much faster than):
	 *
	 *     mat3.identity(dest);
	 *     mat3.translate(dest, dest, vec);
	 *
	 * @param {mat3} out mat3 receiving operation result
	 * @param {ReadonlyVec2} v Translation vector
	 * @returns {mat3} out
	 */

	function fromTranslation$2(out, v) {
	  out[0] = 1;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 0;
	  out[4] = 1;
	  out[5] = 0;
	  out[6] = v[0];
	  out[7] = v[1];
	  out[8] = 1;
	  return out;
	}
	/**
	 * Creates a matrix from a given angle
	 * This is equivalent to (but much faster than):
	 *
	 *     mat3.identity(dest);
	 *     mat3.rotate(dest, dest, rad);
	 *
	 * @param {mat3} out mat3 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat3} out
	 */

	function fromRotation$2(out, rad) {
	  var s = Math.sin(rad),
	      c = Math.cos(rad);
	  out[0] = c;
	  out[1] = s;
	  out[2] = 0;
	  out[3] = -s;
	  out[4] = c;
	  out[5] = 0;
	  out[6] = 0;
	  out[7] = 0;
	  out[8] = 1;
	  return out;
	}
	/**
	 * Creates a matrix from a vector scaling
	 * This is equivalent to (but much faster than):
	 *
	 *     mat3.identity(dest);
	 *     mat3.scale(dest, dest, vec);
	 *
	 * @param {mat3} out mat3 receiving operation result
	 * @param {ReadonlyVec2} v Scaling vector
	 * @returns {mat3} out
	 */

	function fromScaling$1(out, v) {
	  out[0] = v[0];
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 0;
	  out[4] = v[1];
	  out[5] = 0;
	  out[6] = 0;
	  out[7] = 0;
	  out[8] = 1;
	  return out;
	}
	/**
	 * Copies the values from a mat2d into a mat3
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat2d} a the matrix to copy
	 * @returns {mat3} out
	 **/

	function fromMat2d(out, a) {
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = 0;
	  out[3] = a[2];
	  out[4] = a[3];
	  out[5] = 0;
	  out[6] = a[4];
	  out[7] = a[5];
	  out[8] = 1;
	  return out;
	}
	/**
	 * Calculates a 3x3 matrix from the given quaternion
	 *
	 * @param {mat3} out mat3 receiving operation result
	 * @param {ReadonlyQuat} q Quaternion to create matrix from
	 *
	 * @returns {mat3} out
	 */

	function fromQuat$1(out, q) {
	  var x = q[0],
	      y = q[1],
	      z = q[2],
	      w = q[3];
	  var x2 = x + x;
	  var y2 = y + y;
	  var z2 = z + z;
	  var xx = x * x2;
	  var yx = y * x2;
	  var yy = y * y2;
	  var zx = z * x2;
	  var zy = z * y2;
	  var zz = z * z2;
	  var wx = w * x2;
	  var wy = w * y2;
	  var wz = w * z2;
	  out[0] = 1 - yy - zz;
	  out[3] = yx - wz;
	  out[6] = zx + wy;
	  out[1] = yx + wz;
	  out[4] = 1 - xx - zz;
	  out[7] = zy - wx;
	  out[2] = zx - wy;
	  out[5] = zy + wx;
	  out[8] = 1 - xx - yy;
	  return out;
	}
	/**
	 * Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
	 *
	 * @param {mat3} out mat3 receiving operation result
	 * @param {ReadonlyMat4} a Mat4 to derive the normal matrix from
	 *
	 * @returns {mat3} out
	 */

	function normalFromMat4(out, a) {
	  var a00 = a[0],
	      a01 = a[1],
	      a02 = a[2],
	      a03 = a[3];
	  var a10 = a[4],
	      a11 = a[5],
	      a12 = a[6],
	      a13 = a[7];
	  var a20 = a[8],
	      a21 = a[9],
	      a22 = a[10],
	      a23 = a[11];
	  var a30 = a[12],
	      a31 = a[13],
	      a32 = a[14],
	      a33 = a[15];
	  var b00 = a00 * a11 - a01 * a10;
	  var b01 = a00 * a12 - a02 * a10;
	  var b02 = a00 * a13 - a03 * a10;
	  var b03 = a01 * a12 - a02 * a11;
	  var b04 = a01 * a13 - a03 * a11;
	  var b05 = a02 * a13 - a03 * a12;
	  var b06 = a20 * a31 - a21 * a30;
	  var b07 = a20 * a32 - a22 * a30;
	  var b08 = a20 * a33 - a23 * a30;
	  var b09 = a21 * a32 - a22 * a31;
	  var b10 = a21 * a33 - a23 * a31;
	  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

	  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

	  if (!det) {
	    return null;
	  }

	  det = 1.0 / det;
	  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
	  out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
	  out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
	  out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
	  out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
	  out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
	  out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
	  out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
	  out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
	  return out;
	}
	/**
	 * Generates a 2D projection matrix with the given bounds
	 *
	 * @param {mat3} out mat3 frustum matrix will be written into
	 * @param {number} width Width of your gl context
	 * @param {number} height Height of gl context
	 * @returns {mat3} out
	 */

	function projection(out, width, height) {
	  out[0] = 2 / width;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 0;
	  out[4] = -2 / height;
	  out[5] = 0;
	  out[6] = -1;
	  out[7] = 1;
	  out[8] = 1;
	  return out;
	}
	/**
	 * Returns a string representation of a mat3
	 *
	 * @param {ReadonlyMat3} a matrix to represent as a string
	 * @returns {String} string representation of the matrix
	 */

	function str$6(a) {
	  return "mat3(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ")";
	}
	/**
	 * Returns Frobenius norm of a mat3
	 *
	 * @param {ReadonlyMat3} a the matrix to calculate Frobenius norm of
	 * @returns {Number} Frobenius norm
	 */

	function frob$1(a) {
	  return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8]);
	}
	/**
	 * Adds two mat3's
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat3} a the first operand
	 * @param {ReadonlyMat3} b the second operand
	 * @returns {mat3} out
	 */

	function add$6(out, a, b) {
	  out[0] = a[0] + b[0];
	  out[1] = a[1] + b[1];
	  out[2] = a[2] + b[2];
	  out[3] = a[3] + b[3];
	  out[4] = a[4] + b[4];
	  out[5] = a[5] + b[5];
	  out[6] = a[6] + b[6];
	  out[7] = a[7] + b[7];
	  out[8] = a[8] + b[8];
	  return out;
	}
	/**
	 * Subtracts matrix b from matrix a
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat3} a the first operand
	 * @param {ReadonlyMat3} b the second operand
	 * @returns {mat3} out
	 */

	function subtract$4(out, a, b) {
	  out[0] = a[0] - b[0];
	  out[1] = a[1] - b[1];
	  out[2] = a[2] - b[2];
	  out[3] = a[3] - b[3];
	  out[4] = a[4] - b[4];
	  out[5] = a[5] - b[5];
	  out[6] = a[6] - b[6];
	  out[7] = a[7] - b[7];
	  out[8] = a[8] - b[8];
	  return out;
	}
	/**
	 * Multiply each element of the matrix by a scalar.
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {ReadonlyMat3} a the matrix to scale
	 * @param {Number} b amount to scale the matrix's elements by
	 * @returns {mat3} out
	 */

	function multiplyScalar$1(out, a, b) {
	  out[0] = a[0] * b;
	  out[1] = a[1] * b;
	  out[2] = a[2] * b;
	  out[3] = a[3] * b;
	  out[4] = a[4] * b;
	  out[5] = a[5] * b;
	  out[6] = a[6] * b;
	  out[7] = a[7] * b;
	  out[8] = a[8] * b;
	  return out;
	}
	/**
	 * Adds two mat3's after multiplying each element of the second operand by a scalar value.
	 *
	 * @param {mat3} out the receiving vector
	 * @param {ReadonlyMat3} a the first operand
	 * @param {ReadonlyMat3} b the second operand
	 * @param {Number} scale the amount to scale b's elements by before adding
	 * @returns {mat3} out
	 */

	function multiplyScalarAndAdd$1(out, a, b, scale) {
	  out[0] = a[0] + b[0] * scale;
	  out[1] = a[1] + b[1] * scale;
	  out[2] = a[2] + b[2] * scale;
	  out[3] = a[3] + b[3] * scale;
	  out[4] = a[4] + b[4] * scale;
	  out[5] = a[5] + b[5] * scale;
	  out[6] = a[6] + b[6] * scale;
	  out[7] = a[7] + b[7] * scale;
	  out[8] = a[8] + b[8] * scale;
	  return out;
	}
	/**
	 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
	 *
	 * @param {ReadonlyMat3} a The first matrix.
	 * @param {ReadonlyMat3} b The second matrix.
	 * @returns {Boolean} True if the matrices are equal, false otherwise.
	 */

	function exactEquals$6(a, b) {
	  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8];
	}
	/**
	 * Returns whether or not the matrices have approximately the same elements in the same position.
	 *
	 * @param {ReadonlyMat3} a The first matrix.
	 * @param {ReadonlyMat3} b The second matrix.
	 * @returns {Boolean} True if the matrices are equal, false otherwise.
	 */

	function equals$6(a, b) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2],
	      a3 = a[3],
	      a4 = a[4],
	      a5 = a[5],
	      a6 = a[6],
	      a7 = a[7],
	      a8 = a[8];
	  var b0 = b[0],
	      b1 = b[1],
	      b2 = b[2],
	      b3 = b[3],
	      b4 = b[4],
	      b5 = b[5],
	      b6 = b[6],
	      b7 = b[7],
	      b8 = b[8];
	  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8));
	}
	/**
	 * Alias for {@link mat3.multiply}
	 * @function
	 */

	var mul$6 = multiply$6;
	/**
	 * Alias for {@link mat3.subtract}
	 * @function
	 */

	var sub$4 = subtract$4;

	var mat3 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		create: create$6,
		fromMat4: fromMat4$1,
		clone: clone$6,
		copy: copy$6,
		fromValues: fromValues$6,
		set: set$6,
		identity: identity$3,
		transpose: transpose$1,
		invert: invert$3,
		adjoint: adjoint$1,
		determinant: determinant$1,
		multiply: multiply$6,
		translate: translate$2,
		rotate: rotate$2,
		scale: scale$6,
		fromTranslation: fromTranslation$2,
		fromRotation: fromRotation$2,
		fromScaling: fromScaling$1,
		fromMat2d: fromMat2d,
		fromQuat: fromQuat$1,
		normalFromMat4: normalFromMat4,
		projection: projection,
		str: str$6,
		frob: frob$1,
		add: add$6,
		subtract: subtract$4,
		multiplyScalar: multiplyScalar$1,
		multiplyScalarAndAdd: multiplyScalarAndAdd$1,
		exactEquals: exactEquals$6,
		equals: equals$6,
		mul: mul$6,
		sub: sub$4
	});

	/**
	 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
	 * @module mat4
	 */

	/**
	 * Creates a new identity mat4
	 *
	 * @returns {mat4} a new 4x4 matrix
	 */

	function create$5() {
	  var out = new ARRAY_TYPE(16);

	  if (ARRAY_TYPE != Float32Array) {
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	  }

	  out[0] = 1;
	  out[5] = 1;
	  out[10] = 1;
	  out[15] = 1;
	  return out;
	}
	/**
	 * Creates a new mat4 initialized with values from an existing matrix
	 *
	 * @param {ReadonlyMat4} a matrix to clone
	 * @returns {mat4} a new 4x4 matrix
	 */

	function clone$5(a) {
	  var out = new ARRAY_TYPE(16);
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  out[3] = a[3];
	  out[4] = a[4];
	  out[5] = a[5];
	  out[6] = a[6];
	  out[7] = a[7];
	  out[8] = a[8];
	  out[9] = a[9];
	  out[10] = a[10];
	  out[11] = a[11];
	  out[12] = a[12];
	  out[13] = a[13];
	  out[14] = a[14];
	  out[15] = a[15];
	  return out;
	}
	/**
	 * Copy the values from one mat4 to another
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {ReadonlyMat4} a the source matrix
	 * @returns {mat4} out
	 */

	function copy$5(out, a) {
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  out[3] = a[3];
	  out[4] = a[4];
	  out[5] = a[5];
	  out[6] = a[6];
	  out[7] = a[7];
	  out[8] = a[8];
	  out[9] = a[9];
	  out[10] = a[10];
	  out[11] = a[11];
	  out[12] = a[12];
	  out[13] = a[13];
	  out[14] = a[14];
	  out[15] = a[15];
	  return out;
	}
	/**
	 * Create a new mat4 with the given values
	 *
	 * @param {Number} m00 Component in column 0, row 0 position (index 0)
	 * @param {Number} m01 Component in column 0, row 1 position (index 1)
	 * @param {Number} m02 Component in column 0, row 2 position (index 2)
	 * @param {Number} m03 Component in column 0, row 3 position (index 3)
	 * @param {Number} m10 Component in column 1, row 0 position (index 4)
	 * @param {Number} m11 Component in column 1, row 1 position (index 5)
	 * @param {Number} m12 Component in column 1, row 2 position (index 6)
	 * @param {Number} m13 Component in column 1, row 3 position (index 7)
	 * @param {Number} m20 Component in column 2, row 0 position (index 8)
	 * @param {Number} m21 Component in column 2, row 1 position (index 9)
	 * @param {Number} m22 Component in column 2, row 2 position (index 10)
	 * @param {Number} m23 Component in column 2, row 3 position (index 11)
	 * @param {Number} m30 Component in column 3, row 0 position (index 12)
	 * @param {Number} m31 Component in column 3, row 1 position (index 13)
	 * @param {Number} m32 Component in column 3, row 2 position (index 14)
	 * @param {Number} m33 Component in column 3, row 3 position (index 15)
	 * @returns {mat4} A new mat4
	 */

	function fromValues$5(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
	  var out = new ARRAY_TYPE(16);
	  out[0] = m00;
	  out[1] = m01;
	  out[2] = m02;
	  out[3] = m03;
	  out[4] = m10;
	  out[5] = m11;
	  out[6] = m12;
	  out[7] = m13;
	  out[8] = m20;
	  out[9] = m21;
	  out[10] = m22;
	  out[11] = m23;
	  out[12] = m30;
	  out[13] = m31;
	  out[14] = m32;
	  out[15] = m33;
	  return out;
	}
	/**
	 * Set the components of a mat4 to the given values
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {Number} m00 Component in column 0, row 0 position (index 0)
	 * @param {Number} m01 Component in column 0, row 1 position (index 1)
	 * @param {Number} m02 Component in column 0, row 2 position (index 2)
	 * @param {Number} m03 Component in column 0, row 3 position (index 3)
	 * @param {Number} m10 Component in column 1, row 0 position (index 4)
	 * @param {Number} m11 Component in column 1, row 1 position (index 5)
	 * @param {Number} m12 Component in column 1, row 2 position (index 6)
	 * @param {Number} m13 Component in column 1, row 3 position (index 7)
	 * @param {Number} m20 Component in column 2, row 0 position (index 8)
	 * @param {Number} m21 Component in column 2, row 1 position (index 9)
	 * @param {Number} m22 Component in column 2, row 2 position (index 10)
	 * @param {Number} m23 Component in column 2, row 3 position (index 11)
	 * @param {Number} m30 Component in column 3, row 0 position (index 12)
	 * @param {Number} m31 Component in column 3, row 1 position (index 13)
	 * @param {Number} m32 Component in column 3, row 2 position (index 14)
	 * @param {Number} m33 Component in column 3, row 3 position (index 15)
	 * @returns {mat4} out
	 */

	function set$5(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
	  out[0] = m00;
	  out[1] = m01;
	  out[2] = m02;
	  out[3] = m03;
	  out[4] = m10;
	  out[5] = m11;
	  out[6] = m12;
	  out[7] = m13;
	  out[8] = m20;
	  out[9] = m21;
	  out[10] = m22;
	  out[11] = m23;
	  out[12] = m30;
	  out[13] = m31;
	  out[14] = m32;
	  out[15] = m33;
	  return out;
	}
	/**
	 * Set a mat4 to the identity matrix
	 *
	 * @param {mat4} out the receiving matrix
	 * @returns {mat4} out
	 */

	function identity$2(out) {
	  out[0] = 1;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 0;
	  out[4] = 0;
	  out[5] = 1;
	  out[6] = 0;
	  out[7] = 0;
	  out[8] = 0;
	  out[9] = 0;
	  out[10] = 1;
	  out[11] = 0;
	  out[12] = 0;
	  out[13] = 0;
	  out[14] = 0;
	  out[15] = 1;
	  return out;
	}
	/**
	 * Transpose the values of a mat4
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {ReadonlyMat4} a the source matrix
	 * @returns {mat4} out
	 */

	function transpose(out, a) {
	  // If we are transposing ourselves we can skip a few steps but have to cache some values
	  if (out === a) {
	    var a01 = a[1],
	        a02 = a[2],
	        a03 = a[3];
	    var a12 = a[6],
	        a13 = a[7];
	    var a23 = a[11];
	    out[1] = a[4];
	    out[2] = a[8];
	    out[3] = a[12];
	    out[4] = a01;
	    out[6] = a[9];
	    out[7] = a[13];
	    out[8] = a02;
	    out[9] = a12;
	    out[11] = a[14];
	    out[12] = a03;
	    out[13] = a13;
	    out[14] = a23;
	  } else {
	    out[0] = a[0];
	    out[1] = a[4];
	    out[2] = a[8];
	    out[3] = a[12];
	    out[4] = a[1];
	    out[5] = a[5];
	    out[6] = a[9];
	    out[7] = a[13];
	    out[8] = a[2];
	    out[9] = a[6];
	    out[10] = a[10];
	    out[11] = a[14];
	    out[12] = a[3];
	    out[13] = a[7];
	    out[14] = a[11];
	    out[15] = a[15];
	  }

	  return out;
	}
	/**
	 * Inverts a mat4
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {ReadonlyMat4} a the source matrix
	 * @returns {mat4} out
	 */

	function invert$2(out, a) {
	  var a00 = a[0],
	      a01 = a[1],
	      a02 = a[2],
	      a03 = a[3];
	  var a10 = a[4],
	      a11 = a[5],
	      a12 = a[6],
	      a13 = a[7];
	  var a20 = a[8],
	      a21 = a[9],
	      a22 = a[10],
	      a23 = a[11];
	  var a30 = a[12],
	      a31 = a[13],
	      a32 = a[14],
	      a33 = a[15];
	  var b00 = a00 * a11 - a01 * a10;
	  var b01 = a00 * a12 - a02 * a10;
	  var b02 = a00 * a13 - a03 * a10;
	  var b03 = a01 * a12 - a02 * a11;
	  var b04 = a01 * a13 - a03 * a11;
	  var b05 = a02 * a13 - a03 * a12;
	  var b06 = a20 * a31 - a21 * a30;
	  var b07 = a20 * a32 - a22 * a30;
	  var b08 = a20 * a33 - a23 * a30;
	  var b09 = a21 * a32 - a22 * a31;
	  var b10 = a21 * a33 - a23 * a31;
	  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

	  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

	  if (!det) {
	    return null;
	  }

	  det = 1.0 / det;
	  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
	  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
	  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
	  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
	  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
	  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
	  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
	  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
	  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
	  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
	  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
	  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
	  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
	  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
	  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
	  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
	  return out;
	}
	/**
	 * Calculates the adjugate of a mat4
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {ReadonlyMat4} a the source matrix
	 * @returns {mat4} out
	 */

	function adjoint(out, a) {
	  var a00 = a[0],
	      a01 = a[1],
	      a02 = a[2],
	      a03 = a[3];
	  var a10 = a[4],
	      a11 = a[5],
	      a12 = a[6],
	      a13 = a[7];
	  var a20 = a[8],
	      a21 = a[9],
	      a22 = a[10],
	      a23 = a[11];
	  var a30 = a[12],
	      a31 = a[13],
	      a32 = a[14],
	      a33 = a[15];
	  out[0] = a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22);
	  out[1] = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
	  out[2] = a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12);
	  out[3] = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
	  out[4] = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
	  out[5] = a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22);
	  out[6] = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
	  out[7] = a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12);
	  out[8] = a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21);
	  out[9] = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
	  out[10] = a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11);
	  out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
	  out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
	  out[13] = a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21);
	  out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
	  out[15] = a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11);
	  return out;
	}
	/**
	 * Calculates the determinant of a mat4
	 *
	 * @param {ReadonlyMat4} a the source matrix
	 * @returns {Number} determinant of a
	 */

	function determinant(a) {
	  var a00 = a[0],
	      a01 = a[1],
	      a02 = a[2],
	      a03 = a[3];
	  var a10 = a[4],
	      a11 = a[5],
	      a12 = a[6],
	      a13 = a[7];
	  var a20 = a[8],
	      a21 = a[9],
	      a22 = a[10],
	      a23 = a[11];
	  var a30 = a[12],
	      a31 = a[13],
	      a32 = a[14],
	      a33 = a[15];
	  var b00 = a00 * a11 - a01 * a10;
	  var b01 = a00 * a12 - a02 * a10;
	  var b02 = a00 * a13 - a03 * a10;
	  var b03 = a01 * a12 - a02 * a11;
	  var b04 = a01 * a13 - a03 * a11;
	  var b05 = a02 * a13 - a03 * a12;
	  var b06 = a20 * a31 - a21 * a30;
	  var b07 = a20 * a32 - a22 * a30;
	  var b08 = a20 * a33 - a23 * a30;
	  var b09 = a21 * a32 - a22 * a31;
	  var b10 = a21 * a33 - a23 * a31;
	  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

	  return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
	}
	/**
	 * Multiplies two mat4s
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {ReadonlyMat4} a the first operand
	 * @param {ReadonlyMat4} b the second operand
	 * @returns {mat4} out
	 */

	function multiply$5(out, a, b) {
	  var a00 = a[0],
	      a01 = a[1],
	      a02 = a[2],
	      a03 = a[3];
	  var a10 = a[4],
	      a11 = a[5],
	      a12 = a[6],
	      a13 = a[7];
	  var a20 = a[8],
	      a21 = a[9],
	      a22 = a[10],
	      a23 = a[11];
	  var a30 = a[12],
	      a31 = a[13],
	      a32 = a[14],
	      a33 = a[15]; // Cache only the current line of the second matrix

	  var b0 = b[0],
	      b1 = b[1],
	      b2 = b[2],
	      b3 = b[3];
	  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
	  b0 = b[4];
	  b1 = b[5];
	  b2 = b[6];
	  b3 = b[7];
	  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
	  b0 = b[8];
	  b1 = b[9];
	  b2 = b[10];
	  b3 = b[11];
	  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
	  b0 = b[12];
	  b1 = b[13];
	  b2 = b[14];
	  b3 = b[15];
	  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
	  return out;
	}
	/**
	 * Translate a mat4 by the given vector
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {ReadonlyMat4} a the matrix to translate
	 * @param {ReadonlyVec3} v vector to translate by
	 * @returns {mat4} out
	 */

	function translate$1(out, a, v) {
	  var x = v[0],
	      y = v[1],
	      z = v[2];
	  var a00, a01, a02, a03;
	  var a10, a11, a12, a13;
	  var a20, a21, a22, a23;

	  if (a === out) {
	    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
	    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
	    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
	    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
	  } else {
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
	    out[0] = a00;
	    out[1] = a01;
	    out[2] = a02;
	    out[3] = a03;
	    out[4] = a10;
	    out[5] = a11;
	    out[6] = a12;
	    out[7] = a13;
	    out[8] = a20;
	    out[9] = a21;
	    out[10] = a22;
	    out[11] = a23;
	    out[12] = a00 * x + a10 * y + a20 * z + a[12];
	    out[13] = a01 * x + a11 * y + a21 * z + a[13];
	    out[14] = a02 * x + a12 * y + a22 * z + a[14];
	    out[15] = a03 * x + a13 * y + a23 * z + a[15];
	  }

	  return out;
	}
	/**
	 * Scales the mat4 by the dimensions in the given vec3 not using vectorization
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {ReadonlyMat4} a the matrix to scale
	 * @param {ReadonlyVec3} v the vec3 to scale the matrix by
	 * @returns {mat4} out
	 **/

	function scale$5(out, a, v) {
	  var x = v[0],
	      y = v[1],
	      z = v[2];
	  out[0] = a[0] * x;
	  out[1] = a[1] * x;
	  out[2] = a[2] * x;
	  out[3] = a[3] * x;
	  out[4] = a[4] * y;
	  out[5] = a[5] * y;
	  out[6] = a[6] * y;
	  out[7] = a[7] * y;
	  out[8] = a[8] * z;
	  out[9] = a[9] * z;
	  out[10] = a[10] * z;
	  out[11] = a[11] * z;
	  out[12] = a[12];
	  out[13] = a[13];
	  out[14] = a[14];
	  out[15] = a[15];
	  return out;
	}
	/**
	 * Rotates a mat4 by the given angle around the given axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {ReadonlyMat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @param {ReadonlyVec3} axis the axis to rotate around
	 * @returns {mat4} out
	 */

	function rotate$1(out, a, rad, axis) {
	  var x = axis[0],
	      y = axis[1],
	      z = axis[2];
	  var len = Math.hypot(x, y, z);
	  var s, c, t;
	  var a00, a01, a02, a03;
	  var a10, a11, a12, a13;
	  var a20, a21, a22, a23;
	  var b00, b01, b02;
	  var b10, b11, b12;
	  var b20, b21, b22;

	  if (len < EPSILON) {
	    return null;
	  }

	  len = 1 / len;
	  x *= len;
	  y *= len;
	  z *= len;
	  s = Math.sin(rad);
	  c = Math.cos(rad);
	  t = 1 - c;
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
	  a23 = a[11]; // Construct the elements of the rotation matrix

	  b00 = x * x * t + c;
	  b01 = y * x * t + z * s;
	  b02 = z * x * t - y * s;
	  b10 = x * y * t - z * s;
	  b11 = y * y * t + c;
	  b12 = z * y * t + x * s;
	  b20 = x * z * t + y * s;
	  b21 = y * z * t - x * s;
	  b22 = z * z * t + c; // Perform rotation-specific matrix multiplication

	  out[0] = a00 * b00 + a10 * b01 + a20 * b02;
	  out[1] = a01 * b00 + a11 * b01 + a21 * b02;
	  out[2] = a02 * b00 + a12 * b01 + a22 * b02;
	  out[3] = a03 * b00 + a13 * b01 + a23 * b02;
	  out[4] = a00 * b10 + a10 * b11 + a20 * b12;
	  out[5] = a01 * b10 + a11 * b11 + a21 * b12;
	  out[6] = a02 * b10 + a12 * b11 + a22 * b12;
	  out[7] = a03 * b10 + a13 * b11 + a23 * b12;
	  out[8] = a00 * b20 + a10 * b21 + a20 * b22;
	  out[9] = a01 * b20 + a11 * b21 + a21 * b22;
	  out[10] = a02 * b20 + a12 * b21 + a22 * b22;
	  out[11] = a03 * b20 + a13 * b21 + a23 * b22;

	  if (a !== out) {
	    // If the source and destination differ, copy the unchanged last row
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	  }

	  return out;
	}
	/**
	 * Rotates a matrix by the given angle around the X axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {ReadonlyMat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */

	function rotateX$3(out, a, rad) {
	  var s = Math.sin(rad);
	  var c = Math.cos(rad);
	  var a10 = a[4];
	  var a11 = a[5];
	  var a12 = a[6];
	  var a13 = a[7];
	  var a20 = a[8];
	  var a21 = a[9];
	  var a22 = a[10];
	  var a23 = a[11];

	  if (a !== out) {
	    // If the source and destination differ, copy the unchanged rows
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	  } // Perform axis-specific matrix multiplication


	  out[4] = a10 * c + a20 * s;
	  out[5] = a11 * c + a21 * s;
	  out[6] = a12 * c + a22 * s;
	  out[7] = a13 * c + a23 * s;
	  out[8] = a20 * c - a10 * s;
	  out[9] = a21 * c - a11 * s;
	  out[10] = a22 * c - a12 * s;
	  out[11] = a23 * c - a13 * s;
	  return out;
	}
	/**
	 * Rotates a matrix by the given angle around the Y axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {ReadonlyMat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */

	function rotateY$3(out, a, rad) {
	  var s = Math.sin(rad);
	  var c = Math.cos(rad);
	  var a00 = a[0];
	  var a01 = a[1];
	  var a02 = a[2];
	  var a03 = a[3];
	  var a20 = a[8];
	  var a21 = a[9];
	  var a22 = a[10];
	  var a23 = a[11];

	  if (a !== out) {
	    // If the source and destination differ, copy the unchanged rows
	    out[4] = a[4];
	    out[5] = a[5];
	    out[6] = a[6];
	    out[7] = a[7];
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	  } // Perform axis-specific matrix multiplication


	  out[0] = a00 * c - a20 * s;
	  out[1] = a01 * c - a21 * s;
	  out[2] = a02 * c - a22 * s;
	  out[3] = a03 * c - a23 * s;
	  out[8] = a00 * s + a20 * c;
	  out[9] = a01 * s + a21 * c;
	  out[10] = a02 * s + a22 * c;
	  out[11] = a03 * s + a23 * c;
	  return out;
	}
	/**
	 * Rotates a matrix by the given angle around the Z axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {ReadonlyMat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */

	function rotateZ$3(out, a, rad) {
	  var s = Math.sin(rad);
	  var c = Math.cos(rad);
	  var a00 = a[0];
	  var a01 = a[1];
	  var a02 = a[2];
	  var a03 = a[3];
	  var a10 = a[4];
	  var a11 = a[5];
	  var a12 = a[6];
	  var a13 = a[7];

	  if (a !== out) {
	    // If the source and destination differ, copy the unchanged last row
	    out[8] = a[8];
	    out[9] = a[9];
	    out[10] = a[10];
	    out[11] = a[11];
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	  } // Perform axis-specific matrix multiplication


	  out[0] = a00 * c + a10 * s;
	  out[1] = a01 * c + a11 * s;
	  out[2] = a02 * c + a12 * s;
	  out[3] = a03 * c + a13 * s;
	  out[4] = a10 * c - a00 * s;
	  out[5] = a11 * c - a01 * s;
	  out[6] = a12 * c - a02 * s;
	  out[7] = a13 * c - a03 * s;
	  return out;
	}
	/**
	 * Creates a matrix from a vector translation
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.translate(dest, dest, vec);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {ReadonlyVec3} v Translation vector
	 * @returns {mat4} out
	 */

	function fromTranslation$1(out, v) {
	  out[0] = 1;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 0;
	  out[4] = 0;
	  out[5] = 1;
	  out[6] = 0;
	  out[7] = 0;
	  out[8] = 0;
	  out[9] = 0;
	  out[10] = 1;
	  out[11] = 0;
	  out[12] = v[0];
	  out[13] = v[1];
	  out[14] = v[2];
	  out[15] = 1;
	  return out;
	}
	/**
	 * Creates a matrix from a vector scaling
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.scale(dest, dest, vec);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {ReadonlyVec3} v Scaling vector
	 * @returns {mat4} out
	 */

	function fromScaling(out, v) {
	  out[0] = v[0];
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 0;
	  out[4] = 0;
	  out[5] = v[1];
	  out[6] = 0;
	  out[7] = 0;
	  out[8] = 0;
	  out[9] = 0;
	  out[10] = v[2];
	  out[11] = 0;
	  out[12] = 0;
	  out[13] = 0;
	  out[14] = 0;
	  out[15] = 1;
	  return out;
	}
	/**
	 * Creates a matrix from a given angle around a given axis
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.rotate(dest, dest, rad, axis);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @param {ReadonlyVec3} axis the axis to rotate around
	 * @returns {mat4} out
	 */

	function fromRotation$1(out, rad, axis) {
	  var x = axis[0],
	      y = axis[1],
	      z = axis[2];
	  var len = Math.hypot(x, y, z);
	  var s, c, t;

	  if (len < EPSILON) {
	    return null;
	  }

	  len = 1 / len;
	  x *= len;
	  y *= len;
	  z *= len;
	  s = Math.sin(rad);
	  c = Math.cos(rad);
	  t = 1 - c; // Perform rotation-specific matrix multiplication

	  out[0] = x * x * t + c;
	  out[1] = y * x * t + z * s;
	  out[2] = z * x * t - y * s;
	  out[3] = 0;
	  out[4] = x * y * t - z * s;
	  out[5] = y * y * t + c;
	  out[6] = z * y * t + x * s;
	  out[7] = 0;
	  out[8] = x * z * t + y * s;
	  out[9] = y * z * t - x * s;
	  out[10] = z * z * t + c;
	  out[11] = 0;
	  out[12] = 0;
	  out[13] = 0;
	  out[14] = 0;
	  out[15] = 1;
	  return out;
	}
	/**
	 * Creates a matrix from the given angle around the X axis
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.rotateX(dest, dest, rad);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */

	function fromXRotation(out, rad) {
	  var s = Math.sin(rad);
	  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

	  out[0] = 1;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 0;
	  out[4] = 0;
	  out[5] = c;
	  out[6] = s;
	  out[7] = 0;
	  out[8] = 0;
	  out[9] = -s;
	  out[10] = c;
	  out[11] = 0;
	  out[12] = 0;
	  out[13] = 0;
	  out[14] = 0;
	  out[15] = 1;
	  return out;
	}
	/**
	 * Creates a matrix from the given angle around the Y axis
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.rotateY(dest, dest, rad);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */

	function fromYRotation(out, rad) {
	  var s = Math.sin(rad);
	  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

	  out[0] = c;
	  out[1] = 0;
	  out[2] = -s;
	  out[3] = 0;
	  out[4] = 0;
	  out[5] = 1;
	  out[6] = 0;
	  out[7] = 0;
	  out[8] = s;
	  out[9] = 0;
	  out[10] = c;
	  out[11] = 0;
	  out[12] = 0;
	  out[13] = 0;
	  out[14] = 0;
	  out[15] = 1;
	  return out;
	}
	/**
	 * Creates a matrix from the given angle around the Z axis
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.rotateZ(dest, dest, rad);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */

	function fromZRotation(out, rad) {
	  var s = Math.sin(rad);
	  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

	  out[0] = c;
	  out[1] = s;
	  out[2] = 0;
	  out[3] = 0;
	  out[4] = -s;
	  out[5] = c;
	  out[6] = 0;
	  out[7] = 0;
	  out[8] = 0;
	  out[9] = 0;
	  out[10] = 1;
	  out[11] = 0;
	  out[12] = 0;
	  out[13] = 0;
	  out[14] = 0;
	  out[15] = 1;
	  return out;
	}
	/**
	 * Creates a matrix from a quaternion rotation and vector translation
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.translate(dest, vec);
	 *     let quatMat = mat4.create();
	 *     quat4.toMat4(quat, quatMat);
	 *     mat4.multiply(dest, quatMat);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {quat4} q Rotation quaternion
	 * @param {ReadonlyVec3} v Translation vector
	 * @returns {mat4} out
	 */

	function fromRotationTranslation$1(out, q, v) {
	  // Quaternion math
	  var x = q[0],
	      y = q[1],
	      z = q[2],
	      w = q[3];
	  var x2 = x + x;
	  var y2 = y + y;
	  var z2 = z + z;
	  var xx = x * x2;
	  var xy = x * y2;
	  var xz = x * z2;
	  var yy = y * y2;
	  var yz = y * z2;
	  var zz = z * z2;
	  var wx = w * x2;
	  var wy = w * y2;
	  var wz = w * z2;
	  out[0] = 1 - (yy + zz);
	  out[1] = xy + wz;
	  out[2] = xz - wy;
	  out[3] = 0;
	  out[4] = xy - wz;
	  out[5] = 1 - (xx + zz);
	  out[6] = yz + wx;
	  out[7] = 0;
	  out[8] = xz + wy;
	  out[9] = yz - wx;
	  out[10] = 1 - (xx + yy);
	  out[11] = 0;
	  out[12] = v[0];
	  out[13] = v[1];
	  out[14] = v[2];
	  out[15] = 1;
	  return out;
	}
	/**
	 * Creates a new mat4 from a dual quat.
	 *
	 * @param {mat4} out Matrix
	 * @param {ReadonlyQuat2} a Dual Quaternion
	 * @returns {mat4} mat4 receiving operation result
	 */

	function fromQuat2(out, a) {
	  var translation = new ARRAY_TYPE(3);
	  var bx = -a[0],
	      by = -a[1],
	      bz = -a[2],
	      bw = a[3],
	      ax = a[4],
	      ay = a[5],
	      az = a[6],
	      aw = a[7];
	  var magnitude = bx * bx + by * by + bz * bz + bw * bw; //Only scale if it makes sense

	  if (magnitude > 0) {
	    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
	    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
	    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
	  } else {
	    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
	    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
	    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
	  }

	  fromRotationTranslation$1(out, a, translation);
	  return out;
	}
	/**
	 * Returns the translation vector component of a transformation
	 *  matrix. If a matrix is built with fromRotationTranslation,
	 *  the returned vector will be the same as the translation vector
	 *  originally supplied.
	 * @param  {vec3} out Vector to receive translation component
	 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
	 * @return {vec3} out
	 */

	function getTranslation$1(out, mat) {
	  out[0] = mat[12];
	  out[1] = mat[13];
	  out[2] = mat[14];
	  return out;
	}
	/**
	 * Returns the scaling factor component of a transformation
	 *  matrix. If a matrix is built with fromRotationTranslationScale
	 *  with a normalized Quaternion paramter, the returned vector will be
	 *  the same as the scaling vector
	 *  originally supplied.
	 * @param  {vec3} out Vector to receive scaling factor component
	 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
	 * @return {vec3} out
	 */

	function getScaling(out, mat) {
	  var m11 = mat[0];
	  var m12 = mat[1];
	  var m13 = mat[2];
	  var m21 = mat[4];
	  var m22 = mat[5];
	  var m23 = mat[6];
	  var m31 = mat[8];
	  var m32 = mat[9];
	  var m33 = mat[10];
	  out[0] = Math.hypot(m11, m12, m13);
	  out[1] = Math.hypot(m21, m22, m23);
	  out[2] = Math.hypot(m31, m32, m33);
	  return out;
	}
	/**
	 * Returns a quaternion representing the rotational component
	 *  of a transformation matrix. If a matrix is built with
	 *  fromRotationTranslation, the returned quaternion will be the
	 *  same as the quaternion originally supplied.
	 * @param {quat} out Quaternion to receive the rotation component
	 * @param {ReadonlyMat4} mat Matrix to be decomposed (input)
	 * @return {quat} out
	 */

	function getRotation(out, mat) {
	  var scaling = new ARRAY_TYPE(3);
	  getScaling(scaling, mat);
	  var is1 = 1 / scaling[0];
	  var is2 = 1 / scaling[1];
	  var is3 = 1 / scaling[2];
	  var sm11 = mat[0] * is1;
	  var sm12 = mat[1] * is2;
	  var sm13 = mat[2] * is3;
	  var sm21 = mat[4] * is1;
	  var sm22 = mat[5] * is2;
	  var sm23 = mat[6] * is3;
	  var sm31 = mat[8] * is1;
	  var sm32 = mat[9] * is2;
	  var sm33 = mat[10] * is3;
	  var trace = sm11 + sm22 + sm33;
	  var S = 0;

	  if (trace > 0) {
	    S = Math.sqrt(trace + 1.0) * 2;
	    out[3] = 0.25 * S;
	    out[0] = (sm23 - sm32) / S;
	    out[1] = (sm31 - sm13) / S;
	    out[2] = (sm12 - sm21) / S;
	  } else if (sm11 > sm22 && sm11 > sm33) {
	    S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
	    out[3] = (sm23 - sm32) / S;
	    out[0] = 0.25 * S;
	    out[1] = (sm12 + sm21) / S;
	    out[2] = (sm31 + sm13) / S;
	  } else if (sm22 > sm33) {
	    S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
	    out[3] = (sm31 - sm13) / S;
	    out[0] = (sm12 + sm21) / S;
	    out[1] = 0.25 * S;
	    out[2] = (sm23 + sm32) / S;
	  } else {
	    S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
	    out[3] = (sm12 - sm21) / S;
	    out[0] = (sm31 + sm13) / S;
	    out[1] = (sm23 + sm32) / S;
	    out[2] = 0.25 * S;
	  }

	  return out;
	}
	/**
	 * Creates a matrix from a quaternion rotation, vector translation and vector scale
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.translate(dest, vec);
	 *     let quatMat = mat4.create();
	 *     quat4.toMat4(quat, quatMat);
	 *     mat4.multiply(dest, quatMat);
	 *     mat4.scale(dest, scale)
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {quat4} q Rotation quaternion
	 * @param {ReadonlyVec3} v Translation vector
	 * @param {ReadonlyVec3} s Scaling vector
	 * @returns {mat4} out
	 */

	function fromRotationTranslationScale(out, q, v, s) {
	  // Quaternion math
	  var x = q[0],
	      y = q[1],
	      z = q[2],
	      w = q[3];
	  var x2 = x + x;
	  var y2 = y + y;
	  var z2 = z + z;
	  var xx = x * x2;
	  var xy = x * y2;
	  var xz = x * z2;
	  var yy = y * y2;
	  var yz = y * z2;
	  var zz = z * z2;
	  var wx = w * x2;
	  var wy = w * y2;
	  var wz = w * z2;
	  var sx = s[0];
	  var sy = s[1];
	  var sz = s[2];
	  out[0] = (1 - (yy + zz)) * sx;
	  out[1] = (xy + wz) * sx;
	  out[2] = (xz - wy) * sx;
	  out[3] = 0;
	  out[4] = (xy - wz) * sy;
	  out[5] = (1 - (xx + zz)) * sy;
	  out[6] = (yz + wx) * sy;
	  out[7] = 0;
	  out[8] = (xz + wy) * sz;
	  out[9] = (yz - wx) * sz;
	  out[10] = (1 - (xx + yy)) * sz;
	  out[11] = 0;
	  out[12] = v[0];
	  out[13] = v[1];
	  out[14] = v[2];
	  out[15] = 1;
	  return out;
	}
	/**
	 * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.translate(dest, vec);
	 *     mat4.translate(dest, origin);
	 *     let quatMat = mat4.create();
	 *     quat4.toMat4(quat, quatMat);
	 *     mat4.multiply(dest, quatMat);
	 *     mat4.scale(dest, scale)
	 *     mat4.translate(dest, negativeOrigin);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {quat4} q Rotation quaternion
	 * @param {ReadonlyVec3} v Translation vector
	 * @param {ReadonlyVec3} s Scaling vector
	 * @param {ReadonlyVec3} o The origin vector around which to scale and rotate
	 * @returns {mat4} out
	 */

	function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
	  // Quaternion math
	  var x = q[0],
	      y = q[1],
	      z = q[2],
	      w = q[3];
	  var x2 = x + x;
	  var y2 = y + y;
	  var z2 = z + z;
	  var xx = x * x2;
	  var xy = x * y2;
	  var xz = x * z2;
	  var yy = y * y2;
	  var yz = y * z2;
	  var zz = z * z2;
	  var wx = w * x2;
	  var wy = w * y2;
	  var wz = w * z2;
	  var sx = s[0];
	  var sy = s[1];
	  var sz = s[2];
	  var ox = o[0];
	  var oy = o[1];
	  var oz = o[2];
	  var out0 = (1 - (yy + zz)) * sx;
	  var out1 = (xy + wz) * sx;
	  var out2 = (xz - wy) * sx;
	  var out4 = (xy - wz) * sy;
	  var out5 = (1 - (xx + zz)) * sy;
	  var out6 = (yz + wx) * sy;
	  var out8 = (xz + wy) * sz;
	  var out9 = (yz - wx) * sz;
	  var out10 = (1 - (xx + yy)) * sz;
	  out[0] = out0;
	  out[1] = out1;
	  out[2] = out2;
	  out[3] = 0;
	  out[4] = out4;
	  out[5] = out5;
	  out[6] = out6;
	  out[7] = 0;
	  out[8] = out8;
	  out[9] = out9;
	  out[10] = out10;
	  out[11] = 0;
	  out[12] = v[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
	  out[13] = v[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
	  out[14] = v[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
	  out[15] = 1;
	  return out;
	}
	/**
	 * Calculates a 4x4 matrix from the given quaternion
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {ReadonlyQuat} q Quaternion to create matrix from
	 *
	 * @returns {mat4} out
	 */

	function fromQuat(out, q) {
	  var x = q[0],
	      y = q[1],
	      z = q[2],
	      w = q[3];
	  var x2 = x + x;
	  var y2 = y + y;
	  var z2 = z + z;
	  var xx = x * x2;
	  var yx = y * x2;
	  var yy = y * y2;
	  var zx = z * x2;
	  var zy = z * y2;
	  var zz = z * z2;
	  var wx = w * x2;
	  var wy = w * y2;
	  var wz = w * z2;
	  out[0] = 1 - yy - zz;
	  out[1] = yx + wz;
	  out[2] = zx - wy;
	  out[3] = 0;
	  out[4] = yx - wz;
	  out[5] = 1 - xx - zz;
	  out[6] = zy + wx;
	  out[7] = 0;
	  out[8] = zx + wy;
	  out[9] = zy - wx;
	  out[10] = 1 - xx - yy;
	  out[11] = 0;
	  out[12] = 0;
	  out[13] = 0;
	  out[14] = 0;
	  out[15] = 1;
	  return out;
	}
	/**
	 * Generates a frustum matrix with the given bounds
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {Number} left Left bound of the frustum
	 * @param {Number} right Right bound of the frustum
	 * @param {Number} bottom Bottom bound of the frustum
	 * @param {Number} top Top bound of the frustum
	 * @param {Number} near Near bound of the frustum
	 * @param {Number} far Far bound of the frustum
	 * @returns {mat4} out
	 */

	function frustum(out, left, right, bottom, top, near, far) {
	  var rl = 1 / (right - left);
	  var tb = 1 / (top - bottom);
	  var nf = 1 / (near - far);
	  out[0] = near * 2 * rl;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 0;
	  out[4] = 0;
	  out[5] = near * 2 * tb;
	  out[6] = 0;
	  out[7] = 0;
	  out[8] = (right + left) * rl;
	  out[9] = (top + bottom) * tb;
	  out[10] = (far + near) * nf;
	  out[11] = -1;
	  out[12] = 0;
	  out[13] = 0;
	  out[14] = far * near * 2 * nf;
	  out[15] = 0;
	  return out;
	}
	/**
	 * Generates a perspective projection matrix with the given bounds.
	 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
	 * which matches WebGL/OpenGL's clip volume.
	 * Passing null/undefined/no value for far will generate infinite projection matrix.
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {number} fovy Vertical field of view in radians
	 * @param {number} aspect Aspect ratio. typically viewport width/height
	 * @param {number} near Near bound of the frustum
	 * @param {number} far Far bound of the frustum, can be null or Infinity
	 * @returns {mat4} out
	 */

	function perspectiveNO(out, fovy, aspect, near, far) {
	  var f = 1.0 / Math.tan(fovy / 2),
	      nf;
	  out[0] = f / aspect;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 0;
	  out[4] = 0;
	  out[5] = f;
	  out[6] = 0;
	  out[7] = 0;
	  out[8] = 0;
	  out[9] = 0;
	  out[11] = -1;
	  out[12] = 0;
	  out[13] = 0;
	  out[15] = 0;

	  if (far != null && far !== Infinity) {
	    nf = 1 / (near - far);
	    out[10] = (far + near) * nf;
	    out[14] = 2 * far * near * nf;
	  } else {
	    out[10] = -1;
	    out[14] = -2 * near;
	  }

	  return out;
	}
	/**
	 * Alias for {@link mat4.perspectiveNO}
	 * @function
	 */

	var perspective = perspectiveNO;
	/**
	 * Generates a perspective projection matrix suitable for WebGPU with the given bounds.
	 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
	 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
	 * Passing null/undefined/no value for far will generate infinite projection matrix.
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {number} fovy Vertical field of view in radians
	 * @param {number} aspect Aspect ratio. typically viewport width/height
	 * @param {number} near Near bound of the frustum
	 * @param {number} far Far bound of the frustum, can be null or Infinity
	 * @returns {mat4} out
	 */

	function perspectiveZO(out, fovy, aspect, near, far) {
	  var f = 1.0 / Math.tan(fovy / 2),
	      nf;
	  out[0] = f / aspect;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 0;
	  out[4] = 0;
	  out[5] = f;
	  out[6] = 0;
	  out[7] = 0;
	  out[8] = 0;
	  out[9] = 0;
	  out[11] = -1;
	  out[12] = 0;
	  out[13] = 0;
	  out[15] = 0;

	  if (far != null && far !== Infinity) {
	    nf = 1 / (near - far);
	    out[10] = far * nf;
	    out[14] = far * near * nf;
	  } else {
	    out[10] = -1;
	    out[14] = -near;
	  }

	  return out;
	}
	/**
	 * Generates a perspective projection matrix with the given field of view.
	 * This is primarily useful for generating projection matrices to be used
	 * with the still experiemental WebVR API.
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
	 * @param {number} near Near bound of the frustum
	 * @param {number} far Far bound of the frustum
	 * @returns {mat4} out
	 */

	function perspectiveFromFieldOfView(out, fov, near, far) {
	  var upTan = Math.tan(fov.upDegrees * Math.PI / 180.0);
	  var downTan = Math.tan(fov.downDegrees * Math.PI / 180.0);
	  var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0);
	  var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0);
	  var xScale = 2.0 / (leftTan + rightTan);
	  var yScale = 2.0 / (upTan + downTan);
	  out[0] = xScale;
	  out[1] = 0.0;
	  out[2] = 0.0;
	  out[3] = 0.0;
	  out[4] = 0.0;
	  out[5] = yScale;
	  out[6] = 0.0;
	  out[7] = 0.0;
	  out[8] = -((leftTan - rightTan) * xScale * 0.5);
	  out[9] = (upTan - downTan) * yScale * 0.5;
	  out[10] = far / (near - far);
	  out[11] = -1.0;
	  out[12] = 0.0;
	  out[13] = 0.0;
	  out[14] = far * near / (near - far);
	  out[15] = 0.0;
	  return out;
	}
	/**
	 * Generates a orthogonal projection matrix with the given bounds.
	 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
	 * which matches WebGL/OpenGL's clip volume.
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {number} left Left bound of the frustum
	 * @param {number} right Right bound of the frustum
	 * @param {number} bottom Bottom bound of the frustum
	 * @param {number} top Top bound of the frustum
	 * @param {number} near Near bound of the frustum
	 * @param {number} far Far bound of the frustum
	 * @returns {mat4} out
	 */

	function orthoNO(out, left, right, bottom, top, near, far) {
	  var lr = 1 / (left - right);
	  var bt = 1 / (bottom - top);
	  var nf = 1 / (near - far);
	  out[0] = -2 * lr;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 0;
	  out[4] = 0;
	  out[5] = -2 * bt;
	  out[6] = 0;
	  out[7] = 0;
	  out[8] = 0;
	  out[9] = 0;
	  out[10] = 2 * nf;
	  out[11] = 0;
	  out[12] = (left + right) * lr;
	  out[13] = (top + bottom) * bt;
	  out[14] = (far + near) * nf;
	  out[15] = 1;
	  return out;
	}
	/**
	 * Alias for {@link mat4.orthoNO}
	 * @function
	 */

	var ortho = orthoNO;
	/**
	 * Generates a orthogonal projection matrix with the given bounds.
	 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
	 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {number} left Left bound of the frustum
	 * @param {number} right Right bound of the frustum
	 * @param {number} bottom Bottom bound of the frustum
	 * @param {number} top Top bound of the frustum
	 * @param {number} near Near bound of the frustum
	 * @param {number} far Far bound of the frustum
	 * @returns {mat4} out
	 */

	function orthoZO(out, left, right, bottom, top, near, far) {
	  var lr = 1 / (left - right);
	  var bt = 1 / (bottom - top);
	  var nf = 1 / (near - far);
	  out[0] = -2 * lr;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 0;
	  out[4] = 0;
	  out[5] = -2 * bt;
	  out[6] = 0;
	  out[7] = 0;
	  out[8] = 0;
	  out[9] = 0;
	  out[10] = nf;
	  out[11] = 0;
	  out[12] = (left + right) * lr;
	  out[13] = (top + bottom) * bt;
	  out[14] = near * nf;
	  out[15] = 1;
	  return out;
	}
	/**
	 * Generates a look-at matrix with the given eye position, focal point, and up axis.
	 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {ReadonlyVec3} eye Position of the viewer
	 * @param {ReadonlyVec3} center Point the viewer is looking at
	 * @param {ReadonlyVec3} up vec3 pointing up
	 * @returns {mat4} out
	 */

	function lookAt(out, eye, center, up) {
	  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
	  var eyex = eye[0];
	  var eyey = eye[1];
	  var eyez = eye[2];
	  var upx = up[0];
	  var upy = up[1];
	  var upz = up[2];
	  var centerx = center[0];
	  var centery = center[1];
	  var centerz = center[2];

	  if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
	    return identity$2(out);
	  }

	  z0 = eyex - centerx;
	  z1 = eyey - centery;
	  z2 = eyez - centerz;
	  len = 1 / Math.hypot(z0, z1, z2);
	  z0 *= len;
	  z1 *= len;
	  z2 *= len;
	  x0 = upy * z2 - upz * z1;
	  x1 = upz * z0 - upx * z2;
	  x2 = upx * z1 - upy * z0;
	  len = Math.hypot(x0, x1, x2);

	  if (!len) {
	    x0 = 0;
	    x1 = 0;
	    x2 = 0;
	  } else {
	    len = 1 / len;
	    x0 *= len;
	    x1 *= len;
	    x2 *= len;
	  }

	  y0 = z1 * x2 - z2 * x1;
	  y1 = z2 * x0 - z0 * x2;
	  y2 = z0 * x1 - z1 * x0;
	  len = Math.hypot(y0, y1, y2);

	  if (!len) {
	    y0 = 0;
	    y1 = 0;
	    y2 = 0;
	  } else {
	    len = 1 / len;
	    y0 *= len;
	    y1 *= len;
	    y2 *= len;
	  }

	  out[0] = x0;
	  out[1] = y0;
	  out[2] = z0;
	  out[3] = 0;
	  out[4] = x1;
	  out[5] = y1;
	  out[6] = z1;
	  out[7] = 0;
	  out[8] = x2;
	  out[9] = y2;
	  out[10] = z2;
	  out[11] = 0;
	  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
	  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
	  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
	  out[15] = 1;
	  return out;
	}
	/**
	 * Generates a matrix that makes something look at something else.
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {ReadonlyVec3} eye Position of the viewer
	 * @param {ReadonlyVec3} center Point the viewer is looking at
	 * @param {ReadonlyVec3} up vec3 pointing up
	 * @returns {mat4} out
	 */

	function targetTo(out, eye, target, up) {
	  var eyex = eye[0],
	      eyey = eye[1],
	      eyez = eye[2],
	      upx = up[0],
	      upy = up[1],
	      upz = up[2];
	  var z0 = eyex - target[0],
	      z1 = eyey - target[1],
	      z2 = eyez - target[2];
	  var len = z0 * z0 + z1 * z1 + z2 * z2;

	  if (len > 0) {
	    len = 1 / Math.sqrt(len);
	    z0 *= len;
	    z1 *= len;
	    z2 *= len;
	  }

	  var x0 = upy * z2 - upz * z1,
	      x1 = upz * z0 - upx * z2,
	      x2 = upx * z1 - upy * z0;
	  len = x0 * x0 + x1 * x1 + x2 * x2;

	  if (len > 0) {
	    len = 1 / Math.sqrt(len);
	    x0 *= len;
	    x1 *= len;
	    x2 *= len;
	  }

	  out[0] = x0;
	  out[1] = x1;
	  out[2] = x2;
	  out[3] = 0;
	  out[4] = z1 * x2 - z2 * x1;
	  out[5] = z2 * x0 - z0 * x2;
	  out[6] = z0 * x1 - z1 * x0;
	  out[7] = 0;
	  out[8] = z0;
	  out[9] = z1;
	  out[10] = z2;
	  out[11] = 0;
	  out[12] = eyex;
	  out[13] = eyey;
	  out[14] = eyez;
	  out[15] = 1;
	  return out;
	}
	/**
	 * Returns a string representation of a mat4
	 *
	 * @param {ReadonlyMat4} a matrix to represent as a string
	 * @returns {String} string representation of the matrix
	 */

	function str$5(a) {
	  return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
	}
	/**
	 * Returns Frobenius norm of a mat4
	 *
	 * @param {ReadonlyMat4} a the matrix to calculate Frobenius norm of
	 * @returns {Number} Frobenius norm
	 */

	function frob(a) {
	  return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15]);
	}
	/**
	 * Adds two mat4's
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {ReadonlyMat4} a the first operand
	 * @param {ReadonlyMat4} b the second operand
	 * @returns {mat4} out
	 */

	function add$5(out, a, b) {
	  out[0] = a[0] + b[0];
	  out[1] = a[1] + b[1];
	  out[2] = a[2] + b[2];
	  out[3] = a[3] + b[3];
	  out[4] = a[4] + b[4];
	  out[5] = a[5] + b[5];
	  out[6] = a[6] + b[6];
	  out[7] = a[7] + b[7];
	  out[8] = a[8] + b[8];
	  out[9] = a[9] + b[9];
	  out[10] = a[10] + b[10];
	  out[11] = a[11] + b[11];
	  out[12] = a[12] + b[12];
	  out[13] = a[13] + b[13];
	  out[14] = a[14] + b[14];
	  out[15] = a[15] + b[15];
	  return out;
	}
	/**
	 * Subtracts matrix b from matrix a
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {ReadonlyMat4} a the first operand
	 * @param {ReadonlyMat4} b the second operand
	 * @returns {mat4} out
	 */

	function subtract$3(out, a, b) {
	  out[0] = a[0] - b[0];
	  out[1] = a[1] - b[1];
	  out[2] = a[2] - b[2];
	  out[3] = a[3] - b[3];
	  out[4] = a[4] - b[4];
	  out[5] = a[5] - b[5];
	  out[6] = a[6] - b[6];
	  out[7] = a[7] - b[7];
	  out[8] = a[8] - b[8];
	  out[9] = a[9] - b[9];
	  out[10] = a[10] - b[10];
	  out[11] = a[11] - b[11];
	  out[12] = a[12] - b[12];
	  out[13] = a[13] - b[13];
	  out[14] = a[14] - b[14];
	  out[15] = a[15] - b[15];
	  return out;
	}
	/**
	 * Multiply each element of the matrix by a scalar.
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {ReadonlyMat4} a the matrix to scale
	 * @param {Number} b amount to scale the matrix's elements by
	 * @returns {mat4} out
	 */

	function multiplyScalar(out, a, b) {
	  out[0] = a[0] * b;
	  out[1] = a[1] * b;
	  out[2] = a[2] * b;
	  out[3] = a[3] * b;
	  out[4] = a[4] * b;
	  out[5] = a[5] * b;
	  out[6] = a[6] * b;
	  out[7] = a[7] * b;
	  out[8] = a[8] * b;
	  out[9] = a[9] * b;
	  out[10] = a[10] * b;
	  out[11] = a[11] * b;
	  out[12] = a[12] * b;
	  out[13] = a[13] * b;
	  out[14] = a[14] * b;
	  out[15] = a[15] * b;
	  return out;
	}
	/**
	 * Adds two mat4's after multiplying each element of the second operand by a scalar value.
	 *
	 * @param {mat4} out the receiving vector
	 * @param {ReadonlyMat4} a the first operand
	 * @param {ReadonlyMat4} b the second operand
	 * @param {Number} scale the amount to scale b's elements by before adding
	 * @returns {mat4} out
	 */

	function multiplyScalarAndAdd(out, a, b, scale) {
	  out[0] = a[0] + b[0] * scale;
	  out[1] = a[1] + b[1] * scale;
	  out[2] = a[2] + b[2] * scale;
	  out[3] = a[3] + b[3] * scale;
	  out[4] = a[4] + b[4] * scale;
	  out[5] = a[5] + b[5] * scale;
	  out[6] = a[6] + b[6] * scale;
	  out[7] = a[7] + b[7] * scale;
	  out[8] = a[8] + b[8] * scale;
	  out[9] = a[9] + b[9] * scale;
	  out[10] = a[10] + b[10] * scale;
	  out[11] = a[11] + b[11] * scale;
	  out[12] = a[12] + b[12] * scale;
	  out[13] = a[13] + b[13] * scale;
	  out[14] = a[14] + b[14] * scale;
	  out[15] = a[15] + b[15] * scale;
	  return out;
	}
	/**
	 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
	 *
	 * @param {ReadonlyMat4} a The first matrix.
	 * @param {ReadonlyMat4} b The second matrix.
	 * @returns {Boolean} True if the matrices are equal, false otherwise.
	 */

	function exactEquals$5(a, b) {
	  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
	}
	/**
	 * Returns whether or not the matrices have approximately the same elements in the same position.
	 *
	 * @param {ReadonlyMat4} a The first matrix.
	 * @param {ReadonlyMat4} b The second matrix.
	 * @returns {Boolean} True if the matrices are equal, false otherwise.
	 */

	function equals$5(a, b) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2],
	      a3 = a[3];
	  var a4 = a[4],
	      a5 = a[5],
	      a6 = a[6],
	      a7 = a[7];
	  var a8 = a[8],
	      a9 = a[9],
	      a10 = a[10],
	      a11 = a[11];
	  var a12 = a[12],
	      a13 = a[13],
	      a14 = a[14],
	      a15 = a[15];
	  var b0 = b[0],
	      b1 = b[1],
	      b2 = b[2],
	      b3 = b[3];
	  var b4 = b[4],
	      b5 = b[5],
	      b6 = b[6],
	      b7 = b[7];
	  var b8 = b[8],
	      b9 = b[9],
	      b10 = b[10],
	      b11 = b[11];
	  var b12 = b[12],
	      b13 = b[13],
	      b14 = b[14],
	      b15 = b[15];
	  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= EPSILON * Math.max(1.0, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= EPSILON * Math.max(1.0, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= EPSILON * Math.max(1.0, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= EPSILON * Math.max(1.0, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= EPSILON * Math.max(1.0, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= EPSILON * Math.max(1.0, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= EPSILON * Math.max(1.0, Math.abs(a15), Math.abs(b15));
	}
	/**
	 * Alias for {@link mat4.multiply}
	 * @function
	 */

	var mul$5 = multiply$5;
	/**
	 * Alias for {@link mat4.subtract}
	 * @function
	 */

	var sub$3 = subtract$3;

	var mat4$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		create: create$5,
		clone: clone$5,
		copy: copy$5,
		fromValues: fromValues$5,
		set: set$5,
		identity: identity$2,
		transpose: transpose,
		invert: invert$2,
		adjoint: adjoint,
		determinant: determinant,
		multiply: multiply$5,
		translate: translate$1,
		scale: scale$5,
		rotate: rotate$1,
		rotateX: rotateX$3,
		rotateY: rotateY$3,
		rotateZ: rotateZ$3,
		fromTranslation: fromTranslation$1,
		fromScaling: fromScaling,
		fromRotation: fromRotation$1,
		fromXRotation: fromXRotation,
		fromYRotation: fromYRotation,
		fromZRotation: fromZRotation,
		fromRotationTranslation: fromRotationTranslation$1,
		fromQuat2: fromQuat2,
		getTranslation: getTranslation$1,
		getScaling: getScaling,
		getRotation: getRotation,
		fromRotationTranslationScale: fromRotationTranslationScale,
		fromRotationTranslationScaleOrigin: fromRotationTranslationScaleOrigin,
		fromQuat: fromQuat,
		frustum: frustum,
		perspectiveNO: perspectiveNO,
		perspective: perspective,
		perspectiveZO: perspectiveZO,
		perspectiveFromFieldOfView: perspectiveFromFieldOfView,
		orthoNO: orthoNO,
		ortho: ortho,
		orthoZO: orthoZO,
		lookAt: lookAt,
		targetTo: targetTo,
		str: str$5,
		frob: frob,
		add: add$5,
		subtract: subtract$3,
		multiplyScalar: multiplyScalar,
		multiplyScalarAndAdd: multiplyScalarAndAdd,
		exactEquals: exactEquals$5,
		equals: equals$5,
		mul: mul$5,
		sub: sub$3
	});

	/**
	 * 3 Dimensional Vector
	 * @module vec3
	 */

	/**
	 * Creates a new, empty vec3
	 *
	 * @returns {vec3} a new 3D vector
	 */

	function create$4() {
	  var out = new ARRAY_TYPE(3);

	  if (ARRAY_TYPE != Float32Array) {
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	  }

	  return out;
	}
	/**
	 * Creates a new vec3 initialized with values from an existing vector
	 *
	 * @param {ReadonlyVec3} a vector to clone
	 * @returns {vec3} a new 3D vector
	 */

	function clone$4(a) {
	  var out = new ARRAY_TYPE(3);
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  return out;
	}
	/**
	 * Calculates the length of a vec3
	 *
	 * @param {ReadonlyVec3} a vector to calculate length of
	 * @returns {Number} length of a
	 */

	function length$4(a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  return Math.hypot(x, y, z);
	}
	/**
	 * Creates a new vec3 initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @returns {vec3} a new 3D vector
	 */

	function fromValues$4(x, y, z) {
	  var out = new ARRAY_TYPE(3);
	  out[0] = x;
	  out[1] = y;
	  out[2] = z;
	  return out;
	}
	/**
	 * Copy the values from one vec3 to another
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a the source vector
	 * @returns {vec3} out
	 */

	function copy$4(out, a) {
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  return out;
	}
	/**
	 * Set the components of a vec3 to the given values
	 *
	 * @param {vec3} out the receiving vector
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @returns {vec3} out
	 */

	function set$4(out, x, y, z) {
	  out[0] = x;
	  out[1] = y;
	  out[2] = z;
	  return out;
	}
	/**
	 * Adds two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a the first operand
	 * @param {ReadonlyVec3} b the second operand
	 * @returns {vec3} out
	 */

	function add$4(out, a, b) {
	  out[0] = a[0] + b[0];
	  out[1] = a[1] + b[1];
	  out[2] = a[2] + b[2];
	  return out;
	}
	/**
	 * Subtracts vector b from vector a
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a the first operand
	 * @param {ReadonlyVec3} b the second operand
	 * @returns {vec3} out
	 */

	function subtract$2(out, a, b) {
	  out[0] = a[0] - b[0];
	  out[1] = a[1] - b[1];
	  out[2] = a[2] - b[2];
	  return out;
	}
	/**
	 * Multiplies two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a the first operand
	 * @param {ReadonlyVec3} b the second operand
	 * @returns {vec3} out
	 */

	function multiply$4(out, a, b) {
	  out[0] = a[0] * b[0];
	  out[1] = a[1] * b[1];
	  out[2] = a[2] * b[2];
	  return out;
	}
	/**
	 * Divides two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a the first operand
	 * @param {ReadonlyVec3} b the second operand
	 * @returns {vec3} out
	 */

	function divide$2(out, a, b) {
	  out[0] = a[0] / b[0];
	  out[1] = a[1] / b[1];
	  out[2] = a[2] / b[2];
	  return out;
	}
	/**
	 * Math.ceil the components of a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a vector to ceil
	 * @returns {vec3} out
	 */

	function ceil$2(out, a) {
	  out[0] = Math.ceil(a[0]);
	  out[1] = Math.ceil(a[1]);
	  out[2] = Math.ceil(a[2]);
	  return out;
	}
	/**
	 * Math.floor the components of a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a vector to floor
	 * @returns {vec3} out
	 */

	function floor$2(out, a) {
	  out[0] = Math.floor(a[0]);
	  out[1] = Math.floor(a[1]);
	  out[2] = Math.floor(a[2]);
	  return out;
	}
	/**
	 * Returns the minimum of two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a the first operand
	 * @param {ReadonlyVec3} b the second operand
	 * @returns {vec3} out
	 */

	function min$2(out, a, b) {
	  out[0] = Math.min(a[0], b[0]);
	  out[1] = Math.min(a[1], b[1]);
	  out[2] = Math.min(a[2], b[2]);
	  return out;
	}
	/**
	 * Returns the maximum of two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a the first operand
	 * @param {ReadonlyVec3} b the second operand
	 * @returns {vec3} out
	 */

	function max$2(out, a, b) {
	  out[0] = Math.max(a[0], b[0]);
	  out[1] = Math.max(a[1], b[1]);
	  out[2] = Math.max(a[2], b[2]);
	  return out;
	}
	/**
	 * Math.round the components of a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a vector to round
	 * @returns {vec3} out
	 */

	function round$2(out, a) {
	  out[0] = Math.round(a[0]);
	  out[1] = Math.round(a[1]);
	  out[2] = Math.round(a[2]);
	  return out;
	}
	/**
	 * Scales a vec3 by a scalar number
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a the vector to scale
	 * @param {Number} b amount to scale the vector by
	 * @returns {vec3} out
	 */

	function scale$4(out, a, b) {
	  out[0] = a[0] * b;
	  out[1] = a[1] * b;
	  out[2] = a[2] * b;
	  return out;
	}
	/**
	 * Adds two vec3's after scaling the second operand by a scalar value
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a the first operand
	 * @param {ReadonlyVec3} b the second operand
	 * @param {Number} scale the amount to scale b by before adding
	 * @returns {vec3} out
	 */

	function scaleAndAdd$2(out, a, b, scale) {
	  out[0] = a[0] + b[0] * scale;
	  out[1] = a[1] + b[1] * scale;
	  out[2] = a[2] + b[2] * scale;
	  return out;
	}
	/**
	 * Calculates the euclidian distance between two vec3's
	 *
	 * @param {ReadonlyVec3} a the first operand
	 * @param {ReadonlyVec3} b the second operand
	 * @returns {Number} distance between a and b
	 */

	function distance$2(a, b) {
	  var x = b[0] - a[0];
	  var y = b[1] - a[1];
	  var z = b[2] - a[2];
	  return Math.hypot(x, y, z);
	}
	/**
	 * Calculates the squared euclidian distance between two vec3's
	 *
	 * @param {ReadonlyVec3} a the first operand
	 * @param {ReadonlyVec3} b the second operand
	 * @returns {Number} squared distance between a and b
	 */

	function squaredDistance$2(a, b) {
	  var x = b[0] - a[0];
	  var y = b[1] - a[1];
	  var z = b[2] - a[2];
	  return x * x + y * y + z * z;
	}
	/**
	 * Calculates the squared length of a vec3
	 *
	 * @param {ReadonlyVec3} a vector to calculate squared length of
	 * @returns {Number} squared length of a
	 */

	function squaredLength$4(a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  return x * x + y * y + z * z;
	}
	/**
	 * Negates the components of a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a vector to negate
	 * @returns {vec3} out
	 */

	function negate$2(out, a) {
	  out[0] = -a[0];
	  out[1] = -a[1];
	  out[2] = -a[2];
	  return out;
	}
	/**
	 * Returns the inverse of the components of a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a vector to invert
	 * @returns {vec3} out
	 */

	function inverse$2(out, a) {
	  out[0] = 1.0 / a[0];
	  out[1] = 1.0 / a[1];
	  out[2] = 1.0 / a[2];
	  return out;
	}
	/**
	 * Normalize a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a vector to normalize
	 * @returns {vec3} out
	 */

	function normalize$4(out, a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  var len = x * x + y * y + z * z;

	  if (len > 0) {
	    //TODO: evaluate use of glm_invsqrt here?
	    len = 1 / Math.sqrt(len);
	  }

	  out[0] = a[0] * len;
	  out[1] = a[1] * len;
	  out[2] = a[2] * len;
	  return out;
	}
	/**
	 * Calculates the dot product of two vec3's
	 *
	 * @param {ReadonlyVec3} a the first operand
	 * @param {ReadonlyVec3} b the second operand
	 * @returns {Number} dot product of a and b
	 */

	function dot$4(a, b) {
	  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	}
	/**
	 * Computes the cross product of two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a the first operand
	 * @param {ReadonlyVec3} b the second operand
	 * @returns {vec3} out
	 */

	function cross$2(out, a, b) {
	  var ax = a[0],
	      ay = a[1],
	      az = a[2];
	  var bx = b[0],
	      by = b[1],
	      bz = b[2];
	  out[0] = ay * bz - az * by;
	  out[1] = az * bx - ax * bz;
	  out[2] = ax * by - ay * bx;
	  return out;
	}
	/**
	 * Performs a linear interpolation between two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a the first operand
	 * @param {ReadonlyVec3} b the second operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {vec3} out
	 */

	function lerp$4(out, a, b, t) {
	  var ax = a[0];
	  var ay = a[1];
	  var az = a[2];
	  out[0] = ax + t * (b[0] - ax);
	  out[1] = ay + t * (b[1] - ay);
	  out[2] = az + t * (b[2] - az);
	  return out;
	}
	/**
	 * Performs a hermite interpolation with two control points
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a the first operand
	 * @param {ReadonlyVec3} b the second operand
	 * @param {ReadonlyVec3} c the third operand
	 * @param {ReadonlyVec3} d the fourth operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {vec3} out
	 */

	function hermite(out, a, b, c, d, t) {
	  var factorTimes2 = t * t;
	  var factor1 = factorTimes2 * (2 * t - 3) + 1;
	  var factor2 = factorTimes2 * (t - 2) + t;
	  var factor3 = factorTimes2 * (t - 1);
	  var factor4 = factorTimes2 * (3 - 2 * t);
	  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
	  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
	  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
	  return out;
	}
	/**
	 * Performs a bezier interpolation with two control points
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a the first operand
	 * @param {ReadonlyVec3} b the second operand
	 * @param {ReadonlyVec3} c the third operand
	 * @param {ReadonlyVec3} d the fourth operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {vec3} out
	 */

	function bezier(out, a, b, c, d, t) {
	  var inverseFactor = 1 - t;
	  var inverseFactorTimesTwo = inverseFactor * inverseFactor;
	  var factorTimes2 = t * t;
	  var factor1 = inverseFactorTimesTwo * inverseFactor;
	  var factor2 = 3 * t * inverseFactorTimesTwo;
	  var factor3 = 3 * factorTimes2 * inverseFactor;
	  var factor4 = factorTimes2 * t;
	  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
	  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
	  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
	  return out;
	}
	/**
	 * Generates a random vector with the given scale
	 *
	 * @param {vec3} out the receiving vector
	 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
	 * @returns {vec3} out
	 */

	function random$3(out, scale) {
	  scale = scale || 1.0;
	  var r = RANDOM() * 2.0 * Math.PI;
	  var z = RANDOM() * 2.0 - 1.0;
	  var zScale = Math.sqrt(1.0 - z * z) * scale;
	  out[0] = Math.cos(r) * zScale;
	  out[1] = Math.sin(r) * zScale;
	  out[2] = z * scale;
	  return out;
	}
	/**
	 * Transforms the vec3 with a mat4.
	 * 4th vector component is implicitly '1'
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a the vector to transform
	 * @param {ReadonlyMat4} m matrix to transform with
	 * @returns {vec3} out
	 */

	function transformMat4$2(out, a, m) {
	  var x = a[0],
	      y = a[1],
	      z = a[2];
	  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
	  w = w || 1.0;
	  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
	  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
	  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
	  return out;
	}
	/**
	 * Transforms the vec3 with a mat3.
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a the vector to transform
	 * @param {ReadonlyMat3} m the 3x3 matrix to transform with
	 * @returns {vec3} out
	 */

	function transformMat3$1(out, a, m) {
	  var x = a[0],
	      y = a[1],
	      z = a[2];
	  out[0] = x * m[0] + y * m[3] + z * m[6];
	  out[1] = x * m[1] + y * m[4] + z * m[7];
	  out[2] = x * m[2] + y * m[5] + z * m[8];
	  return out;
	}
	/**
	 * Transforms the vec3 with a quat
	 * Can also be used for dual quaternions. (Multiply it with the real part)
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec3} a the vector to transform
	 * @param {ReadonlyQuat} q quaternion to transform with
	 * @returns {vec3} out
	 */

	function transformQuat$1(out, a, q) {
	  // benchmarks: https://jsperf.com/quaternion-transform-vec3-implementations-fixed
	  var qx = q[0],
	      qy = q[1],
	      qz = q[2],
	      qw = q[3];
	  var x = a[0],
	      y = a[1],
	      z = a[2]; // var qvec = [qx, qy, qz];
	  // var uv = vec3.cross([], qvec, a);

	  var uvx = qy * z - qz * y,
	      uvy = qz * x - qx * z,
	      uvz = qx * y - qy * x; // var uuv = vec3.cross([], qvec, uv);

	  var uuvx = qy * uvz - qz * uvy,
	      uuvy = qz * uvx - qx * uvz,
	      uuvz = qx * uvy - qy * uvx; // vec3.scale(uv, uv, 2 * w);

	  var w2 = qw * 2;
	  uvx *= w2;
	  uvy *= w2;
	  uvz *= w2; // vec3.scale(uuv, uuv, 2);

	  uuvx *= 2;
	  uuvy *= 2;
	  uuvz *= 2; // return vec3.add(out, a, vec3.add(out, uv, uuv));

	  out[0] = x + uvx + uuvx;
	  out[1] = y + uvy + uuvy;
	  out[2] = z + uvz + uuvz;
	  return out;
	}
	/**
	 * Rotate a 3D vector around the x-axis
	 * @param {vec3} out The receiving vec3
	 * @param {ReadonlyVec3} a The vec3 point to rotate
	 * @param {ReadonlyVec3} b The origin of the rotation
	 * @param {Number} rad The angle of rotation in radians
	 * @returns {vec3} out
	 */

	function rotateX$2(out, a, b, rad) {
	  var p = [],
	      r = []; //Translate point to the origin

	  p[0] = a[0] - b[0];
	  p[1] = a[1] - b[1];
	  p[2] = a[2] - b[2]; //perform rotation

	  r[0] = p[0];
	  r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
	  r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad); //translate to correct position

	  out[0] = r[0] + b[0];
	  out[1] = r[1] + b[1];
	  out[2] = r[2] + b[2];
	  return out;
	}
	/**
	 * Rotate a 3D vector around the y-axis
	 * @param {vec3} out The receiving vec3
	 * @param {ReadonlyVec3} a The vec3 point to rotate
	 * @param {ReadonlyVec3} b The origin of the rotation
	 * @param {Number} rad The angle of rotation in radians
	 * @returns {vec3} out
	 */

	function rotateY$2(out, a, b, rad) {
	  var p = [],
	      r = []; //Translate point to the origin

	  p[0] = a[0] - b[0];
	  p[1] = a[1] - b[1];
	  p[2] = a[2] - b[2]; //perform rotation

	  r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
	  r[1] = p[1];
	  r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad); //translate to correct position

	  out[0] = r[0] + b[0];
	  out[1] = r[1] + b[1];
	  out[2] = r[2] + b[2];
	  return out;
	}
	/**
	 * Rotate a 3D vector around the z-axis
	 * @param {vec3} out The receiving vec3
	 * @param {ReadonlyVec3} a The vec3 point to rotate
	 * @param {ReadonlyVec3} b The origin of the rotation
	 * @param {Number} rad The angle of rotation in radians
	 * @returns {vec3} out
	 */

	function rotateZ$2(out, a, b, rad) {
	  var p = [],
	      r = []; //Translate point to the origin

	  p[0] = a[0] - b[0];
	  p[1] = a[1] - b[1];
	  p[2] = a[2] - b[2]; //perform rotation

	  r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
	  r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
	  r[2] = p[2]; //translate to correct position

	  out[0] = r[0] + b[0];
	  out[1] = r[1] + b[1];
	  out[2] = r[2] + b[2];
	  return out;
	}
	/**
	 * Get the angle between two 3D vectors
	 * @param {ReadonlyVec3} a The first operand
	 * @param {ReadonlyVec3} b The second operand
	 * @returns {Number} The angle in radians
	 */

	function angle$1(a, b) {
	  var ax = a[0],
	      ay = a[1],
	      az = a[2],
	      bx = b[0],
	      by = b[1],
	      bz = b[2],
	      mag1 = Math.sqrt(ax * ax + ay * ay + az * az),
	      mag2 = Math.sqrt(bx * bx + by * by + bz * bz),
	      mag = mag1 * mag2,
	      cosine = mag && dot$4(a, b) / mag;
	  return Math.acos(Math.min(Math.max(cosine, -1), 1));
	}
	/**
	 * Set the components of a vec3 to zero
	 *
	 * @param {vec3} out the receiving vector
	 * @returns {vec3} out
	 */

	function zero$2(out) {
	  out[0] = 0.0;
	  out[1] = 0.0;
	  out[2] = 0.0;
	  return out;
	}
	/**
	 * Returns a string representation of a vector
	 *
	 * @param {ReadonlyVec3} a vector to represent as a string
	 * @returns {String} string representation of the vector
	 */

	function str$4(a) {
	  return "vec3(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
	}
	/**
	 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
	 *
	 * @param {ReadonlyVec3} a The first vector.
	 * @param {ReadonlyVec3} b The second vector.
	 * @returns {Boolean} True if the vectors are equal, false otherwise.
	 */

	function exactEquals$4(a, b) {
	  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
	}
	/**
	 * Returns whether or not the vectors have approximately the same elements in the same position.
	 *
	 * @param {ReadonlyVec3} a The first vector.
	 * @param {ReadonlyVec3} b The second vector.
	 * @returns {Boolean} True if the vectors are equal, false otherwise.
	 */

	function equals$4(a, b) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2];
	  var b0 = b[0],
	      b1 = b[1],
	      b2 = b[2];
	  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2));
	}
	/**
	 * Alias for {@link vec3.subtract}
	 * @function
	 */

	var sub$2 = subtract$2;
	/**
	 * Alias for {@link vec3.multiply}
	 * @function
	 */

	var mul$4 = multiply$4;
	/**
	 * Alias for {@link vec3.divide}
	 * @function
	 */

	var div$2 = divide$2;
	/**
	 * Alias for {@link vec3.distance}
	 * @function
	 */

	var dist$2 = distance$2;
	/**
	 * Alias for {@link vec3.squaredDistance}
	 * @function
	 */

	var sqrDist$2 = squaredDistance$2;
	/**
	 * Alias for {@link vec3.length}
	 * @function
	 */

	var len$4 = length$4;
	/**
	 * Alias for {@link vec3.squaredLength}
	 * @function
	 */

	var sqrLen$4 = squaredLength$4;
	/**
	 * Perform some operation over an array of vec3s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */

	var forEach$2 = function () {
	  var vec = create$4();
	  return function (a, stride, offset, count, fn, arg) {
	    var i, l;

	    if (!stride) {
	      stride = 3;
	    }

	    if (!offset) {
	      offset = 0;
	    }

	    if (count) {
	      l = Math.min(count * stride + offset, a.length);
	    } else {
	      l = a.length;
	    }

	    for (i = offset; i < l; i += stride) {
	      vec[0] = a[i];
	      vec[1] = a[i + 1];
	      vec[2] = a[i + 2];
	      fn(vec, vec, arg);
	      a[i] = vec[0];
	      a[i + 1] = vec[1];
	      a[i + 2] = vec[2];
	    }

	    return a;
	  };
	}();

	var vec3 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		create: create$4,
		clone: clone$4,
		length: length$4,
		fromValues: fromValues$4,
		copy: copy$4,
		set: set$4,
		add: add$4,
		subtract: subtract$2,
		multiply: multiply$4,
		divide: divide$2,
		ceil: ceil$2,
		floor: floor$2,
		min: min$2,
		max: max$2,
		round: round$2,
		scale: scale$4,
		scaleAndAdd: scaleAndAdd$2,
		distance: distance$2,
		squaredDistance: squaredDistance$2,
		squaredLength: squaredLength$4,
		negate: negate$2,
		inverse: inverse$2,
		normalize: normalize$4,
		dot: dot$4,
		cross: cross$2,
		lerp: lerp$4,
		hermite: hermite,
		bezier: bezier,
		random: random$3,
		transformMat4: transformMat4$2,
		transformMat3: transformMat3$1,
		transformQuat: transformQuat$1,
		rotateX: rotateX$2,
		rotateY: rotateY$2,
		rotateZ: rotateZ$2,
		angle: angle$1,
		zero: zero$2,
		str: str$4,
		exactEquals: exactEquals$4,
		equals: equals$4,
		sub: sub$2,
		mul: mul$4,
		div: div$2,
		dist: dist$2,
		sqrDist: sqrDist$2,
		len: len$4,
		sqrLen: sqrLen$4,
		forEach: forEach$2
	});

	/**
	 * 4 Dimensional Vector
	 * @module vec4
	 */

	/**
	 * Creates a new, empty vec4
	 *
	 * @returns {vec4} a new 4D vector
	 */

	function create$3() {
	  var out = new ARRAY_TYPE(4);

	  if (ARRAY_TYPE != Float32Array) {
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	  }

	  return out;
	}
	/**
	 * Creates a new vec4 initialized with values from an existing vector
	 *
	 * @param {ReadonlyVec4} a vector to clone
	 * @returns {vec4} a new 4D vector
	 */

	function clone$3(a) {
	  var out = new ARRAY_TYPE(4);
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  out[3] = a[3];
	  return out;
	}
	/**
	 * Creates a new vec4 initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @param {Number} w W component
	 * @returns {vec4} a new 4D vector
	 */

	function fromValues$3(x, y, z, w) {
	  var out = new ARRAY_TYPE(4);
	  out[0] = x;
	  out[1] = y;
	  out[2] = z;
	  out[3] = w;
	  return out;
	}
	/**
	 * Copy the values from one vec4 to another
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a the source vector
	 * @returns {vec4} out
	 */

	function copy$3(out, a) {
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  out[3] = a[3];
	  return out;
	}
	/**
	 * Set the components of a vec4 to the given values
	 *
	 * @param {vec4} out the receiving vector
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @param {Number} w W component
	 * @returns {vec4} out
	 */

	function set$3(out, x, y, z, w) {
	  out[0] = x;
	  out[1] = y;
	  out[2] = z;
	  out[3] = w;
	  return out;
	}
	/**
	 * Adds two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a the first operand
	 * @param {ReadonlyVec4} b the second operand
	 * @returns {vec4} out
	 */

	function add$3(out, a, b) {
	  out[0] = a[0] + b[0];
	  out[1] = a[1] + b[1];
	  out[2] = a[2] + b[2];
	  out[3] = a[3] + b[3];
	  return out;
	}
	/**
	 * Subtracts vector b from vector a
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a the first operand
	 * @param {ReadonlyVec4} b the second operand
	 * @returns {vec4} out
	 */

	function subtract$1(out, a, b) {
	  out[0] = a[0] - b[0];
	  out[1] = a[1] - b[1];
	  out[2] = a[2] - b[2];
	  out[3] = a[3] - b[3];
	  return out;
	}
	/**
	 * Multiplies two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a the first operand
	 * @param {ReadonlyVec4} b the second operand
	 * @returns {vec4} out
	 */

	function multiply$3(out, a, b) {
	  out[0] = a[0] * b[0];
	  out[1] = a[1] * b[1];
	  out[2] = a[2] * b[2];
	  out[3] = a[3] * b[3];
	  return out;
	}
	/**
	 * Divides two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a the first operand
	 * @param {ReadonlyVec4} b the second operand
	 * @returns {vec4} out
	 */

	function divide$1(out, a, b) {
	  out[0] = a[0] / b[0];
	  out[1] = a[1] / b[1];
	  out[2] = a[2] / b[2];
	  out[3] = a[3] / b[3];
	  return out;
	}
	/**
	 * Math.ceil the components of a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a vector to ceil
	 * @returns {vec4} out
	 */

	function ceil$1(out, a) {
	  out[0] = Math.ceil(a[0]);
	  out[1] = Math.ceil(a[1]);
	  out[2] = Math.ceil(a[2]);
	  out[3] = Math.ceil(a[3]);
	  return out;
	}
	/**
	 * Math.floor the components of a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a vector to floor
	 * @returns {vec4} out
	 */

	function floor$1(out, a) {
	  out[0] = Math.floor(a[0]);
	  out[1] = Math.floor(a[1]);
	  out[2] = Math.floor(a[2]);
	  out[3] = Math.floor(a[3]);
	  return out;
	}
	/**
	 * Returns the minimum of two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a the first operand
	 * @param {ReadonlyVec4} b the second operand
	 * @returns {vec4} out
	 */

	function min$1(out, a, b) {
	  out[0] = Math.min(a[0], b[0]);
	  out[1] = Math.min(a[1], b[1]);
	  out[2] = Math.min(a[2], b[2]);
	  out[3] = Math.min(a[3], b[3]);
	  return out;
	}
	/**
	 * Returns the maximum of two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a the first operand
	 * @param {ReadonlyVec4} b the second operand
	 * @returns {vec4} out
	 */

	function max$1(out, a, b) {
	  out[0] = Math.max(a[0], b[0]);
	  out[1] = Math.max(a[1], b[1]);
	  out[2] = Math.max(a[2], b[2]);
	  out[3] = Math.max(a[3], b[3]);
	  return out;
	}
	/**
	 * Math.round the components of a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a vector to round
	 * @returns {vec4} out
	 */

	function round$1(out, a) {
	  out[0] = Math.round(a[0]);
	  out[1] = Math.round(a[1]);
	  out[2] = Math.round(a[2]);
	  out[3] = Math.round(a[3]);
	  return out;
	}
	/**
	 * Scales a vec4 by a scalar number
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a the vector to scale
	 * @param {Number} b amount to scale the vector by
	 * @returns {vec4} out
	 */

	function scale$3(out, a, b) {
	  out[0] = a[0] * b;
	  out[1] = a[1] * b;
	  out[2] = a[2] * b;
	  out[3] = a[3] * b;
	  return out;
	}
	/**
	 * Adds two vec4's after scaling the second operand by a scalar value
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a the first operand
	 * @param {ReadonlyVec4} b the second operand
	 * @param {Number} scale the amount to scale b by before adding
	 * @returns {vec4} out
	 */

	function scaleAndAdd$1(out, a, b, scale) {
	  out[0] = a[0] + b[0] * scale;
	  out[1] = a[1] + b[1] * scale;
	  out[2] = a[2] + b[2] * scale;
	  out[3] = a[3] + b[3] * scale;
	  return out;
	}
	/**
	 * Calculates the euclidian distance between two vec4's
	 *
	 * @param {ReadonlyVec4} a the first operand
	 * @param {ReadonlyVec4} b the second operand
	 * @returns {Number} distance between a and b
	 */

	function distance$1(a, b) {
	  var x = b[0] - a[0];
	  var y = b[1] - a[1];
	  var z = b[2] - a[2];
	  var w = b[3] - a[3];
	  return Math.hypot(x, y, z, w);
	}
	/**
	 * Calculates the squared euclidian distance between two vec4's
	 *
	 * @param {ReadonlyVec4} a the first operand
	 * @param {ReadonlyVec4} b the second operand
	 * @returns {Number} squared distance between a and b
	 */

	function squaredDistance$1(a, b) {
	  var x = b[0] - a[0];
	  var y = b[1] - a[1];
	  var z = b[2] - a[2];
	  var w = b[3] - a[3];
	  return x * x + y * y + z * z + w * w;
	}
	/**
	 * Calculates the length of a vec4
	 *
	 * @param {ReadonlyVec4} a vector to calculate length of
	 * @returns {Number} length of a
	 */

	function length$3(a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  var w = a[3];
	  return Math.hypot(x, y, z, w);
	}
	/**
	 * Calculates the squared length of a vec4
	 *
	 * @param {ReadonlyVec4} a vector to calculate squared length of
	 * @returns {Number} squared length of a
	 */

	function squaredLength$3(a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  var w = a[3];
	  return x * x + y * y + z * z + w * w;
	}
	/**
	 * Negates the components of a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a vector to negate
	 * @returns {vec4} out
	 */

	function negate$1(out, a) {
	  out[0] = -a[0];
	  out[1] = -a[1];
	  out[2] = -a[2];
	  out[3] = -a[3];
	  return out;
	}
	/**
	 * Returns the inverse of the components of a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a vector to invert
	 * @returns {vec4} out
	 */

	function inverse$1(out, a) {
	  out[0] = 1.0 / a[0];
	  out[1] = 1.0 / a[1];
	  out[2] = 1.0 / a[2];
	  out[3] = 1.0 / a[3];
	  return out;
	}
	/**
	 * Normalize a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a vector to normalize
	 * @returns {vec4} out
	 */

	function normalize$3(out, a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  var w = a[3];
	  var len = x * x + y * y + z * z + w * w;

	  if (len > 0) {
	    len = 1 / Math.sqrt(len);
	  }

	  out[0] = x * len;
	  out[1] = y * len;
	  out[2] = z * len;
	  out[3] = w * len;
	  return out;
	}
	/**
	 * Calculates the dot product of two vec4's
	 *
	 * @param {ReadonlyVec4} a the first operand
	 * @param {ReadonlyVec4} b the second operand
	 * @returns {Number} dot product of a and b
	 */

	function dot$3(a, b) {
	  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
	}
	/**
	 * Returns the cross-product of three vectors in a 4-dimensional space
	 *
	 * @param {ReadonlyVec4} result the receiving vector
	 * @param {ReadonlyVec4} U the first vector
	 * @param {ReadonlyVec4} V the second vector
	 * @param {ReadonlyVec4} W the third vector
	 * @returns {vec4} result
	 */

	function cross$1(out, u, v, w) {
	  var A = v[0] * w[1] - v[1] * w[0],
	      B = v[0] * w[2] - v[2] * w[0],
	      C = v[0] * w[3] - v[3] * w[0],
	      D = v[1] * w[2] - v[2] * w[1],
	      E = v[1] * w[3] - v[3] * w[1],
	      F = v[2] * w[3] - v[3] * w[2];
	  var G = u[0];
	  var H = u[1];
	  var I = u[2];
	  var J = u[3];
	  out[0] = H * F - I * E + J * D;
	  out[1] = -(G * F) + I * C - J * B;
	  out[2] = G * E - H * C + J * A;
	  out[3] = -(G * D) + H * B - I * A;
	  return out;
	}
	/**
	 * Performs a linear interpolation between two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a the first operand
	 * @param {ReadonlyVec4} b the second operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {vec4} out
	 */

	function lerp$3(out, a, b, t) {
	  var ax = a[0];
	  var ay = a[1];
	  var az = a[2];
	  var aw = a[3];
	  out[0] = ax + t * (b[0] - ax);
	  out[1] = ay + t * (b[1] - ay);
	  out[2] = az + t * (b[2] - az);
	  out[3] = aw + t * (b[3] - aw);
	  return out;
	}
	/**
	 * Generates a random vector with the given scale
	 *
	 * @param {vec4} out the receiving vector
	 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
	 * @returns {vec4} out
	 */

	function random$2(out, scale) {
	  scale = scale || 1.0; // Marsaglia, George. Choosing a Point from the Surface of a
	  // Sphere. Ann. Math. Statist. 43 (1972), no. 2, 645--646.
	  // http://projecteuclid.org/euclid.aoms/1177692644;

	  var v1, v2, v3, v4;
	  var s1, s2;

	  do {
	    v1 = RANDOM() * 2 - 1;
	    v2 = RANDOM() * 2 - 1;
	    s1 = v1 * v1 + v2 * v2;
	  } while (s1 >= 1);

	  do {
	    v3 = RANDOM() * 2 - 1;
	    v4 = RANDOM() * 2 - 1;
	    s2 = v3 * v3 + v4 * v4;
	  } while (s2 >= 1);

	  var d = Math.sqrt((1 - s1) / s2);
	  out[0] = scale * v1;
	  out[1] = scale * v2;
	  out[2] = scale * v3 * d;
	  out[3] = scale * v4 * d;
	  return out;
	}
	/**
	 * Transforms the vec4 with a mat4.
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a the vector to transform
	 * @param {ReadonlyMat4} m matrix to transform with
	 * @returns {vec4} out
	 */

	function transformMat4$1(out, a, m) {
	  var x = a[0],
	      y = a[1],
	      z = a[2],
	      w = a[3];
	  out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
	  out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
	  out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
	  out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
	  return out;
	}
	/**
	 * Transforms the vec4 with a quat
	 *
	 * @param {vec4} out the receiving vector
	 * @param {ReadonlyVec4} a the vector to transform
	 * @param {ReadonlyQuat} q quaternion to transform with
	 * @returns {vec4} out
	 */

	function transformQuat(out, a, q) {
	  var x = a[0],
	      y = a[1],
	      z = a[2];
	  var qx = q[0],
	      qy = q[1],
	      qz = q[2],
	      qw = q[3]; // calculate quat * vec

	  var ix = qw * x + qy * z - qz * y;
	  var iy = qw * y + qz * x - qx * z;
	  var iz = qw * z + qx * y - qy * x;
	  var iw = -qx * x - qy * y - qz * z; // calculate result * inverse quat

	  out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
	  out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
	  out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
	  out[3] = a[3];
	  return out;
	}
	/**
	 * Set the components of a vec4 to zero
	 *
	 * @param {vec4} out the receiving vector
	 * @returns {vec4} out
	 */

	function zero$1(out) {
	  out[0] = 0.0;
	  out[1] = 0.0;
	  out[2] = 0.0;
	  out[3] = 0.0;
	  return out;
	}
	/**
	 * Returns a string representation of a vector
	 *
	 * @param {ReadonlyVec4} a vector to represent as a string
	 * @returns {String} string representation of the vector
	 */

	function str$3(a) {
	  return "vec4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
	}
	/**
	 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
	 *
	 * @param {ReadonlyVec4} a The first vector.
	 * @param {ReadonlyVec4} b The second vector.
	 * @returns {Boolean} True if the vectors are equal, false otherwise.
	 */

	function exactEquals$3(a, b) {
	  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
	}
	/**
	 * Returns whether or not the vectors have approximately the same elements in the same position.
	 *
	 * @param {ReadonlyVec4} a The first vector.
	 * @param {ReadonlyVec4} b The second vector.
	 * @returns {Boolean} True if the vectors are equal, false otherwise.
	 */

	function equals$3(a, b) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2],
	      a3 = a[3];
	  var b0 = b[0],
	      b1 = b[1],
	      b2 = b[2],
	      b3 = b[3];
	  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
	}
	/**
	 * Alias for {@link vec4.subtract}
	 * @function
	 */

	var sub$1 = subtract$1;
	/**
	 * Alias for {@link vec4.multiply}
	 * @function
	 */

	var mul$3 = multiply$3;
	/**
	 * Alias for {@link vec4.divide}
	 * @function
	 */

	var div$1 = divide$1;
	/**
	 * Alias for {@link vec4.distance}
	 * @function
	 */

	var dist$1 = distance$1;
	/**
	 * Alias for {@link vec4.squaredDistance}
	 * @function
	 */

	var sqrDist$1 = squaredDistance$1;
	/**
	 * Alias for {@link vec4.length}
	 * @function
	 */

	var len$3 = length$3;
	/**
	 * Alias for {@link vec4.squaredLength}
	 * @function
	 */

	var sqrLen$3 = squaredLength$3;
	/**
	 * Perform some operation over an array of vec4s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */

	var forEach$1 = function () {
	  var vec = create$3();
	  return function (a, stride, offset, count, fn, arg) {
	    var i, l;

	    if (!stride) {
	      stride = 4;
	    }

	    if (!offset) {
	      offset = 0;
	    }

	    if (count) {
	      l = Math.min(count * stride + offset, a.length);
	    } else {
	      l = a.length;
	    }

	    for (i = offset; i < l; i += stride) {
	      vec[0] = a[i];
	      vec[1] = a[i + 1];
	      vec[2] = a[i + 2];
	      vec[3] = a[i + 3];
	      fn(vec, vec, arg);
	      a[i] = vec[0];
	      a[i + 1] = vec[1];
	      a[i + 2] = vec[2];
	      a[i + 3] = vec[3];
	    }

	    return a;
	  };
	}();

	var vec4 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		create: create$3,
		clone: clone$3,
		fromValues: fromValues$3,
		copy: copy$3,
		set: set$3,
		add: add$3,
		subtract: subtract$1,
		multiply: multiply$3,
		divide: divide$1,
		ceil: ceil$1,
		floor: floor$1,
		min: min$1,
		max: max$1,
		round: round$1,
		scale: scale$3,
		scaleAndAdd: scaleAndAdd$1,
		distance: distance$1,
		squaredDistance: squaredDistance$1,
		length: length$3,
		squaredLength: squaredLength$3,
		negate: negate$1,
		inverse: inverse$1,
		normalize: normalize$3,
		dot: dot$3,
		cross: cross$1,
		lerp: lerp$3,
		random: random$2,
		transformMat4: transformMat4$1,
		transformQuat: transformQuat,
		zero: zero$1,
		str: str$3,
		exactEquals: exactEquals$3,
		equals: equals$3,
		sub: sub$1,
		mul: mul$3,
		div: div$1,
		dist: dist$1,
		sqrDist: sqrDist$1,
		len: len$3,
		sqrLen: sqrLen$3,
		forEach: forEach$1
	});

	/**
	 * Quaternion
	 * @module quat
	 */

	/**
	 * Creates a new identity quat
	 *
	 * @returns {quat} a new quaternion
	 */

	function create$2() {
	  var out = new ARRAY_TYPE(4);

	  if (ARRAY_TYPE != Float32Array) {
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	  }

	  out[3] = 1;
	  return out;
	}
	/**
	 * Set a quat to the identity quaternion
	 *
	 * @param {quat} out the receiving quaternion
	 * @returns {quat} out
	 */

	function identity$1(out) {
	  out[0] = 0;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 1;
	  return out;
	}
	/**
	 * Sets a quat from the given angle and rotation axis,
	 * then returns it.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyVec3} axis the axis around which to rotate
	 * @param {Number} rad the angle in radians
	 * @returns {quat} out
	 **/

	function setAxisAngle(out, axis, rad) {
	  rad = rad * 0.5;
	  var s = Math.sin(rad);
	  out[0] = s * axis[0];
	  out[1] = s * axis[1];
	  out[2] = s * axis[2];
	  out[3] = Math.cos(rad);
	  return out;
	}
	/**
	 * Gets the rotation axis and angle for a given
	 *  quaternion. If a quaternion is created with
	 *  setAxisAngle, this method will return the same
	 *  values as providied in the original parameter list
	 *  OR functionally equivalent values.
	 * Example: The quaternion formed by axis [0, 0, 1] and
	 *  angle -90 is the same as the quaternion formed by
	 *  [0, 0, 1] and 270. This method favors the latter.
	 * @param  {vec3} out_axis  Vector receiving the axis of rotation
	 * @param  {ReadonlyQuat} q     Quaternion to be decomposed
	 * @return {Number}     Angle, in radians, of the rotation
	 */

	function getAxisAngle(out_axis, q) {
	  var rad = Math.acos(q[3]) * 2.0;
	  var s = Math.sin(rad / 2.0);

	  if (s > EPSILON) {
	    out_axis[0] = q[0] / s;
	    out_axis[1] = q[1] / s;
	    out_axis[2] = q[2] / s;
	  } else {
	    // If s is zero, return any axis (no rotation - axis does not matter)
	    out_axis[0] = 1;
	    out_axis[1] = 0;
	    out_axis[2] = 0;
	  }

	  return rad;
	}
	/**
	 * Gets the angular distance between two unit quaternions
	 *
	 * @param  {ReadonlyQuat} a     Origin unit quaternion
	 * @param  {ReadonlyQuat} b     Destination unit quaternion
	 * @return {Number}     Angle, in radians, between the two quaternions
	 */

	function getAngle(a, b) {
	  var dotproduct = dot$2(a, b);
	  return Math.acos(2 * dotproduct * dotproduct - 1);
	}
	/**
	 * Multiplies two quat's
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyQuat} a the first operand
	 * @param {ReadonlyQuat} b the second operand
	 * @returns {quat} out
	 */

	function multiply$2(out, a, b) {
	  var ax = a[0],
	      ay = a[1],
	      az = a[2],
	      aw = a[3];
	  var bx = b[0],
	      by = b[1],
	      bz = b[2],
	      bw = b[3];
	  out[0] = ax * bw + aw * bx + ay * bz - az * by;
	  out[1] = ay * bw + aw * by + az * bx - ax * bz;
	  out[2] = az * bw + aw * bz + ax * by - ay * bx;
	  out[3] = aw * bw - ax * bx - ay * by - az * bz;
	  return out;
	}
	/**
	 * Rotates a quaternion by the given angle about the X axis
	 *
	 * @param {quat} out quat receiving operation result
	 * @param {ReadonlyQuat} a quat to rotate
	 * @param {number} rad angle (in radians) to rotate
	 * @returns {quat} out
	 */

	function rotateX$1(out, a, rad) {
	  rad *= 0.5;
	  var ax = a[0],
	      ay = a[1],
	      az = a[2],
	      aw = a[3];
	  var bx = Math.sin(rad),
	      bw = Math.cos(rad);
	  out[0] = ax * bw + aw * bx;
	  out[1] = ay * bw + az * bx;
	  out[2] = az * bw - ay * bx;
	  out[3] = aw * bw - ax * bx;
	  return out;
	}
	/**
	 * Rotates a quaternion by the given angle about the Y axis
	 *
	 * @param {quat} out quat receiving operation result
	 * @param {ReadonlyQuat} a quat to rotate
	 * @param {number} rad angle (in radians) to rotate
	 * @returns {quat} out
	 */

	function rotateY$1(out, a, rad) {
	  rad *= 0.5;
	  var ax = a[0],
	      ay = a[1],
	      az = a[2],
	      aw = a[3];
	  var by = Math.sin(rad),
	      bw = Math.cos(rad);
	  out[0] = ax * bw - az * by;
	  out[1] = ay * bw + aw * by;
	  out[2] = az * bw + ax * by;
	  out[3] = aw * bw - ay * by;
	  return out;
	}
	/**
	 * Rotates a quaternion by the given angle about the Z axis
	 *
	 * @param {quat} out quat receiving operation result
	 * @param {ReadonlyQuat} a quat to rotate
	 * @param {number} rad angle (in radians) to rotate
	 * @returns {quat} out
	 */

	function rotateZ$1(out, a, rad) {
	  rad *= 0.5;
	  var ax = a[0],
	      ay = a[1],
	      az = a[2],
	      aw = a[3];
	  var bz = Math.sin(rad),
	      bw = Math.cos(rad);
	  out[0] = ax * bw + ay * bz;
	  out[1] = ay * bw - ax * bz;
	  out[2] = az * bw + aw * bz;
	  out[3] = aw * bw - az * bz;
	  return out;
	}
	/**
	 * Calculates the W component of a quat from the X, Y, and Z components.
	 * Assumes that quaternion is 1 unit in length.
	 * Any existing W component will be ignored.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyQuat} a quat to calculate W component of
	 * @returns {quat} out
	 */

	function calculateW(out, a) {
	  var x = a[0],
	      y = a[1],
	      z = a[2];
	  out[0] = x;
	  out[1] = y;
	  out[2] = z;
	  out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
	  return out;
	}
	/**
	 * Calculate the exponential of a unit quaternion.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyQuat} a quat to calculate the exponential of
	 * @returns {quat} out
	 */

	function exp(out, a) {
	  var x = a[0],
	      y = a[1],
	      z = a[2],
	      w = a[3];
	  var r = Math.sqrt(x * x + y * y + z * z);
	  var et = Math.exp(w);
	  var s = r > 0 ? et * Math.sin(r) / r : 0;
	  out[0] = x * s;
	  out[1] = y * s;
	  out[2] = z * s;
	  out[3] = et * Math.cos(r);
	  return out;
	}
	/**
	 * Calculate the natural logarithm of a unit quaternion.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyQuat} a quat to calculate the exponential of
	 * @returns {quat} out
	 */

	function ln(out, a) {
	  var x = a[0],
	      y = a[1],
	      z = a[2],
	      w = a[3];
	  var r = Math.sqrt(x * x + y * y + z * z);
	  var t = r > 0 ? Math.atan2(r, w) / r : 0;
	  out[0] = x * t;
	  out[1] = y * t;
	  out[2] = z * t;
	  out[3] = 0.5 * Math.log(x * x + y * y + z * z + w * w);
	  return out;
	}
	/**
	 * Calculate the scalar power of a unit quaternion.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyQuat} a quat to calculate the exponential of
	 * @param {Number} b amount to scale the quaternion by
	 * @returns {quat} out
	 */

	function pow(out, a, b) {
	  ln(out, a);
	  scale$2(out, out, b);
	  exp(out, out);
	  return out;
	}
	/**
	 * Performs a spherical linear interpolation between two quat
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyQuat} a the first operand
	 * @param {ReadonlyQuat} b the second operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {quat} out
	 */

	function slerp(out, a, b, t) {
	  // benchmarks:
	  //    http://jsperf.com/quaternion-slerp-implementations
	  var ax = a[0],
	      ay = a[1],
	      az = a[2],
	      aw = a[3];
	  var bx = b[0],
	      by = b[1],
	      bz = b[2],
	      bw = b[3];
	  var omega, cosom, sinom, scale0, scale1; // calc cosine

	  cosom = ax * bx + ay * by + az * bz + aw * bw; // adjust signs (if necessary)

	  if (cosom < 0.0) {
	    cosom = -cosom;
	    bx = -bx;
	    by = -by;
	    bz = -bz;
	    bw = -bw;
	  } // calculate coefficients


	  if (1.0 - cosom > EPSILON) {
	    // standard case (slerp)
	    omega = Math.acos(cosom);
	    sinom = Math.sin(omega);
	    scale0 = Math.sin((1.0 - t) * omega) / sinom;
	    scale1 = Math.sin(t * omega) / sinom;
	  } else {
	    // "from" and "to" quaternions are very close
	    //  ... so we can do a linear interpolation
	    scale0 = 1.0 - t;
	    scale1 = t;
	  } // calculate final values


	  out[0] = scale0 * ax + scale1 * bx;
	  out[1] = scale0 * ay + scale1 * by;
	  out[2] = scale0 * az + scale1 * bz;
	  out[3] = scale0 * aw + scale1 * bw;
	  return out;
	}
	/**
	 * Generates a random unit quaternion
	 *
	 * @param {quat} out the receiving quaternion
	 * @returns {quat} out
	 */

	function random$1(out) {
	  // Implementation of http://planning.cs.uiuc.edu/node198.html
	  // TODO: Calling random 3 times is probably not the fastest solution
	  var u1 = RANDOM();
	  var u2 = RANDOM();
	  var u3 = RANDOM();
	  var sqrt1MinusU1 = Math.sqrt(1 - u1);
	  var sqrtU1 = Math.sqrt(u1);
	  out[0] = sqrt1MinusU1 * Math.sin(2.0 * Math.PI * u2);
	  out[1] = sqrt1MinusU1 * Math.cos(2.0 * Math.PI * u2);
	  out[2] = sqrtU1 * Math.sin(2.0 * Math.PI * u3);
	  out[3] = sqrtU1 * Math.cos(2.0 * Math.PI * u3);
	  return out;
	}
	/**
	 * Calculates the inverse of a quat
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyQuat} a quat to calculate inverse of
	 * @returns {quat} out
	 */

	function invert$1(out, a) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2],
	      a3 = a[3];
	  var dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
	  var invDot = dot ? 1.0 / dot : 0; // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

	  out[0] = -a0 * invDot;
	  out[1] = -a1 * invDot;
	  out[2] = -a2 * invDot;
	  out[3] = a3 * invDot;
	  return out;
	}
	/**
	 * Calculates the conjugate of a quat
	 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyQuat} a quat to calculate conjugate of
	 * @returns {quat} out
	 */

	function conjugate$1(out, a) {
	  out[0] = -a[0];
	  out[1] = -a[1];
	  out[2] = -a[2];
	  out[3] = a[3];
	  return out;
	}
	/**
	 * Creates a quaternion from the given 3x3 rotation matrix.
	 *
	 * NOTE: The resultant quaternion is not normalized, so you should be sure
	 * to renormalize the quaternion yourself where necessary.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyMat3} m rotation matrix
	 * @returns {quat} out
	 * @function
	 */

	function fromMat3(out, m) {
	  // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
	  // article "Quaternion Calculus and Fast Animation".
	  var fTrace = m[0] + m[4] + m[8];
	  var fRoot;

	  if (fTrace > 0.0) {
	    // |w| > 1/2, may as well choose w > 1/2
	    fRoot = Math.sqrt(fTrace + 1.0); // 2w

	    out[3] = 0.5 * fRoot;
	    fRoot = 0.5 / fRoot; // 1/(4w)

	    out[0] = (m[5] - m[7]) * fRoot;
	    out[1] = (m[6] - m[2]) * fRoot;
	    out[2] = (m[1] - m[3]) * fRoot;
	  } else {
	    // |w| <= 1/2
	    var i = 0;
	    if (m[4] > m[0]) i = 1;
	    if (m[8] > m[i * 3 + i]) i = 2;
	    var j = (i + 1) % 3;
	    var k = (i + 2) % 3;
	    fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
	    out[i] = 0.5 * fRoot;
	    fRoot = 0.5 / fRoot;
	    out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
	    out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
	    out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
	  }

	  return out;
	}
	/**
	 * Creates a quaternion from the given euler angle x, y, z.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {x} Angle to rotate around X axis in degrees.
	 * @param {y} Angle to rotate around Y axis in degrees.
	 * @param {z} Angle to rotate around Z axis in degrees.
	 * @returns {quat} out
	 * @function
	 */

	function fromEuler(out, x, y, z) {
	  var halfToRad = 0.5 * Math.PI / 180.0;
	  x *= halfToRad;
	  y *= halfToRad;
	  z *= halfToRad;
	  var sx = Math.sin(x);
	  var cx = Math.cos(x);
	  var sy = Math.sin(y);
	  var cy = Math.cos(y);
	  var sz = Math.sin(z);
	  var cz = Math.cos(z);
	  out[0] = sx * cy * cz - cx * sy * sz;
	  out[1] = cx * sy * cz + sx * cy * sz;
	  out[2] = cx * cy * sz - sx * sy * cz;
	  out[3] = cx * cy * cz + sx * sy * sz;
	  return out;
	}
	/**
	 * Returns a string representation of a quatenion
	 *
	 * @param {ReadonlyQuat} a vector to represent as a string
	 * @returns {String} string representation of the vector
	 */

	function str$2(a) {
	  return "quat(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
	}
	/**
	 * Creates a new quat initialized with values from an existing quaternion
	 *
	 * @param {ReadonlyQuat} a quaternion to clone
	 * @returns {quat} a new quaternion
	 * @function
	 */

	var clone$2 = clone$3;
	/**
	 * Creates a new quat initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @param {Number} w W component
	 * @returns {quat} a new quaternion
	 * @function
	 */

	var fromValues$2 = fromValues$3;
	/**
	 * Copy the values from one quat to another
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyQuat} a the source quaternion
	 * @returns {quat} out
	 * @function
	 */

	var copy$2 = copy$3;
	/**
	 * Set the components of a quat to the given values
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @param {Number} w W component
	 * @returns {quat} out
	 * @function
	 */

	var set$2 = set$3;
	/**
	 * Adds two quat's
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyQuat} a the first operand
	 * @param {ReadonlyQuat} b the second operand
	 * @returns {quat} out
	 * @function
	 */

	var add$2 = add$3;
	/**
	 * Alias for {@link quat.multiply}
	 * @function
	 */

	var mul$2 = multiply$2;
	/**
	 * Scales a quat by a scalar number
	 *
	 * @param {quat} out the receiving vector
	 * @param {ReadonlyQuat} a the vector to scale
	 * @param {Number} b amount to scale the vector by
	 * @returns {quat} out
	 * @function
	 */

	var scale$2 = scale$3;
	/**
	 * Calculates the dot product of two quat's
	 *
	 * @param {ReadonlyQuat} a the first operand
	 * @param {ReadonlyQuat} b the second operand
	 * @returns {Number} dot product of a and b
	 * @function
	 */

	var dot$2 = dot$3;
	/**
	 * Performs a linear interpolation between two quat's
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyQuat} a the first operand
	 * @param {ReadonlyQuat} b the second operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {quat} out
	 * @function
	 */

	var lerp$2 = lerp$3;
	/**
	 * Calculates the length of a quat
	 *
	 * @param {ReadonlyQuat} a vector to calculate length of
	 * @returns {Number} length of a
	 */

	var length$2 = length$3;
	/**
	 * Alias for {@link quat.length}
	 * @function
	 */

	var len$2 = length$2;
	/**
	 * Calculates the squared length of a quat
	 *
	 * @param {ReadonlyQuat} a vector to calculate squared length of
	 * @returns {Number} squared length of a
	 * @function
	 */

	var squaredLength$2 = squaredLength$3;
	/**
	 * Alias for {@link quat.squaredLength}
	 * @function
	 */

	var sqrLen$2 = squaredLength$2;
	/**
	 * Normalize a quat
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyQuat} a quaternion to normalize
	 * @returns {quat} out
	 * @function
	 */

	var normalize$2 = normalize$3;
	/**
	 * Returns whether or not the quaternions have exactly the same elements in the same position (when compared with ===)
	 *
	 * @param {ReadonlyQuat} a The first quaternion.
	 * @param {ReadonlyQuat} b The second quaternion.
	 * @returns {Boolean} True if the vectors are equal, false otherwise.
	 */

	var exactEquals$2 = exactEquals$3;
	/**
	 * Returns whether or not the quaternions have approximately the same elements in the same position.
	 *
	 * @param {ReadonlyQuat} a The first vector.
	 * @param {ReadonlyQuat} b The second vector.
	 * @returns {Boolean} True if the vectors are equal, false otherwise.
	 */

	var equals$2 = equals$3;
	/**
	 * Sets a quaternion to represent the shortest rotation from one
	 * vector to another.
	 *
	 * Both vectors are assumed to be unit length.
	 *
	 * @param {quat} out the receiving quaternion.
	 * @param {ReadonlyVec3} a the initial vector
	 * @param {ReadonlyVec3} b the destination vector
	 * @returns {quat} out
	 */

	var rotationTo = function () {
	  var tmpvec3 = create$4();
	  var xUnitVec3 = fromValues$4(1, 0, 0);
	  var yUnitVec3 = fromValues$4(0, 1, 0);
	  return function (out, a, b) {
	    var dot = dot$4(a, b);

	    if (dot < -0.999999) {
	      cross$2(tmpvec3, xUnitVec3, a);
	      if (len$4(tmpvec3) < 0.000001) cross$2(tmpvec3, yUnitVec3, a);
	      normalize$4(tmpvec3, tmpvec3);
	      setAxisAngle(out, tmpvec3, Math.PI);
	      return out;
	    } else if (dot > 0.999999) {
	      out[0] = 0;
	      out[1] = 0;
	      out[2] = 0;
	      out[3] = 1;
	      return out;
	    } else {
	      cross$2(tmpvec3, a, b);
	      out[0] = tmpvec3[0];
	      out[1] = tmpvec3[1];
	      out[2] = tmpvec3[2];
	      out[3] = 1 + dot;
	      return normalize$2(out, out);
	    }
	  };
	}();
	/**
	 * Performs a spherical linear interpolation with two control points
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {ReadonlyQuat} a the first operand
	 * @param {ReadonlyQuat} b the second operand
	 * @param {ReadonlyQuat} c the third operand
	 * @param {ReadonlyQuat} d the fourth operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {quat} out
	 */

	var sqlerp = function () {
	  var temp1 = create$2();
	  var temp2 = create$2();
	  return function (out, a, b, c, d, t) {
	    slerp(temp1, a, d, t);
	    slerp(temp2, b, c, t);
	    slerp(out, temp1, temp2, 2 * t * (1 - t));
	    return out;
	  };
	}();
	/**
	 * Sets the specified quaternion with values corresponding to the given
	 * axes. Each axis is a vec3 and is expected to be unit length and
	 * perpendicular to all other specified axes.
	 *
	 * @param {ReadonlyVec3} view  the vector representing the viewing direction
	 * @param {ReadonlyVec3} right the vector representing the local "right" direction
	 * @param {ReadonlyVec3} up    the vector representing the local "up" direction
	 * @returns {quat} out
	 */

	var setAxes = function () {
	  var matr = create$6();
	  return function (out, view, right, up) {
	    matr[0] = right[0];
	    matr[3] = right[1];
	    matr[6] = right[2];
	    matr[1] = up[0];
	    matr[4] = up[1];
	    matr[7] = up[2];
	    matr[2] = -view[0];
	    matr[5] = -view[1];
	    matr[8] = -view[2];
	    return normalize$2(out, fromMat3(out, matr));
	  };
	}();

	var quat = /*#__PURE__*/Object.freeze({
		__proto__: null,
		create: create$2,
		identity: identity$1,
		setAxisAngle: setAxisAngle,
		getAxisAngle: getAxisAngle,
		getAngle: getAngle,
		multiply: multiply$2,
		rotateX: rotateX$1,
		rotateY: rotateY$1,
		rotateZ: rotateZ$1,
		calculateW: calculateW,
		exp: exp,
		ln: ln,
		pow: pow,
		slerp: slerp,
		random: random$1,
		invert: invert$1,
		conjugate: conjugate$1,
		fromMat3: fromMat3,
		fromEuler: fromEuler,
		str: str$2,
		clone: clone$2,
		fromValues: fromValues$2,
		copy: copy$2,
		set: set$2,
		add: add$2,
		mul: mul$2,
		scale: scale$2,
		dot: dot$2,
		lerp: lerp$2,
		length: length$2,
		len: len$2,
		squaredLength: squaredLength$2,
		sqrLen: sqrLen$2,
		normalize: normalize$2,
		exactEquals: exactEquals$2,
		equals: equals$2,
		rotationTo: rotationTo,
		sqlerp: sqlerp,
		setAxes: setAxes
	});

	/**
	 * Dual Quaternion<br>
	 * Format: [real, dual]<br>
	 * Quaternion format: XYZW<br>
	 * Make sure to have normalized dual quaternions, otherwise the functions may not work as intended.<br>
	 * @module quat2
	 */

	/**
	 * Creates a new identity dual quat
	 *
	 * @returns {quat2} a new dual quaternion [real -> rotation, dual -> translation]
	 */

	function create$1() {
	  var dq = new ARRAY_TYPE(8);

	  if (ARRAY_TYPE != Float32Array) {
	    dq[0] = 0;
	    dq[1] = 0;
	    dq[2] = 0;
	    dq[4] = 0;
	    dq[5] = 0;
	    dq[6] = 0;
	    dq[7] = 0;
	  }

	  dq[3] = 1;
	  return dq;
	}
	/**
	 * Creates a new quat initialized with values from an existing quaternion
	 *
	 * @param {ReadonlyQuat2} a dual quaternion to clone
	 * @returns {quat2} new dual quaternion
	 * @function
	 */

	function clone$1(a) {
	  var dq = new ARRAY_TYPE(8);
	  dq[0] = a[0];
	  dq[1] = a[1];
	  dq[2] = a[2];
	  dq[3] = a[3];
	  dq[4] = a[4];
	  dq[5] = a[5];
	  dq[6] = a[6];
	  dq[7] = a[7];
	  return dq;
	}
	/**
	 * Creates a new dual quat initialized with the given values
	 *
	 * @param {Number} x1 X component
	 * @param {Number} y1 Y component
	 * @param {Number} z1 Z component
	 * @param {Number} w1 W component
	 * @param {Number} x2 X component
	 * @param {Number} y2 Y component
	 * @param {Number} z2 Z component
	 * @param {Number} w2 W component
	 * @returns {quat2} new dual quaternion
	 * @function
	 */

	function fromValues$1(x1, y1, z1, w1, x2, y2, z2, w2) {
	  var dq = new ARRAY_TYPE(8);
	  dq[0] = x1;
	  dq[1] = y1;
	  dq[2] = z1;
	  dq[3] = w1;
	  dq[4] = x2;
	  dq[5] = y2;
	  dq[6] = z2;
	  dq[7] = w2;
	  return dq;
	}
	/**
	 * Creates a new dual quat from the given values (quat and translation)
	 *
	 * @param {Number} x1 X component
	 * @param {Number} y1 Y component
	 * @param {Number} z1 Z component
	 * @param {Number} w1 W component
	 * @param {Number} x2 X component (translation)
	 * @param {Number} y2 Y component (translation)
	 * @param {Number} z2 Z component (translation)
	 * @returns {quat2} new dual quaternion
	 * @function
	 */

	function fromRotationTranslationValues(x1, y1, z1, w1, x2, y2, z2) {
	  var dq = new ARRAY_TYPE(8);
	  dq[0] = x1;
	  dq[1] = y1;
	  dq[2] = z1;
	  dq[3] = w1;
	  var ax = x2 * 0.5,
	      ay = y2 * 0.5,
	      az = z2 * 0.5;
	  dq[4] = ax * w1 + ay * z1 - az * y1;
	  dq[5] = ay * w1 + az * x1 - ax * z1;
	  dq[6] = az * w1 + ax * y1 - ay * x1;
	  dq[7] = -ax * x1 - ay * y1 - az * z1;
	  return dq;
	}
	/**
	 * Creates a dual quat from a quaternion and a translation
	 *
	 * @param {ReadonlyQuat2} dual quaternion receiving operation result
	 * @param {ReadonlyQuat} q a normalized quaternion
	 * @param {ReadonlyVec3} t tranlation vector
	 * @returns {quat2} dual quaternion receiving operation result
	 * @function
	 */

	function fromRotationTranslation(out, q, t) {
	  var ax = t[0] * 0.5,
	      ay = t[1] * 0.5,
	      az = t[2] * 0.5,
	      bx = q[0],
	      by = q[1],
	      bz = q[2],
	      bw = q[3];
	  out[0] = bx;
	  out[1] = by;
	  out[2] = bz;
	  out[3] = bw;
	  out[4] = ax * bw + ay * bz - az * by;
	  out[5] = ay * bw + az * bx - ax * bz;
	  out[6] = az * bw + ax * by - ay * bx;
	  out[7] = -ax * bx - ay * by - az * bz;
	  return out;
	}
	/**
	 * Creates a dual quat from a translation
	 *
	 * @param {ReadonlyQuat2} dual quaternion receiving operation result
	 * @param {ReadonlyVec3} t translation vector
	 * @returns {quat2} dual quaternion receiving operation result
	 * @function
	 */

	function fromTranslation(out, t) {
	  out[0] = 0;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 1;
	  out[4] = t[0] * 0.5;
	  out[5] = t[1] * 0.5;
	  out[6] = t[2] * 0.5;
	  out[7] = 0;
	  return out;
	}
	/**
	 * Creates a dual quat from a quaternion
	 *
	 * @param {ReadonlyQuat2} dual quaternion receiving operation result
	 * @param {ReadonlyQuat} q the quaternion
	 * @returns {quat2} dual quaternion receiving operation result
	 * @function
	 */

	function fromRotation(out, q) {
	  out[0] = q[0];
	  out[1] = q[1];
	  out[2] = q[2];
	  out[3] = q[3];
	  out[4] = 0;
	  out[5] = 0;
	  out[6] = 0;
	  out[7] = 0;
	  return out;
	}
	/**
	 * Creates a new dual quat from a matrix (4x4)
	 *
	 * @param {quat2} out the dual quaternion
	 * @param {ReadonlyMat4} a the matrix
	 * @returns {quat2} dual quat receiving operation result
	 * @function
	 */

	function fromMat4(out, a) {
	  //TODO Optimize this
	  var outer = create$2();
	  getRotation(outer, a);
	  var t = new ARRAY_TYPE(3);
	  getTranslation$1(t, a);
	  fromRotationTranslation(out, outer, t);
	  return out;
	}
	/**
	 * Copy the values from one dual quat to another
	 *
	 * @param {quat2} out the receiving dual quaternion
	 * @param {ReadonlyQuat2} a the source dual quaternion
	 * @returns {quat2} out
	 * @function
	 */

	function copy$1(out, a) {
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  out[3] = a[3];
	  out[4] = a[4];
	  out[5] = a[5];
	  out[6] = a[6];
	  out[7] = a[7];
	  return out;
	}
	/**
	 * Set a dual quat to the identity dual quaternion
	 *
	 * @param {quat2} out the receiving quaternion
	 * @returns {quat2} out
	 */

	function identity(out) {
	  out[0] = 0;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 1;
	  out[4] = 0;
	  out[5] = 0;
	  out[6] = 0;
	  out[7] = 0;
	  return out;
	}
	/**
	 * Set the components of a dual quat to the given values
	 *
	 * @param {quat2} out the receiving quaternion
	 * @param {Number} x1 X component
	 * @param {Number} y1 Y component
	 * @param {Number} z1 Z component
	 * @param {Number} w1 W component
	 * @param {Number} x2 X component
	 * @param {Number} y2 Y component
	 * @param {Number} z2 Z component
	 * @param {Number} w2 W component
	 * @returns {quat2} out
	 * @function
	 */

	function set$1(out, x1, y1, z1, w1, x2, y2, z2, w2) {
	  out[0] = x1;
	  out[1] = y1;
	  out[2] = z1;
	  out[3] = w1;
	  out[4] = x2;
	  out[5] = y2;
	  out[6] = z2;
	  out[7] = w2;
	  return out;
	}
	/**
	 * Gets the real part of a dual quat
	 * @param  {quat} out real part
	 * @param  {ReadonlyQuat2} a Dual Quaternion
	 * @return {quat} real part
	 */

	var getReal = copy$2;
	/**
	 * Gets the dual part of a dual quat
	 * @param  {quat} out dual part
	 * @param  {ReadonlyQuat2} a Dual Quaternion
	 * @return {quat} dual part
	 */

	function getDual(out, a) {
	  out[0] = a[4];
	  out[1] = a[5];
	  out[2] = a[6];
	  out[3] = a[7];
	  return out;
	}
	/**
	 * Set the real component of a dual quat to the given quaternion
	 *
	 * @param {quat2} out the receiving quaternion
	 * @param {ReadonlyQuat} q a quaternion representing the real part
	 * @returns {quat2} out
	 * @function
	 */

	var setReal = copy$2;
	/**
	 * Set the dual component of a dual quat to the given quaternion
	 *
	 * @param {quat2} out the receiving quaternion
	 * @param {ReadonlyQuat} q a quaternion representing the dual part
	 * @returns {quat2} out
	 * @function
	 */

	function setDual(out, q) {
	  out[4] = q[0];
	  out[5] = q[1];
	  out[6] = q[2];
	  out[7] = q[3];
	  return out;
	}
	/**
	 * Gets the translation of a normalized dual quat
	 * @param  {vec3} out translation
	 * @param  {ReadonlyQuat2} a Dual Quaternion to be decomposed
	 * @return {vec3} translation
	 */

	function getTranslation(out, a) {
	  var ax = a[4],
	      ay = a[5],
	      az = a[6],
	      aw = a[7],
	      bx = -a[0],
	      by = -a[1],
	      bz = -a[2],
	      bw = a[3];
	  out[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
	  out[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
	  out[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
	  return out;
	}
	/**
	 * Translates a dual quat by the given vector
	 *
	 * @param {quat2} out the receiving dual quaternion
	 * @param {ReadonlyQuat2} a the dual quaternion to translate
	 * @param {ReadonlyVec3} v vector to translate by
	 * @returns {quat2} out
	 */

	function translate(out, a, v) {
	  var ax1 = a[0],
	      ay1 = a[1],
	      az1 = a[2],
	      aw1 = a[3],
	      bx1 = v[0] * 0.5,
	      by1 = v[1] * 0.5,
	      bz1 = v[2] * 0.5,
	      ax2 = a[4],
	      ay2 = a[5],
	      az2 = a[6],
	      aw2 = a[7];
	  out[0] = ax1;
	  out[1] = ay1;
	  out[2] = az1;
	  out[3] = aw1;
	  out[4] = aw1 * bx1 + ay1 * bz1 - az1 * by1 + ax2;
	  out[5] = aw1 * by1 + az1 * bx1 - ax1 * bz1 + ay2;
	  out[6] = aw1 * bz1 + ax1 * by1 - ay1 * bx1 + az2;
	  out[7] = -ax1 * bx1 - ay1 * by1 - az1 * bz1 + aw2;
	  return out;
	}
	/**
	 * Rotates a dual quat around the X axis
	 *
	 * @param {quat2} out the receiving dual quaternion
	 * @param {ReadonlyQuat2} a the dual quaternion to rotate
	 * @param {number} rad how far should the rotation be
	 * @returns {quat2} out
	 */

	function rotateX(out, a, rad) {
	  var bx = -a[0],
	      by = -a[1],
	      bz = -a[2],
	      bw = a[3],
	      ax = a[4],
	      ay = a[5],
	      az = a[6],
	      aw = a[7],
	      ax1 = ax * bw + aw * bx + ay * bz - az * by,
	      ay1 = ay * bw + aw * by + az * bx - ax * bz,
	      az1 = az * bw + aw * bz + ax * by - ay * bx,
	      aw1 = aw * bw - ax * bx - ay * by - az * bz;
	  rotateX$1(out, a, rad);
	  bx = out[0];
	  by = out[1];
	  bz = out[2];
	  bw = out[3];
	  out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
	  out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
	  out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
	  out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
	  return out;
	}
	/**
	 * Rotates a dual quat around the Y axis
	 *
	 * @param {quat2} out the receiving dual quaternion
	 * @param {ReadonlyQuat2} a the dual quaternion to rotate
	 * @param {number} rad how far should the rotation be
	 * @returns {quat2} out
	 */

	function rotateY(out, a, rad) {
	  var bx = -a[0],
	      by = -a[1],
	      bz = -a[2],
	      bw = a[3],
	      ax = a[4],
	      ay = a[5],
	      az = a[6],
	      aw = a[7],
	      ax1 = ax * bw + aw * bx + ay * bz - az * by,
	      ay1 = ay * bw + aw * by + az * bx - ax * bz,
	      az1 = az * bw + aw * bz + ax * by - ay * bx,
	      aw1 = aw * bw - ax * bx - ay * by - az * bz;
	  rotateY$1(out, a, rad);
	  bx = out[0];
	  by = out[1];
	  bz = out[2];
	  bw = out[3];
	  out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
	  out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
	  out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
	  out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
	  return out;
	}
	/**
	 * Rotates a dual quat around the Z axis
	 *
	 * @param {quat2} out the receiving dual quaternion
	 * @param {ReadonlyQuat2} a the dual quaternion to rotate
	 * @param {number} rad how far should the rotation be
	 * @returns {quat2} out
	 */

	function rotateZ(out, a, rad) {
	  var bx = -a[0],
	      by = -a[1],
	      bz = -a[2],
	      bw = a[3],
	      ax = a[4],
	      ay = a[5],
	      az = a[6],
	      aw = a[7],
	      ax1 = ax * bw + aw * bx + ay * bz - az * by,
	      ay1 = ay * bw + aw * by + az * bx - ax * bz,
	      az1 = az * bw + aw * bz + ax * by - ay * bx,
	      aw1 = aw * bw - ax * bx - ay * by - az * bz;
	  rotateZ$1(out, a, rad);
	  bx = out[0];
	  by = out[1];
	  bz = out[2];
	  bw = out[3];
	  out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
	  out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
	  out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
	  out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
	  return out;
	}
	/**
	 * Rotates a dual quat by a given quaternion (a * q)
	 *
	 * @param {quat2} out the receiving dual quaternion
	 * @param {ReadonlyQuat2} a the dual quaternion to rotate
	 * @param {ReadonlyQuat} q quaternion to rotate by
	 * @returns {quat2} out
	 */

	function rotateByQuatAppend(out, a, q) {
	  var qx = q[0],
	      qy = q[1],
	      qz = q[2],
	      qw = q[3],
	      ax = a[0],
	      ay = a[1],
	      az = a[2],
	      aw = a[3];
	  out[0] = ax * qw + aw * qx + ay * qz - az * qy;
	  out[1] = ay * qw + aw * qy + az * qx - ax * qz;
	  out[2] = az * qw + aw * qz + ax * qy - ay * qx;
	  out[3] = aw * qw - ax * qx - ay * qy - az * qz;
	  ax = a[4];
	  ay = a[5];
	  az = a[6];
	  aw = a[7];
	  out[4] = ax * qw + aw * qx + ay * qz - az * qy;
	  out[5] = ay * qw + aw * qy + az * qx - ax * qz;
	  out[6] = az * qw + aw * qz + ax * qy - ay * qx;
	  out[7] = aw * qw - ax * qx - ay * qy - az * qz;
	  return out;
	}
	/**
	 * Rotates a dual quat by a given quaternion (q * a)
	 *
	 * @param {quat2} out the receiving dual quaternion
	 * @param {ReadonlyQuat} q quaternion to rotate by
	 * @param {ReadonlyQuat2} a the dual quaternion to rotate
	 * @returns {quat2} out
	 */

	function rotateByQuatPrepend(out, q, a) {
	  var qx = q[0],
	      qy = q[1],
	      qz = q[2],
	      qw = q[3],
	      bx = a[0],
	      by = a[1],
	      bz = a[2],
	      bw = a[3];
	  out[0] = qx * bw + qw * bx + qy * bz - qz * by;
	  out[1] = qy * bw + qw * by + qz * bx - qx * bz;
	  out[2] = qz * bw + qw * bz + qx * by - qy * bx;
	  out[3] = qw * bw - qx * bx - qy * by - qz * bz;
	  bx = a[4];
	  by = a[5];
	  bz = a[6];
	  bw = a[7];
	  out[4] = qx * bw + qw * bx + qy * bz - qz * by;
	  out[5] = qy * bw + qw * by + qz * bx - qx * bz;
	  out[6] = qz * bw + qw * bz + qx * by - qy * bx;
	  out[7] = qw * bw - qx * bx - qy * by - qz * bz;
	  return out;
	}
	/**
	 * Rotates a dual quat around a given axis. Does the normalisation automatically
	 *
	 * @param {quat2} out the receiving dual quaternion
	 * @param {ReadonlyQuat2} a the dual quaternion to rotate
	 * @param {ReadonlyVec3} axis the axis to rotate around
	 * @param {Number} rad how far the rotation should be
	 * @returns {quat2} out
	 */

	function rotateAroundAxis(out, a, axis, rad) {
	  //Special case for rad = 0
	  if (Math.abs(rad) < EPSILON) {
	    return copy$1(out, a);
	  }

	  var axisLength = Math.hypot(axis[0], axis[1], axis[2]);
	  rad = rad * 0.5;
	  var s = Math.sin(rad);
	  var bx = s * axis[0] / axisLength;
	  var by = s * axis[1] / axisLength;
	  var bz = s * axis[2] / axisLength;
	  var bw = Math.cos(rad);
	  var ax1 = a[0],
	      ay1 = a[1],
	      az1 = a[2],
	      aw1 = a[3];
	  out[0] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
	  out[1] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
	  out[2] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
	  out[3] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
	  var ax = a[4],
	      ay = a[5],
	      az = a[6],
	      aw = a[7];
	  out[4] = ax * bw + aw * bx + ay * bz - az * by;
	  out[5] = ay * bw + aw * by + az * bx - ax * bz;
	  out[6] = az * bw + aw * bz + ax * by - ay * bx;
	  out[7] = aw * bw - ax * bx - ay * by - az * bz;
	  return out;
	}
	/**
	 * Adds two dual quat's
	 *
	 * @param {quat2} out the receiving dual quaternion
	 * @param {ReadonlyQuat2} a the first operand
	 * @param {ReadonlyQuat2} b the second operand
	 * @returns {quat2} out
	 * @function
	 */

	function add$1(out, a, b) {
	  out[0] = a[0] + b[0];
	  out[1] = a[1] + b[1];
	  out[2] = a[2] + b[2];
	  out[3] = a[3] + b[3];
	  out[4] = a[4] + b[4];
	  out[5] = a[5] + b[5];
	  out[6] = a[6] + b[6];
	  out[7] = a[7] + b[7];
	  return out;
	}
	/**
	 * Multiplies two dual quat's
	 *
	 * @param {quat2} out the receiving dual quaternion
	 * @param {ReadonlyQuat2} a the first operand
	 * @param {ReadonlyQuat2} b the second operand
	 * @returns {quat2} out
	 */

	function multiply$1(out, a, b) {
	  var ax0 = a[0],
	      ay0 = a[1],
	      az0 = a[2],
	      aw0 = a[3],
	      bx1 = b[4],
	      by1 = b[5],
	      bz1 = b[6],
	      bw1 = b[7],
	      ax1 = a[4],
	      ay1 = a[5],
	      az1 = a[6],
	      aw1 = a[7],
	      bx0 = b[0],
	      by0 = b[1],
	      bz0 = b[2],
	      bw0 = b[3];
	  out[0] = ax0 * bw0 + aw0 * bx0 + ay0 * bz0 - az0 * by0;
	  out[1] = ay0 * bw0 + aw0 * by0 + az0 * bx0 - ax0 * bz0;
	  out[2] = az0 * bw0 + aw0 * bz0 + ax0 * by0 - ay0 * bx0;
	  out[3] = aw0 * bw0 - ax0 * bx0 - ay0 * by0 - az0 * bz0;
	  out[4] = ax0 * bw1 + aw0 * bx1 + ay0 * bz1 - az0 * by1 + ax1 * bw0 + aw1 * bx0 + ay1 * bz0 - az1 * by0;
	  out[5] = ay0 * bw1 + aw0 * by1 + az0 * bx1 - ax0 * bz1 + ay1 * bw0 + aw1 * by0 + az1 * bx0 - ax1 * bz0;
	  out[6] = az0 * bw1 + aw0 * bz1 + ax0 * by1 - ay0 * bx1 + az1 * bw0 + aw1 * bz0 + ax1 * by0 - ay1 * bx0;
	  out[7] = aw0 * bw1 - ax0 * bx1 - ay0 * by1 - az0 * bz1 + aw1 * bw0 - ax1 * bx0 - ay1 * by0 - az1 * bz0;
	  return out;
	}
	/**
	 * Alias for {@link quat2.multiply}
	 * @function
	 */

	var mul$1 = multiply$1;
	/**
	 * Scales a dual quat by a scalar number
	 *
	 * @param {quat2} out the receiving dual quat
	 * @param {ReadonlyQuat2} a the dual quat to scale
	 * @param {Number} b amount to scale the dual quat by
	 * @returns {quat2} out
	 * @function
	 */

	function scale$1(out, a, b) {
	  out[0] = a[0] * b;
	  out[1] = a[1] * b;
	  out[2] = a[2] * b;
	  out[3] = a[3] * b;
	  out[4] = a[4] * b;
	  out[5] = a[5] * b;
	  out[6] = a[6] * b;
	  out[7] = a[7] * b;
	  return out;
	}
	/**
	 * Calculates the dot product of two dual quat's (The dot product of the real parts)
	 *
	 * @param {ReadonlyQuat2} a the first operand
	 * @param {ReadonlyQuat2} b the second operand
	 * @returns {Number} dot product of a and b
	 * @function
	 */

	var dot$1 = dot$2;
	/**
	 * Performs a linear interpolation between two dual quats's
	 * NOTE: The resulting dual quaternions won't always be normalized (The error is most noticeable when t = 0.5)
	 *
	 * @param {quat2} out the receiving dual quat
	 * @param {ReadonlyQuat2} a the first operand
	 * @param {ReadonlyQuat2} b the second operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {quat2} out
	 */

	function lerp$1(out, a, b, t) {
	  var mt = 1 - t;
	  if (dot$1(a, b) < 0) t = -t;
	  out[0] = a[0] * mt + b[0] * t;
	  out[1] = a[1] * mt + b[1] * t;
	  out[2] = a[2] * mt + b[2] * t;
	  out[3] = a[3] * mt + b[3] * t;
	  out[4] = a[4] * mt + b[4] * t;
	  out[5] = a[5] * mt + b[5] * t;
	  out[6] = a[6] * mt + b[6] * t;
	  out[7] = a[7] * mt + b[7] * t;
	  return out;
	}
	/**
	 * Calculates the inverse of a dual quat. If they are normalized, conjugate is cheaper
	 *
	 * @param {quat2} out the receiving dual quaternion
	 * @param {ReadonlyQuat2} a dual quat to calculate inverse of
	 * @returns {quat2} out
	 */

	function invert(out, a) {
	  var sqlen = squaredLength$1(a);
	  out[0] = -a[0] / sqlen;
	  out[1] = -a[1] / sqlen;
	  out[2] = -a[2] / sqlen;
	  out[3] = a[3] / sqlen;
	  out[4] = -a[4] / sqlen;
	  out[5] = -a[5] / sqlen;
	  out[6] = -a[6] / sqlen;
	  out[7] = a[7] / sqlen;
	  return out;
	}
	/**
	 * Calculates the conjugate of a dual quat
	 * If the dual quaternion is normalized, this function is faster than quat2.inverse and produces the same result.
	 *
	 * @param {quat2} out the receiving quaternion
	 * @param {ReadonlyQuat2} a quat to calculate conjugate of
	 * @returns {quat2} out
	 */

	function conjugate(out, a) {
	  out[0] = -a[0];
	  out[1] = -a[1];
	  out[2] = -a[2];
	  out[3] = a[3];
	  out[4] = -a[4];
	  out[5] = -a[5];
	  out[6] = -a[6];
	  out[7] = a[7];
	  return out;
	}
	/**
	 * Calculates the length of a dual quat
	 *
	 * @param {ReadonlyQuat2} a dual quat to calculate length of
	 * @returns {Number} length of a
	 * @function
	 */

	var length$1 = length$2;
	/**
	 * Alias for {@link quat2.length}
	 * @function
	 */

	var len$1 = length$1;
	/**
	 * Calculates the squared length of a dual quat
	 *
	 * @param {ReadonlyQuat2} a dual quat to calculate squared length of
	 * @returns {Number} squared length of a
	 * @function
	 */

	var squaredLength$1 = squaredLength$2;
	/**
	 * Alias for {@link quat2.squaredLength}
	 * @function
	 */

	var sqrLen$1 = squaredLength$1;
	/**
	 * Normalize a dual quat
	 *
	 * @param {quat2} out the receiving dual quaternion
	 * @param {ReadonlyQuat2} a dual quaternion to normalize
	 * @returns {quat2} out
	 * @function
	 */

	function normalize$1(out, a) {
	  var magnitude = squaredLength$1(a);

	  if (magnitude > 0) {
	    magnitude = Math.sqrt(magnitude);
	    var a0 = a[0] / magnitude;
	    var a1 = a[1] / magnitude;
	    var a2 = a[2] / magnitude;
	    var a3 = a[3] / magnitude;
	    var b0 = a[4];
	    var b1 = a[5];
	    var b2 = a[6];
	    var b3 = a[7];
	    var a_dot_b = a0 * b0 + a1 * b1 + a2 * b2 + a3 * b3;
	    out[0] = a0;
	    out[1] = a1;
	    out[2] = a2;
	    out[3] = a3;
	    out[4] = (b0 - a0 * a_dot_b) / magnitude;
	    out[5] = (b1 - a1 * a_dot_b) / magnitude;
	    out[6] = (b2 - a2 * a_dot_b) / magnitude;
	    out[7] = (b3 - a3 * a_dot_b) / magnitude;
	  }

	  return out;
	}
	/**
	 * Returns a string representation of a dual quatenion
	 *
	 * @param {ReadonlyQuat2} a dual quaternion to represent as a string
	 * @returns {String} string representation of the dual quat
	 */

	function str$1(a) {
	  return "quat2(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ")";
	}
	/**
	 * Returns whether or not the dual quaternions have exactly the same elements in the same position (when compared with ===)
	 *
	 * @param {ReadonlyQuat2} a the first dual quaternion.
	 * @param {ReadonlyQuat2} b the second dual quaternion.
	 * @returns {Boolean} true if the dual quaternions are equal, false otherwise.
	 */

	function exactEquals$1(a, b) {
	  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7];
	}
	/**
	 * Returns whether or not the dual quaternions have approximately the same elements in the same position.
	 *
	 * @param {ReadonlyQuat2} a the first dual quat.
	 * @param {ReadonlyQuat2} b the second dual quat.
	 * @returns {Boolean} true if the dual quats are equal, false otherwise.
	 */

	function equals$1(a, b) {
	  var a0 = a[0],
	      a1 = a[1],
	      a2 = a[2],
	      a3 = a[3],
	      a4 = a[4],
	      a5 = a[5],
	      a6 = a[6],
	      a7 = a[7];
	  var b0 = b[0],
	      b1 = b[1],
	      b2 = b[2],
	      b3 = b[3],
	      b4 = b[4],
	      b5 = b[5],
	      b6 = b[6],
	      b7 = b[7];
	  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7));
	}

	var quat2 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		create: create$1,
		clone: clone$1,
		fromValues: fromValues$1,
		fromRotationTranslationValues: fromRotationTranslationValues,
		fromRotationTranslation: fromRotationTranslation,
		fromTranslation: fromTranslation,
		fromRotation: fromRotation,
		fromMat4: fromMat4,
		copy: copy$1,
		identity: identity,
		set: set$1,
		getReal: getReal,
		getDual: getDual,
		setReal: setReal,
		setDual: setDual,
		getTranslation: getTranslation,
		translate: translate,
		rotateX: rotateX,
		rotateY: rotateY,
		rotateZ: rotateZ,
		rotateByQuatAppend: rotateByQuatAppend,
		rotateByQuatPrepend: rotateByQuatPrepend,
		rotateAroundAxis: rotateAroundAxis,
		add: add$1,
		multiply: multiply$1,
		mul: mul$1,
		scale: scale$1,
		dot: dot$1,
		lerp: lerp$1,
		invert: invert,
		conjugate: conjugate,
		length: length$1,
		len: len$1,
		squaredLength: squaredLength$1,
		sqrLen: sqrLen$1,
		normalize: normalize$1,
		str: str$1,
		exactEquals: exactEquals$1,
		equals: equals$1
	});

	/**
	 * 2 Dimensional Vector
	 * @module vec2
	 */

	/**
	 * Creates a new, empty vec2
	 *
	 * @returns {vec2} a new 2D vector
	 */

	function create() {
	  var out = new ARRAY_TYPE(2);

	  if (ARRAY_TYPE != Float32Array) {
	    out[0] = 0;
	    out[1] = 0;
	  }

	  return out;
	}
	/**
	 * Creates a new vec2 initialized with values from an existing vector
	 *
	 * @param {ReadonlyVec2} a vector to clone
	 * @returns {vec2} a new 2D vector
	 */

	function clone(a) {
	  var out = new ARRAY_TYPE(2);
	  out[0] = a[0];
	  out[1] = a[1];
	  return out;
	}
	/**
	 * Creates a new vec2 initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @returns {vec2} a new 2D vector
	 */

	function fromValues(x, y) {
	  var out = new ARRAY_TYPE(2);
	  out[0] = x;
	  out[1] = y;
	  return out;
	}
	/**
	 * Copy the values from one vec2 to another
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a the source vector
	 * @returns {vec2} out
	 */

	function copy(out, a) {
	  out[0] = a[0];
	  out[1] = a[1];
	  return out;
	}
	/**
	 * Set the components of a vec2 to the given values
	 *
	 * @param {vec2} out the receiving vector
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @returns {vec2} out
	 */

	function set(out, x, y) {
	  out[0] = x;
	  out[1] = y;
	  return out;
	}
	/**
	 * Adds two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a the first operand
	 * @param {ReadonlyVec2} b the second operand
	 * @returns {vec2} out
	 */

	function add(out, a, b) {
	  out[0] = a[0] + b[0];
	  out[1] = a[1] + b[1];
	  return out;
	}
	/**
	 * Subtracts vector b from vector a
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a the first operand
	 * @param {ReadonlyVec2} b the second operand
	 * @returns {vec2} out
	 */

	function subtract(out, a, b) {
	  out[0] = a[0] - b[0];
	  out[1] = a[1] - b[1];
	  return out;
	}
	/**
	 * Multiplies two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a the first operand
	 * @param {ReadonlyVec2} b the second operand
	 * @returns {vec2} out
	 */

	function multiply(out, a, b) {
	  out[0] = a[0] * b[0];
	  out[1] = a[1] * b[1];
	  return out;
	}
	/**
	 * Divides two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a the first operand
	 * @param {ReadonlyVec2} b the second operand
	 * @returns {vec2} out
	 */

	function divide(out, a, b) {
	  out[0] = a[0] / b[0];
	  out[1] = a[1] / b[1];
	  return out;
	}
	/**
	 * Math.ceil the components of a vec2
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a vector to ceil
	 * @returns {vec2} out
	 */

	function ceil(out, a) {
	  out[0] = Math.ceil(a[0]);
	  out[1] = Math.ceil(a[1]);
	  return out;
	}
	/**
	 * Math.floor the components of a vec2
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a vector to floor
	 * @returns {vec2} out
	 */

	function floor(out, a) {
	  out[0] = Math.floor(a[0]);
	  out[1] = Math.floor(a[1]);
	  return out;
	}
	/**
	 * Returns the minimum of two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a the first operand
	 * @param {ReadonlyVec2} b the second operand
	 * @returns {vec2} out
	 */

	function min(out, a, b) {
	  out[0] = Math.min(a[0], b[0]);
	  out[1] = Math.min(a[1], b[1]);
	  return out;
	}
	/**
	 * Returns the maximum of two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a the first operand
	 * @param {ReadonlyVec2} b the second operand
	 * @returns {vec2} out
	 */

	function max(out, a, b) {
	  out[0] = Math.max(a[0], b[0]);
	  out[1] = Math.max(a[1], b[1]);
	  return out;
	}
	/**
	 * Math.round the components of a vec2
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a vector to round
	 * @returns {vec2} out
	 */

	function round(out, a) {
	  out[0] = Math.round(a[0]);
	  out[1] = Math.round(a[1]);
	  return out;
	}
	/**
	 * Scales a vec2 by a scalar number
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a the vector to scale
	 * @param {Number} b amount to scale the vector by
	 * @returns {vec2} out
	 */

	function scale(out, a, b) {
	  out[0] = a[0] * b;
	  out[1] = a[1] * b;
	  return out;
	}
	/**
	 * Adds two vec2's after scaling the second operand by a scalar value
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a the first operand
	 * @param {ReadonlyVec2} b the second operand
	 * @param {Number} scale the amount to scale b by before adding
	 * @returns {vec2} out
	 */

	function scaleAndAdd(out, a, b, scale) {
	  out[0] = a[0] + b[0] * scale;
	  out[1] = a[1] + b[1] * scale;
	  return out;
	}
	/**
	 * Calculates the euclidian distance between two vec2's
	 *
	 * @param {ReadonlyVec2} a the first operand
	 * @param {ReadonlyVec2} b the second operand
	 * @returns {Number} distance between a and b
	 */

	function distance(a, b) {
	  var x = b[0] - a[0],
	      y = b[1] - a[1];
	  return Math.hypot(x, y);
	}
	/**
	 * Calculates the squared euclidian distance between two vec2's
	 *
	 * @param {ReadonlyVec2} a the first operand
	 * @param {ReadonlyVec2} b the second operand
	 * @returns {Number} squared distance between a and b
	 */

	function squaredDistance(a, b) {
	  var x = b[0] - a[0],
	      y = b[1] - a[1];
	  return x * x + y * y;
	}
	/**
	 * Calculates the length of a vec2
	 *
	 * @param {ReadonlyVec2} a vector to calculate length of
	 * @returns {Number} length of a
	 */

	function length(a) {
	  var x = a[0],
	      y = a[1];
	  return Math.hypot(x, y);
	}
	/**
	 * Calculates the squared length of a vec2
	 *
	 * @param {ReadonlyVec2} a vector to calculate squared length of
	 * @returns {Number} squared length of a
	 */

	function squaredLength(a) {
	  var x = a[0],
	      y = a[1];
	  return x * x + y * y;
	}
	/**
	 * Negates the components of a vec2
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a vector to negate
	 * @returns {vec2} out
	 */

	function negate(out, a) {
	  out[0] = -a[0];
	  out[1] = -a[1];
	  return out;
	}
	/**
	 * Returns the inverse of the components of a vec2
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a vector to invert
	 * @returns {vec2} out
	 */

	function inverse(out, a) {
	  out[0] = 1.0 / a[0];
	  out[1] = 1.0 / a[1];
	  return out;
	}
	/**
	 * Normalize a vec2
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a vector to normalize
	 * @returns {vec2} out
	 */

	function normalize(out, a) {
	  var x = a[0],
	      y = a[1];
	  var len = x * x + y * y;

	  if (len > 0) {
	    //TODO: evaluate use of glm_invsqrt here?
	    len = 1 / Math.sqrt(len);
	  }

	  out[0] = a[0] * len;
	  out[1] = a[1] * len;
	  return out;
	}
	/**
	 * Calculates the dot product of two vec2's
	 *
	 * @param {ReadonlyVec2} a the first operand
	 * @param {ReadonlyVec2} b the second operand
	 * @returns {Number} dot product of a and b
	 */

	function dot(a, b) {
	  return a[0] * b[0] + a[1] * b[1];
	}
	/**
	 * Computes the cross product of two vec2's
	 * Note that the cross product must by definition produce a 3D vector
	 *
	 * @param {vec3} out the receiving vector
	 * @param {ReadonlyVec2} a the first operand
	 * @param {ReadonlyVec2} b the second operand
	 * @returns {vec3} out
	 */

	function cross(out, a, b) {
	  var z = a[0] * b[1] - a[1] * b[0];
	  out[0] = out[1] = 0;
	  out[2] = z;
	  return out;
	}
	/**
	 * Performs a linear interpolation between two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a the first operand
	 * @param {ReadonlyVec2} b the second operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {vec2} out
	 */

	function lerp(out, a, b, t) {
	  var ax = a[0],
	      ay = a[1];
	  out[0] = ax + t * (b[0] - ax);
	  out[1] = ay + t * (b[1] - ay);
	  return out;
	}
	/**
	 * Generates a random vector with the given scale
	 *
	 * @param {vec2} out the receiving vector
	 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
	 * @returns {vec2} out
	 */

	function random(out, scale) {
	  scale = scale || 1.0;
	  var r = RANDOM() * 2.0 * Math.PI;
	  out[0] = Math.cos(r) * scale;
	  out[1] = Math.sin(r) * scale;
	  return out;
	}
	/**
	 * Transforms the vec2 with a mat2
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a the vector to transform
	 * @param {ReadonlyMat2} m matrix to transform with
	 * @returns {vec2} out
	 */

	function transformMat2(out, a, m) {
	  var x = a[0],
	      y = a[1];
	  out[0] = m[0] * x + m[2] * y;
	  out[1] = m[1] * x + m[3] * y;
	  return out;
	}
	/**
	 * Transforms the vec2 with a mat2d
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a the vector to transform
	 * @param {ReadonlyMat2d} m matrix to transform with
	 * @returns {vec2} out
	 */

	function transformMat2d(out, a, m) {
	  var x = a[0],
	      y = a[1];
	  out[0] = m[0] * x + m[2] * y + m[4];
	  out[1] = m[1] * x + m[3] * y + m[5];
	  return out;
	}
	/**
	 * Transforms the vec2 with a mat3
	 * 3rd vector component is implicitly '1'
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a the vector to transform
	 * @param {ReadonlyMat3} m matrix to transform with
	 * @returns {vec2} out
	 */

	function transformMat3(out, a, m) {
	  var x = a[0],
	      y = a[1];
	  out[0] = m[0] * x + m[3] * y + m[6];
	  out[1] = m[1] * x + m[4] * y + m[7];
	  return out;
	}
	/**
	 * Transforms the vec2 with a mat4
	 * 3rd vector component is implicitly '0'
	 * 4th vector component is implicitly '1'
	 *
	 * @param {vec2} out the receiving vector
	 * @param {ReadonlyVec2} a the vector to transform
	 * @param {ReadonlyMat4} m matrix to transform with
	 * @returns {vec2} out
	 */

	function transformMat4(out, a, m) {
	  var x = a[0];
	  var y = a[1];
	  out[0] = m[0] * x + m[4] * y + m[12];
	  out[1] = m[1] * x + m[5] * y + m[13];
	  return out;
	}
	/**
	 * Rotate a 2D vector
	 * @param {vec2} out The receiving vec2
	 * @param {ReadonlyVec2} a The vec2 point to rotate
	 * @param {ReadonlyVec2} b The origin of the rotation
	 * @param {Number} rad The angle of rotation in radians
	 * @returns {vec2} out
	 */

	function rotate(out, a, b, rad) {
	  //Translate point to the origin
	  var p0 = a[0] - b[0],
	      p1 = a[1] - b[1],
	      sinC = Math.sin(rad),
	      cosC = Math.cos(rad); //perform rotation and translate to correct position

	  out[0] = p0 * cosC - p1 * sinC + b[0];
	  out[1] = p0 * sinC + p1 * cosC + b[1];
	  return out;
	}
	/**
	 * Get the angle between two 2D vectors
	 * @param {ReadonlyVec2} a The first operand
	 * @param {ReadonlyVec2} b The second operand
	 * @returns {Number} The angle in radians
	 */

	function angle(a, b) {
	  var x1 = a[0],
	      y1 = a[1],
	      x2 = b[0],
	      y2 = b[1],
	      // mag is the product of the magnitudes of a and b
	  mag = Math.sqrt(x1 * x1 + y1 * y1) * Math.sqrt(x2 * x2 + y2 * y2),
	      // mag &&.. short circuits if mag == 0
	  cosine = mag && (x1 * x2 + y1 * y2) / mag; // Math.min(Math.max(cosine, -1), 1) clamps the cosine between -1 and 1

	  return Math.acos(Math.min(Math.max(cosine, -1), 1));
	}
	/**
	 * Set the components of a vec2 to zero
	 *
	 * @param {vec2} out the receiving vector
	 * @returns {vec2} out
	 */

	function zero(out) {
	  out[0] = 0.0;
	  out[1] = 0.0;
	  return out;
	}
	/**
	 * Returns a string representation of a vector
	 *
	 * @param {ReadonlyVec2} a vector to represent as a string
	 * @returns {String} string representation of the vector
	 */

	function str(a) {
	  return "vec2(" + a[0] + ", " + a[1] + ")";
	}
	/**
	 * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
	 *
	 * @param {ReadonlyVec2} a The first vector.
	 * @param {ReadonlyVec2} b The second vector.
	 * @returns {Boolean} True if the vectors are equal, false otherwise.
	 */

	function exactEquals(a, b) {
	  return a[0] === b[0] && a[1] === b[1];
	}
	/**
	 * Returns whether or not the vectors have approximately the same elements in the same position.
	 *
	 * @param {ReadonlyVec2} a The first vector.
	 * @param {ReadonlyVec2} b The second vector.
	 * @returns {Boolean} True if the vectors are equal, false otherwise.
	 */

	function equals(a, b) {
	  var a0 = a[0],
	      a1 = a[1];
	  var b0 = b[0],
	      b1 = b[1];
	  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1));
	}
	/**
	 * Alias for {@link vec2.length}
	 * @function
	 */

	var len = length;
	/**
	 * Alias for {@link vec2.subtract}
	 * @function
	 */

	var sub = subtract;
	/**
	 * Alias for {@link vec2.multiply}
	 * @function
	 */

	var mul = multiply;
	/**
	 * Alias for {@link vec2.divide}
	 * @function
	 */

	var div = divide;
	/**
	 * Alias for {@link vec2.distance}
	 * @function
	 */

	var dist = distance;
	/**
	 * Alias for {@link vec2.squaredDistance}
	 * @function
	 */

	var sqrDist = squaredDistance;
	/**
	 * Alias for {@link vec2.squaredLength}
	 * @function
	 */

	var sqrLen = squaredLength;
	/**
	 * Perform some operation over an array of vec2s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */

	var forEach = function () {
	  var vec = create();
	  return function (a, stride, offset, count, fn, arg) {
	    var i, l;

	    if (!stride) {
	      stride = 2;
	    }

	    if (!offset) {
	      offset = 0;
	    }

	    if (count) {
	      l = Math.min(count * stride + offset, a.length);
	    } else {
	      l = a.length;
	    }

	    for (i = offset; i < l; i += stride) {
	      vec[0] = a[i];
	      vec[1] = a[i + 1];
	      fn(vec, vec, arg);
	      a[i] = vec[0];
	      a[i + 1] = vec[1];
	    }

	    return a;
	  };
	}();

	var vec2 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		create: create,
		clone: clone,
		fromValues: fromValues,
		copy: copy,
		set: set,
		add: add,
		subtract: subtract,
		multiply: multiply,
		divide: divide,
		ceil: ceil,
		floor: floor,
		min: min,
		max: max,
		round: round,
		scale: scale,
		scaleAndAdd: scaleAndAdd,
		distance: distance,
		squaredDistance: squaredDistance,
		length: length,
		squaredLength: squaredLength,
		negate: negate,
		inverse: inverse,
		normalize: normalize,
		dot: dot,
		cross: cross,
		lerp: lerp,
		random: random,
		transformMat2: transformMat2,
		transformMat2d: transformMat2d,
		transformMat3: transformMat3,
		transformMat4: transformMat4,
		rotate: rotate,
		angle: angle,
		zero: zero,
		str: str,
		exactEquals: exactEquals,
		equals: equals,
		len: len,
		sub: sub,
		mul: mul,
		div: div,
		dist: dist,
		sqrDist: sqrDist,
		sqrLen: sqrLen,
		forEach: forEach
	});

	var esm = /*#__PURE__*/Object.freeze({
		__proto__: null,
		glMatrix: common,
		mat2: mat2,
		mat2d: mat2d,
		mat3: mat3,
		mat4: mat4$1,
		quat: quat,
		quat2: quat2,
		vec2: vec2,
		vec3: vec3,
		vec4: vec4
	});

	var require$$2 = /*@__PURE__*/getAugmentedNamespace(esm);

	var noise = `//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
  }
`;

	const REGL = regl$1.exports;
	const cube = cube$1;
	const { mat4 } = require$$2; // has bunch of stock standard mat's for working with matrices
	// we are using it for transformations to alter the canvas proportions so that a square is a square
	// mat4 is a matrix with 4 rows and 4 columns, (so 16 numbers) we are using a mat4 because we working with a vec4 (gl_position)
	// we want to transform the current gl_position into a new gl_position that is correctly proportioned.

	const regl = REGL({
	    extensions: ["ANGLE_instanced_arrays"] // this makes the instancing work
	});

	const instances = 100000;
	const buffer_color = [];
	const buffer_offset = [];
	const buffer_radius_scale = [];

	for (var i = 0; i < instances; i ++){
	    const col = [Math.random(), Math.random(), Math.random()];
	    // we need the offset to be between -1 and 1 so we times by two and minus one
	    const offset = [(Math.random()*2) -1, (Math.random()*2)-1, (Math.random()*2)-1 ];
	    const rad = [Math.random()/100];

	    buffer_color.push(col);
	    buffer_offset.push(offset);
	    buffer_radius_scale.push(rad);
	}
	const projection_matrix = mat4.create(); // mat4.create() returns mat4 identity (i.e. it just returns the same thing it gets in)
	const view_matrix = mat4.create(); // for camera position

	const drawPoints = regl({
	    instances: instances, // this says we want two instances (i.e. two circles)
	    count: cube.positions.length / 3, // we are no longer using elements so we are using count again
	    attributes: {
	    // attributes can be called anything, but the options they take are all the same (they have buffer and divisor). If they dont have a divisor
	    // then you can do it in an array e.g. position below:
	        position: cube.positions, // the corner points of the triangle of the three d cube. order of these is important!
	        normal: cube.normals,
	        // (regular attributes have a divisor of zero, only instance attributes have a divisor of one)
	        color: {
	            buffer: buffer_color, // red and blue
	            divisor: 1 // this turns on instancing (i.e. use the following code as a template that will be called many times)
	        },
	        offset: {
	            buffer: buffer_offset,
	            divisor: 1
	        },
	        radiusScale: {
	            buffer: buffer_radius_scale,
	            divisor: 1
	        }
	    },
	    cull: {
	        enable:false
	    },
	    uniforms: {
	        projection_matrix: ()=> projection_matrix,
	        view_matrix: ()=> view_matrix,
	        u_time: regl.context("time")
	    },
	    vert: `
        precision mediump float;
        attribute vec3 position;
        attribute vec3 normal;
        varying vec3 v_normal;
        varying vec3 v_position;
        uniform mat4 projection_matrix;
        attribute vec3 color;
        varying vec3 v_color;
        attribute vec3 offset;
        attribute float radiusScale;
        uniform float u_time;
        uniform mat4 view_matrix;

        ${noise}

        void main(){
            v_color = color;
            v_normal = normal;
            // // this says how broken up the noise is. The smaller this number the fewer bigger mountains there will be,
            // // the larger the number the more mountains they will be (and they will have more of a vertical drop)
            float noise_fragment = 100.0;
            vec3 noise_coordinate = offset * noise_fragment;
            // float noise_amplitude = snoise(vec3(noise_coordinate));
            // v_color = vec3( noise_amplitude * 0.5 + 0.5); //  * 0.5 + 0.5 this turns the numbers from (-1, 1) to (0, 1)

            vec3 offset_position = (position * radiusScale) + offset; // by timesing position by radius scale we pull in/out the corners of the square and therefore make circle bigger/smaller
            v_position = offset_position;

            // snoise returns a float
            float speed = 0.1;


            offset_position.x += snoise(vec3(noise_coordinate + 0.34));
            offset_position.y += snoise(vec3(noise_coordinate + 0.57));
            offset_position.z += snoise(vec3(noise_coordinate + 0.987));

            gl_Position = vec4(offset_position, 1.0);
            gl_Position = projection_matrix * view_matrix * gl_Position; // this is the gl position transformed by projection matrix and the view matrix
        }
    `,
	    frag: `
        precision mediump float;
        varying vec3 v_color;
        varying vec3 v_normal;
        varying vec3 v_position;
        uniform float u_time;

        void main(){

            vec3 light_position = 0.5 * vec3(
                sin(u_time),
                0.0,
                cos(u_time)
            );

            vec3 light_direction = normalize(v_position - light_position);
            float light_brightness = 0.5 + max(0.0, dot(light_direction, v_normal)); // dot product works how which surface and how much of it is being illuminated

            vec3 surface_color = light_brightness * (v_normal * 0.5 + 0.5);
        // the  * 0.5 + 0.5 is to take it from (-1, 1) to (0, 1)
            gl_FragColor = (vec4(surface_color, 1.0));

        }

    `,


	});

	function render(){
	    const green = [0.2, 0.5, 0.4, 1.0];
	    regl.clear({ color: green });
	    mat4.identity(projection_matrix); // this resets the matrix to the original mat4 identity matrix,
	    // so if we need to update the transofmraiton (e.g. for screen resize) it will just do the right amount (cos its cummulative)
	    mat4.scale(projection_matrix, projection_matrix, [0.5, 0.5, 1.0]); // projection_matrix is passed in twice because its both the matrix we are reading from and the one we are writing to
	    const ratio = window.innerWidth/ window.innerHeight;

	    const field_of_view = Math.PI/4; // 8th of a circle in radians
	    // mat4.perspective(matrix_to_alter, field_of_view, aspect_ratio, near, far);
	    mat4.perspective(projection_matrix, field_of_view, ratio, 0.01, 10.0); // adds concept of perspective (objcts getting bigger as they get closer)

	    mat4.identity(view_matrix);
	    mat4.rotateY(view_matrix, view_matrix, Date.now()/100000);

	    drawPoints();

	}

	regl.frame(render);

	return src;

})();
//# sourceMappingURL=scatter.js.map
