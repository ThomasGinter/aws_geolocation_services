# aws_geolocation_services

This project provides a CLI tool for geocoding addresses using AWS Location Service, extracting details like country, state, county, and more. It is built with Bun and TypeScript.

## Prerequisites

- Ensure you have AWS SSO configured and logged in via `aws sso login`.
- AWS Location Service Place Index: `GeoAddressIndex` (Esri provider, us-west-2 region).

## Installation

To install dependencies:

```bash
bun install
```

## Usage

Run the CLI with an address as an argument:

```bash
bun run src/index.ts "1600 Pennsylvania Ave NW, Washington, DC"
```

This will geocode the provided address and output resolved details along with the full AWS response.

## Sample Output

Below is a sample JSON response from the AWS Location Service during testing with the address "1600 Pennsylvania Ave NW, Washington, DC":

```json
{
  "$metadata": {
    "httpStatusCode": 200,
    "requestId": "fe27e41b-4742-4023-860b-d78054ddc93c",
    "cfId": "nGnbDYGjueSn8zEfLFRK6GxqzFyjGz-pv4-OL7Gcrv4SiRz3J0YAlA==",
    "attempts": 1,
    "totalRetryDelay": 0
  },
  "Results": [
    {
      "Place": {
        "AddressNumber": "1600",
        "Categories": [
          "AddressType"
        ],
        "Country": "USA",
        "Geometry": {
          "Point": [
            -77.036546998209,
            38.897675107651
          ]
        },
        "Interpolated": false,
        "Label": "1600 Pennsylvania Ave NW, Washington, DC, 20500, USA",
        "Municipality": "Washington",
        "PostalCode": "20500",
        "Region": "District of Columbia",
        "Street": "Pennsylvania Ave NW",
        "SubRegion": "District of Columbia"
      },
      "Relevance": 1
    }
  ],
  "Summary": {
    "DataSource": "Esri",
    "MaxResults": 50,
    "ResultBBox": [
      -77.036546998209,
      38.897675107651,
      -77.036546998209,
      38.897675107651
    ],
    "Text": "1600 Pennsylvania Ave NW, Washington, DC"
  }
}
```

This project was created using `bun init` in bun v1.2.18. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
