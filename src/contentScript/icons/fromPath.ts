
// Creates an SVG string from the provided path data
const fromPath = (svgPathData: string, size: number = 10) => (color: string) => {
	const sizeStr = JSON.stringify(size);
	return `<svg
		width="26"
		height="26"
		viewBox="0 0 ${sizeStr} ${sizeStr}"
		version="1.1"
		baseProfile="full"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d=${JSON.stringify(svgPathData.replace(/\n/g, ' '))} fill=${JSON.stringify(color)}/>
	</svg>`.replace(/[\n \t]+/g, ' ');
};

export default fromPath;