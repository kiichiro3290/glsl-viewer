import { useEffect } from 'react';

export function App() {
  useEffect(() => {
    window.addEventListener('message', (event) => {
      const _message = event.data;
    });

    return () => {
      window.removeEventListener('message', () => {});
    };
  }, []);

  return (
    <div>
      <h1>React+Tailwind CSSで動いています。</h1>
    </div>
  );
}
