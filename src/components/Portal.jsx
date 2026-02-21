// components/Portal.jsx
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

export default function Portal({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted ? ReactDOM.createPortal(
    children,
    document.body
  ) : null;
}