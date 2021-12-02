import docx from "docx";
const {
	Document,
	HeadingLevel,
	Packer,
	Paragraph,
	LineRuleType,
	Table,
	TableCell,
	TableRow,
	BorderStyle,
	TextRun,
	WidthType,
	UnderlineType,
	ExternalHyperlink,
	ImportDotx,
} = docx;
import parser from "node-html-parser";
import hljs from "highlight.js";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import entities from "entities";
import { authData } from "./util.js";

hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);

export const cm = (n: number) => (n / 2.54) * 72 * 20;
export const pt = (n: number) => n * 20;
export const fs = (n: number) => n * 2;
export const lh = (n: number) => (n - 0.00107327) / 0.00416689;

const themeColors = {
	keyword: "#d4d4d4",
	tag: "#808080",
	name: "#569cd6",
	comment: "#608b4e",
	attr: "#9cdcfe",
	string: "#ce9178",
	meta: "#569cd6",
	"selector-tag": "#569cd6",
	attribute: "#9cdcfe",
	number: "#b5cea8",
	"selector-id": "#569cd6",
	"selector-class": "#569cd6",
	built_in: "#ce9178"
} as Record<string, string>;

const themeOverrides = {
	javascript: {
		keyword: "#569cd6",
	},
} as Record<string, Record<string, string>>;
const formatCode = (str: string, lang: string) => {
	const highlightedCode = hljs.highlightAuto(str).value;
	const highlighted = parser.parse(highlightedCode);
	highlighted.querySelectorAll(".language-xml *").forEach(x => x.setAttribute("lang", "xml"));
	highlighted.querySelectorAll(".language-javascript *").forEach(x => x.setAttribute("lang", "javascript"));
	highlighted.querySelectorAll(".language-css *").forEach(x => x.setAttribute("lang", "css"));
	const walk = (node: parser.HTMLElement): { text: string; color: string; lang: string }[] => {
		return node.childNodes.flatMap(x =>
			x.nodeType === parser.NodeType.TEXT_NODE
				? {
						text: entities.decode(x.rawText),
						color: node.classNames,
						lang: node.attributes.lang,
				  }
				: walk(x as parser.HTMLElement)
		);
	};
	return walk(highlighted).flatMap(x => {
		const key = x.color.replace("hljs-", "");
		const color = themeOverrides[x.lang]?.[key] ?? themeColors[key] ?? "#d4d4d4";

		return x.text.includes("\n")
			? x.text.split("\n").map((x, i) => new TextRun({ text: x, break: +!!i, color }))
			: new TextRun({
					text: x.text,
					color,
			  });
	});
};

export const codeBlock = (str: string, lang: string) =>
	new Table({
		rows: [
			new TableRow({
				children: [
					new TableCell({
						children: [
							new Paragraph({
								children: formatCode(str.replaceAll("\t", "    "), lang),
								style: "code",
							}),
						],
						shading: {
							fill: "#1E1E1E",
						},
					}),
				],
			}),
		],
		borders: {
			bottom: { style: BorderStyle.NONE },
			top: { style: BorderStyle.NONE },
			left: { style: BorderStyle.NONE },
			right: { style: BorderStyle.NONE },
		},
		margins: {
			bottom: cm(0.15),
			top: cm(0.15),
			left: cm(0.15),
			right: cm(0.15),
		},
		width: {
			size: 100,
			type: WidthType.PERCENTAGE,
		},
	});

export const exerciseLink = (exercise: string) => {
	const n = exercise.split("E")[0];
	const link = `${authData.path}Lesson ${n}/Exercises/${exercise}/${+n >= 28 ? "index.js" : "index.html"}`;
	return new Paragraph({
		children: [
			new ExternalHyperlink({
				children: [new TextRun(link)],
				link,
			}),
		],
		style: "link",
	});
}
	

export const exerciseTitle = (exercise: string) =>
	new Paragraph({
		text: exercise,
		heading: HeadingLevel.HEADING_2,
	});

export const listFiles = (files: Map<string, Buffer>) =>
	[...files.entries()]
		.filter(([x]) => /\.(html|css|js)$/.test(x))
		.sort(([a], [b]) =>
			a === "index.html"
				? -1
				: (a.match(/\//g)?.length ?? 0) - (b.match(/\//g)?.length ?? 0) || a.localeCompare(b)
		)
		.flatMap(([k, v], _, a) => [
			...(k !== "index.html"
				? [
						new Paragraph({
							text: k,
							heading: HeadingLevel.HEADING_3,
						}),
				  ]
				: []),
			codeBlock(v.toString("utf8"), k.split(".").reverse()[0]),
		]);
