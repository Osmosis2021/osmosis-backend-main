// Category icon for a listing. Unknown or missing categories fall back to a neutral icon
// instead of crashing the page (webpack throws for a missing file).
export const industryIcon = (industry) => {
    if (industry) {
        try {
            // eslint-disable-next-line global-require, import/no-dynamic-require
            return require(`../assets/icons/${String(industry).toLowerCase()}.png`);
        } catch (e) {
            // fall through
        }
    }
    return require('../assets/icons/Sharing.png');
};
