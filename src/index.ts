import { LocationClient, SearchPlaceIndexForTextCommand } from "@aws-sdk/client-location";

export async function geocodeAddress(address: string): Promise<void> {
  const client = new LocationClient({ region: "us-west-2" });

  const params = {
    IndexName: "GeoAddressIndex",
    Text: address,
  };

  try {
    const command = new SearchPlaceIndexForTextCommand(params);
    const response = await client.send(command);

    if (response.Results && response.Results.length > 0) {
      const result = response.Results[0];
      if (result?.Place) {
        const place = result.Place;
        console.log("Resolved Address:", place.Label ?? "N/A");
        console.log("Country:", place.Country ?? "N/A");
        console.log("Region (State):", place.Region ?? "N/A");
        console.log("SubRegion (County):", place.SubRegion ?? "N/A");
        console.log("Municipality:", place.Municipality ?? "N/A");
        console.log("Neighborhood:", place.Neighborhood ?? "N/A");
        console.log("Postal Code:", place.PostalCode ?? "N/A");
        console.log("Coordinates:", place.Geometry?.Point ?? "N/A");

        // Note: FIPS codes are not directly provided by AWS Location Service.
        // If needed, integrate with another service like US Census API for FIPS lookup based on county/state.
        console.log("Full Response:", JSON.stringify(response, null, 2));
      } else {
        console.log("No place data found in the result.");
      }
    } else {
      console.log("No results found for the address.");
    }
  } catch (error) {
    console.error("Error geocoding address:", error);
  }
}

const address = process.argv[2];
if (!address) {
  console.log("Usage: bun run src/index.ts <address>");
  process.exit(1);
}

geocodeAddress(address);
