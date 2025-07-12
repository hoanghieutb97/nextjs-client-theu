const { MongoClient } = require('mongodb');
const { DATABASE } = require('../constants');

let client = null;
let db = null;

const connectDB = async () => {
    try {
        if (client) {
            console.log('Database already connected');
            return db;
        }

        client = new MongoClient(DATABASE.MONGODB_URI);
        await client.connect();
        
        db = client.db('theu');
        console.log(`MongoDB Connected: ${client.topology.s.state}`);
        
        return db;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const getDB = () => {
    if (!db) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return db;
};

const closeDB = async () => {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('Database connection closed');
    }
};

module.exports = { connectDB, getDB, closeDB }; 