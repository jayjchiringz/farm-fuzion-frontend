import React, { useState } from "react";

export default function OtpModal({ onSubmit, onClose }: {
  onSubmit: (otp: string) => void;
  onClose: () => void;
}) {
  const [otp, setOtp] = useState("");

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-brand-dark p-6 rounded w-96 text-center">
        <h3 className="font-bold text-lg mb-4">Enter OTP</h3>
        <input
          type="text"
          className="border p-2 w-full rounded mb-4"
          placeholder="6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="text-sm text-gray-500">Cancel</button>
          <button
            onClick={() => onSubmit(otp)}
            className="px-4 py-2 bg-brand-green text-white rounded"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
