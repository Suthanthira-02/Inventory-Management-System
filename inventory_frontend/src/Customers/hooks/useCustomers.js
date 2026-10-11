import { useContext } from "react";
import CustomerContext from "../contexts/CustomerContext";
export default function useCustomers() { return useContext(CustomerContext); }
