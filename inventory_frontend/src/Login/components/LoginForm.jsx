import { useState } from "react";
import useLogin from "../hooks/useLogin";

function LoginForm() {

    const {
        username,
        setUsername,
        password,
        setPassword,
        loading,
        error,
        handleLogin,
    } = useLogin();

    const [showPassword, setShowPassword] = useState(false);


    const handleSubmit = (e) => {
        e.preventDefault();
        handleLogin();
    };


    return (
        <form
            onSubmit={handleSubmit}
            className="
                flex
                aspect-square
                w-full
                max-w-[460px]
                flex-col
                justify-center
                rounded-3xl
                border
                border-white/50
                bg-white/90
                p-10
                shadow-2xl
                backdrop-blur-md
            "
        >

            {/* Logo */}

            <div className="mb-3 flex justify-center">

                <div
                    className="
                        flex
                        h-16
                        w-16
                        items-center
                        justify-center
                        rounded-2xl
                        bg-blue-700
                        text-3xl
                        shadow-lg
                    "
                >
                    📦
                </div>

            </div>


            {/* Application name */}

            <div className="mb-5 text-center">

                <h1
                    className="
                        text-2xl
                        font-extrabold
                        tracking-wide
                        text-slate-900
                    "
                >
                    INVENTORY
                </h1>

                <p
                    className="
                        mt-1
                        text-sm
                        font-bold
                        tracking-[0.35em]
                        text-blue-700
                    "
                >
                    MANAGEMENT
                </p>

                <div
                    className="
                        mx-auto
                        mt-3
                        h-1
                        w-12
                        rounded-full
                        bg-blue-700
                    "
                />

            </div>


            {/* Welcome */}

            <div className="mb-5 text-center">

                <h2 className="text-xl font-bold text-slate-800">
                    Welcome Back!
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Please sign in to your account
                </p>

            </div>


            {/* Error */}

            {error && (
                <div
                    className="
                        mb-4
                        rounded-lg
                        border
                        border-red-200
                        bg-red-50
                        px-3
                        py-2
                        text-center
                        text-sm
                        text-red-600
                    "
                >
                    {error}
                </div>
            )}


            {/* Username */}

            <div className="mb-4">

                <label
                    htmlFor="username"
                    className="
                        mb-1.5
                        block
                        text-sm
                        font-semibold
                        text-slate-700
                    "
                >
                    Username
                </label>

                <div
                    className="
                        flex
                        h-12
                        overflow-hidden
                        rounded-xl
                        border
                        border-slate-300
                        bg-white
                        transition
                        focus-within:border-blue-600
                        focus-within:ring-2
                        focus-within:ring-blue-100
                    "
                >

                    <div
                        className="
                            flex
                            w-12
                            items-center
                            justify-center
                            bg-slate-50
                            text-lg
                        "
                    >
                        👤
                    </div>

                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        disabled={loading}
                        autoComplete="username"
                        className="
                            w-full
                            bg-transparent
                            px-4
                            text-sm
                            text-slate-800
                            outline-none
                            placeholder:text-slate-400
                        "
                    />

                </div>

            </div>


            {/* Password */}

            <div className="mb-5">

                <label
                    htmlFor="password"
                    className="
                        mb-1.5
                        block
                        text-sm
                        font-semibold
                        text-slate-700
                    "
                >
                    Password
                </label>

                <div
                    className="
                        flex
                        h-12
                        overflow-hidden
                        rounded-xl
                        border
                        border-slate-300
                        bg-white
                        transition
                        focus-within:border-blue-600
                        focus-within:ring-2
                        focus-within:ring-blue-100
                    "
                >

                    <div
                        className="
                            flex
                            w-12
                            items-center
                            justify-center
                            bg-slate-50
                            text-lg
                        "
                    >
                        🔒
                    </div>

                    <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        disabled={loading}
                        autoComplete="current-password"
                        className="
                            flex-1
                            bg-transparent
                            px-4
                            text-sm
                            text-slate-800
                            outline-none
                            placeholder:text-slate-400
                        "
                    />

                    <button
                        type="button"
                        onClick={() =>
                            setShowPassword(!showPassword)
                        }
                        className="
                            flex
                            w-12
                            items-center
                            justify-center
                            text-lg
                            text-slate-500
                            hover:text-blue-700
                        "
                    >
                        {showPassword ? "🙈" : "👁️"}
                    </button>

                </div>

            </div>


            {/* Login button */}

            <button
                type="submit"
                disabled={loading}
                className="
                    h-12
                    w-full
                    rounded-xl
                    bg-blue-700
                    text-sm
                    font-bold
                    tracking-wider
                    text-white
                    shadow-md
                    transition
                    duration-200
                    hover:bg-blue-800
                    hover:shadow-lg
                    disabled:cursor-not-allowed
                    disabled:bg-blue-400
                "
            >
                {loading ? "LOGGING IN..." : "LOGIN"}
            </button>


            {/* Secure login */}

            <div
                className="
                    mt-5
                    flex
                    items-center
                    justify-center
                    gap-2
                    text-xs
                    text-slate-400
                "
            >
                <span>🔐</span>
                <span>Secure Login</span>
            </div>

        </form>
    );
}

export default LoginForm;