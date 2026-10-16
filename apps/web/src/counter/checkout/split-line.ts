/**
 * A statement line split the way screen 25 draws it: "Frame 1, Table 1" over "8:31 PM, lost to Ali Raza". A frame's
 * text is "Frame 1, Table 1, lost to Ali Raza"; any other line is a title with only its time under it.
 */
export function splitLine(text: string): { title: string; rest: string } {
  const match = /^(.+?, .+?), (lost to .+)$/.exec(text);
  return match ? { title: match[1], rest: match[2] } : { title: text, rest: '' };
}
