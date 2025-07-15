import { vi, describe, it, expect } from 'vitest';
import { LocationClient, SearchPlaceIndexForTextCommand } from '@aws-sdk/client-location';

// Mock the LocationClient
vi.mock('@aws-sdk/client-location', () => {
  return {
    LocationClient: vi.fn().mockImplementation(() => ({
      send: vi.fn(),
    })),
    SearchPlaceIndexForTextCommand: vi.fn(),
  };
});

describe('geocodeAddress', () => {
  it('should geocode address successfully', async () => {
    const mockSend = vi.fn().mockResolvedValue({
      Results: [
        {
          Place: {
            Label: '1600 Pennsylvania Ave NW, Washington, DC 20500, USA',
            Country: 'USA',
            Region: 'District of Columbia',
            SubRegion: 'District of Columbia',
            Municipality: 'Washington',
            Neighborhood: 'White House Grounds',
            PostalCode: '20500',
            Geometry: {
              Point: [-77.036529, 38.897676],
            },
          },
        },
      ],
    });

    (LocationClient as any).mockImplementation(() => ({
      send: mockSend,
    }));

    const { geocodeAddress } = await import('./index');

    // Redirect console.log to capture output
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await geocodeAddress('1600 Pennsylvania Ave NW, Washington, DC');

    expect(mockSend).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('Resolved Address:', '1600 Pennsylvania Ave NW, Washington, DC 20500, USA');
    // Add more expectations for other logs as needed

    consoleLogSpy.mockRestore();
  });

  it('should handle no results', async () => {
    const mockSend = vi.fn().mockResolvedValue({
      Results: [],
    });

    (LocationClient as any).mockImplementation(() => ({
      send: mockSend,
    }));

    const { geocodeAddress } = await import('./index');

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await geocodeAddress('Invalid Address');

    expect(consoleLogSpy).toHaveBeenCalledWith('No results found for the address.');

    consoleLogSpy.mockRestore();
  });

  it('should handle errors', async () => {
    const mockSend = vi.fn().mockRejectedValue(new Error('API Error'));

    (LocationClient as any).mockImplementation(() => ({
      send: mockSend,
    }));

    const { geocodeAddress } = await import('./index');

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await geocodeAddress('Test Address');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error geocoding address:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });
});
