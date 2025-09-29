
const cloudinary = require("cloudinary").v2;

// Validate required environment variables
const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.warn('⚠️  Missing required Cloudinary environment variables:', missingVars);
    console.warn('Please check your .env file and ensure all Cloudinary credentials are set.');
    console.warn('Upload functionality will not work until these are configured.');
} else {
    // Only configure and test if all variables are present
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true // Use HTTPS
    });

    // Test the configuration asynchronously
    cloudinary.api.ping()
        .then(result => {
            console.log('✅ Cloudinary connection successful:', result);
        })
        .catch(error => {
            console.error('❌ Cloudinary connection failed:', error);
        });
}

module.exports = cloudinary;

