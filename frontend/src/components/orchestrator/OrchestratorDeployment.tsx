import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Send, Palette, Bot, User } from "lucide-react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { getContrastColor } from "@/lib/colors";

export function OrchestratorDeployment() {
	const { orchestratorId } = useParams({
		from: "/_authenticated/orchestrator/$orchestratorId/deployment",
	});
	const [chatbotName, setChatbotName] = useState("AI Assistant");
	const [themeColor, setThemeColor] = useState("#A7C7E7"); // Default to a pastel color
	const [isHexColorValid, setIsHexColorValid] = useState(true);
	const [popoverOpen, setPopoverOpen] = useState(false);

	const validateHexColor = (hex: string): boolean => {
		const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
		return hexRegex.test(hex);
	};

	const handleThemeColorChange = (newColor: string) => {
		const isValid = validateHexColor(newColor);
		setIsHexColorValid(isValid);
		if (isValid) {
			setThemeColor(newColor);
		} else {
			// If user is typing and it's not valid yet, we still want to update the input
			// but not the actual theme color that drives the preview etc.
			// For now, react-colorful's HexColorInput handles this by itself.
			// We just set our internal state for the input value.
			setThemeColor(newColor); // Let input show what user types
		}
	};

	const handleQuickColorSelect = (quickColor: string) => {
		setThemeColor(quickColor);
		setIsHexColorValid(true);
		setPopoverOpen(false); // Close popover on quick select
	};

	const embedBaseUrl = window.location.origin;
	const embedUrl = `${embedBaseUrl}/chatbot/embed?id=${orchestratorId}`; // This seems to be for an iframe embed, not the direct chat link

	const embedCode = `<iframe
  src="${embedUrl}&name=${encodeURIComponent(chatbotName)}&color=${encodeURIComponent(isHexColorValid ? themeColor.replace("#", "") : "A7C7E7")}"
  width="100%"
  height="600px"
  frameborder="0"
  allow="microphone"
  style="border: 1px solid #eaeaea; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);"
></iframe>`;

	const handleCopyEmbedCode = () => {
		navigator.clipboard.writeText(embedCode);
		// TODO: Add a toast notification for success
		console.log("Embed code copied to clipboard.");
	};

	const pastelThemeColors = [
		{ name: "Pastel Blue", value: "#A7C7E7" },
		{ name: "Pastel Green", value: "#C1E1C1" },
		{ name: "Pastel Purple", value: "#D8BFD8" },
		{ name: "Pastel Orange", value: "#FFDAB9" },
		{ name: "Pastel Pink", value: "#FFB6C1" },
	];

	// Shareable link construction
	const shareableChatUrl = `${window.location.origin}/chat?orchestratorId=${orchestratorId}&botName=${encodeURIComponent(chatbotName)}&primaryColor=${encodeURIComponent(isHexColorValid ? themeColor : "#A7C7E7")}`;

	const handleCopyShareableLink = () => {
		navigator.clipboard.writeText(shareableChatUrl);
		// TODO: Add a toast notification for success
		console.log("Shareable link copied to clipboard.");
	};

	const effectiveThemeColor = isHexColorValid ? themeColor : "#A7C7E7";
	const contrastThemeColor = getContrastColor(effectiveThemeColor);

	const botIconBgColor = `${effectiveThemeColor}33`; // Primary color with low opacity for bot icon bg
	const botIconFgColor = effectiveThemeColor; // Bot icon color same as primary

	// Assistant messages in preview will have a light grey background
	const assistantPreviewMessageBg = "#F0F0F0";
	const assistantPreviewMessageFg = "#000000";

	return (
		<div className="container mx-auto px-4 md:px-6 lg:px-8 space-y-4">
			<div className="mb-4">
				<h1 className="text-2xl font-semibold">Deployment</h1>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<div className="lg:col-span-2 space-y-4">
					<Card className="shadow-lg">
						<CardHeader>
							<CardTitle>Your Embed Code</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground mb-4 text-sm">
								Copy this code and paste it into your website's HTML where you
								want the chatbot to appear. (Includes selected name and color)
							</p>
							<div className="bg-muted p-4 rounded-md relative group">
								<pre className="text-sm overflow-x-auto">
									<code>{embedCode}</code>
								</pre>
								<Button
									variant="ghost"
									size="icon"
									className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
									onClick={handleCopyEmbedCode}
								>
									<Copy className="h-4 w-4" />
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card className="shadow-lg">
						<CardHeader>
							<CardTitle>Customization Options</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground mb-6 text-sm">
								Adjust these settings to customize how your chatbot looks and
								behaves.
							</p>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label
										htmlFor="chatbotName"
										className="block text-sm font-medium text-foreground mb-1"
									>
										Chatbot Name
									</label>
									<Input
										id="chatbotName"
										value={chatbotName}
										onChange={(e) => setChatbotName(e.target.value)}
										className="max-w-sm"
									/>
								</div>
								<div className="space-y-2">
									<div>
										<label
											htmlFor="themeColorInput"
											className="block text-sm font-medium text-foreground mb-1"
										>
											Theme Color (Hex)
										</label>
										<div className="flex items-center gap-2 max-w-sm">
											<div className="relative flex-grow">
												<span
													className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded border"
													style={{
														backgroundColor: isHexColorValid
															? themeColor
															: "#transparent",
														borderColor: isHexColorValid
															? themeColor
															: "hsl(var(--input))",
													}}
												/>
												<HexColorInput
													id="themeColorInput"
													color={themeColor}
													onChange={handleThemeColorChange}
													className="w-full p-2 pl-10 border rounded-md"
													prefixed
												/>
											</div>
											<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
												<PopoverTrigger asChild>
													<Button variant="outline" size="icon">
														<Palette className="h-4 w-4" />
													</Button>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-4 space-y-4">
													<HexColorPicker
														color={themeColor}
														onChange={handleThemeColorChange}
														style={{ width: "240px", height: "160px" }}
													/>
													<div>
														<p className="block text-sm font-medium text-foreground mb-2">
															Quick Colors
														</p>
														<div
															className="flex space-x-2 flex-wrap gap-y-2"
															role="radiogroup"
															aria-labelledby="theme-color-label"
														>
															{pastelThemeColors.map((color) => (
																<button
																	key={color.value}
																	type="button"
																	role="radio"
																	aria-checked={themeColor === color.value}
																	className={`h-8 w-8 rounded-full border-2 transition-all ${
																		themeColor === color.value
																			? "border-primary ring-2 ring-primary ring-offset-2"
																			: "border-gray-300 hover:border-gray-400"
																	}`}
																	style={{ backgroundColor: color.value }}
																	onClick={() =>
																		handleQuickColorSelect(color.value)
																	}
																	aria-label={`Set theme color to ${color.name}`}
																	title={color.name}
																/>
															))}
														</div>
													</div>
												</PopoverContent>
											</Popover>
										</div>
										{!isHexColorValid && themeColor && (
											<p className="text-red-500 text-xs mt-1">
												Invalid hex color code.
											</p>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="lg:col-span-1 space-y-8">
					<Card className="shadow-lg h-full">
						<CardHeader>
							<CardTitle>Preview</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col h-[calc(100%-3.5rem)]">
							{" "}
							{/* Adjusted height slightly */}
							<p className="text-muted-foreground mb-4 text-sm">
								This is how your chatbot will appear.
							</p>
							<div className="flex-grow border rounded-lg overflow-hidden flex flex-col bg-muted/40">
								<div
									className="p-3 font-semibold flex items-center justify-between text-lg"
									style={{
										backgroundColor: effectiveThemeColor,
										color: contrastThemeColor,
									}}
								>
									<span>{chatbotName}</span>
								</div>
								<div className="flex-grow p-4 space-y-3 overflow-y-auto">
									<div className="flex gap-2 items-start">
										<div
											className="h-6 w-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-1"
											style={{
												backgroundColor: botIconBgColor,
												color: botIconFgColor,
											}}
										>
											<Bot className="h-4 w-4" />
										</div>
										<div className="bg-[#f5f5f5] p-2 rounded-lg text-sm shadow max-w-[80%]"
											style={{ // Consistent with PublicChat assistant messages
												backgroundColor: assistantPreviewMessageBg,
												color: assistantPreviewMessageFg,
											}}
										>
											Hi there! How can I help you today?
										</div>
									</div>
									<div className="flex gap-2 items-start justify-end">
										<div
											className="p-2 rounded-lg text-sm shadow max-w-[80%]"
											style={{
												backgroundColor: effectiveThemeColor,
												color: contrastThemeColor,
											}}
										>
											This is a sample user message.
										</div>
										<div
											className="h-6 w-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-1"
											style={{
												backgroundColor: effectiveThemeColor,
												color: contrastThemeColor,
											}}
										>
											<User className="h-4 w-4" />
										</div>
									</div>
								</div>
								<div className="border-t p-2 flex items-center gap-2 bg-background">
									<Input
										placeholder="Type your message..."
										className="flex-1 h-9"
										disabled
									/>
									<Button
										size="icon"
										variant="ghost"
										className="h-9 w-9"
										disabled
										style={{
											color: effectiveThemeColor, // Icon color matches theme
											backgroundColor: `${effectiveThemeColor}1A`, // Background is theme color with low opacity
										}}
									>
										<Send className="h-4 w-4" />
									</Button>
								</div>
							</div>
							{/* Removed Test Your Chatbot Button from here */}
						</CardContent>
					</Card>
				</div>
			</div>

			{/* New Deploy Card */}
			<Card className="shadow-lg lg:col-span-3">
				{" "}
				{/* Spans full width on large screens */}
				<CardHeader>
					<CardTitle>Deploy Your Chatbot</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground mb-2 text-sm">
						Share this link directly with users or use the embed code above for
						websites.
					</p>
					<label
						htmlFor="shareableLink"
						className="block text-sm font-medium text-foreground mb-1"
					>
						Shareable Link
					</label>
					<div className="flex items-center gap-2">
						<Input
							id="shareableLink"
							type="text"
							value={shareableChatUrl}
							readOnly
							className="flex-1 bg-muted"
						/>
						<Button variant="outline" onClick={handleCopyShareableLink}>
							<Copy className="h-4 w-4 mr-2" />
							Copy Link
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
