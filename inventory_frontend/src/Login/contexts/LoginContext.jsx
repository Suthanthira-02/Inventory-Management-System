import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../services/loginApi";

const LoginContext = createContext();

export function LoginProvider({ children }) {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    const handleLogin = async () => {

        setError("");

        if (!username.trim() || !password.trim()) {
            setError("Please enter username and password.");
            return;
        }

        try {

            setLoading(true);

            const data = await loginUser(
                username.trim(),
                password
            );

            if (data.success) {

                localStorage.setItem(
                    "user",
                    username.trim()
                );

                localStorage.setItem(
                    "access_token",
                    data.access_token
                );

                localStorage.setItem(
                    "refresh_token",
                    data.refresh_token
                );

                navigate("/dashboard");

            } else {

                setError(
                    data.message ||
                    "Invalid username or password."
                );
            }

        } catch (error) {

            console.error("Login error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to connect to the backend."
            );

        } finally {

            setLoading(false);
        }
    };


    return (
        <LoginContext.Provider
            value={{
                username,
                setUsername,
                password,
                setPassword,
                loading,
                error,
                handleLogin,
            }}
        >
            {children}
        </LoginContext.Provider>
    );
}

export default LoginContext;