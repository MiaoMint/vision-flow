import { useCallback, useRef } from "react";
import { useReactFlow } from "@xyflow/react";

export function useCanvasMouse() {
  const { screenToFlowPosition } = useReactFlow();
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Track mouse position in flow coordinates
  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      mousePositionRef.current = position;
    },
    [screenToFlowPosition]
  );

  return { mousePositionRef, onMouseMove };
}
