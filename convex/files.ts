import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Generate an upload URL for the client to POST a file to
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated to upload files");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// Convert a storage ID to a public URL
export const getUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Failed to get URL for storage ID");
    }
    return url;
  },
});
