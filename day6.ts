import { pipe } from "remeda";
import { R, Utils } from "./utils";

type GuardFacing = "up" | "down" | "left" | "right";
type Guard = {
	position: number[];
	facing: GuardFacing;
	finished: boolean;
};
const nextFacing = (facing: GuardFacing): GuardFacing => {
	switch (facing) {
		case "up":
			return "right";
		case "down":
			return "left";
		case "left":
			return "up";
		case "right":
			return "down";
	}
};

const stepForward = (guard: Guard, matrix: string[][]): Guard => {
	const obstacle = "#";
	const [i, j] = guard.position;
	const numRows = matrix.length;
	const numCols = matrix[0].length;
	// console.log(guard.position);

	switch (guard.facing) {
		case "up": {
			const nextI = i - 1;
			const nextJ = j;

			// Check if the next position is out of bounds (edge)
			const isAtTopEdge = nextI < 0;
			const isObstacle = !isAtTopEdge && matrix[nextI][nextJ] === obstacle;

			if (isAtTopEdge) {
				// Attempting to move off the map
				return {
					...guard,
					position: [nextI, nextJ],
					finished: true,
				};
			}

			if (isObstacle) {
				// Obstacle at the next position (could be on the edge)
				// If the obstacle is on the edge, changing direction without moving
				return {
					...guard,
					facing: nextFacing(guard.facing),
				};
			}

			// Normal movement
			return {
				...guard,
				position: [nextI, nextJ],
			};
		}

		case "down": {
			const nextI = i + 1;
			const nextJ = j;

			const isAtBottomEdge = nextI >= numRows;
			const isObstacle = !isAtBottomEdge && matrix[nextI][nextJ] === obstacle;

			if (isAtBottomEdge) {
				return {
					...guard,
					position: [nextI, nextJ],
					finished: true,
				};
			}

			if (isObstacle) {
				return {
					...guard,
					facing: nextFacing(guard.facing),
				};
			}

			return {
				...guard,
				position: [nextI, nextJ],
			};
		}

		case "left": {
			const nextI = i;
			const nextJ = j - 1;

			const isAtLeftEdge = nextJ < 0;
			const isObstacle = !isAtLeftEdge && matrix[nextI][nextJ] === obstacle;

			if (isAtLeftEdge) {
				return {
					...guard,
					position: [nextI, nextJ],
					finished: true,
				};
			}

			if (isObstacle) {
				return {
					...guard,
					facing: nextFacing(guard.facing),
				};
			}

			return {
				...guard,
				position: [nextI, nextJ],
			};
		}

		case "right": {
			const nextI = i;
			const nextJ = j + 1;

			const isAtRightEdge = nextJ >= numCols;
			const isObstacle = !isAtRightEdge && matrix[nextI][nextJ] === obstacle;

			if (isAtRightEdge) {
				return {
					...guard,
					position: [nextI, nextJ],
					finished: true,
				};
			}

			if (isObstacle) {
				return {
					...guard,
					facing: nextFacing(guard.facing),
				};
			}

			return {
				...guard,
				position: [nextI, nextJ],
			};
		}
	}
};

const serializeGuardState = (guard: Guard) =>
	`${guard.position[0]},${guard.position[1]},${guard.facing}`;

const simulateGuardMovement = (initialGuard: Guard, matrix: string[][]) => {
	const visitedState = new Set();
	let guard = { ...initialGuard };

	while (true) {
		const stateKey = serializeGuardState(guard);
		if (visitedState.has(stateKey)) {
			return true;
		}
		visitedState.add(stateKey);

		const nextGuard = stepForward(guard, matrix);
		if (nextGuard.finished) {
			return false;
		}

		guard = nextGuard;
	}
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
	// console.log(content);

	const matrix = Utils.String.parseToMatrix(content);
	const idxOfGuardRes = Utils.Grid.findIndicesInMatrix("^", matrix);
	if (idxOfGuardRes.isErr()) return;
	const idxOfGuard = idxOfGuardRes.value;

	// Part 1
	let guard: Guard = {
		position: idxOfGuard,
		facing: "up",
		finished: false,
	};
	const guardClone = R.clone(guard);

	const positions = [];
	while (!guard.finished) {
		positions.push(guard.position);
		guard = stepForward(guard, matrix);
	}
	// const part1Res = pipe(
	// 	positions,
	// 	R.uniqueWith(R.isDeepEqual),
	// 	R.reduce((acc, curr) => (curr ? acc + 1 : acc), 0),
	// );

	// Part 2
	const possibleObstructions = [];
	for (let i = 0; i < matrix.length; i++) {
		for (let j = 0; j < matrix[0].length; j++) {
			// Skip the guard's starting position and existing obstructions
			if (
				(i === guardClone.position[0] && j === guardClone.position[1]) ||
				matrix[i][j] === "#"
			) {
				continue;
			}

			// Clone the matrix to place a new obstruction
			const newMatrix = matrix.map((row) => [...row]);
			newMatrix[i][j] = "#";

			const guardAfterSimulation = simulateGuardMovement(guardClone, newMatrix);
			if (guardAfterSimulation) {
				possibleObstructions.push([i, j]);
			}
		}
	}
	console.log(possibleObstructions.length);
};

main();
