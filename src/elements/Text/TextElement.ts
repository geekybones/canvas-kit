import type { Text } from 'pixi.js';

import { BaseTextElement } from '@/elements/Text/BaseTextElement';
import { resolveVectorFontUrl } from '@/elements/Text/textEffectMount';
import {
  createRasterTextNode,
  createRasterTextStyle,
  measureRasterTextLayout,
} from '@/elements/Text/textRaster';
import type { TextOptions } from '@/elements/Text/types';
import type { VectorTextRenderOptions } from '@/elements/Text/Vector';
import '@/elements/Text/Vector/effects';

export class TextElement extends BaseTextElement<TextOptions> {
  async init(): Promise<void> {
    await this.initTextElement();
  }

  async update(next: Partial<TextOptions>): Promise<void> {
    await this.dispatchUpdate(next);
  }

  protected renderStandardContent(): void {
    this.clearContent();

    const fontSize = this.getResolvedFontSize();

    const textNode = createRasterTextNode({
      ...this.options,
      fontSize,
      lineHeight:
        this.options.lineHeight !== undefined ? this.options.lineHeight * fontSize : undefined,
    }) as Text;

    this.setStandardTextNode(textNode);
  }

  protected getVectorRenderOptions(): VectorTextRenderOptions | null {
    const {
      text,
      fontSize = 24,
      fill = 0x000000,
      stroke,
      strokeWidth,
      strokeAlpha,
      strokeAlign,
      fontWeight,
      fontStyle,
      underline,
      strikethrough,
      letterSpacing = 0,
      fontUrl,
      align = 'left',
      lineHeight,
    } = this.options;
    const resolvedFontUrl = resolveVectorFontUrl('TextElement', fontUrl);

    return {
      text,
      fontUrl: resolvedFontUrl,
      fontSize,
      fill,
      stroke,
      strokeWidth,
      strokeAlpha,
      strokeAlign,
      fontWeight,
      fontStyle,
      underline,
      strikethrough,
      letterSpacing,
      align,
      ...(lineHeight !== undefined ? { lineHeight: lineHeight * fontSize } : {}),
    };
  }

  protected override getDecorationSegments(): Array<{
    x: number;
    width: number;
    underlineY: number;
    strikethroughY: number;
  }> {
    const fontSize = this.getResolvedFontSize();

    if (!this.options.text.includes('\n')) {
      const bounds = this.getContentBounds();

      if (bounds.width <= 0) {
        return [];
      }

      const leadingInset = Math.max(2, fontSize * 0.08);

      return [
        {
          x: bounds.x + leadingInset,
          width: Math.max(0, bounds.width - leadingInset),
          underlineY: bounds.y + bounds.height - Math.max(fontSize * 0.1, 0.5),
          strikethroughY: bounds.y + bounds.height * 0.5,
        },
      ];
    }

    const style = createRasterTextStyle({
      ...this.options,
      fontSize,
      lineHeight:
        this.options.lineHeight !== undefined ? this.options.lineHeight * fontSize : undefined,
    });
    const metrics = measureRasterTextLayout({
      ...this.options,
      fontSize,
      lineHeight:
        this.options.lineHeight !== undefined ? this.options.lineHeight * fontSize : undefined,
    });
    const layoutWidth = metrics.maxLineWidth;
    const bounds = this.getContentBounds();
    const ascent = metrics.fontProperties.ascent;
    const descent = metrics.fontProperties.descent;
    const leadingInset = Math.max(2, fontSize * 0.08);

    return metrics.lines.map((_line, index) => {
      const lineWidth = metrics.lineWidths[index] ?? 0;
      const offsetX = this.getAlignedOffsetX(style.align, layoutWidth, lineWidth);
      const lineTop = bounds.y + index * metrics.lineHeight;
      const extraLeading = Math.max(0, metrics.lineHeight - (ascent + descent));
      const contentTop = lineTop + extraLeading / 2;
      const contentHeight = ascent + descent;
      const baselineY = contentTop + ascent;

      return {
        x: bounds.x + offsetX + leadingInset,
        width: Math.max(0, lineWidth - leadingInset),
        underlineY: baselineY + Math.max(descent * 0.55, fontSize * 0.08),
        strikethroughY: contentTop + contentHeight * 0.54,
      };
    });
  }

  private getAlignedOffsetX(
    align: 'left' | 'center' | 'right' | 'justify',
    layoutWidth: number,
    lineWidth: number,
  ): number {
    if (align === 'center') {
      return (layoutWidth - lineWidth) / 2;
    }

    if (align === 'right') {
      return layoutWidth - lineWidth;
    }

    return 0;
  }
}
