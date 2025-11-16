const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header:
      "eyJmaWQiOjE0Nzg3MDAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgxMGVlMDJiNTJCNkNmMjJDMzQ3ZTNBQTM2Y0IyNDMyQ0JjNjU3ZGE0In0",
    payload: "eyJkb21haW4iOiJoYWNrYXRob24tbWluaS1hcHAudmVyY2VsLmFwcCJ9",
    signature:
      "3S+jdT025phRiunVgu3OdMQCHrAF78KO9lSasNGj6eFed7s708RKl7ps68iaAZnZdDVTklZjUPJrD89usKY3Zhs=",
  },
  miniapp: {
    version: "1",
    name: "PrivateDEX",
    subtitle: "Privacy-Preserving Swaps",
    description: "Private DEX on Base using ZK proofs",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "defi",
    tags: ["defi", "privacy", "zk-proofs", "dex"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`,
    tagline: "Trade with Privacy",
    ogTitle: "PrivateDEX - Privacy-Preserving DEX",
    ogDescription: "Swap tokens privately on Base using zero-knowledge proofs",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
  },
} as const;
