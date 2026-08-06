## 1. Remove the dependency

^- [x] 1.1 Run `npm uninstall --save-dev playwright` and verify `package.json` and `package-lock.json` no longer reference it

## 2. Verify

^- [x] 2.1 `npm install` is clean (lockfile consistent)
^- [x] 2.2 Run `npm test` — all tests pass
