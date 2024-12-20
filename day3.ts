import { pipe } from "effect";
import { A, S, SI, ST, TE, Utils } from "./utils";

const filename = Utils.File.getTxtFilenameFromTs(__filename);
const sampleFilename = `sample_${filename}`;

const content = Utils.File.readFileTE(`inputs/${filename}`);

const part1 = pipe(
	content,
	TE.flatMap((str) => {
		const regex = /mul\(\d+,\d+\)/g;
		return S.match(regex)(str);
	}),
	// TE.tap(console.log),
	TE.map((matches) => {
		const regex = /(\d+),(\d+)/g;
		const res = A.map(matches, (m) => {
			const [...t1] = m.matchAll(regex);
			return t1;
		});
		return A.map(res, (r) => [r[0][1], r[0][2]]);
	}),
	// TE.tap(console.log),
	TE.flatMap((pairs) =>
		pipe(
			pairs,
			A.map((p) =>
				pipe(
					p,
					A.map((e) => Utils.String.parseIntTE(e)),
					TE.all,
				),
			),
			TE.all,
		),
	),
	TE.map((pairs) =>
		pipe(
			pairs,
			A.map((p) => A.reduce(p, 1, (acc, curr) => acc * curr)),
			A.reduce(0, (acc, curr) => acc + curr),
		),
	),
);

const part2 = pipe(
	content,
	TE.flatMap((str) => {
		const regex = /(mul\(\d+,\d+\))|do\(\)|don't\(\)/g;
		return S.match(regex)(str);
	}),
	TE.flatMap((matches) => {
		const regex = /(\d+),(\d+)/g;
		const matchesStream = ST.fromIterable(matches);
		const initial = {
			enabled: true,
			total: 0,
		};

		const res = pipe(
			matchesStream,
			ST.runFold(initial, (acc, match) => {
				if (match.startsWith("don't")) {
					return { ...acc, enabled: false };
				}
				if (match.startsWith("do")) {
					return { ...acc, enabled: true };
				}
				if (acc.enabled) {
					const [numbers] = match.match(regex) ?? [];
					if (numbers) {
						const [a, b] = numbers.split(",").map(Number);
						return { ...acc, total: acc.total + a * b };
					}
				}
				return acc;
			}),
		);
		return res;
	}),
	TE.map((state) => state.total),
);

// TE.runPromise(part1).then(console.log);
TE.runPromise(part2).then(console.log);
