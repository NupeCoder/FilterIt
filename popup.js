function sendToContentScript(word, action, reset = false) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: reset ? "RESET_WORD" : "FILTER_WORD",
        word,
        action
      });
    }
  });
}

// Define variables
let words = new Set(); // Use a Set to prevent duplicates
let isHideActive = false;
let isBlurActive = false;

// Store observers for each word
let hideObservers = new Map();
let blurObservers = new Map();

// Find target word from input textbox
function sendToContentScript(word, action, reset=false) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const currentTab = tabs[0]; // The current active tab



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
  
          case "hide":
            hideObservers.get(text).disconnect();
            elements = Array.from(document.querySelectorAll("*")).filter(el =>
              getComputedStyle(el).visibility === "hidden"
            );
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
                break;

              case "hide":
                element.style.visibility = "hidden";
                element.setAttribute("filterIt-tag", "true");
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
  
          case "hide":
            elements = Array.from(document.querySelectorAll("div, span, a, article, img, p"));
            elements.forEach(element => {
              if ( !element.querySelector("div") && regex.test(element.textContent) ) {
                element.style.visibility = "hidden";
                filterCloseElements(element, "hide");
              }
            });
            break;
  
          case "blur":
            elements = Array.from(document.querySelectorAll("div, span, a, article, img, p"));
            elements.forEach(element => {
              if ( !element.querySelector("div") && regex.test(element.textContent) ) {
                element.style.filter = "blur(5px)";
                filterCloseElements(element, "blur");
                
              }
            });
            break;
  
          default:
            break;
        }

      }

      switch (actionType) {

        case "hide":
          if (!hideObservers.has(text)) {
            const observer = new MutationObserver(() => filterContent("hide"));
            hideObservers.set(text, observer);
          }
          // Activate the observer if the toggle is on
          chrome.storage.local.get(["hideEnabled"], (data) => {
            if (data.hideEnabled) {
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
  const hideToggle = document.getElementById("hide-toggle");
  const blurToggle = document.getElementById("blur-toggle");
  const textBox = document.getElementById("keyword");
  const addButton = document.getElementById("add");
  const toggleListLink = document.getElementById("toggle-list");
  const wordListContainer = document.getElementById("word-list-container");
  const wordList = document.getElementById("word-list");
  const clearAllButton = document.getElementById("clear-all-btn");

  // Function to save words and toggle states
  function saveSettings() {
      chrome.storage.local.set({
          words: Array.from(words),
          hideEnabled: isHideActive,
          blurEnabled: isBlurActive
      });
  }

  // Function to load saved words and toggle states
  function loadSettings() {
      chrome.storage.local.get(["words", "hideEnabled", "blurEnabled"], (data) => {
          if (data.words) {
              words = new Set(data.words);
              updateWordListUI();
          }
          
          // Reset all toggle states first
          isHideActive = false;
          isBlurActive = false;
          
          // Only set one toggle as active based on saved settings
          if (data.hideEnabled && words.size > 0) {
              isHideActive = true;
              setActiveToggle("hide");
          } else if (data.blurEnabled && words.size > 0) {
              isBlurActive = true;
              setActiveToggle("blur");
          } else {
              // Update UI to reflect no active toggles
              hideToggle.checked = false;
              blurToggle.checked = false;
          }
      
          // Apply active effect if any
          if (isHideActive) applyHide();
          if (isBlurActive) applyBlur();
      });
  }

  // Function to set the active toggle and turn off all others
  function setActiveToggle(activeName) {
      // First, clear all effects
      clearAllEffects();
      
      // Reset all toggle states and UI
      isHideActive = false;
      isBlurActive = false;
      hideToggle.checked = false;
      blurToggle.checked = false;
      
      // Set the specified toggle as active
      switch (activeName) {
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
      
      // Show/hide the Clear All button based on whether there are words
      clearAllButton.style.display = words.size > 0 ? "block" : "none";
  }

  function removeWord(word) {
      // remove 1 word from the list
      sendToContentScript(word, "hide", true);
      sendToContentScript(word, "blur", true);
  }


  function applyHide() {
      if (isHideActive) {
          words.forEach(word => {
              sendToContentScript(word, "hide");
          });
      } else {
          words.forEach(word => {
              sendToContentScript(word, "hide", true);
          });
      }
  }

  function applyBlur() {
      if (isBlurActive) {
          words.forEach(word => {
              sendToContentScript(word, "blur");
          });
      } else {
          words.forEach(word => {
              sendToContentScript(word, "blur", true);
          });
      }
  }

  // Function to clear all effects
  function clearAllEffects() {
      words.forEach(word => {
          sendToContentScript(word, "hide", true);
          sendToContentScript(word, "blur", true);
      });
  }

  // Function to clear all words
  function clearAllWords() {
      if (words.size === 0) {
          alert("Word list is already empty!");
          return;
      }
      
      // Confirm before clearing all words
      if (confirm("Are you sure you want to remove all words from your list?")) {
          // Remove all effects for all words
          clearAllEffects();
          
          // Clear the words set
          words.clear();
          
          // Update UI
          updateWordListUI();
          
          // Save the empty list
          saveSettings();
          
          // Show success message
          alert("All words have been removed from your list.");
      }
  }


  // Function to toggle hiding
  hideToggle.addEventListener("change", () => {
      if (hideToggle.checked) {
          setActiveToggle("hide");
      } else {
          setActiveToggle("none");
      }
  });

  // Function to toggle blurring
  blurToggle.addEventListener("change", () => {
      if (blurToggle.checked) {
          setActiveToggle("blur");
      } else {
          setActiveToggle("none");
      }
  });

  // Sanitize user input to allow only letters, numbers, and spaces
function sanitizeAlphanumeric(input) {
  return input.replace(/[^a-zA-Z0-9 ]/g, '');
}

// Function to add words to the list
addButton.addEventListener("click", () => {
  try {
      const rawText = textBox.value.trim(); // Remove extra spaces
      if (!rawText) throw new Error("Textbox is empty! Please enter a word.");

      const text = sanitizeAlphanumeric(rawText); // Sanitize to alphanumeric only

      if (!text) throw new Error("Invalid input. Only letters, numbers, and spaces are allowed.");

      if (!words.has(text)) {
          words.add(text);
          updateWordListUI();
          saveSettings(); // Save words

          // Apply current active effect if any
          if (isHideActive) sendToContentScript(text, "hide");
          if (isBlurActive) sendToContentScript(text, "blur");

          // Show success alert
          alert(`"${text}" has been added to your word list.`);
      } else {
          // Word already exists alert
          alert(`"${text}" is already in your word list.`);
      }

      textBox.value = ""; // Clear input after adding
  } catch (error) {
      console.error(error.message);
      alert(error.message); // Alert for errors
  }
});


  // Add event listener for clearing all words
  clearAllButton.addEventListener("click", clearAllWords);

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

  const hideLabel = hideToggle.closest('.switch-container').querySelector('.switch-label');
  const blurLabel = blurToggle.closest('.switch-container').querySelector('.switch-label');

  hideToggle.addEventListener('change', () => {
    hideLabel.textContent = hideToggle.checked ? 'Hide Enabled' : 'Enable Hide';
  });

  blurToggle.addEventListener('change', () => {
    blurLabel.textContent = blurToggle.checked ? 'Blur Enabled' : 'Enable Blur';
  });


  loadSettings();
});