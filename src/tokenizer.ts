//
// Tokenization of wikitext.
//

import { Token, TokenType } from './token';
import { Char, Wikitext } from './types';

///////////////////

// Constant for single quote characters.
// Avoids having to sprinkle the eslint disabling statement in multiple
// places.
const SingleQuote: Char = "'"; // eslint-disable-line quotes

// Counts the number of occurrences of a given substring in a given text.
function countSubstring(text: string, substr: string): number {
  if (substr.length === 0) {
    return 0;
  }
  let count = 0;
  let pos = text.indexOf(substr);
  while (pos !== -1) {
    ++count;
    pos = text.indexOf(substr, pos + substr.length);
  }
  return count;
}

///////////////////

const BoldMarker = "'''"; // eslint-disable-line quotes
const ItalixMarker = "''"; // eslint-disable-line quotes
const CommentBeginMarker = '<!--';
const CommentEndMarker = '-->';
const HorzDividerMarker = '----';
const TemplateBeginMarker = '{{';
const TemplateEndMarker = '}}';
const TableBeginMarker = '{|';
const TableEndMarker = '|}';

///////////////////

// Supported HTML tags.
const HtmlTags: string[] = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'br',
  'hr',
  'abbr',
  'b',
  'bdi',
  'bdo',
  'blockquote',
  'cite',
  'code',
  'data',
  'del',
  'dfn',
  'em',
  'i',
  'ins',
  'kdb',
  'mark',
  'pre',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'small',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
  'var',
  'wbr',
  'dl',
  'dt',
  'dd',
  'ol',
  'ul',
  'li',
  'div',
  'span',
  'table',
  'td',
  'tr',
  'th',
  'caption',
  'thead',
  'tfoot',
  'tbody',
  'center', // obsolete but supported
  'font', // obsolete but supported
  'rb', // obsolete but supported
  'strike', // obsolete but supported
  'tt' // obsolete but supported
];

// Wikitext exension tags.
const ExtensionTags: string[] = [
  'categorytree',
  'ce',
  'charinsert',
  'chem',
  'gallery',
  'graph',
  'hiero',
  'imagemap',
  'includeonly',
  'indicator',
  'inputbox',
  'mapframe',
  'maplink',
  'math',
  'math chem',
  'noinclude',
  'nowiki',
  'onlyinclude',
  'poem',
  'pre',
  'ref',
  'references',
  'score',
  'section',
  'source',
  'syntaxhighlight',
  'templatedata',
  'templatestyles',
  'timeline'
];

function normalizeTagName(name: string): string {
  return name.trim().toLowerCase();
}

function isHtmlTag(s: string): boolean {
  return HtmlTags.indexOf(normalizeTagName(s)) !== -1;
}

function isExtensionTag(s: string): boolean {
  return ExtensionTags.indexOf(normalizeTagName(s)) !== -1;
}

function isHtmlOrExtensionTag(s: string): boolean {
  return isHtmlTag(s) || isExtensionTag(s);
}

function isTagPrefix(tags: string[], s: string): boolean {
  const normalized = normalizeTagName(s);
  return tags.findIndex((tag: string) => tag.startsWith(normalized)) !== -1;
}

function isHtmlTagPrefix(s: string): boolean {
  return isTagPrefix(HtmlTags, s);
}

function isExtensionTagPrefix(s: string): boolean {
  return isTagPrefix(ExtensionTags, s);
}

function isHtmlOrExtensionTagPrefix(s: string): boolean {
  return isHtmlTagPrefix(s) || isExtensionTagPrefix(s);
}

///////////////////

// Common operations for each state of the tokenizer FSM.
interface State {
  // Processes the next character.
  // Returns the state to continue with.
  next(ch: Char): State;
  // Called when the the input text has ended while this state is active.
  terminate(): void;
}

// Base for all state classes. Contains common data.
class BaseState {
  private readonly _tokenizer: Tokenizer;
  protected value: string;

  constructor(tokenizer: Tokenizer, initialValue: string) {
    this._tokenizer = tokenizer;
    this.value = initialValue;
  }

  protected get tokenizer(): Tokenizer {
    return this._tokenizer;
  }
}

///////////////////

// Entered when a "'" is encountered. Generates quote-based tokens like
// 'bold', 'italic', etc.
class QuoteState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    if (ch !== SingleQuote) {
      this.storeTokens();
      this.tokenizer.backUpBy(1);
      return new TextState(this.tokenizer);
    }

    // Keep reading quotes.
    this.value += ch;
    return this;
  }

  public terminate(): void {
    this.storeTokens();
  }

  private storeTokens() {
    const BoldQuotes = 3;
    const ItalicQuotes = 2;
    const BoldItalicQuotes = BoldQuotes + ItalicQuotes;

    const numQuotes = this.value.length;
    // Quotes beyond five are just plain text before the style change. Also, for
    // four quotes one is plain text.
    let numPlainTextQuotes = 0;
    if (numQuotes > BoldItalicQuotes) {
      numPlainTextQuotes = numQuotes - BoldItalicQuotes;
    } else if (numQuotes === BoldQuotes + 1) {
      numPlainTextQuotes = 1;
    }
    const isBold = numQuotes >= BoldQuotes;
    const isItalic = numQuotes == ItalicQuotes || numQuotes >= BoldItalicQuotes;

    if (numPlainTextQuotes > 0) {
      const text = SingleQuote.repeat(numPlainTextQuotes);
      this.tokenizer.storeToken(TokenType.TEXT, text);
    }
    if (isBold) {
      this.tokenizer.storeToken(TokenType.BOLD, BoldMarker);
    }
    if (isItalic) {
      this.tokenizer.storeToken(TokenType.ITALIC, ItalixMarker);
    }
  }
}

///////////////////

// Active while a prefix of a HTML start tag is read.
class HtmlStartTagState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    const newTag = this.tagName() + ch;

    if (!isHtmlOrExtensionTagPrefix(newTag)) {
      this.storeTokens();
      this.tokenizer.backUpBy(1);
      return new TextState(this.tokenizer);
    }

    // Keep reading the tag.
    this.value += ch;
    return this;
  }

  public terminate(): void {
    this.storeTokens();
  }

  private storeTokens(): void {
    if (isHtmlOrExtensionTag(this.tagName())) {
      this.tokenizer.storeToken(TokenType.OPEN_START_TAG, '<');
      this.tokenizer.storeToken(
        TokenType.TAG_NAME,
        normalizeTagName(this.tagName())
      );
    } else {
      // Store a plain text token.
      this.tokenizer.storeToken(TokenType.TEXT, this.value);
    }
  }

  // Returns the tag name (without the leading '<').
  private tagName(): string {
    return this.value.substring(1);
  }
}

///////////////////

// Active while a prefix of a HTML end tag is read.
class HtmlEndTagState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    const newTag = this.tagName() + ch;

    if (!isHtmlOrExtensionTagPrefix(newTag)) {
      this.storeTokens();
      this.tokenizer.backUpBy(1);
      return new TextState(this.tokenizer);
    }

    // Keep reading the tag.
    this.value += ch;
    return this;
  }

  public terminate(): void {
    this.storeTokens();
  }

  private storeTokens(): void {
    if (isHtmlOrExtensionTag(this.tagName())) {
      this.tokenizer.storeToken(TokenType.OPEN_END_TAG, '</');
      this.tokenizer.storeToken(
        TokenType.TAG_NAME,
        normalizeTagName(this.tagName())
      );
    } else {
      // Store a plain text token.
      this.tokenizer.storeToken(TokenType.TEXT, this.value);
    }
  }

  // Returns the tag name (without the leading '</').
  private tagName(): string {
    return this.value.substring(2);
  }
}

///////////////////

// Active while a prefix of a comment start marker '<!--' is read.
class CommentStartState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    const newValue = this.value + ch;

    if (newValue === CommentBeginMarker) {
      this.value = newValue;
      this.storeTokens();
      return new TextState(this.tokenizer);
    } else if (!CommentBeginMarker.startsWith(newValue)) {
      // Not a comment. Switch to text.
      return new TextState(this.tokenizer, newValue);
    }

    // Keep reading the marker.
    this.value = newValue;
    return this;
  }

  public terminate(): void {
    // Store incomplete marker as text.
    const textState = new TextState(this.tokenizer, this.value);
    textState.terminate();
  }

  private storeTokens(): void {
    this.tokenizer.storeToken(TokenType.COMMENT_BEGIN, this.value);
  }
}

///////////////////

// Entered when a '<' is encountered. A pass-through state for tokens
// initiated with a '<'.
class OpenAngleBracketState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    switch (ch) {
      case '/': {
        this.value += ch;
        return new HtmlEndTagState(this.tokenizer, this.value);
      }
      case '!': {
        this.value += ch;
        return new CommentStartState(this.tokenizer, this.value);
      }
    }

    if (isHtmlOrExtensionTagPrefix(ch)) {
      this.value += ch;
      return new HtmlStartTagState(this.tokenizer, this.value);
    }

    // It's just plain text.
    this.storeTokens();
    this.tokenizer.backUpBy(1);
    return new TextState(this.tokenizer);
  }

  public terminate(): void {
    this.storeTokens();
  }

  private storeTokens() {
    this.tokenizer.storeToken(TokenType.TEXT, this.value);
  }
}

///////////////////

// Entered when a '>' is encountered. Generates a close-tag token.
class CloseAngleBracketState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    this.storeTokens();
    this.tokenizer.backUpBy(1);
    return new TextState(this.tokenizer);
  }

  public terminate(): void {
    this.storeTokens();
  }

  private storeTokens() {
    // Whether this is a closing tag or a plain '>' depends on the context.
    // Store a close-tag token and leave the context-based processing to the
    // parser.
    this.tokenizer.storeToken(TokenType.CLOSE_TAG, this.value);
  }
}

///////////////////

// Entered when a '----' is encountered. Will continue to read trailing
// dashes.
class HorzDividerState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    if (ch === '>') {
      // Ambiguous situation. See comment for COMMENT_END_OR_HORZ_DIV token.
      this.value += ch;
      this.tokenizer.storeToken(TokenType.COMMENT_END_OR_HORZ_DIV, this.value);
      return new TextState(this.tokenizer);
    } else if (ch !== '-') {
      this.tokenizer.storeToken(TokenType.HORZ_DIVIDER, this.value);
      return new TextState(this.tokenizer, ch);
    }

    this.value += ch;
    return this;
  }

  public terminate(): void {
    this.tokenizer.storeToken(TokenType.HORZ_DIVIDER, this.value);
  }
}

///////////////////

// Entered when a '-' is encountered. A pass-through state for tokens
// initiated with a '-'.
class DashState extends BaseState implements State {
  private readonly _atStartOfLine: boolean;

  constructor(
    tokenizer: Tokenizer,
    initialValue: string,
    atStartOfLine: boolean
  ) {
    super(tokenizer, initialValue);
    this._atStartOfLine = atStartOfLine;
  }

  public next(ch: Char): State {
    const newValue = this.value + ch;

    if (newValue.endsWith(CommentEndMarker)) {
      this.value = newValue;
      this.storeCommentEndTokens();
      return new TextState(this.tokenizer);
    } else if (this._atStartOfLine && newValue === HorzDividerMarker) {
      return new HorzDividerState(this.tokenizer, newValue);
    } else if (ch === '-') {
      this.value = newValue;
      return this;
    }

    // Not matching anything. Revert back to text.
    return new TextState(this.tokenizer, newValue);
  }

  public terminate(): void {
    // Store incomplete marker as text.
    const textState = new TextState(this.tokenizer, this.value);
    textState.terminate();
  }

  private storeCommentEndTokens(): void {
    const leadingDashes = this.value.substring(
      0,
      this.value.length - CommentEndMarker.length
    );
    if (leadingDashes) {
      this.tokenizer.storeToken(TokenType.TEXT, leadingDashes);
    }
    this.tokenizer.storeToken(TokenType.COMMENT_END, CommentEndMarker);
  }
}

///////////////////

// Entered when a '{' is encountered.
class BraceOpenState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    const newValue = this.value + ch;

    if (newValue === TableBeginMarker) {
      this.tokenizer.storeToken(TokenType.TABLE_BEGIN, newValue);
      return new TextState(this.tokenizer);
    } else if (newValue === TemplateBeginMarker) {
      this.tokenizer.storeToken(TokenType.TEMPLATE_BEGIN, newValue);
      return new TextState(this.tokenizer);
    }

    // Not matching anything. Revert back to text.
    return new TextState(this.tokenizer, newValue);
  }

  public terminate(): void {
    // Store incomplete marker as text.
    const textState = new TextState(this.tokenizer, this.value);
    textState.terminate();
  }
}

///////////////////

// Entered when a '}' is encountered.
class BraceCloseState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    const newValue = this.value + ch;

    if (newValue === TemplateEndMarker) {
      this.tokenizer.storeToken(TokenType.TEMPLATE_END, newValue);
      return new TextState(this.tokenizer);
    }

    // Not matching anything. Revert back to text.
    return new TextState(this.tokenizer, newValue);
  }

  public terminate(): void {
    // Store incomplete marker as text.
    const textState = new TextState(this.tokenizer, this.value);
    textState.terminate();
  }
}

///////////////////

// Entered when a '|' is encountered.
class PipeState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    const newValue = this.value + ch;

    if (newValue === TableEndMarker) {
      this.tokenizer.storeToken(TokenType.TABLE_END, newValue);
      return new TextState(this.tokenizer);
    }

    // Individual pipe.
    this.tokenizer.storeToken(TokenType.PIPE, '|');
    this.tokenizer.backUpBy(1);
    return new TextState(this.tokenizer);
  }

  public terminate(): void {
    this.tokenizer.storeToken(TokenType.PIPE, '|');
  }
}

///////////////////

// Collects plain text until a character for a different token is
// encountered. Default state of FSM.
class TextState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue?: string) {
    super(tokenizer, initialValue || '');
  }

  public next(ch: Char): State {
    const nextState: State = this.transition(ch);
    if (nextState !== undefined) {
      this.storeTokens();
      return nextState;
    }

    // Keep reading text.
    this.value += ch;
    return this;
  }

  public terminate(): void {
    this.storeTokens();
  }

  // Transitions to a new state based on a given character.
  // Returns the new state or 'undefined' for no transition.
  private transition(ch: Char): State {
    const isBOL = this.isBeginningOfLine();

    switch (ch) {
      case SingleQuote: {
        return new QuoteState(this.tokenizer, ch);
      }
      case '{': {
        return new BraceOpenState(this.tokenizer, ch);
      }
      case '}': {
        return new BraceCloseState(this.tokenizer, ch);
      }
      case '|': {
        return new PipeState(this.tokenizer, ch);
      }
      // case '[': {
      //   return new BracketState(this.tokenizer, ch);
      // }
      case '<': {
        return new OpenAngleBracketState(this.tokenizer, ch);
      }
      case '>': {
        return new CloseAngleBracketState(this.tokenizer, ch);
      }
      // case '~': {
      //   return new TildeState(this.tokenizer, ch);
      // }
      // case '=': {
      //   if (isBOL) {
      //     return new EqualSignState(this.tokenizer, ch);
      //   }
      // }
      // case '*': {
      //   if (isBOL) {
      //     return new StarState(this.tokenizer, ch);
      //   }
      // }
      // case '#': {
      //   if (isBOL) {
      //     return new HashState(this.tokenizer, ch);
      //   }
      // }
      // case ';': {
      //   if (isBOL) {
      //     return new SemicolonState(this.tokenizer, ch);
      //   }
      // }
      // case ':': {
      //   if (isBOL) {
      //     return new ColonState(this.tokenizer, ch);
      //   }
      // }
      case '-': {
        return new DashState(this.tokenizer, ch, isBOL);
      }
      // case '_': {
      //   return new UnderscoreState(this.tokenizer, ch);
      // }
      // case '&': {
      //   return new AmpersandState(this.tokenizer, ch);
      // }
      // case ' ': {
      //   if (isBOL) {
      //     return new SpaceState(this.tokenizer, ch);
      //   }
      // }
      // case '/': {
      //   return new SlashState(this.tokenizer, ch);
      // }
    }

    // No transition.
    return undefined;
  }

  private storeTokens(): void {
    if (this.value.length > 0) {
      this.tokenizer.storeToken(TokenType.TEXT, this.value);
    }
  }

  private isBeginningOfLine(): boolean {
    const lastCh = this.lastChar();
    return lastCh === '\n' || lastCh === '';
  }

  // Returns the last character of the read text (even across a previous tokens).
  // Returns '' when there is no last character.
  private lastChar(): Char {
    return this.tokenizer.lookBackBy(1);
  }
}

///////////////////

// FSM to tokenize wikitext.
// The tokenizer is context unaware and will create tokens for any special symbol,
// e.g. '|' or '!', no matter where it occurrs. The parser is responsible for
// processing these symbol tokens according to the context they appear in.
class Tokenizer {
  private readonly _text: Wikitext;
  private _pos = 0;
  private _lineNum = 1;
  private _tokens: Token[] = [];

  constructor(text: Wikitext) {
    this._text = text;
  }

  public tokenize(): Token[] {
    let currentState: State = new TextState(this);

    while (this._pos < this._text.length) {
      const ch = this._text.charAt(this._pos);
      this.skipAheadBy(1);
      currentState = currentState.next(ch);
    }

    // Give state chance to store its token.
    if (currentState !== undefined) {
      currentState.terminate();
    }

    return this._tokens;
  }

  // Stores a token.
  public storeToken(type: TokenType, value: string): void {
    const token = new Token(type, value, this._lineNum);
    if (!this.combineTextTokens(token)) {
      this._tokens.push(token);
    }
  }

  // Skips ahead by a given number of characters.
  public skipAheadBy(numChars: number): number {
    const prevPos = this._pos;
    this._pos += numChars;
    if (this._pos > this._text.length) {
      this._pos = this._text.length;
    }
    // Pass the consumed text to the line counting code. The char at the new current pos
    // hasn't been consumed yet, so it is excluded from the consumed text!
    this.incLineCount(this._text.substring(prevPos, this._pos));
    return this._pos;
  }

  // Backs up a given number of characters.
  public backUpBy(numChars: number): number {
    const prevPos = this._pos;
    this._pos -= numChars;
    if (this._pos < 0) {
      this._pos = 0;
    }
    // Pass the un-consumed text to the line counting code. The char at the new current pos
    // hasn't been consumed yet, so it need to be part of the un-consumed text!
    this.decLineCount(this._text.substring(this._pos, prevPos));
    return this._pos;
  }

  // Returns the next few characters. Will not change the read position of the
  // tokenizer.
  public lookAheadBy(numChars: number): string {
    const numCharsFollowing = this._text.length - this._pos;
    const endIdx = this._pos + Math.min(numChars, numCharsFollowing);
    return this._text.substring(this._pos, endIdx);
  }

  public lookBackBy(numChars: number): string {
    // The stored position is the position of the next character to be read.
    // So, we have to go back not only to the previous character (which is
    // the one currently processed by the code) but the one before that.
    if (this._pos <= 1) {
      return '';
    }
    const curCharPos = this._pos - 1;
    const numCharsAlreadyRead = curCharPos;
    const startIdx = curCharPos - Math.min(numChars, numCharsAlreadyRead);
    return this._text.substring(startIdx, curCharPos);
  }

  // Returns the current line number.
  public get lineNumber(): number {
    return this._lineNum;
  }

  // Increases the line count according to the given text that was consumed.
  private incLineCount(consumedText: string): void {
    this._lineNum += countSubstring(consumedText, '\n');
  }

  // Decreases the line count according to the given text that was un-consumed.
  private decLineCount(unconsumedText: string): void {
    this._lineNum -= countSubstring(unconsumedText, '\n');
  }

  // Attempts to combine a new token with the last token.
  private combineTextTokens(nextToken: Token): boolean {
    if (nextToken.type === TokenType.TEXT) {
      const lastToken: Token =
        this._tokens.length > 0
          ? this._tokens[this._tokens.length - 1]
          : undefined;

      if (lastToken !== undefined && lastToken.type === TokenType.TEXT) {
        this._tokens[this._tokens.length - 1] = new Token(
          TokenType.TEXT,
          lastToken.value + nextToken.value,
          lastToken.lineNumber
        );

        return true;
      }
    }

    return false;
  }
}

export function tokenize(text: Wikitext): Token[] {
  const tokenizer = new Tokenizer(text);
  return tokenizer.tokenize();
}
