import { useEffect, useState } from "react";
import { Quote } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { GUEST_REVIEWS } from "@/data/reviews";

const AUTOPLAY_INTERVAL_MS = 6000;

export function GuestReviewsCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => setSelected(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || paused) return;

    const timer = setInterval(() => api.scrollNext(), AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [api, paused]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "start" }}
        className="mx-auto max-w-6xl"
      >
        <CarouselContent className="-ml-4">
          {GUEST_REVIEWS.map((review) => (
            <CarouselItem
              key={review.id}
              className="pl-4 md:basis-1/2 lg:basis-1/3"
            >
              <article className="flex h-full flex-col border border-[#e3e7e4] bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-[#1f7567]/50 hover:shadow-lg">
                <Quote size={26} className="text-[#1f7567]" />
                <p className="mt-4 flex-1 text-sm leading-relaxed text-[#1f1f1f]/75">
                  {review.text}
                </p>
                <footer className="mt-6 flex items-center gap-3 border-t border-[#e3e7e4] pt-5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1f7567]/10 text-sm font-semibold text-[#1f7567]">
                    {review.author.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1f1f1f]">
                      {review.author}
                    </p>
                    <p className="text-xs text-[#1f1f1f]/50">{review.date}</p>
                  </div>
                  <span className="shrink-0 text-[10px] uppercase tracking-wider text-[#1f1f1f]/40">
                    {review.source}
                  </span>
                </footer>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="mt-8 flex items-center justify-center gap-4">
          <CarouselPrevious
            aria-label="Предыдущий отзыв"
            className="static size-10 translate-y-0 border-[#e3e7e4] bg-white text-[#1f1f1f] hover:border-[#1f7567] hover:bg-white hover:text-[#1f7567]"
          />
          <div className="flex flex-wrap items-center justify-center gap-2">
            {GUEST_REVIEWS.map((review, index) => (
              <button
                key={review.id}
                type="button"
                aria-label={`Перейти к отзыву ${index + 1}`}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === selected
                    ? "w-6 bg-[#1f7567]"
                    : "w-2 bg-[#1f1f1f]/15 hover:bg-[#1f1f1f]/30"
                )}
              />
            ))}
          </div>
          <CarouselNext
            aria-label="Следующий отзыв"
            className="static size-10 translate-y-0 border-[#e3e7e4] bg-white text-[#1f1f1f] hover:border-[#1f7567] hover:bg-white hover:text-[#1f7567]"
          />
        </div>
      </Carousel>
    </div>
  );
}
