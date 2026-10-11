import { useEffect, useState } from "react";

import PageHeader from "../../common/components/PageHeader";
import BackButton from "../../common/components/BackButton";
import DataTable from "../../common/components/DataTable";

import useReports from "../hooks/useReports";


// =========================================================
// QUICK PERIOD PRESETS
// =========================================================

const toDateInputValue = (date) => date.toISOString().slice(0, 10);

const PERIODS = [
    {
        key: "today",
        label: "Today",
        range: () => {
            const today = new Date();
            return [today, today];
        },
    },
    {
        key: "week",
        label: "This Week",
        range: () => {
            const today = new Date();
            const start = new Date(today);
            start.setDate(today.getDate() - today.getDay());
            return [start, today];
        },
    },
    {
        key: "month",
        label: "This Month",
        range: () => {
            const today = new Date();
            const start = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );
            return [start, today];
        },
    },
    {
        key: "year",
        label: "This Year",
        range: () => {
            const today = new Date();
            const start = new Date(today.getFullYear(), 0, 1);
            return [start, today];
        },
    },
    {
        key: "all",
        label: "All Time",
        range: () => [null, null],
    },
];


function ReportsPageView() {

    const {
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
    } = useReports();


    // ============================================
    // FILTER STATE
    // ============================================

    const [startDate, setStartDate] = useState("");

    const [endDate, setEndDate] = useState("");

    const [customerId, setCustomerId] = useState("");

    const [supplierId, setSupplierId] = useState("");

    const [activePeriod, setActivePeriod] = useState("");


    // ============================================
    // LOAD CUSTOMERS / SUPPLIERS FOR DROPDOWNS,
    // AND SHOW ALL RECORDS FOR THE DEFAULT REPORT
    // TYPE RIGHT AWAY (BEFORE ANY SEARCH)
    // ============================================

    useEffect(() => {

        loadFilterOptions();

        runReport({}, reportType);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // ============================================
    // WHEN SWITCHING REPORT TYPE, RESET ALL
    // FILTERS AND SHOW EVERY RECORD OF THAT
    // TYPE IMMEDIATELY (BEFORE ANY SEARCH)
    // ============================================

    const handleReportTypeChange = (type) => {

        setReportType(type);

        setCustomerId("");
        setSupplierId("");
        setStartDate("");
        setEndDate("");
        setActivePeriod("");

        runReport({}, type);
    };


    // ============================================
    // APPLY A QUICK PERIOD PRESET
    // ============================================

    const handlePeriodClick = (period) => {

        setActivePeriod(period.key);

        const [start, end] = period.range();

        setStartDate(start ? toDateInputValue(start) : "");
        setEndDate(end ? toDateInputValue(end) : "");
    };


    // ============================================
    // SEARCH
    // ============================================

    const handleSearch = (event) => {

        event.preventDefault();

        const filters = {};

        if (startDate) {
            filters.start_date = startDate;
        }

        if (endDate) {
            filters.end_date = endDate;
        }

        if (reportType === "sales" && customerId) {
            filters.customer_id = customerId;
        }

        if (reportType === "purchases" && supplierId) {
            filters.supplier_id = supplierId;
        }

        runReport(filters);
    };


    // ============================================
    // RESET
    // ============================================

    const handleReset = () => {

        setStartDate("");
        setEndDate("");
        setCustomerId("");
        setSupplierId("");
        setActivePeriod("");
    };


    // ============================================
    // TABLE COLUMNS
    // ============================================

    const salesColumns = [
        { key: "id", label: "ID", align: "center" },
        { key: "customer_name", label: "Customer" },
        {
            key: "total_amount",
            label: "Total",
            align: "right",
            render: (row) => `₹${Number(row.total_amount).toFixed(2)}`,
        },
        {
            key: "paid_amount",
            label: "Paid",
            align: "right",
            render: (row) => `₹${Number(row.paid_amount).toFixed(2)}`,
        },
        {
            key: "balance_due",
            label: "Balance Due",
            align: "right",
            render: (row) => `₹${Number(row.balance_due).toFixed(2)}`,
        },
        {
            key: "status",
            label: "Status",
            align: "center",
            render: (row) => (
                row.returned ? (
                    <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        {row.refunded ? "Returned & Refunded" : "Returned"}
                    </span>
                ) : (
                    <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Completed
                    </span>
                )
            ),
        },
        {
            key: "created_at",
            label: "Date",
            render: (row) =>
                row.created_at
                    ? new Date(row.created_at).toLocaleDateString()
                    : "-",
        },
    ];

    const purchasesColumns = [
        { key: "id", label: "ID", align: "center" },
        { key: "supplier_name", label: "Supplier" },
        {
            key: "total_amount",
            label: "Total",
            align: "right",
            render: (row) => `₹${Number(row.total_amount).toFixed(2)}`,
        },
        {
            key: "paid_amount",
            label: "Paid",
            align: "right",
            render: (row) => `₹${Number(row.paid_amount).toFixed(2)}`,
        },
        {
            key: "balance_due",
            label: "Balance Due",
            align: "right",
            render: (row) => `₹${Number(row.balance_due).toFixed(2)}`,
        },
        {
            key: "status",
            label: "Status",
            align: "center",
            render: (row) => (
                row.returned ? (
                    <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        Returned
                    </span>
                ) : (
                    <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Completed
                    </span>
                )
            ),
        },
        {
            key: "created_at",
            label: "Date",
            render: (row) =>
                row.created_at
                    ? new Date(row.created_at).toLocaleDateString()
                    : "-",
        },
    ];


    // ============================================
    // UI
    // ============================================

    return (

        <div className="min-h-screen bg-slate-100">

            <PageHeader
                title="Reports"
                description="Search purchase and sales reports by date, period, customer or supplier."
            />

            <main className="px-6 py-8 lg:px-10">

                <div className="mb-6">
                    <BackButton />
                </div>


                {/* ====================================
                    REPORT TYPE TABS
                ==================================== */}

                <div className="mb-6 inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">

                    <button
                        type="button"
                        onClick={() => handleReportTypeChange("sales")}
                        className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                            reportType === "sales"
                                ? "bg-blue-600 text-white"
                                : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                        Sales Report
                    </button>

                    <button
                        type="button"
                        onClick={() => handleReportTypeChange("purchases")}
                        className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                            reportType === "purchases"
                                ? "bg-blue-600 text-white"
                                : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                        Purchases Report
                    </button>

                </div>


                {/* ====================================
                    SEARCH BAR
                ==================================== */}

                <form
                    onSubmit={handleSearch}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >

                    {/* QUICK PERIODS */}

                    <div className="mb-4 flex flex-wrap gap-2">

                        {PERIODS.map((period) => (

                            <button
                                key={period.key}
                                type="button"
                                onClick={() => handlePeriodClick(period)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                    activePeriod === period.key
                                        ? "border-blue-600 bg-blue-50 text-blue-700"
                                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                {period.label}
                            </button>

                        ))}

                    </div>


                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                        {/* START DATE */}

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(event) => {
                                    setStartDate(event.target.value);
                                    setActivePeriod("");
                                }}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>


                        {/* END DATE */}

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(event) => {
                                    setEndDate(event.target.value);
                                    setActivePeriod("");
                                }}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>


                        {/* CUSTOMER / SUPPLIER */}

                        {reportType === "sales" ? (

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">
                                    Customer
                                </label>
                                <select
                                    value={customerId}
                                    onChange={(event) =>
                                        setCustomerId(event.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="">All Customers</option>
                                    {customers.map((customer) => (
                                        <option
                                            key={customer.id}
                                            value={customer.id}
                                        >
                                            {customer.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                        ) : (

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">
                                    Supplier
                                </label>
                                <select
                                    value={supplierId}
                                    onChange={(event) =>
                                        setSupplierId(event.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="">All Suppliers</option>
                                    {suppliers.map((supplier) => (
                                        <option
                                            key={supplier.id}
                                            value={supplier.id}
                                        >
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                        )}


                        {/* ACTIONS */}

                        <div className="flex items-end gap-2">

                            <button
                                type="submit"
                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Search
                            </button>

                            <button
                                type="button"
                                onClick={handleReset}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                            >
                                Reset
                            </button>

                        </div>

                    </div>

                </form>


                {/* ====================================
                    SUMMARY CARDS
                ==================================== */}

                {summary && (

                    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">

                        <SummaryCard
                            label="Records"
                            value={summary.count}
                        />

                        <SummaryCard
                            label="Total Amount"
                            value={`₹${Number(summary.total_amount).toFixed(2)}`}
                        />

                        <SummaryCard
                            label="Total Paid"
                            value={`₹${Number(summary.total_paid).toFixed(2)}`}
                        />

                        <SummaryCard
                            label="Balance Due"
                            value={`₹${Number(summary.total_balance_due).toFixed(2)}`}
                        />

                        <SummaryCard
                            label="Returned"
                            value={summary.returned_count}
                        />

                    </div>

                )}


                {/* ====================================
                    RESULTS TABLE
                ==================================== */}

                <DataTable
                    columns={
                        reportType === "sales"
                            ? salesColumns
                            : purchasesColumns
                    }
                    data={rows}
                    loading={loading}
                    error={error}
                    emptyMessage={
                        hasSearched
                            ? "No records found for the selected filters."
                            : "Choose a period, date range, customer or supplier, then click Search."
                    }
                />

            </main>

        </div>
    );
}


function SummaryCard({ label, value }) {

    return (

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            <p className="text-xs font-medium text-slate-500">
                {label}
            </p>

            <p className="mt-1 text-xl font-bold text-slate-800">
                {value}
            </p>

        </div>

    );
}


export default ReportsPageView;
