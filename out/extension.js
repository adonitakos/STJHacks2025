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
const http_1 = require("http");
// Format time display
function formatTime(hours) {
    if (hours < 1) {
        const minutes = Math.floor(hours * 60);
        const seconds = Math.floor((hours * 3600) % 60);
        return `${minutes}m ${seconds}s`;
    }
    return `${hours.toFixed(1)} hours`;
}
function activate(context) {
    console.log('Lock-In AI extension is now active!');
    const statsFile = path.join(context.globalStorageUri.fsPath, 'coding_stats.json');
    let codingSessions = [];
    let currentSession = null;
    let localhostServer = null;
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
    // Start localhost server
    const startLocalhostServer = () => {
        if (localhostServer) {
            return;
        }
        localhostServer = (0, http_1.createServer)((req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            if (req.url === '/stats') {
                const stats = calculateDailyStats();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(stats));
            }
            else if (req.url === '/current-session') {
                const currentStats = currentSession ? {
                    startTime: currentSession.startTime,
                    duration: (Date.now() - currentSession.startTime) / (1000 * 60 * 60),
                    filePath: currentSession.filePath,
                    language: currentSession.language
                } : null;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(currentStats));
            }
            else {
                res.writeHead(404);
                res.end();
            }
        });
        localhostServer.listen(3000, () => {
            console.log('Lock-In AI API server running on port 3000');
            vscode.window.showInformationMessage('Lock-In AI API server is running on port 3000');
        });
    };
    // Register commands and event listeners
    context.subscriptions.push(vscode.commands.registerCommand('lockInAI.startServer', startLocalhostServer), vscode.workspace.onDidOpenTextDocument(startTracking), vscode.workspace.onDidCloseTextDocument(() => {
        if (currentSession) {
            currentSession.endTime = Date.now();
            codingSessions.push(currentSession);
            saveStats();
            currentSession = null;
        }
    }));
}
exports.activate = activate;
function deactivate() {
    console.log('Lock-In AI extension is now deactivated.');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map