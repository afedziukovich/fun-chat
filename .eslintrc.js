module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'unicorn'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:unicorn/recommended'
  ],
  env: {
    browser: true,
    es2020: true
  },
  rules: {
    'no-console': 'warn',
    'unicorn/filename-case': [
      'error',
      {
        cases: {
          kebabCase: true,
          pascalCase: true
        }
      }
    ],
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/no-null': 'off',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error'
  },
  overrides: [
    {
      files: ['*.ts'],
      rules: {
        'unicorn/filename-case': [
          'error',
          {
            cases: {
              camelCase: true,
              pascalCase: true
            }
          }
        ]
      }
    }
  ]
};
