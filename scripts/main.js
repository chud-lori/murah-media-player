/**
 * Main Application Entry Point
 * Initializes the video player and controls
 */

import { VideoPlayer } from './videoPlayer.js';
import { ControlsHandler } from './controls.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const videoPlayer = new VideoPlayer();
    const controlsHandler = new ControlsHandler(videoPlayer);
    
    // Make videoPlayer globally accessible for debugging if needed
    window.videoPlayer = videoPlayer;
});

