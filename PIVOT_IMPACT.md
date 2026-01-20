# Pivot Impact Map: "Courses" to "Studio Time"

This document outlines the terminology mapping and impact analysis for pivoting the platform from a "Course/Class" model to a "Studio Time / Experience" model.

## Terminology Mapping

| Current Term | New Term | Notes |
| :--- | :--- | :--- |
| **Course / Class** | **Experience / Session** | Represents the core offering. "Studio Time" is a specific type of experience. |
| **Teacher / Instructor** | **Artist / Host** | The person facilitating the experience. |
| **Student** | **Guest / Visitor** | The person booking the experience. |
| **Booking** | **Reservation** | The act of reserving a spot. |
| **Lesson Plan** | **Session Flow** | (If applicable) The structure of the time spent. |
| **Curriculum** | **N/A** | Less relevant for drop-in studio time. |

## Hard-Coded Semantics to Abstract

The following areas currently enforce "Course" logic and need abstraction:

1.  **Data Models (`models/course.js`, `models/courseTimeslot.js`)**
    *   *Current:* Fields like `lessonPlan`, `prerequisites`, `skillLevel` might exist (need to verify schema).
    *   *Pivot:* These should be generalized into a `metadata` or `details` object, or made optional.
    *   *Action:* Create a generic `Experience` model or refactor `Course` to be more flexible.

2.  **UI Labels (Frontend)**
    *   *Current:* "Find a Class", "My Courses", "Teacher Dashboard".
    *   *Pivot:* "Book Studio Time", "My Sessions", "Artist Dashboard".
    *   *Action:* Centralize UI strings in a translation/constants file to switch terminology easily.

3.  **URL Routes**
    *   *Current:* `/api/courses`, `/courses/:id`.
    *   *Pivot:* `/api/experiences` (or keep `/api/courses` as legacy alias).
    *   *Action:* In Phase 2, introduce new routes and deprecate old ones.

4.  **Booking Logic**
    *   *Current:* May assume a "semester" or "multi-week" structure.
    *   *Pivot:* Studio time is likely single-session or ad-hoc.
    *   *Action:* Ensure booking logic supports single-slot reservations without cohort logic.

5.  **User Roles**
    *   *Current:* `isTeacher`, `isStudent` booleans in User model.
    *   *Pivot:* `isHost`, `isGuest`.
    *   *Action:* Abstract role checks. A user can be both.

## Immediate Next Steps (Phase 2)

1.  **Service Layer Extraction:** Move logic out of controllers into Services (e.g., `CourseService`, `BookingService`).
    *   *Naming:* Use generic names where possible (e.g., `ListingService` instead of `CourseService` if we want to be forward-looking, but `CourseService` is safer for now).
2.  **Validation:** Implement Zod schemas that make "course-specific" fields optional.
3.  **Frontend Pruning:** Remove unused date libraries to simplify the "Calendar" view which will be central to "Studio Time".
