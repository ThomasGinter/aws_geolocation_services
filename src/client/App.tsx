import React, { useState, useRef, useEffect } from "react";

import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";

import { withIdentityPoolId } from "@aws/amazon-location-utilities-auth-helper";

interface GeocodeResult {
  label: string;
  country: string;
  region: string;
  subRegion: string;
  municipality: string;
  neighborhood: string;
  postalCode: string;
  coordinates: [number, number];
  stateFips: string;
  countyFips: string;
  address?: {
    AddressNumber?: string;
    Street?: string;
  };
}

interface MapConfig {
  mapName: string;
  region: string;
  identityPoolId: string;
}

export default function App() {
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [suggestions, setSuggestions] = useState<
    { text: string; placeId: string }[]
  >([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [result, setResult] = useState<GeocodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);
  const [authHelper, setAuthHelper] = useState<any | null>(null);

  const [viewport, setViewport] = useState({
    latitude: 38.8977,
    longitude: -77.0369,
    zoom: 15,
  });
  const [showMap, setShowMap] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fullAddress = `${street}, ${city}, ${state} ${zip}`.trim();
      if (!fullAddress) {
        setError("Please fill in the address fields");
        setLoading(false);
        return;
      }
      const response = await fetch("/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: fullAddress }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Request failed");
      }

      const data = (await response.json()) as GeocodeResult;
      setResult(data);
      if (
        data.coordinates &&
        Array.isArray(data.coordinates) &&
        data.coordinates.length === 2
      ) {
        setViewport({
          latitude: data.coordinates[1],
          longitude: data.coordinates[0],
          zoom: 14,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setLoading(false);
      setShowMap(true);
    }
  };

  useEffect(() => {
    async function loadMapConfig() {
      try {
        const response = await fetch("/api/map-config");
        if (!response.ok) {
          throw new Error("Failed to fetch map config");
        }
        const config = await response.json();
        setMapConfig(config);

        const authHelperInstance = await withIdentityPoolId(
          config.identityPoolId,
        );
        setAuthHelper(authHelperInstance);
      } catch (error) {
        console.error("Error loading map config:", error);
      }
    }

    loadMapConfig();
  }, []);

  const handleSuggestionSelect = async (suggestion: {
    text: string;
    placeId: string;
  }) => {
    try {
      const response = await fetch("/getplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: suggestion.placeId }),
      });
      if (response.ok) {
        const data = (await response.json()) as GeocodeResult;
        const address = data.address || {};
        let streetAddress =
          `${address?.AddressNumber || ""} ${address?.Street || ""}`.trim();

        // If address object is empty or doesn't have street info, extract from label
        if (!streetAddress && data.label) {
          const labelParts = data.label.split(",");
          streetAddress = labelParts[0]?.trim() || "";
        }
        setStreet(streetAddress);
        setCity(data.municipality || "");
        setState(data.region || "");
        setZip(data.postalCode || "");
      } else {
        console.error("Failed to fetch place details");
        setStreet(suggestion.text);
      }
    } catch (err) {
      console.error("Error in suggestion select:", err);
      setStreet(suggestion.text);
    }
    setSuggestions([]);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AWS Geolocation Services</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={street}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              setStreet(value);
              if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
              }
              debounceTimer.current = setTimeout(() => {
                if (value.trim() === "") {
                  setSuggestions([]);
                  return;
                }
                fetch(
                  `/api/suggestions?partialAddress=${encodeURIComponent(value)}`,
                )
                  .then((response) => {
                    if (!response.ok) {
                      throw new Error("Failed to fetch suggestions");
                    }
                    return response.json();
                  })
                  .then((data) => {
                    setSuggestions(data.suggestions || []);
                  })
                  .catch((error) => {
                    console.error("Error fetching suggestions:", error);
                    setSuggestions([]);
                  });
              }, 300);
            }}
            placeholder="Street Address"
            required
            className="border p-2 mr-2 mb-2 rounded w-full"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 bg-white border rounded w-full max-h-60 overflow-auto">
              {suggestions.map((sug, index) => (
                <li
                  key={index}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSuggestionSelect(sug)}
                >
                  {sug.text}
                </li>
              ))}
            </ul>
          )}
        </div>
        <input
          type="text"
          value={city}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCity(e.target.value)
          }
          placeholder="City"
          required
          className="border p-2 mr-2 mb-2 rounded w-full"
        />
        <input
          type="text"
          value={state}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setState(e.target.value)
          }
          placeholder="State (e.g., CA)"
          required
          maxLength={2}
          className="border p-2 mr-2 mb-2 rounded w-full"
        />
        <input
          type="text"
          value={zip}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setZip(e.target.value)
          }
          placeholder="Zip Code"
          required
          className="border p-2 mr-2 mb-2 rounded w-full"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded"
        >
          {loading ? "Loading..." : "Geocode"}
        </button>
      </form>
      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
      {result && (
        <div className="border p-4 rounded">
          <h2 className="text-xl font-bold mb-2">Results:</h2>
          <ul className="list-disc pl-5">
            <li>
              <strong>Label:</strong> {result.label}
            </li>
            <li>
              <strong>Country:</strong> {result.country}
            </li>
            <li>
              <strong>Region:</strong> {result.region}
            </li>
            <li>
              <strong>SubRegion:</strong> {result.subRegion}
            </li>
            <li>
              <strong>Municipality:</strong> {result.municipality}
            </li>
            <li>
              <strong>Neighborhood:</strong> {result.neighborhood}
            </li>
            <li>
              <strong>Postal Code:</strong> {result.postalCode}
            </li>
            <li>
              <strong>Coordinates:</strong> {JSON.stringify(result.coordinates)}
            </li>
            <li>
              <strong>State FIPS:</strong> {result.stateFips}
            </li>
            <li>
              <strong>County FIPS:</strong> {result.countyFips}
            </li>
          </ul>
        </div>
      )}
      {showMap && mapConfig && authHelper && (
        <div
          style={{
            height: "400px",
            width: "100%",
            marginTop: "20px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Map
            viewState={viewport}
            onViewStateChange={({
              viewState,
            }: {
              viewState: { latitude: number; longitude: number; zoom: number };
            }) => setViewport(viewState)}
            style={{ width: "100%", height: "100%" }}
            mapStyle={`https://maps.geo.${mapConfig.region}.amazonaws.com/maps/v0/maps/${mapConfig.mapName}/style-descriptor`}
            mapLib={maplibregl}
            {...authHelper.getMapAuthenticationOptions()}
          >
            {result &&
              result.coordinates &&
              Array.isArray(result.coordinates) &&
              result.coordinates.length === 2 && (
                <Marker
                  longitude={result.coordinates[0]}
                  latitude={result.coordinates[1]}
                  anchor="bottom"
                >
                  <div
                    style={{
                      width: "0",
                      height: "0",
                      borderLeft: "10px solid transparent",
                      borderRight: "10px solid transparent",
                      borderTop: "20px solid #ff0000",
                      position: "relative",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                      zIndex: 1000,
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        backgroundColor: "#ff0000",
                        borderRadius: "50%",
                        border: "2px solid #fff",
                        position: "absolute",
                        top: "-16px",
                        left: "-6px",
                        zIndex: 1001,
                      }}
                    />
                  </div>
                </Marker>
              )}
            <NavigationControl />
          </Map>
        </div>
      )}
    </div>
  );
}
