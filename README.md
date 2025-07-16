# aws_geolocation_services

This project provides a web server application for geocoding addresses using AWS Location Service, extracting details like country, state, county, and more. It includes a React frontend for user interaction and is built with Bun and TypeScript.

## Prerequisites

- Ensure you have AWS SSO configured and logged in via `aws sso login`.
- AWS Location Service Place Index: `GeoAddressIndex` (Esri provider, us-west-2 region).

## Installation

To install dependencies:

```sh
bun install
```

## Usage

Run the server in development mode:

```sh
bun --hot src/index.ts
```

Access the frontend at [http://localhost:3000](http://localhost:3000) to input an address and view geocoding results.

Alternatively, interact with the API directly via the POST `/geocode` endpoint:

```sh
curl -X POST http://localhost:3000/geocode \
  -H "Content-Type: application/json" \
  -d '{"address": "1600 Pennsylvania Ave NW, Washington, DC"}'
```

This will return a JSON response with the geocoded details.

## Project Structure

- `src/index.ts`: Server entry point using `Bun.serve()`.
- `src/services/awsclientlocation.ts`: `AwsGeocoder` class encapsulating AWS Location Service logic.
- `src/frontend/`: React frontend files (index.html, App.tsx).
- `test/`: Unit tests for the geocoder and server.
- `data/`: JSON files for US state and county FIPS codes.

## Architecture

- **Backend**: The server exposes a RESTful API at `/geocode` (POST) which uses the `AwsGeocoder` class to interact with AWS Location Service and enrich results with FIPS codes.
- **Frontend**: A simple React app served at `/` allowing users to input addresses and display results.
- **Data**: FIPS mappings are loaded from JSON files in `data/` and used to augment geocoding responses.

## Testing

Run unit tests with:

```sh
bun test
```

Tests cover the `AwsGeocoder` class and server route handlers.

## Sample API Response

Querying the API with the address "1600 Pennsylvania Ave NW, Washington, DC" produces a JSON response like:

```json
{
  "label": "1600 Pennsylvania Ave NW, Washington, DC 20500, USA",
  "country": "USA",
  "region": "District of Columbia",
  "subRegion": "District of Columbia",
  "municipality": "Washington",
  "neighborhood": "N/A",
  "postalCode": "20500",
  "coordinates": [-77.036546998209, 38.897675107651],
  "stateFips": "11",
  "countyFips": "001"
}
```

This project was created using `bun init` in bun v1.2.18. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
