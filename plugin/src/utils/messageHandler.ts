/**
 * Centralized message handling for UI-Plugin communication
 */

import { PluginMessage } from "../features/types";
import { logToUI } from "./ui";

export type MessageHandler = (msg: PluginMessage) => void | Promise<void>;

interface MessageHandlerRegistry {
  [messageType: string]: MessageHandler;
}

/**
 * Registry for message handlers
 */
const messageHandlers: MessageHandlerRegistry = {};

/**
 * Register a message handler for a specific message type
 */
export function registerMessageHandler(type: string, handler: MessageHandler): void {
  messageHandlers[type] = handler;
}

/**
 * Unregister a message handler
 */
export function unregisterMessageHandler(type: string): void {
  delete messageHandlers[type];
}

/**
 * Main message handling function for UI
 */
export function handleMessages(event: MessageEvent): void {
  if (!event.data.pluginMessage) return;
  
  const msg = event.data.pluginMessage as PluginMessage;
  handleMessage(msg);
}

/**
 * Handle a single message
 */
export async function handleMessage(msg: PluginMessage): Promise<void> {
  try {
    if (!msg.type) {
      logToUI("Error: Invalid message format - missing type");
      return;
    }

    const handler = messageHandlers[msg.type];
    if (handler) {
      await handler(msg);
    } else {
      logToUI(`Warning: No handler registered for message type: ${msg.type}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logToUI(`Error handling message ${msg.type}: ${errorMessage}`);
    console.error("[Message Handler Error]", error);
  }
}

/**
 * Send message from UI to plugin
 */
export function sendMessageToPlugin(message: PluginMessage): void {
  if (typeof window !== "undefined" && window.parent) {
    window.parent.postMessage({ pluginMessage: message }, "*");
  } else {
    console.log("[SEND_TO_PLUGIN]", message);
  }
}

/**
 * Send message from plugin to UI
 */
export function sendMessageToUI(message: any): void {
  if (typeof figma !== "undefined" && figma.ui) {
    figma.ui.postMessage(message);
  } else {
    console.log("[SEND_TO_UI]", message);
  }
}
