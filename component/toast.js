export function Toast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-body">
            <h2 class="text-14px reguler">${message}</h2>
        </div>
    `;
    document.body.appendChild(toast);
    void toast.offsetWidth; 
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 1500);
}