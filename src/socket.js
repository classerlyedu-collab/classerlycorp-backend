const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
// const ChatSession = require('./models/chat'); // Removed - chatbot no longer needed

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

            // Handle token format with 'user' object
            socket.userId = decoded.user?._id || decoded._id;
            socket.userType = decoded.user?.userType || decoded.userType;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        // Join the user's presence room when they connect
        if (socket.userId) {
            socket.join(`user-${socket.userId}`);
            socket.join(`notifications-${socket.userId}`);

            // Broadcast that user is online
            socket.broadcast.emit('presence-changed', {
                userId: socket.userId,
                status: 'online'
            });
        }

        // Set up disconnect handler for offline status
        socket.on('disconnect', () => {
            if (socket.userId) {
                socket.broadcast.emit('presence-changed', {
                    userId: socket.userId,
                    status: 'offline'
                });
                socket.leave(`user-${socket.userId}`);
                socket.leave(`notifications-${socket.userId}`);
            }
        });

        // Join a specific chat room
        socket.on('join-chat', (sessionId) => {
            socket.join(`chat-${sessionId}`);
        });

        // Leave a chat room
        socket.on('leave-chat', (sessionId) => {
            socket.leave(`chat-${sessionId}`);
        });

        // Handle new message
        socket.on('new-message', async (data) => {
            try {
                const { sessionId, message, senderId } = data;

                // Emit to all users in the chat room
                io.to(`chat-${sessionId}`).emit('message-received', {
                    sessionId,
                    message,
                    senderId,
                    timestamp: new Date()
                });
            } catch (error) {
                // Handle error silently
            }
        });

        // Handle typing indicator
        socket.on('typing', (data) => {
            socket.to(`chat-${data.sessionId}`).emit('user-typing', {
                sessionId: data.sessionId,
                userId: socket.userId
            });
        });

        // Handle stop typing
        socket.on('stop-typing', (data) => {
            socket.to(`chat-${data.sessionId}`).emit('user-stop-typing', {
                sessionId: data.sessionId,
                userId: socket.userId
            });
        });

        // Join a specific comment room (HR-Admin <-> Employee)
        socket.on('join-comment-room', (data) => {
            const { hrAdminId, employeeId } = data;
            const roomName = `comment-${hrAdminId}-${employeeId}`;
            // Join a unique room for the HR-Admin and Employee conversation
            socket.join(roomName);
        });

        // Leave a comment room
        socket.on('leave-comment-room', (data) => {
            const { hrAdminId, employeeId } = data;
            socket.leave(`comment-${hrAdminId}-${employeeId}`);
        });

        // Join notifications room for receiving notification badges
        socket.on('join-notifications', (data) => {
            socket.join(`notifications-${data.userId}`);
        });

        // Leave notifications room
        socket.on('leave-notifications', (data) => {
            socket.leave(`notifications-${data.userId}`);
        });

        // Handle presence status requests and updates
        socket.on('check-presence', async (data) => {
            try {
                const { userId } = data;
                // First determine user presence state
                const currentTime = new Date();
                let presenceStatus = 'offline'; // Default to offline

                // Check if the user socket is connected in the clients collection
                // You could enhance this by checking database records for more accurate tracking
                for (let room of socket.rooms) {
                    if (room.includes(`notifications-${userId}`)) {
                        presenceStatus = 'online';
                        break;
                    }
                }

                socket.emit('presence-changed', { userId, status: presenceStatus });

                // Also broadcast to others monitoring this user
                socket.broadcast.to(`user-${userId}`).emit('presence-changed', {
                    userId,
                    status: presenceStatus
                });
            } catch (error) {
                console.error('Presence check error:', error);
            }
        });

        // Handle presence status broadcasting
        socket.on('update-presence', (data) => {
            try {
                const { status } = data;
                socket.userId && socket.broadcast.emit('presence-changed', {
                    userId: socket.userId,
                    status
                });
            } catch (error) {
                console.error('Presence update error:', error);
            }
        });

        // Handle new comment
        socket.on('new-comment', async (data) => {
            try {
                const { hrAdminId, employeeId, comment } = data;

                // Emit to all users in the comment room
                io.to(`comment-${hrAdminId}-${employeeId}`).emit('comment-received', {
                    comment,
                    timestamp: new Date()
                });
            } catch (error) {
                console.error('Socket error handling new comment:', error);
            }
        });

        socket.on('disconnect', () => {
            // User disconnected
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

module.exports = { initializeSocket, getIO };
