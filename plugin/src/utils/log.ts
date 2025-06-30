export function logToUI(message: string) {
    if (typeof window !== "undefined" && window.parent) {
        // UI context: send log to parent (Figma plugin)
        window.parent.postMessage({ pluginMessage: { type: "log", message } }, "*");
    } else if (typeof figma !== "undefined" && figma.ui) {
        // Plugin code context: send log to UI
        figma.ui.postMessage({ type: "log", message });
    } else {
        // Fallback: log to console
        console.log("[LOG]", message);
    }
}