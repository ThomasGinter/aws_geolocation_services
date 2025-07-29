import { test, expect } from "bun:test";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "../../src/client/App.tsx";

test("App renders without crashing and contains Geocode button", () => {
  const div = document.createElement("div");
  div.id = "root"; // Mimic the root element
  document.body.appendChild(div);

  const root = createRoot(div);
  root.render(<App />);

  // Check if the Geocode button is present
  const button = document.querySelector('button[type="submit"]');
  expect(button).not.toBeNull();
  expect(button?.textContent).toContain("Geocode");

  // Cleanup
  root.unmount();
  document.body.removeChild(div);
});
