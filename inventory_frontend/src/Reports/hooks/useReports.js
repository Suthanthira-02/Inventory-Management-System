import { useContext } from "react";

import ReportContext from "../contexts/ReportContext";

const useReports = () => {
    return useContext(ReportContext);
};

export default useReports;
