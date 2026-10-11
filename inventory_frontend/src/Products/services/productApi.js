import api from "../../common/services/api";

// =========================
// GET ALL PRODUCTS
// =========================

export const getProducts = async () => {
    const response = await api.get("/api/products/");
    return response.data;
};


// =========================
// CREATE PRODUCT
// =========================

export const createProduct = async (productData) => {
    const response = await api.post(
        "/api/products/",
        productData
    );

    return response.data;
};


// =========================
// UPDATE PRODUCT
// =========================

export const updateProduct = async (
    productId,
    productData
) => {
    const response = await api.put(
        `/api/products/${productId}`,
        productData
    );

    return response.data;
};


// =========================
// DELETE PRODUCT
// =========================

export const deleteProduct = async (productId) => {
    const response = await api.delete(
        `/api/products/${productId}`
    );

    return response.data;
};