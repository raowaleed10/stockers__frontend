import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '@/lib/i18n';
import { MoneyText } from './MoneyText';

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('MoneyText', () => {
  it('writes Rs and the grouped number in English', () => {
    const { container } = render(<MoneyText value={1350} />);
    expect(container).toHaveTextContent('Rs 1,350');
  });

  it('writes the number first and then روپے in Urdu', async () => {
    await i18n.changeLanguage('ur');
    const { container } = render(<MoneyText value={1350} />);
    expect(container.textContent).toBe('1,350 روپے');
  });

  it('keeps Western digits in Urdu', async () => {
    await i18n.changeLanguage('ur');
    const { container } = render(<MoneyText value={2500} />);
    expect(container.textContent).toMatch(/^2,500 /);
    expect(container.textContent).not.toMatch(/[٠-٩۰-۹]/);
  });

  it('shows a minus sign for a negative amount', () => {
    const { container } = render(<MoneyText value={-500} />);
    expect(container.textContent).toBe('−Rs 500');
  });

  it('crosses the amount out when it has been replaced', () => {
    const { container } = render(<MoneyText value={400} strike />);
    expect(container.firstElementChild?.className).toContain('line-through');
  });

  it('never breaks an amount over two lines', () => {
    const { container } = render(<MoneyText value={2500} />);
    expect(container.firstElementChild?.className).toContain('whitespace-nowrap');
  });

  it('uses Barlow Condensed for the big sizes', () => {
    const { container } = render(<MoneyText value={1350} size="hero" />);
    expect(container.firstElementChild?.className).toContain('font-num');
  });

  it('uses Barlow Condensed for the number in Urdu big sizes', async () => {
    await i18n.changeLanguage('ur');
    const { container } = render(<MoneyText value={1350} size="big" />);
    expect(container.querySelector('.font-num')?.textContent).toBe('1,350');
  });
});
