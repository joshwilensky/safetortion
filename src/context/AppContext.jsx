import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import {
  metaLoadAll,
  metaSaveAll,
  migrateLocalStorageToIDB,
} from "../utils/idb.js";

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [mode, setMode] = useState("teen");
  const [encKey, setEncKey] = useState(null);
  const [saltB64, setSaltB64] = useState(() =>
    localStorage.getItem("enc_salt_b64")
  );

  const [evidence, setEvidence] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await migrateLocalStorageToIDB();
      const items = await metaLoadAll();
      setEvidence(items);
      setReady(true);
    })();
  }, []);

  const save = async (items) => {
    setEvidence(items);
    await metaSaveAll(items);
  };

  const addEvidence = (payload) => {
    const item = { id: nanoid(), createdAt: Date.now(), ...payload };
    const next = [item, ...evidence];
    save(next);
    return item.id;
  };
  const removeEvidence = (id) => save(evidence.filter((e) => e.id !== id));
  const clearEvidence = () => save([]);

  const value = useMemo(
    () => ({
      ready,
      mode,
      setMode,
      evidence,
      addEvidence,
      removeEvidence,
      clearEvidence,
      encKey,
      setEncKey,
      saltB64,
      setSaltB64,
    }),
    [ready, mode, evidence, encKey, saltB64]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
export const useApp = () => useContext(AppCtx);
