// src/components/Forms/FarmerForm.tsx
import React, { useState } from "react";
import LocationSelector from "./LocationSelector";

export default function FarmerForm() {
  const [location, setLocation] = useState({
    county: "",
    constituency: "",
    ward: "",
  });

  const [address, setAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...location,
      address,
    };

    console.log("🚜 Farmer Data:", payload);
    // Submit to backend
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <LocationSelector onChange={setLocation} />
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Nearest landmark / house description"
        className="w-full p-2 border rounded"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-brand-green text-white rounded hover:bg-brand-dark"
      >
        Submit Farmer
      </button>
    </form>
  );
}
