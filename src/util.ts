import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { readFile, mkdir, writeFile, readdir } from "fs/promises";
import fetch from "node-fetch";
import chalk from "chalk";
import * as fflate from "fflate";
import { basename } from "path";
import { globby } from "globby";

export const fatal = (s: string) => {
	console.error(chalk.red(s));
	process.exit(1);
};

export const toExerciseName = (lesson: number, exercise: number) =>
	`${lesson.toString().padStart(2, "0")}E${exercise.toString().padStart(2, "0")}`;

const authFilePath = new URL("../auth.json", import.meta.url);
if (!existsSync(authFilePath)) fatal("No auth.json was found.");
export const authData: { sid: string; username: string; path: string } = JSON.parse(
	readFileSync(authFilePath, "utf8")
);

const getReplCount = async (lesson: number) => {
	if (lesson >= 20) return 0;
	for (let i = 1; ; i++) {
		const req = await fetch(`https://replit.com/data/repls/@${authData.username}/${toExerciseName(lesson, i)}`, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
			},
		});
		if (!req.ok) return i - 1;
	}
};

const getExtFolders = async (lesson: number) => {
	const basePath = `${authData.path}Lesson ${lesson}/Exercises/`;
	const exerciseFolders = await readdir(basePath);
	const exercises = new Map<number, Map<string, Buffer>>();
	await Promise.all(
		exerciseFolders.map(async e => {
			const map = new Map<string, Buffer>();
			const n = +e.replace(`${lesson}E`, "");
			await Promise.all(
				await globby(`${basePath}${e}/**/*.{html,css,js}`).then(files =>
					files.map(x => x.replace(`${basePath}${e}/`, "")).map(x => readFile(`${basePath}${e}/${x}`).then(y => map.set(x, y)))
				)
			)
			exercises.set(n, map);
			return map;
		})
	);
	return exercises;
};

export const getRepls = async (lesson: number) => {
	const count = await getReplCount(lesson);
	if (count <= 0) {
		return getExtFolders(lesson);
	}
	console.log(chalk`{magentaBright Found {yellowBright ${count}} exercises.}`);
	const exercises = new Map<number, Map<string, Buffer>>();
	const registerBuffer = (num: number, buffer: Buffer) => {
		exercises.set(num, new Map(Object.entries(fflate.unzipSync(buffer)).map(([k, v]) => [k, Buffer.from(v)])));
	};
	await Promise.all(
		[...Array(count)]
			.map((_, i) => i + 1)
			.map(async i => {
				const exerciseName = toExerciseName(lesson, i);
				const cacheLocation = new URL(`../cache/${lesson}/${exerciseName}.zip`, import.meta.url);
				await mkdir(new URL("./", cacheLocation), { recursive: true });
				if (existsSync(cacheLocation)) {
					registerBuffer(i, await readFile(cacheLocation));
					console.log(
						chalk`{greenBright Exercise {yellowBright ${toExerciseName(lesson, i)}} loaded from cache.}`
					);
					return;
				}
				const req = await fetch(`https://replit.com/@${authData.username}/${exerciseName}.zip`, {
					headers: {
						"user-agent": "a",
						cookie: `connect.sid=${encodeURIComponent(authData.sid)}`,
					},
				});
				if (!req.ok) {
					if (req.status === 404) return;
					fatal(`Failed to fetch ${exerciseName}: ${req.status} ${req.statusText}`);
				}
				const data = await req.buffer();
				registerBuffer(i, data);
				console.log(
					chalk`{greenBright Exercise {yellowBright ${toExerciseName(lesson, i)}} downloaded from repl.it.}`
				);
				await writeFile(cacheLocation, data);
			})
	);
	return exercises;
};
