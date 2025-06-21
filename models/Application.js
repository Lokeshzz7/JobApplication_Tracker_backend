import { application } from "express";
import mongoose from "mongoose";

const ApplicationSchema = new mongoose.Schema({

  jobTitle: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  jobLink: String,
  jobDescription: String,

  currentStatus: {
    type: String,
    enum: ["applied", "under review", "interview scheduled", "offered", "rejected"],
    default: "applied"
  },

  statusHistory: [
    {
      status: {
        type: String,
        enum: ["applied", "under review", "interview scheduled", "offered", "rejected"]
      },
      updatedAt: { type: Date, default: Date.now },
      updatedBy: String,
      note: String
    }
  ],

  reminders: [
    {
      type: {
        type: String,
        enum: ["follow-up", "interview"],
        required: true
      },
      dueDate: { type: Date, required: true },
      note: String,
      isCompleted: { type: Boolean, default: false }
    }
  ],

  communications: [
    {
      date: { type: Date, default: Date.now },
      mode: String,
      summary: String,
      contactPerson: String
    }
  ],

  notes: { type: String, default: "" }, 

  resumeFeedback: String,
  coverLetterGenerated: String,
  interviewPrep: {
    predictedQuestions: [String],
    suggestedAnswers: [String]
  },
  successScore: Number,
  improvementTips: [String],

  appliedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


export default mongoose.model('Application', ApplicationSchema);