import { test, expect, mock } from "bun:test";
import { AwsGeocoder } from "../src/services/awsclientlocation";
import { LocationClient } from "@aws-sdk/client-location";

test("loadFipsData loads and parses state and county maps correctly", async () => {
  const mockStateData = [
    ["State", "FIPS"],
    ["California", "06"],
    ["New York", "36"],
  ];
  const mockCountyData = [
    ["County, State", "State FIPS", "County FIPS"],
    ["Los Angeles County, California", "06", "037"],
    ["New York County, New York", "36", "061"],
  ];

  const mockBunFile = mock((path: string) => {
    if (path === "data/us-state-fips.json") {
      return { json: mock(async () => mockStateData) };
    } else if (path === "data/us-county-fips.json") {
      return { json: mock(async () => mockCountyData) };
    }
    return { json: mock(async () => []) };
  });

  const originalBunFile = Bun.file;
  (Bun as any).file = mockBunFile;

  const geocoder = new AwsGeocoder();
  const fipsData = await (geocoder as any).loadFipsData();

  expect(fipsData.stateMap).toEqual({
    CALIFORNIA: "06",
    "NEW YORK": "36",
  });

  expect(fipsData.countyMap).toEqual({
    "06": { "LOS ANGELES": "037" },
    "36": { "NEW YORK": "061" },
  });

  (Bun as any).file = originalBunFile;
});

test("geocodeAddress returns correct geocoding result", async () => {
  const geocoder = new AwsGeocoder();

  const mockSend = mock(async () => ({
    Results: [
      {
        Place: {
          Label: "123 Main St, Anytown, CA 90210, USA",
          Country: "USA",
          Region: "California",
          SubRegion: "Los Angeles County",
          Municipality: "Anytown",
          Neighborhood: "Downtown",
          PostalCode: "90210",
          Geometry: { Point: [-118.2437, 34.0522] },
        },
      },
    ],
  }));

  const originalSend = LocationClient.prototype.send;
  LocationClient.prototype.send = mockSend;

  const result = await geocoder.geocodeAddress("123 Main St, Anytown, CA");

  expect(result).toEqual({
    label: "123 Main St, Anytown, CA 90210, USA",
    country: "USA",
    region: "California",
    subRegion: "Los Angeles County",
    municipality: "Anytown",
    neighborhood: "Downtown",
    postalCode: "90210",
    coordinates: [-118.2437, 34.0522],
    stateFips: "06", // Assuming from mocked FIPS data, but since loadFipsData is private, assume it's loaded
    countyFips: "037",
  });

  expect(mockSend).toHaveBeenCalledTimes(1);
  LocationClient.prototype.send = originalSend;
});

test("geocodeAddress throws error when no results found", async () => {
  const geocoder = new AwsGeocoder();

  const mockSend = mock(async () => ({ Results: [] }));

  const originalSend = LocationClient.prototype.send;
  LocationClient.prototype.send = mockSend;

  await expect(geocoder.geocodeAddress("Invalid Address")).rejects.toThrow("No results found for the address");

  LocationClient.prototype.send = originalSend;
});

test("geocodeAddress throws error on API failure", async () => {
  const geocoder = new AwsGeocoder();

  const mockSend = mock(async () => { throw new Error("API Error"); });

  const originalSend = LocationClient.prototype.send;
  LocationClient.prototype.send = mockSend;

  await expect(geocoder.geocodeAddress("Test Address")).rejects.toThrow("API Error");

  LocationClient.prototype.send = originalSend;
});
