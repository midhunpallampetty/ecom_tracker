import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Budget from "@/models/Budget";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

    const budget = await Budget.findOne({ month }).lean();
    return NextResponse.json({ success: true, data: budget || { month, incomeTarget: 0, expenseLimit: 0 } });
  } catch (error) {
    console.error("GET /api/budget error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch budget" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { month, incomeTarget, expenseLimit } = body;

    if (!month) {
      return NextResponse.json({ success: false, error: "Month is required (format: YYYY-MM)" }, { status: 400 });
    }

    const budget = await Budget.findOneAndUpdate(
      { month },
      {
        incomeTarget: parseFloat(incomeTarget) || 0,
        expenseLimit: parseFloat(expenseLimit) || 0,
      },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    return NextResponse.json({ success: true, data: budget }, { status: 200 });
  } catch (error) {
    console.error("POST /api/budget error:", error);
    return NextResponse.json({ success: false, error: "Failed to save budget" }, { status: 500 });
  }
}
