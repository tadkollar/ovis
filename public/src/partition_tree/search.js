var searchObj = {};

var newSearchObj = function () {
    searchObj.filteredWordForAutoCompleteSuggestions = "";
    searchObj.filteredWordForAutoCompleteSuggestionsContainsDot = false;
    searchObj.filteredWordForAutoCompleteSuggestionsBaseName = "";
    searchObj.wordIndex = 0;
    searchObj.searchVals0 = [];
    searchObj.inDataFunction = true;
    searchObj.filterSet = {};
    searchObj.callSearchFromEnterKeyPressed = false;
    searchObj.autoCompleteListNames = [];
    searchObj.autoCompleteListPathNames = [];
    searchObj.searchCollapsedUndo = [];
    searchObj.autoCompleteSetNames = {};
    searchObj.autoCompleteSetPathNames = {};
    searchObj.showParams = true;

    window.addEventListener("awesomplete-selectcomplete", function (e) {
        // User made a selection from dropdown.
        // This is fired after the selection is applied
        searchObj.SearchInputEventListener(e);
        searchObj.callSearchFromEnterKeyPressed = false;
        searchObj.searchAwesomplete.evaluate();
    }, false);

    searchObj.numMatches = 0;
    searchObj.DoSearch = function (d, regexMatch, undoList) {
        var didMatch = false;
        if (d.children && !d.isMinimized) { //depth first, dont go into minimized children
            for (var i = 0; i < d.children.length; ++i) {
                if (searchObj.DoSearch(d.children[i], regexMatch, undoList)) didMatch = true;
            }
        }
        if (d === zoomedElement) return didMatch;
        if (!searchObj.showParams && (d.type === "param" || d.type === "unconnected_param")) return didMatch;
        if (!didMatch && !d.children && (d.type === "param" || d.type === "unknown" || d.type === "unconnected_param")) {
            didMatch = regexMatch.test(d.absPathName);
            if (didMatch) {
                ++numMatches; //only params and unknowns can count as matches
            }
            else if (undoList) { //did not match and undo list is not null
                d.varIsHidden = true;
                undoList.push(d);
            }
        }

        if (!didMatch && d.children && !d.isMinimized && undoList) { //minimizeable and undoList not null
            d.isMinimized = true;
            undoList.push(d);
        }
        return didMatch;
    }

    searchObj.CountMatches = function () {
        searchObj.searchCollapsedUndo.forEach(function (d) { //auto undo on successive searches
            if (!d.children && (d.type === "param" || d.type === "unknown" || d.type === "unconnected_param")) d.varIsHidden = false;
            else d.isMinimized = false;
        });
        numMatches = 0;
        if (searchObj.searchVals0.length != 0) searchObj.DoSearch(zoomedElement, searchObj.GetSearchRegExp(searchObj.searchVals0), null);
        searchObj.searchCollapsedUndo.forEach(function (d) { //auto undo on successive searches
            if (!d.children && (d.type === "param" || d.type === "unknown" || d.type === "unconnected_param")) d.varIsHidden = true;
            else d.isMinimized = true;
        });
    }

    searchObj.SearchButtonClicked = function () {
        searchObj.searchCollapsedUndo.forEach(function (d) { //auto undo on successive searches
            if (!d.children && (d.type === "param" || d.type === "unknown" || d.type === "unconnected_param")) d.varIsHidden = false;
            else d.isMinimized = false;
        });
        numMatches = 0;
        searchObj.searchCollapsedUndo = [];
        if (searchObj.searchVals0.length != 0) searchObj.DoSearch(zoomedElement, searchObj.GetSearchRegExp(searchObj.searchVals0), searchObj.searchCollapsedUndo);

        FindRootOfChangeFunction = searchObj.FindRootOfChangeForSearch;
        ptn2.TRANSITION_DURATION = ptn2.TRANSITION_DURATION_SLOW;
        lastClickWasLeft = false;
        updateRecomputesAutoComplete = false;
        updateFunc();
    }

    searchObj.GetSearchRegExp = function (searchValsArray) {
        var regexStr = "(^" + searchValsArray.join("$|^") + "$)"; //^ starts at beginning of string   $ is end of string
        regexStr = regexStr.replace(/\./g, "\\."); //convert . to regex
        regexStr = regexStr.replace(/\?/g, "."); //convert ? to regex
        regexStr = regexStr.replace(/\*/g, ".*?"); //convert * to regex
        regexStr = regexStr.replace(/\^/g, "^.*?"); //prepend *
        return new RegExp(regexStr, "i"); //case insensitive
    }

    searchObj.SearchInputEventListener = function (e) {
        var target = e.target;
        if (target.id === "awesompleteId") {
            var newVal = target.value.replace(/([^a-zA-Z0-9:_\?\*\s\.])/g, ""); //valid characters AlphaNumeric : _ ? * space .
            if (newVal !== target.value) {
                //e.stopPropagation();
                target.value = newVal; //won't trigger new event
                //searchAwesomplete.evaluate();
            }

            searchObj.searchVals0 = target.value.split(" ");
            function isValid(value) {
                return value.length > 0;
            }
            var filtered = searchObj.searchVals0.filter(isValid);
            searchObj.searchVals0 = filtered;

            var lastLetterTypedIndex = target.selectionStart - 1;

            var endIndex = target.value.indexOf(" ", lastLetterTypedIndex);
            if (endIndex == -1) endIndex = target.value.length;
            var startIndex = target.value.lastIndexOf(" ", lastLetterTypedIndex);
            if (startIndex == -1) startIndex = 0;
            var sub = target.value.substring(startIndex, endIndex).trim();
            searchObj.filteredWordForAutoCompleteSuggestions = sub.replace(/([^a-zA-Z0-9:_\.])/g, ""); //valid openmdao character types: AlphaNumeric : _ .



            for (var i = 0; i < searchObj.searchVals0.length; ++i) {
                if (searchObj.searchVals0[i].replace(/([^a-zA-Z0-9:_\.])/g, "") === searchObj.filteredWordForAutoCompleteSuggestions) {
                    searchObj.wordIndex = i;
                    break;
                }
            }

            searchObj.filteredWordForAutoCompleteSuggestionsContainsDot = (searchObj.filteredWordForAutoCompleteSuggestions.indexOf(".") != -1);
            searchObj.searchAwesomplete.list = searchObj.filteredWordForAutoCompleteSuggestionsContainsDot ? searchObj.autoCompleteListPathNames : searchObj.autoCompleteListNames;
            searchObj.filteredWordForAutoCompleteSuggestionsBaseName = searchObj.filteredWordForAutoCompleteSuggestionsContainsDot ? searchObj.filteredWordForAutoCompleteSuggestions.split(".")[0].trim() : "";

            searchObj.CountMatches();
            parentDiv.querySelector("#searchCountId").innerHTML = "" + numMatches + " matches";
        }
    }
    window.addEventListener('input', searchObj.SearchInputEventListener, true);//Use Capture not bubble so that this will be the first input event

    searchObj.SearchEnterKeyUpEventListener = function (e) {
        var target = e.target;
        if (target.id === "awesompleteId") {
            var key = e.which || e.keyCode;
            if (key === 13) { // 13 is enter
                if (searchObj.callSearchFromEnterKeyPressed) {
                    searchObj.SearchButtonClicked();
                }
            }
        }
    }
    window.addEventListener('keyup', searchObj.SearchEnterKeyUpEventListener, true);//keyup so it will be after the input and awesomplete-selectcomplete event listeners

    searchObj.SearchEnterKeyDownEventListener = function (e) {
        var target = e.target;
        if (target.id === "awesompleteId") {
            var key = e.which || e.keyCode;
            if (key === 13) { // 13 is enter
                searchObj.callSearchFromEnterKeyPressed = true;
            }
        }
    }
    window.addEventListener('keydown', searchObj.SearchEnterKeyDownEventListener, true);//keydown so it will be before the input and awesomplete-selectcomplete event listeners

    searchObj.searchInputId = parentDiv.querySelector("#awesompleteId");
    searchObj.searchAwesomplete = new Awesomplete(searchObj.searchInputId, {
        "minChars": 1,
        "maxItems": 15,
        "list": [],
        "filter": function (text, input) {
            if (searchObj.inDataFunction) {
                searchObj.inDataFunction = false;
                searchObj.filterSet = {};
            }
            if (searchObj.filteredWordForAutoCompleteSuggestions.length == 0) return false;
            if (searchObj.filterSet.hasOwnProperty(text)) return false;
            searchObj.filterSet[text] = true;
            if (searchObj.filteredWordForAutoCompleteSuggestionsContainsDot) return Awesomplete.FILTER_STARTSWITH(text, searchObj.filteredWordForAutoCompleteSuggestions);
            return Awesomplete.FILTER_CONTAINS(text, searchObj.filteredWordForAutoCompleteSuggestions);
        },
        "item": function (text, input) {
            return Awesomplete.ITEM(text, searchObj.filteredWordForAutoCompleteSuggestions);
        },
        "replace": function (text) {
            var newVal = "";
            var cursorPos = 0;
            for (var i = 0; i < searchObj.searchVals0.length; ++i) {
                newVal += ((i == searchObj.wordIndex) ? text : searchObj.searchVals0[i]) + " ";
                if (i == searchObj.wordIndex) cursorPos = newVal.length - 1;
            }
            this.input.value = newVal;
            parentDiv.querySelector("#awesompleteId").setSelectionRange(cursorPos, cursorPos);
        },
        "data": function (item/*, input*/) {
            searchObj.inDataFunction = true;
            if (searchObj.filteredWordForAutoCompleteSuggestionsContainsDot) {
                var baseIndex = item.toLowerCase().indexOf("." + searchObj.filteredWordForAutoCompleteSuggestionsBaseName.toLowerCase() + ".");
                if (baseIndex > 0) return item.slice(baseIndex + 1);
            }
            return item;
        }
    });

    searchObj.FindRootOfChangeForSearch = function (d) {
        var earliestObj = d;
        for (var obj = d; obj != null; obj = obj.parent) {
            if (obj.isMinimized) earliestObj = obj;
        }
        return earliestObj;
    }

    searchObj.PopulateAutoCompleteList = function (d) {
        if (d.children && !d.isMinimized) { //depth first, dont go into minimized children
            for (var i = 0; i < d.children.length; ++i) {
                PopulateAutoCompleteList(d.children[i]);
            }
        }
        if (d === zoomedElement) return;
        if (!searchObj.showParams && (d.type === "param" || d.type === "unconnected_param")) return;

        var n = d.name;
        if (d.splitByColon && d.children && d.children.length > 0) n += ":";
        if (d.type !== "param" && d.type !== "unknown" && d.type !== "unconnected_param") n += ".";
        var namesToAdd = [n];

        if (d.splitByColon) namesToAdd.push(d.colonName + ((d.children && d.children.length > 0) ? ":" : ""));

        namesToAdd.forEach(function (name) {
            if (!searchObj.autoCompleteSetNames.hasOwnProperty(name)) {
                searchObj.autoCompleteSetNames[name] = true;
                searchObj.autoCompleteListNames.push(name);
            }
        });

        var localPathName = (zoomedElement === root) ? d.absPathName : d.absPathName.slice(zoomedElement.absPathName.length + 1);
        if (!searchObj.autoCompleteSetPathNames.hasOwnProperty(localPathName)) {
            searchObj.autoCompleteSetPathNames[localPathName] = true;
            searchObj.autoCompleteListPathNames.push(localPathName);
        }
    }

    return searchObj;
}