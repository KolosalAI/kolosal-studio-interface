import { Badge } from "../component/badge.js";
import { HeadInitiate } from "../component/head.js";
import { Popup } from "../component/popup.js";
import { Select } from "../component/select.js";
import { Sidebar } from "../component/sidebar.js";
import { Toast } from "../component/toast.js";

function SkeletonModel(container, count = 8) {
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement("div");
        skeleton.className = "model-list-loading";
        container.appendChild(skeleton);
    }
}

function SkeletonFile(container, count = 5) {
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement("div");
        skeleton.className = "file-item-loading";
        container.appendChild(skeleton);
    }
}

function createModelItem(model, container, modelCache) {
    const id = model.id || "Unknown Model";
    const task = model.pipeline_tag || "No Description";
    const siblingsCount = model.siblings ? model.siblings.filter(file => file.rfilename?.endsWith(".gguf") || file.filename?.endsWith(".gguf")).length : 0;


    const item = document.createElement("div");
    item.className = "model-list-item";
    item.innerHTML = `
            <div class="model-name">
                <h2 class="text-14px reguler">${id}</h2>
                <p class="mono-12px reguler">${task}</p>
            </div>
            <div class="model-detail">
                <i class="ri-import-line"></i>
                <h3 class="text-12px reguler">${siblingsCount} files</h3>
            </div>
            <button class="btn-md btn-outline" data-popup="FileList">Add Model</button>
        `;

    item.querySelector("[data-popup]").addEventListener("click", (e) => {
        Toast("Loading model files...");
        setTimeout(async () => {
            const listContainer = document.querySelector(".popup-model-list");
            if (!listContainer) return;

            listContainer.innerHTML = "";
            SkeletonFile(listContainer, 5);

            let tree;
            if (modelCache.has(id)) {
                tree = modelCache.get(id);
                handleTree(tree);
            } else {
                await fetch(`https://huggingface.co/api/models/${id}/tree/main`)
                    .then(res => res.json())
                    .then(data => {
                        tree = data;
                        modelCache.set(id, tree);
                        handleTree(tree);
                    })
                    .catch(error => {
                        console.error("Error fetching model files:", error);
                        const skeletons = listContainer.querySelectorAll(".file-item-loading");
                        skeletons.forEach(skeleton => skeleton.remove());
                        listContainer.innerHTML = `<p class="mono-12px reguler">Failed to load files (${error.message})</p>`;
                    });
            }

            function handleTree(tree) {
                const ggufFiles = Array.isArray(tree) ? tree.filter(f => f.path && f.path.endsWith(".gguf")) : [];
                if (ggufFiles.length > 0) {
                    const results = ggufFiles.map(file => {
                        const fileItem = document.createElement("div");
                        fileItem.className = "file-item";
                        fileItem.dataset.value = file.path;
                        fileItem.dataset.model = id.split("/")[1] || id;
                        fileItem.dataset.org = id.split("/")[0] || "unknown";

                        const sizeGB = file.size ? (file.size / 1e9).toFixed(1) + " GB" : "";
                        fileItem.innerHTML = `
                            <h2 class="text-14px reguler">${file.path}</h2>
                            <h3 class="mono-14px reguler">${sizeGB}</h3>
                        `;
                        return fileItem;
                    });

                    const skeletons = listContainer.querySelectorAll(".file-item-loading");
                    skeletons.forEach(skeleton => skeleton.remove());
                    listContainer.innerHTML = "";
                    results.forEach(item => listContainer.appendChild(item));
                    ConfigModel();
                } else {
                    const skeletons = listContainer.querySelectorAll(".file-item-loading");
                    skeletons.forEach(skeleton => skeleton.remove());
                    listContainer.innerHTML = `<p class="mono-12px reguler">No .gguf files available</p>`;
                }
            }

            const popupFileList = document.querySelector('.popup.select-file');
            if (popupFileList) popupFileList.classList.add('active');
        });
    });
    item.querySelector("[data-popup]").disabled = false;
    container.appendChild(item);
}

async function ModelList() {
    const container = document.querySelector(".model-list");
    if (!container) return;
    const modelCache = new Map();

    function renderModels(data) {
        data.forEach(model => createModelItem(model, container, modelCache));
    }

    let skip = 0;
    const batchSize = 16;
    let loading = false;
    let finished = false;

    function fetchBatch() {
        if (loading || finished) return;
        loading = true;

        SkeletonModel(container, 8);

        fetch(
            `https://huggingface.co/api/models?filter=gguf&sort=trendingScore&limit=${batchSize}&skip=${skip}&full=true`,
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer",
                    "Accept": "application/json"
                }
            }
        )
        .then(response => response.json())
        .then(data => {
            const skeletons = container.querySelectorAll(".model-list-loading");
            skeletons.forEach(skeleton => skeleton.remove());

            renderModels(data);
            Popup();

            if (data.length < batchSize) {
                finished = true;
            }
            skip += batchSize;
            loading = false;
        })
        .catch(error => {
            const skeletons = container.querySelectorAll(".model-list-loading");
            skeletons.forEach(skeleton => skeleton.remove());
            container.innerHTML = `<p class="mono-12px reguler">Please try again</p>`;
            loading = false;
        });
    }

    fetchBatch();

    const wrapper = document.querySelector(".wrapper");
    if (wrapper) {
        wrapper.addEventListener("scroll", () => {
            if (wrapper.scrollTop + wrapper.clientHeight >= wrapper.scrollHeight - 10) {
                if (!loading && !finished) {
                    fetchBatch();
                }
            }
        });
    }

    return { renderModels, container };
}

async function SearchModel() {
    const input = document.getElementById("SearchModel");
    if (!input) return;

    const container = document.querySelector(".model-list");
    if (!container) return;

    const modelCache = new Map();

    function renderModels(data) {
        data.forEach(model => createModelItem(model, container, modelCache));
    }

    input.addEventListener("input", async () => {
        const query = input.value.trim();
        container.innerHTML = "";
        if (!query) {
            container.innerHTML = "";
            ModelList();
            return;
        }
        SkeletonModel(container, 8);
        try {
            const response = await fetch(
                `https://huggingface.co/api/models?search=${encodeURIComponent(query)}&filter=gguf&sort=trendingScore&limit=16&full=true`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": "Bearer",
                        "Accept": "application/json"
                    }
                }
            );

            if (!response.ok) throw new Error(`Request failed: ${response.status}`);

            const data = await response.json();
            const skeletons = container.querySelectorAll(".model-list-loading");
            skeletons.forEach(skeleton => skeleton.remove());

            if (!data.length) {
                container.innerHTML = `<p class="mono-12px reguler">No results found for “${query}”</p>`;
                return;
            }

            renderModels(data);
            Popup();
            ConfigModel();

        } catch (err) {
            const skeletons = container.querySelectorAll(".model-list-loading");
            skeletons.forEach(skeleton => skeleton.remove());
            container.innerHTML = `<p class="mono-12px reguler">Failed to fetch search results (${err.message})</p>`;
        }
    });
}

function ConfigModel() {
    const fileItems = document.querySelectorAll(".file-item");
    const addModelBtn = document.querySelector(".AddModel");
    if (!fileItems.length || !addModelBtn) return;

    let selectedFile = null;
    let selectedModelName = null;

    fileItems.forEach(item => {
        item.addEventListener("click", () => {
            fileItems.forEach(i => i.classList.remove("selected"));
            item.classList.add("selected");
            selectedFile = item.dataset.value;
            selectedModelName = item.dataset.model;
        });
    });

    addModelBtn.addEventListener("click", () => {
        if (!selectedFile || !selectedModelName) return;

        const selectedItem = document.querySelector(".file-item.selected");
        const orgName = selectedItem ? selectedItem.dataset.org : "unknown";
        const path = `https://huggingface.co/${orgName}/${selectedModelName}/resolve/main/${selectedFile}`;

        const modelIdInput = document.getElementById("FormModelId");
        const modelPathInput = document.getElementById("FormModelPath");

        if (modelIdInput) modelIdInput.value = selectedModelName;
        if (modelPathInput) modelPathInput.value = path;

        const modelTypeSelect = document.getElementById("FormModelType");
        if (modelTypeSelect) {
            const triggerText = modelTypeSelect.querySelector(".select-trigger h2");
            if (/embedding/i.test(selectedModelName)) {
                modelTypeSelect.dataset.selected = "Embedding (Text Vectorization)";
                if (triggerText) triggerText.textContent = "Embedding (Text Vectorization)";
            } else {
                modelTypeSelect.dataset.selected = "LLM (Text Generation)";
                if (triggerText) triggerText.textContent = "LLM (Text Generation)";
            }
        }

        const currentPopup = document.querySelector('.popup.select-file.active');
        if (currentPopup) currentPopup.classList.remove('active');

        const formModelPopup = document.querySelector('.popup.form-model');
        if (formModelPopup) formModelPopup.classList.add('active');
    });
}

async function SubmitModel() {
    const submitBtn = document.querySelector(".SubmitModel");
    if (!submitBtn) return;

    submitBtn.addEventListener("click", async () => {
        const modelId = document.getElementById("FormModelId")?.value.trim() || "";
        const modelPath = document.getElementById("FormModelPath")?.value.trim() || "";
        const modelType = (() => {
            const selected = document.getElementById("FormModelType")?.dataset.selected;
            if (selected === "LLM (Text Generation)") return "llm";
            if (selected === "Embedding (Text Vectorization)") return "embedding";
            return selected || "";
        })();

        const inferenceEngine = document.getElementById("FormInferenceEngine")?.dataset.selected || "llama-cpu";
        const mainGpuId = parseInt(document.getElementById("MainGPUId")?.value || "-1");
        const loadImmediately = document.getElementById("FormLoadImmediately")?.checked || false;
        const contextSize = parseInt(document.getElementById("FormContextSize")?.value || "4096");
        const batchSize = parseInt(document.getElementById("FormBatchSize")?.value || "512");
        const gpuLayers = parseInt(document.getElementById("FormGPULayers")?.value || "0");
        const parallelSequences = parseInt(document.getElementById("FormParallelSequences")?.value || "1");
        const memoryMapping = document.getElementById("FormMemoryMapping")?.checked || false;
        const performWarmup = document.getElementById("FormPerformWarmup")?.checked || false;

        const data = {
            model_id: modelId,
            model_path: modelPath,
            model_type: modelType,
            model_inference: inferenceEngine,
            model_gpu: mainGpuId,
            model_load: loadImmediately,
            model_context: contextSize,
            model_batch: batchSize,
            model_layer: gpuLayers,
            model_parallel: parallelSequences,
            model_memory: memoryMapping,
            model_perform: performWarmup
        };

        const postResp = await fetch("https://api.kolosal.ai/models", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (postResp.ok) {
            const result = await postResp.json();
            console.log("Model submitted successfully:", result);
            const popup = document.querySelector(".popup.form-model.active");
            if (popup) popup.classList.remove("active");
            Toast("Model submitted successfully!");
            setTimeout(() => {
                window.location.href = "/model/index.html";
            }, 1500);
        } else {
            console.error("Error submitting model:", postResp.status);
            Toast("Failed to submit model. Please try again.");
        }
    });
}

function CheckHFStatus() {
    const hfStatus = document.getElementById("HFStatus");
    if (!hfStatus) return;

    fetch("https://huggingface.co/api/models?limit=1", {
        method: "GET",
        headers: {
            "Authorization": "Bearer",
            "Accept": "application/json"
        }
    })
    .then(response => {
        if (response.ok) {
            hfStatus.dataset.state = "success";
            hfStatus.dataset.text = "CONNECTED";
            Badge();
        } else {
            hfStatus.dataset.state = "error";
            hfStatus.dataset.text = "DISCONNECTED";
            Badge();
        }
    })
    .catch(() => {
        hfStatus.dataset.state = "error";
        hfStatus.dataset.text = "DISCONNECTED";
        Badge();
    });
}

HeadInitiate();
Sidebar();
Select();
Badge();
CheckHFStatus();
ModelList();
SearchModel();
SubmitModel();