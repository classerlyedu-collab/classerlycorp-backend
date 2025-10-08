const cloud = require('../config/cloudnaryconfig');

/**
 * Extract Cloudinary URLs from HTML content
 * @param {string} html - HTML content to parse
 * @returns {Array} Array of Cloudinary URLs
 */
const extractCloudinaryUrls = (html) => {
    if (!html || typeof html !== 'string') return [];

    const urls = [];

    // Match image src attributes
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
        if (match[1] && match[1].includes('cloudinary.com')) {
            urls.push(match[1]);
        }
    }

    // Match video src attributes
    const videoRegex = /<video[^>]*>[\s\S]*?<source[^>]+src=["']([^"']+)["'][^>]*>[\s\S]*?<\/video>/gi;
    while ((match = videoRegex.exec(html)) !== null) {
        if (match[1] && match[1].includes('cloudinary.com')) {
            urls.push(match[1]);
        }
    }

    // Match direct video src
    const directVideoRegex = /<video[^>]+src=["']([^"']+)["']/gi;
    while ((match = directVideoRegex.exec(html)) !== null) {
        if (match[1] && match[1].includes('cloudinary.com')) {
            urls.push(match[1]);
        }
    }

    return [...new Set(urls)]; // Remove duplicates
};

/**
 * Extract public_id from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} Public ID or null if not found
 */
const extractPublicId = (url) => {
    if (!url || typeof url !== 'string') return null;

    try {
        // Example URL: https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg
        // or: https://res.cloudinary.com/demo/video/upload/v1312461204/folder/sample.mp4

        // Decode URL to handle spaces and special characters
        const decodedUrl = decodeURIComponent(url);
        const urlObj = new URL(decodedUrl);
        const pathname = urlObj.pathname;

        // Remove /cloudname/resource_type/upload/version/ parts
        const parts = pathname.split('/upload/');
        if (parts.length < 2) return null;

        let publicIdWithExtension = parts[1];

        // Remove version if exists (starts with v followed by numbers)
        publicIdWithExtension = publicIdWithExtension.replace(/^v\d+\//, '');

        // Remove file extension
        const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');

        // Decode again to ensure spaces are properly handled
        return decodeURIComponent(publicId);
    } catch (error) {
        return null;
    }
};

/**
 * Delete a file from Cloudinary
 * @param {string} url - Cloudinary URL
 * @returns {Promise<boolean>} Success status
 */
const deleteFromCloudinary = async (url) => {
    try {
        const publicId = extractPublicId(url);
        if (!publicId) {
            return false;
        }

        // Determine resource type (image or video)
        const isVideo = url.includes('/video/upload/');
        const resourceType = isVideo ? 'video' : 'image';

        const result = await cloud.uploader.destroy(publicId, {
            resource_type: resourceType,
            invalidate: true // Invalidate CDN cache
        });

        if (result.result === 'ok') {
            return true;
        } else if (result.result === 'not found') {
            return true; // Consider this as success since the file doesn't exist
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
};

/**
 * Delete multiple files from Cloudinary
 * @param {Array<string>} urls - Array of Cloudinary URLs
 * @returns {Promise<Object>} Results object with success and failure counts
 */
const deleteMultipleFromCloudinary = async (urls) => {
    const results = {
        success: 0,
        failed: 0,
        total: urls.length
    };

    if (!urls || urls.length === 0) {
        return results;
    }

    const deletePromises = urls.map(url => deleteFromCloudinary(url));
    const outcomes = await Promise.allSettled(deletePromises);

    outcomes.forEach((outcome) => {
        if (outcome.status === 'fulfilled' && outcome.value) {
            results.success++;
        } else {
            results.failed++;
        }
    });

    return results;
};

/**
 * Compare two HTML contents and return URLs that were removed
 * @param {string} oldHtml - Original HTML content
 * @param {string} newHtml - Updated HTML content
 * @returns {Array<string>} Array of removed Cloudinary URLs
 */
const findRemovedUrls = (oldHtml, newHtml) => {
    const oldUrls = extractCloudinaryUrls(oldHtml);
    const newUrls = extractCloudinaryUrls(newHtml);

    // Find URLs that exist in old but not in new
    const removedUrls = oldUrls.filter(url => !newUrls.includes(url));

    return removedUrls;
};

module.exports = {
    extractCloudinaryUrls,
    extractPublicId,
    deleteFromCloudinary,
    deleteMultipleFromCloudinary,
    findRemovedUrls
};
