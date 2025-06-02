import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function LoanRepayments() {
  const { loanId } = useParams();
  const farmer = JSON.parse(localStorage.getItem("user") || "{}");

  const [repayments, setRepayments] = useState([]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("M-Pesa");
  const [referenceNo, setReferenceNo] = useState("");

  const fetchRepayments = async () => {
    try {
      const res = await axios.get(
        `https://us-central1-farm-fuzion.cloudfunctions.net/api/loan-repayments/${loanId}`
      );
      setRepayments(res.data);
    } catch (err) {
      console.error("❌ Failed to load repayments", err);
    }
  };

  const makeRepayment = async () => {
    if (!amount) return alert("Enter repayment amount");

    try {
      await axios.post(
        `https://us-central1-farm-fuzion.cloudfunctions.net/api/loan-repayments`,
        {
          loan_id: loanId,
          farmer_id: farmer.id,
          amount: parseFloat(amount),
          method,
          reference_no: referenceNo,
        }
      );
      setAmount("");
      setMethod("M-Pesa");
      setReferenceNo("");
      fetchRepayments();
      alert("✅ Payment submitted");
    } catch (err) {
      console.error("❌ Repayment failed", err);
      alert("Failed to process payment");
    }
  };

  useEffect(() => {
    fetchRepayments();
  }, [loanId]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Loan Repayment</h1>

      <div className="bg-white dark:bg-[#0a3d32] p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">Submit Repayment</h2>
        <div className="space-y-3">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Repayment Amount"
            className="w-full p-2 border rounded bg-white text-black"
          />
          <input
            type="text"
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            placeholder="Reference No"
            className="w-full p-2 border rounded bg-white text-black"
          />
          <label htmlFor="repayment-method" className="sr-only">
            Repayment Method
          </label>
          <select
            id="repayment-method"
            aria-label="Repayment Method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full p-2 border rounded bg-white text-black"
          >
            <option value="M-Pesa">M-Pesa</option>
            <option value="Bank">Bank</option>
            <option value="Paybill">Paybill</option>
          </select>
          <button
            onClick={makeRepayment}
            className="bg-brand-green text-white px-4 py-2 rounded hover:bg-brand-dark"
          >
            Submit Payment
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f4439] p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Past Repayments</h2>
        <ul className="space-y-2">
          {repayments.map((repay: any) => (
            <li key={repay.id} className="border-b py-2 text-sm">
              {repay.payment_date?.split("T")[0]} – KES {repay.amount} via{" "}
              {repay.method} (Ref: {repay.reference_no})
            </li>
          ))}
          {repayments.length === 0 && (
            <li>
              <p className="text-slate-500 text-sm text-center py-2">
                No repayments yet.
              </p>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
