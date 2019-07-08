// For full API documentation, including code examples, visit http://wix.to/94BuAAs

import { fetch } from 'wix-fetch';
import { BodyBuildingApiResponse } from 'public/exercises.js'
import { processExerciseRedactorTransaction, hello } from 'backend/exercise-redactor.jsw'

const DEBUG = false;

let itemDropdowns = [];
let bodyBuildingApiResponse;
let exercisesDropdownOptions;
let exerciseItemIncrementer = 0;
let sending = false;
let items = DEBUG ? [{
	"_id": "-1",
	"exercise": "tractions",
	"series": 10,
	"repetitions": 20,
	"weight": 30
}] : [];

let dropdownSettings = {
	"placeholder": {
		"choose": "Choisir un exercice",
		"loading": "Chargement en cours...",
	}
};

function onBodyBuildingApiResponseReceived(response) {
	bodyBuildingApiResponse = response;

	$w("#sendButton").enable();

	exercisesDropdownOptions = [];

	for (let exercise of bodyBuildingApiResponse.exercises) {
		console.log("Added exercise: " + exercise.key);

		exercisesDropdownOptions.push({
			"value": exercise.key,
			"label": exercise.title,
		});
	}

	for (let dropdown of itemDropdowns) {
		applyDropdownPlaceholder(dropdown, true);
		applyDropdownOptions(dropdown);
	}
}

function registerDropdown(dropdown) {
	let hasLoaded = exercisesDropdownOptions != undefined;

	applyDropdownPlaceholder(dropdown, hasLoaded);

	if (hasLoaded) {
		applyDropdownOptions(dropdown);
	} else {
		itemDropdowns.push(dropdown);
	}
}

function applyDropdownPlaceholder(dropdown, hasLoaded) {
	let placeholder = hasLoaded ? dropdownSettings.placeholder.choose : dropdownSettings.placeholder.loading;

	dropdown.placeholder = placeholder;
}

function applyDropdownOptions(dropdown) {
	dropdown.options = exercisesDropdownOptions;
}

function createEmptyExerciseItem() {
	return {
		"_id": "".concat(exerciseItemIncrementer++),
		"exercise": null,
		"series": 1,
		"repetitions": 1,
		"weight": 0
	};
}

function removeExerciseItemById(id) {
	let item = getExerciseItemById(id);

	if (item != null) {
		items.splice(items.indexOf(item), 1);
		$w("#exerciseRepeater").data = items;
	} else {
		console.log("targetItem is null.");
	}
}

function getExerciseItemById(id) {
	for (let item of items) {
		if (item._id === id) {
			return item;
		}
	}

	return null;
}

function refreshItems() {
	$w("#exerciseRepeater").data = items;
}

$w.onReady(function () {
	hello().then((result) => {
		console.log(result);
	})

	fetch("https://www.monguidemusculation.com/_functions-dev/exercices?simplify", { "method": "get" })
		.then((httpResponse) => {
			if (httpResponse.ok) {
				return httpResponse.json();
			}

			return Promise.reject("Fetch did not succeed");
		})
		.then((json) => {
			if (json.error) {
				return Promise.reject("API returned an error: " + json.error);
			}

			return json.payload;
		})
		.then((payload) => {
			onBodyBuildingApiResponseReceived(BodyBuildingApiResponse.fromJson(payload));

			console.log(bodyBuildingApiResponse);
		})
		.catch(err => console.log(err));

	$w("#addExerciseButton").onClick((event) => {
		items.push(createEmptyExerciseItem());
		refreshItems();
	});

	$w("#exerciseRepeater").onItemReady(($item, itemData, index) => {
		const finalItemData = itemData;

		let binds = [{
				"id": "itemSeriesInput",
				"property": "series"
			},
			{
				"id": "itemRepetitionsInput",
				"property": "repetitions"
			},
			{
				"id": "itemWeightInput",
				"property": "weight"
			}
		]

		for (let bind of binds) {
			$item("#" + bind.id).value = itemData[bind.property];

			$item("#" + bind.id).onChange((event, $w) => {
				console.log("id: " + finalItemData._id + "       new value: " + event.target.value);
				finalItemData[bind.property] = event.target.value;
			});
		}

		$item("#itemDeleteButton").onClick((event) => {
			removeExerciseItemById(finalItemData._id);
			//console.log(finalItemData._id)
		});

		$item("#itemExerciseDropdown").onChange((event, $w) => {
			console.log(event.target.value);
			finalItemData.exercise = event.target.value;
		});

		registerDropdown($item("#itemExerciseDropdown"));
	});

	$w("#exerciseRepeater").data = items;

	$w("#sendButton").onClick((event) => {
		sending = true;

		processExerciseRedactorTransaction(bodyBuildingApiResponse.getSimplifiedExercises(), $w("#targetEmailInput").value, items, $w("#extraMessageTextBox").value)
			.then((results) => {
				console.log(results);
				output("SENDING RESULT: " + results);
				sending = false;
			}).catch((error) => {
				console.error(error);
				output("SENDING ERROR: " + error);
				sending = false;
			});
		/*processExerciseRedactorTransaction(bodyBuildingApiResponse.exercises, $w("#targetEmailInput").value, items, $w("#extraMessageTextBox").value)
			.then((results) => {
				console.log(results);
			}).catch((error) => {
				console.error(error);
			});*/
	});

	let oldSendingFlag = sending;
	setInterval(function () {
		if (oldSendingFlag != sending) {
			$w("#sendButton")[sending ? "disable" : "enable"]();

			oldSendingFlag = sending;
		}

		// dump();
	}, 50);
});

function dump() {
	//console.log($w("#exerciseRepeater").data)

	let message = "LOCAL == STORED: " + (items == $w("#exerciseRepeater").data) + "\n";

	for (let item of items) {
		message += "------------------------- ID: " + item._id + "\n";
		message += "EXERCICE    : " + item.exercise + "\n";
		message += "SERIE       : " + item.series + "\n";
		message += "REPETITIONS : " + item.repetitions + "\n";
		message += "POIDS       : " + item.weight + "\n";
	}

	output(message);
}

function output(message) {
	$w("#outputTextBox").text = "DATE: " + new Date().getTime() + "\n" + message;
}