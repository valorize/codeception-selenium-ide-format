/**
 * Parse source and update TestCase. Throw an exception if any error occurs.
 *
 * @param testCase TestCase to update
 * @param source The source to parse
 */
function parse(testCase, source) {
	var doc = source;
  var commands = [];
  testCase.header = this.options.header;
  testCase.footer = '';
  while (doc.length > 0) {
    var line = /(.*)(\r\n|[\r\n])?/.exec(doc);
    if (line[1] && line[1].match(/^\|/)) {
      var array = line[1].split(/\|/);
      if (array.length >= 3) {
        var command = new Command();
        command.command = array[1];
        command.target = array[2];
        if (array.length > 3) command.value = array[3];
        commands.push(command);
      }
      testCase.footer = '';
    } else if (commands.length == 0) {
      testCase.header += line[0];
    } else {
      testCase.footer += line[0];
    }
    doc = doc.substr(line[0].length);
  }
  testCase.setCommands(commands);
}

/**
 * Format TestCase and return the source.
 *
 * @param testCase TestCase to format
 * @param name The name of the test case, if any. It may be used to embed title into the source.
 */
function format(testCase, name) {
  

  var className = testCase.getTitle();
  if (!className) {
    className = "perform actions and see result";
  }

  var content = formatCommands(testCase.commands);

 /* var formatLocal = testCase.formatLocal(this.name);
  methodName = testMethodName(className.replace(/Test$/, "").replace(/^Test/, "").
                replace(/^[A-Z]/, function(str) { return str.toLowerCase(); }));*/

    var cept = options.header.
    replace(/\$\{baseURL\}/g, testCase.getBaseURL()).
    replace(/\$\{action\}/g, className).
    replace(/\$\{content\}/g, content).
    replace(/\$\{([a-zA-Z0-9_]+)\}/g, function(str, name) { return options[name]; });

  return cept;

}

/**
 * Format an array of commands to the snippet of source.
 * Used to copy the source into the clipboard.
 *
 * @param commands
 * @param indent
 */
function formatCommands(commands, indent) {
    indent = indent | 0;

    var result = '';
    var ignoreWebCommands = ['answerOnNextPrompt'];

    for (var i = 0; i < commands.length; i++) {
        var command = commands[i];
        var tmpResult = formatCommand(command, indent);

        if (ignoreWebCommands.indexOf(command.command) == -1) {
            result += indents(indent) + options.variable + tmpResult;
        }
    }

    return result;
}

//Store temp value for prompt
var promptValue = "";
/**
 * Format a command to the snippet of source.
 * Used to copy the source into the clipboard.
 *
 * @param command
 * @param indent
 * @returns {string}
 */
function formatCommand(command, indent) {
    indent = indent | 0;
    var result = "";
    var value;

    if (command.type == 'command') {

        // Convert command to Codeception WebDriver command
        switch (command.command) {
            case 'open':
                result += '->amOnPage("' + command.target + '");\n';
                break;

            case 'click':
            case 'clickAndWait':
                result += '->click("' + getSelector(command.target) + '");\n';

                if(command.target.indexOf("-modal-button") > -1)
                {
                    result += options.variable + '->waitForJS("return window.modal_loaded;", 10);\n';
                }
                break;

            case 'select':
                value = command.value.split('=')[1];
                result += '->selectOption("' + getSelector(command.target) + '", "' + value + '");\n';
                break;

            case 'sendKeys':
                result += '->appendField("' + getSelector(command.target) + '", "' + command.value + '");\n';
                break;

            case 'type':
                result += '->fillField("' + getSelector(command.target) + '", "' + command.value + '");\n';
                break;

            case 'dragAndDropToObject':
                result += '->dragAndDrop("' + getSelector(command.target) + '", "' + getSelector(command.value) + '");\n';
                break;

            case 'verifyText':
            case 'assertText':
                if (command.target.substring(0, 4) === 'link') {
                    result += '->see("' + command.value + '");\n';
                } else {
                    result += '->see("' + command.value + '", "' + getSelector(command.target) + '");\n';
                }
                break;

            case 'verifyNotText':
            case 'assertNotText':
                result += '->dontSee("' + command.value + '", "' + getSelector(command.target) + '");\n';
                break;

            case 'waitForText':
            case 'waitForTextPresent':
                result += '->waitForText("'+ command.value + '",' + 10 + getSelectorAsStringParameter(command.target) + ');\n';
                break;

            case 'assertTextNotPresent':
                result += '->dontSee("'+ command.value+'"' + getSelectorAsStringParameter(command.target) + ');\n';
                break;

            case 'addSelection':
                value = command.value.split('=')[1];
                result += '->appendField("' + getSelector(command.target) + '", "'+ value+'");\n';
                break;

            case 'removeSelection':
                value = command.value.split('=')[1];
                result += '->unselectOption("' + getSelector(command.target) + '", "'+ value+'");\n';
                break;

            case 'verifyValue':
            case 'assertValue':
                value = command.value.replace('exact:', '');
                result += '->seeInField("' + getSelector(command.target) + '", "'+ value +'");\n';
                break;

            case 'verifyChecked':
                value = command.value.replace('exact:', '');
                result += '->seeCheckboxIsChecked("' + getSelector(command.target) + '");\n';
                break;

            case 'verifySelectedValue':
            case 'verifySelectedLabel':
                result += '->seeOptionIsSelected("' + getSelector(command.target) + '", "'+ command.value+'");\n';
                break;

            case 'waitForVisible':
                result += '->waitForElementVisible("' + getSelector(command.target) + '");\n';
                break;

            case 'waitForNotVisible':
                result += '->waitForElementNotVisible("' + getSelector(command.target) + '");\n';
                break;

            case 'verifyElementNotPresent':
                //Throws value undefined error if no target is given, selenium ide bug
                result += '->dontSeeElement("'+ command.value +'");\n';
                break;

            case 'answerOnNextPrompt':
                promptValue = command.target;
                break;

            case 'assertPrompt':
                result += '->typeInPopup("'+promptValue+'");\n';
                promptValue = '';
                break;

            case 'setSpeed':
                result += '->wait(' + command.value + ');\n';
                break;

            case 'waitForSpeed':
                result += '->wait(2);\n';
                promptValue = '';
                break;

            case 'refresh':
                result += '->reloadPage();\n';
                break;

            case 'selectWindow':
                if (command.target == 'null') {
                    result += '->switchToWindow();\n';
                } else {
                    result += '->switchToWindow("' + command.target + '");\n';
                }
                break;

            case 'selectFrame':
                if (command.target == 'null') {
                    result += '->switchToIFrame();\n';
                } else {
                    result += '->switchToIFrame("' + command.target + '");\n';
                }
                break;

            case 'assertSelectedLabel':
                result += '->seeOptionIsSelected("' + getSelector(command.target) + '", "' + command.value + '");\n';
                break;

            case 'assertConfirmation':
                result += '->seeInPopup("' + command.target + '");\n';
                break;

            case 'chooseOkOnNextConfirmation':
                result += '->acceptPopup();\n';
                break;

            case 'chooseCancelOnNextConfirmation':
                result += '->cancelPopup();\n';
                break;

            case 'fireEvent':
                switch(command.value){
                    case 'blur':
                        result += '->executeJS("$("' + getSelector(command.target) + '").blur()");\n';
                        break;
                }
                break;

            case 'assertChecked':
                result += '->seeCheckboxIsChecked("' + getSelector(command.target) + '");\n';
                break;

            case 'mouseOver':
                result += '->moveMouseOver("' + getSelector(command.target) + '");\n';
                break;

            case 'waitForElementPresent':
                result += '->waitForElementVisible("' + getSelector(command.target) + '");\n';
                break;

            case 'selectAndWait':
                result += '->selectOption("' + getSelector(command.target) + '", "'+ command.value + '");\n';
                break;

            case 'assertElementPresent':
                result += '->seeElement("' + getSelector(command.target) + '");\n';
                break;

            default:
                result += '->wantToTest("UNCONVERTED COMMAND: ' + command.command + '====' + command.target + '|' + command.value + '|")';
                break;
        }
    }

    return result;
}

/**
 *
 * @param value
 * @returns {void|XML|string}
 */
function escapeString(value)
{
  return value.replace(/"/g, '\\"');
}

/**
 * Get selector from target as parameter string
 *
 * @param target
 * @param encaseChar
 * @returns {string}
 */
function getSelectorAsStringParameter(target, encaseChar) {
    encaseChar = encaseChar | '"';

    if (target) {
        return ', ' + encaseChar + getSelector(command.target) + encaseChar;
    }

    return '';
}

/**
 * Extract selector from target parameter
 *
 * @param target
 * @returns {*}
 */
function getSelector(target) {

    // Check for xpath
    if (target.substring(0, 2) === '//') {
        return target;
    }

    var parts = target.split(/=(.+)?/);
    parts[1] = escapeString(parts[1]);

    switch(parts[0]) {
        case 'id':
            return "#"+parts[1];

        case 'css':
            return parts[1];

        case 'name':
            return 'input[name='+parts[1]+']';

        case 'link':
            return parts[1];

        case 'xpath':
            return parts[1];
        default:
            alert('unknown selector: '+parts[0]+'  value: '+parts[1]);
            break;
    }

    return null;
}

/**
 * Returns a string representing the suite for this formatter language.
 *
 * @param testSuite  the suite to format
 * @param filename   the file the formatted suite will be saved as
 */
function formatSuite(testSuite, filename) {
  var suiteClass = /^(\w+)/.exec(filename)[1];
  suiteClass = suiteClass[0].toUpperCase() + suiteClass.substring(1);

  var formattedSuite = "";

  for (var i = 0; i < testSuite.tests.length; ++i) {
    var content = "";

    //If the filename is set then use this as the method name
    //Otherwise we use the test case title, which will be
    //Untitled as a default
    var testCase = "";
    if (testSuite.tests[i].filename) {
      testCase = testSuite.tests[i].filename;
    } else {
      testCase = testSuite.tests[i].getTitle();
    }

    testClass = testCase.
        replace(/[^a-zA-Z0-9_]/g, '_').
        replace(/\s/g, '_').
        replace(/\//g, '_');

    var action = testSuite.tests[i].getTitle();

    if (!testSuite.tests[i].content) {
      //Open the testcase, formats the commands from the stored html
      editor.app.showTestCaseFromSuite(testSuite.tests[i]);
    }

    //Get the actions for this test
    content = formatCommands(testSuite.tests[i].content.commands, 2);

    var testFunction = options.testClassHeader.
    replace(/\$\{testClass\}/g, testClass).
    replace(/\$\{content\}/g, content).
    replace(/\$\{action\}/g, action).
    replace(/\$\{([a-zA-Z0-9_]+)\}/g, function(str, name) { return options[name]; });

    formattedSuite +=  testFunction + "\n\n";
  }

  var cest = options.testHeader.
    replace(/\$\{suiteClass\}/g, suiteClass).
    replace(/\$\{content\}/g, formattedSuite).
    replace(/\$\{([a-zA-Z0-9_]+)\}/g, function(str, name) { return options[name]; });

  return cest;
}

/**
 *
 * @param testCase
 * @returns {XML|string|*}
 */
function formatHeader(testCase) {
    var className = testCase.getTitle();

    if (!className) {
        className = "NewTest";
    }

    className = testClassName(className);

    var formatLocal = testCase.formatLocal(this.name);
    methodName = testMethodName(className.replace(/Test$/i, "").replace(/^Test/i, "").replace(/^[A-Z]/, function(str) {
        return str.toLowerCase();
    }));

    var header = (options.getHeader ? options.getHeader() : options.header).
    replace(/\$\{className\}/g, className).
    replace(/\$\{methodName\}/g, methodName).
    replace(/\$\{baseURL\}/g, testCase.getBaseURL()).
    replace(/\$\{([a-zA-Z0-9_]+)\}/g, function(str, name) {
        return options[name];
    });
    this.lastIndent = indents(parseInt(options.initialIndents, 10));
    formatLocal.header = header;

    return formatLocal.header;
}

/**
 *
 * @param testCase
 * @returns {*}
 */
function formatFooter(testCase) {
    var formatLocal = testCase.formatLocal(this.name);
    formatLocal.footer = options.footer;
    return formatLocal.footer;
}

/**
 *
 * @param num
 * @returns {*}
 */
function indents(num) {
    function repeat(c, n) {
        var str = "";
        for (var i = 0; i < n; i++) {
            str += c;
        }
        return str;
    }

    try {
        var indent = options.indent | 4;
        if ('tab' == indent) {
            return repeat("\t", num);
        } else {
            return repeat(" ", num * parseInt(options.indent, 10));
        }
    } catch (error) {
        return repeat(" ", 0);
    }
}

/**
 *
 * @param string
 * @returns {void|XML}
 */
function capitalize(string) {
    return string.replace(/^[a-z]/, function(str) {
        return str.toUpperCase();
    });
}

/**
 *
 * @param text
 * @returns {void|XML|string}
 */
function underscore(text) {
    return text.replace(/[A-Z]/g, function(str) {
        return '_' + str.toLowerCase();
    });
}

/*
 * Optional: The customizable option that can be used in format/parse functions.
 */
options = {
  header: '<?php\n'
    + '${variable} = new AcceptanceTester($scenario);\n'
    + '${variable}->wantTo("${action}");\n'
    + '${content}\n',
  testHeader: "<?php\n\n"
    + "class ${suiteClass}"
    + '\n{\n'
    //+ indents(2) + "protected ${variable};\n\n"
    + indents(1) + 'public function _before(\AcceptanceTester ${variable})\n' + indents(2) + '{\n' + indents(1) + '}\n\n'
    + indents(1) + 'public function _after(\AcceptanceTester ${variable})\n' + indents(2) + '{\n' + indents(1) + '}\n\n'
    + indents(1) + "${content}\n\n"
    + '}',
  testClassHeader: 'public function ${testClass}(\AcceptanceTester ${variable})\n'
    + '{\n\n'
    + indents(1) + '${variable}->wantTo("${action}");\n'
    + '${content}\n'
    + '}',
  indent: 4,
  variable: '$I'
}

/*
 * Optional: XUL XML String for the UI of the options dialog
 */
//configForm = '<textbox id="options_nameOfTheOption"/>'

this.configForm =
        '<description>Variable for AcceptanceTester 123</description>' +
        '<textbox id="options_variable" />' +
        '<description>Cept</description>' +
        '<textbox id="options_header" multiline="true" flex="1" rows="4"/>' +
        '<description>Cest</description>' +
        '<textbox id="options_testHeader" multiline="true" flex="1" rows="4"/>' +
        '<description>Cest Function</description>' +
        '<textbox id="options_testClassHeader" multiline="true" flex="1" rows="2"/>' +
        '<description>Indent</description>' +
        '<menulist id="options_indent"><menupopup>' +
        '<menuitem label="Tab" value="tab"/>' +
        '<menuitem label="1 space" value="1"/>' +
        '<menuitem label="2 spaces" value="2"/>' +
        '<menuitem label="3 spaces" value="3"/>' +
        '<menuitem label="4 spaces" value="4"/>' +
        '<menuitem label="5 spaces" value="5"/>' +
        '<menuitem label="6 spaces" value="6"/>' +
        '<menuitem label="7 spaces" value="7"/>' +
        '<menuitem label="8 spaces" value="8"/>' +
        '</menupopup></menulist>';
