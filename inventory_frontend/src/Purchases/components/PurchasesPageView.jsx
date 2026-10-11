import { useState } from "react";

import PageHeader from "../../common/components/PageHeader";
import BackButton from "../../common/components/BackButton";
import AddButton from "../../common/components/AddButton";
import EditButton from "../../common/components/EditButton";
import DeleteButton from "../../common/components/DeleteButton";
import DataTable from "../../common/components/DataTable";
import ConfirmDialog from "../../common/components/ConfirmDialog";

import PurchaseForm from "./PurchaseForm";
import usePurchases from "../hooks/usePurchases";

function Purchases() {
    const {
        purchases,
        loading,
        error,
        returnPurchase,
        removePurchase,
    } = usePurchases();

    const [showForm, setShowForm] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);

    const [returnPurchaseData, setReturnPurchaseData] = useState(null);
    const [returnLoading, setReturnLoading] = useState(false);
    const [returnError, setReturnError] = useState("");

    const [deletePurchaseData, setDeletePurchaseData] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const isReturned = (purchase) => (
        purchase?.returned === true ||
        purchase?.returned === 1 ||
        purchase?.returned === "true"
    );

    const handleAdd = () => {
        setSelectedPurchase(null);
        setShowForm(true);
    };

    const handleEdit = (purchase) => {
        if (isReturned(purchase)) return;
        setSelectedPurchase(purchase);
        setShowForm(true);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedPurchase(null);
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setSelectedPurchase(null);
    };

    const handleReturnClick = (purchase) => {
        if (isReturned(purchase)) return;
        setReturnError("");
        setReturnPurchaseData(purchase);
    };

    const handleConfirmReturn = async () => {
        if (!returnPurchaseData) return;

        try {
            setReturnLoading(true);
            setReturnError("");

            const result = await returnPurchase(returnPurchaseData.id);

            if (result.success) {
                setReturnPurchaseData(null);
            } else {
                setReturnError(result.message || "Unable to return purchase.");
            }
        } catch (err) {
            console.error("Return purchase error:", err);
            setReturnError(
                err.response?.data?.message ||
                "Unable to return purchase."
            );
        } finally {
            setReturnLoading(false);
        }
    };

    const handleCancelReturn = () => {
        if (returnLoading) return;
        setReturnPurchaseData(null);
        setReturnError("");
    };

    const handleDeleteClick = (purchase) => {
        setDeleteError("");
        setDeletePurchaseData(purchase);
    };

    const handleConfirmDelete = async () => {
        if (!deletePurchaseData) return;

        try {
            setDeleteLoading(true);
            setDeleteError("");

            const result = await removePurchase(deletePurchaseData.id);

            if (result.success) {
                setDeletePurchaseData(null);
            } else {
                setDeleteError(result.message || "Unable to delete purchase.");
            }
        } catch (err) {
            console.error("Delete purchase error:", err);
            setDeleteError(
                err.response?.data?.message ||
                "Unable to delete purchase."
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleCancelDelete = () => {
        if (deleteLoading) return;
        setDeletePurchaseData(null);
        setDeleteError("");
    };

    const columns = [
        {
            key: "id",
            label: "ID",
            align: "center",
            render: (purchase, index) => index + 1,
        },
        {
            key: "supplier_name",
            label: "Supplier",
        },
        {
            key: "items",
            label: "Products",
            render: (purchase) => (
                <div className="space-y-1">
                    {purchase.items?.map((item) => (
                        <div key={item.id} className="text-sm">
                            <span className="font-medium text-slate-700">
                                {item.product_name}
                            </span>
                            <span className="text-slate-500">
                                {" × "}{item.quantity}
                            </span>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            key: "total_amount",
            label: "Total Amount",
            align: "right",
            render: (purchase) =>
                `₹${Number(purchase.total_amount || 0).toFixed(2)}`,
        },
        {
            key: "created_at",
            label: "Date",
            render: (purchase) =>
                purchase.created_at
                    ? new Date(purchase.created_at).toLocaleDateString("en-IN")
                    : "-",
        },
        {
            key: "status",
            label: "Status",
            align: "center",
            render: (purchase) => (
                isReturned(purchase) ? (
                    <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                        Returned
                    </span>
                ) : (
                    <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-600">
                        Completed
                    </span>
                )
            ),
        },
        {
            key: "actions",
            label: "Actions",
            align: "center",
            render: (purchase) => (
                <div className="flex justify-center gap-2">
                    {!isReturned(purchase) && (
                        <>
                            <EditButton onClick={() => handleEdit(purchase)} />
                            <button
                                type="button"
                                onClick={() => handleReturnClick(purchase)}
                                className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
                            >
                                Return
                            </button>
                        </>
                    )}

                    {isReturned(purchase) && (
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-500">
                            Returned
                        </span>
                    )}

                    <DeleteButton onClick={() => handleDeleteClick(purchase)} />
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-slate-100">
            <PageHeader
                title="Purchases"
                description="Manage your purchase records."
                action={<AddButton onClick={handleAdd}>Add Purchase</AddButton>}
            />

            <main className="px-6 py-8 lg:px-10">
                <div className="mb-6">
                    <BackButton />
                </div>

                {showForm && (
                    <PurchaseForm
                        purchase={selectedPurchase}
                        onSuccess={handleFormSuccess}
                        onCancel={handleFormCancel}
                    />
                )}

                <DataTable
                    columns={columns}
                    data={purchases}
                    loading={loading}
                    error={error}
                    emptyMessage="No purchases found."
                />
            </main>

            <ConfirmDialog
                open={Boolean(returnPurchaseData)}
                title="Return Purchase"
                message={
                    returnPurchaseData
                        ? `Are you sure you want to return purchase #${returnPurchaseData.id}? The purchased stock will be removed from inventory.`
                        : ""
                }
                error={returnError}
                confirmText="Return"
                cancelText="Cancel"
                loading={returnLoading}
                onConfirm={handleConfirmReturn}
                onCancel={handleCancelReturn}
            />

            <ConfirmDialog
                open={Boolean(deletePurchaseData)}
                title="Delete Purchase"
                message={
                    deletePurchaseData
                        ? `Are you sure you want to delete purchase #${deletePurchaseData.id}?`
                        : ""
                }
                error={deleteError}
                confirmText="Delete"
                cancelText="Cancel"
                loading={deleteLoading}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </div>
    );
}

export default Purchases;
