const vscode = require('vscode');

class Bas_Line {
    // object to represent a line of basic code,
    // with original and new line numbers

    constructor(line_num, line_str) {
        this._line_num = line_num;
        this._line_str = line_str;
    }
    set new_line_num(new_line_num) {
        this._new_line_num = new_line_num;
    }
    set line_str(new_line_str) {
        this._line_str = new_line_str;
    }
    get line_str() {
        return this._line_str;
    }
    get new_str() {
        //return the line with new line number
        return this.line_str.replace(this.line_num, this.new_line_num);
    }
    get line_num() {
        return this._line_num;
    }
    get new_line_num() {
        return this._new_line_num;
    }
}

function GetNewLineNum(lines, original_line_num) {
    var return_num = 0;
    lines.forEach(line => {
        if (line.line_num == original_line_num) {
            return_num = line.new_line_num;
        }
    });
    return return_num;
}

function activate(context) {
    

    let comment = vscode.commands.registerCommand('cocotools.comment', function () {

        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }

        let edit = new vscode.WorkspaceEdit();
        let selection = editor.selection;
        var ls;

        for (ls = 0; ls < editor.document.lineCount; ls++) {
            let line = editor.document.lineAt(ls);
            if (line.text.trimRight().length > 0) {
                if (ls >= selection.start.line && ls <= selection.end.line) {
                    let line_num = line.text.match(/\d+/)[0];
                    let line_str = line.text.replace(line_num, line_num + " REM");
                    edit.replace(editor.document.uri, line.range, line_str);
                }
            }
        }

        vscode.workspace.applyEdit(edit);

        vscode.window.showInformationMessage('Code Commented!');
    }
    );

    context.subscriptions.push(comment);

    let cocoemulator = vscode.commands.registerCommand('cocotools.cocoemulator', function () {
        const workbenchConfig = vscode.workspace.getConfiguration('cocotools');
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        editor.document.save();

        //"decb copy -1 -a -t %%G -r %disk_path%,!filename!"
        var toolshed_path =  "C:\\Users\\jpittman\\OneDrive\\CoCo\\TOOLS\\toolshed";
        const emulator_path = workbenchConfig.get('emulatorpath');
        var file_path = editor.document.fileName;
        var file_name = file_path.substring(file_path.lastIndexOf("\\") + 1);
        file_name = file_name.toUpperCase();
        var disk_path = "C:\\Users\\jpittman\\OneDrive\\CoCo\\DATA_FILES\\DISKS\\JASON1.DSK";
        var debc_command = toolshed_path + '\\decb.exe copy -1 -a -t "' + file_path + '" -r "' + disk_path + '",' + file_name;

        //run debc asyncronously...add .bas to .dsk and wait for exit
        var debc = require('child_process');
        debc.execSync(debc_command, function (err, stdout, stderr) {
            if (err) {
                console.error(err);
                return;
            }
            console.log(stdout);
            process.exit(0);
        })

        //launch emulator
        var childProcess = require('child_process');
        childProcess.exec(emulator_path + ' ' + disk_path + '"', function (err, stdout, stderr) {
            if (err) {
                console.error(err);
                return;
            }
            console.log(stdout);
            process.exit(0);
        })
    }
    );

    context.subscriptions.push(cocoemulator);

    function launch_decb(debc_cmd) {
        this.execCommand = function (cmd, callback) {
            exec(debc_cmd, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }

                callback(stdout);
            });
        }
    }

    let renumber = vscode.commands.registerCommand('cocotools.renumber', function () {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }

        var linelist = []; //list of Bas_Line objects...one for each line of basic code

        let edit = new vscode.WorkspaceEdit();
        var ls;

        //build array of old and new line numbers
        for (ls = 0; ls < editor.document.lineCount; ls++) {
            let line = editor.document.lineAt(ls);
            if (line.text.trimRight().length > 0) {
                let line_num = parseInt(line.text.match(/\d+/)[0]);
                let line_str = line.text.substring(line_num.length);

                var l = new Bas_Line(line_num, line_str);
                linelist.push(l);
            }
        }

        var line_start = 10;
        linelist.forEach(line => {
            line.new_line_num = line_start;
            line_start += 10;
        });

        linelist.forEach(line => {
            let goto = line.line_str.indexOf("GOTO");
            if (goto > -1) {
                let gonum = line.line_str.match(/GOTO \d+/)[0];
                if (gonum.length > 0) {
                    let line_num = gonum.match(/\d+/)[0];
                    let new_num = GetNewLineNum(linelist, line_num);
                    let newgonum = gonum.replace(line_num, new_num);
                    line.line_str = line.line_str.replace(gonum, newgonum);
                }
            }
        });

        for (ls = 0; ls < linelist.length; ls++) {
            let line = editor.document.lineAt(ls);
            if (line.text.trimRight().length > 0) {
                console.log("LINE: " + linelist[ls].new_str);
                edit.replace(editor.document.uri, line.range, linelist[ls].new_str);
            }
        }

        vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage('Code Renumber Complete!');
    }
    );

    context.subscriptions.push(renumber);
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;