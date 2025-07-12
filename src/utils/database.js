import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://hoanghieutb97:r8piz5uGp6OKcOGa@cluster0.elvs6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: 'theu'
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function getDB() {
  const mongoose = await connectToDatabase();
  return mongoose.connection.db;
} 