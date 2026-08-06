import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid transaction ID" },
        { status: 400 }
      );
    }

    await connectDB();
    const body = await request.json();

    const {
      amount, description, channel, sku, cogs, platformFee, adSpend,
      gstRate, gstAmount, orderId, currency, currencyRate, isRecurring, recurringPeriod,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (amount !== undefined) {
      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed <= 0)
        return NextResponse.json({ success: false, error: "Amount must be a positive number" }, { status: 400 });
      updateData.amount = parsed;
    }
    if (description !== undefined) updateData.description = String(description).trim();
    if (channel     !== undefined) updateData.channel     = String(channel).trim();
    if (sku         !== undefined) updateData.sku         = String(sku).trim();
    if (orderId     !== undefined) updateData.orderId     = String(orderId).trim();
    if (currency    !== undefined) updateData.currency    = String(currency).trim();
    if (currencyRate !== undefined) updateData.currencyRate = parseFloat(currencyRate) || 1;
    if (cogs        !== undefined) updateData.cogs        = parseFloat(cogs) || 0;
    if (platformFee !== undefined) updateData.platformFee = parseFloat(platformFee) || 0;
    if (adSpend     !== undefined) updateData.adSpend     = parseFloat(adSpend) || 0;
    if (gstRate     !== undefined) updateData.gstRate     = parseFloat(gstRate) || 18;
    if (gstAmount   !== undefined) updateData.gstAmount   = parseFloat(gstAmount) || 0;
    if (isRecurring !== undefined) updateData.isRecurring = Boolean(isRecurring);
    if (recurringPeriod !== undefined) updateData.recurringPeriod = recurringPeriod || "";

    const updated = await Transaction.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/transactions/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid transaction ID" },
        { status: 400 }
      );
    }

    await connectDB();
    const transaction = await Transaction.findByIdAndDelete(id);

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
