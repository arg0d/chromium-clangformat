// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as child from 'child_process';
import * as path from 'path';
import * as process from 'process';
import * as vscode from 'vscode';

function formatCode() {
  let [findPython, pythonName] = process.platform == 'win32' ?
      ['where python', 'python.bat'] :
      ['which python', 'python'];
  // There could be multiple pythons in path, so pick the first one
  let output = child.execSync(findPython).toString().split(/\r?\n/)[0];
  let toolsPath = path.dirname(output);

  let python = path.normalize(toolsPath + '/' + pythonName);
  let clangFormat = path.normalize(toolsPath + '/clang_format.py');

  let args = [];
  args.push(clangFormat);
  args.push('-style', 'file');

  let editor = vscode.window.activeTextEditor as vscode.TextEditor;

  editor.selections.forEach(selection => {
    let start = editor.document.offsetAt(editor.selection.start);
    let end = editor.document.offsetAt(editor.selection.end);

    args.push('-offset', Math.min(start, end).toString());
    args.push('-length', Math.abs(end - start).toString());
    args.push('-assume-filename', editor.document.fileName);
  });

  let opts = {
    cwd: path.dirname(editor.document.fileName),
    encoding: 'utf-8',
    input: editor.document.getText(),
  };

  let result = child.spawnSync(python, args, opts);

  let previousRange = editor.visibleRanges[0];

  editor.edit(editBuilder => {
    let invalidRange =
        new vscode.Range(0, 0, editor.document.lineCount, 0);
    let fullRange = editor.document.validateRange(invalidRange) || invalidRange;
    editBuilder.replace(fullRange, result.stdout.toString());
  });

  editor.revealRange(previousRange);
}

export function activate(context: vscode.ExtensionContext) {
  let disposable =
      vscode.commands.registerCommand('extension.chromium-clangformat', () => {
        try {
          formatCode();
        } catch (e) {
          console.log(e);
        }
      });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
