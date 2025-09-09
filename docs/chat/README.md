ChatGPT Chat History in VS Code (Markdown)

Steps
- Export from ChatGPT Web: Settings → Data Controls → Export → download the ZIP and extract `conversations.json`.
- Place `conversations.json` somewhere accessible (e.g. project root or Downloads).
- Convert to Markdown:

  PowerShell
  - `python scripts/convert_chatgpt_export.py --input "C:\\path\\to\\conversations.json" --out docs/chat`

  Bash
  - `python3 scripts/convert_chatgpt_export.py --input ~/Downloads/conversations.json --out docs/chat`

- Use with Continue/Copilot Chat:
  - In Continue, reference a file as context with `@file docs/chat/<your-file>.md`.
  - In other chat extensions, attach the `.md` file or paste relevant sections.

Notes
- The converter handles common export formats and orders messages by `create_time` when available.
- Filenames are sanitized and deduplicated if collisions happen.
