const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;

createApp({
    setup() {
        // Reactive state
        const videoUrl = ref(null);
        const videoFileName = ref('');
        const subtitleFileName = ref('');
        const subtitles = ref([]);
        const currentSubtitle = ref('');
        const videoPlayer = ref(null);
        const subtitleInput = ref(null);
        const isPlaying = ref(false);
        const currentTime = ref(0);
        const duration = ref(0);

        // Handle video upload
        const handleVideoUpload = (event) => {
            const file = event.target.files[0];
            if (file) {
                // Validate file type
                const validTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 
                                   'video/x-flv', 'video/webm', 'video/x-ms-wmv', 'video/3gpp'];
                
                if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|mpeg|mov|avi|flv|mpg|webm|wmv|3gp)$/i)) {
                    alert('Please select a valid video file');
                    return;
                }

                videoFileName.value = file.name;
                videoUrl.value = URL.createObjectURL(file);
                
                // Reinitialize icons after DOM update
                nextTick(() => {
                    lucide.createIcons();
                });
            }
        };

        // Handle subtitle upload
        const handleSubtitleUpload = (event) => {
            const file = event.target.files[0];
            if (file && file.name.endsWith('.srt')) {
                subtitleFileName.value = file.name;
                const reader = new FileReader();
                reader.onload = (e) => {
                    parseSRT(e.target.result);
                };
                reader.readAsText(file);
            }
        };

        // Parse SRT file
        const parseSRT = (srtText) => {
            const srtRegex = /(\d+)\s*\n\s*(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})\s*\n\s*([\s\S]*?)(?=\n\s*\n|\s*$)/g;
            const parsedSubtitles = [];
            let match;

            while ((match = srtRegex.exec(srtText)) !== null) {
                parsedSubtitles.push({
                    index: parseInt(match[1]),
                    startTime: timeToSeconds(match[2]),
                    endTime: timeToSeconds(match[3]),
                    text: match[4].replace(/\n/g, ' ').trim()
                });
            }

            subtitles.value = parsedSubtitles;
            console.log('Parsed subtitles:', parsedSubtitles.length);
        };

        // Convert time format to seconds
        const timeToSeconds = (timeString) => {
            const [hours, minutes, secondsAndMs] = timeString.split(':');
            const [seconds, milliseconds] = secondsAndMs.split(',');
            return (
                parseInt(hours) * 3600 +
                parseInt(minutes) * 60 +
                parseInt(seconds) +
                parseInt(milliseconds) / 1000
            );
        };

        // Update subtitles based on current time
        const updateSubtitles = () => {
            if (!videoPlayer.value) return;
            
            currentTime.value = videoPlayer.value.currentTime;
            isPlaying.value = !videoPlayer.value.paused;
            
            const current = subtitles.value.find(
                sub => currentTime.value >= sub.startTime && currentTime.value <= sub.endTime
            );
            
            currentSubtitle.value = current ? current.text : '';
            
            // Update play/pause icon
            nextTick(() => {
                lucide.createIcons();
            });
        };

        // Handle video loaded
        const handleVideoLoaded = () => {
            if (videoPlayer.value) {
                duration.value = videoPlayer.value.duration;
            }
        };

        // Format time for display
        const formatTime = (seconds) => {
            if (isNaN(seconds) || seconds === null || seconds === undefined) return '00:00';
            
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            
            if (h > 0) {
                return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
            return `${m}:${s.toString().padStart(2, '0')}`;
        };

        // Toggle play/pause
        const togglePlay = () => {
            if (videoPlayer.value) {
                if (videoPlayer.value.paused) {
                    videoPlayer.value.play();
                    isPlaying.value = true;
                } else {
                    videoPlayer.value.pause();
                    isPlaying.value = false;
                }
                
                // Update icon
                nextTick(() => {
                    lucide.createIcons();
                });
            }
        };

        // Reset player
        const resetPlayer = () => {
            if (videoUrl.value) {
                URL.revokeObjectURL(videoUrl.value);
            }
            videoUrl.value = null;
            videoFileName.value = '';
            subtitleFileName.value = '';
            subtitles.value = [];
            currentSubtitle.value = '';
            isPlaying.value = false;
            currentTime.value = 0;
            duration.value = 0;
            
            // Clear file inputs
            const videoInput = document.getElementById('video-upload');
            const subtitleInput = document.getElementById('subtitle-upload');
            if (videoInput) videoInput.value = '';
            if (subtitleInput) subtitleInput.value = '';
        };

        // Trigger subtitle upload from video player
        const triggerSubtitleUpload = () => {
            const input = document.getElementById('subtitle-upload');
            if (input) {
                input.click();
            }
        };

        // Initialize Lucide icons
        onMounted(() => {
            // Initial icon setup
            lucide.createIcons();
            
            // Watch for DOM changes and reinitialize icons
            const observer = new MutationObserver(() => {
                lucide.createIcons();
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });

        return {
            videoUrl,
            videoFileName,
            subtitleFileName,
            subtitles,
            currentSubtitle,
            videoPlayer,
            subtitleInput,
            isPlaying,
            currentTime,
            duration,
            handleVideoUpload,
            handleSubtitleUpload,
            updateSubtitles,
            handleVideoLoaded,
            formatTime,
            togglePlay,
            resetPlayer,
            triggerSubtitleUpload
        };
    }
}).mount('#app');