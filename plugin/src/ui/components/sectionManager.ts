export function initializeSectionManager() {
  const tabHeaders = document.querySelectorAll(".tab-header") as NodeListOf<HTMLButtonElement>;
  const tabPanes = document.querySelectorAll(".tab-pane") as NodeListOf<HTMLElement>;
  let activeTab = "export"; // Tab mặc định

  // Khởi tạo tab đầu tiên
  document.getElementById("export-tab")?.classList.add("active");

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

  function switchTab(tab: string) {
    tabPanes.forEach(pane => {
      if (pane.id === `${tab}-tab`) {
        pane.classList.add("active");
      } else {
        pane.classList.remove("active");
      }
    });
  }
}