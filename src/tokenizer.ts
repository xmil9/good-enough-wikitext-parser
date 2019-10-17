//
// Tokenization of wikitext.
//

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

export enum TokenType {
  TEXT = 'text',
  ITALIC = 'italic_toggle', // ''
  BOLD = 'bold_toggle', // '''
  NEW_PARAGRAPH = 'new_paragraph', // blank line
  OPEN_START_TAG = 'open_start_tag', // <
  OPEN_END_TAG = 'open_end_tag', // </
  CLOSE_TAG = 'close_tag', // >
  CLOSE_AND_END_TAG = 'close_and_end_tag', // />
  TAG_NAME = 'tag_name', // name of html or wikitext extension tag
  SIGNATURE = 'signature', // ~~~
  SIGNATURE_DATETIME = 'signature_date_time', // ~~~~
  DATE_TIME = 'date_time', // ~~~~~
  TEMPLATE_BEGIN = 'template_begin', // {{
  TEMPLATE_END = 'template_end', // }}
  COMMENT_BEGIN = 'comment_begin', // <!--
  COMMENT_END = 'comment_end', // -->
  HEADING_BEGIN = 'heading_begin', // = (up to 6)
  HEADING_END = 'heading_end', // =
  // *'s at start of line or after previous # (count determines indent)
  UNORDERED_LIST_ENTRY = 'unordered_list_entry',
  // #'s at start of line or atfer previous * (count determines indent)
  NUMBERED_LIST_ENTRY = 'numbered_list_entry',
  DEFINED_PHRASE = 'defined_phrase', // ; at start of line or after previous * or #
  DEFINITION = 'definition', // : after defined phrase (multiple definitions possible)
  INDENT = 'indent', // : at start of line (count determines indent)
  HORZ_DIVIDER = 'horz_divider', // ----
  LINK_BEGIN = 'link_begin', // [[
  LINK_END = 'link_end', // ]]
  EXT_LINK_BEGIN = 'ext_link_begin', // [
  EXT_LINK_END = 'ext_link_end', // ]
  PIPE = 'pipe', // |
  SPACE = 'space', // ' '
  COLON = 'colon', // links with colons are category links
  URL = 'url', // http(s)://
  EMAIL = 'email', // mailto:
  REDIRECT = 'redirect', // #REDIRECT
  FORCETOC = 'forcetoc', // __FORCETOC__
  TOC = 'toc', // __TOC__
  NOTOC = 'notoc', // __NOTOC__
  NBSP = 'nbsp', // &nbsp; - non-breaking space
  // &<char-ref>; with <char-ref> a multi-letter reference for a special char,
  // e.g. &quot; for "
  SPECIAL_CHAR = 'special_char',
  UNICODE_CHAR = 'unicode_char', // &#<code>
  TABLE_BEGIN = 'table_begin', // {|
  TABLE_END = 'table_end' // |}
}

export class Token {
  private readonly _type: TokenType;
  private readonly _value: string;
  private readonly _lineNum: number;

  constructor(type: TokenType, value: string, lineNum: number) {
    this._type = type;
    this._value = value;
    this._lineNum = lineNum;
  }

  public get type(): TokenType {
    return this._type;
  }

  public get value(): string {
    return this._value;
  }

  public get lineNumber(): number {
    return this._lineNum;
  }

  // Returns string indicating the location of the token in the source file.
  public location(): string {
    return `Line: ${this._lineNum}`;
  }
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

// Entered when a "'" is encountered. Generates quote-based tokens like
// 'bold', 'italic', etc.
class QuoteState implements State {
  private _tokenizer: Tokenizer;
  private _value: string;

  constructor(tokenizer: Tokenizer, initialValue: string) {
    this._tokenizer = tokenizer;
    this._value = initialValue;
  }

  public next(ch: Char): State {
    if (ch !== SingleQuote) {
      this.storeTokens();
      this._tokenizer.backUpBy(1);
      return new TextState(this._tokenizer);
    }

    // Keep reading quotes.
    this._value += ch;
    return this;
  }

  public terminate(): void {
    this.storeTokens();
  }

  private storeTokens() {
    const BoldQuotes = 3;
    const ItalicQuotes = 2;
    const BoldItalicQuotes = BoldQuotes + ItalicQuotes;

    const numQuotes = this._value.length;
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
      this._tokenizer.storeToken(TokenType.TEXT, text);
    }
    if (isBold) {
      // eslint-disable-next-line quotes
      this._tokenizer.storeToken(TokenType.BOLD, "'''");
    }
    if (isItalic) {
      // eslint-disable-next-line quotes
      this._tokenizer.storeToken(TokenType.ITALIC, "''");
    }
  }
}

// Active while a prefix of a HTML start tag is read.
class HtmlStartTagState implements State {
  private _tokenizer: Tokenizer;
  private _value: string;

  constructor(tokenizer: Tokenizer, initialValue: string) {
    this._tokenizer = tokenizer;
    this._value = initialValue;
  }

  public next(ch: Char): State {
    const newTag = this.tagName() + ch;

    if (!isHtmlOrExtensionTagPrefix(newTag)) {
      this.storeTokens();
      this._tokenizer.backUpBy(1);
      return new TextState(this._tokenizer);
    }

    // Keep reading the tag.
    this._value += ch;
    return this;
  }

  public terminate(): void {
    this.storeTokens();
  }

  private storeTokens(): void {
    if (isHtmlOrExtensionTag(this.tagName())) {
      this._tokenizer.storeToken(TokenType.OPEN_START_TAG, '<');
      this._tokenizer.storeToken(
        TokenType.TAG_NAME,
        normalizeTagName(this.tagName())
      );
    } else {
      // Store a plain text token.
      this._tokenizer.storeToken(TokenType.TEXT, this._value);
    }
  }

  // Returns the tag name (without the leading '<').
  private tagName(): string {
    return this._value.substr(1);
  }
}

// Entered when a '<' is encountered. A pass-through state for tokens
// initiated with a '<'.
class OpenAngleBracketState implements State {
  private _tokenizer: Tokenizer;
  private _value: string;

  constructor(tokenizer: Tokenizer, initialValue: string) {
    this._tokenizer = tokenizer;
    this._value = initialValue;
  }

  public next(ch: Char): State {
    // switch (ch) {
    //   case '/': {
    //     this._value += ch;
    //     return new HtmlEndTagState(this._tokenizer, this._value);
    //   }
    //   case '!': {
    //     this._value += ch;
    //     return new CommentStartState(this._tokenizer, this._value);
    //   }
    // }

    if (isHtmlOrExtensionTagPrefix(ch)) {
      this._value += ch;
      return new HtmlStartTagState(this._tokenizer, this._value);
    }

    // It's just plain text.
    this.storeTokens();
    this._tokenizer.backUpBy(1);
    return new TextState(this._tokenizer);
  }

  public terminate(): void {
    this.storeTokens();
  }

  private storeTokens() {
    this._tokenizer.storeToken(TokenType.TEXT, this._value);
  }
}

// Entered when a '>' is encountered. Generates a close-tag token.
class CloseAngleBracketState implements State {
  private _tokenizer: Tokenizer;
  private _value: string;

  constructor(tokenizer: Tokenizer, initialValue: string) {
    this._tokenizer = tokenizer;
    this._value = initialValue;
  }

  public next(ch: Char): State {
    this.storeTokens();
    this._tokenizer.backUpBy(1);
    return new TextState(this._tokenizer);
  }

  public terminate(): void {
    this.storeTokens();
  }

  private storeTokens() {
    // Whether this is a closing tag or a plain '>' depends on the context.
    // Store a close-tag token and leave the context-based processing to the
    // parser.
    this._tokenizer.storeToken(TokenType.CLOSE_TAG, this._value);
  }
}

// Collects plain text until a character for a different token is
// encountered. Default state of FSM.
class TextState implements State {
  private _tokenizer: Tokenizer;
  private _value: string;

  constructor(tokenizer: Tokenizer, initialValue?: string) {
    this._tokenizer = tokenizer;
    this._value = initialValue || '';
  }

  public next(ch: Char): State {
    const nextState: State = this.transition(ch);
    if (nextState !== undefined) {
      this.storeTokens();
      return nextState;
    }

    // Keep reading text.
    this._value += ch;
    return this;
  }

  public terminate(): void {
    this.storeTokens();
  }

  // Transitions to a new state based on a given character.
  // Returns the new state or 'undefined' for no transition.
  private transition(ch: Char): State {
    const isStartOfLine: boolean = this.lastChar() === '\n';

    switch (ch) {
      case SingleQuote: {
        return new QuoteState(this._tokenizer, ch);
      }
      // case '{': {
      //   return new BraceState(this._tokenizer, ch);
      // }
      // case '[': {
      //   return new BracketState(this._tokenizer, ch);
      // }
      case '<': {
        return new OpenAngleBracketState(this._tokenizer, ch);
      }
      case '>': {
        return new CloseAngleBracketState(this._tokenizer, ch);
      }
      // case '~': {
      //   return new TildeState(this._tokenizer, ch);
      // }
      // case '=': {
      //   if (isStartOfLine) {
      //     return new EqualSignState(this._tokenizer, ch);
      //   }
      // }
      // case '*': {
      //   if (isStartOfLine) {
      //     return new StarState(this._tokenizer, ch);
      //   }
      // }
      // case '#': {
      //   if (isStartOfLine) {
      //     return new HashState(this._tokenizer, ch);
      //   }
      // }
      // case ';': {
      //   if (isStartOfLine) {
      //     return new SemicolonState(this._tokenizer, ch);
      //   }
      // }
      // case ':': {
      //   if (isStartOfLine) {
      //     return new ColonState(this._tokenizer, ch);
      //   }
      // }
      // case '-': {
      //   if (isStartOfLine) {
      //     return new DashState(this._tokenizer, ch);
      //   }
      // }
      // case '_': {
      //   return new UnderscoreState(this._tokenizer, ch);
      // }
      // case '&': {
      //   return new AmpersandState(this._tokenizer, ch);
      // }
      // case ' ': {
      //   if (isStartOfLine) {
      //     return new SpaceState(this._tokenizer, ch);
      //   }
      // }
      // case '/': {
      //   return new SlashState(this._tokenizer, ch);
      // }
    }

    // No transition.
    return undefined;
  }

  private storeTokens(): void {
    if (this._value.length > 0) {
      this._tokenizer.storeToken(TokenType.TEXT, this._value);
    }
  }

  // Returns the last character of the collected value.
  private lastChar(): Char {
    return this._value.length > 0
      ? this._value[this._value.length - 1]
      : undefined;
  }
}

///////////////////

// FSM to tokenize wikitext.
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
  // lexer.
  public peekAheadBy(numChars: number): string {
    const numCharsLeft = this._text.length - this._pos;
    const endIdx = this._pos + Math.min(numChars, numCharsLeft);
    return this._text.substring(this._pos, endIdx);
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
