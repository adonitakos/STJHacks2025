import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { createServer, IncomingMessage, ServerResponse } from 'http';

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

// Format time display
function formatTime(hours: number): string {
    if (hours < 1) {
        const minutes = Math.floor(hours * 60);
        const seconds = Math.floor((hours * 3600) % 60);
        return `${minutes}m ${seconds}s`;
    }
    return `${hours.toFixed(1)} hours`;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Lock-In AI extension is now active!');

    const statsFile = path.join(context.globalStorageUri.fsPath, 'coding_stats.json');
    let codingSessions: CodingSession[] = [];
    let currentSession: CodingSession | null = null;
    let localhostServer: ReturnType<typeof createServer> | null = null;

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

    // Start localhost server
    const startLocalhostServer = () => {
        if (localhostServer) {
            return;
        }

        localhostServer = createServer((req: IncomingMessage, res: ServerResponse) => {
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
            } else if (req.url === '/current-session') {
                const currentStats = currentSession ? {
                    startTime: currentSession.startTime,
                    duration: (Date.now() - currentSession.startTime) / (1000 * 60 * 60),
                    filePath: currentSession.filePath,
                    language: currentSession.language
                } : null;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(currentStats));
            } else {
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
    context.subscriptions.push(
        vscode.commands.registerCommand('lockInAI.startServer', startLocalhostServer),
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

export function deactivate() {
    console.log('Lock-In AI extension is now deactivated.');
} 