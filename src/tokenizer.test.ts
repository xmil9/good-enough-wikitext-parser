//
// Tests for Tokenizer.
//

import { Token, TokenType } from './token';
import { tokenize } from './tokenizer';

/* eslint-disable quotes */

///////////////////

function verifyToken(token: Token, type: TokenType, value?: string): boolean {
  return (
    token !== undefined &&
    token.type === type &&
    (value === undefined || token.value === value)
  );
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
    const tokens: TokenIterator = new TokenIterator(tokenize('plain text'));

    expect(
      verifyToken(tokens.next(), TokenType.TEXT, 'plain text')
    ).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('text with newline', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('before\nafter'));

    expect(verifyToken(tokens.next(), TokenType.TEXT, 'before')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'after')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });
});

///////////////////

describe('quotes', () => {
  test('bold text', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize("'''bold'''"));

    expect(verifyToken(tokens.next(), TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'bold')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.BOLD)).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('embedded bold text', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize("before'''bold'''after")
    );

    expect(verifyToken(tokens.next(), TokenType.TEXT, 'before')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'bold')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'after')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('italic text', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize("''italic''"));

    expect(verifyToken(tokens.next(), TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'italic')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.ITALIC)).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('embedded italic text', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize("before''italic''after")
    );

    expect(verifyToken(tokens.next(), TokenType.TEXT, 'before')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'italic')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'after')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('four quotes', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize("''''four''''"));

    expect(verifyToken(tokens.next(), TokenType.TEXT, "'")).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, "four'")).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.BOLD)).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('four quotes embedded', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize("before''''four''''after")
    );

    expect(verifyToken(tokens.next(), TokenType.TEXT, "before'")).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, "four'")).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'after')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('five quotes', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize("'''''five'''''"));

    expect(verifyToken(tokens.next(), TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'five')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.ITALIC)).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('five quotes embedded', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize("before'''''five'''''after")
    );

    expect(verifyToken(tokens.next(), TokenType.TEXT, 'before')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'five')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'after')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('more than five quotes', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize("'''''''''nine'''''''''")
    );

    expect(verifyToken(tokens.next(), TokenType.TEXT, "''''")).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, "nine''''")).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.ITALIC)).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('more than five quotes embedded', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize("before'''''''''nine'''''''''after")
    );

    expect(
      verifyToken(tokens.next(), TokenType.TEXT, "before''''")
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, "nine''''")).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'after')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });
});

///////////////////

describe('Html tags', () => {
  test('HTML start tag', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('<code>'));

    expect(
      verifyToken(tokens.next(), TokenType.OPEN_START_TAG, '<')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TAG_NAME, 'code')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('extension start tag', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('<inputbox>'));

    expect(
      verifyToken(tokens.next(), TokenType.OPEN_START_TAG, '<')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TAG_NAME, 'inputbox')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('single letter start tag', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('<p>'));

    expect(
      verifyToken(tokens.next(), TokenType.OPEN_START_TAG, '<')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TAG_NAME, 'p')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('start tag with space', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('<math chem>'));

    expect(
      verifyToken(tokens.next(), TokenType.OPEN_START_TAG, '<')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TAG_NAME, 'math chem')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('capitalized start tag', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('<DIV>'));

    expect(
      verifyToken(tokens.next(), TokenType.OPEN_START_TAG, '<')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TAG_NAME, 'div')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('start tag with leading and trainling spaces', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('<  table  >'));

    expect(
      verifyToken(tokens.next(), TokenType.OPEN_START_TAG, '<')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TAG_NAME, 'table')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('start tag embedded in text', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize('before<h2>after')
    );

    expect(verifyToken(tokens.next(), TokenType.TEXT, 'before')).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.OPEN_START_TAG, '<')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TAG_NAME, 'h2')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'after')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('invalid start tag', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('<invalid>'));

    expect(verifyToken(tokens.next(), TokenType.TEXT, '<invalid')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('HTML end tag', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('</code>'));

    expect(
      verifyToken(tokens.next(), TokenType.OPEN_END_TAG, '</')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TAG_NAME, 'code')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('extension end tag', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('</inputbox>'));

    expect(
      verifyToken(tokens.next(), TokenType.OPEN_END_TAG, '</')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TAG_NAME, 'inputbox')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('single letter end tag', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('</p>'));

    expect(
      verifyToken(tokens.next(), TokenType.OPEN_END_TAG, '</')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TAG_NAME, 'p')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('start end with space', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('</math chem>'));

    expect(
      verifyToken(tokens.next(), TokenType.OPEN_END_TAG, '</')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TAG_NAME, 'math chem')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('capitalized end tag', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('</DIV>'));

    expect(
      verifyToken(tokens.next(), TokenType.OPEN_END_TAG, '</')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TAG_NAME, 'div')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('end tag with leading and trainling spaces', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('</  table  >'));

    expect(
      verifyToken(tokens.next(), TokenType.OPEN_END_TAG, '</')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TAG_NAME, 'table')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('end tag embedded in text', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize('before</h2>after')
    );

    expect(verifyToken(tokens.next(), TokenType.TEXT, 'before')).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.OPEN_END_TAG, '</')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TAG_NAME, 'h2')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'after')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('invalid end tag', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('</invalid>'));

    expect(
      verifyToken(tokens.next(), TokenType.TEXT, '</invalid')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });
});

///////////////////

describe('comments', () => {
  test('basic comment', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize('<!-- comment -->')
    );

    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TEXT, ' comment ')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_END, '-->')
    ).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('single space comment', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('<!-- -->'));

    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, ' ')).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_END, '-->')
    ).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('empty comment', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('<!---->'));

    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_END, '-->')
    ).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('multi line comment', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize('<!-- line one\nline two -->')
    );

    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TEXT, ' line one')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TEXT, 'line two ')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_END, '-->')
    ).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('comment where start token has extra dashes (less than 4)', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize('<!----- comment -->')
    );

    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.DASHES, '---')).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TEXT, ' comment ')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_END, '-->')
    ).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('comment where start token has extra dashes (4 or more)', () => {
    // Note that this does not result in a horizontal divider token because
    // horizontal divider markers must be at the start of a line.
    const tokens: TokenIterator = new TokenIterator(
      tokenize('<!------- comment -->')
    );

    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.DASHES, '-----')).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TEXT, ' comment ')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_END, '-->')
    ).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('comment where end token has extra dashes', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize('<!-- comment ----->')
    );

    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TEXT, ' comment ')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.DASHES, '---')).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_END, '-->')
    ).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('multi line comment where final line starts with a horizontal divider token', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize('<!-- line one\n---->')
    );

    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TEXT, ' line one')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.DASHES, '--')).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_END, '-->')
    ).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('comment with invalid start marker', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize('<!- comment -->')
    );

    expect(
      verifyToken(tokens.next(), TokenType.TEXT, '<!- comment ')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_END, '-->')
    ).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('comment with invalid end marker', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize('<!-- comment ->')
    );

    expect(
      verifyToken(tokens.next(), TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TEXT, ' comment ')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.DASHES, '-')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });
});

///////////////////

describe('horizontal dividers', () => {
  test('basic horizontal divider', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('----'));

    expect(verifyToken(tokens.next(), TokenType.DASHES, '----')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('horizontal divider with extra dashes', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('---------'));

    expect(
      verifyToken(tokens.next(), TokenType.DASHES, '---------')
    ).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('horizontal divider marker that is not at the beginning of a line', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('a----'));

    expect(verifyToken(tokens.next(), TokenType.TEXT, 'a')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.DASHES, '----')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('horizontal divider followed by text', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('----text'));

    expect(verifyToken(tokens.next(), TokenType.DASHES, '----')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'text')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('invalid horizontal divider', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('---'));

    expect(verifyToken(tokens.next(), TokenType.DASHES, '---')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });
});

///////////////////

describe('templates', () => {
  test('basic template', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('{{name}}'));

    expect(
      verifyToken(tokens.next(), TokenType.TEMPLATE_BEGIN, '{{')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'name')).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TEMPLATE_END, '}}')
    ).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('empty template', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('{{}}'));

    expect(
      verifyToken(tokens.next(), TokenType.TEMPLATE_BEGIN, '{{')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TEMPLATE_END, '}}')
    ).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('template with parameters', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize('{{name|param1|param2}}')
    );

    expect(
      verifyToken(tokens.next(), TokenType.TEMPLATE_BEGIN, '{{')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'name')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.PIPE, '|')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'param1')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.PIPE, '|')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'param2')).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TEMPLATE_END, '}}')
    ).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('template with namespace', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('{{ns:name}}'));

    expect(
      verifyToken(tokens.next(), TokenType.TEMPLATE_BEGIN, '{{')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'ns')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.COLON, ':')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'name')).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TEMPLATE_END, '}}')
    ).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('nested template', () => {
    // This might not be valid wikitext. The parser should detect it.
    const tokens: TokenIterator = new TokenIterator(tokenize('{{{{}}}}'));

    expect(
      verifyToken(tokens.next(), TokenType.TEMPLATE_BEGIN, '{{')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TEMPLATE_BEGIN, '{{')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TEMPLATE_END, '}}')
    ).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TEMPLATE_END, '}}')
    ).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('invalid template start', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('{name}}'));

    expect(verifyToken(tokens.next(), TokenType.TEXT, '{name')).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TEMPLATE_END, '}}')
    ).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('invalid template end', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('{{name}'));

    expect(
      verifyToken(tokens.next(), TokenType.TEMPLATE_BEGIN, '{{')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'name}')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });
});

///////////////////

describe('tables', () => {
  test('empty table', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('{|\n|}'));

    expect(
      verifyToken(tokens.next(), TokenType.TABLE_BEGIN, '{|')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TABLE_END, '|}')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('table with 1 cell', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('{|\n|a\n|}'));

    expect(
      verifyToken(tokens.next(), TokenType.TABLE_BEGIN, '{|')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.PIPE, '|')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'a')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TABLE_END, '|}')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('table with 1 row and 1 cell', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize('{|\n|-\n| a\n|}')
    );

    expect(
      verifyToken(tokens.next(), TokenType.TABLE_BEGIN, '{|')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TABLE_ROW, '|-')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.PIPE, '|')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, ' a')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TABLE_END, '|}')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('table with 1 row and 2 cells', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize('{|\n|-\n| a\n| b\n|}')
    );

    expect(
      verifyToken(tokens.next(), TokenType.TABLE_BEGIN, '{|')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TABLE_ROW, '|-')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.PIPE, '|')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, ' a')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.PIPE, '|')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, ' b')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TABLE_END, '|}')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('table with 2 rows and 1 cell', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize('{|\n|-\n| a\n|-\n| b\n|}')
    );

    expect(
      verifyToken(tokens.next(), TokenType.TABLE_BEGIN, '{|')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TABLE_ROW, '|-')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.PIPE, '|')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, ' a')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TABLE_ROW, '|-')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.PIPE, '|')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, ' b')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TABLE_END, '|}')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('degenerate table with 1 row and no cell', () => {
    const tokens: TokenIterator = new TokenIterator(tokenize('{|\n|-\n|}'));

    expect(
      verifyToken(tokens.next(), TokenType.TABLE_BEGIN, '{|')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TABLE_ROW, '|-')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TABLE_END, '|}')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });

  test('table with 1 cell and caption', () => {
    const tokens: TokenIterator = new TokenIterator(
      tokenize('{|\n|+caption\n|a\n|}')
    );

    expect(
      verifyToken(tokens.next(), TokenType.TABLE_BEGIN, '{|')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(
      verifyToken(tokens.next(), TokenType.TABLE_CAPTION, '|+')
    ).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'caption')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.PIPE, '|')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TEXT, 'a')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.EOL, '\n')).toBeTruthy();
    expect(verifyToken(tokens.next(), TokenType.TABLE_END, '|}')).toBeTruthy();
    expect(tokens.next()).toBeUndefined();
  });
});

/* eslint-enable quotes */
