module.exports = {
  BuildASM: function (input_path, lwtools_path) {
    try {
      var bin_path = input_path.substring(0, input_path.lastIndexOf(".")) + ".BIN";
      var lwasm_command = '"' + lwtools_path + '\\lwasm.exe" "' + input_path + '" --6809 --list --symbols --6800compat --output="' +
        bin_path + '" --format=decb';

      var buildProcess = require('child_process');
      buildProcess.execSync(lwasm_command, { maxBuffer: 1024 * 500 }, function (err, stdout, stderr) {
        if (err) {
          console.error(err);
          return;
        }
        console.log(stdout);
      })
    } catch (exc) {
      return 0;
    }
    return 1;
  },
  CopyToDSK: function (file_path, DSK_path, toolshed_path, opts) {
    try {
      var file_name = file_path.substring(file_path.lastIndexOf("\\") + 1);
      file_name = file_name.toUpperCase();
      var debc_command = toolshed_path + '\\decb.exe copy ' + opts + ' "' + file_path + '" -r "' + DSK_path + '",' + file_name;

      var debc = require('child_process');
      debc.execSync(debc_command, function (err, stdout, stderr) {
        if (err) {
          console.error(err);
          return;
        }
        console.log(stdout);
        process.exit(0);
      })
    }
    catch (exc) {
      console.log(exc);
      return 0;
    }
    return 1;
  },
  LaunchEmulator: function (emulator_path, disk_path) {
    var childProcess = require('child_process');
    try {
      childProcess.exec(emulator_path + ' ' + disk_path, function (err, stdout, stderr) {
        if (err) {
          console.error(err);
          return;
        }
        console.log(stdout);
        process.exit(0);
      })
    } catch (exc) {
      console.log(exc);
    }
  }
};