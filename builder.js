const
	fs = require('fs'),
	requirejs = require('requirejs'),
	config = require('./config'),
	dirForBuild = 'build/';

module.exports = class NemoFrontEndMaker {
	constructor () {
		this.defaultLanguage = config.defaultLanguage ? config.defaultLanguage : config.languages[0];

		this.build();
	}

	build() {

		if (!fs.existsSync(dirForBuild)){
			fs.mkdirSync(dirForBuild);
		}

		this.templates(config.templates);

		this.languages([this.defaultLanguage]);

		this.languages(config.languages);

		this.optimizerStart();
	}

	templates(paths) {
		var alias = config.alias;

		if (!fs.existsSync(dirForBuild + 'html/')){
			fs.mkdirSync(dirForBuild + 'html/');
		}


		paths.map(function (template) {
			var content = fs.readFileSync(alias[template] + '.html', 'utf-8'),
				newContent = 'define([],function () {return \'' + content.replace(/[']/gm, "\\'").replace(/(\n)|(\r\n)/gm, "") + '\';});';

			fs.writeFileSync(dirForBuild + alias[template] + '.js', newContent);
		});
	}

	languages(langs) {
		if (!fs.existsSync(dirForBuild + 'i18n/')){
			fs.mkdirSync(dirForBuild + 'i18n/');
		}

		langs.map(function (lang) {
			if (!fs.existsSync(dirForBuild + 'i18n/' + lang)){
				fs.mkdirSync(dirForBuild + 'i18n/' + lang);
			}

			fs.readdirSync('i18n/' + lang).map(function (file) {
				var content = fs.readFileSync('i18n/' + lang + '/' + file);

				fs.writeFileSync('build/i18n/' + lang + '/' + file.replace('json', 'js'), 'define([],function () {return ' + content + '});');
			})
		})
	}

	optimizerStart() {
		var configAsString = JSON.stringify(config),
			self = this;

		console.log('Requirejs optimizer starting...');

		config.languages.map(function (lang) {
			var configAsJson = JSON.parse(configAsString.replace(/\[%-lang-%\]/gm, lang));

			console.log('Starting ' + lang);
			if (!self.checkDependencies(lang)) {
				requirejs.optimize(configAsJson, function () {
					console.log('Package for ' + lang + ' was successfully built');
				});
			}
			else {
				console.error("Skipped " + lang);
			}
		});
	}

	checkDependencies(lang) {
		var dependencies = config.paths,
			errors = false;

		for (var path in dependencies) {
			if (dependencies.hasOwnProperty(path)) {
				var file = dependencies[path].replace('[%-lang-%]', lang);

				if (!fs.existsSync(file + '.js')) {
					if (file.indexOf('/i18n/') >= 0) {
						var contentFromDefault = fs.readFileSync(dependencies[path].replace('[%-lang-%]', this.defaultLanguage) + '.js', 'utf-8');

						fs.writeFileSync(file + '.js', contentFromDefault);
						console.warn(lang + " language dont exist `" + file + "` file. Copied from " + this.defaultLanguage);
					}
					else {
						console.warn(lang + " language dont exist `" + file + "` file");
						errors = true;
					}
				}
			}
		}

		return errors;
	}
};

