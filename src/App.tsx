import { useEffect } from "react";

export function App() {
  useEffect(() => {
    window.addEventListener("message", (event) => {
      const message = event.data;
      console.log("message", message);
    });

    return () => {
      window.removeEventListener("message", () => {});
    };
  }, []);

  return (
    <div>
      <h1>React+Tailwind CSSで動いています。</h1>
    </div>
  );
}
