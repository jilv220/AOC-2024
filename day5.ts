import { Result, ResultAsync, err, ok } from "neverthrow";
import { pipe, tap } from "remeda";
import { R, Utils } from "./utils";

const isValidUpdate = (
	orderRulesMap: Record<string, string[]>,
	pages: string[],
): boolean => {
	for (let i = 0; i < pages.length - 1; i++) {
		const curr = pages[i];
		const rest = R.drop(pages, i + 1);
		for (let j = 0; j < rest.length; j++) {
			const order = orderRulesMap[curr];
			if (order === undefined || !order.includes(rest[j])) {
				return false;
			}
		}
	}
	return true;
};

/**
 * Attempts to rearrange the pages in the update to satisfy the order rules.
 * Uses a backtracking algorithm to find a valid sequence.
 * @param orderRulesMap - A mapping of each page to its allowed subsequent pages.
 * @param update - An array of pages representing the update sequence.
 * @returns A Result containing the fixed update sequence or an error message.
 */
const fixInvalidUpdate = (
	orderRulesMap: Record<string, string[]>,
	update: string[],
): Result<string[], string> => {
	const pages = update;
	const n = update.length;

	// Build adjacency list based on orderRulesMap
	const pageSet = new Set(pages);
	const adjacency: Record<string, string[]> = {};
	for (const page of pages) {
		adjacency[page] = orderRulesMap[page]?.filter((p) => pageSet.has(p)) || [];
	}

	const pageToIndex: Record<string, number> = {};
	R.forEach(pages, (page, idx) => {
		pageToIndex[page] = idx;
	});
	const memo = new Map<string, boolean>();

	const backtrack = (
		currentPage: string,
		usedMask: number,
		sequence: string[],
	): boolean => {
		if (sequence.length === n) return true;

		const key = `${currentPage}|${usedMask}`;
		if (memo.has(key)) return memo.get(key)!;

		for (const nextPage of adjacency[currentPage]) {
			const nextIdx = pageToIndex[nextPage];
			const nextBit = 1 << nextIdx;
			if (!(usedMask & nextBit)) {
				// Check if nextPage can lead to a valid continuation
				const allowedTransitions = adjacency[nextPage];
				const remainingCount = n - (sequence.length + 1);
				if (allowedTransitions.length === 0 && remainingCount > 0) {
					continue; // Prune this path
				}

				sequence.push(nextPage);
				if (backtrack(nextPage, usedMask | nextBit, sequence)) {
					memo.set(key, true);
					return true;
				}
				sequence.pop();
			}
		}

		return false;
	};

	for (let i = 0; i < n; i++) {
		const startPage = pages[i];
		const usedMask = 1 << i;
		const sequence: string[] = [startPage];
		if (backtrack(startPage, usedMask, sequence)) {
			return ok(sequence);
		}
	}

	return err("Unable to fix the update: No valid rearrangement found.");
};

const main = async () => {
	const filename = Utils.File.getTxtFilenameFromTs(__filename);
	const sampleFilename = `sample_${filename}`;

	const contentRes = await Utils.File.readFile(`inputs/${filename}`);
	if (contentRes.isErr()) {
		console.error(contentRes.error);
		return;
	}

	const content = contentRes.value;
	const lines = Utils.String.splitLines(content);
	const emptyLineIdx = pipe(
		lines,
		R.findIndex((line) => line === ""),
	);

	let [orderRules, updates] = R.splitAt(lines, emptyLineIdx);
	updates = R.drop(updates, 1);

	/**
	 * Part 1
	 */
	const splitOrderRules = orderRules.map((str) => str.split("|"));
	const groupedOrderRules = R.groupBy(splitOrderRules, (pair) => pair[0]);
	const orderRuleEntries = R.entries(groupedOrderRules).map(([key, pairs]) => {
		const values = pairs.map((pair) => pair[1]);
		return [key, values];
	});
	const orderRulesMap = R.mapToObj(orderRuleEntries, (group) => [
		String(group[0]),
		group[1],
	]) as Record<string, string[]>;
	// console.log(orderRulesMap);

	const updateArrs = updates.map((u) => u.split(","));
	const midpointsRes = updateArrs
		.filter((update) => isValidUpdate(orderRulesMap, update))
		.map((update) => update.at(update.length / 2) ?? "error")
		.map((mid) => Utils.String.parseIntResult(mid));

	// Result.combine(midpointsRes)
	// 	.map((mids) => R.sum(mids))
	// 	.map(console.log)
	// 	.mapErr(console.error);

	/**
	 * Part 2
	 */
	const invalidUpdates = updateArrs.filter(
		(update) => !isValidUpdate(orderRulesMap, update),
	);

	const fixedUpdates: string[][] = [];
	for (let index = 0; index < invalidUpdates.length; index++) {
		const update = invalidUpdates[index];
		const fixResult = fixInvalidUpdate(orderRulesMap, update);

		if (fixResult.isOk()) {
			const fixedUpdate = fixResult.value;
			fixedUpdates.push(fixedUpdate);
			// console.log(`Fixed Update ${index + 1}:`, fixedUpdate);
		} else {
			console.error(`Failed to fix Update ${index + 1}:`, fixResult.error);
		}
	}

	const part2MidpointsRes = fixedUpdates
		.map((update) => update.at(update.length / 2) ?? "error")
		.map((mid) => Utils.String.parseIntResult(mid));

	Result.combine(part2MidpointsRes)
		.map((mids) => R.sum(mids))
		.map(console.log);
};

main();
