import { Badge } from "../../component/badge.js";
import { HeadInitiate } from "../../component/head.js";
import { Sidebar, SidebarAlt } from "../../component/sidebar.js";

function ModelStatus() {
    fetch('https://api.kolosal.ai/health')
        .then(response => response.json())
        .then(data => {
            const setState = (id) => {
                const el = document.getElementById(id);
                if (!el) return;
                if (data.status === "healthy") {
                    el.setAttribute("data-state", "success");
                    el.setAttribute("data-text", "CONNECTED");
                } else {
                    el.setAttribute("data-state", "error");
                    el.setAttribute("data-text", "DISCONNECT");
                }
            };

            setState("LLMStatus");
            setState("EmbeddingStatus");
            setState("ParserStatus");
            setState("MarkItDownStatus");
            setState("DoclingStatus");
            setState("DocumentStatus");

            let llmCount = 0;
            let embeddingCount = 0;
            data.engines.forEach(engine => {
                if (engine.engine_id.toLowerCase().includes("embedding")) {
                    embeddingCount++;
                } else {
                    llmCount++;
                }
            });

            document.getElementById("LLMCount").textContent = llmCount;
            document.getElementById("EmbeddingCount").textContent = embeddingCount;

            Badge();
        });
}

function DocumentStatus() {
    fetch('https://api.kolosal.ai/list_documents')
        .then(response => response.json())
        .then(data => {
            const collectionNameEl = document.getElementById("CollectionName");
            const countDocumentEl = document.getElementById("CountDocument");
            if (collectionNameEl) { collectionNameEl.textContent = data.collection_name; }
            if (countDocumentEl) { countDocumentEl.textContent = data.total_count; }
        });
}

HeadInitiate()
Sidebar();
SidebarAlt();
ModelStatus();
DocumentStatus();
Badge();