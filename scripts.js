document.getElementById("startBtn").addEventListener("click", async () => {
  const textToType = document.getElementById("textInput").value;
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (text) => {
      // Upprepar var 3:e sekund (3000 millisekunder)
      setInterval(() => {
        // 1. Hittar textfältet som är markerat och skriver in texten
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
          activeEl.value += text;
        }
        // 2. Klickar på en specifik koordinat (X: 500, Y: 300)
        const elToClick = document.elementFromPoint(500, 300);
        if (elToClick) elToClick.click();
      }, 3000);
    },
    args: [textToType]
  });
});
