//
// Tokenization of wikitext.
//

import { Token, TokenType } from './token';
import { Char, Wikitext } from './types';

///////////////////

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

const EOLChar = '\n';
const SpaceChar = ' ';
const SingleQuoteChar = "'"; // eslint-disable-line quotes
const BraceOpenChar = '{';
const BraceCloseChar = '}';
const AngleOpenChar = '<';
const AngleCloseChar = '>';
const BracketOpenChar = '[';
const BracketCloseChar = ']';
const PipeChar = '|';
const DashChar = '-';
const HashChar = '#';
const SlashChar = '/';
const ExclamationChar = '!';
const ColonChar = ':';
const PlusChar = '+';

const BoldMarker = "'''"; // eslint-disable-line quotes
const ItalicMarker = "''"; // eslint-disable-line quotes
const EndTagBeginMarker = '</';
const CommentBeginMarker = '<!--';
const CommentEndMarker = '-->';
const HorzDividerMarker = '----';
const TemplateBeginMarker = '{{';
const TemplateEndMarker = '}}';
const TableBeginMarker = '{|';
const TableEndMarker = '|}';

///////////////////

// Supported HTML tags.
// Source: https://en.wikipedia.org/wiki/Help:HTML_in_wikitext
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
// Source: https://en.wikipedia.org/wiki/Help:HTML_in_wikitext
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

// Source: https://en.wikipedia.org/wiki/Help:Wikitext#External_links
const UriSchemes: string[] = [
  'http://',
  'https://',
  'irc://',
  'ircs://',
  'ftp://',
  'news://',
  'mailto://',
  'gopher://'
];

function normalizeUriScheme(s: string): string {
  return s.toLowerCase();
}

function isUriScheme(s: string): boolean {
  return UriSchemes.indexOf(normalizeUriScheme(s)) !== -1;
}

function isUriSchemePrefix(s: string): boolean {
  const normalized = normalizeUriScheme(s);
  return (
    UriSchemes.findIndex((scheme: string) => scheme.startsWith(normalized)) !==
    -1
  );
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
    switch (ch) {
      case SingleQuoteChar: {
        // Keep reading quotes.
        this.value += ch;
        return this;
      }
      default: {
        this.storeTokens();
        this.tokenizer.backUpBy(1);
        return new TextState(this.tokenizer);
      }
    }
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
      const text = SingleQuoteChar.repeat(numPlainTextQuotes);
      this.tokenizer.storeToken(TokenType.TEXT, text);
    }
    if (isBold) {
      this.tokenizer.storeToken(TokenType.BOLD, BoldMarker);
    }
    if (isItalic) {
      this.tokenizer.storeToken(TokenType.ITALIC, ItalicMarker);
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
      this.tokenizer.storeToken(TokenType.OPEN_START_TAG, AngleOpenChar);
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
      this.tokenizer.storeToken(TokenType.OPEN_END_TAG, EndTagBeginMarker);
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
      this.tokenizer.backUpBy(1);
      return new TextState(this.tokenizer, this.value);
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
class AngleBracketOpenState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    switch (ch) {
      case SlashChar: {
        this.value += ch;
        return new HtmlEndTagState(this.tokenizer, this.value);
      }
      case ExclamationChar: {
        this.value += ch;
        return new CommentStartState(this.tokenizer, this.value);
      }
      default: {
        if (isHtmlOrExtensionTagPrefix(ch)) {
          this.value += ch;
          return new HtmlStartTagState(this.tokenizer, this.value);
        } else {
          // It's just plain text.
          this.storeTokens();
          this.tokenizer.backUpBy(1);
          return new TextState(this.tokenizer);
        }
      }
    }
  }

  public terminate(): void {
    this.storeTokens();
  }

  private storeTokens() {
    this.tokenizer.storeToken(TokenType.TEXT, this.value);
  }
}

///////////////////

// Entered when a ' ' is encountered.
class SpaceState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    switch (ch) {
      case SpaceChar: {
        // Collect spaces.
        this.value += ch;
        return this;
      }
      default: {
        // Store the collected spaces.
        this.tokenizer.storeToken(TokenType.SPACES, this.value);
        this.tokenizer.backUpBy(1);
        return new TextState(this.tokenizer);
      }
    }
  }

  public terminate(): void {
    this.tokenizer.storeToken(TokenType.SPACES, this.value);
  }
}

///////////////////

// Entered when a '-' is encountered.
class DashState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    switch (ch) {
      case AngleCloseChar: {
        this.value += ch;
        this.storeClosingAngle();
        return new TextState(this.tokenizer);
      }
      case DashChar: {
        this.value += ch;
        return this;
      }
      default: {
        // Store the collected dashes.
        this.storeDashes();
        this.tokenizer.backUpBy(1);
        return new TextState(this.tokenizer);
      }
    }
  }

  public terminate(): void {
    this.storeDashes();
  }

  private storeClosingAngle(): void {
    if (this.value.endsWith(CommentEndMarker)) {
      const leadingDashes = this.value.substring(
        0,
        this.value.length - CommentEndMarker.length
      );
      if (leadingDashes) {
        this.tokenizer.storeToken(TokenType.DASHES, leadingDashes);
      }
      this.tokenizer.storeToken(TokenType.COMMENT_END, CommentEndMarker);
    } else {
      this.tokenizer.storeToken(
        TokenType.DASHES,
        this.value.substring(0, this.value.length - 1)
      );
      this.tokenizer.storeToken(TokenType.CLOSE_TAG, AngleCloseChar);
    }
  }

  private storeDashes(): void {
    this.tokenizer.storeToken(TokenType.DASHES, this.value);
  }
}

///////////////////

// Entered when a '#' is encountered.
class HashState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    switch (ch) {
      case HashChar: {
        // Collect hashes.
        this.value += ch;
        return this;
      }
      default: {
        // Store the collected hashes.
        this.tokenizer.storeToken(TokenType.HASHES, this.value);
        this.tokenizer.backUpBy(1);
        return new TextState(this.tokenizer);
      }
    }
  }

  public terminate(): void {
    this.tokenizer.storeToken(TokenType.HASHES, this.value);
  }
}

///////////////////

// Entered when a '{' is encountered.
class BraceOpenState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    switch (ch) {
      case PipeChar: {
        this.tokenizer.storeToken(TokenType.TABLE_BEGIN, this.value + ch);
        return new TextState(this.tokenizer);
      }
      case BraceOpenChar: {
        this.tokenizer.storeToken(TokenType.TEMPLATE_BEGIN, this.value + ch);
        return new TextState(this.tokenizer);
      }
      default: {
        // Not matching anything. Revert back to text.
        this.tokenizer.backUpBy(1);
        return new TextState(this.tokenizer, this.value);
      }
    }
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
    switch (ch) {
      case BraceCloseChar: {
        this.tokenizer.storeToken(TokenType.TEMPLATE_END, this.value + ch);
        return new TextState(this.tokenizer);
      }
      default: {
        // Not matching anything. Revert back to text.
        this.tokenizer.backUpBy(1);
        return new TextState(this.tokenizer, this.value);
      }
    }
  }

  public terminate(): void {
    // Store incomplete marker as text.
    const textState = new TextState(this.tokenizer, this.value);
    textState.terminate();
  }
}

///////////////////

// Entered when a '[' is encountered.
class BracketOpenState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    switch (ch) {
      case BracketOpenChar: {
        this.tokenizer.storeToken(TokenType.LINK_BEGIN, this.value + ch);
        return new TextState(this.tokenizer);
      }
      default: {
        this.tokenizer.storeToken(TokenType.OPEN_BRACKET, this.value);
        this.tokenizer.backUpBy(1);
        return new TextState(this.tokenizer);
      }
    }
  }

  public terminate(): void {
    this.tokenizer.storeToken(TokenType.OPEN_BRACKET, this.value);
  }
}

///////////////////

// Entered when a ']' is encountered.
class BracketCloseState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    switch (ch) {
      case BracketCloseChar: {
        this.tokenizer.storeToken(TokenType.LINK_END, this.value + ch);
        return new TextState(this.tokenizer);
      }
      default: {
        this.tokenizer.storeToken(TokenType.CLOSE_BRACKET, this.value);
        this.tokenizer.backUpBy(1);
        return new TextState(this.tokenizer);
      }
    }
  }

  public terminate(): void {
    this.tokenizer.storeToken(TokenType.CLOSE_BRACKET, this.value);
  }
}

///////////////////

// Entered when a '|' is encountered.
class PipeState extends BaseState implements State {
  constructor(tokenizer: Tokenizer, initialValue: string) {
    super(tokenizer, initialValue);
  }

  public next(ch: Char): State {
    switch (ch) {
      case BraceCloseChar: {
        this.tokenizer.storeToken(TokenType.TABLE_END, this.value + ch);
        return new TextState(this.tokenizer);
      }
      case PlusChar: {
        this.tokenizer.storeToken(TokenType.TABLE_CAPTION, this.value + ch);
        return new TextState(this.tokenizer);
      }
      case DashChar: {
        this.tokenizer.storeToken(TokenType.TABLE_ROW, this.value + ch);
        return new TextState(this.tokenizer);
      }
      default: {
        // Individual pipe.
        this.tokenizer.storeToken(TokenType.PIPE, PipeChar);
        this.tokenizer.backUpBy(1);
        return new TextState(this.tokenizer);
      }
    }
  }

  public terminate(): void {
    this.tokenizer.storeToken(TokenType.PIPE, PipeChar);
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
    // Transition based on given character.
    const nextState: State = this.charTransition(ch);
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
  private charTransition(ch: Char): State {
    switch (ch) {
      case BraceOpenChar: {
        return new BraceOpenState(this.tokenizer, ch);
      }
      case BraceCloseChar: {
        return new BraceCloseState(this.tokenizer, ch);
      }
      case BracketOpenChar: {
        return new BracketOpenState(this.tokenizer, ch);
      }
      case BracketCloseChar: {
        return new BracketCloseState(this.tokenizer, ch);
      }
      case AngleOpenChar: {
        return new AngleBracketOpenState(this.tokenizer, ch);
      }
      case AngleCloseChar: {
        // Whether this is a closing tag or a plain '>' depends on the context.
        // Store a close-tag token and leave the context-based processing to the
        // parser.
        return this.processSingleCharacterToken(TokenType.CLOSE_TAG, ch);
      }
      case SpaceChar: {
        return new SpaceState(this.tokenizer, ch);
      }
      case SingleQuoteChar: {
        return new QuoteState(this.tokenizer, ch);
      }
      case PipeChar: {
        return new PipeState(this.tokenizer, ch);
      }
      case ExclamationChar: {
        return this.processSingleCharacterToken(TokenType.EXCLAMATION_MARK, ch);
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
      case ColonChar: {
        return this.processSingleCharacterToken(TokenType.COLON, ch);
      }
      case DashChar: {
        return new DashState(this.tokenizer, ch);
      }
      case HashChar: {
        return new HashState(this.tokenizer, ch);
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
      // case SlashChar: {
      //   return new SlashState(this.tokenizer, ch);
      // }
      case EOLChar: {
        return this.processSingleCharacterToken(TokenType.EOL, ch);
      }
      default: {
        // No transition.
        return undefined;
      }
    }
  }

  private processSingleCharacterToken(type: TokenType, ch: Char): State {
    // Store the collected text token.
    this.storeTokens();
    this.value = '';
    // Store the single character token.
    this.tokenizer.storeToken(type, ch);
    // Continue with a new text token.
    return new TextState(this.tokenizer);
  }

  private storeTokens(): void {
    if (this.value.length > 0) {
      this.tokenizer.storeToken(TokenType.TEXT, this.value);
    }
  }

  private isBeginningOfLine(): boolean {
    const lastCh = this.lastChar();
    return lastCh === EOLChar || lastCh === '';
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
    this._lineNum += countSubstring(consumedText, EOLChar);
  }

  // Decreases the line count according to the given text that was un-consumed.
  private decLineCount(unconsumedText: string): void {
    this._lineNum -= countSubstring(unconsumedText, EOLChar);
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
