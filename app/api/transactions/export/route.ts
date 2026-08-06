import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET() {
  try {
    await connectDB();
    const transactions = await Transaction.find({}).sort({ createdAt: -1 }).lean();

    const headers = [
      "Date", "Type", "Description", "Amount (INR)", "Currency",
      "Currency Rate", "Channel", "SKU", "Order ID",
      "COGS", "Platform Fee", "Ad Spend", "Net Margin",
      "Is Recurring", "Recurring Period", "GST Rate", "GST Amount",
    ];

    const rows = transactions.map((t) => {
      const totalDeductions = (t.cogs || 0) + (t.platformFee || 0) + (t.adSpend || 0);
      const netMargin = t.type === "income" ? t.amount - totalDeductions : 0;
      return [
        new Date(t.createdAt).toLocaleDateString("en-IN"),
        t.type,
        `"${(t.description || "").replace(/"/g, '""')}"`,
        t.amount,
        t.currency || "INR",
        t.currencyRate || 1,
        t.channel || "",
        t.sku || "",
        t.orderId || "",
        t.cogs || 0,
        t.platformFee || 0,
        t.adSpend || 0,
        netMargin,
        t.isRecurring ? "Yes" : "No",
        t.recurringPeriod || "",
        t.gstRate || 18,
        t.gstAmount || 0,
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const filename = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/transactions/export error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export transactions" },
      { status: 500 }
    );
  }
}
