import photos from "./destination-photos.json";
import { defaultContent } from "@dreamer/journey-engine";

export type DestinationPhoto = {
  file: string;
  title: string;
  artist: string;
  license: string;
  licenseUrl: string | null;
  source: string;
};

/**
 * Openly licensed city photos from Wikimedia Commons, one per destination country.
 * Every photo is credited on /credits, as their licences require.
 */
export const DESTINATION_PHOTOS = photos as Record<string, DestinationPhoto>;

/** The destination country for an airport code, if it is one of ours. */
export function countryOfAirport(code: string): string | undefined {
  return Object.entries(defaultContent.airports.destinations.byCountry).find(([, a]) => a.code === code)?.[0];
}

export function photoForAirport(code: string): DestinationPhoto | undefined {
  const cc = countryOfAirport(code);
  return cc ? DESTINATION_PHOTOS[cc] : undefined;
}
