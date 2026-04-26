# Fonts

Drop the **Cairo** family `.ttf` files here. Recommended weights:

| Weight | Filename |
| --- | --- |
| 400 (Regular) | `Cairo-Regular.ttf` |
| 500 (Medium) | `Cairo-Medium.ttf` |
| 600 (SemiBold) | `Cairo-SemiBold.ttf` |
| 700 (Bold) | `Cairo-Bold.ttf` |
| 800 (ExtraBold) | `Cairo-ExtraBold.ttf` |
| 900 (Black) | `Cairo-Black.ttf` |

Get them from <https://fonts.google.com/specimen/Cairo>.

After adding the files, open `src/core/theme/fonts.ts` and uncomment the
`Font.loadAsync` block — the app will pick up the custom fonts on the next
reload.
