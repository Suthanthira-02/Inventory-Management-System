import { useContext } from "react";
import PurchaseContext from "../contexts/PurchaseContext";

const usePurchases = () => {
    return useContext(PurchaseContext);
};

export default usePurchases;