// Define variables
let words = new Set(); // Use a Set to prevent duplicates
let isHighlightActive = false;
let isHideActive = false;
let isBlurActive = false;

// Store observers for each word
let highlightObservers = new Map();
let hideObservers = new Map();
let blurObservers = new Map();

// Find target word from input textbox
async function findWord(word, action, reset = false) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const currentTab = tabs[0]; // The current active tab
      console.log("Current Tab:", currentTab);

      // Log the URL of the current tab
      console.log("Current Tab ID:", currentTab.id);
      console.log("Textbox Text:", word);
      console.log("Action:", action);

      // Pass word and action to observeNewContent
      if (reset === true) {
        resetContent(currentTab.id, word, action);
      } else {
        observeNewContent(currentTab.id, word, action);
      }
    } else {
      console.error("No active tab found.");
    }
  });
}

// REVERT ALL CHANGES
function resetContent(currentTabId, word, action) {
  chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: (text, actionType) => {
      const regex = new RegExp(`${text}`, "i"); // Case-insensitive search, no word boundary

      function resetChanges(element) {
        element.style.visibility = ""; // Reset visibility
        element.style.display = ""; // Reset display if it was changed
        element.style.border = ""; // Reset border if it was changed
        element.style.filter = "";
        element.removeAttribute("filterit-tag"); // Remove the custom tag

        console.log("Reset element:", element);
      }

      function undoClose(selectedElement) {
        const maxDistance = 60; // Adjustable
        const selectedRect = selectedElement.getBoundingClientRect();

        // Select all relevant elements (divs, spans, links, articles, etc.)
        const elements = Array.from(document.querySelectorAll("[filterit-tag]"));

        elements.forEach(element => {
          if (element === selectedElement) return; // Skip the selected div itself

          const rect = element.getBoundingClientRect();
          const distance = Math.sqrt(
            Math.pow(rect.left - selectedRect.left, 2) +
            Math.pow(rect.top - selectedRect.top, 2)
          );

          if (distance <= maxDistance) {
            resetChanges(element);
          } // Only include divs within maxDistance
        })
      }

      function undoFilter (action) {
        let elements = null;
        switch (action) {
          case "highlight":
            elements = Array.from(document.querySelectorAll("[filterit-tag]"));
            elements.forEach(element => {
              if (!element.querySelector("div") && regex.test(element.textContent)) {
                resetChanges(element);
                undoClose(element);
              }
            });
            break;
  
          case "hide":
            elements = Array.from(document.querySelectorAll("*")).filter(el =>
              getComputedStyle(el).visibility === "hidden"
            );
            console.log("all hidden elements:", elements);
            elements.forEach(element => {
              if (!element.querySelector("div") && regex.test(element.textContent)) {
                resetChanges(element);
                undoClose(element);
              }
            });
            break;
  
          case "blur":
            elements = Array.from(document.querySelectorAll("*")).filter(el =>
              getComputedStyle(el).filter === "blur(5px)"
            );
            elements.forEach(element => {
              if (!element.querySelector("div") && regex.test(element.textContent)) {
                resetChanges(element);
                undoClose(element);
              }
            });
            break;
  
          default:
            break;
        }
      }

      switch (actionType) {
        case "highlight":
          undoFilter("highlight");
          break;

        case "hide":
          undoFilter("hide");
          break;

        case "blur":
          undoFilter("blur");
          break;

        default:
          break;
      }
    },
    args: [word, action],
  });
}

// OBSERVE AND CHANGE SELECTED CONTENT
function observeNewContent(currentTabId, word, action) {
  chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: (text, actionType) => {
      const regex = new RegExp(`${text}`, "i"); // Case-insensitive search, no word boundary


      function filterCloseElements(selectedElement, action) {
        const maxDistance = 60; // Adjustable
        const selectedRect = selectedElement.getBoundingClientRect();

        // Select all relevant elements (divs, spans, links, articles, etc.)
        const elements = Array.from(document.querySelectorAll("div, span, a, article, img, p, svg"));

        // Filter elements that are close to the selected div
        elements.forEach(element => {
          if (element === selectedDiv) return; // Skip the selected div itself

          const rect = element.getBoundingClientRect();
          const distance = Math.sqrt(
            Math.pow(rect.left - selectedRect.left, 2) +
            Math.pow(rect.top - selectedRect.top, 2)
          );

          if (distance <= maxDistance) {
            switch(action) {
              case "blur":
                element.style.filter = "blur(5px)";
                element.setAttribute("filterIt-tag", "true");
                console.log("blurred nearby elements: ", element);
                break;

              case "hide":
                element.style.visibility = "hidden";
                element.setAttribute("filterIt-tag", "true");
                console.log("hid nearby elements: ", element);
                break;

              case "highlight":
                element.style.border = '2px dashed green'; // Highlighting
                element.setAttribute("filterIt-tag", "true");
                console.log("highlighted nearby element: ", element);
                break;

              default:
                break;
            }
            
          } // Only include divs within maxDistance
        });
      }

      // Highlight function
      function highlightText() {
        const elements = Array.from(document.querySelectorAll("div, span, a, article, img, p"));
        elements.forEach(element => {
          if (!element.querySelector("div") && regex.test(element.textContent)) {
            element.style.border = '2px solid red'; // Simple highlight
            element.setAttribute("filterIt-tag", "true");
            console.log("highlighted new div: ", element);
            filterCloseElements(element, "highlight");
            console.log("highlighted nearby elements");
          }
        });
      }

      // Hide function
      function hideDivs() {
        const elements = Array.from(document.querySelectorAll("div, span, a, article, img, p"));
        elements.forEach(element => {
          if (!element.querySelector("div") && regex.test(element.textContent)) {
            element.style.visibility = "hidden";
            console.log("hid new div: ", element);
            filterCloseElements(element, "hide");
            console.log("hid nearby elements");
          }
        });
      }

      function blurDivs() {
        const elements = Array.from(document.querySelectorAll("div, span, a, article, img, p"));
        elements.forEach(element => {
          if (!element.querySelector("div") && regex.test(element.textContent)) {
            element.style.filter = "blur(5px)";
            console.log("blurred new div: ", element);
            filterCloseElements(element, "blur");
            console.log("blurred nearby elements");
          }
        });
      }

      switch (actionType) {
        case "highlight":
          // Create a new observer for the word if it doesn't exist
          if (!highlightObservers.has(text)) {
            const observer = new MutationObserver(highlightText);
            highlightObservers.set(text, observer);
          }
          // Activate the observer if the toggle is on
          if (isHighlightActive) {
            highlightObservers.get(text).observe(document.body, { childList: true, subtree: true });
            highlightText(); // Initially highlight any matching text
          }
          break;

        case "hide":
          // Create a new observer for the word if it doesn't exist
          if (!hideObservers.has(text)) {
            const observer = new MutationObserver(hideDivs);
            hideObservers.set(text, observer);
          }
          // Activate the observer if the toggle is on
          if (isHideActive) {
            hideObservers.get(text).observe(document.body, { childList: true, subtree: true });
            hideDivs(); // Initially hide any matching text
          }
          break;

        case "blur":
          // Create a new observer for the word if it doesn't exist
          if (!blurObservers.has(text)) {
            const observer = new MutationObserver(blurDivs);
            blurObservers.set(text, observer);
          }
          // Activate the observer if the toggle is on
          if (isBlurActive) {
            blurObservers.get(text).observe(document.body, { childList: true, subtree: true });
            blurDivs(); // Initially blur any matching text
          }
          break;

        default:
          break;
      }
    },
    args: [word, action],
  });
}

// Main code for event handling
document.addEventListener("DOMContentLoaded", () => {
  const highlightToggle = document.getElementById("highlight-toggle");
  const hideToggle = document.getElementById("hide-toggle");
  const blurToggle = document.getElementById("blur-toggle");
  const textBox = document.getElementById("keyword");
  const addButton = document.getElementById("add");
  const toggleListLink = document.getElementById("toggle-list");
  const wordListContainer = document.getElementById("word-list-container");
  const wordList = document.getElementById("word-list");

  // Function to save words and toggle states
  function saveSettings() {
    chrome.storage.local.set({
      words: Array.from(words),
      highlightEnabled: isHighlightActive,
      hideEnabled: isHideActive,
      blurEnabled: isBlurActive,
    });
  }

  // Function to load saved words and toggle states
  function loadSettings() {
    chrome.storage.local.get(["words", "highlightEnabled", "hideEnabled", "blurEnabled"], (data) => {
      if (data.words) {
        words = new Set(data.words);
        updateWordListUI();
      }

      if (typeof data.highlightEnabled === "boolean" && words.size > 0) {
        isHighlightActive = data.highlightEnabled;
        highlightToggle.checked = isHighlightActive;
      }
      if (typeof data.hideEnabled === "boolean" && words.size > 0) {
        isHideActive = data.hideEnabled;
        hideToggle.checked = isHideActive;
      }
      if (typeof data.blurEnabled === "boolean" && words.size > 0) {
        isBlurActive = data.blurEnabled;
        blurToggle.checked = isBlurActive;
      }

      // Apply highlighting/hiding immediately if toggled on
      if (isHighlightActive) applyHighlight();
      if (isHideActive) applyHide();
      if (isBlurActive) applyBlur();
    });
  }

  function updateWordListUI() {
    wordList.innerHTML = ""; // Clear list before repopulating
    words.forEach(word => {
      const listElement = document.createElement("li");
      listElement.textContent = word;

      // Add a delete button for each word
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "X";
      deleteButton.style.marginLeft = "10px";
      deleteButton.addEventListener("click", () => {
        removeWord(word);
        words.delete(word);
        listElement.remove();
        saveSettings(); // Save changes
      });

      listElement.appendChild(deleteButton);
      wordList.appendChild(listElement);
    });
  }

  function removeWord(word) {
    // Remove the word from the list and disconnect its observers
    findWord(word, "highlight", true);
    findWord(word, "hide", true);
    findWord(word, "blur", true);

    // Disconnect and remove observers for the word
    if (highlightObservers.has(word)) {
      highlightObservers.get(word).disconnect();
      highlightObservers.delete(word);
    }
    if (hideObservers.has(word)) {
      hideObservers.get(word).disconnect();
      hideObservers.delete(word);
    }
    if (blurObservers.has(word)) {
      blurObservers.get(word).disconnect();
      blurObservers.delete(word);
    }
  }

  // Function to update highlighting/hiding when toggles change
  function applyHighlight() {
    if (isHighlightActive) {
      words.forEach(word => {
        findWord(word, "highlight");
      });
    } else {
      words.forEach(word => {
        findWord(word, "highlight", true);
      });
    }
  }

  function applyHide() {
    if (isHideActive) {
      words.forEach(word => {
        findWord(word, "hide");
      });
    } else {
      words.forEach(word => {
        findWord(word, "hide", true);
      });
    }
  }

  function applyBlur() {
    if (isBlurActive) {
      words.forEach(word => {
        findWord(word, "blur");
      });
    } else {
      words.forEach(word => {
        findWord(word, "blur", true);
      });
    }
  }

  // Function to toggle highlighting
  highlightToggle.addEventListener("change", () => {
    isHighlightActive = highlightToggle.checked;
    saveSettings(); // Save state
    if (isHighlightActive) {
      applyHighlight();
      console.log("switch checked: ", isHighlightActive);
    } else {
      words.forEach(word => findWord(word, "highlight", true));
      console.log("unchecked switch");
    }
  });

  // Function to toggle hiding
  hideToggle.addEventListener("change", () => {
    isHideActive = hideToggle.checked;
    saveSettings(); // Save state
    console.log("switch checked: ", isHideActive);
    if (isHideActive) {
      applyHide();
    } else {
      words.forEach(word => findWord(word, "hide", true));
      console.log("unchecked switch");
    }
  });

  // Function to toggle highlighting
  blurToggle.addEventListener("change", () => {
    isBlurActive = blurToggle.checked;
    saveSettings(); // Save state
    console.log("switch checked: ", isBlurActive);
    if (isBlurActive){
        applyBlur();
    } else {
        words.forEach(word => findWord(word, "blur", true));
        console.log("unchecked switch");
    }
    
  });


  // Function to add words to the list
  addButton.addEventListener("click", () => {
      try {
          const text = textBox.value.trim(); // Remove extra spaces
          if (!text) throw new Error("Textbox is empty! Please enter a word.");
      
          if (!words.has(text)) {
              words.add(text);
              updateWordListUI();
              saveSettings(); // Save words
      
          // Apply highlight or hide immediately if toggled on
          if (isHighlightActive) findWord(text, "highlight");
          if (isHideActive) findWord(text, "hide");
          if (isBlurActive) findWord(text, "blur");
          }
      
          textBox.value = ""; // Clear input after adding
      } catch (error) {
          console.error(error.message);
          alert(error.message); // Optional alert for users
      }
  });

  // Function to toggle word list visibility
  toggleListLink.addEventListener("click", (event) => {
      event.preventDefault(); // prevent from navigating
      if (wordListContainer.style.display === "none") {
      wordListContainer.style.display = "block";
      toggleListLink.textContent = "Hide Word List";
      } else {
      wordListContainer.style.display = "none";
      toggleListLink.textContent = "Show Word List";
      }
  });

  loadSettings()

});