// content.js
const hideObservers = new Map();
const blurObservers = new Map();

function resetWord(word, action) {
  const regex = new RegExp(`${word}`, "i");

  const resetChanges = (el) => {
    el.style.visibility = "";
    el.style.display = "";
    el.style.border = "";
    el.style.filter = "";
    el.removeAttribute("filterit-tag");
  };

  const elements = Array.from(document.querySelectorAll("[filterit-tag]"));
  elements.forEach(el => {
    if (regex.test(el.textContent)) {
      resetChanges(el);
    }
  });

  const observerMap = action === "hide" ? hideObservers : blurObservers;
  if (observerMap.has(word)) {
    observerMap.get(word).disconnect();
    observerMap.delete(word);
  }
}

function filterWord(word, action) {
  const regex = new RegExp(`${word}`, "i");

  const applyFilter = (el) => {
    if (!el.querySelector("div") && regex.test(el.textContent)) {
      el.setAttribute("filterit-tag", "true");
      if (action === "hide") {
        el.style.visibility = "hidden";
      } else if (action === "blur") {
        el.style.filter = "blur(5px)";
      }
    }
  };

  const elements = Array.from(document.querySelectorAll("div, span, a, article, img, p"));
  elements.forEach(applyFilter);

  const observer = new MutationObserver(() => {
    const newElements = Array.from(document.querySelectorAll("div, span, a, article, img, p"));
    newElements.forEach(applyFilter);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  const observerMap = action === "hide" ? hideObservers : blurObservers;
  observerMap.set(word, observer);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FILTER_WORD") {
    filterWord(message.word, message.action);
  } else if (message.type === "RESET_WORD") {
    resetWord(message.word, message.action);
  }
});
