module.exports = {
    removeSpaces: function (original_line) {
        let linenum = original_line.slice(0, original_line.indexOf(' '));
        let lineremainder = original_line.slice(original_line.indexOf(' '));

        let parts = lineremainder.split('"');


        for (let i = 0; i < parts.length; i++) {
            if (i % 2 === 0 && parts[i].length > 0) {
                let text = parts[i];

                var comment_location = -1;
                comment_location = text.indexOf("'");
                if (comment_location === -1)
                    comment_location = text.indexOf("REM");

                if (comment_location > -1) {
                    let text_before_comment = text.slice(0, comment_location);
                    let text_after_comment = text.slice(comment_location);
                    text_before_comment = text_before_comment.replace(/\s+/g, '');
                    parts[i] = text_before_comment + text_after_comment;
                }
                else {
                    text = text.replace(/\s+/g, '');
                    parts[i] = text;
                }

                // if (comment_location > -1) {
                //     text = text.slice(0, comment_location);
                // }

                // text = text.replace(/\s+/g, '');
                // parts[i] = text;
            }
        }
        return linenum + ' ' + parts.join('"');
    },
    renumber: function (lines) {
        let list = [];
        for (let line of lines.lineCollection) {
            let l = new LineInfo();
            l.setOriginalLine(line);
            list.push(l);
        }

        let newLineNum = renumber_increment;
        for (let l of list) {
            if (l.getOriginalLine().trim().length > 0) {
                l.NewLineNumber = newLineNum;
                newLineNum += renumber_increment;
            }
        }

        let keywords = ["GOTO", "GOSUB", "THEN", "ELSE"];

        for (let l of list) {
            var quoteIndices = [];
            for (var i = 0; i < l.getOriginalLine().length; i++) {
                if (l.getOriginalLine()[i] === '"') {
                    quoteIndices.push(i);
                }
            }

            for (let keyword of keywords) {
                let matchloc = 0;
                matchloc = l.getOriginalLine().toUpperCase().indexOf(keyword, matchloc);
                while (matchloc > -1) {
                    //ignore if this match is inside quotes

                    let inQuote = false;
                    for (x = 0; x < quoteIndices.length - 1; x += 2) {
                        if (matchloc >= quoteIndices[x] && matchloc < quoteIndices[x + 1])
                            inQuote = true;
                    }

                    if (!inQuote) {

                        let j = new JumpInfo();
                        j.index = matchloc;
                        j.original_str = l.getOriginalLine().substr(matchloc, keyword.length);

                        let number_found = false;
                        let space_found = false;

                        let originalLineStr = "";

                        for (let i = j.index + keyword.length; i < l.getOriginalLine().length; i++) {
                            if (l.getOriginalLine().charCodeAt(i) === 32) {
                                if (!space_found) {
                                    j.original_str += l.getOriginalLine()[i];
                                    space_found = true;
                                } else {
                                    break;
                                }
                            }
                            else if ((l.getOriginalLine().charCodeAt(i) >= 48 && l.getOriginalLine().charCodeAt(i) <= 57) || l.getOriginalLine().charCodeAt(i) == 44) {
                                j.original_str += l.getOriginalLine()[i];
                                originalLineStr += l.getOriginalLine()[i];
                                number_found = true;
                            }
                            else {
                                break;
                            }
                        }

                        if (number_found) {
                            l.Jumps.push(j);
                        }
                    }
                    matchloc = l.getOriginalLine().indexOf(keyword, matchloc + keyword.length);
                }
            }
        }

        var err = false;

        list.filter(l => l.Jumps.length > 0).forEach(l => {
            for (let x = 0; x < l.Jumps.length; x++) {
                let j = l.Jumps[x];
                let lineNumStart = 0;
                for (let y = 0; y <= j.original_str.length; y++) {
                    let y_val = j.original_str.charCodeAt(y);
                    if (y_val >= 48 && y_val <= 57) {
                        lineNumStart = y;
                        break;
                    }
                }

                let splitLineDest = j.original_str.substring(lineNumStart).split(",");
                for (let y = 0; y < splitLineDest.length; y++) {
                    let linenum = splitLineDest[y];
                    let findLine = list.find(s => s.LineNumber == parseInt(linenum));
                    if (findLine == null) {
                        vscode.window.showErrorMessage("Error on Line " + l.LineNumber + ": Line not found: " + linenum);
                        err = true;
                        return false;
                    }

                    splitLineDest[y] = findLine.NewLineNumber.toString();
                }

                j.new_str = j.original_str.substring(0, lineNumStart);
                j.new_str += splitLineDest.join(",");
            }
        });
        let newLines = [];
        for (let l of list) {
            newLines.push(l.getNewLine());
        }

        lines.lineCollection = newLines;

        return err;
    },
    format: function (original_line) {
        var firstSpace = original_line.indexOf(' ');
        if (firstSpace > -1) {
            var lineNum = original_line.slice(0, firstSpace);
            var remainingLine = original_line.slice(firstSpace);
            remainingLine = remainingLine.trim();
            original_line = lineNum + ' ' + remainingLine;
        }
        let parts = original_line.split('"');

        for (let i = 0; i < parts.length; i++) {
            if (i % 2 === 0 && parts[i].length > 0) {
                parts[i] = parts[i].toUpperCase();
            }
        }
        return parts.join('"');
    },
    tokenize: function (lineObj) {
        for (var x = 0; x < lineObj.lineCollection.length; x++) {


            line = coCoBasicReplace(lineObj.lineCollection[x]);

            //find line num
            let st = line.indexOf(" ");
            let line_num = parseInt(line.substring(0, st));
            line = line.substring(st + 1);

            let ret = [];

            lineObj.incr += (line.length + 5);

            if (lineObj.incr > 255) {
                lineObj.mem_start_a++;
                lineObj.mem_start_b -= 256;
                lineObj.incr -= 256;
            }

            lineObj.bytes.push(lineObj.mem_start_a);
            lineObj.bytes.push(lineObj.incr);

            lineObj.bytes.push(Math.floor(line_num / 256));
            lineObj.bytes.push(line_num % 256);

            for (let c of line)
                lineObj.bytes.push(c.charCodeAt(0));
            lineObj.bytes.push(0);
        }
        for (var x = 0; x < 3; x++)
            lineObj.bytes.push(0);
    }
}

const vscode = require('vscode');
const workbenchConfig = vscode.workspace.getConfiguration('cocotools');
const fs = require('fs');
var renumber_increment = workbenchConfig.get('renumberIncrement');

class JumpInfo {
    constructor() {
        this.index = 0;
        this.original_str = '';
        this.new_str = '';
    }
}

class LineInfo {
    constructor() {
        this.LineNumber = 0;
        this.NewLineNumber = 0;
        this._originalLine = '';
        this.Jumps = [];
    }

    getOriginalLine() {
        return this._originalLine;
    }

    setOriginalLine(value) {
        this._originalLine = value;
        let first = this._originalLine.slice(0, this._originalLine.indexOf(' '));
        if (first.length == 0) {
            first = "1";
            this._originalLine = " " + this._originalLine;
        }
        this.LineNumber = parseInt(first);
    }

    getNewLine() {
        let newLine = this.getOriginalLine();

        this.Jumps.sort((a, b) => b.index - a.index).forEach(j => {
            let templine = newLine;
            templine = newLine.slice(0, j.index);
            templine += j.new_str;
            templine += newLine.slice(j.index + j.original_str.length);
            newLine = templine;
        });

        if (newLine.trim().length == 0)
            return "";

        if (isNaN(newLine[0])) {
            newLine = "1 " + newLine;
        }

        let stIndex = newLine.indexOf(' ');
        newLine = newLine.slice(stIndex);
        newLine = this.NewLineNumber + newLine;

        return newLine;
    }
}

let BasicReplacements = {
    "PALETTE": String.fromCharCode(227),
    "PCLEAR": String.fromCharCode(192),
    "PCLS": String.fromCharCode(188),
    "PCOPY": String.fromCharCode(199),
    "PPOINT": String.fromCharCode(255, 160),
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
    "MID\\$": String.fromCharCode(255, 144),
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
    "WRITE": String.fromCharCode(217),
    "\\^": String.fromCharCode(175)
};

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
            let quoteSplit = parts[i].split("'");
            if (quoteSplit.length > 1) {
                remFound = true;
                quoteSplit[0] = quoteSplit[0] + ":";
            }
            for (let qs = 0; qs < quoteSplit.length; qs++) {
                let remsplit = quoteSplit[qs].split("REM");

                // if (remsplit.length > 0) {
                for (let rs = 0; rs < remsplit.length; rs++) {
                    let commented_out = false;
                    let statementsplit = remsplit[0].split(':');
                    // for (let x = 0; x < statementsplit.length; x++) {

                        // if (statementsplit[x].startsWith("REM")) {
                        //     statementsplit[x] = statementsplit[x].substring(4);
                        //     statementsplit[x] = String.fromCharCode(130) + " " + statementsplit[x];
                        //     commented_out = true;
                        // }

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
                    // }
                    remsplit[rs] = statementsplit.join(':');
                }



                // }
                quoteSplit[qs] = remsplit.join(String.fromCharCode(130));

                parts[i] = quoteSplit.join(String.fromCharCode(131));
            }
        }
    }
    return ln + ' ' + parts.join('"');
}