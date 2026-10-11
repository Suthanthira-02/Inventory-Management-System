import { createContext, useEffect, useState } from "react";

import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../services/productApi";


const ProductContext = createContext();


export function ProductProvider({ children }) {

    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // =========================
    // GET PRODUCTS
    // =========================

    const loadProducts = async () => {

        try {

            setLoading(true);
            setError("");

            const data = await getProducts();

            setProducts(data.products || []);

        } catch (error) {

            console.error(
                "Get products error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load products."
            );

        } finally {

            setLoading(false);

        }
    };


    // =========================
    // ADD PRODUCT
    // =========================

    const addProduct = async (productData) => {

        try {

            setError("");

            const data =
                await createProduct(productData);

            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to create product."
                );

            }

            await loadProducts();

            return {
                success: true,
                message:
                    data.message ||
                    "Product created successfully.",
            };

        } catch (error) {

            console.error(
                "Create product error:",
                error
            );

            const message =
                error.response?.data?.message ||
                error.message ||
                "Unable to create product.";

            setError(message);

            return {
                success: false,
                message,
            };

        }
    };


    // =========================
    // EDIT PRODUCT
    // =========================

    const editProduct = async (
        productId,
        productData
    ) => {

        try {

            setError("");

            const data =
                await updateProduct(
                    productId,
                    productData
                );

            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to update product."
                );

            }

            await loadProducts();

            return {
                success: true,
                message:
                    data.message ||
                    "Product updated successfully.",
            };

        } catch (error) {

            console.error(
                "Update product error:",
                error
            );

            const message =
                error.response?.data?.message ||
                error.message ||
                "Unable to update product.";

            setError(message);

            return {
                success: false,
                message,
            };

        }
    };


    // =========================
    // DELETE PRODUCT
    // =========================

    const removeProduct = async (productId) => {

        try {

            const data =
                await deleteProduct(productId);

            if (!data.success) {

                return {
                    success: false,
                    message:
                        data.message ||
                        "Unable to delete product.",
                };

            }

            await loadProducts();

            return {
                success: true,
                message:
                    data.message ||
                    "Product deleted successfully.",
            };

        } catch (error) {

            console.error(
                "Delete product error:",
                error
            );

            const message =
                error.response?.data?.message ||
                error.message ||
                "Unable to delete product.";

            // IMPORTANT:
            // Do NOT set global error here.
            // The Products page will show this
            // error inside the confirmation dialog.

            return {
                success: false,
                message,
            };

        }
    };


    // =========================
    // INITIAL LOAD
    // =========================

    useEffect(() => {

        loadProducts();

    }, []);


    return (

        <ProductContext.Provider
            value={{
                products,
                loading,
                error,
                loadProducts,
                addProduct,
                editProduct,
                removeProduct,
            }}
        >

            {children}

        </ProductContext.Provider>

    );

}


export default ProductContext;