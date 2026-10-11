import dotenv from "dotenv";

dotenv.config();

import mongoose from "mongoose";

import connectDB from "./config/db.js";

import Project from "./models/Project.js";
import Sprint from "./models/Sprint.js";
import additionalProjects from "./seeds/additionalProjects.js";

console.log("SEED FILE STARTED");

const projectData = {
    title: "Build an HTTP Server",

    slug: "build-http-server",

    description:
        "Build a working HTTP server from scratch and understand what happens underneath a web framework.",

    difficulty: "intermediate",

    language: "javascript",

    estimatedHours: 10,

    availability: "coming_soon",

    learningGuide: {
        introduction: "Build an HTTP server from the ground up and learn how web requests are received, interpreted, and answered.",
        sections: [
            { title: "What is an HTTP server?", body: "An HTTP server accepts requests from clients, reads details such as the method and URL, and sends back a status, headers, and response body." },
            { title: "Why learn how it works?", body: "Understanding the protocol helps explain what frameworks do for you and makes it easier to debug APIs and web applications." },
            { title: "How will you implement it?", body: "You’ll work from raw TCP connections toward parsing HTTP requests, building responses, routing URLs, and handling multiple requests." },
            { title: "What you’ll practice", body: "The project is currently on hold. Its learning guide is here so the project catalog can use the same introduction flow when it becomes available." }
        ]
    },

    execution: {
        type: "process",
        entrypoint: "server.js",
        startCommand: "node server.js",
        port: 3000
    }
};

const sprintData = [
    {
        order: 1,

        title: "Accept TCP Connections",

        goal:
            "Create a server capable of accepting TCP connections from clients.",

        requirements: [
            "Create a TCP server",
            "Listen on a configurable port",
            "Accept incoming client connections",
            "When a client sends PING, respond with PONG"
        ],

        constraints: [
            "Use Node.js",
            "Do not use Express",
            "Use the built-in networking capabilities of Node.js"
        ],

        definitionOfDone: [
            "Server starts successfully",
            "Client can establish a TCP connection",
            "Server receives PING and responds with PONG"
        ],

        hints: [
            "What Node.js module provides low-level TCP networking?",
            "Look into Node's net module.",
            "A TCP server needs to listen for incoming connections."
        ],

        testSpec: {
            type: "tcp",

            checks: [
                {
                    type: "server_starts"
                },

                {
                    type: "tcp_connection"
                },

                {
                    type: "receives_data",
                    config: { payload: "PING\r\n", expectedText: "PONG" }
                },

                {
                    type: "sends_response",
                    config: { payload: "PING\r\n", expectedText: "PONG" }
                }
            ]
        }
    },

    {
        order: 2,

        title: "Understand HTTP Requests",

        goal:
            "Receive raw HTTP data and understand its structure.",

        requirements: [
            "Receive an HTTP request",
            "Identify the HTTP method",
            "Identify the requested path",
            "Identify the HTTP version",
            "Include the parsed method, path and version in the response"
        ],

        constraints: [
            "Do not use Express",
            "Do not use an HTTP parsing library"
        ],

        definitionOfDone: [
            "Server can receive a raw HTTP request",
            "Method can be identified",
            "Path can be identified",
            "HTTP version can be identified",
            "The response to GET /probe HTTP/1.1 includes GET, /probe and HTTP/1.1"
        ],

        hints: [
            "HTTP requests are transmitted as text over TCP.",
            "Look at the first line of a raw HTTP request.",
            "The first line contains method, path and HTTP version."
        ],

        testSpec: {
            type: "tcp",

            checks: [
                {
                    type: "server_starts"
                },

                {
                    type: "http_request"
                },

                {
                    type: "method_detection"
                },

                {
                    type: "path_detection"
                },

                {
                    type: "http_version_detection"
                }
            ]
        }
    },

    {
        order: 3,

        title: "Build HTTP Responses",

        goal:
            "Construct valid HTTP responses manually.",

        requirements: [
            "Return an HTTP status code",
            "Return HTTP headers",
            "Return a response body",
            "Terminate the HTTP response correctly"
        ],

        constraints: [
            "Do not use Express",
            "Construct the response manually"
        ],

        definitionOfDone: [
            "Browser receives a valid HTTP response",
            "Response contains a status code",
            "Response contains headers",
            "Response contains a body"
        ],

        hints: [
            "HTTP responses also have a defined textual structure.",
            "Look at the status line of an HTTP response.",
            "Headers and body are separated by a blank line."
        ],

        testSpec: {
            type: "http",

            checks: [
                {
                    type: "server_starts"
                },

                {
                    type: "http_response"
                },

                {
                    type: "status_code"
                },

                {
                    type: "headers",
                    config: {
                        header: "content-type"
                    }
                },

                {
                    type: "response_body",
                    config: {
                        expectedBody: "Hello"
                    }
                }
            ]
        }
    },

    {
        order: 4,

        title: "Implement Routing",

        goal:
            "Allow different URLs to produce different responses.",

        requirements: [
            "Support multiple paths",
            "Match incoming requests to routes",
            "Return different responses for different paths",
            "Handle unknown routes"
        ],

        constraints: [
            "Do not use Express routing",
            "Implement the routing logic yourself"
        ],

        definitionOfDone: [
            "GET / returns one response",
            "GET /about returns another response",
            "Unknown paths return an appropriate response"
        ],

        hints: [
            "You already have the requested path.",
            "What data structure could map a path to a handler?",
            "Think about a routing table."
        ],

        testSpec: {
            type: "http",
            checks: [
                {
                    type: "server_starts"
                },
                {
                    type: "route",
                    config: {
                        method: "GET",
                        path: "/",
                        expectedStatus: 200,
                        expectedBody: "Hello"
                    }
                },
                {
                    type: "route",
                    config: {
                        method: "GET",
                        path: "/about",
                        expectedStatus: 200,
                        expectedBody: "About"
                    }
                },
                {
                    type: "unknown_route",
                    config: {
                        path: "/does-not-exist",
                        expectedStatus: 404
                    }
                }
            ]
        }
    },

    {
        order: 5,

        title: "Handle Multiple Requests",

        goal:
            "Make the server capable of handling multiple clients and requests.",

        requirements: [
            "Handle multiple connections",
            "Handle multiple requests",
            "Avoid crashing on malformed input",
            "Close connections correctly"
        ],

        constraints: [
            "Do not use Express",
            "Keep the implementation asynchronous"
        ],

        definitionOfDone: [
            "Multiple clients can connect",
            "Server remains running after requests",
            "Malformed input does not crash the server"
        ],

        hints: [
            "Node.js networking is event-driven.",
            "Think about what happens when multiple connections arrive.",
            "Separate connection handling from request parsing."
        ],

        testSpec: {
            type: "tcp",

            checks: [
                {
                    type: "server_starts"
                },

                {
                    type: "multiple_connections"
                },

                {
                    type: "multiple_requests",
                    config: { expectedText: "PONG" }
                },

                {
                    type: "malformed_request"
                },

                {
                    type: "server_stays_alive"
                }
            ]
        }
    }
];

const seedProject = async ({ project: projectFields, sprints: sprintFields }) => {
    const project = await Project.findOneAndUpdate(
        { slug: projectFields.slug },
        projectFields,
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    for (const sprintFieldsItem of sprintFields) {
        await Sprint.findOneAndUpdate(
            { projectId: project._id, order: sprintFieldsItem.order },
            { ...sprintFieldsItem, projectId: project._id },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
    }

    return { project, sprintCount: sprintFields.length };
};

const seedDatabase = async () => {
    try {
        console.log("seedDatabase() started");

        console.log(
            "MONGO_URI loaded:",
            Boolean(process.env.MONGO_URI)
        );

        await connectDB();

        console.log("connectDB() finished");

        const seeded = [];
        seeded.push(await seedProject({ project: projectData, sprints: sprintData }));
        for (const project of additionalProjects) seeded.push(await seedProject(project));

        console.log("");

        console.log("==============================");
        console.log("Database seeded successfully");
        console.log("==============================");

        console.log(`Projects updated: ${seeded.length}`);
        for (const item of seeded) {
            console.log(`Project: ${item.project.title} (${item.project.availability}) — ${item.sprintCount} sprints`);
        }

        console.log("==============================");

        await mongoose.connection.close();

        console.log("MongoDB connection closed");

        process.exit(0);

    } catch (error) {

        console.error("");

        console.error("==============================");
        console.error("SEED FAILED");
        console.error("==============================");

        console.error(error);

        console.error("==============================");

        try {
            await mongoose.connection.close();
        } catch (closeError) {
            console.error(
                "Failed to close MongoDB connection:",
                closeError.message
            );
        }

        process.exit(1);
    }
};

seedDatabase();
