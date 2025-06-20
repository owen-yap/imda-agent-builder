// Helper function to determine contrast color (black or white) for a given hex background
export const getContrastColor = (hexColor: string | undefined): string => {
	if (!hexColor || !hexColor.startsWith("#") || (hexColor.length !== 4 && hexColor.length !== 7)) {
		return "#FFFFFF"; // Default to white for invalid or non-hex color, assuming dark primary
	}
	let r, g, b;
	if (hexColor.length === 4) { // Handle shorthand hex #RGB
		r = parseInt(hexColor[1] + hexColor[1], 16);
		g = parseInt(hexColor[2] + hexColor[2], 16);
		b = parseInt(hexColor[3] + hexColor[3], 16);
	} else { // Handle #RRGGBB
		r = parseInt(hexColor.slice(1, 3), 16);
		g = parseInt(hexColor.slice(3, 5), 16);
		b = parseInt(hexColor.slice(5, 7), 16);
	}
	// http://www.w3.org/TR/AERT#color-contrast
	const brightness = (r * 299 + g * 587 + b * 114) / 1000;
	return brightness > 125 ? "#000000" : "#FFFFFF";
}; 