import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDb = async () => {
  const mongoDbUrl = process.env.MONGODB_URL;
  if (!mongoDbUrl) {
    throw new Error(
      "MONGODB_URL is not defined in environment variables. Please check your .env or .env.local file."
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(mongoDbUrl)
      .then((conn) => conn.connection);
  }

  try {
    const conn = await cached.promise;
    cached.conn = conn;
    return conn;
  } catch (error) {
    cached.promise = null;
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

export default connectDb;