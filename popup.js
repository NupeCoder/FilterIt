document.addEventListener("DOMContentLoaded", () => {
    const highlightSwitch = document.getElementById("highlightSwitch");
    const hideSwitch = document.getElementById("hideSwitch");
    const addButton = document.getElementById("addWord");
    const wordList = document.getElementById("wordList");
    const textBox = document.getElementById("keyword");

    function sendMessage(action) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) return;
            chrome.tabs.sendMessage(tabs[0].id, { action, words: getWordList() });
        });
    }

    highlightSwitch.addEventListener("change", () => sendMessage("highlight"));
    hideSwitch.addEventListener("change", () => sendMessage("hide"));

    addButton.addEventListener("click", () => {
        const word = textBox.value.trim();
        if (!word) return;
        addWordToList(word);
        textBox.value = "";
        sendMessage("highlight"); // Apply changes immediately
    });

    function addWordToList(word) {
        const listItem = document.createElement("li");
        listItem.textContent = word;
        wordList.appendChild(listItem);
    }

    function getWordList() {
        return Array.from(wordList.children).map(li => li.textContent);
    }
});
