const vscode = require('vscode');
const workbenchConfig = vscode.workspace.getConfiguration('cocotools');

const fs = require('fs');

var xroar_path = workbenchConfig.get('xroarPath');
var xroar_root_dir; // = path.dirname(xroar_path);
// var xroar_snapshot_template = workbenchConfig.get('xroarSnapshotTemplate');
var tempdir = workbenchConfig.get('tempDirectory');
var xroar_snapshot_temp = workbenchConfig.get('xroarSnapshotTemp');
var machine_type = workbenchConfig.get('machineType');
var xroar_start = 0;
var coco_start = 38;
var coco_program_start = 9729;

switch (machine_type) {
    case "CoCo 1":
        xroar_snapshot_template = "coco.snp";
        xroar_start = 167;
        break;
    case "CoCo 2":
        xroar_snapshot_template = "coco2_decb.snp";
        xroar_start = 458907;
        break;
    case "CoCo 3 DECB":
        xroar_snapshot_template = "coco3_decb.snp";
        xroar_start = 458907;
        break;
    case "MC10":
        xroar_snapshot_template = "mc10.snp";
        xroar_start = 21201;
        break;
    default:
        xroar_snapshot_template = "coco3_decb.snp";
        xroar_start = 167;
        break;
}

// const xroar_start = 458907; //position in snapshot file where memory starts
// const xroar_start = 167; //position in snapshot file where memory starts

// starting memory locations for various emulators
// const coco3_start = 38;
// const coco3_program_start = 9729;

//declare snapshot filenames
// const snap_coco3_decb = "snap_coco3_decb.snp";

const tools = require('./tools');
const path = require('path');
let snaps = null;
    // snaps = require('./snapshots_coco3_decb');
// const snaps_coco = require('./snapshots_coco');
const basicLineFunctions = require('./basicLineFunctions')

// function KeywordRenumber(lines, keyword) {
//     lines.forEach(line => {
//         if (line.original_line_num == 170) {
//             console.log("170");
//         }


//         var match_pos = 0;
//         while (match_pos > -1) {
//             let goto = line.original_line.indexOf(keyword, match_pos);
//             if (goto > -1) {
//                 var match = new RegExp(keyword + '\\ ?\\d+', 'g');
//                 let gonum = line.original_line.match(match);
//                 if (gonum != null && gonum.length > 0) {
//                     for (var x = 0; x < gonum.length; x++) {
//                         var m = gonum[x].match(/\d+/);
//                         for (var y = 0; y < m.length; y++) {
//                             let line_num = m[y];
//                             let new_num = GetNewLineNum(lines, line_num);
//                             let newgonum = gonum[x].replace(line_num, new_num);
//                             if (new_num != 0 && new_num != line_num) {
//                                 console.log("Before: " + line.original_line_num + ' ' + line.original_line);
//                                 // line.original_line = line.original_line.replace(gonum[x], newgonum);

//                                 //var indx = line.original_line.indexOf(gonum[x]);

//                                 var teststr = line.original_line;
//                                 var bef_str = teststr.slice(0, m[x].index);
//                                 var aft_str = teststr.slice(m[x].index + gonum[x].length);
//                                 teststr = bef_str + newgonum + aft_str;

//                                 //teststr = teststr.slice(0, m[x].index) + newgonum + teststr.slice(indx + gonum[x].length);
//                                 line.original_line = teststr;

//                                 // line.original_line = line.original_line.slice(m.index, m.input.length, newgonum);
//                                 // line.original_line = line.original_line.replace(m[y], new_num);

//                                 console.log("After: " + line.original_line_num + ' ' + line.original_line);
//                             }
//                             // else
//                             //     vscode.window.showInformationMessage('Line not found: ' + line_num);
//                         }
//                     }
//                 }
//             }
//             if (goto > -1)
//                 match_pos = goto + 1;
//             else
//                 match_pos = -1;
//         }
//     });
//     return lines;
// }

// function GetNewLineNum(lines, original_line_num) {

//     var return_num = 0;
//     lines.forEach(line => {
//         if (line.original_line_num == original_line_num) {
//             return_num = line.new_line_num;
//         }
//     });
//     return return_num;
// }

// async function getRenumberSelectionStartNum() {
//     let userInputWindow = await vscode.window.showInputBox({ prompt: 'Subroutine starting line number:' });
//     return parseInt(userInputWindow);
// }

let lines = [];

function activate(context) {
    let removespaces = vscode.commands.registerCommand('cocotools.removespaces', async () => {
        if (path.extname(vscode.window.activeTextEditor.document.fileName).toUpperCase() == '.BAS') {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                return; // No open text editor
            }

            lines = [];

            let edit = new vscode.WorkspaceEdit();
            var ls;

            //total document line count
            var line_count = vscode.window.activeTextEditor.document.lineCount;

            //the working line for loops
            var line;

            for (ln = 0; ln < line_count; ln++) {
                lines.push(basicLineFunctions.removeSpaces(editor.document.lineAt(ln).text.trim()));
            }
            for (ls = 0; ls < lines.length; ls++) {
                if (ls >= editor.document.lines) {
                    edit.replace(editor.document.uri, line.range, line.text += "\r\n" + lines[ls]);
                }
                else {
                    line = editor.document.lineAt(ls);
                    edit.replace(editor.document.uri, line.range, lines[ls]);
                }
            }

            vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage('Spaces Removed!');
        }
    });

    let format = vscode.commands.registerCommand('cocotools.format', async () => {
        if (path.extname(vscode.window.activeTextEditor.document.fileName).toUpperCase() == '.BAS') {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                return; // No open text editor
            }

            lines = [];

            let edit = new vscode.WorkspaceEdit();
            var ls;

            //total document line count
            var line_count = vscode.window.activeTextEditor.document.lineCount;

            //the working line for loops
            var line;

            for (ln = 0; ln < line_count; ln++) {
                lines.push(basicLineFunctions.format(editor.document.lineAt(ln).text.trim()));
            }
            for (ls = 0; ls < lines.length; ls++) {
                if (ls >= editor.document.lines) {
                    edit.replace(editor.document.uri, line.range, line.text += "\r\n" + lines[ls]);
                }
                else {
                    line = editor.document.lineAt(ls);
                    edit.replace(editor.document.uri, line.range, lines[ls]);
                }
            }

            vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage('Code Formatted!');
        }
    }

    );

    context.subscriptions.push(format);

    let renumber = vscode.commands.registerCommand('cocotools.renumber', async () => {
        if (path.extname(vscode.window.activeTextEditor.document.fileName).toUpperCase() == '.BAS') {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                return; // No open text editor
            }
            var linelist = []; //list of Bas_Line objects...one for each line of basic code

            lines = [];

            let edit = new vscode.WorkspaceEdit();
            var ls;

            //total document line count
            var line_count = vscode.window.activeTextEditor.document.lineCount;

            //the number entered for the starting renumber line when multiple lines are selected
            var selection_line_start;

            //starting line of selection
            var st = vscode.window.activeTextEditor.selection.start.line;

            //last line of selection
            var en = vscode.window.activeTextEditor.selection.end.line;

            //starting line num TODO: Read from options
            // var line_num = renumber_increment;

            //the working line for loops
            var line;

            //set to true when renumbering a selection instead of all lines
            // var selectionMode = false;
            // if (!vscode.window.activeTextEditor.selection.isEmpty && en != NaN && en >= st)
            //     selectionMode = true;

            //contains true when a REM RENUM BLOCK statement is found. Used to prevent renumbering of previous blocks
            var in_RenumBlock = false;
            var renum_start, renum_end;

            //if a block of lines is selected, ask for starting line number for renumbering the block
            // if (selectionMode)
            //     selection_line_start = await getRenumberSelectionStartNum();

            //stop if empty or NaN
            // if (selectionMode && isNaN(selection_line_start))
            //     return;

            //for testing to see if entered line number would overwrite existing line numbers
            // var linenumend = selection_line_start + ((en - st + 2) * renumber_increment);

            for (ln = 0; ln < line_count; ln++) {
                //this line of text
                var original_line = editor.document.lineAt(ln).text;
                // if(original_line.trim().length > 0)
                lines.push(original_line);

                // //object to represent the line with new line number, etc
                // if (original_line.trim().length > 0) {
                //     var l = new Bas_Line(original_line);
                //     if (selectionMode && l.original_line_num >= selection_line_start && l.original_line_num <= linenumend) {
                //         vscode.window.showErrorMessage('Block would overwrite existing lines');
                //         return;
                //     }

                //     //check to see if the existing line contains a REM RENUM BLOCK statement.
                //     //if so, parse the line numbers and don't renumber those lines.
                //     if (original_line.indexOf("REM RENUM BLOCK") > 0) {
                //         renum_start = original_line.match(/(RENUM BLOCK )([0-9]*)-([0-9]*)/)[2];
                //         renum_end = original_line.match(/(RENUM BLOCK )([0-9]*)-([0-9]*)/)[3];
                //         l.is_block_header = true;
                //         l.block_start = parseInt(renum_start);
                //         l.block_end = parseInt(renum_end);
                //     }
                //     else
                //         l.is_block_header = false;

                //     linelist.push(l);
                // }
            }

            var lineObj = { lineCollection: lines };

            let renumResult = basicLineFunctions.renumber(lineObj);


            // if (selectionMode) {
            //     var return_line = new Bas_Line("RETURN");
            //     linelist.splice(en + 1, 0, return_line);
            //     en += 3;

            //     var gosub_line = new Bas_Line("GOSUB " + selection_line_start);
            //     linelist.splice(st, 0, gosub_line);
            //     st += 1;

            //     var rem_line = new Bas_Line("REM RENUM BLOCK " + selection_line_start + "-" + (selection_line_start + ((en - st) * renumber_increment)));
            //     linelist.splice(st, 0, rem_line);
            //     en += 1;
            // }

            if (!renumResult) {
                lines = lineObj.lineCollection;
                for (ls = 0; ls < lines.length; ls++) {
                    if (ls >= editor.document.lines) {
                        edit.replace(editor.document.uri, line.range, line.text += "\r\n" + lines[ls]);
                    }
                    else {
                        line = editor.document.lineAt(ls);
                        edit.replace(editor.document.uri, line.range, lines[ls]);
                    }
                }


                // if (selectionMode) {
                //     editor.selection = new vscode.Selection(st, st, st, st);
                // }

                vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage('Code Renumber Complete!');
            }
        }
    }

    );

    context.subscriptions.push(renumber);

    let xroar = vscode.commands.registerCommand('cocotools.xroar', function () {
        if (path.extname(vscode.window.activeTextEditor.document.fileName).toUpperCase() == '.BAS') {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                return; // No open text editor
            }

            xroar_root_dir = path.dirname(xroar_path);

            // check for snapshot template.
            // write the template to the xroar directory if it does not exist
            var temppath = path.join(tempdir, xroar_snapshot_template);
            if (!fs.existsSync(temppath)) {
                snaps = require('./snapshots');
                let snap = null;

                switch(machine_type){
                    case "CoCo 1":
                        snap = new snaps.coco;
                        fs.writeFileSync(temppath, snap);
                        break;
                    case "CoCo 2":
                        snap = new snaps.coco2_decb;
                        fs.writeFileSync(temppath, snap);
                        break;
                    case "CoCo 3 DECB":
                        snap = new snaps.coco3_decb;
                        fs.writeFileSync(temppath, snap);
                        break;
                    case "MC10":
                        snap = new snaps.mc10;
                        fs.writeFileSync(temppath, snap);
                        break;
                    default:
                        snap = new snaps.coco3_decb;
                        fs.writeFileSync(temppath, snap);
                        break;
                }
            }

            var ls;

            var st = vscode.window.activeTextEditor.selection.start.line;
            var en = vscode.window.activeTextEditor.selection.end.line;

            if(st == en){
                //nothing selected...run entire program
                st = 0;
                en = editor.document.lineCount - 1;
            }
            else {
                vscode.window.showInformationMessage('Only the selected lines are being sent to XRoar');
            }

            var lines = [];

            for (ls = st; ls <= en; ls++) {
                let line = editor.document.lineAt(ls);
                if (line.text.trim().length > 0){
                    lines.push(line.text.trim());
                }
            }
            var lineObj = {
                lineCollection: lines,
                incr: 1,
                prog_st: coco_start,
                mem_step: coco_program_start,
                bytes: []
            };

            basicLineFunctions.tokenize(lineObj);

            let before_read = fs.readFileSync(path.join(tempdir, xroar_snapshot_template));

            // before_read = fs.readFileSync(path.join(tempdir, "mc10_after.snp"));

            // for(let i = 0; i < before_read.length - 2; i++){
            //     if(before_read[i] == 38 && before_read[i + 1] == 1){
            //         for(let j = i; j <= i+3; j++){
            //             console.log(j + " = " + before_read[j]);
            //         }
            //         //console.log("Found 38 at " + i);
            //     }
            // }

            // write loaded snapshot for later use
            // before_read = fs.readFileSync(path.join(tempdir, "mc10.snp"));
            // require('fs').writeFile(
            //     'C:/temp/mc10.json',
            //     JSON.stringify(before_read),

            //     function (err) {
            //         if (err) {
            //             console.error('stuff happens');
            //         }
            //     }
            // );

            let mem_start_a = Math.floor(lineObj.mem_step / 256);
            let mem_start_b = lineObj.mem_step % 256;

            let mem_end_a = Math.floor((lineObj.mem_step + lineObj.bytes.length) / 256);
            let mem_end_b = (lineObj.mem_step + lineObj.bytes.length) % 256;

            // console.log("Before: " + before_read[xroar_start + 25] + " After: " + mem_start_a);
            // console.log("Before: " + before_read[xroar_start + 26] + " After: " + mem_start_b);
            // console.log("Before: " + before_read[xroar_start + 27] + " After: " + mem_end_a);
            // console.log("Before: " + before_read[xroar_start + 28] + " After: " + mem_end_b);

            before_read[xroar_start + 25] = mem_start_a;
            before_read[xroar_start + 26] = mem_start_b;
            before_read[xroar_start + 27] = mem_end_a;
            before_read[xroar_start + 28] = mem_end_b - 1;

            for (let i of lineObj.bytes) {
                // console.log("Location: " + (xroar_start + mem_step) + " Before: " + before_read[xroar_start + mem_step] + " After: " + i);
                before_read[xroar_start + lineObj.mem_step] = i;
                lineObj.mem_step++;
            }

            fs.writeFileSync(path.join(tempdir, xroar_snapshot_temp), before_read);

            if (fs.existsSync(xroar_path)) {
                tools.LaunchXroar(
                    path.parse(xroar_path).base,
                    xroar_root_dir,
                    path.join(tempdir, xroar_snapshot_temp)
                );
            }
            else {
                vscode.window.showErrorMessage("XRoar not found: " + xroar_path);
            }
        }
    });

    context.subscriptions.push(xroar);
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;