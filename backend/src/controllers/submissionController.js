import Submission from "../models/Submission.js";
import Sprint from "../models/Sprint.js";
import Progress from "../models/Progress.js";

import { runTests } from "../services/testing/testRunner.js";

export const createSubmission = async (req, res) => {
    try {
        const { projectId, sprintId } = req.params;
        const { code, language } = req.body;

        // 1. Validate request
        if (!code || !language) {
            return res.status(400).json({
                success: false,
                message: "Code and language are required"
            });
        }

        // 2. Find the sprint
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

        // 3. Find user's progress
        const progress = await Progress.findOne({
            userId: req.userId,
            projectId
        });

        if (!progress) {
            return res.status(403).json({
                success: false,
                message: "Project has not been started"
            });
        }

        // 4. Make sure this is the current sprint
        const isCurrentSprint =
            progress.currentSprint &&
            progress.currentSprint.toString() === sprintId;

        if (!isCurrentSprint) {
            return res.status(403).json({
                success: false,
                message: "You can only submit the current sprint"
            });
        }

        // 5. Run automated tests
        const testResult = await runTests({
            language,
            code,
            functionName: sprint.functionName,
            tests: sprint.tests
        });

        // 6. Determine submission status
        const status = testResult.passed
            ? "passed"
            : "failed";

        // 7. Store submission
        const submission = await Submission.create({
            userId: req.userId,
            projectId,
            sprintId,
            language,
            code,
            status
        });

        // 8. If tests passed, unlock next sprint
        if (testResult.passed) {
            progress.completedSprints.push(sprint._id);

            const nextSprint = await Sprint.findOne({
                projectId,
                order: sprint.order + 1
            });

            if (nextSprint) {
                progress.currentSprint = nextSprint._id;
            } else {
                progress.currentSprint = null;
            }

            await progress.save();
        }

        // 9. Return result
        res.status(201).json({
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
        console.error("Create submission error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to process submission"
        });
    }
};