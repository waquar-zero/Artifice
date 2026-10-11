
import Submission from "../models/Submission.js";
import Sprint from "../models/Sprint.js";
import Progress from "../models/Progress.js";
import Project from "../models/Project.js";

import { runTests } from "../services/testing/index.js";

export const createSubmission = async (req, res) => {
    try {
        const { projectId, sprintId } = req.params;
        const { code, language } = req.body;

        // 1. Validate submitted data
        if (
            typeof code !== "string" ||
            !code.trim() ||
            typeof language !== "string" ||
            !language.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Code and language are required"
            });
        }

        // 2. Find the project
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        if (project.availability === "coming_soon") {
            return res.status(403).json({
                success: false,
                message: "This project is currently on hold"
            });
        }

        if (!project.execution) {
            return res.status(400).json({
                success: false,
                message:
                    "Project execution configuration is missing"
            });
        }

        // 3. Find the sprint belonging to this project
        const sprint = await Sprint.findOne({
            _id: sprintId,
            projectId
        });

        if (!sprint) {
            return res.status(404).json({
                success: false,
                message: "Sprint not found in this project"
            });
        }

        // 4. Check whether the user has started the project
        let progress = await Progress.findOne({
            userId: req.userId,
            projectId
        });

        if (!progress) {
            return res.status(403).json({
                success: false,
                message: "Project has not been started"
            });
        }

        // 5. Only allow submissions for the current sprint
        const isCurrentSprint =
            progress.currentSprint &&
            progress.currentSprint.toString() === sprintId;

        if (!isCurrentSprint) {
            return res.status(403).json({
                success: false,
                message:
                    "You can only submit the current sprint"
            });
        }

        // 6. Validate that the submitted language matches
        // the language this project's execution setup supports.
        if (
            language.trim().toLowerCase() !==
            project.language.trim().toLowerCase()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `This project requires ${project.language}`
            });
        }

        // 7. Run the sprint's generic test specification
        let testResult;
        try {
            testResult = await runTests({
                testSpec: sprint.testSpec,
                code,
                execution: project.execution,
                language: project.language,
                functionName: sprint.functionName,
                tests: sprint.tests
            });
        } catch (error) {
            if (
                error.message === "Test specification is missing" ||
                error.message.startsWith("Unsupported test type:")
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            console.error("Submission execution failed:", error.message);
            testResult = {
                passed: false,
                totalTests: sprint.testSpec?.type === "function"
                    ? sprint.tests?.length ?? 0
                    : sprint.testSpec?.checks?.length ?? 0,
                passedTests: 0,
                results: (sprint.testSpec?.type === "function"
                    ? sprint.tests || []
                    : sprint.testSpec?.checks || []).map((check, index) => ({
                    passed: false,
                    check: sprint.testSpec?.type === "function" ? "function_case" : check.type,
                    label: check.name || `Example ${index + 1}`,
                    status: "execution_error",
                    error: error.message
                })),
                error: error.message
            };
        }

        // 8. Determine submission status
        const status = testResult.passed
            ? "passed"
            : "failed";

        // 9. Store the submission
        const submission = await Submission.create({
            userId: req.userId,
            projectId,
            sprintId,
            language: language.trim().toLowerCase(),
            code,
            status,
            testResults: testResult
        });

        // 10. Advance progress only if every test passed
        if (testResult.passed) {
            const nextSprint = await Sprint.findOne({
                projectId,
                order: sprint.order + 1
            });

            // Compare-and-set the current sprint to prevent two parallel
            // passing submissions from advancing progress twice.
            await Progress.updateOne(
                {
                    _id: progress._id,
                    currentSprint: sprint._id
                },
                {
                    $addToSet: { completedSprints: sprint._id },
                    $set: {
                        currentSprint: nextSprint?._id ?? null
                    }
                }
            );

            const updatedProgress = await Progress.findById(progress._id);
            if (updatedProgress) {
                progress = updatedProgress;
            }
        }

        // 11. Return the submission, tests and progress
        return res.status(201).json({
            success: true,
            message: testResult.passed
                ? "Submission passed"
                : "Submission failed",
            data: {
                submission,
                tests: testResult,
                progress
            }
        });

    } catch (error) {
        console.error(
            "Create submission error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to process submission"
        });
    }
};

export const getSubmissions = async (req, res) => {
    try {
        const { projectId } = req.params;

        const submissions = await Submission.find({
            userId: req.userId,
            projectId
        })
            .select("-code")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: submissions
        });

    } catch (error) {
        console.error(
            "Get submissions error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch submissions"
        });
    }
};
