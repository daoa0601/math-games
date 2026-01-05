interface SequenceRaceLearnProps {
  lang: string;
}

const content = {
  en: {
    whatIsIt: {
      title: 'What is Sequence Race?',
      body: "Sequence Race is a strategy game where you and an AI opponent take turns choosing numbers. Your goal is to complete a sequence (like 1-2-3) before your opponent does! It's like a number version of Tic-Tac-Toe, but with deeper strategy.",
    },
    mathBehind: {
      title: 'The Math Behind It',
      intro:
        "Playing Sequence Race teaches you to recognize patterns and think ahead. You're constantly asking: 'What comes next?'",
      concepts: [
        {
          term: 'Number Sequences',
          description:
            'A sequence is a list of numbers that follow a pattern. Like 2, 4, 6, 8 - each number is 2 more than the last!',
        },
        {
          term: 'Strategic Thinking',
          description:
            "You need to think about YOUR sequence and block your opponent's sequence at the same time. That's multi-step planning!",
        },
        {
          term: 'Consecutive Numbers',
          description:
            'Numbers that follow each other without gaps, like 5-6-7. Spotting these quickly is key to winning!',
        },
      ],
    },
    tips: {
      title: 'Tips & Tricks',
      items: [
        'Control the middle numbers - they can be part of more sequences',
        "Watch what numbers your opponent picks - can you block their sequence?",
        'Sometimes the best move is defensive - prevent your opponent from winning',
        'Plan two or three moves ahead when possible',
      ],
    },
    funFact: {
      title: 'Did You Know?',
      body: "Sequence games are studied in 'Game Theory' - a branch of mathematics used by economists, computer scientists, and even chess grandmasters!",
    },
  },
  vi: {
    whatIsIt: {
      title: 'Sequence Race là gì?',
      body: 'Sequence Race là trò chơi chiến thuật nơi bạn và đối thủ AI lần lượt chọn số. Mục tiêu là hoàn thành một dãy số (như 1-2-3) trước đối thủ! Giống như Cờ Ca-rô phiên bản số, nhưng với chiến thuật sâu hơn.',
    },
    mathBehind: {
      title: 'Toán Học Đằng Sau',
      intro:
        "Chơi Sequence Race dạy bạn nhận biết quy luật và suy nghĩ trước. Bạn luôn tự hỏi: 'Số tiếp theo là gì?'",
      concepts: [
        {
          term: 'Dãy Số',
          description:
            'Dãy số là danh sách các số theo một quy luật. Như 2, 4, 6, 8 - mỗi số lớn hơn số trước 2!',
        },
        {
          term: 'Tư Duy Chiến Lược',
          description:
            'Bạn cần nghĩ về dãy số CỦA MÌNH và chặn dãy số của đối thủ cùng lúc. Đó là lập kế hoạch nhiều bước!',
        },
        {
          term: 'Số Liên Tiếp',
          description:
            'Các số liền kề nhau không có khoảng trống, như 5-6-7. Nhận ra chúng nhanh là chìa khóa để thắng!',
        },
      ],
    },
    tips: {
      title: 'Mẹo & Thủ Thuật',
      items: [
        'Kiểm soát các số ở giữa - chúng có thể thuộc nhiều dãy số hơn',
        'Quan sát đối thủ chọn số nào - bạn có thể chặn dãy của họ không?',
        'Đôi khi nước đi tốt nhất là phòng thủ - ngăn đối thủ thắng',
        'Lập kế hoạch trước hai hoặc ba nước khi có thể',
      ],
    },
    funFact: {
      title: 'Bạn Có Biết?',
      body: "Các trò chơi về dãy số được nghiên cứu trong 'Lý Thuyết Trò Chơi' - một nhánh toán học được sử dụng bởi nhà kinh tế, khoa học máy tính, và thậm chí cả các đại kiện tướng cờ vua!",
    },
  },
};

export function SequenceRaceLearn({ lang }: SequenceRaceLearnProps) {
  const c = lang === 'vi' ? content.vi : content.en;

  return (
    <article className="learn-content">
      {/* What is it? */}
      <section className="learn-content__section">
        <h3>{c.whatIsIt.title}</h3>
        <p>{c.whatIsIt.body}</p>
        <div className="learn-content__visual">
          <svg
            width="240"
            height="80"
            viewBox="0 0 240 80"
            fill="none"
            aria-hidden="true"
          >
            {/* Number cells - Linear Editorial style */}
            {[1, 2, 3, 4, 5].map((num, i) => {
              const isPlayer = num === 1 || num === 2 || num === 3;
              return (
                <g key={i}>
                  <rect
                    x={i * 48 + 4}
                    y="16"
                    width="40"
                    height="48"
                    rx="2"
                    fill={isPlayer ? '#111827' : '#0a0f1a'}
                    stroke={isPlayer ? '#fb923c' : '#1e3a5f'}
                    strokeWidth="2"
                  />
                  <text
                    x={i * 48 + 24}
                    y="48"
                    textAnchor="middle"
                    fill={isPlayer ? '#fb923c' : '#64748b'}
                    fontWeight="bold"
                    fontSize="20"
                  >
                    {num}
                  </text>
                </g>
              );
            })}
            {/* Winning indicator */}
            <line
              x1="24"
              y1="72"
              x2="120"
              y2="72"
              stroke="#4ade80"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </section>

      {/* The Math Behind It */}
      <section className="learn-content__section">
        <h3>{c.mathBehind.title}</h3>
        <p>{c.mathBehind.intro}</p>
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

export default SequenceRaceLearn;
