// Link previews for listing and artist pages.
//
// The app is a single-page React app, so every page is served as the same index.html and link
// previewers (Instagram, iMessage, WhatsApp...) don't run JavaScript: without this they would
// show the generic Studio Time card for every shared listing. For those crawlers only, this
// fetches the listing's title, details and photo from the API and puts them in the page's
// Open Graph tags. Everyone else gets the normal app, untouched.
//
// Needs REACT_APP_API_URL in Netlify's environment variables (available to functions).
import { isLinkCrawler, previewApiPath, renderTags, replacePreviewTags } from '../link-preview-tags.mjs';

const API_TIMEOUT_MS = 2500;

export default async (request, context) => {
    if (!isLinkCrawler(request.headers.get('user-agent'))) return undefined;

    const url = new URL(request.url);
    const apiPath = previewApiPath(url.pathname);
    const apiBase = Netlify.env.get('REACT_APP_API_URL');
    if (!apiPath || !apiBase) return undefined;

    let preview;
    try {
        const apiUrl = new URL(apiPath, apiBase.endsWith('/') ? apiBase : `${apiBase}/`);
        const res = await fetch(apiUrl, { signal: AbortSignal.timeout(API_TIMEOUT_MS) });
        if (!res.ok) return undefined;
        preview = await res.json();
    } catch (err) {
        // A slow or unavailable API just means the generic preview.
        console.error('[link-preview]', err.message);
        return undefined;
    }

    const page = await context.next();
    const html = await page.text();
    const headers = new Headers(page.headers);
    headers.delete('content-length');
    const tags = renderTags({ ...preview, url: `${url.origin}${url.pathname}`, fallbackImage: `${url.origin}/og-image.png` });
    return new Response(replacePreviewTags(html, tags), { status: page.status, headers });
};

export const config = { path: '/teachers/*' };
