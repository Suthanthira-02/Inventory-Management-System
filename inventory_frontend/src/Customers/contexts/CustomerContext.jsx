import { createContext, useCallback, useEffect, useState } from "react";
import {
    getCustomers, createCustomer, updateCustomer, deleteCustomer,
    getCustomerLedger, addCustomerPayment,
} from "../services/customerApi";
import { getSales } from "../../Sales/services/saleApi";

const CustomerContext = createContext(null);

export function CustomerProvider({ children }) {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true); setError("");
            const [customerData, salesData] = await Promise.all([
                getCustomers(),
                getSales(),
            ]);

            const allCustomers = customerData.customers || [];
            const sales = salesData.sales || [];

            const linkedIds = new Set(
                sales
                    .map((sale) => sale.customer_id)
                    .filter((id) => id !== null && id !== undefined)
                    .map((id) => Number(id))
            );

            setCustomers(
                allCustomers.filter((customer) =>
                    linkedIds.has(Number(customer.id))
                )
            );
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load customers.");
        } finally { setLoading(false); }
    }, []);

    const run = async (operation, fallback) => {
        try {
            setError("");
            const data = await operation();
            if (!data.success) return { success: false, message: data.message || fallback };
            await loadCustomers();
            return { success: true, message: data.message || fallback };
        } catch (err) {
            const message = err.response?.data?.message || err.message || fallback;
            return { success: false, message };
        }
    };

    const addCustomer = (data) => run(() => createCustomer(data), "Customer created successfully.");
    const editCustomer = (id, data) => run(() => updateCustomer(id, data), "Customer updated successfully.");
    const removeCustomer = (id) => run(() => deleteCustomer(id), "Customer deleted successfully.");

    const loadLedger = async (id) => {
        try { return await getCustomerLedger(id); }
        catch (err) { return { success: false, message: err.response?.data?.message || "Unable to load customer ledger." }; }
    };

    const makePayment = async (id, data) => {
        try { return await addCustomerPayment(id, data); }
        catch (err) { return { success: false, message: err.response?.data?.message || "Unable to add payment." }; }
    };

    useEffect(() => { loadCustomers(); }, [loadCustomers]);

    return <CustomerContext.Provider value={{ customers, loading, error, loadCustomers, addCustomer, editCustomer, removeCustomer, loadLedger, makePayment }}>
        {children}
    </CustomerContext.Provider>;
}

export default CustomerContext;
