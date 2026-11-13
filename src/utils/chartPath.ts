export function buildPath(
  values: Array<number | null>,
  indexCount: number,
  minimum: number,
  maximum: number,
): string {
  const left = 96;
  const right = 724;
  const top = 20;
  const bottom = 236;
  const range = maximum - minimum || 1;
  const denominator = Math.max(indexCount - 1, 1);
  let shouldMove = true;
  const commands: string[] = [];

  values.forEach((value, index) => {
    if (value === null) {
      shouldMove = true;
      return;
    }
    const x = left + (index / denominator) * (right - left);
    const y = bottom - ((value - minimum) / range) * (bottom - top);
    commands.push(`${shouldMove ? "M" : "L"} ${x} ${y}`);
    shouldMove = false;
  });

  return commands.join(" ");
}
