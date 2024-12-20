import { pipe } from "remeda";
import { R, RE, Utils } from "./utils";

type ComboWithDiff = {
	combo: number[][];
	diff: number[];
};

type Frequencies = {
	[x: string]: {
		locations: number[][];
		diffs: ComboWithDiff[];
	};
};

const reverseDiff = (diff: number[]) => [-diff[0], -diff[1]];
const applyDiff = (location: number[], diff: number[]) => [
	location[0] + diff[0],
	location[1] + diff[1],
];
const isInBound = (pos: number[], n: number, m: number) => {
	if (pos[0] < 0 || pos[1] < 0) return false;
	if (pos[0] > n - 1 || pos[1] > m - 1) return false;
	return true;
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

	const freqs: Frequencies = {};
	let n = -1;
	let m = -1;
	const _ = pipe(content, Utils.String.splitLines, (lines) => {
		n = lines.length;
		R.forEach(lines, (line, i) => {
			m = line.length;
			R.forEach(line.split(""), (freq, j) => {
				if (freq === ".") return;

				if (freqs[freq]) {
					const v = freqs[freq];
					freqs[freq] = {
						locations: [...v.locations, [i, j]],
						diffs: v.diffs,
					};
				} else {
					freqs[freq] = {
						locations: [[i, j]],
						diffs: [],
					};
				}
			});
		});
	});

	R.forEachObj(freqs, (v) => {
		const locations = v.locations;
		const combos = Utils.Array.getAllCombinations(locations, 2);

		R.forEach(combos, (combo) => {
			v.diffs.push({
				combo,
				diff: [combo[0][0] - combo[1][0], combo[0][1] - combo[1][1]],
			});
		});
	});

	/**
	 *  Part 1
	 */
	const antiNodes: number[][] = [];
	R.forEachObj(freqs, (v) => {
		const comboWithDiffs = v.diffs;
		R.forEach(comboWithDiffs, (cwd) => {
			const { combo, diff } = cwd;
			antiNodes.push(applyDiff(combo[0], diff));
			antiNodes.push(applyDiff(combo[1], reverseDiff(diff)));
		});
	});

	const validAntiNodes = pipe(
		antiNodes.filter((pos) => isInBound(pos, n, m)),
		R.uniqueWith(R.isDeepEqual),
	);

	console.log(validAntiNodes);
	console.log(validAntiNodes.length);

	/**
	 *  Part 2
	 */
};

main();
