import path from "node:path";
import { compileGuide } from "../../../../../tools/vite/guide";

const guide = compileGuide(path.join(__dirname, "guide"));

export const pages = guide.pages;
export const searchIndex = guide.searchIndex;
