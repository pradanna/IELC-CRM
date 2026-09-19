import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';

/**
 * Format string or number into Indonesian thousand-separated string (using '.')
 * e.g. 90000000 -> "90.000.000"
 */
export const formatNumberWithSeparator = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const digits = String(val).replace(/\D/g, '');
    if (!digits) return '';
    const clean = digits.length > 1 ? digits.replace(/^0+/, '') || '0' : digits;
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Extract clean digit string from input
 * e.g. "90.000.000" -> "90000000"
 */
export const parseRawNumber = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const digits = String(val).replace(/\D/g, '');
    if (!digits) return '';
    return digits.length > 1 ? digits.replace(/^0+/, '') || '0' : digits;
};

/**
 * Calculate cursor position in formatted text after a certain number of digits
 */
const getCursorPosition = (formattedValue, digitCount) => {
    if (digitCount <= 0) return 0;
    let countedDigits = 0;
    for (let i = 0; i < formattedValue.length; i++) {
        if (/\d/.test(formattedValue[i])) {
            countedDigits++;
            if (countedDigits === digitCount) {
                return i + 1;
            }
        }
    }
    return formattedValue.length;
};

const CurrencyInput = forwardRef(function CurrencyInput(
    {
        value = '',
        onChange,
        prefix,
        suffix,
        className = '',
        placeholder = '0',
        isFocused = false,
        disabled = false,
        ...props
    },
    ref
) {
    const localRef = useRef(null);
    const pendingCursorPosRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
        input: localRef.current,
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    useLayoutEffect(() => {
        if (pendingCursorPosRef.current !== null && localRef.current) {
            const pos = pendingCursorPosRef.current;
            localRef.current.setSelectionRange(pos, pos);
            pendingCursorPosRef.current = null;
        }
    });

    const displayValue = formatNumberWithSeparator(value);

    const triggerChange = (rawVal, originalEvent) => {
        if (!onChange) return;
        const syntheticEvent = {
            target: {
                name: props.name || props.id || '',
                id: props.id || '',
                value: rawVal,
                rawValue: rawVal === '' ? 0 : Number(rawVal),
            },
            currentTarget: {
                name: props.name || props.id || '',
                id: props.id || '',
                value: rawVal,
                rawValue: rawVal === '' ? 0 : Number(rawVal),
            },
            value: rawVal,
            rawValue: rawVal === '' ? 0 : Number(rawVal),
            preventDefault: () => originalEvent?.preventDefault?.(),
            stopPropagation: () => originalEvent?.stopPropagation?.(),
        };
        onChange(syntheticEvent);
    };

    const handleChange = (e) => {
        const input = e.target;
        const currentVal = input.value;
        const cursorPos = input.selectionStart;

        const textBeforeCursor = currentVal.slice(0, cursorPos);
        const digitsBeforeCursor = textBeforeCursor.replace(/\D/g, '').length;

        const raw = parseRawNumber(currentVal);
        const formatted = formatNumberWithSeparator(raw);

        const newPos = getCursorPosition(formatted, digitsBeforeCursor);

        // Immediate DOM update to prevent invalid characters from flickering
        input.value = formatted;
        input.setSelectionRange(newPos, newPos);
        pendingCursorPosRef.current = newPos;

        triggerChange(raw, e);
    };

    const handleKeyDown = (e) => {
        const input = localRef.current;
        if (!input) {
            props.onKeyDown?.(e);
            return;
        }

        if (e.key === 'Backspace') {
            const { selectionStart, selectionEnd, value: currentVal } = input;
            if (selectionStart === selectionEnd && selectionStart > 0) {
                // If cursor is directly to the right of a separator dot (e.g. "90.|000")
                if (currentVal[selectionStart - 1] === '.') {
                    e.preventDefault();
                    // Delete the digit before the dot (selectionStart - 2)
                    const before = currentVal.slice(0, selectionStart - 2);
                    const after = currentVal.slice(selectionStart - 1);
                    const combined = before + after;
                    const raw = parseRawNumber(combined);
                    const formatted = formatNumberWithSeparator(raw);

                    const digitsBefore = before.replace(/\D/g, '').length;
                    const newPos = getCursorPosition(formatted, digitsBefore);

                    input.value = formatted;
                    input.setSelectionRange(newPos, newPos);
                    pendingCursorPosRef.current = newPos;

                    triggerChange(raw, e);
                    return;
                }
            }
        } else if (e.key === 'Delete') {
            const { selectionStart, selectionEnd, value: currentVal } = input;
            if (selectionStart === selectionEnd && selectionStart < currentVal.length) {
                // If cursor is directly to the left of a separator dot (e.g. "90|.000")
                if (currentVal[selectionStart] === '.') {
                    e.preventDefault();
                    // Delete the digit after the dot (selectionStart + 1)
                    const before = currentVal.slice(0, selectionStart);
                    const after = currentVal.slice(selectionStart + 2);
                    const combined = before + after;
                    const raw = parseRawNumber(combined);
                    const formatted = formatNumberWithSeparator(raw);

                    const digitsBefore = before.replace(/\D/g, '').length;
                    const newPos = getCursorPosition(formatted, digitsBefore);

                    input.value = formatted;
                    input.setSelectionRange(newPos, newPos);
                    pendingCursorPosRef.current = newPos;

                    triggerChange(raw, e);
                    return;
                }
            }
        }

        props.onKeyDown?.(e);
    };

    const inputElement = (
        <input
            {...props}
            ref={localRef}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className={
                `block w-full rounded-lg border-0 py-2 px-3 focus:outline-none text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 ${
                    prefix ? '!pl-12 ' : ''
                }${className}`
            }
        />
    );

    if (prefix || suffix) {
        return (
            <div className="relative w-full">
                {prefix && (
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold select-none pointer-events-none">
                        {prefix}
                    </span>
                )}
                {inputElement}
                {suffix && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none">
                        {suffix}
                    </div>
                )}
            </div>
        );
    }

    return inputElement;
});

export default CurrencyInput;
