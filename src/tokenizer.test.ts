import { Token, tokenize, TokenType } from './tokenizer';

/* eslint-disable quotes */

///////////////////

function verifyToken(token: Token, type: TokenType, value?: string): boolean {
  return (
    token !== undefined &&
    token.type === type &&
    (value === undefined || token.value === value)
  );
}

///////////////////

describe('text', () => {
  test('plain text', () => {
    const tokens: Token[] = tokenize('plain text');

    expect(tokens.length).toBe(1);
    expect(verifyToken(tokens[0], TokenType.TEXT, 'plain text')).toBeTruthy();
  });

  test('text with newline', () => {
    const tokens: Token[] = tokenize('before\nafter');

    expect(tokens.length).toBe(1);
    expect(
      verifyToken(tokens[0], TokenType.TEXT, 'before\nafter')
    ).toBeTruthy();
  });
});

///////////////////

describe('quotes', () => {
  test('bold text', () => {
    const tokens: Token[] = tokenize("'''bold'''");

    expect(tokens.length).toBe(3);
    expect(verifyToken(tokens[0], TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TEXT, 'bold')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.BOLD)).toBeTruthy();
  });

  test('embedded bold text', () => {
    const tokens: Token[] = tokenize("before'''bold'''after");

    expect(tokens.length).toBe(5);
    expect(verifyToken(tokens[0], TokenType.TEXT, 'before')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.TEXT, 'bold')).toBeTruthy();
    expect(verifyToken(tokens[3], TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens[4], TokenType.TEXT, 'after')).toBeTruthy();
  });

  test('italic text', () => {
    const tokens: Token[] = tokenize("''italic''");

    expect(tokens.length).toBe(3);
    expect(verifyToken(tokens[0], TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TEXT, 'italic')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.ITALIC)).toBeTruthy();
  });

  test('embedded italic text', () => {
    const tokens: Token[] = tokenize("before''italic''after");

    expect(tokens.length).toBe(5);
    expect(verifyToken(tokens[0], TokenType.TEXT, 'before')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.TEXT, 'italic')).toBeTruthy();
    expect(verifyToken(tokens[3], TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens[4], TokenType.TEXT, 'after')).toBeTruthy();
  });

  test('four quotes', () => {
    const tokens: Token[] = tokenize("''''four''''");

    expect(tokens.length).toBe(4);
    expect(verifyToken(tokens[0], TokenType.TEXT, "'")).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.TEXT, "four'")).toBeTruthy();
    expect(verifyToken(tokens[3], TokenType.BOLD)).toBeTruthy();
  });

  test('four quotes embedded', () => {
    const tokens: Token[] = tokenize("before''''four''''after");

    expect(tokens.length).toBe(5);
    expect(verifyToken(tokens[0], TokenType.TEXT, "before'")).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.TEXT, "four'")).toBeTruthy();
    expect(verifyToken(tokens[3], TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens[4], TokenType.TEXT, 'after')).toBeTruthy();
  });

  test('five quotes', () => {
    const tokens: Token[] = tokenize("'''''five'''''");

    expect(tokens.length).toBe(5);
    expect(verifyToken(tokens[0], TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.TEXT, 'five')).toBeTruthy();
    expect(verifyToken(tokens[3], TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens[4], TokenType.ITALIC)).toBeTruthy();
  });

  test('five quotes embedded', () => {
    const tokens: Token[] = tokenize("before'''''five'''''after");

    expect(tokens.length).toBe(7);
    expect(verifyToken(tokens[0], TokenType.TEXT, 'before')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens[3], TokenType.TEXT, 'five')).toBeTruthy();
    expect(verifyToken(tokens[4], TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens[5], TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens[6], TokenType.TEXT, 'after')).toBeTruthy();
  });

  test('more than five quotes', () => {
    const tokens: Token[] = tokenize("'''''''''nine'''''''''");

    expect(tokens.length).toBe(6);
    expect(verifyToken(tokens[0], TokenType.TEXT, "''''")).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens[3], TokenType.TEXT, "nine''''")).toBeTruthy();
    expect(verifyToken(tokens[4], TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens[5], TokenType.ITALIC)).toBeTruthy();
  });

  test('more than five quotes embedded', () => {
    const tokens: Token[] = tokenize("before'''''''''nine'''''''''after");

    expect(tokens.length).toBe(7);
    expect(verifyToken(tokens[0], TokenType.TEXT, "before''''")).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens[3], TokenType.TEXT, "nine''''")).toBeTruthy();
    expect(verifyToken(tokens[4], TokenType.BOLD)).toBeTruthy();
    expect(verifyToken(tokens[5], TokenType.ITALIC)).toBeTruthy();
    expect(verifyToken(tokens[6], TokenType.TEXT, 'after')).toBeTruthy();
  });
});

///////////////////

describe('Html tags', () => {
  test('HTML start tag', () => {
    const tokens: Token[] = tokenize('<code>');

    expect(tokens.length).toBe(3);
    expect(verifyToken(tokens[0], TokenType.OPEN_START_TAG, '<')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TAG_NAME, 'code')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.CLOSE_TAG, '>')).toBeTruthy();
  });

  test('extension start tag', () => {
    const tokens: Token[] = tokenize('<inputbox>');

    expect(tokens.length).toBe(3);
    expect(verifyToken(tokens[0], TokenType.OPEN_START_TAG, '<')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TAG_NAME, 'inputbox')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.CLOSE_TAG, '>')).toBeTruthy();
  });

  test('single letter start tag', () => {
    const tokens: Token[] = tokenize('<p>');

    expect(tokens.length).toBe(3);
    expect(verifyToken(tokens[0], TokenType.OPEN_START_TAG, '<')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TAG_NAME, 'p')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.CLOSE_TAG, '>')).toBeTruthy();
  });

  test('start tag with space', () => {
    const tokens: Token[] = tokenize('<math chem>');

    expect(tokens.length).toBe(3);
    expect(verifyToken(tokens[0], TokenType.OPEN_START_TAG, '<')).toBeTruthy();
    expect(
      verifyToken(tokens[1], TokenType.TAG_NAME, 'math chem')
    ).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.CLOSE_TAG, '>')).toBeTruthy();
  });

  test('capitalized start tag', () => {
    const tokens: Token[] = tokenize('<DIV>');

    expect(tokens.length).toBe(3);
    expect(verifyToken(tokens[0], TokenType.OPEN_START_TAG, '<')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TAG_NAME, 'div')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.CLOSE_TAG, '>')).toBeTruthy();
  });

  test('start tag with leading and trainling spaces', () => {
    const tokens: Token[] = tokenize('<  table  >');

    expect(tokens.length).toBe(3);
    expect(verifyToken(tokens[0], TokenType.OPEN_START_TAG, '<')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TAG_NAME, 'table')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.CLOSE_TAG, '>')).toBeTruthy();
  });

  test('start tag embedded in text', () => {
    const tokens: Token[] = tokenize('before<h2>after');

    expect(tokens.length).toBe(5);
    expect(verifyToken(tokens[0], TokenType.TEXT, 'before')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.OPEN_START_TAG, '<')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.TAG_NAME, 'h2')).toBeTruthy();
    expect(verifyToken(tokens[3], TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(verifyToken(tokens[4], TokenType.TEXT, 'after')).toBeTruthy();
  });

  test('invalid start tag', () => {
    const tokens: Token[] = tokenize('<invalid>');

    expect(tokens.length).toBe(2);
    expect(verifyToken(tokens[0], TokenType.TEXT, '<invalid')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.CLOSE_TAG, '>')).toBeTruthy();
  });

  test('HTML end tag', () => {
    const tokens: Token[] = tokenize('</code>');

    expect(tokens.length).toBe(3);
    expect(verifyToken(tokens[0], TokenType.OPEN_END_TAG, '</')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TAG_NAME, 'code')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.CLOSE_TAG, '>')).toBeTruthy();
  });

  test('extension end tag', () => {
    const tokens: Token[] = tokenize('</inputbox>');

    expect(tokens.length).toBe(3);
    expect(verifyToken(tokens[0], TokenType.OPEN_END_TAG, '</')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TAG_NAME, 'inputbox')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.CLOSE_TAG, '>')).toBeTruthy();
  });

  test('single letter end tag', () => {
    const tokens: Token[] = tokenize('</p>');

    expect(tokens.length).toBe(3);
    expect(verifyToken(tokens[0], TokenType.OPEN_END_TAG, '</')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TAG_NAME, 'p')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.CLOSE_TAG, '>')).toBeTruthy();
  });

  test('start end with space', () => {
    const tokens: Token[] = tokenize('</math chem>');

    expect(tokens.length).toBe(3);
    expect(verifyToken(tokens[0], TokenType.OPEN_END_TAG, '</')).toBeTruthy();
    expect(
      verifyToken(tokens[1], TokenType.TAG_NAME, 'math chem')
    ).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.CLOSE_TAG, '>')).toBeTruthy();
  });

  test('capitalized end tag', () => {
    const tokens: Token[] = tokenize('</DIV>');

    expect(tokens.length).toBe(3);
    expect(verifyToken(tokens[0], TokenType.OPEN_END_TAG, '</')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TAG_NAME, 'div')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.CLOSE_TAG, '>')).toBeTruthy();
  });

  test('end tag with leading and trainling spaces', () => {
    const tokens: Token[] = tokenize('</  table  >');

    expect(tokens.length).toBe(3);
    expect(verifyToken(tokens[0], TokenType.OPEN_END_TAG, '</')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TAG_NAME, 'table')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.CLOSE_TAG, '>')).toBeTruthy();
  });

  test('end tag embedded in text', () => {
    const tokens: Token[] = tokenize('before</h2>after');

    expect(tokens.length).toBe(5);
    expect(verifyToken(tokens[0], TokenType.TEXT, 'before')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.OPEN_END_TAG, '</')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.TAG_NAME, 'h2')).toBeTruthy();
    expect(verifyToken(tokens[3], TokenType.CLOSE_TAG, '>')).toBeTruthy();
    expect(verifyToken(tokens[4], TokenType.TEXT, 'after')).toBeTruthy();
  });

  test('invalid end tag', () => {
    const tokens: Token[] = tokenize('</invalid>');

    expect(tokens.length).toBe(2);
    expect(verifyToken(tokens[0], TokenType.TEXT, '</invalid')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.CLOSE_TAG, '>')).toBeTruthy();
  });
});

///////////////////

describe('comments', () => {
  test('basic comment', () => {
    const tokens: Token[] = tokenize('<!-- comment -->');

    expect(tokens.length).toBe(3);
    expect(
      verifyToken(tokens[0], TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TEXT, ' comment ')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.COMMENT_END, '-->')).toBeTruthy();
  });

  test('single space comment', () => {
    const tokens: Token[] = tokenize('<!-- -->');

    expect(tokens.length).toBe(3);
    expect(
      verifyToken(tokens[0], TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TEXT, ' ')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.COMMENT_END, '-->')).toBeTruthy();
  });

  test('empty comment', () => {
    const tokens: Token[] = tokenize('<!---->');

    expect(tokens.length).toBe(2);
    expect(
      verifyToken(tokens[0], TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.COMMENT_END, '-->')).toBeTruthy();
  });

  test('multi line comment', () => {
    const tokens: Token[] = tokenize('<!-- line one\nline two -->');

    expect(tokens.length).toBe(3);
    expect(
      verifyToken(tokens[0], TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(
      verifyToken(tokens[1], TokenType.TEXT, ' line one\nline two ')
    ).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.COMMENT_END, '-->')).toBeTruthy();
  });

  test('comment where start token has extra dashes (less than 4)', () => {
    const tokens: Token[] = tokenize('<!----- comment -->');

    expect(tokens.length).toBe(3);
    expect(
      verifyToken(tokens[0], TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TEXT, '--- comment ')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.COMMENT_END, '-->')).toBeTruthy();
  });

  test('comment where start token has extra dashes (4 or more)', () => {
    // Note that this does not result in a horizontal divider token because
    // horizontal divider markers must be at the start of a line.
    const tokens: Token[] = tokenize('<!------- comment -->');

    expect(tokens.length).toBe(3);
    expect(
      verifyToken(tokens[0], TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(
      verifyToken(tokens[1], TokenType.TEXT, '----- comment ')
    ).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.COMMENT_END, '-->')).toBeTruthy();
  });

  test('comment where end token has extra dashes', () => {
    const tokens: Token[] = tokenize('<!-- comment ----->');

    expect(tokens.length).toBe(3);
    expect(
      verifyToken(tokens[0], TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TEXT, ' comment ---')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.COMMENT_END, '-->')).toBeTruthy();
  });

  test('multi line comment where final line starts with a horizontal divider token - LIMITATION', () => {
    // This is incorrect! The correct token sequence should be:
    // COMMENT_BEGIN TEXT COMMENT_END
    // But without making the tokenizer context aware this is not possible.

    const tokens: Token[] = tokenize('<!-- line one\n---->');

    expect(tokens.length).toBe(4);
    expect(
      verifyToken(tokens[0], TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TEXT, ' line one\n')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.HORZ_DIVIDER, '----')).toBeTruthy();
    expect(verifyToken(tokens[3], TokenType.TEXT, '>')).toBeTruthy();
  });

  test('comment with invalid start marker', () => {
    const tokens: Token[] = tokenize('<!- comment -->');

    expect(tokens.length).toBe(2);
    expect(verifyToken(tokens[0], TokenType.TEXT, '<!- comment ')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.COMMENT_END, '-->')).toBeTruthy();
  });

  test('comment with invalid end marker', () => {
    const tokens: Token[] = tokenize('<!-- comment ->');

    expect(tokens.length).toBe(2);
    expect(
      verifyToken(tokens[0], TokenType.COMMENT_BEGIN, '<!--')
    ).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TEXT, ' comment ->')).toBeTruthy();
  });
});

///////////////////

describe('horizontal dividers', () => {
  test('basic horizontal divider', () => {
    const tokens: Token[] = tokenize('----');

    expect(tokens.length).toBe(1);
    expect(verifyToken(tokens[0], TokenType.HORZ_DIVIDER, '----')).toBeTruthy();
  });

  test('horizontal divider with extra dashes', () => {
    const tokens: Token[] = tokenize('---------');

    expect(tokens.length).toBe(1);
    expect(
      verifyToken(tokens[0], TokenType.HORZ_DIVIDER, '---------')
    ).toBeTruthy();
  });

  test.only('horizontal divider marker that is not at the beginning of a line', () => {
    const tokens: Token[] = tokenize('a----');

    expect(tokens.length).toBe(1);
    expect(verifyToken(tokens[0], TokenType.TEXT, 'a----')).toBeTruthy();
  });

  test.only('horizontal divider followed by text', () => {
    const tokens: Token[] = tokenize('----text');

    expect(tokens.length).toBe(2);
    expect(verifyToken(tokens[0], TokenType.HORZ_DIVIDER, '----')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TEXT, 'text')).toBeTruthy();
  });

  test.only('invalid horizontal divider', () => {
    const tokens: Token[] = tokenize('---');

    expect(tokens.length).toBe(1);
    expect(verifyToken(tokens[0], TokenType.TEXT, '---')).toBeTruthy();
  });
});

///////////////////

describe('templates', () => {
  test('basic template', () => {
    const tokens: Token[] = tokenize('{{name}}');

    expect(tokens.length).toBe(3);
    expect(verifyToken(tokens[0], TokenType.TEMPLATE_BEGIN, '{{')).toBeTruthy();
    expect(verifyToken(tokens[0], TokenType.TEXT, 'name')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.TEMPLATE_END, '}}')).toBeTruthy();
  });

  test('empty template', () => {
    const tokens: Token[] = tokenize('{{}}');

    expect(tokens.length).toBe(2);
    expect(verifyToken(tokens[0], TokenType.TEMPLATE_BEGIN, '{{')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TEMPLATE_END, '}}')).toBeTruthy();
  });

  test('template with parameters', () => {
    const tokens: Token[] = tokenize('{{name|param1|param2}}');

    expect(tokens.length).toBe(7);
    expect(verifyToken(tokens[0], TokenType.TEMPLATE_BEGIN, '{{')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TEXT, 'name')).toBeTruthy();
    expect(verifyToken(tokens[2], TokenType.PIPE, '|')).toBeTruthy();
    expect(verifyToken(tokens[3], TokenType.TEXT, 'param1')).toBeTruthy();
    expect(verifyToken(tokens[4], TokenType.PIPE, '|')).toBeTruthy();
    expect(verifyToken(tokens[5], TokenType.TEXT, 'param2')).toBeTruthy();
    expect(verifyToken(tokens[6], TokenType.TEMPLATE_END, '}}')).toBeTruthy();
  });

  test('template with namespace', () => {
    const tokens: Token[] = tokenize('{{ns:name}}');

    // todo
    //expect(tokens.length).toBe(5);
    //expect(verifyToken(tokens[0], TokenType.TEMPLATE_BEGIN, '{{')).toBeTruthy();
    //expect(verifyToken(tokens[1], TokenType.TEXT, 'ns')).toBeTruthy();
    //expect(verifyToken(tokens[2], TokenType.COLON, ':')).toBeTruthy();
    //expect(verifyToken(tokens[3], TokenType.TEXT, 'name')).toBeTruthy();
    //expect(verifyToken(tokens[4], TokenType.TEMPLATE_END, '}}')).toBeTruthy();
  });
});

///////////////////

describe('tables', () => {
  test('empty table', () => {
    const tokens: Token[] = tokenize('{||}');

    expect(tokens.length).toBe(2);
    expect(verifyToken(tokens[0], TokenType.TABLE_END, '{|')).toBeTruthy();
    expect(verifyToken(tokens[1], TokenType.TABLE_END, '|}')).toBeTruthy();
  });
});

/* eslint-enable quotes */
