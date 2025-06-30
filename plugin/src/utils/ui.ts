/**
 * UI utilities for handling plugin UI interactions
 * Separates UI operations from business logic
 */

export interface ProgressData {
  processed: number;
  total: number;
  created: number;
  updated: number;
  aliases: number;
}

/**
 * Log message to UI
 */
export function logToUI(message: string): void {
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

/**
 * Update progress indicator in UI
 */
export function updateProgress(message: string, stats: ProgressData): void {
  const progressData = {
    type: "progress",
    message,
    ...stats
  };
  
  if (typeof figma !== "undefined" && figma.ui) {
    figma.ui.postMessage(progressData);
  } else {
    console.log("[PROGRESS]", progressData);
  }
}

/**
 * Show notification to user
 */
export function showNotification(message: string, options?: NotificationOptions): void {
  if (typeof figma !== "undefined") {
    figma.notify(message, options);
  } else {
    console.log("[NOTIFICATION]", message);
  }
}

/**
 * Send data to UI
 */
export function sendToUI(type: string, data: any): void {
  if (typeof figma !== "undefined" && figma.ui) {
    figma.ui.postMessage({ type, ...data });
  } else {
    console.log(`[SEND_TO_UI] ${type}:`, data);
  }
}
