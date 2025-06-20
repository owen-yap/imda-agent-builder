import { useEffect, useRef } from "react";
import { useTheme } from "../theme-provider";
import type { OnResizeCallback } from "react-resize-detector";
import { useResizeDetector } from "react-resize-detector";

export function DottedBackground() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const { theme } = useTheme();

	const handleResize: OnResizeCallback = (payload) => {
		const canvas = canvasRef.current;
		if (!canvas || !payload.width || !payload.height) return;

		canvas.width = payload.width;
		canvas.height = payload.height;
		drawDots();
	};

	const { ref: resizeRef } = useResizeDetector<HTMLDivElement>({
		onResize: handleResize,
		refreshMode: "debounce",
		refreshRate: 100,
	});

	const drawDots = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!ctx || !canvas) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const spacing = 30;
		const dotSize = 1;

		// Set dot color based on theme
		ctx.fillStyle =
			theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.15)";

		for (let x = 0; x < canvas.width; x += spacing) {
			for (let y = 0; y < canvas.height; y += spacing) {
				ctx.beginPath();
				ctx.arc(x, y, dotSize, 0, Math.PI * 2);
				ctx.fill();
			}
		}
	};

	// Redraw dots when theme changes
	useEffect(() => {
		drawDots();
	}, [theme]);

	return (
		<div
			ref={resizeRef}
			className="pointer-events-none absolute left-0 top-0 h-full w-full"
		>
			<canvas ref={canvasRef} className="h-full w-full" style={{ zIndex: 1 }} />
		</div>
	);
}
