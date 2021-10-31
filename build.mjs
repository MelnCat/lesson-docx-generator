#!/usr/bin/env node

import "zx/globals";
import esbuild from "esbuild";

esbuild
	.build({
		entryPoints: [...(await glob(["./src/**/*.ts", "!./src/**/*.d.ts"]))],
		outdir: "dist",
		platform: "node",
		//format: "cjs"
	})
	.catch(() => process.exit(1));
