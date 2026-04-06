import React from "react";

const Button = ({
  children,
  variant = "primary",
  icon: Icon,
  className = "",
  ...props
}) => {
  const baseStyle =
    "flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-hover shadow-md shadow-red-900/20",
    secondary: "bg-secondary text-white hover:bg-secondary-light",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-500 hover:bg-gray-100 hover:text-primary",
    danger: "bg-red-100 text-red-600 hover:bg-red-200",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={18} className="mr-2" />}
      {children}
    </button>
  );
};

export default Button;
