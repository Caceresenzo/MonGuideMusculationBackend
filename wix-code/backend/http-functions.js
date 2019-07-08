import { ok, badRequest } from 'wix-http-functions';
import wixData from 'wix-data';
import nodemailer from "nodemailer";

// URL to call this HTTP function from your published site looks like: 
// Premium site - https://mysite.com/_functions/example/multiply?leftOperand=3&rightOperand=4
// Free site - https://username.wixsite.com/mysite/_functions/example/multiply?leftOperand=3&rightOperand=4

// URL to test this HTTP function from your saved site looks like:
// Premium site - https://mysite.com/_functions-dev/example/multiply?leftOperand=3&rightOperand=4
// Free site - https://username.wixsite.com/mysite/_functions-dev/example/multiply?leftOperand=3&rightOperand=4

export async function get_test(request) {
	const response = {
		"headers": {
			"Content-Type": "application/json"
		},
		"body": {
			"ok": "ok",
		}
	};

	await wixData.insert("Programme-Musculation-Exercices", {
			"parent": "619bb6a7-928a-4ee3-b0bb-b845ca374262",
			"exercise": "829f409a-55ef-4ddd-b9a3-be7b705f0def",
			"series": 4,
			"repetitions": 5,
			"weight": 6,
		})
		.then((results) => {
			let item = results; //see item below
			response.body.results = item;
		})
		.catch((err) => {
			let errorMsg = err;
			response.body.error = errorMsg;
		});

	return ok(response);
}

export function get_example(request) {
	const response = {
		"headers": {
			"Content-Type": "application/json"
		}
	};

	// Get operation from the request path
	const operation = request.path[0]; // "multiply"
	const leftOperand = parseInt(request.query["leftOperand"], 10); // 3
	const rightOperand = parseInt(request.query["rightOperand"], 10); // 4

	// Perform the requested operation and return an OK response
	// with the answer in the response body
	switch (operation) {
	case 'add':
		response.body = {
			"sum": leftOperand + rightOperand
		};
		return ok(response);
	case 'multiply':
		response.body = {
			"product": leftOperand * rightOperand
		};
		return ok(response);
	default:
		// If the requested operation was not found, return a Bad Request
		// response with an error message in the response body
		response.body = {
			"error": "unknown operation"
		};
		return badRequest(response);
	}
}

export async function get_exercices(request) {
	const response = {
		"headers": {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		"body": {
			"simplified": false,
			"payload": {},
			"error": null,
			"date": new Date().getTime()
		}
	};

	let payload = {
		"exercises": {
			"list": {},
			"types": {},
		},
		"muscles": {},
	};

	const simplified = response.body.simplified = "simplify" in (request.query || {});
	const simplifiable = function (object) {
		return simplified ? null : object;
	}

	await wixData.query("Muscle")
		.limit(1000)
		.find()
		.then((results) => {
			let muscles = {};

			for (let item of results.items) {
				muscles[item._id] = {
					"key": item.key,
					"title": item.title,
					"icon": simplifiable(item.icon),
				};
			}

			payload.muscles = muscles;
		})
		.catch((error) => {
			response.body.error = error;
		});

	await wixData.query("Exercice-Type")
		.limit(1000)
		.find()
		.then((results) => {
			let types = {};

			for (let item of results.items) {
				types[item._id] = {
					"key": item.key,
					"title": item.title,
				};
			}

			payload.exercises.types = types;
		})
		.catch((error) => {
			response.body.error = error;
		});

	await wixData.query("Exercices")
		.limit(1000)
		.find()
		.then((results) => {
			let list = {};

			let correspondingMuscle = function (_id) {
				let muscle = payload.muscles[_id];

				return muscle ? muscle.key : null;
			};

			let correspondingType = function (_id) {
				let type = payload.exercises.types[_id];

				return type ? type.key : null;
			};

			for (let item of results.items) {
				list[item._id] = {
					"key": item.key,
					"title": item.title,
					"muscle": correspondingMuscle(item.muscle),
					"type": correspondingType(item.type),
					"short_description": item.short_description,
					"rich_description": simplifiable(item.description),
					"picture": simplifiable(item.picture),
				};
			}

			payload.exercises.list = list;
		})
		.catch((error) => {
			response.body.error = error;
		});

	response.body.payload = payload;

	if (response.body.error) {
		response.body.error = response.body.error.stack;
		return badRequest(response);
	}

	return ok(response);
}

export async function get_program(request) {
	const response = {
		"headers": {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		"body": {
			"payload": {},
			"error": null,
			"date": new Date().getTime()
		}
	};

	if ((request.path || []).length > 0) {
		let token = request.path[0];

		let payload = {
			"program": {},
			"exercises": [],
		};

		await wixData.query("Programme-Musculation")
			.limit(1)
			.eq("token", token)
			.find()
			.then((results) => {
				let program = results.items[0];

				if (program === undefined) {
					throw new Error("No corresponding parent by this token.");
				}

				payload.program = {
					"_id": program._id,
					"created_date": program._createdDate,
					"token": program.token,
					"target": program.target,
				};
			})
			.catch((error) => {
				response.body.error = error;
			});

		let exerciseKeys = {};
		if (!response.body.error) {
			await wixData.query("Exercices")
				.limit(1000)
				.find()
				.then((results) => {
					for (let item of results.items) {
						exerciseKeys[item._id] = {
							"key": item.key,
						};
					}
				})
				.catch((error) => {
					response.body.error = error;
				});
		}

		if (!response.body.error) {
			await wixData.query("Programme-Musculation-Exercices")
				.limit(1000)
				.eq("parent", payload.program._id)
				.find()
				.then((results) => {
					let exercises = [];

					for (let item of (results.items || [])) {
						let exerciseKey = exerciseKeys[item.exercise];

						if (exerciseKey) {
							exercises.push({
								"exercise": exerciseKey,
								"series": parseInt(item.series, 10),
								"repetitions": parseInt(item.repetitions, 10),
								"weight": parseInt(item.weight, 10),
								"redactor_id": item.redactor_id,
							});
						}
					}

					payload.exercises = exercises.reverse();
				})
				.catch((error) => {
					response.body.error = error;
				});
		}

		response.body.payload = payload;
	} else {
		response.body.error = new Error("Token is missing.");
	}

	if (response.body.error) {
		response.body.error = response.body.error.stack;
		return badRequest(response);
	}

	return ok(response);
}