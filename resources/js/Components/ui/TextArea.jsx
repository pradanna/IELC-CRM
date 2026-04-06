import React, { forwardRef, useEffect, useRef } from "react";

export default forwardRef(function TextArea(
    { className = "", isFocused = false, ...props },
    ref,
) {
    const input = ref ? ref : useRef();

    useEffect(() => {
        if (isFocused) {
            input.current.focus();
        }
    }, []);

    return (
        <textarea
            {...props}
            className={
                "block w-full rounded-lg border-0 py-2 px-3 focus:outline-none text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 " +
                className
            }
            ref={input}
        />
    );
});
