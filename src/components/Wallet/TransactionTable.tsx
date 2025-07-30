import { useEffect, useState } from "react";
import { api } from "../../services/api"; 
import React from "react";

export default function TransactionTable({ farmerId }: { farmerId: string }) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/wallet/${farmerId}/transactions`);
        setTransactions(res.data || []);
      } catch (err) {
        console.error("Failed to fetch transactions", err);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h4 className="font-bold mb-2 text-lg">📄 Transactions</h4>
      <table className="w-full text-sm border">
        <thead>
          <tr>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Amount</th>
            <th className="p-2 border">Source</th>
            <th className="p-2 border">Time</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx: any) => (
            <tr key={tx.id}>
              <td className="p-2 border">{tx.type}</td>
              <td className="p-2 border">{tx.amount}</td>
              <td className="p-2 border">{tx.source}</td>
              <td className="p-2 border">{new Date(tx.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
