import { useEffect, useState } from "react";

function getWidth(): number {
  if (typeof window !== "undefined" && navigator.userAgent.includes("iPhone")) {
    return screen.width;
  } else {
    return window.innerWidth;
  }
}

function getHeight(): number {
  if (typeof window !== "undefined" && navigator.userAgent.includes("iPhone")) {
    return screen.height;
  } else {
    return window.innerHeight;
  }
}

const useResize = () => {
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== "undefined" ? getWidth() : 0,
    height: typeof window !== "undefined" ? getHeight() : 0,
  }));

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: getWidth(),
        height: getHeight(),
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return dimensions;
};

export default useResize;
