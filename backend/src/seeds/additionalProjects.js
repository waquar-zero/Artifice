const helloServer = {
    project: {
        title: "Build a Hello Server",
        slug: "build-hello-server",
        description: "Create a tiny website that greets visitors and serves a second page.",
        difficulty: "beginner",
        language: "javascript",
        estimatedHours: 1,
        availability: "coming_soon",
        learningGuide: {
            introduction: "Build a small web server that responds to browser requests. You’ll begin with one page, then add routes and handle unknown URLs.",
            sections: [
                { title: "What is a web server?", body: "A web server listens for requests from clients such as browsers and sends back responses. Those responses can contain a page, data, or an error." },
                { title: "Why build one?", body: "A tiny server makes the request-and-response cycle concrete. It is the foundation behind websites, APIs, and many applications." },
                { title: "How will you implement it?", body: "Use Node’s built-in HTTP module to create a server, inspect each request URL, choose a response, and return an appropriate status code." },
                { title: "What you’ll practice", body: "You’ll handle a home route, add an about route, and return 404 for paths the server does not recognize." }
            ]
        },
        execution: {
            type: "process",
            entrypoint: "server.js",
            startCommand: "node server.js",
            port: 3101
        }
    },
    sprints: [
        {
            order: 1,
            title: "Say hello",
            goal: "Start a small HTTP server and greet visitors at the home page.",
            requirements: ["Start a Node.js HTTP server", "Return status 200 from /", "Show Hello, world! in the response"],
            constraints: ["Use Node.js built-in modules", "Do not use Express"],
            definitionOfDone: ["The server starts on the project port", "GET / returns status 200", "The response says Hello, world!"],
            hints: ["Node.js includes an HTTP module.", "Create a server and handle each incoming request.", "Send a 200 response and end it with the greeting."],
            starterCode: `const http = require("node:http");

const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("TODO: add your greeting");
});

server.listen(3101);`,
            testSpec: {
                type: "http",
                checks: [
                    { type: "server_starts" },
                    { type: "route", config: { method: "GET", path: "/", expectedStatus: 200, expectedBody: "Hello, world!" } }
                ]
            }
        },
        {
            order: 2,
            title: "Add an about page",
            goal: "Serve a second page and return a not-found response for unknown paths.",
            requirements: ["Keep the home page greeting", "Return an about message from /about", "Return a 404 status for unknown paths"],
            constraints: ["Continue using the built-in HTTP module", "Keep responses as plain text"],
            definitionOfDone: ["GET / still returns the greeting", "GET /about returns the about message", "Unknown paths return status 404"],
            hints: ["The request URL tells you which page was requested.", "Use separate responses for / and /about.", "Send status 404 when the path matches neither page."],
            starterCode: `const http = require("node:http");

const server = http.createServer((request, response) => {
  if (request.url === "/") {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Hello, world!");
    return;
  }

  // TODO: add /about and a not-found response
  response.writeHead(404, { "Content-Type": "text/plain" });
  response.end("Not found");
});

server.listen(3101);`,
            testSpec: {
                type: "http",
                checks: [
                    { type: "server_starts" },
                    { type: "route", config: { method: "GET", path: "/", expectedStatus: 200, expectedBody: "Hello, world!" } },
                    { type: "route", config: { method: "GET", path: "/about", expectedStatus: 200, expectedBody: "About this project" } },
                    { type: "unknown_route", config: { path: "/missing", expectedStatus: 404 } }
                ]
            }
        }
    ]
};

const textAnalyzer = {
    project: {
        title: "Build a Text Analyzer",
        slug: "build-text-analyzer",
        description: "Write small functions in JavaScript or Python that inspect words, characters, and sentences.",
        difficulty: "beginner",
        language: "javascript",
        supportedLanguages: ["javascript", "python"],
        estimatedHours: 1,
        availability: "active",
        learningGuide: {
            introduction: "A text analyzer takes text as input and reports useful facts about it. In this project, you’ll build small functions that count words, characters, and sentences.",
            sections: [
                { title: "What is a text analyzer?", body: "It is a program that examines text and turns it into simple measurements, such as word count, character count, or the number of sentences." },
                { title: "Why do we need one?", body: "Writers use these measurements to check length and readability. Search tools, editors, and messaging apps also analyze text to power useful features." },
                { title: "How do you implement it?", body: "Start with a string, handle empty input, and use small focused functions. Trim whitespace before splitting words, count characters with the string length, and identify sentence-ending punctuation." },
                { title: "What you’ll build", body: "First, write countWords(text) and handle repeated spaces and empty text. Then write analyzeText(text) to return character, word, and sentence counts together." }
            ]
        },
        execution: {
            type: "process",
            entrypoint: "solution.js",
            startCommand: "node solution.js",
            port: 3102
        }
    },
    sprints: [
        {
            order: 1,
            title: "Count the words",
            goal: "Count words in a string, including inputs with extra spaces or no text.",
            requirements: ["Define countWords(text)", "Ignore leading and trailing whitespace", "Treat repeated whitespace as one separator", "Return 0 for empty text"],
            constraints: ["Use JavaScript or Python", "Return a number"],
            definitionOfDone: ["Counts words in a sentence", "Handles repeated spaces", "Returns zero for empty input"],
            hints: ["Trim whitespace from the start and end first.", "An empty trimmed string contains no words.", "Split non-empty text on one or more whitespace characters."],
            functionName: "countWords",
            starterCode: `function countWords(text) {
  // TODO: count the words in text
  return 0;
}`,
            starterCodeByLanguage: {
                javascript: `function countWords(text) {
  // TODO: count the words in text
  return 0;
}`,
                python: `def countWords(text):
    # TODO: count the words in text
    return 0
`
            },
            tests: [
                { name: "Counts a sentence", input: ["hello world"], expectedOutput: 2 },
                { name: "Ignores repeated spaces", input: ["  hello   world  "], expectedOutput: 2 },
                { name: "Handles empty text", input: [""], expectedOutput: 0 }
            ],
            testSpec: { type: "function", checks: [] }
        },
        {
            order: 2,
            title: "Analyze a full sentence",
            goal: "Return character, word, and sentence counts for a piece of text.",
            requirements: ["Define analyzeText(text)", "Count every character including spaces", "Count words separated by whitespace", "Count sentences ending in ., !, or ?"],
            constraints: ["Use JavaScript or Python", "Return an object with characters, words, and sentences numbers"],
            definitionOfDone: ["Reports the character count", "Reports the word count", "Counts sentence-ending punctuation", "Returns zero counts for empty text"],
            hints: ["The string length includes spaces and punctuation.", "Trim before splitting to avoid counting empty words.", "Split on one or more sentence-ending marks and ignore empty pieces."],
            functionName: "analyzeText",
            starterCode: `function analyzeText(text) {
  // TODO: calculate characters, words, and sentences
  return { characters: 0, words: 0, sentences: 0 };
}`,
            starterCodeByLanguage: {
                javascript: `function analyzeText(text) {
  // TODO: calculate characters, words, and sentences
  return { characters: 0, words: 0, sentences: 0 };
}`,
                python: `def analyzeText(text):
    # TODO: calculate characters, words, and sentences
    return {"characters": 0, "words": 0, "sentences": 0}
`
            },
            tests: [
                { name: "Analyzes a sentence", input: ["Hello world."], expectedOutput: { characters: 12, words: 2, sentences: 1 } },
                { name: "Counts multiple sentences", input: ["Wait... Really? yes!"], expectedOutput: { characters: 20, words: 3, sentences: 3 } },
                { name: "Handles empty text", input: [""], expectedOutput: { characters: 0, words: 0, sentences: 0 } }
            ],
            testSpec: { type: "function", checks: [] }
        }
    ]
};

const aiTextLiteracy = {
    project: {
        title: "Invisible Character Inspector",
        slug: "ai-text-detection-transparency",
        description: "Find and safely remove invisible Unicode format characters that can hide in copied text.",
        difficulty: "beginner",
        language: "javascript",
        supportedLanguages: ["javascript", "python"],
        estimatedHours: 2,
        availability: "coming_soon",
        learningGuide: {
            introduction: "Some Unicode characters have no visible glyph. They can appear in copied text and make strings confusing to inspect, compare, or search. Build a small tool to find and remove selected invisible format characters.",
            sections: [
                { title: "What are invisible Unicode characters?", body: "They are valid Unicode code points that may affect formatting or text direction without drawing a visible symbol. Examples include zero-width spaces, byte-order marks, and bidirectional formatting controls." },
                { title: "Why inspect them?", body: "Hidden format characters can cause confusing search results, mismatched identifiers, deceptive text, or hard-to-debug copy-and-paste issues. A code-point report helps people see what is actually in a string." },
                { title: "How will you implement it?", body: "Walk through a string by Unicode code point, report the position and U+ code for selected format characters, then offer a separate function that removes only those selected characters." },
                { title: "Keep text handling safe", body: "Some invisible characters, such as joiners, are meaningful in many writing systems. This project targets a small explicit set and leaves every other character untouched. Review the report before cleaning important text." },
                { title: "Choose your language", body: "Complete the same project in either JavaScript or Python. You can switch languages in the editor; each language keeps its own saved draft." },
            ]
        },
        execution: {
            type: "process",
            entrypoint: "solution.js",
            startCommand: "node solution.js",
            port: 3103
        }
    },
    sprints: [
        {
            order: 1,
            title: "Find invisible characters",
            goal: "Report selected invisible Unicode format characters and their positions.",
            requirements: ["Define findInvisibleCharacters(text)", "Return each matching code-point index", "Format each code point as U+ followed by uppercase hexadecimal"],
            constraints: ["Use JavaScript or Python", "Only report the explicit set listed in the sprint hints"],
            definitionOfDone: ["Finds a zero-width space", "Finds a bidirectional override", "Leaves ordinary text alone"],
            hints: ["The target code points are U+200B, U+2060, U+FEFF, U+202A–U+202E, and U+2066–U+2069.", "Iterate by Unicode code point so reported positions match Python string indices.", "Return objects with index and codePoint fields."],
            functionName: "findInvisibleCharacters",
            starterCode: `function findInvisibleCharacters(text) {
  // TODO: find selected invisible Unicode format characters
  return [];
}`,
            starterCodeByLanguage: {
                javascript: `function findInvisibleCharacters(text) {
  // TODO: find selected invisible Unicode format characters
  return [];
}`,
                python: `def findInvisibleCharacters(text):
    # TODO: find selected invisible Unicode format characters
    return []
`
            },
            tests: [
                { name: "Finds a zero-width space", input: ["safe\u200Btext"], expectedOutput: [{ index: 4, codePoint: "U+200B" }] },
                { name: "Finds a direction control", input: ["a\u202Eb"], expectedOutput: [{ index: 1, codePoint: "U+202E" }] },
                { name: "Leaves ordinary text alone", input: ["visible text"], expectedOutput: [] }
            ],
            testSpec: { type: "function", checks: [] }
        },
        {
            order: 2,
            title: "Remove selected format characters",
            goal: "Create an explicit cleaning function that removes only the targeted code points.",
            requirements: ["Define removeInvisibleCharacters(text)", "Remove the sprint’s target code points", "Preserve all visible text and unlisted code points"],
            constraints: ["Use JavaScript or Python", "Do not remove joiners U+200C or U+200D"],
            definitionOfDone: ["Removes a zero-width space", "Removes a direction control", "Preserves ordinary and unlisted characters"],
            hints: ["Use the same explicit set from sprint 1.", "Build a new string from the code points that are not in that set.", "Do not strip every Unicode format character; some are essential to writing."],
            functionName: "removeInvisibleCharacters",
            starterCode: `function removeInvisibleCharacters(text) {
  // TODO: remove only the selected invisible Unicode format characters
  return text;
}`,
            starterCodeByLanguage: {
                javascript: `const invisibleFormatCharacter = /[\\u200B\\u2060\\uFEFF\\u202A-\\u202E\\u2066-\\u2069]/;

function findInvisibleCharacters(text) {
  return Array.from(text).flatMap((character, index) => {
    if (!invisibleFormatCharacter.test(character)) return [];
    const codePoint = character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
    return [{ index, codePoint: \`U+\${codePoint}\` }];
  });
}

function removeInvisibleCharacters(text) {
  // TODO: remove only the selected invisible Unicode format characters
  return text;
}`,
                python: `import re

_INVISIBLE_FORMAT = {0x200B, 0x2060, 0xFEFF, *range(0x202A, 0x202F), *range(0x2066, 0x206A)}

def findInvisibleCharacters(text):
    return [
        {"index": index, "codePoint": f"U+{ord(character):04X}"}
        for index, character in enumerate(text)
        if ord(character) in _INVISIBLE_FORMAT
    ]

def removeInvisibleCharacters(text):
    # TODO: remove only the selected invisible Unicode format characters
    return text
`
            },
            tests: [
                { name: "Removes a zero-width space", input: ["safe\u200Btext"], expectedOutput: "safetext" },
                { name: "Removes a direction control", input: ["a\u202Eb"], expectedOutput: "ab" },
                { name: "Preserves other characters", input: ["café — visible"], expectedOutput: "café — visible" }
            ],
            testSpec: { type: "function", checks: [] }
        }
    ]
};

export default [helloServer, textAnalyzer, aiTextLiteracy];
