// Single source of truth for the mobile/desktop breakpoint.
// Mobile = phones in any orientation:
//   - portrait phone:  width  < 768px
//   - landscape phone: height < 500px  (phones are short, tablets/laptops are taller)
// Viewports that are at least 768px wide and 500px tall are treated as desktop,
// including iPads that meet those dimensions.
//
// These values are mirrored in globals.css (@custom-variant mobile) and in
// src/hooks/use-is-mobile.ts. If you change them, update all three.
export const MOBILE_MAX_WIDTH_PX = 767;
export const MOBILE_MAX_HEIGHT_PX = 499;
