/**
 * Content Retrieval Service - TF-IDF (Global + LaTeX/Formula-Aware)
 *
 * Architecture:
 * User Query → Entire Textbook → AI Context
 */

// ---------------------------
// Utility Functions
// ---------------------------

// Preprocess text: lowercase + preserve math/LaTeX symbols
function preprocessText(text) {
  return text
    .toLowerCase()
    // keep math symbols and LaTeX characters
    .replace(/[^\w\s=×\/\+\-\(\)\{\}\^\_\\]/g, "")
    .trim();
}

// Cosine similarity
function cosineSimilarity(a, b) {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

// ---------------------------
// Vocabulary + TF-IDF Helpers
// ---------------------------

function buildVocabulary(textMap) {
  const vocabMap = new Map();
  textMap.forEach((entry) => {
    const words = preprocessText(entry.text).split(/\s+/);
    words.forEach((w) => {
      if (!vocabMap.has(w)) vocabMap.set(w, vocabMap.size);
    });
  });
  console.log(`📖 Vocabulary size: ${vocabMap.size}`);
  return vocabMap;
}

function computeDocFreq(textMap, vocabMap) {
  const df = new Array(vocabMap.size).fill(0);
  textMap.forEach((entry) => {
    const uniqueWords = new Set(preprocessText(entry.text).split(/\s+/));
    uniqueWords.forEach((w) => {
      const idx = vocabMap.get(w);
      if (idx !== undefined) df[idx] += 1;
    });
  });
  console.log("📊 Document frequencies computed");
  return df;
}

function textToTFIDFVector(text, vocabMap, df, N) {
  const vec = new Array(vocabMap.size).fill(0);
  const words = preprocessText(text).split(/\s+/);
  const counts = {};
  words.forEach((w) => (counts[w] = (counts[w] || 0) + 1));

  for (const [w, idx] of vocabMap.entries()) {
    if (counts[w]) {
      const tf = counts[w] / words.length;
      const idf = Math.log(N / (df[idx] || 1));
      vec[idx] = tf * idf;
    }
  }
  return vec;
}

// ---------------------------
// Formula Detection Helper
// ---------------------------

function containsFormula(text) {
  return /[=×\/\+\-\^\\]/.test(text) || /\\sum|_i|EF_i|A_i/.test(text);
}

// ---------------------------
// Build Text Maps
// ---------------------------

export function createTextMap(chapter) {
  const textMap = [];

  const addParagraphs = (text, metadata) => {
    if (!text) return;

    const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0);
    paragraphs.forEach((para, idx) => {
      if (para.length < 10) return;
      textMap.push({
        ...metadata,
        id: `${metadata.idPrefix}-p${idx}`,
        text: para,
      });
    });
  };

  if (chapter.content) {
    addParagraphs(chapter.content, {
      idPrefix: `ch${chapter.id}`,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
    });
  }

  if (chapter.subchapters) {
    chapter.subchapters.forEach((sub) => {
      addParagraphs(sub.content, {
        idPrefix: `ch${chapter.id}-sub${sub.id}`,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        subchapterTitle: sub.title,
      });

      if (Array.isArray(sub.sections)) {
        sub.sections.forEach((section, sectionIdx) => {
          addParagraphs(section?.content, {
            idPrefix: `ch${chapter.id}-sub${sub.id}-sec${sectionIdx}`,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            subchapterTitle: sub.title,
            sectionTitle: section?.videoTitle || section?.quizTitle,
          });
        });
      }
    });
  }

  console.log(`📦 Built text map for chapter ${chapter.id}: ${textMap.length} paragraphs`);
  return textMap;
}

export function createTextMapFromAllChapters(chaptersData) {
  let fullMap = [];
  for (const chapter of Object.values(chaptersData)) {
    fullMap = fullMap.concat(createTextMap(chapter));
  }
  console.log(`📦 Full textbook text map: ${fullMap.length} paragraphs`);
  return fullMap;
}

// ---------------------------
// TF-IDF Retrieval (Global + Formula Boost)
// ---------------------------

export function findTopKTFIDF(query, textMap, topK = 3) {
  const vocabMap = buildVocabulary(textMap);
  const df = computeDocFreq(textMap, vocabMap);
  const N = textMap.length;

  const vectors = textMap.map((entry) =>
    textToTFIDFVector(entry.text, vocabMap, df, N)
  );
  const queryVec = textToTFIDFVector(query, vocabMap, df, N);

  const scored = textMap.map((entry, idx) => {
    let sim = cosineSimilarity(queryVec, vectors[idx]);
    // Boost formula relevance if query mentions formula or symbols
    if (containsFormula(entry.text) && /formula|pengiraan|equation|=|×|\\sum/.test(query)) {
      sim *= 2.0;
    }
    console.log(`🔹 Similarity for paragraph ${entry.id}:`, sim.toFixed(4));
    return { ...entry, similarity: sim };
  });

  // Hybrid: ensure formula paragraphs are considered if query is formula-related
  let top = scored.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
  if (/formula|pengiraan|equation|=|×|\\sum/.test(query)) {
    const formulaParas = scored.filter((e) => containsFormula(e.text));
    top = [...new Set([...top, ...formulaParas])].slice(0, topK);
  }

  console.log("🏆 Top paragraphs IDs:", top.map((p) => p.id));
  return top;
}

// ---------------------------
// Build AI Context
// ---------------------------

export function buildContextForAI(relevantContent) {
  if (!relevantContent || relevantContent.length === 0) return "";

  let ctx = "\n\n=== RELEVANT TEXTBOOK CONTENT ===\n";
  relevantContent.forEach((item, i) => {
    ctx += `\n[${i + 1}] (${item.chapterTitle}`;
    if (item.subchapterTitle) ctx += ` → ${item.subchapterTitle}`;
    ctx += `)\n${item.text}\n`;
  });
  ctx += "\n=== END TEXTBOOK CONTENT ===\n\n";
  ctx += "Use the above textbook content as your primary source when answering. ";
  ctx += "If you need to use outside knowledge, clearly indicate it.\n";
  return ctx;
}

// ---------------------------
// Single-tier Retrieval (Global Only)
// ---------------------------

export function retrieveContextForQuery(
  query,
  chaptersData,
  { topK = 3 } = {}
) {
  console.log("🔍 Retrieving for query:", query);

  const fullText = createTextMapFromAllChapters(chaptersData);
  const relevantContent = findTopKTFIDF(query, fullText, topK);

  console.log("📚 Retrieval source: entire textbook");
  return buildContextForAI(relevantContent);
}
