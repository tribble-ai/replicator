CLI Reference

Extensions
- init: `tribble ext init [dir]`
- validate: `tribble ext validate --manifest <path>`
- plan: `tribble ext plan --manifest <path>`
- test: `tribble ext test --manifest <path>`
- publish (local): `tribble ext publish --manifest <path> --channel <lts|regular|canary>`
- publish (remote): `tribble ext publish --manifest <path> --channel <...> --remote --control-base-url <url> --control-token <token>`
- promote: `tribble ext promote --name <n> --version <v> --from <c> --to <c>`
- freeze: `tribble ext freeze --name <n> --channel <c>`
- migrate: `tribble ext migrate --manifest <path> --rename old=v1:new=v2 [--write]`

Primitives
- upload: `tribble upload --base-url <url> --token <token> --type <pdf|html|text|markdown|json|csv> --file <path> --metadata <json>`

Connectors
- run (pull once): `tribble connectors run --module <path> --since <iso> --base-url <url> --token <token>`

Runner
- run: `tribble runner run --manifest <path> --event <fixture.json> --control-base-url <url> --control-token <token>`

