import { Toaster as Sonner } from 'sonner';
import type { ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          error: 'bg-red-50 border-red-200 text-red-900',
          success: 'bg-green-50 border-green-200 text-green-900',
          warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
          info: 'bg-blue-50 border-blue-200 text-blue-900'
        }
      }}
      {...props}
    />
  );
};

export { Toaster };
