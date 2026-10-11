import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./Login/pages/Login";
import Dashboard from "./Dashboard/pages/Dashboard";
import Products from "./Products/pages/Products";
import Suppliers from "./Suppliers/pages/Suppliers";
import Customers from "./Customers/pages/Customers";
import Purchases from "./Purchases/pages/Purchases";
import Sales from "./Sales/pages/Sales";
import Reports from "./Reports/pages/Reports";
import ProtectedRoute from "./common/components/ProtectedRoute";

import { DashboardProvider } from "./Dashboard/contexts/DashboardContext";
import { ProductProvider } from "./Products/contexts/ProductContext";
import { SupplierProvider } from "./Suppliers/contexts/SupplierContext";
import { CustomerProvider } from "./Customers/contexts/CustomerContext";
import { PurchaseProvider } from "./Purchases/contexts/PurchaseContext";
import { SaleProvider } from "./Sales/contexts/SaleContext";
import { ReportProvider } from "./Reports/contexts/ReportContext";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardProvider><Dashboard /></DashboardProvider>} />
                    <Route path="/products" element={<ProductProvider><Products /></ProductProvider>} />
                    <Route path="/suppliers" element={<SupplierProvider><Suppliers /></SupplierProvider>} />
                    <Route path="/customers" element={<CustomerProvider><Customers /></CustomerProvider>} />
                    <Route path="/purchases" element={<PurchaseProvider><Purchases /></PurchaseProvider>} />
                    <Route path="/sales" element={<SaleProvider><Sales /></SaleProvider>} />
                    <Route path="/reports" element={<ReportProvider><Reports /></ReportProvider>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
