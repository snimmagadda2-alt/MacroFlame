document.addEventListener('DOMContentLoaded', () => {
    const recordBtn = document.getElementById('recordBtn');
    const stopBtn = document.getElementById('stopBtn');
    const playBtn = document.getElementById('playBtn');
    const macroInput = document.getElementById('macroInput');
    const customCursor = document.getElementById('customCursor');
    const workspace = document.getElementById('workspace');
    const simulatedTab = document.getElementById('simulatedTab');

    let isRecording = false;
    let isPlaying = false;
    let recordedEvents = [];
    let recordingStartTime = 0;

    // Interactive action for the simulated tab
    simulatedTab.addEventListener('click', () => {
        simulatedTab.classList.toggle('active');
        simulatedTab.innerText = simulatedTab.classList.contains('active') ? 'Tab Opened!' : '+ New Tab';
    });

    // 1. Start Recording
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

    // Capture Mouse Movements inside the workspace
    workspace.addEventListener('mousemove', (e) => {
        if (!isRecording) return;
        const rect = workspace.getBoundingClientRect();
        recordedEvents.push({
            type: 'mousemove',
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            time: Date.now() - recordingStartTime
        });
    });

    // Capture Clicks inside the workspace
    workspace.addEventListener('click', (e) => {
        if (!isRecording) return;
        const rect = workspace.getBoundingClientRect();
        recordedEvents.push({
            type: 'click',
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            time: Date.now() - recordingStartTime
        });
    });

    // Capture Typing
    macroInput.addEventListener('input', () => {
        if (!isRecording) return;
        recordedEvents.push({
            type: 'input',
            value: macroInput.value,
            time: Date.now() - recordingStartTime
        });
    });

    // 2. Stop Recording
    stopBtn.addEventListener('click', () => {
        isRecording = false;
        isPlaying = false;
        recordBtn.disabled = false;
        stopBtn.disabled = true;
        playBtn.disabled = recordedEvents.length === 0;
        customCursor.style.display = 'none';

        console.log("Recording stopped. Events captured:", recordedEvents.length);
    });

    // 3. Playback with Visible Custom Cursor
    playBtn.addEventListener('click', () => {
        if (recordedEvents.length === 0) return;

        isPlaying = true;
        recordBtn.disabled = true;
        stopBtn.disabled = false;
        playBtn.disabled = true;
        macroInput.value = '';
        
        // Show custom cursor
        customCursor.style.display = 'block';
        console.log("Playback started...");

        const workspaceRect = workspace.getBoundingClientRect();

        recordedEvents.forEach(event => {
            setTimeout(() => {
                if (!isPlaying) return;

                if (event.type === 'mousemove' || event.type === 'click') {
                    // Position the custom cursor relative to the workspace
                    const absoluteX = workspaceRect.left + event.x;
                    const absoluteY = workspaceRect.top + event.y;

                    customCursor.style.left = `${absoluteX}px`;
                    customCursor.style.top = `${absoluteY}px`;

                    // If it was a click event, trigger a real click on whatever element is underneath
                    if (event.type === 'click') {
                        // Add a visual click pop effect
                        customCursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
                        setTimeout(() => customCursor.style.transform = 'translate(-50%, -50%) scale(1)', 100);

                        const elementHit = document.elementFromPoint(absoluteX, absoluteY);
                        if (elementHit) {
                            elementHit.click();
                        }
                    }
                } else if (event.type === 'input') {
                    // Replay typed text
                    macroInput.value = event.value;
                }

                // End of playback check
                if (event === recordedEvents[recordedEvents.length - 1]) {
                    setTimeout(() => {
                        if (isPlaying) {
                            isPlaying = false;
                            stopBtn.disabled = true;
                            recordBtn.disabled = false;
                            playBtn.disabled = false;
                            customCursor.style.display = 'none';
                            console.log("Playback finished.");
                        }
                    }, 500);
                }

            }, event.time);
        });
    });
});
