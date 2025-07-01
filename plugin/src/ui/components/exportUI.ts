export function initializeExportUI() {
  const exportFull = document.getElementById("export-full") as HTMLButtonElement | null;
  const exportIds = document.getElementById("export-ids") as HTMLButtonElement | null;
  const clearCollections = document.getElementById("clear-collections") as HTMLButtonElement | null;
  const collectionSelect = document.getElementById("collection-select") as HTMLSelectElement | null;
  
  // New elements for Google Sheets integration
  const exportDestinationRadios = document.querySelectorAll('input[name="export-destination"]') as NodeListOf<HTMLInputElement>;
  const sheetsConfig = document.getElementById("sheets-config") as HTMLDivElement | null;
  const sheetsUrl = document.getElementById("sheets-url") as HTMLInputElement | null;
  const apiKeyInput = document.getElementById("api-key-input") as HTMLInputElement | null;
  const toggleApiKey = document.getElementById("toggle-api-key") as HTMLButtonElement | null;
  const authStatus = document.getElementById("auth-status") as HTMLSpanElement | null;
  const exportProgress = document.getElementById("export-progress") as HTMLDivElement | null;
  const cancelExport = document.getElementById("cancel-export") as HTMLButtonElement | null;
  
  // Authentication method elements
  const authMethodRadios = document.querySelectorAll('input[name="auth-method"]') as NodeListOf<HTMLInputElement>;
  const apiKeyConfig = document.getElementById("api-key-config") as HTMLDivElement | null;
  const serviceAccountConfig = document.getElementById("service-account-config") as HTMLDivElement | null;
  const serviceAccountFile = document.getElementById("service-account-file") as HTMLInputElement | null;
  const serviceAccountInfo = document.getElementById("service-account-info") as HTMLDivElement | null;
  const serviceEmail = document.getElementById("service-email") as HTMLSpanElement | null;
  const serviceProject = document.getElementById("service-project") as HTMLSpanElement | null;

  let isExporting = false;
  let currentExportController: AbortController | null = null;
  let serviceAccountData: string | null = null;

  // Toggle Google Sheets configuration visibility
  exportDestinationRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (sheetsConfig) {
        sheetsConfig.style.display = radio.value === 'sheets' ? 'block' : 'none';
      }
      updateExportButtonStates();
    });
  });

  // Toggle authentication method
  authMethodRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (apiKeyConfig && serviceAccountConfig) {
        if (radio.value === 'api-key') {
          apiKeyConfig.style.display = 'block';
          serviceAccountConfig.style.display = 'none';
        } else {
          apiKeyConfig.style.display = 'none';
          serviceAccountConfig.style.display = 'block';
        }
      }
      updateAuthStatus();
      updateExportButtonStates();
    });
  });

  // Toggle API key visibility
  if (toggleApiKey && apiKeyInput) {
    toggleApiKey.onclick = () => {
      const isPassword = apiKeyInput.type === 'password';
      apiKeyInput.type = isPassword ? 'text' : 'password';
      toggleApiKey.textContent = isPassword ? '🙈' : '👁️';
    };
  }

  // Handle Service Account file upload
  if (serviceAccountFile) {
    serviceAccountFile.addEventListener('change', async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        serviceAccountData = null;
        updateServiceAccountInfo(null);
        return;
      }

      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        
        // Validate Service Account structure
        if (parsed.type === 'service_account' && parsed.client_email && parsed.private_key) {
          serviceAccountData = text;
          updateServiceAccountInfo({
            email: parsed.client_email,
            project: parsed.project_id
          });
        } else {
          throw new Error('Invalid Service Account JSON structure');
        }
      } catch (error) {
        alert(`Invalid Service Account file: ${error}`);
        serviceAccountData = null;
        updateServiceAccountInfo(null);
        (event.target as HTMLInputElement).value = '';
      }
      
      updateAuthStatus();
      updateExportButtonStates();
    });
  }

  // Update Service Account info display
  function updateServiceAccountInfo(info: {email: string, project: string} | null) {
    if (!serviceAccountInfo || !serviceEmail || !serviceProject) return;
    
    if (info) {
      serviceEmail.textContent = info.email;
      serviceProject.textContent = info.project;
      serviceAccountInfo.style.display = 'block';
    } else {
      serviceAccountInfo.style.display = 'none';
    }
  }

  // Update authentication status
  function updateAuthStatus() {
    if (!authStatus) return;
    
    const authMethod = getSelectedAuthMethod();
    const sheetsUrlValid = sheetsUrl?.value.includes('docs.google.com/spreadsheets');
    
    if (!sheetsUrlValid) {
      authStatus.textContent = 'Invalid Sheets URL';
      authStatus.className = 'status-indicator invalid';
      return;
    }
    
    if (authMethod === 'api-key') {
      const apiKeyValid = apiKeyInput?.value && apiKeyInput.value.length > 10;
      if (apiKeyValid) {
        authStatus.textContent = 'API Key Ready (Read Only)';
        authStatus.className = 'status-indicator';
      } else {
        authStatus.textContent = 'Invalid API Key';
        authStatus.className = 'status-indicator invalid';
      }
    } else if (authMethod === 'service-account') {
      if (serviceAccountData) {
        authStatus.textContent = 'Service Account Ready (Full Access)';
        authStatus.className = 'status-indicator valid';
      } else {
        authStatus.textContent = 'No Service Account File';
        authStatus.className = 'status-indicator invalid';
      }
    }
  }

  // Get selected authentication method
  function getSelectedAuthMethod(): string {
    const selected = document.querySelector('input[name="auth-method"]:checked') as HTMLInputElement;
    return selected?.value || 'api-key';
  }

  // Validate sheets configuration based on auth method
  function validateSheetsConfig(): boolean {
    if (!sheetsUrl) return false;
    
    const urlValid = sheetsUrl.value.includes('docs.google.com/spreadsheets');
    const authMethod = getSelectedAuthMethod();
    
    if (!urlValid) return false;
    
    if (authMethod === 'api-key') {
      return !!(apiKeyInput?.value && apiKeyInput.value.length > 10);
    } else if (authMethod === 'service-account') {
      return !!serviceAccountData;
    }
    
    return false;
  }

  // Update export button states
  function updateExportButtonStates() {
    const isJsonExport = getSelectedDestination() === 'json';
    const isSheetsExport = getSelectedDestination() === 'sheets';
    const sheetsConfigValid = !isSheetsExport || validateSheetsConfig();
    
    if (exportFull) {
      exportFull.disabled = isExporting || (isSheetsExport && !sheetsConfigValid);
    }
    if (exportIds) {
      exportIds.disabled = isExporting || (isSheetsExport && !sheetsConfigValid);
    }
  }

  // Get selected export destination
  function getSelectedDestination(): string {
    const selected = document.querySelector('input[name="export-destination"]:checked') as HTMLInputElement;
    return selected?.value || 'json';
  }

  // Show/hide progress
  function showProgress(show: boolean) {
    if (exportProgress) {
      exportProgress.style.display = show ? 'block' : 'none';
    }
    updateExportButtonStates();
  }

  // Update progress
  function updateProgress(progress: number, status: string, details?: string) {
    const progressBar = document.getElementById('export-progress-bar') as HTMLDivElement;
    const progressStatus = document.getElementById('progress-status') as HTMLSpanElement;
    const progressDetails = document.getElementById('progress-details') as HTMLSpanElement;
    
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressStatus) progressStatus.textContent = status;
    if (progressDetails && details) progressDetails.textContent = details;
  }

  // Handle export with progress
  function handleExport(type: 'full' | 'ids') {
    if (isExporting) return;
    
    const destination = getSelectedDestination();
    const collection = collectionSelect?.value === "All" ? undefined : collectionSelect?.value;
    
    if (destination === 'json') {
      // Traditional JSON export
      parent.postMessage({ 
        pluginMessage: { 
          type: type === 'full' ? "export-full" : "export-ids", 
          collection 
        } 
      }, "*");
    } else if (destination === 'sheets') {
      // Google Sheets export
      if (!validateSheetsConfig()) {
        alert('Please provide valid Google Sheets URL and API key');
        return;
      }
      
      isExporting = true;
      currentExportController = new AbortController();
      showProgress(true);
      updateProgress(0, 'Starting export...', 'Preparing data for Google Sheets');
      
      const authMethod = getSelectedAuthMethod();
      let exportConfig: any = {
        sheetsUrl: sheetsUrl?.value
      };
      
      if (authMethod === 'service-account' && serviceAccountData) {
        exportConfig.serviceAccount = serviceAccountData;
      } else if (authMethod === 'api-key' && apiKeyInput?.value) {
        exportConfig.apiKey = apiKeyInput.value;
        // Show warning that API key doesn't support write operations
        alert('Warning: API Keys only support read operations. For writing to Google Sheets, please use Service Account authentication.');
        return;
      }
      
      parent.postMessage({ 
        pluginMessage: { 
          type: type === 'full' ? "export-full-sheets" : "export-ids-sheets",
          collection,
          config: exportConfig
        } 
      }, "*");
    }
  }

  // Export button handlers
  if (exportFull) {
    exportFull.onclick = () => {
      console.log("Export Full clicked");
      handleExport('full');
    };
  }

  if (exportIds) {
    exportIds.onclick = () => {
      console.log("Export IDs clicked");
      handleExport('ids');
    };
  }

  if (clearCollections) {
    clearCollections.onclick = () => {
      console.log("Clear Collections clicked");
      if (confirm("Are you sure you want to clear all collections?")) {
        if (confirm("This action cannot be undone. Proceed?")) {
          parent.postMessage({ pluginMessage: { type: "clear-collections" } }, "*");
        }
      }
    };
  }

  // Cancel export handler
  if (cancelExport) {
    cancelExport.onclick = () => {
      if (currentExportController) {
        currentExportController.abort();
        currentExportController = null;
      }
      isExporting = false;
      showProgress(false);
      parent.postMessage({ pluginMessage: { type: "cancel-export" } }, "*");
    };
  }

  // Listen for validation events
  if (sheetsUrl) {
    sheetsUrl.addEventListener('input', () => {
      updateExportButtonStates();
    });
  }
  
  if (apiKeyInput) {
    apiKeyInput.addEventListener('input', () => {
      updateExportButtonStates();
    });
  }

  // Load API key from environment if available
  if (apiKeyInput && !apiKeyInput.value) {
    parent.postMessage({ pluginMessage: { type: "get-api-key" } }, "*");
  }

  // Export progress message handler
  window.addEventListener('message', (event) => {
    const msg = event.data.pluginMessage;
    if (!msg) return;

    switch (msg.type) {
      case 'export-progress':
        updateProgress(msg.progress, msg.status, msg.details);
        break;
      case 'export-complete':
        isExporting = false;
        showProgress(false);
        updateProgress(100, 'Export completed!', `Successfully exported to Google Sheets`);
        setTimeout(() => showProgress(false), 3000);
        break;
      case 'export-error':
        isExporting = false;
        showProgress(false);
        alert(`Export failed: ${msg.error}`);
        break;
      case 'api-key-loaded':
        if (apiKeyInput && msg.apiKey) {
          apiKeyInput.value = msg.apiKey;
          updateExportButtonStates();
        }
        break;
    }
  });

  // Initial state
  updateExportButtonStates();
}
