import { expect, it, test } from "bun:test";
import { isSolution } from "./day7";

it("should be true", () => {
	const res = isSolution(190, [10, 19], ["*"]);
	expect(res).toBe(true);
});
it("should be false", () => {
	const res = isSolution(190, [10, 19], ["+"]);
	expect(res).toBe(false);
});
it("should handle mixed operation", () => {
	const res = isSolution(292, [11, 6, 16, 20], ["+", "*", "+"]);
	return expect(res).toBe(true);
});

it("should handle simple concat operation", () => {
	const res = isSolution(156, [15, 6], ["||"]);
	return expect(res).toBe(true);
});

it("should handle mixed concat operation", () => {
	const res = isSolution(7290, [6, 8, 6, 15], ["*", "||", "*"]);
	return expect(res).toBe(true);
});
