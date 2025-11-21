import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// NOTE: This file is a single-file React component you can drop into a Vite / CRA project.
// It uses react-leaflet + Leaflet (install with: npm i react-leaflet leaflet)

// --- Config: start (India) and end (Argentina) coordinates ---
const INDIA_COORD = [13.0583, 80.2340]; // approx center of India (lat, lng)
const ARGENTINA_COORD = [-34.6037, -58.3816]; // Buenos Aires, Argentina (lat, lng)

// Create a big "biriyani bucket" icon using a DivIcon with an emoji.
function createBucketIcon(scale = 1) {
  return L.icon({
    iconUrl: "/public/b2.png",  // path inside public folder
    iconSize: [150 * scale, 150 * scale], // control bucket size
    iconAnchor: [60 * scale, 60 * scale], // positions bucket on marker center
    className: "biriyani-icon"
  });
}

// Helper: linear interpolation between two numbers
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Component that animates the map view to follow the marker while it moves
function FollowMarker({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !pos) return;
    map.panTo(pos, { animate: true, duration: 1 });
  }, [pos, map]);
  return null;
}

export default function App() {
  const [position, setPosition] = useState(INDIA_COORD);
  const [isAnimating, setIsAnimating] = useState(false);
  const [scale, setScale] = useState(1);
  const animationRef = useRef(null);

  // Animate marker from start to end over `durationMs`. Will update position state.
  const animateBucket = ({ from, to, durationMs = 5000 }) => {
    if (animationRef.current) clearInterval(animationRef.current);
    setIsAnimating(true);

    const start = Date.now();
    const stepMs = 16; // ~60fps

    animationRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / durationMs);

      const lat = lerp(from[0], to[0], t);
      const lng = lerp(from[1], to[1], t);
      setPosition([lat, lng]);

      // playful scale curve: grow then shrink
      const scaleValue = 1 + 0.6 * Math.sin(Math.PI * t);
      setScale(scaleValue);

      if (t >= 1) {
        clearInterval(animationRef.current);
        animationRef.current = null;
        setIsAnimating(false);
        // leave marker at destination (or reset after a delay)
      }
    }, stepMs);
  };

  // Button click handler
  const handleOrderClick = () => {
    // when clicked, animate from India to Argentina
    animateBucket({ from: INDIA_COORD, to: ARGENTINA_COORD, durationMs: 6000 });
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
        <h1 style={{ margin: 0 }}> Order biryani from Indiaa</h1>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={handleOrderClick}
            disabled={isAnimating}
            style={{
              padding: "10px 18px",
              fontSize: 16,
              borderRadius: 8,
              border: "none",
              cursor: isAnimating ? "not-allowed" : "pointer",
              boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
            }}
          >
            {isAnimating ? "Biriyani is on the way..." : "Order Biriyani"}
          </button>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <MapContainer
          center={INDIA_COORD}
          zoom={3}
          style={{ width: "100%", height: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* marker that visually represents the big biriyani bucket */}
          <Marker
            position={position}
            icon={createBucketIcon(scale)}
            zIndexOffset={1000}
          />

          {/* keep the map centered on the marker while it moves (optional). Remove if you want static map. */}
          <FollowMarker pos={position} />
        </MapContainer>
      </main>

      <footer style={{ padding: 8, textAlign: "center", fontSize: 13 }}>
        Click <strong>Order Biriyani</strong> to get a bucket from India to Argentina 🌍
      </footer>
    </div>
  );
}

