// Copyright & License details are available under JXCORE_LICENSE file

var util = require('util');
var isAndroid = process.platform === 'android';
var $tw;
if (isAndroid) {
  $tw = process.binding("jxutils_wrap");
}

function Console(stdout, stderr) {
  if (!(this instanceof Console)) { return new Console(stdout, stderr); }
  if (!isAndroid) {
    if (!stdout || typeof stdout.write !== 'function') { throw new TypeError(
            'Console expects a writable stream instance'); }
  }
  if (!stderr) {
    stderr = stdout;
  }
  var prop = {
    writable: true,
    enumerable: false,
    configurable: true
  };
  prop.value = stdout;
  Object.defineProperty(this, '_stdout', prop);
  prop.value = stderr;
  Object.defineProperty(this, '_stderr', prop);
  prop.value = {};
  Object.defineProperty(this, '_times', prop);

  // bind the prototype functions to this Console instance
  Object.keys(Console.prototype).forEach(function(k) {
    this[k] = this[k].bind(this);
  }, this);
}

var customLogInterface = null, customErrorInterface = null;
Console.prototype.customInterface = function(log_interface, error_interface) {
  customLogInterface = log_interface;
  if (error_interface) {
    customErrorInterface = error_interface;
  } else {
    customErrorInterface = log_interface;
  }
};

Console.prototype._log = function(msg) {
  if (!isAndroid) {
    this._stdout.write(msg);
  } else {
    $tw.print(msg);
  }
};

Console.prototype.log = function() {
  var msg = util.format.apply(this, arguments) + '\n';
  this._log(msg);

  if (customLogInterface) {
    try {
      customLogInterface(msg);
    } catch (e) {
    }
  }
};

Console.prototype.info = Console.prototype.log;

Console.prototype.warn = function() {
  var msg = util.format.apply(this, arguments) + '\n'
  if (!isAndroid) {
    this._stderr.write(msg);
  } else {
    $tw.print_err_warn(msg, false);
  }

  if (customErrorInterface) {
    try {
      customErrorInterface(msg);
    } catch (e) {
    }
  }
};

Console.prototype.error = function() {
  var msg = util.format.apply(this, arguments) + '\n'
  if (!isAndroid) {
    this._stderr.write(msg);
  } else {
    $tw.print_err_warn(msg, true);
  }

  if (customErrorInterface) {
    try {
      customErrorInterface(msg);
    } catch (e) {
    }
  }
};

Console.prototype.dir = function(object) {
  if (!isAndroid) {
    this._stdout.write(util.inspect(object) + '\n');
  } else {
    $tw.print(util.inspect(object) + '\n');
  }
};

Console.prototype.time = function(label) {
  this._times[label] = Date.now();
};

Console.prototype.timeEnd = function(label) {
  var time = this._times[label];
  if (!time) { throw new Error('No such label: ' + label); }
  var duration = Date.now() - time;
  this.log('%s: %dms', label, duration);
};

Console.prototype.trace = function() {
  var err = new Error;
  err.name = 'Trace';
  err.message = util.format.apply(this, arguments);
  Error.captureStackTrace(err, arguments.callee);
  if (process.versions.v8)
    this.error(err.stack);
  else if (process.versions.sm)
    this.error(err.stack.toString());
  else
    process
            .binding("jxutils_wrap")
            .print(
                    "console.trace couldn't identify the actual JavaScript engine. Did you overwrite 'process.versions' ?");
};

Console.prototype.assert = function(expression) {
  if (!expression) {
    var arr = Array.prototype.slice.call(arguments, 1);
    require('assert').ok(false, util.format.apply(this, arr));
  }
};

module.exports = new Console(process.stdout, process.stderr);
module.exports.Console = Console;