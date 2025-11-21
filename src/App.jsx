import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import biryani from "./public/biriyani.png"; 

const INDIA_COORD = [13.054864947131488, 80.2241185689344]; // India
const ARGENTINA_COORD = [-34.58419557192974, -58.39822695799831]; // Argentina

function createBucketIcon(scale = 1) {
  return L.icon({
    iconUrl: biryani, // ensure this exists
    iconSize: [80 * scale, 90 * scale],
    iconAnchor: [60 * scale, 60 * scale],
    className: "biriyani-icon",
  });
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function FollowMarker({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !pos) return;
    map.panTo(pos, { animate: true, duration: 1 });
  }, [pos, map]);
  return null;
}

export default function App() {
  // movingPosition is only non-null while an animation runs
  const [movingPosition, setMovingPosition] = useState(null);

  // idle biryani in India (separate marker)
  const [showIdle, setShowIdle] = useState(true);

  // delivered markers in Argentina (array so they accumulate)
  const [deliveredMarkers, setDeliveredMarkers] = useState([]);

  // animation state & visual scale for moving marker
  const [isAnimating, setIsAnimating] = useState(false);
  const [movingScale, setMovingScale] = useState(1);

  // how many deliveries completed
  const [deliveredCount, setDeliveredCount] = useState(0);
  const MAX_DELIVERIES = 5;

  // requestAnimationFrame ref
  const animRef = useRef(null);

  // animate from -> to
  const animateBucket = ({ from, to, durationMs = 6000 }) => {
    // set initial moving position and scale
    setMovingPosition(from);
    setMovingScale(1);
    setIsAnimating(true);

    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);

      const lat = lerp(from[0], to[0], t);
      const lng = lerp(from[1], to[1], t);
      setMovingPosition([lat, lng]);

      const scaleValue = 1 + 0.6 * Math.sin(Math.PI * t);
      setMovingScale(scaleValue);

      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        // arrived
        animRef.current = null;
        setIsAnimating(false);

        // Add a delivered marker at Argentina (keeps the delivered biryani there)
        setDeliveredMarkers((prev) => [...prev, to]);

        // update deliveredCount using functional updater to get fresh prev
        setDeliveredCount((prev) => {
          const next = prev + 1;
          // if more deliveries allowed, spawn a new idle biryani in India
          if (next < MAX_DELIVERIES) {
            setShowIdle(true);
          } else {
            // reached max: no idle left
            setShowIdle(false);
          }
          return next;
        });

        // stop showing moving marker (it has now become a delivered marker)
        setMovingPosition(null);
        setMovingScale(1);
      }
    };

    // start loop
    animRef.current = requestAnimationFrame(step);
  };

  // Order button handler
  const handleOrderClick = () => {
    // If already reached max deliveries, show popup
    if (deliveredCount >= MAX_DELIVERIES) {
      window.alert("Neeyum Biryani venum na, nerlaa vanga vangi tharenn😏");
      return;
    }

    // If an animation is running, do nothing
    if (isAnimating) return;

    // If no idle biryani available, notify user
    if (!showIdle) {
      window.alert("No biryani is currently waiting in India — please wait.");
      return;
    }

    // spawn animation: hide idle marker and animate from India -> Argentina
    setShowIdle(false);
    animateBucket({ from: INDIA_COORD, to: ARGENTINA_COORD, durationMs: 6000 });
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", padding:" 0px 420px",background:"#FEDF82"}}>
      <header style={{ padding: 12, display: "flex", gap: 12, alignItems: "center"}}>
        <h1 style={{ margin: 5,color:"#F32828",fontWeight:"bolder"}}> SS Biryani from India  </h1>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={handleOrderClick}
            disabled={isAnimating}
            style={{
              padding: "12px 18px",
              fontSize: 16,
              borderRadius: 8,
              border: "none",
              cursor: isAnimating ? "not-allowed" : "pointer",
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.12)",
              backgroundColor:"#F32828"
            }}
          >
            {isAnimating ? "Biriyani is on the way..." : "Order Now"}
          </button>
        </div>
      </header>

      <main style={{ flex: 1, minHeight: 0 }}>
        <MapContainer
          center={INDIA_COORD}
          zoom={3}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "18px",
            border: "2px solid #800000",
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.12)",
          }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* moving marker (only present while animating) */}
          {movingPosition && (
            <Marker position={movingPosition} icon={createBucketIcon(movingScale)} zIndexOffset={1000} />
          )}

          {/* idle biryani waiting in India (separate marker) */}
          {showIdle && !isAnimating && (
            <Marker position={INDIA_COORD} icon={createBucketIcon(0.9)} zIndexOffset={500} />
          )}

          {/* delivered biriyanis that remain in Argentina */}
          {deliveredMarkers.map((pos, i) => (
            <Marker key={`del-${i}`} position={pos} icon={createBucketIcon(1)} zIndexOffset={400} />
          ))}

          <FollowMarker pos={movingPosition || (deliveredMarkers[deliveredMarkers.length - 1] ?? INDIA_COORD)} />
        </MapContainer>
      </main>

      <footer style={{ padding: 8, textAlign: "center", fontSize: 13 }}>
        Click <strong>Order Biriyani</strong> to get Biryani from Renisha — delivered: {deliveredCount}/{MAX_DELIVERIES}
      </footer>
    </div>
  );
}