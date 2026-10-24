interface LearnSection {
  title: string;
  body?: string;
  intro?: string;
  concepts?: { term: string; description: string }[];
  items?: string[];
}

export interface GameLearnContent {
  whatIsIt: LearnSection;
  mathBehind: LearnSection;
  tips: LearnSection;
  funFact: LearnSection;
}

type Locale = "en" | "vi";

const magicGraph: Record<Locale, GameLearnContent> = {
  en: {
    whatIsIt: {
      title: "What is Magic Graph?",
      body: "A puzzle where you place numbers on a constellation of stars. Make every line add up to the same magic number!",
    },
    mathBehind: {
      title: "The Math Behind It",
      intro:
        "Each line is an equation. You're solving systems of equations without realizing it!",
      concepts: [
        {
          term: "Shared Numbers",
          description:
            "Some stars connect multiple lines. Placing a number there affects all those lines at once.",
        },
        {
          term: "Logical Deduction",
          description:
            "If you know two numbers on a line, you can calculate the third. That's algebra!",
        },
      ],
    },
    tips: {
      title: "Tips",
      items: [
        "Start with stars that connect the most lines",
        "If a line has one empty spot, calculate what goes there",
        "There's often more than one solution",
      ],
    },
    funFact: {
      title: "Did You Know?",
      body: 'Magic squares have been studied for over 4,000 years! Ancient Chinese mathematicians called them "Lo Shu".',
    },
  },
  vi: {
    whatIsIt: {
      title: "Magic Graph là gì?",
      body: "Một trò chơi giải đố nơi bạn đặt các số lên một chòm sao. Làm cho mỗi đường thẳng có tổng bằng một số ma thuật!",
    },
    mathBehind: {
      title: "Toán Học Đằng Sau",
      intro:
        "Mỗi đường là một phương trình. Bạn đang giải hệ phương trình mà không nhận ra!",
      concepts: [
        {
          term: "Số Chung",
          description:
            "Một số ngôi sao kết nối nhiều đường. Đặt số vào đó ảnh hưởng tất cả các đường cùng lúc.",
        },
        {
          term: "Suy Luận Logic",
          description:
            "Nếu bạn biết hai số trên một đường, bạn có thể tìm ra số thứ ba. Đó chính là đại số!",
        },
      ],
    },
    tips: {
      title: "Mẹo",
      items: [
        "Bắt đầu với những ngôi sao kết nối nhiều đường nhất",
        "Nếu một đường chỉ còn một chỗ trống, tính chính xác số cần đặt",
        "Thường có nhiều hơn một lời giải",
      ],
    },
    funFact: {
      title: "Bạn Có Biết?",
      body: 'Ô vuông ma thuật đã được nghiên cứu hơn 4.000 năm! Các nhà toán học Trung Quốc cổ đại gọi chúng là "Lạc Thư".',
    },
  },
};

const sequenceRace: Record<Locale, GameLearnContent> = {
  en: {
    whatIsIt: {
      title: "What is Sequence Race?",
      body: "A strategy game where you and an AI take turns choosing numbers to reach a target. Complete the sequence before your opponent!",
    },
    mathBehind: {
      title: "The Math Behind It",
      intro: "You're learning to recognize patterns and think ahead.",
      concepts: [
        {
          term: "Number Sequences",
          description:
            "A list of numbers following a pattern. Like 2, 4, 6, 8 — each is 2 more than the last!",
        },
        {
          term: "Strategic Thinking",
          description:
            "Plan YOUR moves while blocking your opponent's. That's multi-step planning!",
        },
        {
          term: "Consecutive Numbers",
          description:
            "Numbers without gaps, like 5-6-7. Spotting these quickly is key to winning.",
        },
      ],
    },
    tips: {
      title: "Tips",
      items: [
        "Control the middle numbers — they connect more sequences",
        "Watch what your opponent picks — can you block them?",
        "Plan two or three moves ahead",
      ],
    },
    funFact: {
      title: "Did You Know?",
      body: "Sequence games are studied in Game Theory — used by economists, computer scientists, and chess grandmasters!",
    },
  },
  vi: {
    whatIsIt: {
      title: "Sequence Race là gì?",
      body: "Một trò chơi chiến thuật nơi bạn và AI lần lượt chọn số để đạt mục tiêu. Hoàn thành dãy số trước đối thủ!",
    },
    mathBehind: {
      title: "Toán Học Đằng Sau",
      intro: "Bạn đang học nhận biết quy luật và suy nghĩ trước.",
      concepts: [
        {
          term: "Dãy Số",
          description:
            "Danh sách các số theo một quy luật. Như 2, 4, 6, 8 — mỗi số lớn hơn số trước 2!",
        },
        {
          term: "Tư Duy Chiến Lược",
          description:
            "Lên kế hoạch cho BẠN trong khi chặn đối thủ. Đó là lập kế hoạch nhiều bước!",
        },
        {
          term: "Số Liên Tiếp",
          description:
            "Các số không có khoảng cách, như 5-6-7. Nhận ra nhanh là chìa khóa chiến thắng.",
        },
      ],
    },
    tips: {
      title: "Mẹo",
      items: [
        "Kiểm soát các số ở giữa — chúng kết nối nhiều dãy số hơn",
        "Xem đối thủ chọn gì — bạn có thể chặn họ không?",
        "Lên kế hoạch trước hai hoặc ba nước",
      ],
    },
    funFact: {
      title: "Bạn Có Biết?",
      body: "Trò chơi dãy số được nghiên cứu trong Lý Thuyết Trò Chơi — được các nhà kinh tế, khoa học máy tính và kỳ thủ cờ sử dụng!",
    },
  },
};

const shapeArchitect: Record<Locale, GameLearnContent> = {
  en: {
    whatIsIt: {
      title: "What is Shape Architect?",
      body: "A spatial puzzle where you fill a target shape using building blocks. Each piece must fit perfectly — like a 3D jigsaw!",
    },
    mathBehind: {
      title: "The Math Behind It",
      intro:
        "You're developing spatial reasoning — a core skill in geometry and engineering.",
      concepts: [
        {
          term: "Spatial Reasoning",
          description:
            "Visualizing how shapes fit together in space. Engineers and architects use this daily!",
        },
        {
          term: "3D Coordinates",
          description:
            "Each cell has an (x, y, z) position. You're navigating a coordinate system!",
        },
        {
          term: "Volume & Counting",
          description:
            "The total cells in all pieces must equal the target shape's volume. Conservation of volume!",
        },
      ],
    },
    tips: {
      title: "Tips",
      items: [
        "Start with the largest piece — it has the fewest valid positions",
        "Corner cells are the most constrained — fill them first",
        "Use rotation to try different orientations before placing",
      ],
    },
    funFact: {
      title: "Did You Know?",
      body: "Tetris, one of the most popular games ever, is based on the same math — fitting tetrominoes (4-cell shapes) into a grid!",
    },
  },
  vi: {
    whatIsIt: {
      title: "Shape Architect là gì?",
      body: "Một trò chơi giải đố không gian nơi bạn lắp đầy hình mục tiêu bằng các khối xây dựng. Mỗi mảnh phải khớp hoàn hảo — như ghép hình 3D!",
    },
    mathBehind: {
      title: "Toán Học Đằng Sau",
      intro:
        "Bạn đang phát triển tư duy không gian — kỹ năng cốt lõi trong hình học và kỹ thuật.",
      concepts: [
        {
          term: "Tư Duy Không Gian",
          description:
            "Hình dung cách các hình khớp với nhau trong không gian. Kỹ sư và kiến trúc sư sử dụng hàng ngày!",
        },
        {
          term: "Tọa Độ 3D",
          description:
            "Mỗi ô có vị trí (x, y, z). Bạn đang di chuyển trong hệ tọa độ!",
        },
        {
          term: "Thể Tích",
          description:
            "Tổng số ô của tất cả các mảnh phải bằng thể tích hình mục tiêu. Bảo toàn thể tích!",
        },
      ],
    },
    tips: {
      title: "Mẹo",
      items: [
        "Bắt đầu với mảnh lớn nhất — nó có ít vị trí hợp lệ nhất",
        "Các ô góc bị ràng buộc nhất — điền chúng trước",
        "Sử dụng xoay để thử các hướng khác nhau trước khi đặt",
      ],
    },
    funFact: {
      title: "Bạn Có Biết?",
      body: "Tetris, một trong những trò chơi phổ biến nhất, dựa trên cùng một toán học — xếp các hình tetromino (4 ô) vào lưới!",
    },
  },
};

const patternDetective: Record<Locale, GameLearnContent> = {
  en: {
    whatIsIt: {
      title: "What is Pattern Detective?",
      body: "A number sequence has one missing term. Study how the numbers grow (or shrink) and figure out what belongs in the gap.",
    },
    mathBehind: {
      title: "The Math Behind It",
      intro:
        "Every sequence follows a rule. Spotting the rule is the first step of algebra — you're finding the function that produced the list.",
      concepts: [
        {
          term: "Arithmetic sequence",
          description: "Each term adds the same difference (2, 5, 8, 11, …).",
        },
        {
          term: "Geometric sequence",
          description:
            "Each term multiplies by the same ratio (3, 6, 12, 24, …).",
        },
        {
          term: "Recursive rule",
          description:
            "Each term depends on previous terms, like Fibonacci: 1, 1, 2, 3, 5, 8, …",
        },
      ],
    },
    tips: {
      title: "Tips",
      items: [
        "Look at the gap between two neighbouring terms you can see",
        "Check the difference of differences — if it grows, the rule may be ×, not +",
        "If the sequence oscillates or changes sign, suspect alternating signs or a power",
      ],
    },
    funFact: {
      title: "Did You Know?",
      body: "The Fibonacci sequence appears in sunflower seeds, pineapple skins, and nautilus shells — nature loves a good rule.",
    },
  },
  vi: {
    whatIsIt: {
      title: "Thám Tử Quy Luật là gì?",
      body: "Một dãy số bị thiếu một số. Hãy xem các số tăng (hoặc giảm) thế nào và tìm ra số còn thiếu.",
    },
    mathBehind: {
      title: "Toán Học Đằng Sau",
      intro:
        "Mỗi dãy số tuân theo một quy luật. Nhận ra quy luật là bước đầu tiên của đại số — bạn đang tìm hàm số tạo ra dãy.",
      concepts: [
        {
          term: "Cấp số cộng",
          description:
            "Mỗi số hơn kém nhau một khoảng không đổi (2, 5, 8, 11, …).",
        },
        {
          term: "Cấp số nhân",
          description: "Mỗi số nhân với cùng một tỉ số (3, 6, 12, 24, …).",
        },
        {
          term: "Quy luật đệ quy",
          description:
            "Mỗi số phụ thuộc các số trước, như Fibonacci: 1, 1, 2, 3, 5, 8, …",
        },
      ],
    },
    tips: {
      title: "Mẹo",
      items: [
        "Nhìn khoảng cách giữa hai số kế bên cạnh nhau",
        "Kiểm tra hiệu của các hiệu — nếu tăng, quy luật có thể là × thay vì +",
        "Nếu dãy dao động hoặc đổi dấu, hãy nghĩ tới dấu luân phiên hoặc lũy thừa",
      ],
    },
    funFact: {
      title: "Bạn Có Biết?",
      body: "Dãy Fibonacci xuất hiện trong hạt hướng dương, vỏ dứa và vỏ ốc anh vũ — thiên nhiên rất thích những quy luật đẹp.",
    },
  },
};

const fractionBuilder: Record<Locale, GameLearnContent> = {
  en: {
    whatIsIt: {
      title: "What is Fraction Builder?",
      body: "Build, simplify, and compare fractions. Split a whole into equal parts and reason about how much of it you have.",
    },
    mathBehind: {
      title: "The Math Behind It",
      intro:
        "A fraction is a division that hasn't been carried out. The denominator names the size of each piece; the numerator counts how many you have.",
      concepts: [
        {
          term: "Equivalent fractions",
          description:
            "1/2 and 2/4 are the same amount — multiply or divide top and bottom by the same number.",
        },
        {
          term: "Comparing fractions",
          description:
            "Same denominator? Compare numerators. Same numerator? The smaller denominator wins.",
        },
        {
          term: "Simplest form",
          description:
            "Divide top and bottom by their greatest common divisor until they share no factor.",
        },
      ],
    },
    tips: {
      title: "Tips",
      items: [
        "Picture a chocolate bar — the denominator is how many squares it's cut into",
        "To compare fractions with different denominators, find a common one",
        "A simplified fraction still represents the exact same amount",
      ],
    },
    funFact: {
      title: "Did You Know?",
      body: "The ancient Egyptians only used unit fractions (1/2, 1/3, 1/4, …) and wrote every other fraction as a sum of them.",
    },
  },
  vi: {
    whatIsIt: {
      title: "Xây Phân Số là gì?",
      body: "Tạo, rút gọn và so sánh các phân số. Chia một tổng thể thành các phần bằng nhau và suy luận xem bạn có bao nhiêu phần.",
    },
    mathBehind: {
      title: "Toán Học Đằng Sau",
      intro:
        "Phân số là một phép chia chưa thực hiện. Mẫu số cho biết mỗi phần lớn bao nhiêu; tử số đếm xem có bao nhiêu phần.",
      concepts: [
        {
          term: "Phân số tương đương",
          description:
            "1/2 và 2/4 là cùng một lượng — nhân hoặc chia cả tử và mẫu cho cùng một số.",
        },
        {
          term: "So sánh phân số",
          description:
            "Cùng mẫu? So sánh tử. Cùng tử? Mẫu nhỏ hơn thì phân số lớn hơn.",
        },
        {
          term: "Dạng tối giản",
          description:
            "Chia cả tử và mẫu cho ước chung lớn nhất cho tới khi chúng không còn chung ước.",
        },
      ],
    },
    tips: {
      title: "Mẹo",
      items: [
        "Tưởng tượng một thanh chocolate — mẫu số là số ô nó được chia",
        "Để so sánh phân số khác mẫu, hãy quy đồng mẫu số",
        "Phân số tối giản vẫn đại diện cho chính xác cùng một lượng",
      ],
    },
    funFact: {
      title: "Bạn Có Biết?",
      body: "Người Ai Cập cổ đại chỉ dùng phân số đơn vị (1/2, 1/3, 1/4, …) và viết mọi phân số khác dưới dạng tổng của chúng.",
    },
  },
};

const equationBalance: Record<Locale, GameLearnContent> = {
  en: {
    whatIsIt: {
      title: "What is Equation Balance?",
      body: "An equation is a balanced scale. Find the value of the unknown (?) that keeps both sides equal.",
    },
    mathBehind: {
      title: "The Math Behind It",
      intro:
        "Solving an equation means doing the same operation to both sides until the unknown is alone. That's all algebra ever is.",
      concepts: [
        {
          term: "Inverse operations",
          description:
            "Undo addition with subtraction, multiplication with division.",
        },
        {
          term: "Two-step equations",
          description:
            "First peel off the addition/subtraction, then undo the multiplication. Order matters.",
        },
        {
          term: "Check by substituting",
          description:
            "Plug your answer back into the equation — both sides should match.",
        },
      ],
    },
    tips: {
      title: "Tips",
      items: [
        "Isolate the unknown one step at a time, starting from the outside",
        "Whatever you do to one side, do to the other",
        "Always substitute your answer back to check",
      ],
    },
    funFact: {
      title: "Did You Know?",
      body: "The '=' sign was invented in 1557 by Robert Recorde, who chose two equal-length lines because 'no two things can be more equal.'",
    },
  },
  vi: {
    whatIsIt: {
      title: "Cân Bằng Phương Trình là gì?",
      body: "Phương trình là một cái cân. Hãy tìm giá trị của ẩn số (?) sao cho hai vế vẫn bằng nhau.",
    },
    mathBehind: {
      title: "Toán Học Đằng Sau",
      intro:
        "Giải phương trình tức là làm cùng một phép toán với cả hai vế cho tới khi ẩn số đứng một mình. Đó là toàn bộ đại số.",
      concepts: [
        {
          term: "Phép toán ngược",
          description:
            "Phép cộng bị triệt tiêu bởi phép trừ, phép nhân bởi phép chia.",
        },
        {
          term: "Phương trình hai bước",
          description:
            "Trước tiên gỡ phép cộng/trừ, sau đó gỡ phép nhân. Thứ tự quan trọng.",
        },
        {
          term: "Kiểm tra bằng cách thay số",
          description:
            "Thay đáp án vào lại phương trình — hai vế phải khớp nhau.",
        },
      ],
    },
    tips: {
      title: "Mẹo",
      items: [
        "Cô lập ẩn số từng bước một, bắt đầu từ bên ngoài",
        "Phép gì làm với một vế thì cũng làm với vế kia",
        "Luôn thay đáp án ngược lại để kiểm tra",
      ],
    },
    funFact: {
      title: "Bạn Có Biết?",
      body: "Dấu '=' được phát minh năm 1557 bởi Robert Recorde, ông chọn hai đường dài bằng nhau vì 'không có thứ gì bằng nhau hơn'.",
    },
  },
};

export const learnContent: Partial<
  Record<string, Record<Locale, GameLearnContent>>
> = {
  "magic-graph": magicGraph,
  "sequence-race": sequenceRace,
  "shape-architect": shapeArchitect,
  "pattern-detective": patternDetective,
  "fraction-builder": fractionBuilder,
  "equation-balance": equationBalance,
};

export function getHints(gameId: string, locale: Locale): string[] {
  return learnContent[gameId]?.[locale].tips.items ?? [];
}
