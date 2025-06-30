console.log("ui.ts loaded immediately");

import "./styles/main.css";
import { initializeSectionManager } from "./components/sectionManager";
import { initializeExportUI } from "./components/exportUI";
import { initializeImportUI } from "./components/importUI";
import { initializeAssignUI } from "./components/assignUI";
import { initializeNodeExportUI } from "./components/nodeExportUI";
import { initializeLogProgressUI } from "./components/logProgressUI";
import { handleMessages } from "./messageHandler";

function initializeUI() {
  console.log("initializeUI called");
  initializeSectionManager();
  initializeExportUI();
  initializeImportUI();
  initializeAssignUI();
  initializeNodeExportUI();
  initializeLogProgressUI();
}

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded fired");
  initializeUI();
});

window.onmessage = handleMessages;