import { pipe } from "effect";
import type { NotANumberError } from "./errors";
import { A, S, TE, Utils } from "./utils";

const filename = Utils.File.getTxtFilenameFromTs(__filename);
const sampleFilename = `sample_${filename}`;

const content = Utils.File.readFileTE(`inputs/${filename}`);

const parseToMatrix = (str: string): TE.Effect<number[][], NotANumberError> => {
	return pipe(str, S.split("\n"), A.map(S.split(" ")), (lines: string[][]) =>
		pipe(
			A.map(lines, (line) =>
				pipe(
					line,
					A.map((lvl) => Utils.String.parseIntTE(lvl)),
					TE.all,
				),
			),
			TE.all,
		),
	);
};

const calculateDiffs = (report: number[]) =>
	pipe(
		report,
		A.zip(A.drop(report, 1)),
		A.map(([a, b]) => a - b),
	);

const validateReport = (diffs: number[]) => {
	const isValidLvlDec = (t: number) => t >= 1 && t <= 3;
	const isValidLvlInc = (t: number) => t >= -3 && t <= -1;
	const isValidReportDec = (ts: number[]) => ts.every(isValidLvlDec);
	const isValidReportInc = (ts: number[]) => ts.every(isValidLvlInc);

	return isValidReportDec(diffs) || isValidReportInc(diffs);
};

const matrix = TE.flatMap(content, parseToMatrix);

const part1Res = pipe(
	matrix,
	TE.map((m) =>
		pipe(
			m,
			A.map(calculateDiffs),
			A.map(validateReport),
			A.reduce(0, (acc, isPass) => (isPass ? acc + 1 : acc)),
		),
	),
);

const reportValidity = pipe(
	matrix,
	TE.map((m) => pipe(m, A.map(calculateDiffs), A.map(validateReport))),
);

const dampenedReportCnt = pipe(
	TE.all([matrix, reportValidity]),
	TE.map(([m, r]) =>
		pipe(
			m,
			A.map((m, i) => (r[i] ? undefined : m)),
			A.filter((m) => m !== undefined),
		),
	),
	TE.map((m) => {
		/**
		 * Enumerate all possible reports, and calculate whether a report can be dampen or not
		 */
		const reportOutcomes: boolean[][] = [];
		A.forEach(m, (report) => {
			const outcomes: boolean[] = [];
			A.forEach(report, (_, j) => {
				const newReport = A.remove(report, j);
				const newDiffs = calculateDiffs(newReport);
				const validateNewDiffs = validateReport(newDiffs);
				outcomes.push(validateNewDiffs);
			});
			reportOutcomes.push(outcomes);
		});
		const res = A.map(reportOutcomes, (os) => os.some((o) => o));
		return res;
	}),
	TE.map((outcomes) =>
		pipe(
			outcomes,
			A.reduce(0, (acc, isPass) => (isPass ? acc + 1 : acc)),
		),
	),
);

const part2 = pipe(
	TE.all([part1Res, dampenedReportCnt]),
	TE.map(([a, b]) => a + b),
);

TE.runPromise(part1Res).then(console.log);
TE.runPromise(part2).then(console.log);
