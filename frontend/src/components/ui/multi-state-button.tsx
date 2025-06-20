import {
	motion,
	AnimatePresence,
	useTime,
	useTransform,
	animate,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./button";

export type ButtonState = "idle" | "processing" | "success" | "error";

const STATES = {
	idle: "Continue",
	processing: "Processing",
	success: "Done",
	error: "Something went wrong",
} as const;

interface MultiStateButtonProps {
	state: ButtonState;
	onClick?: () => void;
	disabled?: boolean;
	className?: string;
}

const ICON_SIZE = 20;
const STROKE_WIDTH = 1.5;
const VIEW_BOX_SIZE = 24;

const svgProps = {
	width: ICON_SIZE,
	height: ICON_SIZE,
	viewBox: `0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`,
	fill: "none",
	stroke: "currentColor",
	strokeWidth: STROKE_WIDTH,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
};

const springConfig = {
	type: "spring",
	stiffness: 150,
	damping: 20,
};

const animations = {
	initial: { pathLength: 0 },
	animate: { pathLength: 1 },
	transition: springConfig,
};

const secondLineAnimation = {
	...animations,
	transition: { ...springConfig, delay: 0.1 },
};

function Check() {
	return (
		<motion.svg {...svgProps} aria-label="Success">
			<title>Success</title>
			<motion.polyline points="4 12 9 17 20 6" {...animations} />
		</motion.svg>
	);
}

function X() {
	return (
		<motion.svg {...svgProps} aria-label="Error">
			<title>Error</title>
			<motion.line x1="6" y1="6" x2="18" y2="18" {...animations} />
			<motion.line x1="18" y1="6" x2="6" y2="18" {...secondLineAnimation} />
		</motion.svg>
	);
}

function Loader() {
	const time = useTime();
	const rotate = useTransform(time, [0, 1000], [0, 360], { clamp: false });

	return (
		<motion.div
			style={{
				rotate,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				width: ICON_SIZE,
				height: ICON_SIZE,
			}}
		>
			<motion.svg {...svgProps} aria-label="Loading">
				<title>Loading</title>
				<motion.path d="M21 12a9 9 0 1 1-6.219-8.56" {...animations} />
			</motion.svg>
		</motion.div>
	);
}

const Icon = ({ state }: { state: ButtonState }) => {
	let IconComponent = null;

	switch (state) {
		case "idle":
			IconComponent = null;
			break;
		case "processing":
			IconComponent = <Loader />;
			break;
		case "success":
			IconComponent = <Check />;
			break;
		case "error":
			IconComponent = <X />;
			break;
	}

	return (
		<>
			<motion.span
				style={{
					display: "inline-flex",
					overflow: "hidden",
				}}
				animate={{
					width: state === "idle" ? 0 : 20,
					marginRight: state === "idle" ? 0 : 8,
				}}
				transition={springConfig}
			>
				<AnimatePresence>
					<motion.span
						key={state}
						style={{
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
						}}
						initial={{
							y: -40,
							scale: 0.5,
							filter: "blur(6px)",
							WebkitFilter: "blur(6px)",
						}}
						animate={{
							y: 0,
							scale: 1,
							filter: "blur(0px)",
							WebkitFilter: "blur(0px)",
						}}
						exit={{
							y: 40,
							scale: 0.5,
							filter: "blur(6px)",
							WebkitFilter: "blur(6px)",
						}}
						transition={{
							duration: 0.15,
							ease: "easeInOut",
						}}
					>
						{IconComponent}
					</motion.span>
				</AnimatePresence>
			</motion.span>
		</>
	);
};

const Label = ({ state }: { state: ButtonState }) => {
	const [labelWidth, setLabelWidth] = useState(0);
	const measureRef = useRef<HTMLDivElement>(null);

	// Measure the width of the current text
	useEffect(() => {
		if (measureRef.current) {
			const { width } = measureRef.current.getBoundingClientRect();
			setLabelWidth(width);
		}
	}, [state]);

	return (
		<>
			{/* Hidden copy of label to measure width */}
			<div
				ref={measureRef}
				style={{
					position: "absolute",
					visibility: "hidden",
					whiteSpace: "nowrap",
				}}
			>
				{STATES[state]}
			</div>

			<motion.span
				style={{
					position: "relative",
					display: "inline-block",
					overflow: "hidden",
					height: "1.5rem",
				}}
				animate={{
					width: labelWidth,
				}}
				transition={springConfig}
			>
				<AnimatePresence initial={false}>
					<motion.div
						key={state}
						style={{
							whiteSpace: "nowrap",
						}}
						initial={{
							y: -20,
							opacity: 0,
							filter: "blur(10px)",
							WebkitFilter: "blur(10px)",
							position: "absolute",
						}}
						animate={{
							y: 0,
							opacity: 1,
							filter: "blur(0px)",
							WebkitFilter: "blur(0px)",
							position: "relative",
						}}
						exit={{
							y: 20,
							opacity: 0,
							filter: "blur(10px)",
							WebkitFilter: "blur(10px)",
							position: "absolute",
						}}
						transition={{
							duration: 0.2,
							ease: "easeInOut",
						}}
					>
						{STATES[state]}
					</motion.div>
				</AnimatePresence>
			</motion.span>
		</>
	);
};

export function MultiStateButton({
	state,
	onClick,
	disabled,
	className,
}: MultiStateButtonProps) {
	const badgeRef = useRef(null);

	useEffect(() => {
		if (!badgeRef.current) return;

		if (state === "error") {
			// Shake the badge side-to-side
			const controls = animate(
				badgeRef.current,
				{ x: [0, -6, 6, -6, 0] },
				{
					duration: 0.3,
					ease: "easeInOut",
					times: [0, 0.25, 0.5, 0.75, 1],
					repeat: 0,
					delay: 0.1,
				},
			);
			return () => controls.stop();
		}

		if (state === "success") {
			// Scale the badge up and down
			const controls = animate(
				badgeRef.current,
				{
					scale: [1, 1.2, 1],
				},
				{
					duration: 0.3,
					ease: "easeInOut",
					times: [0, 0.5, 1],
					repeat: 0,
				},
			);
			return () => controls.stop();
		}
	}, [state]);

	return (
		<Button
			ref={badgeRef}
			onClick={onClick}
			disabled={disabled || state === "processing"}
			className={className}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Icon state={state} />
				<Label state={state} />
			</div>
		</Button>
	);
}
