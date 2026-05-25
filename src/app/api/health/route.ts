import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDb from "@/lib/db";

export async function GET() {
  try {

    await connectDb();

    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB not connected");
    }

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database unavailable");
    }

    await db.admin().ping();

    return NextResponse.json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
    });

  } catch (error: unknown) {

    const message =
      error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        status: "error",
        error: message,
      },
      { status: 500 }
    );
  }
}