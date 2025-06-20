import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Check } from "lucide-react";
import { TextEffect } from "@/components/ui/text-effect";

interface ThemeSelectionScreenProps {
	onNext: () => void;
}

export const ThemeSelectionScreen = ({ onNext }: ThemeSelectionScreenProps) => {
	const { setTheme, theme } = useTheme();

	const handleThemeSelect = (selectedTheme: "light" | "dark") => {
		setTheme(selectedTheme);
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] w-full bg-background px-4 animate-fadeIn">
			<div className="text-center mb-12 space-y-3 w-full">
				<TextEffect className="text-4xl md:text-5xl font-bold">
					Choose Your Style
				</TextEffect>
				<p className="text-muted-foreground text-lg md:text-xl">
					Select your preferred theme. You can change it later in settings.
				</p>
			</div>
			<Card className="w-full max-w-xl">
				<CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
					{(["light", "dark"] as const).map((themeOption) => (
						<button
							key={themeOption}
							type="button"
							onClick={() => handleThemeSelect(themeOption)}
							className={`relative p-6 rounded-lg border-2 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                ${theme === themeOption ? "border-primary ring-2 ring-primary shadow-lg" : "border-border hover:border-primary/50"}
                ${themeOption === "light" ? "bg-gray-50" : "bg-gray-800"}`}
						>
							<div
								className={`aspect-video rounded-md mb-4 ${themeOption === "light" ? "bg-white border" : "bg-neutral-900 border border-neutral-700"}`}
							>
								<div className="p-2">
									<div
										className={`h-3 w-1/2 rounded ${themeOption === "light" ? "bg-gray-300" : "bg-gray-600"} mb-1`}
									/>
									<div
										className={`h-3 w-3/4 rounded ${themeOption === "light" ? "bg-gray-200" : "bg-gray-700"}`}
									/>
								</div>
							</div>
							<h3
								className={`text-lg font-semibold capitalize ${themeOption === "light" ? "text-gray-800" : "text-white"}`}
							>
								{themeOption}
							</h3>
							{theme === themeOption && (
								<div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
									<Check size={16} />
								</div>
							)}
						</button>
					))}
				</CardContent>
				<CardFooter className="justify-end pt-6">
					<Button onClick={onNext} size="lg">
						Continue
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};
