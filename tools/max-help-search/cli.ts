#!/usr/bin/env node
import { availableSources, candidateSources, searchSources } from "./search.js";

const query = process.argv.slice(2).join(" ").trim();
if (!query) {
  console.error("Usage: npm run max:help -- OBJECT_NAME");
  process.exit(2);
}

const sources = await availableSources(candidateSources(process.env.MAX_HOME ? { maxHome: process.env.MAX_HOME } : {}));
if (sources.length === 0) {
  console.error("No Max installation found. Set MAX_HOME to the Max.app path (or a Max resources directory).");
  process.exit(1);
}

const matches = await searchSources(query, sources);
console.log("Search sources:");
for (const source of sources) console.log(`- [${source.label}] ${source.root}`);
console.log(`Matches for \"${query}\": ${matches.length}\n`);
for (const match of matches.slice(0, 25)) console.log(`[${match.relevance}] [${match.source}] ${match.objectName} | ${match.type} | ${match.path}`);
if (matches.length === 0) process.exitCode = 1;
