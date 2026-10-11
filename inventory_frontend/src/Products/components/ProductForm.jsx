import { useEffect, useState } from "react";

import CrudForm from "../../common/components/CrudForm";
import useProducts from "../hooks/useProducts";

function ProductForm({
    product = null,
    onSuccess,
    onCancel,
}) {
    const { addProduct, editProduct } = useProducts();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        selling_price: "",
        quantity: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isEditing = Boolean(product);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || "",
                description: product.description || "",
                price: product.price ?? "",
                selling_price: product.selling_price ?? "",
                quantity: product.quantity ?? "",
            });
        } else {
            setFormData({
                name: "",
                description: "",
                price: "",
                selling_price: "",
                quantity: "",
            });
        }

        setError("");
    }, [product]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        if (!formData.name.trim()) {
            setError("Product name is required.");
            return;
        }

        if (formData.price === "") {
            setError("Purchase price is required.");
            return;
        }

        if (formData.selling_price === "") {
            setError("Selling price is required.");
            return;
        }

        if (formData.quantity === "") {
            setError("Quantity is required.");
            return;
        }

        const productData = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            price: Number(formData.price),
            selling_price: Number(formData.selling_price),
            quantity: Number(formData.quantity),
        };

        try {
            setLoading(true);

            let result;

            if (isEditing) {
                result = await editProduct(
                    product.id,
                    productData
                );
            } else {
                result = await addProduct(productData);
            }

            if (!result.success) {
                setError(result.message);
                return;
            }

            onSuccess?.();

        } catch (error) {
            console.error("Product form error:", error);

            setError(
                error.message ||
                "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <CrudForm
            title={
                isEditing
                    ? "Edit Product"
                    : "Add Product"
            }
            description={
                isEditing
                    ? "Update the product details."
                    : "Enter the details for the new product."
            }
            error={error}
            loading={loading}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            submitText={
                isEditing
                    ? "Update Product"
                    : "Add Product"
            }
        >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* Product Name */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Product Name
                    </label>

                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter product name"
                        className="
                            w-full rounded-xl border border-slate-300
                            px-4 py-3 text-sm outline-none
                            transition focus:border-blue-500
                            focus:ring-2 focus:ring-blue-100
                        "
                    />
                </div>

                {/* Purchase Price */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Purchase Price
                    </label>

                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="Enter purchase price"
                        className="
                            w-full rounded-xl border border-slate-300
                            px-4 py-3 text-sm outline-none
                            transition focus:border-blue-500
                            focus:ring-2 focus:ring-blue-100
                        "
                    />
                </div>

                {/* Selling Price */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Selling Price
                    </label>

                    <input
                        type="number"
                        name="selling_price"
                        value={formData.selling_price}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="Enter selling price"
                        className="
                            w-full rounded-xl border border-slate-300
                            px-4 py-3 text-sm outline-none
                            transition focus:border-blue-500
                            focus:ring-2 focus:ring-blue-100
                        "
                    />
                </div>

                {/* Quantity */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Quantity
                    </label>

                    <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        placeholder="Enter quantity"
                        className="
                            w-full rounded-xl border border-slate-300
                            px-4 py-3 text-sm outline-none
                            transition focus:border-blue-500
                            focus:ring-2 focus:ring-blue-100
                        "
                    />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Description
                    </label>

                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Enter product description"
                        className="
                            w-full resize-none rounded-xl
                            border border-slate-300 px-4 py-3
                            text-sm outline-none transition
                            focus:border-blue-500
                            focus:ring-2 focus:ring-blue-100
                        "
                    />
                </div>

            </div>
        </CrudForm>
    );
}

export default ProductForm;