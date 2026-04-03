import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

import L from "leaflet";

/* ✅ Fix default Leaflet marker icons (Vite/React issue) */
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker1x from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker1x,
  shadowUrl: markerShadow,
});

/* ✅ Clean formatting helpers */
function cleanJoin(parts) {
  return parts.filter(Boolean).join(", ").replace(/\s+/g, " ").trim();
}

function formatFromNominatim(nomiJson, lat, lng) {
  const a = nomiJson?.address || {};

  const house =
    a.house_number || a.building || a.building_name || a.shop || a.office || "";

  const road = a.road || a.residential || a.pedestrian || a.highway || "";

  const area =
    a.neighbourhood ||
    a.suburb ||
    a.quarter ||
    a.city_district ||
    a.hamlet ||
    a.village ||
    "";

  const city =
    a.city || a.town || a.village || a.municipality || a.county || "";

  const state = a.state || "";
  const postcode = a.postcode || "";
  const country = a.country || "";

  // ✅ short first part: "House, Road"
  const street = cleanJoin([house, road]) || cleanJoin([road]);

  // ✅ final clean line1
  // Example: "Anand Vidya Nagar Road, Vallabh Vidyanagar, Anand - 388001"
  const line1 =
    cleanJoin([street, area && area !== city ? area : "", city]) +
    (postcode ? ` - ${postcode}` : "");

  return {
    label: "Home",
    line1,
    landmark: "",
    pincode: postcode,
    lat,
    lng,
    // keep extra fields if you want later
    meta: {
      area,
      city,
      state,
      country,
      raw_display: nomiJson?.display_name || "",
    },
  };
}

/* ✅ Reverse geocode (OpenStreetMap Nominatim) */
async function reverseGeocode(lat, lng) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
    `&lat=${encodeURIComponent(lat)}` +
    `&lon=${encodeURIComponent(lng)}` +
    `&addressdetails=1&zoom=18`;

  const res = await fetch(url, {
    headers: {
      // Some environments accept this, some ignore it — still ok.
      Accept: "application/json",
    },
  });

  if (!res.ok) throw new Error("Reverse geocode failed");
  return res.json();
}

/* Small hook component to capture map clicks */
function ClickToMovePin({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function AddressPickerModal({ open, setOpen, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [lat, setLat] = useState(22.549011);
  const [lng, setLng] = useState(72.924345);

  const [label, setLabel] = useState("Home");
  const [line1, setLine1] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");

  const [rawDisplay, setRawDisplay] = useState("");

  const lastReqRef = useRef(0);
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");

  const center = useMemo(() => ({ lat, lng }), [lat, lng]);

  const close = () => {
    setOpen(false);
    setErr("");
  };

  const applyFromCoords = async (newLat, newLng) => {
    setErr("");
    setLoading(true);

    // ✅ prevent older requests overwriting latest
    const reqId = Date.now();
    lastReqRef.current = reqId;

    try {
      const data = await reverseGeocode(newLat, newLng);
      if (lastReqRef.current !== reqId) return;

      const formatted = formatFromNominatim(data, newLat, newLng);

      setLabel((prev) => prev || "Home");
      setLine1(formatted.line1 || "");
      setPincode(formatted.pincode || "");
      setCity(formatted?.meta?.city || "");
      setStateName(formatted?.meta?.state || "");
      setRawDisplay(formatted?.meta?.raw_display || "");
    } catch (e) {
      setErr("Could not fetch address for this location.");
    } finally {
      if (lastReqRef.current === reqId) setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    setErr("");
    if (!navigator.geolocation) {
      setErr("Geolocation not supported in this browser.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setLat(newLat);
        setLng(newLng);
        await applyFromCoords(newLat, newLng);
      },
      () => {
        setLoading(false);
        setErr("Location permission denied.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // When modal opens, fetch initial address
  useEffect(() => {
    if (!open) return;
    applyFromCoords(lat, lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-6xl rounded-2xl bg-white shadow-xl border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">
              Select Live Location
            </h2>
            <p className="text-sm text-gray-500">
              Click on map to move pin, then confirm address.
            </p>
          </div>
          <button
            onClick={close}
            className="h-10 w-10 grid place-items-center rounded-xl border hover:bg-gray-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-6">
          {/* Map */}
          <div className="rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-gray-900">
                Map (Click to select)
              </p>
              <button
                onClick={useCurrentLocation}
                className="px-4 py-2 rounded-full border font-semibold hover:bg-gray-50"
              >
                Use Current Location
              </button>
            </div>

            <div className="h-[420px] rounded-xl overflow-hidden border">
              <MapContainer
                center={[lat, lng]}
                zoom={6}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ClickToMovePin
                  onPick={async (la, lo) => {
                    setLat(la);
                    setLng(lo);
                    await applyFromCoords(la, lo);
                  }}
                />
                <Marker position={[lat, lng]} />
              </MapContainer>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border p-5">
            <p className="font-extrabold text-gray-900 mb-4">Address Details</p>

            {err ? (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            ) : null}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Label
                </label>
                <select
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Other">Other</option>
                  <option value="Current Location">Current Location</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Full Address (line1)
                </label>
                <textarea
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="House, Road, Area, City - Pincode"
                />
                {/* Optional: show raw address (debug) */}
                {rawDisplay ? (
                  <p className="mt-2 text-xs text-gray-400">
                    Raw: {rawDisplay}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Landmark (optional)
                </label>
                <input
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Near temple / mall"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Pincode
                </label>
                <input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="388001"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Coordinates
                </label>
                <input
                  readOnly
                  value={`${lat.toFixed(6)}, ${lng.toFixed(6)}`}
                  className="mt-1 w-full rounded-xl border px-4 py-3 bg-gray-50 text-gray-600"
                />
              </div>

              <button
                disabled={loading || !line1.trim()}
                onClick={() => {
                  onConfirm?.({
                    label,
                    line1: line1.trim(),
                    landmark: landmark.trim(),
                    city: city.trim(),
                    state: stateName.trim(),
                    pincode: pincode.trim(),
                    lat,
                    lng,
                  });
                  close();
                }}
                className={`w-full rounded-xl py-3 font-extrabold text-white ${
                  loading || !line1.trim()
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? "Loading..." : "Confirm Address"}
              </button>

              <button
                onClick={close}
                className="w-full rounded-xl py-3 font-semibold border hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Footer gap */}
        <div className="h-4" />
      </div>
    </div>
  );
}
