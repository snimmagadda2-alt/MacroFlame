document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const screenPreview = document.getElementById('screenPreview');
    const macroInput = document.getElementById('macroInput');

    // 1. Request Screen Sharing Permission upon interaction
    startBtn.addEventListener('click', async () => {
        try {
            const gdmOptions = {
                video: {
                    cursor: "always"
                },
                audio: false
            };

            // This triggers the browser's native screen-share permission dialog
            const stream = await navigator.mediaDevices.getDisplayMedia(gdmOptions);
            
            // Display the shared screen in the hidden/preview video element
            screenPreview.srcObject = stream;
            screenPreview.style.display = 'block';
            startBtn.style.display = 'none'; // Hide button after success

            console.log("Screen sharing permission granted.");

            // Handle case where user stops sharing via the browser UI
            stream.getVideoTracks()[0].onended = () => {
                console.log("Screen sharing stopped by user.");
                screenPreview.style.display = 'none';
                startBtn.style.display = 'block';
            };

        } catch (error) {
            console.error("Error sharing screen:", error);
            alert("Permission denied or error occurred while trying to share the screen.");
        }
    });

    // 2. Mimic Typing and Cursor Movement (Macro Logic)
    macroInput.addEventListener('input', (event) => {
        const typedValue = event.target.value;
        // In a full macro setup, you would transmit this data via WebSockets 
        // to a backend automation tool (like Python's PyAutoGUI) to control 
        // the actual host operating system cursor and keyboard.
        
        console.log("Macro Event - Simulated Typing:", typedValue);
    });

    // Example of programmatic cursor movement simulation within the webpage DOM
    window.addEventListener('mousemove', (e) => {
        // Track local cursor coordinates to mirror them remotely if needed
        const cursorData = { x: e.clientX, y: e.clientY };
        // console.log("Cursor Position:", cursorData);
    });
});
