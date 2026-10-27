# 60 · Author quizzes and assignments

Before youth can take a quiz or hand in a piece of work, somebody has to write it. This video shows how a program director builds quizzes and assignments in PromiseHub: questions of four types with their correct answers, the rules a quiz is taken under, an assignment's task, the ways youth can submit it, a rubric with its total, due rules, and publishing, so nothing reaches youth before it is ready.

## A quiz for the module

Marisol Delgado is the program director at Harbourview. She opens Leading by Serving, a module of Leadership Foundations. A new card, Quizzes and assignments, sits under the lessons, with New quiz and New assignment. New quiz asks for a title and where the quiz sits: the whole module, or after one of its lessons. She calls it Leading by Serving quiz and attaches it to the whole module. The quiz builder opens as a draft with no questions yet, and the rules already set to a pass mark of seventy percent, two attempts, and the correct answers shown after each attempt.

## Four kinds of question

Add question opens one dialog for every type. A multiple choice question has two to six options, and exactly one is marked correct. A true or false question has no options to write; Marisol marks False. A multiple answer question can have several correct options, so the marks become checkboxes. A short answer question lists the answers it accepts, one per line, matched ignoring capitals and spaces at either end. The server checks every rule for the chosen type, so a question with no text, too few options or no correct answer is refused with a message beside the field. Each question is listed with its type and its correct answers, and Edit, Move up, Move down and Delete are named with the question's number.

## The rules

Marisol moves the true or false question to the top; the server saves the whole order at once. On the right are the settings. The pass mark runs from one to a hundred percent, attempts from one to ten or unlimited, and feedback is the correct answers after each attempt, the score only, or the correct answers after the last attempt. Shuffle changes only the order youth see. She sets eighty percent and three attempts, makes the quiz required to complete the module, and saves. Then the status dialog publishes it.

## An assignment and its rubric

Next, New assignment. Marisol calls it Serve someone this week and attaches it after the lesson Pick Up the Towel. It starts as a draft that accepts a text reflection. She writes the task youth read, adds Photo as a second way to submit, and builds the rubric in a small dialog: chose someone and served without being asked, ten points; described what they did and how it felt, ten points; named one thing they noticed, five points. Each criterion can still be edited or removed from the list. The page keeps the criteria until Save assignment sends them, and the server works out the total, twenty five points. A due date, two days' grace, late work allowed and flagged for the mentor, and mentor approval before it counts as complete. Saving confirms with the title and the total. The status dialog publishes it, which assigns it to youth in the cohorts that follow the track once the module and track are published. Back on the module, both are listed, with what they are attached to.

## On a phone

On a phone the builder stacks: the questions first, then the settings, and the question dialog fits the screen with its own scrolling.

## Refused, empty and off

Publishing a quiz with no questions is refused, and so is an assignment with no task or no rubric. Saving an assignment with no task and no way to submit names both, in the fields and in a summary that takes the focus. An unknown quiz, or one from another organization, is not found. A failed load offers Try again. Site leads, youth workers, youth and mentors are refused by the server, and correct answers are only ever sent to authors. Turn Learning off, and these pages go to Today while every endpoint answers not found. Deleting a lesson moves its quizzes and assignments to the whole module.

## How it is tested

The API tests cover each question type and its refusals, editing, deleting and the order, the quiz rules and their ranges, the assignment's fields, rubric and total, publishing, the lesson fallback, other roles, another organization and Learning off. The browser tests run both builders and their dialogs on a phone and a laptop against the fake API, with accessibility checks and no sideways scrolling.

## Recap

Things to remember. A quiz or an assignment belongs to a module, and is attached to the whole module or one of its lessons. Questions come in four types, and the server checks each one's correct answers. A rubric is saved with its assignment, and the server stores the total. Nothing is published without questions, a task or a rubric. Next, youth take the quizzes.
