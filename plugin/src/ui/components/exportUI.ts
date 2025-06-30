export function initializeExportUI() {
  const exportFull = document.getElementById("export-full") as HTMLButtonElement | null;
  const exportIds = document.getElementById("export-ids") as HTMLButtonElement | null;
  const clearCollections = document.getElementById("clear-collections") as HTMLButtonElement | null;
  const collectionSelect = document.getElementById("collection-select") as HTMLSelectElement | null;

  if (exportFull && collectionSelect) {
    exportFull.onclick = () => {
      console.log("Export Full clicked");
      const collection = collectionSelect.value === "All" ? undefined : collectionSelect.value;
      parent.postMessage({ pluginMessage: { type: "export-full", collection } }, "*");
    };
  }

  if (exportIds && collectionSelect) {
    exportIds.onclick = () => {
      console.log("Export IDs clicked");
      const collection = collectionSelect.value === "All" ? undefined : collectionSelect.value;
      parent.postMessage({ pluginMessage: { type: "export-ids", collection } }, "*");
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
}