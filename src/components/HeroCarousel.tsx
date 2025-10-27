import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import bannerArena from "@/assets/bannerArena.png";
import banner2 from "@/assets/banner2.png";
import Autoplay from "embla-carousel-autoplay";

const HeroCarousel = () => {
  return (
    <div className="w-full max-w-5xl mx-auto mb-8">
      <Carousel
        plugins={[
          Autoplay({
            delay: 4000,
          }),
        ]}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          <CarouselItem>
            <a 
        href="https://hc-arena.netlify.app/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="block cursor-pointer transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl rounded-lg ring-4 ring-indigo-300"
      >
            <div className="relative w-full overflow-hidden rounded-lg">
              <img
                src={bannerArena}
                alt="Arena Heroclix"
                className="w-full h-full object-cover"
              />
            </div>
              </a>
          </CarouselItem>
          <CarouselItem>
            <div className="relative w-full overflow-hidden rounded-lg">
              <img
                src={banner2}
                alt="Campeonato Nacional de Heroclix"
                className="w-full h-full object-cover"
              />
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>
    </div>
  );
};

export default HeroCarousel;
