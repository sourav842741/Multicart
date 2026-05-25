import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB not connected");
    }

    if (!mongoose.connection.db) {
      throw new Error("MongoDB database connection unavailable");
    }

    await mongoose.connection.db.admin().ping();

    return NextResponse.json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        status: "error",
        error: message,
      },
      { status: 500 },
    );
  }
}
