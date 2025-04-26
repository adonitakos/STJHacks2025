import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as http from 'http';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('lock-in-ai.openWebsite', async () => {
        try {
            // Get the active text editor
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showErrorMessage('No active editor found. Please open a file first.');
                return;
            }

            // Get the content of the active editor
            const content = activeEditor.document.getText();

            // Get the workspace root path
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                vscode.window.showErrorMessage('No workspace folder found');
                return;
            }

            // Show progress message
            vscode.window.showInformationMessage('Starting Lock-in AI server...');

            // Check if server is already running
            const isServerRunning = await checkServerStatus();
            if (isServerRunning) {
                vscode.window.showInformationMessage('Server is already running. Opening website...');
                openWebsite(content);
                return;
            }

            // Start the Next.js development server
            const serverProcess = cp.spawn('npm', ['run', 'dev'], {
                cwd: workspaceRoot,
                shell: true
            });

            // Handle server output
            serverProcess.stdout.on('data', (data) => {
                console.log(`Server: ${data}`);
                if (data.toString().includes('ready')) {
                    openWebsite(content);
                }
            });

            serverProcess.stderr.on('data', (data) => {
                console.error(`Server Error: ${data}`);
                vscode.window.showErrorMessage(`Server error: ${data}`);
            });

            // Store the process so we can kill it later
            context.subscriptions.push({
                dispose: () => {
                    serverProcess.kill();
                }
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start the website: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

async function checkServerStatus(): Promise<boolean> {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3002', (res) => {
            resolve(res.statusCode === 200);
        });

        req.on('error', () => {
            resolve(false);
        });

        req.end();
    });
}

function openWebsite(content: string) {
    // Encode the content for URL
    const encodedContent = encodeURIComponent(content);
    const url = `http://localhost:3002?content=${encodedContent}`;
    vscode.env.openExternal(vscode.Uri.parse(url));
}

export function deactivate() {} 