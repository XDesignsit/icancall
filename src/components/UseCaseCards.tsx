import React from "react";
import type { HomepageTranslations } from "@/lib/translations";

interface UseCaseCardsProps {
  t: HomepageTranslations["usecases"];
}

// The landing pages are route handlers serving static HTML, so these are plain
// anchors rather than next/link.
export default function UseCaseCards({ t }: UseCaseCardsProps) {
  const cards: {
    href: string;
    src: string;
    alt: string;
    title: string;
    desc: string;
    imgStyle: React.CSSProperties;
  }[] = [
    {
      href: "/parents",
      src: "/usecases/child-calling.png",
      alt: "Young children",
      title: t.u1Title,
      desc: t.u1Desc,
      imgStyle: { transform: "scale(1.25)", transformOrigin: "center bottom", objectPosition: "center bottom" },
    },
    {
      href: "/seniors",
      src: "/usecases/aging-parent.png",
      alt: "Aging parents",
      title: t.u2Title,
      desc: t.u2Desc,
      imgStyle: { transform: "scale(1.4)", transformOrigin: "center center", objectPosition: "center 58%" },
    },
    {
      href: "/caregivers",
      src: "/usecases/special-abilities.png",
      alt: "Special abilities & caregivers",
      title: t.u3Title,
      desc: t.u3Desc,
      imgStyle: { transform: "scale(1.4)", transformOrigin: "center center", objectPosition: "center 70%" },
    },
  ];

  return (
    <div className="usecases">
      {cards.map((card) => (
        <article className="usecase reveal in" key={card.href}>
          <a className="ph" href={card.href} aria-label={card.title}>
            <img
              src={card.src}
              alt={card.alt}
              style={{ width: "100%", height: "100%", objectFit: "cover", ...card.imgStyle }}
            />
          </a>
          <div className="body">
            <h3><a href={card.href}>{card.title}</a></h3>
            <p>{card.desc}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
