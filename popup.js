// Find target word from input textbox
async function findWord(word, action) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const currentTab = tabs[0]; // The current active tab
      console.log("Current Tab:", currentTab);

      // Log the URL of the current tab
      console.log("Current Tab ID:", currentTab.id);
      console.log("Textbox Text:", word);
      console.log("Action:", action);

      // Pass word and action to observeNewContent
      observeNewContent(currentTab.id, word, action);

    } else {
      console.error("No active tab found.");
    }
  });
}

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
            console.log("highlighted nearby element: ", element);
          } // Only include divs within maxDistance
        });
      }

      function hideCloseDivs (selectedDiv) {
        const maxDistance = 70; // Adjustable
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
        const divs = Array.from(document.querySelectorAll("div, span, a, article, img, p"));
        divs.forEach(div => {
          if ( !div.querySelector("div") && regex.test(div.textContent) ) {
            div.style.border = '2px solid red'; // Simple highlight
            console.log("highlighted new div: ", div);
            highlightCloseDivs(div);
            console.log("highlighted nearby elements");

          }
        });
      };

      // Highlight function
      function hideDivs() {
        const divs = Array.from(document.querySelectorAll("div, span, a, article, img, p"));
        divs.forEach(div => {
          if ( !div.querySelector("div") && regex.test(div.textContent) ) {
            div.style.visibility = "hidden";
            console.log("hid new div: ", div);
            hideCloseDivs(div);
            console.log("hid nearby elemnts");
            

          }
        });
      };

      switch (actionType) {
        case "highlight":
          // Set up MutationObserver to monitor for changes in the DOM
          const highlightObserver = new MutationObserver(highlightText);
          highlightObserver.observe(document.body, { childList: true, subtree: true });


          // Initially highlight any matching text
          highlightText();
          break;

        case "hide":
          const hideObserver = new MutationObserver(hideDivs);
          hideObserver.observe(document.body, { childList: true, subtree: true });


          // Initially highlight any matching text
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

  // Function to update highlighting/hiding when toggles change
  function applyFilters() {
    words.forEach(word => {
      if (isHighlightActive) {
        findWord(word, "highlight");
      }
      if (isHideActive) {
        findWord(word, "hide");
      }
    });
  }

  // Function to toggle highlighting
  highlightToggle.addEventListener("change", () => {
    isHighlightActive = highlightToggle.checked;
    applyFilters();
  });

  // Function to toggle hiding
  hideToggle.addEventListener("change", () => {
    isHideActive = hideToggle.checked;
    applyFilters();
  });

  // Function to add words to the list
  addButton.addEventListener("click", () => {
    try {
        const text = textBox.value.trim(); // Remove extra spaces
        if (!text) throw new Error("Textbox is empty! Please enter a word.");

        if (!words.has(text)) {
          words.add(text);
          const li = document.createElement("li");
          li.textContent = text;

          // Add a delete button for each word
          const deleteButton = document.createElement("button");
          deleteButton.textContent = "X";
          deleteButton.style.marginLeft = "10px";
          deleteButton.addEventListener("click", () => {
            words.delete(text);
            li.remove();
          });

          li.appendChild(deleteButton);
          wordList.appendChild(li);
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
      toggleListButton.textContent = "Hide Word List";
    } else {
      wordListContainer.style.display = "none";
      toggleListButton.textContent = "Show Word List";
    }
  });

});
