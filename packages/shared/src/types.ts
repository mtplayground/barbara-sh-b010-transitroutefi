export type IsoDateTimeString = string;

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  label: string;
  address?: string;
  placeId?: string;
  coordinates?: Coordinates;
}

export type RouteTimeMode = "leave_now" | "depart_at" | "arrive_by";

interface RouteSearchQueryBase {
  start: Location;
  destination: Location;
}

export type RouteSearchQuery =
  | (RouteSearchQueryBase & {
      timeMode: "leave_now";
      requestedTime?: never;
    })
  | (RouteSearchQueryBase & {
      timeMode: "depart_at";
      requestedTime: IsoDateTimeString;
    })
  | (RouteSearchQueryBase & {
      timeMode: "arrive_by";
      requestedTime: IsoDateTimeString;
    });

export type TransitVehicleType =
  | "bus"
  | "subway"
  | "train"
  | "tram"
  | "rail"
  | "ferry"
  | "gondola"
  | "other";

export interface TransitLine {
  name: string;
  shortName?: string;
  agencyName?: string;
  agencyUrl?: string;
  color?: string;
  textColor?: string;
  vehicleType?: TransitVehicleType;
}

export type StepInstructionType = "walk" | "board" | "ride" | "transfer" | "alight";

export interface StepInstruction {
  id: string;
  type: StepInstructionType;
  instruction: string;
  startLocation?: Location;
  endLocation?: Location;
  durationMinutes?: number;
  distanceMeters?: number;
  transitLine?: TransitLine;
  stopCount?: number;
  polyline?: string;
}

export type RouteLegMode = "walking" | "transit";

export interface RouteLeg {
  id: string;
  mode: RouteLegMode;
  startLocation: Location;
  endLocation: Location;
  departureTime?: IsoDateTimeString;
  arrivalTime?: IsoDateTimeString;
  durationMinutes: number;
  distanceMeters?: number;
  steps: StepInstruction[];
  transitLine?: TransitLine;
}

export interface Fare {
  amount: number;
  currency: string;
  formatted?: string;
}

export interface MapBounds {
  northeast: Coordinates;
  southwest: Coordinates;
}

export interface RouteOption {
  id: string;
  summary: string;
  totalDurationMinutes: number;
  walkingTimeMinutes: number;
  transfers: number;
  departureTime: IsoDateTimeString;
  arrivalTime: IsoDateTimeString;
  legs: RouteLeg[];
  fare?: Fare;
  routePolyline?: string;
  bounds?: MapBounds;
}
