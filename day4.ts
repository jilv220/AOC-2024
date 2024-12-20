import type { FileSystem } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import type { PlatformError } from "@effect/platform/Error";
import { pipe } from "effect";
import { A, S, TE, Utils } from "./utils";

const filename = Utils.File.getTxtFilenameFromTs(__filename);
const sampleFilename = `sample_${filename}`;

const content = Utils.File.readFile(`inputs/${filename}`);
const cachedContent = TE.flatten(TE.cached(content));

const parseToMatrix = (
	str: TE.Effect<string, PlatformError, FileSystem.FileSystem>,
) =>
	pipe(
		str,
		TE.map(Utils.String.splitLines),
		TE.map((m) => pipe(m, A.map(Utils.String.splitChars))),
	);

const makeWordCounter =
	(word: string) =>
	(line: string[]): number => {
		const wordLength = word.length;
		const reverseWord = word.split("").reverse().join("");
		let count = 0;

		for (let i = 0; i <= line.length - wordLength; i++) {
			const substring = line.slice(i, i + wordLength).join("");
			if (substring === word || substring === reverseWord) {
				count++;
			}
		}

		return count;
	};
const countXmasInLine = makeWordCounter("XMAS");

const countTotalOccurrences =
	(counter: (line: string[]) => number) => (matrix: string[][]) =>
		matrix.reduce((acc, line) => acc + counter(line), 0);

const collectAllDiagonals = (matrix: string[][]): string[][] => {
	const diagonals: string[][] = [];
	const n = matrix.length;

	// Helper function to collect a diagonal starting from (row, col) with given direction
	const collectDiagonal = (
		startRow: number,
		startCol: number,
		deltaRow: number,
		deltaCol: number,
	): string[] => {
		const diagonal: string[] = [];
		let row = startRow;
		let col = startCol;
		while (row >= 0 && row < n && col >= 0 && col < n) {
			diagonal.push(matrix[row][col]);
			row += deltaRow;
			col += deltaCol;
		}
		return diagonal;
	};

	// Top-left to bottom-right diagonals
	for (let row = 0; row < n; row++) {
		diagonals.push(collectDiagonal(row, 0, 1, 1));
	}
	for (let col = 1; col < n; col++) {
		diagonals.push(collectDiagonal(0, col, 1, 1));
	}

	// Top-right to bottom-left diagonals
	for (let row = 0; row < n; row++) {
		diagonals.push(collectDiagonal(row, n - 1, 1, -1));
	}
	for (let col = n - 2; col >= 0; col--) {
		diagonals.push(collectDiagonal(0, col, 1, -1));
	}

	return diagonals;
};

const countDiagonalOccurrences = (matrix: string[][]): number => {
	const diagonals = collectAllDiagonals(matrix);
	return countTotalOccurrences(countXmasInLine)(diagonals);
};

const part1 = pipe(
	cachedContent,
	parseToMatrix,
	TE.map((m: string[][]) => {
		const hCnt = countTotalOccurrences(countXmasInLine)(m);
		const vCnt = pipe(
			Utils.Grid.transposeMatrix(m),
			countTotalOccurrences(countXmasInLine),
		);
		const dCnt = countDiagonalOccurrences(m);
		return hCnt + vCnt + dCnt;
	}),
	TE.provide(BunContext.layer),
);

const part2 = pipe(
	cachedContent,
	parseToMatrix,
	TE.map((m) => {
		// finish the code here
		const rows = m.length;
		const cols = m[0].length;
		let count = 0;

		// Traverse each cell as a potential center
		for (let r = 1; r < rows - 1; r++) {
			for (let c = 1; c < cols - 1; c++) {
				// Get the diagonals
				const topLeft = m[r - 1][c - 1];
				const topRight = m[r - 1][c + 1];
				const bottomLeft = m[r + 1][c - 1];
				const bottomRight = m[r + 1][c + 1];
				const center = m[r][c];

				// Check if diagonals match MAS pattern
				const diag1 = [topLeft, center, bottomRight].join("");
				const diag2 = [topRight, center, bottomLeft].join("");

				if (
					(diag1 === "MAS" || diag1 === "SAM") &&
					(diag2 === "MAS" || diag2 === "SAM")
				) {
					count++;
				}
			}
		}
		return count;
	}),
);

BunRuntime.runMain(
	pipe(
		part1,
		TE.tap(console.log),
		TE.andThen(() => part2),
		TE.tap(console.log),
		TE.provide(BunContext.layer),
	),
);
