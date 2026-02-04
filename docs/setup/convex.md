# Convex Setup Guide

This guide covers setting up Convex backend for Detour.

## Create Convex Project

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Click "Create a project"
3. Name it "detour" (or your preferred name)
4. Copy the deployment URL

## Local Development Setup

### 1. Install Convex CLI

```bash
npm install convex
```

### 2. Initialize Convex

```bash
npx convex init
```

This creates:
- `convex/` folder for backend code
- Updates `package.json` with Convex scripts

### 3. Configure Environment

Create `.env.local`:

```bash
CONVEX_DEPLOYMENT=dev:your-project-name
EXPO_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

### 4. Start Development Server

```bash
npx convex dev
```

This watches for changes and syncs to your development deployment.

## Configure Clerk Authentication

### 1. Get Clerk Domain

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **API Keys**
3. Find your **Frontend API** domain (e.g., `clerk.your-app.com`)

### 2. Add Auth Config

Create `convex/auth.config.ts`:

```typescript
export default {
  providers: [
    {
      domain: "https://clerk.your-app.com",
      applicationID: "convex",
    },
  ],
};
```

**Important**: The `applicationID` must match your Clerk JWT template name (should be `convex`).

### 3. Set Environment Variable

In Convex dashboard → Settings → Environment Variables:

Add `CLERK_DOMAIN` = `https://clerk.your-app.com`

Or via CLI:

```bash
npx convex env set CLERK_DOMAIN https://clerk.your-app.com
```

## Database Schema

The schema is defined in `convex/schema.ts`. Key tables:

### Users
- Profile information
- Auth tokens
- Push notification tokens

### Matches
- User pairs
- Match status

### Messages
- Chat messages
- Read receipts

### Swipes
- Like/pass actions
- Used for match detection

### InviteCodes
- Invite code management
- Usage tracking

## File Storage

Convex includes built-in file storage. Used for:
- User profile photos
- Any uploaded media

Files are stored using:
1. `generateUploadUrl()` - Get upload URL
2. POST file to URL
3. Store returned `storageId`
4. Use `storage.getUrl(storageId)` to get public URL

## Deploy to Production

### 1. Create Production Deployment

```bash
npx convex deploy --prod
```

### 2. Update Environment

Update `.env.local` or EAS secrets with production URL:

```
EXPO_PUBLIC_CONVEX_URL=https://your-prod-project.convex.cloud
```

### 3. Set Production Environment Variables

In Convex dashboard → Production → Settings → Environment Variables:

- `CLERK_DOMAIN` = your production Clerk domain

## Seed Data

Run the seed function to create initial invite codes:

```typescript
// In Convex dashboard → Functions → seed.seedInviteCodes
// Or via code:
const seed = useMutation(api.seed.seedInviteCodes);
await seed();
```

Default codes created:
- `NOMAD2024` (100 uses)
- `DETOUR` (50 uses)
- `WANDERER` (50 uses)
- `EXPLORER` (25 uses)
- `DEVTEST` (1000 uses)

## Monitoring

### Dashboard Features

- **Data**: Browse and edit database tables
- **Functions**: View and test queries/mutations
- **Logs**: Real-time function logs
- **Metrics**: Performance and usage stats

### Logs

```typescript
// Add logging in functions
console.log("User created:", userId);
console.error("Failed to send notification:", error);
```

Logs appear in Dashboard → Logs.

## Indexes

Indexes are defined in `schema.ts` for efficient queries:

```typescript
users: defineTable({...})
  .index("by_token", ["tokenIdentifier"])
  .index("by_username", ["username"])
  .index("by_email", ["email"])
  .index("by_location", ["currentLocation"])
```

## Scheduled Functions

Used for push notifications:

```typescript
// Schedule an action to run immediately
await ctx.scheduler.runAfter(0, internal.notifications.sendMatchNotification, {
  recipientId,
  matcherName,
  matchId,
});

// Schedule for later
await ctx.scheduler.runAfter(60000, internal.someAction, args); // 1 minute
```

## Troubleshooting

### "Not authenticated" errors

1. Check Clerk JWT template is named `convex`
2. Verify auth config domain matches Clerk
3. Ensure user is signed in before calling authenticated functions

### Schema push fails

1. Check for TypeScript errors in schema
2. Ensure all validators are imported from `convex/values`
3. Run `npx convex dev` to see detailed errors

### Functions not updating

1. Ensure `npx convex dev` is running
2. Check for TypeScript errors
3. Try `npx convex deploy` to force sync

### File upload fails

1. Check user is authenticated (generateUploadUrl requires auth)
2. Verify Content-Type header in upload request
3. Check file size limits (Convex allows up to 50MB)

## Best Practices

1. **Use indexes** for frequently queried fields
2. **Validate inputs** in mutation handlers
3. **Use internal functions** for server-side logic
4. **Log important events** for debugging
5. **Handle errors gracefully** with try-catch
