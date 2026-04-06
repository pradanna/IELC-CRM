import React, { useState, useEffect } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

// Images are now referenced from the public directory
const logoUrl = "/assets/images/local/logo-full.png";
const bgUrl = "/assets/images/local/login-pic.webp";

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    useEffect(() => {
        // Reset password field on component unmount
        return () => {
            reset("password");
        };
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        post(route("login"));
    };

    return (
        <>
            <Head title="Log in" />
            <div className="relative min-h-screen w-full flex items-center justify-end overflow-hidden bg-gray-900 font-sans">
                {/* Background Image with Overlay */}
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: `url(${bgUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-[2px]"></div>
                </div>

                {/* Floating Card */}
                <div className="relative z-10 w-full max-w-md p-4 md:mr-20">
                    <div className="bg-white backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-10 animate-float">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <img
                                src={logoUrl}
                                className="w-40 mx-auto mb-4"
                                alt="IELC LOGO"
                            />
                            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                                IELC Management
                            </h1>
                            <p className="text-gray-500 text-sm mt-2 font-medium">
                                Welcome back, please login to continue.
                            </p>
                        </div>
                        {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Email Field */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="email"
                                    className="text-xs font-semibold text-gray-600 ml-1 uppercase tracking-wider"
                                >
                                    Email / Username
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors duration-300" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        autoComplete="username"
                                        autoFocus
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                        className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                                        placeholder="admin@gmail.com"
                                    />
                                    
                                </div>
                                {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email}</p>}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="password"
                                    className="text-xs font-semibold text-gray-600 ml-1 uppercase tracking-wider"
                                >
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors duration-300" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={data.password}
                                        autoComplete="current-password"
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        className="block w-full pl-11 pr-12 py-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password}</p>}
                            </div>

                            {/* Extras */}
                            <div className="flex items-center justify-between text-sm pt-1">
                                <label className="flex items-center cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) =>
                                            setData("remember", e.target.checked)
                                        }
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    />
                                    <span className="ml-2 text-gray-600 group-hover:text-gray-800 transition-colors">
                                        Remember me
                                    </span>
                                </label>
                                {canResetPassword && (
                                    <Link
                                        href={route("password.request")}
                                        className="text-primary hover:text-primary-dark font-semibold hover:underline transition-colors"
                                    >
                                        Lupa Password?
                                    </Link>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-primary/20 text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-4 disabled:opacity-75 disabled:scale-100"
                            >
                                {processing ? (
                                    <div className="flex items-center">
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Processing...
                                    </div>
                                ) : (
                                    <>
                                        Masuk ke Dashboard
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="mt-8 text-center border-t border-gray-100 pt-6">
                            <p className="text-xs text-gray-400 font-medium">
                                &copy; {new Date().getFullYear()} IELC Management
                                System.
                                <br />
                                All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
