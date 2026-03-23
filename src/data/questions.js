import pitanjaRaw from '../../Documents/pitanja-2.txt?raw';
import { parseQuestionsFromSource } from '../utils/parser';

const fallbackQuestions = [
  {
    id: 1,
    text: 'Kontaminacija je:',
    answers: [
      { letter: 'A', text: 'kontrolisana reakcija aminacije' },
      { letter: 'B', text: 'sahovski termin' },
      { letter: 'V', text: 'svodjenje racuna' },
      { letter: 'G', text: 'zagadjenje' }
    ],
    correctAnswer: 'G'
  }
];

const parsed = parseQuestionsFromSource(pitanjaRaw);

export const questionsData = parsed.length > 0 ? parsed : fallbackQuestions;

export default questionsData;
