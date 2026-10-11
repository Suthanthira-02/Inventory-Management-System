import { useContext } from "react";

import SaleContext from "../contexts/SaleContext";


const useSales = () => {

    return useContext(SaleContext);

};


export default useSales;