import { useApp } from "../context/AppContext.jsx";

export default function ModeToggle() {
  const { mode, setMode } = useApp();
  return (
    <button
      className='btn'
      onClick={() => setMode(mode === "teen" ? "parent" : "teen")}>
      Mode: {mode === "teen" ? "Teen" : "Parent"}
    </button>
  );
}
