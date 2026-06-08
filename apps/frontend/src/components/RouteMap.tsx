import { useEffect, useMemo, useRef, useState } from "react";
import type { Coordinates, Location, RouteOption } from "@transitroutefi/shared";

interface RouteMapProps {
  route?: RouteOption;
}

interface MapData {
  bounds?: RouteOption["bounds"];
  destination: Coordinates;
  path: Coordinates[];
  start: Coordinates;
  transitStops: Coordinates[];
}

let googleMapsPromise: Promise<typeof google> | undefined;

function loadGoogleMaps(apiKey: string): Promise<typeof google> {
  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById("google-maps-js-api");

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google));
      existingScript.addEventListener("error", () =>
        reject(new Error("Unable to load Google Maps."))
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-js-api";
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&v=weekly`;
    script.addEventListener("load", () => resolve(window.google));
    script.addEventListener("error", () =>
      reject(new Error("Unable to load Google Maps."))
    );

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function coordinateKey(coordinates: Coordinates) {
  return `${coordinates.lat.toFixed(5)},${coordinates.lng.toFixed(5)}`;
}

function pushCoordinate(
  coordinates: Coordinates | undefined,
  list: Coordinates[],
  seen: Set<string>
) {
  if (!coordinates) {
    return;
  }

  const key = coordinateKey(coordinates);

  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  list.push(coordinates);
}

function decodePolyline(encoded: string): Coordinates[] {
  const path: Coordinates[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    path.push({
      lat: lat / 100_000,
      lng: lng / 100_000
    });
  }

  return path;
}

function locationCoordinates(location: Location | undefined) {
  return location?.coordinates;
}

function fallbackPath(route: RouteOption) {
  const path: Coordinates[] = [];
  const seen = new Set<string>();

  for (const leg of route.legs) {
    pushCoordinate(locationCoordinates(leg.startLocation), path, seen);
    pushCoordinate(locationCoordinates(leg.endLocation), path, seen);
  }

  return path;
}

function routeMapData(route: RouteOption | undefined): MapData | undefined {
  if (!route) {
    return undefined;
  }

  const path = route.routePolyline
    ? decodePolyline(route.routePolyline)
    : fallbackPath(route);

  if (path.length < 2) {
    return undefined;
  }

  const transitStops: Coordinates[] = [];
  const seenStops = new Set<string>();

  for (const leg of route.legs) {
    if (leg.mode === "transit") {
      pushCoordinate(locationCoordinates(leg.startLocation), transitStops, seenStops);
      pushCoordinate(locationCoordinates(leg.endLocation), transitStops, seenStops);
    }

    for (const step of leg.steps) {
      if (step.type === "walk") {
        continue;
      }

      pushCoordinate(locationCoordinates(step.startLocation), transitStops, seenStops);
      pushCoordinate(locationCoordinates(step.endLocation), transitStops, seenStops);
    }
  }

  return {
    bounds: route.bounds,
    destination: path[path.length - 1],
    path,
    start: path[0],
    transitStops
  };
}

function fitMapBounds(maps: typeof google.maps, map: google.maps.Map, data: MapData) {
  const bounds = new maps.LatLngBounds();

  if (data.bounds) {
    bounds.extend(data.bounds.northeast);
    bounds.extend(data.bounds.southwest);
  } else {
    for (const coordinate of data.path) {
      bounds.extend(coordinate);
    }
  }

  map.fitBounds(bounds, 48);
}

export function RouteMap({ route }: RouteMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapData = useMemo(() => routeMapData(route), [route]);
  const [hasLoadError, setHasLoadError] = useState(false);
  const browserKey = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY;

  useEffect(() => {
    if (!browserKey || !mapData || !mapElementRef.current) {
      return;
    }

    let isActive = true;
    let polyline: google.maps.Polyline | undefined;
    const markers: google.maps.Marker[] = [];

    loadGoogleMaps(browserKey)
      .then((googleInstance) => {
        if (!isActive || !mapElementRef.current) {
          return;
        }

        const maps = googleInstance.maps;
        const map = new maps.Map(mapElementRef.current, {
          center: mapData.start,
          disableDefaultUI: true,
          gestureHandling: "cooperative",
          mapTypeControl: false,
          streetViewControl: false,
          zoom: 12
        });

        polyline = new maps.Polyline({
          map,
          path: mapData.path,
          strokeColor: "#087c70",
          strokeOpacity: 0.95,
          strokeWeight: 5
        });

        markers.push(
          new maps.Marker({
            label: "A",
            map,
            position: mapData.start,
            title: "Route start"
          }),
          new maps.Marker({
            label: "B",
            map,
            position: mapData.destination,
            title: "Route destination"
          })
        );

        for (const stop of mapData.transitStops) {
          markers.push(
            new maps.Marker({
              icon: {
                path: maps.SymbolPath.CIRCLE,
                fillColor: "#0d4f7c",
                fillOpacity: 1,
                scale: 5,
                strokeColor: "#ffffff",
                strokeWeight: 2
              },
              map,
              position: stop,
              title: "Transit stop"
            })
          );
        }

        fitMapBounds(maps, map, mapData);
      })
      .catch(() => {
        if (isActive) {
          setHasLoadError(true);
        }
      });

    return () => {
      isActive = false;
      polyline?.setMap(null);
      for (const marker of markers) {
        marker.setMap(null);
      }
    };
  }, [browserKey, mapData]);

  if (!browserKey || !mapData || hasLoadError) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-teal-100 bg-white shadow-soft">
      <div className="border-b border-teal-100 px-5 py-4 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-wide text-transit-teal">
          Route map
        </p>
        <h2 className="mt-1 text-2xl font-bold text-transit-blue">{route?.summary}</h2>
      </div>
      <div
        ref={mapElementRef}
        className="h-[22rem] w-full bg-teal-50 sm:h-[28rem]"
        aria-label="Selected route map"
      />
    </section>
  );
}
