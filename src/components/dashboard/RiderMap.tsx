"use client";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

// Fix for default leaflet icons in Next.js
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface RiderMapProps {
    pickup?: [number, number];
    drop?: [number, number];
    onLocationSelect?: (lat: number, lng: number, type: "pickup" | "drop") => void;
}

export default function RiderMap({ pickup, drop, onLocationSelect }: RiderMapProps) {
    const [center] = useState<[number, number]>([19.076, 72.8777]); // Default Mumbai center

    return (
        <div className="h-full w-full brutalist-border overflow-hidden">
            <MapContainer
                center={center}
                zoom={13}
                className="h-full w-full z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {pickup && (
                    <Marker position={pickup}>
                        <Popup className="font-bold uppercase tracking-widest">Pickup Point</Popup>
                    </Marker>
                )}

                {drop && (
                    <Marker position={drop}>
                        <Popup className="font-bold uppercase tracking-widest">Drop Point</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}
