export function HeadInitiate() {
    const iconSet = document.createElement("link");
    iconSet.rel = "stylesheet";
    iconSet.href = "https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css";
    document.head.appendChild(iconSet);

    const appleTouchIcon = document.createElement("link");
    appleTouchIcon.rel = "apple-touch-icon";
    appleTouchIcon.sizes = "180x180";
    appleTouchIcon.href = "/apple-touch-icon.png";
    document.head.appendChild(appleTouchIcon);

    const favicon32 = document.createElement("link");
    favicon32.rel = "icon";
    favicon32.type = "image/png";
    favicon32.sizes = "32x32";
    favicon32.href = "/favicon-32x32.png";
    document.head.appendChild(favicon32);

    const favicon16 = document.createElement("link");
    favicon16.rel = "icon";
    favicon16.type = "image/png";
    favicon16.sizes = "16x16";
    favicon16.href = "/favicon-16x16.png";
    document.head.appendChild(favicon16);
}