import { useEffect, useState } from "react";
import CrudForm from "../../common/components/CrudForm";
import useCustomers from "../hooks/useCustomers";

const initial = { name: "", phone: "", email: "", address: "", opening_balance: "0" };

export default function CustomerForm({ customer, onSuccess, onCancel }) {
    const { addCustomer, editCustomer } = useCustomers();
    const [form, setForm] = useState(initial);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setForm(customer ? {
            name: customer.name || "", phone: customer.phone || "", email: customer.email || "",
            address: customer.address || "", opening_balance: customer.opening_balance ?? 0,
        } : initial);
        setError("");
    }, [customer]);

    const change = (e) => setForm((v) => ({ ...v, [e.target.name]: e.target.value }));
    const submit = async (e) => {
        e.preventDefault(); setLoading(true); setError("");
        const result = customer ? await editCustomer(customer.id, form) : await addCustomer(form);
        setLoading(false);
        if (result.success) onSuccess?.(); else setError(result.message);
    };

    return <CrudForm title={customer ? "Edit Customer" : "Add Customer"} onSubmit={submit} onCancel={onCancel} loading={loading} error={error}>
        <input name="name" value={form.name} onChange={change} placeholder="Customer name" required />
        <input name="phone" value={form.phone} onChange={change} placeholder="Phone" />
        <input name="email" type="email" value={form.email} onChange={change} placeholder="Email" />
        <textarea name="address" value={form.address} onChange={change} placeholder="Address" />
        <input name="opening_balance" type="number" min="0" step="0.01" value={form.opening_balance} onChange={change} placeholder="Opening balance" />
    </CrudForm>;
}
