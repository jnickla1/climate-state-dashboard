# Translating the climate state dashboard

The dashboard is written in British English (`en-GB`). Each other language is a single JSON file in this folder. No programming is needed.

## Add a language

1. Copy `en-GB.json` to a new file named with the language's [BCP 47 code](https://www.w3.org/International/articles/language-tags/), for example `fr.json`, `es.json`, `pt-BR.json` or `zh-Hans.json`.
2. In `_meta`, set:
   - `name`: the language's own name, for example `Français`;
   - `dir`: `rtl` for right-to-left scripts, otherwise `ltr`;
   - `version`: a new value each time you change the file, so browsers fetch the update.
   
   Delete `notes` and `_generated_page_keys`.
3. Translate the values in `strings`. Leave the keys on the left unchanged. A key you delete or leave untranslated falls back to English, so a partial translation still works.
4. Run `python3 source/build_i18n.py` from the `climate-dashboard` folder. It registers the new file in `locales.js` and reports, for each language:
   - how many strings are still in English;
   - any unknown keys;
   - any placeholder mismatches.
5. Check the page with `?lang=fr` (your code) added to the address. Once a second language is registered, a language menu appears in the header. Visitors' browser languages are matched automatically, and their choice is remembered.

## Rules for the strings

- **`{name}` placeholders** (for example `{year}`, `{method}`, `{threshold}`) are filled in by the page. Keep every placeholder, but you may move it, since word order differs between languages.
- **`%{x}`, `%{y:.3f}` and `<extra></extra>`-style codes** belong to the chart library. Copy them exactly.
- **HTML tags** such as `<strong>`, `<em>`, `<code>`, `<b>` and `<span class="unit">` should be kept around the corresponding words.
- **Numbers inside sentences** are formatted for your language automatically, with the right decimal comma or point. Don't write numbers into placeholders yourself.
- **IPCC likelihood terms** (`likelihood.*`, such as "Very unlikely") are calibrated language. Use the IPCC's official translations of the AR6 likelihood scale where they exist.
- **Method names** such as PIVW, CSCM, CGWL, GAM, FaIR and GWI are proper names. Usually leave them as they are.
- **`dataset.*` keys** are text that comes with the data: method names, method notes, full names and the warming definitions. Translate them as for the other keys; the English values are refreshed from the data each time the build runs.

## What stays in English

- The 96 static figure images (Figure view and PNG/PDF downloads) are drawn by Python with English labels.
- The comment lines at the top of the CSV downloads, the JSON metadata and the titles of cited papers.
- The right-to-left layout is supported in principle (`dir: rtl`) but has not been tested.

## For maintainers

Page text lives in `index.html`. Elements marked `data-i18n="key"` (their inner HTML) and `data-i18n-attr="attribute:key"` supply the English strings. `build_i18n.py` copies these into `en-GB.json`, so after editing page text, rerun the build. Text set by the scripts uses `I18N.t('key', {placeholder: value})`; add those keys to `en-GB.json` by hand. The build fails if a script uses a key that `en-GB.json` lacks.
