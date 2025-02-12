chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "highlight") {
        console.log("Highlighting words:", request.words);
        highlightWords(request.words);
    } else if (request.action === "hide") {
        console.log("Hiding words:", request.words);
        hideWords(request.words);
    } else if (request.action === "refresh") {
        location.reload(); // Refreshes page content without reloading the tab
    }
    sendResponse({ status: "success" });
});

function highlightWords(words) {
    document.querySelectorAll("*").forEach(el => {
        if (words.some(word => el.textContent.includes(word))) {
            el.style.border = "2px solid red";
            el.setAttribute("filterit-tag", "true");
        }
    });
}

function hideWords(words) {
    document.querySelectorAll("*").forEach(el => {
        if (words.some(word => el.textContent.includes(word))) {
            el.style.display = "none";
        }
    });
}
