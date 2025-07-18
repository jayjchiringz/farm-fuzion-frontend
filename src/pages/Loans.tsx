import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [repaymentDue, setRepaymentDue] = useState("");

  const farmer = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchLoans = async () => {
    try {
      const res = await axios.get(
        `https://us-central1-farm-fuzion-abdf3.cloudfunctions.net/api/loans/${farmer.id}`
      );
      setLoans(res.data);
    } catch (err) {
      console.error("❌ Failed to load loans", err);
    }
  };

  const applyForLoan = async () => {
    if (!amount) return alert("Amount is required");
    try {
      await axios.post(
        "https://us-central1-farm-fuzion-abdf3.cloudfunctions.net/api/loans",
        {
          farmer_id: farmer.id,
          amount: parseFloat(amount),
          purpose,
          repayment_due: repaymentDue,
        }
      );
      setAmount("");
      setPurpose("");
      setRepaymentDue("");
      fetchLoans();
      alert("✅ Loan applied successfully");
    } catch (err) {
      console.error("❌ Failed to apply for loan", err);
      alert("Loan application failed");
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">💰 Loan Center</h1>

      <div className="bg-white dark:bg-[#0a3d32] p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Apply for a Loan</h2>
        <div className="space-y-4">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Loan Amount"
            className="w-full p-2 border rounded bg-white text-black"
          />
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Loan Purpose"
            className="w-full p-2 border rounded bg-white text-black"
          />
          <input
            type="date"
            value={repaymentDue}
            onChange={(e) => setRepaymentDue(e.target.value)}
            placeholder="Repayment Due"
            className="w-full p-2 border rounded bg-white text-black"
          />
          <button
            onClick={applyForLoan}
            className="bg-brand-green text-white px-4 py-2 rounded hover:bg-brand-dark"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f4439] p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Your Loan Applications</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th>Amount</th>
              <th>Status</th>
              <th>Due</th>
              <th>Applied</th>
              <th>↪ Repay</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan: any) => (
              <tr key={loan.id} className="border-t text-sm">
                <td>KES {loan.amount}</td>
                <td>{loan.status}</td>
                <td>{loan.repayment_due?.split("T")[0]}</td>
                <td>{loan.applied_at?.split("T")[0]}</td>
                <td>
                  <Link
                    to={`/repayments/${loan.id}`}
                    className="text-brand-green hover:underline"
                  >
                    Make Payment →
                  </Link>
                </td>
              </tr>
            ))}
            {loans.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-slate-500">
                  No loans yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
