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
var renumber_increment = workbenchConfig.get('renumberIncrement');

const tools = require('./tools');
const path = require('path');

// mame coco3 -menu -skip_gameinfo -window -flop1 [DSK_path] -autoboot_delay 1 -autoboot_command "\nLOADM"[file_name]":EXEC\n"


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

function Renumber(lines, keyword) {
    lines.forEach(line => {
        let goto = line.line_str.indexOf(keyword);
        if (goto > -1) {
            var match = new RegExp(keyword + '\\ ?\\d+', 'g');
            let gonum = line.line_str.match(match);
            if (gonum != null && gonum.length > 0) {
                for (var x = 0; x < gonum.length; x++) {
                    var m = gonum[x].match(/\d+/);
                    for (var y = 0; y < m.length; y++) {
                        let line_num = m[y];
                        let new_num = GetNewLineNum(lines, line_num);
                        let newgonum = gonum[x].replace(line_num, new_num);
                        line.line_str = line.line_str.replace(gonum, newgonum);
                    }
                }
            }
        }
    });
    return lines;
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
    let cocoemulator = vscode.commands.registerCommand('cocotools.cocoemulator', function () {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        else
            editor.document.save().then(() => {
                var error = false;

                var file_name = vscode.window.activeTextEditor.document.fileName

                if (recreateDskOnEachBuild)
                    tools.CreateDSK(disk_path, toolshed_path, toolshed_create_flags);

                var bin_path;

                switch (path.extname(file_name).toUpperCase()) {
                    case '.ASM':
                        bin_path = file_name.substring(0, file_name.lastIndexOf(".")) + ".BIN";
                        var res = tools.BuildASM(file_name, lwtools_path, lwtools_flags);
                        if (res == 0) {
                            error=true;
                        }
                        else {
                            var res = tools.CopyToDSK(bin_path, disk_path, toolshed_path, toolshed_add_flags, toolshed_add_bin_options);
                            if (res == 1)
                                vscode.window.showInformationMessage('File Added!');
                            else
                                vscode.window.showErrorMessage('File Add Failed!');
                        }
                        break;
                    case '.C':
                        bin_path = file_name.substring(0, file_name.lastIndexOf(".")) + ".BIN";
                        var res = tools.BuildC(file_name, cmoc_path, cmoc_flags, false);
                        if (res == 0) {
                            error = true;
                        }
                        else {
                            var res = tools.CopyToDSK(bin_path, disk_path, toolshed_path, toolshed_add_flags, toolshed_add_bin_options);
                            if (res == 1)
                                vscode.window.showInformationMessage('File Added!');
                            else
                                vscode.window.showErrorMessage('File Add Failed!');
                        }
                        // if (res == 1) {
                        //     vscode.window.showInformationMessage('Build Suceeded!');
                        //     var res = tools.CopyToDSK(bin_path, disk_path, toolshed_path, toolshed_add_flags, toolshed_add_bin_options);
                        //     if (res == 1)
                        //         vscode.window.showInformationMessage('File Added!');
                        //     else
                        //         vscode.window.showErrorMessage('File Add Failed!');
                        // }
                        // else
                        //     vscode.window.showErrorMessage('Build Failed!');
                        // break;
                        break;

                    case '.BAS':
                        var res = tools.CopyToDSK(file_name, disk_path, toolshed_path, toolshed_add_flags, toolshed_add_basic_options);
                        bin_path = file_name.substring(0, file_name.lastIndexOf(".")) + ".BAS";
                        if (res == 1)
                            vscode.window.showInformationMessage('File Added!');
                        else
                            vscode.window.showErrorMessage('File Add Failed!');
                        break;
                }

                if (!error)
                    tools.LaunchEmulator(emulator_path, disk_path, emulator_flags, path.basename(bin_path));

            })


    });

    context.subscriptions.push(cocoemulator);

    let cocoemulatorall = vscode.commands.registerCommand('cocotools.cocoemulatorall', function () {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        else
            editor.document.save().then(() => {
                var fs = require('fs');
                var file_name = vscode.window.activeTextEditor.document.fileName;
                var error = false;
                if (recreateDskOnEachBuild) {
                    var res = tools.CreateDSK(disk_path, toolshed_path, toolshed_create_flags);
                    if (res == 0)
                        error = true;
                }

                var dir_tail = "\\";
                if (file_name.startsWith('/'))
                    dir_tail = "/"; // UNIX path

                if (!error) {
                    var input_dir = path.dirname(file_name) + dir_tail;
                    fs.readdirSync(input_dir).forEach(file => {
                        //var orig_file_name = file;
                        file = input_dir + file;
                        switch (path.extname(file).toUpperCase()) {
                            case '.ASM':
                                var res = tools.BuildASM(file, lwtools_path, lwtools_flags);
                                if (res == 0) {
                                    error = true;
                                }
                                break;

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
                                var res = tools.BuildC(file, cmoc_path, cmoc_flags, cmoc_cygwin);
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
                                }
                                // break;
                                break;

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
                    tools.LaunchEmulator(emulator_path, disk_path, emulator_flags);
                }
            })
    });

    context.subscriptions.push(cocoemulatorall);

    let renumber = vscode.commands.registerCommand('cocotools.renumber', function () {
        if (path.extname(vscode.window.activeTextEditor.document.fileName).toUpperCase() == '.BAS') {
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

            var line_start = renumber_increment;
            linelist.forEach(line => {
                line.new_line_num = line_start;
                line_start += renumber_increment;
            });

            Renumber(linelist, "GOTO");
            Renumber(linelist, "GOSUB");
            Renumber(linelist, "THEN");
            Renumber(linelist, "ELSE");

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
    }

    );

    context.subscriptions.push(renumber);
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;