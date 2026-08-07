/**
 * exam_rules.js
 * Defines the business logic for subject selection and timing across different exam bodies.
 */

const EXAM_RULES = {
  getRules: function(examId) {
    if (examId.includes('jamb')) {
      return {
        selectionType: 'jamb_style',
        compulsorySubjectKeyword: 'english',
        totalSubjectsAllowed: 4,
        timeCalculation: 'fixed',
        totalTimeMinutes: 120,
        questionLimits: {
          compulsory: 60,
          others: 40
        }
      };
    } else if (examId.includes('waec') || examId.includes('neco')) {
      return {
        selectionType: 'any_optional',
        totalSubjectsAllowed: 4,
        timeCalculation: 'per_subject',
        timePerSubjectMinutes: 50,
        questionLimits: {
          default: 50
        }
      };
    } else if (examId.includes('sat')) {
      return {
        selectionType: 'all_compulsory',
        totalSubjectsAllowed: 'all',
        timeCalculation: 'fixed',
        totalTimeMinutes: 180, // Typical SAT duration
        questionLimits: {
          default: 1000 // No limit, load all available
        }
      };
    } else {
      // Default fallback
      return {
        selectionType: 'any_optional',
        totalSubjectsAllowed: 4,
        timeCalculation: 'fixed',
        totalTimeMinutes: 120,
        questionLimits: {
          default: 50
        }
      };
    }
  }
};
