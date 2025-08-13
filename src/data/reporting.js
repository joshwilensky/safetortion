// Lightly opinionated links. If a platform prefers in-app reporting,
// we show instructions instead of (or in addition to) a web link.
export const REPORT_TARGETS = {
  instagram: [
    {
      label: "In-app: Profile → ••• → Report",
      note: "Choose “Report” then follow prompts (Impersonation / Blackmail / Harassment).",
    },
    { label: "Help Center", url: "https://help.instagram.com/165828726894770" },
  ],
  x: [
    {
      label: "In-app: Profile → ⋯ → Report",
      note: "Choose “Abusive or harmful”, then “Private information / Intimate images without consent” if applicable.",
    },
    {
      label: "X Safety Form",
      url: "https://help.twitter.com/forms/abusiveuser",
    },
  ],
  tiktok: [
    {
      label: "In-app: Profile → ⋯ → Report",
      note: "Choose “Bullying/Harassment” or “Illegal activities” as fits.",
    },
    {
      label: "Support",
      url: "https://support.tiktok.com/en/safety-hc/report-a-problem",
    },
  ],
  facebook: [
    {
      label: "In-app: Profile → ••• → Report",
      note: "Pick the closest category; add screenshots.",
    },
    {
      label: "Help Center",
      url: "https://www.facebook.com/help/181495968648557",
    },
  ],
  snapchat: [
    {
      label: "In-app: Profile → ⋯ → Report",
      note: "Use Safety/Harassment categories.",
    },
    { label: "Safety", url: "https://support.snapchat.com/en-US/i-need-help" },
  ],
  reddit: [{ label: "Report User", url: "https://www.reddit.com/report" }],
  youtube: [
    {
      label: "Report Channel (web)",
      note: "Go to the channel → About → Flag icon → Report user.",
    },
    {
      label: "Policy & Reporting",
      url: "https://support.google.com/youtube/answer/2802027",
    },
  ],
  discord: [
    { label: "Trust & Safety Form", url: "https://dis.gd/request" },
    {
      label: "Guidance",
      url: "https://support.discord.com/hc/en-us/articles/360000291932-How-to-Properly-Report-Issues",
    },
  ],
  telegram: [
    {
      label: "In-app: … → Report",
      note: "For public channels, use in-app; you can also email abuse@telegram.org.",
    },
    { label: "Abuse Bot", url: "https://t.me/abuse" },
  ],
  linkedin: [
    {
      label: "Report Profile",
      url: "https://www.linkedin.com/help/linkedin/answer/137902",
    },
  ],
  other: [
    {
      label: "Search: ‘Report abuse <platform>’",
      note: "Look for official support/trust & safety page.",
    },
  ],
};

export function getReportTargets(platformId) {
  return REPORT_TARGETS[platformId] || REPORT_TARGETS.other;
}
