import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "./config/db.js";

import Project from "./models/Project.js";
import Sprint from "./models/Sprint.js";

const projectData = {
    title: "Build an HTTP Server",
    slug: "build-http-server",
    description:
        "Build a working HTTP server from scratch and understand what happens underneath a web framework.",
    difficulty: "intermediate",
    language: "javascript",
    estimatedHours: 10
};

const sprintData = [
    {
        order: 1,
        title: "Accept TCP Connections",
        goal: "Create a server capable of accepting TCP connections from clients.",
        requirements: [
            "Create a TCP server",
            "Listen on a configurable port",
            "Accept incoming client connections",
            "Respond to a client connection"
        ],
        constraints: [
            "Use Node.js",
            "Do not use Express",
            "Use the built-in networking capabilities of Node.js"
        ],
        definitionOfDone: [
            "Server starts successfully",
            "Client can establish a TCP connection",
            "Server receives client data",
            "Server can send a response"
        ],
        hints: [
            "What Node.js module provides low-level TCP networking?",
            "Look into Node's net module.",
            "A TCP server needs to listen for incoming connections."
        ]
    },

    {
        order: 2,
        title: "Understand HTTP Requests",
        goal: "Receive raw HTTP data and understand its structure.",
        requirements: [
            "Receive an HTTP request",
            "Identify the HTTP method",
            "Identify the requested path",
            "Identify the HTTP version"
        ],
        constraints: [
            "Do not use Express",
            "Do not use an HTTP parsing library"
        ],
        definitionOfDone: [
            "Server can receive a raw HTTP request",
            "Method can be identified",
            "Path can be identified",
            "HTTP version can be identified"
        ],
        hints: [
            "HTTP requests are transmitted as text over TCP.",
            "Look at the first line of a raw HTTP request.",
            "The first line contains method, path and HTTP version."
        ]
    },

    {
        order: 3,
        title: "Build HTTP Responses",
        goal: "Construct valid HTTP responses manually.",
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
        ]
    },

    {
        order: 4,
        title: "Implement Routing",
        goal: "Allow different URLs to produce different responses.",
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
        ]
    },

    {
        order: 5,
        title: "Handle Multiple Requests",
        goal: "Make the server capable of handling multiple clients and requests.",
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
        ]
    }
];

const seedDatabase = async () => {
    try {
        await connectDB();

        // Clear existing development data
        await Sprint.deleteMany({});
        await Project.deleteMany({});

        // Create project
        const project = await Project.create(projectData);

        // Attach project ID to every sprint
        const sprints = sprintData.map((sprint) => ({
            ...sprint,
            projectId: project._id
        }));

        await Sprint.insertMany(sprints);

        console.log("Database seeded successfully");
        console.log(`Project: ${project.title}`);
        console.log(`Sprints: ${sprints.length}`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error);

        await mongoose.connection.close();
        process.exit(1);
    }
};

seedDatabase();
