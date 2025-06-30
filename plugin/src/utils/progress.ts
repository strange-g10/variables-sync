export function updateProgress(message: string, stats?: { processed: number, total: number, created: number, updated: number, aliases: number }) {
    figma.ui.postMessage({ type: "progress", message, stats });
  }