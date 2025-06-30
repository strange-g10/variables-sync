export function initializeLogProgressUI() {
  const toggleLog = document.getElementById("toggle-log") as HTMLButtonElement | null;
  const exportLogButton = document.getElementById("export-log") as HTMLButtonElement | null;

  if (toggleLog) {
    toggleLog.onclick = () => {
      console.log("Toggle Log clicked");
      const log = document.getElementById("log") as HTMLTextAreaElement;
      if (log.style.display === "none") {
        log.style.display = "block";
        toggleLog.textContent = "Hide Log";
      } else {
        log.style.display = "none";
        toggleLog.textContent = "Show Log";
      }
    };
  }

  if (exportLogButton) {
    exportLogButton.onclick = () => {
      console.log("Export Log clicked");
      const logTextarea = document.getElementById("log") as HTMLTextAreaElement | null;
      if (logTextarea && logTextarea.value) {
        const blob = new Blob([logTextarea.value], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "plugin-log.txt";
        a.click();
        URL.revokeObjectURL(url);
      }
    };
  }
}

export function logMessage(message: string) {
  const log = document.getElementById("log") as HTMLTextAreaElement | null;
  if (log) {
    log.value += `${new Date().toISOString()} - ${message}\n`;
    log.scrollTop = log.scrollHeight;
  }
}

export function setProgress(message: string | undefined, stats?: { processed: number, total: number, created: number, updated: number, aliases: number }) {
  const progressText = document.getElementById("progress-text") as HTMLSpanElement | null;
  const progressBar = document.getElementById("progress-bar") as HTMLDivElement | null;
  if (progressText && progressBar) {
    if (stats) {
      progressText.innerText = `${message || "Processing"} - Processed ${stats.processed}/${stats.total}, Created: ${stats.created}, Updated: ${stats.updated}, Aliases: ${stats.aliases}`;
      const percent = Math.min((stats.processed / stats.total) * 100, 100).toFixed(1);
      progressBar.style.width = `${percent}%`;
    } else {
      progressText.innerText = message || "No progress message";
      progressBar.style.width = "0%";
    }
  }
}