import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import banner1 from "@/assets/banner1.png";
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
            <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg">
              <img
                src={banner1}
                alt="Arena Heroclix"
                className="w-full h-full object-cover"
              />
            </div>
          </CarouselItem>
          <CarouselItem>
            <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg">
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
