import { LocationClient, SearchPlaceIndexForTextCommand } from "@aws-sdk/client-location";

interface StateFips {
  name: string;
  fips: string;
}

interface CountyFips {
  name: string;
  stateFips: string;
  countyFips: string;
}

async function loadFipsData() {
  const stateFile = await Bun.file("data/us-state-fips.json").json() as [string, string][];
  const countyFile = await Bun.file("data/us-county-fips.json").json() as [string, string, string][];

  const stateMap: Record<string, string> = {};
  stateFile.slice(1).forEach(([name, fips]) => { // Skip header
    stateMap[name.toUpperCase()] = fips;
  });

  const countyMap: Record<string, Record<string, string>> = {};
countyFile.slice(1).forEach(([fullName, stateFips, countyFips]) => { // Skip header
  const parts = fullName.split(',').map(s => s.trim());
  if (parts.length < 1) return; // Skip invalid entries
  const countyName = parts[0] ?? '';
  const cleanedCounty = countyName.toUpperCase().replace(" COUNTY", "");
  const stateKey = stateFips;
  if (!countyMap[stateKey]) countyMap[stateKey] = {};
  countyMap[stateKey][cleanedCounty] = countyFips;
});

  return { stateMap, countyMap };
}

export async function geocodeAddress(address: string): Promise<void> {
  const client = new LocationClient({ region: "us-west-2" });

  const params = {
    IndexName: "GeoAddressIndex",
    Text: address,
  };

  try {
    const command = new SearchPlaceIndexForTextCommand(params);
    const response = await client.send(command);

    const { stateMap, countyMap } = await loadFipsData();

    if (response.Results && response.Results.length > 0) {
      const result = response.Results[0];
      if (result?.Place) {
        const place = result.Place;
        const state = place.Region?.toUpperCase() ?? "";
        const county = place.SubRegion?.toUpperCase().replace(" COUNTY", "") ?? "";

        const stateFips = stateMap[state] ?? "N/A";
        const countyFips = (stateFips !== "N/A" && countyMap[stateFips]?.[county]) ?? "N/A";

        console.log("Resolved Address:", place.Label ?? "N/A");
        console.log("Country:", place.Country ?? "N/A");
        console.log("Region (State):", place.Region ?? "N/A");
        console.log("SubRegion (County):", place.SubRegion ?? "N/A");
        console.log("Municipality:", place.Municipality ?? "N/A");
        console.log("Neighborhood:", place.Neighborhood ?? "N/A");
        console.log("Postal Code:", place.PostalCode ?? "N/A");
        console.log("Coordinates:", place.Geometry?.Point ?? "N/A");
        console.log("State FIPS:", stateFips);
        console.log("County FIPS:", countyFips);

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
