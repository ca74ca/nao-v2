import React from "react";

// Helper: interpolate color from light blue to bright green as strain increases
function getEngineSurgeColor(strain: number, maxStrain = 21) {
  // Light blue: #7ED6FF, Bright green: #00FF66
  const t = Math.min(strain / maxStrain, 1);
  const start = { r: 126, g: 214, b: 255 }; // #7ED6FF
  const end = { r: 0, g: 255, b: 102 }; // #00FF66
  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);
  return `rgb(${r},${g},${b})`;
}

export const EngineSurgeBar: React.FC<{ strainScore?: number, maxStrain?: number }> = ({
  strainScore = 0,
  maxStrain = 21, // WHOOP's max strain is 21
}) => {
  const color = getEngineSurgeColor(strainScore, maxStrain);
  const percent = Math.min((strainScore / maxStrain) * 100, 100);

  return (
    <div style={{ marginTop: 16, marginBottom: 8, width: "100%" }}>
      <div style={{ fontWeight: 700, color: "#7ED6FF", fontSize: 15, marginBottom: 2 }}>
        Engine Surge
      </div>
      <div style={{ fontSize: 12, color: "#7ED6FF", marginBottom: 2 }}>
        WHOOP Strain: {strainScore ? strainScore.toFixed(1) : "0.0"} / {maxStrain}
      </div>
      <div style={{
        background: "#e5f7ff",
        borderRadius: 12,
        height: 18,
        width: "100%",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
      }}>
        <div style={{
          width: `${percent}%`,
          height: "100%",
          background: color,
          transition: "width 0.5s, background 0.5s",
        }} />
      </div>
    </div>
  );
};