/*
 * Copyright (c) 2015 xsbchen
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');
var _ = require('lodash');
var path = require('path');

var templateCache = {};
var reTemplate = /template\(\s*['"](\S+?)['"]\s*,\s*['"](\S+?)['"]\s*\)/g;

function Tplinc(options) {
    this.options = _.extend({trim: /[\r\n\t]/g, wrapper: "'"}, options);
}

Tplinc.prototype.process = function (filePath, content) {
    var options = this.options;
    return content.replace(reTemplate, function (match, tplFile, tplName) {
        var tplContent = _getTemplate(path.join(path.dirname(filePath), tplFile), tplName);

        tplContent = tplContent.replace(options.trim, '').replace(new RegExp(options.wrapper, 'g'), '\\' + options.wrapper);
        return [options.wrapper, tplContent, options.wrapper].join('');
    });
};

function _parseTemplate(filePath) {
    if (!fs.statSync(filePath).isFile()) {
        return null;
    }

    var templateContent = fs.readFileSync(filePath).toString();
    var tplRegexp = /<template[^>]*name=['"]([\S]*?)['"][^>]*>([\s\S]*?)<\/template>/ig;
    var tplMatch;
    var tplCount = 0;
    var result = {};

    while (tplMatch = tplRegexp.exec(templateContent)) {
        result[tplMatch[1]] = tplMatch[2];
        tplCount++;
    }

    // 处理默认值
    if (tplCount === 0) {
        result['default'] = templateContent;
    }

    return result;
}

function _getTemplate(tplFile, tplName) {
    if (!templateCache[tplFile]) {
        templateCache[tplFile] = _parseTemplate(tplFile) || {};
    }

    var result = templateCache[tplFile][tplName];
    return typeof result === 'undefined' ? '' : result;
}