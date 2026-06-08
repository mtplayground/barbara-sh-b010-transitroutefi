import type {
  Fare,
  Location,
  MapBounds,
  RouteLeg,
  RouteOption,
  RouteSearchQuery,
  StepInstruction,
  TransitLine,
  TransitVehicleType
} from "@transitroutefi/shared";
import type { RouteNormalizer, RoutingProvider } from "./RoutingProvider.js";

const DIRECTIONS_API_URL = "https://maps.googleapis.com/maps/api/directions/json";

type Fetch = typeof fetch;

interface GoogleTextValue {
  text: string;
  value: number;
}

interface GoogleTimeValue extends GoogleTextValue {
  time_zone?: string;
}

interface GoogleLatLng {
  lat: number;
  lng: number;
}

interface GoogleStop {
  name: string;
  location: GoogleLatLng;
}

interface GoogleTransitLine {
  agencies?: Array<{
    name?: string;
    url?: string;
  }>;
  color?: string;
  name?: string;
  short_name?: string;
  text_color?: string;
  vehicle?: {
    name?: string;
    type?: string;
  };
}

interface GoogleTransitDetails {
  arrival_stop?: GoogleStop;
  arrival_time?: GoogleTimeValue;
  departure_stop?: GoogleStop;
  departure_time?: GoogleTimeValue;
  headsign?: string;
  line?: GoogleTransitLine;
  num_stops?: number;
}

interface GoogleStep {
  distance?: GoogleTextValue;
  duration?: GoogleTextValue;
  end_location: GoogleLatLng;
  html_instructions?: string;
  polyline?: {
    points?: string;
  };
  start_location: GoogleLatLng;
  steps?: GoogleStep[];
  transit_details?: GoogleTransitDetails;
  travel_mode: string;
}

interface GoogleLeg {
  arrival_time?: GoogleTimeValue;
  departure_time?: GoogleTimeValue;
  distance?: GoogleTextValue;
  duration?: GoogleTextValue;
  end_address?: string;
  end_location: GoogleLatLng;
  start_address?: string;
  start_location: GoogleLatLng;
  steps: GoogleStep[];
}

interface GoogleRoute {
  bounds?: {
    northeast: GoogleLatLng;
    southwest: GoogleLatLng;
  };
  fare?: {
    currency: string;
    text?: string;
    value: number;
  };
  legs: GoogleLeg[];
  overview_polyline?: {
    points?: string;
  };
  summary?: string;
}

interface GoogleDirectionsResponse {
  error_message?: string;
  routes?: GoogleRoute[];
  status: string;
}

export interface GoogleMapsProviderOptions {
  apiKey: string;
  endpoint?: string;
  fetch?: Fetch;
  language?: string;
  region?: string;
}

export class GoogleMapsProviderError extends Error {
  constructor(
    message: string,
    readonly status?: string
  ) {
    super(message);
    this.name = "GoogleMapsProviderError";
  }
}

function toLocation(label: string, coordinates: GoogleLatLng): Location {
  return {
    label,
    address: label,
    coordinates
  };
}

function formatLocation(location: Location): string {
  if (location.placeId) {
    return `place_id:${location.placeId}`;
  }

  if (location.coordinates) {
    return `${location.coordinates.lat},${location.coordinates.lng}`;
  }

  return location.address ?? location.label;
}

function toUnixSeconds(dateTime: string): string {
  const milliseconds = Date.parse(dateTime);
  if (Number.isNaN(milliseconds)) {
    throw new GoogleMapsProviderError(`Invalid route time: ${dateTime}`);
  }

  return Math.floor(milliseconds / 1000).toString();
}

function timeValueToIso(timeValue: GoogleTimeValue | undefined): string | undefined {
  if (!timeValue) {
    return undefined;
  }

  return new Date(timeValue.value * 1000).toISOString();
}

function secondsToMinutes(seconds: number | undefined): number {
  if (!seconds) {
    return 0;
  }

  return Math.max(0, Math.round(seconds / 60));
}

function stripHtml(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function vehicleTypeFromGoogle(type: string | undefined): TransitVehicleType {
  switch (type?.toUpperCase()) {
    case "BUS":
      return "bus";
    case "FERRY":
      return "ferry";
    case "GONDOLA_LIFT":
      return "gondola";
    case "HEAVY_RAIL":
    case "HIGH_SPEED_TRAIN":
    case "INTERCITY_BUS":
    case "RAIL":
      return "rail";
    case "METRO_RAIL":
      return "subway";
    case "MONORAIL":
    case "TRAM":
      return "tram";
    default:
      return "other";
  }
}

function normalizeTransitLine(
  line: GoogleTransitLine | undefined
): TransitLine | undefined {
  if (!line?.name && !line?.short_name) {
    return undefined;
  }

  const agency = line.agencies?.[0];

  return {
    name: line.name ?? line.short_name ?? "Transit line",
    shortName: line.short_name,
    agencyName: agency?.name,
    agencyUrl: agency?.url,
    color: line.color,
    textColor: line.text_color,
    vehicleType: vehicleTypeFromGoogle(line.vehicle?.type)
  };
}

function normalizeFare(route: GoogleRoute): Fare | undefined {
  if (!route.fare) {
    return undefined;
  }

  return {
    amount: route.fare.value,
    currency: route.fare.currency,
    formatted: route.fare.text
  };
}

function normalizeBounds(route: GoogleRoute): MapBounds | undefined {
  if (!route.bounds) {
    return undefined;
  }

  return {
    northeast: route.bounds.northeast,
    southwest: route.bounds.southwest
  };
}

function collectLeafSteps(step: GoogleStep): GoogleStep[] {
  if (!step.steps?.length) {
    return [step];
  }

  return step.steps.flatMap(collectLeafSteps);
}

function normalizeStep(
  step: GoogleStep,
  routeIndex: number,
  legIndex: number,
  stepIndex: number
): StepInstruction {
  const transitDetails = step.transit_details;
  const transitLine = normalizeTransitLine(transitDetails?.line);
  const startLabel =
    transitDetails?.departure_stop?.name ??
    stripHtml(step.html_instructions) ??
    "Start";
  const endLabel = transitDetails?.arrival_stop?.name ?? "End";
  const isTransit = step.travel_mode.toUpperCase() === "TRANSIT";
  const instruction = stripHtml(step.html_instructions);
  const id = `google-${routeIndex}-${legIndex}-${stepIndex}`;

  if (isTransit) {
    return {
      id,
      type: "ride",
      instruction:
        instruction ||
        `Ride ${transitLine?.name ?? "transit"} to ${transitDetails?.arrival_stop?.name ?? "your stop"}.`,
      startLocation: toLocation(startLabel, step.start_location),
      endLocation: toLocation(endLabel, step.end_location),
      durationMinutes: secondsToMinutes(step.duration?.value),
      distanceMeters: step.distance?.value,
      transitLine,
      stopCount: transitDetails?.num_stops,
      polyline: step.polyline?.points
    };
  }

  return {
    id,
    type: "walk",
    instruction,
    startLocation: toLocation(startLabel || "Start", step.start_location),
    endLocation: toLocation(endLabel, step.end_location),
    durationMinutes: secondsToMinutes(step.duration?.value),
    distanceMeters: step.distance?.value,
    polyline: step.polyline?.points
  };
}

function normalizeLeg(leg: GoogleLeg, routeIndex: number, legIndex: number): RouteLeg {
  const steps = leg.steps
    .flatMap(collectLeafSteps)
    .map((step, stepIndex) => normalizeStep(step, routeIndex, legIndex, stepIndex));
  const transitLine = steps.find((step) => step.transitLine)?.transitLine;
  const mode = transitLine ? "transit" : "walking";

  return {
    id: `google-${routeIndex}-${legIndex}`,
    mode,
    startLocation: toLocation(leg.start_address ?? "Start", leg.start_location),
    endLocation: toLocation(leg.end_address ?? "Destination", leg.end_location),
    departureTime: timeValueToIso(leg.departure_time),
    arrivalTime: timeValueToIso(leg.arrival_time),
    durationMinutes: secondsToMinutes(leg.duration?.value),
    distanceMeters: leg.distance?.value,
    steps,
    transitLine
  };
}

function countTransitSteps(route: GoogleRoute): number {
  return route.legs.reduce((count, leg) => {
    return (
      count +
      leg.steps.filter((step) => step.travel_mode.toUpperCase() === "TRANSIT").length
    );
  }, 0);
}

function getWalkingMinutes(legs: RouteLeg[]): number {
  return legs.reduce((total, leg) => {
    return (
      total +
      leg.steps
        .filter((step) => step.type === "walk")
        .reduce((stepTotal, step) => stepTotal + (step.durationMinutes ?? 0), 0)
    );
  }, 0);
}

function getRouteDepartureTime(route: GoogleRoute, legs: RouteLeg[]): string {
  return (
    timeValueToIso(route.legs[0]?.departure_time) ??
    legs[0]?.departureTime ??
    new Date(0).toISOString()
  );
}

function getRouteArrivalTime(route: GoogleRoute, legs: RouteLeg[]): string {
  const lastGoogleLeg = route.legs.at(-1);
  const lastLeg = legs.at(-1);

  return (
    timeValueToIso(lastGoogleLeg?.arrival_time) ??
    lastLeg?.arrivalTime ??
    getRouteDepartureTime(route, legs)
  );
}

function summarizeRoute(route: GoogleRoute, legs: RouteLeg[]): string {
  if (route.summary) {
    return route.summary;
  }

  const lineNames = legs
    .flatMap((leg) => leg.steps)
    .map((step) => step.transitLine?.shortName ?? step.transitLine?.name)
    .filter((name): name is string => Boolean(name));

  return [...new Set(lineNames)].join(" + ") || "Transit route";
}

function normalizeRoute(route: GoogleRoute, routeIndex: number): RouteOption {
  const legs = route.legs.map((leg, legIndex) =>
    normalizeLeg(leg, routeIndex, legIndex)
  );
  const totalDurationMinutes = secondsToMinutes(
    route.legs.reduce((total, leg) => total + (leg.duration?.value ?? 0), 0)
  );
  const transitStepCount = countTransitSteps(route);

  return {
    id: `google-${routeIndex}`,
    summary: summarizeRoute(route, legs),
    totalDurationMinutes,
    walkingTimeMinutes: getWalkingMinutes(legs),
    transfers: Math.max(0, transitStepCount - 1),
    departureTime: getRouteDepartureTime(route, legs),
    arrivalTime: getRouteArrivalTime(route, legs),
    legs,
    fare: normalizeFare(route),
    routePolyline: route.overview_polyline?.points,
    bounds: normalizeBounds(route)
  };
}

function appendTimeMode(searchParams: URLSearchParams, query: RouteSearchQuery): void {
  if (query.timeMode === "arrive_by") {
    searchParams.set("arrival_time", toUnixSeconds(query.requestedTime));
    return;
  }

  if (query.timeMode === "depart_at") {
    searchParams.set("departure_time", toUnixSeconds(query.requestedTime));
    return;
  }

  searchParams.set("departure_time", "now");
}

export class GoogleDirectionsNormalizer implements RouteNormalizer<GoogleDirectionsResponse> {
  normalizeRoutes(
    response: GoogleDirectionsResponse,
    _query: RouteSearchQuery
  ): RouteOption[] {
    if (response.status === "ZERO_RESULTS") {
      return [];
    }

    if (response.status !== "OK") {
      throw new GoogleMapsProviderError(
        response.error_message ?? `Google Directions API returned ${response.status}`,
        response.status
      );
    }

    return (response.routes ?? []).map(normalizeRoute);
  }
}

export class GoogleMapsProvider implements RoutingProvider {
  readonly name = "google";

  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly fetch: Fetch;
  private readonly language?: string;
  private readonly normalizer: GoogleDirectionsNormalizer;
  private readonly region?: string;

  constructor(options: GoogleMapsProviderOptions) {
    if (!options.apiKey.trim()) {
      throw new GoogleMapsProviderError("Google Maps server key is required.");
    }

    this.apiKey = options.apiKey;
    this.endpoint = options.endpoint ?? DIRECTIONS_API_URL;
    this.fetch = options.fetch ?? fetch;
    this.language = options.language;
    this.normalizer = new GoogleDirectionsNormalizer();
    this.region = options.region;
  }

  async findRoutes(query: RouteSearchQuery): Promise<RouteOption[]> {
    const response = await this.fetch(this.buildUrl(query));

    if (!response.ok) {
      throw new GoogleMapsProviderError(
        `Google Directions API request failed with HTTP ${response.status}.`
      );
    }

    const payload = (await response.json()) as GoogleDirectionsResponse;
    return this.normalizer.normalizeRoutes(payload, query);
  }

  private buildUrl(query: RouteSearchQuery): string {
    const searchParams = new URLSearchParams({
      alternatives: "true",
      destination: formatLocation(query.destination),
      key: this.apiKey,
      mode: "transit",
      origin: formatLocation(query.start)
    });

    if (this.language) {
      searchParams.set("language", this.language);
    }

    if (this.region) {
      searchParams.set("region", this.region);
    }

    appendTimeMode(searchParams, query);

    return `${this.endpoint}?${searchParams.toString()}`;
  }
}
