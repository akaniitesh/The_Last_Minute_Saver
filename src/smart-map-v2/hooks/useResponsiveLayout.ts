import { useState, useEffect } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";

export function useResponsiveLayout() {
  const [width, setWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getDeviceType = (): DeviceType => {
    if (width < 640) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  };

  const device = getDeviceType();

  return {
    width,
    device,
    isMobile: device === "mobile",
    isTablet: device === "tablet",
    isDesktop: device === "desktop",
  };
}
export default useResponsiveLayout;
