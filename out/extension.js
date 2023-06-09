"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
function activate(context) {
    const provider = new ColorMasterViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(ColorMasterViewProvider.viewType, provider));
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(provider);
    }
    context.subscriptions.push(vscode.languages.onDidChangeDiagnostics(() => updateDiagnostics(provider)));
}
exports.activate = activate;
function updateDiagnostics(provider) {
    const diagnostics = vscode.languages.getDiagnostics();
    let problems = 0;
    for (const [doc, collection] of diagnostics) {
        for (const c of collection) {
            if (c.severity === 0 || c.severity === 1) {
                problems++;
            }
        }
    }
    if (problems <= 0) {
        if (!["happy", "default"].includes(provider.pose)) {
            provider.setPose("happy");
            setTimeout(() => {
                provider.setPose("default");
            }, 600);
        }
        else {
            provider.setPose("default");
        }
    }
    else if (problems === 1) {
        provider.setPose("sad");
    }
    else if (problems <= 3) {
        provider.setPose("disappointed");
    }
    else if (problems <= 6) {
        provider.setPose("shocked");
    }
    else {
        provider.setPose("cry");
    }
}
class ColorMasterViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
        this.pose = "default";
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // webviewView.webview.onDidReceiveMessage(data => {
        // 	switch (data.type) {
        // 		case 'colorSelected':
        // 			{
        // 				vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
        // 				break;
        // 			}
        // 	}
        // });
    }
    setPose(pose) {
        if (this._view) {
            this._view.webview.postMessage({ type: "pose", pose });
            this.pose = pose;
        }
    }
    _getHtmlForWebview(webview) {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "main.js"));
        // Do the same for the stylesheet.
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "main.css"));
        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>ColorMaster</title>
			</head>
			<body>
				<hey-colormaster class="glow">
					<div class="container">
						<div class="body">
						<div class="face">
							<div class="eye" data-shape="circle"></div>
							<div class="mouth" data-shape="half-up"></div>
							<div class="eye" data-shape="circle"></div>
						</div>
						</div>
					</div>
				</hey-colormaster>
				<script type="module" nonce="${nonce}" src="${scriptUri}"></script>
			</body>
		</html>`;
    }
}
ColorMasterViewProvider.viewType = "colormaster.hello";
function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=extension.js.map