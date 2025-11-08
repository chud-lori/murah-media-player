/**
 * Main Application Entry Point
 * Initializes the video player and controls
 */

import { VideoPlayer } from './videoPlayer.js';
import { ControlsHandler } from './controls.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    const videoPlayer = new VideoPlayer();
    console.log('VideoPlayer created:', videoPlayer);
    const controlsHandler = new ControlsHandler(videoPlayer);
    console.log('ControlsHandler created:', controlsHandler);
    
    // Make videoPlayer and controlsHandler globally accessible
    window.videoPlayer = videoPlayer;
    window.controlsHandler = controlsHandler;
    console.log('Global objects set');
});

