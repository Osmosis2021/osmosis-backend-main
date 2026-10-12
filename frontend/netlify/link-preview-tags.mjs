// Helpers for the link-preview edge function (netlify/edge-functions/link-preview.js).
// Plain ES module with no Netlify or Deno APIs, so it can be checked with Node too.

// Services that fetch a page to build a link preview. Instagram (DMs, link stickers) uses
// facebookexternalhit; iMessage sends facebookexternalhit/Twitterbot. Not matched: Instagram's
// own in-app browser, which is a real person and gets the normal app.
const CRAWLER_PATTERN = /facebookexternalhit|facebot|twitterbot|slackbot|discordbot|whatsapp|telegrambot|linkedinbot|pinterest|redditbot|skypeuripreview|embedly|vkshare|tumblr|bitlybot|google-inspectiontool|snapchat/i;

export const isLinkCrawler = (userAgent) => CRAWLER_PATTERN.test(userAgent || '');

/** API path with the preview for a page, or null if the page has no special preview. */
export const previewApiPath = (pathname) => {
    const parts = String(pathname || '').split('/').filter(Boolean).map((part) => {
        try {
            return decodeURIComponent(part);
        } catch (err) {
            return part;
        }
    });
    if (parts[0] !== 'teachers') return null;
    if (parts.length === 3 && /^[a-f0-9]{24}$/i.test(parts[2])) return `course/preview/listing/${parts[2]}`;
    if (parts.length === 2 && parts[1]) return `course/preview/host/${encodeURIComponent(parts[1])}`;
    return null;
};

const escapeHtml = (text) => String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** The <title> and meta tags for a preview from the API. */
export const renderTags = ({ title, description, image, imageAlt, type, url, fallbackImage }) => {
    const usingFallback = !image;
    const tags = [
        `<title>${escapeHtml(title)}</title>`,
        `<meta name="description" content="${escapeHtml(description)}"/>`,
        '<meta property="og:site_name" content="Studio Time"/>',
        `<meta property="og:type" content="${escapeHtml(type || 'website')}"/>`,
        `<meta property="og:title" content="${escapeHtml(title)}"/>`,
        `<meta property="og:description" content="${escapeHtml(description)}"/>`,
        `<meta property="og:url" content="${escapeHtml(url)}"/>`,
        `<meta property="og:image" content="${escapeHtml(image || fallbackImage)}"/>`,
        `<meta property="og:image:alt" content="${escapeHtml(imageAlt || title)}"/>`,
        '<meta name="twitter:card" content="summary_large_image"/>',
    ];
    // Cloudinary images are cropped to 1200x630 by the API; so is the fallback.
    if (usingFallback || /w_1200,h_630/.test(image)) {
        tags.push('<meta property="og:image:width" content="1200"/>', '<meta property="og:image:height" content="630"/>');
    }
    return tags.join('');
};

// The site-wide defaults from public/index.html (after the production build minifies it).
const DEFAULT_TAG_PATTERN = /<title>[\s\S]*?<\/title>|<meta\s+(?:property="og:[^"]*"|name="(?:twitter:[^"]*|description)")[^>]*>/gi;

/** Swaps the default title and preview tags in the page for the page-specific ones. */
export const replacePreviewTags = (html, tags) => {
    if (!html.includes('</head>')) return html;
    return html.replace(DEFAULT_TAG_PATTERN, '').replace('</head>', `${tags}</head>`);
};
