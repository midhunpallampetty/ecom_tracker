import mongoose from "mongoose";

const DEFAULT_SECONDARY_URI =
  "mongodb+srv://midhunpallampetty_db_user:4VKivYp8ugIjZEpB@cluster0.qupkfqz.mongodb.net/finance_tracker_backup?retryWrites=true&w=majority&appName=Cluster0";

// Global cache for secondary connection
declare global {
  // eslint-disable-next-line no-var
  var secondaryMongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

let cached = global.secondaryMongoose;

if (!cached) {
  cached = global.secondaryMongoose = { conn: null, promise: null };
}

export async function connectSecondaryDB(): Promise<mongoose.Connection> {
  const uri = process.env.SECONDARY_MONGODB_URI || DEFAULT_SECONDARY_URI;

  if (cached.conn && cached.conn.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .createConnection(uri, opts)
      .asPromise()
      .then((connection) => {
        return connection;
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

export default connectSecondaryDB;
