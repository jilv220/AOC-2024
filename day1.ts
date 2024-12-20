import { Order } from "effect";
import { ResultAsync, err, ok, okAsync } from "neverthrow";
import { filter, map, pipe, reduce } from "remeda";
import { Utils } from "./utils";

const filename = Utils.getTxtFilenameFromTs(__filename);

const parseList = (field: number) =>
	Utils.readFileWithResult(`inputs/${filename}`).andThen((content) =>
		pipe(
			content.split("\n"),
			map((line) => line.split("   ")),
			map((line) => Number(line[field])),
			(arr) => arr.sort(Order.number),
			okAsync,
		),
	);

const list1 = parseList(0);
const list2 = parseList(1);

const res = pipe(ResultAsync.combine([list1, list2]), (result) =>
	result.andThen(([l1, l2]) =>
		pipe(
			l1,
			map((_, i) => Math.abs(l1[i] - l2[i])),
			reduce((acc, n) => acc + n, 0),
			okAsync,
		),
	),
);

const res2 = pipe(ResultAsync.combine([list1, list2]), (result) =>
	result.andThen(([l1, l2]) =>
		pipe(
			l1,
			reduce((acc, x) => {
				const appearances = pipe(
					l2,
					filter((x2) => x2 === x),
					(arr) => arr.length,
				);
				return acc + x * appearances;
			}, 0),
			okAsync,
		),
	),
);

res2.map(console.log);
