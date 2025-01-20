// Background stuff
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "sendText") {
          // Send the message to the content script in the active tab
          console.log(message)
      }
    });
  