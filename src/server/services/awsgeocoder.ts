import {
  LocationClient,
  SearchPlaceIndexForSuggestionsCommand,
  SearchPlaceIndexForTextCommand,
  GetPlaceCommand,
} from "@aws-sdk/client-location";

export class AwsGeocoder {
  private client: LocationClient;
  private fipsPromise: Promise<{
    stateMap: Record<string, string>;
    countyMap: Record<string, Record<string, string>>;
  }>;
  private indexName: string;

  constructor(
    region: string = "us-west-2",
    indexName: string = "GeoAddressIndex",
  ) {
    this.client = new LocationClient({ region });
    this.fipsPromise = this.loadFipsData();
    this.indexName = indexName;
  }

  private async loadFipsData() {
    const stateFile = (await Bun.file("data/us-state-fips.json").json()) as [
      string,
      string,
    ][];
    const countyFile = (await Bun.file("data/us-county-fips.json").json()) as [
      string,
      string,
      string,
    ][];
    const stateMap: Record<string, string> = {};
    stateFile.slice(1).forEach(([name, fips]) => {
      // Skip header
      stateMap[name.toUpperCase()] = fips;
    });
    const countyMap: Record<string, Record<string, string>> = {};
    countyFile.slice(1).forEach(([fullName, stateFips, countyFips]) => {
      // Skip header
      const parts = fullName.split(",").map((s) => s.trim());
      if (parts.length < 1) return; // Skip invalid entries
      const countyName = parts[0] ?? "";
      const cleanedCounty = countyName.toUpperCase().replace(" COUNTY", "");
      const stateKey = stateFips;
      if (!countyMap[stateKey]) countyMap[stateKey] = {};
      countyMap[stateKey][cleanedCounty] = countyFips;
    });
    return { stateMap, countyMap };
  }

  public async geocodeAddress(address: string): Promise<object> {
    try {
      const { stateMap, countyMap } = await this.fipsPromise;
      const params = {
        IndexName: this.indexName,
        Text: address,
      };
      const command = new SearchPlaceIndexForTextCommand(params);
      const response = await this.client.send(command);
      if (response.Results && response.Results.length > 0) {
        const result = response.Results[0];
        if (result?.Place) {
          const place = result.Place;
          const state = place.Region?.toUpperCase() ?? "";
          const county =
            place.SubRegion?.toUpperCase().replace(" COUNTY", "") ?? "";
          const stateFips = stateMap[state] ?? "N/A";
          const countyFips =
            (stateFips !== "N/A" && countyMap[stateFips]?.[county]) ?? "N/A";
          return {
            label: place.Label ?? "N/A",
            country: place.Country ?? "N/A",
            region: place.Region ?? "N/A",
            subRegion: place.SubRegion ?? "N/A",
            municipality: place.Municipality ?? "N/A",
            neighborhood: place.Neighborhood ?? "N/A",
            postalCode: place.PostalCode ?? "N/A",
            coordinates: place.Geometry?.Point ?? "N/A",
            stateFips: stateFips,
            countyFips: countyFips,
          };
        }
      }
      throw new Error("No results found for the address");
    } catch (error) {
      console.error("Error geocoding address:", error);
      throw error;
    }
  }
  public async getSuggestions(
    partialAddress: string,
    maxResults: number = 5,
    biasPosition?: [number, number],
  ): Promise<{ text: string; placeId: string }[]> {
    try {
      const params: any = {
        IndexName: this.indexName,
        Text: partialAddress,
        MaxResults: maxResults,
        FilterCountries: ["USA", "CAN"],
      };
      if (biasPosition) {
        params.BiasPosition = biasPosition;
      }
      const command = new SearchPlaceIndexForSuggestionsCommand(params);
      const response = await this.client.send(command);
      if (response.Results && response.Results.length > 0) {
        return response.Results.map((result) => ({
          text: result.Text ?? "",
          placeId: result.PlaceId ?? "",
        }));
      }
      return [];
    } catch (error) {
      console.error("Error getting suggestions:", error);
      throw error;
    }
  }
  
  public async getPlace(placeId: string): Promise<object> {
    try {
      const { stateMap, countyMap } = await this.fipsPromise;
      const params = {
        IndexName: this.indexName,
        PlaceId: placeId,
      };
      const command = new GetPlaceCommand(params);
      const response = await this.client.send(command);
      if (response.Place) {
        const place = response.Place;
        const state = place.Region?.toUpperCase() ?? "";
        const county =
          place.SubRegion?.toUpperCase().replace(" COUNTY", "") ?? "";
        const stateFips = stateMap[state] ?? "N/A";
        const countyFips =
          (stateFips !== "N/A" && countyMap[stateFips]?.[county]) ?? "N/A";
        return {
          label: place.Label ?? "N/A",
          address: {
            AddressNumber: place.AddressNumber ?? "",
            Street: place.Street ?? "",
          },
          country: place.Country ?? "N/A",
          region: place.Region ?? "N/A",
          subRegion: place.SubRegion ?? "N/A",
          municipality: place.Municipality ?? "N/A",
          neighborhood: place.Neighborhood ?? "N/A",
          postalCode: place.PostalCode ?? "N/A",
          coordinates: place.Geometry?.Point ?? "N/A",
          stateFips: stateFips,
          countyFips: countyFips,
        };
      }
      throw new Error("No place found for the given ID");
    } catch (error) {
      console.error("Error fetching place:", error);
      throw error;
    }
  }

  public getMapConfig() {
    return {
      mapName: "GeoMap",
      region: "us-west-2",
      identityPoolId: "us-west-2:901dce01-7f6d-4bf0-a169-1ebdf37929a6",
    };
  }
}
