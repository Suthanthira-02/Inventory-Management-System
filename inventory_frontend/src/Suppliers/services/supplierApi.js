import api from "../../common/services/api";

// GET ALL SUPPLIERS
export const getSuppliers = async () => {
    const response = await api.get("/api/suppliers/");
    return response.data;
};

// CREATE SUPPLIER
export const createSupplier = async (supplierData) => {
    const response = await api.post(
        "/api/suppliers/",
        supplierData
    );

    return response.data;
};

// UPDATE SUPPLIER
export const updateSupplier = async (
    supplierId,
    supplierData
) => {
    const response = await api.put(
        `/api/suppliers/${supplierId}`,
        supplierData
    );

    return response.data;
};

// DELETE SUPPLIER
export const deleteSupplier = async (supplierId) => {
    const response = await api.delete(
        `/api/suppliers/${supplierId}`
    );

    return response.data;
};