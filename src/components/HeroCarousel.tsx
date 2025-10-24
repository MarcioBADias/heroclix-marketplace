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
            <div className="relative w-full overflow-hidden rounded-lg">
              <img
                src={bannerArena}
                alt="Arena Heroclix"
                className="w-full h-full object-cover"
              />
            </div>
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
