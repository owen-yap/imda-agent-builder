interface StepIndicatorProps {
	currentStep: number;
	totalSteps: number;
}

export const StepIndicator = ({
	currentStep,
	totalSteps,
}: StepIndicatorProps) => {
	const itemsWithIds = Array.from({ length: totalSteps }, (_, i) => ({
		id: `step-indicator-${i}`,
		index: i,
	}));

	return (
		<div className="flex justify-center space-x-2 py-8">
			{itemsWithIds.map((item) => (
				<div
					key={item.id}
					className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
						item.index === currentStep
							? "bg-primary"
							: "bg-gray-300 dark:bg-gray-600"
					}`}
				/>
			))}
		</div>
	);
};
