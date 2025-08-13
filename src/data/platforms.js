// src/data/platforms.js
export const PLATFORMS = [
  {
    id: "instagram",
    name: "Instagram",
    color: "#E1306C",
    hostnames: ["instagram.com"],
    toUrl: (h) => `https://instagram.com/${String(h).replace(/^@/, "")}`,
    fromUrl: (u) => {
      try {
        const { hostname, pathname } = new URL(u);
        if (!endsWithHost(hostname, ["instagram.com"])) return null;
        const m = pathname.match(/^\/([A-Za-z0-9_.]+)(?:\/|$)/);
        return m ? m[1] : null;
      } catch {
        return null;
      }
    },
  },
  {
    id: "x",
    name: "X (Twitter)",
    color: "#1DA1F2",
    hostnames: ["x.com", "twitter.com", "mobile.twitter.com"],
    toUrl: (h) => `https://x.com/${String(h).replace(/^@/, "")}`,
    fromUrl: (u) => {
      try {
        const { hostname, pathname } = new URL(u);
        if (!endsWithHost(hostname, ["x.com", "twitter.com"])) return null;
        const m = pathname.match(/^\/([A-Za-z0-9_]{1,15})(?:\/|$)/);
        return m ? m[1] : null;
      } catch {
        return null;
      }
    },
  },
  {
    id: "tiktok",
    name: "TikTok",
    color: "#69C9D0",
    hostnames: ["tiktok.com"],
    toUrl: (h) => `https://www.tiktok.com/@${String(h).replace(/^@/, "")}`,
    fromUrl: (u) => {
      try {
        const { hostname, pathname } = new URL(u);
        if (!endsWithHost(hostname, ["tiktok.com"])) return null;
        const m = pathname.match(/^\/@([A-Za-z0-9._]+)(?:\/|$)/);
        return m ? m[1] : null;
      } catch {
        return null;
      }
    },
  },
  {
    id: "facebook",
    name: "Facebook",
    color: "#1877F2",
    hostnames: ["facebook.com", "m.facebook.com"],
    toUrl: (h) => `https://facebook.com/${String(h).replace(/^@/, "")}`,
    fromUrl: (u) => {
      try {
        const { hostname, pathname, searchParams } = new URL(u);
        if (!endsWithHost(hostname, ["facebook.com"])) return null;
        const id = searchParams.get("id"); // profile.php?id=123
        if (id) return id;
        const m = pathname.match(/^\/([A-Za-z0-9.\-]+)(?:\/|$)/);
        return m ? m[1] : null;
      } catch {
        return null;
      }
    },
  },
  {
    id: "snapchat",
    name: "Snapchat",
    color: "#FFFC00",
    hostnames: ["snapchat.com"],
    toUrl: (h) => `https://www.snapchat.com/add/${String(h).replace(/^@/, "")}`,
    fromUrl: (u) => {
      try {
        const { hostname, pathname } = new URL(u);
        if (!endsWithHost(hostname, ["snapchat.com"])) return null;
        const m = pathname.match(/^\/add\/([A-Za-z0-9._-]+)(?:\/|$)/);
        return m ? m[1] : null;
      } catch {
        return null;
      }
    },
  },
  {
    id: "reddit",
    name: "Reddit",
    color: "#FF4500",
    hostnames: ["reddit.com", "old.reddit.com", "www.reddit.com"],
    toUrl: (h) =>
      `https://www.reddit.com/user/${String(h).replace(/^u\//, "")}`,
    fromUrl: (u) => {
      try {
        const { hostname, pathname } = new URL(u);
        if (!endsWithHost(hostname, ["reddit.com"])) return null;
        const m = pathname.match(/^\/user\/([A-Za-z0-9_-]+)(?:\/|$)/);
        return m ? m[1] : null;
      } catch {
        return null;
      }
    },
  },
  {
    id: "youtube",
    name: "YouTube",
    color: "#FF0000",
    hostnames: ["youtube.com", "www.youtube.com"],
    toUrl: (h) => `https://www.youtube.com/@${String(h).replace(/^@/, "")}`,
    fromUrl: (u) => {
      try {
        const { hostname, pathname } = new URL(u);
        if (!endsWithHost(hostname, ["youtube.com"])) return null;
        const m = pathname.match(/^\/@([A-Za-z0-9._-]+)(?:\/|$)/);
        return m ? m[1] : null;
      } catch {
        return null;
      }
    },
  },
  {
    id: "discord",
    name: "Discord (user/tag/server)",
    color: "#5865F2",
    hostnames: ["discord.com", "discord.gg"],
    toUrl: (h) => {
      const v = String(h);
      if (/^https?:\/\//i.test(v)) return v;
      return `https://discord.com/users/${v}`;
    },
    fromUrl: (u) => {
      try {
        const { hostname, pathname } = new URL(u);
        if (endsWithHost(hostname, ["discord.gg"])) {
          return pathname.replace(/^\//, "") || null; // invite code
        }
        if (endsWithHost(hostname, ["discord.com"])) {
          const m = pathname.match(/^\/users\/(\d+)(?:\/|$)/);
          return m ? m[1] : null;
        }
        return null;
      } catch {
        return null;
      }
    },
  },
  {
    id: "telegram",
    name: "Telegram",
    color: "#229ED9",
    hostnames: ["t.me", "telegram.me"],
    toUrl: (h) => `https://t.me/${String(h).replace(/^@/, "")}`,
    fromUrl: (u) => {
      try {
        const { hostname, pathname } = new URL(u);
        if (!endsWithHost(hostname, ["t.me", "telegram.me"])) return null;
        const m = pathname.match(/^\/([A-Za-z0-9_]+)(?:\/|$)/);
        return m ? m[1] : null;
      } catch {
        return null;
      }
    },
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    color: "#0A66C2",
    hostnames: ["linkedin.com"],
    toUrl: (h) => `https://www.linkedin.com/in/${String(h).replace(/^@/, "")}`,
    fromUrl: (u) => {
      try {
        const { hostname, pathname } = new URL(u);
        if (!endsWithHost(hostname, ["linkedin.com"])) return null;
        const m = pathname.match(/^\/in\/([A-Za-z0-9-]+)(?:\/|$)/);
        return m ? m[1] : null;
      } catch {
        return null;
      }
    },
  },
  {
    id: "other",
    name: "Other / Unknown",
    color: "#9aa3b9",
    hostnames: [],
    toUrl: (h) => String(h),
    fromUrl: () => null,
  },
];

export function platformById(id) {
  return PLATFORMS.find((p) => p.id === id) || PLATFORMS[PLATFORMS.length - 1];
}

export function detectPlatformFromUrl(u) {
  try {
    const { hostname } = new URL(u);
    const host = hostname.replace(/^www\./, "");
    return (
      PLATFORMS.find((p) =>
        p.hostnames.some((h) => host === h || host.endsWith(`.${h}`))
      ) || null
    );
  } catch {
    return null;
  }
}

// helpers
function endsWithHost(hostname, list) {
  const h = hostname.toLowerCase();
  return list.some((base) => h === base || h.endsWith(`.${base}`));
}
