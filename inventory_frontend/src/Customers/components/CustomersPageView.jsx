import { useState } from "react";

import PageHeader from "../../common/components/PageHeader";
import BackButton from "../../common/components/BackButton";
import ConfirmDialog from "../../common/components/ConfirmDialog";
import CustomerForm from "./CustomerForm";

import CustomerTable from "./CustomerTable";
import CustomerLedger from "./CustomerLedger";

import useCustomers from "../hooks/useCustomers";


export default function Customers() {

    const {
        customers,
        loading,
        error,
        removeCustomer,
    } = useCustomers();

    const [deleteItem, setDeleteItem] =
        useState(null);

    const [deleteError, setDeleteError] =
        useState("");

    const [deleteLoading, setDeleteLoading] =
        useState(false);

    const [ledgerCustomer, setLedgerCustomer] =
        useState(null);

    const [showForm, setShowForm] =
        useState(false);

    const [selectedCustomer, setSelectedCustomer] =
        useState(null);


    const handleEdit = (customer) => {
        setSelectedCustomer(customer);
        setShowForm(true);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedCustomer(null);
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setSelectedCustomer(null);
    };

    const handleDelete = (customer) => {
        setDeleteError("");
        setDeleteItem(customer);
    };


    const handleConfirmDelete = async () => {

        if (!deleteItem) {
            return;
        }

        setDeleteLoading(true);
        setDeleteError("");

        const result =
            await removeCustomer(deleteItem.id);

        if (result.success) {
            setDeleteItem(null);
        } else {
            setDeleteError(result.message);
        }

        setDeleteLoading(false);
    };


    return (
        <div className="min-h-screen bg-slate-100">

            <PageHeader
                title="Customers"
                description="View customer accounts, balances, payments and sales history."
            />

            <main className="px-6 py-8 lg:px-10">

                <div className="mb-6">
                    <BackButton />
                </div>

                {showForm && (
                    <CustomerForm
                        customer={selectedCustomer}
                        onSuccess={handleFormSuccess}
                        onCancel={handleFormCancel}
                    />
                )}

                <CustomerTable
                    customers={customers}
                    loading={loading}
                    error={error}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onLedger={setLedgerCustomer}
                />

            </main>

            <ConfirmDialog
                open={Boolean(deleteItem)}
                title="Delete Customer"
                message={
                    deleteItem
                        ? `Are you sure you want to delete "${deleteItem.name}"?`
                        : ""
                }
                error={deleteError}
                confirmText="Delete"
                cancelText="Cancel"
                loading={deleteLoading}
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    if (!deleteLoading) {
                        setDeleteItem(null);
                        setDeleteError("");
                    }
                }}
            />

            {ledgerCustomer && (
                <CustomerLedger
                    customer={ledgerCustomer}
                    onClose={() =>
                        setLedgerCustomer(null)
                    }
                />
            )}

        </div>
    );
}
