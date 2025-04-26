"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Track current session
let currentSession = null;
// Calculate daily stats
function calculateDailyStats() {
    const stats = {};
    // Get all coding sessions
    const sessions = getCodingSessions();
    sessions.forEach(session => {
        const date = new Date(session.startTime).toISOString().split('T')[0];
        if (!stats[date]) {
            stats[date] = {
                date,
                totalHours: 0,
                filesEdited: [],
                languagesUsed: []
            };
        }
        const duration = (session.endTime - session.startTime) / (1000 * 60 * 60); // hours
        stats[date].totalHours += duration;
        if (!stats[date].filesEdited.includes(session.filePath)) {
            stats[date].filesEdited.push(session.filePath);
        }
        if (!stats[date].languagesUsed.includes(session.language)) {
            stats[date].languagesUsed.push(session.language);
        }
    });
    return Object.values(stats).sort((a, b) => b.date.localeCompare(a.date));
}
// Get current session
function getCurrentSession() {
    return currentSession;
}
// Get all coding sessions
function getCodingSessions() {
    const statsFile = path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', '.vscode', 'coding_stats.json');
    if (fs.existsSync(statsFile)) {
        try {
            return JSON.parse(fs.readFileSync(statsFile, 'utf8'));
        }
        catch (error) {
            console.error('Error reading coding stats:', error);
        }
    }
    return [];
}
// Save coding sessions
function saveCodingSessions(sessions) {
    const statsFile = path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', '.vscode', 'coding_stats.json');
    const statsDir = path.dirname(statsFile);
    if (!fs.existsSync(statsDir)) {
        fs.mkdirSync(statsDir, { recursive: true });
    }
    try {
        fs.writeFileSync(statsFile, JSON.stringify(sessions, null, 2));
    }
    catch (error) {
        console.error('Error saving coding stats:', error);
    }
}
// Track file changes
function trackFileChanges(context) {
    // Track file opens
    vscode.workspace.onDidOpenTextDocument(document => {
        if (currentSession) {
            currentSession.endTime = Date.now();
            const sessions = getCodingSessions();
            sessions.push(currentSession);
            saveCodingSessions(sessions);
        }
        currentSession = {
            startTime: Date.now(),
            endTime: Date.now(),
            filePath: document.fileName,
            language: document.languageId
        };
    });
    // Track file closes
    vscode.workspace.onDidCloseTextDocument(document => {
        if (currentSession && currentSession.filePath === document.fileName) {
            currentSession.endTime = Date.now();
            const sessions = getCodingSessions();
            sessions.push(currentSession);
            saveCodingSessions(sessions);
            currentSession = null;
        }
    });
}
// Format time display
function formatTime(hours) {
    if (hours < 1) {
        const minutes = Math.floor(hours * 60);
        const seconds = Math.floor((hours * 3600) % 60);
        return `${minutes}m ${seconds}s`;
    }
    return `${hours.toFixed(1)} hours`;
}
class LockInAIDashboardProvider {
    constructor(context) {
        this._context = context;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._context.extensionUri]
        };
        webviewView.webview.html = getDashboardHtml();
        // Listen for selection changes for code analysis
        vscode.window.onDidChangeTextEditorSelection(e => {
            const editor = e.textEditor;
            const selection = editor.selection;
            if (!selection.isEmpty) {
                const selectedText = editor.document.getText(selection);
                const filePath = editor.document.fileName;
                const analysis = analyzeCode(selectedText, filePath);
                webviewView.webview.postMessage({
                    type: 'analysis',
                    complexity: analysis.complexity,
                    dependencies: analysis.dependencies
                });
            }
        });
    }
}
LockInAIDashboardProvider.viewType = 'lockInAI.dashboard';
function getDashboardHtml() {
    const stats = calculateDailyStats();
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
        .metric-card {
            background-color: var(--vscode-sideBar-background);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-title {
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 5px;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: var(--vscode-editor-foreground);
        }
        .code-analysis {
            margin-top: 20px;
        }
        .complexity-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 10px;
        }
        .O1 { background-color: #4CAF50; color: white; }
        .On { background-color: #FFC107; color: black; }
        .On2 { background-color: #FF9800; color: white; }
        .On3 { background-color: #F44336; color: white; }
    </style>
</head>
<body>
    <h2>Lock-In AI Dashboard</h2>
    <div class="metric-card">
        <div class="metric-title">Today's Coding Time</div>
        <div class="metric-value">${formatTime(stats[0]?.totalHours || 0)}</div>
    </div>
    <div class="metric-card">
        <div class="metric-title">Files Edited Today</div>
        <div class="metric-value">${stats[0]?.filesEdited.length || 0}</div>
    </div>
    <div class="metric-card">
        <div class="metric-title">Languages Used</div>
        <div class="metric-value">${stats[0]?.languagesUsed.join(', ') || 'None'}</div>
    </div>
    <div class="code-analysis">
        <h3>Code Analysis</h3>
        <p>Select code in the editor to analyze its complexity and dependencies.</p>
        <div id="analysis-result"></div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'analysis') {
                const resultDiv = document.getElementById('analysis-result');
                resultDiv.innerHTML = \`
                    <div class="metric-card">
                        <div class="metric-title">Selected Code Analysis</div>
                        <div class="metric-value">
                            Complexity: <span class="complexity-badge \${message.complexity.toLowerCase()}">\${message.complexity}</span>
                        </div>
                        <div style="margin-top: 10px;">
                            <div class="metric-title">Dependencies:</div>
                            <ul style="margin-top: 5px;">
                                \${message.dependencies.map(dep => \`<li>\${dep}</li>\`).join('')}
                            </ul>
                        </div>
                    </div>
                \`;
            }
        });
    </script>
</body>
</html>`;
}
function activate(context) {
    console.log('Lock-In AI extension is now active!');
    trackFileChanges(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(LockInAIDashboardProvider.viewType, new LockInAIDashboardProvider(context)));
    // Optionally keep the command for opening as a tab
    context.subscriptions.push(vscode.commands.registerCommand('lockInAI.showDashboard', () => {
        createDashboard(context);
    }));
}
exports.activate = activate;
function deactivate() {
    console.log('Lock-In AI extension is now deactivated.');
}
exports.deactivate = deactivate;
function createDashboard(context) {
    const panel = vscode.window.createWebviewPanel('lockInAI.dashboard', 'Lock-In AI Dashboard', vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true
    });
    // Get the current workspace stats
    const stats = calculateDailyStats();
    const currentSession = getCurrentSession();
    // Create the dashboard HTML content
    panel.webview.html = `<!DOCTYPE html>
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
        .metric-card {
            background-color: var(--vscode-sideBar-background);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-title {
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 5px;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: var(--vscode-editor-foreground);
        }
        .code-analysis {
            margin-top: 20px;
        }
        .complexity-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 10px;
        }
        .O1 { background-color: #4CAF50; color: white; }
        .On { background-color: #FFC107; color: black; }
        .On2 { background-color: #FF9800; color: white; }
        .On3 { background-color: #F44336; color: white; }
    </style>
</head>
<body>
    <h2>Lock-In AI Dashboard</h2>
    
    <div class="metric-card">
        <div class="metric-title">Today's Coding Time</div>
        <div class="metric-value">${formatTime(stats[0]?.totalHours || 0)}</div>
    </div>

    <div class="metric-card">
        <div class="metric-title">Files Edited Today</div>
        <div class="metric-value">${stats[0]?.filesEdited.length || 0}</div>
    </div>

    <div class="metric-card">
        <div class="metric-title">Languages Used</div>
        <div class="metric-value">${stats[0]?.languagesUsed.join(', ') || 'None'}</div>
    </div>

    <div class="code-analysis">
        <h3>Code Analysis</h3>
        <p>Select code in the editor to analyze its complexity and dependencies.</p>
        <div id="analysis-result"></div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        // Listen for selection changes
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'analysis') {
                const resultDiv = document.getElementById('analysis-result');
                resultDiv.innerHTML = \`
                    <div class="metric-card">
                        <div class="metric-title">Selected Code Analysis</div>
                        <div class="metric-value">
                            Complexity: <span class="complexity-badge \${message.complexity.toLowerCase()}">\${message.complexity}</span>
                        </div>
                        <div style="margin-top: 10px;">
                            <div class="metric-title">Dependencies:</div>
                            <ul style="margin-top: 5px;">
                                \${message.dependencies.map(dep => \`<li>\${dep}</li>\`).join('')}
                            </ul>
                        </div>
                    </div>
                \`;
            }
        });
    </script>
</body>
</html>`;
    // Track text selection changes
    let selectionDisposable = vscode.window.onDidChangeTextEditorSelection(e => {
        const editor = e.textEditor;
        const selection = editor.selection;
        if (!selection.isEmpty) {
            const selectedText = editor.document.getText(selection);
            const filePath = editor.document.fileName;
            // Analyze the selected code
            const analysis = analyzeCode(selectedText, filePath);
            // Send analysis results to webview
            panel.webview.postMessage({
                type: 'analysis',
                complexity: analysis.complexity,
                dependencies: analysis.dependencies
            });
        }
    });
    // Add the disposable to the extension's subscriptions
    context.subscriptions.push(selectionDisposable);
}
// Function to analyze code complexity and dependencies
function analyzeCode(code, filePath) {
    // Basic complexity analysis
    let complexity = 'O(1)';
    const lines = code.split('\n');
    // Check for loops
    const hasLoops = /(for|while|do)\s*\(/.test(code);
    const hasNestedLoops = /(for|while|do)\s*\([^)]*\)\s*{[^}]*?(for|while|do)\s*\(/.test(code);
    if (hasNestedLoops) {
        complexity = 'O(n²)';
    }
    else if (hasLoops) {
        complexity = 'O(n)';
    }
    // Find dependencies (imports, requires, etc.)
    const dependencies = [];
    const importRegex = /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
        dependencies.push(match[1]);
    }
    return { complexity, dependencies };
}
//# sourceMappingURL=extension.js.map