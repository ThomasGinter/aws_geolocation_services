import { AwsGeocoder } from "./server/services/awsgeocoder";
import index from "./client/index.html";

const geocoder = new AwsGeocoder();

console.log("Server running on http://localhost:3000");

Bun.serve({
  port: 3000,
  development: {
    hmr: true,
    console: true,
  },
  routes: {
    "/": index,
    "/geocode": {
      POST: async (req) => {
        try {
          const body = (await req.json()) as { address: string };
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
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
    "/api/suggestions": {
      GET: async (req) => {
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
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
    "/getplace": {
      POST: async (req) => {
        try {
          const body = (await req.json()) as { placeId: string };
          const placeId = body.placeId;
          if (!placeId || typeof placeId !== "string") {
            return new Response(
              JSON.stringify({ error: "Valid placeId is required" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const result = await geocoder.getPlace(placeId);

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error(error);
          if (
            error instanceof Error &&
            error.message === "No place found for the given ID"
          ) {
            return new Response(
              JSON.stringify({ error: "No place found for the given ID" }),
              {
                status: 404,
                headers: { "Content-Type": "application/json" },
              },
            );
          }
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
