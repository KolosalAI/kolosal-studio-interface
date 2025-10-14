export function Popup() {
    document.addEventListener("click", (e) => {
        if (e.target.closest(".popup-content")) return;

        const trigger = e.target.closest("[data-popup]");
        if (!trigger) return;

        const popupId = trigger.getAttribute("data-popup");
        const popup = document.querySelector(`.popup[data-popup="${popupId}"]`);

        document.querySelectorAll(".popup.active").forEach(activePopup => {
            if (activePopup !== popup) {
                activePopup.classList.remove("active");
            }
        });

        if (popup) {
            popup.classList.toggle("active");
        }
    });

    document.addEventListener("click", (e) => {
        const closeBtn = e.target.closest(".ClosePopup");
        if (closeBtn) {
            const popup = closeBtn.closest(".popup");
            if (popup) popup.classList.remove("active");
        }
    });

    document.addEventListener("click", (e) => {
        const popupContent = e.target.closest(".popup .popup-content");
        if (popupContent) e.stopPropagation();
    });
}