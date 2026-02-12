/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as activityMessages from "../activityMessages.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as blocks from "../blocks.js";
import type * as crews from "../crews.js";
import type * as crossingPaths from "../crossingPaths.js";
import type * as files from "../files.js";
import type * as helpMessages from "../helpMessages.js";
import type * as helpOffers from "../helpOffers.js";
import type * as helpRequests from "../helpRequests.js";
import type * as helpReviews from "../helpReviews.js";
import type * as http from "../http.js";
import type * as inviteCodes from "../inviteCodes.js";
import type * as matches from "../matches.js";
import type * as messages from "../messages.js";
import type * as nomadStops from "../nomadStops.js";
import type * as notifications from "../notifications.js";
import type * as profileViews from "../profileViews.js";
import type * as reports from "../reports.js";
import type * as seed from "../seed.js";
import type * as subscriptionMutations from "../subscriptionMutations.js";
import type * as subscriptions from "../subscriptions.js";
import type * as swipes from "../swipes.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  activityMessages: typeof activityMessages;
  admin: typeof admin;
  auth: typeof auth;
  blocks: typeof blocks;
  crews: typeof crews;
  crossingPaths: typeof crossingPaths;
  files: typeof files;
  helpMessages: typeof helpMessages;
  helpOffers: typeof helpOffers;
  helpRequests: typeof helpRequests;
  helpReviews: typeof helpReviews;
  http: typeof http;
  inviteCodes: typeof inviteCodes;
  matches: typeof matches;
  messages: typeof messages;
  nomadStops: typeof nomadStops;
  notifications: typeof notifications;
  profileViews: typeof profileViews;
  reports: typeof reports;
  seed: typeof seed;
  subscriptionMutations: typeof subscriptionMutations;
  subscriptions: typeof subscriptions;
  swipes: typeof swipes;
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
