import React, { useState } from "react";
import { createRoot } from "react-dom/client";

function App() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Request failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AWS Geolocation Services</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter address"
          required
          className="border p-2 mr-2 rounded"
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
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
