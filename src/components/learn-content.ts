interface LearnSection {
  title: string
  body?: string
  intro?: string
  concepts?: { term: string; description: string }[]
  items?: string[]
}

export interface GameLearnContent {
  whatIsIt: LearnSection
  mathBehind: LearnSection
  tips: LearnSection
  funFact: LearnSection
}

type Locale = 'en' | 'vi'

const magicGraph: Record<Locale, GameLearnContent> = {
  en: {
    whatIsIt: {
      title: 'What is Magic Graph?',
      body: "A puzzle where you place numbers on a constellation of stars. Make every line add up to the same magic number!",
    },
    mathBehind: {
      title: 'The Math Behind It',
      intro: "Each line is an equation. You're solving systems of equations without realizing it!",
      concepts: [
        { term: 'Shared Numbers', description: 'Some stars connect multiple lines. Placing a number there affects all those lines at once.' },
        { term: 'Logical Deduction', description: "If you know two numbers on a line, you can calculate the third. That's algebra!" },
      ],
    },
    tips: {
      title: 'Tips',
      items: [
        'Start with stars that connect the most lines',
        'If a line has one empty spot, calculate what goes there',
        "There's often more than one solution",
      ],
    },
    funFact: {
      title: 'Did You Know?',
      body: 'Magic squares have been studied for over 4,000 years! Ancient Chinese mathematicians called them "Lo Shu".',
    },
  },
  vi: {
    whatIsIt: {
      title: 'Magic Graph là gì?',
      body: 'Một trò chơi giải đố nơi bạn đặt các số lên một chòm sao. Làm cho mỗi đường thẳng có tổng bằng một số ma thuật!',
    },
    mathBehind: {
      title: 'Toán Học Đằng Sau',
      intro: 'Mỗi đường là một phương trình. Bạn đang giải hệ phương trình mà không nhận ra!',
      concepts: [
        { term: 'Số Chung', description: 'Một số ngôi sao kết nối nhiều đường. Đặt số vào đó ảnh hưởng tất cả các đường cùng lúc.' },
        { term: 'Suy Luận Logic', description: 'Nếu bạn biết hai số trên một đường, bạn có thể tìm ra số thứ ba. Đó chính là đại số!' },
      ],
    },
    tips: {
      title: 'Mẹo',
      items: [
        'Bắt đầu với những ngôi sao kết nối nhiều đường nhất',
        'Nếu một đường chỉ còn một chỗ trống, tính chính xác số cần đặt',
        'Thường có nhiều hơn một lời giải',
      ],
    },
    funFact: {
      title: 'Bạn Có Biết?',
      body: 'Ô vuông ma thuật đã được nghiên cứu hơn 4.000 năm! Các nhà toán học Trung Quốc cổ đại gọi chúng là "Lạc Thư".',
    },
  },
}

const sequenceRace: Record<Locale, GameLearnContent> = {
  en: {
    whatIsIt: {
      title: 'What is Sequence Race?',
      body: "A strategy game where you and an AI take turns choosing numbers to reach a target. Complete the sequence before your opponent!",
    },
    mathBehind: {
      title: 'The Math Behind It',
      intro: "You're learning to recognize patterns and think ahead.",
      concepts: [
        { term: 'Number Sequences', description: 'A list of numbers following a pattern. Like 2, 4, 6, 8 — each is 2 more than the last!' },
        { term: 'Strategic Thinking', description: "Plan YOUR moves while blocking your opponent's. That's multi-step planning!" },
        { term: 'Consecutive Numbers', description: 'Numbers without gaps, like 5-6-7. Spotting these quickly is key to winning.' },
      ],
    },
    tips: {
      title: 'Tips',
      items: [
        'Control the middle numbers — they connect more sequences',
        "Watch what your opponent picks — can you block them?",
        'Plan two or three moves ahead',
      ],
    },
    funFact: {
      title: 'Did You Know?',
      body: "Sequence games are studied in Game Theory — used by economists, computer scientists, and chess grandmasters!",
    },
  },
  vi: {
    whatIsIt: {
      title: 'Sequence Race là gì?',
      body: 'Một trò chơi chiến thuật nơi bạn và AI lần lượt chọn số để đạt mục tiêu. Hoàn thành dãy số trước đối thủ!',
    },
    mathBehind: {
      title: 'Toán Học Đằng Sau',
      intro: 'Bạn đang học nhận biết quy luật và suy nghĩ trước.',
      concepts: [
        { term: 'Dãy Số', description: 'Danh sách các số theo một quy luật. Như 2, 4, 6, 8 — mỗi số lớn hơn số trước 2!' },
        { term: 'Tư Duy Chiến Lược', description: 'Lên kế hoạch cho BẠN trong khi chặn đối thủ. Đó là lập kế hoạch nhiều bước!' },
        { term: 'Số Liên Tiếp', description: 'Các số không có khoảng cách, như 5-6-7. Nhận ra nhanh là chìa khóa chiến thắng.' },
      ],
    },
    tips: {
      title: 'Mẹo',
      items: [
        'Kiểm soát các số ở giữa — chúng kết nối nhiều dãy số hơn',
        'Xem đối thủ chọn gì — bạn có thể chặn họ không?',
        'Lên kế hoạch trước hai hoặc ba nước',
      ],
    },
    funFact: {
      title: 'Bạn Có Biết?',
      body: 'Trò chơi dãy số được nghiên cứu trong Lý Thuyết Trò Chơi — được các nhà kinh tế, khoa học máy tính và kỳ thủ cờ sử dụng!',
    },
  },
}

const shapeArchitect: Record<Locale, GameLearnContent> = {
  en: {
    whatIsIt: {
      title: 'What is Shape Architect?',
      body: "A spatial puzzle where you fill a target shape using building blocks. Each piece must fit perfectly — like a 3D jigsaw!",
    },
    mathBehind: {
      title: 'The Math Behind It',
      intro: "You're developing spatial reasoning — a core skill in geometry and engineering.",
      concepts: [
        { term: 'Spatial Reasoning', description: 'Visualizing how shapes fit together in space. Engineers and architects use this daily!' },
        { term: '3D Coordinates', description: 'Each cell has an (x, y, z) position. You\'re navigating a coordinate system!' },
        { term: 'Volume & Counting', description: 'The total cells in all pieces must equal the target shape\'s volume. Conservation of volume!' },
      ],
    },
    tips: {
      title: 'Tips',
      items: [
        'Start with the largest piece — it has the fewest valid positions',
        'Corner cells are the most constrained — fill them first',
        'Use rotation to try different orientations before placing',
      ],
    },
    funFact: {
      title: 'Did You Know?',
      body: "Tetris, one of the most popular games ever, is based on the same math — fitting tetrominoes (4-cell shapes) into a grid!",
    },
  },
  vi: {
    whatIsIt: {
      title: 'Shape Architect là gì?',
      body: 'Một trò chơi giải đố không gian nơi bạn lắp đầy hình mục tiêu bằng các khối xây dựng. Mỗi mảnh phải khớp hoàn hảo — như ghép hình 3D!',
    },
    mathBehind: {
      title: 'Toán Học Đằng Sau',
      intro: 'Bạn đang phát triển tư duy không gian — kỹ năng cốt lõi trong hình học và kỹ thuật.',
      concepts: [
        { term: 'Tư Duy Không Gian', description: 'Hình dung cách các hình khớp với nhau trong không gian. Kỹ sư và kiến trúc sư sử dụng hàng ngày!' },
        { term: 'Tọa Độ 3D', description: 'Mỗi ô có vị trí (x, y, z). Bạn đang di chuyển trong hệ tọa độ!' },
        { term: 'Thể Tích', description: 'Tổng số ô của tất cả các mảnh phải bằng thể tích hình mục tiêu. Bảo toàn thể tích!' },
      ],
    },
    tips: {
      title: 'Mẹo',
      items: [
        'Bắt đầu với mảnh lớn nhất — nó có ít vị trí hợp lệ nhất',
        'Các ô góc bị ràng buộc nhất — điền chúng trước',
        'Sử dụng xoay để thử các hướng khác nhau trước khi đặt',
      ],
    },
    funFact: {
      title: 'Bạn Có Biết?',
      body: 'Tetris, một trong những trò chơi phổ biến nhất, dựa trên cùng một toán học — xếp các hình tetromino (4 ô) vào lưới!',
    },
  },
}

export const learnContent: Record<string, Record<Locale, GameLearnContent>> = {
  'magic-graph': magicGraph,
  'sequence-race': sequenceRace,
  'shape-architect': shapeArchitect,
}
