
function addDiv() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "sendText") {
    const textElement = document.createElement('div');
    textElement.textContent = message.text;
    textElement.style.position = 'fixed';
    textElement.style.top = '10px';
    textElement.style.left = '10px';
    textElement.style.backgroundColor = 'yellow';
    textElement.style.padding = '10px';
    textElement.style.zIndex = '1000';
    document.body.appendChild(textElement);
  }})
}

