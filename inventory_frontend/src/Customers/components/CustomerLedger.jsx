import { useEffect, useState } from "react";
import useCustomers from "../hooks/useCustomers";

export default function CustomerLedger({ customer, onClose }) {
    const { loadLedger, makePayment } = useCustomers();
    const [data, setData] = useState(null);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const load = async () => { setLoading(true); const result = await loadLedger(customer.id); if (result.success) setData(result); else setError(result.message); setLoading(false); };
    useEffect(() => { load(); }, [customer.id]);

    const payment = async (e) => { e.preventDefault(); setSaving(true); setError(""); const result = await makePayment(customer.id, { amount, description }); setSaving(false); if (result.success) { setAmount(""); setDescription(""); await load(); } else setError(result.message); };

    const ledger = data?.ledger || data?.entries || [];
    const balance = data?.current_balance ?? data?.balance ?? customer.current_balance ?? 0;
    return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4"><div className="mx-auto mt-10 max-w-5xl rounded-2xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-bold">{customer.name} — Ledger</h2><p className="text-sm text-slate-500">Current balance: ₹{Number(balance).toFixed(2)}</p></div><button onClick={onClose} className="rounded-lg px-3 py-2 hover:bg-slate-100">Close</button></div>
        <form onSubmit={payment} className="mb-5 grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-3"><input className="rounded-lg border p-2" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Payment amount" required /><input className="rounded-lg border p-2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" /><button disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-white">{saving ? "Saving..." : "Add Payment"}</button></form>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {loading ? <p>Loading ledger...</p> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3">Description</th><th className="p-3 text-right">Debit</th><th className="p-3 text-right">Credit</th><th className="p-3 text-right">Balance</th></tr></thead><tbody>{ledger.map((entry) => <tr key={entry.id} className="border-b"><td className="p-3">{entry.transaction_date || entry.created_at || "-"}</td><td className="p-3">{entry.transaction_type || "-"}</td><td className="p-3">{entry.description || "-"}</td><td className="p-3 text-right">₹{Number(entry.debit || 0).toFixed(2)}</td><td className="p-3 text-right">₹{Number(entry.credit || 0).toFixed(2)}</td><td className="p-3 text-right">₹{Number(entry.balance || 0).toFixed(2)}</td></tr>)}</tbody></table></div>}</div></div>;
}
