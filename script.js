const { createApp, ref, computed, onMounted, watch } = Vue;

createApp({
    setup() {
        // Reactive state
        const videoUrl = ref(null);
        const videoFileName = ref('');
        const subtitleFileName = ref('');
        const subtitles = ref([]);
        const currentSubtitle = ref('');
        const videoPlayer = ref(null);
        const isPlaying = ref(false);
        const currentTime = ref(0);
        const duration = ref(0);

        // Handle video upload
        const handleVideoUpload = (event) => {
            const file = event.target.files[0];
            if (file) {
                videoFileName.value = file.name;
                videoUrl.value = URL.createObjectURL(file);
            }
        };

        // Handle subtitle upload
        const handleSubtitleUpload = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            if (file.type !== 'application/x-subrip' && !file.name.endsWith('.srt')) {
                alert('Please upload a valid SRT file');
                return;
            }
            
            subtitleFileName.value = file.name;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const parsed = parseSRT(content);
                console.log('Parsed subtitles:', parsed); // Debug log
                subtitles.value = parsed;
            };
            reader.onerror = (e) => {
                console.error('Error reading file:', e);
                alert('Error reading subtitle file');
            };
            reader.readAsText(file);
        };

        const parseTime = (timeString) => {
            const [hours, minutes, seconds] = timeString.split(':');
            const [secs, millis] = seconds.split(',');
            return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secs) + parseInt(millis) / 1000;
        };

        // Parse SRT file
        const parseSRT = (srtText) => {
            const srtRegex = /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\n([\s\S]*?)(?=\n\n|\n$|$)/g;
            const parsedSubtitles = [];
            let match;
            
            while ((match = srtRegex.exec(srtText)) !== null) {
                const [, , startTimeStr, endTimeStr, text] = match;
                
                parsedSubtitles.push({
                    startTime: parseTime(startTimeStr),
                    endTime: parseTime(endTimeStr),
                    text: text.trim().replace(/\n/g, ' ')
                });
            }
            
            return parsedSubtitles; // Make sure this return statement exists
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
    if (!videoPlayer.value || subtitles.value.length === 0) return;
    
    currentTime.value = videoPlayer.value.currentTime;
    isPlaying.value = !videoPlayer.value.paused;
    
    const current = subtitles.value.find(
        sub => currentTime.value >= sub.startTime && currentTime.value <= sub.endTime
    );
    
    currentSubtitle.value = current ? current.text : '';
    console.log('Current subtitle:', currentSubtitle.value); // Debug log
};

        // Handle video loaded
        const handleVideoLoaded = () => {
            if (videoPlayer.value) {
                duration.value = videoPlayer.value.duration;
            }
        };

        // Format time for display
        const formatTime = (seconds) => {
            if (isNaN(seconds)) return '00:00';
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
                } else {
                    videoPlayer.value.pause();
                }
                isPlaying.value = !videoPlayer.value.paused;
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
        };

        // Trigger subtitle upload from video player
        const triggerSubtitleUpload = () => {
            // Create a temporary input element if the original is not accessible
            let input = document.getElementById('subtitle-upload');
            
            if (!input) {
                input = document.createElement('input');
                input.type = 'file';
                input.accept = '.srt';
                input.style.display = 'none';
                input.id = 'subtitle-upload-temp';
                document.body.appendChild(input);
                
                input.addEventListener('change', handleSubtitleUpload);
            }
            
            input.click();
            
            // Clean up temporary input after use
            if (input.id === 'subtitle-upload-temp') {
                setTimeout(() => {
                    input.remove();
                }, 1000);
            }
        };

        // Initialize Lucide icons
        onMounted(() => {
            lucide.createIcons();
            
            // Re-initialize icons when video player appears
            watch(videoUrl, () => {
                setTimeout(() => {
                    lucide.createIcons();
                }, 100);
            });

            // Re-initialize icons after state changes
            watch(isPlaying, () => {
                setTimeout(() => {
                    lucide.createIcons();
                }, 10);
            });
        });

        return {
            videoUrl,
            videoFileName,
            subtitleFileName,
            subtitles,
            currentSubtitle,
            videoPlayer,
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