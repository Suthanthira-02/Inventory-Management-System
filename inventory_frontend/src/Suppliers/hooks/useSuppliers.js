import { useContext } from "react";

import SupplierContext from "../contexts/SupplierContext";

const useSuppliers = () => {
    return useContext(SupplierContext);
};

export default useSuppliers;