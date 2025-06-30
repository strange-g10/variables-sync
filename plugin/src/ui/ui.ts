console.log("ui.ts loaded immediately");

import "./styles/main.css";
import { initializeSectionManager, initializeExportUI, initializeImportUI, initializeAssignUI, initializeLogProgressUI } from "./components";
import { handleMessages } from "../utils/messageHandler";

function initializeUI() {
  console.log("initializeUI called");
  initializeSectionManager();
  initializeExportUI();
  initializeImportUI();
  initializeAssignUI();
  initializeLogProgressUI();
}

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded fired");
  initializeUI();
});

window.onmessage = handleMessages;