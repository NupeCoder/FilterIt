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
      handleDivs(word, currentTab.id, action);
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

      function getDivsInProximity(selectedDiv) {
        const maxDistance = 75;
        const divs = document.querySelectorAll("div");
        const selectedRect = selectedDiv.getBoundingClientRect();

        return Array.from(divs).filter(div => {
          if (div === selectedDiv) return false; // Skip the selected div

          const rect = div.getBoundingClientRect();
          const distance = Math.sqrt(
            Math.pow(rect.left - selectedRect.left, 2) +
            Math.pow(rect.top - selectedRect.top, 2)
          );

          return distance <= maxDistance; // Only include divs within maxDistance
        });
      }

      // Filter for divs that match
      const divs = Array.from(document.querySelectorAll("div")); // Get all divs
      const matches = divs.filter(div => div.textContent.includes(text)); // Filter by text content

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

        case "delete":
          matches.forEach(div => {
            // Check if the div directly contains the text
            if (!div.querySelector("div")) {
              div.remove(); // Remove the div
              console.log("Removed div:", div);
            }
          });
          break;

        default:
          console.error("Invalid action type:", actionType);
          break;
      }

      console.log("Successfully matched divs:", matches.length);
    },
    args: [word, action], // Pass the word and action type as arguments
  });
}

// Main code for event handling
document.addEventListener("DOMContentLoaded", () => {
  const highlightButton = document.getElementById("highlight");
  const deleteButton = document.getElementById("delete");
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

  // Main code for Deleting
  if (deleteButton && textBox) {
    deleteButton.addEventListener("click", () => {
      const text = textBox.value;
      chrome.runtime.sendMessage({ action: "delete", text: text });
      findWord(text, "delete"); // Pass "delete" as the action
      chrome.runtime.sendMessage({ action: "delete", text: "deleted div" });
    });
  } else {
    console.error("Could not find 'deleteButton' or 'textBox' in the DOM.");
  }
});
