import chalk from "chalk";

export const showTitle = () => {
	console.log("=".repeat(process.stdout.columns));
	console.log(
		chalk.yellow(
			`\
 _    ___   __   __   __   __  _   _  __ ___ __   __ __  ___  __  _  
| |  | __|/' _//' _/ /__\\ |  \\| | | |/ /| __|\\ \`v' // _]| __||  \\| | 
| |_ | _| \`._\`.\`._\`.| \\/ || | ' | |   < | _|  \`. .'| [/\\| _| | | ' | 
|___||___||___/|___/ \\__/ |_|\\__| |_|\\_\\|___|  !_!  \\__/|___||_|\\__|
                                                                   ${chalk.blueBright("Generate Lesson Keys")}`
				.split("\n")
				.map(x => {
					const side = " ".repeat(Math.floor((process.stdout.columns - x.length) / 2));
					return `${side}${x}${side}`;
				})
				.join("\n")
		)
	);
	console.log("=".repeat(process.stdout.columns));
};
