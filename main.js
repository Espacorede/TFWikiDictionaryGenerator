// Yep, we're using a whole lib just for this
$(document).ready(function () {
    const clipboard = new ClipboardJS(".button");

    clipboard.on("success", function (e) {
        $("#copy-output").text("Output copied to clipboard!").fadeIn();

        e.clearSelection();

        setTimeout(function () {
            $("#copy-output").fadeOut();
        }, 5000);
    });

    clipboard.on("error", function (e) {
        $("#copy-output").text("Failed to copy output! Try again or report.").fadeIn();

        setTimeout(function () {
            $("#copy-output").fadeOut();
        }, 5000);
    });
});

// This function loads a language file from the specified path and passes it to the callback function.
function loadLangFile(language, callback) {
    $.ajax({
        url: `generated/${language}.json`,
        dataType: "json",
        success: function (data) {
            return callback(data);
        }
    });
}

// This function removes any problematic characters from the output string
function cleanString(s, language) {
    let string = s.trim();

    // Regex to find problematic characters
    const escapeRegex = new RegExp(/\||\*|''+|\[\[+|~/, ["gim"]);
    const escapeRegexMatch = escapeRegex.exec(string);

    // Replace newline characters with <br>
    string = string.replace(new RegExp(/(\\\\n|\\n)/, ["gim"]), "<br>");
    // Replace escaped quotation marks with regular quotation marks
    string = string.replace(new RegExp(/(\\\\"|\\")/, ["gim"]), "\"");

    // Wrap everything in <nowiki> tags
    if (escapeRegexMatch !== null) {
        return `<nowiki>${string}</nowiki>`;
    }

    return string;
}

// This function returns the token associated with a given string.
function findToken(string, file) {
    return Object.keys(languageData[file].english).find(key => languageData[file].english[key] === string);
}

// This function returns the string associated with a given token.
function findString(file, language, token, noEscape = false) {
    // If noEscape is true, it returns the string associated with the token
    if (noEscape) {
        return languageData[file][language][token];
    }

    // If the string exists, if it does it calls the function cleanString and pass the string and the language
    if (languageData[file][language][token]) {
        return cleanString(languageData[file][language][token], language);
    }
}

// This function returns the translations of a given string.
function getTranslationsByString(string, file) {
    return getTranslationsByToken(findToken(string, file), file);
}

// This function takes in a token and a file and returns a dictionary entry for that token in the file.
// It also allows for custom prefixes, suffixes, and entries to be added to the dictionary entry.
function getTranslationsByToken(token, file) {
    // Check if the token can be found in the "english" section of the file
    if (findString(file, "english", token, true)) {
        // Initialize an empty object to store translations
        const translations = {};
        // Get any custom prefix, suffix, or entry specified by the user
        const custonEntry = $("#customentry").val() || ""
        const custonPrefix = $("#customprefix").val() || ""
        const customSuffix = $("#customsuffix").val() || ""
        // const customComment = $("#customecomment").val() || ""

        // Create the dictionary entry for the token, using the custom entry if provided, otherwise using the string
        let dicEntry = `# ${token}\n`
        dicEntry += custonEntry ? `${custonEntry}:\n` : `${findString(file, "english", token, true).toLowerCase()}:\n`
        dicEntry += `  en: ${custonPrefix}${findString(file, "english", token)}${customSuffix}\n`;

        // Find translations for the token in all languages except "english" and add them to the translations object
        for (const language of languageFiles[file]) {
            if (language !== "english" && findString(file, language, token) !== undefined) {
                translations[langCodes[language]] = findString(file, language, token);
            }
        }

        // Add the translations to the dictionary entry, sorting them by language code
        for (const key of Object.keys(translations).sort()) {
            dicEntry += `  ${key}: ${custonPrefix}${translations[key]}${customSuffix}\n`;
        };

        return dicEntry;
    }
}

// This function searches for translations of a given token.
// It takes an optional parameter "token" which is used as the search term, defaults to "#search"
// It also takes an optional parameter "source" which is used to determine if the search was triggered by the "fuzzy" feature.
function searchByToken(token = $("#search").val(), source) {
    // Show the output area
    $("#output-area").fadeIn();

    // Get the current search mode
    const mode = $("#searchmode").val();
    let output;

    // Check the search mode and call the appropriate function
    if (mode === "proto") {
        output = getTranslationsByToken(token, "tf_proto_obj_defs");
    } else if (mode === "proto2") {
        // https://wiki.teamfortress.com/wiki/Template:Dictionary/common_strings#contract names
        output = getTranslationsByToken(`${token.replace(/ /g, "_")} { field_number: 4 }`, "tf_proto_obj_defs");
    } else if (mode === "proto3") {
        output = getTranslationsByToken(`${token.replace(/ /g, "_")} { field_number: 2 }`, "tf_proto_obj_defs");
    } else {
        output = getTranslationsByToken(token, "tf");
    }

    // If translations are found, display them in the output element
    if (output !== undefined) {
        $("#output").text(output);

        // Hide the "fuzzy" area if the search was not triggered by that feature
        if (source !== "fuzzy") {
            $("#fuzzy-area").fadeOut();
        }
    } else {
        $("#output").html("No tokens found!");
    }
}

// This function searches for translations of a given string.
function searchByString() {
    // Show the output area
    $("#output-area").fadeIn();

    let output;

    // Check the current search mode
    if ($("#searchmode").val() !== "tf") {
        output = getTranslationsByString($("#search").val(), "tf_proto_obj_defs");
    } else {
        output = getTranslationsByString($("#search").val(), "tf");
    }

    // If translations are found, display them in the output element
    if (output !== undefined) {
        $("#output").text(output);
    } else {
        $("#output").html(`No strings found on ${$("#searchmode").val()}.`);
    }
}

// This function copies the text in the element with the id "output" to the clipboard
// May not work on all browsers but eh...
function copyOutput() {
    $("#output").focus();
    $("#output").select();
    document.execCommand("copy");
}

const languageFiles = {
    tf: [
        "brazilian",
        // "bulgarian",
        "czech",
        "danish",
        "dutch",
        "english",
        "finnish",
        "french",
        "german",
        // "greek",
        "hungarian",
        "italian",
        "japanese",
        "korean",
        // "koreana",
        // "latam",
        "norwegian",
        // "pirate",
        "polish",
        "portuguese",
        "romanian",
        "russian",
        "schinese",
        "spanish",
        "swedish",
        "tchinese",
        // "thai",
        "turkish"
        // "ukrainian",
        // "vietnamese"
    ],
    tf_proto_obj_defs: [
        "brazilian",
        // "bulgarian",
        "czech",
        "danish",
        "dutch",
        "english",
        "finnish",
        "french",
        "german",
        // "greek",
        "hungarian",
        "italian",
        // "japanese",
        "korean",
        // "koreana",
        // "latam",
        "norwegian",
        // "pirate",
        "polish",
        "portuguese",
        "romanian",
        "russian",
        "schinese",
        "spanish",
        "swedish",
        "tchinese",
        // "thai",
        "turkish"
        // "ukrainian",
        // "vietnamese"
    ]
};

// Map languages to wiki language code
const langCodes = {
    arabic: "ar", // No official support
    brazilian: "pt-br",
    bulgarian: "bg",
    czech: "cs",
    danish: "da",
    dutch: "nl",
    english: "en",
    finnish: "fi",
    french: "fr",
    german: "de",
    hungarian: "hu",
    italian: "it",
    japanese: "ja",
    korean: "ko",
    koreana: "ka", // Localization test file for korean
    latam: "es-latam",
    norwegian: "no",
    pirate: "en-pirate",
    polish: "pl",
    portuguese: "pt",
    romanian: "ro",
    russian: "ru",
    schinese: "zh-hans",
    spanish: "es",
    swedish: "sv",
    tchinese: "zh-hant",
    thai: "th", // https://wiki.tf/d/2097829
    turkish: "tr",
    ukrainian: "uk", // https://wiki.tf/d/2097829
    vietnamese: "vi" // https://wiki.tf/d/2097829
};

const languageData = {
    tf: [],
    tf_proto_obj_defs: []
};

// Loop through each file in the languageFiles object
for (const file in languageFiles) {
    // Loop through each language in the current file
    for (const language of languageFiles[file]) {
        // Load the language file using the loadLangFile function and pass it a callback
        loadLangFile(`${file}_${language}`, function (response) {
            // Store the data from the loaded language file in the languageData object
            languageData[file][language] = response.data;
        });
    }
}