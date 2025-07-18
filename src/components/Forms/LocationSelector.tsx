import React, { useState, useEffect } from "react";
import {
  counties,
  constituencies,
  wards,
  Constituency,
  Ward
} from "kenya-locations";

type Props = {
  onChange: (loc: {
    county: string;
    constituency: string;
    ward: string;
  }) => void;
};

export default function LocationSelector({ onChange }: Props) {
  const [county, setCounty] = useState("");
  const [constituency, setConstituency] = useState("");
  const [ward, setWard] = useState("");

  const constituencyOptions = constituencies.filter(
    (c: Constituency) => c.county === county
  );

  const wardOptions = wards.filter(
    (w: Ward) => w.constituency === constituency
  );

  useEffect(() => {
    onChange({ county, constituency, ward });
  }, [county, constituency, ward]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <select
        value={county}
        onChange={(e) => {
          setCounty(e.target.value);
          setConstituency("");
          setWard("");
        }}
        className="p-2 border rounded"
      >
        <option value="">Select County</option>
        {counties.map((c) => (
        <option key={c.name} value={c.name}>
            {c.name}
        </option>
        ))}
      </select>

      <select
        value={constituency}
        onChange={(e) => {
          setConstituency(e.target.value);
          setWard("");
        }}
        disabled={!county}
        className="p-2 border rounded"
      >
        <option value="">Select Constituency</option>
        {constituencyOptions.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={ward}
        onChange={(e) => setWard(e.target.value)}
        disabled={!constituency}
        className="p-2 border rounded"
      >
        <option value="">Select Ward</option>
        {wardOptions.map((w) => (
          <option key={w.name} value={w.name}>
            {w.name}
          </option>
        ))}
      </select>
    </div>
  );
}
