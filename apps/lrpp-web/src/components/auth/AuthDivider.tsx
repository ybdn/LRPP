interface AuthDividerProps {
  text?: string;
}

export function AuthDivider({ text = 'ou' }: AuthDividerProps) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-800" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 text-gray-500 bg-gray-900">{text}</span>
      </div>
    </div>
  );
}
