# CoCo Tools README

CoCoTools is a VS Code extension that helps automate a Tandy Color Computer development workflow. Supports code written in BASIC, C and ASM.

## Features

The extension adds several features to the VS Code Command Palette (accessed by hitting Ctrl+Shift+P). These Include:

* `BASIC Renumber`: Renumbers the currently opened BASIC file in the same fashion that old RENUM statement works. Available from the Command Palette or Ctrl+Shift+r (Mac: Cmd+Shift+r)
* `COCO Emulator`: Launches an emulator with the currently opened file added to the disk image. If it is a .BAS file, it is copied to the image. .C files are compiled using CMOC, or .ASM files are assembled in LWTOOLS and the resulting .BIN is copied to the disk image. Available from the Command Palette or Ctrl+Shift+e (Mac: Cmd+Shift+e)
* `COCO Emulator - All Files in Current Dir`: The same as "COCO Emulator", except all files in the same directory as the currently opened file are copied (.BAS) or built (.C, .ASM) and the resulting binaries are copied. Available from the Command Palette or Ctrl+Shift+a (Mac: Cmd+Shift+a)

## Requirements

* `CoCo Emulator`: The extension has been (lightly) tested with VCC on Windows and MAME on Windows and Linux.
* `CMOC`: Required to compile .C files
* `LWTOOLS`: Required to assemble .ASM files
* `Toolshed`: Required for Emulator support. Used to initialize and copy files to disk image.

## Extension Settings

The extension has many settings under File -> Preferences -> Settings -> Extensions -> CoCo Tools.

Detailed description of settings coming soon.

## Known Issues

-----------------------------------------------------------------------------------------------------------

### 0.0.1

Initial release of CoCo Tools for demo and testing.

### 0.0.2

* Removed code commenting / uncommenting. This already works by default in VS Code.
* Added default keybindings.
* Saves changes to open document before emulator is launched.


-----------------------------------------------------------------------------------------------------------

**Enjoy!**
