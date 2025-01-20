document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('confirm');
    const textBox = document.getElementById('keyword');
    
    // This sends the text in the textbox to the console 
    if (sendButton && textBox) {
      sendButton.addEventListener('click', () => {
        const text = textBox.value;
        chrome.runtime.sendMessage({ action: "sendText", text: text });
      });
    } else {
      console.error("Could not find 'sendTextButton' or 'textBox' in the DOM.");
    }
  });
