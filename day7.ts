import { Result, ok } from "neverthrow";
import { pipe } from "remeda";
import { R, Utils } from "./utils";

/**
 * Part 2 just add another operator "||"
 */
type Operation = "+" | "*" | "||";
export const isSolution = (
	result: number,
	values: number[],
	operations: Operation[],
) => {
	let acc = values[0];
	R.forEach(operations, (op, i) => {
		switch (op) {
			case "+": {
				acc += values[i + 1];
				break;
			}
			case "*": {
				acc *= values[i + 1];
				break;
			}
			case "||": {
				acc = Number.parseInt(`${acc}${values[i + 1]}`, 10);
			}
		}
	});
	return result === acc;
};

const solveEquation = (equation: (number | number[])[]) => {
	const result = equation[0] as number;
	const values = equation[1] as number[];
	const operations: Operation[] = [];
	let solution: Operation[] | null = null;

	const backtrack = () => {
		if (solution !== null) return true;

		if (operations.length === values.length - 1) {
			if (isSolution(result, values, operations)) {
				solution = [...operations];
				return true;
			}
			return false;
		}

		for (const op of ["+", "*", "||"] as Operation[]) {
			operations.push(op);
			const found = backtrack();
			if (found) {
				return true;
			}
			operations.pop();
		}
		return false;
	};

	backtrack();
	return operations;
};

const main = async () => {
	const filename = Utils.File.getTxtFilenameFromTs(__filename);
	const sampleFilename = `sample_${filename}`;

	const contentRes = await Utils.File.readFile(`inputs/${sampleFilename}`);
	if (contentRes.isErr()) {
		console.error(contentRes.error);
		return;
	}

	const content = contentRes.value;
	const parseRes = pipe(content, Utils.String.splitLines, (lines) =>
		lines.map((line) => {
			const pair = line.split(": ");
			const calibRes = Utils.String.parseIntResult(pair[0]);
			const valuesRes = Result.combine(
				pair[1].split(" ").map(Utils.String.parseIntResult),
			);
			const pairRes = Result.combine([calibRes, valuesRes]);
			return pairRes.match(
				(t) => t,
				() => {
					console.error(`failed to parse ${line}, fallback to -1`);
					return [-1, -1];
				},
			);
		}),
	);
	// console.log(parseRes);

	let sum = 0;
	for (const eq of parseRes) {
		const res = solveEquation(eq);
		if (res.length !== 0) sum += eq[0];
	}
	console.log(sum);
};

main();
