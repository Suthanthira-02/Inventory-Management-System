import { useState } from "react";

import PageHeader from "../../common/components/PageHeader";
import BackButton from "../../common/components/BackButton";
import AddButton from "../../common/components/AddButton";
import EditButton from "../../common/components/EditButton";
import DeleteButton from "../../common/components/DeleteButton";
import DataTable from "../../common/components/DataTable";
import ConfirmDialog from "../../common/components/ConfirmDialog";

import SupplierForm from "./SupplierForm";
import useSuppliers from "../hooks/useSuppliers";

function Suppliers() {
    const {
        suppliers,
        loading,
        error,
        removeSupplier,
    } = useSuppliers();

    const [showForm, setShowForm] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const [deleteSupplier, setDeleteSupplier] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    // =========================
    // ADD SUPPLIER
    // =========================

    const handleAdd = () => {
        setSelectedSupplier(null);
        setShowForm(true);
    };

    // =========================
    // EDIT SUPPLIER
    // =========================

    const handleEdit = (supplier) => {
        setSelectedSupplier(supplier);
        setShowForm(true);
    };

    // =========================
    // FORM SUCCESS
    // =========================

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedSupplier(null);
    };

    // =========================
    // FORM CANCEL
    // =========================

    const handleFormCancel = () => {
        setShowForm(false);
        setSelectedSupplier(null);
    };

    // =========================
    // DELETE CLICK
    // =========================

    const handleDeleteClick = (supplier) => {
        setDeleteError("");
        setDeleteSupplier(supplier);
    };

    // =========================
    // CONFIRM DELETE
    // =========================

    const handleConfirmDelete = async () => {
        if (!deleteSupplier) {
            return;
        }

        try {
            setDeleteLoading(true);
            setDeleteError("");

            const result = await removeSupplier(
                deleteSupplier.id
            );

            if (result.success) {
                setDeleteSupplier(null);
            } else {
                setDeleteError(result.message || "Unable to delete supplier.");
            }
        } catch (error) {
            console.error(
                "Delete supplier error:",
                error
            );
            setDeleteError(
                error.response?.data?.message ||
                "Unable to delete supplier."
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    // =========================
    // TABLE COLUMNS
    // =========================

    const columns = [
        {
            key: "id",
            label: "ID",
            align: "center",

            render: (record, index) => (
                <span className="font-medium">
                    {index + 1}
                </span>
            ),
        },

        {
            key: "name",
            label: "Supplier Name",
        },

        {
            key: "email",
            label: "Email",
        },

        {
            key: "phone",
            label: "Phone",
        },

        {
            key: "address",
            label: "Address",
        },

        {
            key: "actions",
            label: "Actions",
            align: "center",

            render: (supplier) => (
                <div className="flex justify-center gap-2">
                    <EditButton
                        onClick={() =>
                            handleEdit(supplier)
                        }
                    />

                    <DeleteButton
                        onClick={() =>
                            handleDeleteClick(supplier)
                        }
                    />
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-slate-100">

            {/* =========================
                HEADER
            ========================= */}

            <PageHeader
                title="Suppliers"
                description="Manage your suppliers and their contact details."
                action={
                    <AddButton onClick={handleAdd}>
                        Add Supplier
                    </AddButton>
                }
            />

            {/* =========================
                PAGE CONTENT
            ========================= */}

            <main className="px-6 py-8 lg:px-10">

                {/* Back Button */}

                <div className="mb-6">
                    <BackButton />
                </div>

                {/* =========================
                    SUPPLIER FORM
                ========================= */}

                {showForm && (
                    <SupplierForm
                        supplier={selectedSupplier}
                        onSuccess={handleFormSuccess}
                        onCancel={handleFormCancel}
                    />
                )}

                {/* =========================
                    SUPPLIER TABLE
                ========================= */}

                <DataTable
                    columns={columns}
                    data={suppliers}
                    loading={loading}
                    error={error}
                    emptyMessage="No suppliers found."
                />

            </main>

            {/* =========================
                DELETE CONFIRMATION
            ========================= */}

            <ConfirmDialog
                open={Boolean(deleteSupplier)}
                title="Delete Supplier"
                message={
                    deleteSupplier
                        ? `Are you sure you want to delete "${deleteSupplier.name}"?`
                        : ""
                }
                error={deleteError}
                confirmText="Delete"
                cancelText="Cancel"
                loading={deleteLoading}
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    if (!deleteLoading) {
                        setDeleteSupplier(null);
                        setDeleteError("");
                    }
                }}
            />

        </div>
    );
}

export default Suppliers;