import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css"; 
import Slider from "react-slick";
import React from 'react'
import "./Carousel.css"

function Carousel({courseData}) {
    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1
      };

  return (
    <div>
        <Slider style={{width: '100%'}} {...settings}>
          {
            courseData?.images?.length > 0 && courseData.images.map(photo => (
              <div>
                <img src={`${photo.url}`} alt='' className="carouselImg" />
              </div>
            ))
          }
        </Slider>
    </div>
  )
}

export default Carousel