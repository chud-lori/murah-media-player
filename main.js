const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');

// Set app name VERY EARLY (before app is ready) - affects macOS menu bar
// This must be called before app.whenReady() or any window creation
app.setName('Murah Media Player');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#0a0a0a',
        title: 'Murah Media Player',
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        frame: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            sandbox: true
        }
    });

    mainWindow.loadFile('player.html');
    
    // Ensure title is set after load
    mainWindow.once('ready-to-show', () => {
        mainWindow.setTitle('Murah Media Player');
    });

    // Open DevTools in development (comment out for production)
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Open Video...',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        if (mainWindow) {
                            dialog.showOpenDialog(mainWindow, {
                                properties: ['openFile'],
                                filters: [
                                    { name: 'Video Files', extensions: ['mp4', 'mkv', 'webm', 'avi', 'mov', 'm4v'] },
                                    { name: 'All Files', extensions: ['*'] }
                                ]
                            }).then(result => {
                                if (!result.canceled && result.filePaths.length > 0) {
                                    mainWindow.webContents.send('file-selected', result.filePaths[0]);
                                }
                            });
                        }
                    }
                },
                {
                    label: 'Open Subtitle...',
                    accelerator: 'CmdOrCtrl+Shift+O',
                    click: () => {
                        if (mainWindow) {
                            dialog.showOpenDialog(mainWindow, {
                                properties: ['openFile'],
                                filters: [
                                    { name: 'Subtitle Files', extensions: ['srt', 'vtt'] },
                                    { name: 'All Files', extensions: ['*'] }
                                ]
                            }).then(result => {
                                if (!result.canceled && result.filePaths.length > 0) {
                                    mainWindow.webContents.send('subtitle-selected', result.filePaths[0]);
                                }
                            });
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Playback',
            submenu: [
                {
                    label: 'Play/Pause',
                    accelerator: 'Space',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('playback-toggle');
                        }
                    }
                },
                {
                    label: 'Seek Backward',
                    accelerator: 'Left',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('seek', -5);
                        }
                    }
                },
                {
                    label: 'Seek Forward',
                    accelerator: 'Right',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('seek', 5);
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Increase Speed',
                    accelerator: 'CmdOrCtrl+]',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('speed-increase');
                        }
                    }
                },
                {
                    label: 'Decrease Speed',
                    accelerator: 'CmdOrCtrl+[',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('speed-decrease');
                        }
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Toggle Fullscreen',
                    accelerator: 'F11',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.setFullScreen(!mainWindow.isFullScreen());
                        }
                    }
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.toggleDevTools();
                        }
                    }
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        if (mainWindow) {
                            dialog.showMessageBox(mainWindow, {
                                type: 'info',
                                title: 'About',
                                message: 'Murah Media Player',
                                detail: 'A modern desktop video player built with Electron.\n\nVersion 1.0.0'
                            });
                        }
                    }
                }
            ]
        }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
        // Use app.getName() to ensure it uses the name we set
        const appName = app.getName() || 'Murah Media Player';
        template.unshift({
            label: appName,
            submenu: [
                { 
                    label: `About ${appName}`,
                    click: () => {
                        if (mainWindow) {
                            dialog.showMessageBox(mainWindow, {
                                type: 'info',
                                title: `About ${appName}`,
                                message: appName,
                                detail: 'A modern desktop video player built with Electron.\n\nVersion 1.0.0'
                            });
                        }
                    }
                },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
    createWindow();
    createMenu();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    // Cleanup if needed
});
