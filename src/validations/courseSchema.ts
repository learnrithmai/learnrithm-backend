import { stringNonEmpty } from "@/utils/zodUtils";
import { z } from "zod";

const multipleChoiceQuestionSchema = z.object({
  type: z.literal("multiple-choice"),
  question: stringNonEmpty(),
  options: z.array(stringNonEmpty()),
  correctAnswer: stringNonEmpty(),
});

const trueFalseQuestionSchema = z.object({
  type: z.literal("true-false"),
  question: stringNonEmpty(),
  correctAnswer: z.boolean(),
});

const shortAnswerQuestionSchema = z.object({
  type: z.literal("short-answer"),
  question: stringNonEmpty(),
  correctAnswer: stringNonEmpty(),
});

//  ---------------------------
const questionSchema = z.union([
  multipleChoiceQuestionSchema,
  trueFalseQuestionSchema,
  shortAnswerQuestionSchema,
]);

// Base schema for common fields
const baseExamSchema = z.object({
  title: stringNonEmpty(),
  description: stringNonEmpty(),
  questions: z.array(questionSchema),
});

// Schema for open session with teacherId
export const ExamSchema = {
  body: baseExamSchema.extend({
    trackId: stringNonEmpty(),
  }),
};

export type ExamBody = z.infer<typeof ExamSchema.body>;

// Schema for current teacher open session without teacherId
export const trackExamSchema = {
  body: baseExamSchema,
};

export type TrackExamBody = z.infer<typeof trackExamSchema.body>;
