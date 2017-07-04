// Fixed ReactJSX
var reactJsxTransformPlugin = require('babel-plugin-transform-react-jsx');
var parse = require("babylon").parse;
var template = require("babel-template");

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
var _Symbol = require("babel-runtime/core-js/symbol")["default"];
var buildWeactClass = template(`
  CLASS_NAME = RNPlus ? RNPlus.register(CLASS_NAME, CLASS_NAME_STR, IS_INNER) : CLASS_NAME;
`);
var buildSuperApply = template(`
  super(...arguments);
`);

module.exports = function(babel) {
    var VISITED = _Symbol();
    var t = babel.types;

    var subVisitor = {
        CallExpression(path) {
            var node = path.node;

            if(!t.isSuper(node.callee)) return;
            if(node.arguments.length===1 && t.isSpreadElement(node.arguments[0])) return;

            path.replaceWith(buildSuperApply());
        }
    };

    var visitor = {
        ClassDeclaration: function(path) {
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

                path.traverse(subVisitor);

                node[VISITED] = true;
            }
        },
    };

    return {
        visitor: visitor
    }
};