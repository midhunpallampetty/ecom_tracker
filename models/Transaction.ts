import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
  amount: number;
  type: "income" | "expense";
  description: string;
  channel?: string;
  sku?: string;
  cogs?: number;
  platformFee?: number;
  adSpend?: number;
  gstRate?: number;
  gstAmount?: number;
  orderId?: string;
  currency?: string;
  currencyRate?: number;
  isRecurring?: boolean;
  recurringPeriod?: "weekly" | "monthly" | "quarterly";
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: [true, "Type is required"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [200, "Description cannot exceed 200 characters"],
      trim: true,
    },
    channel: {
      type: String,
      default: "",
      trim: true,
    },
    sku: {
      type: String,
      default: "",
      trim: true,
    },
    cogs: {
      type: Number,
      default: 0,
      min: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    adSpend: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstRate: {
      type: Number,
      default: 18,
      min: 0,
    },
    gstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    orderId: {
      type: String,
      default: "",
      trim: true,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    currencyRate: {
      type: Number,
      default: 1,
      min: 0,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPeriod: {
      type: String,
      enum: ["weekly", "monthly", "quarterly", ""],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
