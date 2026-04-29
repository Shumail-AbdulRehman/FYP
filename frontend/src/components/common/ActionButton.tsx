/**
 * @component ActionButton
 * @author Lira Zakhn (Frontend)
 * @description Reusable primary action button with optional leading icon.
 *              Used across the app for "Add New" style trigger actions.
 */
import { Plus } from "lucide-react";

export function ActionButton({
  label = "Add New",
  onClick,
  className = "",
  icon = true,
}:any) {
  return (
    // Renders a styled blue button; icon is shown by default unless disabled via prop
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 ${className}`}
    >
      {/* Conditionally render Plus icon based on the icon prop */}
      {icon && <Plus className="h-4 w-4" />}
      {label}
    </button>
  );
}
