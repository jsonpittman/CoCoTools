const vscode = require('vscode');
const workbenchConfig = vscode.workspace.getConfiguration('cocotools');

var emulator_path = workbenchConfig.get('emulatorPath');
var emulator_flags = workbenchConfig.get('emulatorFlags');
var toolshed_path = workbenchConfig.get('toolshedPath');
var toolshed_add_flags = workbenchConfig.get('toolshedAddFileFlags');
var toolshed_create_flags = workbenchConfig.get('toolshedCreateDiskFlags');
var cmoc_path = workbenchConfig.get('cmocExecutablePath');
var cmoc_flags = workbenchConfig.get('cmocFlags');
var cmoc_cygwin = workbenchConfig.get('cmocCygwin');
var disk_path = workbenchConfig.get('diskPath');
var lwtools_path = workbenchConfig.get('lwtoolsExecutablePath');
var lwtools_flags = workbenchConfig.get('lwtoolsFlags');
var recreateDskOnEachBuild = workbenchConfig.get('recreateDskOnEachBuild');
var toolshed_add_basic_options = workbenchConfig.get('toolshedAddBasicFileOptions');
var toolshed_add_bin_options = workbenchConfig.get('toolshedAddBinFileOptions');

// var emulator_flags = workbenchConfig.get('emulatorflags');
// var emulator_flags = workbenchConfig.get('emulatorflags');

const tools = require('./tools');
const path = require('path');

// mame coco3 -menu -skip_gameinfo -window -flop1 [DSK_path] -autoboot_delay 1 -autoboot_command "\nLOADM"[file_name]":EXEC\n"


function LoadOptions() {
    // toolshed_path = workbenchConfig.get('toolshedpath');
    // lwtools_path = workbenchConfig.get('lwtoolspath');
    // emulator_path = workbenchConfig.get('emulatorpath');
    // disk_path = workbenchConfig.get('dskpath');
    // emulator_flags = workbenchConfig.get('emulatorflags');
};

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
        LoadOptions();

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
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        LoadOptions();
        editor.document.save();

        var file_name = vscode.window.activeTextEditor.document.fileName

        if(recreateDskOnEachBuild)
            tools.CreateDSK(disk_path, toolshed_path, toolshed_create_flags);

        switch (path.extname(file_name).toUpperCase()) {
            case '.ASM':
                var bin_path = file_name.substring(0, file_name.lastIndexOf(".")) + ".BIN";
                var res = tools.BuildASM(file_name, lwtools_path, lwtools_flags);
                if (res == 1) {
                    vscode.window.showInformationMessage('Build Succeeded!');
                    var res = tools.CopyToDSK(bin_path, disk_path, toolshed_path, toolshed_add_flags, toolshed_add_bin_options);
                    if (res == 1)
                        vscode.window.showInformationMessage('File Added!');
                    else
                        vscode.window.showErrorMessage('File Add Failed!');
                }
                else
                    vscode.window.showErrorMessage('Build Failed!');
                break;
            case '.C':
                var bin_path = file_name.substring(0, file_name.lastIndexOf(".")) + ".BIN";
                var res = tools.BuildC(file_name, cmoc_path, cmoc_flags, false);
                if (res == 1) {
                    vscode.window.showInformationMessage('Build Suceeded!');
                    var res = tools.CopyToDSK(bin_path, disk_path, toolshed_path, toolshed_add_flags, toolshed_add_bin_options);
                    if (res == 1)
                        vscode.window.showInformationMessage('File Added!');
                    else
                        vscode.window.showErrorMessage('File Add Failed!');
                }
                else
                    vscode.window.showErrorMessage('Build Failed!');
                break;
            case '.BAS':
                var res = tools.CopyToDSK(file_name, disk_path, toolshed_path, toolshed_add_flags, toolshed_add_basic_options);
                if (res == 1)
                    vscode.window.showInformationMessage('File Added!');
                else
                    vscode.window.showErrorMessage('File Add Failed!');
                break;
        }

        tools.LaunchEmulator(emulator_path, disk_path, emulator_flags, file_name);
    });

    context.subscriptions.push(cocoemulator);

    let cocoemulatorall = vscode.commands.registerCommand('cocotools.cocoemulatorall', function () {
        LoadOptions();
        var fs = require('fs');
        var file_name = vscode.window.activeTextEditor.document.fileName;
        var error = false;

        if (recreateDskOnEachBuild) {
            var res = tools.CreateDSK(disk_path, toolshed_path, toolshed_create_flags);
            if (res == 0)
                error = true;
        }

        if (!error) {
            var input_dir = path.dirname(file_name) + '\\';
            fs.readdirSync(input_dir).forEach(file => {
                //var orig_file_name = file;
                file = input_dir + file;
                switch (path.extname(file).toUpperCase()) {
                    case '.ASM':
                        var res = tools.BuildASM(file, lwtools_path, lwtools_flags);
                        if (res == 0) {
                            error = true;
                            break;

                        }
                    // if (res == 1)
                    //     vscode.window.showInformationMessage(orig_file_name + ': Build Suceeded!');
                    // else
                    // {
                    //     vscode.window.showErrorMessage(orig_file_name + ': Build Failed!');
                    //     error=true;
                    //     break;
                    // }
                    // break;
                    case '.C':
                        var res = tools.BuildC(file, cmoc_path);
                        // if (res == 1)
                        //     vscode.window.showInformationMessage(orig_file_name + ': Build Suceeded!');
                        // else
                        // {
                        //     vscode.window.showErrorMessage(orig_file_name + ': Build Failed!');
                        //     error=true;
                        //     break;
                        // }

                        if (res == 0) {
                            error = true;
                            break;
                        }
                    // break;
                }
            });
        }

        if (!error) {
            fs.readdirSync(input_dir).forEach(file => {
                var orig_file_name = file;
                file = input_dir + file;
                switch (path.extname(file).toUpperCase()) {
                    case '.BAS':
                        var res = tools.CopyToDSK(file, disk_path, toolshed_path, toolshed_add_flags, toolshed_add_basic_options);
                        // if (res == 1)
                        //     vscode.window.showInformationMessage(orig_file_name + ': File Added!');
                        // else
                        //     vscode.window.showErrorMessage(orig_file_name + ': File Add Failed!');
                        if (res == 0) {
                            vscode.window.showErrorMessage(orig_file_name + ': File Add Failed!');
                            error = true;
                        }
                        break;
                    case '.BIN':
                        var res = tools.CopyToDSK(file, disk_path, toolshed_path, toolshed_add_flags, toolshed_add_bin_options);
                        // if (res == 1)
                        //     vscode.window.showInformationMessage(orig_file_name + ': File Added!');
                        // else
                        //     vscode.window.showErrorMessage(orig_file_name + ': File Add Failed!');
                        if (res == 0) {
                            vscode.window.showErrorMessage(orig_file_name + ': File Add Failed!');
                            error = true;
                        }
                        break;
                }
            });
        }

        if (!error) {
            tools.LaunchEmulator(emulator_path, disk_path, emulator_flags, file_name);
        }
    });

    context.subscriptions.push(cocoemulatorall);

    let renumber = vscode.commands.registerCommand('cocotools.renumber', function () {
        LoadOptions();
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

        linelist.forEach(line => {
            let goto = line.line_str.indexOf("GOSUB");
            if (goto > -1) {
                let gonum = line.line_str.match(/GOSUB \d+/)[0];
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
                //console.log("LINE: " + linelist[ls].new_str);
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