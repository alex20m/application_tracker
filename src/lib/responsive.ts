// Single source of truth for the mobile/desktop breakpoint.
// Mobile = phones in any orientation:
//   - portrait phone:  width  < 768px
//   - landscape phone: height < 500px  (phones are short, tablets/laptops are taller)
// iPad (both orientations) and desktop fail both conditions → desktop.
//
// These values are mirrored in globals.css (@custom-variant mobile) and in
// src/hooks/use-is-mobile.ts. If you change them, update all three.
export const MOBILE_MAX_WIDTH_PX = 767;
export const MOBILE_MAX_HEIGHT_PX = 499;
