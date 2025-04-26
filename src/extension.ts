// This is the updated version of extension.ts that should fix the loading issue

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// In-memory storage for tracking metrics
let codingTimeToday = 0;
let lastActive = Date.now();
let isTracking = false;
let codeQualityScore = 85; // Mock score for demonstration
let codingStreak = 3; // Mock streak for demonstration

export function activate(context: vscode.ExtensionContext) {
	console.log('STJHacks2025 extension is now active!');

	// Register the sidebar view provider
	const provider = new DashboardViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(DashboardViewProvider.viewType, provider)
	);

	// Start tracking when the extension activates
	startTracking();

	// Register the command to open detailed analytics in browser
	context.subscriptions.push(
		vscode.commands.registerCommand('stjhacks2025.openDetailedAnalytics', () => {
			const port = 3000; // Port for local server
			vscode.env.openExternal(vscode.Uri.parse(`http://localhost:${port}`));
			vscode.window.showInformationMessage('Opening detailed analytics in browser...');
		})
	);

	// Update metrics every minute
	const updateInterval = setInterval(() => {
		if (isTracking && vscode.window.activeTextEditor) {
			const now = Date.now();
			const timeSpent = (now - lastActive) / 1000 / 60; // Convert to minutes
			codingTimeToday += timeSpent;
			lastActive = now;
			
			// Update the webview with new data
			provider.updateWebview();
		}
	}, 60000); // Every minute

	context.subscriptions.push({ dispose: () => clearInterval(updateInterval) });
}

function startTracking() {
	isTracking = true;
	lastActive = Date.now();
}

class DashboardViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'stjhacks2025.dashboardView';
	private _view?: vscode.WebviewView;

	constructor(private readonly _extensionUri: vscode.Uri) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		this.updateWebview();
	}

	public updateWebview() {
		if (this._view) {
			this._view.webview.html = this.getHtmlForWebview();
		}
	}

	private getHtmlForWebview() {
		// Format coding time nicely
		const hours = Math.floor(codingTimeToday / 60);
		const minutes = Math.floor(codingTimeToday % 60);
		const formattedTime = hours > 0 ? 
			`${hours} hr ${minutes} min` : 
			`${minutes} min`;

		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Coding Dashboard</title>
			<style>
				body {
					font-family: var(--vscode-font-family);
					color: var(--vscode-foreground);
					padding: 0 12px;
					line-height: 1.5;
				}
				.container {
					display: flex;
					flex-direction: column;
					gap: 16px;
					padding: 16px 0;
				}
				.metric-card {
					background-color: var(--vscode-editor-background);
					border: 1px solid var(--vscode-panel-border);
					border-radius: 6px;
					padding: 12px;
				}
				.metric-title {
					font-size: 14px;
					margin: 0 0 8px 0;
					color: var(--vscode-descriptionForeground);
				}
				.metric-value {
					font-size: 20px;
					font-weight: bold;
					margin: 0;
				}
				button {
					background-color: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
					border: none;
					padding: 8px 12px;
					cursor: pointer;
					border-radius: 4px;
					font-size: 14px;
					margin-top: 8px;
				}
				button:hover {
					background-color: var(--vscode-button-hoverBackground);
				}
				.quality-indicator {
					display: flex;
					align-items: center;
					gap: 8px;
				}
				.quality-bar {
					height: 8px;
					flex-grow: 1;
					background-color: var(--vscode-inputValidation-infoBackground);
					border-radius: 4px;
					overflow: hidden;
				}
				.quality-fill {
					height: 100%;
					width: ${codeQualityScore}%;
					background-color: var(--vscode-progressBar-background);
				}
			</style>
		</head>
		<body>
			<div class="container">
				<h2>Coding Analytics</h2>
				
				<div class="metric-card">
					<h3 class="metric-title">Today's Coding Time</h3>
					<p class="metric-value">${formattedTime}</p>
				</div>
				
				<div class="metric-card">
					<h3 class="metric-title">Code Quality Score</h3>
					<div class="quality-indicator">
						<div class="quality-bar">
							<div class="quality-fill"></div>
						</div>
						<span class="metric-value">${codeQualityScore}%</span>
					</div>
				</div>
				
				<div class="metric-card">
					<h3 class="metric-title">Coding Streak</h3>
					<p class="metric-value">${codingStreak} days</p>
				</div>
				
				<button onclick="openDetailedAnalytics()">View Detailed Analytics</button>
			</div>

			<script>
				function openDetailedAnalytics() {
					const vscode = acquireVsCodeApi();
					vscode.postMessage({
						command: 'openDetailedAnalytics'
					});
				}

				window.addEventListener('message', event => {
					const message = event.data;
					// Handle any messages from the extension
				});
			</script>
		</body>
		</html>`;
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	isTracking = false;
	console.log('STJHacks2025 extension is now deactivated.');
}