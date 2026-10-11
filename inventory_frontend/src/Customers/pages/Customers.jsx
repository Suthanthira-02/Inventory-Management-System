import { CustomerProvider } from "../contexts/CustomerContext";
import CustomersPageView from "../components/CustomersPageView";

export default function Customers() {
    return <CustomerProvider><CustomersPageView /></CustomerProvider>;
}
