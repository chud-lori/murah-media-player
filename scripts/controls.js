/**
 * Controls Handler
 * Manages all UI controls and user interactions
 */

export class ControlsHandler {
    constructor(videoPlayer) {
        this.videoPlayer = videoPlayer;
        this.init();
    }
    
    init() {
        this.setupControlButtons();
        this.setupSeekBar();
        this.setupVolumeControls();
        this.setupSpeedControl();
        this.setupSubtitleControls();
        this.setupKeyboardControls();
    }
    
    setupControlButtons() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const prev5Btn = document.getElementById('prev5Btn');
        const next5Btn = document.getElementById('next5Btn');
        const fullscreenBtn = document.getElementById('fullscreenToggleBtn');
        
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.videoPlayer.togglePlayPause());
        }
        
        if (prev5Btn) {
            prev5Btn.addEventListener('click', () => {
                this.showSkipIndicator(-5);
                this.videoPlayer.seek(-5);
            });
        }
        
        if (next5Btn) {
            next5Btn.addEventListener('click', () => {
                this.showSkipIndicator(5);
                this.videoPlayer.seek(5);
            });
        }
        
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }
        
        // Update fullscreen icon on state change
        document.addEventListener('fullscreenchange', () => {
            const fullscreenIcon = document.getElementById('fullscreenIcon');
            if (!fullscreenIcon) return;
            
            if (document.fullscreenElement) {
                fullscreenIcon.classList.remove('fa-expand');
                fullscreenIcon.classList.add('fa-compress');
            } else {
                fullscreenIcon.classList.remove('fa-compress');
                fullscreenIcon.classList.add('fa-expand');
            }
        });
    }
    
    setupSeekBar() {
        const seekBar = document.getElementById('seekBar');
        const currentTimeDisplay = document.getElementById('currentTime');
        
        if (!seekBar) return;
        
        seekBar.addEventListener('mousedown', () => {
            seekBar.isDragging = true;
        });
        
        seekBar.addEventListener('mouseup', () => {
            seekBar.isDragging = false;
        });
        
        seekBar.addEventListener('input', () => {
            if (currentTimeDisplay) {
                currentTimeDisplay.textContent = this.videoPlayer.formatTime(seekBar.value);
            }
        });
        
        seekBar.addEventListener('change', () => {
            this.videoPlayer.videoElement.currentTime = parseFloat(seekBar.value);
        });
    }
    
    setupVolumeControls() {
        const volumeSlider = document.getElementById('volumeSlider');
        const muteToggleBtn = document.getElementById('muteToggleBtn');
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const newVolume = parseFloat(e.target.value);
                this.videoPlayer.setVolume(newVolume);
                this.showVolumeIndicator(newVolume);
            });
        }
        
        if (muteToggleBtn) {
            muteToggleBtn.addEventListener('click', () => {
                this.videoPlayer.toggleMute();
            });
        }
    }
    
    setupSpeedControl() {
        const speedSelect = document.getElementById('speedSelect');
        if (speedSelect) {
            speedSelect.addEventListener('change', (e) => {
                this.videoPlayer.setPlaybackRate(e.target.value);
            });
        }
    }
    
    setupSubtitleControls() {
        const fontSizeInput = document.getElementById('fontSizeInput');
        const colorInput = document.getElementById('colorInput');
        
        if (fontSizeInput) {
            fontSizeInput.addEventListener('input', (e) => {
                let val = parseFloat(e.target.value);
                if (val < 0.5) val = 0.5;
                if (val > 3.0) val = 3.0;
                e.target.value = val.toFixed(1);
                this.videoPlayer.setSubtitleFontSize(val);
            });
        }
        
        if (colorInput) {
            colorInput.addEventListener('input', (e) => {
                this.videoPlayer.setSubtitleColor(e.target.value);
            });
        }
    }
    
    setupKeyboardControls() {
        // Make body focusable to receive keyboard events
        document.body.setAttribute('tabindex', '-1');
        
        // Ensure body has focus on load
        window.addEventListener('load', () => {
            document.body.focus();
        });
        
        // Also focus body when clicking on video area
        const videoWrapper = document.getElementById('videoWrapper');
        if (videoWrapper) {
            videoWrapper.addEventListener('click', () => {
                document.body.focus();
            });
        }
        
        document.addEventListener('keydown', (e) => {
            // Ignore if input/select is focused
            if (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'SELECT') {
                return;
            }
            
            // F key: Fullscreen toggle (works even without video)
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                this.toggleFullscreen();
                return;
            }
            
            // Other controls require video to be loaded
            if (!this.videoPlayer.videoElement.src) {
                return;
            }
            
            // Right Arrow: +5 seconds
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.showSkipIndicator(5);
                this.videoPlayer.seek(5);
            }
            // Left Arrow: -5 seconds
            else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.showSkipIndicator(-5);
                this.videoPlayer.seek(-5);
            }
            // Up Arrow: Increase volume
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.adjustVolume(0.1);
            }
            // Down Arrow: Decrease volume
            else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.adjustVolume(-0.1);
            }
            // Spacebar: Play/Pause
            else if (e.key === ' ') {
                e.preventDefault();
                this.videoPlayer.togglePlayPause();
            }
            // M key: Mute toggle
            else if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                this.videoPlayer.toggleMute();
            }
        });
    }
    
    toggleFullscreen() {
        const videoWrapper = document.getElementById('videoWrapper');
        if (!videoWrapper) return;
        
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            if (videoWrapper.requestFullscreen) {
                videoWrapper.requestFullscreen();
            } else if (videoWrapper.webkitRequestFullscreen) {
                videoWrapper.webkitRequestFullscreen();
            } else if (videoWrapper.mozRequestFullScreen) {
                videoWrapper.mozRequestFullScreen();
            }
        }
    }
    
    showSkipIndicator(seconds) {
        const indicator = document.getElementById('skipIndicator');
        const skipIcon = indicator.querySelector('.skip-icon');
        const skipText = indicator.querySelector('.skip-text');
        
        if (!indicator || !this.videoPlayer.videoElement.src) return;
        
        // Set icon and text
        if (seconds > 0) {
            skipIcon.className = 'skip-icon fas fa-forward';
            skipText.textContent = `+${seconds}s`;
            // Position on right side
            indicator.classList.remove('skip-indicator-left');
            indicator.classList.add('skip-indicator-right');
        } else {
            skipIcon.className = 'skip-icon fas fa-backward';
            skipText.textContent = `${seconds}s`;
            // Position on left side
            indicator.classList.remove('skip-indicator-right');
            indicator.classList.add('skip-indicator-left');
        }
        
        // Show indicator with animation
        indicator.classList.remove('skip-indicator-hide');
        indicator.classList.add('skip-indicator-show');
        
        // Hide after animation
        clearTimeout(this.skipIndicatorTimeout);
        this.skipIndicatorTimeout = setTimeout(() => {
            indicator.classList.remove('skip-indicator-show');
            indicator.classList.add('skip-indicator-hide');
        }, 1000);
    }
    
    adjustVolume(delta) {
        if (!this.videoPlayer.videoElement.src) return;
        
        const volumeSlider = document.getElementById('volumeSlider');
        if (!volumeSlider) return;
        
        const currentVolume = parseFloat(volumeSlider.value);
        const newVolume = Math.max(0, Math.min(1, currentVolume + delta));
        
        volumeSlider.value = newVolume;
        this.videoPlayer.setVolume(newVolume);
        
        // Show volume indicator
        this.showVolumeIndicator(newVolume);
    }
    
    showVolumeIndicator(volume) {
        const indicator = document.getElementById('volumeIndicator');
        const volumeIcon = indicator.querySelector('.volume-indicator-icon');
        const volumeText = indicator.querySelector('.volume-indicator-text');
        
        if (!indicator || !this.videoPlayer.videoElement.src) return;
        
        // Set icon based on volume level
        volumeIcon.className = 'volume-indicator-icon fas';
        if (volume === 0 || this.videoPlayer.videoElement.muted) {
            volumeIcon.classList.add('fa-volume-mute');
        } else if (volume > 0.66) {
            volumeIcon.classList.add('fa-volume-up');
        } else if (volume > 0) {
            volumeIcon.classList.add('fa-volume-down');
        }
        
        // Set percentage text
        const percentage = Math.round(volume * 100);
        volumeText.textContent = `${percentage}%`;
        
        // Show indicator with animation
        indicator.classList.remove('volume-indicator-hide');
        indicator.classList.add('volume-indicator-show');
        
        // Hide after animation
        clearTimeout(this.volumeIndicatorTimeout);
        this.volumeIndicatorTimeout = setTimeout(() => {
            indicator.classList.remove('volume-indicator-show');
            indicator.classList.add('volume-indicator-hide');
        }, 1000);
    }
}

