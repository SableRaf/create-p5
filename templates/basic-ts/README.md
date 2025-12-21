# p5.js v2.x TypeScript project

## Prerequisites

-   [Node.js](https://nodejs.org/)

## Getting Started

### Install and run

To install dependencies and start vite dev server

```bash
npm i
npm run dev
```

### Choose global-mode or instance-mode p5.js

Two sketches are provided in src, one for each mode.

If you're not sure, use global mode.

Delete whichever of the two you don't need - this is important for correct type-checking operation.

Ensure index.html is pointing at the right one.

### (optional) Type-check ALL your files

VSCode will type-check the files you _currently have open_.

To instead type-check _all_ your files, either:

Run 
```bash
npm run type-check
```

Or use the keyboard short-cut `ctrl-shift-b` (windows) or `cmd-shift-b` (mac) to run the default vscode "build-task" which has been configured to call the type-check command.  This will also populate the vscode problems window with a list of any errors.