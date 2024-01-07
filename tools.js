module.exports = {
  LaunchXroar: function (emulator_path, launch_dir, snapshot_path) {
    var run_path = emulator_path + " -load " + snapshot_path;
    var childProcess = require('child_process');
    try {
      if (!process.platform === 'win32')
        run_path = "./" + run_path;

      childProcess.exec(run_path, { cwd: launch_dir });
    } catch (exc) {
      var vscode = require('vscode');
      vscode.window.showErrorMessage("Error launching emulator: " + exc.stdout.toString());
    }
  }
};