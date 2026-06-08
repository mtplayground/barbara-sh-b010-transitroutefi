import type { RouteOption, RouteSearchQuery } from "@transitroutefi/shared";

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Array<{
    path: string;
    message: string;
  }>;
}

export interface RoutesSuccessResponse {
  status: "ok";
  routes: RouteOption[];
}

export interface RoutesNoRoutesResponse {
  status: "no_routes";
  routes: [];
  message: string;
}

export type RoutesResponse = RoutesSuccessResponse | RoutesNoRoutesResponse;

interface RoutesErrorResponse {
  status: "error";
  error: ApiErrorBody;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorBody["details"];

  constructor(status: number, error: ApiErrorBody) {
    super(error.message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

const routesEndpoint = "/api/routes";

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function isRoutesErrorResponse(value: unknown): value is RoutesErrorResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RoutesErrorResponse>;
  return (
    candidate.status === "error" &&
    typeof candidate.error?.code === "string" &&
    typeof candidate.error.message === "string"
  );
}

export async function searchRoutes(query: RouteSearchQuery): Promise<RoutesResponse> {
  const response = await fetch(routesEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(query)
  });

  const body = await readJson(response);

  if (!response.ok) {
    if (isRoutesErrorResponse(body)) {
      throw new ApiClientError(response.status, body.error);
    }

    throw new ApiClientError(response.status, {
      code: "REQUEST_FAILED",
      message: "Unable to load route options."
    });
  }

  return body as RoutesResponse;
}
