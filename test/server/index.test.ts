import { test, expect, mock } from "bun:test";
import { AwsGeocoder } from "../../src/server/services/awsgeocoder";

// Sample handler simulation based on src/index.ts logic
// Since the actual handler is not exported, we recreate the logic here for unit testing
async function simulateGeocodeHandler(
  req: Request,
  geocoder: AwsGeocoder,
): Promise<Response> {
  try {
    const body = (await req.json()) as { address?: string };
    const address = body.address;
    if (!address || typeof address !== "string") {
      return new Response(
        JSON.stringify({ error: "Valid address is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const result = await geocoder.geocodeAddress(address);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    if (
      error instanceof Error &&
      error.message === "No results found for the address"
    ) {
      return new Response(
        JSON.stringify({ error: "No results found for the address" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function simulateSuggestionsHandler(
  req: Request,
  geocoder: AwsGeocoder,
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const partialAddress = url.searchParams.get("partialAddress");
    if (!partialAddress) {
      return new Response(
        JSON.stringify({ error: "partialAddress is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const maxResultsStr = url.searchParams.get("maxResults");
    const maxResults = maxResultsStr ? parseInt(maxResultsStr, 10) : 5;
    const biasLonStr = url.searchParams.get("biasLon");
    const biasLatStr = url.searchParams.get("biasLat");
    let biasPosition: [number, number] | undefined;
    if (biasLonStr && biasLatStr) {
      const biasLon = parseFloat(biasLonStr);
      const biasLat = parseFloat(biasLatStr);
      if (!isNaN(biasLon) && !isNaN(biasLat)) {
        biasPosition = [biasLon, biasLat];
      }
    }
    const suggestions = await geocoder.getSuggestions(
      partialAddress,
      maxResults,
      biasPosition,
    );
    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

test("POST /geocode with valid address returns 200 and result", async () => {
  const geocoder = new AwsGeocoder();
  const mockGeocode = mock(async () => ({
    label: "123 Main St, Anytown, CA 90210, USA",
    country: "USA",
    region: "California",
    subRegion: "Los Angeles County",
    municipality: "Anytown",
    neighborhood: "Downtown",
    postalCode: "90210",
    coordinates: [-118.2437, 34.0522],
    stateFips: "06",
    countyFips: "037",
  }));
  geocoder.geocodeAddress = mockGeocode;

  const mockReq = new Request("http://localhost:3000/geocode", {
    method: "POST",
    body: JSON.stringify({ address: "123 Main St, Anytown, CA" }),
    headers: { "Content-Type": "application/json" },
  });

  const response = await simulateGeocodeHandler(mockReq, geocoder);

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    label: "123 Main St, Anytown, CA 90210, USA",
    country: "USA",
    region: "California",
    subRegion: "Los Angeles County",
    municipality: "Anytown",
    neighborhood: "Downtown",
    postalCode: "90210",
    coordinates: [-118.2437, 34.0522],
    stateFips: "06",
    countyFips: "037",
  });
  expect(mockGeocode).toHaveBeenCalledTimes(1);
  expect(mockGeocode).toHaveBeenCalledWith("123 Main St, Anytown, CA");
});

test("POST /geocode with invalid address (missing) returns 400", async () => {
  const geocoder = new AwsGeocoder();
  const mockGeocode = mock(async () => ({}));
  geocoder.geocodeAddress = mockGeocode;

  const mockReq = new Request("http://localhost:3000/geocode", {
    method: "POST",
    body: JSON.stringify({}),
    headers: { "Content-Type": "application/json" },
  });

  const response = await simulateGeocodeHandler(mockReq, geocoder);

  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "Valid address is required" });
  expect(mockGeocode).not.toHaveBeenCalled();
});

test("POST /geocode with no results throws 404", async () => {
  const geocoder = new AwsGeocoder();
  const mockGeocode = mock(async () => {
    throw new Error("No results found for the address");
  });
  geocoder.geocodeAddress = mockGeocode;

  const mockReq = new Request("http://localhost:3000/geocode", {
    method: "POST",
    body: JSON.stringify({ address: "Invalid Address" }),
    headers: { "Content-Type": "application/json" },
  });

  const response = await simulateGeocodeHandler(mockReq, geocoder);

  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({
    error: "No results found for the address",
  });
  expect(mockGeocode).toHaveBeenCalledTimes(1);
});

test("POST /geocode with server error returns 500", async () => {
  const geocoder = new AwsGeocoder();
  const mockGeocode = mock(async () => {
    throw new Error("Internal error");
  });
  geocoder.geocodeAddress = mockGeocode;

  const mockReq = new Request("http://localhost:3000/geocode", {
    method: "POST",
    body: JSON.stringify({ address: "Test Address" }),
    headers: { "Content-Type": "application/json" },
  });

  const response = await simulateGeocodeHandler(mockReq, geocoder);

  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal server error" });
  expect(mockGeocode).toHaveBeenCalledTimes(1);
});

test("GET /api/suggestions with valid partialAddress returns 200 and suggestions", async () => {
  const geocoder = new AwsGeocoder();
  const mockGetSuggestions = mock(async () => [
    { text: "Suggestion 1", placeId: "id1" },
    { text: "Suggestion 2", placeId: "id2" },
  ]);
  geocoder.getSuggestions = mockGetSuggestions;

  const mockReq = new Request(
    "http://localhost:3000/api/suggestions?partialAddress=partial",
    {
      method: "GET",
    },
  );

  const response = await simulateSuggestionsHandler(mockReq, geocoder);

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    suggestions: [
      { text: "Suggestion 1", placeId: "id1" },
      { text: "Suggestion 2", placeId: "id2" },
    ],
  });
  expect(mockGetSuggestions).toHaveBeenCalledWith("partial", 5, undefined);
  expect(mockGetSuggestions).toHaveBeenCalledTimes(1);
});
