import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET() {
  try {
    await connectDB();
    const transactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { amount, type, description, channel, sku, cogs, platformFee, adSpend } = body;

    // Validate required fields
    if (!amount || !type) {
      return NextResponse.json(
        { success: false, error: "Amount and type are required" },
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

    const transaction = await Transaction.create({
      amount: parsedAmount,
      type,
      description: description?.trim() || "",
      channel: channel?.trim() || "",
      sku: sku?.trim() || "",
      cogs: typeof cogs === "number" && cogs >= 0 ? cogs : 0,
      platformFee: typeof platformFee === "number" && platformFee >= 0 ? platformFee : 0,
      adSpend: typeof adSpend === "number" && adSpend >= 0 ? adSpend : 0,
    });

    return NextResponse.json(
      { success: true, data: transaction },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/transactions error:", error);
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
