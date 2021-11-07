#!/usr/bin/env node

import "zx/globals";
import { unzipSync } from "fflate";
import { readFileSync } from "fs";

const auth = JSON.parse(readFileSync("./auth.json", "utf8"));

const lessons = fs.readdirSync("./cache");
lessons.map(async x => {
	const files = await fs.readdir(`./cache/${x}`);
	await Promise.all(
		files.map(async y => {
			const file = await fs.readFile(`./cache/${x}/${y}`);
			const data = unzipSync(file);
			Object.entries(data).map(async ([k, v]) => {
				const p = `${auth.path}Lesson ${x.padStart(2, "0")}/Exercises/${y.replace(".zip", "")}/${k}`;
				fs.mkdirsSync(path.dirname(p));
				await fs.writeFile(p, v);
			});
		})
	)
});