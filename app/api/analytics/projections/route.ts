import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { analyzeDataAndGenerateProjections } from "@/lib/projectionEngine";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const growthMult = parseFloat(searchParams.get("multiplier") || "1");
    const adScaling = parseFloat(searchParams.get("adScaling") || "1");

    const transactions = await Transaction.find({}).sort({ createdAt: 1 }).lean();

    const formattedTransactions = transactions.map((t: any) => ({
      _id: t._id.toString(),
      amount: t.amount,
      type: t.type,
      description: t.description,
      channel: t.channel,
      sku: t.sku,
      cogs: t.cogs || 0,
      platformFee: t.platformFee || 0,
      adSpend: t.adSpend || 0,
      createdAt: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
    }));

    const analysis = analyzeDataAndGenerateProjections(
      formattedTransactions,
      isNaN(growthMult) ? 1 : growthMult,
      isNaN(adScaling) ? 1 : adScaling
    );

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    console.error("Error in AI Projections API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate growth projections" },
      { status: 500 }
    );
  }
}
