import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Upcoming from "@/models/Upcoming";

export async function GET() {
  try {
    await connectDB();
    const items = await Upcoming.find({})
      .sort({ expectedDate: 1 })
      .lean();
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("GET /api/upcoming error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch upcoming transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { amount, type, description, expectedDate } = body;

    if (!amount || !type || !expectedDate) {
      return NextResponse.json(
        { success: false, error: "Amount, type and expected date are required" },
        { status: 400 }
      );
    }

    if (!["income", "expense"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Type must be 'income' or 'expense'" },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    const item = await Upcoming.create({
      amount: parsedAmount,
      type,
      description: description?.trim() || "",
      expectedDate: new Date(expectedDate),
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/upcoming error:", error);
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create upcoming transaction" },
      { status: 500 }
    );
  }
}
