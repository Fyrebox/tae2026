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
      skin: "#e0ac8a", shade: "#cc9472", hair: "#3b2a20", top: "#1d3557", trim: "#7fb3d5",
      // Hair tied up in a bun with a swept fringe, small earrings, navy scrubs, a fob watch and an ID lanyard.
      back: `<circle cx="80" cy="36" r="17" fill="#3b2a20"/><path d="M42 92 Q38 44 80 38 Q122 44 118 92 Q112 70 80 66 Q48 70 42 92 Z" fill="#3b2a20"/>`,
      front: `<path d="M46 82 Q46 44 82 42 Q116 44 114 80 Q104 58 74 60 Q56 64 46 82 Z" fill="#3b2a20"/>
              <circle cx="46" cy="98" r="2.6" fill="#7fb3d5"/><circle cx="114" cy="98" r="2.6" fill="#7fb3d5"/>`,
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
    restowner: {
      skin: "#8d5a3b", shade: "#7a4c31", hair: "#1c1714", top: "#2f5d50", trim: "#e9c46a",
      // Short curly hair, a beard, a green shirt and a black apron.
      back: "",
      front: `<path d="M46 80 Q42 48 62 42 Q66 34 80 38 Q94 32 102 42 Q120 48 114 80 Q110 62 96 58 Q80 64 64 58 Q50 62 46 80 Z" fill="#1c1714"/>
              ${[[52, 50], [62, 41], [74, 37], [88, 37], [100, 42], [109, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#1c1714"/>`).join("")}
              <path d="M48 96 Q50 128 80 132 Q110 128 112 96 Q106 116 80 118 Q54 116 48 96 Z" fill="#1c1714"/>`,
      badge: `<path d="M50 200 L54 154 Q80 162 106 154 L110 200 Z" fill="#26262e"/><path d="M54 154 L60 140 M106 154 L100 140" stroke="#26262e" stroke-width="3"/>`,
    },
    customer: {
      skin: "#f3d3b8", shade: "#e4bb9a", hair: "#c9a050", top: "#f4a261", trim: "#fff",
      // Fair hair in a high ponytail and an orange cardigan.
      back: `<path d="M104 44 Q138 52 132 112 Q124 86 108 72 Z" fill="#c9a050"/><path d="M42 90 Q38 44 80 38 Q122 44 118 90 Q112 66 80 62 Q48 66 42 90 Z" fill="#c9a050"/>`,
      front: `<path d="M46 80 Q48 44 82 42 Q114 44 114 74 Q100 56 78 56 Q60 58 46 80 Z" fill="#c9a050"/>
              <circle cx="46" cy="98" r="2.4" fill="#fff"/><circle cx="114" cy="98" r="2.4" fill="#fff"/>`,
      badge: `<path d="M80 158 L80 200" stroke="#e08a43" stroke-width="2"/><circle cx="86" cy="172" r="2.5" fill="#fff"/><circle cx="86" cy="188" r="2.5" fill="#fff"/>`,
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
    kitchen: {
      back: `<rect width="360" height="220" fill="#e9ecef"/>
        <g fill="#fff" stroke="#d3d8dd">${[0, 1, 2, 3, 4, 5, 6, 7].map((c) => [0, 1, 2, 3].map((r) => `<rect x="${c * 46}" y="${r * 30}" width="46" height="30"/>`).join("")).join("")}</g>
        <rect y="150" width="360" height="70" fill="#b8c0c8"/>
        <rect x="20" y="20" width="150" height="6" fill="#8a949e"/>
        ${[0, 1, 2, 3, 4].map((i) => `<rect x="${28 + i * 28}" y="26" width="18" height="10" rx="1" fill="#fffbe6" stroke="#c8b98a"/>`).join("")}
        <rect x="214" y="18" width="120" height="70" rx="6" fill="#c0c7ce"/><rect x="220" y="24" width="108" height="58" rx="4" fill="#d9dee3"/>
        <g fill="#ffb347" opacity=".85">${[236, 272, 308].map((x) => `<rect x="${x}" y="82" width="20" height="6" rx="3"/>`).join("")}</g>
        <g>${[[40, 108, "#9aa5b1"], [76, 112, "#7d8894"], [112, 106, "#9aa5b1"]].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="28" height="22" rx="3" fill="${c}"/><rect x="${x - 4}" y="${y - 3}" width="36" height="5" rx="2" fill="${c}"/>`).join("")}</g>`,
      front: `<rect x="70" y="164" width="270" height="56" fill="#aeb6be"/><rect x="62" y="156" width="286" height="12" rx="3" fill="#d6dbe0"/>
        <rect x="96" y="140" width="60" height="16" rx="3" fill="#f6efe4"/><circle cx="112" cy="146" r="5" fill="#e76f51"/><circle cx="126" cy="146" r="5" fill="#2a9d8f"/><circle cx="140" cy="146" r="5" fill="#e9c46a"/>
        <rect x="270" y="132" width="10" height="26" fill="#6c4f3d"/><rect x="262" y="128" width="26" height="6" rx="2" fill="#8a949e"/>`,
    },
    dining: {
      back: `<rect width="360" height="220" fill="#f3ead8"/>
        <rect y="168" width="360" height="52" fill="#a47551"/>
        <rect x="24" y="22" width="110" height="80" rx="4" fill="#2f3b35"/><rect x="28" y="26" width="102" height="72" rx="2" fill="#3d4a43"/>
        <text x="79" y="44" text-anchor="middle" font-family="Georgia, serif" font-size="12" fill="#f3ead8">Today</text>
        <g stroke="#f3ead8" stroke-width="2" opacity=".7">${[56, 68, 80].map((y) => `<line x1="40" y1="${y}" x2="118" y2="${y}"/>`).join("")}</g>
        ${[200, 270, 330].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="34" stroke="#26262e" stroke-width="1.5"/><path d="M${x - 12} 46 Q${x} 30 ${x + 12} 46 Z" fill="#26262e"/><circle cx="${x}" cy="48" r="4" fill="#ffd166"/>`).join("")}
        <rect x="150" y="60" width="70" height="56" rx="4" fill="#fff"/><rect x="154" y="64" width="62" height="48" fill="#bfe0f2"/><path d="M154 100 Q180 90 216 102 L216 112 L154 112 Z" fill="#7fb3d5"/>`,
      front: `<ellipse cx="220" cy="186" rx="130" ry="18" fill="#fff" stroke="#e2d6c2"/><rect x="92" y="186" width="256" height="34" fill="#fff"/>
        <circle cx="180" cy="180" r="12" fill="#f4f1ea" stroke="#d9cdb8"/><path d="M200 168 L200 186 M206 168 L206 186" stroke="#9aa5b1" stroke-width="2"/>
        <rect x="262" y="166" width="8" height="18" rx="2" fill="#bfe0f2"/>`,
    },
  };

  function scene(name) {
    const s = SCENES[name] || SCENES.desk;
    return { back: svg(360, 220, s.back, "scene-back"), front: svg(360, 220, s.front, "scene-front") };
  }

  return { person, scene, faces: Object.keys(FACES), looks: Object.keys(LOOKS) };
})();
