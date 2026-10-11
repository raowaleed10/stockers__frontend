/** The two looks (docs/04_DESIGN_SYSTEM.md §1). Counter is dark with a brass action; owner is light with green. */
export type Theme = 'counter' | 'owner';

/** 3 px focus ring: ivory on the counter, blue in the owner portal (docs/04 §4). */
export const focusRing: Record<Theme, string> = {
  counter:
    'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-c-text',
  owner:
    'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-o-blue',
};

/** Same ring, for a control that is hidden and shows its state on a label (radio inputs). */
export const focusWithinRing: Record<Theme, string> = {
  counter:
    'has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-c-text',
  owner:
    'has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-o-blue',
};
