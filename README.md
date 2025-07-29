# AWS Geolocation Services

This project provides a comprehensive web application for geocoding addresses using AWS Location Service. It features address auto-completion, interactive maps, and detailed location information extraction including country, state, county, and FIPS codes. Built with Bun, TypeScript, and React.

## Features

- **Address Geocoding**: Convert addresses to geographic coordinates with detailed location metadata
- **Auto-Complete Suggestions**: Real-time address suggestions as you type
- **Interactive Maps**: MapLibre GL JS integration with AWS Location Service maps
- **Place Details**: Retrieve comprehensive place information using Place IDs
- **FIPS Code Enrichment**: Automatic state and county FIPS code lookup
- **Responsive UI**: Clean, modern interface built with React and Tailwind CSS

## Prerequisites

- **AWS Configuration**: Ensure you have AWS SSO configured and logged in via `aws sso login`
- **AWS Location Service Resources**:
  - Place Index: `GeoAddressIndex` (Esri provider, us-west-2 region)
  - Map resource configured for visualization
  - Identity Pool for authentication

## Installation

Install dependencies using Bun:

```sh
bun install
```

## Usage

### Development Server

Run the server in development mode with hot module replacement:

```sh
bun --hot src/index.ts
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Web Interface

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Enter an address in the Street Address field (auto-complete will suggest addresses)
3. Fill in City, State, and Zip Code fields (or select from auto-complete)
4. Click "Geocode" to geocode the address and display results
5. View the interactive map with a marker at the geocoded location

### API Usage

Interact with the API directly using the available endpoints:

#### Geocode an Address
```sh
curl -X POST http://localhost:3000/geocode \
  -H "Content-Type: application/json" \
  -d '{"address": "1600 Pennsylvania Ave NW, Washington, DC 20500"}'
```

#### Get Address Suggestions
```sh
curl "http://localhost:3000/api/suggestions?partialAddress=1600%20Penn&maxResults=5"
```

#### Get Place Details
```sh
curl -X POST http://localhost:3000/getplace \
  -H "Content-Type: application/json" \
  -d '{"placeId": "YOUR_PLACE_ID_HERE"}'
```

## Project Structure

```
aws_geolocation_services/
├── src/
│   ├── index.ts                     # Server entry point with Bun.serve()
│   ├── client/                      # React frontend
│   │   ├── index.html              # HTML template
│   │   ├── index.tsx               # React application entry point
│   │   └── App.tsx                 # Main React component with map integration
│   └── server/
│       └── services/
│           └── awsgeocoder.ts      # AWS Location Service integration
├── test/                           # Unit tests
├── data/                          # FIPS code mappings (JSON files)
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # Project documentation
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serves the React frontend |
| `POST` | `/geocode` | Geocode an address and return detailed location data |
| `GET` | `/api/suggestions` | Get address auto-complete suggestions |
| `POST` | `/getplace` | Retrieve detailed place information by Place ID |
| `GET` | `/api/map-config` | Get map configuration for frontend |

### API Parameters

#### `/geocode` (POST)
```json
{
  "address": "1600 Pennsylvania Ave NW, Washington, DC 20500"
}
```

#### `/api/suggestions` (GET)
- `partialAddress` (required): The partial address text to search for
- `maxResults` (optional): Maximum number of suggestions (default: 5)
- `biasLon` (optional): Longitude for location bias
- `biasLat` (optional): Latitude for location bias

#### `/getplace` (POST)
```json
{
  "placeId": "place-id-from-suggestions"
}
```

## Architecture

### Backend
- **Server**: Bun.serve() with TypeScript for high-performance HTTP handling
- **Geocoding Service**: `AwsGeocoder` class encapsulating AWS Location Service interactions
- **Data Enrichment**: FIPS code lookup using local JSON mappings
- **API Design**: RESTful endpoints with comprehensive error handling

### Frontend
- **React Application**: Modern React 18 with TypeScript
- **Map Integration**: MapLibre GL JS with AWS Location Service tiles
- **State Management**: React hooks for form state and API responses
- **Styling**: Tailwind CSS for responsive design
- **Authentication**: AWS Identity Pool integration for map access

### Data Flow
1. User inputs address in the frontend form
2. Auto-complete suggestions fetched from AWS Location Service
3. Address geocoded via `/geocode` endpoint
4. Results enriched with FIPS codes from local data
5. Map displays location with interactive marker
6. Detailed location metadata presented to user

## Address Auto-Completion

The application provides intelligent address auto-completion:

- **Real-time Suggestions**: Suggestions appear as you type in the Street Address field
- **AWS Integration**: Powered by Amazon Location Service's suggestion API
- **Smart Population**: Selecting a suggestion auto-fills city, state, and zip code
- **Geospatial Bias**: Optional location bias for more relevant suggestions

## Interactive Maps

- **MapLibre GL JS**: High-performance vector maps
- **AWS Map Tiles**: Official AWS Location Service map styling
- **Interactive Controls**: Pan, zoom, and navigation controls
- **Custom Markers**: Visual indicators for geocoded locations
- **Responsive Design**: Adapts to different screen sizes

## Testing

Run the test suite:

```sh
bun test
```

The test suite covers:
- `AwsGeocoder` class functionality
- Server route handlers
- API endpoint validation
- Error handling scenarios

## Sample API Response

Geocoding "1600 Pennsylvania Ave NW, Washington, DC 20500" returns:

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
  "countyFips": "001",
  "address": {
    "AddressNumber": "1600",
    "Street": "Pennsylvania Ave NW"
  }
}
```

## Technology Stack

- **Runtime**: [Bun](https://bun.sh) - Fast all-in-one JavaScript runtime
- **Language**: TypeScript for type safety and developer experience
- **Frontend**: React 18 with modern hooks and functional components
- **Maps**: MapLibre GL JS for vector map rendering
- **Styling**: Tailwind CSS for utility-first styling
- **AWS Services**: Location Service (Place Index, Maps, Suggestions API)
- **Authentication**: AWS Identity Pool for secure map access

## Development

The project uses Bun's built-in features:
- Hot module replacement for fast development
- Built-in TypeScript support
- Integrated bundler for frontend assets
- Native test runner

## Contributing

1. Ensure AWS credentials are properly configured
2. Run `bun install` to install dependencies
3. Start the development server with `bun --hot src/index.ts`
4. Run tests with `bun test` before submitting changes

---

*This project was created using `bun init` and leverages Bun's comprehensive JavaScript runtime capabilities.*