"use client";

import { useState } from "react";

import { ChevronDown } from "lucide-react";

import { faqs as defaultFaqs } from "@/components/landing-v2/data";
import { HighlightText } from "@/components/landing-v2/highlight-text";
import {
  landingContentSectionClassName,
  landingSectionBodyGapClassName,
} from "@/components/landing-v2/section-rhythm";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type FaqItem = {
  question: string;
  answer: string;
};

export function FAQ({
  eyebrow = "FAQ",
  title = "Questions?",
  highlightedTitle = "We've got answers.",
  description = "Everything you need to know about creating links, completing actions and unlocking content with Link4Sub.",
  faqs = defaultFaqs,
}: {
  eyebrow?: string;
  title?: string;
  highlightedTitle?: string;
  description?: string;
  faqs?: readonly FaqItem[];
}) {
  const [openQuestion, setOpenQuestion] = useState<string | null>(
    faqs[0]?.question ?? null,
  );

  return (
    <section
      id="faq"
      className={landingContentSectionClassName}
    >
      {/* background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div
          className="
            absolute left-1/2 top-[30%]
            h-[500px] w-[850px]
            -translate-x-1/2
            rounded-full
            bg-primary/[0.045]
            blur-[130px]
          "
        />
      </div>

      <div className="mx-auto w-full max-w-[980px] px-4 md:px-8">
        {/* HEADER */}
        <div className="mx-auto max-w-[700px] text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {eyebrow}
          </span>

          <h2
            className="
              mt-4
              text-balance
              text-[2.7rem]
              font-semibold
              leading-[1]
              tracking-[-0.05em]
              text-foreground
              sm:text-[3.4rem]
            "
          >
            {title}
            <br className="hidden sm:block" />
            {" "}
            <HighlightText>{highlightedTitle}</HighlightText>
          </h2>

          <p className="mx-auto mt-5 max-w-[580px] text-[16px] leading-7 text-muted-foreground">
            {description}
          </p>
        </div>

        {/* FAQ LIST */}
        <div
          className={`${landingSectionBodyGapClassName} mx-auto max-w-[860px] border-t border-border`}
        >
          {faqs.map((item, index) => {
            const isOpen = openQuestion === item.question;

            return (
              <Collapsible
                key={item.question}
                open={isOpen}
                onOpenChange={(open) =>
                  setOpenQuestion(open ? item.question : null)
                }
              >
                <div className="border-b border-border">
                  <CollapsibleTrigger
                    className="
                      group flex w-full
                      items-start gap-4
                      py-6 text-left
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-ring/40
                      md:gap-5
                      md:py-7
                    "
                  >
                    {/* number */}
                    <span
                      className="
                        mt-1 w-7 shrink-0
                        text-xs font-medium
                        tabular-nums
                        text-muted-foreground/45
                      "
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    {/* question */}
                    <span className="flex min-w-0 flex-1 items-start justify-between gap-5">
                      <span
                        className={cn(
                          `
                            text-[17px]
                            font-medium
                            leading-6
                            tracking-[-0.015em]
                            transition-colors
                            md:text-[19px]
                          `,
                          isOpen
                            ? "text-foreground"
                            : "text-foreground/80 group-hover:text-foreground",
                        )}
                      >
                        {item.question}
                      </span>

                      <span
                        className={cn(
                          `
                            mt-0.5 flex size-8
                            shrink-0
                            items-center justify-center
                            rounded-full
                            border border-border
                            bg-background
                            transition-all duration-200
                          `,
                          // isOpen &&
                          //   "border-primary/20 bg-primary/10 text-primary",
                        )}
                      >
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform duration-300",
                            isOpen && "rotate-180",
                          )}
                        />
                      </span>
                    </span>
                  </CollapsibleTrigger>

                  <CollapsibleContent
                    forceMount
                    aria-hidden={!isOpen}
                    className={cn(
                      `
                        grid overflow-hidden
                        transition-[grid-template-rows,opacity]
                        duration-300
                        ease-[cubic-bezier(0.22,1,0.36,1)]
                        motion-reduce:transition-none
                      `,
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "pointer-events-none grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="grid grid-cols-[28px_1fr] gap-4 pb-7 md:gap-5">
                        <div />

                        <p
                          className="
                            max-w-[720px]
                            pr-10
                            text-[15px]
                            leading-7
                            text-muted-foreground
                            md:text-[16px]
                          "
                        >
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </section>
  );
}
