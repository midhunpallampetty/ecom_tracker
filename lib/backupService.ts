import connectDB from "./mongodb";
import connectSecondaryDB from "./secondaryDb";
import BackupLog, { ICollectionBackupDetail } from "@/models/BackupLog";

export interface BackupResult {
  success: boolean;
  status: "completed" | "already_up_to_date" | "failed";
  isUpToDate: boolean;
  totalCollections: number;
  totalDocumentsCopied: number;
  collectionDetails: ICollectionBackupDetail[];
  backupType: "manual" | "cron";
  durationMs: number;
  error?: string;
  timestamp: string;
}

/**
 * Executes a full backup from Primary MongoDB DB to Secondary MongoDB DB.
 */
export async function performBackup(
  backupType: "manual" | "cron" = "manual"
): Promise<BackupResult> {
  const startedAt = new Date();
  const startTimeMs = Date.now();

  let totalCollections = 0;
  let totalDocumentsCopied = 0;
  const collectionDetails: ICollectionBackupDetail[] = [];
  let isAnyCollectionUpdated = false;

  try {
    // 1. Connect to both Primary and Secondary DBs
    const primaryMongoose = await connectDB();
    const secondaryConn = await connectSecondaryDB();

    const primaryDb = primaryMongoose.connection.db;
    const secondaryDb = secondaryConn.db;

    if (!primaryDb) {
      throw new Error("Primary DB connection is not ready");
    }
    if (!secondaryDb) {
      throw new Error("Secondary DB connection is not ready");
    }

    // 2. Fetch list of collections from Primary DB
    const rawCollections = await primaryDb.listCollections().toArray();
    const collectionsToBackup = rawCollections
      .map((c) => c.name)
      .filter((name) => !name.startsWith("system.") && name !== "backuplogs"); // don't infinitely recurse backuplogs

    totalCollections = collectionsToBackup.length;

    // 3. Process each collection
    for (const colName of collectionsToBackup) {
      const primaryCol = primaryDb.collection(colName);
      const secondaryCol = secondaryDb.collection(colName);

      const primaryDocs = await primaryCol.find({}).toArray();
      const primaryCount = primaryDocs.length;

      const secondaryCount = await secondaryCol.countDocuments({});

      // Simple comparison check: check if counts match and compare last updated / document IDs
      const secondaryDocs = await secondaryCol.find({}).toArray();

      let isIdentical = false;
      if (primaryCount === secondaryCount) {
        // Compare document string representations or JSON hashes
        const primaryJson = JSON.stringify(primaryDocs.map((d) => ({ ...d, _id: d._id.toString() })).sort((a,b) => String(a._id).localeCompare(String(b._id))));
        const secondaryJson = JSON.stringify(secondaryDocs.map((d) => ({ ...d, _id: d._id.toString() })).sort((a,b) => String(a._id).localeCompare(String(b._id))));
        
        if (primaryJson === secondaryJson) {
          isIdentical = true;
        }
      }

      if (isIdentical) {
        collectionDetails.push({
          name: colName,
          count: primaryCount,
          syncedCount: 0,
          status: "up_to_date",
        });
      } else {
        isAnyCollectionUpdated = true;
        
        // Synchronize collection:
        // Clear secondary collection and bulk insert or bulk replace
        if (primaryDocs.length > 0) {
          const bulkOps = primaryDocs.map((doc) => ({
            replaceOne: {
              filter: { _id: doc._id },
              replacement: doc,
              upsert: true,
            },
          }));

          await secondaryCol.bulkWrite(bulkOps);

          // Remove any orphaned documents in secondary DB that no longer exist in primary DB
          const primaryIds = primaryDocs.map((d) => d._id);
          await secondaryCol.deleteMany({ _id: { $nin: primaryIds } });
        } else {
          // Primary is empty, clear secondary
          await secondaryCol.deleteMany({});
        }

        totalDocumentsCopied += primaryCount;
        collectionDetails.push({
          name: colName,
          count: primaryCount,
          syncedCount: primaryCount,
          status: "synced",
        });
      }
    }

    const completedAt = new Date();
    const finalStatus = isAnyCollectionUpdated ? "completed" : "already_up_to_date";
    const durationMs = Date.now() - startTimeMs;

    // Log backup in primary DB BackupLog collection
    try {
      await BackupLog.create({
        backupType,
        status: finalStatus,
        totalCollections,
        totalDocumentsCopied,
        collectionDetails,
        startedAt,
        completedAt,
      });
    } catch {
      // Non-blocking log failure
    }

    return {
      success: true,
      status: finalStatus,
      isUpToDate: !isAnyCollectionUpdated,
      totalCollections,
      totalDocumentsCopied,
      collectionDetails,
      backupType,
      durationMs,
      timestamp: completedAt.toISOString(),
    };
  } catch (error: any) {
    const completedAt = new Date();
    const durationMs = Date.now() - startTimeMs;

    // Log failure
    try {
      await BackupLog.create({
        backupType,
        status: "failed",
        totalCollections,
        totalDocumentsCopied,
        collectionDetails,
        errorMessage: error?.message || "Unknown backup error",
        startedAt,
        completedAt,
      });
    } catch {
      // Non-blocking
    }

    return {
      success: false,
      status: "failed",
      isUpToDate: false,
      totalCollections,
      totalDocumentsCopied,
      collectionDetails,
      backupType,
      durationMs,
      error: error?.message || "Backup execution failed",
      timestamp: completedAt.toISOString(),
    };
  }
}
