# API Reference

This document describes all Convex queries, mutations, and actions.

## Users (`convex/users.ts`)

### Queries

#### `users.getCurrentUser`

Get the currently authenticated user.

```typescript
const user = useQuery(api.users.getCurrentUser);
```

**Args:** None (uses auth context)

**Returns:** User object or `null`

---

#### `users.getById`

Get a user by their ID.

```typescript
const user = useQuery(api.users.getById, { id: userId });
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| id | `Id<"users">` | User ID |

**Returns:** User object or `null`

---

#### `users.getByUsername`

Get a user by username.

```typescript
const user = useQuery(api.users.getByUsername, { username: "johndoe" });
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| username | `string` | Username to look up |

**Returns:** User object or `null`

---

#### `users.checkUsernameAvailable`

Check if a username is available.

```typescript
const isAvailable = useQuery(api.users.checkUsernameAvailable, {
  username: "johndoe"
});
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| username | `string` | Username to check |

**Returns:** `boolean`

---

#### `users.getDiscoverUsers`

Get users for the discovery/nearby feed (excludes already-swiped users).

```typescript
const profiles = useQuery(api.users.getDiscoverUsers, {
  currentUserId: myUserId,
  limit: 20
});
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| currentUserId | `Id<"users">` | Current user's ID |
| limit | `number?` | Max results (default: 50) |

**Returns:** Array of user objects

---

#### `users.getNearbyUsers`

Get users in a specific location.

```typescript
const users = useQuery(api.users.getNearbyUsers, {
  currentUserId: myUserId,
  location: "Bali, Indonesia",
  limit: 20
});
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| currentUserId | `Id<"users">` | Current user's ID |
| location | `string` | Location to filter by |
| limit | `number?` | Max results (default: 20) |

**Returns:** Array of user objects

---

### Mutations

#### `users.create`

Create a new user (called during onboarding).

```typescript
const createUser = useMutation(api.users.create);
const userId = await createUser({
  name: "John Doe",
  username: "johndoe",
  birthday: "1990-01-15",
  gender: "male",
  lookingFor: ["friends", "dating"],
  lifestyle: ["digital-nomad", "remote-worker"],
  timeNomadic: "1-2 years",
  interests: ["surfing", "yoga", "coffee"],
  photos: ["https://..."],
  currentLocation: "Bali, Indonesia",
  joinPath: "invite",
  inviteCode: "NOMAD2024",
  userStatus: "approved"
});
```

**Args:** See schema for all fields

**Returns:** `Id<"users">`

---

#### `users.update`

Update user profile fields.

```typescript
const updateUser = useMutation(api.users.update);
await updateUser({
  id: userId,
  name: "John Updated",
  currentLocation: "Lisbon, Portugal"
});
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| id | `Id<"users">` | User ID |
| ...fields | various | Any user fields to update |

**Returns:** `void`

---

#### `users.savePushToken`

Save the user's Expo push notification token.

```typescript
const savePushToken = useMutation(api.users.savePushToken);
await savePushToken({ expoPushToken: "ExponentPushToken[xxx]" });
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| expoPushToken | `string` | Expo push token |

**Returns:** `{ success: boolean }`

---

#### `users.getOrCreateByToken`

Check if authenticated user exists, used after Clerk sign-in.

```typescript
const getOrCreate = useMutation(api.users.getOrCreateByToken);
const { user, isNew } = await getOrCreate();
```

**Args:** None (uses auth context)

**Returns:** `{ user: User | null, isNew: boolean }`

---

## Matches (`convex/matches.ts`)

### Queries

#### `matches.getByUser`

Get all matches for a user (with other user's info).

```typescript
const matches = useQuery(api.matches.getByUser, { userId: myUserId });
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| userId | `Id<"users">` | User ID |

**Returns:** Array of matches with `otherUser` populated

---

#### `matches.getById`

Get a specific match with both users' info.

```typescript
const match = useQuery(api.matches.getById, { id: matchId });
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| id | `Id<"matches">` | Match ID |

**Returns:** Match with `user1` and `user2` populated

---

### Mutations

#### `matches.unmatch`

Unmatch from a user.

```typescript
const unmatch = useMutation(api.matches.unmatch);
await unmatch({ matchId });
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| matchId | `Id<"matches">` | Match ID |

**Returns:** `void`

---

## Messages (`convex/messages.ts`)

### Queries

#### `messages.getByMatch`

Get all messages for a match (real-time subscription).

```typescript
const messages = useQuery(api.messages.getByMatch, { matchId });
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| matchId | `Id<"matches">` | Match ID |

**Returns:** Array of messages with `sender` populated

---

#### `messages.getLastMessage`

Get the most recent message in a match.

```typescript
const lastMessage = useQuery(api.messages.getLastMessage, { matchId });
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| matchId | `Id<"matches">` | Match ID |

**Returns:** Message object or `null`

---

#### `messages.getConversationPreviews`

Get conversation previews for all matches (for message list).

```typescript
const previews = useQuery(api.messages.getConversationPreviews, {
  userId: myUserId
});
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| userId | `Id<"users">` | User ID |

**Returns:** Array of `{ matchId, otherUser, lastMessage, unreadCount, matchedAt }`

---

#### `messages.getUnreadCount`

Get total unread message count for a user.

```typescript
const unreadCount = useQuery(api.messages.getUnreadCount, {
  userId: myUserId
});
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| userId | `Id<"users">` | User ID |

**Returns:** `number`

---

### Mutations

#### `messages.send`

Send a message (also triggers push notification).

```typescript
const sendMessage = useMutation(api.messages.send);
await sendMessage({
  matchId,
  senderId: myUserId,
  content: "Hello!",
  messageType: "text"
});
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| matchId | `Id<"matches">` | Match ID |
| senderId | `Id<"users">` | Sender's user ID |
| content | `string` | Message content |
| messageType | `string?` | "text", "image", "location" (default: "text") |

**Returns:** `Id<"messages">`

---

#### `messages.markAsRead`

Mark all messages from other user as read.

```typescript
const markAsRead = useMutation(api.messages.markAsRead);
await markAsRead({ matchId, userId: myUserId });
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| matchId | `Id<"matches">` | Match ID |
| userId | `Id<"users">` | Current user ID |

**Returns:** `void`

---

## Swipes (`convex/swipes.ts`)

### Queries

#### `swipes.getBySwiper`

Get all swipes made by a user.

```typescript
const swipes = useQuery(api.swipes.getBySwiper, { swiperId: myUserId });
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| swiperId | `Id<"users">` | User ID |

**Returns:** Array of swipe objects

---

### Mutations

#### `swipes.create`

Record a swipe action (creates match if mutual like).

```typescript
const swipe = useMutation(api.swipes.create);
const result = await swipe({
  swiperId: myUserId,
  swipedId: otherUserId,
  action: "like"
});

if (result.isMatch) {
  // It's a match! Navigate to chat
  router.push(`/chat/${result.matchId}`);
}
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| swiperId | `Id<"users">` | User performing swipe |
| swipedId | `Id<"users">` | User being swiped on |
| action | `string` | "like", "pass", or "superlike" |

**Returns:** `{ success: boolean, isMatch: boolean, matchId?: Id<"matches"> }`

---

## Files (`convex/files.ts`)

### Mutations

#### `files.generateUploadUrl`

Generate a URL to upload a file to Convex storage.

```typescript
const generateUrl = useMutation(api.files.generateUploadUrl);
const uploadUrl = await generateUrl();

// Upload file
const response = await fetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": blob.type },
  body: blob
});
const { storageId } = await response.json();
```

**Args:** None (requires auth)

**Returns:** `string` (upload URL)

---

#### `files.getUrl`

Convert a storage ID to a public URL.

```typescript
const getUrl = useMutation(api.files.getUrl);
const publicUrl = await getUrl({ storageId });
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| storageId | `Id<"_storage">` | Storage ID from upload |

**Returns:** `string` (public URL)

---

## Invite Codes (`convex/inviteCodes.ts`)

### Queries

#### `inviteCodes.validate`

Validate an invite code.

```typescript
const result = useQuery(api.inviteCodes.validate, { code: "NOMAD2024" });
// { isValid: true, codeId: "..." } or { isValid: false, error: "..." }
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| code | `string` | Invite code |

**Returns:** `{ isValid: boolean, codeId?: Id, error?: string }`

---

### Mutations

#### `inviteCodes.use`

Use an invite code (increments usage, auto-approves user).

```typescript
const useCode = useMutation(api.inviteCodes.use);
await useCode({ code: "NOMAD2024", userId: myUserId });
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| code | `string` | Invite code |
| userId | `Id<"users">` | User using the code |

**Returns:** `{ success: boolean, error?: string }`

---

#### `inviteCodes.create`

Create a new invite code.

```typescript
const createCode = useMutation(api.inviteCodes.create);
await createCode({
  code: "NEWCODE",
  maxUses: 50,
  createdBy: myUserId,
  expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
});
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| code | `string` | Code (will be uppercased) |
| maxUses | `number` | Maximum uses allowed |
| createdBy | `Id<"users">?` | Creator's user ID |
| expiresAt | `number?` | Expiration timestamp |

**Returns:** `Id<"inviteCodes">`

---

#### `inviteCodes.deactivate`

Deactivate an invite code.

```typescript
const deactivate = useMutation(api.inviteCodes.deactivate);
await deactivate({ id: codeId });
```

**Args:**
| Name | Type | Description |
|------|------|-------------|
| id | `Id<"inviteCodes">` | Code ID |

**Returns:** `void`

---

## Notifications (`convex/notifications.ts`)

These are **internal actions** - not called directly from frontend.

#### `notifications.sendMatchNotification`

Triggered automatically when a match is created in `swipes.create`.

#### `notifications.sendMessageNotification`

Triggered automatically when a message is sent in `messages.send`.

---

## Seed (`convex/seed.ts`)

### Mutations

#### `seed.seedInviteCodes`

Seed the database with default invite codes (run once).

```typescript
const seed = useMutation(api.seed.seedInviteCodes);
await seed();
```

**Default codes created:**
- `NOMAD2024` (100 uses)
- `DETOUR` (50 uses)
- `WANDERER` (50 uses)
- `EXPLORER` (25 uses)
- `DEVTEST` (1000 uses)
