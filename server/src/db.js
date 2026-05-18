import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);

  console.log(`MongoDB connected: ${mongoose.connection.name}`);
  return mongoose.connection;
}
