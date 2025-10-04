/**
 * Content Type Detection and Validation Utilities
 * Handles Google Docs, YouTube, and other content types
 */

/**
 * Detects if a URL is a Google Docs URL
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's a Google Docs URL
 */
function isGoogleDocsUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return url.includes('docs.google.com') && (url.includes('/document/') || url.includes('/presentation/') || url.includes('/spreadsheets/'));
}

/**
 * Detects if a URL is a YouTube URL
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's a YouTube URL
 */
function isYouTubeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
}

/**
 * Converts YouTube URL to embeddable format
 * @param {string} url - The YouTube URL to convert
 * @returns {string|null} - The embeddable URL or null if invalid
 */
function convertToYouTubeEmbed(url) {
    if (!isYouTubeUrl(url)) return null;

    let videoId = '';

    // Extract video ID from different YouTube URL formats
    if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1].split('?')[0];
    }

    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
    }

    return null;
}

/**
 * Detects the content type of a URL
 * @param {string} url - The URL to analyze
 * @returns {string} - The detected content type ('google_docs', 'youtube')
 */
function detectContentType(url) {
    if (!url || typeof url !== 'string') return 'google_docs';

    if (isGoogleDocsUrl(url)) {
        return 'google_docs';
    } else if (isYouTubeUrl(url)) {
        return 'youtube';
    } else {
        return 'google_docs'; // Default to google_docs for unknown URLs
    }
}

/**
 * Validates a content URL based on its type
 * @param {string} url - The URL to validate
 * @param {string} contentType - The expected content type
 * @returns {object} - { isValid: boolean, message: string, processedUrl?: string }
 */
function validateContentUrl(url, contentType) {
    if (!url || typeof url !== 'string') {
        return { isValid: false, message: 'URL is required' };
    }

    const detectedType = detectContentType(url);

    if (contentType === 'google_docs') {
        if (!isGoogleDocsUrl(url)) {
            return { isValid: false, message: 'Please provide a valid Google Docs URL' };
        }
        return { isValid: true, message: 'Valid Google Docs URL', processedUrl: url };
    } else if (contentType === 'youtube') {
        if (!isYouTubeUrl(url)) {
            return { isValid: false, message: 'Please provide a valid YouTube URL' };
        }
        const embedUrl = convertToYouTubeEmbed(url);
        if (!embedUrl) {
            return { isValid: false, message: 'Invalid YouTube URL format' };
        }
        return { isValid: true, message: 'Valid YouTube URL', processedUrl: embedUrl };
    } else {
        return { isValid: false, message: 'Invalid content type. Only Google Docs and YouTube are supported.' };
    }
}

module.exports = {
    isGoogleDocsUrl,
    isYouTubeUrl,
    convertToYouTubeEmbed,
    detectContentType,
    validateContentUrl
};
