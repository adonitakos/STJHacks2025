import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface CodingSession {
    startTime: number;
    endTime: number;
    filePath: string;
    language: string;
}

interface DailyStats {
    date: string;
    totalHours: number;
    filesEdited: string[];
    languagesUsed: string[];
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Lock-In AI extension is now active!');

    const statsFile = path.join(context.globalStorageUri.fsPath, 'coding_stats.json');
    let codingSessions: CodingSession[] = [];
    let currentSession: CodingSession | null = null;

    // Create stats file if it doesn't exist
    if (!fs.existsSync(context.globalStorageUri.fsPath)) {
        fs.mkdirSync(context.globalStorageUri.fsPath, { recursive: true });
    }

    // Load existing stats
    if (fs.existsSync(statsFile)) {
        try {
            codingSessions = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
        } catch (error) {
            console.error('Error loading stats:', error);
            vscode.window.showErrorMessage('Failed to load coding statistics. Starting fresh.');
        }
    }

    // Start tracking when a file is opened
    const startTracking = (document: vscode.TextDocument) => {
        if (currentSession) {
            currentSession.endTime = Date.now();
            codingSessions.push(currentSession);
            saveStats();
        }

        currentSession = {
            startTime: Date.now(),
            endTime: Date.now(),
            filePath: document.fileName,
            language: document.languageId
        };
    };

    // Save stats to file
    const saveStats = () => {
        try {
            fs.writeFileSync(statsFile, JSON.stringify(codingSessions, null, 2));
        } catch (error) {
            console.error('Error saving stats:', error);
            vscode.window.showErrorMessage('Failed to save coding statistics.');
        }
    };

    // Calculate daily stats
    const calculateDailyStats = (): DailyStats[] => {
        const stats: { [date: string]: DailyStats } = {};

        codingSessions.forEach(session => {
            const date = new Date(session.startTime).toISOString().split('T')[0];
            const duration = (session.endTime - session.startTime) / (1000 * 60 * 60); // hours

            if (!stats[date]) {
                stats[date] = {
                    date,
                    totalHours: 0,
                    filesEdited: [],
                    languagesUsed: []
                };
            }

            stats[date].totalHours += duration;
            if (!stats[date].filesEdited.includes(session.filePath)) {
                stats[date].filesEdited.push(session.filePath);
            }
            if (!stats[date].languagesUsed.includes(session.language)) {
                stats[date].languagesUsed.push(session.language);
            }
        });

        return Object.values(stats).sort((a, b) => b.date.localeCompare(a.date));
    };

    // Create and show the dashboard
    const createDashboard = () => {
        try {
            const panel = vscode.window.createWebviewPanel(
                'lockInAI.dashboard',
                'Lock-In AI Dashboard',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
                }
            );

            const dailyStats = calculateDailyStats();
            
            panel.webview.html = getWebviewContent(dailyStats);

            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'openLocalhost':
                            vscode.env.openExternal(vscode.Uri.parse(message.url))
                                .then(success => {
                                    if (!success) {
                                        vscode.window.showErrorMessage('Failed to open localhost URL');
                                    }
                                });
                            return;
                    }
                },
                undefined,
                context.subscriptions
            );

            // Update the webview content when the panel becomes visible
            panel.onDidChangeViewState(e => {
                if (e.webviewPanel.visible) {
                    const updatedStats = calculateDailyStats();
                    panel.webview.html = getWebviewContent(updatedStats);
                }
            });
        } catch (error) {
            console.error('Error creating dashboard:', error);
            vscode.window.showErrorMessage('Failed to create dashboard. Please try again.');
        }
    };

    // Register commands and event listeners
    context.subscriptions.push(
        vscode.commands.registerCommand('lockInAI.showDashboard', createDashboard),
        vscode.workspace.onDidOpenTextDocument(startTracking),
        vscode.workspace.onDidCloseTextDocument(() => {
            if (currentSession) {
                currentSession.endTime = Date.now();
                codingSessions.push(currentSession);
                saveStats();
                currentSession = null;
            }
        })
    );
}

function getWebviewContent(dailyStats: DailyStats[]): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lock-In AI Dashboard</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                padding: 20px;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            .stats-container {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .stat-card {
                background-color: var(--vscode-sideBar-background);
                padding: 15px;
                border-radius: 5px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .stat-title {
                font-size: 14px;
                color: var(--vscode-descriptionForeground);
                margin-bottom: 5px;
            }
            .stat-value {
                font-size: 24px;
                font-weight: bold;
            }
            .button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 20px;
                transition: background-color 0.2s;
            }
            .button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            .button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        </style>
    </head>
    <body>
        <div class="stats-container">
            ${dailyStats.length > 0 ? dailyStats.map(stat => `
                <div class="stat-card">
                    <div class="stat-title">${stat.date}</div>
                    <div class="stat-value">${stat.totalHours.toFixed(1)} hours</div>
                </div>
            `).join('') : `
                <div class="stat-card">
                    <div class="stat-title">No coding data available yet</div>
                    <div class="stat-value">Start coding to see your analytics!</div>
                </div>
            `}
            <button class="button" onclick="openLocalhost()">Open Local Dashboard</button>
        </div>
        <script>
            const vscode = acquireVsCodeApi();
            function openLocalhost() {
                const button = document.querySelector('.button');
                button.disabled = true;
                vscode.postMessage({
                    command: 'openLocalhost',
                    url: 'http://localhost:3000'
                });
                setTimeout(() => {
                    button.disabled = false;
                }, 2000);
            }
        </script>
    </body>
    </html>`;
}

export function deactivate() {
    console.log('Lock-In AI extension is now deactivated.');
} 