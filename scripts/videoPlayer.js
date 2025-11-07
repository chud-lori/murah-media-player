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
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.headerTitle = document.getElementById('headerTitle');
        
        this.subTitleFontSize = 1.8;
        this.subTitleColor = '#FFFFFF';
        this.lastVolume = 1.0;
        this.currentVideoFile = null;
        this.currentVideoPath = null;
        this.lastSavedSecond = null;
        
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
        this.videoElement.addEventListener('loadstart', () => this.onLoadStart());
        this.videoElement.addEventListener('loadedmetadata', () => this.onMetadataLoaded());
        this.videoElement.addEventListener('loadeddata', () => this.onLoadedData());
        this.videoElement.addEventListener('canplay', () => this.onCanPlay());
        this.videoElement.addEventListener('waiting', () => this.onWaiting());
        this.videoElement.addEventListener('playing', () => this.onPlaying());
        this.videoElement.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.videoElement.addEventListener('play', () => this.onPlay());
        this.videoElement.addEventListener('pause', () => this.onPause());
        this.videoElement.addEventListener('ended', () => this.onEnded());
        this.videoElement.addEventListener('error', (e) => this.onError(e));
        
        // Double-click to toggle fullscreen
        let clickTimeout = null;
        let clickCount = 0;
        
        this.videoElement.addEventListener('click', (e) => {
            clickCount++;
            if (clickTimeout) {
                clearTimeout(clickTimeout);
            }
            clickTimeout = setTimeout(() => {
                if (clickCount === 1) {
                    // Single click - play/pause
                    this.onVideoClick();
                }
                clickCount = 0;
                clickTimeout = null;
            }, 300);
        });
        
        this.videoElement.addEventListener('dblclick', (e) => {
            e.preventDefault();
            clickCount = 0;
            if (clickTimeout) {
                clearTimeout(clickTimeout);
                clickTimeout = null;
            }
            this.toggleFullscreen();
        });
        
        // Drag and drop support
        this.setupDragAndDrop();
        
        // Load saved playback position
        this.loadPlaybackPosition();
    }
    
    handleVideoFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.loadVideoFile(file);
    }
    
    loadVideoFile(file) {
        // Revoke old URL if exists
        if (this.videoElement.src) {
            URL.revokeObjectURL(this.videoElement.src);
        }
        
        this.currentVideoFile = file;
        this.currentVideoPath = file.name; // Store filename for localStorage key
        this.lastSavedSecond = null; // Reset saved position tracker
        
        // Create local URL for selected file
        const videoUrl = URL.createObjectURL(file);
        this.videoElement.src = videoUrl;
        this.videoElement.load();
        
        // Sync preview video source
        const previewVideo = document.getElementById('previewVideo');
        if (previewVideo) {
            previewVideo.src = videoUrl;
            previewVideo.load();
            // Ensure preview video is paused (we only use it for frame capture)
            previewVideo.pause();
        }
        
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
        
        // Update header title
        this.updateHeaderTitle(file.name);
    }
    
    updateHeaderTitle(title) {
        if (this.headerTitle) {
            // Remove file extension for cleaner display
            const nameWithoutExt = title.replace(/\.[^/.]+$/, '');
            this.headerTitle.textContent = nameWithoutExt || 'Murah Media Player';
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
    
    onLoadStart() {
        this.showLoading();
    }
    
    onLoadedData() {
        // Restore playback position after metadata is loaded
        this.restorePlaybackPosition();
    }
    
    onCanPlay() {
        this.hideLoading();
    }
    
    onWaiting() {
        this.showLoading();
    }
    
    onPlaying() {
        this.hideLoading();
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
        
        // Save playback position periodically (every 5 seconds)
        if (this.currentVideoPath && this.videoElement.currentTime > 0) {
            const currentSecond = Math.floor(this.videoElement.currentTime);
            if (!this.lastSavedSecond || currentSecond !== this.lastSavedSecond) {
                if (currentSecond % 5 === 0) {
                    this.savePlaybackPosition();
                    this.lastSavedSecond = currentSecond;
                }
            }
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
    
    showLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.classList.remove('hidden');
        }
    }
    
    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.classList.add('hidden');
        }
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
    
    setupDragAndDrop() {
        const videoWrapper = document.getElementById('videoWrapper');
        if (!videoWrapper) return;
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            videoWrapper.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });
        
        // Highlight drop zone
        ['dragenter', 'dragover'].forEach(eventName => {
            videoWrapper.addEventListener(eventName, () => {
                videoWrapper.classList.add('drag-over');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            videoWrapper.addEventListener(eventName, () => {
                videoWrapper.classList.remove('drag-over');
            }, false);
        });
        
        // Handle dropped files
        videoWrapper.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                // Check if it's a video file
                if (file.type.startsWith('video/') || 
                    file.name.match(/\.(mp4|mkv|webm|avi|mov|m4v)$/i)) {
                    this.loadVideoFile(file);
                } else if (file.name.match(/\.(srt|vtt)$/i)) {
                    // Handle subtitle file
                    const fakeEvent = { target: { files: [file] } };
                    this.handleSubtitleFile(fakeEvent);
                }
            }
        }, false);
    }
    
    savePlaybackPosition() {
        if (!this.currentVideoPath || !this.videoElement.duration) return;
        
        const key = `playback_position_${this.currentVideoPath}`;
        const position = this.videoElement.currentTime;
        const duration = this.videoElement.duration;
        
        // Only save if video is more than 10 seconds long and we're past 5 seconds
        if (duration > 10 && position > 5) {
            localStorage.setItem(key, JSON.stringify({
                position: position,
                duration: duration,
                timestamp: Date.now()
            }));
        }
    }
    
    loadPlaybackPosition() {
        // This will be called after metadata is loaded
    }
    
    restorePlaybackPosition() {
        if (!this.currentVideoPath || !this.videoElement.duration) return;
        
        const key = `playback_position_${this.currentVideoPath}`;
        const saved = localStorage.getItem(key);
        
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // Only restore if duration matches (within 1 second tolerance)
                if (Math.abs(data.duration - this.videoElement.duration) < 1) {
                    // Only restore if saved position is more than 5 seconds
                    if (data.position > 5 && data.position < this.videoElement.duration - 5) {
                        // Ask user if they want to resume (optional - for now, auto-resume)
                        this.videoElement.currentTime = data.position;
                    }
                }
            } catch (e) {
                console.error('Error restoring playback position:', e);
            }
        }
    }
    
    getVideoInfo() {
        if (!this.videoElement.src || !this.currentVideoFile) {
            return null;
        }
        
        // Try to get MIME type from file, or detect from extension
        let mimeType = this.currentVideoFile.type;
        if (!mimeType || mimeType === '' || mimeType === 'application/octet-stream') {
            // Detect MIME type from file extension
            const extension = this.currentVideoFile.name.split('.').pop()?.toLowerCase() || '';
            const mimeTypeMap = {
                'mp4': 'video/mp4',
                'm4v': 'video/mp4',
                'webm': 'video/webm',
                'ogg': 'video/ogg',
                'ogv': 'video/ogg',
                'avi': 'video/x-msvideo',
                'mov': 'video/quicktime',
                'mkv': 'video/x-matroska',
                'flv': 'video/x-flv',
                'wmv': 'video/x-ms-wmv'
            };
            mimeType = mimeTypeMap[extension] || 'video/unknown';
        }
        
        // Try to detect codec from video element
        let detectedVideoCodec = null;
        let detectedAudioCodec = null;
        const video = this.videoElement;
        if (video.canPlayType) {
            // Test common video codecs
            const videoCodecTests = [
                { codec: 'avc1.42E01E', name: 'H.264 Baseline' },
                { codec: 'avc1.4D001E', name: 'H.264 Main' },
                { codec: 'avc1.640028', name: 'H.264 High' },
                { codec: 'vp8', name: 'VP8' },
                { codec: 'vp9', name: 'VP9' },
                { codec: 'av01', name: 'AV1' },
                { codec: 'hev1', name: 'H.265/HEVC' },
                { codec: 'hvc1', name: 'H.265/HEVC' }
            ];
            
            for (const test of videoCodecTests) {
                const testMime = `video/mp4; codecs="${test.codec}"`;
                if (video.canPlayType(testMime) !== '') {
                    detectedVideoCodec = test.name;
                    break;
                }
            }
            
            // Test common audio codecs - try different MIME types
            const audioCodecTests = [
                { codec: 'mp4a.40.2', mime: 'audio/mp4', name: 'AAC' },
                { codec: 'mp4a.40.5', mime: 'audio/mp4', name: 'AAC' },
                { codec: 'mp4a.67', mime: 'audio/mp4', name: 'AAC' },
                { codec: 'opus', mime: 'audio/webm', name: 'Opus' },
                { codec: 'vorbis', mime: 'audio/webm', name: 'Vorbis' },
                { codec: 'vorbis', mime: 'audio/ogg', name: 'Vorbis' },
                { codec: 'flac', mime: 'audio/mp4', name: 'FLAC' },
                { codec: 'mp3', mime: 'audio/mpeg', name: 'MP3' }
            ];
            
            for (const test of audioCodecTests) {
                const testMime = `${test.mime}; codecs="${test.codec}"`;
                if (video.canPlayType(testMime) !== '') {
                    detectedAudioCodec = test.name;
                    break;
                }
            }
            
            // Also try to detect from file extension if codec detection failed
            if (!detectedAudioCodec) {
                const extension = this.currentVideoFile.name.split('.').pop()?.toLowerCase() || '';
                if (extension === 'mp4' || extension === 'm4v') {
                    detectedAudioCodec = 'AAC'; // Most common for MP4
                } else if (extension === 'webm') {
                    detectedAudioCodec = 'Opus / Vorbis'; // Common for WebM
                } else if (extension === 'mkv') {
                    detectedAudioCodec = 'Various'; // MKV can have various audio codecs
                }
            }
        }
        
        return {
            name: this.currentVideoFile.name,
            size: this.currentVideoFile.size,
            type: mimeType,
            detectedVideoCodec: detectedVideoCodec,
            detectedAudioCodec: detectedAudioCodec,
            duration: this.videoElement.duration,
            videoWidth: this.videoElement.videoWidth,
            videoHeight: this.videoElement.videoHeight,
            currentTime: this.videoElement.currentTime,
            playbackRate: this.videoElement.playbackRate,
            volume: this.videoElement.volume,
            muted: this.videoElement.muted
        };
    }
}

