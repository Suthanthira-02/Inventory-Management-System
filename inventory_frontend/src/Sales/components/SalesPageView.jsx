import { useState } from "react";

import PageHeader from "../../common/components/PageHeader";
import BackButton from "../../common/components/BackButton";
import AddButton from "../../common/components/AddButton";
import EditButton from "../../common/components/EditButton";
import DeleteButton from "../../common/components/DeleteButton";
import DataTable from "../../common/components/DataTable";
import ConfirmDialog from "../../common/components/ConfirmDialog";

import SaleForm from "./SaleForm";
import useSales from "../hooks/useSales";


function Sales() {

    // ============================================
    // SALES CONTEXT
    // ============================================

    const {
        sales,
        loading,
        error,
        returnSale,
        refundSale,
        removeSale,
    } = useSales();


    // ============================================
    // FORM
    // ============================================

    const [showForm, setShowForm] =
        useState(false);

    const [selectedSale, setSelectedSale] =
        useState(null);


    // ============================================
    // RETURN
    // ============================================

    const [returnSaleData, setReturnSaleData] =
        useState(null);

    const [returnLoading, setReturnLoading] =
        useState(false);

    const [returnError, setReturnError] =
        useState("");


    // ============================================
    // REFUND
    // ============================================

    const [refundSaleData, setRefundSaleData] =
        useState(null);

    const [refundLoading, setRefundLoading] =
        useState(false);

    const [refundError, setRefundError] =
        useState("");


    // ============================================
    // DELETE
    // ============================================

    const [deleteSaleData, setDeleteSaleData] =
        useState(null);

    const [deleteLoading, setDeleteLoading] =
        useState(false);

    const [deleteError, setDeleteError] =
        useState("");


    // ============================================
    // ADD SALE
    // ============================================

    const handleAdd = () => {

        setSelectedSale(null);

        setShowForm(true);
    };


    // ============================================
    // EDIT SALE
    // ============================================

    const handleEdit = (sale) => {

        if (sale.returned) {
            return;
        }

        setSelectedSale(sale);

        setShowForm(true);
    };


    // ============================================
    // FORM SUCCESS
    // ============================================

    const handleFormSuccess = () => {

        setShowForm(false);

        setSelectedSale(null);
    };


    // ============================================
    // FORM CANCEL
    // ============================================

    const handleFormCancel = () => {

        setShowForm(false);

        setSelectedSale(null);
    };


    // ============================================
    // RETURN CLICK
    // ============================================

    const handleReturnClick = (sale) => {

        if (sale.returned) {
            return;
        }

        setReturnError("");

        setReturnSaleData(sale);
    };


    // ============================================
    // CONFIRM RETURN
    // ============================================

    const handleConfirmReturn = async () => {

        if (!returnSaleData) {
            return;
        }


        try {

            setReturnLoading(true);

            setReturnError("");


            const result =
                await returnSale(
                    returnSaleData.id
                );


            if (result.success) {

                setReturnSaleData(null);

            } else {

                setReturnError(
                    result.message ||
                    "Unable to return sale."
                );
            }

        } catch (error) {

            console.error(
                "Return sale error:",
                error
            );

            setReturnError(
                error.response?.data?.message ||
                "Unable to return sale."
            );

        } finally {

            setReturnLoading(false);
        }
    };


    // ============================================
    // CANCEL RETURN
    // ============================================

    const handleCancelReturn = () => {

        if (returnLoading) {
            return;
        }

        setReturnSaleData(null);

        setReturnError("");
    };


    // ============================================
    // REFUND CLICK
    // ============================================

    const handleRefundClick = (sale) => {

        if (!sale.refund_due) {
            return;
        }

        setRefundError("");

        setRefundSaleData(sale);
    };


    // ============================================
    // CONFIRM REFUND
    // ============================================

    const handleConfirmRefund = async () => {

        if (!refundSaleData) {
            return;
        }


        try {

            setRefundLoading(true);

            setRefundError("");


            const result =
                await refundSale(
                    refundSaleData.id
                );


            if (result.success) {

                setRefundSaleData(null);

            } else {

                setRefundError(
                    result.message ||
                    "Unable to refund sale."
                );
            }

        } catch (error) {

            console.error(
                "Refund sale error:",
                error
            );

            setRefundError(
                error.response?.data?.message ||
                "Unable to refund sale."
            );

        } finally {

            setRefundLoading(false);
        }
    };


    // ============================================
    // CANCEL REFUND
    // ============================================

    const handleCancelRefund = () => {

        if (refundLoading) {
            return;
        }

        setRefundSaleData(null);

        setRefundError("");
    };


    // ============================================
    // DELETE CLICK
    // ============================================

    const handleDeleteClick = (sale) => {

        setDeleteError("");

        setDeleteSaleData(sale);
    };


    // ============================================
    // CONFIRM DELETE
    // ============================================

    const handleConfirmDelete = async () => {

        if (!deleteSaleData) {
            return;
        }


        try {

            setDeleteLoading(true);

            setDeleteError("");


            const result =
                await removeSale(
                    deleteSaleData.id
                );


            if (result.success) {

                setDeleteSaleData(null);

            } else {

                setDeleteError(
                    result.message ||
                    "Unable to delete sale."
                );
            }

        } catch (error) {

            console.error(
                "Delete sale error:",
                error
            );

            setDeleteError(
                error.response?.data?.message ||
                "Unable to delete sale."
            );

        } finally {

            setDeleteLoading(false);
        }
    };


    // ============================================
    // CANCEL DELETE
    // ============================================

    const handleCancelDelete = () => {

        if (deleteLoading) {
            return;
        }

        setDeleteSaleData(null);

        setDeleteError("");
    };


    // ============================================
    // TABLE COLUMNS
    // ============================================

    const columns = [

        // ----------------------------------------
        // ID
        // ----------------------------------------

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


        // ----------------------------------------
        // PRODUCTS
        // ----------------------------------------

        {
            key: "items",
            label: "Products",

            render: (sale) => (

                <div className="space-y-1">

                    {sale.items?.map(
                        (item) => (

                            <div
                                key={item.id}
                                className="text-sm"
                            >

                                <span
                                    className="
                                        font-medium
                                        text-slate-700
                                    "
                                >
                                    {
                                        item.product_name
                                    }
                                </span>

                                <span
                                    className="
                                        text-slate-500
                                    "
                                >
                                    {" × "}
                                    {
                                        item.quantity
                                    }
                                </span>

                            </div>
                        )
                    )}

                </div>
            ),
        },


        // ----------------------------------------
        // TOTAL
        // ----------------------------------------

        {
            key: "total_amount",

            label: "Total Amount",

            align: "right",

            render: (sale) =>
                `₹${Number(
                    sale.total_amount
                ).toFixed(2)}`,
        },


        // ----------------------------------------
        // DATE
        // ----------------------------------------

        {
            key: "created_at",

            label: "Date",

            render: (sale) =>
                sale.created_at
                    ? new Date(
                        sale.created_at
                    ).toLocaleDateString()
                    : "-",
        },


        // ----------------------------------------
        // STATUS
        // ----------------------------------------

        {
            key: "returned",

            label: "Status",

            align: "center",

            render: (sale) => (

                sale.returned ? (

                    <span
                        className="
                            inline-flex
                            rounded-full
                            bg-amber-100
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            text-amber-700
                        "
                    >
                        {sale.refunded
                            ? "Returned & Refunded"
                            : "Returned"}
                    </span>

                ) : (

                    <span
                        className="
                            inline-flex
                            rounded-full
                            bg-green-100
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            text-green-700
                        "
                    >
                        Completed
                    </span>

                )
            ),
        },


        // ----------------------------------------
        // ACTIONS
        // ----------------------------------------

        {
            key: "actions",

            label: "Actions",

            align: "center",

            render: (sale) => (

                <div
                    className="
                        flex
                        justify-center
                        gap-2
                    "
                >

                    {/* EDIT */}

                    <EditButton
                        onClick={() =>
                            handleEdit(sale)
                        }

                        disabled={
                            sale.returned
                        }
                    />


                    {/* RETURN */}

                    {!sale.returned && (

                        <button
                            type="button"

                            onClick={() =>
                                handleReturnClick(
                                    sale
                                )
                            }

                            className="
                                rounded-lg
                                bg-amber-500
                                px-3
                                py-2
                                text-sm
                                font-medium
                                text-white
                                transition
                                hover:bg-amber-600
                            "
                        >
                            Return
                        </button>

                    )}


                    {/* REFUND */}

                    {sale.refund_due && (

                        <button
                            type="button"

                            onClick={() =>
                                handleRefundClick(
                                    sale
                                )
                            }

                            className="
                                rounded-lg
                                bg-purple-600
                                px-3
                                py-2
                                text-sm
                                font-medium
                                text-white
                                transition
                                hover:bg-purple-700
                            "
                        >
                            Refund
                        </button>

                    )}


                    {/* DELETE */}

                    <DeleteButton
                        onClick={() =>
                            handleDeleteClick(
                                sale
                            )
                        }
                    />

                </div>
            ),
        },
    ];


    // ============================================
    // PAGE
    // ============================================

    return (

        <div
            className="
                min-h-screen
                bg-slate-100
            "
        >

            {/* ====================================
                HEADER
            ==================================== */}

            <PageHeader

                title="Sales"

                description="
                    Manage your sales and customer transactions.
                "

                action={
                    <AddButton
                        onClick={handleAdd}
                    >
                        Add Sale
                    </AddButton>
                }

            />


            {/* ====================================
                MAIN
            ==================================== */}

            <main
                className="
                    px-6
                    py-8
                    lg:px-10
                "
            >

                {/* BACK BUTTON */}

                <div className="mb-6">

                    <BackButton />

                </div>


                {/* ==================================
                    SALE FORM
                ================================== */}

                {showForm && (

                    <SaleForm

                        sale={selectedSale}

                        onSuccess={
                            handleFormSuccess
                        }

                        onCancel={
                            handleFormCancel
                        }

                    />

                )}


                {/* ==================================
                    SALES TABLE
                ================================== */}

                <DataTable

                    columns={columns}

                    data={sales}

                    loading={loading}

                    error={error}

                    emptyMessage="
                        No sales found.
                    "

                />

            </main>


            {/* ====================================
                RETURN DIALOG
            ==================================== */}

            <ConfirmDialog

                open={
                    Boolean(
                        returnSaleData
                    )
                }

                title="Return Sale"

                message={
                    returnSaleData

                        ? `Are you sure you want to return sale #${returnSaleData.id}? The sold products will be added back to inventory.`

                        : ""
                }

                error={returnError}

                confirmText="Return"

                cancelText="Cancel"

                loading={returnLoading}

                onConfirm={
                    handleConfirmReturn
                }

                onCancel={
                    handleCancelReturn
                }

            />


            {/* ====================================
                REFUND DIALOG
            ==================================== */}

            <ConfirmDialog

                open={
                    Boolean(
                        refundSaleData
                    )
                }

                title="Refund Sale"

                message={
                    refundSaleData

                        ? `Are you sure you want to refund sale #${refundSaleData.id}? ₹${Number(refundSaleData.paid_amount).toFixed(2)} will be refunded to ${refundSaleData.customer_name || "the customer"}, bringing their balance back to zero.`

                        : ""
                }

                error={refundError}

                confirmText="Refund"

                cancelText="Cancel"

                loading={refundLoading}

                onConfirm={
                    handleConfirmRefund
                }

                onCancel={
                    handleCancelRefund
                }

            />


            {/* ====================================
                DELETE DIALOG
            ==================================== */}

            <ConfirmDialog

                open={
                    Boolean(
                        deleteSaleData
                    )
                }

                title="Delete Sale"

                message={
                    deleteSaleData

                        ? `Are you sure you want to delete sale #${deleteSaleData.id}?`

                        : ""
                }

                error={deleteError}

                confirmText="Delete"

                cancelText="Cancel"

                loading={deleteLoading}

                onConfirm={
                    handleConfirmDelete
                }

                onCancel={
                    handleCancelDelete
                }

            />

        </div>
    );
}


export default Sales;