import type {
  Fare,
  Location,
  RouteLeg,
  RouteOption,
  RouteSearchQuery,
  StepInstruction,
  TransitLine
} from "@transitroutefi/shared";
import type { RoutingProvider } from "./RoutingProvider.js";

const FALLBACK_DEPARTURE_TIME = "2026-01-01T17:00:00.000Z";

const fare: Fare = {
  amount: 3.2,
  currency: "CAD",
  formatted: "CA$3.20"
};

const waterfrontStation: Location = {
  label: "Waterfront Station",
  address: "601 W Cordova St, Vancouver, BC",
  coordinates: { lat: 49.2857, lng: -123.1119 }
};

const commercialBroadwayStation: Location = {
  label: "Commercial-Broadway Station",
  address: "1780 E Broadway, Vancouver, BC",
  coordinates: { lat: 49.2626, lng: -123.0686 }
};

const broadwayCityHallStation: Location = {
  label: "Broadway-City Hall Station",
  address: "496 W Broadway, Vancouver, BC",
  coordinates: { lat: 49.2636, lng: -123.1146 }
};

const ubcExchange: Location = {
  label: "UBC Exchange",
  address: "6138 Student Union Blvd, Vancouver, BC",
  coordinates: { lat: 49.2666, lng: -123.2472 }
};

const lonsdaleQuay: Location = {
  label: "Lonsdale Quay",
  address: "123 Carrie Cates Ct, North Vancouver, BC",
  coordinates: { lat: 49.3106, lng: -123.0836 }
};

const phibbsExchange: Location = {
  label: "Phibbs Exchange",
  address: "Phibbs Exchange, North Vancouver, BC",
  coordinates: { lat: 49.3197, lng: -123.0412 }
};

const expoLine: TransitLine = {
  name: "Expo Line",
  shortName: "Expo",
  agencyName: "TransLink",
  color: "#005dab",
  textColor: "#ffffff",
  vehicleType: "train"
};

const canadaLine: TransitLine = {
  name: "Canada Line",
  shortName: "Canada",
  agencyName: "TransLink",
  color: "#009ac7",
  textColor: "#ffffff",
  vehicleType: "train"
};

const route99: TransitLine = {
  name: "99 B-Line",
  shortName: "99",
  agencyName: "TransLink",
  color: "#0b7a3b",
  textColor: "#ffffff",
  vehicleType: "bus"
};

const seaBus: TransitLine = {
  name: "SeaBus",
  shortName: "SeaBus",
  agencyName: "TransLink",
  color: "#007fa3",
  textColor: "#ffffff",
  vehicleType: "ferry"
};

const routeR2: TransitLine = {
  name: "R2 Marine Dr",
  shortName: "R2",
  agencyName: "TransLink",
  color: "#005dab",
  textColor: "#ffffff",
  vehicleType: "bus"
};

function minutesAfter(baseTime: Date, minutes: number): string {
  return new Date(baseTime.getTime() + minutes * 60_000).toISOString();
}

function getBaseDeparture(query: RouteSearchQuery): Date {
  if (query.timeMode === "depart_at") {
    return new Date(query.requestedTime);
  }

  if (query.timeMode === "arrive_by") {
    return new Date(new Date(query.requestedTime).getTime() - 52 * 60_000);
  }

  return new Date(FALLBACK_DEPARTURE_TIME);
}

function walkingStep(
  id: string,
  instruction: string,
  startLocation: Location,
  endLocation: Location,
  durationMinutes: number,
  distanceMeters: number
): StepInstruction {
  return {
    id,
    type: "walk",
    instruction,
    startLocation,
    endLocation,
    durationMinutes,
    distanceMeters
  };
}

function transitSteps(
  idPrefix: string,
  transitLine: TransitLine,
  boardLocation: Location,
  alightLocation: Location,
  stopCount: number,
  rideMinutes: number
): StepInstruction[] {
  return [
    {
      id: `${idPrefix}-board`,
      type: "board",
      instruction: `Board ${transitLine.name} at ${boardLocation.label}.`,
      startLocation: boardLocation,
      transitLine
    },
    {
      id: `${idPrefix}-ride`,
      type: "ride",
      instruction: `Ride ${transitLine.name} for ${stopCount} stops.`,
      startLocation: boardLocation,
      endLocation: alightLocation,
      durationMinutes: rideMinutes,
      transitLine,
      stopCount
    },
    {
      id: `${idPrefix}-alight`,
      type: "alight",
      instruction: `Alight at ${alightLocation.label}.`,
      endLocation: alightLocation,
      transitLine
    }
  ];
}

function walkingLeg(
  id: string,
  startLocation: Location,
  endLocation: Location,
  durationMinutes: number,
  distanceMeters: number,
  instruction: string
): RouteLeg {
  return {
    id,
    mode: "walking",
    startLocation,
    endLocation,
    durationMinutes,
    distanceMeters,
    steps: [
      walkingStep(
        `${id}-walk`,
        instruction,
        startLocation,
        endLocation,
        durationMinutes,
        distanceMeters
      )
    ]
  };
}

function transitLeg(
  id: string,
  transitLine: TransitLine,
  startLocation: Location,
  endLocation: Location,
  departureTime: string,
  arrivalTime: string,
  durationMinutes: number,
  stopCount: number
): RouteLeg {
  return {
    id,
    mode: "transit",
    startLocation,
    endLocation,
    departureTime,
    arrivalTime,
    durationMinutes,
    steps: transitSteps(
      id,
      transitLine,
      startLocation,
      endLocation,
      stopCount,
      durationMinutes
    ),
    transitLine
  };
}

function buildExpoToBLineRoute(
  query: RouteSearchQuery,
  baseDeparture: Date
): RouteOption {
  const departureTime = minutesAfter(baseDeparture, 0);
  const expoDeparture = minutesAfter(baseDeparture, 6);
  const expoArrival = minutesAfter(baseDeparture, 20);
  const bLineDeparture = minutesAfter(baseDeparture, 25);
  const bLineArrival = minutesAfter(baseDeparture, 48);
  const arrivalTime = minutesAfter(baseDeparture, 54);

  return {
    id: "mock-expo-99-bline",
    summary: "Expo Line + 99 B-Line",
    totalDurationMinutes: 54,
    walkingTimeMinutes: 11,
    transfers: 1,
    departureTime,
    arrivalTime,
    fare,
    bounds: {
      northeast: { lat: 49.31, lng: -123.04 },
      southwest: { lat: 49.24, lng: -123.25 }
    },
    legs: [
      walkingLeg(
        "mock-expo-99-walk-start",
        query.start,
        waterfrontStation,
        6,
        450,
        `Walk from ${query.start.label} to Waterfront Station.`
      ),
      transitLeg(
        "mock-expo-99-expo",
        expoLine,
        waterfrontStation,
        commercialBroadwayStation,
        expoDeparture,
        expoArrival,
        14,
        5
      ),
      transitLeg(
        "mock-expo-99-bline",
        route99,
        commercialBroadwayStation,
        ubcExchange,
        bLineDeparture,
        bLineArrival,
        23,
        8
      ),
      walkingLeg(
        "mock-expo-99-walk-end",
        ubcExchange,
        query.destination,
        5,
        350,
        `Walk from UBC Exchange to ${query.destination.label}.`
      )
    ]
  };
}

function buildCanadaLineToBLineRoute(
  query: RouteSearchQuery,
  baseDeparture: Date
): RouteOption {
  const departureTime = minutesAfter(baseDeparture, 4);
  const canadaDeparture = minutesAfter(baseDeparture, 11);
  const canadaArrival = minutesAfter(baseDeparture, 18);
  const bLineDeparture = minutesAfter(baseDeparture, 24);
  const bLineArrival = minutesAfter(baseDeparture, 51);
  const arrivalTime = minutesAfter(baseDeparture, 58);

  return {
    id: "mock-canada-99-bline",
    summary: "Canada Line + 99 B-Line",
    totalDurationMinutes: 54,
    walkingTimeMinutes: 14,
    transfers: 1,
    departureTime,
    arrivalTime,
    fare,
    bounds: {
      northeast: { lat: 49.3, lng: -123.08 },
      southwest: { lat: 49.24, lng: -123.25 }
    },
    legs: [
      walkingLeg(
        "mock-canada-99-walk-start",
        query.start,
        waterfrontStation,
        7,
        520,
        `Walk from ${query.start.label} to Waterfront Station.`
      ),
      transitLeg(
        "mock-canada-99-canada",
        canadaLine,
        waterfrontStation,
        broadwayCityHallStation,
        canadaDeparture,
        canadaArrival,
        7,
        2
      ),
      transitLeg(
        "mock-canada-99-bline",
        route99,
        broadwayCityHallStation,
        ubcExchange,
        bLineDeparture,
        bLineArrival,
        27,
        10
      ),
      walkingLeg(
        "mock-canada-99-walk-end",
        ubcExchange,
        query.destination,
        7,
        500,
        `Walk from UBC Exchange to ${query.destination.label}.`
      )
    ]
  };
}

function buildSeaBusRoute(query: RouteSearchQuery, baseDeparture: Date): RouteOption {
  const departureTime = minutesAfter(baseDeparture, 2);
  const seaBusDeparture = minutesAfter(baseDeparture, 8);
  const seaBusArrival = minutesAfter(baseDeparture, 20);
  const rapidBusDeparture = minutesAfter(baseDeparture, 27);
  const rapidBusArrival = minutesAfter(baseDeparture, 42);
  const arrivalTime = minutesAfter(baseDeparture, 49);

  return {
    id: "mock-seabus-r2",
    summary: "SeaBus + R2 RapidBus",
    totalDurationMinutes: 47,
    walkingTimeMinutes: 13,
    transfers: 1,
    departureTime,
    arrivalTime,
    fare,
    bounds: {
      northeast: { lat: 49.34, lng: -123.03 },
      southwest: { lat: 49.28, lng: -123.12 }
    },
    legs: [
      walkingLeg(
        "mock-seabus-r2-walk-start",
        query.start,
        waterfrontStation,
        6,
        430,
        `Walk from ${query.start.label} to Waterfront Station.`
      ),
      transitLeg(
        "mock-seabus-r2-seabus",
        seaBus,
        waterfrontStation,
        lonsdaleQuay,
        seaBusDeparture,
        seaBusArrival,
        12,
        1
      ),
      transitLeg(
        "mock-seabus-r2-bus",
        routeR2,
        lonsdaleQuay,
        phibbsExchange,
        rapidBusDeparture,
        rapidBusArrival,
        15,
        6
      ),
      walkingLeg(
        "mock-seabus-r2-walk-end",
        phibbsExchange,
        query.destination,
        7,
        510,
        `Walk from Phibbs Exchange to ${query.destination.label}.`
      )
    ]
  };
}

export class MockProvider implements RoutingProvider {
  readonly name = "mock";

  async findRoutes(query: RouteSearchQuery): Promise<RouteOption[]> {
    const baseDeparture = getBaseDeparture(query);

    return [
      buildExpoToBLineRoute(query, baseDeparture),
      buildCanadaLineToBLineRoute(query, baseDeparture),
      buildSeaBusRoute(query, baseDeparture)
    ];
  }
}
