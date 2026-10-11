import { useContext } from "react";

import LoginContext from "../contexts/LoginContext";

const useLogin = () => {
    return useContext(LoginContext);
};

export default useLogin;