/**
 * Controls Handler
 * Manages all UI controls and user interactions
 */

export class ControlsHandler {
    constructor(videoPlayer) {
        this.videoPlayer = videoPlayer;
        this.controlsHidden = false;
        this.inactivityTimeout = null;
        this.inactivityDelay = 3000; // 3 seconds
        this.init();
    }
    
    init() {
        this.setupControlButtons();
        this.setupSeekBar();
        this.setupVolumeControls();
        this.setupSpeedControl();
        this.setupSubtitleControls();
        this.setupKeyboardControls();
        this.setupAutoHideControls();
        this.setupAlwaysOnTop();
        this.setupVideoInfoPanel();
        this.setupKeyboardHelp();
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
        const seekBarWrapper = document.querySelector('.seek-bar-wrapper');
        const seekBarTooltip = document.getElementById('seekBarTooltip');
        const seekBarPreview = document.getElementById('seekBarPreview');
        const currentTimeDisplay = document.getElementById('currentTime');
        
        if (!seekBar || !seekBarWrapper) return;
        
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
        
        // Seek bar tooltip and preview on hover
        let showPreview = false;
        let isHovering = false;
        let previewCanvas = null;
        let previewVideo = null;
        let previewTimeout = null;
        let previewVideoLoaded = false;
        
        // Initialize preview canvas and hidden video
        const previewCanvasEl = document.getElementById('seekPreviewCanvas');
        if (previewCanvasEl) {
            previewCanvas = previewCanvasEl;
            previewCanvas.width = 200;
            previewCanvas.height = 112; // 16:9 aspect ratio
        }
        
        // Get or create hidden preview video element
        previewVideo = document.getElementById('previewVideo');
        if (!previewVideo) {
            previewVideo = document.createElement('video');
            previewVideo.id = 'previewVideo';
            previewVideo.style.cssText = 'display: none; position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none;';
            previewVideo.preload = 'auto';
            previewVideo.muted = true;
            previewVideo.playsInline = true;
            document.body.appendChild(previewVideo);
        } else {
            // Ensure it's muted
            previewVideo.muted = true;
        }
        
        // Sync preview video source when main video loads
        const syncPreviewVideo = () => {
            const mainVideo = this.videoPlayer.videoElement;
            if (mainVideo.src && mainVideo.src !== previewVideo.src) {
                previewVideo.src = mainVideo.src;
                previewVideo.load();
                previewVideoLoaded = false;
                previewVideo.pause();
                previewVideo.muted = true;
                
                const onLoaded = () => {
                    previewVideoLoaded = true;
                    previewVideo.pause();
                    previewVideo.muted = true;
                };
                
                previewVideo.addEventListener('loadedmetadata', onLoaded, { once: true });
                previewVideo.addEventListener('canplay', onLoaded, { once: true });
                previewVideo.addEventListener('loadeddata', onLoaded, { once: true });
            } else if (mainVideo.src && previewVideo.src === mainVideo.src) {
                // Already synced, just check if loaded
                if (previewVideo.readyState >= 2) {
                    previewVideoLoaded = true;
                }
            }
        };
        
        // Sync when main video source changes
        this.videoPlayer.videoElement.addEventListener('loadedmetadata', syncPreviewVideo);
        this.videoPlayer.videoElement.addEventListener('canplay', syncPreviewVideo);
        syncPreviewVideo();
        
        // Track active seek operations
        let activeSeekOperation = null;
        
        // Function to capture video frame at specific time using hidden video
        const captureFrameAtTime = (time) => {
            if (!previewCanvas || !previewVideo) return;
            
            const ctx = previewCanvas.getContext('2d');
            const mainVideo = this.videoPlayer.videoElement;
            
            // Ensure preview video has the same source
            if (!previewVideo.src || previewVideo.src !== mainVideo.src) {
                syncPreviewVideo();
                // Try again after a short delay
                setTimeout(() => captureFrameAtTime(time), 100);
                return;
            }
            
            // Check if preview video is ready (use readyState instead of flag)
            if (previewVideo.readyState < 2) {
                // Wait a bit and try again
                setTimeout(() => captureFrameAtTime(time), 50);
                return;
            }
            
            // Ensure preview video is paused and muted
            previewVideo.pause();
            previewVideo.muted = true;
            
            // Cancel previous operation
            if (activeSeekOperation) {
                clearTimeout(activeSeekOperation);
            }
            
            // Seek to target time
            previewVideo.currentTime = time;
            
            // Capture frame function
            const captureFrame = () => {
                try {
                    if (previewVideo.readyState >= 2 && previewVideo.videoWidth > 0) {
                        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
                        ctx.drawImage(previewVideo, 0, 0, previewCanvas.width, previewCanvas.height);
                    }
                } catch (e) {
                    // Silently fail - might be CORS or other issue
                }
                activeSeekOperation = null;
            };
            
            // Listen for seeked event
            const onSeeked = () => {
                // Try capturing immediately and with a small delay
                requestAnimationFrame(captureFrame);
                setTimeout(captureFrame, 50);
                previewVideo.removeEventListener('seeked', onSeeked);
            };
            
            previewVideo.addEventListener('seeked', onSeeked, { once: true });
            
            // Fallback - try capturing after timeout
            activeSeekOperation = setTimeout(() => {
                captureFrame();
                previewVideo.removeEventListener('seeked', onSeeked);
            }, 400);
        };
        
        // Use both seekBar and seekBarWrapper for better event handling
        const handleSeekBarHover = (e) => {
            if (!this.videoPlayer.videoElement.duration) return;
            
            const rect = seekBar.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const time = Math.max(0, Math.min(this.videoPlayer.videoElement.duration, percent * this.videoPlayer.videoElement.duration));
            
            // Show preview on hover (hide tooltip when preview is shown)
            if (seekBarPreview) {
                seekBarPreview.classList.remove('hidden');
                const previewTime = seekBarPreview.querySelector('.seek-preview-time');
                if (previewTime) {
                    previewTime.textContent = this.videoPlayer.formatTime(time);
                }
                const previewLeft = Math.max(10, Math.min(90, percent * 100));
                seekBarPreview.style.left = `${previewLeft}%`;
                seekBarPreview.style.opacity = '1';
                showPreview = true;
                
                // Capture frame with minimal debouncing for responsive preview
                if (previewTimeout) {
                    clearTimeout(previewTimeout);
                }
                // Reduced debounce for faster, more responsive preview (like Netflix)
                previewTimeout = setTimeout(() => {
                    captureFrameAtTime(time);
                }, 50); // Faster debounce for better responsiveness
                
                // Hide tooltip when preview is shown
                if (seekBarTooltip) {
                    seekBarTooltip.style.opacity = '0';
                }
            } else {
                // Fallback to tooltip if preview doesn't exist
                if (seekBarTooltip) {
                    seekBarTooltip.textContent = this.videoPlayer.formatTime(time);
                    const tooltipLeft = Math.max(5, Math.min(95, percent * 100));
                    seekBarTooltip.style.left = `${tooltipLeft}%`;
                    seekBarTooltip.style.opacity = '1';
                }
                showPreview = false;
            }
        };
        
        const handleSeekBarLeave = () => {
            if (previewTimeout) {
                clearTimeout(previewTimeout);
                previewTimeout = null;
            }
            
            if (seekBarTooltip) {
                seekBarTooltip.style.opacity = '0';
            }
            if (seekBarPreview) {
                seekBarPreview.classList.add('hidden');
                seekBarPreview.style.opacity = '0';
            }
            showPreview = false;
            isHovering = false;
        };
        
        // Add event listeners to both seek bar and wrapper
        seekBar.addEventListener('mousemove', handleSeekBarHover);
        seekBarWrapper.addEventListener('mousemove', handleSeekBarHover);
        
        seekBar.addEventListener('mouseleave', handleSeekBarLeave);
        seekBarWrapper.addEventListener('mouseleave', handleSeekBarLeave);
        
        seekBarWrapper.addEventListener('mouseenter', () => {
            isHovering = true;
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
            // T key: Always on top toggle
            else if (e.key === 't' || e.key === 'T') {
                e.preventDefault();
                this.toggleAlwaysOnTop();
            }
            // I key: Video info panel
            else if (e.key === 'i' || e.key === 'I') {
                e.preventDefault();
                this.toggleVideoInfoPanel();
            }
            // ? key: Keyboard help
            else if (e.key === '?') {
                e.preventDefault();
                this.toggleKeyboardHelp();
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
    
    setupAutoHideControls() {
        const controlsSection = document.querySelector('.controls-section');
        const videoWrapper = document.getElementById('videoWrapper');
        
        if (!controlsSection || !videoWrapper) return;
        
        // Show controls on mouse move
        let mouseMoveTimeout = null;
        const showControls = () => {
            this.resetInactivityTimer();
        };
        
        // Track mouse movement
        document.addEventListener('mousemove', () => {
            if (this.controlsHidden) {
                this.showControls();
            }
            this.resetInactivityTimer();
        });
        
        // Track any user interaction
        controlsSection.addEventListener('mouseenter', () => {
            this.resetInactivityTimer();
        });
        
        // Don't hide controls if mouse is over controls
        controlsSection.addEventListener('mouseleave', () => {
            this.resetInactivityTimer();
        });
    }
    
    resetInactivityTimer() {
        clearTimeout(this.inactivityTimeout);
        
        // Only hide controls if video is playing and not paused
        if (this.videoPlayer.videoElement && 
            !this.videoPlayer.videoElement.paused && 
            this.videoPlayer.videoElement.src) {
            this.inactivityTimeout = setTimeout(() => {
                this.hideControls();
            }, this.inactivityDelay);
        }
    }
    
    showControls() {
        const controlsSection = document.querySelector('.controls-section');
        if (controlsSection) {
            controlsSection.classList.remove('hidden');
            this.controlsHidden = false;
        }
    }
    
    hideControls() {
        const controlsSection = document.querySelector('.controls-section');
        if (controlsSection && !controlsSection.matches(':hover')) {
            controlsSection.classList.add('hidden');
            this.controlsHidden = true;
        }
    }
    
    setupAlwaysOnTop() {
        const alwaysOnTopBtn = document.getElementById('alwaysOnTopBtn');
        if (!alwaysOnTopBtn) return;
        
        alwaysOnTopBtn.addEventListener('click', () => {
            this.toggleAlwaysOnTop();
        });
        
        // Check initial state
        if (window.electronAPI && window.electronAPI.isAlwaysOnTop) {
            window.electronAPI.isAlwaysOnTop().then(isOnTop => {
                if (isOnTop) {
                    alwaysOnTopBtn.classList.add('active');
                }
            });
        }
    }
    
    toggleAlwaysOnTop() {
        if (window.electronAPI && window.electronAPI.toggleAlwaysOnTop) {
            window.electronAPI.toggleAlwaysOnTop().then(isOnTop => {
                const alwaysOnTopBtn = document.getElementById('alwaysOnTopBtn');
                if (alwaysOnTopBtn) {
                    if (isOnTop) {
                        alwaysOnTopBtn.classList.add('active');
                    } else {
                        alwaysOnTopBtn.classList.remove('active');
                    }
                }
            });
        } else {
            // Fallback: use IPC message
            if (window.electronAPI && window.electronAPI.sendMessage) {
                window.electronAPI.sendMessage('toggle-always-on-top');
            }
        }
    }
    
    setupVideoInfoPanel() {
        const videoInfoBtn = document.getElementById('videoInfoBtn');
        const closeVideoInfoBtn = document.getElementById('closeVideoInfoBtn');
        const videoInfoPanel = document.getElementById('videoInfoPanel');
        
        if (videoInfoBtn) {
            videoInfoBtn.addEventListener('click', () => {
                this.toggleVideoInfoPanel();
            });
        }
        
        if (closeVideoInfoBtn) {
            closeVideoInfoBtn.addEventListener('click', () => {
                this.toggleVideoInfoPanel();
            });
        }
        
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && videoInfoPanel && !videoInfoPanel.classList.contains('hidden')) {
                this.toggleVideoInfoPanel();
            }
        });
    }
    
    toggleVideoInfoPanel() {
        const videoInfoPanel = document.getElementById('videoInfoPanel');
        const videoInfoContent = document.getElementById('videoInfoContent');
        
        if (!videoInfoPanel || !videoInfoContent) return;
        
        if (videoInfoPanel.classList.contains('hidden')) {
            // Show panel and populate info
            const info = this.videoPlayer.getVideoInfo();
            if (info) {
                const fileSizeMB = (info.size / (1024 * 1024)).toFixed(2);
                const fileSizeGB = (info.size / (1024 * 1024 * 1024)).toFixed(2);
                const fileSizeDisplay = info.size > 1024 * 1024 * 1024 ? `${fileSizeGB} GB` : `${fileSizeMB} MB`;
                const duration = this.videoPlayer.formatTime(info.duration);
                const currentTime = this.videoPlayer.formatTime(info.currentTime);
                const resolution = `${info.videoWidth} × ${info.videoHeight}`;
                const aspectRatio = (info.videoWidth / info.videoHeight).toFixed(2);
                
                // Calculate approximate bitrate (if duration is available)
                let bitrateInfo = 'N/A';
                if (info.duration > 0) {
                    const bitrateKbps = Math.round((info.size * 8) / (info.duration * 1000));
                    const bitrateMbps = (bitrateKbps / 1000).toFixed(2);
                    bitrateInfo = bitrateMbps > 1 ? `${bitrateMbps} Mbps` : `${bitrateKbps} Kbps`;
                }
                
                // Extract codec info from MIME type and detected codec
                let codecInfo = 'Unknown';
                let videoCodec = 'Unknown';
                let audioCodec = 'Unknown';
                
                // Use detected codecs if available
                if (info.detectedVideoCodec) {
                    videoCodec = info.detectedVideoCodec;
                }
                if (info.detectedAudioCodec) {
                    audioCodec = info.detectedAudioCodec;
                }
                
                // If we have detected codecs, use them
                if (info.detectedVideoCodec || info.detectedAudioCodec) {
                    codecInfo = [info.detectedVideoCodec || 'Unknown Video', info.detectedAudioCodec || 'Unknown Audio'].join(' / ');
                } else if (info.type) {
                    // Try to extract codecs from MIME type
                    const codecMatch = info.type.match(/codecs="([^"]+)"/);
                    if (codecMatch) {
                        const codecs = codecMatch[1].split(',');
                        videoCodec = codecs[0]?.trim() || 'Unknown';
                        audioCodec = codecs[1]?.trim() || 'Unknown';
                        codecInfo = codecs.join(', ');
                    } else {
                        // Extract from type string and guess from format
                        const typeParts = info.type.split('/');
                        if (typeParts.length > 1) {
                            const format = typeParts[1].split(';')[0].trim();
                            codecInfo = format;
                            
                            // Get file extension for better detection
                            const fileExtension = info.name.split('.').pop()?.toLowerCase() || '';
                            
                            // Try to guess codec from format and extension
                            if (format.includes('mp4') || format.includes('mpeg4') || fileExtension === 'mp4' || fileExtension === 'm4v') {
                                if (!videoCodec || videoCodec === 'Unknown') {
                                    videoCodec = 'H.264 / MPEG-4';
                                }
                                if (!audioCodec || audioCodec === 'Unknown') {
                                    audioCodec = 'AAC';
                                }
                            } else if (format.includes('webm') || fileExtension === 'webm') {
                                if (!videoCodec || videoCodec === 'Unknown') {
                                    videoCodec = 'VP8 / VP9';
                                }
                                if (!audioCodec || audioCodec === 'Unknown') {
                                    audioCodec = 'Vorbis / Opus';
                                }
                            } else if (format.includes('matroska') || format.includes('mkv') || fileExtension === 'mkv') {
                                if (!videoCodec || videoCodec === 'Unknown') {
                                    videoCodec = 'Various (MKV)';
                                }
                                if (!audioCodec || audioCodec === 'Unknown') {
                                    audioCodec = 'Various';
                                }
                            } else if (format.includes('quicktime') || fileExtension === 'mov') {
                                if (!videoCodec || videoCodec === 'Unknown') {
                                    videoCodec = 'H.264 / QuickTime';
                                }
                                if (!audioCodec || audioCodec === 'Unknown') {
                                    audioCodec = 'AAC';
                                }
                            } else if (fileExtension === 'avi') {
                                if (!videoCodec || videoCodec === 'Unknown') {
                                    videoCodec = 'Various (AVI)';
                                }
                                if (!audioCodec || audioCodec === 'Unknown') {
                                    audioCodec = 'Various';
                                }
                            } else {
                                if (!videoCodec || videoCodec === 'Unknown') {
                                    videoCodec = format || 'Unknown';
                                }
                                if (!audioCodec || audioCodec === 'Unknown') {
                                    audioCodec = 'Unknown';
                                }
                            }
                        } else {
                            codecInfo = info.type;
                        }
                    }
                }
                
                // Get file extension for better format detection
                const fileExtension = info.name.split('.').pop()?.toLowerCase() || '';
                const formatName = fileExtension.toUpperCase() || 'Unknown';
                
                videoInfoContent.innerHTML = `
                    <div class="video-info-section">
                        <h4>File Information</h4>
                        <p><strong>File Name:</strong><br><span class="info-value">${info.name}</span></p>
                        <p><strong>File Size:</strong> <span class="info-value">${fileSizeDisplay}</span></p>
                        <p><strong>File Format:</strong> <span class="info-value">${formatName}</span></p>
                        <p><strong>MIME Type:</strong> <span class="info-value">${info.type || 'Unknown'}</span></p>
                    </div>
                    
                    <div class="video-info-section">
                        <h4>Video Properties</h4>
                        <p><strong>Resolution:</strong> <span class="info-value">${resolution}</span></p>
                        <p><strong>Aspect Ratio:</strong> <span class="info-value">${aspectRatio}:1</span></p>
                        <p><strong>Video Codec:</strong> <span class="info-value">${videoCodec}</span></p>
                        <p><strong>Audio Codec:</strong> <span class="info-value">${audioCodec}</span></p>
                        <p><strong>Bitrate:</strong> <span class="info-value">${bitrateInfo}</span></p>
                    </div>
                    
                    <div class="video-info-section">
                        <h4>Playback Information</h4>
                        <p><strong>Duration:</strong> <span class="info-value">${duration}</span></p>
                        <p><strong>Current Time:</strong> <span class="info-value">${currentTime}</span></p>
                        <p><strong>Playback Rate:</strong> <span class="info-value">${info.playbackRate}x</span></p>
                        <p><strong>Volume:</strong> <span class="info-value">${Math.round(info.volume * 100)}%</span></p>
                        <p><strong>Muted:</strong> <span class="info-value">${info.muted ? 'Yes' : 'No'}</span></p>
                    </div>
                `;
            } else {
                videoInfoContent.innerHTML = '<p>No video loaded</p>';
            }
            videoInfoPanel.classList.remove('hidden');
        } else {
            videoInfoPanel.classList.add('hidden');
        }
    }
    
    setupKeyboardHelp() {
        const keyboardHelpBtn = document.getElementById('keyboardHelpBtn');
        const closeKeyboardHelpBtn = document.getElementById('closeKeyboardHelpBtn');
        const keyboardHelpOverlay = document.getElementById('keyboardHelpOverlay');
        const keyboardHelpList = document.getElementById('keyboardHelpList');
        
        if (keyboardHelpBtn) {
            keyboardHelpBtn.addEventListener('click', () => {
                this.toggleKeyboardHelp();
            });
        }
        
        if (closeKeyboardHelpBtn) {
            closeKeyboardHelpBtn.addEventListener('click', () => {
                this.toggleKeyboardHelp();
            });
        }
        
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && keyboardHelpOverlay && !keyboardHelpOverlay.classList.contains('hidden')) {
                this.toggleKeyboardHelp();
            }
        });
        
        // Populate keyboard shortcuts
        if (keyboardHelpList) {
            const shortcuts = [
                { key: 'Space', description: 'Play/Pause' },
                { key: 'Left Arrow', description: 'Seek Backward 5s' },
                { key: 'Right Arrow', description: 'Seek Forward 5s' },
                { key: 'Up Arrow', description: 'Increase Volume' },
                { key: 'Down Arrow', description: 'Decrease Volume' },
                { key: 'M', description: 'Mute/Unmute' },
                { key: 'F', description: 'Toggle Fullscreen' },
                { key: 'F11', description: 'Toggle Fullscreen (Alt)' },
                { key: 'T', description: 'Toggle Always on Top' },
                { key: 'I', description: 'Show Video Info' },
                { key: '?', description: 'Show Keyboard Shortcuts' },
                { key: 'Esc', description: 'Close Overlays' },
                { key: 'Double Click', description: 'Toggle Fullscreen (on video)' }
            ];
            
            keyboardHelpList.innerHTML = shortcuts.map(shortcut => `
                <div class="keyboard-help-item">
                    <span class="keyboard-help-description">${shortcut.description}</span>
                    <span class="keyboard-help-key">${shortcut.key}</span>
                </div>
            `).join('');
        }
    }
    
    toggleKeyboardHelp() {
        const keyboardHelpOverlay = document.getElementById('keyboardHelpOverlay');
        if (!keyboardHelpOverlay) return;
        
        if (keyboardHelpOverlay.classList.contains('hidden')) {
            keyboardHelpOverlay.classList.remove('hidden');
        } else {
            keyboardHelpOverlay.classList.add('hidden');
        }
    }
}

