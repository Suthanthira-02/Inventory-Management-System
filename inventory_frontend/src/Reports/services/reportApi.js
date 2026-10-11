import api from "../../common/services/api";


// =========================
// SALES REPORT
// =========================

export const getSalesReport = async (filters = {}) => {
    const response = await api.get(
        "/api/reports/sales",
        { params: filters }
    );

    return response.data;
};


// =========================
// PURCHASES REPORT
// =========================

export const getPurchasesReport = async (filters = {}) => {
    const response = await api.get(
        "/api/reports/purchases",
        { params: filters }
    );

    return response.data;
};


// =========================
// COMBINED SUMMARY
// =========================

export const getReportsSummary = async (filters = {}) => {
    const response = await api.get(
        "/api/reports/summary",
        { params: filters }
    );

    return response.data;
};
