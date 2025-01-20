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


async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('confirm');
    const textBox = document.getElementById('keyword');
    
    // This sends the text in the textbox to the console 
    if (sendButton && textBox) {
      sendButton.addEventListener('click', () => {
        const text = textBox.value;
        chrome.runtime.sendMessage({ action: "sendText", text: text });
        addDiv(text)
        chrome.runtime.sendMessage({ action: "sendText", text: "added div" });
      });
    } else {
      console.error("Could not find 'sendTextButton' or 'textBox' in the DOM.");
    }


  });

