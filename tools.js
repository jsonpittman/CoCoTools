module.exports = {
  BuildASM: function (input_path, lwtools_path, lwtools_args) {
    //try {
    var bin_path = input_path.substring(0, input_path.lastIndexOf(".")) + ".BIN";
    //var lwasm_command = '"' + lwtools_path + '\\lwasm.exe" "' + input_path + '" --6809 --list --symbols --6800compat --output="' + bin_path + '" --format=decb';
    lwtools_args = lwtools_args.replace('[input_path]', input_path);
    lwtools_args = lwtools_args.replace('[output_path]', bin_path);
    var lwasm_command = '"' + lwtools_path + '" ' + lwtools_args;


    var buildProcess = require('child_process');
    try {
      buildProcess.execSync(lwasm_command, { maxBuffer: 1024 * 500 }, function (err, stdout, stderr) {
        if (err) {
          console.log(stdout);
          console.error(err);
          return;
        }
        console.log(stdout);
      })
    } catch (exc) {
      const vscode = require('vscode');
      vscode.window.showErrorMessage(exc.message);
      return 0;
    }
    return 1;
  },
  BuildC: function (input_path, cmoc_path, cmoc_flags, remap_cygwin) {
    try {
      var friendly_path = "";

      if (remap_cygwin == true) {
        friendly_path = "/cygdrive/";   //  Cygwin
        //friendly_path = "/mnt/";          //  WSL
        friendly_path += input_path.replace(/\\/g, "/");
        friendly_path = friendly_path.replace(":", "");
        friendly_path = friendly_path.substring(0, friendly_path.lastIndexOf("."));
      }
      else {
        friendly_path = input_path.substring(0, input_path.lastIndexOf("."));
      }

      var bin_path = friendly_path + ".BIN";
      var source_path = friendly_path + ".c";

      cmoc_flags = cmoc_flags.replace("[output_path]", bin_path);
      cmoc_flags = cmoc_flags.replace("[input_path]", source_path);

      var cmoc_command = cmoc_path + ' ' + cmoc_flags;

      var buildProcess = require('child_process');
      buildProcess.execSync(cmoc_command);
    } catch (exc) {
      const vscode = require('vscode');
      var err = exc.stdout.toString();
      vscode.window.showErrorMessage(err);
      return 0;
    }
    return 1;
  },
  CreateDSK(DSK_path, toolshed_path, toolshed_flags) {
    toolshed_flags = toolshed_flags.replace('[DSK_path]', DSK_path);
    var fs = require('fs');
    var path = require('path');

    try {
      fs.unlink(DSK_path, (err) => {
        if (err) throw err;
        console.log(DSK_path + ' was deleted');
      });

      var toolshed_command = '"' + path.join(toolshed_path, "decb") + '" ' + toolshed_flags;


      var buildProcess = require('child_process');
      buildProcess.execSync(toolshed_command);
    }
    catch (exc) {
      var vscode = require('vscode');
      vscode.window.showErrorMessage("Error Creating DSK: " + exc.stdout.toString());
      return 0;
    }
  },
  CopyToDSK: function (file_path, DSK_path, toolshed_path, toolshed_flags, file_options) {
    var path = require('path');

    try {
      // if (!toolshed_path.endsWith("/"))
      //   toolshed_path += "/";

      var file_name = path.basename(file_path).toUpperCase();

      // file_path.substring(file_path.lastIndexOf("/") + 1);
      // file_name = file_name.toUpperCase();

      //var debc_command = toolshed_path + '\\decb.exe copy ' + opts + ' "' + file_path + '" -r "' + DSK_path + '",' + file_name;
      toolshed_flags = toolshed_flags.replace("[file_path]", file_path);
      toolshed_flags = toolshed_flags.replace("[file_name]", file_name);
      toolshed_flags = toolshed_flags.replace("[DSK_path]", DSK_path);
      toolshed_flags = toolshed_flags.replace("[file_opts]", file_options);

      var debc_command = '"' + path.join(toolshed_path, "decb") + '" ' + toolshed_flags;

      var debc = require('child_process');
      debc.execSync(debc_command);
    }
    catch (exc) {
      var vscode = require('vscode');
      vscode.window.showErrorMessage("Error copying to DSK: " + exc.stdout.toString());
      return 0;
    }
    return 1;
  },
  LaunchEmulator: function (emulator_path, disk_path, emulator_flags, file_name, run_command) {
    emulator_flags = emulator_flags.replace("[DSK_path]", disk_path);

    if (run_command.length > 0) {
        emulator_flags += run_command.replace("[file_name]", file_name);
    }

    // if(file_name.length > 0 && emulator_flags.length > 0)
    //   if(file_name.toUpperCase().endsWith('.BIN'))
    //     emulator_flags += ' -autoboot_command "\nLOADM\"' + file_name + '\":EXEC\n"';
    //   else if(file_name.toUpperCase().endsWith('.BAS'))
    //     emulator_flags += ' -autoboot_delay 1 -autoboot_command "RUN\\\"' + file_name + '\\\""';

    var run_path = emulator_path + ' ' + emulator_flags;

    var childProcess = require('child_process');
    try {
      childProcess.exec(run_path);
    } catch (exc) {
      var vscode = require('vscode');
      vscode.window.showErrorMessage("Error launching emulator: " + exc.stdout.toString());
    }
  }
};