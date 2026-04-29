
/**
 * @component FormError
 * @author Lira Zakhn (Frontend)
 * @description Inline form error message display component.
 *              Returns null when no message is present to keep the DOM clean.
 */
interface FormErrorProps {
  message: string | null;
}

const FormError= ({ message }:FormErrorProps) => {
  // Suppress rendering entirely when there is no error message
  if (!message) return null;

  return <div className="text-red-600 w-full h-auto">{message}</div>;
};

export default FormError;