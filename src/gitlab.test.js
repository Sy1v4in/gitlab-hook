const gitlab = require('./gitlab')

describe('gitlab', () => {
  it('should find mentioned usernames in a comment', () => {
    const comment = `hey @abc, please review this
@def
@ghi,@jkl, @mno: any remark?
and @pqr?`

    const mentionedUsernames = gitlab.getMentionedUsernames(comment)

    const expectedMentionedUsernames = [
      'abc',
      'def',
      'ghi',
      'jkl',
      'mno',
      'pqr'
    ]

    expect(mentionedUsernames).toEqual(expectedMentionedUsernames)
  })
})
