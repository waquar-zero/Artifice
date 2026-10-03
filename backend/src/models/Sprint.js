import mongoose from "mongoose";

const sprintSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    order: {
      type: Number,
      required: true
    },

    concepts: [
      {
        type: String,
        trim: true
      }
    ],

    hints: [
      {
        level: {
          type: Number,
          required: true
        },
        text: {
          type: String,
          required: true
        }
      }
    ],

    // Function that the learner's code is expected to implement
    functionName: {
      type: String,
      required: true,
      trim: true
    },

    // Automated test cases
    tests: [
      {
        input: {
          type: [mongoose.Schema.Types.Mixed],
          required: true
        },

        expectedOutput: {
          type: mongoose.Schema.Types.Mixed,
          required: true
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

const Sprint = mongoose.model("Sprint", sprintSchema);

export default Sprint;