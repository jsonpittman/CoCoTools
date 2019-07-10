# CoCo Tools README

CoCoTools is a VS Code extension that helps automate a Tandy Color Computer development workflow. Supports code written in BASIC, C and ASM.

## Features

The extension adds several features to the VS Code Command Palette (accessed by hitting Ctrl+Shift+P). These Include:

* `BASIC Renumber`: Renumbers the currently opened BASIC file in the same fashion that old RENUM statement works.
* `BASIC Comment`: Adds REM statement(s) to the currently selected line(s).  `Currently Unavailable`
* `BASIC Uncomment`: Removes REM statement(s) from the currently selected line(s).
* `COCO Emulator`: Launches an emulator with the currently opened file added to the disk image. If it is a .BAS file, it is copied to the image. .C files are compiled using CMOC, or .ASM files are assembled in LWTOOLS and the resulting .BIN is copied to the disk image.
* `COCO Emulator - All Files in Current Dir`: The same as "COCO Emulator", except all files in the same directory as the currently opened file are copied (.BAS) or built (.C, .ASM) and the resulting binaries are copied.

## Requirements

* `CoCo Emulator`: The extension has been (lightly) tested with VCC on Windows and MAME on Windows and Linux.
* `CMOC`: Required to compile .C files
* `LWTOOLS`: Required to assemble .ASM files
* `Toolshed`: Required for Emulator support. Used to initialize and copy files to disk image.

## Extension Settings

The extension has many settings under File -> Preferences -> Settings -> Extensions -> CoCo Tools.

Detailed description of settings coming soon.

## Known Issues

`Basic Uncomment` not working

### 0.0.1

Initial release of CoCo Tools for demo and testing.

-----------------------------------------------------------------------------------------------------------

**Enjoy!**
