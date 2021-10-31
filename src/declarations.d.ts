declare module "fflate" {
	const out: typeof import("../node_modules/fflate/lib/index.js");
	export = out;
}
declare module "highlight.js/lib/languages/*" {
	const out: any;
	export default out;
}
declare module "highlight.js" {
	const out: typeof import("../node_modules/highlight.js/types/index.js");;
	export default out;
}