import { useMutation } from "@tanstack/react-query";
import type { RouteSearchQuery } from "@transitroutefi/shared";
import type { ApiClientError, RoutesResponse } from "../api/routes";
import { searchRoutes } from "../api/routes";

export function useRouteSearch() {
  return useMutation<RoutesResponse, ApiClientError, RouteSearchQuery>({
    mutationFn: (query: RouteSearchQuery) => searchRoutes(query)
  });
}
