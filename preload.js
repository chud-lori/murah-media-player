/**
 * Preload Script
 * Secure bridge between main process and renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    onFileSelected: (callback) => ipcRenderer.on('file-selected', (event, filePath) => callback(filePath)),
    onSubtitleSelected: (callback) => ipcRenderer.on('subtitle-selected', (event, filePath) => callback(filePath)),
    onPlaybackToggle: (callback) => ipcRenderer.on('playback-toggle', () => callback()),
    onSeek: (callback) => ipcRenderer.on('seek', (event, seconds) => callback(seconds)),
    onSpeedIncrease: (callback) => ipcRenderer.on('speed-increase', () => callback()),
    onSpeedDecrease: (callback) => ipcRenderer.on('speed-decrease', () => callback()),
});
