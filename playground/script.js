import { HeadInitiate } from "../component/head.js";
import { Select } from "../component/select.js";
import { Sidebar } from "../component/sidebar.js";

let stopTyping = false;
let isTyping = false;

async function GetAPI(prompt) {
    const selectedModelElement = document.querySelector('#ModelList [data-selected="true"]');
    const modelId = selectedModelElement ? selectedModelElement.getAttribute('data-id') || selectedModelElement.id : null;
    if (!modelId) {
        throw new Error("No model selected");
    }
    const response = await fetch("https://api.kolosal.ai/models", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: modelId,
            prompt: prompt
        }),
    });
    const data = await response.json();
    return data.message || data.text || JSON.stringify(data);
}

marked.setOptions({ breaks: true });

function typeEffect(element, text, delay = 2, onFinish) {
    let i = 0;
    let buffer = '';
    stopTyping = false;
    isTyping = true;
    function typing() {
        if (stopTyping) {
            isTyping = false;
            if (onFinish) onFinish();
            return;
        }
        if (i < text.length) {
            buffer += text.charAt(i);
            element.innerHTML = marked.parse(buffer);
            i++;
            setTimeout(typing, delay);
        } else {
            isTyping = false;
            if (onFinish) onFinish();
        }
    }
    typing();
}

function MessageInteraction() {
    const inputMessage = document.querySelector("#InputUser");
    const sendButton = document.querySelector("#ActionUser");
    const bubble = document.querySelector(".bubble");
    const blank = document.querySelector(".blank");

    async function sendMessage() {
        if (isTyping) return;
        const userMessage = inputMessage.value.trim();
        if (userMessage === "") return;
        if (blank) {
            blank.style.display = "none";
            bubble.style.display = "flex";
        }
        bubble.innerHTML += `
        <div class="bubble-user">
            <div class="bubble-user-wrapper">
                <p class="article-text reguler">${userMessage}</p>
            </div>
        </div>`;
        inputMessage.value = "";
        bubble.scrollTop = bubble.scrollHeight;

        sendButton.innerHTML = '<i class="ri-stop-fill"></i>';
        isTyping = true;

        const loadingDiv = document.createElement("div");
        loadingDiv.className = "bubble-loading";
        loadingDiv.innerHTML = '<div class="circle"></div>';
        bubble.appendChild(loadingDiv);

        const botResponse = await GetAPI(userMessage);
        loadingDiv.remove();

        bubble.innerHTML += `
        <div class="bubble-bot">
            <div class="bubble-bot-wrapper"></div>
        </div>`;
        const botParagraph = bubble.querySelector('.bubble-bot:last-child .bubble-bot-wrapper');
        bubble.scrollTop = bubble.scrollHeight;
        typeEffect(botParagraph, botResponse, 2, () => {
            sendButton.innerHTML = '<i class="ri-arrow-up-line"></i>';
        });
    }

    inputMessage.addEventListener("keydown", async (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            await sendMessage();
        }
    });

    sendButton.addEventListener("click", async () => {
        if (isTyping) {
            stopTyping = true;
            isTyping = false;
            const loadingDiv = document.querySelector(".bubble-loading");
            if (loadingDiv) loadingDiv.remove();
            const lastBot = document.querySelector('.bubble-bot:last-child');
            if (lastBot) lastBot.remove();
            sendButton.innerHTML = '<i class="ri-arrow-up-line"></i>';
        } else {
            await sendMessage();
        }
    });
}

function ToggleOption() {
    const buttons = document.querySelectorAll(".ButtonOption");
    const box = document.querySelector(".box-option");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            if (box.classList.contains("active")) {
                box.classList.remove("active");
                box.addEventListener("transitionend", () => {
                    if (!box.classList.contains("active")) {
                        box.style.display = "none";
                    }
                }, { once: true });
            } else {
                box.style.display = "flex";
                requestAnimationFrame(() => {
                    box.classList.add("active");
                });
            }
        });
    });
}

async function ModelList() {
    const listContainer = document.querySelector("#ModelList");
    if (!listContainer) return;
    const response = await fetch("https://api.kolosal.ai/models");
    if (!response.ok) return;
    const data = await response.json();
    listContainer.innerHTML = data.models.map(model => `
        <div class="select-list-item">
            <h2 class="text-12px reguler">${model.model_id}</h2>
        </div>
    `).join('');
    Select();
}

HeadInitiate();
Sidebar();
ToggleOption();
MessageInteraction();
ModelList();