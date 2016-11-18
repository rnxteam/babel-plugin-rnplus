// Fixed ReactJSX
var reactJsxTransformPlugin = require('babel-plugin-transform-react-jsx');
var parse = require("babylon").parse;

reactJsxTransformPlugin.__esModule = true;
reactJsxTransformPlugin["default"] = function (_ref) {
    var t = _ref.types;
    var res = reactJsxTransformPlugin(_ref);
    var ProgramFn = res.visitor.Program;
    res.visitor.Program = function (path, state) {
        state.opts.pragma = '(this && this.createElement || React.createElement)';
        ProgramFn(path, state);
        state.set("jsxIdentifier", function () {
            var ast = parse('this && this.createElement || React.createElement');
            return ast.program.body[0].expression;
        });
    };
    return res;
}

// Fixed Class
var classPropertiresTransformPlugin = require('babel-plugin-transform-class-properties');
var _Symbol = require("babel-runtime/core-js/symbol")["default"];
var buildWeactClass = require("babel-template")(`
  CLASS_NAME = RNPlus ? RNPlus.register(CLASS_NAME, CLASS_NAME_STR, IS_INNER) : CLASS_NAME;
`);

classPropertiresTransformPlugin.__esModule = true;
classPropertiresTransformPlugin["default"] = function (_ref) {
    var VISITED = _Symbol();
    var t = _ref.types;
    var res = classPropertiresTransformPlugin(_ref);
    var ClassFn = res.visitor.Class;

    res.visitor.Class = function (path, state) {
        var node = path.node;

        if (node.id && !node[VISITED]) {
            var name = node.id.name;
            var superClass = node.superClass;

            if (superClass && superClass.name) {
                var superClassName = superClass.name;

                if (superClassName  === 'PView' || superClassName === 'PComponent') {
                    path.insertAfter(buildWeactClass({
                        CLASS_NAME: t.identifier(name),
                        CLASS_NAME_STR: t.stringLiteral(name),
                        IS_INNER: t.booleanLiteral(false)
                    }));
                } else if (superClassName === '__PView' || superClassName === '__PComponent') {
                    path.insertAfter(buildWeactClass({
                        CLASS_NAME: t.identifier(name),
                        CLASS_NAME_STR: t.stringLiteral(name),
                        IS_INNER: t.booleanLiteral(true)
                    }));
                }
            }
            node[VISITED] = true;
        }

        ClassFn(path, state);
    };
    return res;
}

module.exports = {};