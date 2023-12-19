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


    // Restore settings to default state
    document.getElementById("uselang").checked = false;
    document.getElementById("ytDemo").checked = false;


    // Disable option when generating yt titles
    document.getElementById("ytDemo").addEventListener("change", function () {
        const fieldsToDisable = ["uselang", "customentry", "customsuffix", "customprefix", "customident", "searchmode"];

        fieldsToDisable.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.disabled = this.checked;
        });
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
    const escapeRegex = new RegExp(/\||\*|''+|\[\[+|~|http/, ["gim"]);
    const escapeRegexMatch = escapeRegex.exec(string);

    // Replace newline characters with <br>
    string = string.replace(/\n/g, "<br>");
    // Replace escaped quotation marks with regular quotation marks
    string = string.replace(new RegExp(/\\"/, ["gim"]), "\"");

    // Wrap everything in <nowiki> tags
    if (escapeRegexMatch !== null) {
        return `<nowiki>${string}</nowiki>`;
    }

    return string;
}

// This function removes any problematic characters from the output entry
function cleanEntry(s) {
    let string = s.trim();

    string = string.replace(new RegExp(/\||\*|''+|\[\[+|~|\/|\n|:/, ["gim"]), "");

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

function getTranslationsforYT(token, isString = false) {
    if (isString) {
        token = findToken(token, "tf");
    }

    const englishString = findString("tf", "english", token, true);

    if (!englishString) {
        return "Item not found";
    }

    const ytLanguages = ["english", "spanish", "brazilian", "russian"];
    let output = "";
    let count = 0;

    for (const ytLang of ytLanguages) {
        const translationString = findString("tf", `${ytLang}`, token, true);

        if (translationString) {
            // Todo support other demos
            const english = englishString.replace(/(Taunt: The |Taunt: )/g, "").trim();
            const translation = translationString.replace(/(Taunt: The |Taunt: |Присмех — |Hån: Den |Hån: |Verspottung: Der |Verspottung: Die |Verspottung: Das |Verspottung: |Burla: El |Burla: La |Burla: |Pilkka: |Raillerie : Le |Raillerie : Les |Raillerie : L'|Raillerie : La |Raillerie : |Beszólás: A |Beszólás: |Provocazione: L'|Provocazione: Il |Provocazione: Le |Provocazione: Un |Provocazione: La |Provocazione: I |Provocazione: Lo |Provocazione: |도발: |Bespotting: De |Bespotting: Het |Bespotting: |Drwina: |Provocação: O |Provocação: A |Provocação: |Насмешка: |ท่าเยาะเย้ย: The |ท่าเยาะเย้ย: |Alay Hareketi: |Alay: |Кепкування: |嘲讽：|嘲諷：|挑発: The |挑発: |Beszlás: )/g, "").trim();
            const link = english.replace(/ /g, "_");

            // https://wiki.teamfortress.com/wiki/Template:Dictionary/common_strings#YouTube_titles_.2F_SNS
            const desc = {
                english: `A video demonstrating the ${english} taunt.\nhttps://wiki.teamfortress.com/wiki/${link}\n\nThis is part of an ongoing weapon demonstration project.\nHelp us out! Learn more at: https://wiki.teamfortress.com/wiki/Team_Fortress_Wiki:Weapon_Demonstration`,
                spanish: `Un vídeo que demuestra la burla ${translation}.\nhttps://wiki.teamfortress.com/wiki/${link}/es\n\nEsto forma parte del proyecto de demostración de armas.\n¡Ayúdanos! Infórmate en: https://wiki.teamfortress.com/wiki/Team_Fortress_Wiki:Weapon_Demonstration`,
                brazilian: `Um vídeo demonstrando a provocação "${translation}".\nhttps://wiki.teamfortress.com/wiki/${link}/pt-br\n\nEste vídeo faz parte do nosso projeto de demonstração de armas.\nQuer nos ajudar? Acesse: https://wiki.teamfortress.com/wiki/Team_Fortress_Wiki:Weapon_Demonstration (em inglês)`,
                russian: `Видеоролик, демонстрирующий насмешку: ${translation}.\nhttps://wiki.teamfortress.com/wiki/${link}/ru\n\nЭто часть текущего проекта по демонстрации оружия.\nПомогите нам! Узнайте больше на: https://wiki.teamfortress.com/wiki/Team_Fortress_Wiki:Weapon_Demonstration`
            };

            const title = {
                english: `Taunt Demonstration: ${english}`,
                spanish: `Demostración de burla: ${translation}`,
                brazilian: `Demonstração de provocação: ${translation}`,
                russian: `Демонстрация насмешки: ${translation}`
            };

            if (count % 2 === 0) {
                output += '<div class="row">';
            }

            output += `<div class="column column-50"><div class="container">

                <h3>${ytLang}</h3>
                <pre id="yt-title-${ytLang}">${title[ytLang]}</pre>
                <button class="button button-small" data-clipboard-action="copy" data-clipboard-target="#yt-title-${ytLang}">Copy video title</button>
                <pre id="yt-desc-${ytLang}">${desc[ytLang]}</pre>
                <button class="button button-small" data-clipboard-action="copy" data-clipboard-target="#yt-desc-${ytLang}">Copy video description</button>
            </div></div>`;

            if (count % 2 !== 0 || count === ytLanguages.length - 1) {
                output += "</div><hr>";
            }

            count++;
        }
    }

    return output;
}

// This function takes in a token and a file and returns a dictionary entry for that token in the file.
// It also allows for custom prefixes, suffixes, and entries to be added to the dictionary entry.
function getTranslationsByToken(token, file) {
    // Check if the token can be found in the "english" section of the file
    if (findString(file, "english", token, true)) {
        // Initialize an empty object to store translations
        const translations = {};
        // Get any custom prefix, suffix, or entry specified by the user
        const customEntry = document.getElementById("customentry").value || "";
        const customPrefix = document.getElementById("customprefix").value || "";
        const customSuffix = document.getElementById("customsuffix").value || "";
        const useLang = document.getElementById("uselang").checked;
        const customIdent = $("#customident").val() || " "
        // const customComment = $("#customecomment").val() || ""

        // Create the dictionary entry for the token, using the custom entry if provided, otherwise using the string
        let dicEntry = "";

        if (useLang) {
            dicEntry += `{{lang <!-- Source: ${file}_english.txt / ${token.replace("y	f", "y\\tf")} -->\n`
            dicEntry += `${customIdent}| en = ${customPrefix}${findString(file, "english", token)}${customSuffix}\n`;
        } else {
            dicEntry += `# ${token}\n`
            dicEntry += customEntry ? `${customEntry}:\n` : `${cleanEntry(findString(file, "english", token, true).toLowerCase())}:\n`
            dicEntry += `  en: ${customPrefix}${findString(file, "english", token)}${customSuffix}\n`;
        }

        // Find translations for the token in all languages except "english" and add them to the translations object
        for (const language of languageFiles[file]) {
            if (language !== "english" && findString(file, language, token) !== undefined) {
                translations[langCodes[language]] = findString(file, language, token);
            }
        }

        // Add the translations to the dictionary entry, sorting them by language code
        for (const key of Object.keys(translations).sort()) {
            if (useLang) {
                dicEntry += `${customIdent}| ${key} = ${customPrefix}${translations[key]}${customSuffix}\n`;
            } else {
                dicEntry += `  ${key}: ${customPrefix}${translations[key]}${customSuffix}\n`;
            }
        };

        if (useLang) {
            dicEntry += "}}"
        }

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


    if (document.getElementById("ytDemo").checked) {
        output = getTranslationsforYT(token);
        displayOutput(output, "#outputyt", "No tokens found!", true);

        $("#copy-output-btn").hide();
        $("#output").hide();
        $("#outputyt").show();
    } else {
        // Check the search mode and call the appropriate function
        if (mode === "tf_proto_obj_defs2") {
            // https://wiki.teamfortress.com/wiki/Template:Dictionary/common_strings#contract names
            output = getTranslationsByToken(`${token.replace(/ /g, "_")} { field_number: 4 }`, "tf_proto_obj_defs");
        } else if (mode === "tf_proto_obj_defs3") {
            output = getTranslationsByToken(`${token.replace(/ /g, "_")} { field_number: 2 }`, "tf_proto_obj_defs");
        } else if (mode === "closecaption") {
            output = getTranslationsByToken(`${token.replace("y\\tf", "y	f")}`, mode);
        } else {
            output = getTranslationsByToken(token, mode);
        }

        displayOutput(output, "#output", `No tokens found on ${mode}!`);

        if (output !== undefined && source !== "fuzzy") {
            $("#fuzzy-area").fadeOut();
        }

        $("#copy-output-btn").show();
        $("#output").show();
        $("#outputyt").hide();
    }


}

// This function searches for translations of a given string.
function searchByString() {
    // Show the output area
    $("#output-area").fadeIn();

    const mode = $("#searchmode").val();
    let output;

    if (document.getElementById("ytDemo").checked) {
        output = getTranslationsforYT($("#search").val(), true);
        displayOutput(output, "#outputyt", "No strings found!", true);

        $("#copy-output-btn").hide();
        $("#output").hide();
        $("#outputyt").show();
    } else {
        output = getTranslationsByString($("#search").val(), mode.includes("tf_proto_obj_defs") ? "tf_proto_obj_defs" : mode);
        displayOutput(output, "#output", `No strings found on ${mode}!`);

        $("#copy-output-btn").show();
        $("#output").show();
        $("#outputyt").hide();
    }
}

function displayOutput(output, outputElement, message, renderHTML = false) {
    const targetElement = document.querySelector(outputElement);

    if (output !== undefined) {
        if (renderHTML) {
            targetElement.innerHTML = output;
        } else {
            targetElement.textContent = output;
        }
    } else {
        targetElement.innerHTML = message;
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
    closecaption: [
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
    tf_quests: [
        "brazilian",
        "czech",
        "danish",
        "dutch",
        "english",
        "finnish",
        "french",
        "german",
        "hungarian",
        "italian",
        "japanese",
        "korean",
        "norwegian",
        "polish",
        "portuguese",
        "romanian",
        "russian",
        "schinese",
        "spanish",
        "swedish",
        "tchinese",
        "turkish"
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
    closecaption: [],
    tf: [],
    tf_quests: [],
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