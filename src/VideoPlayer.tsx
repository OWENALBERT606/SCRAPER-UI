"use client";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface Props {
  src: string; // .m3u8 URL
}

export default function VideoPlayer({ src }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const hlsRef    = useRef<Hls | null>(null);
  const [ready, setReady]   = useState(false);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    setReady(false);
    setError(null);
    const video = videoRef.current;
    if (!video || !src) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setReady(true);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) setError(`Stream error: ${data.details}`);
      });
      return () => {
        hls.destroy();
        hlsRef.current = null;
        video.removeAttribute("src");
        video.load();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", () => setReady(true), { once: true });
      video.play().catch(() => {});
      return () => { video.removeAttribute("src"); video.load(); };
    } else {
      setError("HLS not supported in this browser");
    }
  }, [src]);

  if (error) {
    return (
      <div style={{ width: "100%", height: 220, background: "#1a1a25", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#e53e3e", fontSize: 13, textAlign: "center", padding: "0 20px" }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", borderRadius: 8, overflow: "hidden", background: "#000" }}>
      {!ready && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(0,0,0,0.7)", zIndex: 1 }}>
          <span style={{ width: 32, height: 32, border: "3px solid rgba(124,106,247,0.3)", borderTopColor: "#7c6af7", borderRadius: "50%", display: "inline-block", animation: "tspin 0.7s linear infinite" }} />
          <span style={{ fontSize: 12, color: "#888" }}>Loading stream…</span>
        </div>
      )}
      <video
        ref={videoRef}
        controls
        style={{ width: "100%", maxHeight: 420, minHeight: 220, display: "block", background: "#000" }}
      />
    </div>
  );
}
