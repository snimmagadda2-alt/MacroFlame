document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const screenPreview = document.getElementById('screenPreview');
    const recordBtn = document.getElementById('recordBtn');
    const stopBtn = document.getElementById('stopBtn');
    const playBtn = document.getElementById('playBtn');
    const macroInput = document.getElementById('macroInput');

    let socket;
    let isRecording = false;
    let isPlaying = false;
    let recordedEvents = [];
    let recordingStartTime = 0;
    
    // Track physical screen dimensions via shared video stream
    let screenWidth = window.screen.width;
    let screenHeight = window.screen.height;

    // Connect to local Python WebSocket bridge
    function connectWebSocket() {
        socket = new WebSocket('ws://localhost:8765');
        socket.onopen = () => console.log("Connected to local OS automation bridge.");
        socket.onerror = (err) => console.log("WebSocket error. Ensure Python server.py is running.", err);
    }
    connectWebSocket();

    // 1. Request Screen Sharing (Must choose "Entire Screen" for global tracking)
    startBtn.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ 
                video: { cursor: "always" }, 
                audio: false 
            });
            
            screenPreview.srcObject = stream;
            screenPreview.style.display = 'block';
            startBtn.style.display = 'none';
            recordBtn.disabled = false;

            // Adjust scaling if video dimensions reflect actual screen resolution
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();
            if (settings.width) screenWidth = settings.width;
            if (settings.height) screenHeight = settings.height;

        } catch (error) {
            console.error("Error sharing screen:", error);
            alert("Permission denied.");
        }
    });

    // 2. Record Actions (Global window listener catches events even outside browser components)
    recordBtn.addEventListener('click', () => {
        recordedEvents = [];
        recordingStartTime = Date.now();
        isRecording = true;
        
        recordBtn.disabled = true;
        stopBtn.disabled = false;
        playBtn.disabled = true;
        macroInput.value = '';
        macroInput.focus();

        console.log("Global recording started...");
    });

    // Capture global mouse movements
    window.addEventListener('mousemove', (e) => {
        if (!isRecording) return;
        
        // Map browser window coordinates to absolute screen coordinates
        const absoluteX = Math.round((e.screenX / window.innerWidth) * screenWidth);
        const absoluteY = Math.round((e.screenY / window.innerHeight) * screenHeight);

        recordedEvents.push({
            type: 'mousemove',
            x: e.screenX, // Using absolute screen properties
            y: e.screenY,
            time: Date.now() - recordingStartTime
        });
    });

    // Capture clicks anywhere on the window
    window.addEventListener('click', (e) => {
        if (!isRecording) return;
        recordedEvents.push({
            type: 'click',
            x: e.screenX,
            y: e.screenY,
            button: 'left',
            time: Date.now() - recordingStartTime
        });
    });

    // Capture Typing
    macroInput.addEventListener('input', (e) => {
        if (!isRecording) return;
        recordedEvents.push({
            type: 'type',
            text: macroInput.value,
            time: Date.now() - recordingStartTime
        });
    });

    // 3. Stop Recording
    stopBtn.addEventListener('click', () => {
        isRecording = false;
        isPlaying = false;
        recordBtn.disabled = false;
        stopBtn.disabled = true;
        playBtn.disabled = recordedEvents.length === 0;
        console.log("Recording stopped.");
    });

    // 4. Playback (Sends instructions to Python to control the real OS cursor/keyboard)
    playBtn.addEventListener('click', () => {
        if (recordedEvents.length === 0) return;

        isPlaying = true;
        recordBtn.disabled = true;
        stopBtn.disabled = false;
        playBtn.disabled = true;

        console.log("Global playback starting. Relinquishing local control...");

        recordedEvents.forEach(event => {
            setTimeout(() => {
                if (!isPlaying || !socket || socket.readyState !== WebSocket.OPEN) return;

                // Send command to local Python backend to execute on OS
                socket.send(JSON.stringify(event));

                if (event === recordedEvents[recordedEvents.length - 1]) {
                    setTimeout(() => {
                        isPlaying = false;
                        stopBtn.disabled = true;
                        recordBtn.disabled = false;
                        playBtn.disabled = false;
                        console.log("Global playback finished.");
                    }, 500);
                }
            }, event.time);
        });
    });
});
