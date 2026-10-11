import api from "../../common/services/api";

// ============================================
// GET ALL PURCHASES
// ============================================

export const getPurchases = async () => {
    const response = await api.get("/api/purchases/");
    return response.data;
};


// ============================================
// GET PURCHASE BY ID
// ============================================

export const getPurchase = async (purchaseId) => {
    const response = await api.get(
        `/api/purchases/${purchaseId}`
    );

    return response.data;
};


// ============================================
// CREATE PURCHASE
// ============================================

export const createPurchase = async (purchaseData) => {
    const response = await api.post(
        "/api/purchases/",
        purchaseData
    );

    return response.data;
};


// ============================================
// UPDATE PURCHASE
// ============================================

export const updatePurchase = async (
    purchaseId,
    purchaseData
) => {
    const response = await api.put(
        `/api/purchases/${purchaseId}`,
        purchaseData
    );

    return response.data;
};


// ============================================
// RETURN PURCHASE
// ============================================

export const returnPurchase = async (purchaseId) => {
    const response = await api.put(
        `/api/purchases/return/${purchaseId}`
    );

    return response.data;
};


// ============================================
// DELETE PURCHASE
// ============================================

export const deletePurchase = async (purchaseId) => {
    const response = await api.delete(
        `/api/purchases/${purchaseId}`
    );

    return response.data;
};