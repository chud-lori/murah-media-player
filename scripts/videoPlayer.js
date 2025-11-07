/**
 * Video Player Controller
 * Handles all video playback functionality
 */

export class VideoPlayer {
    constructor() {
        this.videoElement = document.getElementById('mediaPlayer');
        this.videoFileInput = document.getElementById('videoFile');
        this.subtitleFileInput = document.getElementById('subtitleFile');
        this.messageOverlay = document.getElementById('messageOverlay');
        
        this.subTitleFontSize = 1.8;
        this.subTitleColor = '#FFFFFF';
        this.lastVolume = 1.0;
        
        this.init();
    }
    
    // Getter for video element (for backward compatibility)
    get videoPlayer() {
        return this.videoElement;
    }
    
    init() {
        this.setupEventListeners();
        this.updateSubtitleStyles();
        this.showMessage("Ready. Select a video file to start.");
    }
    
    setupEventListeners() {
        // File loading
        this.videoFileInput.addEventListener('change', (e) => this.handleVideoFile(e));
        this.subtitleFileInput.addEventListener('change', (e) => this.handleSubtitleFile(e));
        
        // Video events
        this.videoElement.addEventListener('loadedmetadata', () => this.onMetadataLoaded());
        this.videoElement.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.videoElement.addEventListener('play', () => this.onPlay());
        this.videoElement.addEventListener('pause', () => this.onPause());
        this.videoElement.addEventListener('ended', () => this.onEnded());
        this.videoElement.addEventListener('error', (e) => this.onError(e));
        this.videoElement.addEventListener('click', () => this.onVideoClick());
    }
    
    handleVideoFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Revoke old URL if exists
        if (this.videoElement.src) {
            URL.revokeObjectURL(this.videoElement.src);
        }
        
        // Create local URL for selected file
        this.videoElement.src = URL.createObjectURL(file);
        this.videoElement.load();
        this.hideMessage();
        this.showMessage("Video loaded. Press Play.");
        
        // Reset playback speed
        this.videoElement.playbackRate = 1.0;
        const speedSelect = document.getElementById('speedSelect');
        if (speedSelect) speedSelect.value = "1.0";
        
        // Update file button state
        const videoBtn = document.getElementById('videoFileBtn');
        if (videoBtn) {
            videoBtn.classList.add('has-file');
            videoBtn.innerHTML = `<i class="fas fa-check"></i> ${file.name}`;
        }
    }
    
    handleSubtitleFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const srtContent = e.target.result;
            const vttContent = this.srtToVtt(srtContent);
            
            // Convert to Blob
            const vttBlob = new Blob([vttContent], { type: 'text/vtt' });
            const vttUrl = URL.createObjectURL(vttBlob);
            
            // Remove existing tracks
            const existingTracks = this.videoElement.querySelectorAll('track');
            existingTracks.forEach(track => track.remove());
            
            // Create and append new track
            const track = document.createElement('track');
            track.kind = 'subtitles';
            track.label = 'English';
            track.srclang = 'en';
            track.src = vttUrl;
            track.default = true;
            
            this.videoElement.appendChild(track);
            
            console.log("Subtitles loaded successfully.");
            if (this.videoElement.src) {
                this.showMessage("Subtitles loaded. Click 'Play' or load a video.");
            } else {
                this.showMessage("Subtitles loaded. Now load a video file.");
            }
            
            // Update file button state
            const subtitleBtn = document.getElementById('subtitleFileBtn');
            if (subtitleBtn) {
                subtitleBtn.classList.add('has-file');
                subtitleBtn.innerHTML = `<i class="fas fa-check"></i> ${file.name}`;
            }
        };
        
        reader.onerror = () => {
            this.showMessage("Error reading subtitle file.");
        };
        
        reader.readAsText(file);
    }
    
    onMetadataLoaded() {
        this.videoElement.volume = 1.0;
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) volumeSlider.value = 1.0;
        this.updateVolumeIcon(1.0);
        
        const seekBar = document.getElementById('seekBar');
        const durationDisplay = document.getElementById('duration');
        if (seekBar) seekBar.max = this.videoElement.duration;
        if (durationDisplay) durationDisplay.textContent = this.formatTime(this.videoElement.duration);
    }
    
    onTimeUpdate() {
        const seekBar = document.getElementById('seekBar');
        const currentTimeDisplay = document.getElementById('currentTime');
        
        if (!seekBar.isDragging && seekBar) {
            seekBar.value = this.videoElement.currentTime;
        }
        if (currentTimeDisplay) {
            currentTimeDisplay.textContent = this.formatTime(this.videoElement.currentTime);
        }
    }
    
    onPlay() {
        this.hideMessage();
        const playPauseIcon = document.getElementById('playPauseIcon');
        if (playPauseIcon) {
            playPauseIcon.classList.remove('fa-play', 'translate-x-[1px]');
            playPauseIcon.classList.add('fa-pause', 'translate-x-0');
        }
    }
    
    onPause() {
        const playPauseIcon = document.getElementById('playPauseIcon');
        if (playPauseIcon) {
            playPauseIcon.classList.remove('fa-pause', 'translate-x-0');
            playPauseIcon.classList.add('fa-play', 'translate-x-[1px]');
        }
    }
    
    onEnded() {
        const playPauseIcon = document.getElementById('playPauseIcon');
        if (playPauseIcon) {
            playPauseIcon.classList.remove('fa-pause', 'translate-x-0');
            playPauseIcon.classList.add('fa-play', 'translate-x-[1px]');
        }
        this.showMessage("Playback finished!");
    }
    
    onError(e) {
        console.error("Video Error:", this.videoElement.error, e);
        const errorCode = this.videoElement.error ? this.videoElement.error.code : 'Unknown';
        this.showMessage(`Video playback error: Code ${errorCode}. Please check video codec support.`);
    }
    
    onVideoClick() {
        if (this.videoElement.src) {
            const playPauseBtn = document.getElementById('playPauseBtn');
            if (playPauseBtn) playPauseBtn.click();
        }
    }
    
    togglePlayPause() {
        if (!this.videoElement.src) {
            this.showMessage("Please load a video file first!");
            return;
        }
        
        if (this.videoElement.paused || this.videoElement.ended) {
            this.videoElement.play()
                .then(() => {
                    this.hideMessage();
                })
                .catch(error => {
                    console.error("Playback failed:", error);
                    this.showMessage("Playback failed. Ensure video format is supported.");
                });
        } else {
            this.videoElement.pause();
        }
    }
    
    seek(seconds) {
        if (this.videoElement.duration) {
            this.videoElement.currentTime = Math.max(0, Math.min(this.videoElement.duration, this.videoElement.currentTime + seconds));
        }
    }
    
    setVolume(volume) {
        this.videoElement.volume = volume;
        this.updateVolumeIcon(volume);
        
        if (volume > 0) {
            this.videoElement.muted = false;
            this.lastVolume = volume;
        } else {
            this.videoElement.muted = true;
        }
    }
    
    toggleMute() {
        if (this.videoElement.muted || this.videoElement.volume === 0) {
            this.videoElement.muted = false;
            const restoredVolume = this.lastVolume > 0 ? this.lastVolume : 0.5;
            this.videoElement.volume = restoredVolume;
            const volumeSlider = document.getElementById('volumeSlider');
            if (volumeSlider) volumeSlider.value = restoredVolume;
            this.updateVolumeIcon(restoredVolume);
        } else {
            this.lastVolume = this.videoElement.volume;
            this.videoElement.muted = true;
            const volumeSlider = document.getElementById('volumeSlider');
            if (volumeSlider) volumeSlider.value = 0;
            this.updateVolumeIcon(0);
        }
    }
    
    setPlaybackRate(rate) {
        if (this.videoElement.src) {
            this.videoElement.playbackRate = parseFloat(rate);
        }
    }
    
    updateVolumeIcon(volume) {
        const volumeIcon = document.getElementById('volumeIcon');
        if (!volumeIcon) return;
        
        volumeIcon.className = 'fas';
        if (this.videoElement.muted || volume === 0) {
            volumeIcon.classList.add('fa-volume-mute');
        } else if (volume > 0.66) {
            volumeIcon.classList.add('fa-volume-up');
        } else if (volume > 0) {
            volumeIcon.classList.add('fa-volume-down');
        }
    }
    
    updateSubtitleStyles() {
        const styleId = 'subtitleStyles';
        let style = document.getElementById(styleId);
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }
        
        style.textContent = `
            video::cue {
                color: ${this.subTitleColor} !important;
                font-size: ${this.subTitleFontSize}rem !important;
                background-color: transparent !important;
                background: none !important;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9), -1px -1px 2px rgba(0, 0, 0, 0.9);
            }
        `;
    }
    
    setSubtitleFontSize(size) {
        let val = parseFloat(size);
        if (val < 0.5) val = 0.5;
        if (val > 3.0) val = 3.0;
        this.subTitleFontSize = val;
        this.updateSubtitleStyles();
    }
    
    setSubtitleColor(color) {
        this.subTitleColor = color;
        this.updateSubtitleStyles();
    }
    
    showMessage(text) {
        if (this.messageOverlay) {
            this.messageOverlay.textContent = text;
            this.messageOverlay.classList.remove('hidden');
        }
    }
    
    hideMessage() {
        if (this.messageOverlay) {
            this.messageOverlay.classList.add('hidden');
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '00:00';
        const date = new Date(null);
        date.setSeconds(seconds);
        const result = date.toISOString().substring(11, 19);
        
        if (seconds >= 3600) {
            return result;
        }
        return result.substring(3);
    }
    
    srtToVtt(srtContent) {
        const vttContent = srtContent.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
        return 'WEBVTT\n\n' + vttContent;
    }
}

