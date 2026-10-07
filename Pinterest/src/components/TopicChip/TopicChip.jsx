import React, { useState } from "react";

// Only maps names whose normalized form differs from the Simple Icons slug.
const SLUG_ALIASES = {
  nodejs: "nodedotjs",
  nextjs: "nextdotjs",
  vuejs: "vuedotjs",
  nuxtjs: "nuxtdotjs",
  expressjs: "express",
  net: "dotnet",
  "c#": "csharp",
  "c++": "cplusplus",
  cpp: "cplusplus",
  js: "javascript",
  ts: "typescript",
  golang: "go",
  k8s: "kubernetes",
  postgres: "postgresql",
  mongo: "mongodb"
};

const PALETTE = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706", "#db2777", "#4f46e5", "#0d9488"];

const LOCAL_LOGOS = {
  react: (
    <svg viewBox="-12 -11 24 22" fill="none" stroke="#61dafb" strokeWidth="1">
      <circle r="2.05" fill="#61dafb" stroke="none" />
      <ellipse rx="11" ry="4.2" />
      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
    </svg>
  ),
  javascript: (
    <svg viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#f7df1e" />
      <text x="22" y="21" textAnchor="end" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="13" fill="#323330">JS</text>
    </svg>
  ),
  nodejs: (
    <svg viewBox="0 0 24 24">
      <polygon points="12,1 21.5,6.5 21.5,17.5 12,23 2.5,17.5 2.5,6.5" fill="#5fa04e" />
      <text x="12" y="15.5" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="9" fill="#fff">JS</text>
    </svg>
  ),
  playwright: (
    <svg viewBox="0 0 24 24">
      <path d="M1 7c0-2 5-3 8-2 1 6-1 12-4 12-2 0-4-5-4-10z" fill="#e2574c" />
      <path d="M9 6c3-1.500 12-1 13 1 0 6-3 15-7 15-4 0-6-9-6-16z" fill="#2ead33" />
      <path d="M12 10c1-1 3-1 4 0M17 10c1-.8 3-.8 4 0M13 15c2 2 5 2 7-1z" fill="#1b1b1b" stroke="#1b1b1b" strokeWidth=".8" />
    </svg>
  ),
  devops: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round">
      <defs>
        <linearGradient id="devopsGrad" x1="0" x2="1">
          <stop offset="0" stopColor="#0b7bd6" />
          <stop offset="1" stopColor="#00c853" />
        </linearGradient>
      </defs>
      <path stroke="url(#devopsGrad)" d="M12 12C10 8 4 8 4 12s6 4 8 0 8-4 8 0-6 4-8 0z" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24">
      <defs>
        <linearGradient id="aiGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cc6" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <path fill="url(#aiGrad)" d="M10 2c.8 6 4 9.200 10 10-6 .8-9.200 4-10 10-.8-6-4-9.200-10-10 6-.8 9.200-4 10-10z" />
      <path fill="url(#aiGrad)" d="M19 1c.3 2.200 1.300 3.200 3.500 3.500-2.200.3-3.200 1.300-3.500 3.500-.3-2.200-1.300-3.200-3.500-3.500C17.700 4.200 18.700 3.200 19 1z" />
    </svg>
  )
};

LOCAL_LOGOS.reactjs = LOCAL_LOGOS.react;
LOCAL_LOGOS.js = LOCAL_LOGOS.javascript;
LOCAL_LOGOS.artificialintelligence = LOCAL_LOGOS.ai;

function getLocalLogo(name) {
  return LOCAL_LOGOS[String(name).trim().toLowerCase().replace(/[^a-z0-9]/g, "")];
}

function getSlug(name) {
  const lower = String(name).trim().toLowerCase();
  if (SLUG_ALIASES[lower]) return SLUG_ALIASES[lower];
  const normalized = lower.replace(/[^a-z0-9+#]/g, "");
  return SLUG_ALIASES[normalized] || normalized.replace(/[^a-z0-9]/g, "");
}

function hashColor(name) {
  let hash = 0;
  for (const char of String(name)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function TopicIcon({ name, size = 16, selected = false }) {
  const [failed, setFailed] = useState(false);
  const localLogo = getLocalLogo(name);
  if (localLogo) {
    return (
      <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
        {React.cloneElement(localLogo, { width: size, height: size })}
      </span>
    );
  }
  const slug = getSlug(name);

  if (!slug || failed) {
    const initial = (String(name).trim()[0] || "?").toUpperCase();
    return (
      <span
        aria-hidden="true"
        className="inline-flex shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
        style={{ width: size, height: size, background: hashColor(name) }}
      >
        {initial}
      </span>
    );
  }

  return (
    <img
      alt=""
      aria-hidden="true"
      className="shrink-0"
      height={size}
      width={size}
      loading="lazy"
      onError={() => setFailed(true)}
      src={`https://cdn.simpleicons.org/${slug}${selected ? "/ffffff" : ""}`}
    />
  );
}

export default function TopicChip({ name, selected = false, disabled = false, onClick }) {
  const interactive = typeof onClick === "function";
  const classes = [
    "inline-flex max-w-full items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold",
    "transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
    selected
      ? "border-transparent bg-gradient-to-r from-[#0b1736] to-[#1e3a8a] text-white shadow-md"
      : "border-slate-200 bg-white/80 text-slate-700 hover:border-blue-300 hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200",
    disabled ? "cursor-not-allowed opacity-50" : interactive ? "cursor-pointer" : "cursor-default"
  ].join(" ");

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
    >
      <TopicIcon name={name} selected={selected} />
      <span className="truncate">{name}</span>
    </button>
  );
}
