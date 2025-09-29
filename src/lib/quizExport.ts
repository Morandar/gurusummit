import { supabase } from './supabase';

export interface QuizQuestion {
  id: number;
  question_text: string;
  question_type: string;
  category: string;
  difficulty: string;
  points: number;
  time_limit: number;
  is_active: boolean;
  order_position: number;
  created_at: string;
  updated_at: string;
}

export interface QuizAnswer {
  id: number;
  question_id: number;
  answer_text: string;
  is_correct: boolean;
  order_position: number;
  created_at: string;
}

export interface QuizMedia {
  id: number;
  question_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
}

export interface QuizExportData {
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  media: QuizMedia[];
}

/**
 * Fetch all quiz data from the database
 */
export async function fetchQuizData(): Promise<QuizExportData> {
  try {
    // Fetch questions
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .order('order_position', { ascending: true });

    if (questionsError) {
      console.error('Error fetching quiz questions:', questionsError);
      throw questionsError;
    }

    // Fetch answers
    const { data: answers, error: answersError } = await supabase
      .from('quiz_answers')
      .select('*')
      .order('question_id', { ascending: true })
      .order('order_position', { ascending: true });

    if (answersError) {
      console.error('Error fetching quiz answers:', answersError);
      throw answersError;
    }

    // Fetch media files
    const { data: media, error: mediaError } = await supabase
      .from('quiz_media')
      .select('*')
      .order('question_id', { ascending: true });

    if (mediaError) {
      console.error('Error fetching quiz media:', mediaError);
      throw mediaError;
    }

    return {
      questions: questions || [],
      answers: answers || [],
      media: media || []
    };
  } catch (error) {
    console.error('Error fetching quiz data:', error);
    throw error;
  }
}

/**
 * Convert quiz data to CSV format
 */
export function quizDataToCSV(data: QuizExportData): string {
  const csvRows: string[] = [];

  // CSV Header
  csvRows.push('Question ID,Question Text,Question Type,Category,Difficulty,Points,Time Limit,Is Active,Order Position,Created At,Updated At,Answer ID,Answer Text,Is Correct,Answer Order,Answer Created At,Media ID,File Name,File URL,File Type,File Size,Mime Type,Media Uploaded At');

  // Process each question
  data.questions.forEach(question => {
    // Get answers for this question
    const questionAnswers = data.answers.filter(answer => answer.question_id === question.id);

    // Get media for this question
    const questionMedia = data.media.filter(media => media.question_id === question.id);

    // If no answers and no media, create a single row
    if (questionAnswers.length === 0 && questionMedia.length === 0) {
      csvRows.push(`${question.id},"${escapeCSV(question.question_text)}",${question.question_type},${question.category},${question.difficulty},${question.points},${question.time_limit},${question.is_active},${question.order_position},${question.created_at},${question.updated_at},,,,,,,`);
    }

    // Create rows for each answer
    questionAnswers.forEach((answer, answerIndex) => {
      const mediaData = answerIndex < questionMedia.length ? questionMedia[answerIndex] : null;
      const mediaRow = mediaData ?
        `${mediaData.id},"${escapeCSV(mediaData.file_name)}","${escapeCSV(mediaData.file_url)}",${mediaData.file_type},${mediaData.file_size || ''},${mediaData.mime_type || ''},${mediaData.uploaded_at}` :
        ',,,,,,';

      csvRows.push(`${question.id},"${escapeCSV(question.question_text)}",${question.question_type},${question.category},${question.difficulty},${question.points},${question.time_limit},${question.is_active},${question.order_position},${question.created_at},${question.updated_at},${answer.id},"${escapeCSV(answer.answer_text)}",${answer.is_correct},${answer.order_position},${answer.created_at},${mediaRow}`);
    });

    // If more media than answers, add extra rows for media
    if (questionMedia.length > questionAnswers.length) {
      for (let i = questionAnswers.length; i < questionMedia.length; i++) {
        const mediaData = questionMedia[i];
        csvRows.push(`${question.id},"${escapeCSV(question.question_text)}",${question.question_type},${question.category},${question.difficulty},${question.points},${question.time_limit},${question.is_active},${question.order_position},${question.created_at},${question.updated_at},,,,,,${mediaData.id},"${escapeCSV(mediaData.file_name)}","${escapeCSV(mediaData.file_url)}",${mediaData.file_type},${mediaData.file_size || ''},${mediaData.mime_type || ''},${mediaData.uploaded_at}`);
      }
    }
  });

  return csvRows.join('\n');
}

/**
 * Convert quiz data to Excel-compatible format (using a library approach)
 * For now, we'll create a more detailed CSV that Excel can import well
 */
export function quizDataToExcelCSV(data: QuizExportData): string {
  const csvRows: string[] = [];

  // Excel-friendly header with BOM for proper encoding
  const BOM = '\uFEFF';
  csvRows.push(BOM + 'Question ID\tQuestion Text\tQuestion Type\tCategory\tDifficulty\tPoints\tTime Limit\tIs Active\tOrder Position\tCreated At\tUpdated At\tAnswer ID\tAnswer Text\tIs Correct\tAnswer Order\tAnswer Created At\tMedia ID\tFile Name\tFile URL\tFile Type\tFile Size\tMime Type\tMedia Uploaded At');

  // Process data similar to CSV but with tabs for Excel
  data.questions.forEach(question => {
    const questionAnswers = data.answers.filter(answer => answer.question_id === question.id);
    const questionMedia = data.media.filter(media => media.question_id === question.id);

    if (questionAnswers.length === 0 && questionMedia.length === 0) {
      csvRows.push(`${question.id}\t${question.question_text}\t${question.question_type}\t${question.category}\t${question.difficulty}\t${question.points}\t${question.time_limit}\t${question.is_active}\t${question.order_position}\t${question.created_at}\t${question.updated_at}\t\t\t\t\t\t\t\t\t\t\t`);
    }

    questionAnswers.forEach((answer, answerIndex) => {
      const mediaData = answerIndex < questionMedia.length ? questionMedia[answerIndex] : null;
      const mediaRow = mediaData ?
        `\t${mediaData.id}\t${mediaData.file_name}\t${mediaData.file_url}\t${mediaData.file_type}\t${mediaData.file_size || ''}\t${mediaData.mime_type || ''}\t${mediaData.uploaded_at}` :
        '\t\t\t\t\t\t';

      csvRows.push(`${question.id}\t${question.question_text}\t${question.question_type}\t${question.category}\t${question.difficulty}\t${question.points}\t${question.time_limit}\t${question.is_active}\t${question.order_position}\t${question.created_at}\t${question.updated_at}\t${answer.id}\t${answer.answer_text}\t${answer.is_correct}\t${answer.order_position}\t${answer.created_at}${mediaRow}`);
    });

    if (questionMedia.length > questionAnswers.length) {
      for (let i = questionAnswers.length; i < questionMedia.length; i++) {
        const mediaData = questionMedia[i];
        csvRows.push(`${question.id}\t${question.question_text}\t${question.question_type}\t${question.category}\t${question.difficulty}\t${question.points}\t${question.time_limit}\t${question.is_active}\t${question.order_position}\t${question.created_at}\t${question.updated_at}\t\t\t\t\t\t${mediaData.id}\t${mediaData.file_name}\t${mediaData.file_url}\t${mediaData.file_type}\t${mediaData.file_size || ''}\t${mediaData.mime_type || ''}\t${mediaData.uploaded_at}`);
      }
    }
  });

  return csvRows.join('\n');
}

/**
 * Download quiz data as CSV file
 */
export async function downloadQuizAsCSV(): Promise<void> {
  try {
    const data = await fetchQuizData();
    const csvContent = quizDataToCSV(data);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `quiz_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Error downloading quiz as CSV:', error);
    throw error;
  }
}

/**
 * Download quiz data as Excel-compatible CSV file
 */
export async function downloadQuizAsExcel(): Promise<void> {
  try {
    const data = await fetchQuizData();
    const excelContent = quizDataToExcelCSV(data);

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `quiz_export_${new Date().toISOString().split('T')[0]}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Error downloading quiz as Excel:', error);
    throw error;
  }
}

/**
 * Download all media files as a ZIP (placeholder - would need additional library)
 * For now, creates a text file with all media URLs for manual download
 */
export async function downloadQuizMedia(): Promise<void> {
  try {
    const data = await fetchQuizData();
    const mediaFiles = data.media;

    if (mediaFiles.length === 0) {
      alert('Žádné mediální soubory k exportu.');
      return;
    }

    // Create a text file with all media URLs and metadata
    const mediaContent = mediaFiles.map(media =>
      `Question ID: ${media.question_id}\n` +
      `File Name: ${media.file_name}\n` +
      `File URL: ${media.file_url}\n` +
      `File Type: ${media.file_type}\n` +
      `File Size: ${media.file_size || 'Unknown'} bytes\n` +
      `Mime Type: ${media.mime_type || 'Unknown'}\n` +
      `Uploaded At: ${media.uploaded_at}\n` +
      `---\n`
    ).join('\n');

    const blob = new Blob([mediaContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `quiz_media_urls_${new Date().toISOString().split('T')[0]}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Error downloading quiz media:', error);
    throw error;
  }
}

/**
 * Helper function to escape CSV values
 */
function escapeCSV(value: string): string {
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

/**
 * Get quiz statistics
 */
export async function getQuizStats(): Promise<{
  totalQuestions: number;
  activeQuestions: number;
  totalAnswers: number;
  mediaFiles: number;
  categories: string[];
}> {
  try {
    const data = await fetchQuizData();

    const categories = [...new Set(data.questions.map(q => q.category))];

    return {
      totalQuestions: data.questions.length,
      activeQuestions: data.questions.filter(q => q.is_active).length,
      totalAnswers: data.answers.length,
      mediaFiles: data.media.length,
      categories
    };
  } catch (error) {
    console.error('Error getting quiz stats:', error);
    return {
      totalQuestions: 0,
      activeQuestions: 0,
      totalAnswers: 0,
      mediaFiles: 0,
      categories: []
    };
  }
}