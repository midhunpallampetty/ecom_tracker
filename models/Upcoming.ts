import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUpcoming extends Document {
  amount: number;
  type: "income" | "expense";
  description: string;
  expectedDate: Date;
  createdAt: Date;
}

const UpcomingSchema: Schema = new Schema(
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
    expectedDate: {
      type: Date,
      required: [true, "Expected date is required"],
    },
  },
  { timestamps: true }
);

const Upcoming: Model<IUpcoming> =
  mongoose.models.Upcoming ||
  mongoose.model<IUpcoming>("Upcoming", UpcomingSchema);

export default Upcoming;
