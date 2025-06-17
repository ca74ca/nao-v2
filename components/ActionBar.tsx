import React from "react";

export default function ActionBar({
  onWhoopSync,
  onAppleSync,
  whoopSyncStatus,
  appleSyncStatus,
}: {
  onWhoopSync: () => void;
  onAppleSync: () => void;
  whoopSyncStatus: string;
  appleSyncStatus: string;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        zIndex: 30,
        display: "flex",
        justifyContent: "center",
        gap: 16,
        padding: "18px 0 6px 0",
        background: "rgba(12,35,58,0.93)",
        boxShadow: "0 1px 16px #2D9CFF99",
        pointerEvents: "auto"
      }}
    >
      <button
        onClick={onWhoopSync}
        style={{
          padding: "10px 22px",
          borderRadius: 999,
          background: whoopSyncStatus ? "#00dfc0" : "#10141A",
          color: "#2D9CFF",
          fontWeight: 700,
          fontSize: 16,
          border: "2px solid #2D9CFF",
          cursor: whoopSyncStatus ? "progress" : "pointer",
          letterSpacing: "0.04em",
          boxShadow: "0 0 16px 2px #60C6FF",
          marginRight: 8,
          transition: "background 0.15s"
        }}
        disabled={!!whoopSyncStatus}
      >
        {whoopSyncStatus ? whoopSyncStatus : "Sync WHOOP"}
      </button>
      <button
        onClick={onAppleSync}
        style={{
          padding: "10px 22px",
          borderRadius: 999,
          background: appleSyncStatus ? "#eaffea" : "#10141A",
          color: appleSyncStatus ? "#0eb90e" : "#2D9CFF",
          fontWeight: 700,
          fontSize: 16,
          border: "2px solid #2D9CFF",
          cursor: appleSyncStatus ? "progress" : "pointer",
          letterSpacing: "0.04em",
          boxShadow: "0 0 16px 2px #60C6FF",
          marginRight: 8,
          transition: "background 0.15s"
        }}
        disabled={!!appleSyncStatus}
      >
        {appleSyncStatus ? appleSyncStatus : "Sync Apple Health"}
      </button>
    </div>
  );
}