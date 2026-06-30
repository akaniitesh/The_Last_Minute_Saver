import { useContext } from "react";
import { MiloContext, MiloContextValue } from "./MiloContext";

export function useMilo(): MiloContextValue {
  const context = useContext(MiloContext);
  if (!context) {
    throw new Error("useMilo must be used within a MiloProvider");
  }
  return context;
}

export default useMilo;
