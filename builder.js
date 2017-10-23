const
	fs = require('fs'),
	requirejs = require('requirejs'),
	config = require('./config'),
	Promise = require('promise'),
	dirForBuild = 'build/';

module.exports = class NemoFrontEndMaker {
	constructor () {
		this.build();
	}

	build() {
		var promises = [],
			self = this;

		if (!fs.existsSync(dirForBuild)){
			fs.mkdirSync(dirForBuild);
		}

		if (config.templates) {
			promises.push(this.templates(config.templates));
		}

		if (config.languages) {
			promises.push(this.languages(config.languages));
		}

		Promise.all(promises).then(function () {
			self.optimizerStart();
		});
	}

	templates(paths) {
		var alias = config.alias;

		if (!fs.existsSync(dirForBuild + 'html/')){
			fs.mkdirSync(dirForBuild + 'html/');
		}

		var promise = Promise.all(
			paths.map(function (template) {

				return new Promise(function (resolve) {
					fs.readFile(alias[template] + '.html', 'utf-8', function (err, content) {
						var newContent = 'define([],function () {return \'' + content.replace(/[']/gm, "\\'").replace(/(\n)|(\r\n)/gm, "") + '\';});';

						fs.writeFile(dirForBuild + alias[template] + '.js', newContent, function (err) {
							if (!err) {
								resolve('template' + template + 'done');
							}
						});
					});
				});
		})).then(
			function (results) { console.log("Templates pack created") }
		);

		return promise;
	}

	languages(langs) {
		if (!fs.existsSync(dirForBuild + 'i18n/')){
			fs.mkdirSync(dirForBuild + 'i18n/');
		}

		return Promise.all(
			langs.map(function (lang) {
				if (!fs.existsSync(dirForBuild + 'i18n/' + lang)){
					fs.mkdirSync(dirForBuild + 'i18n/' + lang);
				}

				return Promise.all(
					fs.readdirSync('i18n/' + lang).map(function (file) {
						return new Promise(function (resolve) {
							fs.readFile('i18n/' + lang + '/' + file, function (err, content) {
								fs.writeFileSync('build/i18n/' + lang + '/' + file.replace('json', 'js'), 'define([],function () {return ' + content + '});');
								resolve('lang/' + file + 'done');
							})
						});
					})
				);

			})
		).then(
			function (result) { console.log("Language pack created") }
		);
	}

	optimizerStart() {
		var configAsString = JSON.stringify(config);

		console.log('Requirejs optimizer starting...');

		config.languages.map(function (lang) {
			var configAsJson = JSON.parse(configAsString.replace(/\[%-lang-%\]/gm, lang));

			console.log('Starting ' + lang);
			requirejs.optimize(configAsJson, function () {
				console.log('Package for ' + lang + ' was successfully built');
			});
		});
	}
};