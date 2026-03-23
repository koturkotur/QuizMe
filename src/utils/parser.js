const ANSWER_LETTERS = ['A', 'B', 'V', 'G'];

const CYR_TO_LAT = {
  А: 'A', а: 'a', Б: 'B', б: 'b', В: 'V', в: 'v', Г: 'G', г: 'g', Д: 'D', д: 'd',
  Ђ: 'Dj', ђ: 'dj', Е: 'E', е: 'e', Ж: 'Z', ж: 'z', З: 'Z', з: 'z', И: 'I', и: 'i',
  Ј: 'J', ј: 'j', К: 'K', к: 'k', Л: 'L', л: 'l', Љ: 'Lj', љ: 'lj', М: 'M', м: 'm',
  Н: 'N', н: 'n', Њ: 'Nj', њ: 'nj', О: 'O', о: 'o', П: 'P', п: 'p', Р: 'R', р: 'r',
  С: 'S', с: 's', Т: 'T', т: 't', Ћ: 'C', ћ: 'c', У: 'U', у: 'u', Ф: 'F', ф: 'f',
  Х: 'H', х: 'h', Ц: 'C', ц: 'c', Ч: 'C', ч: 'c', Џ: 'Dz', џ: 'dz', Ш: 'S', ш: 's'
};

export function cyrillicToLatin(text) {
  return String(text)
    .split('')
    .map((char) => CYR_TO_LAT[char] ?? char)
    .join('');
}

function normalizeSerbianText(text) {
  const replacements = [
    [/\bsahovski\b/gi, 'šahovski'],
    [/\bsvodenje\b/gi, 'svođenje'],
    [/\bracuna\b/gi, 'računa'],
    [/\bzagadenje\b/gi, 'zagađenje'],
    [/\bzracenje\b/gi, 'zračenje']
  ];

  let normalized = String(text || '');

  for (const [pattern, replacement] of replacements) {
    normalized = normalized.replace(pattern, replacement);
  }

  normalized = normalized
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.:;!?])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();

  return normalized;
}

function normalizeLetter(letter) {
  const lower = String(letter).toLowerCase();
  if (lower === 'a' || lower === 'а') return 'A';
  if (lower === 'b' || lower === 'б') return 'B';
  if (lower === 'v' || lower === 'в') return 'V';
  if (lower === 'g' || lower === 'г') return 'G';
  return null;
}

export function parseQuestionsFromSource(text) {
  const questions = [];
  const normalized = String(text || '').replace(/\r/g, '');
  const questionBlocks = normalized.match(/\d+\.\s*[\s\S]*?(?=\n\s*\d+\.\s|$)/g) || [];

  for (const block of questionBlocks) {
    const singleLine = block.replace(/\s+/g, ' ').trim();
    const idMatch = singleLine.match(/^(\d+)\./);
    if (!idMatch) continue;

    const id = Number(idMatch[1]);
    const answerPattern = /(?:^|\s)([aAbBvVgGабвгАБВГ])\.\s*(.*?)(?=(?:\s+[aAbBvVgGабвгАБВГ])\.\s|$)/g;
    const firstAnswer = answerPattern.exec(singleLine);
    if (!firstAnswer) continue;

    const questionTextRaw = singleLine
      .slice(idMatch[0].length, firstAnswer.index)
      .replace(/\s+/g, ' ')
      .trim();

    const answers = [];
    answerPattern.lastIndex = firstAnswer.index;
    let match;
    while ((match = answerPattern.exec(singleLine)) !== null) {
      const letter = normalizeLetter(match[1]);
      const answerText = normalizeSerbianText(cyrillicToLatin(match[2]));
      if (!letter || !answerText) continue;
      answers.push({ letter, text: answerText });
    }

    if (answers.length !== 4) continue;

    questions.push({
      id,
      text: normalizeSerbianText(cyrillicToLatin(questionTextRaw)),
      answers,
      correctAnswer: 'G'
    });
  }

  return questions;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate a random test of n questions
 */
export function generateRandomTest(allQuestions, count = 30) {
  const shuffled = shuffleArray(allQuestions);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((q, index) => {
    const shuffledAnswers = shuffleArray(
      q.answers.map((answer) => ({
        ...answer,
        isCorrect: answer.letter === q.correctAnswer
      }))
    );

    const remappedAnswers = shuffledAnswers.map((answer, answerIndex) => ({
      letter: ANSWER_LETTERS[answerIndex],
      text: answer.text,
      isCorrect: answer.isCorrect
    }));

    const correctIndex = remappedAnswers.findIndex((answer) => answer.isCorrect);

    return {
      ...q,
      answers: remappedAnswers,
      correctAnswer: ANSWER_LETTERS[correctIndex],
      displayId: index + 1
    };
  });
}

/**
 * Keep question order, shuffle only answers for each question
 */
export function preparePracticeQuestions(allQuestions) {
  return allQuestions.map((q, index) => {
    const shuffledAnswers = shuffleArray(
      q.answers.map((answer) => ({
        ...answer,
        isCorrect: answer.letter === q.correctAnswer
      }))
    );

    const remappedAnswers = shuffledAnswers.map((answer, answerIndex) => ({
      letter: ANSWER_LETTERS[answerIndex],
      text: answer.text,
      isCorrect: answer.isCorrect
    }));

    const correctIndex = remappedAnswers.findIndex((answer) => answer.isCorrect);

    return {
      ...q,
      answers: remappedAnswers,
      correctAnswer: ANSWER_LETTERS[correctIndex],
      displayId: index + 1
    };
  });
}

/**
 * Get random questions (for display) without modifying answer positions
 */
export function getRandomQuestions(allQuestions, count = 30) {
  const shuffled = shuffleArray(allQuestions);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export { ANSWER_LETTERS };
