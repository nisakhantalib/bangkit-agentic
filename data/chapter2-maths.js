/* eslint-disable max-len */
export const chapter2 = {
  id: 2,
  title: "Bab 2: Matriks",
  icon: "[]",
  subchapters: [
    {
      id: 2.0,
      title: "Pengenalan Bab 2",
      sections: [
        {
          content: `
# Bab 2: Matriks

## Apakah yang akan anda pelajari?
- Matriks
- Operasi Asas Matriks

## Gerbang Istilah
| Istilah Bahasa Melayu | English |
|---|---|
| matriks | matrix |
| matriks baris | row matrix |
| matriks lajur | column matrix |
| matriks segi empat sama | square matrix |
| matriks segi empat tepat | rectangular matrix |
| matriks sifar | zero matrix |
| matriks identiti | identity matrix |
| matriks songsang | inverse matrix |
| pendaraban skalar | scalar multiplication |
| penentu | determinant |
| peringkat | order |
| unsur | element |

## Idea Utama Bab Ini
Matriks ialah susunan nombor dalam baris dan lajur. Matriks boleh digunakan untuk menyimpan dan mewakilkan maklumat seperti jualan, markah, inventori, laluan pengangkutan atau data kewangan.

Contohnya, data jualan tiga jenis barang di dua cawangan boleh ditulis sebagai matriks berperingkat 2 x 3. Baris boleh mewakili cawangan, manakala lajur boleh mewakili jenis barang.
          `,
          pastExamQuestions: {
            topic: "Pengenalan Matriks",
            questions: [
              {
                year: "2024 Trial",
                paper: "Paper 1",
                questionNumber: "Q11",
                type: "Objective",
                question: "Matriks ialah nombor-nombor yang disusun dalam",
                options: [
                  "A. baris dan lajur",
                  "B. bulatan sahaja",
                  "C. satu garisan melengkung",
                  "D. bentuk pecahan sahaja"
                ],
                correct: "A",
                answer: "A. baris dan lajur",
                explanation: "Matriks ialah tatasusun nombor dalam baris dan lajur.",
                focus: ["Definisi matriks", "Baris dan lajur"]
              }
            ]
          }
        }
      ]
    },
    {
      id: 2.1,
      title: "2.1 Matriks",
      sections: [
        {
          content: `
# 2.1 Matriks

## Mewakilkan Maklumat dalam Bentuk Matriks
Maklumat dalam jadual boleh diwakilkan sebagai matriks. Matriks biasanya ditulis menggunakan huruf besar seperti A, B atau C dan menggunakan tanda kurung [ ] atau ( ).

Contoh:

\`\`\`text
A = [16  18  11
     35  10   4]
\`\`\`

Matriks A mempunyai 2 baris dan 3 lajur.

![Rajah buku teks yang menunjukkan data hamparan ditukar kepada bentuk matriks](/textbook/math/t5/diagrams/bab2-matriks-perwakilan-data.png)

*Rajah buku teks: data jualan dalam jadual boleh diwakilkan sebagai matriks dengan baris dan lajur yang sepadan.*

## Jenis Matriks
- Matriks baris: mempunyai satu baris sahaja, contohnya [1700 2100 2000 1800].
- Matriks lajur: mempunyai satu lajur sahaja.
- Matriks segi empat sama: bilangan baris sama dengan bilangan lajur.
- Matriks segi empat tepat: bilangan baris tidak sama dengan bilangan lajur.

## Peringkat Matriks
Peringkat matriks ditentukan oleh bilangan baris dan bilangan lajur.

\`\`\`text
peringkat matriks = bilangan baris x bilangan lajur
\`\`\`

Jika matriks mempunyai 2 baris dan 3 lajur, peringkatnya ialah 2 x 3.

## Unsur Matriks
Setiap nombor dalam matriks dikenali sebagai unsur. Unsur pada baris ke-i dan lajur ke-j bagi matriks A ditulis sebagai aij.

Contoh:

\`\`\`text
A = [16  18  11
     35  10   4]
\`\`\`

Unsur a23 ialah unsur pada baris ke-2 dan lajur ke-3, iaitu 4.

## Matriks Sama
Dua matriks adalah sama jika:
1. Kedua-duanya mempunyai peringkat yang sama.
2. Setiap unsur yang sepadan adalah sama.
          `,
          quiz: {
            questions: [
              {
                id: 1,
                question: "Matriks yang mempunyai 3 baris dan 2 lajur berperingkat",
                options: ["2 x 3", "3 x 2", "3 x 3", "2 x 2"],
                correctAnswer: 1,
                explanation: "Peringkat matriks ditulis sebagai bilangan baris x bilangan lajur, iaitu 3 x 2."
              },
              {
                id: 2,
                question: "Dua matriks adalah sama jika kedua-duanya mempunyai peringkat yang sama dan",
                options: [
                  "jumlah semua unsur sama",
                  "setiap unsur sepadan sama",
                  "bilangan unsur ganjil",
                  "semua unsur positif"
                ],
                correctAnswer: 1,
                explanation: "Syarat matriks sama ialah peringkat sama dan setiap unsur sepadan sama."
              }
            ],
            subjectiveQuestions: [
              {
                id: 3,
                type: "structured-working",
                marks: 3,
                question: "Diberi A = [2  5  -1; 7  0  4]. Nyatakan peringkat A dan nilai a23.",
                acceptedFinalAnswers: ["2 x 3, a23 = 4", "peringkat 2 x 3 dan a23 = 4"],
                modelAnswer: "A mempunyai 2 baris dan 3 lajur.\nPeringkat A = 2 x 3.\na23 ialah unsur baris ke-2 lajur ke-3, maka a23 = 4.",
                rubric: [
                  { marks: 1, criteria: "Mengenal pasti 2 baris." },
                  { marks: 1, criteria: "Mengenal pasti 3 lajur dan peringkat 2 x 3." },
                  { marks: 1, criteria: "Menyatakan a23 = 4." }
                ]
              }
            ]
          },
          pastExamQuestions: {
            topic: "Matriks",
            questions: [
              {
                year: "2024 Trial",
                paper: "Paper 1",
                questionNumber: "Q12",
                type: "Objective",
                question: "Apakah peringkat matriks [4  -1  7; 6  3  8]?",
                options: ["A. 2 x 3", "B. 3 x 2", "C. 1 x 3", "D. 3 x 3"],
                correct: "A",
                answer: "A. 2 x 3",
                explanation: "Matriks itu mempunyai 2 baris dan 3 lajur.",
                focus: ["Peringkat matriks", "Baris dan lajur"]
              },
              {
                year: "2024 Trial",
                paper: "Paper 2",
                questionNumber: "Q3(a)",
                type: "Structured",
                question: "Diberi M = [3  8; -2  5; 9  0]. Nyatakan m21 dan m32.",
                options: ["A. m21 = -2, m32 = 0", "B. m21 = 8, m32 = 9", "C. m21 = 3, m32 = 5", "D. m21 = 9, m32 = -2"],
                correct: "A",
                answer: "A. m21 = -2, m32 = 0",
                explanation: "m21 ialah unsur baris kedua lajur pertama, manakala m32 ialah unsur baris ketiga lajur kedua.",
                focus: ["Unsur matriks", "Tatanda aij"]
              }
            ]
          },
          quizTitle: "Semak Kefahaman: Peringkat dan Unsur Matriks"
        }
      ]
    },
    {
      id: 2.2,
      title: "2.2 Operasi Asas Matriks",
      sections: [
        {
          content: `
# 2.2 Operasi Asas Matriks

## Menambah dan Menolak Matriks
Matriks hanya boleh ditambah atau ditolak jika kedua-dua matriks mempunyai peringkat yang sama.

![Rajah buku teks tentang penambahan dan penolakan matriks](/textbook/math/t5/diagrams/bab2-operasi-matriks.png)

*Rajah buku teks: unsur yang sepadan ditambah atau ditolak untuk mendapatkan matriks baharu.*

\`\`\`text
[a b] + [e f] = [a+e  b+f]
[c d]   [g h]   [c+g  d+h]
\`\`\`

## Mendarab Matriks dengan Nombor
Setiap unsur dalam matriks didarab dengan nombor tersebut.

\`\`\`text
n[a b] = [na nb]
 [c d]   [nc nd]
\`\`\`

## Mendarab Dua Matriks
Pendaraban AB boleh dilakukan jika bilangan lajur A sama dengan bilangan baris B.

Jika A berperingkat m x n dan B berperingkat n x p, maka AB berperingkat m x p.

## Matriks Identiti
Matriks identiti, I, ialah matriks segi empat sama yang mempunyai unsur 1 pada pepenjuru utama dan unsur 0 pada tempat lain.

Contoh:

\`\`\`text
I = [1 0
     0 1]
\`\`\`

## Matriks Songsang
Jika AB = BA = I, maka B ialah matriks songsang bagi A dan ditulis sebagai A^-1.

Bagi matriks 2 x 2:

\`\`\`text
A = [a b
     c d]

A^-1 = 1/(ad - bc) [ d -b
                    -c  a]
\`\`\`

Matriks songsang wujud jika ad - bc tidak sama dengan 0.

## Menyelesaikan Persamaan Linear Serentak
Persamaan linear serentak boleh ditulis dalam bentuk matriks:

![Rajah buku teks tentang kaedah matriks untuk menyelesaikan persamaan linear serentak](/textbook/math/t5/diagrams/bab2-kaedah-matriks-persamaan-linear.png)

*Rajah buku teks: persamaan linear serentak ditukar kepada bentuk AX = B sebelum menggunakan X = A^-1B.*

\`\`\`text
AX = B
X = A^-1B
\`\`\`

Kaedah ini digunakan untuk mencari nilai pemboleh ubah seperti x dan y.
          `,
          quiz: {
            questions: [
              {
                id: 1,
                question: "Dua matriks boleh ditambah jika",
                options: [
                  "kedua-duanya mempunyai peringkat yang sama",
                  "kedua-duanya mempunyai unsur positif sahaja",
                  "kedua-duanya matriks baris sahaja",
                  "jumlah unsur kedua-dua matriks sama"
                ],
                correctAnswer: 0,
                explanation: "Penambahan dan penolakan matriks hanya boleh dilakukan untuk matriks yang sama peringkat."
              },
              {
                id: 2,
                question: "Matriks songsang bagi A wujud jika",
                options: ["ad - bc = 0", "ad - bc tidak sama dengan 0", "a + b = c + d", "semua unsur sama"],
                correctAnswer: 1,
                explanation: "Bagi matriks 2 x 2, matriks songsang wujud apabila penentu ad - bc tidak sama dengan 0."
              }
            ],
            subjectiveQuestions: [
              {
                id: 3,
                type: "structured-working",
                marks: 4,
                question: "Diberi A = [1 2; 3 4] dan B = [5 0; -1 6]. Hitung A + B.",
                acceptedFinalAnswers: ["[6 2; 2 10]", "6 2 2 10"],
                modelAnswer: "A + B = [1+5  2+0; 3+(-1)  4+6]\n= [6  2; 2  10]",
                rubric: [
                  { marks: 1, criteria: "Menambah unsur sepadan baris pertama lajur pertama." },
                  { marks: 1, criteria: "Menambah unsur sepadan baris pertama lajur kedua." },
                  { marks: 1, criteria: "Menambah unsur sepadan baris kedua." },
                  { marks: 1, criteria: "Menulis matriks jawapan dengan betul." }
                ]
              }
            ]
          },
          pastExamQuestions: {
            topic: "Operasi Asas Matriks",
            questions: [
              {
                year: "2024 Trial",
                paper: "Paper 1",
                questionNumber: "Q13",
                type: "Objective",
                question: "Jika A berperingkat 2 x 3 dan B berperingkat 3 x 4, maka AB berperingkat",
                options: ["A. 2 x 4", "B. 3 x 3", "C. 4 x 2", "D. 3 x 2"],
                correct: "A",
                answer: "A. 2 x 4",
                explanation: "Untuk AB, peringkat hasil darab ialah bilangan baris A x bilangan lajur B.",
                focus: ["Pendaraban matriks", "Peringkat hasil darab"]
              },
              {
                year: "2024 Trial",
                paper: "Paper 2",
                questionNumber: "Q3(b)",
                type: "Structured",
                question: "Diberi A = [2 1; 5 3]. Tentukan sama ada A mempunyai matriks songsang.",
                options: ["A. Ya, kerana ad - bc = 1", "B. Tidak, kerana ad - bc = 0", "C. Ya, kerana semua unsur positif", "D. Tidak, kerana A bukan matriks segi empat sama"],
                correct: "A",
                answer: "A. Ya, kerana ad - bc = 1",
                explanation: "ad - bc = 2(3) - 1(5) = 1, maka matriks songsang wujud.",
                focus: ["Penentu", "Matriks songsang"]
              }
            ]
          },
          quizTitle: "Semak Kefahaman: Operasi Matriks"
        }
      ]
    },
    {
      id: 2.3,
      title: "Arena Rumusan dan Praktis Bab 2",
      sections: [
        {
          content: `
# Arena Rumusan Bab 2

## Matriks
- Matriks ialah susunan nombor dalam baris dan lajur.
- Peringkat matriks ialah m x n, iaitu m baris dan n lajur.
- Unsur pada baris ke-i dan lajur ke-j ditulis sebagai aij.
- Dua matriks sama jika peringkat sama dan unsur sepadan sama.

## Operasi Asas Matriks
- Penambahan dan penolakan hanya boleh dibuat untuk matriks yang sama peringkat.
- Pendaraban skalar bermaksud setiap unsur didarab dengan nombor yang sama.
- AB boleh dilakukan jika bilangan lajur A sama dengan bilangan baris B.
- Matriks identiti mempunyai 1 pada pepenjuru utama dan 0 pada tempat lain.
- Matriks songsang A^-1 memenuhi AA^-1 = A^-1A = I.
- Persamaan linear serentak boleh diselesaikan dengan bentuk AX = B dan X = A^-1B.
          `,
          quiz: {
            questions: [
              {
                id: 1,
                question: "Jika AB = I, maka B ialah",
                options: ["matriks sifar A", "matriks songsang A", "matriks baris A", "matriks lajur A"],
                correctAnswer: 1,
                explanation: "Jika hasil darab dua matriks ialah matriks identiti, maka satu matriks ialah songsangan bagi yang lain."
              }
            ]
          },
          quizTitle: "Kuiz Ringkasan Bab 2"
        }
      ]
    }
  ]
};
