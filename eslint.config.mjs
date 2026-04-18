import { defineConfig } from "eslint/config";
import next from "eslint-config-next";

export default defineConfig([{
    ignores: [
        ".agent/**",
        ".agents/**",
        ".auto-claude/**",
        ".bmad/**",
        ".bmad-output/**",
        ".claude/**",
        ".cline/**",
        ".codex/**",
        ".cursor/**",
        ".gemini/**",
        ".git/**",
        ".kilo/**",
        ".kilocode/**",
        ".next/**",
        ".omx/**",
        ".planning/**",
        ".qoder/**",
        ".trae/**",
        ".verdent/**",
        ".windsurf/**",
        "convex/_generated/**",
        "convex/betterAuth/_generated/**",
        "node_modules/**",
    ],
}, {
    extends: [...next],
}]);
