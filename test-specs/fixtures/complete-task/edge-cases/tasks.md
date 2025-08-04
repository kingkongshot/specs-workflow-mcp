# Complex Task Structure - Edge Cases Test

## Various Edge Cases for Task Parser

### 1. Basic Main Task
- [ ] 1.1 Simple subtask with normal format
- [ ] 1.2 Another subtask under main task 1

### 2. Mixed Format Task
- [ ] 2.1 Subtask with **bold** text and `code`
- [ ] 2.2 Subtask with [link](http://example.com) and *italic*
- [ ] 2.3 Subtask with emoji 🚀 and special chars @#$%

### 3. Irregular Spacing Task
- [ ]3.1 No space after checkbox
- [ ]  3.2 Multiple spaces after checkbox
- [ ]	3.3 Tab after checkbox

### 4. Number Format Variations
- [ ] 4.01 Leading zero in subtask
- [ ] 4.1 Regular subtask
- [ ] 4.10 Double digit subtask
- [ ] 4.2 Another regular subtask

### 5. Multi-level Hierarchy
- [ ] 5.1 First level subtask
- [ ] 5.1.1 Second level sub-subtask
- [ ] 5.1.2 Another second level
- [ ] 5.2 Back to first level
- [ ] 5.2.1 Second level under 5.2
- [ ] 5.2.2 Another under 5.2
- [ ] 5.3 Third first-level task

### 6. Completed Tasks Mixed
- [x] 6.1 This task is already completed
- [ ] 6.2 This task is pending
- [X] 6.3 Uppercase X completion
- [ ] 6.4 Another pending task

### 7. Long Description Task
- [ ] 7.1 This is a very long task description that spans multiple concepts and ideas, including technical implementation details, user requirements, business logic, error handling, performance considerations, and documentation requirements
- [ ] 7.2 Short task

### 8. Special Characters in Numbers
- [ ] 8-1 Dash instead of dot (should not be recognized as valid)
- [ ] 8_2 Underscore instead of dot (invalid)
- [ ] 8.1 Valid dot notation
- [ ] 8/2 Slash notation (invalid)

### 9. Orphan Subtasks (No Main Task)
- [ ] 15.1 Subtask without main task 15
- [ ] 15.2 Another orphan under 15
- [ ] 16.1 Orphan under non-existent 16

### 10. Empty and Malformed
- [ ] 10.1 
- [ ] 10.2 Task with just spaces    
- [ ]
- [ ] 10.3 Normal task after empty ones

### 11. Duplicate Numbers
- [ ] 11.1 First occurrence of 11.1
- [ ] 11.2 Normal subtask
- [ ] 11.1 Duplicate 11.1 (should be handled gracefully)
- [ ] 11.3 Task after duplicate

### 12. Mixed Checkbox Styles
- [ ] 12.1 Regular empty checkbox
- [x] 12.2 Lowercase x
- [X] 12.3 Uppercase X
- [ ] 12.4 Regular empty again

### 13. No Space Before Number
- [ ]13.1 No space before number
- [ ] 13.2 Normal spacing

### 14. Multiple Dots in Numbers
- [ ] 14.1.1.1 Four-level deep task
- [ ] 14.1.1.2 Another four-level
- [ ] 14.1.2 Back to three levels
- [ ] 14.2 Two levels

## Non-Task Content

This paragraph should be ignored by the parser as it doesn't contain checkboxes.

### 20. Header Without Tasks

This section has a header but no actual tasks below it.

### 21. Mixed Content
- [ ] 21.1 Valid task
- Regular bullet point without checkbox
- Another bullet point
- [ ] 21.2 Another valid task

### 22. Tasks with Descriptions on Next Line
- [ ] 22.1
  Detailed description on the next line
- [ ] 22.2
  Another task with description below

### 23. Final Complex Test Group
- [x] 23.1 Completed task with complex **formatting** and `code blocks`
- [ ] 23.2 Pending task referencing issue #123 and PR !456
- [ ] 23.3 Task with URL: https://example.com/api/v1/endpoint
- [ ] 23.4 Task with file path: /path/to/important/file.ts
- [ ] 23.5 Last task in the edge cases test suite

## Summary Stats Expected
- Main tasks inferred: 14 (tasks 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 21, 22, 23)
- Total subtasks with checkboxes: 55
- Completed tasks: 3 (6.1, 6.3, 23.1)
- Pending tasks: 52