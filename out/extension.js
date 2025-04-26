"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
function activate(context) {
    const statsFile = path.join(context.globalStorageUri.fsPath, 'coding_stats.json');
    let codingSessions = [];
    let currentSession = null;
    // Create stats file if it doesn't exist
    if (!fs.existsSync(context.globalStorageUri.fsPath)) {
        fs.mkdirSync(context.globalStorageUri.fsPath, { recursive: true });
    }
    // Load existing stats
    if (fs.existsSync(statsFile)) {
        try {
            codingSessions = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
        }
        catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    // Start tracking when a file is opened
    const startTracking = (document) => {
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
        }
        catch (error) {
            console.error('Error saving stats:', error);
        }
    };
    // Calculate daily stats
    const calculateDailyStats = () => {
        const stats = {};
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
        const panel = vscode.window.createWebviewPanel('codingAnalytics.dashboard', 'Coding Analytics Dashboard', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        const dailyStats = calculateDailyStats();
        panel.webview.html = getWebviewContent(dailyStats);
    };
    // Register commands and event listeners
    context.subscriptions.push(vscode.commands.registerCommand('codingAnalytics.showDashboard', createDashboard), vscode.workspace.onDidOpenTextDocument(startTracking), vscode.workspace.onDidCloseTextDocument(() => {
        if (currentSession) {
            currentSession.endTime = Date.now();
            codingSessions.push(currentSession);
            saveStats();
            currentSession = null;
        }
    }));
}
exports.activate = activate;
function getWebviewContent(dailyStats) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Coding Analytics Dashboard</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                .stats-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                .stat-card {
                    background-color: var(--vscode-sideBar-background);
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                h1, h2 {
                    color: var(--vscode-editor-foreground);
                }
                .chart-container {
                    width: 100%;
                    height: 300px;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <h1>Coding Analytics Dashboard</h1>
            <div class="stats-container">
                ${dailyStats.map(stat => `
                    <div class="stat-card">
                        <h2>${stat.date}</h2>
                        <p>Total Hours: ${stat.totalHours.toFixed(2)}</p>
                        <p>Files Edited: ${stat.filesEdited.length}</p>
                        <p>Languages Used: ${stat.languagesUsed.join(', ')}</p>
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `;
}
function deactivate() {
    // Cleanup if needed
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map