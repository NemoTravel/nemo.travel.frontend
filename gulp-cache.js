var through = require('through2'),
    jsesc = require('jsesc'),
    gutil = require('gulp-util'),
    File = gutil.File;

/**
 *
 * @param fileName
 * @param removeFromPath
 */
module.exports = function (fileName, removeFromPath) {

    var codeLines = [],
        varName = 'cache';

    function wrap(code) {

        var begin = ['\'use strict\';', 'define([], function () {', 'var ' + varName + ' = {};'].join('\n'),
            end = ['return ' + varName, '});'].join('\n');

        return [begin, code, end].join('\n');
    }

    function bufferContents(file, enc, cb) {

        var path = file.path.replace(removeFromPath, ''),
            data = jsesc(file.contents.toString('utf8'));

        codeLines.push(varName + '["' + path + '"] = \'' + data + '\';');

        cb();
    }

    function endContents(cb) {

        var file = new File({
            path: fileName,
            contents: new Buffer(wrap(codeLines.join('\n')))
        });

        this.push(file);

        cb();
    }


    return through.obj(bufferContents, endContents);
};
