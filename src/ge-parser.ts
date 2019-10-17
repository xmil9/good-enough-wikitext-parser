import { tokenize, Token } from './tokenizer';
import { Wikitext } from './types';

export class Ast {
  private dummy: string;
}

export function parse(text: Wikitext): Ast {
  const tokens: Token[] = tokenize(text);
  return new Ast();
}
