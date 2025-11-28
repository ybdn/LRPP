import { InputHTMLAttributes, forwardRef } from 'react';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-lg
            bg-gray-800 border border-gray-700
            text-white placeholder-gray-500
            focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none
            transition-colors duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
