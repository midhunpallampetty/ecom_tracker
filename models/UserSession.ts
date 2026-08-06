import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserSession extends Document {
  sessionId: string;
  ipAddress: string;
  userLocation: {
    city: string;
    region: string;
    country: string;
    countryCode: string;
    latitude: number;
    longitude: number;
    isp?: string;
  };
  deviceInfo: {
    deviceType: "desktop" | "phone" | "tablet" | "other";
    os: string;
    browser: string;
    rawUserAgent: string;
  };
  authMethod: "biometric_fingerprint" | "biometric_face" | "master_password" | "unknown";
  status: "active" | "revoked" | "expired";
  lastActiveAt: Date;
  loginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSessionSchema: Schema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      default: "127.0.0.1",
    },
    userLocation: {
      city: { type: String, default: "Unknown" },
      region: { type: String, default: "Unknown" },
      country: { type: String, default: "Unknown" },
      countryCode: { type: String, default: "XX" },
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
      isp: { type: String, default: "" },
    },
    deviceInfo: {
      deviceType: {
        type: String,
        enum: ["desktop", "phone", "tablet", "other"],
        default: "desktop",
      },
      os: { type: String, default: "Unknown OS" },
      browser: { type: String, default: "Unknown Browser" },
      rawUserAgent: { type: String, default: "" },
    },
    authMethod: {
      type: String,
      enum: ["biometric_fingerprint", "biometric_face", "master_password", "unknown"],
      default: "master_password",
    },
    status: {
      type: String,
      enum: ["active", "revoked", "expired"],
      default: "active",
      index: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    loginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const UserSession: Model<IUserSession> =
  mongoose.models.UserSession ||
  mongoose.model<IUserSession>("UserSession", UserSessionSchema);

export default UserSession;
