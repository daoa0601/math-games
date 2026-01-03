interface ShapeArchitectLearnProps {
  lang: string;
}

const content = {
  en: {
    whatIsIt: {
      title: 'What is Shape Architect?',
      body: "Shape Architect is a 3D building puzzle where you place blocks to match a target shape. It's like playing with building blocks, but you need to think in three dimensions! Rotate, place, and build your way to matching the blueprint.",
    },
    mathBehind: {
      title: 'The Math Behind It',
      intro:
        "When you play Shape Architect, you're developing spatial reasoning - the ability to imagine and manipulate 3D objects in your mind.",
      concepts: [
        {
          term: 'Spatial Reasoning',
          description:
            "Understanding how objects look from different angles. Can you picture what a shape looks like from above? From the side? That's spatial reasoning!",
        },
        {
          term: '3D Coordinates',
          description:
            'Every block has a position described by three numbers: how far left/right (X), how far forward/back (Y), and how high up (Z).',
        },
        {
          term: 'Volume & Counting',
          description:
            'The total number of blocks in a shape is its volume. Counting blocks helps you understand how shapes fill space.',
        },
      ],
    },
    tips: {
      title: 'Tips & Tricks',
      items: [
        'Rotate the view often - seeing from different angles helps you understand the shape',
        'Build from the bottom up, layer by layer',
        'Count the blocks in each layer of the target shape before placing',
        'Use the grid lines to help you position blocks accurately',
      ],
    },
    funFact: {
      title: 'Did You Know?',
      body: 'Architects and engineers use the same 3D thinking every day! From designing buildings to planning cities, spatial reasoning is one of the most valuable skills you can develop.',
    },
  },
  vi: {
    whatIsIt: {
      title: 'Shape Architect là gì?',
      body: 'Shape Architect là trò chơi xếp hình 3D nơi bạn đặt các khối để khớp với hình mục tiêu. Giống như chơi xếp hình khối, nhưng bạn cần suy nghĩ trong không gian ba chiều! Xoay, đặt, và xây dựng để khớp với bản thiết kế.',
    },
    mathBehind: {
      title: 'Toán Học Đằng Sau',
      intro:
        'Khi chơi Shape Architect, bạn đang phát triển tư duy không gian - khả năng tưởng tượng và thao tác với các vật thể 3D trong đầu.',
      concepts: [
        {
          term: 'Tư Duy Không Gian',
          description:
            'Hiểu cách vật thể trông như thế nào từ các góc nhìn khác nhau. Bạn có thể hình dung một hình từ trên xuống không? Từ bên cạnh? Đó là tư duy không gian!',
        },
        {
          term: 'Tọa Độ 3D',
          description:
            'Mỗi khối có vị trí được mô tả bởi ba số: trái/phải bao xa (X), trước/sau bao xa (Y), và cao bao nhiêu (Z).',
        },
        {
          term: 'Thể Tích & Đếm',
          description:
            'Tổng số khối trong một hình là thể tích của nó. Đếm khối giúp bạn hiểu cách các hình chiếm không gian.',
        },
      ],
    },
    tips: {
      title: 'Mẹo & Thủ Thuật',
      items: [
        'Xoay góc nhìn thường xuyên - nhìn từ nhiều góc giúp bạn hiểu hình dạng',
        'Xây từ dưới lên, từng lớp một',
        'Đếm số khối trong mỗi lớp của hình mục tiêu trước khi đặt',
        'Sử dụng các đường lưới để định vị khối chính xác',
      ],
    },
    funFact: {
      title: 'Bạn Có Biết?',
      body: 'Kiến trúc sư và kỹ sư sử dụng cùng loại tư duy 3D mỗi ngày! Từ thiết kế tòa nhà đến quy hoạch thành phố, tư duy không gian là một trong những kỹ năng quý giá nhất bạn có thể phát triển.',
    },
  },
};

export function ShapeArchitectLearn({ lang }: ShapeArchitectLearnProps) {
  const c = lang === 'vi' ? content.vi : content.en;

  return (
    <article className="learn-content">
      {/* What is it? */}
      <section className="learn-content__section">
        <h3>{c.whatIsIt.title}</h3>
        <p>{c.whatIsIt.body}</p>
        <div className="learn-content__visual">
          <svg
            width="180"
            height="120"
            viewBox="0 0 180 120"
            fill="none"
            aria-hidden="true"
          >
            {/* Isometric cube stack */}
            {/* Bottom layer */}
            <g transform="translate(90, 90)">
              {/* Back left cube */}
              <path
                d="M-40,-20 L-20,-30 L0,-20 L-20,-10 Z"
                fill="var(--color-primary-bg)"
                stroke="var(--color-primary)"
                strokeWidth="2"
              />
              <path
                d="M-40,-20 L-40,0 L-20,10 L-20,-10 Z"
                fill="var(--color-primary)"
                fillOpacity="0.3"
                stroke="var(--color-primary)"
                strokeWidth="2"
              />
              <path
                d="M-20,-10 L-20,10 L0,0 L0,-20 Z"
                fill="var(--color-primary)"
                fillOpacity="0.5"
                stroke="var(--color-primary)"
                strokeWidth="2"
              />
            </g>
            <g transform="translate(90, 90)">
              {/* Front right cube */}
              <path
                d="M0,-20 L20,-30 L40,-20 L20,-10 Z"
                fill="var(--game-build-primary)"
                fillOpacity="0.2"
                stroke="var(--game-build-primary)"
                strokeWidth="2"
              />
              <path
                d="M0,-20 L0,0 L20,10 L20,-10 Z"
                fill="var(--game-build-primary)"
                fillOpacity="0.3"
                stroke="var(--game-build-primary)"
                strokeWidth="2"
              />
              <path
                d="M20,-10 L20,10 L40,0 L40,-20 Z"
                fill="var(--game-build-primary)"
                fillOpacity="0.5"
                stroke="var(--game-build-primary)"
                strokeWidth="2"
              />
            </g>
            {/* Top cube */}
            <g transform="translate(90, 60)">
              <path
                d="M-20,-20 L0,-30 L20,-20 L0,-10 Z"
                fill="var(--color-secondary-bg)"
                stroke="var(--color-secondary)"
                strokeWidth="2"
              />
              <path
                d="M-20,-20 L-20,0 L0,10 L0,-10 Z"
                fill="var(--color-secondary)"
                fillOpacity="0.3"
                stroke="var(--color-secondary)"
                strokeWidth="2"
              />
              <path
                d="M0,-10 L0,10 L20,0 L20,-20 Z"
                fill="var(--color-secondary)"
                fillOpacity="0.5"
                stroke="var(--color-secondary)"
                strokeWidth="2"
              />
            </g>
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

export default ShapeArchitectLearn;
