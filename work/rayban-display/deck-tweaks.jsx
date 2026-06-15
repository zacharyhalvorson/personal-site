/* deck-tweaks.jsx — theme + type controls for the case study deck.
   Mounts a Tweaks panel that drives CSS variables on <html>. */
const { useEffect } = React;

const DECK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "paper",
  "font": "system",
  "accent": "default"
}/*EDITMODE-END*/;

// per-theme accent swatch sets (warm)
const ACCENTS = {
  default: null,
  teal: "oklch(0.555 0.088 197)",
  terracotta: "oklch(0.605 0.142 44)",
  clay: "oklch(0.55 0.108 50)",
  amber: "oklch(0.72 0.13 70)",
  olive: "oklch(0.58 0.07 120)"
};

function DeckTweaks() {
  const [t, setTweak] = useTweaks(DECK_DEFAULTS);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", t.theme);
    root.setAttribute("data-font", t.font);
    if (t.accent && t.accent !== "default" && ACCENTS[t.accent]) {
      root.style.setProperty("--accent", ACCENTS[t.accent]);
    } else {
      root.style.removeProperty("--accent");
    }
  }, [t.theme, t.font, t.accent]);

  return (
    <TweaksPanel>
      <TweakSection label="Visual direction" />
      <TweakRadio
        label="Theme"
        value={t.theme}
        options={["paper", "sand", "ink"]}
        onChange={(v) => setTweak("theme", v)}
      />
      <TweakSection label="Typography" />
      <TweakSelect
        label="Display font"
        value={t.font}
        options={[
          { value: "system", label: "System (site match)" },
          { value: "outfit", label: "Outfit (geometric)" },
          { value: "grotesk", label: "Space Grotesk" }
        ]}
        onChange={(v) => setTweak("font", v)}
      />
      <TweakSection label="Accent" />
      <TweakSelect
        label="Accent color"
        value={t.accent}
        options={[
          { value: "default", label: "Theme default" },
          { value: "teal", label: "Teal" },
          { value: "terracotta", label: "Terracotta" },
          { value: "clay", label: "Clay" },
          { value: "amber", label: "Amber" },
          { value: "olive", label: "Olive" }
        ]}
        onChange={(v) => setTweak("accent", v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("tweaks-root")).render(<DeckTweaks />);
