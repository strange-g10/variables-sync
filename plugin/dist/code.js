/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/config/index.ts":
/*!*****************************!*\
  !*** ./src/config/index.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   config: () => (/* binding */ config),
/* harmony export */   getConfigStatus: () => (/* binding */ getConfigStatus),
/* harmony export */   validateConfig: () => (/* binding */ validateConfig)
/* harmony export */ });
// Environment-based configuration
const getEnvVar = (key, defaultValue) => {
    // In Figma plugin context, we'll read from stored settings
    // For now, we'll use a fallback approach
    return defaultValue || '';
};
// This should be moved to environment variables or secure storage
const FALLBACK_API_KEY = "AIzaSyAUOdEsD93MkvtUl_UbwoKhECWEkWendoI";
const config = {
    // TODO: Replace with secure environment variable access
    GOOGLE_SHEETS_API_KEY: getEnvVar('GOOGLE_SHEETS_API_KEY', FALLBACK_API_KEY),
    BATCH_SIZE: parseInt(getEnvVar('BATCH_SIZE', '50'), 10),
    COLOR_EPSILON: parseFloat(getEnvVar('COLOR_EPSILON', '0.002')),
    MAX_RETRIES: parseInt(getEnvVar('MAX_RETRIES', '3'), 10),
    API_CALL_DELAY: parseInt(getEnvVar('API_CALL_DELAY', '1000'), 10),
};
// Configuration validation
const validateConfig = () => {
    const errors = [];
    if (!config.GOOGLE_SHEETS_API_KEY) {
        errors.push('GOOGLE_SHEETS_API_KEY is required');
    }
    if (config.BATCH_SIZE <= 0) {
        errors.push('BATCH_SIZE must be greater than 0');
    }
    if (config.MAX_RETRIES < 0) {
        errors.push('MAX_RETRIES must be non-negative');
    }
    return errors;
};
// Get configuration status for debugging
const getConfigStatus = () => {
    return {
        hasApiKey: !!config.GOOGLE_SHEETS_API_KEY,
        batchSize: config.BATCH_SIZE,
        colorEpsilon: config.COLOR_EPSILON,
        maxRetries: config.MAX_RETRIES,
        apiCallDelay: config.API_CALL_DELAY,
        validationErrors: validateConfig(),
    };
};


/***/ }),

/***/ "./src/features/assign/index.ts":
/*!**************************************!*\
  !*** ./src/features/assign/index.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   assignVariables: () => (/* binding */ assignVariables)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../config */ "./src/config/index.ts");
/* harmony import */ var _utils_log__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/log */ "./src/utils/log.ts");
/* harmony import */ var _utils_progress__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/progress */ "./src/utils/progress.ts");



async function assignVariables(data, forceBindAll = false) {
    const headers = data[0]; // ['name', 'type', 'id', 'LayerID']
    const rows = data.slice(1);
    const totalRows = rows.length;
    (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Starting assignment of ${totalRows} variables${forceBindAll ? " (Force Bind All)" : ""}`);
    // Load cache từ clientStorage
    const cachedBindings = (await figma.clientStorage.getAsync("bindings")) || new Map();
    const variableMap = new Map();
    figma.variables.getLocalVariables().forEach(v => variableMap.set(v.id, v));
    // Tạo Map từ sheet data
    const sheetMap = new Map();
    rows.forEach(row => sheetMap.set(row[3], { name: row[0], type: row[1], variableId: row[2] })); // layerId làm key
    // Delta detection (nếu không forceBindAll)
    let deltaRows = [];
    if (!forceBindAll) {
        for (const [layerId, sheetData] of sheetMap) {
            const current = cachedBindings.get(layerId);
            if (!current || current.variableId !== sheetData.variableId) {
                deltaRows.push([sheetData.name, sheetData.type, sheetData.variableId, layerId]);
            }
        }
        // Xóa bindings không còn trong sheet
        for (const [layerId, current] of cachedBindings) {
            if (!sheetMap.has(layerId)) {
                const node = figma.getNodeById(layerId);
                if (node) {
                    if (current.property === "characters" && node.type === "TEXT") {
                        node.setBoundVariable("characters", null);
                    }
                    else if (current.property === "visible") {
                        node.setBoundVariable("visible", null);
                    }
                }
                cachedBindings.delete(layerId);
            }
        }
    }
    else {
        deltaRows = rows; // Gán toàn bộ nếu forceBindAll
    }
    const deltaCount = deltaRows.length;
    (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Detected ${deltaCount} changes out of ${totalRows} variables`);
    if (deltaCount === 0 && !forceBindAll) {
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)("No changes detected, skipping assignment");
        await figma.clientStorage.setAsync("bindings", cachedBindings);
        return;
    }
    // Xử lý batch
    const batchSize = _config__WEBPACK_IMPORTED_MODULE_0__.config.BATCH_SIZE;
    let successfulCount = 0;
    async function processBatch(batchRows) {
        let batchSuccessCount = 0;
        for (let attempt = 1; attempt <= _config__WEBPACK_IMPORTED_MODULE_0__.config.MAX_RETRIES; attempt++) {
            try {
                const promises = batchRows.map(async (row) => {
                    const [name, type, variableId, layerId] = row;
                    const node = figma.getNodeById(layerId);
                    const variable = variableMap.get(variableId);
                    if (!node || !variable)
                        return;
                    if (type === "STRING" && node.type === "TEXT") {
                        const textNode = node;
                        await figma.loadFontAsync(textNode.fontName);
                        textNode.setBoundVariable("characters", variable);
                        cachedBindings.set(layerId, { variableId, property: "characters" });
                        batchSuccessCount++;
                    }
                    else if (type === "BOOLEAN" && "visible" in node) {
                        node.setBoundVariable("visible", variable);
                        cachedBindings.set(layerId, { variableId, property: "visible" });
                        batchSuccessCount++;
                    }
                });
                await Promise.all(promises);
                return batchSuccessCount;
            }
            catch (e) {
                if (attempt === _config__WEBPACK_IMPORTED_MODULE_0__.config.MAX_RETRIES) {
                    (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Batch failed after ${_config__WEBPACK_IMPORTED_MODULE_0__.config.MAX_RETRIES} retries: ${e.message}`);
                    return batchSuccessCount;
                }
                await new Promise(resolve => setTimeout(resolve, _config__WEBPACK_IMPORTED_MODULE_0__.config.API_CALL_DELAY));
            }
        }
        return batchSuccessCount;
    }
    for (let i = 0; i < deltaCount; i += batchSize) {
        const batchRows = deltaRows.slice(i, Math.min(i + batchSize, deltaCount));
        const batchSuccess = await processBatch(batchRows);
        successfulCount += batchSuccess;
        (0,_utils_progress__WEBPACK_IMPORTED_MODULE_2__.updateProgress)(`${i + batchSize} of ${deltaCount} changes`);
    }
    // Lưu cache sau khi hoàn thành
    await figma.clientStorage.setAsync("bindings", cachedBindings);
    (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Assignment completed: Processed ${deltaCount} changes, ${successfulCount} successful`);
}


/***/ }),

/***/ "./src/features/clear/index.ts":
/*!*************************************!*\
  !*** ./src/features/clear/index.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   clearCollections: () => (/* binding */ clearCollections)
/* harmony export */ });
/* harmony import */ var _utils_log__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/log */ "./src/utils/log.ts");

function clearCollections() {
    try {
        const collections = figma.variables.getLocalVariableCollections();
        collections.forEach((collection) => {
            const variables = figma.variables.getLocalVariables().filter((v) => v.variableCollectionId === collection.id);
            variables.forEach((v) => v.remove());
        });
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)("Cleared all variables in collections");
    }
    catch (e) {
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Clear collections error: ${e.message}`);
    }
}


/***/ }),

/***/ "./src/features/collections/index.ts":
/*!*******************************************!*\
  !*** ./src/features/collections/index.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getCollections: () => (/* binding */ getCollections)
/* harmony export */ });
function getCollections() {
    return figma.variables
        .getLocalVariableCollections()
        .map(c => c.name)
        .sort();
}


/***/ }),

/***/ "./src/features/export/full.ts":
/*!*************************************!*\
  !*** ./src/features/export/full.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   exportFull: () => (/* binding */ exportFull)
/* harmony export */ });
/* harmony import */ var _utils_log__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/log */ "./src/utils/log.ts");
/* harmony import */ var _utils_color__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/color */ "./src/utils/color.ts");


async function exportFull(collection) {
    try {
        const fileName = `${figma.root.name}${collection ? "_" + collection : ""}_full.json`;
        const variables = figma.variables.getLocalVariables();
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Exporting full data for ${variables.length} variables`);
        let collections;
        if (collection) {
            // Nếu collection là tên, tìm id
            const found = figma.variables.getLocalVariableCollections().find((c) => c.name === collection);
            collections = found ? [found.id] : [collection]; // fallback nếu truyền id
        }
        else {
            collections = [...new Set(variables.map((v) => v.variableCollectionId))];
        }
        const collectionNames = collections
            .map((id) => { var _a; return ((_a = figma.variables.getVariableCollectionById(id)) === null || _a === void 0 ? void 0 : _a.name) || id; })
            .filter(Boolean);
        const pages = figma.root.children.map((page) => page.name);
        const collectionModes = {};
        collections.forEach((collectionId) => {
            const collectionObj = figma.variables.getVariableCollectionById(collectionId);
            if (collectionObj) {
                collectionModes[collectionId] = collectionObj.modes.map((mode) => ({
                    modeId: mode.modeId,
                    name: mode.name,
                }));
            }
        });
        const data = {
            fileName: figma.root.name, // Trường fileName trong JSON luôn là tên file Figma gốc
            pages,
            collectionCount: collections.length,
            collectionNames,
            variables: variables
                .filter((v) => !collection ||
                collections.includes(v.variableCollectionId))
                .map((v) => {
                const collectionObj = figma.variables.getVariableCollectionById(v.variableCollectionId);
                if (!collectionObj)
                    return null;
                const modes = collectionModes[v.variableCollectionId] || [];
                return {
                    id: v.id,
                    name: v.name,
                    type: v.resolvedType,
                    key: (typeof v.key === 'string') ? v.key : '',
                    valuesByMode: Object.fromEntries(Object.entries(v.valuesByMode).map(([modeId, value]) => {
                        const mode = modes.find((m) => m.modeId === modeId);
                        const modeName = mode ? mode.name : modeId;
                        const exportedValue = v.resolvedType === "COLOR" ? (0,_utils_color__WEBPACK_IMPORTED_MODULE_1__.toHexColor)(value) : value;
                        return [modeName, exportedValue];
                    })),
                    collectionId: v.variableCollectionId,
                    collectionName: collectionObj.name,
                };
            })
                .filter((v) => v !== null),
        };
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Exported JSON: ${JSON.stringify(data, null, 2).slice(0, 1000)}...`);
        figma.ui.postMessage({ type: "exported", data, fileName });
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Exported full data as ${fileName} with ${variables.length} variables`);
    }
    catch (e) {
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Export error: ${e.message}`);
    }
}


/***/ }),

/***/ "./src/features/export/ids.ts":
/*!************************************!*\
  !*** ./src/features/export/ids.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   exportIds: () => (/* binding */ exportIds)
/* harmony export */ });
/* harmony import */ var _utils_log__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/log */ "./src/utils/log.ts");

async function exportIds(collection) {
    try {
        // Tên file lưu trên máy vẫn theo lựa chọn của người dùng
        const fileName = `${figma.root.name}${collection ? "_" + collection : ""}_ids.json`;
        const variables = figma.variables.getLocalVariables();
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Exporting IDs for ${variables.length} variables`);
        const data = {
            fileName: figma.root.name, // Trường fileName trong JSON luôn là tên file Figma gốc
            variables: variables
                .filter((v) => {
                var _a;
                return !collection ||
                    v.variableCollectionId ===
                        ((_a = figma.variables.getLocalVariableCollections().find((c) => c.name === collection)) === null || _a === void 0 ? void 0 : _a.id);
            })
                .map((v) => ({ id: v.id, name: v.name })),
        };
        figma.ui.postMessage({ type: "exported", data, fileName });
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Exported Variable IDs as ${fileName} with ${variables.length} variables`);
    }
    catch (e) {
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Export error: ${e.message}`);
    }
}


/***/ }),

/***/ "./src/features/export/index.ts":
/*!**************************************!*\
  !*** ./src/features/export/index.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   exportFull: () => (/* reexport safe */ _full__WEBPACK_IMPORTED_MODULE_0__.exportFull),
/* harmony export */   exportIds: () => (/* reexport safe */ _ids__WEBPACK_IMPORTED_MODULE_1__.exportIds),
/* harmony export */   exportSelectedNodes: () => (/* reexport safe */ _selectedNodes__WEBPACK_IMPORTED_MODULE_2__.exportSelectedNodes)
/* harmony export */ });
/* harmony import */ var _full__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./full */ "./src/features/export/full.ts");
/* harmony import */ var _ids__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ids */ "./src/features/export/ids.ts");
/* harmony import */ var _selectedNodes__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./selectedNodes */ "./src/features/export/selectedNodes.ts");





/***/ }),

/***/ "./src/features/export/selectedNodes.ts":
/*!**********************************************!*\
  !*** ./src/features/export/selectedNodes.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   exportSelectedNodes: () => (/* binding */ exportSelectedNodes)
/* harmony export */ });
/* harmony import */ var _utils_log__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/log */ "./src/utils/log.ts");

/**
 * Traverse node tree and collect nodes based on config patterns
 */
function collectSortedNodes(node, rootPattern, sortGroups) {
    // Early return if no sort groups - nothing to filter
    if (!sortGroups || sortGroups.length === 0) {
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)("No sort groups provided - returning empty result");
        return {};
    }
    const rootRegex = new RegExp(rootPattern);
    const nodeDict = {}; // Use Map to prevent duplicates
    const result = {};
    // Filter out empty/invalid sort groups
    const validSortGroups = sortGroups.filter(group => group.prefix && group.prefix.trim() !== '');
    if (validSortGroups.length === 0) {
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)("No valid sort groups found - returning empty result");
        return {};
    }
    (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Processing with ${validSortGroups.length} valid sort groups`);
    function traverse(node, currentRoot) {
        const name = node.name;
        const nodeId = node.id;
        const nodeType = node.type;
        // Check if this node matches the root pattern
        if (rootRegex.test(name)) {
            currentRoot = name;
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Found root: ${currentRoot}`);
        }
        // If we're under a root and this node has children, check them
        if (currentRoot && "children" in node && node.children) {
            for (const child of node.children) {
                const childName = child.name;
                const childId = child.id;
                const childType = child.type;
                // Check if child matches any sort group prefix (but only add once)
                let matchedAnyGroup = false;
                for (const group of validSortGroups) {
                    const prefixRegex = new RegExp(group.prefix);
                    if (prefixRegex.test(childName) && !matchedAnyGroup) {
                        if (!nodeDict[currentRoot]) {
                            nodeDict[currentRoot] = new Map();
                        }
                        // Use Map to prevent duplicates by ID
                        if (!nodeDict[currentRoot].has(childId)) {
                            nodeDict[currentRoot].set(childId, {
                                name: childName,
                                id: childId,
                                type: childType
                            });
                            (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Found node: ${childName} (ID: ${childId}) under ${currentRoot}`);
                        }
                        matchedAnyGroup = true; // Prevent multiple matches for same node
                        break; // Exit loop after first match
                    }
                }
                // Continue traversal
                traverse(child, currentRoot);
            }
        }
        else if ("children" in node && node.children) {
            // Continue traversal without current root
            for (const child of node.children) {
                traverse(child, currentRoot);
            }
        }
    }
    traverse(node);
    // Sort nodes for each root based on valid sort groups only
    for (const [root, nodesMap] of Object.entries(nodeDict)) {
        const sortedNodes = [];
        const processedNodeIds = new Set(); // Track processed nodes to prevent duplicates
        const nodesArray = Array.from(nodesMap.values()); // Convert Map to Array
        for (const group of validSortGroups) {
            if (group.range) {
                // Handle range-based sorting
                const { rows, cols } = group.range;
                for (let row = rows[0]; row <= rows[1]; row++) {
                    for (let col = cols[0]; col <= cols[1]; col++) {
                        let expectedName = group.prefix.replace("\\d+", String(col));
                        expectedName = expectedName.replace("Row_\\\\d+", `Row_${row}`);
                        const foundNode = nodesArray.find(n => n.name === expectedName && !processedNodeIds.has(n.id));
                        if (foundNode) {
                            sortedNodes.push(foundNode);
                            processedNodeIds.add(foundNode.id);
                            (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Range sorted: ${foundNode.name} (${foundNode.id})`);
                        }
                    }
                }
            }
            else {
                // Handle prefix-only sorting with duplicate prevention
                const prefixRegex = new RegExp(group.prefix);
                const matchingNodes = nodesArray.filter(n => prefixRegex.test(n.name) && !processedNodeIds.has(n.id));
                for (const node of matchingNodes) {
                    sortedNodes.push(node);
                    processedNodeIds.add(node.id);
                    (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Prefix sorted: ${node.name} (${node.id})`);
                }
            }
        }
        result[root] = {
            type: "tree",
            nodes: sortedNodes
        };
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Collected and sorted ${sortedNodes.length} nodes for ${root}`);
    }
    return result;
}
/**
 * Export selected nodes with configuration
 */
async function exportSelectedNodes(nodeConfig) {
    try {
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)("Error: No nodes selected");
            figma.notify("Please select nodes to export");
            return;
        }
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Exporting ${selection.length} selected nodes`);
        // Default configuration if none provided
        const config = nodeConfig || {
            rootPattern: "Role-Body-\\d+|Block-\\d+",
            sortGroups: [
                { prefix: "Row_\\d+_Text_Col_", range: { rows: [1, 10], cols: [1, 4] } },
                { prefix: "Row_\\d+_Visible_Col_", range: { rows: [1, 10], cols: [1, 4] } },
                { prefix: "Title" },
                { prefix: "Item \\d+" }
            ]
        };
        const fileName = `${figma.root.name}_selected_nodes.json`;
        let allCollectedNodes = {};
        // Process each selected node
        for (const selectedNode of selection) {
            const collectedFromNode = collectSortedNodes(selectedNode, config.rootPattern, config.sortGroups);
            // Merge results
            for (const [rootName, rootData] of Object.entries(collectedFromNode)) {
                if (allCollectedNodes[rootName]) {
                    // Merge nodes, avoiding duplicates
                    const existingIds = new Set(allCollectedNodes[rootName].nodes.map(n => n.id));
                    const newNodes = rootData.nodes.filter(n => !existingIds.has(n.id));
                    allCollectedNodes[rootName].nodes.push(...newNodes);
                }
                else {
                    allCollectedNodes[rootName] = rootData;
                }
            }
        }
        const data = {
            fileName: figma.root.name,
            selectionCount: selection.length,
            roots: allCollectedNodes
        };
        const totalNodes = Object.values(allCollectedNodes)
            .reduce((sum, root) => sum + root.nodes.length, 0);
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Exported ${totalNodes} nodes from ${Object.keys(allCollectedNodes).length} roots`);
        figma.ui.postMessage({ type: "exported", data, fileName });
        figma.notify(`Exported ${totalNodes} node IDs`);
    }
    catch (e) {
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Export error: ${e.message}`);
        figma.notify("Export failed. Check log for details.");
    }
}


/***/ }),

/***/ "./src/features/import/fetch.ts":
/*!**************************************!*\
  !*** ./src/features/import/fetch.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   fetchSheetData: () => (/* binding */ fetchSheetData),
/* harmony export */   fetchSheetMetadata: () => (/* binding */ fetchSheetMetadata),
/* harmony export */   fetchWithRetry: () => (/* binding */ fetchWithRetry)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../config */ "./src/config/index.ts");
/* harmony import */ var _utils_log__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/log */ "./src/utils/log.ts");


async function fetchWithRetry(url, maxRetries = _config__WEBPACK_IMPORTED_MODULE_0__.config.MAX_RETRIES) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`[DEBUG] fetchWithRetry: Fetching URL: ${url} (Attempt ${i + 1}/${maxRetries})`);
            const response = await fetch(url);
            console.log(`[DEBUG] fetchWithRetry: Response status: ${response.status}`);
            if (response.ok) {
                console.log(`[DEBUG] fetchWithRetry: Fetch successful`);
                return response;
            }
            if (response.status === 429) {
                console.log(`[DEBUG] fetchWithRetry: Quota error (429), retrying...`);
                await new Promise(resolve => setTimeout(resolve, _config__WEBPACK_IMPORTED_MODULE_0__.config.API_CALL_DELAY * (i + 1)));
                continue;
            }
            const text = await response.text();
            console.log(`[DEBUG] fetchWithRetry: Fetch failed, status: ${response.status}, body: ${text}`);
            throw new Error(`Fetch failed: ${response.statusText}`);
        }
        catch (e) {
            console.log(`[DEBUG] fetchWithRetry: Exception:`, e);
            if (i === maxRetries - 1) {
                throw e;
            }
        }
        finally {
            console.log(`[DEBUG] fetchWithRetry: Attempt ${i + 1} finished`);
        }
    }
    throw new Error("Unreachable");
}
async function fetchSheetMetadata(spreadsheetId, apiKey) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
    (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`[LOG] fetchSheetMetadata: Fetching metadata for spreadsheetId=${spreadsheetId}, apiKey=${apiKey ? '[REDACTED]' : '[MISSING]'}`);
    const response = await fetchWithRetry(url);
    const data = await response.json();
    console.log("[DEBUG] fetchSheetMetadata: raw metadata object:", data);
    (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`[LOG] fetchSheetMetadata: raw metadata object: ${JSON.stringify(data)}`);
    if (!data.sheets || !Array.isArray(data.sheets)) {
        console.log("[DEBUG] fetchSheetMetadata: data.sheets:", data.sheets);
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`[LOG] fetchSheetMetadata: data.sheets is invalid: ${JSON.stringify(data.sheets)}`);
    }
    else {
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`[LOG] fetchSheetMetadata: sheets count: ${data.sheets.length}`);
        data.sheets.forEach((sheet, idx) => {
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`[LOG] fetchSheetMetadata: sheet[${idx}].properties.title: ${sheet.properties && sheet.properties.title}`);
        });
    }
    (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Fetched metadata for spreadsheet ${spreadsheetId}: ${data.sheets ? data.sheets.length : 0} sheets`);
    return data;
}
async function fetchSheetData(spreadsheetId, sheetName, apiKey) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`;
    (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`[LOG] fetchSheetData: Fetching data for spreadsheetId=${spreadsheetId}, sheetName=${sheetName}, apiKey=${apiKey ? '[REDACTED]' : '[MISSING]'}`);
    const response = await fetchWithRetry(url);
    const data = await response.json();
    console.log(`[DEBUG] fetchSheetData: raw data for sheet '${sheetName}':`, data);
    (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`[LOG] fetchSheetData: raw data for sheet '${sheetName}': ${JSON.stringify(data)}`);
    if (!data.values || !Array.isArray(data.values)) {
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Invalid sheet data for ${sheetName}`);
        throw new Error(`Invalid sheet data for ${sheetName}`);
    }
    (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Fetched ${data.values.length} rows for sheet ${sheetName}`);
    console.log(`[DEBUG] fetchSheetData: parsed values for sheet '${sheetName}':`, data.values);
    return data.values;
}


/***/ }),

/***/ "./src/features/import/index.ts":
/*!**************************************!*\
  !*** ./src/features/import/index.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   cancel: () => (/* binding */ cancel),
/* harmony export */   importVariables: () => (/* binding */ importVariables),
/* harmony export */   shouldCancel: () => (/* binding */ shouldCancel)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../config */ "./src/config/index.ts");
/* harmony import */ var _utils_log__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/log */ "./src/utils/log.ts");
/* harmony import */ var _utils_progress__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/progress */ "./src/utils/progress.ts");
/* harmony import */ var _fetch__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./fetch */ "./src/features/import/fetch.ts");
/* harmony import */ var _utils_color__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../utils/color */ "./src/utils/color.ts");





let shouldCancel = false;
function cancel() {
    shouldCancel = true;
    (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)("Import cancelled");
}
function isVariableAlias(value) {
    return typeof value === "object" && "type" in value && value.type === "VARIABLE_ALIAS";
}
const variableCache = {};
function getVariableById(id) {
    if (variableCache[id] === undefined) {
        variableCache[id] = figma.variables.getVariableById(id);
    }
    return variableCache[id];
}
let apiCallCount = 0;
async function setValueWithRetry(variable, modeId, value, maxRetries = _config__WEBPACK_IMPORTED_MODULE_0__.config.MAX_RETRIES) {
    apiCallCount++;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const startTime = Date.now();
            variable.setValueForMode(modeId, value);
            const endTime = Date.now();
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Set value for ${variable.name} in mode ${modeId} took ${endTime - startTime}ms`);
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Updated value for ${variable.name} in mode ${variable.valuesByMode[modeId] ? Object.keys(variable.valuesByMode[modeId])[0] : modeId} to ${JSON.stringify(value)}`);
            return;
        }
        catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            if (i === maxRetries - 1) {
                (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Failed to set value for ${variable.name} in mode ${modeId} after ${maxRetries} retries: ${errorMessage}`);
                throw new Error(errorMessage);
            }
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Error for ${variable.name} in mode ${modeId} (${errorMessage}), retrying after ${_config__WEBPACK_IMPORTED_MODULE_0__.config.API_CALL_DELAY * (i + 1)}ms`);
            await new Promise(resolve => setTimeout(resolve, _config__WEBPACK_IMPORTED_MODULE_0__.config.API_CALL_DELAY * (i + 1)));
        }
    }
}
async function processBatch(rows, startIdx, batchSize, collection, allVariables, allAliases, sheetName, stats) {
    const endIdx = Math.min(startIdx + batchSize, rows.length);
    const batchRows = rows.slice(startIdx, endIdx);
    (0,_utils_progress__WEBPACK_IMPORTED_MODULE_2__.updateProgress)(`Processing ${sheetName}: ${startIdx + 1} - ${endIdx} of ${rows.length}`, stats);
    const modeColumns = Object.keys(batchRows[0] || {})
        .filter(h => !["name", "type", "VariableID"].includes(h) && !h.endsWith("_Variable_Alias") && !h.includes("$"))
        .filter(h => batchRows.some(row => row[h] && row[`${h}_Variable_Alias`]))
        .slice(0, 4);
    (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Detected modes for ${sheetName}: ${modeColumns.join(", ")}`);
    const existingModes = collection.modes;
    const modeMap = {};
    modeColumns.forEach((modeName, i) => {
        var _a;
        if (existingModes[i] && existingModes[i].name !== modeName) {
            collection.renameMode(existingModes[i].modeId, modeName);
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Renamed mode ${existingModes[i].name} to ${modeName} in ${sheetName}`);
        }
        else if (!existingModes[i] && collection.modes.length < 4) {
            const newModeId = collection.addMode(modeName);
            modeMap[modeName] = newModeId;
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Added mode ${modeName} to collection ${sheetName}`);
        }
        modeMap[modeName] = ((_a = existingModes[i]) === null || _a === void 0 ? void 0 : _a.modeId) || modeMap[modeName];
    });
    const validTypes = ["COLOR", "BOOLEAN", "FLOAT", "STRING"];
    for (const row of batchRows) {
        if (shouldCancel) {
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Batch processing stopped for ${sheetName} due to cancellation`);
            break;
        }
        try {
            let variable;
            const existingById = row.VariableID ? getVariableById(row.VariableID) : null;
            const existingByName = collection.variableIds
                .map(id => getVariableById(id))
                .find(v => (v === null || v === void 0 ? void 0 : v.name) === row.name);
            if (existingById) {
                variable = existingById;
            }
            else if (existingByName) {
                variable = existingByName;
            }
            else {
                if (!validTypes.includes(row.type)) {
                    (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Invalid type '${row.type}' for ${row.name} in ${sheetName}, using STRING`);
                    row.type = "STRING";
                }
                variable = figma.variables.createVariable(row.name, collection.id, row.type);
                stats.created++;
                (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Created variable ${row.name} in ${sheetName}`);
            }
            allVariables[variable.id] = variable;
            for (const modeName of modeColumns) {
                const value = row[modeName];
                const isAlias = row[`${modeName}_Variable_Alias`] === "TRUE";
                const modeId = modeMap[modeName];
                if (!isAlias) {
                    let resolvedValue;
                    switch (variable.resolvedType) {
                        case "COLOR":
                            if (typeof value !== "string" || !value.startsWith("#")) {
                                (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Invalid COLOR value '${value}' for ${variable.name} in mode ${modeName}, skipping`);
                                continue;
                            }
                            resolvedValue = (0,_utils_color__WEBPACK_IMPORTED_MODULE_4__.parseColor)(value);
                            break;
                        case "BOOLEAN":
                            resolvedValue = String(value).toLowerCase() === "true";
                            break;
                        case "FLOAT":
                            resolvedValue = parseFloat(value) || 0;
                            break;
                        case "STRING":
                        default:
                            resolvedValue = String(value || "");
                    }
                    const currentValue = variable.valuesByMode[modeId];
                    if (variable.resolvedType === "COLOR" && typeof currentValue === "object" && "r" in currentValue) {
                        const hexFromSheet = value;
                        const currentHex = (0,_utils_color__WEBPACK_IMPORTED_MODULE_4__.toHexColor)(currentValue);
                        if (hexFromSheet === currentHex) {
                            (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`No update needed for ${variable.name} in mode ${modeName}: hex=${hexFromSheet}`);
                            continue;
                        }
                        (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Comparing COLOR for ${variable.name} in mode ${modeName}: current=${JSON.stringify(currentValue)}, new=${JSON.stringify(resolvedValue)}`);
                        if (!(0,_utils_color__WEBPACK_IMPORTED_MODULE_4__.areRGBAsEqual)(currentValue, resolvedValue, _config__WEBPACK_IMPORTED_MODULE_0__.config.COLOR_EPSILON)) {
                            await setValueWithRetry(variable, modeId, resolvedValue);
                            stats.updated++;
                        }
                    }
                    else if (variable.resolvedType === "STRING" && currentValue !== resolvedValue) {
                        await setValueWithRetry(variable, modeId, resolvedValue);
                        stats.updated++;
                    }
                    else if (variable.resolvedType !== "STRING" && JSON.stringify(currentValue) !== JSON.stringify(resolvedValue)) {
                        await setValueWithRetry(variable, modeId, resolvedValue);
                        stats.updated++;
                    }
                }
                else if (typeof value === "string") {
                    const currentValue = variable.valuesByMode[modeId];
                    if (!isVariableAlias(currentValue) || currentValue.id !== value) {
                        allAliases.push({ variable, modeId, aliasId: value, sheetName });
                        stats.aliases++;
                        (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Queued alias for ${variable.name} in mode ${modeName} to ${value}`);
                    }
                }
                else {
                    (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Invalid alias value '${value}' for ${variable.name} in mode ${modeName}, skipping`);
                }
            }
        }
        catch (e) {
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Error processing variable ${row.name} in sheet ${sheetName}: ${e}`);
        }
        stats.processed++;
        (0,_utils_progress__WEBPACK_IMPORTED_MODULE_2__.updateProgress)(`Processing ${sheetName}: ${startIdx + 1} - ${endIdx} of ${rows.length}`, stats);
    }
}
async function importFromSheet(spreadsheetId, sheetName, apiKey, allVariables, allAliases, totalStats) {
    (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Starting import for sheet: ${sheetName}`);
    try {
        let rows;
        try {
            rows = await (0,_fetch__WEBPACK_IMPORTED_MODULE_3__.fetchSheetData)(spreadsheetId, sheetName, apiKey);
        }
        catch (e) {
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Failed to fetch data for ${sheetName}: ${e}`);
            return;
        }
        if (!rows || rows.length < 2) {
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Sheet ${sheetName} is empty or has no data, skipping`);
            return;
        }
        const headers = rows[0].filter((h) => !h.startsWith("$"));
        const dataRows = rows.slice(1).map((row) => headers.reduce((obj, header, i) => {
            obj[header] = row[i] || "";
            return obj;
        }, {}));
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Processing ${dataRows.length} variables in ${sheetName}`);
        let collection = figma.variables.getLocalVariableCollections().find(c => c.name === sheetName);
        if (!collection) {
            collection = figma.variables.createVariableCollection(sheetName);
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Created new collection: ${sheetName}`);
        }
        const stats = { processed: 0, total: dataRows.length, created: 0, updated: 0, aliases: 0 };
        const batchSize = _config__WEBPACK_IMPORTED_MODULE_0__.config.BATCH_SIZE;
        for (let i = 0; i < dataRows.length; i += batchSize) {
            if (shouldCancel) {
                (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Import stopped for ${sheetName}`);
                break;
            }
            await processBatch(dataRows, i, batchSize, collection, allVariables, allAliases, sheetName, stats);
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        totalStats.processed += stats.processed;
        totalStats.total += stats.total;
        totalStats.created += stats.created;
        totalStats.updated += stats.updated;
        totalStats.aliases += stats.aliases;
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Completed processing sheet: ${sheetName} with ${stats.processed}/${stats.total} variables, Created: ${stats.created}, Updated: ${stats.updated}, Aliases: ${stats.aliases}`);
    }
    catch (e) {
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Error processing sheet ${sheetName}: ${e}`);
    }
}
async function importVariables(link, excludeSheets, apiKey, cachedMetadata) {
    (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Starting importVariables with link: ${link}`);
    const startTime = Date.now();
    const totalStats = { processed: 0, total: 0, created: 0, updated: 0, aliases: 0 };
    try {
        const spreadsheetIdMatch = link.match(/[-\w]{25,}/);
        shouldCancel = false;
        if (!spreadsheetIdMatch) {
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)("Invalid Google Sheet URL");
            throw new Error("Invalid Google Sheet URL");
        }
        const spreadsheetId = spreadsheetIdMatch[0];
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Fetching metadata for spreadsheet: ${spreadsheetId}`);
        const metadata = await (0,_fetch__WEBPACK_IMPORTED_MODULE_3__.fetchSheetMetadata)(spreadsheetId, apiKey);
        let sheetNames = metadata.sheets.map(sheet => sheet.properties.title);
        if (excludeSheets && excludeSheets.length > 0) {
            sheetNames = sheetNames.filter(name => !excludeSheets.includes(name));
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Excluding sheets: ${excludeSheets.join(", ")}`);
        }
        const allVariables = {};
        const allAliases = [];
        apiCallCount = 0;
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Processing ${Object.keys(allVariables).length} variables and ${allAliases.length} aliases`);
        for (const sheetName of sheetNames) {
            if (shouldCancel) {
                (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)("Import cancelled by user");
                (0,_utils_progress__WEBPACK_IMPORTED_MODULE_2__.updateProgress)("Import cancelled", totalStats);
                break;
            }
            await importFromSheet(spreadsheetId, sheetName, apiKey, allVariables, allAliases, totalStats);
        }
        (0,_utils_progress__WEBPACK_IMPORTED_MODULE_2__.updateProgress)("Processing all aliases...", { processed: 0, total: allAliases.length, created: 0, updated: 0, aliases: 0 });
        let aliasStats = { processed: 0, total: allAliases.length, created: 0, updated: 0, aliases: 0 };
        for (const { variable, modeId, aliasId, sheetName } of allAliases) {
            if (shouldCancel) {
                (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)("Alias processing stopped by user");
                (0,_utils_progress__WEBPACK_IMPORTED_MODULE_2__.updateProgress)("Import cancelled during aliases", aliasStats);
                break;
            }
            const aliasVariable = getVariableById(aliasId);
            if (aliasVariable) {
                try {
                    const currentValue = variable.valuesByMode[modeId];
                    if (!isVariableAlias(currentValue) || currentValue.id !== aliasId) {
                        await setValueWithRetry(variable, modeId, { type: "VARIABLE_ALIAS", id: aliasId });
                        aliasStats.updated++;
                        totalStats.updated++;
                        (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Set alias for ${variable.name} in mode ${modeId} to ${aliasId} from sheet ${sheetName}`);
                    }
                }
                catch (e) {
                    (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Error setting alias for ${variable.name} in ${sheetName}: ${e}`);
                }
            }
            else {
                (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Warning: Missing alias ${aliasId} for ${variable.name} in ${sheetName}, skipping`);
            }
            aliasStats.processed++;
            totalStats.aliases = aliasStats.aliases;
            (0,_utils_progress__WEBPACK_IMPORTED_MODULE_2__.updateProgress)("Processing aliases...", aliasStats);
            if (aliasStats.processed % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        const endTime = Date.now();
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Import summary: Processed ${totalStats.processed}/${totalStats.total} variables, Created: ${totalStats.created}, Updated: ${totalStats.updated}, Aliases: ${totalStats.aliases}, API calls: ${apiCallCount}, Time: ${(endTime - startTime) / 1000}s`);
        (0,_utils_progress__WEBPACK_IMPORTED_MODULE_2__.updateProgress)("Import completed", totalStats);
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Exiting importVariables with ${allAliases.length} aliases processed`);
        return { spreadsheetId, sheetNames };
    }
    catch (e) {
        logToUI(`Import error: ${e}`);
        updateProgress("Import failed due to error", totalStats);
        throw e;
    }
}


/***/ }),

/***/ "./src/services/simpleGoogleSheetsExport.ts":
/*!**************************************************!*\
  !*** ./src/services/simpleGoogleSheetsExport.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SimpleGoogleSheetsExportService: () => (/* binding */ SimpleGoogleSheetsExportService)
/* harmony export */ });
/* harmony import */ var _utils_log__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/log */ "./src/utils/log.ts");
// Simplified Google Sheets Export Service using Service Account
// This service will store the Service Account JSON and use it via the existing scripts approach

class SimpleGoogleSheetsExportService {
    constructor(credentials, sheetsUrl) {
        if (typeof credentials === 'string') {
            try {
                this.serviceAccountCredentials = JSON.parse(credentials);
            }
            catch (error) {
                throw new Error('Invalid Service Account credentials JSON');
            }
        }
        else {
            this.serviceAccountCredentials = credentials;
        }
        this.spreadsheetId = this.extractSpreadsheetId(sheetsUrl);
    }
    extractSpreadsheetId(url) {
        const match = url.match(/[-\w]{25,}/);
        if (!match) {
            throw new Error('Invalid Google Sheets URL format');
        }
        return match[0];
    }
    /**
     * Process variables data similar to process_data.py
     */
    processVariablesData(variables) {
        const processedVariables = {};
        // Group variables by collection
        const collections = [...new Set(variables.map(v => v.collectionName))];
        for (const collectionName of collections) {
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Processing collection: ${collectionName}`);
            const collectionVars = variables.filter(v => v.collectionName === collectionName);
            if (collectionVars.length === 0)
                continue;
            // Get all modes from the first variable in collection
            const modes = Object.keys(collectionVars[0].valuesByMode);
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Found modes for ${collectionName}: ${modes.join(', ')}`);
            // Create header row: name, type, VariableKey, VariableID, then modes and aliases
            const header = ["name", "type", "VariableKey", "VariableID"];
            for (const mode of modes) {
                header.push(mode);
                header.push(`${mode}_Variable_Alias`);
            }
            const sheetData = [header];
            // Process each variable
            for (const variable of collectionVars) {
                const row = [
                    variable.name,
                    variable.type,
                    variable.key || "",
                    variable.id
                ];
                // Add mode values and alias flags
                for (const mode of modes) {
                    const value = variable.valuesByMode[mode];
                    const isAlias = typeof value === 'object' && (value === null || value === void 0 ? void 0 : value.type) === 'VARIABLE_ALIAS';
                    if (isAlias) {
                        row.push(value.id);
                        row.push("true");
                    }
                    else {
                        if (typeof value === 'boolean') {
                            row.push(value.toString());
                            row.push("false");
                        }
                        else {
                            row.push(value || "");
                            row.push("false");
                        }
                    }
                }
                sheetData.push(row);
            }
            processedVariables[collectionName] = sheetData;
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Processed ${collectionName}: ${sheetData.length - 1} variables`);
        }
        return processedVariables;
    }
    /**
     * Export to Google Sheets using MCP server as proxy
     */
    async exportToSheets(variables, onProgress) {
        try {
            onProgress === null || onProgress === void 0 ? void 0 : onProgress(10, "Processing variables data...");
            const processedData = this.processVariablesData(variables);
            onProgress === null || onProgress === void 0 ? void 0 : onProgress(30, "Preparing data for export...");
            // Create the data structure that matches what the Python scripts expect
            const exportData = {
                variables: processedData,
                spreadsheet_id: this.spreadsheetId,
                service_account: this.serviceAccountCredentials
            };
            onProgress === null || onProgress === void 0 ? void 0 : onProgress(50, "Sending to MCP server...");
            // Send data to MCP server endpoint
            const mcpServerUrl = 'http://localhost:3000/export-to-sheets'; // Adjust if needed
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Connecting to MCP server at: ${mcpServerUrl}`);
            const response = await fetch(mcpServerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(exportData)
            });
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`MCP Server response status: ${response.status}`);
            if (!response.ok) {
                const errorData = await response.text();
                (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`MCP Server error response: ${errorData}`);
                throw new Error(`MCP Server error: ${response.status} - ${errorData}`);
            }
            onProgress === null || onProgress === void 0 ? void 0 : onProgress(90, "Finalizing export...");
            // Check content type before parsing
            const contentType = response.headers.get('content-type');
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Response content-type: ${contentType}`);
            if (!contentType || !contentType.includes('application/json')) {
                const textResponse = await response.text();
                (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Non-JSON response: ${textResponse}`);
                throw new Error(`Expected JSON response but got: ${contentType}`);
            }
            const result = await response.json();
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`MCP Server response: ${JSON.stringify(result)}`);
            if (!result.success) {
                throw new Error(result.error || 'Unknown error from MCP server');
            }
            onProgress === null || onProgress === void 0 ? void 0 : onProgress(100, "Export completed successfully!");
            const collectionNames = Object.keys(processedData);
            const totalVariables = Object.values(processedData).reduce((sum, data) => sum + (data.length - 1), 0);
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Successfully exported ${totalVariables} variables across ${collectionNames.length} collections: ${collectionNames.join(', ')}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Export failed: ${errorMessage}`);
            // If MCP server is not available, provide instructions
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('MCP server not running. Please start the MCP server or use the Python scripts directly.');
            }
            throw new Error(errorMessage);
        }
    }
    /**
     * Alternative: Export as JSON files that can be processed by Python scripts
     */
    async exportAsProcessedJSON(variables) {
        const processedData = this.processVariablesData(variables);
        return {
            processedData,
            spreadsheetId: this.spreadsheetId
        };
    }
    /**
     * Validate Service Account credentials
     */
    static validateServiceAccount(credentials) {
        try {
            const parsed = JSON.parse(credentials);
            return !!(parsed.type === 'service_account' &&
                parsed.client_email &&
                parsed.private_key &&
                parsed.project_id);
        }
        catch {
            return false;
        }
    }
    /**
     * Get Service Account info for display
     */
    getServiceAccountInfo() {
        return {
            email: this.serviceAccountCredentials.client_email,
            project: this.serviceAccountCredentials.project_id
        };
    }
}


/***/ }),

/***/ "./src/utils/color.ts":
/*!****************************!*\
  !*** ./src/utils/color.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   areRGBAsEqual: () => (/* binding */ areRGBAsEqual),
/* harmony export */   parseColor: () => (/* binding */ parseColor),
/* harmony export */   toHexColor: () => (/* binding */ toHexColor)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../config */ "./src/config/index.ts");
/* harmony import */ var _log__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./log */ "./src/utils/log.ts");


function parseColor(value) {
    if (value.startsWith("#")) {
        const hex = value.replace("#", "");
        const len = hex.length;
        if (len !== 6 && len !== 8) {
            (0,_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Invalid color format '${value}', using default black`);
            return { r: 0, g: 0, b: 0, a: 1 };
        }
        return {
            r: parseInt(hex.slice(0, 2), 16) / 255,
            g: parseInt(hex.slice(2, 4), 16) / 255,
            b: parseInt(hex.slice(4, 6), 16) / 255,
            a: len === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
        };
    }
    (0,_log__WEBPACK_IMPORTED_MODULE_1__.logToUI)(`Invalid color format '${value}', using default black`);
    return { r: 0, g: 0, b: 0, a: 1 };
}
function toHexColor(value) {
    if (typeof value === "object" && "type" in value && value.type === "VARIABLE_ALIAS") {
        return { type: "VARIABLE_ALIAS", id: value.id };
    }
    if (typeof value === "object" && "r" in value) {
        const { r, g, b, a } = value;
        const toHex = (n) => {
            const val = Math.round(n * 255 * 100) / 100; // Làm tròn đến 2 chữ số thập phân
            return Math.round(val).toString(16).padStart(2, "0").toUpperCase();
        };
        const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        return a < 1 ? `${hex}${toHex(a)}` : hex;
    }
    return value;
}
function areRGBAsEqual(a, b, epsilon = _config__WEBPACK_IMPORTED_MODULE_0__.config.COLOR_EPSILON) {
    return (Math.abs(a.r - b.r) < epsilon &&
        Math.abs(a.g - b.g) < epsilon &&
        Math.abs(a.b - b.b) < epsilon &&
        Math.abs(a.a - b.a) < epsilon);
}


/***/ }),

/***/ "./src/utils/log.ts":
/*!**************************!*\
  !*** ./src/utils/log.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   logToUI: () => (/* binding */ logToUI)
/* harmony export */ });
function logToUI(message) {
    if (typeof window !== "undefined" && window.parent) {
        // UI context: send log to parent (Figma plugin)
        window.parent.postMessage({ pluginMessage: { type: "log", message } }, "*");
    }
    else if (typeof figma !== "undefined" && figma.ui) {
        // Plugin code context: send log to UI
        figma.ui.postMessage({ type: "log", message });
    }
    else {
        // Fallback: log to console
        console.log("[LOG]", message);
    }
}


/***/ }),

/***/ "./src/utils/progress.ts":
/*!*******************************!*\
  !*** ./src/utils/progress.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   updateProgress: () => (/* binding */ updateProgress)
/* harmony export */ });
function updateProgress(message, stats) {
    figma.ui.postMessage({ type: "progress", message, stats });
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config */ "./src/config/index.ts");
/* harmony import */ var _features_import__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./features/import */ "./src/features/import/index.ts");
/* harmony import */ var _features_export__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./features/export */ "./src/features/export/index.ts");
/* harmony import */ var _features_assign__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./features/assign */ "./src/features/assign/index.ts");
/* harmony import */ var _features_clear__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./features/clear */ "./src/features/clear/index.ts");
/* harmony import */ var _features_collections__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./features/collections */ "./src/features/collections/index.ts");
/* harmony import */ var _utils_log__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./utils/log */ "./src/utils/log.ts");
/* harmony import */ var _services_simpleGoogleSheetsExport__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./services/simpleGoogleSheetsExport */ "./src/services/simpleGoogleSheetsExport.ts");








figma.showUI(__html__, { width: 900, height: 700 });
let cachedMetadata = null;
// Handle Google Sheets export
async function handleSheetsExport(type, collection, config) {
    try {
        if (!config) {
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_6__.logToUI)("Error: No Google Sheets configuration provided");
            figma.ui.postMessage({ type: "export-error", error: "Missing configuration" });
            return;
        }
        const { sheetsUrl, serviceAccount } = config;
        if (!serviceAccount) {
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_6__.logToUI)("Error: Service Account credentials required");
            figma.ui.postMessage({ type: "export-error", error: "Service Account credentials required for Google Sheets export" });
            return;
        }
        // Progress callback
        const onProgress = (progress, status, details) => {
            figma.ui.postMessage({
                type: "export-progress",
                progress,
                status,
                details
            });
        };
        // Get variables data
        onProgress(5, "Getting variables data...");
        const variables = figma.variables.getLocalVariables();
        let filteredVariables = variables;
        if (collection && collection !== "All") {
            const targetCollection = figma.variables.getLocalVariableCollections().find(c => c.name === collection);
            if (targetCollection) {
                filteredVariables = variables.filter(v => v.variableCollectionId === targetCollection.id);
            }
        }
        // Convert to format expected by GoogleSheetsExportService
        const variablesData = filteredVariables.map(v => {
            const collectionObj = figma.variables.getVariableCollectionById(v.variableCollectionId);
            const modes = (collectionObj === null || collectionObj === void 0 ? void 0 : collectionObj.modes) || [];
            return {
                id: v.id,
                name: v.name,
                type: v.resolvedType,
                key: (typeof v.key === 'string') ? v.key : '',
                valuesByMode: Object.fromEntries(Object.entries(v.valuesByMode).map(([modeId, value]) => {
                    const mode = modes.find(m => m.modeId === modeId);
                    const modeName = mode ? mode.name : modeId;
                    // Convert color values to hex if needed
                    const exportedValue = v.resolvedType === "COLOR" ?
                        (typeof value === 'object' && 'r' in value ?
                            `#${Math.round(value.r * 255).toString(16).padStart(2, '0')}${Math.round(value.g * 255).toString(16).padStart(2, '0')}${Math.round(value.b * 255).toString(16).padStart(2, '0')}` :
                            value) :
                        value;
                    return [modeName, exportedValue];
                })),
                collectionId: v.variableCollectionId,
                collectionName: (collectionObj === null || collectionObj === void 0 ? void 0 : collectionObj.name) || 'Unknown Collection'
            };
        });
        if (type === 'ids') {
            // For IDs export, only include id and name
            variablesData.forEach(v => {
                v.valuesByMode = {}; // Clear values for IDs-only export
            });
        }
        onProgress(10, "Initializing Google Sheets service...");
        const exportService = new _services_simpleGoogleSheetsExport__WEBPACK_IMPORTED_MODULE_7__.SimpleGoogleSheetsExportService(serviceAccount, sheetsUrl);
        await exportService.exportToSheets(variablesData, onProgress);
        figma.ui.postMessage({ type: "export-complete" });
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_6__.logToUI)(`Successfully exported ${variablesData.length} variables to Google Sheets`);
    }
    catch (error) {
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_6__.logToUI)(`Google Sheets export failed: ${error}`);
        figma.ui.postMessage({ type: "export-error", error: error.message });
    }
}
figma.ui.onmessage = async (msg) => {
    var _a, _b;
    try {
        if (!msg.type) {
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_6__.logToUI)("Error: Invalid message format");
            return;
        }
        // --- Sheet Link Cache Handlers ---
        if (msg.type === "saveSheetLink") {
            let links = await figma.clientStorage.getAsync("sheetLinks") || [];
            if (!links.includes(msg.link)) {
                links.unshift(msg.link);
                if (links.length > 10)
                    links = links.slice(0, 10);
                await figma.clientStorage.setAsync("sheetLinks", links);
            }
            return;
        }
        if (msg.type === "getSheetLinks") {
            const links = await figma.clientStorage.getAsync("sheetLinks") || [];
            figma.ui.postMessage({ type: "sheetLinks", links });
            return;
        }
        switch (msg.type) {
            case "get-collections":
                const collections = (0,_features_collections__WEBPACK_IMPORTED_MODULE_5__.getCollections)();
                figma.ui.postMessage({ type: "collections", collections });
                break;
            case "export-full":
                await (0,_features_export__WEBPACK_IMPORTED_MODULE_2__.exportFull)(msg.collection);
                break;
            case "export-ids":
                await (0,_features_export__WEBPACK_IMPORTED_MODULE_2__.exportIds)(msg.collection);
                break;
            case "export-selected-nodes":
                await (0,_features_export__WEBPACK_IMPORTED_MODULE_2__.exportSelectedNodes)(msg.nodeConfig);
                break;
            case "check-selection":
                const selectionCount = figma.currentPage.selection.length;
                figma.ui.postMessage({
                    type: "selection-status",
                    selectionCount,
                    hasSelection: selectionCount > 0
                });
                break;
            case "clear-collections":
                (0,_features_clear__WEBPACK_IMPORTED_MODULE_4__.clearCollections)();
                break;
            case "fetch-sheet-list": {
                // Extract spreadsheetId from link
                const match = (_a = msg.link) === null || _a === void 0 ? void 0 : _a.match(/[-\w]{25,}/);
                if (!match) {
                    (0,_utils_log__WEBPACK_IMPORTED_MODULE_6__.logToUI)("Error: Invalid Google Sheet link");
                    break;
                }
                const spreadsheetId = match[0];
                const metadata = await Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! ./features/import/fetch */ "./src/features/import/fetch.ts"));
                const meta = await metadata.fetchSheetMetadata(spreadsheetId, _config__WEBPACK_IMPORTED_MODULE_0__.config.GOOGLE_SHEETS_API_KEY);
                const sheets = ((_b = meta.sheets) === null || _b === void 0 ? void 0 : _b.map((s) => s.properties.title)) || [];
                figma.ui.postMessage({ type: "sheet-list", sheets });
                break;
            }
            case "import":
                if (!msg.link) {
                    (0,_utils_log__WEBPACK_IMPORTED_MODULE_6__.logToUI)("Error: No Google Sheet link provided");
                    break;
                }
                cachedMetadata = await (0,_features_import__WEBPACK_IMPORTED_MODULE_1__.importVariables)(msg.link, msg.excludeSheets, _config__WEBPACK_IMPORTED_MODULE_0__.config.GOOGLE_SHEETS_API_KEY, cachedMetadata);
                break;
            case "assign":
                if (!msg.data) {
                    (0,_utils_log__WEBPACK_IMPORTED_MODULE_6__.logToUI)("Error: No data provided for assignment");
                    break;
                }
                await (0,_features_assign__WEBPACK_IMPORTED_MODULE_3__.assignVariables)(msg.data, msg.forceBindAll || false);
                figma.notify("Assignment completed!");
                break;
            case "cancel-import":
                (0,_features_import__WEBPACK_IMPORTED_MODULE_1__.cancel)();
                break;
            case "get-api-key":
                // Send API key from config to UI
                figma.ui.postMessage({ type: "api-key-loaded", apiKey: _config__WEBPACK_IMPORTED_MODULE_0__.config.GOOGLE_SHEETS_API_KEY });
                break;
            case "export-full-sheets":
                await handleSheetsExport('full', msg.collection, msg.config);
                break;
            case "export-ids-sheets":
                await handleSheetsExport('ids', msg.collection, msg.config);
                break;
            case "cancel-export":
                // Handle export cancellation
                (0,_utils_log__WEBPACK_IMPORTED_MODULE_6__.logToUI)("Export cancelled by user");
                break;
            case "get-sheet-styles-config":
                // Load current sheet styles configuration
                try {
                    const savedConfig = await figma.clientStorage.getAsync("sheet-styles-config");
                    const defaultConfig = {
                        variables: {
                            row_height: 30,
                            column_a_width: 150,
                            column_b_width: 100,
                            mode_column_width: 200,
                            id_column_width: 200,
                            key_column_width: 200,
                            even_row_color: [240, 240, 240],
                            odd_row_color: [255, 255, 255],
                            ellipse: true
                        }
                    };
                    const config = savedConfig || defaultConfig;
                    figma.ui.postMessage({ type: "sheet-styles-config-loaded", config });
                }
                catch (error) {
                    (0,_utils_log__WEBPACK_IMPORTED_MODULE_6__.logToUI)(`Error loading sheet styles config: ${error}`);
                }
                break;
            case "save-sheet-styles-config":
                // Save sheet styles configuration
                try {
                    const configToSave = {
                        variables: msg.sheetStylesConfig
                    };
                    await figma.clientStorage.setAsync("sheet-styles-config", configToSave);
                    figma.ui.postMessage({ type: "sheet-styles-config-saved" });
                    (0,_utils_log__WEBPACK_IMPORTED_MODULE_6__.logToUI)("Sheet styles configuration saved successfully");
                }
                catch (error) {
                    (0,_utils_log__WEBPACK_IMPORTED_MODULE_6__.logToUI)(`Error saving sheet styles config: ${error}`);
                }
                break;
            default:
                (0,_utils_log__WEBPACK_IMPORTED_MODULE_6__.logToUI)(`Unknown message type: ${msg.type}`);
        }
    }
    catch (e) {
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_6__.logToUI)(`Error: ${e.message}`);
    }
};

})();

/******/ })()
;