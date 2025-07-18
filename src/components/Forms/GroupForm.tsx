// src/components/Forms/GroupForm.tsx
import React, { useState } from "react";
import LocationSelector from "./LocationSelector";

export default function GroupForm() {
  const [location, setLocation] = useState({
    county: "",
    constituency: "",
    ward: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("👥 Group Data:", location);
    // Submit to backend
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <LocationSelector onChange={setLocation} />
      <button
        type="submit"
        className="px-4 py-2 bg-brand-green text-white rounded hover:bg-brand-dark"
      >
        Submit Group
      </button>
    </form>
  );
}
