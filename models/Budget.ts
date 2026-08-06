import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBudget extends Document {
  month: string; // Format: "2026-08"
  incomeTarget: number;
  expenseLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema: Schema = new Schema(
  {
    month: {
      type: String,
      required: [true, "Month is required"],
      trim: true,
      unique: true,
    },
    incomeTarget: {
      type: Number,
      default: 0,
      min: 0,
    },
    expenseLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const Budget: Model<IBudget> =
  mongoose.models.Budget ||
  mongoose.model<IBudget>("Budget", BudgetSchema);

export default Budget;
