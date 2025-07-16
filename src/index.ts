import { AwsGeocoder } from "./services/awsclientlocation";
import index from "./frontend/index.html";

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
          const body = await req.json();
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
  },
});
