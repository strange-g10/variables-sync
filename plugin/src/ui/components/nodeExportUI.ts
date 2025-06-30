interface SortGroupData {
  prefix: string;
  range?: {
    rows: [number, number];
    cols: [number, number];
  };
}

interface NodeExportConfig {
  rootPattern: string;
  sortGroups: SortGroupData[];
}

let sortGroupIndex = 0;

export function initializeNodeExportUI() {
  const exportButton = document.getElementById("export-selected-nodes") as HTMLButtonElement | null;
  const modal = document.getElementById("node-config-modal") as HTMLDivElement | null;
  const applyButton = document.getElementById("apply-config") as HTMLButtonElement | null;
  const cancelButton = document.getElementById("cancel-config") as HTMLButtonElement | null;
  const addGroupButton = document.getElementById("add-sort-group") as HTMLButtonElement | null;
  const rootPatternInput = document.getElementById("root-pattern") as HTMLInputElement | null;
  const sortGroupsContainer = document.getElementById("sort-groups-container") as HTMLDivElement | null;

  if (!exportButton || !modal || !applyButton || !cancelButton || !addGroupButton || !rootPatternInput || !sortGroupsContainer) {
    console.error("Node export UI elements not found");
    return;
  }

  // Load default config
  loadDefaultConfig();
  
  // Add real-time validation
  addValidationListeners();
  
  // Update button state based on selection
  updateButtonState();

  // Show modal when export button is clicked
  exportButton.onclick = () => {
    console.log("Export Selected Nodes clicked");
    showModalWithSelectionCheck();
  };

  // Hide modal when cancel button is clicked
  cancelButton.onclick = () => {
    modal.style.display = "none";
  };

  // Hide modal when clicking outside of it
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  };

  // Apply config and start export
  applyButton.onclick = () => {
    const config = collectConfig();
    console.log("Applying config:", config);
    
    parent.postMessage({ 
      pluginMessage: { 
        type: "export-selected-nodes", 
        nodeConfig: config 
      } 
    }, "*");
    
    modal.style.display = "none";
  };

  // Add new sort group
  addGroupButton.onclick = () => {
    addSortGroup();
  };

  function loadDefaultConfig() {
    // Set default root pattern to match naming_config.json
    if (rootPatternInput) {
      rootPatternInput.value = "Role-Body-\\d+|Block-\\d+";
    }
    
    // Add default sort groups matching naming_config.json exactly
    // Role-Body groups with ranges
    addSortGroup("Row_\\d+_Text_Col_", { rows: [1, 10], cols: [1, 4] });
    addSortGroup("Row_\\d+_Visible_Col_", { rows: [1, 10], cols: [1, 4] });
    
    // Block groups WITHOUT ranges (matching naming_config.json)
    addSortGroup("Title");
    addSortGroup("Item \\d+");
  }

  function addSortGroup(defaultPrefix = "", defaultRange?: { rows: [number, number], cols: [number, number] }) {
    const groupId = `sort-group-${++sortGroupIndex}`;
    const groupDiv = document.createElement("div");
    groupDiv.className = "sort-group";
    groupDiv.id = groupId;

    groupDiv.innerHTML = `
      <div class="sort-group-header">
        <span>Sort Group ${sortGroupIndex}</span>
        <button class="remove-group" onclick="removeSortGroup('${groupId}')">Remove</button>
      </div>
      <div>
        <label>Prefix Pattern (regex):</label>
        <input type="text" class="prefix-input" placeholder="Row_\\d+_Text_Col_" value="${defaultPrefix}" />
      </div>
      <div>
        <label>
          <input type="checkbox" class="range-checkbox" ${defaultRange ? 'checked' : ''} />
          Use Range (for grid-like structures)
        </label>
        <div class="range-inputs" style="${defaultRange ? 'display: grid' : 'display: none'}">
          <input type="number" class="range-row-start" placeholder="Start Row" value="${defaultRange?.rows[0] || 1}" />
          <input type="number" class="range-row-end" placeholder="End Row" value="${defaultRange?.rows[1] || 10}" />
          <input type="number" class="range-col-start" placeholder="Start Col" value="${defaultRange?.cols[0] || 1}" />
          <input type="number" class="range-col-end" placeholder="End Col" value="${defaultRange?.cols[1] || 4}" />
        </div>
      </div>
    `;

    if (sortGroupsContainer) {
      sortGroupsContainer.appendChild(groupDiv);
    }

    // Add event listeners for smart range handling
    const rangeCheckbox = groupDiv.querySelector(".range-checkbox") as HTMLInputElement;
    const rangeInputs = groupDiv.querySelector(".range-inputs") as HTMLDivElement;
    const prefixInput = groupDiv.querySelector(".prefix-input") as HTMLInputElement;
    const rangeLabel = rangeCheckbox?.parentElement as HTMLLabelElement;
    
    // Function to determine if pattern needs range
    const updateRangeVisibility = () => {
      const pattern = prefixInput.value.trim();
      const needsRange = isGridPattern(pattern);
      
      if (needsRange) {
        rangeLabel.style.display = 'block';
        rangeInputs.style.display = rangeCheckbox.checked ? "grid" : "none";
      } else {
        rangeLabel.style.display = 'none';
        rangeInputs.style.display = 'none';
        rangeCheckbox.checked = false;
      }
    };
    
    // Initial check
    updateRangeVisibility();
    
    // Listen for pattern changes
    prefixInput.addEventListener('input', updateRangeVisibility);
    
    rangeCheckbox.onchange = () => {
      rangeInputs.style.display = rangeCheckbox.checked ? "grid" : "none";
    };
  }

  function collectConfig(): NodeExportConfig {
    const rootPattern = rootPatternInput?.value || "Role-Body-\\d+|Block-\\d+";
    const sortGroups: SortGroupData[] = [];

    const groupElements = sortGroupsContainer?.querySelectorAll(".sort-group") || [];
    groupElements.forEach((groupEl) => {
      const prefixInput = groupEl.querySelector(".prefix-input") as HTMLInputElement;
      const rangeCheckbox = groupEl.querySelector(".range-checkbox") as HTMLInputElement;
      const rowStartInput = groupEl.querySelector(".range-row-start") as HTMLInputElement;
      const rowEndInput = groupEl.querySelector(".range-row-end") as HTMLInputElement;
      const colStartInput = groupEl.querySelector(".range-col-start") as HTMLInputElement;
      const colEndInput = groupEl.querySelector(".range-col-end") as HTMLInputElement;

      const prefix = prefixInput.value.trim();
      if (!prefix) return;

      const group: SortGroupData = { prefix };

      if (rangeCheckbox.checked) {
        const rowStart = parseInt(rowStartInput.value) || 1;
        const rowEnd = parseInt(rowEndInput.value) || 10;
        const colStart = parseInt(colStartInput.value) || 1;
        const colEnd = parseInt(colEndInput.value) || 4;

        group.range = {
          rows: [rowStart, rowEnd],
          cols: [colStart, colEnd]
        };
      }

      sortGroups.push(group);
    });

    return { rootPattern, sortGroups };
  }

  // UX Enhancement Functions
  function addValidationListeners() {
    // Real-time validation for root pattern
    rootPatternInput?.addEventListener('input', validateRootPattern);
    
    // Listen for sort group changes
    sortGroupsContainer?.addEventListener('input', validateSortGroups);
  }
  
  function validateRootPattern() {
    if (!rootPatternInput) return;
    
    const pattern = rootPatternInput.value.trim();
    const feedback = document.getElementById('root-pattern-feedback') || createFeedbackElement('root-pattern-feedback');
    
    if (!pattern) {
      showFeedback(feedback, 'Root pattern is required', 'error');
      return false;
    }
    
    try {
      new RegExp(pattern);
      showFeedback(feedback, 'Valid regex pattern', 'success');
      return true;
    } catch (e) {
      showFeedback(feedback, 'Invalid regex pattern', 'error');
      return false;
    }
  }
  
  function validateSortGroups() {
    const groups = sortGroupsContainer?.querySelectorAll('.sort-group') || [];
    let hasValidGroups = false;
    
    groups.forEach((group, index) => {
      const prefixInput = group.querySelector('.prefix-input') as HTMLInputElement;
      const prefix = prefixInput?.value.trim();
      
      if (prefix) {
        hasValidGroups = true;
        try {
          new RegExp(prefix);
          prefixInput.style.borderColor = 'var(--accent-color)';
        } catch (e) {
          prefixInput.style.borderColor = '#ff4444';
        }
      } else {
        prefixInput.style.borderColor = '#ff4444';
      }
    });
    
    updateApplyButtonState(hasValidGroups && validateRootPattern());
  }
  
  function updateApplyButtonState(isValid: boolean) {
    if (applyButton) {
      applyButton.disabled = !isValid;
      applyButton.style.opacity = isValid ? '1' : '0.5';
    }
  }
  
  function updateButtonState() {
    // Listen for selection changes from main plugin
    window.addEventListener('message', (event) => {
      const message = event.data.pluginMessage;
      if (message?.type === 'selection-changed') {
        const hasSelection = message.hasSelection;
        updateExportButtonState(hasSelection);
      }
    });
  }
  
  function updateExportButtonState(hasSelection: boolean) {
    if (exportButton) {
      exportButton.disabled = !hasSelection;
      exportButton.style.opacity = hasSelection ? '1' : '0.5';
      exportButton.title = hasSelection ? 
        'Export node IDs from selected objects' : 
        'Please select nodes in Figma first';
    }
  }
  
  function showModalWithSelectionCheck() {
    // Request selection check from main plugin
    parent.postMessage({ pluginMessage: { type: 'check-selection' } }, '*');
    
    // Show modal with loading state
    if (modal) {
      modal.style.display = 'block';
      showSelectionStatus();
    }
  }
  
  function showSelectionStatus() {
    const statusDiv = document.getElementById('selection-status') || createSelectionStatusElement();
    statusDiv.textContent = 'Checking selection...';
    
    // Listen for selection response
    const handleSelectionResponse = (event: MessageEvent) => {
      const message = event.data.pluginMessage;
      if (message?.type === 'selection-status') {
        const count = message.selectionCount;
        if (count === 0) {
          statusDiv.innerHTML = `
            <div style="color: #ff4444; padding: 10px; border: 1px solid #ff4444; border-radius: 4px; margin-bottom: 10px;">
              ⚠️ No nodes selected. Please select nodes in Figma before configuring export.
            </div>
          `;
          if (applyButton) applyButton.disabled = true;
        } else {
          statusDiv.innerHTML = `
            <div style="color: var(--accent-color); padding: 10px; border: 1px solid var(--accent-color); border-radius: 4px; margin-bottom: 10px;">
              ✅ ${count} node(s) selected and ready for export
            </div>
          `;
          validateSortGroups(); // Re-validate to enable apply button
        }
        window.removeEventListener('message', handleSelectionResponse);
      }
    };
    
    window.addEventListener('message', handleSelectionResponse);
  }
  
  function createFeedbackElement(id: string): HTMLElement {
    const feedback = document.createElement('div');
    feedback.id = id;
    feedback.className = 'validation-feedback';
    feedback.style.cssText = 'font-size: 12px; margin-top: 4px; padding: 4px;';
    
    if (rootPatternInput && id === 'root-pattern-feedback') {
      rootPatternInput.parentNode?.appendChild(feedback);
    }
    
    return feedback;
  }
  
  function createSelectionStatusElement(): HTMLElement {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'selection-status';
    statusDiv.style.cssText = 'margin-bottom: 15px;';
    
    const modalContent = modal?.querySelector('.modal-content');
    const firstConfigSection = modalContent?.querySelector('.config-section');
    if (modalContent && firstConfigSection) {
      modalContent.insertBefore(statusDiv, firstConfigSection);
    }
    
    return statusDiv;
  }
  
  function showFeedback(element: HTMLElement, message: string, type: 'success' | 'error' | 'warning') {
    element.textContent = message;
    element.style.color = type === 'success' ? 'var(--accent-color)' : 
                         type === 'error' ? '#ff4444' : '#ffaa00';
  }

  // Helper function to detect if pattern needs range
  function isGridPattern(pattern: string): boolean {
    // Grid patterns typically contain row/col references
    const gridIndicators = [
      /Row_.*Col_/i,          // Row_X_Col_Y patterns
      /\d+.*\d+/,             // Multiple numeric placeholders
      /_\\d\+.*_\\d\+/,       // Multiple regex digit patterns
      /Col.*Row/i,            // Col_X_Row_Y patterns
      /Grid/i,                // Explicit grid naming
      /Table.*Cell/i,         // Table cell patterns
      /Cell_\\d/i             // Cell patterns
    ];
    
    return gridIndicators.some(regex => regex.test(pattern));
  }

  // Make removeSortGroup available globally
  (window as any).removeSortGroup = (groupId: string) => {
    const groupElement = document.getElementById(groupId);
    if (groupElement) {
      groupElement.remove();
      validateSortGroups(); // Re-validate after removal
    }
  };
}
