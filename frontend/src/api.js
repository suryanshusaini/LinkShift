/**
 * LinkShift API Utility
 * Handles all communication with the backend API.
 */

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Sends a long URL to the backend and returns the shortened URL data.
 * @param {string} longUrl - The original URL to shorten.
 * @returns {Promise<{ shortUrl: string, originalUrl: string }>}
 */
export async function shortenUrl(longUrl) {
  const response = await fetch(`${API_BASE_URL}/shorten`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: longUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Server error: ${response.status}`);
  }

  return response.json();
}
