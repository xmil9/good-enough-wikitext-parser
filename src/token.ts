//
// Tokens generated by the tokenizer.
//

///////////////////

export enum TokenType {
  TEXT = 'text',
  EOL = 'eol', // '\n'
  ITALIC = 'italic-toggle', // ''
  BOLD = 'bold-toggle', // '''
  NEW_PARAGRAPH = 'new-paragraph', // blank line
  OPEN_START_TAG = 'open-start-tag', // <
  OPEN_END_TAG = 'open-end-tag', // </
  CLOSE_ANGLE = 'close-angle', // >
  END_TAG = 'end-tag', // />
  TAG_NAME = 'tag-name', // name of html or wikitext extension tag
  SIGNATURE = 'signature', // ~~~
  SIGNATURE_DATETIME = 'signature-date-time', // ~~~~
  DATE_TIME = 'date-time', // ~~~~~
  TEMPLATE_BEGIN = 'template-begin', // {{
  TEMPLATE_END = 'template-end', // }}
  COMMENT_BEGIN = 'comment-begin', // <!--
  COMMENT_END = 'comment-end', // -->
  HEADING_BEGIN = 'heading-begin', // = (up to 6)
  HEADING_END = 'heading-end', // =
  // *'s at start of line or after previous # (count determines indent)
  UNORDERED_LIST_ENTRY = 'unordered-list-entry',
  // #'s at start of line or atfer previous * (count determines indent)
  NUMBERED_LIST_ENTRY = 'numbered-list-entry',
  DEFINED_PHRASE = 'defined-phrase', // ; at start of line or after previous * or #
  DEFINITION = 'definition', // : after defined phrase (multiple definitions possible)
  INDENT = 'indent', // : at start of line (count determines indent)
  LINK_BEGIN = 'link-begin', // [[
  LINK_END = 'link-end', // ]]
  OPEN_BRACKET = 'open-bracket', // [
  CLOSE_BRACKET = 'close-bracket', // ]
  PIPE = 'pipe', // |
  EXCLAMATION_MARK = 'exclamation-mark', // !
  SPACES = 'spaces', // one or more ' '
  COLONS = 'colons', // one or more ':'
  SEMICOLONS = 'semicolons', // one or more ';'
  DASHES = 'dashes', // one or more '-'
  HASHES = 'hashes', // one or more '#'
  ASTERISKS = 'asterisks', // one or more '*'
  EMAIL = 'email', // mailto:
  REDIRECT = 'redirect', // #REDIRECT
  FORCETOC = 'forcetoc', // __FORCETOC__
  TOC = 'toc', // __TOC__
  NOTOC = 'notoc', // __NOTOC__
  NBSP = 'nbsp', // &nbsp; - non-breaking space
  // &<char-ref>; with <char-ref> a multi-letter reference for a special char,
  // e.g. &quot; for "
  SPECIAL_CHAR = 'special-char',
  UNICODE_CHAR = 'unicode-char', // &#<code>
  TABLE_BEGIN = 'table-begin', // {|
  TABLE_END = 'table-end', // |}
  TABLE_CAPTION = 'table-caption', // |+
  TABLE_ROW = 'table-row' // |-
}

export class Token {
  private readonly _type: TokenType;
  private readonly _value: string;
  private readonly _lineNum?: number;

  constructor(type: TokenType, value: string, lineNum?: number) {
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
