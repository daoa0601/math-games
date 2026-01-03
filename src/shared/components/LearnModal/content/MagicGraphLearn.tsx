interface MagicGraphLearnProps {
  lang: string;
}

const content = {
  en: {
    whatIsIt: {
      title: 'What is Magic Graph?',
      body: "Magic Graph is a puzzle where you place numbers on a constellation of stars. Your goal is to make every line of stars add up to the same magic number! It's like solving a mystery where every piece must fit perfectly.",
    },
    mathBehind: {
      title: 'The Math Behind It',
      intro:
        "When you play Magic Graph, you're actually solving equations without even realizing it! Each line is an equation:",
      equation: '? + ? + ? = 15',
      equationLabel: 'Each line must equal the target sum',
      concepts: [
        {
          term: 'Shared Numbers',
          description:
            'Some stars connect multiple lines. When you place a number there, it affects all those lines at once!',
        },
        {
          term: 'Logical Deduction',
          description:
            "If you know two numbers on a line, you can figure out the third. That's algebra in action!",
        },
      ],
    },
    tips: {
      title: 'Tips & Tricks',
      items: [
        'Start with stars that connect the most lines - they give you the most information',
        'If a line only has one empty spot, you can calculate exactly what number goes there',
        'Made a mistake? Use undo and try a different approach',
        "There's often more than one solution - find your own path!",
      ],
    },
    funFact: {
      title: 'Did You Know?',
      body: 'Magic squares have been studied for over 4,000 years! Ancient Chinese mathematicians called them "Lo Shu" and believed they had mystical powers.',
    },
  },
  vi: {
    whatIsIt: {
      title: 'Magic Graph là gì?',
      body: 'Magic Graph là một trò chơi giải đố nơi bạn đặt các số lên một chòm sao. Mục tiêu là làm cho mỗi đường thẳng của các ngôi sao có tổng bằng một số ma thuật! Giống như giải một bí ẩn mà mỗi mảnh ghép phải khớp hoàn hảo.',
    },
    mathBehind: {
      title: 'Toán Học Đằng Sau',
      intro:
        'Khi chơi Magic Graph, bạn thực ra đang giải phương trình mà không nhận ra! Mỗi đường là một phương trình:',
      equation: '? + ? + ? = 15',
      equationLabel: 'Mỗi đường phải bằng tổng mục tiêu',
      concepts: [
        {
          term: 'Số Chung',
          description:
            'Một số ngôi sao kết nối nhiều đường. Khi bạn đặt số vào đó, nó ảnh hưởng tất cả các đường cùng lúc!',
        },
        {
          term: 'Suy Luận Logic',
          description:
            'Nếu bạn biết hai số trên một đường, bạn có thể tìm ra số thứ ba. Đó chính là đại số!',
        },
      ],
    },
    tips: {
      title: 'Mẹo & Thủ Thuật',
      items: [
        'Bắt đầu với những ngôi sao kết nối nhiều đường nhất - chúng cho bạn nhiều thông tin nhất',
        'Nếu một đường chỉ còn một chỗ trống, bạn có thể tính chính xác số cần đặt',
        'Sai rồi? Dùng nút hoàn tác và thử cách khác',
        'Thường có nhiều hơn một lời giải - tìm con đường của riêng bạn!',
      ],
    },
    funFact: {
      title: 'Bạn Có Biết?',
      body: 'Ô vuông ma thuật đã được nghiên cứu hơn 4.000 năm! Các nhà toán học Trung Quốc cổ đại gọi chúng là "Lạc Thư" và tin rằng chúng có sức mạnh huyền bí.',
    },
  },
};

export function MagicGraphLearn({ lang }: MagicGraphLearnProps) {
  const c = lang === 'vi' ? content.vi : content.en;

  return (
    <article className="learn-content">
      {/* What is it? */}
      <section className="learn-content__section">
        <h3>{c.whatIsIt.title}</h3>
        <p>{c.whatIsIt.body}</p>
        <div className="learn-content__visual">
          <svg
            width="200"
            height="120"
            viewBox="0 0 200 120"
            fill="none"
            aria-hidden="true"
          >
            {/* Simple triangle with nodes */}
            <line
              x1="100"
              y1="20"
              x2="40"
              y2="100"
              stroke="var(--color-magic)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="100"
              y1="20"
              x2="160"
              y2="100"
              stroke="var(--color-magic)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="40"
              y1="100"
              x2="160"
              y2="100"
              stroke="var(--color-magic)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Nodes */}
            <circle
              cx="100"
              cy="20"
              r="18"
              fill="var(--surface-card)"
              stroke="var(--color-primary)"
              strokeWidth="3"
            />
            <circle
              cx="40"
              cy="100"
              r="18"
              fill="var(--surface-card)"
              stroke="var(--color-primary)"
              strokeWidth="3"
            />
            <circle
              cx="160"
              cy="100"
              r="18"
              fill="var(--surface-card)"
              stroke="var(--color-primary)"
              strokeWidth="3"
            />
            {/* Numbers */}
            <text
              x="100"
              y="26"
              textAnchor="middle"
              fill="var(--text-primary)"
              fontWeight="bold"
              fontSize="16"
            >
              3
            </text>
            <text
              x="40"
              y="106"
              textAnchor="middle"
              fill="var(--text-primary)"
              fontWeight="bold"
              fontSize="16"
            >
              5
            </text>
            <text
              x="160"
              y="106"
              textAnchor="middle"
              fill="var(--text-primary)"
              fontWeight="bold"
              fontSize="16"
            >
              7
            </text>
          </svg>
        </div>
      </section>

      {/* The Math Behind It */}
      <section className="learn-content__section">
        <h3>{c.mathBehind.title}</h3>
        <p>{c.mathBehind.intro}</p>
        <div className="learn-content__example">
          <span className="learn-content__equation">{c.mathBehind.equation}</span>
          <span className="learn-content__equation-label">
            {c.mathBehind.equationLabel}
          </span>
        </div>
        {c.mathBehind.concepts.map((concept, i) => (
          <div key={i} className="learn-content__highlight">
            <p>
              <strong>{concept.term}:</strong> {concept.description}
            </p>
          </div>
        ))}
      </section>

      {/* Tips & Tricks */}
      <section className="learn-content__section">
        <h3>{c.tips.title}</h3>
        <ul className="learn-content__tips">
          {c.tips.items.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      </section>

      {/* Fun Fact */}
      <section className="learn-content__section">
        <h3>{c.funFact.title}</h3>
        <p>{c.funFact.body}</p>
      </section>
    </article>
  );
}

export default MagicGraphLearn;
