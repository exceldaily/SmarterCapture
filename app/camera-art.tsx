import type { CameraCategory } from "@/lib/camcue/types";

// Original camera illustrations, drawn per body type.
// A generic icon on every card is why the product never felt like a camera
// site; these give each category a recognisable silhouette without using any
// manufacturer photography.
//
// All art is drawn in a 120x100 box and inherits currentColor, so it works on
// both the light cards and the dark hero.

interface Props {
  category: CameraCategory;
  className?: string;
}

const lens = (cx: number, cy: number, r: number, key?: string) => (
  <g key={key}>
    <circle cx={cx} cy={cy} r={r} className="art-lens-barrel" />
    <circle cx={cx} cy={cy} r={r * 0.66} className="art-lens-glass" />
    <circle cx={cx} cy={cy} r={r * 0.3} className="art-lens-core" />
    {/* catchlight — the detail that reads as "glass" rather than "circle" */}
    <circle cx={cx - r * 0.3} cy={cy - r * 0.32} r={r * 0.14} className="art-lens-glint" />
  </g>
);

function ActionCam() {
  return (
    <>
      <rect x="24" y="24" width="72" height="56" rx="10" className="art-body" />
      <rect x="30" y="30" width="60" height="44" rx="7" className="art-face" />
      {lens(52, 52, 17)}
      <rect x="74" y="38" width="14" height="9" rx="2.5" className="art-detail" />
      <rect x="74" y="52" width="14" height="4" rx="2" className="art-detail-soft" />
      <rect x="50" y="17" width="20" height="7" rx="3" className="art-detail" />
    </>
  );
}

function ThreeSixtyCam() {
  return (
    <>
      <rect x="42" y="14" width="36" height="76" rx="16" className="art-body" />
      {lens(60, 34, 14)}
      {/* second lens implied on the reverse face */}
      <rect x="46" y="56" width="28" height="20" rx="6" className="art-face" />
      <circle cx="60" cy="66" r="6" className="art-detail-soft" />
      <rect x="52" y="84" width="16" height="6" rx="3" className="art-detail" />
    </>
  );
}

function PocketGimbal() {
  return (
    <>
      <rect x="46" y="34" width="28" height="56" rx="7" className="art-body" />
      <rect x="51" y="44" width="18" height="26" rx="4" className="art-face" />
      {/* gimbal yoke */}
      <path d="M46 34 v-6 a8 8 0 0 1 8-8 h12 a8 8 0 0 1 8 8 v6" className="art-stroke" />
      {lens(60, 20, 11)}
      <rect x="53" y="76" width="14" height="4" rx="2" className="art-detail-soft" />
    </>
  );
}

function MirrorlessBody() {
  return (
    <>
      {/* viewfinder hump */}
      <path d="M46 34 l6 -12 h16 l6 12 z" className="art-body" />
      <rect x="16" y="34" width="72" height="46" rx="9" className="art-body" />
      {/* grip */}
      <path d="M16 40 h-8 a6 6 0 0 0 -6 6 v18 a6 6 0 0 0 6 6 h8 z" className="art-body" />
      {/* lens barrel */}
      <rect x="60" y="40" width="44" height="34" rx="8" className="art-body" />
      <rect x="66" y="45" width="34" height="24" rx="6" className="art-face" />
      {lens(83, 57, 12)}
      <circle cx="30" cy="46" r="4" className="art-detail" />
      <rect x="24" y="58" width="20" height="14" rx="3" className="art-face" />
      <rect x="52" y="28" width="10" height="4" rx="2" className="art-detail" />
    </>
  );
}

function VloggingBody() {
  return (
    <>
      <rect x="18" y="32" width="66" height="48" rx="9" className="art-body" />
      {/* flip-out screen, the defining feature of this class */}
      <rect x="4" y="38" width="18" height="36" rx="4" className="art-face" />
      <rect x="56" y="38" width="46" height="36" rx="8" className="art-body" />
      <rect x="62" y="43" width="35" height="26" rx="6" className="art-face" />
      {lens(79, 56, 13)}
      <rect x="30" y="24" width="16" height="8" rx="3" className="art-detail" />
      <circle cx="30" cy="44" r="3.5" className="art-detail" />
    </>
  );
}

function CompactBody() {
  return (
    <>
      <rect x="20" y="34" width="80" height="46" rx="9" className="art-body" />
      <rect x="26" y="40" width="34" height="34" rx="6" className="art-face" />
      {lens(43, 57, 14)}
      <rect x="68" y="42" width="26" height="18" rx="4" className="art-face" />
      <circle cx="81" cy="68" r="4" className="art-detail" />
      <rect x="30" y="26" width="14" height="8" rx="3" className="art-detail" />
    </>
  );
}

function CinemaBody() {
  return (
    <>
      {/* top handle */}
      <path d="M28 26 h44 a5 5 0 0 1 5 5 v5" className="art-stroke" />
      <rect x="22" y="34" width="58" height="50" rx="7" className="art-body" />
      <rect x="28" y="40" width="26" height="20" rx="4" className="art-face" />
      <rect x="28" y="64" width="26" height="6" rx="3" className="art-detail-soft" />
      {/* mattebox-ish lens */}
      <rect x="66" y="40" width="40" height="38" rx="6" className="art-body" />
      <rect x="72" y="45" width="29" height="28" rx="5" className="art-face" />
      {lens(86, 59, 12)}
      <circle cx="64" cy="30" r="3.5" className="art-detail" />
    </>
  );
}

const art: Record<CameraCategory, () => React.JSX.Element> = {
  action: ActionCam,
  "360": ThreeSixtyCam,
  pocket: PocketGimbal,
  vlogging: VloggingBody,
  compact: CompactBody,
  mirrorless: MirrorlessBody,
  cinema: CinemaBody,
};

export function CameraArt({ category, className }: Props) {
  const Shape = art[category] ?? ActionCam;
  return (
    <svg
      className={`camera-art ${className ?? ""}`}
      viewBox="0 0 120 100"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <Shape />
    </svg>
  );
}
