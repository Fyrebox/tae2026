// Drawings for the workplace games, as SVG strings: scenes (a back layer and a front layer, so a character can
// stand behind the counter) and characters with four faces. All original artwork, drawn in code.
window.GameArt = (() => {
  const svg = (w, h, body, cls = "") => `<svg class="${cls}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMax meet">${body}</svg>`;

  // ---- Characters (160 × 200, a head-and-shoulders bust) ----
  const LOOKS = {
    owner: {
      skin: "#b97a57", shade: "#a0664a", hair: "#211b26", top: "#26262e", trim: "#c2185b",
      // A sleek bob with a pink streak, small gold earrings and a scissors badge.
      back: `<path d="M40 86 Q36 40 80 34 Q124 40 120 86 L122 120 Q100 128 80 124 Q60 128 38 120 Z" fill="#211b26"/>`,
      front: `<path d="M44 82 Q46 42 82 40 Q118 42 116 80 Q108 60 84 56 Q62 58 52 74 Z" fill="#211b26"/>
              <path d="M98 48 Q112 56 114 80 L108 78 Q106 60 94 52 Z" fill="#c2185b"/>
              <circle cx="46" cy="98" r="3.2" fill="#e0b84a"/><circle cx="114" cy="98" r="3.2" fill="#e0b84a"/>`,
      badge: `<g transform="translate(98 168) rotate(-20)"><circle cx="-6" cy="8" r="4" fill="none" stroke="#fff" stroke-width="2"/><circle cx="6" cy="8" r="4" fill="none" stroke="#fff" stroke-width="2"/><path d="M-4 5 L6 -10 M4 5 L-6 -10" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>`,
    },
    client: {
      skin: "#f1c6a0", shade: "#e2ad85", hair: "#7a4128", top: "#2a9d8f", trim: "#f4d35e",
      // Long wavy hair down to the shoulders.
      back: `<path d="M36 90 Q30 38 80 32 Q130 38 124 90 Q132 130 120 158 Q104 150 100 128 L60 128 Q56 150 40 158 Q28 130 36 90 Z" fill="#7a4128"/>`,
      front: `<path d="M46 84 Q44 44 80 40 Q116 44 114 84 Q104 62 82 60 Q64 64 56 58 Q52 72 46 84 Z" fill="#7a4128"/>
              <path d="M44 86 Q40 110 48 128" stroke="#5e2f1c" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M116 86 Q120 110 112 128" stroke="#5e2f1c" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      badge: "",
    },
    manager: {
      skin: "#e0ac8a", shade: "#cc9472", hair: "#2b2b2b", top: "#1d3557", trim: "#7fb3d5",
      // Short hair with a side part, navy scrubs, a fob watch and an ID lanyard.
      back: "",
      front: `<path d="M46 80 Q44 44 80 40 Q118 42 114 78 Q112 60 96 54 Q78 62 58 58 Q50 66 46 80 Z" fill="#2b2b2b"/>`,
      badge: `<path d="M64 142 L74 176 M96 142 L86 176" stroke="#7fb3d5" stroke-width="3"/><rect x="72" y="174" width="16" height="20" rx="2" fill="#fff"/><rect x="75" y="178" width="10" height="6" fill="#7fb3d5"/>
              <circle cx="112" cy="166" r="7" fill="#fff" stroke="#7fb3d5" stroke-width="2"/><path d="M112 162 L112 166 L115 168" stroke="#1d3557" stroke-width="1.5" fill="none"/>`,
    },
    patient: {
      skin: "#efc3a1", shade: "#dba783", hair: "#a9adb3", top: "#a8d0e6", trim: "#7fb3d5",
      // An older man: grey hair at the sides, glasses and a hospital gown.
      back: "",
      front: `<path d="M44 94 Q41 66 53 54 Q50 76 55 94 Z" fill="#a9adb3"/><path d="M116 94 Q119 66 107 54 Q110 76 105 94 Z" fill="#a9adb3"/>`,
      badge: `<g fill="#7fb3d5">${[[40, 176], [60, 190], [104, 184], [124, 172], [84, 194]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join("")}</g>`,
      over: `<g fill="none" stroke="#3a3f47" stroke-width="2.5"><circle cx="66" cy="78" r="10"/><circle cx="94" cy="78" r="10"/><path d="M76 78 L84 78"/></g>`,
    },
  };

  const FACES = {
    happy: {
      brows: `<path d="M58 66 Q66 61 74 65" /><path d="M86 65 Q94 61 102 66" />`,
      eyes: `<ellipse cx="66" cy="78" rx="4" ry="5"/><ellipse cx="94" cy="78" rx="4" ry="5"/>`,
      mouth: `<path d="M66 102 Q80 116 94 102 Q80 108 66 102 Z" fill="#7a2e2e" stroke="#5a1f1f" stroke-width="2" stroke-linejoin="round"/>`,
    },
    worried: {
      brows: `<path d="M58 68 L74 62" /><path d="M86 62 L102 68" />`,
      eyes: `<ellipse cx="66" cy="79" rx="4" ry="4.5"/><ellipse cx="94" cy="79" rx="4" ry="4.5"/>`,
      mouth: `<path d="M68 109 Q80 100 92 109" fill="none" stroke="#5a1f1f" stroke-width="3" stroke-linecap="round"/>`,
    },
    thinking: {
      brows: `<path d="M58 64 Q66 58 74 62" /><path d="M86 66 L102 66" />`,
      eyes: `<ellipse cx="68" cy="76" rx="4" ry="5"/><ellipse cx="96" cy="76" rx="4" ry="5"/>`,
      mouth: `<path d="M70 106 L90 103" fill="none" stroke="#5a1f1f" stroke-width="3" stroke-linecap="round"/>`,
    },
    surprised: {
      brows: `<path d="M58 60 Q66 54 74 58" /><path d="M86 58 Q94 54 102 60" />`,
      eyes: `<ellipse cx="66" cy="78" rx="5" ry="6.5"/><ellipse cx="94" cy="78" rx="5" ry="6.5"/>`,
      mouth: `<ellipse cx="80" cy="106" rx="6" ry="8" fill="#7a2e2e" stroke="#5a1f1f" stroke-width="2"/>`,
    },
  };

  function person(look, face = "happy") {
    const L = LOOKS[look] || LOOKS.owner;
    const F = FACES[face] || FACES.happy;
    return svg(160, 200, `
      ${L.back}
      <path d="M14 200 Q16 150 56 140 L104 140 Q144 150 146 200 Z" fill="${L.top}"/>
      <path d="M62 140 L80 158 L98 140" fill="none" stroke="${L.trim}" stroke-width="4" stroke-linejoin="round"/>
      ${L.badge}
      <rect x="68" y="112" width="24" height="32" rx="10" fill="${L.shade}"/>
      <ellipse cx="80" cy="84" rx="34" ry="40" fill="${L.skin}"/>
      <ellipse cx="46" cy="88" rx="5" ry="8" fill="${L.shade}"/><ellipse cx="114" cy="88" rx="5" ry="8" fill="${L.shade}"/>
      ${L.front}
      <g class="brows" fill="none" stroke="${L.hair}" stroke-width="3.5" stroke-linecap="round">${F.brows}</g>
      <g class="eyes" fill="#2b2024">${F.eyes}</g>
      <circle cx="67.5" cy="76" r="1.4" fill="#fff"/><circle cx="95.5" cy="76" r="1.4" fill="#fff"/>
      ${L.over || ""}
      <path d="M80 84 Q77 94 81 96" fill="none" stroke="${L.shade}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="60" cy="96" r="6" fill="#e07a6a" opacity=".25"/><circle cx="100" cy="96" r="6" fill="#e07a6a" opacity=".25"/>
      <g class="mouth">${F.mouth}</g>`, `person ${look}`);
  }

  // ---- Scenes (360 × 220) ----
  const bottle = (x, h, c) => `<rect x="${x}" y="${92 - h}" width="10" height="${h}" rx="3" fill="${c}"/><rect x="${x + 3}" y="${88 - h}" width="4" height="5" fill="#555"/>`;
  const SCENES = {
    desk: {
      back: `<rect width="360" height="220" fill="#f6e7df"/>
        <rect y="170" width="360" height="50" fill="#d9c2b0"/>
        <rect x="24" y="24" width="120" height="30" rx="6" fill="#26262e"/>
        <text x="84" y="44" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#fff">Harbour Hair</text>
        <rect x="200" y="92" width="130" height="5" fill="#a77b68"/>
        ${bottle(208, 22, "#c2185b")}${bottle(224, 28, "#2a9d8f")}${bottle(240, 18, "#e0b84a")}${bottle(256, 26, "#7b5ea7")}${bottle(272, 22, "#c2185b")}${bottle(288, 30, "#2a9d8f")}${bottle(304, 20, "#e0b84a")}
        <rect x="200" y="130" width="130" height="5" fill="#a77b68"/>
        <path d="M40 170 L46 128 L66 128 L72 170 Z" fill="#b06a4f"/><circle cx="50" cy="118" r="16" fill="#5f9e6e"/><circle cx="64" cy="112" r="14" fill="#4f8a5e"/>`,
      front: `<rect x="90" y="168" width="230" height="52" rx="6" fill="#8c5e58"/><rect x="84" y="160" width="242" height="12" rx="4" fill="#b07d73"/>
        <rect x="110" y="148" width="28" height="14" rx="2" fill="#2b2f36"/><rect x="112" y="150" width="24" height="9" fill="#7ab8d9"/>`,
    },
    office: {
      back: `<rect width="360" height="220" fill="#e8eef2"/>
        <rect y="176" width="360" height="44" fill="#c9b8a6"/>
        <rect x="22" y="26" width="96" height="78" rx="4" fill="#fff"/><rect x="28" y="32" width="84" height="66" fill="#bfe0f2"/><path d="M28 80 Q60 66 112 82 L112 98 L28 98 Z" fill="#9ccc9c"/>
        <rect x="250" y="24" width="84" height="74" rx="4" fill="#fff" stroke="#c7cfd6"/><rect x="250" y="24" width="84" height="16" fill="#c2185b"/>
        <g fill="#c7cfd6">${[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => `<rect x="${256 + c * 15}" y="${46 + r * 12}" width="11" height="8"/>`).join("")).join("")}</g>
        <rect x="285" y="58" width="11" height="8" fill="#e0b84a"/>`,
      front: `<rect x="70" y="168" width="250" height="12" rx="3" fill="#8a6a52"/><rect x="84" y="180" width="10" height="40" fill="#6e533f"/><rect x="296" y="180" width="10" height="40" fill="#6e533f"/>
        <rect x="120" y="138" width="54" height="32" rx="3" fill="#2b2f36"/><rect x="124" y="142" width="46" height="24" fill="#7ab8d9"/><rect x="112" y="168" width="70" height="4" rx="2" fill="#4a4f57"/>
        <rect x="262" y="150" width="16" height="18" rx="3" fill="#fff" stroke="#c7cfd6"/><path d="M278 154 Q286 158 278 164" fill="none" stroke="#c7cfd6" stroke-width="3"/>`,
    },
    colour: {
      back: `<rect width="360" height="220" fill="#ede3f2"/>
        <rect y="180" width="360" height="40" fill="#cbb8d4"/>
        <rect x="200" y="20" width="130" height="120" rx="60" fill="#fff"/><rect x="208" y="28" width="114" height="104" rx="52" fill="#d8e6ee"/>
        ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${212 + i * 26}" cy="16" r="5" fill="#f4d35e"/>`).join("")}
        <rect x="30" y="120" width="70" height="8" rx="2" fill="#9a8aa6"/><rect x="36" y="128" width="6" height="52" fill="#7d6d8a"/><rect x="88" y="128" width="6" height="52" fill="#7d6d8a"/>
        <circle cx="48" cy="114" r="9" fill="#c2185b"/><circle cx="72" cy="114" r="9" fill="#e0b84a"/><rect x="82" y="96" width="4" height="22" fill="#26262e"/>`,
      front: `<rect x="110" y="178" width="200" height="42" rx="10" fill="#26262e"/><rect x="104" y="160" width="22" height="40" rx="8" fill="#3a3a44"/><rect x="294" y="160" width="22" height="40" rx="8" fill="#3a3a44"/>`,
    },
    station: {
      back: `<rect width="360" height="220" fill="#e3f1ef"/>
        <rect y="172" width="360" height="48" fill="#c5d6d3"/>
        <rect x="22" y="22" width="96" height="28" rx="6" fill="#1d3557"/>
        <text x="70" y="41" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#fff">Ward 4B</text>
        <rect x="196" y="24" width="140" height="84" rx="4" fill="#fff" stroke="#9fb7b4"/>
        <g>${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${204 + c * 32}" y="${32 + r * 24}" width="26" height="18" rx="2" fill="${["#cfe8e4", "#f6d6a8", "#cfe8e4", "#e8c4cf"][(r + c) % 4]}"/>`).join("")).join("")}</g>
        <circle cx="160" cy="40" r="15" fill="#fff" stroke="#1d3557" stroke-width="3"/><path d="M160 30 L160 40 L167 44" stroke="#1d3557" stroke-width="2.5" fill="none"/>
        <rect x="40" y="96" width="14" height="26" rx="3" fill="#fff" stroke="#9fb7b4"/><rect x="43" y="90" width="8" height="7" fill="#2a9d8f"/>`,
      front: `<rect x="80" y="166" width="250" height="54" rx="6" fill="#4f7c82"/><rect x="74" y="158" width="262" height="12" rx="4" fill="#6b9aa0"/>
        <rect x="104" y="120" width="56" height="38" rx="3" fill="#2b2f36"/><rect x="108" y="124" width="48" height="28" fill="#7ab8d9"/><rect x="128" y="156" width="8" height="6" fill="#2b2f36"/>`,
    },
    bedside: {
      back: `<rect width="360" height="220" fill="#eef2f6"/>
        <rect y="180" width="360" height="40" fill="#cfd8df"/>
        <rect x="132" y="22" width="90" height="64" rx="4" fill="#fff"/><rect x="138" y="28" width="78" height="52" fill="#bfe0f2"/>
        <rect x="40" y="20" width="4" height="150" fill="#9aa5b1"/><rect x="28" y="20" width="28" height="4" fill="#9aa5b1"/><rect x="30" y="26" width="22" height="34" rx="6" fill="#e8f4fb" stroke="#9aa5b1"/>
        <path d="M41 60 Q44 100 70 130" stroke="#9aa5b1" stroke-width="1.5" fill="none"/>
        <rect x="262" y="26" width="84" height="60" rx="4" fill="#1f2a33"/>
        <polyline points="268,60 282,60 286,52 290,68 294,40 298,74 302,60 318,60 322,54 326,62 340,60" fill="none" stroke="#4ade80" stroke-width="2"/>
        <text x="270" y="44" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#4ade80">HR 72</text>
        <text x="306" y="80" font-family="system-ui, sans-serif" font-size="9" fill="#7dd3fc">SpO2 97</text>`,
      front: `<rect x="96" y="170" width="236" height="50" rx="8" fill="#fff" stroke="#c8d3dc"/><rect x="96" y="182" width="236" height="10" fill="#a8d0e6"/>
        <rect x="88" y="150" width="8" height="70" rx="3" fill="#9aa5b1"/><rect x="332" y="150" width="8" height="70" rx="3" fill="#9aa5b1"/>`,
    },
  };

  function scene(name) {
    const s = SCENES[name] || SCENES.desk;
    return { back: svg(360, 220, s.back, "scene-back"), front: svg(360, 220, s.front, "scene-front") };
  }

  return { person, scene, faces: Object.keys(FACES), looks: Object.keys(LOOKS) };
})();
