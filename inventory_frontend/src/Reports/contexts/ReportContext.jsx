import { createContext, useState } from "react";

import {
    getSalesReport,
    getPurchasesReport,
} from "../services/reportApi";

import { getCustomers } from "../../Customers/services/customerApi";
import { getSuppliers } from "../../Suppliers/services/supplierApi";


const ReportContext = createContext();


// A true network failure (backend unreachable, CORS
// blocked, connection refused) never gets an
// error.response from axios - only error.message, which
// is the generic "Network Error". Surface something more
// actionable than that generic string.
function describeReportError(error, fallback) {

    if (error.response?.data?.message) {
        return error.response.data.message;
    }

    if (error.code === "ERR_NETWORK" || !error.response) {
        return (
            "Could not reach the server. Make sure the " +
            "backend is running at the expected address " +
            "and try again."
        );
    }

    return error.message || fallback;
}


export function ReportProvider({ children }) {

    // =========================
    // STATE
    // =========================

    const [reportType, setReportType] = useState("sales");

    const [rows, setRows] = useState([]);

    const [summary, setSummary] = useState(null);

    const [customers, setCustomers] = useState([]);

    const [suppliers, setSuppliers] = useState([]);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [hasSearched, setHasSearched] = useState(false);


    // =========================
    // LOAD FILTER OPTIONS
    // (customers + suppliers, for the search bar dropdowns)
    // =========================

    const loadFilterOptions = async () => {

        try {

            const [customerData, supplierData] = await Promise.all([
                getCustomers(),
                getSuppliers(),
            ]);

            setCustomers(customerData.customers || []);
            setSuppliers(supplierData.suppliers || []);

        } catch (error) {

            console.error(
                "Load report filter options error:",
                error
            );
        }
    };


    // =========================
    // RUN SALES REPORT
    // =========================

    const runSalesReport = async (filters) => {

        try {

            setLoading(true);
            setError("");

            const data = await getSalesReport(filters);

            if (!data.success) {
                throw new Error(
                    data.message ||
                    "Unable to generate sales report."
                );
            }

            setRows(data.sales || []);
            setSummary(data.summary || null);
            setHasSearched(true);

        } catch (error) {

            console.error(
                "Sales report error:",
                error
            );

            setError(
                describeReportError(
                    error,
                    "Unable to generate sales report."
                )
            );

            setRows([]);
            setSummary(null);

        } finally {

            setLoading(false);
        }
    };


    // =========================
    // RUN PURCHASES REPORT
    // =========================

    const runPurchasesReport = async (filters) => {

        try {

            setLoading(true);
            setError("");

            const data = await getPurchasesReport(filters);

            if (!data.success) {
                throw new Error(
                    data.message ||
                    "Unable to generate purchases report."
                );
            }

            setRows(data.purchases || []);
            setSummary(data.summary || null);
            setHasSearched(true);

        } catch (error) {

            console.error(
                "Purchases report error:",
                error
            );

            setError(
                describeReportError(
                    error,
                    "Unable to generate purchases report."
                )
            );

            setRows([]);
            setSummary(null);

        } finally {

            setLoading(false);
        }
    };


    // =========================
    // RUN REPORT
    // (dispatches to sales or purchases based on reportType)
    // =========================

    const runReport = async (filters, typeOverride) => {

        const type = typeOverride || reportType;

        if (type === "purchases") {
            await runPurchasesReport(filters);
        } else {
            await runSalesReport(filters);
        }
    };


    return (

        <ReportContext.Provider
            value={{
                reportType,
                setReportType,
                rows,
                summary,
                customers,
                suppliers,
                loading,
                error,
                hasSearched,
                loadFilterOptions,
                runReport,
            }}
        >

            {children}

        </ReportContext.Provider>

    );
}


export default ReportContext;
