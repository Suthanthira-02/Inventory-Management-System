import api from "../../common/services/api";

// ============================================
// GET ALL SALES
// ============================================

export const getSales = async () => {
    const response = await api.get("/api/sales/");
    return response.data;
};


// ============================================
// GET ONE SALE
// ============================================

export const getSale = async (saleId) => {
    const response = await api.get(`/api/sales/${saleId}`);
    return response.data;
};


// ============================================
// CREATE SALE
// ============================================

export const createSale = async (saleData) => {
    const response = await api.post("/api/sales/", saleData);
    return response.data;
};


// ============================================
// UPDATE SALE
// ============================================

export const updateSale = async (saleId, saleData) => {
    const response = await api.put(
        `/api/sales/${saleId}`,
        saleData
    );

    return response.data;
};


// ============================================
// RETURN SALE
// ============================================

export const returnSale = async (saleId) => {
    const response = await api.put(
        `/api/sales/return/${saleId}`
    );

    return response.data;
};


// ============================================
// REFUND SALE
// ============================================

export const refundSale = async (saleId) => {
    const response = await api.put(
        `/api/sales/refund/${saleId}`
    );

    return response.data;
};


// ============================================
// DELETE SALE
// ============================================

export const deleteSale = async (saleId) => {
    const response = await api.delete(
        `/api/sales/${saleId}`
    );

    return response.data;
};