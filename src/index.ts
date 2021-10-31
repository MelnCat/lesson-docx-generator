import readline from "mz/readline.js";
import chalk from "chalk";
import { fatal, getRepls, toExerciseName } from "./util.js";
import { showTitle } from "./title.js";
import fetch from "node-fetch";
import docx from "docx";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { cm, pt, lh, fs, codeBlock, exerciseLink, exerciseTitle, listFiles } from "./document.js";

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

showTitle();

const rl = readline.createInterface(process.stdin, process.stdout);
const lesson = await rl.question(chalk`{cyanBright Enter lesson number}: `);

if (!/^\d+$/.test(lesson)) fatal("Invalid lesson number provided.");
const lessonNumber = +lesson;

const repls = await getRepls(lessonNumber);
console.log(chalk`{magentaBright Loaded {yellowBright ${repls.size}} exercises. }`);

const document = new Document({
	sections: [
		{
			children: [
				new Paragraph({
					text: `Lesson ${lesson} Exercise Key`,
					heading: HeadingLevel.HEADING_1,
				}),
				...[...repls.entries()]
					.sort(([a], [b]) => a - b)
					.flatMap(([k, v]) => {
						const exerciseName = toExerciseName(lessonNumber, k);
						return [exerciseTitle(exerciseName), exerciseLink(exerciseName), ...listFiles(v)];
					}),
			],
			properties: {
				page: {
					size: {
						width: cm(21.59),
						height: cm(27.94),
					},
				},
			},
		},
	],
	styles: {
		default: {
			heading1: {
				run: {
					font: "Calibri Light",
					size: fs(16),
					color: "#2F5496",
				},
				paragraph: {
					spacing: {
						before: pt(12),
						after: pt(6),
						line: lh(1.08),
					},
				},
			},
			heading2: {
				run: {
					font: "Calibri Light",
					size: fs(13),
					color: "#2F5496",
				},
				paragraph: {
					spacing: {
						before: pt(6),
						after: 0,
					},
				},
			},
			heading3: {
				run: {
					font: "Calibri Light",
					size: fs(12),
					color: "#1F3763",
				},
				paragraph: {
					spacing: {
						before: pt(2),
						after: 0,
					},
				},
			},
		},
		paragraphStyles: [
			{
				id: "link",
				name: "Link",
				basedOn: "Normal",
				next: "Normal",
				quickFormat: true,
				run: {
					size: fs(11),
					font: "Calibri",
					color: "#0563C1",
					underline: {
						type: UnderlineType.SINGLE,
					},
				},
				paragraph: {
					spacing: {
						after: pt(8),
					},
				},
			},
			{
				id: "code",
				name: "Code",
				basedOn: "Normal",
				next: "Normal",
				quickFormat: true,
				run: {
					size: fs(9),
					font: "Consolas",
					color: "#ffffff",
				},
			},
		],
	},
});

writeFileSync(new URL("../out.docx", import.meta.url), await Packer.toBuffer(document));

console.log(chalk`{greenBright Document written to {yellowBright out.docx}.}`);

rl.close();