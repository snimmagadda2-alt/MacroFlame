document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const screenPreview = document.getElementById('screenPreview');
    const recordBtn = document.getElementById('recordBtn');
    const stopBtn = document.getElementById('stopBtn');
    const playBtn = document.getElementById('playBtn');
    const macroInput = document.getElementById('macroInput');
    const playbackCursor = document.getElementById('playbackCursor');

    let isRecording = false;
    let isPlaying = false;
    let recordedEvents = [];
    let recordingStartTime = 0;

    // 1. Screen Sharing Permission
    startBtn.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: false });
            screenPreview.srcObject = stream;
            screenPreview.style.display = 'block';
            startBtn.style.display = 'none';
            
            // Enable recording once screen is shared
            recordBtn.disabled = false;
        } catch (error) {
            console.error("Error sharing screen:", error);
            alert("Permission denied or error occurred.");
        }
    });

    // 2. Recording Logic
    recordBtn.addEventListener('click', () => {
        recordedEvents = [];
        recordingStartTime = Date.now();
        isRecording = true;
        
        recordBtn.disabled = true;
        stopBtn.disabled = false;
        playBtn.disabled = true;
        macroInput.value = '';
        macroInput.focus();

        console.log("Recording started...");
    });

    // Capture Mouse Movements during recording
    window.addEventListener('mousemove', (e) => {
        if (!isRecording) return;
        const timestamp = Date.now() - recordingStartTime;
        recordedEvents.push({
            type: 'mousemove',
            x: e.clientX,
            y: e.clientY,
            time: timestamp
        });
    });

    // Capture Typing (letters and numbers) during recording
    macroInput.addEventListener('input', (e) => {
        if (!isRecording) return;
        const timestamp = Date.now() - recordingStartTime;
        recordedEvents.push({
            type: 'input',
            value: macroInput.value,
            time: timestamp
        });
    });

    // 3. Stop Recording
    stopBtn.addEventListener('click', () => {
        if (!isRecording && !isPlaying) return;
        
        isRecording = false;
        isPlaying = false;
        
        recordBtn.disabled = false;
        stopBtn.disabled = true;
        playBtn.disabled = recordedEvents.length === 0;
        playbackCursor.style.display = 'none';

        console.log("Recording stopped. Total events captured:", recordedEvents.length);
    });

    // 4. Playback Logic
    playBtn.addEventListener('click', () => {
        if (recordedEvents.length === 0) return;

        isPlaying = true;
        recordBtn.disabled = true;
        stopBtn.disabled = false;
        playBtn.disabled = true;
        macroInput.value = '';
        playbackCursor.style.display = 'block';

        console.log("Playback started...");

        const playbackStartTime = Date.now();

        // Execute each recorded event at its relative timestamp
        recordedEvents.forEach(event => {
            setTimeout(() => {
                if (!isPlaying) return; // Stop if user clicked Stop

                if (event.type === 'mousemove') {
                    // Move the visual cursor
                    playbackCursor.style.left = `${event.x}px`;
                    playbackCursor.style.top = `${event.y}px`;
                } else if (event.type === 'input') {
                    // Mimic the typed letters and numbers
                    macroInput.value = event.value;
                }

                // Check if this is the last event
                if (event === recordedEvents[recordedEvents.length - 1]) {
                    setTimeout(() => {
                        if (isPlaying) {
                            isPlaying = false;
                            stopBtn.disabled = true;
                            recordBtn.disabled = false;
                            playBtn.disabled = false;
                            playbackCursor.style.display = 'none';
                            console.log("Playback finished.");
                        }
                    }, 500);
                }

            }, event.time);
        });
    });
});
