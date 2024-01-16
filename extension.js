const vscode = require('vscode');
const workbenchConfig = vscode.workspace.getConfiguration('cocotools');

const fs = require('fs');

var renumber_increment = workbenchConfig.get('renumberIncrement');

var xroar_path = workbenchConfig.get('xroarPath');
var xroar_root_dir; // = path.dirname(xroar_path);
var xroar_snapshot_template = workbenchConfig.get('xroarSnapshotTemplate');
var tempdir = workbenchConfig.get('tempDirectory');
var xroar_snapshot_temp = workbenchConfig.get('xroarSnapshotTemp');

const xroar_start = 458907; //position in snapshot file where memory starts

var incr = -1;

// starting memory locations for various emulators
const coco3_start = 38;
const coco3_program_start = 9729;

//declare snapshot filenames
const snap_coco3_decb = "snap_coco3_decb.snp";

var prog_st = coco3_start;
var mem_step = coco3_program_start;

const tools = require('./tools');
const path = require('path');
const snaps = require('./snapshots');
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

async function getRenumberSelectionStartNum() {
    let userInputWindow = await vscode.window.showInputBox({ prompt: 'Subroutine starting line number:' });
    return parseInt(userInputWindow);
}

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
                let snap = new snaps.coco3_decb;
                fs.writeFileSync(temppath, snap);
            }

            incr = 1;
            prog_st = coco3_start;
            mem_step = coco3_program_start;



            var linelist = []; //list of Bas_Line objects...one for each line of basic code

            let edit = new vscode.WorkspaceEdit();
            var ls;

            var st = vscode.window.activeTextEditor.selection.start.line;
            var en = vscode.window.activeTextEditor.selection.end.line;

            if (en == NaN || en <= st) {
                st = 0;
                en = editor.document.lineCount - 1;
            }
            else
                if (en < editor.document.lineCount)
                    en++;

            let bytes = [];
            


            var lines = [];

            //build array of old and new line numbers
            for (ls = st; ls <= en; ls++) {
                let line = editor.document.lineAt(ls);
                if (line.text.trim().length > 0){

                    lines.push(line.text.trim());
                    // lineObj.lines.push(line.text);

                    bytes = bytes.concat(getCoCoLine(line.text));
                }
            }
            var lineObj = {
                lineCollection: lines,
                incr: 1,
                prog_st: coco3_start,
                mem_step: coco3_program_start,
                bytes: []
            };

            basicLineFunctions.tokenize(lineObj);

            bytes.push(0);
            bytes.push(0);
            bytes.push(0);

            let before_read = fs.readFileSync(path.join(tempdir, xroar_snapshot_template));

            // write loaded snapshot for later use
            // require('fs').writeFile(
            //     'C:/temp/coco3.json',
            //     JSON.stringify(before_read),

            //     function (err) {
            //         if (err) {
            //             console.error('stuff happens');
            //         }
            //     }
            // );

            let mem_count = bytes.length;

            let mem_start_a = Math.floor(mem_step / 256);
            let mem_start_b = mem_step % 256;

            let mem_end_a = Math.floor((mem_step + mem_count) / 256);
            let mem_end_b = (mem_step + mem_count) % 256;

            // console.log("Before: " + before_read[xroar_start + 25] + " After: " + mem_start_a);
            // console.log("Before: " + before_read[xroar_start + 26] + " After: " + mem_start_b);
            // console.log("Before: " + before_read[xroar_start + 27] + " After: " + mem_end_a);
            // console.log("Before: " + before_read[xroar_start + 28] + " After: " + mem_end_b);

            before_read[xroar_start + 25] = mem_start_a;
            before_read[xroar_start + 26] = mem_start_b;
            before_read[xroar_start + 27] = mem_end_a;
            before_read[xroar_start + 28] = mem_end_b - 1;

            for (let i of bytes) {
                // console.log("Location: " + (xroar_start + mem_step) + " Before: " + before_read[xroar_start + mem_step] + " After: " + i);
                before_read[xroar_start + mem_step] = i;
                mem_step++;
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


let BasicReplacements = {
    "PALETTE": String.fromCharCode(227),
    "PCLEAR": String.fromCharCode(192),
    "PCLS": String.fromCharCode(188),
    "PCOPY": String.fromCharCode(199),
    "PLAY": String.fromCharCode(201),
    "PMODE": String.fromCharCode(200),
    "POKE": String.fromCharCode(146),
    "PRESET": String.fromCharCode(190),
    "HGET": String.fromCharCode(235),
    "HLINE": String.fromCharCode(234),
    "HPAINT": String.fromCharCode(232),
    "HPRINT": String.fromCharCode(238),
    "HPUT": String.fromCharCode(236),
    "HRESET": String.fromCharCode(244),
    "HSCREEN": String.fromCharCode(228),
    "HSET": String.fromCharCode(243),
    "HSTAT": String.fromCharCode(242),
    "HBUFF": String.fromCharCode(237),
    "HCIRCLE": String.fromCharCode(233),
    "HCLS": String.fromCharCode(230),
    "HCOLOR": String.fromCharCode(231),
    "HDRAW": String.fromCharCode(245),
    "HPOINT": String.fromCharCode(255, 171),
    "ATTR": String.fromCharCode(248),
    "AUDIO": String.fromCharCode(161),
    "TO": String.fromCharCode(165),
    "ON": String.fromCharCode(136),
    "CIRCLE": String.fromCharCode(194),
    "CLEAR": String.fromCharCode(149),
    "LOAD": String.fromCharCode(211),
    "CLOAD": String.fromCharCode(151),
    "CLOSE": String.fromCharCode(154),
    "CLS": String.fromCharCode(158),
    "COLOR": String.fromCharCode(193),
    "CONT": String.fromCharCode(147),
    "CSAVE": String.fromCharCode(152),
    "DEF": String.fromCharCode(185),
    "DEL": String.fromCharCode(181),
    "DIM": String.fromCharCode(140),
    "DRAW": String.fromCharCode(198),
    "EDIT": String.fromCharCode(182),
    "END": String.fromCharCode(138),
    "EXEC": String.fromCharCode(162),
    "FOR": String.fromCharCode(128),
    "STEP": String.fromCharCode(169),
    "GET": String.fromCharCode(196),
    "GO": String.fromCharCode(129),
    "SUB": String.fromCharCode(166),
    "IF": String.fromCharCode(133),
    "THEN": String.fromCharCode(167),
    "INPUT": String.fromCharCode(137),
    "LET": String.fromCharCode(186),
    "LINE": String.fromCharCode(187),
    "LIST": String.fromCharCode(148),
    "LLIST": String.fromCharCode(155),
    "LOCATE": String.fromCharCode(241),
    "LPOKE": String.fromCharCode(229),
    "MOTOR": String.fromCharCode(159),
    "NEW": String.fromCharCode(150),
    "NEXT": String.fromCharCode(139),
    "BRK": String.fromCharCode(240),
    "ERR": String.fromCharCode(239),
    "OPEN": String.fromCharCode(153),
    "PAINT": String.fromCharCode(195),
    "CMP": String.fromCharCode(246),
    "RGB": String.fromCharCode(247),
    "PRINT": String.fromCharCode(135),
    "USING": String.fromCharCode(205),
    "PSET": String.fromCharCode(189),
    "PUT": String.fromCharCode(197),
    "READ": String.fromCharCode(141),
    //{"REM": String.fromCharCode(130),
    //{"'": String.fromCharCode(131),
    "RENUM": String.fromCharCode(203),
    "RESET": String.fromCharCode(157),
    "RESTORE": String.fromCharCode(143),
    "RETURN": String.fromCharCode(144),
    "RUN": String.fromCharCode(142),
    "SCREEN": String.fromCharCode(191),
    "SET": String.fromCharCode(156),
    "SKIPF": String.fromCharCode(163),
    "SOUND": String.fromCharCode(160),
    "DSKI\\$": String.fromCharCode(223),
    "STOP": String.fromCharCode(145),
    "TROFF": String.fromCharCode(184),
    "TRON": String.fromCharCode(183),
    "WIDTH": String.fromCharCode(226),
    "NOT": String.fromCharCode(168),
    "AND": String.fromCharCode(176),
    "OR": String.fromCharCode(177),
    "<": String.fromCharCode(180),
    "\=": String.fromCharCode(179),
    ">": String.fromCharCode(178),
    "\-": String.fromCharCode(172),
    "\\*": String.fromCharCode(173),
    "\\+": String.fromCharCode(171),
    "/": String.fromCharCode(174),
    "\\?": String.fromCharCode(135),
    "ELSE": String.fromCharCode(58, 132),
    "GOSUB": String.fromCharCode(129, 166),
    "GOTO": String.fromCharCode(129, 165),
    "MID\$": String.fromCharCode(255, 144),
    "TIMER": String.fromCharCode(255, 159),
    "ABS": String.fromCharCode(255, 130),
    "ASC": String.fromCharCode(255, 138),
    "ATN": String.fromCharCode(255, 148),
    "BUTTON": String.fromCharCode(255, 170),
    "CHR\\$": String.fromCharCode(255, 139),
    "COS": String.fromCharCode(255, 149),
    "EOF": String.fromCharCode(255, 140),
    "ERLIN": String.fromCharCode(255, 173),
    "ERNO": String.fromCharCode(255, 172),
    "EXP": String.fromCharCode(255, 151),
    "FIX": String.fromCharCode(255, 152),
    "HEX\\$": String.fromCharCode(255, 156),
    "INKEY\\$": String.fromCharCode(255, 146),
    "INSTR": String.fromCharCode(255, 158),
    "INT": String.fromCharCode(255, 129),
    "JOYSTK": String.fromCharCode(255, 141),
    //{"LEFT": String.fromCharCode(255, 142),
    "LEN": String.fromCharCode(255, 135),
    "LOG": String.fromCharCode(255, 153),
    "LPEEK": String.fromCharCode(255, 169),
    "MEM": String.fromCharCode(255, 147),
    "PEEK": String.fromCharCode(255, 134),
    "POINT": String.fromCharCode(255, 145),
    "POS": String.fromCharCode(255, 154),
    "PPOINT": String.fromCharCode(255, 160),
    "RIGHT\\$": String.fromCharCode(255, 143),
    "RND": String.fromCharCode(255, 132),
    "SGN": String.fromCharCode(255, 128),
    "SIN": String.fromCharCode(255, 133),
    "STRING\\$": String.fromCharCode(255, 161),
    "STR\\$": String.fromCharCode(255, 136),
    "SQR": String.fromCharCode(255, 155),
    "TAN": String.fromCharCode(255, 150),
    "LEFT\\$": String.fromCharCode(255, 142),
    "USR": String.fromCharCode(255, 131),
    "VAL": String.fromCharCode(255, 137),
    "VARPTR": String.fromCharCode(255, 157),
    //{"'",string.Format("{0}{1}",(char)58,(char)131),
    "FN": String.fromCharCode(204),
    "DATA": String.fromCharCode(134),
    "WRITE": String.fromCharCode(217)
};

function getCoCoLine(line) {
    line = coCoBasicReplace(line);

    //find line num
    let st = line.indexOf(" ");
    let line_num = parseInt(line.substring(0, st));
    line = line.substring(st + 1);

    let ret = [];

    incr += (line.length + 5);

    if (incr > 255) {
        prog_st++;
        incr -= 256;
    }

    ret.push(prog_st);
    ret.push(incr);

    ret.push(Math.floor(line_num / 256));
    ret.push(line_num % 256);

    for (let c of line)
        ret.push(c.charCodeAt(0));
    ret.push(0);

    return ret;
}

function coCoBasicReplace(inStr) {
    let ln = inStr.substring(0, inStr.indexOf(' ')); //save line num
    inStr = inStr.substring(inStr.indexOf(' ') + 1); //remove line num

    //basic allows a "'" comment to begin anywhere by inserting a ":" before it. Check for "'"
    // that is not inside a "string" and insert a ":".
    let parts = inStr.split('"');
    var remFound = false;

    for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0 && parts[i].length > 0 && remFound === false) {
            //if there is a "'" comment arbitrarily in the string, we only want to parse characters up to it
            let remsplit = parts[i].split("'");
            if (remsplit.length > 1) {
                remFound = true;
                remsplit[0] = remsplit[0] + ":";
            }

            if (remsplit.length > 0) {
                let commented_out = false;
                let statementsplit = remsplit[0].split(':');
                for (let x = 0; x < statementsplit.length; x++) {

                    if (statementsplit[x].startsWith("REM")) {
                        statementsplit[x] = statementsplit[x].substring(4);
                        statementsplit[x] = String.fromCharCode(130) + " " + statementsplit[x];
                        commented_out = true;
                    }

                    // if (statementsplit[x].startsWith("'")) {
                    //     statementsplit[x] = statementsplit[x].substring(1);
                    //     statementsplit[x] = String.fromCharCode(131) + statementsplit[x];
                    //     commented_out = true;
                    // }

                    if (!commented_out) {
                        for (let ss = 0; ss < statementsplit.length; ss++) {
                            let indx = statementsplit[ss].indexOf("'");
                            if (indx === -1)
                                indx = statementsplit[ss].length;
                            let match_string = statementsplit[ss].substring(0, indx);

                            for (let keyword in BasicReplacements) {
                                //add an exception for "-" in a data statement
                                if (keyword === "\-" && match_string.startsWith("DATA")) {
                                    //Console.log("skip");
                                } else {
                                    // console.log("match: " + keyword);
                                    let regex = new RegExp(keyword, 'g');
                                    match_string = match_string.replace(regex, BasicReplacements[keyword]);
                                }
                            }
                            statementsplit[ss] = match_string;
                        }
                    }
                }


                remsplit[0] = statementsplit.join(':');
                parts[i] = remsplit.join(String.fromCharCode(131));
            }
        }
    }
    return ln + ' ' + parts.join('"');
}