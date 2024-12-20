import * as fs from "node:fs/promises";
import * as NodePath from "node:path";
import * as R from "remeda";

import { type Ok, ResultAsync, err, ok } from "neverthrow";
import { pipe } from "remeda";
import { NotANumberError } from "./errors";

/**
 * Array
 */
const arrayUtils = {
	/**
	 * Generates all combinations of a given size from the input array.
	 * @param arr - The input array.
	 * @param combinationSize - The size of each combination.
	 * @returns An array of combinations, each being an array of selected elements.
	 */
	getAllCombinations: <T>(arr: T[], combinationSize: number): T[][] => {
		const results: T[][] = [];

		/**
		 * Recursive helper function to build combinations.
		 * @param start - The starting index for the combination.
		 * @param combo - The current combination being built.
		 */
		function helper(start: number, combo: T[]) {
			if (combo.length === combinationSize) {
				results.push([...combo]); // Add a copy of the current combination to results
				return;
			}
			for (let i = start; i < arr.length; i++) {
				combo.push(arr[i]); // Choose the current element
				helper(i + 1, combo); // Recurse with the next elements
				combo.pop(); // Backtrack to try the next element
			}
		}

		helper(0, []); // Initialize the recursion
		return results;
	},
};

/**
 * File
 */
const fileUtils = {
	/**
	 * Determines the input filename based on the current TypeScript file.
	 * Replaces the '.ts' extension with '.txt'.
	 * @param path - The file path.
	 * @returns The corresponding '.txt' filename.
	 */
	getTxtFilenameFromTs: (path: string) => {
		return pipe(NodePath.basename(path), (name) => name.replace("ts", "txt"));
	},
	readFile: (path: string) => {
		return ResultAsync.fromPromise(
			fs.readFile(path, "utf8"),
			(e) => new Error(`${e}`),
		);
	},
};

/**
 * String
 */
const stringUtils = {
	splitChars: R.split(""),
	splitLines: R.split("\n"),
	trimLines: (lines: string[]) => R.map(lines, (line) => line.trim()),
	parseIntResult: (value: unknown) => {
		const res = Number(value);
		if (Number.isNaN(res)) {
			return err(new NotANumberError());
		}
		return ok(Number(value));
	},
	parseToMatrix: (str: string) =>
		pipe(
			Utils.String.splitLines(str),
			R.map((line) => Utils.String.splitChars(line)),
		),
};

/**
 * Grid
 */
const gridUtils = {
	/**
	 * Transposes a 2D matrix (rows become columns and vice versa).
	 * @param matrix - The original 2D array of characters.
	 * @returns The transposed matrix.
	 */
	transposeMatrix: <T>(matrix: T[][]) =>
		matrix[0].map((_, colIdx) => matrix.map((row) => row[colIdx])),

	/**
	 * Rotates a square matrix 90 degrees clockwise.
	 * @param matrix - The original square matrix.
	 * @returns A new matrix rotated 90 degrees clockwise.
	 */
	rotateMatrix90: <T>(matrix: T[][]) =>
		matrix[0].map((_, colIdx) => matrix.map((row) => row[colIdx]).reverse()),
	findIndicesInMatrix: <T>(element: T, matrix: T[][]) => {
		for (let i = 0; i < matrix.length; i++) {
			for (let j = 0; j < matrix[0].length; j++) {
				if (matrix[i][j] === element)
					return ok([i, j]) as Ok<[number, number], never>;
			}
		}
		return err(null);
	},
};

const RE = {
	pluck: <T>(objs: T[], prop: keyof T) => R.pipe(objs, R.map(R.prop(prop))),
};

const Utils = {
	Array: arrayUtils,
	String: stringUtils,
	File: fileUtils,
	Grid: gridUtils,
};

export { Utils, R, RE };
