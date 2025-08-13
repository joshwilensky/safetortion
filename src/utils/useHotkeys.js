import { useEffect } from "react";

export default function useHotkeys(map = {}) {
  useEffect(() => {
    const onKey = (e) => {
      const key = (e.key || "").toLowerCase();
      const withCmd = e.metaKey || e.ctrlKey;
      if (key === "k" && withCmd && map["mod+k"]) {
        e.preventDefault();
        map["mod+k"]();
      }
      if (key === "s" && withCmd && map["mod+s"]) {
        e.preventDefault();
        map["mod+s"]();
      }
      if (key === "?" && map["?"]) {
        e.preventDefault();
        map["?"]();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [map]);
}
