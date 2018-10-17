const fs = require('fs');
const path = require('path');
const yauzl = require('yauzl');
const zipdir = require('zip-dir');

const DEX = 'dex';
const SMALI = 'smali';
const JAVA_BINARY = 'classFiles';
const JAVA = 'java';

const DEX2JAR = path.join(__dirname, 'library', 'dex2jar-2.0', 'd2j-dex2jar.bat');
const DEX2SMALI = 'java -jar ' + path.join(__dirname, 'library', 'smali', 'baksmali-2.2.5.jar') + ' d';
const CLASS2JAVA = 'java -jar ' + path.join(__dirname, 'library', 'procyon', 'decompiler.jar')

let dexPath, classPath, smaliPath, javaPath;

function main() {
  console.log('--------------------------------');
  if (process.argv.length != 4) {
    console.log('Missing arguments: This program recieves the apkSource and the destination folder');
    console.log('--------------------------------');
    return;
  }
  var apkSource = process.argv[2];
  var destination = process.argv[3];
  decompile(apkSource, destination);
}

function verifyExistence(folder) {
  if (!fs.existsSync(folder)) {
    console.log(folder + ' didn\'t exist, creating...');
    fs.mkdirSync(folder);
  }
}

function decompile(apkSource, destination) {
  console.log('Going to decompile apk in ' + apkSource);
  console.log(' and put the results in ' + destination);
  if (!fs.existsSync(apkSource)) {
    console.log('invalid apk source: ' + apkSource);
    return;
  }
  var dirs = [
    path.join(__dirname, destination),
    dexPath = path.join(__dirname, destination, DEX),
    classPath = path.join(__dirname, destination, JAVA_BINARY),
    smaliPath = path.join(__dirname, destination, SMALI),
    javaPath = path.join(__dirname, destination, JAVA)
  ];
  for (var i in dirs) {
    var d = dirs[i];
    verifyExistence(d);
  }
  extractDex(apkSource, dirs[1], (dexFiles) => {
      let promises = [];
      for (let i in dexFiles) {
        runBat(DEX2JAR, dexFiles[i], classPath).then(() => {
          let dexName = dexFileBaseName(dexFiles[i]);
          let savedClassPath = path.join(classPath, dexName);
          classesToJar(savedClassPath, (jarPath) => {
            return convertClassToJava(dexName, javaPath, jarPath);
          });
        });
        dex2smali(dexFiles[i], smaliPath);
      }
  });
  // fs.createReadStream(apkSource).pipe(unzip.Extract({ path: destination }));
}

function classesToJar(classesPath, callback) {
  let jarPath = classesPath + '.jar';
  return zipdir(classesPath, { saveTo: jarPath }, (err, buffer) => {
    console.log('zipped ' + classesPath + ' to ' + jarPath);
    callback(jarPath);
  });
}

function dexFileBaseName(dexFile) {
  return path.basename(dexFile).split('.')[0];
}

function convertClassToJava(name, destinationFolder, jarPath) {
  let dest = path.join(destinationFolder, name);
  verifyExistence(dest);
  let command = CLASS2JAVA + ' -jar ' + jarPath + ' -o ' + dest;;
  return runCmd(command);
}

function dex2smali(dexFile, destinationFolder) {
  let name = dexFileBaseName(dexFile);
  let dest = path.join(destinationFolder, name);
  verifyExistence(dest);
  let command = DEX2SMALI + ' ' + dexFile + ' -o ' + dest;
  return runCmd(command);
}

function runCmd(cmd) {
  return execp(cmd, {
      stdout: process.stdout,
      stderr: process.stderr
  });
}

function runBat(batFile, fileParam, destinationFolder) {
  let name = dexFileBaseName(fileParam);
  let dest = path.join(destinationFolder, name);
  verifyExistence(dest);
  let command = batFile + ' ' + fileParam + ' -o ' + dest + ' --force';
  return runCmd(command);
}

function extractDex(apkSource, destination, done) {
	// extract classes.dex from apk into outputdir.
  console.log('DEX destination: ' + destination);
	var yauzl = require('yauzl');
  var dexFiles = [];
	yauzl.open(apkSource, { lazyEntries: false }, function(err,zipfile) {
		if (err) throw err;
		//  zipfile.readEntry();
		zipfile.on('entry', function(entry) {
			if (!/\/$/.test(entry.fileName)) {
				// file
				zipfile.openReadStream(entry, function(err2, readStream) {
					if (err2) throw err2;
          var parts = entry.fileName.split('.');
          var ext = parts[parts.length - 1];
					if (ext == 'dex') {
            var destinationFile = path.join(destination, entry.fileName);
						readStream.pipe(fs.createWriteStream(destinationFile));
            dexFiles.push(destinationFile);
					}
				});
			}
		});
    zipfile.once("end", function() {
      zipfile.close();
      console.log('Done extracting dex');
      console.log(dexFiles);
      done(dexFiles);
    });
	});
};

function execp(cmd, opts) {
    var exec = require('child_process').exec, child;
    opts || (opts = {});
    return new Promise((resolve, reject) => {
        const child = exec(cmd, opts,
            (err, stdout, stderr) => err ? reject(err) : resolve({
                stdout: stdout,
                stderr: stderr
            }));

        if (opts.stdout) {
            child.stdout.pipe(opts.stdout);
        }
        if (opts.stderr) {
            child.stderr.pipe(opts.stderr);
        }
    });
}

main();
