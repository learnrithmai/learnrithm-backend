#!/usr/bin/env deno --allow-write --allow-run --allow-read
import { exists } from "https://deno.land/std/fs/mod.ts";

// clear the `generated` folder
try {
  await Deno.remove("./generated", { recursive: true });
} catch (error) {
  if (error instanceof Deno.errors.NotFound) {
    console.log("The 'generated' folder does not exist, skipping removal.");
  } else {
    throw error;
  }
}
  
// run prisma db push
const command = new Deno.Command("deno", {
  args: [
    "run",
    "--allow-read",
    "--allow-env",
    "--allow-write",
    "--allow-sys",
    "--allow-run",
    "npm:prisma",
    "db",
    "push"
  ],
  stdout: "inherit",
  stderr: "inherit",
});
  
await command.output();
  
// in the `generated` folder rename all `.js` files to `.cjs` recursively
async function renameJsToCjs(dir: string) {
  try {
    for await (const dirEntry of Deno.readDir(dir)) {
      const fullPath = `${dir}/${dirEntry.name}`;
      if (dirEntry.isFile && dirEntry.name.endsWith(".js")) {
        const newPath = fullPath.replace(".js", ".cjs");
        await Deno.rename(fullPath, newPath);
  
        // add "// deno-lint-ignore-file" to the top of each file
        let content = await Deno.readTextFile(newPath);
        content = `// deno-lint-ignore-file\n${content}`;
  
        // update any require('.js') statements to look for .cjs
        content = content.replace(
          /require\(['"](.+?)\.js['"]\)/g,
          "require('$1.cjs')",
        );
        await Deno.writeTextFile(newPath, content);
      } else if (dirEntry.isDirectory) {
        await renameJsToCjs(fullPath);
      }
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log(`Folder ${dir} not found. Skipping renaming.`);
    } else {
      throw error;
    }
  }
}
  
await renameJsToCjs("./generated");
  
// in the `generated` folder update `.d.ts` files to change imports and exports
async function updateDtsImportsAndExports(dir: string) {
  // Check if directory exists before processing
  if (!(await exists(dir))) {
    console.log(`Folder ${dir} not found. Skipping DTS updates.`);
    return;
  }
  for await (const dirEntry of Deno.readDir(dir)) {
    const fullPath = `${dir}/${dirEntry.name}`;
    if (dirEntry.isFile && dirEntry.name.endsWith(".d.ts")) {
      let content = await Deno.readTextFile(fullPath);
      content = content.replace(
        /export \* from ['"](.+?)['"]/g,
        (_match, p1) => `export * from "${p1}.d.ts"`,
      );
      content = content.replace(
        /export \* from ['"](.+?)\.js['"]/g,
        (_match, p1) => `export * from "${p1}.d.ts"`,
      );
      content = content.replace(
        /import (.+?) from ['"](.+?)['"]/g,
        (_match, p1, p2) => `import ${p1} from "${p2}.d.ts"`,
      );
      content = content.replace(
        /import (.+?) from ['"](.+?)\.js['"]/g,
        (_match, p1, p2) => `import ${p1} from "${p2}.d.ts"`,
      );
      content = content.replace(
        /from ['"](.+?)\.js\.d\.ts['"]/g,
        (_match, p1) => `from "${p1}.d.ts"`,
      );
      await Deno.writeTextFile(fullPath, content);
    } else if (dirEntry.isDirectory) {
      await updateDtsImportsAndExports(fullPath);
    }
  }
}
  
await updateDtsImportsAndExports("./generated");