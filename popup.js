function addDiv(message) {
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
        const currentTab = tabs[0]; // The current active tab
        console.log("Current Tab:", currentTab);

        // Example: Log the URL of the current tab
        console.log("Current Tab ID:", currentTab.id);

        console.log("Textbox Text:", message)

        createDiv(message, currentTab.id)

    } else {
        console.error("No active tab found.");
    }
});

}

// Inject a Div into the current tab
function createDiv(message, currentTabId) {

  chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: (text) => {
      document.body.style.backgroundColor = "lightgreen";

      const textElement = document.createElement('div');
      textElement.textContent = text;
      textElement.id = 'WOw';
      textElement.style.position = 'fixed';
      textElement.style.top = '100px';
      textElement.style.left = '100px';
      textElement.style.backgroundColor = 'yellow';
      textElement.style.padding = '10px';
      textElement.style.zIndex = '1000';
      document.body.appendChild(textElement);
    },
    args: [message]
  })


}

// Returns current tab as a promise
async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

// Find target word from input textbox
async function findWord(word) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
        const currentTab = tabs[0]; // The current active tab
        console.log("Current Tab:", currentTab);

        // Example: Log the URL of the current tab
        console.log("Current Tab ID:", currentTab.id);

        console.log("Textbox Text:", word)

        highlightDivs(word, currentTab.id)

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

      // Filter for divs that match
      const divs = Array.from(document.querySelectorAll('div')); // Get all divs
      const matches = divs.filter(div => div.innerHTML.includes(text)); // Filter by text content

      // Highlight the divs that match
      matches.forEach(div => {
        div.style.border = "2px solid red"
      })

      console.log("Succesfully matched divs:", matches.length);
    },
    args: [word]

  })
}


// Main code that handles the process
document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('confirm');
    const textBox = document.getElementById('keyword');
    
    // This sends the text in the textbox to the console 
    if (sendButton && textBox) {
      sendButton.addEventListener('click', () => {
        const text = textBox.value;
        chrome.runtime.sendMessage({ action: "sendText", text: text });
        findWord(text)
        chrome.runtime.sendMessage({ action: "sendText", text: "added div" });
      });
    } else {
      console.error("Could not find 'sendTextButton' or 'textBox' in the DOM.");
    }


  });

