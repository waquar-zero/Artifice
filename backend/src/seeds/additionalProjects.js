const helloServer = {
    project: {
        title: "Build a Hello Server",
        slug: "build-hello-server",
        description: "Create a tiny website that greets visitors and serves a second page.",
        difficulty: "beginner",
        language: "javascript",
        estimatedHours: 1,
        availability: "coming_soon",
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
        description: "Write small JavaScript functions that inspect words, characters, and sentences.",
        difficulty: "beginner",
        language: "javascript",
        estimatedHours: 1,
        availability: "active",
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
            constraints: ["Use JavaScript", "Return a number"],
            definitionOfDone: ["Counts words in a sentence", "Handles repeated spaces", "Returns zero for empty input"],
            hints: ["Trim whitespace from the start and end first.", "An empty trimmed string contains no words.", "Split non-empty text on one or more whitespace characters."],
            functionName: "countWords",
            starterCode: `function countWords(text) {
  // TODO: count the words in text
  return 0;
}`,
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
            constraints: ["Use JavaScript", "Return an object with characters, words, and sentences numbers"],
            definitionOfDone: ["Reports the character count", "Reports the word count", "Counts sentence-ending punctuation", "Returns zero counts for empty text"],
            hints: ["The string length includes spaces and punctuation.", "Trim before splitting to avoid counting empty words.", "Split on one or more sentence-ending marks and ignore empty pieces."],
            functionName: "analyzeText",
            starterCode: `function analyzeText(text) {
  // TODO: calculate characters, words, and sentences
  return { characters: 0, words: 0, sentences: 0 };
}`,
            tests: [
                { name: "Analyzes a sentence", input: ["Hello world."], expectedOutput: { characters: 12, words: 2, sentences: 1 } },
                { name: "Counts multiple sentences", input: ["Wait... Really? yes!"], expectedOutput: { characters: 20, words: 3, sentences: 3 } },
                { name: "Handles empty text", input: [""], expectedOutput: { characters: 0, words: 0, sentences: 0 } }
            ],
            testSpec: { type: "function", checks: [] }
        }
    ]
};

export default [helloServer, textAnalyzer];
