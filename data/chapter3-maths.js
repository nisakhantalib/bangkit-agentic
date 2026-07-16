/* eslint-disable max-len */
export const chapter3 = {
  id: 3,
  title: "Bab 3: Matematik Pengguna: Insurans",
  icon: "RM",
  subchapters: [
    {
      id: 3.0,
      title: "Pengenalan Bab 3",
      sections: [
        {
          content: `
# Bab 3: Matematik Pengguna: Insurans

## Apakah yang akan anda pelajari?
- Risiko dan Perlindungan Insurans

## Gerbang Istilah
| Istilah Bahasa Melayu | English |
|---|---|
| risiko | risk |
| insurans hayat | life insurance |
| insurans am | general insurance |
| perlindungan | coverage |
| polisi | policy |
| premium | premium |
| deduktibel | deductible |
| ko-insurans | co-insurance |
| kadar | rate |

## Idea Utama Bab Ini
Insurans ialah satu bentuk perlindungan kewangan. Pemegang polisi membayar premium kepada syarikat insurans supaya kerugian tertentu yang dilindungi polisi dapat diberi pampasan jika musibah berlaku.

Insurans tidak menghalang kerugian daripada berlaku, tetapi membantu mengurangkan beban kewangan.
          `,
          pastExamQuestions: {
            topic: "Pengenalan Insurans",
            questions: [
              {
                year: "2024 Trial",
                paper: "Paper 1",
                questionNumber: "Q14",
                type: "Objective",
                question: "Premium ialah",
                options: [
                  "A. bayaran yang dibuat oleh pemegang polisi kepada syarikat insurans",
                  "B. jumlah kerugian yang mesti berlaku setiap tahun",
                  "C. cukai jalan untuk semua kenderaan",
                  "D. keuntungan yang wajib diterima oleh pemegang polisi"
                ],
                correct: "A",
                answer: "A. bayaran yang dibuat oleh pemegang polisi kepada syarikat insurans",
                explanation: "Premium ialah jumlah wang yang dibayar untuk mendapatkan perlindungan insurans.",
                focus: ["Premium", "Istilah insurans"]
              }
            ]
          }
        }
      ]
    },
    {
      id: 3.1,
      title: "3.1 Risiko dan Perlindungan Insurans",
      sections: [
        {
          content: `
# 3.1 Risiko dan Perlindungan Insurans

## Risiko
Risiko ialah kemungkinan berlakunya musibah yang tidak dapat dielakkan dan boleh menyebabkan kerugian. Risiko biasanya melibatkan ketidakpastian dan kerugian.

Contoh risiko:
- Kemalangan jalan raya
- Kecurian kenderaan
- Kebakaran rumah
- Penyakit kritikal
- Kehilangan bagasi ketika perjalanan

## Insurans
Insurans memindahkan risiko daripada individu kepada syarikat insurans. Kontrak insurans dimeterai antara syarikat insurans dengan pemegang polisi.

Dalam kontrak ini:
- Pemegang polisi membayar premium.
- Syarikat insurans membayar pampasan jika kerugian yang dilindungi berlaku.
- Pampasan tertakluk kepada polisi dan jumlah perlindungan.

## Prinsip Indemniti
Prinsip indemniti bermaksud pampasan bertujuan memulihkan kedudukan kewangan pemegang polisi kepada keadaan sebelum kerugian berlaku. Pemegang polisi tidak sepatutnya memperoleh keuntungan daripada tuntutan insurans.

## Insurans Hayat
Insurans hayat menjamin pembayaran manfaat kewangan apabila berlaku kematian, penyakit kritikal atau hilang upaya menyeluruh dan kekal, bergantung kepada syarat polisi.

Tujuan utama insurans hayat ialah memberikan perlindungan kewangan kepada ahli keluarga yang bergantung kepada pemegang polisi.

![Rajah buku teks tentang risiko yang dilindungi insurans hayat](/textbook/math/t5/diagrams/bab3-insurans-hayat-risiko.png)

*Rajah buku teks: insurans hayat melindungi risiko seperti kematian, penyakit kritikal dan hilang upaya.*

## Insurans Am
Insurans am melindungi kerugian atau kerosakan harta benda, selain risiko yang dilindungi oleh insurans hayat.

Jenis insurans am termasuk:
- Insurans motor
- Insurans kebakaran
- Insurans perubatan dan kesihatan
- Insurans kemalangan diri
- Insurans perjalanan

## Insurans Motor
Insurans motor memberikan perlindungan terhadap kerugian atau kerosakan yang berkaitan dengan penggunaan kenderaan berenjin. Antara polisi motor ialah:
- Akta
- Pihak ketiga
- Pihak ketiga, kebakaran dan kecurian
- Komprehensif

Polisi komprehensif memberikan perlindungan yang lebih menyeluruh, termasuk kerosakan kenderaan sendiri dan liabiliti kepada pihak ketiga, tertakluk kepada syarat polisi.
          `,
          quiz: {
            questions: [
              {
                id: 1,
                question: "Risiko secara umum bermaksud",
                options: [
                  "kemungkinan berlakunya musibah yang menyebabkan kerugian",
                  "keuntungan tetap setiap bulan",
                  "bayaran cukai pendapatan",
                  "jumlah wang simpanan di bank"
                ],
                correctAnswer: 0,
                explanation: "Risiko melibatkan ketidakpastian dan kemungkinan kerugian."
              },
              {
                id: 2,
                question: "Insurans hayat biasanya melindungi risiko",
                options: ["kecurian motosikal sahaja", "kematian atau hilang upaya", "kerosakan bangunan sahaja", "kehilangan bagasi sahaja"],
                correctAnswer: 1,
                explanation: "Insurans hayat memberi manfaat kewangan jika berlaku kematian, penyakit kritikal atau hilang upaya mengikut polisi."
              }
            ],
            subjectiveQuestions: [
              {
                id: 3,
                type: "structured-working",
                marks: 3,
                question: "Terangkan maksud prinsip indemniti dalam insurans.",
                acceptedFinalAnswers: ["pampasan tidak melebihi kerugian", "memulihkan kedudukan kewangan sebelum kerugian"],
                modelAnswer: "Prinsip indemniti bermaksud syarikat insurans membayar pampasan untuk memulihkan kedudukan kewangan pemegang polisi kepada keadaan sebelum kerugian. Pampasan tidak bertujuan memberi keuntungan kepada pemegang polisi.",
                rubric: [
                  { marks: 1, criteria: "Menyatakan pampasan diberi apabila kerugian dilindungi berlaku." },
                  { marks: 1, criteria: "Menyatakan pampasan memulihkan kedudukan kewangan." },
                  { marks: 1, criteria: "Menyatakan pemegang polisi tidak memperoleh keuntungan daripada tuntutan." }
                ]
              }
            ]
          },
          pastExamQuestions: {
            topic: "Risiko dan Perlindungan Insurans",
            questions: [
              {
                year: "2024 Trial",
                paper: "Paper 1",
                questionNumber: "Q15",
                type: "Objective",
                question: "Antara berikut, yang manakah contoh insurans am?",
                options: ["A. Insurans kebakaran", "B. Simpanan tetap", "C. Zakat pendapatan", "D. Dividen saham"],
                correct: "A",
                answer: "A. Insurans kebakaran",
                explanation: "Insurans kebakaran ialah insurans am kerana melindungi kerugian harta benda.",
                focus: ["Insurans am", "Jenis insurans"]
              },
              {
                year: "2024 Trial",
                paper: "Paper 2",
                questionNumber: "Q4(a)",
                type: "Structured",
                question: "Encik Daud membeli polisi insurans kemalangan diri berjumlah RM300 000 dengan bayaran premium bulanan RM100. Nyatakan had perlindungan dan premium bulanannya.",
                options: [
                  "A. Had perlindungan RM300 000 dan premium bulanan RM100",
                  "B. Had perlindungan RM100 dan premium bulanan RM300 000",
                  "C. Had perlindungan RM300 dan premium bulanan RM1 000",
                  "D. Had perlindungan RM100 000 dan premium bulanan RM300"
                ],
                correct: "A",
                answer: "A. Had perlindungan RM300 000 dan premium bulanan RM100",
                explanation: "Jumlah yang diinsuranskan ialah had perlindungan, manakala bayaran berkala kepada syarikat insurans ialah premium.",
                focus: ["Had perlindungan", "Premium"]
              }
            ]
          },
          quizTitle: "Semak Kefahaman: Risiko dan Jenis Insurans"
        },
        {
          content: `
## Kadar dan Premium Insurans

Premium insurans ialah bayaran yang dikenakan untuk mendapatkan perlindungan. Premium bergantung kepada jenis insurans, jumlah perlindungan, risiko yang dilindungi dan faktor lain seperti umur, status kesihatan, pekerjaan atau jenis kenderaan.

## Premium Insurans Hayat
Bagi insurans hayat, premium boleh dikira menggunakan kadar premium bagi setiap RMx nilai muka.

\`\`\`text
Premium = (Nilai muka polisi / RMx) x kadar premium bagi setiap RMx
\`\`\`

![Rajah buku teks tentang formula dan jadual kadar premium insurans hayat](/textbook/math/t5/diagrams/bab3-premium-insurans-hayat.png)

*Rajah buku teks: premium insurans hayat bergantung pada nilai muka polisi dan kadar premium bagi setiap RMx.*

Contoh:
Jika kadar premium ialah RM2.49 bagi setiap RM1 000 nilai muka dan nilai muka polisi ialah RM100 000:

\`\`\`text
Premium = (100000 / 1000) x 2.49
Premium = 100 x 2.49
Premium = RM249
\`\`\`

## Premium Insurans Motor
Premium motor bergantung pada faktor seperti:
- Jenis kenderaan
- Kegunaan kenderaan
- Kapasiti enjin
- Nilai kenderaan yang ingin diinsuranskan
- Jenis polisi
- Diskaun Tanpa Tuntutan (NCD)

Untuk polisi komprehensif, premium asas biasanya dikira berdasarkan kadar bagi RM1 000 pertama dan kadar tambahan bagi setiap RM1 000 berikutnya. Selepas itu, NCD boleh ditolak daripada premium asas.

## NCD
NCD ialah Diskaun Tanpa Tuntutan. Diskaun ini diberikan jika pemegang polisi tidak membuat tuntutan dalam tempoh perlindungan sebelumnya.
          `,
          quiz: {
            questions: [
              {
                id: 1,
                question: "Jika nilai muka polisi RM100 000 dan kadar premium RM2.49 bagi setiap RM1 000, premium ialah",
                options: ["RM24.90", "RM249.00", "RM2 490.00", "RM100 249.00"],
                correctAnswer: 1,
                explanation: "Premium = (100000 / 1000) x 2.49 = RM249."
              },
              {
                id: 2,
                question: "NCD dalam insurans motor bermaksud",
                options: ["Nilai Cukai Dasar", "Diskaun Tanpa Tuntutan", "Nombor Cermin Depan", "Nota Caj Duti"],
                correctAnswer: 1,
                explanation: "NCD ialah No Claim Discount atau Diskaun Tanpa Tuntutan."
              }
            ],
            subjectiveQuestions: [
              {
                id: 3,
                type: "structured-working",
                marks: 4,
                question: "Kadar premium insurans hayat ialah RM1.80 bagi setiap RM1 000 nilai muka. Hitung premium tahunan bagi nilai muka RM250 000.",
                acceptedFinalAnswers: ["RM450", "450"],
                modelAnswer: "Premium = (Nilai muka / RM1000) x kadar\n= (250000 / 1000) x 1.80\n= 250 x 1.80\n= RM450",
                rubric: [
                  { marks: 1, criteria: "Menulis formula premium." },
                  { marks: 1, criteria: "Membahagi nilai muka dengan RM1000." },
                  { marks: 1, criteria: "Mendarab dengan kadar premium yang betul." },
                  { marks: 1, criteria: "Mendapat jawapan RM450." }
                ]
              }
            ]
          },
          pastExamQuestions: {
            topic: "Kadar dan Premium Insurans",
            questions: [
              {
                year: "2024 Trial",
                paper: "Paper 1",
                questionNumber: "Q16",
                type: "Objective",
                question: "Nilai muka polisi insurans hayat ialah RM200 000. Kadar premium ialah RM2.10 bagi setiap RM1 000. Hitung premium.",
                options: ["A. RM210", "B. RM420", "C. RM2 100", "D. RM4 200"],
                correct: "B",
                answer: "B. RM420",
                explanation: "Premium = (200000 / 1000) x 2.10 = RM420.",
                focus: ["Premium insurans hayat", "Nilai muka"]
              },
              {
                year: "2024 Trial",
                paper: "Paper 2",
                questionNumber: "Q4(b)",
                type: "Structured",
                question: "Premium asas insurans motor ialah RM1 200. Jika NCD ialah 25%, hitung premium selepas NCD.",
                options: ["A. RM900", "B. RM300", "C. RM1 225", "D. RM1 500"],
                correct: "A",
                answer: "A. RM900",
                explanation: "NCD = 25% x 1200 = RM300. Premium selepas NCD = 1200 - 300 = RM900.",
                focus: ["NCD", "Premium motor"]
              }
            ]
          },
          quizTitle: "Semak Kefahaman: Pengiraan Premium"
        }
      ]
    },
    {
      id: 3.2,
      title: "Arena Rumusan dan Praktis Bab 3",
      sections: [
        {
          content: `
# Arena Rumusan Bab 3

## Risiko dan Insurans
- Risiko ialah kemungkinan berlakunya musibah yang membawa kerugian.
- Insurans memindahkan risiko kewangan daripada individu kepada syarikat insurans.
- Pemegang polisi membayar premium.
- Syarikat insurans membayar pampasan bagi kerugian yang dilindungi.
- Prinsip indemniti memastikan pampasan tidak memberi keuntungan kepada pemegang polisi.

## Jenis Insurans
- Insurans hayat: kematian, penyakit kritikal, hilang upaya.
- Insurans am: motor, kebakaran, perubatan dan kesihatan, kemalangan diri, perjalanan.

## Formula Penting

\`\`\`text
Premium insurans hayat
= (Nilai muka polisi / RMx) x kadar premium bagi setiap RMx

Premium selepas NCD
= Premium asas - Diskaun NCD
\`\`\`
          `,
          quiz: {
            questions: [
              {
                id: 1,
                question: "Insurans bertujuan utama untuk",
                options: ["mengurangkan beban kewangan apabila kerugian berlaku", "menjamin keuntungan", "menghapuskan semua risiko", "menggantikan cukai"],
                correctAnswer: 0,
                explanation: "Insurans membantu mengurangkan beban kewangan akibat risiko yang dilindungi."
              }
            ]
          },
          quizTitle: "Kuiz Ringkasan Bab 3"
        }
      ]
    }
  ]
};
