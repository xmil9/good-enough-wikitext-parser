//
// Tests for Tokenizer.
//

import { Token, TokenType } from './token';
import { tokenize } from './tokenizer';

/* eslint-disable quotes */

///////////////////

// Expected values for a token.
interface ExpectedToken {
  type: TokenType;
  value?: string;
}

// Values that tokens of various token types are expected to hold.
const DefaultTokenValues: Map<TokenType, string> = new Map([
  [TokenType.EOL, '\n'],
  [TokenType.BOLD, "'''"],
  [TokenType.ITALIC, "''"],
  [TokenType.OPEN_START_TAG, '<'],
  [TokenType.OPEN_END_TAG, '</'],
  [TokenType.CLOSE_TAG, '>'],
  [TokenType.COMMENT_BEGIN, '<!--'],
  [TokenType.COMMENT_END, '-->'],
  [TokenType.TEMPLATE_BEGIN, '{{'],
  [TokenType.TEMPLATE_END, '}}'],
  [TokenType.PIPE, '|'],
  [TokenType.COLON, ':'],
  [TokenType.TABLE_BEGIN, '{|'],
  [TokenType.TABLE_END, '|}'],
  [TokenType.TABLE_ROW, '|-'],
  [TokenType.TABLE_CAPTION, '|+'],
  [TokenType.EXCLAMATION_MARK, '!']
]);

// Makes an (e)xpected (t)oken.
function et(type: TokenType, value?: string): ExpectedToken {
  return {
    type: type,
    value: value === undefined ? DefaultTokenValues.get(type) : value
  };
}

// Verifies that a given token matches expected values.
function verifyToken(token: Token, expected: ExpectedToken): boolean {
  return (
    token !== undefined &&
    token.type === expected.type &&
    (expected.value === undefined || token.value === expected.value)
  );
}

// Verifies that a given sequence of tokens matches expected values.
function verifyTokenSequence(
  tokens: Token[],
  expected: ExpectedToken[]
): boolean {
  if (tokens.length !== expected.length) {
    return false;
  }
  for (let i = 0; i < tokens.length; ++i) {
    if (!verifyToken(tokens[i], expected[i])) {
      return false;
    }
  }
  return true;
}

// Helper class to iterate over a token array without using indices.
class TokenIterator {
  private _tokens: Token[];
  private _pos = 0;

  constructor(tokens: Token[]) {
    this._tokens = tokens;
  }

  public next(): Token {
    if (this._pos >= this._tokens.length) {
      return undefined;
    }
    return this._tokens[this._pos++];
  }

  public get length(): number {
    return this._tokens.length;
  }
}

///////////////////

describe('text', () => {
  test('plain text', () => {
    const tokens = tokenize('plain text');
    expect(
      verifyTokenSequence(tokens, [et(TokenType.TEXT, 'plain text')])
    ).toBeTruthy();
  });

  test('text with newline', () => {
    const tokens = tokenize('before\nafter');
    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEXT, 'before'),
        et(TokenType.EOL),
        et(TokenType.TEXT, 'after')
      ])
    ).toBeTruthy();
  });
});

///////////////////

describe('quotes', () => {
  test('bold text', () => {
    const tokens = tokenize("'''bold'''");

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.BOLD),
        et(TokenType.TEXT, 'bold'),
        et(TokenType.BOLD)
      ])
    ).toBeTruthy();
  });

  test('embedded bold text', () => {
    const tokens = tokenize("before'''bold'''after");

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEXT, 'before'),
        et(TokenType.BOLD),
        et(TokenType.TEXT, 'bold'),
        et(TokenType.BOLD),
        et(TokenType.TEXT, 'after')
      ])
    ).toBeTruthy();
  });

  test('italic text', () => {
    const tokens = tokenize("''italic''");

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.ITALIC),
        et(TokenType.TEXT, 'italic'),
        et(TokenType.ITALIC)
      ])
    ).toBeTruthy();
  });

  test('embedded italic text', () => {
    const tokens = tokenize("before''italic''after");

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEXT, 'before'),
        et(TokenType.ITALIC),
        et(TokenType.TEXT, 'italic'),
        et(TokenType.ITALIC),
        et(TokenType.TEXT, 'after')
      ])
    ).toBeTruthy();
  });

  test('four quotes', () => {
    const tokens = tokenize("''''four''''");

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEXT, "'"),
        et(TokenType.BOLD),
        et(TokenType.TEXT, "four'"),
        et(TokenType.BOLD)
      ])
    ).toBeTruthy();
  });

  test('four quotes embedded', () => {
    const tokens = tokenize("before''''four''''after");

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEXT, "before'"),
        et(TokenType.BOLD),
        et(TokenType.TEXT, "four'"),
        et(TokenType.BOLD),
        et(TokenType.TEXT, 'after')
      ])
    ).toBeTruthy();
  });

  test('five quotes', () => {
    const tokens = tokenize("'''''five'''''");

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.BOLD),
        et(TokenType.ITALIC),
        et(TokenType.TEXT, 'five'),
        et(TokenType.BOLD),
        et(TokenType.ITALIC)
      ])
    ).toBeTruthy();
  });

  test('five quotes embedded', () => {
    const tokens = tokenize("before'''''five'''''after");

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEXT, 'before'),
        et(TokenType.BOLD),
        et(TokenType.ITALIC),
        et(TokenType.TEXT, 'five'),
        et(TokenType.BOLD),
        et(TokenType.ITALIC),
        et(TokenType.TEXT, 'after')
      ])
    ).toBeTruthy();
  });

  test('more than five quotes', () => {
    const tokens = tokenize("'''''''''nine'''''''''");

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEXT, "''''"),
        et(TokenType.BOLD),
        et(TokenType.ITALIC),
        et(TokenType.TEXT, "nine''''"),
        et(TokenType.BOLD),
        et(TokenType.ITALIC)
      ])
    ).toBeTruthy();
  });

  test('more than five quotes embedded', () => {
    const tokens = tokenize("before'''''''''nine'''''''''after");

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEXT, "before''''"),
        et(TokenType.BOLD),
        et(TokenType.ITALIC),
        et(TokenType.TEXT, "nine''''"),
        et(TokenType.BOLD),
        et(TokenType.ITALIC),
        et(TokenType.TEXT, 'after')
      ])
    ).toBeTruthy();
  });
});

///////////////////

describe('Html tags', () => {
  test('HTML start tag', () => {
    const tokens = tokenize('<code>');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.OPEN_START_TAG),
        et(TokenType.TAG_NAME, 'code'),
        et(TokenType.CLOSE_TAG)
      ])
    ).toBeTruthy();
  });

  test('extension start tag', () => {
    const tokens = tokenize('<inputbox>');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.OPEN_START_TAG),
        et(TokenType.TAG_NAME, 'inputbox'),
        et(TokenType.CLOSE_TAG)
      ])
    ).toBeTruthy();
  });

  test('single letter start tag', () => {
    const tokens = tokenize('<p>');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.OPEN_START_TAG),
        et(TokenType.TAG_NAME, 'p'),
        et(TokenType.CLOSE_TAG)
      ])
    ).toBeTruthy();
  });

  test('start tag with space', () => {
    const tokens = tokenize('<math chem>');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.OPEN_START_TAG),
        et(TokenType.TAG_NAME, 'math chem'),
        et(TokenType.CLOSE_TAG)
      ])
    ).toBeTruthy();
  });

  test('capitalized start tag', () => {
    const tokens = tokenize('<DIV>');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.OPEN_START_TAG),
        et(TokenType.TAG_NAME, 'div'),
        et(TokenType.CLOSE_TAG)
      ])
    ).toBeTruthy();
  });

  test('start tag with leading and trainling spaces', () => {
    const tokens = tokenize('<  table  >');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.OPEN_START_TAG),
        et(TokenType.TAG_NAME, 'table'),
        et(TokenType.CLOSE_TAG)
      ])
    ).toBeTruthy();
  });

  test('start tag embedded in text', () => {
    const tokens = tokenize('before<h2>after');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEXT, 'before'),
        et(TokenType.OPEN_START_TAG),
        et(TokenType.TAG_NAME, 'h2'),
        et(TokenType.CLOSE_TAG),
        et(TokenType.TEXT, 'after')
      ])
    ).toBeTruthy();
  });

  test('invalid start tag', () => {
    const tokens = tokenize('<invalid>');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEXT, '<invalid'),
        et(TokenType.CLOSE_TAG)
      ])
    ).toBeTruthy();
  });

  test('HTML end tag', () => {
    const tokens = tokenize('</code>');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.OPEN_END_TAG),
        et(TokenType.TAG_NAME, 'code'),
        et(TokenType.CLOSE_TAG)
      ])
    ).toBeTruthy();
  });

  test('extension end tag', () => {
    const tokens = tokenize('</inputbox>');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.OPEN_END_TAG),
        et(TokenType.TAG_NAME, 'inputbox'),
        et(TokenType.CLOSE_TAG)
      ])
    ).toBeTruthy();
  });

  test('single letter end tag', () => {
    const tokens = tokenize('</p>');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.OPEN_END_TAG),
        et(TokenType.TAG_NAME, 'p'),
        et(TokenType.CLOSE_TAG)
      ])
    ).toBeTruthy();
  });

  test('start end with space', () => {
    const tokens = tokenize('</math chem>');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.OPEN_END_TAG),
        et(TokenType.TAG_NAME, 'math chem'),
        et(TokenType.CLOSE_TAG)
      ])
    ).toBeTruthy();
  });

  test('capitalized end tag', () => {
    const tokens = tokenize('</DIV>');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.OPEN_END_TAG),
        et(TokenType.TAG_NAME, 'div'),
        et(TokenType.CLOSE_TAG)
      ])
    ).toBeTruthy();
  });

  test('end tag with leading and trainling spaces', () => {
    const tokens = tokenize('</  table  >');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.OPEN_END_TAG),
        et(TokenType.TAG_NAME, 'table'),
        et(TokenType.CLOSE_TAG)
      ])
    ).toBeTruthy();
  });

  test('end tag embedded in text', () => {
    const tokens = tokenize('before</h2>after');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEXT, 'before'),
        et(TokenType.OPEN_END_TAG),
        et(TokenType.TAG_NAME, 'h2'),
        et(TokenType.CLOSE_TAG),
        et(TokenType.TEXT, 'after')
      ])
    ).toBeTruthy();
  });

  test('invalid end tag', () => {
    const tokens = tokenize('</invalid>');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEXT, '</invalid'),
        et(TokenType.CLOSE_TAG)
      ])
    ).toBeTruthy();
  });
});

///////////////////

describe('comments', () => {
  test('basic comment', () => {
    const tokens = tokenize('<!-- comment -->');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.COMMENT_BEGIN),
        et(TokenType.TEXT, ' comment '),
        et(TokenType.COMMENT_END)
      ])
    ).toBeTruthy();
  });

  test('single space comment', () => {
    const tokens = tokenize('<!-- -->');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.COMMENT_BEGIN),
        et(TokenType.TEXT, ' '),
        et(TokenType.COMMENT_END)
      ])
    ).toBeTruthy();
  });

  test('empty comment', () => {
    const tokens = tokenize('<!---->');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.COMMENT_BEGIN),
        et(TokenType.COMMENT_END)
      ])
    ).toBeTruthy();
  });

  test('multi line comment', () => {
    const tokens = tokenize('<!-- line one\nline two -->');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.COMMENT_BEGIN),
        et(TokenType.TEXT, ' line one'),
        et(TokenType.EOL),
        et(TokenType.TEXT, 'line two '),
        et(TokenType.COMMENT_END)
      ])
    ).toBeTruthy();
  });

  test('comment where start token has extra dashes (less than 4)', () => {
    const tokens = tokenize('<!----- comment -->');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.COMMENT_BEGIN),
        et(TokenType.DASHES, '---'),
        et(TokenType.TEXT, ' comment '),
        et(TokenType.COMMENT_END)
      ])
    ).toBeTruthy();
  });

  test('comment where start token has extra dashes (4 or more)', () => {
    // Note that this does not result in a horizontal divider token because
    // horizontal divider markers must be at the start of a line.
    const tokens = tokenize('<!------- comment -->');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.COMMENT_BEGIN),
        et(TokenType.DASHES, '-----'),
        et(TokenType.TEXT, ' comment '),
        et(TokenType.COMMENT_END)
      ])
    ).toBeTruthy();
  });

  test('comment where end token has extra dashes', () => {
    const tokens = tokenize('<!-- comment ----->');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.COMMENT_BEGIN),
        et(TokenType.TEXT, ' comment '),
        et(TokenType.DASHES, '---'),
        et(TokenType.COMMENT_END)
      ])
    ).toBeTruthy();
  });

  test('multi line comment where final line starts with a horizontal divider token', () => {
    const tokens = tokenize('<!-- line one\n---->');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.COMMENT_BEGIN),
        et(TokenType.TEXT, ' line one'),
        et(TokenType.EOL),
        et(TokenType.DASHES, '--'),
        et(TokenType.COMMENT_END)
      ])
    ).toBeTruthy();
  });

  test('comment with invalid start marker', () => {
    const tokens = tokenize('<!- comment -->');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEXT, '<!- comment '),
        et(TokenType.COMMENT_END)
      ])
    ).toBeTruthy();
  });

  test('comment with invalid end marker', () => {
    const tokens = tokenize('<!-- comment ->');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.COMMENT_BEGIN),
        et(TokenType.TEXT, ' comment '),
        et(TokenType.DASHES, '-'),
        et(TokenType.CLOSE_TAG)
      ])
    ).toBeTruthy();
  });
});

///////////////////

describe('horizontal dividers', () => {
  test('basic horizontal divider', () => {
    const tokens = tokenize('----');

    expect(
      verifyTokenSequence(tokens, [et(TokenType.DASHES, '----')])
    ).toBeTruthy();
  });

  test('horizontal divider with extra dashes', () => {
    const tokens = tokenize('---------');

    expect(
      verifyTokenSequence(tokens, [et(TokenType.DASHES, '---------')])
    ).toBeTruthy();
  });

  test('horizontal divider marker that is not at the beginning of a line', () => {
    const tokens = tokenize('a----');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEXT, 'a'),
        et(TokenType.DASHES, '----')
      ])
    ).toBeTruthy();
  });

  test('horizontal divider followed by text', () => {
    const tokens = tokenize('----text');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.DASHES, '----'),
        et(TokenType.TEXT, 'text')
      ])
    ).toBeTruthy();
  });

  test('invalid horizontal divider', () => {
    const tokens = tokenize('---');

    expect(
      verifyTokenSequence(tokens, [et(TokenType.DASHES, '---')])
    ).toBeTruthy();
  });
});

///////////////////

describe('templates', () => {
  test('basic template', () => {
    const tokens = tokenize('{{name}}');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEMPLATE_BEGIN),
        et(TokenType.TEXT, 'name'),
        et(TokenType.TEMPLATE_END)
      ])
    ).toBeTruthy();
  });

  test('empty template', () => {
    const tokens = tokenize('{{}}');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEMPLATE_BEGIN),
        et(TokenType.TEMPLATE_END)
      ])
    ).toBeTruthy();
  });

  test('template with parameters', () => {
    const tokens = tokenize('{{name|param1|param2}}');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEMPLATE_BEGIN),
        et(TokenType.TEXT, 'name'),
        et(TokenType.PIPE),
        et(TokenType.TEXT, 'param1'),
        et(TokenType.PIPE),
        et(TokenType.TEXT, 'param2'),
        et(TokenType.TEMPLATE_END)
      ])
    ).toBeTruthy();
  });

  test('template with namespace', () => {
    const tokens = tokenize('{{ns:name}}');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEMPLATE_BEGIN),
        et(TokenType.TEXT, 'ns'),
        et(TokenType.COLON),
        et(TokenType.TEXT, 'name'),
        et(TokenType.TEMPLATE_END)
      ])
    ).toBeTruthy();
  });

  test('nested template', () => {
    // This might not be valid wikitext. The parser should detect it.
    const tokens = tokenize('{{{{}}}}');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEMPLATE_BEGIN),
        et(TokenType.TEMPLATE_BEGIN),
        et(TokenType.TEMPLATE_END),
        et(TokenType.TEMPLATE_END)
      ])
    ).toBeTruthy();
  });

  test('invalid template start', () => {
    const tokens = tokenize('{name}}');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEXT, '{name'),
        et(TokenType.TEMPLATE_END)
      ])
    ).toBeTruthy();
  });

  test('invalid template end', () => {
    const tokens = tokenize('{{name}');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TEMPLATE_BEGIN),
        et(TokenType.TEXT, 'name}')
      ])
    ).toBeTruthy();
  });
});

///////////////////

describe('tables', () => {
  test('empty table', () => {
    const tokens = tokenize('{|\n|}');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TABLE_BEGIN),
        et(TokenType.EOL),
        et(TokenType.TABLE_END)
      ])
    ).toBeTruthy();
  });

  test('table with 1 cell', () => {
    const tokens = tokenize('{|\n|a\n|}');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TABLE_BEGIN),
        et(TokenType.EOL),
        et(TokenType.PIPE),
        et(TokenType.TEXT, 'a'),
        et(TokenType.EOL),
        et(TokenType.TABLE_END)
      ])
    ).toBeTruthy();
  });

  test('table with 1 row and 1 cell', () => {
    const tokens = tokenize('{|\n|-\n| a\n|}');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TABLE_BEGIN),
        et(TokenType.EOL),
        et(TokenType.TABLE_ROW),
        et(TokenType.EOL),
        et(TokenType.PIPE),
        et(TokenType.TEXT, ' a'),
        et(TokenType.EOL),
        et(TokenType.TABLE_END)
      ])
    ).toBeTruthy();
  });

  test('table with 1 row and 2 cells', () => {
    const tokens = tokenize('{|\n|-\n| a\n| b\n|}');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TABLE_BEGIN),
        et(TokenType.EOL),
        et(TokenType.TABLE_ROW),
        et(TokenType.EOL),
        et(TokenType.PIPE),
        et(TokenType.TEXT, ' a'),
        et(TokenType.EOL),
        et(TokenType.PIPE),
        et(TokenType.TEXT, ' b'),
        et(TokenType.EOL),
        et(TokenType.TABLE_END)
      ])
    ).toBeTruthy();
  });

  test('table with 2 rows and 1 cell', () => {
    const tokens = tokenize('{|\n|-\n| a\n|-\n| b\n|}');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TABLE_BEGIN),
        et(TokenType.EOL),
        et(TokenType.TABLE_ROW),
        et(TokenType.EOL),
        et(TokenType.PIPE),
        et(TokenType.TEXT, ' a'),
        et(TokenType.EOL),
        et(TokenType.TABLE_ROW),
        et(TokenType.EOL),
        et(TokenType.PIPE),
        et(TokenType.TEXT, ' b'),
        et(TokenType.EOL),
        et(TokenType.TABLE_END)
      ])
    ).toBeTruthy();
  });

  test('degenerate table with 1 row and no cell', () => {
    const tokens = tokenize('{|\n|-\n|}');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TABLE_BEGIN),
        et(TokenType.EOL),
        et(TokenType.TABLE_ROW),
        et(TokenType.EOL),
        et(TokenType.TABLE_END)
      ])
    ).toBeTruthy();
  });

  test('table with 1 cell and caption', () => {
    const tokens = tokenize('{|\n|+caption\n|a\n|}');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TABLE_BEGIN),
        et(TokenType.EOL),
        et(TokenType.TABLE_CAPTION),
        et(TokenType.TEXT, 'caption'),
        et(TokenType.EOL),
        et(TokenType.PIPE),
        et(TokenType.TEXT, 'a'),
        et(TokenType.EOL),
        et(TokenType.TABLE_END)
      ])
    ).toBeTruthy();
  });

  test('table with 1 cell and header', () => {
    const tokens = tokenize('{|\n!A\n|a\n|}');

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TABLE_BEGIN),
        et(TokenType.EOL),
        et(TokenType.EXCLAMATION_MARK),
        et(TokenType.TEXT, 'A'),
        et(TokenType.EOL),
        et(TokenType.PIPE),
        et(TokenType.TEXT, 'a'),
        et(TokenType.EOL),
        et(TokenType.TABLE_END)
      ])
    ).toBeTruthy();
  });

  test('table with 2 rows, 2 cell, caption and headers', () => {
    const tokens = tokenize(
      '{|\n|+caption\n!A\n!B\n|-\n|a1\n|a2\n|-\n|b1\n|b2\n|}'
    );

    expect(
      verifyTokenSequence(tokens, [
        et(TokenType.TABLE_BEGIN),
        et(TokenType.EOL),
        et(TokenType.TABLE_CAPTION),
        et(TokenType.TEXT, 'caption'),
        et(TokenType.EOL),
        et(TokenType.EXCLAMATION_MARK),
        et(TokenType.TEXT, 'A'),
        et(TokenType.EOL),
        et(TokenType.EXCLAMATION_MARK),
        et(TokenType.TEXT, 'B'),
        et(TokenType.EOL),
        et(TokenType.TABLE_ROW),
        et(TokenType.EOL),
        et(TokenType.PIPE),
        et(TokenType.TEXT, 'a1'),
        et(TokenType.EOL),
        et(TokenType.PIPE),
        et(TokenType.TEXT, 'a2'),
        et(TokenType.EOL),
        et(TokenType.TABLE_ROW),
        et(TokenType.EOL),
        et(TokenType.PIPE),
        et(TokenType.TEXT, 'b1'),
        et(TokenType.EOL),
        et(TokenType.PIPE),
        et(TokenType.TEXT, 'b2'),
        et(TokenType.EOL),
        et(TokenType.TABLE_END)
      ])
    ).toBeTruthy();
  });
});

/* eslint-enable quotes */
