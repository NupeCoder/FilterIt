// Define variables
let hideObserver = null;
let highlightObserver = null;

// Find target word from input textbox
async function findWord(word, action, reset=false) {
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
        //element.style.cssText = "";  // Clear ALL inline styles
        element.removeAttribute("filterit-tag"); // Remove the custom tag
  
        console.log("Reset element:", element);
      }

      function undoHighlightClose(selectedElement) {
        const maxDistance = 53; // Adjustable
        const selectedRect = selectedElement.getBoundingClientRect();

        // Select all relevant elements (divs, spans, links, articles, etc.)
        const elements = Array.from(document.querySelectorAll("[filterit-tag]"));
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
            resetChanges(element);
          } // Only include divs within maxDistance
        });
      }

      function undoHideClose(selectedElement) {

        const maxDistance = 53; // Adjustable
        console.log(selectedElement);
        const selectedRect = selectedElement.getBoundingClientRect();

        // Select all relevant elements (divs, spans, links, articles, etc.)
        const elements = Array.from(document.querySelectorAll("div, span, a, article, img, p"));
        console.log("all tagged elements:", elements);
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
            resetChanges(element);
          } // Only include divs within maxDistance
        });
      }


      function undoHighlight() {
        if (highlightObserver) {
          highlightObserver.disconnect(); // Disconnect the observer
          highlightObserver = null; // Reset the observer reference
        }

        const elements = Array.from(document.querySelectorAll("[filterit-tag]"));
        elements.forEach(element => {
          if ( !element.querySelector("div") && regex.test(element.textContent) ) {
            resetChanges(element);
            undoHighlightClose(element);
          }
        });

      }

      function undoHide() {
        if (hideObserver) {
          hideObserver.disconnect(); // Disconnect the observer
          hideObserver = null; // Reset the observer reference
        }

        const elements = Array.from(document.querySelectorAll("*")).filter( el => 
          getComputedStyle(el).visibility === "hidden"
      );
        console.log("all hidden elements:", elements);
        elements.forEach(element => {
          if ( !element.querySelector("div") && regex.test(element.textContent) ) {
            resetChanges(element);
            undoHideClose(element);
          }
        });
        
      }

      switch (actionType) {
        case "highlight":
          undoHighlight();
          break;

        case "hide":
          undoHide();
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

      // Function to figure out the divs in close proximity
      function highlightCloseDivs(selectedDiv) {
        const maxDistance = 53; // Adjustable
        const selectedRect = selectedDiv.getBoundingClientRect();

        // Select all relevant elements (divs, spans, links, articles, etc.)
        const elements = Array.from(document.querySelectorAll("div, span, a, article, img, p"));
        const matches = elements.filter(div => regex.test(div.textContent)); // filter elements

  
        // Filter elements that are close to the selected div
        matches.forEach(element => {
          if (element === selectedDiv) return; // Skip the selected div itself

          const rect = element.getBoundingClientRect();
          const distance = Math.sqrt(
            Math.pow(rect.left - selectedRect.left, 2) +
            Math.pow(rect.top - selectedRect.top, 2)
          );

          if (distance <= maxDistance) {
            element.style.border = '2px dashed green'; // Highlighting
            element.setAttribute("filterIt-tag", "true");
            console.log("highlighted nearby element: ", element);
          } // Only include divs within maxDistance
        });
      }

      function hideCloseDivs (selectedDiv) {
        const maxDistance = 53; // Adjustable
        const selectedRect = selectedDiv.getBoundingClientRect();

        // Select all relevant elements (divs, spans, links, articles, etc.)
        const elements = Array.from(document.querySelectorAll("div, span, a, article, img, p"));
        const matches = elements.filter(div => regex.test(div.textContent)); // filter elements

  
        // Filter elements that are close to the selected div
        matches.forEach(element => {
          if (element === selectedDiv) return; // Skip the selected div itself

          const rect = element.getBoundingClientRect();
          const distance = Math.sqrt(
            Math.pow(rect.left - selectedRect.left, 2) +
            Math.pow(rect.top - selectedRect.top, 2)
          );

          if (distance <= maxDistance) {
            element.style.visibility = "hidden";
            console.log("hid nearby elements: ", element);
          } // Only include divs within maxDistance
        });
      }
      
      // Highlight function
      function highlightText() {
        const elements = Array.from(document.querySelectorAll("div, span, a, article, img, p"));
        elements.forEach(element => {
          if ( !element.querySelector("div") && regex.test(element.textContent) ) {
            element.style.border = '2px solid red'; // Simple highlight
            element.setAttribute("filterIt-tag", "true");
            console.log("highlighted new div: ", element);
            highlightCloseDivs(element);
            console.log("highlighted nearby elements");

          }
        });
      };

      // Highlight function
      function hideDivs() {
        const elements = Array.from(document.querySelectorAll("div, span, a, article, img, p"));
        elements.forEach(element => {
          if ( !element.querySelector("div") && regex.test(element.textContent) ) {
            element.style.visibility = "hidden";
            console.log("hid new div: ", element);
            hideCloseDivs(element);
            console.log("hid nearby elemnts");
            

          }
        });
      };

      switch (actionType) {
        case "highlight":
          // Set up MutationObserver to monitor for changes in the DOM
          highlightObserver = new MutationObserver(highlightText);
          highlightObserver.observe(document.body, { childList: true, subtree: true });


          // Initially highlight any matching text
          highlightText();
          break;

        case "hide":
          hideObserver = new MutationObserver(hideDivs);
          hideObserver.observe(document.body, { childList: true, subtree: true });


          // Initially hide any matching text
          hideDivs();
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
  const textBox = document.getElementById("keyword");
  const addButton = document.getElementById("add");
  const toggleListLink = document.getElementById("toggle-list");
  const wordListContainer = document.getElementById("word-list-container");
  const wordList = document.getElementById("word-list");
  
  let words = new Set(); // Use a Set to prevent duplicates
  let isHighlightActive = false;
  let isHideActive = false;

  function removeWord(word) {
    // remove 1 word from the list
    findWord(word, "highlight", true);
    findWord(word, "hide", true);

  }

  // Function to update highlighting/hiding when toggles change
  function applyHighlight() {
    
    if (isHighlightActive) {
      words.forEach(word => {
        findWord(word, "highlight");
      })
      
    }else{
      words.forEach(word => {
        findWord(word, "highlight", true);
      })
    }

  }

  function applyHide() {
    
    if (isHideActive) {
      words.forEach(word => {
        findWord(word, "hide");
      })
      
    }else{
      words.forEach(word => {
        findWord(word, "hide", true);
      })
    }

  }

  // Function to toggle highlighting
  highlightToggle.addEventListener("change", () => {
    isHighlightActive = highlightToggle.checked;
    if (isHighlightActive){
      applyHighlight();
      console.log("switch checked: ", isHighlightActive);
    } else {
      applyHighlight();
      console.log("unchecked switch");
    }
    
  });

  // Function to toggle hiding
  hideToggle.addEventListener("change", () => {
    isHideActive = hideToggle.checked;
    console.log("switch checked: ", isHideActive);
    if (isHideActive){
      applyHide();
    } else {
      applyHide();
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
        const listElement = document.createElement("li");
        listElement.textContent = text;

        // Add a delete button for each word
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "X";
        deleteButton.style.marginLeft = "10px";
        deleteButton.addEventListener("click", () => {
          removeWord(text);
          words.delete(text);
          listElement.remove();
          
        });

        listElement.appendChild(deleteButton);
        wordList.appendChild(listElement);
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

});
