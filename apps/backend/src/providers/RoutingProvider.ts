import type { RouteOption, RouteSearchQuery } from "@transitroutefi/shared";

export interface RoutingProvider {
  readonly name: string;
  findRoutes(query: RouteSearchQuery): Promise<RouteOption[]>;
}

export interface RouteNormalizer<ProviderResponse = unknown> {
  normalizeRoutes(response: ProviderResponse, query: RouteSearchQuery): RouteOption[];
}
