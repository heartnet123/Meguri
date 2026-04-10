/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alerts from "../alerts.js";
import type * as dashboard from "../dashboard.js";
import type * as forecasting from "../forecasting.js";
import type * as http from "../http.js";
import type * as inventory from "../inventory.js";
import type * as products from "../products.js";
import type * as purchasePlanning from "../purchasePlanning.js";
import type * as sales from "../sales.js";
import type * as stockMovements from "../stockMovements.js";
import type * as suppliers from "../suppliers.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  alerts: typeof alerts;
  dashboard: typeof dashboard;
  forecasting: typeof forecasting;
  http: typeof http;
  inventory: typeof inventory;
  products: typeof products;
  purchasePlanning: typeof purchasePlanning;
  sales: typeof sales;
  stockMovements: typeof stockMovements;
  suppliers: typeof suppliers;
  users: typeof users;
  utils: typeof utils;
  workspaces: typeof workspaces;
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

export declare const components: {
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
};
