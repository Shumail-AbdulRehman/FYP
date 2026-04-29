/**
 * @component FormButton
 * @author Lira Zakhn (Frontend)
 * @description Submit/action button for forms with built-in loading state.
 *              Automatically disables and shows a spinner while async operations run.
 */
import LoadingSpinner from './LoadingSpinner';

interface FormButtonProps {
  text: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  loading?: boolean;
  onClick?: () => void;
}

const FormButton = ({
  text,
  type = 'button',
  className = '',
  loading = false,
  onClick,
}: FormButtonProps) => {
  return (
    <button
      type={type}
      disabled={loading}
      onClick={onClick}
      className={`
        relative w-full flex items-center justify-center gap-2
        bg-blue-500 text-white py-2 px-4 rounded
        hover:bg-blue-600 transition-colors
        disabled:opacity-70 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {/* Show spinner alongside text when loading, plain text otherwise */}
      {loading ? (
        <>
          
          <LoadingSpinner size="small" color="#ffffff" thickness={3} />
          <span className="opacity-80">{text}</span>
        </>
      ) : (
        text
      )}
    </button>
  );
};

export default FormButton;