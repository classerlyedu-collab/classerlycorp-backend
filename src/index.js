require('dotenv').config()
const port = process.env.PORT;
const app = require('./app');
const ConnectDB = require('./db/database');
const { initializeSocket } = require('./socket');

ConnectDB()
    .then(() => {
        const server = app.listen(port, () => {
            console.log("Server is running at port", port);
        });

        // Initialize Socket.io
        initializeSocket(server);
    }).catch((error) => {
        console.error("Database connection error:", error.message);
    })





