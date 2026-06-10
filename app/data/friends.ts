// ============================================================
// HOW TO CUSTOMISE THIS FILE
// ============================================================
//
// 1. PERSON'S NAME (hero section)
//    → Search for "RECIPIENT_NAME" below and replace it with
//      the name of the person you're sending this to.
//
// 2. EACH FRIEND CARD
//    → Find the `friends` array. For each entry:
//      - `name`         Replace with the contributor's name.
//      - `relationship` One-liner: how do they know the recipient?
//      - `message`      Replace with their personal note.
//      - `photos`       Drop image files into /public/photos/ then
//                       update the paths: "/photos/your-file.jpg"
//                       You can have 1–5 photos per card.
//      - `spotify`      Go to Spotify → find the song → Share →
//                       Copy link. The track ID is the part after
//                       "/track/" in the URL, before "?".
//                       Delete the whole `spotify:` key to hide
//                       the embed for that person.
//      - `cardTilt`     Rotation in degrees, e.g. -2 or 1.5.
//                       Keep between -3 and 3.
//      - `accentColor`  Light background colour for the card.
//
// 3. GROUP MESSAGE (bottom section)
//    → Find `groupMessage` at the bottom of this file.
//      Replace title, body, and signatories.
//
// ============================================================

export interface SpotifyTrack {
  /**
   * The track ID from a Spotify share URL.
   * Share URL format: https://open.spotify.com/track/[TRACK_ID]?...
   * Copy everything between "/track/" and the "?" mark.
   */
  trackId: string;
  trackName: string; // Shown on the "play" button before the embed opens
  artist: string;
}

export interface Friend {
  id: string;
  /** Name shown on the card header */
  name: string;
  /** Short line describing the relationship, e.g. "Uni flatmate & 3am crisis manager" */
  relationship: string;
  /** The personal message. Goes in quotes on the card. Keep it heartfelt! */
  message: string;
  /**
   * 1–5 photo paths. Drop files into /public/photos/ and reference as
   * "/photos/your-file.jpg". If a photo is missing, a pretty placeholder
   * is shown automatically.
   */
  photos: string[];
  /** Optional Spotify song embed. Remove the key entirely to hide it. */
  spotify?: SpotifyTrack;
  /** Card rotation in degrees. Suggests values: -2.5 to 2.5 */
  cardTilt: number;
  /** Light background colour for the card. Use a soft pastel. */
  accentColor: string;
}

// ─────────────────────────────────────────────────────────────
// SAMPLE DATA — replace with your own friends below
// ─────────────────────────────────────────────────────────────

export const friends: Friend[] = [

  // ── Card 1 ───────────────────────────────────────────────
  {
    id: "sara",
    name: "Sara",                              // ← replace name
    relationship: "Flatmate & adventure partner",
    message:
      "Living with you has been the greatest plot twist of my life. You turned a random flat share into a home full of inside jokes, late-night kitchen talks, and memories I'll carry forever. Wherever you go, the fun follows — I can't wait to visit you on the other side of the world. Save me a spot on the couch. 🛋️",
    // Drop your photos in /public/photos/ and update these paths:
    photos: ["/photos/sara-1.jpg", "/photos/sara-2.jpg", "/photos/sara-3.jpg"],
    // To get the Spotify track ID: Spotify → song → Share → Copy Link
    // The ID is the string between "/track/" and "?" in the URL:
    spotify: {
      trackId: "4cluDES4hQEUhmXj6TXkSo", // "Golden" – Harry Styles
      trackName: "Golden",
      artist: "Harry Styles",
    },
    cardTilt: -2,
    accentColor: "#FFFBF0",
  },

  // ── Card 2 ───────────────────────────────────────────────
  {
    id: "james",
    name: "James",
    relationship: "Work bestie & coffee enabler",
    message:
      "You made Monday mornings survivable. From our standing coffee order to the endless voice notes — working alongside you has been a genuine privilege. The office is about to feel a lot quieter (and a lot less funny). Go do great things and don't forget us when you're famous.",
    photos: ["/photos/james-1.jpg", "/photos/james-2.jpg"],
    spotify: {
      trackId: "0VjIjW4GlUZAMYd2vXMi3b", // "Blinding Lights" – The Weeknd
      trackName: "Blinding Lights",
      artist: "The Weeknd",
    },
    cardTilt: 1.5,
    accentColor: "#F0F5FF",
  },

  // ── Card 3 ───────────────────────────────────────────────
  {
    id: "priya",
    name: "Priya",
    relationship: "Gym buddy & soul sister",
    message:
      "You are the person I call when something wonderful happens AND when everything falls apart. That kind of friendship is rare and I will never take it for granted. I'm so proud of this adventure you're walking into. Go get everything you've always deserved — you've earned every bit of it. 🌸",
    photos: [
      "/photos/priya-1.jpg",
      "/photos/priya-2.jpg",
      "/photos/priya-3.jpg",
      "/photos/priya-4.jpg",
    ],
    spotify: {
      trackId: "4iJyoBOLtHqaWYs3ovYyID", // "Here Comes the Sun" – The Beatles
      trackName: "Here Comes the Sun",
      artist: "The Beatles",
    },
    cardTilt: -1,
    accentColor: "#FFF0F5",
  },

  // ── Card 4 ───────────────────────────────────────────────
  {
    id: "tom",
    name: "Tom",
    relationship: "Uni housemate, forever friend",
    message:
      "Three years of living in that chaotic house, and somehow we both turned out okay. You've always been the one who pushes everyone around you to dream bigger. Now it's your turn. I'll be watching from here — incredibly jealous but mostly just incredibly proud. Don't be a stranger.",
    photos: ["/photos/tom-1.jpg"],
    // No Spotify for this card — key removed entirely
    cardTilt: 2,
    accentColor: "#F5FFF0",
  },

  // ── Card 5 ───────────────────────────────────────────────
  {
    id: "lucy",
    name: "Lucy",
    relationship: "Childhood friend & partner in crime",
    message:
      "We have been through everything together — the embarrassing phases, the heartbreaks, the glow-ups, all of it. You'll make this new place feel like home before your suitcases are unpacked. I love you to the moon and all the way to wherever you're going. 💛",
    photos: ["/photos/lucy-1.jpg", "/photos/lucy-2.jpg"],
    spotify: {
      trackId: "3Rq3YOF9ZtjHcSKAFnGKCp", // "Vienna" – Billy Joel
      trackName: "Vienna",
      artist: "Billy Joel",
    },
    cardTilt: -2.5,
    accentColor: "#FFF8E7",
  },

  // ── Card 6 ───────────────────────────────────────────────
  {
    id: "alex",
    name: "Alex",
    relationship: "Travel buddy & terrible navigator",
    message:
      "The number of times we've gotten spectacularly lost together and ended up having the best day — I think that's your superpower. You make the detours feel like the point. New country, new city, new adventures. I'm booking flights the second you're settled. Keep the guest room warm.",
    photos: ["/photos/alex-1.jpg", "/photos/alex-2.jpg", "/photos/alex-3.jpg"],
    spotify: {
      trackId: "0tgVpDi06FyKpA1z0VMD4v", // "Fast Car" – Tracy Chapman
      trackName: "Fast Car",
      artist: "Tracy Chapman",
    },
    cardTilt: 1,
    accentColor: "#F0FBFF",
  },

  // ── Card 7 ───────────────────────────────────────────────
  {
    id: "nina",
    name: "Nina",
    relationship: "Book club founder, bad influence",
    message:
      "You were the one who convinced me to join book club, and it changed my life (mostly the wine, but the books too). You have a gift for making people feel seen and heard. Whatever the new chapter holds — pun absolutely intended — it's going to be extraordinary because you are.",
    photos: ["/photos/nina-1.jpg", "/photos/nina-2.jpg"],
    spotify: {
      trackId: "4GeesBEkZLZLFNe8hJFDEb", // "Somewhere Only We Know" – Keane
      trackName: "Somewhere Only We Know",
      artist: "Keane",
    },
    cardTilt: -1.5,
    accentColor: "#F8F0FF",
  },

  // ── Card 8 ───────────────────────────────────────────────
  {
    id: "marcus",
    name: "Marcus",
    relationship: "Football teammate & debate opponent",
    message:
      "The pitch is going to be quieter without you chirpsing everyone from left back. You've been a cornerstone of this group for years — on and off the grass. Go show them what we already know: you're the most determined, most loyal person in any room you walk into. We'll keep your position warm.",
    photos: ["/photos/marcus-1.jpg"],
    // No Spotify for this card
    cardTilt: 2.5,
    accentColor: "#F0F5F0",
  },

  // ── Card 9 ───────────────────────────────────────────────
  {
    id: "elena",
    name: "Elena",
    relationship: "Neighbour turned family",
    message:
      "You knocked on my door to borrow olive oil two years ago and you never really left — and I am so glad for it. Watching you chase this dream has reminded me to chase mine. Thank you for every Sunday dinner, every bad movie night, and every pep talk at exactly the right moment. 🫶",
    photos: ["/photos/elena-1.jpg", "/photos/elena-2.jpg", "/photos/elena-3.jpg"],
    spotify: {
      trackId: "3qFPWBhqxfxoJBEp8FkBRf", // "Dog Days Are Over" – Florence + the Machine
      trackName: "Dog Days Are Over",
      artist: "Florence + the Machine",
    },
    cardTilt: -1,
    accentColor: "#FFF5F0",
  },

  // ── Card 10 ──────────────────────────────────────────────
  {
    id: "ryan",
    name: "Ryan",
    relationship: "Brother from another mother",
    message:
      "Bro. You absolute legend. I still can't believe you're actually doing this — but also, of course you are. You've always been the one who actually does the things the rest of us only talk about. Go smash it. And when you inevitably run some startup or become some kind of local celebrity, remember the little people.",
    photos: ["/photos/ryan-1.jpg", "/photos/ryan-2.jpg"],
    spotify: {
      trackId: "2TpxZ7JUBn3uw46aR7qd6V", // "Mr. Brightside" – The Killers
      trackName: "Mr. Brightside",
      artist: "The Killers",
    },
    cardTilt: 1.5,
    accentColor: "#FFFFF0",
  },
];

// ─────────────────────────────────────────────────────────────
// GROUP MESSAGE
// Replace title, body paragraphs, and signatories list below.
// Separate paragraphs with a blank line (\n\n).
// ─────────────────────────────────────────────────────────────
export const groupMessage = {
  // Replace "RECIPIENT_NAME" with the person's actual name:
  recipientName: "Joren",

  title: "We're all rooting for you.",

  // Write as many paragraphs as you like, separated by blank lines:
  body: "Every person on this page has been shaped by knowing you. You carry this whole group with you wherever you go — in the stories we'll tell, the habits you've quietly given us, and the standard you've set for what a real friend looks like.\n\nThis isn't goodbye. It's just the start of a very expensive texting habit and a very good excuse for group holidays.\n\nGo be brilliant. We'll be watching.",

  // Add or remove names to match your group:
  signatories: [
    "Sara", "James", "Priya", "Tom", "Lucy",
    "Alex", "Nina", "Marcus", "Elena", "Ryan",
  ],
};
