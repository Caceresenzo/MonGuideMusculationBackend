// Filename: public/exercises.js 
//
// Code written in public files is shared by your site's
// Backend, page code, and site code environments.
//
// Use public files to hold utility functions that can 
// be called from multiple locations in your site's code.

export function add(param1, param2) {
	return param1 + param2;
}

export class BodyBuildingExercise {
	constructor(_id, key, title, type, muscle, shortDescription, richDescription) {
		this._id = _id;
		this.key = key;
		this.title = title;
		this.type = type;
		this.muscle = muscle;
		this.shortDescription = shortDescription;
		this.richDescription = richDescription;

		this.type.exercises.push(this);
		this.muscle.exercises.push(this);
	}

	toJson() {
		return {
			"_id": this._id,
			"key": this.key,
			"title": this.title,
			"type": this.type.toJson(),
			"muscle": this.muscle.toJson(),
			"shortDescription": this.shortDescription,
			"richDescription": this.richDescription,
		};
	}

	static fromJson(json, type, muscle, _id) {
		return new BodyBuildingExercise(_id, json.key, json.title, type, muscle, json.short_description, json.rich_description);
	}
}

export class BodyBuildingExerciseType {
	constructor(key, title) {
		this.key = key;
		this.title = title;
		this.exercises = [];
	}

	toJson() {
		return {
			"key": this.key,
			"title": this.title,
		};
	}

	static fromJson(json) {
		return new BodyBuildingExerciseType(json.key, json.title);
	}
}

export class BodyBuildingMuscle {
	constructor(key, title) {
		this.key = key;
		this.title = title;
		this.exercises = [];
	}

	toJson() {
		return {
			"key": this.key,
			"title": this.title,
		};
	}

	static fromJson(json) {
		return new BodyBuildingMuscle(json.key, json.title);
	}
}

export class BodyBuildingApiResponse {
	constructor(exercices, types, muscle) {
		this.exercises = exercices;
		this.types = types;
		this.muscle = muscle;
	}

	getSimplifiedExercises() {
		let list = [];

		for (let exercise of this.exercises) {
			list.push(exercise.toJson());
		}

		return list;
	}

	static fromJson(json) {
        let exercices = [];
        let exerciceTypes = [];
        let muscles = [];

		let typesMap = {};
		let musclesMap = {};

		localJsonMapForEach(json.exercises.types, (key, value) => {
			let exerciseType = BodyBuildingExerciseType.fromJson(value);

			typesMap[exerciseType.key] = exerciseType;
			exerciceTypes.push(exerciseType);
		});

		localJsonMapForEach(json.muscles, (key, value) => {
			let muscle = BodyBuildingMuscle.fromJson(value);

			musclesMap[muscle.key] = muscle;
			muscles.push(muscle);
		});

		localJsonMapForEach(json.exercises.list, (key, value) => {
			let exersiseType = typesMap[value["type"]];
			let muscle = musclesMap[value["muscle"]];

            exercices.push(BodyBuildingExercise.fromJson(value, exersiseType, muscle, key));
		});

		return new BodyBuildingApiResponse(exercices, exerciceTypes, muscles);
	}
}

// The following code demonstrates how to call the add
// function from your site's page code or site code.

/* 
import {add} from 'public/exercises.js'

$w.onReady(function () {	
    let sum = add(6,7);
    console.log(sum);
});
*/

//The following code demonstrates how to call the add 
//function in one of your site's backend files.

/* 
import {add} from 'public/exercises.js'

export function usingFunctionFromPublic(a, b) {
	return add(a,b);
}
*/

function localJsonMapForEach(map, callback) {
	for (let key in map) {
		callback(key, map[key]);
	}
}