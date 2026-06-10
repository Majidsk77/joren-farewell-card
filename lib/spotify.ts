/**
 * Converts any Spotify share link or URI into a Spotify embed URL.
 * Returns null if the input doesn't contain a recognisable track ID.
 *
 * Accepted input formats:
 *   https://open.spotify.com/track/TRACKID
 *   https://open.spotify.com/track/TRACKID?si=xxx
 *   spotify:track:TRACKID
 *   https://open.spotify.com/embed/track/TRACKID  ← passed through
 */
export function toSpotifyEmbed(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const s = input.trim();

  let trackId: string | null = null;

  // Already an embed URL — extract the ID and re-normalise
  const embedMatch = s.match(/spotify\.com\/embed\/track\/([A-Za-z0-9]+)/);
  if (embedMatch) trackId = embedMatch[1];

  // Standard share URL
  if (!trackId) {
    const shareMatch = s.match(/spotify\.com\/track\/([A-Za-z0-9]+)/);
    if (shareMatch) trackId = shareMatch[1];
  }

  // Protocol URI  spotify:track:ID
  if (!trackId) {
    const uriMatch = s.match(/spotify:track:([A-Za-z0-9]+)/);
    if (uriMatch) trackId = uriMatch[1];
  }

  if (!trackId) return null;
  return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;
}
