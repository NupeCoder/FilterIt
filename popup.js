var highlightDiv = false;
var deleteDiv = false;

// Find target word from input textbox
async function findWord(word) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
        const currentTab = tabs[0]; // The current active tab
        console.log("Current Tab:", currentTab);

        // Example: Log the URL of the current tab
        console.log("Current Tab ID:", currentTab.id);

        console.log("Textbox Text:", word)

        // Handle divs depending on option

        if (highlightDiv){
          highlightDivs(word, currentTab.id)
        }

        if (deleteDiv){
          deleteDivs(word, currentTab.id)
        }
        

    } else {
        console.error("No active tab found.");
    }
});

}

// Highlight the Divs that contain the words we are looking for
function highlightDivs(word, currentTabId) {
  chrome.scripting.executeScript({
    target: { tabId: currentTabId},
    func: (text) => {

      //console.log("Word to match:", word);
      console.log("Word passed:", text);

      function getDivsInProximity(selectedDiv) {
        const maxDistance = 75 //adjustable
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
      const divs = Array.from(document.querySelectorAll('div')); // Get all divs
      const matches = divs.filter(div => div.textContent.includes(text)); // Filter by text content

      matches.forEach(div => {
        // Check if the div directly contains the text
          if (!div.querySelector('div')){
            // Highlight the div
            div.style.border = "2px solid red";
            console.log("Highlighted div:", div);

            const nearbyDivs = getDivsInProximity(div);

            nearbyDivs.forEach(closeDiv)
  
            // Highlight the parent div if it exists
            if (div.parentElement && div.parentElement.tagName === "DIV") {
              div.parentElement.style.border = "2px solid blue"; // Parent div gets a blue border
              console.log("Highlighted parent div:", div.parentElement);
            }
    
          }
          

      });

      console.log("Succesfully matched divs:", matches.length);
    },
    args: [word]

  })
}

function deleteDivs(word, currentTabId) {
  chrome.scripting.executeScript({
    target: { tabId: currentTabId},
    func: (text) => {

      //console.log("Word to match:", word);
      console.log("Word passed:", text);

      // Filter for divs that match
      const divs = Array.from(document.querySelectorAll('div')); // Get all divs
      const matches = divs.filter(div => div.textContent.includes(text)); // Filter by text content

      matches.forEach(div => {
        // Check if the div directly contains the text
          if (!div.querySelector('div')){
            
  
            // Delete
            if (div.parentElement && div.parentElement.tagName === "DIV") {
              div.remove();
              console.log("Removed div:", div.parentElement);
            }
    
          }
          

      });

      console.log("Succesfully matched divs:", matches.length);
    },
    args: [word]

  })
}


// Main code for event Handling
document.addEventListener('DOMContentLoaded', () => {
  const highlightButton = document.getElementById('highlight');
  const textBox = document.getElementById('keyword');
  
  // This sends the text in the textbox to the console 

  // Main code for Highlighting 
  if (highlightButton && textBox) {
    highlightButton.addEventListener('click', () => {
      const text = textBox.value;
      chrome.runtime.sendMessage({ action: "highlight", text: text });
      highlightDiv = true
      findWord(text)
      chrome.runtime.sendMessage({ action: "highlight", text: "highlighted div" });
    });
  } else {
    console.error("Could not find 'highlightButton' or 'textBox' in the DOM.");
  }

  const deleteButton = document.getElementById('delete');
  
  // Main code for Deleting 
  if (deleteButton && textBox) {
    deleteButton.addEventListener('click', () => {
      const text = textBox.value;
      chrome.runtime.sendMessage({ action: "delete", text: text });
      deleteDiv = true
      findWord(text)
      chrome.runtime.sendMessage({ action: "delete", text: "deleted div" });
    });
  } else {
    console.error("Could not find 'deleteButton' or 'textBox' in the DOM.");
  }


  });
