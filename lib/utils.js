'use strict';

var fs = require('fs'),
 shell = require('shelljs'),
 chalk = require('chalk');

var isWin = (process.platform === 'win32');

exports.isWin = isWin;

exports.Progress = function() {

  var interval,
      counter;

  function printMessage() {

    switch(counter) {

      case 0:
        console.log('Use `vulgar --help` from command line for all CLI '
          +  'options');
        break;

      case 1:
        console.log('Be sure to checkout out all of the docs on the Github '
          +  'repo');
        break;

      case 2:
        console.log('This installation may take a little while depending '
          +  'on your connection speed');
        break;

      case 15:
        console.log('Seems a bit laggy to me. Check your internet connection');
        break;

      default:
        console.log('Still cloning source repository. Please stand by... ');
        break;
    }
    counter++;
  }

  return {
    start: function() {
      counter = 0;
      interval = setInterval(printMessage, 3000);
    },
    stop: function() {
      clearInterval(interval);
    }
  };
};

exports.loadPackageJson = function(path, callback) {
  fs.readFile(path, function(err, data) {

    if(err)
      return callback(err);

    try {

      var pack = JSON.parse(data.toString());
      pack.vulgarVersion = pack.vulgar || pack.version;
      callback(null, pack);
    } catch (err) {
      return callback(err);
    }
  });
};

exports.checkNpmPermission = function (callback) {

  var homeDir = process.env[isWin ? 'USERPROFILE' : 'HOME'];
  var findCmd = 'find ';

  var whichNpm = shell.which('npm');

  if (whichNpm.indexOf('.nvm' > -1)) {

    var whichNode = shell.which('node');

    findCmd += whichNode.slice(0, -5) + '/npm -user root';
  } else {

    findCmd = 'find ' + homeDir + '/.npm ' + '-user root';
  }

  shell.exec(findCmd, function( status, output){
    var hasRootFiles = output.split(/\r\n|\r|\n/).length;
    if (hasRootFiles > 1){
      console.log (chalk.red('There are ' + hasRootFiles + ' files in your ~/.npm owned by root'));
      console.log(chalk.green('Please change the permissions by running -'), 'chown -R `whoami` ~/.npm ');
	    return callback('Root permissions in ~/.npm');
    }
  });

  callback();
}

var vulgarJsonPath = exports.vulgarJsonPath = function() {

  var file = (process.platform === 'win32')
               ? '_vulgar'
               : '.vulgar';

  var path = getUserHome() + '/' + file;

  return path;
}

var readToken = exports.readToken = function() {

  var token;

  var path = vulgarJsonPath();

  if(!shell.test('-e', path))
    return null;

  var data = fs.readFileSync(path);

  try {

    var json = JSON.parse(data.toString());
    token = json.token;

  } catch (err) {

    console.log('Error: ');
    console.log(err);

    token = shell.cat(path);

    token = token.replace(/(\r\n|\n|\r)/gm,'');
  }

  return token;
};

exports.readVulgarSync = function(param) {

  var value;

  var path = vulgarJsonPath();

  if(!shell.test('-e', path))
    return null;

  var data = fs.readFileSync(path);

  try {
    var json = JSON.parse(data.toString());
    value = json[param];
  } catch(err) {
    value = null;
  }

  return value;
};

function getUserHome() {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

exports.updateGlobalVulgarJson = function(values, callback) {

  var path = vulgarJsonPath();

  fs.lstat(path, function(err, stat) {

    if(err || !stat) {

      writeVulgarJson(path, values, function() {

        callback();
      });
    } else {

      fs.readFile(path, function(err, file) {

        if(err) {

          console.log('Error: ');
          console.log(err);

          return callback(err);
        }

        try {

          var json = JSON.parse(file.toString());

          for(var index in values) {

            json[index] = values[index];
          }

          writeVulgarJson(path, json, function(err) {

            callback(err);
          });
        } catch(err) {

          console.log('Error:');
          console.log(err);

          var data = {};

          data = values;
          data.token = readToken();

          writeVulgarJson(path, data, function(err) {
            callback(err);
          });
        }
      });
    }
  });
};

function writeVulgarJson(path, data, callback) {

  fs.writeFile(path, JSON.stringify(data, null, 4), function(err) {

    callback(err);
  });
}

exports.updateVulgarJson = function(path, values, callback) {

  fs.readFile(path, function(err, file) {

    if (err) {

      return callback(err);
    }

    var json = JSON.parse(file.toString());

    for(var index in values) {

      json[index] = values[index];
    }

    writeVulgarJson(path, json, function(err) {
      callback(err);
    });
  });
}
