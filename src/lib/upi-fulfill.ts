import {
  purchaseExactPixel,
  purchasePixelCount,
} from "./purchase";
import {
  getUpiSubmissionById,
  updateUpiSubmission,
  type UpiSubmission,
} from "./upi-submissions";
import { validateBulkPurchase, validateSinglePurchase } from "./payments";

export async function fulfillUpiSubmission(submissionId: string): Promise<{
  submission: UpiSubmission;
  purchaseId: string;
}> {
  const sub = await getUpiSubmissionById(submissionId);
  if (!sub) throw new Error("Submission not found.");
  if (sub.status === "fulfilled") {
    throw new Error("Already fulfilled.");
  }
  if (sub.status === "rejected") {
    throw new Error("Submission was rejected.");
  }

  let receipt;
  if (sub.type === "single") {
    if (sub.x === undefined || sub.y === undefined) {
      throw new Error("Invalid submission coordinates.");
    }
    await validateSinglePurchase(sub.side, sub.x, sub.y);
    receipt = await purchaseExactPixel(sub.side, sub.x, sub.y);
  } else {
    if (!sub.count) throw new Error("Invalid bulk count.");
    await validateBulkPurchase(sub.side, sub.count);
    receipt = await purchasePixelCount(sub.side, sub.count);
  }

  const updated = await updateUpiSubmission(submissionId, {
    status: "fulfilled",
    fulfilledAt: new Date().toISOString(),
    purchaseId: receipt.id,
  });

  if (!updated) throw new Error("Could not update submission.");

  return { submission: updated, purchaseId: receipt.id };
}
