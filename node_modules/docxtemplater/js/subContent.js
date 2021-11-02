"use strict";
// This class responsibility is to deal with parts of the document

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Errors = require("./errors");

function substr(baseText, start, length) {
	var text = "";
	for (var i = start; i < start + length; i++) {
		text += baseText[i];
	}
	return text;
}

module.exports = function () {
	function SubContent(fullText) {
		_classCallCheck(this, SubContent);

		this.fullText = fullText || "";
		this.text = "";
		this.start = 0;
		this.end = 0;
	}

	_createClass(SubContent, [{
		key: "getInnerLoop",
		value: function getInnerLoop(templaterState) {
			this.start = templaterState.calcEndTag(templaterState.loopOpen);
			this.end = templaterState.calcStartTag(templaterState.loopClose);
			return this.refreshText();
		}
	}, {
		key: "getOuterLoop",
		value: function getOuterLoop(templaterState) {
			this.start = templaterState.calcStartTag(templaterState.loopOpen);
			this.end = templaterState.calcEndTag(templaterState.loopClose);
			return this.refreshText();
		}
	}, {
		key: "getInnerTag",
		value: function getInnerTag(templaterState) {
			this.start = templaterState.calcPosition(templaterState.tagStart);
			this.end = templaterState.calcPosition(templaterState.tagEnd) + 1;
			return this.refreshText();
		}
	}, {
		key: "refreshText",
		value: function refreshText() {
			// substr leaks memory on v8 for very long strings, that's why we use a custom function for this
			this.text = substr(this.fullText, this.start, this.end - this.start);
			return this;
		}
	}, {
		key: "getErrorProps",
		value: function getErrorProps(xmlTag) {
			return {
				xmlTag: xmlTag,
				text: this.fullText,
				start: this.start,
				previousEnd: this.end
			};
		}
	}, {
		key: "getOuterXml",
		value: function getOuterXml(xmlTag) {
			var endCandidate = this.fullText.indexOf("</" + xmlTag + ">", this.end);
			var err;
			var startCandiate = Math.max(this.fullText.lastIndexOf("<" + xmlTag + ">", this.start), this.fullText.lastIndexOf("<" + xmlTag + " ", this.start));
			if (endCandidate === -1) {
				err = new Errors.XTTemplateError("Can't find endTag");
				err.properties = this.getErrorProps(xmlTag);
				throw err;
			}
			if (startCandiate === -1) {
				err = new Errors.XTTemplateError("Can't find startTag");
				err.properties = this.getErrorProps(xmlTag);
				throw err;
			}
			this.end = endCandidate + ("</" + xmlTag + ">").length;
			this.start = startCandiate;
			return this.refreshText();
		}
	}, {
		key: "replace",
		value: function replace(newText) {
			this.fullText = this.fullText.substr(0, this.start) + newText + this.fullText.substr(this.end);
			this.end = this.start + newText.length;
			return this.refreshText();
		}
	}]);

	return SubContent;
}();