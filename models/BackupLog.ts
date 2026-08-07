import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICollectionBackupDetail {
  name: string;
  count: number;
  syncedCount: number;
  status: "synced" | "up_to_date" | "failed";
}

export interface IBackupLog extends Document {
  backupType: "manual" | "cron";
  status: "completed" | "already_up_to_date" | "failed";
  totalCollections: number;
  totalDocumentsCopied: number;
  collectionDetails: ICollectionBackupDetail[];
  errorMessage?: string;
  startedAt: Date;
  completedAt: Date;
}

const BackupLogSchema: Schema = new Schema(
  {
    backupType: {
      type: String,
      enum: ["manual", "cron"],
      required: true,
    },
    status: {
      type: String,
      enum: ["completed", "already_up_to_date", "failed"],
      required: true,
    },
    totalCollections: {
      type: Number,
      default: 0,
    },
    totalDocumentsCopied: {
      type: Number,
      default: 0,
    },
    collectionDetails: [
      {
        name: { type: String, required: true },
        count: { type: Number, default: 0 },
        syncedCount: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ["synced", "up_to_date", "failed"],
          default: "synced",
        },
      },
    ],
    errorMessage: {
      type: String,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const BackupLog: Model<IBackupLog> =
  mongoose.models.BackupLog ||
  mongoose.model<IBackupLog>("BackupLog", BackupLogSchema);

export default BackupLog;
