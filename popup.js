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
function findWord(word, action, reset=false) {
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
        element.style.visibility = "";  // Reset visibility
        element.style.display = "";  // Reset display if it was changed
        element.style.border = "";  // Reset border if it was changed
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
            highlightObservers.get(text).disconnect();
            elements = Array.from(document.querySelectorAll("[filterit-tag]"));
            elements.forEach(element => {
              if (!element.querySelector("div") && regex.test(element.textContent)) {
                resetChanges(element);
                undoClose(element);
              }
            });
            break;
  
          case "hide":
            hideObservers.get(text).disconnect();
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
            blurObservers.get(text).disconnect();
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
  })
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
        const matches = elements.filter(div => regex.test(div.textContent)); // filter elements

        // Filter elements that are close to the selected div
        matches.forEach(element => {
          if (element === selectedElement) return; // Skip the selected div itself

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

      function filterContent(action) {
        let elements = null;
        switch (action) {
          case "highlight":
            elements = Array.from(document.querySelectorAll("div, span, a, article, img, p"));
            elements.forEach(element => {
              if ( !element.querySelector("div") && regex.test(element.textContent) ) {
                element.style.border = '2px solid red'; // Simple highlight
                element.setAttribute("filterIt-tag", "true");
                console.log("highlighted new div: ", element);
                filterCloseElements(element, "highlight");
                console.log("highlighted nearby elements");

              }
            });
            break;
  
          case "hide":
            elements = Array.from(document.querySelectorAll("div, span, a, article, img, p"));
            elements.forEach(element => {
              if ( !element.querySelector("div") && regex.test(element.textContent) ) {
                element.style.visibility = "hidden";
                console.log("hid new div: ", element);
                filterCloseElements(element, "hide");
                console.log("hid nearby elemnts");
              }
            });
            break;
  
          case "blur":
            elements = Array.from(document.querySelectorAll("div, span, a, article, img, p"));
            elements.forEach(element => {
              if ( !element.querySelector("div") && regex.test(element.textContent) ) {
                element.style.filter = "blur(5px)";
                console.log("blurred new div: ", element);
                filterCloseElements(element, "blur");
                console.log("blurred nearby elemnts");
                
              }
            });
            break;
  
          default:
            break;
        }

      }

      switch (actionType) {
        case "highlight":
          // Set up MutationObserver to monitor for changes in the DOM
          if (!highlightObservers.has(text)) {
            const observer = new MutationObserver(() => filterContent("highlight"));
            highlightObservers.set(text, observer);
          }
          // Activate the observer if the toggle is on
          chrome.storage.local.get(["highlightEnabled"], (data) => {
            if (data.highlightEnabled) {
              console.log("HIGHLIGHT IS ACTIVE");
              highlightObservers.get(text).observe(document.body, { childList: true, subtree: true });
              filterContent("highlight"); // Initially hide any matching text
            }
          });
          break;

        case "hide":
          if (!hideObservers.has(text)) {
            const observer = new MutationObserver(() => filterContent("hide"));
            hideObservers.set(text, observer);
          }
          // Activate the observer if the toggle is on
          chrome.storage.local.get(["hideEnabled"], (data) => {
            if (data.hideEnabled) {
              console.log("HIDE IS ACTIVE");
              hideObservers.get(text).observe(document.body, { childList: true, subtree: true });
              filterContent("hide"); // Initially hide any matching text
            }
          });
          
          break;

        case "blur":
          // Set up MutationObserver to monitor for changes in the DOM
          if (!blurObservers.has(text)) {
            const observer = new MutationObserver(() => filterContent("blur"));
            blurObservers.set(text, observer);
          }
          // Activate the observer if the toggle is on
          chrome.storage.local.get(["blurEnabled"], (data) => {
            if (data.blurEnabled) {
              console.log("BLUR IS ACTIVE");
              blurObservers.get(text).observe(document.body, { childList: true, subtree: true });
              filterContent("blur"); // Initially hide any matching text
            }
          });
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
          blurEnabled: isBlurActive
      });
  }

  // Function to load saved words and toggle states
  function loadSettings() {
      chrome.storage.local.get(["words", "highlightEnabled", "hideEnabled", "blurEnabled"], (data) => {
          if (data.words) {
              words = new Set(data.words);
              updateWordListUI();
          }
          
          // Reset all toggle states first
          isHighlightActive = false;
          isHideActive = false;
          isBlurActive = false;
          
          // Only set one toggle as active based on saved settings
          if (data.highlightEnabled && words.size > 0) {
              isHighlightActive = true;
              setActiveToggle("highlight");
          } else if (data.hideEnabled && words.size > 0) {
              isHideActive = true;
              setActiveToggle("hide");
          } else if (data.blurEnabled && words.size > 0) {
              isBlurActive = true;
              setActiveToggle("blur");
          } else {
              // Update UI to reflect no active toggles
              highlightToggle.checked = false;
              hideToggle.checked = false;
              blurToggle.checked = false;
          }
      
          // Apply active effect if any
          if (isHighlightActive) applyHighlight();
          if (isHideActive) applyHide();
          if (isBlurActive) applyBlur();
      });
  }

  // Function to set the active toggle and turn off all others
  function setActiveToggle(activeName) {
      // First, clear all effects
      clearAllEffects();
      
      // Reset all toggle states and UI
      isHighlightActive = false;
      isHideActive = false;
      isBlurActive = false;
      highlightToggle.checked = false;
      hideToggle.checked = false;
      blurToggle.checked = false;
      
      // Set the specified toggle as active
      switch (activeName) {
          case "highlight":
              isHighlightActive = true;
              highlightToggle.checked = true;
              applyHighlight();
              break;
          case "hide":
              isHideActive = true;
              hideToggle.checked = true;
              applyHide();
              break;
          case "blur":
              isBlurActive = true;
              blurToggle.checked = true;
              applyBlur();
              break;
          case "none":
              // All toggles remain off
              break;
          default:
              console.error("Unknown toggle name:", activeName);
      }
      
      // Save the new settings
      saveSettings();
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
      // remove 1 word from the list
      findWord(word, "highlight", true);
      findWord(word, "hide", true);
      findWord(word, "blur", true);
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

  // Function to clear all effects
  function clearAllEffects() {
      words.forEach(word => {
          findWord(word, "highlight", true);
          findWord(word, "hide", true);
          findWord(word, "blur", true);
      });
  }

  // Function to toggle highlighting
  highlightToggle.addEventListener("change", () => {
      if (highlightToggle.checked) {
          setActiveToggle("highlight");
      } else {
          setActiveToggle("none");
      }
      console.log("Highlight active:", isHighlightActive);
  });

  // Function to toggle hiding
  hideToggle.addEventListener("change", () => {
      if (hideToggle.checked) {
          setActiveToggle("hide");
      } else {
          setActiveToggle("none");
      }
      console.log("Hide active:", isHideActive);
  });

  // Function to toggle blurring
  blurToggle.addEventListener("change", () => {
      if (blurToggle.checked) {
          setActiveToggle("blur");
      } else {
          setActiveToggle("none");
      }
      console.log("Blur active:", isBlurActive);
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
      
              // Apply current active effect if any
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

  loadSettings();
});