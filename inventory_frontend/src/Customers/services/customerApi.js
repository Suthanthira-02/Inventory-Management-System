import api from "../../common/services/api";

export const getCustomers = async () => (await api.get("/api/customers/")).data;
export const getCustomer = async (customerId) => (await api.get(`/api/customers/${customerId}`)).data;
export const createCustomer = async (customerData) => (await api.post("/api/customers/", customerData)).data;
export const updateCustomer = async (customerId, customerData) => (await api.put(`/api/customers/${customerId}`, customerData)).data;
export const deleteCustomer = async (customerId) => (await api.delete(`/api/customers/${customerId}`)).data;
export const getCustomerLedger = async (customerId) => (await api.get(`/api/customers/${customerId}/ledger`)).data;
export const addCustomerPayment = async (customerId, paymentData) => (await api.post(`/api/customers/${customerId}/payments`, paymentData)).data;
