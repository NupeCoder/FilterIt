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

      // Pass word and action to handleDivs
      //handleDivs(word, currentTab.id, action);

      observeNewContent(currentTab.id, word);
    } else {
      console.error("No active tab found.");
    }
  });
}

// Function to Handle the Divs that contain the words we are looking for
function handleDivs(word, currentTabId, action) {
  chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: (text, actionType) => {
      console.log("Word passed:", text);
      console.log("Action type:", actionType);

      // Filter for divs that match
      const divs = Array.from(document.querySelectorAll("div")); // Get all divs
      const regex = new RegExp(`\\b${text}\\b`, "i"); // Case-insensitive whole-word match
      const matches = divs.filter(div => regex.test(div.textContent)); // Filter by text content

      // Function to figure out the divs in close proximity
      function getDivsInProximity(selectedDiv) {
        const maxDistance = 55; // Adjustable
        const selectedRect = selectedDiv.getBoundingClientRect();

        return Array.from(matches).filter(div => {
          if (div === selectedDiv) return false; // Skip the selected div

          const rect = div.getBoundingClientRect();
          const distance = Math.sqrt(
            Math.pow(rect.left - selectedRect.left, 2) +
            Math.pow(rect.top - selectedRect.top, 2)
          );

          return distance <= maxDistance; // Only include divs within maxDistance
        });
      }

      

      // Switch based on actionType
      switch (actionType) {

        case "highlight":
          matches.forEach(div => {
            // Check if the div directly contains the text
            if (!div.querySelector("div")) {
              // Highlight the div
              div.style.border = "2px solid red";
              console.log("Highlighted div:", div);

              const nearbyDivs = getDivsInProximity(div);
              nearbyDivs.forEach(nearbyDiv => {
                nearbyDiv.style.border = "2px dashed green"; // Highlight nearby divs
              });

              // Highlight the parent div if it exists
              if (div.parentElement && div.parentElement.tagName === "DIV") {
                div.parentElement.style.border = "2px solid blue"; // Parent div gets a blue border
                console.log("Highlighted parent div:", div.parentElement);
              }
            }
          });
          break;


        case "hide":
          
          matches.forEach(div => {
            if (!div.querySelector("div")) {
            const nearbyDivs = getDivsInProximity(div);
            div.style.display = "none"; // Hide matching divs

            nearbyDivs.forEach(nearbyDiv => {
              nearbyDiv.style.display = "none"; // Highlight nearby divs
            });
            console.log("Hiding div:", div);
            }

            const observer = new MutationObserver(mutations => {
              mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                  if (node.nodeType === 1 && node.tagName === "DIV" && node.textContent.includes(text)) {
                    node.style.display = "none";
                    console.log("MutationObserver hid new div:", node);
                  }
                });
              });
            });
            observer.observe(document.body, { childList: true, subtree: true });
          });

          break;

        default:
          console.error("Invalid action type:", actionType);
          break;
      }

      console.log("Successfully matched divs:", matches.length);
      console.log(matches);
    },
    args: [word, action], // Pass the word and action type as arguments
  });
}

function observeNewContent(currentTabId, word) {
  chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: (text) => {
      const regex = new RegExp(`\\b${text}\\b`, "i");


      // Function to figure out the divs in close proximity
      function highlightCloseDivs(selectedDiv) {
        const maxDistance = 55; // Adjustable
        const selectedRect = selectedDiv.getBoundingClientRect();

        // Select all relevant elements (divs, spans, links, articles, etc.)
        const elements = Array.from(document.querySelectorAll("div, span, a, article"));
  
        // Filter elements that are close to the selected div
        elements.forEach(element => {
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
      
      // Highlight function
      function highlightText() {
        const divs = Array.from(document.querySelectorAll("div"));
        divs.forEach(div => {
          if ( !div.querySelector("div") && regex.test(div.textContent) ) {
            div.style.border = '2px solid red'; // Simple highlight
            console.log("highlighted new div: ", div);
            // highlightCloseDivs(div);
            // console.log("highlighted nearby elements");

          }
        });
      };

      // Set up MutationObserver to monitor for changes in the DOM
      const observer = new MutationObserver(highlightText);
      observer.observe(document.body, { childList: true, subtree: true });

      // Initially highlight any matching text
      highlightText();
    },
    args: [word],
  });
}

// Main code for event handling
document.addEventListener("DOMContentLoaded", () => {
  const highlightButton = document.getElementById("highlight");
  const hideButton = document.getElementById("hide");
  const textBox = document.getElementById("keyword");

  // Main code for Highlighting
  if (highlightButton && textBox) {
    highlightButton.addEventListener("click", () => {
      const text = textBox.value;
      chrome.runtime.sendMessage({ action: "highlight", text: text });
      findWord(text, "highlight"); // Pass "highlight" as the action
      chrome.runtime.sendMessage({ action: "highlight", text: "highlighted div" });
    });
  } else {
    console.error("Could not find 'highlightButton' or 'textBox' in the DOM.");
  }


  // Main code for Hiding
  if (hideButton && textBox) {
    hideButton.addEventListener("click", () => {
      const text = textBox.value;
      chrome.runtime.sendMessage({ action: "hide", text: text });
      findWord(text, "hide"); // Pass "delete" as the action
      chrome.runtime.sendMessage({ action: "hide", text: "hidden div" });
    });
  } else {
    console.error("Could not find 'hideButton' or 'textBox' in the DOM.");
  }
});
