let counter = 0;
    function updateCounter(val) {
      counter += val;
      document.getElementById('counterDisplay').textContent = counter;
    }
    function resetCounter() {
      counter = 0;
      document.getElementById('counterDisplay').textContent = counter;
    }

    let isRecording = false;
    let isPlaying = false;
    let recordedEvents = [];
    let recordingStartTime = 0;

    const openMacroBtn = document.getElementById('openMacroBtn');
    const macroPopup = document.getElementById('macroPopup');
    const closePopupBtn = document.getElementById('closePopupBtn');
    const macroHeader = document.getElementById('macroHeader');
    const recordBtn = document.getElementById('recordBtn');
    const playBtn = document.getElementById('playBtn');
    const statusDot = document.getElementById('statusDot');
    const macroStatus = document.getElementById('macroStatus');
    const actionCount = document.getElementById('actionCount');
    const recLabel = document.getElementById('recLabel');
    const playLabel = document.getElementById('playLabel');
    const countdownOverlay = document.getElementById('countdownOverlay');
    const countdownNumber = document.getElementById('countdownNumber');
    const ghostCursor = document.getElementById('ghostCursor');
    const logList = document.getElementById('logList');
    const loopCheckbox = document.getElementById('loopCheckbox');

    openMacroBtn.addEventListener('click', () => {
      macroPopup.classList.toggle('open');
    });

    closePopupBtn.addEventListener('click', () => {
      macroPopup.classList.remove('open');
    });

    let isDragging = false;
    let dragOffsetX = 0, dragOffsetY = 0;

    macroHeader.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragOffsetX = e.clientX - macroPopup.getBoundingClientRect().left;
      dragOffsetY = e.clientY - macroPopup.getBoundingClientRect().top;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      let x = e.clientX - dragOffsetX;
      let y = e.clientY - dragOffsetY;
      macroPopup.style.left = `${Math.max(10, Math.min(window.innerWidth - macroPopup.offsetWidth - 10, x))}px`;
      macroPopup.style.top = `${Math.max(10, Math.min(window.innerHeight - macroPopup.offsetHeight - 10, y))}px`;
      macroPopup.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => { isDragging = false; });

    function clearRecording() {
      recordedEvents = [];
      updateUIState();
      logList.innerHTML = '<div style="color: #64748b; text-align: center; padding: 1rem;">No actions recorded yet. Click "Use Macro" to begin.</div>';
    }

    function updateUIState() {
      actionCount.textContent = `${recordedEvents.length} actions`;
      if (recordedEvents.length > 0 && !isRecording && !isPlaying) {
        playBtn.disabled = false;
      } else if (!isRecording && !isPlaying) {
        playBtn.disabled = true;
      }
    }

    recordBtn.addEventListener('click', () => {
      if (isRecording) return;
      runCountdown(() => {
        startActualRecording();
      });
    });

    function runCountdown(callback) {
      countdownOverlay.classList.add('visible');
      let count = 3;
      countdownNumber.textContent = count;
      
      const timer = setInterval(() => {
        count--;
        if (count > 0) {
          countdownNumber.textContent = count;
        } else if (count === 0) {
          countdownNumber.textContent = 'GO!';
        } else {
          clearInterval(timer);
          countdownOverlay.classList.remove('visible');
          callback();
        }
      }, 1000);
    }

    function startActualRecording() {
      isRecording = true;
      recordedEvents = [];
      recordingStartTime = performance.now();

      recordBtn.classList.add('active');
      recLabel.textContent = 'Stop Rec';
      playBtn.disabled = true;
      statusDot.className = 'status-dot recording';
      macroStatus.textContent = 'Recording actions... Click & Type now!';

      recordBtn.onclick = stopRecording;
    }

    function stopRecording() {
      isRecording = false;
      recordBtn.classList.remove('active');
      recLabel.textContent = 'Record';
      statusDot.className = 'status-dot';
      macroStatus.textContent = `Recorded ${recordedEvents.length} actions successfully!`;

      recordBtn.onclick = () => {
        if (isRecording) return;
        runCountdown(() => { startActualRecording(); });
      };

      updateUIState();
      renderLog();
    }

    function recordEvent(eventData) {
      if (!isRecording) return;
      const timestamp = performance.now() - recordingStartTime;
      recordedEvents.push({ ...eventData, time: timestamp });
    }

    document.addEventListener('mousemove', (e) => {
      if (!isRecording) return;
      if (Math.random() < 0.3) {
        recordEvent({ type: 'mousemove', x: e.clientX, y: e.clientY });
      }
    });

    document.addEventListener('click', (e) => {
      if (!isRecording) return;
      if (macroPopup.contains(e.target)) return;
      recordEvent({ type: 'click', x: e.clientX, y: e.clientY, targetTag: e.target.tagName, targetId: e.target.id || e.target.className });
    });

    document.addEventListener('input', (e) => {
      if (!isRecording) return;
      if (macroPopup.contains(e.target)) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        recordEvent({
          type: 'input',
          value: e.target.value,
          selector: e.target.id ? `#${e.target.id}` : e.target.tagName.toLowerCase()
        });
      }
    });

    playBtn.addEventListener('click', async () => {
      if (isPlaying || recordedEvents.length === 0) return;
      
      do {
        await playMacroSequence();
        if (!loopCheckbox.checked) break;
      } while (isPlaying);
    });

    async function playMacroSequence() {
      isPlaying = true;
      playBtn.classList.add('active');
      playLabel.textContent = 'Playing...';
      recordBtn.disabled = true;
      statusDot.className = 'status-dot playing';
      macroStatus.textContent = 'Replaying recorded actions...';
      ghostCursor.style.display = 'block';

      const startTime = performance.now();

      for (let ev of recordedEvents) {
        if (!isPlaying) break;
        const targetTime = ev.time;
        const elapsed = performance.now() - startTime;
        const delay = targetTime - elapsed;
        if (delay > 0) {
          await new Promise(r => setTimeout(r, delay));
        }

        if (ev.type === 'mousemove' || ev.type === 'click') {
          ghostCursor.style.transform = `translate(${ev.x - 2}px, ${ev.y - 2}px)`;
        }

        if (ev.type === 'click') {
          const ripple = document.createElement('div');
          ripple.className = 'click-ripple';
          ripple.style.left = `${ev.x}px`;
          ripple.style.top = `${ev.y}px`;
          document.body.appendChild(ripple);
          setTimeout(() => ripple.remove(), 450);

          const elem = document.elementFromPoint(ev.x, ev.y);
          if (elem) {
            elem.focus();
            elem.click();
          }
        }

        if (ev.type === 'input') {
          const targetElem = document.querySelector(ev.selector);
          if (targetElem) {
            targetElem.value = ev.value;
            targetElem.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }

      ghostCursor.style.display = 'none';
      isPlaying = false;
      playBtn.classList.remove('active');
      playLabel.textContent = 'Play';
      recordBtn.disabled = false;
      statusDot.className = 'status-dot';
      macroStatus.textContent = 'Playback completed successfully!';
    }

    function renderLog() {
      if (recordedEvents.length === 0) return;
      logList.innerHTML = '';
      recordedEvents.forEach((ev, idx) => {
        const item = document.createElement('div');
        item.className = 'log-item';
        let detail = ev.type;
        if (ev.type === 'click') detail = `Click (${Math.round(ev.x)}, ${Math.round(ev.y)})`;
        if (ev.type === 'input') detail = `Type: "${ev.value}"`;
        if (ev.type === 'mousemove') detail = `Move (${Math.round(ev.x)}, ${Math.round(ev.y)})`;

        item.innerHTML = `<span>#${idx+1} <strong>${detail}</strong></span><span class="time">+${Math.round(ev.time)}ms</span>`;
        logList.appendChild(item);
      });
    }