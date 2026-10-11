import { useState } from "react";

import PageHeader from "../../common/components/PageHeader";
import BackButton from "../../common/components/BackButton";
import AddButton from "../../common/components/AddButton";
import EditButton from "../../common/components/EditButton";
import DeleteButton from "../../common/components/DeleteButton";
import DataTable from "../../common/components/DataTable";
import ConfirmDialog from "../../common/components/ConfirmDialog";

import ProductForm from "./ProductForm";
import useProducts from "../hooks/useProducts";


function Products() {

    const {
        products,
        loading,
        error,
        removeProduct,
    } = useProducts();


    const [showForm, setShowForm] = useState(false);

    const [selectedProduct, setSelectedProduct] =
        useState(null);


    const [deleteProduct, setDeleteProduct] =
        useState(null);

    const [deleteLoading, setDeleteLoading] =
        useState(false);

    const [deleteError, setDeleteError] =
        useState("");


    // =========================
    // ADD PRODUCT
    // =========================

    const handleAdd = () => {

        setSelectedProduct(null);

        setShowForm(true);

    };


    // =========================
    // EDIT PRODUCT
    // =========================

    const handleEdit = (product) => {

        setSelectedProduct(product);

        setShowForm(true);

    };


    // =========================
    // FORM SUCCESS
    // =========================

    const handleFormSuccess = () => {

        setShowForm(false);

        setSelectedProduct(null);

    };


    // =========================
    // FORM CANCEL
    // =========================

    const handleFormCancel = () => {

        setShowForm(false);

        setSelectedProduct(null);

    };


    // =========================
    // DELETE CLICK
    // =========================

    const handleDeleteClick = (product) => {

        setDeleteProduct(product);

        setDeleteError("");

    };


    // =========================
    // CONFIRM DELETE
    // =========================

    const handleConfirmDelete = async () => {

        if (!deleteProduct) {
            return;
        }


        try {

            setDeleteLoading(true);

            setDeleteError("");


            const result =
                await removeProduct(
                    deleteProduct.id
                );


            if (result.success) {

                setDeleteProduct(null);

                setDeleteError("");

            } else {

                setDeleteError(
                    result.message ||
                    "Unable to delete product."
                );

            }

        } catch (error) {

            console.error(
                "Delete product error:",
                error
            );

            setDeleteError(
                "Unable to delete product."
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
            label: "Product Name",
        },

        {
            key: "description",
            label: "Description",
        },

        {
            key: "price",
            label: "Purchase Price",
            align: "right",

            render: (product) =>
                `₹${Number(
                    product.price
                ).toFixed(2)}`,
        },

        {
            key: "selling_price",
            label: "Selling Price",
            align: "right",

            render: (product) =>
                `₹${Number(
                    product.selling_price
                ).toFixed(2)}`,
        },

        {
            key: "quantity",
            label: "Stock",
            align: "center",
        },

        {
            key: "actions",
            label: "Actions",
            align: "center",

            render: (product) => (

                <div className="flex justify-center gap-2">

                    <EditButton
                        onClick={() =>
                            handleEdit(product)
                        }
                    />

                    <DeleteButton
                        onClick={() =>
                            handleDeleteClick(product)
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
                title="Products"
                description="Manage your inventory products."
                action={
                    <AddButton
                        onClick={handleAdd}
                    >
                        Add Product
                    </AddButton>
                }
            />


            {/* =========================
                PAGE CONTENT
            ========================= */}

            <main className="px-6 py-8 lg:px-10">


                {/* BACK BUTTON */}

                <div className="mb-6">

                    <BackButton />

                </div>


                {/* =========================
                    PRODUCT FORM
                ========================= */}

                {showForm && (

                    <ProductForm
                        product={selectedProduct}
                        onSuccess={handleFormSuccess}
                        onCancel={handleFormCancel}
                    />

                )}


                {/* =========================
                    PRODUCT TABLE
                ========================= */}

                <DataTable
                    columns={columns}
                    data={products}
                    loading={loading}
                    error={error}
                    emptyMessage="No products found."
                />

            </main>


            {/* =========================
                DELETE CONFIRMATION
            ========================= */}

            <ConfirmDialog
                open={Boolean(deleteProduct)}

                title="Delete Product"

                message={
                    deleteProduct
                        ? `Are you sure you want to delete "${deleteProduct.name}"?`
                        : ""
                }

                error={deleteError}

                confirmText={
                    deleteLoading
                        ? "Deleting..."
                        : "Delete"
                }

                cancelText="Cancel"

                onConfirm={handleConfirmDelete}

                onCancel={() => {

                    setDeleteProduct(null);

                    setDeleteError("");

                }}

                loading={deleteLoading}
            />

        </div>

    );

}


export default Products;