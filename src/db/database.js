const mongoose = require('mongoose');
const mongo_uri = process.env.MONGO_URI;

const ConnectDB = async () => {
    try {
        await mongoose.connect(mongo_uri, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true
        });
    } catch (error) {
        throw error; // rethrow so index.js can catch
    }
};

module.exports = ConnectDB;