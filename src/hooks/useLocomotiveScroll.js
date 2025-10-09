import { useEffect } from 'react';
import LocomotiveScroll from 'locomotive-scroll';
import 'locomotive-scroll/src/locomotive-scroll.scss';

export default function useLocomotiveScroll(start) {
  useEffect(() => {
    if (!start) return;

    const scrollEl = document.querySelector('[data-scroll-container]');
    const locoScroll = new LocomotiveScroll({
      el: scrollEl,
      smooth: true,
      multiplier: 1,
      class: 'is-reveal',
    });

    return () => {
      if (locoScroll) locoScroll.destroy();
    };
  }, [start]);
}