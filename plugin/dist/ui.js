/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/css-loader/dist/cjs.js!./src/ui/styles/main.css":
/*!**********************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/ui/styles/main.css ***!
  \**********************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/noSourceMaps.js */ "./node_modules/css-loader/dist/runtime/noSourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `/* src/ui/styles/main.css */
:root {
    --background: #08140e; /* Xám xanh đậm cho nền chính */
    --tab-bg: #0b291b; /* Nền tab không active */
    --tab-active-bg: #081d13; /* Nền tối hơn cho tab active */
    --text-color: #d8f0dc; /* Trắng nhạt pha xanh */
    --accent-color: #10c210; /* Xanh sáng làm màu chữ active và progress */
    --tab-header-bg: #253b2c; /* Nền xám xanh nhạt cho tab container */
    --log-background: #14261a; /* Nền xám xanh nhạt cho tab container */
    --form-border: #3b5a47; /* Viền xanh xám */
    --tab-active-shadow: rgba(20, 58, 31, 0.4); /* Shadow xanh đậm */
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", Arial, sans-serif;
    background: var(--background);
    color: var(--text-color);
    padding: 10px;
    margin: 0;
    box-sizing: border-box;
  }
  
  button, input, select, textarea {
    font-family: inherit;
    border-radius: 8px;
    border: 1px solid var(--form-border); /* Viền tím xám */
    background: var(--tab-bg);
    color: var(--text-color);
    padding: 6px 12px;
    margin: 5px 0;
  }
  
  button:hover { background: var(--form-border); }
  button:disabled { opacity: 0.5; }
  input, select { width: 100%; box-sizing: border-box; }
  
  .tab-container {
    width: 100%;
    max-width: 880px;
    margin: 0 auto;
  }
  
  .tab-headers {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
    background: var(--tab-header-bg);
    padding: 4px;
    border-radius: 8px;
  }
  
  .tab-header {
    flex: 1;
    padding: 8px;
    background: var(--tab-bg);
    border: none;
    color: var(--text-color);
    cursor: pointer;
    transition: background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
    border-radius: 6px;
  }
  
  .tab-header.active {
    background: var(--tab-active-bg); /* Nền tối khi active */
    color: var(--accent-color); /* Chữ tím sáng */
    box-shadow: 0 2px 8px var(--tab-active-shadow); 
  }
  
  .tab-content {
    position: relative;
    height: 500px;
  }
  
  .tab-pane {
    position: absolute;
    width: 100%;
    padding: 10px;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  
  .tab-pane.active {
    opacity: 1;
    pointer-events: auto;
  }
  
  #log {
    width: 100%;
    height: 100px;
    display: none;
    background: var(--log-background); /* Tím đen đậm cho log */
    color: var(--text-color);
    border: none;
    resize: none;
  }
  
  .form-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .form-group {
    flex: 1 1 45%;
    margin-bottom: 10px;
  }

  .button-row {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
  }
  
  #progress {
    margin-top: 10px;
  }
  
  #progress-bar-container {
    width: 100%;
    background: var(--form-border); /* Xám tím cho thanh progress */
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
  }
  
  #progress-bar {
    width: 0%;
    background: var(--accent-color); /* Tím sáng cho progress */
    height: 100%;
    transition: width 0.3s ease;
  }

  /* Modal styles */
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }

  .modal-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--background);
    padding: 20px;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 80%;
    overflow-y: auto;
    border: 1px solid var(--form-border);
  }

  .config-section {
    margin-bottom: 15px;
  }

  .config-section label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: var(--accent-color);
  }

  .config-section input, .config-section select {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--form-border);
    border-radius: 4px;
    margin-bottom: 5px;
    background: var(--tab-bg);
    color: var(--text-color);
    box-sizing: border-box;
  }

  .sort-group {
    border: 1px solid var(--form-border);
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 4px;
    background: var(--tab-bg);
  }

  .sort-group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .range-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 5px;
    margin-top: 5px;
  }

  .range-inputs input {
    padding: 4px;
    font-size: 12px;
  }

  .modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }

  .modal-buttons button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  #apply-config {
    background-color: var(--accent-color);
    color: var(--background);
  }

  #cancel-config {
    background-color: var(--form-border);
    color: var(--text-color);
  }

  .remove-group {
    background-color: #ff4444;
    color: white;
    border: none;
    border-radius: 3px;
    padding: 2px 6px;
    cursor: pointer;
    font-size: 12px;
  }

  #add-sort-group {
    background-color: var(--tab-bg);
    border: 1px solid var(--form-border);
    color: var(--text-color);
  }

  /* Section Headers */
  .section-header {
    margin-bottom: 15px;
    text-align: center;
  }

  .section-header h4 {
    margin: 0 0 5px 0;
    color: var(--accent-color);
    font-size: 16px;
  }

  .section-description {
    margin: 0;
    font-size: 12px;
    color: var(--text-color);
    opacity: 0.8;
  }

  /* Usage Guide */
  .usage-guide {
    background: var(--tab-bg);
    border: 1px solid var(--form-border);
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 15px;
  }

  .usage-guide h5 {
    margin: 0 0 8px 0;
    color: var(--accent-color);
    font-size: 13px;
  }

  .usage-guide ol {
    margin: 0;
    padding-left: 16px;
    font-size: 12px;
    line-height: 1.4;
  }

  .usage-guide li {
    margin-bottom: 4px;
  }

  /* Feature Highlights */
  .feature-highlights {
    display: flex;
    gap: 8px;
    margin-top: 15px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .highlight-item {
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--tab-bg);
    border: 1px solid var(--form-border);
    border-radius: 4px;
    padding: 6px 8px;
    font-size: 11px;
    color: var(--text-color);
  }

  .highlight-icon {
    font-size: 14px;
  }

  /* Enhanced Button for Node Export */
  #export-selected-nodes {
    background: linear-gradient(135deg, var(--accent-color), #0ea00e);
    color: var(--background);
    font-weight: bold;
    font-size: 14px;
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    margin: 10px 0;
  }

  #export-selected-nodes:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 194, 16, 0.3);
  }

  #export-selected-nodes:disabled {
    background: var(--form-border);
    color: var(--text-color);
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* Validation Feedback */
  .validation-feedback {
    font-size: 12px;
    margin-top: 4px;
    padding: 4px;
    border-radius: 3px;
  }

  /* Enhanced Modal Title */
  .modal-content h3 {
    color: var(--accent-color);
    margin-bottom: 20px;
    text-align: center;
    border-bottom: 1px solid var(--form-border);
    padding-bottom: 10px;
  }

  /* Selection Status */
  #selection-status {
    margin-bottom: 15px;
  }

  /* Improved form inputs with validation states */
  input.valid {
    border-color: var(--accent-color);
    box-shadow: 0 0 4px rgba(16, 194, 16, 0.2);
  }

  input.invalid {
    border-color: #ff4444;
    box-shadow: 0 0 4px rgba(255, 68, 68, 0.2);
  }

  /* Tooltip styling */
  [title] {
    position: relative;
  }
  /* Improved disabled state for apply button */
  #apply-config:disabled {
    background-color: var(--form-border);
    color: var(--text-color);
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Settings Tab Styling */
  .settings-tab {
    font-size: 18px;
    min-width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .about-info {
    background: var(--tab-bg);
    border: 1px solid var(--form-border);
    border-radius: 6px;
    padding: 12px;
    font-size: 13px;
    line-height: 1.5;
  }

  .about-info p {
    margin: 4px 0;
  }

  .about-info strong {
    color: var(--accent-color);
  }

  /* Log styling in settings */
  #settings-tab #log {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 11px;
    background: var(--log-background);
    border: 1px solid var(--form-border);
    border-radius: 4px;
    padding: 8px;
    box-sizing: border-box;
  }

  /* Hide duplicate log elements outside settings */
  body > #toggle-log,
  body > #export-log,
  body > #log,
  body > #progress {
    display: none !important;
  }

  /* Enhanced Export UI Styles */
  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    color: var(--accent-color);
    font-size: 13px;
  }

  .radio-group {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .radio-option {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 8px 12px;
    border: 1px solid var(--form-border);
    border-radius: 6px;
    transition: all 0.2s ease;
    flex: 1;
    justify-content: center;
  }

  .radio-option:hover {
    background: var(--tab-bg);
    border-color: var(--accent-color);
  }

  .radio-option input[type="radio"] {
    margin: 0 8px 0 0;
    width: auto;
  }

  .radio-option input[type="radio"]:checked + .radio-label {
    color: var(--accent-color);
    font-weight: 600;
  }

  .radio-label {
    font-size: 13px;
    transition: color 0.2s ease;
  }

  .config-section {
    background: var(--tab-bg);
    border: 1px solid var(--form-border);
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;
  }

  .api-key-container {
    display: flex;
    gap: 8px;
    align-items: stretch;
  }

  .api-key-container input {
    flex: 1;
    margin: 0;
  }

  .toggle-btn {
    padding: 6px 12px;
    background: var(--form-border);
    border: 1px solid var(--form-border);
    border-radius: 4px;
    color: var(--text-color);
    cursor: pointer;
    font-size: 12px;
    margin: 0;
    width: auto;
    min-width: 40px;
  }

  .toggle-btn:hover {
    background: var(--accent-color);
    color: var(--background);
  }

  .input-hint {
    font-size: 11px;
    color: var(--text-color);
    opacity: 0.7;
    margin-top: 4px;
  }

  .input-hint a {
    color: var(--accent-color);
    text-decoration: none;
  }

  .input-hint a:hover {
    text-decoration: underline;
  }

  .status-indicator {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 3px;
    background: var(--form-border);
  }

  .status-indicator.valid {
    background: var(--accent-color);
    color: var(--background);
  }

  .status-indicator.invalid {
    background: #ff4444;
    color: white;
  }

  .export-options {
    display: flex;
    gap: 12px;
    margin: 20px 0;
  }

  .export-btn {
    flex: 1;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
  }

  .export-btn.primary {
    background: linear-gradient(135deg, var(--accent-color), #0ea00e);
    color: var(--background);
  }

  .export-btn.primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 194, 16, 0.3);
  }

  .export-btn.secondary {
    background: var(--tab-bg);
    color: var(--text-color);
    border: 1px solid var(--form-border);
  }

  .export-btn.secondary:hover:not(:disabled) {
    background: var(--form-border);
    border-color: var(--accent-color);
  }

  .export-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  .btn-icon {
    font-size: 16px;
  }

  .advanced-section {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--form-border);
  }

  .advanced-section h5 {
    margin: 0 0 12px 0;
    color: var(--text-color);
    font-size: 13px;
    opacity: 0.8;
  }

  .danger-btn {
    background: #3a1a1a;
    color: #ff6b6b;
    border: 1px solid #4a2424;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .danger-btn:hover {
    background: #4a2424;
    border-color: #ff6b6b;
  }

  .progress-section {
    background: var(--tab-bg);
    border: 1px solid var(--form-border);
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .progress-header span {
    font-size: 13px;
    font-weight: 600;
    color: var(--accent-color);
  }

  .cancel-btn {
    background: #4a2424;
    color: #ff6b6b;
    border: 1px solid #ff6b6b;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
  }

  .cancel-btn:hover {
    background: #ff6b6b;
    color: white;
  }

  .progress-bar-container {
    width: 100%;
    background: var(--form-border);
    height: 6px;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-color), #0ea00e);
    width: 0%;
    transition: width 0.3s ease;
  }

  .progress-details {
    font-size: 11px;
    color: var(--text-color);
    opacity: 0.8;
  }

  /* Authentication Configuration Styles */
  .auth-config {
    background: var(--tab-active-bg);
    border: 1px solid var(--form-border);
    border-radius: 6px;
    padding: 12px;
    margin-top: 12px;
  }

  .service-account-details {
    background: var(--tab-bg);
    border: 1px solid var(--accent-color);
    border-radius: 4px;
    padding: 8px;
    font-size: 12px;
    color: var(--accent-color);
  }

  #service-account-file {
    background: var(--tab-bg);
    border: 2px dashed var(--form-border);
    border-radius: 6px;
    padding: 12px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  #service-account-file:hover {
    border-color: var(--accent-color);
    background: var(--tab-active-bg);
  }

  #service-account-file:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 4px rgba(16, 194, 16, 0.3);
  }
`, ""]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/api.js":
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
/***/ ((module) => {



/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";
      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }
      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }
      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }
      content += cssWithMappingToString(item);
      if (needLayer) {
        content += "}";
      }
      if (item[2]) {
        content += "}";
      }
      if (item[4]) {
        content += "}";
      }
      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }
    var alreadyImportedModules = {};
    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];
        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }
    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);
      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }
      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }
      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }
      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }
      list.push(item);
    }
  };
  return list;
};

/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/noSourceMaps.js":
/*!**************************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/noSourceMaps.js ***!
  \**************************************************************/
/***/ ((module) => {



module.exports = function (i) {
  return i[1];
};

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js":
/*!****************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \****************************************************************************/
/***/ ((module) => {



var stylesInDOM = [];
function getIndexByIdentifier(identifier) {
  var result = -1;
  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }
  return result;
}
function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };
    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }
    identifiers.push(identifier);
  }
  return identifiers;
}
function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);
  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }
      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };
  return updater;
}
module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];
    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }
    var newLastIdentifiers = modulesToDom(newList, options);
    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];
      var _index = getIndexByIdentifier(_identifier);
      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();
        stylesInDOM.splice(_index, 1);
      }
    }
    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/insertBySelector.js":
/*!********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertBySelector.js ***!
  \********************************************************************/
/***/ ((module) => {



var memo = {};

/* istanbul ignore next  */
function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target);

    // Special case to return head of iframe instead of iframe itself
    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }
    memo[target] = styleTarget;
  }
  return memo[target];
}

/* istanbul ignore next  */
function insertBySelector(insert, style) {
  var target = getTarget(insert);
  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }
  target.appendChild(style);
}
module.exports = insertBySelector;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/insertStyleElement.js":
/*!**********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertStyleElement.js ***!
  \**********************************************************************/
/***/ ((module) => {



/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}
module.exports = insertStyleElement;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js ***!
  \**********************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;
  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}
module.exports = setAttributesWithoutAttributes;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/styleDomAPI.js":
/*!***************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleDomAPI.js ***!
  \***************************************************************/
/***/ ((module) => {



/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";
  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }
  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }
  var needLayer = typeof obj.layer !== "undefined";
  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }
  css += obj.css;
  if (needLayer) {
    css += "}";
  }
  if (obj.media) {
    css += "}";
  }
  if (obj.supports) {
    css += "}";
  }
  var sourceMap = obj.sourceMap;
  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  }

  // For old IE
  /* istanbul ignore if  */
  options.styleTagTransform(css, styleElement, options.options);
}
function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }
  styleElement.parentNode.removeChild(styleElement);
}

/* istanbul ignore next  */
function domAPI(options) {
  if (typeof document === "undefined") {
    return {
      update: function update() {},
      remove: function remove() {}
    };
  }
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}
module.exports = domAPI;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/styleTagTransform.js":
/*!*********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleTagTransform.js ***!
  \*********************************************************************/
/***/ ((module) => {



/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }
    styleElement.appendChild(document.createTextNode(css));
  }
}
module.exports = styleTagTransform;

/***/ }),

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

/***/ "./src/ui/components/assignUI.ts":
/*!***************************************!*\
  !*** ./src/ui/components/assignUI.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeAssignUI: () => (/* binding */ initializeAssignUI)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../config */ "./src/config/index.ts");
/* harmony import */ var _features_import_fetch__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../features/import/fetch */ "./src/features/import/fetch.ts");


function initializeAssignUI() {
    const assignSheetLink = document.getElementById("assign-sheet-link");
    const sheetSelect = document.getElementById("sheet-select");
    const assignButton = document.getElementById("assign");
    const forceAssignButton = document.getElementById("force-assign");
    // --- Sheet Link Cache Helpers (Figma clientStorage via postMessage) ---
    function saveSheetLinkToCache(link) {
        parent.postMessage({ pluginMessage: { type: "saveSheetLink", link } }, "*");
    }
    function getSheetLinksFromCache() {
        parent.postMessage({ pluginMessage: { type: "getSheetLinks" } }, "*");
    }
    function renderSheetLinkCacheDropdown(links) {
        var _a;
        let dropdown = document.getElementById('sheet-link-cache');
        if (!dropdown) {
            dropdown = document.createElement('select');
            dropdown.id = 'sheet-link-cache';
            dropdown.style.marginBottom = '8px';
            dropdown.innerHTML = '<option value="">Chọn link sheet đã dùng...</option>';
            (_a = assignSheetLink === null || assignSheetLink === void 0 ? void 0 : assignSheetLink.parentElement) === null || _a === void 0 ? void 0 : _a.insertBefore(dropdown, assignSheetLink);
        }
        dropdown.innerHTML = '<option value="">Chọn link sheet đã dùng...</option>' +
            links.map(link => `<option value="${link}">${link}</option>`).join("");
        dropdown.onchange = () => {
            if (dropdown.value && assignSheetLink) {
                assignSheetLink.value = dropdown.value;
                assignSheetLink.dispatchEvent(new Event('input'));
            }
        };
    }
    // Listen for backend response
    window.addEventListener('message', (event) => {
        const msg = event.data.pluginMessage;
        if (msg && msg.type === 'sheetLinks') {
            renderSheetLinkCacheDropdown(msg.links || []);
        }
    });
    // DEBUG: Log element existence
    console.log("[DEBUG] assignSheetLink:", assignSheetLink);
    console.log("[DEBUG] sheetSelect:", sheetSelect);
    console.log("[DEBUG] assignButton:", assignButton);
    console.log("[DEBUG] forceAssignButton:", forceAssignButton);
    function logButtonStates() {
        console.log(`[DEBUG] Button states - sheetSelect: ${sheetSelect === null || sheetSelect === void 0 ? void 0 : sheetSelect.disabled}, assignButton: ${assignButton === null || assignButton === void 0 ? void 0 : assignButton.disabled}, forceAssignButton: ${forceAssignButton === null || forceAssignButton === void 0 ? void 0 : forceAssignButton.disabled}`);
    }
    if (assignSheetLink && sheetSelect && assignButton && forceAssignButton) {
        getSheetLinksFromCache(); // Gọi lấy cache khi UI load
        renderSheetLinkCacheDropdown([]);
        assignSheetLink.oninput = async () => {
            var _a, _b;
            console.log("[DEBUG] oninput triggered");
            const link = assignSheetLink.value;
            const spreadsheetId = extractSpreadsheetId(link);
            logMessage(`[DEBUG] Input link: ${link}, Extracted spreadsheetId: ${spreadsheetId}`);
            if (spreadsheetId) {
                logMessage(`[DEBUG] About to call fetchSheetMetadata for spreadsheetId: ${spreadsheetId}`);
                try {
                    const metadata = await (0,_features_import_fetch__WEBPACK_IMPORTED_MODULE_1__.fetchSheetMetadata)(spreadsheetId, _config__WEBPACK_IMPORTED_MODULE_0__.config.GOOGLE_SHEETS_API_KEY);
                    console.log("[DEBUG] metadata.sheets length:", (_a = metadata.sheets) === null || _a === void 0 ? void 0 : _a.length);
                    console.log("[DEBUG] metadata.sheets titles:", (_b = metadata.sheets) === null || _b === void 0 ? void 0 : _b.map(s => s.properties.title));
                    if (metadata.sheets && Array.isArray(metadata.sheets)) {
                        const sheets = metadata.sheets.map(sheet => sheet.properties.title);
                        sheetSelect.innerHTML = sheets.map((sheet) => `<option value=\"${sheet}\">${sheet}</option>`).join("");
                        sheetSelect.disabled = false;
                        assignButton.disabled = false;
                        forceAssignButton.disabled = false;
                        logMessage(`Loaded ${sheets.length} sheets from ${spreadsheetId}`);
                        logButtonStates();
                        saveSheetLinkToCache(link); // Lưu cache khi fetch thành công
                        getSheetLinksFromCache(); // Cập nhật lại dropdown
                    }
                    else {
                        logMessage(`[DEBUG] Metadata missing 'sheets' or not an array: ${JSON.stringify(metadata)}`);
                        sheetSelect.disabled = true;
                        assignButton.disabled = true;
                        forceAssignButton.disabled = true;
                        logButtonStates();
                    }
                }
                catch (e) {
                    logMessage(`[DEBUG] fetchSheetMetadata threw error: ${e.message}`);
                    logMessage(`Error loading sheets: ${e.message}`);
                    sheetSelect.disabled = true;
                    assignButton.disabled = true;
                    forceAssignButton.disabled = true;
                    logButtonStates();
                }
                logMessage(`[DEBUG] fetchSheetMetadata call finished`);
            }
            else {
                logMessage(`[DEBUG] Invalid or missing spreadsheetId, disabling controls.`);
                sheetSelect.innerHTML = "";
                sheetSelect.disabled = true;
                assignButton.disabled = true;
                forceAssignButton.disabled = true;
                logButtonStates();
            }
        };
        // DEBUG: Log event binding
        console.log("[DEBUG] assignSheetLink.oninput bound");
        assignButton.onclick = async () => {
            console.log("Assign clicked");
            const link = assignSheetLink.value;
            const spreadsheetId = extractSpreadsheetId(link);
            const sheetName = sheetSelect.value;
            logMessage(`[DEBUG] Assign clicked. spreadsheetId: ${spreadsheetId}, sheetName: ${sheetName}`);
            if (spreadsheetId && sheetName) {
                try {
                    logMessage(`[DEBUG] Fetching sheet data for assign. spreadsheetId: ${spreadsheetId}, sheetName: ${sheetName}`);
                    const data = await (0,_features_import_fetch__WEBPACK_IMPORTED_MODULE_1__.fetchSheetData)(spreadsheetId, sheetName, _config__WEBPACK_IMPORTED_MODULE_0__.config.GOOGLE_SHEETS_API_KEY);
                    logMessage(`[DEBUG] Sheet data: ${JSON.stringify(data.slice(0, 2))}...`);
                    parent.postMessage({ pluginMessage: { type: "assign", data, forceBindAll: false } }, "*");
                    logMessage(`Started assigning from sheet: ${sheetName}`);
                }
                catch (e) {
                    logMessage(`[DEBUG] Error fetching sheet data: ${e.message}`);
                    logMessage(`Error fetching sheet data: ${e.message}`);
                }
            }
        };
        forceAssignButton.onclick = async () => {
            console.log("Force Assign clicked");
            const link = assignSheetLink.value;
            const spreadsheetId = extractSpreadsheetId(link);
            const sheetName = sheetSelect.value;
            logMessage(`[DEBUG] Force Assign clicked. spreadsheetId: ${spreadsheetId}, sheetName: ${sheetName}`);
            if (spreadsheetId && sheetName) {
                try {
                    logMessage(`[DEBUG] Fetching sheet data for force assign. spreadsheetId: ${spreadsheetId}, sheetName: ${sheetName}`);
                    const data = await (0,_features_import_fetch__WEBPACK_IMPORTED_MODULE_1__.fetchSheetData)(spreadsheetId, sheetName, _config__WEBPACK_IMPORTED_MODULE_0__.config.GOOGLE_SHEETS_API_KEY);
                    logMessage(`[DEBUG] Sheet data: ${JSON.stringify(data.slice(0, 2))}...`);
                    parent.postMessage({ pluginMessage: { type: "assign", data, forceBindAll: true } }, "*");
                    logMessage(`Started force assigning from sheet: ${sheetName}`);
                }
                catch (e) {
                    logMessage(`[DEBUG] Error fetching sheet data: ${e.message}`);
                    logMessage(`Error fetching sheet data: ${e.message}`);
                }
            }
        };
    }
    else {
        console.log("[DEBUG] One or more assign UI elements not found in DOM");
    }
}
function extractSpreadsheetId(link) {
    const trimmed = link.trim();
    const match = trimmed.match(/[-\w]{25,}/);
    console.log(`[DEBUG] extractSpreadsheetId input: '${link}', trimmed: '${trimmed}', match:`, match);
    return match ? match[0] : "";
}
function logMessage(message) {
    const log = document.getElementById("log");
    if (log) {
        log.value += `${message}\n`;
        log.scrollTop = log.scrollHeight;
    }
}


/***/ }),

/***/ "./src/ui/components/exportUI.ts":
/*!***************************************!*\
  !*** ./src/ui/components/exportUI.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeExportUI: () => (/* binding */ initializeExportUI)
/* harmony export */ });
function initializeExportUI() {
    const exportFull = document.getElementById("export-full");
    const exportIds = document.getElementById("export-ids");
    const clearCollections = document.getElementById("clear-collections");
    const collectionSelect = document.getElementById("collection-select");
    // New elements for Google Sheets integration
    const exportDestinationRadios = document.querySelectorAll('input[name="export-destination"]');
    const sheetsConfig = document.getElementById("sheets-config");
    const sheetsUrl = document.getElementById("sheets-url");
    const apiKeyInput = document.getElementById("api-key-input");
    const toggleApiKey = document.getElementById("toggle-api-key");
    const authStatus = document.getElementById("auth-status");
    const exportProgress = document.getElementById("export-progress");
    const cancelExport = document.getElementById("cancel-export");
    // Authentication method elements
    const authMethodRadios = document.querySelectorAll('input[name="auth-method"]');
    const apiKeyConfig = document.getElementById("api-key-config");
    const serviceAccountConfig = document.getElementById("service-account-config");
    const serviceAccountFile = document.getElementById("service-account-file");
    const serviceAccountInfo = document.getElementById("service-account-info");
    const serviceEmail = document.getElementById("service-email");
    const serviceProject = document.getElementById("service-project");
    let isExporting = false;
    let currentExportController = null;
    let serviceAccountData = null;
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
                }
                else {
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
            var _a;
            const file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
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
                }
                else {
                    throw new Error('Invalid Service Account JSON structure');
                }
            }
            catch (error) {
                alert(`Invalid Service Account file: ${error}`);
                serviceAccountData = null;
                updateServiceAccountInfo(null);
                event.target.value = '';
            }
            updateAuthStatus();
            updateExportButtonStates();
        });
    }
    // Update Service Account info display
    function updateServiceAccountInfo(info) {
        if (!serviceAccountInfo || !serviceEmail || !serviceProject)
            return;
        if (info) {
            serviceEmail.textContent = info.email;
            serviceProject.textContent = info.project;
            serviceAccountInfo.style.display = 'block';
        }
        else {
            serviceAccountInfo.style.display = 'none';
        }
    }
    // Update authentication status
    function updateAuthStatus() {
        if (!authStatus)
            return;
        const authMethod = getSelectedAuthMethod();
        const sheetsUrlValid = sheetsUrl === null || sheetsUrl === void 0 ? void 0 : sheetsUrl.value.includes('docs.google.com/spreadsheets');
        if (!sheetsUrlValid) {
            authStatus.textContent = 'Invalid Sheets URL';
            authStatus.className = 'status-indicator invalid';
            return;
        }
        if (authMethod === 'api-key') {
            const apiKeyValid = (apiKeyInput === null || apiKeyInput === void 0 ? void 0 : apiKeyInput.value) && apiKeyInput.value.length > 10;
            if (apiKeyValid) {
                authStatus.textContent = 'API Key Ready (Read Only)';
                authStatus.className = 'status-indicator';
            }
            else {
                authStatus.textContent = 'Invalid API Key';
                authStatus.className = 'status-indicator invalid';
            }
        }
        else if (authMethod === 'service-account') {
            if (serviceAccountData) {
                authStatus.textContent = 'Service Account Ready (Full Access)';
                authStatus.className = 'status-indicator valid';
            }
            else {
                authStatus.textContent = 'No Service Account File';
                authStatus.className = 'status-indicator invalid';
            }
        }
    }
    // Get selected authentication method
    function getSelectedAuthMethod() {
        const selected = document.querySelector('input[name="auth-method"]:checked');
        return (selected === null || selected === void 0 ? void 0 : selected.value) || 'api-key';
    }
    // Validate sheets configuration based on auth method
    function validateSheetsConfig() {
        if (!sheetsUrl)
            return false;
        const urlValid = sheetsUrl.value.includes('docs.google.com/spreadsheets');
        const authMethod = getSelectedAuthMethod();
        if (!urlValid)
            return false;
        if (authMethod === 'api-key') {
            return !!((apiKeyInput === null || apiKeyInput === void 0 ? void 0 : apiKeyInput.value) && apiKeyInput.value.length > 10);
        }
        else if (authMethod === 'service-account') {
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
    function getSelectedDestination() {
        const selected = document.querySelector('input[name="export-destination"]:checked');
        return (selected === null || selected === void 0 ? void 0 : selected.value) || 'json';
    }
    // Show/hide progress
    function showProgress(show) {
        if (exportProgress) {
            exportProgress.style.display = show ? 'block' : 'none';
        }
        updateExportButtonStates();
    }
    // Update progress
    function updateProgress(progress, status, details) {
        const progressBar = document.getElementById('export-progress-bar');
        const progressStatus = document.getElementById('progress-status');
        const progressDetails = document.getElementById('progress-details');
        if (progressBar)
            progressBar.style.width = `${progress}%`;
        if (progressStatus)
            progressStatus.textContent = status;
        if (progressDetails && details)
            progressDetails.textContent = details;
    }
    // Handle export with progress
    function handleExport(type) {
        if (isExporting)
            return;
        const destination = getSelectedDestination();
        const collection = (collectionSelect === null || collectionSelect === void 0 ? void 0 : collectionSelect.value) === "All" ? undefined : collectionSelect === null || collectionSelect === void 0 ? void 0 : collectionSelect.value;
        if (destination === 'json') {
            // Traditional JSON export
            parent.postMessage({
                pluginMessage: {
                    type: type === 'full' ? "export-full" : "export-ids",
                    collection
                }
            }, "*");
        }
        else if (destination === 'sheets') {
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
            let exportConfig = {
                sheetsUrl: sheetsUrl === null || sheetsUrl === void 0 ? void 0 : sheetsUrl.value
            };
            if (authMethod === 'service-account' && serviceAccountData) {
                exportConfig.serviceAccount = serviceAccountData;
            }
            else if (authMethod === 'api-key' && (apiKeyInput === null || apiKeyInput === void 0 ? void 0 : apiKeyInput.value)) {
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
        if (!msg)
            return;
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


/***/ }),

/***/ "./src/ui/components/importUI.ts":
/*!***************************************!*\
  !*** ./src/ui/components/importUI.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getIsImporting: () => (/* binding */ getIsImporting),
/* harmony export */   initializeImportUI: () => (/* binding */ initializeImportUI),
/* harmony export */   setIsImporting: () => (/* binding */ setIsImporting),
/* harmony export */   showSheetList: () => (/* binding */ showSheetList)
/* harmony export */ });
let isImporting = false;
let availableSheets = [];
let excludeSheets = [];
function initializeImportUI() {
    const importButton = document.getElementById("import");
    const fetchSheetsButton = document.getElementById("fetch-sheets");
    const cancelButton = document.getElementById("cancel-import");
    const sheetLinkInput = document.getElementById("sheet-link");
    const sheetListContainer = document.getElementById("sheet-list-container");
    const sheetListDiv = document.getElementById("sheet-list");
    if (fetchSheetsButton && importButton && cancelButton && sheetLinkInput && sheetListContainer && sheetListDiv) {
        fetchSheetsButton.onclick = () => {
            const link = sheetLinkInput.value;
            if (!link) {
                alert("Please enter a Google Sheet URL first.");
                return;
            }
            parent.postMessage({ pluginMessage: { type: "fetch-sheet-list", link } }, "*");
            fetchSheetsButton.disabled = true;
            importButton.disabled = true;
        };
        importButton.onclick = () => {
            const link = sheetLinkInput.value;
            excludeSheets = Array.from(sheetListDiv.querySelectorAll("input[type=checkbox]:checked")).map((el) => el.value);
            parent.postMessage({ pluginMessage: { type: "import", link, excludeSheets } }, "*");
            isImporting = true;
            importButton.style.display = "none";
            cancelButton.style.display = "inline";
        };
        cancelButton.onclick = () => {
            parent.postMessage({ pluginMessage: { type: "cancel-import" } }, "*");
            isImporting = false;
            importButton.style.display = "inline";
            cancelButton.style.display = "none";
        };
    }
}
function showSheetList(sheets) {
    availableSheets = sheets;
    const sheetListContainer = document.getElementById("sheet-list-container");
    const sheetListDiv = document.getElementById("sheet-list");
    const importButton = document.getElementById("import");
    const fetchSheetsButton = document.getElementById("fetch-sheets");
    if (sheetListContainer && sheetListDiv && importButton && fetchSheetsButton) {
        sheetListDiv.innerHTML = "";
        sheets.forEach(sheet => {
            const id = `sheet-exclude-${sheet}`;
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = sheet;
            checkbox.id = id;
            const label = document.createElement("label");
            label.htmlFor = id;
            label.innerText = sheet;
            const div = document.createElement("div");
            div.appendChild(checkbox);
            div.appendChild(label);
            sheetListDiv.appendChild(div);
        });
        sheetListContainer.style.display = "block";
        importButton.disabled = false;
        fetchSheetsButton.disabled = false;
    }
}
function getIsImporting() {
    return isImporting;
}
function setIsImporting(value) {
    isImporting = value;
}


/***/ }),

/***/ "./src/ui/components/logProgressUI.ts":
/*!********************************************!*\
  !*** ./src/ui/components/logProgressUI.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeLogProgressUI: () => (/* binding */ initializeLogProgressUI),
/* harmony export */   logMessage: () => (/* binding */ logMessage),
/* harmony export */   setProgress: () => (/* binding */ setProgress)
/* harmony export */ });
function initializeLogProgressUI() {
    const toggleLog = document.getElementById("toggle-log");
    const exportLogButton = document.getElementById("export-log");
    if (toggleLog) {
        toggleLog.onclick = () => {
            console.log("Toggle Log clicked");
            const log = document.getElementById("log");
            if (log.style.display === "none") {
                log.style.display = "block";
                toggleLog.textContent = "Hide Log";
            }
            else {
                log.style.display = "none";
                toggleLog.textContent = "Show Log";
            }
        };
    }
    if (exportLogButton) {
        exportLogButton.onclick = () => {
            console.log("Export Log clicked");
            const logTextarea = document.getElementById("log");
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
function logMessage(message) {
    const log = document.getElementById("log");
    if (log) {
        log.value += `${new Date().toISOString()} - ${message}\n`;
        log.scrollTop = log.scrollHeight;
    }
}
function setProgress(message, stats) {
    const progressText = document.getElementById("progress-text");
    const progressBar = document.getElementById("progress-bar");
    if (progressText && progressBar) {
        if (stats) {
            progressText.innerText = `${message || "Processing"} - Processed ${stats.processed}/${stats.total}, Created: ${stats.created}, Updated: ${stats.updated}, Aliases: ${stats.aliases}`;
            const percent = Math.min((stats.processed / stats.total) * 100, 100).toFixed(1);
            progressBar.style.width = `${percent}%`;
        }
        else {
            progressText.innerText = message || "No progress message";
            progressBar.style.width = "0%";
        }
    }
}


/***/ }),

/***/ "./src/ui/components/nodeExportUI.ts":
/*!*******************************************!*\
  !*** ./src/ui/components/nodeExportUI.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeNodeExportUI: () => (/* binding */ initializeNodeExportUI)
/* harmony export */ });
let sortGroupIndex = 0;
function initializeNodeExportUI() {
    const exportButton = document.getElementById("export-selected-nodes");
    const modal = document.getElementById("node-config-modal");
    const applyButton = document.getElementById("apply-config");
    const cancelButton = document.getElementById("cancel-config");
    const addGroupButton = document.getElementById("add-sort-group");
    const rootPatternInput = document.getElementById("root-pattern");
    const sortGroupsContainer = document.getElementById("sort-groups-container");
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
    function addSortGroup(defaultPrefix = "", defaultRange) {
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
          <input type="number" class="range-row-start" placeholder="Start Row" value="${(defaultRange === null || defaultRange === void 0 ? void 0 : defaultRange.rows[0]) || 1}" />
          <input type="number" class="range-row-end" placeholder="End Row" value="${(defaultRange === null || defaultRange === void 0 ? void 0 : defaultRange.rows[1]) || 10}" />
          <input type="number" class="range-col-start" placeholder="Start Col" value="${(defaultRange === null || defaultRange === void 0 ? void 0 : defaultRange.cols[0]) || 1}" />
          <input type="number" class="range-col-end" placeholder="End Col" value="${(defaultRange === null || defaultRange === void 0 ? void 0 : defaultRange.cols[1]) || 4}" />
        </div>
      </div>
    `;
        if (sortGroupsContainer) {
            sortGroupsContainer.appendChild(groupDiv);
        }
        // Add event listeners for smart range handling
        const rangeCheckbox = groupDiv.querySelector(".range-checkbox");
        const rangeInputs = groupDiv.querySelector(".range-inputs");
        const prefixInput = groupDiv.querySelector(".prefix-input");
        const rangeLabel = rangeCheckbox === null || rangeCheckbox === void 0 ? void 0 : rangeCheckbox.parentElement;
        // Function to determine if pattern needs range
        const updateRangeVisibility = () => {
            const pattern = prefixInput.value.trim();
            const needsRange = isGridPattern(pattern);
            if (needsRange) {
                rangeLabel.style.display = 'block';
                rangeInputs.style.display = rangeCheckbox.checked ? "grid" : "none";
            }
            else {
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
    function collectConfig() {
        const rootPattern = (rootPatternInput === null || rootPatternInput === void 0 ? void 0 : rootPatternInput.value) || "Role-Body-\\d+|Block-\\d+";
        const sortGroups = [];
        const groupElements = (sortGroupsContainer === null || sortGroupsContainer === void 0 ? void 0 : sortGroupsContainer.querySelectorAll(".sort-group")) || [];
        groupElements.forEach((groupEl) => {
            const prefixInput = groupEl.querySelector(".prefix-input");
            const rangeCheckbox = groupEl.querySelector(".range-checkbox");
            const rowStartInput = groupEl.querySelector(".range-row-start");
            const rowEndInput = groupEl.querySelector(".range-row-end");
            const colStartInput = groupEl.querySelector(".range-col-start");
            const colEndInput = groupEl.querySelector(".range-col-end");
            const prefix = prefixInput.value.trim();
            if (!prefix)
                return;
            const group = { prefix };
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
        rootPatternInput === null || rootPatternInput === void 0 ? void 0 : rootPatternInput.addEventListener('input', validateRootPattern);
        // Listen for sort group changes
        sortGroupsContainer === null || sortGroupsContainer === void 0 ? void 0 : sortGroupsContainer.addEventListener('input', validateSortGroups);
    }
    function validateRootPattern() {
        if (!rootPatternInput)
            return;
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
        }
        catch (e) {
            showFeedback(feedback, 'Invalid regex pattern', 'error');
            return false;
        }
    }
    function validateSortGroups() {
        const groups = (sortGroupsContainer === null || sortGroupsContainer === void 0 ? void 0 : sortGroupsContainer.querySelectorAll('.sort-group')) || [];
        let hasValidGroups = false;
        groups.forEach((group, index) => {
            const prefixInput = group.querySelector('.prefix-input');
            const prefix = prefixInput === null || prefixInput === void 0 ? void 0 : prefixInput.value.trim();
            if (prefix) {
                hasValidGroups = true;
                try {
                    new RegExp(prefix);
                    prefixInput.style.borderColor = 'var(--accent-color)';
                }
                catch (e) {
                    prefixInput.style.borderColor = '#ff4444';
                }
            }
            else {
                prefixInput.style.borderColor = '#ff4444';
            }
        });
        updateApplyButtonState(hasValidGroups && validateRootPattern());
    }
    function updateApplyButtonState(isValid) {
        if (applyButton) {
            applyButton.disabled = !isValid;
            applyButton.style.opacity = isValid ? '1' : '0.5';
        }
    }
    function updateButtonState() {
        // Listen for selection changes from main plugin
        window.addEventListener('message', (event) => {
            const message = event.data.pluginMessage;
            if ((message === null || message === void 0 ? void 0 : message.type) === 'selection-changed') {
                const hasSelection = message.hasSelection;
                updateExportButtonState(hasSelection);
            }
        });
    }
    function updateExportButtonState(hasSelection) {
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
        const handleSelectionResponse = (event) => {
            const message = event.data.pluginMessage;
            if ((message === null || message === void 0 ? void 0 : message.type) === 'selection-status') {
                const count = message.selectionCount;
                if (count === 0) {
                    statusDiv.innerHTML = `
            <div style="color: #ff4444; padding: 10px; border: 1px solid #ff4444; border-radius: 4px; margin-bottom: 10px;">
              ⚠️ No nodes selected. Please select nodes in Figma before configuring export.
            </div>
          `;
                    if (applyButton)
                        applyButton.disabled = true;
                }
                else {
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
    function createFeedbackElement(id) {
        var _a;
        const feedback = document.createElement('div');
        feedback.id = id;
        feedback.className = 'validation-feedback';
        feedback.style.cssText = 'font-size: 12px; margin-top: 4px; padding: 4px;';
        if (rootPatternInput && id === 'root-pattern-feedback') {
            (_a = rootPatternInput.parentNode) === null || _a === void 0 ? void 0 : _a.appendChild(feedback);
        }
        return feedback;
    }
    function createSelectionStatusElement() {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'selection-status';
        statusDiv.style.cssText = 'margin-bottom: 15px;';
        const modalContent = modal === null || modal === void 0 ? void 0 : modal.querySelector('.modal-content');
        const firstConfigSection = modalContent === null || modalContent === void 0 ? void 0 : modalContent.querySelector('.config-section');
        if (modalContent && firstConfigSection) {
            modalContent.insertBefore(statusDiv, firstConfigSection);
        }
        return statusDiv;
    }
    function showFeedback(element, message, type) {
        element.textContent = message;
        element.style.color = type === 'success' ? 'var(--accent-color)' :
            type === 'error' ? '#ff4444' : '#ffaa00';
    }
    // Helper function to detect if pattern needs range
    function isGridPattern(pattern) {
        // Grid patterns typically contain row/col references
        const gridIndicators = [
            /Row_.*Col_/i, // Row_X_Col_Y patterns
            /\d+.*\d+/, // Multiple numeric placeholders
            /_\\d\+.*_\\d\+/, // Multiple regex digit patterns
            /Col.*Row/i, // Col_X_Row_Y patterns
            /Grid/i, // Explicit grid naming
            /Table.*Cell/i, // Table cell patterns
            /Cell_\\d/i // Cell patterns
        ];
        return gridIndicators.some(regex => regex.test(pattern));
    }
    // Make removeSortGroup available globally
    window.removeSortGroup = (groupId) => {
        const groupElement = document.getElementById(groupId);
        if (groupElement) {
            groupElement.remove();
            validateSortGroups(); // Re-validate after removal
        }
    };
}


/***/ }),

/***/ "./src/ui/components/sectionManager.ts":
/*!*********************************************!*\
  !*** ./src/ui/components/sectionManager.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeSectionManager: () => (/* binding */ initializeSectionManager)
/* harmony export */ });
function initializeSectionManager() {
    var _a;
    const tabHeaders = document.querySelectorAll(".tab-header");
    const tabPanes = document.querySelectorAll(".tab-pane");
    let activeTab = "export"; // Tab mặc định
    // Khởi tạo tab đầu tiên
    (_a = document.getElementById("export-tab")) === null || _a === void 0 ? void 0 : _a.classList.add("active");
    tabHeaders.forEach(header => {
        header.addEventListener("click", () => {
            const tab = header.getAttribute("data-tab");
            if (tab && tab !== activeTab) {
                switchTab(tab);
                activeTab = tab;
                // Cập nhật trạng thái active cho tab header
                tabHeaders.forEach(h => h.classList.remove("active"));
                header.classList.add("active");
                // Gửi message nếu cần (ví dụ: get-collections cho Export)
                if (tab === "export") {
                    parent.postMessage({ pluginMessage: { type: "get-collections" } }, "*");
                }
                // Check selection for nodes tab
                if (tab === "nodes") {
                    parent.postMessage({ pluginMessage: { type: "check-selection" } }, "*");
                }
            }
        });
    });
    function switchTab(tab) {
        tabPanes.forEach(pane => {
            if (pane.id === `${tab}-tab`) {
                pane.classList.add("active");
            }
            else {
                pane.classList.remove("active");
            }
        });
    }
}


/***/ }),

/***/ "./src/ui/components/sheetStylesUI.ts":
/*!********************************************!*\
  !*** ./src/ui/components/sheetStylesUI.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeSheetStylesUI: () => (/* binding */ initializeSheetStylesUI)
/* harmony export */ });
/* harmony import */ var _utils_log__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/log */ "./src/utils/log.ts");

function initializeSheetStylesUI() {
    (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)("Initializing Sheet Styles UI");
    const rowHeightInput = document.getElementById("row-height");
    const columnAWidthInput = document.getElementById("column-a-width");
    const columnBWidthInput = document.getElementById("column-b-width");
    const modeColumnWidthInput = document.getElementById("mode-column-width");
    const idColumnWidthInput = document.getElementById("id-column-width");
    const keyColumnWidthInput = document.getElementById("key-column-width");
    const evenRowColorInput = document.getElementById("even-row-color");
    const oddRowColorInput = document.getElementById("odd-row-color");
    const ellipseCheckbox = document.getElementById("ellipse");
    const saveStylesButton = document.getElementById("save-styles");
    const resetStylesButton = document.getElementById("reset-styles");
    // Tải config hiện tại
    loadCurrentConfig();
    // Xử lý sự kiện lưu cấu hình
    if (saveStylesButton) {
        saveStylesButton.addEventListener("click", saveStylesConfig);
    }
    // Xử lý sự kiện reset về mặc định
    if (resetStylesButton) {
        resetStylesButton.addEventListener("click", resetToDefault);
    }
    // Xử lý thay đổi realtime
    const inputs = [
        rowHeightInput,
        columnAWidthInput,
        columnBWidthInput,
        modeColumnWidthInput,
        idColumnWidthInput,
        keyColumnWidthInput,
        evenRowColorInput,
        oddRowColorInput,
        ellipseCheckbox
    ];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener("change", updatePreview);
        }
    });
    async function loadCurrentConfig() {
        try {
            // Gửi message để lấy config hiện tại từ sheet_styles.json
            parent.postMessage({
                pluginMessage: {
                    type: "get-sheet-styles-config"
                }
            }, "*");
        }
        catch (error) {
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Error loading config: ${error}`);
        }
    }
    function saveStylesConfig() {
        try {
            const config = {
                row_height: parseInt((rowHeightInput === null || rowHeightInput === void 0 ? void 0 : rowHeightInput.value) || "30"),
                column_a_width: parseInt((columnAWidthInput === null || columnAWidthInput === void 0 ? void 0 : columnAWidthInput.value) || "150"),
                column_b_width: parseInt((columnBWidthInput === null || columnBWidthInput === void 0 ? void 0 : columnBWidthInput.value) || "100"),
                mode_column_width: parseInt((modeColumnWidthInput === null || modeColumnWidthInput === void 0 ? void 0 : modeColumnWidthInput.value) || "200"),
                id_column_width: parseInt((idColumnWidthInput === null || idColumnWidthInput === void 0 ? void 0 : idColumnWidthInput.value) || "200"),
                key_column_width: parseInt((keyColumnWidthInput === null || keyColumnWidthInput === void 0 ? void 0 : keyColumnWidthInput.value) || "200"),
                even_row_color: hexToRgb((evenRowColorInput === null || evenRowColorInput === void 0 ? void 0 : evenRowColorInput.value) || "#f0f0f0"),
                odd_row_color: hexToRgb((oddRowColorInput === null || oddRowColorInput === void 0 ? void 0 : oddRowColorInput.value) || "#ffffff"),
                ellipse: (ellipseCheckbox === null || ellipseCheckbox === void 0 ? void 0 : ellipseCheckbox.checked) || true
            };
            // Gửi config mới đến backend
            parent.postMessage({
                pluginMessage: {
                    type: "save-sheet-styles-config",
                    sheetStylesConfig: config
                }
            }, "*");
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)("Sheet styles configuration saved successfully");
        }
        catch (error) {
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)(`Error saving config: ${error}`);
        }
    }
    function resetToDefault() {
        const defaultConfig = {
            row_height: 30,
            column_a_width: 150,
            column_b_width: 100,
            mode_column_width: 200,
            id_column_width: 200,
            key_column_width: 200,
            even_row_color: [240, 240, 240],
            odd_row_color: [255, 255, 255],
            ellipse: true
        };
        populateFields(defaultConfig);
        updatePreview();
    }
    function updatePreview() {
        // Cập nhật preview nếu cần
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)("Preview updated");
    }
    function populateFields(config) {
        if (rowHeightInput)
            rowHeightInput.value = config.row_height.toString();
        if (columnAWidthInput)
            columnAWidthInput.value = config.column_a_width.toString();
        if (columnBWidthInput)
            columnBWidthInput.value = config.column_b_width.toString();
        if (modeColumnWidthInput)
            modeColumnWidthInput.value = config.mode_column_width.toString();
        if (idColumnWidthInput)
            idColumnWidthInput.value = config.id_column_width.toString();
        if (keyColumnWidthInput)
            keyColumnWidthInput.value = config.key_column_width.toString();
        if (evenRowColorInput)
            evenRowColorInput.value = rgbToHex(config.even_row_color);
        if (oddRowColorInput)
            oddRowColorInput.value = rgbToHex(config.odd_row_color);
        if (ellipseCheckbox)
            ellipseCheckbox.checked = config.ellipse;
    }
    // Xử lý Clear Log button
    const clearLogButton = document.getElementById("clear-log");
    if (clearLogButton) {
        clearLogButton.addEventListener("click", () => {
            const logTextarea = document.getElementById("log");
            if (logTextarea) {
                logTextarea.value = "";
                (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)("Log cleared");
            }
        });
    }
    // Xử lý message từ backend
    window.addEventListener("message", (event) => {
        const { type, config } = event.data.pluginMessage || {};
        if (type === "sheet-styles-config-loaded") {
            populateFields(config.variables);
        }
        else if (type === "sheet-styles-config-saved") {
            (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.logToUI)("Configuration saved successfully");
            // Hiển thị thông báo thành công
            showSuccessMessage("Sheet styles configuration saved!");
        }
    });
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [255, 255, 255];
    }
    function rgbToHex(rgb) {
        return "#" + rgb.map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("");
    }
    function showSuccessMessage(message) {
        // Tạo và hiển thị thông báo thành công
        const notification = document.createElement("div");
        notification.className = "success-notification";
        notification.textContent = message;
        notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #4CAF50;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}


/***/ }),

/***/ "./src/ui/messageHandler.ts":
/*!**********************************!*\
  !*** ./src/ui/messageHandler.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   handleMessages: () => (/* binding */ handleMessages)
/* harmony export */ });
/* harmony import */ var _components_logProgressUI__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./components/logProgressUI */ "./src/ui/components/logProgressUI.ts");
/* harmony import */ var _components_importUI__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./components/importUI */ "./src/ui/components/importUI.ts");


function handleMessages(event) {
    var _a, _b;
    const msg = event.data.pluginMessage;
    if (!msg || !msg.type) {
        (0,_components_logProgressUI__WEBPACK_IMPORTED_MODULE_0__.logMessage)("Error: Invalid message received from plugin");
        return;
    }
    if (msg.type === "sheet-list") {
        // Show sheet list for exclude selection
        if (msg.sheets)
            (0,_components_importUI__WEBPACK_IMPORTED_MODULE_1__.showSheetList)(msg.sheets);
        return;
    }
    if (msg.type === "progress" && !(0,_components_importUI__WEBPACK_IMPORTED_MODULE_1__.getIsImporting)()) {
        (0,_components_logProgressUI__WEBPACK_IMPORTED_MODULE_0__.setProgress)("Import cancelled", msg.stats);
    }
    else if (msg.type === "log" && ((_a = msg.message) === null || _a === void 0 ? void 0 : _a.includes("Import completed"))) {
        (0,_components_importUI__WEBPACK_IMPORTED_MODULE_1__.setIsImporting)(false);
        const importButton = document.getElementById("import");
        const cancelButton = document.getElementById("cancel-import");
        if (importButton && cancelButton) {
            importButton.style.display = "inline";
            cancelButton.style.display = "none";
        }
    }
    if (msg.type === "exported") {
        const blob = new Blob([JSON.stringify(msg.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = msg.fileName;
        a.click();
        URL.revokeObjectURL(url);
    }
    else if (msg.type === "log") {
        (0,_components_logProgressUI__WEBPACK_IMPORTED_MODULE_0__.logMessage)(msg.message);
    }
    else if (msg.type === "progress") {
        (0,_components_logProgressUI__WEBPACK_IMPORTED_MODULE_0__.setProgress)(msg.message, msg.stats);
    }
    else if (msg.type === "collections") {
        const collectionSelect = document.getElementById("collection-select");
        collectionSelect.innerHTML = '<option value="All">All Collections</option>';
        (_b = msg.collections) === null || _b === void 0 ? void 0 : _b.forEach((collection) => {
            const option = document.createElement("option");
            option.value = collection;
            option.text = collection;
            collectionSelect.appendChild(option);
        });
    }
}


/***/ }),

/***/ "./src/ui/styles/main.css":
/*!********************************!*\
  !*** ./src/ui/styles/main.css ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_main_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../../node_modules/css-loader/dist/cjs.js!./main.css */ "./node_modules/css-loader/dist/cjs.js!./src/ui/styles/main.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_main_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_main_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_main_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_main_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


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
/******/ 			id: moduleId,
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
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
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
/******/ 	/* webpack/runtime/nonce */
/******/ 	(() => {
/******/ 		__webpack_require__.nc = undefined;
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/ui/ui.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _styles_main_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./styles/main.css */ "./src/ui/styles/main.css");
/* harmony import */ var _components_sectionManager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./components/sectionManager */ "./src/ui/components/sectionManager.ts");
/* harmony import */ var _components_exportUI__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./components/exportUI */ "./src/ui/components/exportUI.ts");
/* harmony import */ var _components_importUI__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./components/importUI */ "./src/ui/components/importUI.ts");
/* harmony import */ var _components_assignUI__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./components/assignUI */ "./src/ui/components/assignUI.ts");
/* harmony import */ var _components_nodeExportUI__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./components/nodeExportUI */ "./src/ui/components/nodeExportUI.ts");
/* harmony import */ var _components_logProgressUI__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./components/logProgressUI */ "./src/ui/components/logProgressUI.ts");
/* harmony import */ var _components_sheetStylesUI__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./components/sheetStylesUI */ "./src/ui/components/sheetStylesUI.ts");
/* harmony import */ var _messageHandler__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./messageHandler */ "./src/ui/messageHandler.ts");
console.log("ui.ts loaded immediately");









function initializeUI() {
    console.log("initializeUI called");
    (0,_components_sectionManager__WEBPACK_IMPORTED_MODULE_1__.initializeSectionManager)();
    (0,_components_exportUI__WEBPACK_IMPORTED_MODULE_2__.initializeExportUI)();
    (0,_components_importUI__WEBPACK_IMPORTED_MODULE_3__.initializeImportUI)();
    (0,_components_assignUI__WEBPACK_IMPORTED_MODULE_4__.initializeAssignUI)();
    (0,_components_nodeExportUI__WEBPACK_IMPORTED_MODULE_5__.initializeNodeExportUI)();
    (0,_components_logProgressUI__WEBPACK_IMPORTED_MODULE_6__.initializeLogProgressUI)();
    (0,_components_sheetStylesUI__WEBPACK_IMPORTED_MODULE_7__.initializeSheetStylesUI)();
}
window.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded fired");
    initializeUI();
});
window.onmessage = _messageHandler__WEBPACK_IMPORTED_MODULE_8__.handleMessages;

})();

/******/ })()
;