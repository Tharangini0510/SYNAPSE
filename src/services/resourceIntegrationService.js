// =============================================================
// services/resourceIntegrationService.js – Resource Vault Integration
// =============================================================

/**
 * Generate a deck of Flashcard objects derived from a selected Resource Vault item.
 *
 * @param {Object} resource - Resource Vault item
 * @returns {Array<{front: string, back: string, subject: string}>}
 */
export function generateFlashcardsFromResourceItem(resource) {
  if (!resource) return [];

  const title = resource.title || 'Academic Resource';
  const desc = resource.description || 'Reference notes & study guide';
  const tags = (resource.tags || []).join(', ');
  const subject = resource.subject || 'Computer Science';
  const type = resource.type || 'Lecture Notes';

  const cards = [
    {
      front: `What is the main topic covered in "${title}"?`,
      back: desc
        ? `${desc}\n\n[Subject: ${subject} | Category: ${type}]`
        : `Key academic material for ${subject} covering ${title}.`,
      subject,
    },
    {
      front: `What academic resource category does "${title}" belong to?`,
      back: `Category: ${type}\nSubject: ${subject}${tags ? `\nTags: ${tags}` : ''}`,
      subject,
    },
  ];

  if (tags) {
    cards.push({
      front: `What key concepts or tags are associated with "${title}"?`,
      back: `Tagged terms: ${tags}\nSubject: ${subject}`,
      subject,
    });
  }

  if (resource.url && resource.url !== '#') {
    cards.push({
      front: `Where can the reference link for "${title}" be accessed?`,
      back: `URL: ${resource.url}\nType: ${type}`,
      subject,
    });
  }

  cards.push({
    front: `How should "${title}" be used for studying ${subject}?`,
    back: `Review this ${type} for definitions, key principles, and problem-solving in ${subject}.`,
    subject,
  });

  return cards;
}

/**
 * Generate a Quiz object containing Multiple Choice, True/False, and Fill-in questions derived from a Resource Vault item.
 *
 * @param {Object} resource - Resource Vault item
 * @returns {Object} Quiz payload
 */
export function generateQuizFromResourceItem(resource) {
  if (!resource) return null;

  const title = resource.title || 'Academic Resource';
  const desc = resource.description || 'Reference material & notes';
  const tags = (resource.tags || []).join(', ');
  const subject = resource.subject || 'Computer Science';
  const type = resource.type || 'Lecture Notes';

  const questions = [
    {
      id: `q_res_1`,
      questionText: `Which academic subject area does "${title}" address?`,
      options: [
        subject,
        subject === 'Mathematics' ? 'Computer Science' : 'Mathematics',
        subject === 'Physics' ? 'Data Structures' : 'Physics',
        subject === 'Algorithms' ? 'Software Engineering' : 'Algorithms',
      ],
      correctIndex: 0,
    },
    {
      id: `q_res_2`,
      questionText: `What is the academic category of the resource "${title}"?`,
      options: [
        type,
        type === 'Lecture Notes' ? 'Lab Manual' : 'Lecture Notes',
        type === 'Research Paper' ? 'Cheat Sheet' : 'Research Paper',
        type === 'Tutorial' ? 'Past Question Paper' : 'Tutorial',
      ],
      correctIndex: 0,
    },
    {
      id: `q_res_3`,
      questionText: `True or False: "${title}" is categorized under ${subject} as a ${type}.`,
      options: ['True', 'False'],
      correctIndex: 0,
    },
    {
      id: `q_res_4`,
      questionText: `What is the core focus of "${title}"?`,
      options: [
        desc ? desc.slice(0, 90) : `${title} key principles & revision`,
        'Unrelated general history',
        'Administrative course structure',
        'Optional extra reading',
      ],
      correctIndex: 0,
    },
  ];

  return {
    title: `Quiz: ${title}`,
    description: `Auto-generated assessment derived from ${type}: "${title}" (${subject}).`,
    subject,
    questions,
  };
}
