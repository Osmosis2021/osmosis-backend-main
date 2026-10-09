// Social apps open links in their own embedded browser. Google blocks sign-in there
// ("disallowed_useragent"), so we warn people and point them to email sign-in instead.
const IN_APP_BROWSER_PATTERN = /Instagram|FBAN|FBAV|FB_IAB|Messenger|Line\/|TikTok|musical_ly|Bytedance|Snapchat|Twitter|LinkedInApp|Pinterest/i;

export const getInAppBrowserName = (userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '') => {
    if (!IN_APP_BROWSER_PATTERN.test(userAgent)) return null;
    if (/Instagram/i.test(userAgent)) return 'Instagram';
    if (/FBAN|FBAV|FB_IAB|Messenger/i.test(userAgent)) return 'Facebook';
    if (/TikTok|musical_ly|Bytedance/i.test(userAgent)) return 'TikTok';
    if (/Snapchat/i.test(userAgent)) return 'Snapchat';
    return 'this app';
};
