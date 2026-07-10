const DEFAULT_FAVICON = '/logo.png';

const withCacheBust = (url) => {
    if (!url) return DEFAULT_FAVICON;
    if (url.includes('?')) return url;
    return `${url}?v=${Date.now()}`;
};

export const setSiteFavicon = (url = DEFAULT_FAVICON) => {
    const href = withCacheBust(url || DEFAULT_FAVICON);

    document
        .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
        .forEach((node) => node.remove());

    const icon = document.createElement('link');
    icon.rel = 'icon';
    icon.type = 'image/png';
    icon.href = href;
    document.head.appendChild(icon);

    const apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    apple.href = href;
    document.head.appendChild(apple);
};

export const getDefaultFavicon = () => DEFAULT_FAVICON;
