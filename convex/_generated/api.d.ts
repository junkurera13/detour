/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as blocks from "../blocks.js";
import type * as files from "../files.js";
import type * as helpMessages from "../helpMessages.js";
import type * as helpOffers from "../helpOffers.js";
import type * as helpRequests from "../helpRequests.js";
import type * as http from "../http.js";
import type * as inviteCodes from "../inviteCodes.js";
import type * as matches from "../matches.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as seed from "../seed.js";
import type * as swipes from "../swipes.js";
import type * as typing from "../typing.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  blocks: typeof blocks;
  files: typeof files;
  helpMessages: typeof helpMessages;
  helpOffers: typeof helpOffers;
  helpRequests: typeof helpRequests;
  http: typeof http;
  inviteCodes: typeof inviteCodes;
  matches: typeof matches;
  messages: typeof messages;
  notifications: typeof notifications;
  seed: typeof seed;
  swipes: typeof swipes;
  typing: typeof typing;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
