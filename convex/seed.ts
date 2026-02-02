import { mutation } from "./_generated/server";

export const seedInviteCodes = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if codes already exist
    const existing = await ctx.db.query("inviteCodes").first();
    if (existing) {
      return { message: "Invite codes already seeded" };
    }

    const codes = [
      { code: "NOMAD2024", maxUses: 100 },
      { code: "DETOUR", maxUses: 50 },
      { code: "WANDERER", maxUses: 50 },
      { code: "EXPLORER", maxUses: 25 },
      { code: "DEVTEST", maxUses: 1000 },
    ];

    for (const { code, maxUses } of codes) {
      await ctx.db.insert("inviteCodes", {
        code,
        maxUses,
        currentUses: 0,
        isActive: true,
        createdAt: Date.now(),
      });
    }

    return { message: "Seeded invite codes successfully" };
  },
});
