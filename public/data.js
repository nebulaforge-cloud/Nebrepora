// Nebrepora content. Shared by the browser app (app.js) and the build-time
// prerender (scripts/prerender.mjs), so crawlers get the same board users see.

export const SITE = {
  name: "Nebrepora",
  url: "https://nebrepora.nebulaforge.dev",
  title: "Nebrepora — Open-source signal board for game & tech studios",
  description: "Nebrepora scores organic velocity (1–100) for open-source repos, papers and dev tools across engineering, game UI/UX, art and studio ops. Spot breakouts early.",
  tagline: "Spot high-potential open-source tools before they go viral.",
  updated: "2026-09-11",
  repo: "https://github.com/nebulaforge-cloud/Nebrepora",
  org: { name: "NebulaForge", url: "https://nebulaforge.dev", sameAs: ["https://github.com/nebulaforge-cloud"] }
};

export const BANDS = [
  { range: "80–100", cls: "vel-high", label: "High signal", text: "Sharp technical leap, real builder chatter, not launch-week noise." },
  { range: "50–79", cls: "vel-mid", label: "Building", text: "Credible momentum, still proving itself." },
  { range: "1–49", cls: "vel-low", label: "Watch", text: "Interesting, not yet a breakout." }
];

export const FAQ = [
  { q: "What is Nebrepora?",
    a: "Nebrepora is a free signal board that tracks early open-source and developer-tool breakthroughs for game and tech studios. It scores each repo, paper, web product, or tool for organic velocity from 1 to 100 and groups signals by studio department: Engineering, Game UI/UX, Art, and Other engineering." },
  { q: "How is the organic velocity score calculated?",
    a: "The score weighs how sharp the technical leap is and how much genuine builder discussion a project has — not its GitHub star count. 80–100 is High signal, 50–79 is Building, and 1–49 is Watch. Launch-week marketing, star-bombing, and milestone posts with no technical substance are ignored." },
  { q: "Which departments and categories does Nebrepora cover?",
    a: "Engineering (compilers, systems, databases, AI infrastructure, full-stack and dev tools), Game UI/UX (HUD, menus, immediate-mode and engine UI), Art (pixel, 3D, VFX, DCC and animation tools), and Other engineering (audio, live-ops, build, QA, and source control)." },
  { q: "What does Run scan do?",
    a: "Run scan adds up to three new signals that match your scan focus and the current department and category filters. In this public edition, scans draw from a curated scan pool rather than a live API, so results are consistent and need no account or key." },
  { q: "Can I shortlist, compare, and export signals?",
    a: "Yes. Pin up to four signals to get a side-by-side compare table. Export downloads the filtered board as a Markdown briefing and a JSON file, Copy TL;DR copies a one-paragraph summary, and Deep inspect shows analysis, live GitHub metrics, and competitors." },
  { q: "Does Nebrepora need an account or collect personal data?",
    a: "No. There is no sign-up, no cookies, and no analytics. Your pins are stored only in your own browser (localStorage) and never leave your device. Everything, including fonts, is served from this site — no third-party requests." },
  { q: "How current is the data?",
    a: `GitHub metrics — stars, 7- and 30-day star growth, commits in the last 30 days, last push, and latest release — refresh automatically every day from the GitHub API. Velocity scores, hooks, and analysis are analyst judgments reviewed by hand; the watchlist was last reviewed on ${SITE.updated}.` }
];

export const DEPTS = [
  {id:"All", name:"All departments", blurb:"Studio-wide signal board."},
  {id:"Engineering", name:"Engineering", blurb:"Compilers, systems, data, AI infra, tooling."},
  {id:"Game UI/UX", name:"Game UI / UX", blurb:"HUD, menus, interaction, game feel, accessibility."},
  {id:"Art", name:"Art", blurb:"Pixel, 3D, VFX, pipelines, look-dev kits."},
  {id:"Other Eng", name:"Other engineering", blurb:"Audio, live-ops, tools, QA, platform, build."}
];
export const LANES = ["Engineering","Game UI/UX","Art","Other Eng"];
export const CATS = ["All","AI/Infra","Compilers","Systems","FullStack","Database","DevTools","Game UI/UX","Art","Audio","LiveOps","Tools/QA"];
export const KINDS = ["All","Repo","Paper","Web","Tool"];
export const SORT_LABEL = {score:"sorted by score", rising:"sorted by 7-day star growth", az:"sorted A–Z", cat:"sorted by category"};

export const WATCHLIST = [
  // Engineering
  {id:"uv", name:"uv", url:"https://github.com/astral-sh/uv", hook:"Rust-speed Python package manager replacing pip+venv friction.", tech:"Single binary resolver/installer that makes Python env setup feel like a compiled toolchain.", score:91, sentiment:"Builders treating uv as default infra, not a toy.", category:"DevTools", dept:"Engineering", kind:"Repo", source:"watchlist", citations:["astral.sh","github.com/astral-sh/uv"]},
  {id:"oxc", name:"Oxc", url:"https://github.com/oxc-project/oxc", hook:"One Rust parser/linter/compiler stack for the JS toolchain.", tech:"Shared AST + native speed collapsing ESLint/Prettier/TS-check work.", score:88, sentiment:"Compiler folks calling it the next JS infrastructure layer.", category:"Compilers", dept:"Engineering", kind:"Repo", source:"watchlist", citations:["oxc.rs","github.com/oxc-project/oxc"]},
  {id:"jj", name:"Jujutsu (jj)", url:"https://github.com/jj-vcs/jj", hook:"Git-compatible VCS with first-class conflicts and revsets.", tech:"Operation log + working-copy commits change how people rebase and undo.", score:84, sentiment:"Systems engineers quietly switching daily drivers.", category:"Systems", dept:"Engineering", kind:"Repo", source:"watchlist", citations:["jj-vcs.github.io","github.com/jj-vcs/jj"]},
  {id:"libsql", name:"libSQL", url:"https://github.com/tursodatabase/libsql", hook:"SQLite fork with native replicas and HTTP.", tech:"Embedded SQL that can replicate without bolting on a separate server.", score:82, sentiment:"Edge/app builders using it as the default local-first store.", category:"Database", dept:"Engineering", kind:"Repo", source:"watchlist", citations:["turso.tech","github.com/tursodatabase/libsql"]},
  {id:"zed", name:"Zed", url:"https://github.com/zed-industries/zed", hook:"GPU-accelerated editor built for pair programming.", tech:"CRDT collaboration + Rust UI that stays instant on large trees.", score:86, sentiment:"Devtools chatter shifting from novelty to daily editor.", category:"DevTools", dept:"Engineering", kind:"Repo", source:"watchlist", citations:["zed.dev","github.com/zed-industries/zed"]},
  {id:"candle", name:"Candle", url:"https://github.com/huggingface/candle", hook:"Minimal Rust ML framework for running models without Python.", tech:"Serverless-friendly tensors and Hugging Face weights in a tiny runtime.", score:79, sentiment:"Infra teams prototyping on-device and edge inference.", category:"AI/Infra", dept:"Engineering", kind:"Repo", source:"watchlist", citations:["huggingface.co","github.com/huggingface/candle"]},
  // Game UI/UX
  {id:"dearimgui", name:"Dear ImGui", url:"https://github.com/ocornut/imgui", hook:"Immediate-mode UI that game tools and debug HUDs still ship on.", tech:"Tiny C++ UI core used for editors, debug overlays, and live tuners.", score:87, sentiment:"Tools engineers treat it as the default in-game panel kit.", category:"Game UI/UX", dept:"Game UI/UX", kind:"Repo", source:"watchlist", citations:["github.com/ocornut/imgui"]},
  {id:"godot", name:"Godot", url:"https://github.com/godotengine/godot", hook:"Open engine with first-class Control nodes for game UI.", tech:"Theme system + Control tree that ships menus without a separate UI stack.", score:90, sentiment:"Indie UI teams moving prototypes off Unity uGUI.", category:"Game UI/UX", dept:"Game UI/UX", kind:"Repo", source:"watchlist", citations:["godotengine.org","github.com/godotengine/godot"]},
  {id:"r3f", name:"React Three Fiber", url:"https://github.com/pmndrs/react-three-fiber", hook:"Declarative 3D scenes for web game shells and 3D menus.", tech:"React reconciler over Three.js — HUD and world in one component tree.", score:81, sentiment:"Web game UX teams building diegetic menus in-browser.", category:"Game UI/UX", dept:"Game UI/UX", kind:"Repo", source:"watchlist", citations:["docs.pmnd.rs","github.com/pmndrs/react-three-fiber"]},
  {id:"bevy", name:"Bevy", url:"https://github.com/bevyengine/bevy", hook:"Rust ECS engine with a growing UI and rendering stack.", tech:"Data-driven UI + render graph that tools and gameplay share.", score:85, sentiment:"Systems + UX engineers prototyping HUD in ECS.", category:"Game UI/UX", dept:"Game UI/UX", kind:"Repo", source:"watchlist", citations:["bevyengine.org","github.com/bevyengine/bevy"]},
  {id:"rive", name:"Rive", url:"https://rive.app/", repo:"rive-app/rive-runtime", hook:"Runtime motion for HUDs and diegetic menus.", tech:"State-machine animations authored once and played by a small runtime in-engine and on web.", score:84, sentiment:"UI animators replacing sprite-sheet HUD motion with state machines.", category:"Game UI/UX", dept:"Game UI/UX", kind:"Tool", source:"watchlist", citations:["rive.app","github.com/rive-app/rive-runtime"]},
  {id:"figmakits", name:"Figma game UI kits", url:"https://www.figma.com/community", hook:"Production HUD frames before they hit the engine.", tech:"Component variants + auto layout as the spec layer for menus, HUD states, and safe areas.", score:74, sentiment:"UX leads using community kits to skip blank-canvas HUD work.", category:"Game UI/UX", dept:"Game UI/UX", kind:"Tool", source:"watchlist", citations:["figma.com/community"]},
  // Art
  {id:"aseprite", name:"Aseprite", url:"https://github.com/aseprite/aseprite", hook:"Pixel pipeline that art and animation still standardize on.", tech:"Layered pixel editor with animation, tiles, and CLI batch export.", score:88, sentiment:"Art departments treating it as the 2D source of truth.", category:"Art", dept:"Art", kind:"Tool", source:"watchlist", citations:["aseprite.org","github.com/aseprite/aseprite"]},
  {id:"blender", name:"Blender", url:"https://www.blender.org/", repo:"blender/blender", hook:"Look-dev, DCC, and export hub for 3D game art.", tech:"Geometry nodes + USD/glTF export covering greybox to final mesh.", score:92, sentiment:"Art leads using it as the default DCC, not a free fallback.", category:"Art", dept:"Art", kind:"Tool", source:"watchlist", citations:["blender.org"]},
  {id:"blockbench", name:"Blockbench", url:"https://github.com/JannisX11/blockbench", hook:"Low-poly / voxel modeler that ships game-ready meshes fast.", tech:"Box modeling + animation aimed at stylized game assets.", score:78, sentiment:"Art teams using it for props and character blockouts.", category:"Art", dept:"Art", kind:"Tool", source:"watchlist", citations:["blockbench.net","github.com/JannisX11/blockbench"]},
  {id:"spine", name:"Spine", url:"https://esotericsoftware.com/", repo:"EsotericSoftware/spine-runtimes", hook:"2D skeletal animation that UI and character art share.", tech:"Runtime-backed rigs for HUDs, characters, and VFX-lite motion.", score:80, sentiment:"Art + UI sharing one animation runtime.", category:"Art", dept:"Art", kind:"Tool", source:"watchlist", citations:["esotericsoftware.com"]},
  {id:"mixamo", name:"Mixamo", url:"https://www.mixamo.com/", hook:"Auto-rigging and a mocap clip library for fast character blockouts.", tech:"Upload a mesh, get a skeleton plus retargetable animation clips as FBX.", score:73, sentiment:"Art teams using it for prototype locomotion, then replacing with custom mocap.", category:"Art", dept:"Art", kind:"Tool", source:"watchlist", citations:["mixamo.com"]},
  // Other engineering
  {id:"wwise", name:"Wwise", url:"https://www.audiokinetic.com/en/wwise/", hook:"Interactive audio middleware for live mix and events.", tech:"Sound engine + profiling that audio and gameplay hook into.", score:83, sentiment:"Audio engineering still the default on mid-to-large titles.", category:"Audio", dept:"Other Eng", kind:"Tool", source:"watchlist", citations:["audiokinetic.com"]},
  {id:"playtestcloud", name:"Playtest tooling notes / Oboe", url:"https://github.com/google/oboe", hook:"Low-latency audio path work that platform engineers watch.", tech:"Android audio I/O that game audio engines sit on.", score:72, sentiment:"Platform audio engineers tracking latency, not features.", category:"Audio", dept:"Other Eng", kind:"Repo", source:"watchlist", citations:["github.com/google/oboe"]},
  {id:"sentry", name:"Sentry", url:"https://github.com/getsentry/sentry", hook:"Crash and session signal used by live-ops and QA.", tech:"Event pipeline that maps player sessions back to builds.", score:84, sentiment:"Live-ops treating it as the incident bus.", category:"LiveOps", dept:"Other Eng", kind:"Repo", source:"watchlist", citations:["sentry.io","github.com/getsentry/sentry"]},
  {id:"fastbuild", name:"FASTBuild", url:"https://github.com/fastbuild/fastbuild", hook:"Distributed C++ builds for game engine compile farms.", tech:"Cache + distributed compile that platform/build teams live on.", score:76, sentiment:"Build engineering still comparing it to IncrediBuild.", category:"Tools/QA", dept:"Other Eng", kind:"Repo", source:"watchlist", citations:["fastbuild.org","github.com/fastbuild/fastbuild"]},
  {id:"perforce", name:"Helix Core", url:"https://www.perforce.com/products/helix-core", hook:"Version control that still holds the binary assets studios ship.", tech:"File locking + streams that scale to multi-terabyte depots Git LFS struggles with.", score:81, sentiment:"Build and platform teams keeping it for art depots even when code moves to Git.", category:"Tools/QA", dept:"Other Eng", kind:"Tool", source:"watchlist", citations:["perforce.com"]}
];

export const SCAN_POOL = [
  {id:"biome", name:"Biome", url:"https://github.com/biomejs/biome", hook:"Formatter + linter that wants to retire the JS toolchain pile.", tech:"One tool, one config, native speed, growing lint coverage.", score:83, sentiment:"Frontend teams deleting Prettier+ESLint pairs.", category:"Compilers", dept:"Engineering", kind:"Repo", source:"live_scan", citations:["biomejs.dev","github.com/biomejs/biome"]},
  {id:"ruff", name:"Ruff", url:"https://github.com/astral-sh/ruff", hook:"Python linter/formatter fast enough to run on every keystroke.", tech:"Rust lint engine with drop-in flake8/isort rules.", score:90, sentiment:"Already table-stakes in serious Python repos.", category:"DevTools", dept:"Engineering", kind:"Repo", source:"live_scan", citations:["docs.astral.sh/ruff","github.com/astral-sh/ruff"]},
  {id:"bun", name:"Bun", url:"https://github.com/oven-sh/bun", hook:"JS runtime, bundler, and test runner in one binary.", tech:"Zig runtime still eating Node-shaped workflows.", score:81, sentiment:"Full-stack teams using it for scripts and tests first.", category:"FullStack", dept:"Engineering", kind:"Repo", source:"live_scan", citations:["bun.sh","github.com/oven-sh/bun"]},
  {id:"nuklear", name:"Nuklear", url:"https://github.com/Immediate-Mode-UI/Nuklear", hook:"Single-header immediate UI used in shipped game tools.", tech:"No-dependency IMGUI alternative for debug and editor chrome.", score:70, sentiment:"Tools engineers reaching for it when ImGui is too heavy.", category:"Game UI/UX", dept:"Game UI/UX", kind:"Repo", source:"live_scan", citations:["github.com/Immediate-Mode-UI/Nuklear"]},
  {id:"coherent", name:"Coherent Gameface notes", url:"https://www.coherent-labs.com/products/coherent-gameface/", hook:"HTML/CSS HUD runtime for console and PC titles.", tech:"Browser-like UI inside the engine without shipping a full browser.", score:77, sentiment:"AAA UI teams evaluating it vs Scaleform leftovers.", category:"Game UI/UX", dept:"Game UI/UX", kind:"Web", source:"live_scan", citations:["coherent-labs.com"]},
  {id:"substance", name:"Substance 3D notes", url:"https://www.adobe.com/products/substance3d.html", hook:"Material authoring still anchoring look-dev pipelines.", tech:"Procedural materials that art shares across engines.", score:82, sentiment:"Art directors keeping it as the PBR source.", category:"Art", dept:"Art", kind:"Tool", source:"live_scan", citations:["adobe.com"]},
  {id:"fmod", name:"FMOD", url:"https://www.fmod.com/", hook:"Adaptive audio studio + runtime competing with Wwise.", tech:"Event-driven mix that gameplay can drive without a DAW hop.", score:79, sentiment:"Audio engineering split between FMOD and Wwise.", category:"Audio", dept:"Other Eng", kind:"Tool", source:"live_scan", citations:["fmod.com"]},
  {id:"gauntlet", name:"Unreal Gauntlet", url:"https://dev.epicgames.com/documentation/en-us/unreal-engine/gauntlet-automation-framework-in-unreal-engine", hook:"Engine-native automation used by QA and platform.", tech:"Session automation that CI can drive across targets.", score:71, sentiment:"QA engineering wiring it into nightly device farms.", category:"Tools/QA", dept:"Other Eng", kind:"Web", source:"live_scan", citations:["dev.epicgames.com"]}
];

export const INSPECT = {
  uv: { stars:"50k+", category:"DevTools", analysis:"uv collapsed Python packaging latency. Watch workspace features and enterprise lockfiles.", competitors:["pip","poetry","pdm"] },
  oxc: { stars:"17k+", category:"Compilers", analysis:"Oxc is becoming the shared parser other JS tools will sit on. Watch Rolldown integration.", competitors:["swc","biome","esbuild"] },
  jj: { stars:"20k+", category:"Systems", analysis:"jj keeps git interop while changing the daily model. Adoption risk is muscle memory, not design.", competitors:["git","sapling"] },
  libsql: { stars:"12k+", category:"Database", analysis:"libSQL is SQLite with a network story. The bet is embedded + replica without Postgres ops.", competitors:["sqlite","litefs","d1"] },
  zed: { stars:"67k+", category:"DevTools", analysis:"Zed’s collaboration CRDT is the differentiator. Score stays high if multiplayer stays stable.", competitors:["vscode","helix","fleet"] },
  candle: { stars:"18k+", category:"AI/Infra", analysis:"Candle is the Rust-shaped inference kit. Watch WASM and server examples more than training.", competitors:["pytorch","burn","ort"] },
  dearimgui: { stars:"67k+", category:"Game UI/UX", analysis:"ImGui is the debug/tooling HUD default. Watch docking and multi-viewport for editor shells.", competitors:["nuklear","microui"] },
  godot: { stars:"100k+", category:"Game UI/UX", analysis:"Godot Control + Theme is the open UI bet. Watch accessibility and console UI scaling.", competitors:["ugui","ui toolkit","nuklear"] },
  r3f: { stars:"28k+", category:"Game UI/UX", analysis:"R3F is how web game UX puts HUD in the same tree as the world.", competitors:["threlte","playcanvas"] },
  bevy: { stars:"42k+", category:"Game UI/UX", analysis:"Bevy UI is early but ECS-native. Good watch if the studio is Rust-first.", competitors:["godot","fyrox"] },
  rive: { stars:"n/a (runtime is OSS)", category:"Game UI/UX", analysis:"Rive is the motion layer between UI design and engine. Watch Unreal/Unity runtime parity and state-machine debugging.", competitors:["lottie","spine","scaleform (legacy)"] },
  figmakits: { stars:"n/a", category:"Game UI/UX", analysis:"Figma kits are the spec layer, not the runtime. Value is how cleanly HUD states, safe areas, and tokens hand off to engine UI.", competitors:["penpot","framer"] },
  aseprite: { stars:"33k+", category:"Art", analysis:"Aseprite remains the 2D pixel source. CLI export is what production pipelines care about.", competitors:["pyxeledit","graphicsgale"] },
  blender: { stars:"n/a", category:"Art", analysis:"Blender is the DCC default. Geometry nodes + glTF is the game-art path to watch.", competitors:["maya","houdini"] },
  blockbench: { stars:"4k+", category:"Art", analysis:"Blockbench is the quick path to stylized, game-ready low-poly. Best for props and blockouts, not a full DCC.", competitors:["magicavoxel","blender"] },
  spine: { stars:"n/a", category:"Art", analysis:"Spine is where 2D character and UI motion meet a runtime. Runtime licensing and engine support matter more than editor features.", competitors:["rive","dragonbones","live2d"] },
  mixamo: { stars:"n/a", category:"Art", analysis:"Mixamo is the fastest path from mesh to moving character. Adoption risk is platform dependence and a fixed clip library.", competitors:["cascadeur","rokoko","accurig"] },
  wwise: { stars:"n/a", category:"Audio", analysis:"Wwise still wins large interactive mixes. Compare license + profiler vs FMOD.", competitors:["fmod","miniaudio"] },
  playtestcloud: { stars:"4k+", category:"Audio", analysis:"Oboe matters for any studio shipping audio on Android. Watch latency on low-end devices more than new features.", competitors:["aaudio","opensl es"] },
  sentry: { stars:"42k+", category:"LiveOps", analysis:"Sentry is the crash/session bus. Live-ops value is grouping + release health, not just stack traces.", competitors:["crashlytics","bugsnag"] },
  fastbuild: { stars:"3k+", category:"Tools/QA", analysis:"FASTBuild is the open compile-farm option. Watch cache hit rates on engine-sized graphs.", competitors:["incredibuild","sn-dbs"] },
  perforce: { stars:"n/a", category:"Tools/QA", analysis:"Helix Core stays because of file locking and depot scale. Watch Git LFS and newer asset-first VCS for code-light teams.", competitors:["git lfs","unity version control","diversion"] },
  biome: { stars:"20k+", category:"Compilers", analysis:"Biome wins when teams want one config. Lint rule parity is the remaining gap.", competitors:["eslint","oxc","prettier"] },
  ruff: { stars:"40k+", category:"DevTools", analysis:"Ruff turned Python linting into a sub-second step. Formatter parity with Black is the milestone to watch.", competitors:["flake8","pylint","black"] },
  bun: { stars:"75k+", category:"FullStack", analysis:"Bun wins on install and test speed first. Node compatibility edge cases are the adoption risk.", competitors:["node","deno"] },
  nuklear: { stars:"10k+", category:"Game UI/UX", analysis:"Nuklear is the no-dependency IMGUI fallback. Good for tiny tools; smaller ecosystem than Dear ImGui.", competitors:["dear imgui","microui"] },
  coherent: { stars:"n/a", category:"Game UI/UX", analysis:"Gameface lets web-skilled UI teams ship HUDs in-engine. Evaluate console memory budget and CSS coverage.", competitors:["scaleform (legacy)","umg","noesis gui"] },
  substance: { stars:"n/a", category:"Art", analysis:"Substance remains the PBR material source of truth. Watch licensing and Blender/USD interop.", competitors:["material maker","quixel mixer","armorpaint"] },
  fmod: { stars:"n/a", category:"Audio", analysis:"FMOD is the lighter-weight Wwise alternative. Compare indie licensing tiers and live-update workflow.", competitors:["wwise","miniaudio"] },
  gauntlet: { stars:"n/a", category:"Tools/QA", analysis:"Gauntlet is Unreal’s built-in route to device automation. Value depends on how much CI/device-farm glue the team will own.", competitors:["unreal automation tool","appium"] }
};
