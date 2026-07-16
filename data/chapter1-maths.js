/* eslint-disable max-len */
export const chapter1 = {
  id: 1,
  title: "Bab 1: Ubahan",
  icon: "📈",
  subchapters: [
    {
      id: 1.0,
      title: "Pengenalan Bab 1",
      sections: [
        {
          content: `
# Bab 1: Ubahan

## Apakah yang akan anda pelajari?
- Ubahan Langsung
- Ubahan Songsang
- Ubahan Bergabung

## Gerbang Istilah
| Istilah Bahasa Melayu | English |
|---|---|
| pemalar | constant |
| pemboleh ubah | variable |
| ubahan langsung | direct variation |
| ubahan songsang | inverse variation |
| ubahan tercantum | joint variation |
| ubahan bergabung | combined variation |

## Idea Utama Bab Ini
Konsep ubahan menerangkan hubungan antara dua atau lebih pemboleh ubah. Dalam kehidupan harian dan sains, banyak kuantiti berubah bersama-sama.

Contohnya:
- Semakin jauh perjalanan teksi, semakin tinggi tambang teksi.
- Semakin besar isi padu gas, semakin rendah tekanan gas jika suhu adalah tetap.
- Semakin besar luas permukaan sentuhan, semakin rendah tekanan yang dikenakan.

Simbol penting bagi bab ini ialah **∝**, yang bermaksud **berkadar dengan** atau **berubah mengikut hubungan tertentu**.
          `
        }
      ]
    },
    {
      id: 1.1,
      title: "1.1 Ubahan Langsung",
      sections: [
        {
          videoUrl: "https://youtu.be/DGwRYN92JK0?si=DoWzxnCr6Ie4xMRL",
          videoTitle: "Video: Ubahan Langsung",
          content: `
# 1.1 Ubahan Langsung

## Maksud Ubahan Langsung
Ubahan langsung menerangkan hubungan apabila satu pemboleh ubah bertambah, pemboleh ubah yang satu lagi juga bertambah pada kadar yang sepadan. Jika satu pemboleh ubah berkurang, pemboleh ubah yang satu lagi juga berkurang.

Secara umum, jika **y berubah secara langsung dengan x**, maka:

\`\`\`text
y ∝ x
y = kx
\`\`\`

di mana **k** ialah pemalar perkadaran.

## Pemalar Perkadaran
Jika y berubah secara langsung dengan x, maka nilai **y/x** ialah pemalar.

\`\`\`text
k = y/x
\`\`\`

Graf **y melawan x** ialah garis lurus yang melalui asalan.

## Contoh 1
Jumlah gaji seorang pekerja sambilan berubah secara langsung dengan bilangan jam bekerja.

(a) Jika bilangan jam bertambah dua kali ganda, jumlah gaji juga bertambah dua kali ganda.

(b) Jika bilangan jam berkurang 40%, jumlah gaji juga berkurang 40%.

(c) Jika jumlah gaji menjadi separuh daripada gaji asal, bilangan jam bekerja juga menjadi separuh.
          `,
          quiz: {
            questions: [
              {
                id: 1,
                question: "Apakah maksud y ∝ x?",
                options: [
                  "y berubah secara songsang dengan x",
                  "y berubah secara langsung dengan x",
                  "x sentiasa lebih besar daripada y",
                  "y tidak mempunyai hubungan dengan x"
                ],
                correctAnswer: 1,
                explanation: "y ∝ x bermaksud y berubah secara langsung dengan x."
              },
              {
                id: 2,
                question: "Jika y berubah secara langsung dengan x, apakah bentuk persamaannya?",
                options: ["y = kx", "y = k/x", "xy = k", "y = x/k"],
                correctAnswer: 0,
                explanation: "Bagi ubahan langsung, y ∝ x dan bentuk persamaannya ialah y = kx."
              }
            ],
            subjectiveQuestions: [
              {
                id: 3,
                type: "structured-working",
                marks: 4,
                question: "Diberi y berubah secara langsung dengan x dan y = 24 apabila x = 6. Cari y apabila x = 10. Tunjukkan langkah kerja anda.",
                acceptedFinalAnswers: ["40", "y = 40"],
                modelAnswer: "y ∝ x\ny = kx\n24 = 6k\nk = 4\nApabila x = 10,\ny = 4(10)\ny = 40",
                rubric: [
                  { marks: 1, criteria: "Menulis hubungan y ∝ x atau y = kx." },
                  { marks: 1, criteria: "Menggantikan y = 24 dan x = 6 dengan betul." },
                  { marks: 1, criteria: "Mendapat nilai k = 4." },
                  { marks: 1, criteria: "Mengira y = 40 apabila x = 10." }
                ]
              }
            ]
          },
          quizTitle: "Semak Kefahaman: Maksud Ubahan Langsung"
        },
        {
          content: `
## Hubungan y dengan xⁿ
Kadangkala y tidak berubah secara langsung dengan x sahaja, tetapi berubah secara langsung dengan kuasa x seperti x², x³, √x atau ∛x.

Secara umum:

\`\`\`text
y ∝ xⁿ
y = kxⁿ
k = y/xⁿ
\`\`\`

di mana:

\`\`\`text
n = 1, 2, 3, 1/2, atau 1/3
\`\`\`

## Contoh 2
Diberi jadual:

| t | 2 | 4 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|
| y | 14 | 28 | 42 | 56 | 70 | 84 |

Semak y/t:

\`\`\`text
14/2 = 7
28/4 = 7
42/6 = 7
56/8 = 7
70/10 = 7
84/12 = 7
\`\`\`

Nilai y/t adalah pemalar. Maka, **y berubah secara langsung dengan t**.

\`\`\`text
y ∝ t
\`\`\`

## Contoh 3
Jika graf y melawan x² ialah garis lurus yang melalui asalan, maka:

\`\`\`text
y ∝ x²
\`\`\`
          `,
          quiz: {
            questions: [
              {
                id: 1,
                question: "Jika y berubah secara langsung dengan x², apakah bentuk persamaannya?",
                options: ["y = kx", "y = kx²", "y = k/x²", "y = x²/k"],
                correctAnswer: 1,
                explanation: "Jika y ∝ x², maka bentuk persamaannya ialah y = kx²."
              },
              {
                id: 2,
                question: "Bagi y ∝ xⁿ, apakah formula pemalar perkadaran k?",
                options: ["k = yxⁿ", "k = xⁿ/y", "k = y/xⁿ", "k = y + xⁿ"],
                correctAnswer: 2,
                explanation: "Daripada y = kxⁿ, maka k = y/xⁿ."
              }
            ]
          },
          quizTitle: "Semak Kefahaman: Hubungan y dengan xⁿ"
        },
        {
          content: `
## Menyelesaikan Masalah Ubahan Langsung
Langkah biasa:

1. Tulis hubungan ubahan.
2. Tukar kepada bentuk persamaan.
3. Gantikan nilai yang diberi untuk mencari k.
4. Tulis semula persamaan lengkap.
5. Guna persamaan itu untuk mencari nilai yang dikehendaki.

## Contoh 4
Diberi m = 0.8 apabila n = 0.125.

### (a) m berubah secara langsung dengan n

\`\`\`text
m ∝ n
m = kn
0.8 = k(0.125)
k = 0.8/0.125
k = 6.4
\`\`\`

Maka:

\`\`\`text
m = 6.4n
\`\`\`

### (b) m berubah secara langsung dengan n²

\`\`\`text
m ∝ n²
m = kn²
0.8 = k(0.125)²
k = 0.8/(0.125)²
k = 51.2
\`\`\`

Maka:

\`\`\`text
m = 51.2n²
\`\`\`

## Contoh 5
Diberi y berubah secara langsung dengan x³ dan y = 32 apabila x = 2.

\`\`\`text
y ∝ x³
y = kx³
32 = k(2)³
32 = 8k
k = 4
\`\`\`

Maka:

\`\`\`text
y = 4x³
\`\`\`

Jika x = 3:

\`\`\`text
y = 4(3)³
  = 4(27)
  = 108
\`\`\`
          `,
          quiz: {
            questions: [
              {
                id: 1,
                question: "Diberi y ∝ x³ dan y = 32 apabila x = 2. Apakah nilai k?",
                options: ["2", "4", "8", "16"],
                correctAnswer: 1,
                explanation: "y = kx³. Jadi 32 = k(2)³ = 8k, maka k = 4."
              },
              {
                id: 2,
                question: "Jika m ∝ n dan m = 0.8 apabila n = 0.125, apakah persamaan m dalam sebutan n?",
                options: ["m = 0.125n", "m = 0.8n", "m = 6.4n", "m = 51.2n"],
                correctAnswer: 2,
                explanation: "m = kn. k = 0.8/0.125 = 6.4. Maka m = 6.4n."
              }
            ]
          },
          quizTitle: "Semak Kefahaman: Menyelesaikan Ubahan Langsung"
        },
        {
          content: `
## Ubahan Tercantum
Ubahan tercantum ialah ubahan langsung yang melibatkan hasil darab dua atau lebih pemboleh ubah.

Jika y berubah secara tercantum dengan x dan z, maka:

\`\`\`text
y ∝ xz
y = kxz
\`\`\`

Jika melibatkan kuasa:

\`\`\`text
y ∝ xᵐzⁿ
y = kxᵐzⁿ
k = y/(xᵐzⁿ)
\`\`\`

![Aktiviti buku teks tentang ubahan tercantum menggunakan luas segi empat tepat](/textbook/math/t5/diagrams/bab1-ubahan-tercantum-aktiviti.png)

*Rajah buku teks: hubungan antara panjang, lebar dan luas membantu murid melihat bentuk ubahan tercantum.*

## Contoh 6
Jika isi padu silinder, V, berubah secara langsung dengan luas tapak, A, dan tinggi, h:

\`\`\`text
V ∝ Ah
V = kAh
\`\`\`

Untuk silinder sebenar:

\`\`\`text
V = Ah
\`\`\`

maka nilai k = 1.

## Contoh 7
Diberi y berubah secara tercantum dengan x² dan z. Jika y = 72 apabila x = 3 dan z = 8:

\`\`\`text
y ∝ x²z
y = kx²z
72 = k(3)²(8)
72 = 72k
k = 1
\`\`\`

Maka:

\`\`\`text
y = x²z
\`\`\`

## Contoh 8
Diberi P berubah secara tercantum dengan Q dan √R. Jika P = 24 apabila Q = 6 dan R = 16:

\`\`\`text
P ∝ Q√R
P = kQ√R
24 = k(6)(√16)
24 = 24k
k = 1
\`\`\`

Maka:

\`\`\`text
P = Q√R
\`\`\`
          `,
          quiz: {
            questions: [
              {
                id: 1,
                question: "Apakah maksud y ∝ xz?",
                options: [
                  "y berubah secara songsang dengan x dan z",
                  "y berubah secara tercantum dengan x dan z",
                  "y hanya berubah dengan x sahaja",
                  "y sama dengan x + z"
                ],
                correctAnswer: 1,
                explanation: "y ∝ xz bermaksud y berubah secara tercantum dengan x dan z, iaitu y = kxz."
              },
              {
                id: 2,
                question: "Jika y ∝ x²z, apakah formula k?",
                options: ["k = y/(x²z)", "k = yx²z", "k = x²z/y", "k = y + x²z"],
                correctAnswer: 0,
                explanation: "Daripada y = kx²z, maka k = y/(x²z)."
              }
            ]
          },
          quizTitle: "Semak Kefahaman: Ubahan Tercantum"
        }
      ]
    },
    {
      id: 1.2,
      title: "1.2 Ubahan Songsang",
      sections: [
        {
          content: `
# 1.2 Ubahan Songsang

## Maksud Ubahan Songsang
Ubahan songsang menerangkan hubungan apabila satu pemboleh ubah bertambah, pemboleh ubah yang satu lagi berkurang pada kadar tertentu.

Jika **y berubah secara songsang dengan x**, maka:

\`\`\`text
y ∝ 1/x
y = k/x
k = xy
\`\`\`

![Rajah jongkang-jongket untuk menerangkan ubahan songsang](/textbook/math/t5/diagrams/bab1-ubahan-songsang-jongkang-jongket.png)

*Rajah buku teks: jisim dan jarak daripada fulkrum menunjukkan hubungan songsang.*

## Contoh 9
Masa yang diambil untuk menyiapkan kerja berubah secara songsang dengan bilangan pekerja.

Jika bilangan pekerja bertambah dua kali ganda, masa menjadi separuh.
          `,
          quiz: {
            questions: [
              {
                id: 1,
                question: "Apakah bentuk persamaan bagi y berubah secara songsang dengan x?",
                options: ["y = kx", "y = k/x", "y = x/k", "y = k + x"],
                correctAnswer: 1,
                explanation: "Jika y ∝ 1/x, maka y = k/x."
              },
              {
                id: 2,
                question: "Jika y berubah secara songsang dengan x, apakah kuantiti yang menjadi pemalar?",
                options: ["y/x", "x/y", "xy", "x + y"],
                correctAnswer: 2,
                explanation: "Untuk ubahan songsang, y = k/x, maka k = xy."
              }
            ]
          },
          quizTitle: "Semak Kefahaman: Maksud Ubahan Songsang"
        },
        {
          content: `
## Hubungan y dengan 1/xⁿ
Secara umum:

\`\`\`text
y ∝ 1/xⁿ
y = k/xⁿ
k = yxⁿ
\`\`\`

di mana:

\`\`\`text
n = 1, 2, 3, 1/2, atau 1/3
\`\`\`

## Contoh 10
Diberi y berubah secara songsang dengan x dan y = 6 apabila x = 4.

\`\`\`text
y ∝ 1/x
y = k/x
6 = k/4
k = 24
\`\`\`

Maka:

\`\`\`text
y = 24/x
\`\`\`

Jika x = 8:

\`\`\`text
y = 24/8
  = 3
\`\`\`

## Contoh 11
Diberi m berubah secara songsang dengan n² dan m = 12 apabila n = 3.

\`\`\`text
m ∝ 1/n²
m = k/n²
12 = k/3²
12 = k/9
k = 108
\`\`\`

Maka:

\`\`\`text
m = 108/n²
\`\`\`
          `,
          quiz: {
            questions: [
              {
                id: 1,
                question: "Jika y berubah secara songsang dengan x², apakah bentuk persamaannya?",
                options: ["y = kx²", "y = k/x²", "y = x²/k", "y = k√x"],
                correctAnswer: 1,
                explanation: "Jika y ∝ 1/x², maka y = k/x²."
              },
              {
                id: 2,
                question: "Diberi y = 6 apabila x = 4 dan y ∝ 1/x. Apakah nilai k?",
                options: ["10", "24", "2", "1.5"],
                correctAnswer: 1,
                explanation: "y = k/x. Jadi 6 = k/4, maka k = 24."
              }
            ]
          },
          quizTitle: "Semak Kefahaman: Hubungan y dengan 1/xⁿ"
        },
        {
          content: `
## Menentukan Ubahan Songsang daripada Jadual
Untuk menentukan sama ada y berubah secara songsang dengan x:

1. Kira nilai xy bagi setiap pasangan x dan y.
2. Jika semua nilai xy adalah sama, maka y ∝ 1/x.

## Contoh 12
Diberi jadual:

| x | 2 | 3 | 4 | 6 |
|---|---|---|---|---|
| y | 18 | 12 | 9 | 6 |

Semak nilai xy:

\`\`\`text
2(18) = 36
3(12) = 36
4(9) = 36
6(6) = 36
\`\`\`

Nilai xy adalah pemalar. Maka:

\`\`\`text
y ∝ 1/x
\`\`\`

## Contoh 13
Jika tekanan gas, p, berubah secara songsang dengan isi padu gas, V:

\`\`\`text
p ∝ 1/V
p = k/V
\`\`\`

Jika p = 380.5 kPa apabila V = 40 cm³:

\`\`\`text
380.5 = k/40
k = 15 220
\`\`\`

Maka:

\`\`\`text
p = 15220/V
\`\`\`

Apabila V = 80 cm³:

\`\`\`text
p = 15220/80
  = 190.25 kPa
\`\`\`
          `,
          quiz: {
            questions: [
              {
                id: 1,
                question: "Diberi x = 3 dan y = 12. Jika y ∝ 1/x, apakah nilai k?",
                options: ["4", "9", "15", "36"],
                correctAnswer: 3,
                explanation: "Untuk y ∝ 1/x, k = xy = 3(12) = 36."
              },
              {
                id: 2,
                question: "Jika tekanan gas berubah secara songsang dengan isi padu gas, apakah berlaku apabila isi padu digandakan?",
                options: [
                  "Tekanan juga berganda",
                  "Tekanan menjadi separuh",
                  "Tekanan tidak berubah",
                  "Tekanan menjadi sifar"
                ],
                correctAnswer: 1,
                explanation: "Dalam ubahan songsang, apabila satu kuantiti digandakan, kuantiti yang satu lagi menjadi separuh."
              }
            ],
            subjectiveQuestions: [
              {
                id: 3,
                type: "structured-working",
                marks: 4,
                question: "Tekanan gas, p, berubah secara songsang dengan isi padu gas, V. Jika p = 380.5 kPa apabila V = 40 cm³, cari p apabila V = 80 cm³. Tunjukkan langkah kerja anda.",
                acceptedFinalAnswers: ["190.25", "190.25 kPa"],
                modelAnswer: "p ∝ 1/V\np = k/V\n380.5 = k/40\nk = 380.5 × 40\nk = 15220\nApabila V = 80,\np = 15220/80\np = 190.25 kPa",
                rubric: [
                  { marks: 1, criteria: "Menulis hubungan ubahan songsang yang betul, iaitu p ∝ 1/V atau p = k/V." },
                  { marks: 1, criteria: "Menggantikan p = 380.5 dan V = 40 dengan betul untuk mencari k." },
                  { marks: 1, criteria: "Mendapat nilai pemalar k = 15220." },
                  { marks: 1, criteria: "Menggunakan V = 80 dan mendapat jawapan akhir p = 190.25 kPa." }
                ]
              }
            ]
          },
          quizTitle: "Semak Kefahaman: Menyelesaikan Ubahan Songsang"
        }
      ]
    },
    {
      id: 1.3,
      title: "1.3 Ubahan Bergabung",
      sections: [
        {
          content: `
# 1.3 Ubahan Bergabung

## Maksud Ubahan Bergabung
Ubahan bergabung melibatkan gabungan:

- ubahan langsung atau ubahan tercantum, dan
- ubahan songsang.

Jika y berubah secara langsung dengan x dan secara songsang dengan z:

\`\`\`text
y ∝ x/z
y = kx/z
\`\`\`

## Bentuk Umum
Jika y berubah secara langsung dengan xᵐ dan secara songsang dengan zⁿ:

\`\`\`text
y ∝ xᵐ/zⁿ
y = kxᵐ/zⁿ
k = yzⁿ/xᵐ
\`\`\`

![Aktiviti buku teks tentang ubahan bergabung menggunakan isi padu silinder](/textbook/math/t5/diagrams/bab1-ubahan-bergabung-silinder.png)

*Rajah buku teks: isi padu silinder menggabungkan hubungan langsung dan songsang antara pemboleh ubah.*

## Contoh 14
Rumus isi padu silinder:

\`\`\`text
x = yz
\`\`\`

di mana:
- x = isi padu
- y = tinggi
- z = luas tapak

Maka:

\`\`\`text
y = x/z
y ∝ x/z
\`\`\`
          `,
          quiz: {
            questions: [
              {
                id: 1,
                question: "Apakah maksud ubahan bergabung?",
                options: [
                  "Ubahan yang melibatkan satu pemboleh ubah sahaja",
                  "Gabungan ubahan langsung/tercantum dengan ubahan songsang",
                  "Ubahan yang hanya melibatkan graf garis lurus",
                  "Ubahan yang tiada pemalar"
                ],
                correctAnswer: 1,
                explanation: "Ubahan bergabung menggabungkan ubahan langsung atau tercantum dengan ubahan songsang."
              },
              {
                id: 2,
                question: "Jika y berubah secara langsung dengan x dan secara songsang dengan z, apakah hubungan ubahannya?",
                options: ["y ∝ xz", "y ∝ z/x", "y ∝ x/z", "y ∝ 1/xz"],
                correctAnswer: 2,
                explanation: "Langsung dengan x memberi x di pengangka, songsang dengan z memberi z di penyebut. Maka y ∝ x/z."
              }
            ]
          },
          quizTitle: "Semak Kefahaman: Maksud Ubahan Bergabung"
        },
        {
          content: `
## Contoh 15
Diberi y berubah secara langsung dengan kuasa dua x dan secara songsang dengan punca kuasa dua z. Jika y = 8 apabila x = 4 dan z = 36:

\`\`\`text
y ∝ x²/√z
y = kx²/√z
8 = k(4)²/√36
8 = 16k/6
8 = 8k/3
k = 3
\`\`\`

Maka:

\`\`\`text
y = 3x²/√z
\`\`\`

## Contoh 16
Diberi P berubah secara langsung dengan kuasa tiga Q dan secara songsang dengan R.

\`\`\`text
P ∝ Q³/R
P = kQ³/R
\`\`\`

Jika P = 4, Q = 2 dan R = 0.6:

\`\`\`text
4 = k(2)³/0.6
k = 4(0.6)/2³
k = 0.3
k = 3/10
\`\`\`

Maka:

\`\`\`text
P = 3Q³/(10R)
\`\`\`
          `,
          quiz: {
            questions: [
              {
                id: 1,
                question: "Jika y ∝ x²/√z, apakah bentuk persamaannya?",
                options: ["y = kx²√z", "y = k√z/x²", "y = kx²/√z", "y = k/(x²√z)"],
                correctAnswer: 2,
                explanation: "Langsung dengan x² dan songsang dengan √z memberi y = kx²/√z."
              },
              {
                id: 2,
                question: "Diberi P ∝ Q³/R. Jika P = 4, Q = 2 dan R = 0.6, apakah nilai k?",
                options: ["0.3", "3", "10", "18"],
                correctAnswer: 0,
                explanation: "4 = k(2)³/0.6, maka k = 4(0.6)/8 = 0.3."
              }
            ],
            subjectiveQuestions: [
              {
                id: 3,
                type: "structured-working",
                marks: 4,
                question: "Diberi y berubah secara langsung dengan x² dan secara songsang dengan √z. Jika y = 8 apabila x = 4 dan z = 36, ungkapkan y dalam sebutan x dan z.",
                acceptedFinalAnswers: ["y = 3x²/√z", "3x²/√z"],
                modelAnswer: "y ∝ x²/√z\ny = kx²/√z\n8 = k(4)²/√36\n8 = 16k/6\nk = 3\nMaka, y = 3x²/√z",
                rubric: [
                  { marks: 1, criteria: "Menulis hubungan y ∝ x²/√z." },
                  { marks: 1, criteria: "Menukar kepada bentuk y = kx²/√z." },
                  { marks: 1, criteria: "Menggantikan y = 8, x = 4 dan z = 36 dengan betul." },
                  { marks: 1, criteria: "Mendapat ungkapan akhir y = 3x²/√z." }
                ]
              }
            ]
          },
          quizTitle: "Semak Kefahaman: Contoh Ubahan Bergabung"
        },
        {
          content: `
## Contoh 17
Diberi tekanan, p, berubah secara langsung dengan jisim, m, dan secara songsang dengan luas permukaan sentuhan, l.

\`\`\`text
p ∝ m/l
p = km/l
\`\`\`

Jika p = 45 000 apabila m = 90 dan l = 0.02:

\`\`\`text
45000 = k(90)/0.02
k = (0.02)(45000)/90
k = 10
\`\`\`

Maka:

\`\`\`text
p = 10m/l
\`\`\`

Apabila m = 120 dan l = 0.5:

\`\`\`text
p = 10(120)/0.5
p = 2400 N m⁻²
\`\`\`

Jika jisim adalah tetap:
- p berkurang apabila l bertambah.
- p bertambah apabila l berkurang.
          `,
          quiz: {
            questions: [
              {
                id: 1,
                question: "Jika p ∝ m/l, apakah berlaku kepada p apabila l bertambah dan m tetap?",
                options: ["p bertambah", "p berkurang", "p tidak berubah", "p menjadi sifar"],
                correctAnswer: 1,
                explanation: "p berubah secara songsang dengan l. Apabila l bertambah, p berkurang."
              },
              {
                id: 2,
                question: "Diberi p = 10m/l. Hitung p apabila m = 120 dan l = 0.5.",
                options: ["240", "600", "1200", "2400"],
                correctAnswer: 3,
                explanation: "p = 10(120)/0.5 = 1200/0.5 = 2400."
              }
            ]
          },
          quizTitle: "Semak Kefahaman: Aplikasi Ubahan Bergabung"
        }
      ]
    },
    {
      id: 1.4,
      title: "Arena Rumusan dan Praktis Bab 1",
      sections: [
        {
          content: `
# Arena Rumusan Bab 1

## 1. Ubahan Langsung
Jika y berubah secara langsung dengan xⁿ:

\`\`\`text
y ∝ xⁿ
y = kxⁿ
k = y/xⁿ
\`\`\`

## 2. Ubahan Songsang
Jika y berubah secara songsang dengan xⁿ:

\`\`\`text
y ∝ 1/xⁿ
y = k/xⁿ
k = yxⁿ
\`\`\`

## 3. Ubahan Tercantum
Jika y berubah secara tercantum dengan xᵐ dan zⁿ:

\`\`\`text
y ∝ xᵐzⁿ
y = kxᵐzⁿ
k = y/(xᵐzⁿ)
\`\`\`

## 4. Ubahan Bergabung
Jika y berubah secara langsung dengan xᵖ dan secara songsang dengan zᵖ:

\`\`\`text
y ∝ xᵖ/zᵖ
y = kxᵖ/zᵖ
\`\`\`
          `,
          quiz: {
            questions: [
              {
                id: 1,
                question: "Apakah formula k bagi y = kxⁿ?",
                options: ["k = y/xⁿ", "k = yxⁿ", "k = xⁿ/y", "k = y + xⁿ"],
                correctAnswer: 0,
                explanation: "Daripada y = kxⁿ, bahagi kedua-dua belah dengan xⁿ untuk mendapat k = y/xⁿ."
              },
              {
                id: 2,
                question: "Apakah formula k bagi y = k/xⁿ?",
                options: ["k = y/xⁿ", "k = xⁿ/y", "k = yxⁿ", "k = y + xⁿ"],
                correctAnswer: 2,
                explanation: "Daripada y = k/xⁿ, darab kedua-dua belah dengan xⁿ untuk mendapat k = yxⁿ."
              },
              {
                id: 3,
                question: "Hubungan y ∝ x²z/√w ialah contoh ubahan apa?",
                options: ["Ubahan langsung sahaja", "Ubahan songsang sahaja", "Ubahan tercantum sahaja", "Ubahan bergabung"],
                correctAnswer: 3,
                explanation: "Hubungan ini menggabungkan ubahan tercantum dengan x² dan z, serta ubahan songsang dengan √w."
              }
            ]
          },
          quizTitle: "Kuiz Ringkasan Bab 1"
        }
      ]
    }
  ]
};
